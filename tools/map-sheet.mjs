#!/usr/bin/env node
// Pictures of the muscle maps of every exercise, as an opened guide draws them, eight to a picture.
// For looking at all 41 after a change to the drawing, the zones or the colours.
//   node tools/map-sheet.mjs [dark|light]            -> tests/.out/maps/maps-<n>-<theme>.png
//   node tools/map-sheet.mjs [dark|light] squat,rdl  -> only those lifts, drawn large (maps-close-<theme>.png)
import fs from 'node:fs';
import path from 'node:path';
import { launch, serve, openApp, v2State, ROOT } from '../tests/harness.mjs';

const theme = process.argv[2] === 'light' ? 'light' : 'dark';
const only = (process.argv[3] || '').split(',').filter(Boolean);
const out = path.join(ROOT, 'tests', '.out', 'maps');
fs.mkdirSync(out, { recursive: true });
const server = await serve(ROOT);
const { pw, browser } = await launch();
try {
  const { page, context, errors } = await openApp({ pw, browser, base: server.url }, { state: v2State({ ui: { theme, diet: 'train', helpSeen: 1, news: 99 } }) });
  await page.locator('#ro-today').waitFor();
  const ids = only.length ? only : await page.evaluate(() => Object.keys(EX));
  const per = only.length ? ids.length : 8, cols = only.length ? Math.min(2, ids.length) : 4, cell = only.length ? 560 : 312;
  await page.setViewportSize({ width: cols * (cell + 14) + 14, height: 900 });
  const names = [];
  for (let i = 0; i < ids.length; i += per) {
    await page.evaluate(({ part, cols, cell, big }) => {
      const old = document.getElementById('mapSheet'); if (old) old.remove();
      const box = document.createElement('div');
      box.id = 'mapSheet';
      box.style.cssText = 'position:absolute;left:0;top:0;z-index:9999;display:grid;grid-template-columns:repeat(' + cols + ',' + cell + 'px);gap:14px;padding:14px;background:var(--ground)';
      box.innerHTML = part.map((id) => '<div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px">'
        + '<div style="font-family:var(--font-d);font-size:15.5px">' + esc(EX[id].name) + '</div>' + mapsFor(EX[id]) + '</div>').join('');
      if (big) box.querySelectorAll('.maps svg').forEach((s) => { s.style.height = '520px'; });
      document.body.appendChild(box);
    }, { part: ids.slice(i, i + per), cols, cell, big: !!only.length });
    const f = path.join(out, only.length ? 'maps-close-' + theme + '.png' : 'maps-' + String(i / per + 1).padStart(2, '0') + '-' + theme + '.png');
    await page.locator('#mapSheet').screenshot({ path: f });
    names.push(path.basename(f));
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await context.close();
  console.log(names.join('  '));
  console.log(out);
} finally {
  await browser.close();
  await server.close();
}
