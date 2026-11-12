#!/usr/bin/env node
// Pictures of the "Angles, grip and range" notes of every exercise, four to a picture, at phone width.
// For reading all 41 at a glance after a change to the notes or the drawings.
//   node tools/form-sheet.mjs [dark|light]      -> tests/.out/form/form-<n>-<theme>.png
import fs from 'node:fs';
import path from 'node:path';
import { launch, serve, openApp, v2State, ROOT } from '../tests/harness.mjs';

const theme = process.argv[2] === 'light' ? 'light' : 'dark';
const out = path.join(ROOT, 'tests', '.out', 'form');
fs.mkdirSync(out, { recursive: true });
const server = await serve(ROOT);
const { pw, browser } = await launch();
try {
  const { page, context, errors } = await openApp({ pw, browser, base: server.url }, { state: v2State({ ui: { theme, diet: 'train', helpSeen: 1, news: 99 } }) });
  await page.locator('#ro-today').waitFor();
  await page.setViewportSize({ width: 820, height: 900 });
  const ids = await page.evaluate(() => Object.keys(EX));
  const names = [];
  for (let i = 0; i < ids.length; i += 4) {
    await page.evaluate((part) => {
      const old = document.getElementById('fnSheet'); if (old) old.remove();
      const box = document.createElement('div');
      box.id = 'fnSheet';
      box.style.cssText = 'position:absolute;left:0;top:0;z-index:9999;width:800px;display:grid;grid-template-columns:386px 386px;gap:14px;padding:14px;background:var(--ground)';
      box.innerHTML = part.map((id) => '<div style="background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px">'
        + '<div style="font-family:var(--font-d);font-size:15.5px;margin-bottom:6px">' + esc(EX[id].name) + '</div>' + formNotes(id, true) + '</div>').join('');
      document.body.appendChild(box);
    }, ids.slice(i, i + 4));
    const f = path.join(out, 'form-' + String(i / 4 + 1).padStart(2, '0') + '-' + theme + '.png');
    await page.locator('#fnSheet').screenshot({ path: f });
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
