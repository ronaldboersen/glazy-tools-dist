Ronald’s Mac Label Helper app — v0.1.9

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
6. Reload Glazy in Safari and launch Ronald’s Glaze Label Printer v0.1.9 or later.
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

Streaming trials (label tool v0.1.15): print one identical full label using Fast
when confirmed, then Stream trial 20, 15, 10, 5 and 0 ms. Setup/header wait for
acknowledgement; image chunks do not. The Mac's queue capacity and packet size
limits are respected. Trial options only enable if the printer supports both
write modes. Check each complete physical label and compare Image send time.
A queued image is not confirmed delivery. Nothing retries automatically.

Stop transfer now cancels sending and disconnects. It does not clear the
printer's partial image buffer: switch the M110 off and on before reconnecting.
A blocked Mac queue times out after five seconds. Copy printer diagnostics
from the label panel to report the precise stage and queued image bytes.

Updates: starting with v0.1.9, the app checks Ronald's published update manifest
once when it opens. Bring its window forward to see an available update, then
press Update and restart. Install this version manually once; future helper
updates can replace the copy in Applications. Installation requires a writable
app folder and an idle printer. A running label is never interrupted by an
update. Downloads are checked for architecture, version, size, SHA-256 and app
signature; the prior app is retained if replacement or launch fails. macOS
security metadata is preserved. No Python setup is needed.


Packet diagnostic comparison (label tool v0.1.20): compare 128 and 20 byte
image packets using the same label and transfer mode. The app records the
negotiated native write limit, queue checks/wait time, and native readiness
callback count. No queue bypass, automatic retry or image ACK is introduced.
Use Copy printer diagnostics after each attempt.
