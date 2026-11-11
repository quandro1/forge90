// Checks the PUBLISHED app.   node tests/live-check.mjs [url]
// Waits until the live page carries the same build stamp as index.html in this
// folder, then opens it in headless Chrome on an emulated phone (a fresh
// profile: no real data is read or written) and runs the rest-timer
// regression and a walk through every tab on it.
import fs from 'node:fs';
import path from 'node:path';
import { launch, openApp, v1State, ROOT } from './harness.mjs';

const url = process.argv[2] || 'https://quandro1.github.io/forge90/';
const stampOf = (html) => (html.match(/<meta name="forge-build" content="([0-9a-f]+)">/) || [])[1] || null;
const local = stampOf(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
if (!local) { console.error('index.html here has no build stamp'); process.exit(2); }

let live = null;
for (let i = 0; i < 30; i++) {
  try {
    const r = await fetch(url + '?cb=' + Date.now(), { cache: 'no-store' });
    live = stampOf(await r.text());
  } catch (e) { live = 'fetch failed: ' + e.message; }
  if (live === local) break;
  await new Promise((r) => setTimeout(r, 10000));
}
const out = { url, local, live, same: live === local };
if (!out.same) { console.log(JSON.stringify(out, null, 2)); process.exit(1); }

const { pw, browser } = await launch();
try {
  const { page, errors, context } = await openApp({ pw, browser, base: url }, { state: v1State(), hash: 'train' });
  out.pageBuild = await page.evaluate(() => document.querySelector('meta[name="forge-build"]').content);
  await page.locator('details[data-dayblock="0"] > summary').click();
  await page.locator('details[data-dayblock="0"] .ex[data-ex="inclineBB"] .ex-h').click();
  const lg = page.locator('.logger[data-log="inclineBB"]').first();
  await lg.locator('input[data-set="0"][data-f="w"]').fill('60');
  await lg.locator('input[data-set="0"][data-f="r"]').fill('10');          // the top of 6-10: the case that used to break
  await lg.locator('button[data-ok="0"]').tap();
  out.timer = await page.evaluate(() => (RT ? { id: RT.id, set: RT.set, secondsLeft: Math.round((RT.end - Date.now()) / 1000) } : null));
  out.rowDone = await page.locator('.logger[data-log="inclineBB"] .setrow.done').count();
  out.hint = await page.locator('.logger[data-log="inclineBB"] .verdict').first().innerText();
  for (const t of ['today', 'plan', 'fuel', 'prog', 'train']) await page.locator('.tabbar button[data-tab="' + t + '"]').tap();
  out.errors = errors;
  await context.close();
} finally {
  await browser.close();
}
out.ok = out.same && out.pageBuild === local && !!out.timer && out.rowDone >= 1 && out.errors.length === 0;
console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
