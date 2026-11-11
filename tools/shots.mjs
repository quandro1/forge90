#!/usr/bin/env node
// Screenshots of the built app on an emulated phone, for looking at a change.
//   node tools/shots.mjs [dark|light] [device]      -> tests/.out/shots/<name>.png
// Uses a made-up mid-block state. Nothing real is read or written.
import fs from 'node:fs';
import path from 'node:path';
import { launch, serve, openApp, v1State, ROOT } from '../tests/harness.mjs';

const theme = process.argv[2] === 'light' ? 'light' : 'dark';
const device = process.argv[3] || 'Pixel 7';
const out = path.join(ROOT, 'tests', '.out', 'shots');
fs.mkdirSync(out, { recursive: true });
const state = v1State({
  profile: { start: '2026-10-05', split: 'five' },
  ui: { theme, diet: 'train', helpSeen: 1 },
  weights: { '2026-10-05': 88, '2026-10-12': 87.4, '2026-10-19': 86.9, '2026-10-26': 86.1, '2026-11-02': 85.6, '2026-11-09': 85.2, '2026-11-10': 85.0, '2026-11-11': 84.9 },
  checks: { '2026-11-10': ['protein', 'steps', 'sleep', 'session'], '2026-11-11': ['protein', 'water'] },
  steps: { '2026-11-11': 6400 },
  food: { '2026-11-11': [{ n: 'Eggs, 3 whole', k: 215, p: 19, c: 1, f: 15 }, { n: 'Chicken breast', k: 165, p: 31, c: 0, f: 4 }] },
  logs: {
    squat: [{ d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }, { w: 80, r: 8, done: 1 }, { w: 80, r: 7, done: 1 }, { w: 80, r: 6, done: 1 }] }],
    legpress: [{ d: '2026-11-04', sets: [{ w: 140, r: 12, done: 1 }, { w: 140, r: 12, done: 1 }, { w: 140, r: 11, done: 1 }, { w: 140, r: 10, done: 1 }] }],
  },
});
const server = await serve(ROOT);
const { pw, browser } = await launch();
const names = [];
try {
  const { page, errors } = await openApp({ pw, browser, base: server.url }, { state, device });
  const shot = async (name, full) => { const f = path.join(out, name + '-' + theme + '.png'); await page.screenshot({ path: f, fullPage: !!full }); names.push(f); };
  const tab = (t) => page.locator('.tabbar button[data-tab="' + t + '"]').tap();
  await page.locator('#ro-today').waitFor();
  await shot('today', true);
  await tab('train');
  await shot('train', true);
  // a lift that is already in the log (guide folded) and one that is new (guide open)
  await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
  await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"]').scrollIntoViewIfNeeded();
  await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"]').screenshot({ path: path.join(out, 'card-known-' + theme + '.png') });
  await page.locator('details[data-dayblock="2"] .ex[data-ex="legext"] .ex-h').click();
  await page.locator('details[data-dayblock="2"] .ex[data-ex="legext"]').screenshot({ path: path.join(out, 'card-new-' + theme + '.png') });
  const lg = page.locator('details[data-dayblock="2"] .logger[data-log="squat"]');
  await lg.locator('input[data-set="0"][data-f="w"]').fill('82.5');
  await lg.locator('input[data-set="0"][data-f="r"]').fill('8');
  await lg.locator('button[data-ok="0"]').tap();
  await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .logger').screenshot({ path: path.join(out, 'logger-resting-' + theme + '.png') });
  await page.locator('#btnLib').scrollIntoViewIfNeeded();
  await page.locator('#btnLib').tap();
  await shot('library');
  await page.locator('#sheet [data-close]').last().tap();
  await page.locator('#btnSet').tap();
  await shot('settings');
  await page.locator('#sheet [data-close]').last().tap();
  for (const t of ['plan', 'fuel', 'prog']) { await tab(t); await shot(t, true); }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
} finally {
  await browser.close();
  await server.close();
}
console.log(out);
