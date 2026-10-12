Ronald’s Mac Label Helper app — v0.1.1

Use the Apple-silicon download for Macs with an M1, M2, M3 or newer Apple chip.
Use the Intel download for Intel Macs. Check Apple menu → About This Mac.

1. Unzip the download and move Ronalds Mac Label Helper.app to Applications.
2. Open the app. This first build has no Apple Developer ID signature or Apple
   notarisation. If macOS blocks it, approve this specific app through
   System Settings → Privacy & Security → Open Anyway after trying to open it.
3. Leave the app open. No Python installation or Terminal window is needed.
4. Disconnect the M110 from the iPhone and other printing apps.
5. In Safari, open a Glazy recipe and launch Ronald’s Glaze Label Printer.
6. Click Connect M110; choose your printer in the helper tab. Allow Bluetooth
   access for Ronalds Mac Label Helper if macOS asks. Return to Glazy to print.
7. Start with one 50 × 20 mm compact label. Keep the app and helper tab open.
   Close the app or choose Quit when finished. Quitting is blocked while a
   label is actively sending.

Your existing Python can stay as it is. The app includes its own runtime and
Bluetooth dependencies. The selected printer is remembered locally.
The local connection is restricted to 127.0.0.1; label jobs come from Glazy’s
helper tab. No cloud printer service is used. No automatic retries after an
uncertain print. Power-cycle the M110 before retrying an interrupted raster.

Do not run this app and the older .command helper together: they use the same
local port. Quit the older helper first with Control-C in its Terminal window.
The app’s simulated protocol checks are separate from the first physical
Mac-to-M110 Bluetooth test, which still needs to be completed on your Mac.

Python, PyInstaller, Bleak, aiohttp and PyObjC are included under their respective
licences. Their bundled package metadata and licences are included in the app.
