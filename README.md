# Glazy Tools – Public Distribution

Public runtime files for Ronald Boersen's Glazy tools.

The human-readable development source lives in the private `glazy-tools` repository. This repository contains only files that browsers need to load publicly.

## Mix Checklist

Current release: **1.0.0**

- `rb-glazy-mix-checklist-manifest.js` — selects the active release
- `rb-glazy-mix-checklist-v1.0.0.js` — versioned JavaScript
- `rb-glazy-mix-checklist-v1.0.0.css` — versioned CSS

Once GitHub Pages is enabled from the `main` branch, these files are served from:

`https://ronaldboersen.github.io/glazy-tools-dist/`

### Updating

Publish new versioned JS/CSS files, then update the manifest to point at them.

### Rollback

Change the manifest back to the previous versioned JS/CSS files. Existing bookmarklets do not need to be reinstalled.
