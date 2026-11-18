"""Self-contained Cocoa application around the existing local printer bridge."""
import asyncio
import sys
import threading
import traceback
from pathlib import Path

from aiohttp import web
import helper
import updater
import json
import os
import subprocess


class Server:
    def __init__(self, simulate=False):
        self.printer = helper.Printer(simulate=simulate)
        self.loop = None
        self.stop_event = None
        self.ready = threading.Event()
        self.error = ''
    def start(self):
        threading.Thread(target=self.run, name='Local printer bridge', daemon=True).start()
    def run(self):
        try:
            asyncio.run(self.serve())
        except Exception as error:
            self.error = str(error) or type(error).__name__
            traceback.print_exc()
            self.ready.set()
    async def serve(self):
        self.loop = asyncio.get_running_loop()
        self.stop_event = asyncio.Event()
        runner = web.AppRunner(helper.make_app(self.printer))
        await runner.setup()
        try:
            await web.TCPSite(runner, '127.0.0.1', helper.PORT).start()
            self.ready.set()
            await self.stop_event.wait()
        finally:
            await runner.cleanup()
    def stop(self):
        if self.loop and self.stop_event:
            self.loop.call_soon_threadsafe(self.stop_event.set)


async def smoke_test():
    # Exercise bundled dependencies and protocol, without physical Bluetooth.
    import AppKit
    import CoreBluetooth
    from bleak.backends.corebluetooth.client import BleakClientCoreBluetooth
    from bleak.backends.corebluetooth.scanner import BleakScannerCoreBluetooth
    import queue_monitor
    await queue_monitor.native_smoke_test()
    p = helper.Printer(simulate=True)
    await p.connect('simulated-m110')
    client = p.client
    p.start_job(dict(widthBytes=1, height=1, density=10, data='gA==', mode='auto'))
    await p.task
    assert p.job['state'] == 'sent' and p.job['acknowledged']
    assert client.writes[4][0] == b'\x80'
    html = Path(helper.__file__).with_name('helper.html').read_text()
    assert '__RB_TOKEN__' in html
    await p.disconnect()
    print('Bundled Cocoa, CoreBluetooth, bridge assets and acknowledged protocol: PASS')


def main():
    if '--apply-update' in sys.argv:
        try:
            updater.apply(sys.argv[sys.argv.index('--apply-update')+1])
        except Exception as error:
            from AppKit import NSAlert
            alert=NSAlert.alloc().init();alert.setMessageText_('Helper update could not be installed');alert.setInformativeText_(str(error)+' Your existing app was kept.');alert.runModal()
        return
    if '--smoke-update' in sys.argv:
        import tempfile, shutil, plistlib
        current=updater.installed_bundle(sys.executable)
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp);archive=folder/'update.zip'
            subprocess.run(['/usr/bin/ditto','-c','-k','--keepParent',str(current),str(archive)],check=True)
            staged=updater.unpack(archive,folder/'staged')
            subprocess.run(['/usr/bin/codesign','--verify','--deep','--strict',str(staged)],check=True)
            target=folder/'Applications'/updater.APP_NAME;target.parent.mkdir();shutil.copytree(current,target,symlinks=True)
            info=updater.bundle_info(target);info['CFBundleShortVersionString']='0.1.6';(target/'Contents/Info.plist').write_bytes(plistlib.dumps(info))
            updater.replace(target,staged,launch=lambda app: None)
            assert updater.bundle_info(target)['CFBundleShortVersionString']==helper.VERSION
        with updater.fetch(updater.MANIFEST) as response:
            assert json.loads(response.read(65536))['version']
        print('Native ZIP extraction, signature, atomic replacement and bundled-CA HTTPS: PASS')
        return
    if '--smoke-test' in sys.argv:
        asyncio.run(smoke_test())
        return
    from AppKit import (NSApplication, NSApplicationActivationPolicyRegular, NSWindow,
        NSWindowStyleMaskTitled, NSWindowStyleMaskClosable, NSWindowStyleMaskMiniaturizable,
        NSBackingStoreBuffered, NSTextField, NSButton, NSMenu, NSMenuItem, NSAlert,
        NSWorkspace, NSTerminateCancel, NSTerminateNow)
    from Foundation import NSObject, NSTimer, NSURL
    import objc
    smoke_app = '--smoke-app' in sys.argv

    class Delegate(NSObject):
        def applicationDidFinishLaunching_(self, notification):
            self.server = Server(simulate=smoke_app)
            self.window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(
                ((0, 0), (560, 395)), NSWindowStyleMaskTitled | NSWindowStyleMaskClosable |
                NSWindowStyleMaskMiniaturizable, NSBackingStoreBuffered, False)
            self.window.setTitle_('Ronald’s Mac Label Helper')
            self.window.setReleasedWhenClosed_(False)
            self.window.center()
            content = self.window.contentView()
            intro = NSTextField.wrappingLabelWithString_('Keep this app running while printing from Safari. You can hide this window.\n\nOpen a Glazy recipe and launch Ronald’s Glaze Label Printer. Choose your printer, connect and print inside the label tool. Or use Open Batch Designer below for your standalone labels.\n\nDisconnect the printer from your iPhone first.')
            intro.setFrame_(((24, 205), (512, 160)))
            content.addSubview_(intro)
            self.status = NSTextField.wrappingLabelWithString_('Starting the local printer connection…')
            self.status.setFrame_(((24, 175), (512, 28)))
            content.addSubview_(self.status)
            for title, action, x, width in [('Open Glazy', 'openGlazy:', 24, 125),
                                          ('Hide app', 'hideApp:', 165, 220),
                                          ('Quit', 'quit:', 415, 120)]:
                button = NSButton.alloc().initWithFrame_(((x, 12), (width, 32)))
                button.setTitle_(title)
                button.setBezelStyle_(1)
                button.setTarget_(self)
                button.setAction_(action)
                content.addSubview_(button)
            self.batch_button=NSButton.alloc().initWithFrame_(((24, 135), (240, 32)))
            self.batch_button.setTitle_('Open Batch Designer');self.batch_button.setBezelStyle_(1);self.batch_button.setTarget_(self);self.batch_button.setAction_('openBatchDesigner:');self.batch_button.setEnabled_(False);content.addSubview_(self.batch_button)
            self.update_info=NSTextField.wrappingLabelWithString_('Helper v'+helper.VERSION+' · Checking for updates…')
            self.update_info.setFrame_(((24, 85), (512, 36)));content.addSubview_(self.update_info)
            self.update_button=NSButton.alloc().initWithFrame_(((24, 45), (240, 32)))
            self.update_button.setTitle_('Check for updates');self.update_button.setBezelStyle_(1);self.update_button.setTarget_(self);self.update_button.setAction_('updateHelper:');content.addSubview_(self.update_button)
            self.update_entry=None;self.update_task=None;self.update_result=None;self.installing=False
            self.window.makeKeyAndOrderFront_(None)
            NSApplication.sharedApplication().activateIgnoringOtherApps_(True)
            self.server.start()
            if not smoke_app:self.checkUpdates()
            self.timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
                1, self, 'updateStatus:', None, True)

        @objc.python_method
        def checkUpdates(self):
            self.update_result=None;self.update_task='checking'
            def work():
                try:self.update_result=('checked',updater.check(helper.VERSION))
                except Exception as e:self.update_result=('error',str(e))
            threading.Thread(target=work,daemon=True).start()

        def updateHelper_(self, sender):
            if self.server.printer.busy or self.update_task or self.installing:return
            if not self.update_entry:
                self.checkUpdates();return
            self.update_task='downloading';self.update_result=None
            entry=self.update_entry
            def work():
                try:self.update_result=('prepared',updater.prepare(entry))
                except Exception as e:self.update_result=('error',str(e))
            threading.Thread(target=work,daemon=True).start()

        @objc.python_method
        def installPrepared(self, staged):
            async def reserve():
                if self.server.printer.busy:raise RuntimeError('Finish printing before updating.')
                self.server.printer.maintenance=True
            asyncio.run_coroutine_threadsafe(reserve(),self.server.loop).result(timeout=5)
            self.installing=True
            try:
                target=updater.installed_bundle(sys.executable)
                plan=staged.parents[1]/'install-plan.json'
                plan.write_text(json.dumps(dict(target=str(target),staged=str(staged),pid=os.getpid())))
                plan.chmod(0o600)
                worker=staged/'Contents/MacOS/Ronalds Mac Label Helper'
                subprocess.Popen([str(worker),'--apply-update',str(plan)],start_new_session=True)
                NSApplication.sharedApplication().terminate_(None)
            except Exception:
                self.installing=False;self.server.printer.maintenance=False
                raise

        @objc.python_method
        def openSafari(self, url):
            workspace = NSWorkspace.sharedWorkspace()
            safari = workspace.URLForApplicationWithBundleIdentifier_('com.apple.Safari')
            if safari:
                workspace.openURLs_withApplicationAtURL_options_configuration_error_(
                    [NSURL.URLWithString_(url)], safari, 0, {}, None)
            else:
                workspace.openURL_(NSURL.URLWithString_(url))

        def openGlazy_(self, sender):
            self.openSafari('https://glazy.org/')

        def openBatchDesigner_(self, sender):
            if self.server.ready.is_set() and not self.server.error:
                self.openSafari(f'http://127.0.0.1:{helper.PORT}/batch-designer')

        def hideApp_(self, sender):
            NSApplication.sharedApplication().hide_(sender)

        def updateStatus_(self, timer):
            if self.server.error:
                message = 'Could not start: ' + self.server.error
                if 'Address already in use' in self.server.error:
                    message = 'Another helper is already running. Quit it before opening this app.'
            elif not self.server.ready.is_set():
                message = 'Starting…'
            elif self.server.printer.busy:
                message = 'Sending a label. Please leave the app open.'
            elif self.server.printer.status()['connected']:
                message = 'Connected to ' + self.server.printer.name
            else:
                message = 'Ready. Open Batch Designer or connect in the Glazy label tool.'
            self.status.setStringValue_(message)
            self.batch_button.setEnabled_(self.server.ready.is_set() and not self.server.error and not self.installing)
            if self.update_result:
                kind,value=self.update_result;self.update_result=None;self.update_task=None
                if kind=='checked':
                    self.update_entry=value
                    self.update_info.setStringValue_('Update v'+value['version']+' available.' if value else 'Helper v'+helper.VERSION+' · Up to date')
                elif kind=='prepared':
                    if self.server.printer.busy:
                        self.update_info.setStringValue_('Finish printing, then press Update and restart again.')
                    else:
                        try:self.installPrepared(value)
                        except Exception as e:self.update_info.setStringValue_('Update kept the current app: '+str(e))
                else:self.update_info.setStringValue_('Could not check or download update: '+str(value))
            self.update_button.setTitle_('Downloading update…' if self.update_task=='downloading' else 'Checking…' if self.update_task=='checking' else 'Update and restart' if self.update_entry else 'Check for updates')
            self.update_button.setEnabled_(not self.server.printer.busy and not self.update_task and not self.installing)

            if smoke_app and self.server.ready.is_set():
                assert self.batch_button.isEnabled()
                assert self.batch_button.title() == 'Open Batch Designer'
                assert self.window.title() == 'Ronald’s Mac Label Helper'
                self.window.close()
                self.window.makeKeyAndOrderFront_(None)
                assert self.window.isVisible()
                self.server.stop()
                NSApplication.sharedApplication().stop_(None)

        def quit_(self, sender):
            NSApplication.sharedApplication().terminate_(sender)

        def applicationShouldTerminate_(self, sender):
            if self.server.printer.busy:
                alert = NSAlert.alloc().init()
                alert.setMessageText_('A label is still sending')
                alert.setInformativeText_('Wait for this label to finish sending before quitting.')
                alert.runModal()
                self.window.makeKeyAndOrderFront_(None)
                return NSTerminateCancel
            self.server.stop()
            return NSTerminateNow

        def applicationShouldTerminateAfterLastWindowClosed_(self, sender):
            return False

        def applicationShouldHandleReopen_hasVisibleWindows_(self, sender, visible):
            self.window.makeKeyAndOrderFront_(None)
            return True

    app = NSApplication.sharedApplication()
    app.setActivationPolicy_(NSApplicationActivationPolicyRegular)
    menu = NSMenu.alloc().init()
    item = NSMenuItem.alloc().init()
    menu.addItem_(item)
    submenu = NSMenu.alloc().init()
    submenu.addItemWithTitle_action_keyEquivalent_('Quit Ronald’s Mac Label Helper', 'terminate:', 'q')
    item.setSubmenu_(submenu)
    app.setMainMenu_(menu)
    delegate = Delegate.alloc().init()
    app.setDelegate_(delegate)
    app.run()
    if smoke_app:
        if delegate.server.error:
            raise RuntimeError(delegate.server.error)
        print('Packaged Cocoa window startup, close/reopen and local server: PASS')


if __name__ == '__main__':
    main()

