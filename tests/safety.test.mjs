// Data safety: a second copy of the app, damaged or newer data, a failed write,
// plan changes that must not rewrite the past, the training day, session done.
import assert from 'node:assert/strict';
import { v1State, NOW } from './harness.mjs';
import { openCard, typeSet, tick } from './timer.test.mjs';

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('forge90_v2')));
const hide = (page) => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});
const show = (page) => page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
});
const base = (over) => v1State(Object.assign({ profile: { start: '2026-10-19', split: 'five' } }, over));
const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();

export default [
  {
    name: 'a second, stale copy of the app never overwrites what the other copy logged',
    async run({ open, env }) {
      const a = await open({ state: base() });                       // copy A: opened first, then left alone
      await a.page.locator('#ro-today').waitFor();
      const b = await a.context.newPage();                           // copy B: same phone, same storage
      await b.clock.install({ time: new Date(NOW) });
      await b.goto(env.base + '#train');
      await openCard(b, 0, 'inclineBB');
      await typeSet(b, 'inclineBB', 0, 60, 8);
      await tick(b, 'inclineBB', 0);
      await b.waitForTimeout(400);
      assert.equal((await stored(b)).logs.inclineBB[0].sets[0].r, 8);

      await hide(a.page);                                            // A changed nothing and goes to the background
      assert.ok((await stored(b)).logs.inclineBB, 'the stale copy wiped the set logged in the other copy');

      await show(a.page);                                            // A comes back: it must now know about the set
      await a.page.waitForFunction(() => S.logs.inclineBB && S.logs.inclineBB[0].sets[0].r === 8);
      await a.page.locator('#checklist [data-chk="water"]').tap();   // and A's own change must not cost B's
      await a.page.waitForTimeout(400);
      const s = await stored(b);
      assert.equal(s.logs.inclineBB[0].sets[0].r, 8, "B's set was lost when A saved");
      assert.ok(s.checks['2026-11-11'].includes('water'), "A's tick was not saved");
    },
  },
  {
    name: 'two copies that both changed something keep both changes',
    async run({ open, env }) {
      const a = await open({ state: base() });
      await a.page.locator('#ro-today').waitFor();
      const b = await a.context.newPage();
      await b.clock.install({ time: new Date(NOW) });
      await b.goto(env.base + '#train');
      await openCard(b, 0, 'inclineBB');
      await typeSet(b, 'inclineBB', 0, 60, 8);
      await b.waitForTimeout(400);
      // A never noticed B's write: it edits and saves from its own old state
      await a.page.evaluate(() => { window.removeEventListener('storage', onStorage); });
      await a.page.locator('#qWeight').fill('86.2');
      await a.page.waitForTimeout(400);
      const s = await stored(b);
      assert.equal(s.weights['2026-11-11'], 86.2);
      assert.equal(s.logs.inclineBB && s.logs.inclineBB[0].sets[0].r, 8, "B's set was lost");
    },
  },
  {
    name: 'data that cannot be read is kept aside, not overwritten',
    async run({ open }) {
      const { page, errors } = await open({ extra: { forge90_v2: '{"v":2,"logs":{"squat":[{"d":"2026-11-0' } });
      await page.locator('#ro-today').waitFor();
      await page.locator('#checklist [data-chk="water"]').tap();
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => localStorage.getItem('forge90_v2_damaged')), '{"v":2,"logs":{"squat":[{"d":"2026-11-0');
      await page.locator('#btnSet').tap();
      assert.equal(await page.locator('#damagedNote').count(), 1, 'nothing tells the user a damaged copy was kept');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'data saved by a newer version of the app is never overwritten by this one',
    async run({ open }) {
      const newer = JSON.stringify({ v: 3, profile: { start: '2026-10-19', program: 'somethingNew', dpw: 6 }, logs: { squat: [{ d: '2026-11-10', sets: [{ w: 100, r: 5 }] }] }, future: { x: 1 } });
      const { page, errors } = await open({ extra: { forge90_v2: newer } });
      await page.locator('#ro-today').waitFor();
      assert.ok(await page.locator('#verBar.on').count(), 'no notice that the app is older than the data');
      await page.locator('#checklist [data-chk="water"]').tap();
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => localStorage.getItem('forge90_v2')), newer, 'newer data was overwritten');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a failed save is announced, with a way to export',
    async run({ open }) {
      const { page } = await open({ state: base() });
      await page.locator('#ro-today').waitFor();
      await page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
      await page.locator('#checklist [data-chk="water"]').tap();
      await page.locator('#saveBar.on').waitFor({ timeout: 3000 });
      assert.match(await page.locator('#saveBar').innerText(), /not sav/i);
      assert.equal(await page.locator('#saveBar [data-export]').count(), 1);
    },
  },
  {
    name: 'changing the days a week does not rewrite the past (streak and sessions done stay)',
    async run({ open }) {
      const checks = {};
      for (let d = new Date(2026, 9, 19); d < new Date(2026, 10, 11); d.setDate(d.getDate() + 1)) {
        const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        checks[k] = [1, 2, 4, 5].includes(d.getDay()) ? ['protein', 'steps', 'sleep', 'session'] : ['protein', 'steps', 'sleep'];
      }
      const { page } = await open({ state: v1State({ profile: { start: '2026-10-19', split: 'four' }, checks }) });
      await page.locator('#ro-today').waitFor();
      const past = () => page.evaluate(() => {
        let lift = 0, done = 0;
        for (let i = 1; i < todayIndex(); i++) { const d = dayInfo(i); if (d.type === 'lift') { lift++; if (sessionDone(d.date)) done++; } }
        return { streak: streak(), lift, done };
      });
      const before = await past();
      assert.deepEqual(before, { streak: 23, lift: 14, done: 14 });
      await tab(page, 'train');
      await page.locator('#splitSeg [data-dpw="5"]').tap();
      assert.equal(await page.evaluate(() => S.profile.dpw), 5);
      assert.deepEqual(await past(), before, 'the past was re-judged when the plan changed');
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 5);
      assert.equal(await page.evaluate(() => dayInfo(todayIndex()).session.name), 'Quads & Core', 'from today the new plan applies');
    },
  },
  {
    name: 'the training day runs from 3 am to 3 am: a session past midnight stays on its day',
    async run({ open }) {
      const a = await open({ state: base(), now: '2026-11-12T01:30:00' });
      await a.page.locator('#ro-today').waitFor();
      assert.equal(await a.page.evaluate(() => TODAY), '2026-11-11');
      await a.context.close();
      const b = await open({ state: base(), now: '2026-11-12T03:30:00' });
      await b.page.locator('#ro-today').waitFor();
      assert.equal(await b.page.evaluate(() => TODAY), '2026-11-12');
    },
  },
  {
    name: 'the session counts as done when most of its exercises have a logged set, without pressing anything',
    async run({ open }) {
      const { page } = await open({ state: base(), hash: 'train' });   // Wed 11 Nov = day 3 of the week = Legs (7 exercises)
      const ids = ['squat', 'legpress', 'legext', 'legcurl', 'calf'];
      for (const id of ids) {
        await page.locator('details[data-dayblock="2"] .ex[data-ex="' + id + '"] .ex-h').click();
        await tick(page, id, 0);
        const done = await page.evaluate(() => (S.checks[TODAY] || []).includes('session'));
        assert.equal(done, id === 'calf', 'after ' + id + ': done=' + done);
      }
    },
  },
  {
    name: 'saving one exercise does not mark the whole session done',
    async run({ open }) {
      const { page } = await open({ state: base(), hash: 'train' });
      await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
      await typeSet(page, 'squat', 0, 80, 8);
      await page.locator('.logger[data-log="squat"] [data-savelog]').first().tap();
      assert.equal(await page.evaluate(() => (S.checks[TODAY] || []).includes('session')), false);
      assert.match(await page.locator('.logger[data-log="squat"] [data-savelog]').first().innerText(), /saved/i);
    },
  },
];
