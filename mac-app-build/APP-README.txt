Ronald’s Mac Label Helper — v0.1.16 · Apple silicon

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
limit and job progress. The local bridge accepts Glazy, its own local Batch Designer page and Ronald’s hosted GitHub page only, and binds loopback.
Updates verify architecture, version, size, SHA-256 and app signature and require
an idle printer. Existing app is kept on replacement failure; macOS security
metadata is retained. Python and bundled dependencies retain their licences.


Open Batch Designer in the helper window launches the live designer in Safari.
It uses the same updated label application as the bookmarklet, at a stable local
address. An internet connection loads the application; batches stay in this
browser on this Mac. Export/import existing Glazy batches once to move them.
The iPhone bookmarklet remains available.

Bookmarkable hosted designer: https://ronaldboersen.github.io/glazy-tools-dist/batch-label-designer.html
Mac Safari needs helper 0.1.12 for this page. Desktop Chrome connects directly.
iPhone Safari uses the existing beacio setup, enabled for ronaldboersen.github.io.
The helper’s local launcher keeps its separate saved batches; it is unchanged.

Batch Label Designer can connect to the DYMO LetraTag 200B on Mac Safari with this version.
