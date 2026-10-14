Ronald’s Mac Label Helper — v0.1.10 · Apple silicon

Install the actual Ronalds Mac Label Helper.app, not an outer archive folder.
Quit the old helper, move the app into a writable Applications folder, and open
it. The app can stay running with its window hidden or closed. For upgrades,
quit/reopen to check, then choose Update and restart. No Python or Terminal
setup is needed. macOS may require Open Anyway for this non-notarised app.

Use label tool v0.1.23 or later. Transfer speed offers Fast when confirmed and
Slow and steady only. Image packets: 128 bytes (established), 192 and 256 bytes
(tests). Larger sizes require confirmed writes and must fit the connected Mac's
confirmed-write limit. Unsupported choices are blocked before printing begins.
Keep one identical label and Fast when confirmed for the packet-size comparison.
Check the physical output after each attempt. No automatic write retry is used.

The helper's packet size changes image writes only. Commands, renderer and
normal confirmed timing remain unchanged. Stop transfer now cancels and
disconnects. If the printer remains waiting for data after an interruption,
switch it off and on before reconnecting. It starts printing after receiving
the complete image; compare image send time separately from physical printing.

Copy printer diagnostics reports helper version, packet size, confirmed-write
limit and job progress. The local bridge accepts Glazy only and binds loopback.
Updates verify architecture, version, size, SHA-256 and app signature and require
an idle printer. Existing app is kept on replacement failure; macOS security
metadata is retained. Python and bundled dependencies retain their licences.
