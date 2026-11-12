# MuscleMap path data (kept copy)

The body drawing in the app comes from these files.

- Source: https://github.com/Jsplice/MuscleMap, folder `packages/assets/src/`
- Commit: `170cfacda79376dd59ac0cf2f7dfab8ff9f4443a` (the `main` branch on 12 November 2026)
- Files copied unchanged: `male-front.ts`, `male-back.ts`, `LICENSE`, `ASSET_PROVENANCE.md`
- Licence: MIT, "Copyright (c) 2026 Jsplice / MuscleMap contributors". The licence file says in its own
  words that it covers the SVG muscle path data. `ASSET_PROVENANCE.md` says how the drawing was made.

How the app uses them:

- `tools/muscle-data.mjs` reads the two `.ts` files as text and writes `src/js/00-muscle-data.js`. It refuses
  a copy whose content is not the one at the commit above.
- It changes three things: each shape gets the app's zone id, the chest shape is divided into upper chest
  and chest, and coordinates are rounded to whole numbers.
- The generated file carries the copyright line and the MIT text, so they ship inside the built page.

To take a newer version of the drawing: replace the two `.ts` files, update the commit and the two blob
hashes at the top of `tools/muscle-data.mjs`, run it with `--report`, look at every exercise's figure, and
run the tests.
