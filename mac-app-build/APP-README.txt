Ronald’s Mac Label Helper app — v0.1.2

Use Apple silicon for Macs with an M1, M2, M3 or newer Apple chip. Use Intel for
Intel Macs. Check Apple menu → About This Mac if unsure.

1. Quit the old helper app (or .command helper) before replacing it.
2. Unzip the download and move Ronalds Mac Label Helper.app to Applications.
3. Open the app. This build is not Apple Developer ID signed or notarised.
   If macOS blocks it, approve this specific app through System Settings →
   Privacy & Security → Open Anyway after attempting to open it.
4. Keep the app running. Use Hide app or close its window to leave it in the
   background. Quit from the app menu when finished.
5. Disconnect the M110 from your iPhone or other printing apps.
6. Reload Glazy in Safari and launch Ronald’s Glaze Label Printer v0.1.7 or later.
   Connect, choose your printer and print inside the label tool. No helper tab
   is needed. The previously selected printer reconnects when available.
7. Start with one 50 × 20 mm label. Allow Bluetooth access if macOS asks.

No Python installation or Terminal setup is needed. The app contains its own
runtime and Bluetooth libraries. Your existing Python is not used or modified.
The local service listens only on 127.0.0.1. The inline route accepts requests
only from https://glazy.org and requires the app-process token for commands.
Label pixels are staged and validated before a single print commit. A lost
commit receipt stays uncertain; labels are never automatically retried.
Power-cycle the M110 before retrying an interrupted print.

Older tab-based bookmarklets remain compatible with the app’s legacy helper
page, but the updated tool no longer opens or needs that page.
Python, PyInstaller, Bleak, aiohttp and PyObjC retain their respective licences.
Bundled package metadata and licences are included in the app.
