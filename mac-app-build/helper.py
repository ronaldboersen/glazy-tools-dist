"""Local-only M110 companion for Safari. CoreBluetooth via Bleak on macOS."""
import argparse
import asyncio
import base64
import json
import secrets
import struct
import sys
import time
import uuid
import zlib
import binascii
from pathlib import Path

from aiohttp import web
from letratag import LetraTag

PORT = 41387
SERVICE = 'rb-m110-mac-helper'
VERSION = '0.1.15'
WRITE_UUID = '0000ff02-0000-1000-8000-00805f9b34fb'
NOTIFY_UUID = '0000ff03-0000-1000-8000-00805f9b34fb'


class SimulatedClient:
    """Explicit developer test mode; never enabled automatically."""
    def __init__(self):
        self.is_connected = False
        self.writes = []
    async def connect(self):
        self.is_connected = True
    async def disconnect(self):
        self.is_connected = False
    async def write_gatt_char(self, char, data, response=True):
        self.writes.append((bytes(data), response))


class Printer:
    def __init__(self, simulate=False, settings_path=None):
        self.simulate = simulate
        self.settings_path = settings_path or Path.home() / 'Library/Application Support/RonaldGlazyLabelPrinter/printer.json'
        self.client = None
        self.char = None
        self.name = ''
        self.address = ''
        self.response = False
        self.without_response = False
        self.can_send_without_response = None
        self.devices = {}
        self.sensors = {}
        self.job = None
        self.task = None
        self.lock = asyncio.Lock()
        self.queue_timeout = 5
        self.maintenance = False
        self.queue_observer = None
        self.queue_signals = 0
        self.max_confirmed_write_bytes = None
        self.queue_observer_error = ""
    @property
    def busy(self):
        return self.task is not None and not self.task.done()
    def status(self):
        return dict(connected=bool(self.client and self.client.is_connected), name=self.name,
                    acknowledged=self.response, withoutResponse=self.without_response, queueReadinessAvailable=bool(self.can_send_without_response), streamingSupported=bool(self.response and self.without_response and self.can_send_without_response), busy=self.busy, sensors=self.sensors, packetSizeTest=True, confirmedPacketSizes=True, maxConfirmedWriteBytes=self.max_confirmed_write_bytes, queueObserverAvailable=bool(self.queue_observer), queueObserverError=self.queue_observer_error, nativeMaxWriteBytes=None if self.simulate or self.char is None else self.char.max_write_without_response_size)
    async def scan(self):
        if self.busy:
            raise web.HTTPConflict(text='Wait for the current label to finish sending.')
        if self.simulate:
            return [dict(id='simulated-m110', name='SIMULATED M110 — no physical printer')]
        from bleak import BleakScanner
        devices = await BleakScanner.discover(timeout=6)
        self.devices = {d.address: d for d in devices}
        return [dict(id=d.address, name=d.name or 'Unnamed Bluetooth device') for d in devices]
    def notification(self, char, data):
        if len(data) < 3 or data[0] != 0x1a:
            return
        if data[1] == 5:
            self.sensors['cover'] = {0x98: 'closed', 0x99: 'open'}.get(data[2], 'unknown')
        if data[1] == 6:
            self.sensors['paper'] = {0x89: 'ok', 0x88: 'out'}.get(data[2], 'unknown')
    async def connect(self, address, name='M110'):
        if self.busy:
            raise web.HTTPConflict(text='Wait for the current label to finish sending.')
        async with self.lock:
            await self.disconnect()
            self.queue_observer_error = ""
            self.queue_signals = 0
            if self.simulate:
                if address != 'simulated-m110':
                    raise web.HTTPBadRequest(text='Unknown simulated printer.')
                self.client = SimulatedClient()
                await self.client.connect()
                self.char = WRITE_UUID
                self.response = True
                self.max_confirmed_write_bytes = 512
                self.without_response = True
                self.can_send_without_response = lambda: True
            else:
                from bleak import BleakClient
                self.client = BleakClient(self.devices.get(address, address), timeout=15)
                try:
                    await asyncio.wait_for(self.client.connect(), timeout=20)
                    self.char = self.client.services.get_characteristic(WRITE_UUID)
                    if self.char is None:
                        raise RuntimeError('The M110 write characteristic was not found. Choose your M110.')
                    self.response = 'write' in self.char.properties
                    self.without_response = 'write-without-response' in self.char.properties
                    # Pinned Bleak 3.0.2: native queue readiness, not a printer acknowledgement.
                    peripheral = getattr(self.client._backend, '_peripheral', None)
                    self.can_send_without_response = getattr(peripheral, 'canSendWriteWithoutResponse', None)
                    from CoreBluetooth import CBCharacteristicWriteWithResponse
                    self.max_confirmed_write_bytes = int(peripheral.maximumWriteValueLengthForType_(CBCharacteristicWriteWithResponse)) if self.response else None
                    try:
                        import queue_monitor
                        loop = asyncio.get_running_loop()
                        connected_client = self.client
                        def ready():
                            def record():
                                if self.client is connected_client:
                                    self.queue_signals += 1
                            loop.call_soon_threadsafe(record)
                        self.queue_observer = queue_monitor.attach(self.client._backend, ready)
                    except Exception as error:
                        self.queue_observer_error = str(error) or type(error).__name__
                    if not self.response and 'write-without-response' not in self.char.properties:
                        raise RuntimeError('This device does not offer the M110 write service.')
                    notify = self.client.services.get_characteristic(NOTIFY_UUID)
                    if notify:
                        try:
                            await self.client.start_notify(notify, self.notification)
                        except Exception:
                            pass
                except Exception:
                    await self.disconnect()
                    raise
            self.address, self.name = address, name
            if not self.simulate:
                self.settings_path.parent.mkdir(parents=True, exist_ok=True)
                self.settings_path.write_text(json.dumps(dict(id=address, name=name)))
            return self.status()
    async def restore(self):
        if self.client and self.client.is_connected:
            return self.status()
        try:
            saved = json.loads(self.settings_path.read_text())
        except (OSError, ValueError):
            return self.status()
        return await self.connect(saved['id'], saved.get('name', 'M110'))
    async def disconnect(self):
        if self.client:
            try:
                await self.client.disconnect()
            finally:
                self.client = None
                self.char = None
                self.sensors = {}
                self.max_confirmed_write_bytes = None
                self.queue_observer = None
    async def abort(self):
        started = bool(self.job and self.job.get('printStarted'))
        if self.busy:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        try:
            await asyncio.wait_for(self.disconnect(), timeout=5)
        except Exception:
            pass
        return dict(stopped=True, printStarted=started, connected=False)
    @staticmethod
    def validate(payload):
        w, h, density = payload.get('widthBytes'), payload.get('height'), payload.get('density')
        if type(w) is not int or not 1 <= w <= 48 or type(h) is not int or not 1 <= h <= 1200:
            raise web.HTTPBadRequest(text='Invalid M110 label dimensions.')
        if type(density) is not int or not 1 <= density <= 15:
            raise web.HTTPBadRequest(text='Density must be between 1 and 15.')
        try:
            raw = base64.b64decode(payload.get('data', ''), validate=True)
        except Exception:
            raise web.HTTPBadRequest(text='Invalid label pixels.')
        if len(raw) != w * h:
            raise web.HTTPBadRequest(text='Label pixels do not match the dimensions.')
        if payload.get('mode', 'auto') not in ('auto', 'steady', 'trial15', 'trial5', 'trial0', 'stream20', 'stream15', 'stream10', 'stream5', 'stream0'):
            raise web.HTTPBadRequest(text='Invalid transfer speed.')
        if type(payload.get('packetBytes', 128)) is not int or payload.get('packetBytes', 128) not in (20, 64, 128, 192, 256):
            raise web.HTTPBadRequest(text='Choose a supported image packet size.')
        return raw, w, h, density
    def start_job(self, payload):
        if self.maintenance:
            raise web.HTTPConflict(text='The helper is updating. Reopen it when the update finishes.')
        raw, w, h, density = self.validate(payload)
        if self.busy:
            raise web.HTTPConflict(text='The printer is already receiving a label.')
        if not self.client or not self.client.is_connected:
            raise web.HTTPBadRequest(text='Connect the M110 first.')
        if self.sensors.get('cover') == 'open' or self.sensors.get('paper') == 'out':
            raise web.HTTPBadRequest(text='Check the printer cover and paper.')
        if payload.get('packetBytes',128) > 128:
            if not self.response or not self.max_confirmed_write_bytes or payload['packetBytes'] > self.max_confirmed_write_bytes or payload.get('mode','auto') not in ('auto','steady'):
                raise web.HTTPBadRequest(text='This confirmed-write packet size is unavailable on the current connection.')
        if payload.get('mode', '').startswith('trial') and not self.response:
            raise web.HTTPBadRequest(text='Speed trials require acknowledged Bluetooth writes.')
        if payload.get('mode', '').startswith('stream') and not self.status()['streamingSupported']:
            raise web.HTTPBadRequest(text='Streaming trials require confirmed setup, write-without-response support and Mac queue readiness.')
        self.job = dict(id=uuid.uuid4().hex, state='sending', percent=0, printStarted=False,
                        acknowledged=self.response, error='', stage='Preparing', queuedBytes=0, chunks=0, requestedPacketBytes=payload.get('packetBytes', 128), queueWaitMs=0, queueChecks=0, queueReadySignals=0, queueObserverAvailable=bool(self.queue_observer), queueObserverError=self.queue_observer_error, maxConfirmedWriteBytes=self.max_confirmed_write_bytes)
        self.task = asyncio.create_task(self.send(raw, w, h, density, payload.get('mode', 'auto'), payload.get('packetBytes', 128)))
        return dict(self.job)
    async def send(self, raw, w, h, density, mode, packet_bytes=128):
        job = self.job
        interval = .025 if self.response and mode != 'steady' else .3
        streaming = mode.startswith('stream')
        data_response = self.response and not streaming
        data_interval = {'trial15': .015, 'trial5': .005, 'trial0': 0, 'stream20': .020, 'stream15': .015, 'stream10': .010, 'stream5': .005, 'stream0': 0}.get(mode, interval) if self.response else interval
        job['streamed'] = streaming
        job['acknowledged'] = data_response
        job['pauseMs'] = round(data_interval * 1000)
        client, char = self.client, self.char
        initial_signals = self.queue_signals
        job['nativeMaxWriteBytes'] = None if self.simulate else char.max_write_without_response_size
        async def queue_ready():
            previous_stage = job['stage']
            wait_started = time.monotonic()
            job['stage'] = 'Waiting for Mac Bluetooth queue capacity'
            # Wait only for Mac queue capacity; no per-chunk ATT response.
            async def wait():
                while True:
                    job['queueChecks'] += 1
                    job['queueReadySignals'] = self.queue_signals - initial_signals
                    job['queueReady'] = bool(self.can_send_without_response())
                    if job['queueReady']:
                        break
                    if not client.is_connected:
                        raise RuntimeError('Printer disconnected while waiting for Mac queue capacity.')
                    await asyncio.sleep(.001)
            try:
                await asyncio.wait_for(wait(), timeout=self.queue_timeout)
            except asyncio.TimeoutError:
                raise RuntimeError(f"Mac Bluetooth queue stayed blocked for {self.queue_timeout} s after {job['queuedBytes']} image bytes. Switch the printer off and on before reconnecting.")
            finally:
                job['queueWaitMs'] += round((time.monotonic() - wait_started) * 1000)
                job['queueReadySignals'] = self.queue_signals - initial_signals
            job['stage'] = previous_stage
        async def write(data, pause=interval, response=None):
            response = self.response if response is None else response
            if streaming and not response:
                await queue_ready()
            await asyncio.wait_for(client.write_gatt_char(char, data, response=response), timeout=30)
            if pause:
                await asyncio.sleep(pause)
        try:
            job['stage'] = 'Confirming setup'
            for command in (bytes([27, 78, 13, 5]), bytes([27, 78, 4, density]), bytes([31, 17, 10])):
                await write(command)
            job['stage'] = 'Confirming raster header'
            job['printStarted'] = True
            await write(bytes([29, 118, 48, 0, w, 0, h & 255, h >> 8]))
            chunk_size = packet_bytes
            if not data_response and not self.simulate:
                chunk_size = min(chunk_size, max(1, char.max_write_without_response_size))
            job['packetBytes'] = chunk_size
            job['stage'] = 'Sending image without acknowledgements' if streaming else 'Sending acknowledged image'
            started = time.monotonic()
            for offset in range(0, len(raw), chunk_size):
                if self.sensors.get('cover') == 'open' or self.sensors.get('paper') == 'out':
                    raise RuntimeError('The printer reports a paper or cover problem.')
                chunk = raw[offset:offset + chunk_size]
                await write(chunk, data_interval, data_response)
                job['queuedBytes'] = offset + len(chunk)
                job['chunks'] += 1
                job['percent'] = round((offset + len(chunk)) / len(raw) * 100)
            job['dataMs'] = round((time.monotonic() - started) * 1000)
            job['stage'] = 'Finishing'
            await asyncio.sleep(.3)
            if streaming:
                await queue_ready()
            await write(bytes([31, 240, 5, 0, 31, 240, 3, 0]))
            await asyncio.sleep(1.5)
            job['queueReadySignals'] = self.queue_signals - initial_signals
            job['state'] = 'sent'
            job['stage'] = 'Sent'
        except asyncio.CancelledError:
            job['state'] = 'error'
            job['stage'] = 'Stopped'
            job['error'] = 'Transfer stopped. Switch the printer off and on to clear any partial image before reconnecting.'
            raise
        except Exception as error:
            job['state'] = 'error'
            job['error'] = str(error) or type(error).__name__
            # Never resume/retry an uncertain image. Explicit physical check first.
            try:
                await self.disconnect()
            except Exception:
                pass


def make_app(printer):
    letratag = LetraTag(simulate=getattr(printer, "simulate", False))
    token = secrets.token_urlsafe(32)
    uploads = {}
    @web.middleware
    async def boundary(request, handler):
        if request.host not in (f'127.0.0.1:{PORT}', f'localhost:{PORT}'):
            raise web.HTTPForbidden(text='Invalid local host.')
        if request.path.startswith('/api/') and request.headers.get('X-RB-Token') != token:
            raise web.HTTPForbidden(text='Open the local helper page first.')
        if request.method != 'GET' and request.headers.get('Origin') not in (f'http://127.0.0.1:{PORT}', f'http://localhost:{PORT}'):
            raise web.HTTPForbidden(text='Only the local helper can submit printer commands.')
        try:
            response = await handler(request)
        except web.HTTPException as error:
            response = web.json_response(dict(error=error.text, printStarted=False), status=error.status)
        except Exception as error:
            response = web.json_response(dict(error=str(error) or type(error).__name__, printStarted=False), status=500)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'none'"
        return response
    app = web.Application(middlewares=[boundary], client_max_size=131072)
    async def index(request):
        html = Path(__file__).with_name('helper.html').read_text()
        return web.Response(text=html.replace('__RB_TOKEN__', json.dumps(token)), content_type='text/html')
    async def batch_designer(request):
        if request.host != f'127.0.0.1:{PORT}':
            return web.Response(status=302, headers={'Location':f'http://127.0.0.1:{PORT}/batch-designer'})
        return web.Response(text=Path(__file__).with_name('batch-designer.html').read_text(), content_type='text/html')
    async def health(request):
        return web.json_response(dict(service=SERVICE, version=VERSION))
    async def dispatch(action, payload):
        if action == 'status':
            result = printer.status()
        elif action == 'scan':
            result = dict(devices=await printer.scan())
        elif action == 'connect':
            result = await printer.connect(payload.get('id'), payload.get('name', 'M110'))
        elif action == 'restore':
            result = await printer.restore()
        elif action == 'disconnect':
            if printer.busy:
                raise web.HTTPConflict(text='A label is still sending.')
            await printer.disconnect()
            result = printer.status()
        elif action == 'abort':
            uploads.clear()
            result = await printer.abort()
        elif action == 'print':
            result = printer.start_job(payload)
        elif action == 'job':
            if not printer.job or printer.job['id'] != payload.get('id'):
                raise web.HTTPNotFound(text='Unknown print job. Check the physical printer before trying again.')
            result = dict(printer.job)
        else:
            raise web.HTTPNotFound(text='Unknown helper command.')
        return result
    async def command(request):
        return web.json_response(await dispatch(request.match_info['action'], await request.json()))
    async def bridge(request):
        # Safari allows local loopback images, while active HTTP fetches from
        # HTTPS pages are blocked. CORS-readable lossless PNGs carry replies.
        # Origin is mandatory even for GET: navigations and foreign sites may
        # not read a token or issue printer commands.
        origin = request.headers.get('Origin')
        if origin not in ('https://glazy.org', f'http://127.0.0.1:{PORT}', 'https://ronaldboersen.github.io'):
            raise web.HTTPForbidden(text='Only Glazy or Ronald’s Batch Designer can use this connection.')
        try:
            action = request.query.get('action', '')
            if action == 'hello':
                result = dict(token=token, version=VERSION, bridge=1, speedTrials=True, streamingTrials=True, abortTransfer=True, packetSizeTest=True, confirmedPacketSizes=True, letratag=True)
            else:
                if not secrets.compare_digest(request.query.get('token', ''), token):
                    raise web.HTTPForbidden(text='Reconnect to the Mac app first.')
                payload = json.loads(request.query.get('data', '{}'))
                if not isinstance(payload, dict):
                    raise web.HTTPBadRequest(text='Invalid helper request.')
                now = time.monotonic()
                for key in list(uploads):
                    if now - uploads[key]['created'] > 300:
                        del uploads[key]
                if action.startswith('letratag-'):
                    result = await letratag.dispatch(action.removeprefix('letratag-'), payload)
                elif action == 'begin':
                    if printer.busy:
                        raise web.HTTPConflict(text='A label is still sending.')
                    w, h = payload.get('widthBytes'), payload.get('height')
                    if type(w) is not int or not 1 <= w <= 48 or type(h) is not int or not 1 <= h <= 1200:
                        raise web.HTTPBadRequest(text='Invalid M110 label dimensions.')
                    printer.validate(payload | dict(data=base64.b64encode(bytes(w*h)).decode()))
                    if len(uploads) >= 4:
                        raise web.HTTPConflict(text='Too many unfinished label uploads. Wait and reconnect.')
                    key = secrets.token_urlsafe(24)
                    uploads[key] = dict(created=now, meta=payload, data=bytearray(), next=0)
                    result = dict(upload=key)
                elif action in ('chunk', 'finish'):
                    key = payload.get('upload')
                    upload = uploads.get(key)
                    if upload is None:
                        raise web.HTTPBadRequest(text='This label upload expired. Start a new preview.')
                    if action == 'chunk':
                        if type(payload.get('part')) is not int or payload['part'] != upload['next']:
                            raise web.HTTPBadRequest(text='Label chunks arrived out of order.')
                        try:
                            raw = base64.b64decode(payload.get('data', ''), validate=True)
                        except Exception:
                            raise web.HTTPBadRequest(text='Invalid label chunk.')
                        expected = upload['meta']['widthBytes'] * upload['meta']['height']
                        if not 1 <= len(raw) <= 1536 or len(upload['data']) + len(raw) > expected:
                            raise web.HTTPBadRequest(text='Label chunk exceeds the expected size.')
                        upload['data'].extend(raw)
                        upload['next'] += 1
                        result = dict(received=len(upload['data']))
                    else:
                        del uploads[key]
                        data = upload['meta'] | dict(data=base64.b64encode(upload['data']).decode())
                        result = printer.start_job(data)
                else:
                    result = await dispatch(action, payload)
        except web.HTTPException as error:
            result = dict(error=error.text, printStarted=False)
        except Exception as error:
            result = dict(error=str(error) or type(error).__name__, printStarted=False)
        response = web.Response(body=reply_png(result), content_type='image/png')
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        return response
    app.router.add_get('/', index)
    app.router.add_get('/health', health)
    app.router.add_get('/batch-designer', batch_designer)
    app.router.add_post('/api/{action}', command)
    app.router.add_get('/bridge.png', bridge)
    async def stop(app):
        await letratag.close()
        if printer.task:
            try:
                await printer.task
            except (Exception, asyncio.CancelledError):
                pass
        await printer.disconnect()
    app.on_cleanup.append(stop)
    return app


def reply_png(value):
    """Encode a bounded UTF-8 JSON reply as opaque, sRGB PNG pixel bytes."""
    data = json.dumps(value, separators=(',', ':'), ensure_ascii=False).encode()
    if len(data) > 65536:
        data = b'{"error":"Helper reply exceeded its size limit","printStarted":false}'
    packet = b'RBP1' + struct.pack('>I', len(data)) + data
    width = 128
    height = (len(packet) + width*3 - 1) // (width*3)
    packet = packet.ljust(width*height*3, b'\0')
    rows = b''.join(b'\0' + packet[y*width*3:(y+1)*width*3] for y in range(height))
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', binascii.crc32(kind+body) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width,height,8,2,0,0,0)) +
            chunk(b'sRGB', b'\0') + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--simulate', action='store_true', help='Developer test mode; no real Bluetooth')
    args = parser.parse_args()
    if sys.platform != 'darwin' and not args.simulate:
        raise SystemExit('This helper is for macOS. Developer tests may use --simulate.')
    print('Ronald’s Mac Label Helper is running. Keep this Terminal window open.')
    print('In Safari, open a Glazy recipe, launch the label bookmarklet, then tap Connect M110.')
    web.run_app(make_app(Printer(simulate=args.simulate)), host='127.0.0.1', port=PORT)


if __name__ == '__main__':
    main()

