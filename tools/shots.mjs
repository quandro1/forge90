#!/usr/bin/env node
// Screenshots of the built app on an emulated phone, for looking at a change.
//   node tools/shots.mjs [dark|light] [device]      -> tests/.out/shots/<name>-<theme>.png
// Uses made-up states. Nothing real is read or written.
import fs from 'node:fs';
import path from 'node:path';
import { launch, serve, openApp, v2State, ROOT } from '../tests/harness.mjs';

const theme = process.argv[2] === 'light' ? 'light' : 'dark';
const device = process.argv[3] || 'Pixel 7';
const out = path.join(ROOT, 'tests', '.out', 'shots');
fs.mkdirSync(out, { recursive: true });
const state = v2State({
  profile: { sex: 'm', age: 23, h: 180, w: 88, act: 1.45, goal: 'cut', start: '2026-10-05' },
  ui: { theme, diet: 'train', helpSeen: 1 },
  weights: { '2026-10-05': 88, '2026-10-12': 87.4, '2026-10-19': 86.9, '2026-10-26': 86.1, '2026-11-02': 85.6, '2026-11-05': 85.5, '2026-11-07': 85.3, '2026-11-09': 85.2, '2026-11-10': 85.0, '2026-11-11': 84.9 },
  checks: { '2026-11-10': ['protein', 'steps', 'sleep', 'session'], '2026-11-11': ['water'] },
  steps: { '2026-11-11': 6400 },
  food: { '2026-11-11': [{ n: 'Omelette, 3 egg', k: 340, p: 19, c: 3, f: 28 }, { n: 'Chicken breast', k: 165, p: 31, c: 0, f: 4 }] },
  meas: [{ d: '2026-10-05', waist: 96, chest: 104 }, { d: '2026-11-02', waist: 92.5, chest: 104.5 }],
  logs: {
    squat: [{ d: '2026-10-28', sets: [{ w: 77.5, r: 8, done: 1 }, { w: 77.5, r: 8, done: 1 }, { w: 77.5, r: 8, done: 1 }, { w: 77.5, r: 7, done: 1 }] },
      { d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }, { w: 80, r: 8, done: 1 }, { w: 80, r: 7, done: 1 }, { w: 80, r: 6, done: 1 }] }],
    legpress: [{ d: '2026-11-04', sets: [{ w: 140, r: 12, done: 1 }, { w: 140, r: 12, done: 1 }, { w: 140, r: 11, done: 1 }, { w: 140, r: 10, done: 1 }] }],
  },
});
const server = await serve(ROOT);
const { pw, browser } = await launch();
const env = { pw, browser, base: server.url };
const names = [];
const file = (name) => { const f = path.join(out, name + '-' + theme + '.png'); names.push(f); return f; };
try {
  /* ---- someone who uses the app ---- */
  {
    const { page, errors, context } = await openApp(env, { state, device });
    const settle = () => page.waitForTimeout(450);          // let a fade or a slide finish: the picture is of the resting state
    const shot = async (name, full) => { await settle(); await page.screenshot({ path: file(name), fullPage: !!full }); };
    const el = async (name, sel) => { await settle(); await page.locator(sel).first().screenshot({ path: file(name) }); };
    const tab = (t) => page.locator('.tabbar button[data-tab="' + t + '"]').tap();
    const closeSheet = async () => { await page.locator('#sheet [data-close]').last().tap(); await page.waitForFunction(() => !document.querySelector('#sheet.on')); };
    await page.locator('#ro-today').waitFor();
    await shot('today', true);
    await tab('train');
    await shot('train-top');
    // a lift that is already in the log (guide folded) and one that is new (guide open)
    const blk = 'details[data-dayblock="2"] ';
    await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
    await el('card-known', blk + '.ex[data-ex="squat"]');
    const lg = page.locator(blk + '.logger[data-log="squat"]');
    await lg.locator('input[data-set="0"][data-f="w"]').fill('82.5');
    await lg.locator('input[data-set="0"][data-f="r"]').fill('8');
    await lg.locator('button[data-ok="0"]').tap();
    await lg.locator('input[data-set="1"][data-f="r"]').fill('7');
    await lg.locator('button[data-del="1"]').tap();
    await el('logger-resting-undo', blk + '.logger[data-log="squat"]');
    await page.locator(blk + '.ex[data-ex="squat"] details.how > summary').click();
    await el('card-guide', blk + '.ex[data-ex="squat"] details.how');
    await page.locator(blk + '.ex[data-ex="legext"] .ex-h').click();
    await el('card-new', blk + '.ex[data-ex="legext"]');
    await page.locator('[data-pickplan]').first().tap();
    await page.locator('#sheet.on').waitFor();
    await shot('plan-picker');
    await page.locator('#sheet [data-useplan]').nth(2).tap();
    await shot('plan-confirm');
    await closeSheet();
    await page.locator('#btnLib').scrollIntoViewIfNeeded();
    await page.locator('#btnLib').tap();
    await shot('library');
    await closeSheet();
    await page.locator('#btnSet').tap();
    await shot('settings');
    await closeSheet();
    await page.locator('#btnGuide').tap();
    await shot('guide');
    await closeSheet();
    await tab('plan');
    await shot('map', true);
    await page.locator('#s-plan [data-day="36"]').tap();
    await page.locator('#sheet.on').waitFor();
    await shot('day-past');
    await closeSheet();
    await tab('fuel');
    await shot('fuel-top');
    await el('fuel-counter', '#s-fuel .stack > .card');
    await el('fuel-day', '#mealList');
    await page.locator('#fuelExtra details').nth(3).locator('summary').click();
    await el('fuel-extra', '#fuelExtra');
    await tab('prog');
    await shot('progress', true);
    if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
    await context.close();
  }
  /* ---- someone new ---- */
  {
    const { page, errors, context } = await openApp(env, { device, extra: { __theme: theme } });
    await page.locator('#setup.on').waitFor();
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.screenshot({ path: file('setup-1') });
    await page.locator('#su-age').fill('31');
    await page.locator('#su-h').fill('164');
    await page.locator('#su-w').fill('61');
    await page.locator('#setup [data-su-next]').tap();
    await page.screenshot({ path: file('setup-2'), fullPage: true });
    await page.locator('#setup [data-su-next]').tap();
    await page.screenshot({ path: file('setup-3'), fullPage: true });
    if (errors.length) console.log('PAGE ERRORS (set-up):\n' + errors.join('\n'));
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(names.map((n) => path.basename(n)).join('  '));
console.log(out);
