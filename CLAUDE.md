# Glazy Tools – Public Distribution

Generated output only. Every file here is built and published from the private `glazy-tools` source
repository by its publish script; the only exception is `.github/workflows/mac-helper-release.yml`, which
creates the Mac Label Helper release page when a new version is published, and this file.

- Do not edit, minify, patch or add files here by hand. Make the change in `glazy-tools` and publish it.
- Versioned files (`*-vX.Y.Z.*`) are never replaced; a new release gets a new version.
- Rolling back a tool means pointing its manifest at an earlier version, which is also done from
  `glazy-tools`.
