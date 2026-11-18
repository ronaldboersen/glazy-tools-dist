"""Separate LetraTag Bluetooth connection for the standalone Batch Designer."""

import asyncio
import base64
import binascii
import re
import secrets
import struct
import time

from aiohttp import web

SERVICE = 'be3dd650-2b3d-42f1-99c1-f0f749dd0678'
TX = SERVICE.replace('d650', 'd651')
RX = SERVICE.replace('d650', 'd652')
FRAME_SIZE = 180
MAX_COLUMNS = (255 * (FRAME_SIZE - 3) - 28) // 4


def check_frames(frames, columns):
    """Accept only the LetraTag print envelope advertised by the bridge."""
    length = columns * 4 + 28
    header = bytes.fromhex('ff f0 12 34') + struct.pack('<I', length)
    if frames[0] != header + bytes([sum(header) & 255]):
        raise web.HTTPBadRequest(text='Invalid LetraTag print header.')
    body = bytearray()
    for index, frame in enumerate(frames[1:]):
        numbered = index + (index >= 27)
        if len(frame) < 2 or frame[0] != numbered:
            raise web.HTTPBadRequest(text='Invalid LetraTag frame order.')
        last = index == len(frames) - 2
        if last and frame[-2:] != bytes.fromhex('12 34'):
            raise web.HTTPBadRequest(text='Incomplete LetraTag print.')
        body.extend(frame[1:-2] if last else frame[1:])
    prefix = bytes.fromhex('1b 73 9a 02 00 00 1b 23 01 1b 44 81 02')
    suffix = bytes.fromhex('1b 70 30 1b 41 1b 51')
    if len(body) != length or not body.startswith(prefix + struct.pack('<II', columns, 32)) or not body.endswith(suffix):
        raise web.HTTPBadRequest(text='Invalid LetraTag print data.')


class LetraTag:
    def __init__(self, simulate=False):
        self.simulate = simulate
        self.simulated_connection = False
        self.devices = {}
        self.client = None
        self.name = ''
        self.lock = asyncio.Lock()
        self.uploads = {}
        self.job = None
        self.task = None

    @property
    def connected(self):
        return self.simulated_connection or bool(self.client and self.client.is_connected)

    def status(self):
        return dict(connected=self.connected, name=self.name)

    async def scan(self):
        if self.simulate:
            self.devices = {'simulated-letratag': 'Simulated LetraTag'}
            return [dict(id='simulated-letratag', name='Simulated LetraTag')]
        from bleak import BleakScanner

        devices = await BleakScanner.discover(timeout=6, return_adv=True)
        self.devices = {
            device.address: device for device, adv in devices.values()
            if SERVICE in adv.service_uuids
            or re.match(r'^(?:DYMO )?(?:LetraTag|LT-200B)', adv.local_name or device.name or '', re.I)
        }
        return [dict(id=key, name=device.name or 'LetraTag 200B') for key, device in self.devices.items()]

    async def connect(self, device_id):
        device = self.devices.get(device_id)
        if not device:
            raise web.HTTPBadRequest(text='Choose a LetraTag from a fresh scan.')
        await self.disconnect()
        self.uploads.clear()
        if self.simulate:
            self.simulated_connection = True
            self.name = device
        else:
            from bleak import BleakClient

            self.client = BleakClient(device, timeout=8)
            try:
                await self.client.connect()
                if not self.client.services.get_characteristic(TX) or not self.client.services.get_characteristic(RX):
                    raise RuntimeError('The selected device does not expose the LetraTag print service.')
                self.name = device.name or 'LetraTag 200B'
            except Exception:
                await self.disconnect()
                raise
        return self.status()

    async def disconnect(self):
        client, self.client = self.client, None
        self.simulated_connection = False
        if client and client.is_connected:
            await client.disconnect()

    async def dispatch(self, action, payload):
        async with self.lock:
            if action == 'status':
                return self.status()
            if action == 'job':
                if not self.job or self.job['upload'] != payload.get('upload'):
                    raise web.HTTPNotFound(text='Unknown LetraTag print. Check the tape before resuming.')
                return dict(self.job)
            if self.task and not self.task.done():
                raise web.HTTPConflict(text='A LetraTag print is still active.')
            if action == 'scan':
                return dict(devices=await self.scan())
            if action == 'connect':
                return await self.connect(payload.get('id'))
            if action == 'disconnect':
                await self.disconnect()
                self.uploads.clear()
                return self.status()
            if not self.connected:
                raise web.HTTPConflict(text='Reconnect the LetraTag.')
            return self.receive(action, payload)

    def receive(self, action, payload):
        now = time.monotonic()
        self.uploads = {key: item for key, item in self.uploads.items() if now - item['time'] < 300}
        if action == 'begin':
            columns = payload.get('columns')
            if type(columns) is not int or not 30 <= columns <= MAX_COLUMNS:
                raise web.HTTPBadRequest(text='Invalid LetraTag strip length.')
            if len(self.uploads) >= 4:
                raise web.HTTPConflict(text='Too many pending LetraTag uploads. Reconnect the printer.')
            key = secrets.token_urlsafe(24)
            self.uploads[key] = dict(columns=columns, frames=[], size=0, time=now)
            return dict(upload=key)

        key = payload.get('upload')
        item = self.uploads.get(key)
        if item is None:
            raise web.HTTPNotFound(text='The LetraTag upload expired.')
        if action == 'chunk':
            try:
                data = base64.b64decode(payload.get('data', ''), validate=True)
            except (binascii.Error, TypeError, ValueError):
                raise web.HTTPBadRequest(text='Invalid LetraTag frame.')
            frames = item['frames']
            part = payload.get('part')
            if type(part) is not int or part != len(frames) or len(frames) == 256 or not 1 <= len(data) <= FRAME_SIZE:
                raise web.HTTPBadRequest(text='Invalid LetraTag frame size or order.')
            if item['size'] + len(data) > item['columns'] * 4 + 28 + 9 + 255 + 2:
                raise web.HTTPBadRequest(text='LetraTag upload exceeds its declared size.')
            frames.append(data)
            item['size'] += len(data)
            return dict(received=len(frames))
        if action != 'finish':
            raise web.HTTPNotFound(text='Unknown LetraTag command.')
        del self.uploads[key]
        if len(item['frames']) < 2:
            raise web.HTTPBadRequest(text='Incomplete LetraTag upload.')
        check_frames(item['frames'], item['columns'])
        self.job = dict(upload=key, state='sending', progress=0, printStarted=False)
        self.task = asyncio.create_task(self.print_frames(item['frames'], item['columns']))
        return dict(upload=key)

    async def print_frames(self, frames, columns):
        job = self.job
        if self.simulate:
            job.update(state='done', progress=1, code=0, printStarted=True)
            return

        client = self.client
        complete = asyncio.get_running_loop().create_future()

        def on_result(_sender, data):
            if len(data) == 3 and data[:2] == bytes.fromhex('1b 52') and not complete.done():
                complete.set_result(data[2])

        try:
            characteristic = client.services.get_characteristic(TX)
            if any(len(frame) > characteristic.max_write_without_response_size for frame in frames):
                raise RuntimeError('This Bluetooth connection cannot send the LetraTag packet size.')
            await client.start_notify(RX, on_result)
            for index, frame in enumerate(frames):
                if index == len(frames) - 1:
                    job['printStarted'] = True
                await client.write_gatt_char(characteristic, frame, response=False)
                job['progress'] = (index + 1) / len(frames)
                if not job['printStarted']:
                    await asyncio.sleep(.025)
            timeout = max(30, columns / (200 / 25.4) / 3 + 15)
            code = await asyncio.wait_for(complete, timeout)
            await client.stop_notify(RX)
            job.update(state='done', progress=1, code=code)
        except Exception as error:
            job.update(state='error', error=str(error) or 'The LetraTag did not confirm the print.')
            try:
                await self.disconnect()
            except Exception:
                pass

    async def close(self):
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        await self.disconnect()
