// Saved data and the offline shell: what the pre-release review found, each as a test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { v1State, v2State, NOW, TODAY, ROOT } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('forge90_v2')));
const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
const openToday = async (page, id) => {
  await page.locator('details[data-dayblock="2"] .ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator('details[data-dayblock="2"] .logger[data-log="' + id + '"]').waitFor();
};
const precached = (page) => page.waitForFunction(async () => {
  if (!(await navigator.serviceWorker.getRegistration())) return false;
  const ks = await caches.keys();
  return ks.length === 1 && (await (await caches.open(ks[0])).keys()).length >= 6;
}, null, { timeout: 20000 });
/* A stand-in for the claude.ai runtime: one private document, kept in localStorage so it outlives a reload. */
const FAKE_CLOUD = `(() => {
  const K='__cloud_doc';
  const doc={
    get: async () => { const raw=localStorage.getItem(K); return { exists: !!raw, data: () => JSON.parse(raw) }; },
    set: async (v) => { localStorage.setItem(K, JSON.stringify(v)); },
    delete: async () => { localStorage.removeItem(K); },
  };
  window.claude={ use: async (n) => n==='db' ? { doc: () => doc } : n==='user' ? { id: async () => 'u1' } : null };
})();`;
const cloudDoc = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('__cloud_doc') || 'null'));
const DAY = 86400000, nowMs = new Date(NOW).getTime();

export default [
  {
    name: 'a rest that ran out while the phone slept does not hold the app on yesterday',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State(), hash: 'train' });
      await openToday(page, 'squat');
      await typeSet(page, 'squat', 0, 80, 8);
      await tick(page, 'squat', 0);                                            // a 3-minute rest starts, and the phone is locked
      await page.evaluate(() => { window.__before = true; });
      await clock.setSystemTime(new Date('2026-11-12T07:00:00'));              // next morning; nothing ran in between
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await page.waitForFunction(() => !window.__before && typeof TODAY === 'string', null, { timeout: 8000 });
      assert.equal(await page.evaluate(() => TODAY), '2026-11-12', 'the app is still on the day before');
      await page.locator('.tabbar button[data-tab="today"]').tap();
      await page.locator('#qWeight').fill('84.4');
      await clock.runFor(800);
      assert.deepEqual(await page.evaluate(() => [S.weights['2026-11-12'], S.weights['2026-11-11']]), [84.4, null].map((x) => x ?? undefined));
    },
  },
  {
    name: 'with a signal too weak to carry anything, the app still opens from its stored copy',
    async run({ open, server }) {
      const { page } = await open({ state: v2State(), sw: true });
      await precached(page);
      server.stall();                                                          // connected, but nothing gets through
      await page.reload({ timeout: 12000 });
      await page.locator('#ro-today').waitFor({ timeout: 5000 });
      assert.match(await page.locator('#dayline').innerText(), /day 3 of 91/i);
    },
  },
  {
    name: 'a server error page never replaces the stored app',
    async run({ open, server }) {
      const { page } = await open({ state: v2State(), sw: true });
      await precached(page);
      server.status(503);
      await page.reload({ timeout: 12000 });
      await page.locator('#ro-today').waitFor({ timeout: 5000 });
      server.up();                                                             // and the next good answer is still taken
      await page.reload();
      await page.locator('#ro-today').waitFor();
    },
  },
  {
    name: 'a new block does not re-judge the days of the block before it',
    async run({ open }) {
      const core = ['protein', 'steps', 'sleep'];
      const state = v2State({
        profile: { start: TODAY },                                             // the next block was started today
        blocks: [{ program: 'vtaper', name: 'V-Taper', dpw: 5, start: '2026-08-10', end: '2026-11-08', done: 50, planned: 65 }],
        plans: [{ from: '2026-08-10', program: 'vtaper', dpw: 5, days: [1, 2, 3, 4, 5] }, { from: TODAY, program: 'vtaper', dpw: 5, days: [1, 2, 3, 4, 5] }],
        // Fri 6 Nov was a lifting day of the old block and its session was never done
        checks: { '2026-11-10': core, '2026-11-09': core, '2026-11-08': core, '2026-11-07': core, '2026-11-06': core, '2026-11-05': core.concat(['session']), '2026-11-04': core.concat(['session']) },
      });
      const { page } = await open({ state });
      await page.locator('#ro-today').waitFor();
      assert.equal(await page.evaluate(() => streak()), 4, 'the missed session of the old block stopped counting');
    },
  },
  {
    name: 'Erase everything in one copy of the app empties the other open copy too',
    async run({ open, env }) {
      const a = await open({ state: v2State({ logs: { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] } }) });
      await a.page.locator('#ro-today').waitFor();
      const b = await a.context.newPage();                                     // the installed app, open next to the browser tab
      await b.clock.install({ time: new Date(NOW) });
      await b.goto(env.base);
      await b.locator('#ro-today').waitFor();
      await a.page.locator('#btnSet').tap();
      await a.page.locator('#btnWipe').tap();
      await a.page.locator('#btnWipe').tap();
      await a.page.locator('#setup.on').waitFor();
      await b.locator('#setup.on').waitFor({ timeout: 6000 });                 // the other copy must let go of the old data
      await b.waitForTimeout(500);
      const left = await b.evaluate(() => localStorage.getItem('forge90_v2'));
      assert.ok(!left || !JSON.parse(left).logs.squat, 'the other copy wrote the erased data back');
    },
  },
  {
    name: 'moving the start date moves the plan with it',
    async run({ open }) {
      const state = v2State({
        profile: { program: 'build', dpw: 4, days: [1, 2, 4, 5], start: '2026-11-16' },      // the next block was set to start next Monday
        blocks: [{ program: 'vtaper', name: 'V-Taper', dpw: 5, start: '2026-08-10', end: '2026-11-08', done: 50, planned: 65 }],
        plans: [{ from: '2026-08-10', program: 'vtaper', dpw: 5, days: [1, 2, 3, 4, 5] }, { from: '2026-11-16', program: 'build', dpw: 4, days: [1, 2, 4, 5] }],
      });
      const { page } = await open({ state });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnSet').tap();
      await page.locator('#f-start').fill(TODAY);                              // "you can change that date in Settings"
      assert.equal(await page.evaluate(() => planOn(TODAY).program), 'build', 'today is still judged by the old plan');
      assert.equal(await page.evaluate(() => { const i = infoForDate(TODAY); return i.type; }), 'cardio', 'Wednesday is not a lifting day on the new plan');
      assert.equal(await page.evaluate(() => planOn('2026-11-06').program), 'vtaper', 'the past changed plan');
    },
  },
  {
    name: 'what a still-open copy of the earlier version logged after the update is not lost',
    async run({ open }) {
      const late = v1State({ logs: { squat: [{ d: '2026-11-10', sets: sets(80, [8, 8, 7]) }] }, weights: { '2026-11-10': 87.9 }, ui: { theme: 'dark', diet: 'train', helpSeen: 1, savedAt: nowMs - 3600000 } });
      const converted = v2State({ profile: { sex: 'm', age: 23, h: 180, w: 88 }, ui: { theme: 'dark', diet: 'train', helpSeen: 1, v1At: nowMs - DAY, savedAt: nowMs - 7200000 }, weights: { '2026-11-09': 88.2 } });
      const { page, errors } = await open({ state: converted, extra: { forge90_v1: JSON.stringify(late) } });
      await page.locator('#ro-today').waitFor();
      assert.deepEqual(await page.evaluate(() => S.logs.squat && S.logs.squat[0].sets.map((s) => s.r)), [8, 8, 7], 'the session logged in the old copy is gone');
      assert.deepEqual(await page.evaluate(() => [S.weights['2026-11-09'], S.weights['2026-11-10']]), [88.2, 87.9]);
      assert.equal(await page.evaluate(() => localStorage.getItem('forge90_v1')), JSON.stringify(late), 'the old copy was written to');
      assert.equal((await stored(page)).ui.v1At, nowMs - 3600000, 'the same old data would be folded in again at every start');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'names of built-in things in saved data never stop the app',
    async run({ open }) {
      const odd = {
        v: 2,
        profile: { sex: 'm', age: 30, h: 175, w: 80, act: 1.45, goal: 'cut', program: 'toString', dpw: 5, days: [1, 2, 3, 4, 5], start: '2026-11-09', setup: true },
        plans: [{ from: '2026-11-09', program: 'toString', dpw: 5, days: [1, 2, 3, 4, 5] }, { from: '2026-11-10', program: 'valueOf', dpw: 3, days: [1, 3, 5] }],
        swaps: { 'vtaper/5/0/0': 'toString', 'vtaper/5/2/0': 'hasOwnProperty' },
        logs: { toString: [{ d: '2026-11-10', sets: [{ w: 1, r: 1 }] }], valueOf: [{ d: '2026-11-10', sets: [{ w: 1, r: 1 }] }], squat: [{ d: '2026-11-10', sets: [{ w: 60, r: 8 }] }] },
        ui: { theme: 'dark', diet: 'train', helpSeen: 1, rest: { id: 'toString', set: 0, end: nowMs + 60000, total: 90000, slot: '0.0' } },
      };
      const { page, errors } = await open({ extra: { forge90_v2: JSON.stringify(odd) } });
      await page.locator('#ro-today').waitFor();
      assert.equal(await page.evaluate(() => S.profile.program), 'vtaper');
      for (const t of ['train', 'plan', 'fuel', 'prog', 'today']) await page.locator('.tabbar button[data-tab="' + t + '"]').tap();
      assert.match(await page.locator('#prTable').innerText(), /Back Squat/);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a restore that cannot be saved leaves the app as it was, and says so',
    async run({ open }) {
      const file = path.join(ROOT, 'tests', '.out', 'v2-backup.json');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(v2State({ logs: { pullup: [{ d: '2026-11-03', sets: sets(0, [6, 5, 4]) }] } })));
      const { page } = await open({ state: v2State({ logs: { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] } }) });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnSet').tap();
      await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
      const chooser = page.waitForEvent('filechooser');
      await page.locator('#btnImport').tap();
      await (await chooser).setFiles(file);
      await page.waitForFunction(() => /not|could/i.test(document.querySelector('#btnImport').textContent));
      assert.match(await page.locator('#btnImport').innerText(), /sav|stor/i, 'the message blames the file, not the storage');
      assert.deepEqual(await page.evaluate(() => [!!S.logs.squat, !!S.logs.pullup]), [true, false], 'the app half-switched to the backup');
    },
  },
  {
    name: 'sessions the earlier version logged in a deload week are not the reference for the next one',
    async run({ open }) {
      // a block that began on Mon 5 Oct: week 6, a deload, is 9 to 15 Nov
      const old = v1State({ profile: { start: '2026-10-05', split: 'five' }, logs: { inclineBB: [{ d: '2026-11-02', sets: sets(60, [8, 8, 7, 6]) }, { d: '2026-11-09', sets: sets(54, [8, 8, 8]) }] } });
      const { page } = await open({ state: old });
      await page.locator('#ro-today').waitFor();
      assert.deepEqual(await page.evaluate(() => S.logs.inclineBB.map((e) => !!e.dl)), [false, true]);
      assert.equal(await page.evaluate(() => prevSession('inclineBB').d), '2026-11-02');
      assert.deepEqual(await page.evaluate(() => S.logs.inclineBB[1].sets.map((s) => [s.w, s.r])), [[54, 8], [54, 8], [54, 8]], 'the numbers changed');
    },
  },
  {
    name: 'inside claude.ai: a second device gets its data, not the set-up screen',
    async run({ open }) {
      const remote = v2State({ profile: { start: '2026-09-14' }, logs: { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] }, ui: { theme: 'dark', diet: 'train', helpSeen: 1, savedAt: nowMs - 3600000 } });
      const { page, errors } = await open({ extra: { __cloud_doc: JSON.stringify(remote) }, init: FAKE_CLOUD });
      await page.waitForFunction(() => typeof CLOUD === 'object' && CLOUD.status === 'synced');
      assert.equal(await page.locator('#setup.on').count(), 0, 'the set-up screen is still over the restored data');
      assert.equal(await page.evaluate(() => S.profile.start), '2026-09-14');
      assert.ok(await page.evaluate(() => !!S.logs.squat));
      assert.match(await page.locator('#dayline').innerText(), /day 59 of 91/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'inside claude.ai: Erase everything erases the cloud copy and it does not come back',
    async run({ open }) {
      const state = v2State({ logs: { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] }, ui: { theme: 'dark', diet: 'train', helpSeen: 1, savedAt: nowMs - 3600000 } });
      const { page } = await open({ state, extra: { __cloud_doc: JSON.stringify(state) }, init: FAKE_CLOUD });
      await page.waitForFunction(() => typeof CLOUD === 'object' && CLOUD.status === 'synced');
      await page.locator('#checklist [data-chk="water"]').tap();               // something unsaved is on its way to the cloud
      await page.locator('#btnSet').tap();
      await page.locator('#btnWipe').tap();
      await page.locator('#btnWipe').tap();
      await page.locator('#setup.on').waitFor();
      await page.waitForFunction(() => typeof CLOUD === 'object' && CLOUD.status === 'synced');
      await page.waitForTimeout(300);
      assert.equal(await cloudDoc(page), null, 'the erased data was uploaded again as the page closed');
      assert.equal(await page.evaluate(() => Object.keys(S.logs).length), 0);
      assert.equal(await page.locator('#setup.on').count(), 1);
    },
  },
  {
    name: 'inside claude.ai: a device that was away for a week takes the newer copy instead of overwriting it',
    async run({ open }) {
      const stale = v2State({ ui: { theme: 'dark', diet: 'train', helpSeen: 1, savedAt: nowMs - 7 * DAY, auto: { d: '2026-11-04', k: ['steps'], off: [] }, rest: { id: 'squat', set: 0, end: nowMs - 6 * DAY, total: 180000, slot: '2.0' } } });
      const fresh = v2State({ logs: { squat: [{ d: '2026-11-10', sets: sets(82.5, [8, 8, 7]) }] }, ui: { theme: 'dark', diet: 'train', helpSeen: 1, savedAt: nowMs - DAY } });
      const { page } = await open({ state: stale, extra: { __cloud_doc: JSON.stringify(fresh) }, init: FAKE_CLOUD });
      await page.waitForFunction(() => typeof CLOUD === 'object' && CLOUD.status === 'synced');
      await page.waitForTimeout(2200);                                         // long enough for a queued upload to run
      assert.ok(await page.evaluate(() => !!S.logs.squat), 'the week of logs on the other device was not picked up');
      assert.ok((await cloudDoc(page)).logs.squat, 'the stale device overwrote the newer cloud copy');
    },
  },
];
