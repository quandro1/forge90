// Checks the PUBLISHED app.   node tests/live-check.mjs [url]
// Waits until the live page carries the same build stamp as index.html in this
// folder, then opens it in headless Chrome on an emulated phone. Every visit is
// a fresh profile with made-up data: nothing real is read or written.
//   1. a phone that holds data from the earlier version: nothing lost, no set-up, the rest timer starts
//   2. a new visitor: set-up, then a working app
//   3. after one visit, the app opens with the network off
import fs from 'node:fs';
import path from 'node:path';
import { launch, openApp, v1State, finishSetup, precached, ROOT, TODAY } from './harness.mjs';

const url = process.argv[2] || 'https://quandro1.github.io/forge90/';
const stampOf = (html) => (html.match(/<meta name="forge-build" content="([0-9a-f]+)">/) || [])[1] || null;
const local = stampOf(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
if (!local) { console.error('index.html here has no build stamp'); process.exit(2); }

let live = null;
// Node resolves localhost to IPv6 first and a local test server listens on IPv4 only
const fetchUrl = url.replace('//localhost', '//127.0.0.1');
for (let i = 0; i < 30; i++) {
  try {
    const r = await fetch(fetchUrl + '?cb=' + Date.now(), { cache: 'no-store' });
    live = stampOf(await r.text());
  } catch (e) { live = 'fetch failed: ' + e.message; }
  if (live === local) break;
  console.error('  .. waiting for the published page: it carries ' + live + ', this folder is ' + local);
  await new Promise((r) => setTimeout(r, 10000));
}
const out = { url, local, live, same: live === local };
const step = (m) => console.error('  .. ' + m);          // progress goes to stderr; the result is the JSON on stdout
step('live build ' + live + (live === local ? ' = this folder' : ' != ' + local));
if (!out.same) { console.log(JSON.stringify(out, null, 2)); process.exit(1); }

const { pw, browser } = await launch();
const env = { pw, browser, base: url };
const pageBuild = (page) => page.evaluate(() => document.querySelector('meta[name="forge-build"]').content);
try {
  /* 1. the earlier version's data, as the phone holds it */
  {
    step('1 of 3: a phone holding data from the earlier version');
    const old = v1State({
      weights: { '2026-11-09': 88.4, '2026-11-10': 88.1 },
      checks: { '2026-11-10': ['protein', 'steps', 'sleep', 'session'] },
      logs: { squat: [{ d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }, { w: 80, r: 8, done: 1 }, { w: 80, r: 7, done: 1 }, { w: 80, r: 6, done: 1 }] }] },
    });
    const { page, errors, context } = await openApp(env, { state: old, hash: 'train' });
    const r = {};
    r.build = await pageBuild(page);
    r.setupShown = await page.locator('#setup.on').count();
    r.kept = await page.evaluate(() => ({ log: S.logs.squat && S.logs.squat[0].sets.map((s) => s.w + 'x' + s.r).join(' '), weights: Object.keys(S.weights).length, yesterday: (S.checks['2026-11-10'] || []).length, plan: S.profile.program + ' ' + S.profile.dpw, w: S.profile.w }));
    r.oldCopyUntouched = (await page.evaluate(() => localStorage.getItem('forge90_v1'))) === JSON.stringify(old);
    r.newCopy = !!(await page.evaluate(() => localStorage.getItem('forge90_v2')));
    const blk = 'details[data-dayblock="2"] ';                                // Wednesday of a Monday-to-Friday week: today's session is open
    await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
    const lg = page.locator(blk + '.logger[data-log="squat"]');
    await lg.locator('input[data-set="0"][data-f="w"]').fill('80');
    await lg.locator('input[data-set="0"][data-f="r"]').fill('10');           // the top of 6-10: the case that used to stop the timer
    await lg.locator('button[data-ok="0"]').tap();
    r.timer = await page.evaluate(() => (RT ? { id: RT.id, set: RT.set, secondsLeft: Math.round((RT.end - Date.now()) / 1000) } : null));
    r.rowDone = await lg.locator('.setrow.done').count();
    r.hint = await lg.locator('.verdict').innerText();
    for (const t of ['today', 'plan', 'fuel', 'prog', 'train']) await page.locator('.tabbar button[data-tab="' + t + '"]').tap();
    await page.locator('.tabbar button[data-tab="fuel"]').tap();
    r.fuel = await page.evaluate(() => { const t = targets(), d = mealPlan(dietType()); return { target: d.wantK, day: d.k, protein: t.prot, dayProtein: d.p }; });
    r.errors = errors;
    r.ok = r.build === local && r.setupShown === 0 && r.kept.log === '80x8 80x8 80x7 80x6' && r.kept.weights === 2 && r.kept.yesterday === 4
      && r.kept.plan === 'vtaper 5' && r.kept.w === 88 && r.oldCopyUntouched && r.newCopy && !!r.timer && r.timer.id === 'squat' && r.rowDone >= 1
      && Math.abs(r.fuel.day - r.fuel.target) <= 90 && r.fuel.dayProtein >= r.fuel.protein - 12 && errors.length === 0;
    out.update = r;
    await context.close();
  }
  /* 2. someone new */
  {
    step('2 of 3: a new visitor');
    const { page, errors, context } = await openApp(env, {});
    const r = {};
    r.setupShown = await page.locator('#setup.on').count();
    await finishSetup(page);
    await page.locator('#ro-today').waitFor();
    r.plan = await page.evaluate(() => S.profile.program + ' ' + S.profile.dpw + ' ' + S.profile.setup);
    r.day = await page.locator('#dayline').innerText();
    for (const t of ['train', 'plan', 'fuel', 'prog', 'today']) await page.locator('.tabbar button[data-tab="' + t + '"]').tap();
    r.errors = errors;
    r.ok = r.setupShown === 1 && /true$/.test(r.plan) && /Day 1 of 91/i.test(r.day) && errors.length === 0;
    out.newVisitor = r;
    await context.close();
  }
  /* 3. offline after one visit */
  {
    step('3 of 3: offline after one visit');
    const { page, errors, context } = await openApp(env, { state: v1State(), sw: true, now: false });
    const r = {};
    await precached(page);                                                   // the worker is active and has stored the app
    await context.setOffline(true);
    await page.reload({ waitUntil: 'load' });
    r.build = await pageBuild(page);
    r.renders = await page.locator('#ro-today').count();
    r.fromWorker = await page.evaluate(() => !!navigator.serviceWorker.controller);
    r.caches = await page.evaluate(() => caches.keys());
    r.errors = errors.filter((e) => !/Failed to load resource|net::ERR_INTERNET_DISCONNECTED/.test(e));
    r.ok = r.build === local && r.renders === 1 && r.caches.length === 1 && r.errors.length === 0;
    out.offline = r;
    await context.close();
  }
} finally {
  await browser.close();
}
out.today = TODAY;
out.ok = out.same && !!(out.update && out.update.ok) && !!(out.newVisitor && out.newVisitor.ok) && !!(out.offline && out.offline.ok);
console.log(JSON.stringify(out, null, 2));
process.exit(out.ok ? 0 : 1);
