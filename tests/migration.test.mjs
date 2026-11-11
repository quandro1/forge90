// Version 1 kept everything under localStorage['forge90_v1']. Version 2 uses 'forge90_v2'.
// A phone that used version 1 must open on the same day of the same plan with every
// number intact, and version 1's copy must never be touched: it is the fallback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, v1State, v2State, finishSetup } from './harness.mjs';
import { oldBuild } from './pwa.test.mjs';

// the same logs without the deload marker version 2 adds to sessions of weeks 6 and 12
const plain = (logs) => JSON.parse(JSON.stringify(logs, (k, v) => (k === 'dl' ? undefined : v)));
const stores = (page) => page.evaluate(() => ({ v1: localStorage.getItem('forge90_v1'), v2: localStorage.getItem('forge90_v2') }));
const rich = () => v1State({
  profile: { start: '2026-08-17', w: 88, h: 180, age: 23, act: 1.45, goal: 75, split: 'five' },
  weights: { '2026-08-17': 88, '2026-11-10': 84.6, '2026-11-11': 84.4 },
  waist: { '2026-08-17': 96, '2026-11-09': 90.5 },
  steps: { '2026-11-10': 9120 },
  checks: { '2026-11-10': ['protein', 'steps', 'sleep', 'session'], '2026-11-11': ['protein'] },
  meas: [{ d: '2026-08-17', waist: '96', chest: '104', sh: '118', arm: '36', thigh: '60' }],
  logs: {
    inclineBB: [
      { d: '2026-11-02', sets: [{ w: 60, r: 8, done: 1 }, { w: 60, r: 8, done: 1 }, { w: 60, r: 7, done: 1 }, { w: 60, r: 6, done: 1 }] },
      { d: '2026-11-09', sets: [{ w: 60, r: 9, done: 1 }, { w: 60, r: 8, done: 1 }, { w: 60, r: 8, done: 1 }, { w: 60, r: 7, done: 1 }] },
    ],
    pullup: [{ d: '2026-11-10', sets: [{ r: 9, done: 1 }, { r: 7, done: 1 }, { r: 6, done: 1 }] }],
  },
  food: { '2026-11-11': [{ n: 'Eggs, 3 whole', k: 215, p: 19, c: 1, f: 15 }] },
  cond: { '2026-11-08': ['z2'] },
  shop: { 'Protein|Chicken breast': true },
});

export default [
  {
    name: 'version 1 data opens in version 2 unchanged: same day, same plan, every number',
    async run({ open }) {
      const seed = rich();
      const { page, errors } = await open({ state: seed });
      await page.locator('#ro-today').waitFor();
      const st = await stores(page);
      assert.equal(st.v1, JSON.stringify(seed), 'version 1 data was modified');
      assert.ok(st.v2, 'version 2 did not save its own copy');
      const s = JSON.parse(st.v2);
      assert.equal(s.v, 2);
      assert.equal(s.profile.program, 'vtaper');
      assert.equal(s.profile.dpw, 5);
      assert.deepEqual(s.profile.days, [1, 2, 3, 4, 5]);
      assert.equal(s.profile.start, '2026-08-17');
      assert.equal(s.profile.setup, true, 'a returning user must not be sent through first-run setup');
      for (const k of ['w', 'h', 'age', 'act']) assert.equal(s.profile[k], seed.profile[k], 'profile.' + k);
      assert.equal(s.profile.targetW, 75);
      assert.equal(s.profile.sex, 'm');
      assert.equal(s.profile.goal, 'cut');
      for (const k of ['weights', 'waist', 'steps', 'checks', 'food', 'cond', 'shop']) assert.deepEqual(s[k], seed[k], k + ' changed');
      assert.deepEqual(plain(s.logs), seed.logs, 'a logged number changed');
      // 2 Nov falls in week 12 of a block that began on 17 Aug: a deload week, and now marked as one
      assert.deepEqual(s.logs.inclineBB.map((e) => !!e.dl), [true, false]);
      assert.equal(s.meas.length, 1);
      assert.equal(+s.meas[0].waist, 96);
      assert.match(await page.locator('#dayline').innerText(), /day 87 of 91/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the 4-day split becomes the 4-day variant on Mon, Tue, Thu, Fri',
    async run({ open }) {
      const { page } = await open({ state: v1State({ profile: { start: '2026-11-09', split: 'four' } }), hash: 'train' });
      await page.locator('#dayList details[data-dayblock]').first().waitFor();
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 4);
      const s = JSON.parse((await stores(page)).v2);
      assert.equal(s.profile.dpw, 4);
      assert.deepEqual(s.profile.days, [1, 2, 4, 5]);
    },
  },
  {
    name: 'using version 2 never writes to the version 1 copy',
    async run({ open }) {
      const seed = rich();
      const { page } = await open({ state: seed, hash: 'train' });
      await page.locator('details[data-dayblock="0"] > summary').click();
      await page.locator('details[data-dayblock="0"] .ex[data-ex="inclineBB"] .ex-h').click();
      const lg = page.locator('.logger[data-log="inclineBB"]').first();
      await lg.locator('input[data-set="0"][data-f="w"]').fill('62.5');
      await lg.locator('input[data-set="0"][data-f="r"]').fill('6');
      await lg.locator('button[data-ok="0"]').tap();
      await page.waitForTimeout(400);
      const st = await stores(page);
      assert.equal(st.v1, JSON.stringify(seed), 'version 1 data was modified');
      const s = JSON.parse(st.v2);
      assert.deepEqual(s.logs.inclineBB[s.logs.inclineBB.length - 1], { d: '2026-11-11', sets: [{ w: 62.5, r: 6, done: 1 }, {}, {}, {}] });
    },
  },
  {
    name: 'data written by the real 2 Oct build survives the update',
    async run({ open, server }) {
      server.setRoot(oldBuild());
      const { page, errors } = await open({ state: v1State(), hash: 'train' });
      // use the OLD app the way a person does (Wednesday: block 2, legs, is today's and is already open)
      await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
      for (const [i, w, r] of [[0, 80, 8], [1, 80, 7], [2, 80, 7]]) {
        await page.locator('.logger[data-log="squat"]').first().locator('input[data-set="' + i + '"][data-f="w"]').fill(String(w));
        await page.locator('.logger[data-log="squat"]').first().locator('input[data-set="' + i + '"][data-f="r"]').fill(String(r));
        await page.locator('.logger[data-log="squat"]').first().locator('button[data-ok="' + i + '"]').tap();
      }
      await page.locator('.logger[data-log="squat"]').first().locator('[data-savelog]').tap();
      await page.locator('.tabbar button[data-tab="today"]').tap();
      await page.locator('#qWeight').fill('86.4');
      await page.locator('#checklist [data-chk="protein"]').tap();
      await page.locator('.tabbar button[data-tab="fuel"]').tap();
      await page.locator('#foodChips .chip').first().tap();
      await page.locator('.tabbar button[data-tab="today"]').tap();
      await page.waitForTimeout(400);
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem('forge90_v1')));
      assert.equal(before.logs.squat[0].sets.length, 4);

      server.setRoot(ROOT);                       // the new build is published; the phone opens the app
      await page.reload();
      await page.locator('#ro-today').waitFor();
      const st = await stores(page);
      assert.deepEqual(JSON.parse(st.v1), before, 'version 1 data was modified');
      const s = JSON.parse(st.v2);
      for (const k of ['weights', 'checks', 'logs', 'food']) assert.deepEqual(s[k], before[k], k + ' changed');
      assert.match(await page.locator('#dayline').innerText(), /day 3 of 91/i);
      await page.locator('.tabbar button[data-tab="train"]').tap();
      await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
      assert.equal(await page.locator('.logger[data-log="squat"] input[data-set="0"][data-f="w"]').first().inputValue(), '80');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a damaged version 2 copy falls back to the version 1 data instead of starting empty',
    async run({ open }) {
      const seed = rich();
      const { page, errors } = await open({ state: seed, extra: { forge90_v2: '{"v":2,"profile":{"start":' } });
      await page.locator('#ro-today').waitFor();
      assert.deepEqual(await page.evaluate(() => S.logs.pullup), seed.logs.pullup);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'garbage in storage never stops the app from opening',
    async run({ open }) {
      for (const junk of ['null', '[]', '"x"', '{"v":2,"logs":{"squat":[{"d":"nope","sets":"x"},null,{"d":"2026-11-10","sets":[null,{"w":"abc","r":"9"},7]}]},"profile":{"start":"yesterday","w":"heavy","days":"all"},"meas":{"a":1},"checks":[1,2]}']) {
        const { page, errors, context } = await open({ extra: { forge90_v2: junk } });
        await finishSetup(page);                    // unusable data means a fresh start: the first-run screen
        for (const t of ['train', 'plan', 'fuel', 'prog', 'today']) await page.locator('.tabbar button[data-tab="' + t + '"]').tap();
        assert.deepEqual(errors, [], 'threw on ' + junk.slice(0, 30));
        await context.close();
      }
    },
  },
  {
    name: 'Erase everything removes both copies and they do not come back',
    async run({ open }) {
      const { page } = await open({ state: rich() });
      await page.locator('#btnSet').tap();
      await page.locator('#btnWipe').tap();
      await page.locator('#btnWipe').tap();
      await page.waitForLoadState('load');
      await page.waitForFunction(() => typeof S === 'object' && !Object.keys(S.logs).length);
      const st = await stores(page);
      assert.equal(st.v1, null, 'version 1 data is still on the device');
      assert.equal(await page.evaluate(() => Object.keys(S.weights).length), 0);
    },
  },
  {
    name: 'Restore accepts a version 1 backup file',
    async run({ open }) {
      const seed = rich();
      const file = path.join(ROOT, 'tests', '.out', 'v1-backup.json');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(seed, null, 2));
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnSet').tap();
      const chooser = page.waitForEvent('filechooser');
      await page.locator('#btnImport').tap();
      await (await chooser).setFiles(file);
      await page.waitForFunction(() => typeof S === 'object' && S.logs && S.logs.pullup);
      assert.deepEqual(plain(await page.evaluate(() => S.logs.inclineBB)), seed.logs.inclineBB);
      assert.equal(await page.evaluate(() => S.profile.start), '2026-08-17');
      assert.equal(await page.evaluate(() => S.v), 2);
    },
  },
];
