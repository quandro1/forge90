// A history for every lift (best set, a graph, every session) and a "new best" line when a set beats the past.
// Built on 12 Nov 2026 from the research into what would improve the app.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
const blk = 'details[data-dayblock="2"] ';            // Wednesday of the V-Taper week: the leg day
const squat3 = [
  { d: '2026-10-21', sets: sets(75, [8, 8, 7]) },
  { d: '2026-10-28', sets: sets(77.5, [8, 7, 6]) },
  { d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) },
];
// block started 19 Oct: Wed 11 Nov is in week 4, not a deload week
const state = (logs, over) => v2State(Object.assign({ logs, profile: { start: '2026-10-19' } }, over || {}));
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
  return page.locator(blk + '.ex[data-ex="' + id + '"]');
};
const pb = (page, id) => page.locator(blk + '.logger[data-log="' + id + '"] .pbline');

export default [
  {
    name: 'the logbook of a lift with history opens its history: best set, a graph and every session',
    async run({ open }) {
      const { page, errors } = await open({ state: state({ squat: squat3 }), hash: 'train' });
      const card = await openToday(page, 'squat');
      const btn = card.locator('.logger [data-hist]');
      assert.equal(await btn.count(), 1, 'the logbook has no way to its history');
      assert.ok(await btn.evaluate((b) => b.checkVisibility() && b.getBoundingClientRect().height >= 24), 'the History control is not on screen');
      await btn.tap();
      await page.locator('#sheet.on').waitFor();
      assert.match(await page.locator('#sheetTitle').innerText(), /back squat/i);
      const body = page.locator('#sheetBody');
      const text = await body.innerText();
      assert.match(text, /best so far:? 80 kg × 8/i);
      assert.match(text, /wed 4 nov/i);
      assert.match(text, /first session:? 75 kg × 8/i);
      // the estimate is a sentence with its warning, never a headline number
      assert.match(text, /estimated best single:? about 101\.5 kg/i);
      assert.match(text, /guide/i, 'the estimate carries no warning');
      const g = await body.evaluate((el) => {
        const svg = el.querySelector('svg.lchart'); if (!svg) return null;
        const pts = Array.from(svg.querySelectorAll('circle.pt')).map((c) => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r') }));
        return { pts, line: !!svg.querySelector('path.trend'), label: svg.getAttribute('aria-label') || '', big: Array.from(el.querySelectorAll('*')).filter((n) => /101\.5/.test(n.textContent) && n.children.length === 0 && parseFloat(getComputedStyle(n).fontSize) > 16).length };
      });
      assert.ok(g, 'no graph');
      assert.equal(g.pts.length, 3, 'one point for each session');
      assert.ok(g.line, 'the points are not joined');
      assert.ok(g.pts[0].x < g.pts[1].x && g.pts[1].x < g.pts[2].x, 'the sessions do not run left to right');
      assert.ok(g.pts[0].y > g.pts[1].y && g.pts[1].y > g.pts[2].y, 'a heavier best set is not drawn higher');
      assert.ok(g.pts.every((p) => p.r >= 4), 'the points are too small');
      assert.match(g.label, /squat/i);
      assert.equal(g.big, 0, 'the estimate is set in large type');
      const rows = await body.locator('table tbody tr').allInnerTexts();
      assert.equal(rows.length, 3);
      assert.match(rows[0], /4 nov/i); assert.match(rows[0], /80×8/);
      assert.match(rows[2], /21 oct/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'on a small phone the way into the history stays inside the logbook, and the sheet does not scroll sideways',
    async run({ open }) {
      const { page } = await open({ state: state({ squat: squat3 }), hash: 'train', device: 'iPhone SE' });
      const card = await openToday(page, 'squat');
      const r = await card.evaluate((el) => {
        const lg = el.querySelector('.logger'), right = lg.getBoundingClientRect().right, b = lg.querySelector('[data-hist]').getBoundingClientRect();
        return { over: Array.from(lg.querySelectorAll('.lh *')).filter((n) => n.getBoundingClientRect().right > right + 0.5).length, h: b.height, w: b.width };
      });
      assert.equal(r.over, 0, r.over + ' parts of the logbook header stick out');
      assert.ok(r.h >= 28 && r.w >= 100, 'the History control is ' + Math.round(r.w) + ' x ' + Math.round(r.h) + ' px');
      await card.locator('.logger [data-hist]').tap();
      await page.locator('#sheet.on svg.lchart').waitFor();
      const s = await page.evaluate(() => {
        const body = document.querySelector('#sheetBody'), svg = body.querySelector('svg.lchart').getBoundingClientRect(), bb = body.getBoundingClientRect();
        return { wide: body.scrollWidth > body.clientWidth + 1, inside: svg.left >= bb.left - 0.5 && svg.right <= bb.right + 0.5, page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      });
      assert.equal(s.wide, false, 'the history sheet scrolls sideways');
      assert.ok(s.inside, 'the graph sticks out of the sheet');
      assert.equal(s.page, false, 'the page scrolls sideways');
    },
  },
  {
    name: 'tapping a point of the graph names that session',
    async run({ open }) {
      const { page } = await open({ state: state({ squat: squat3 }), hash: 'train' });
      const card = await openToday(page, 'squat');
      await card.locator('.logger [data-hist]').tap();
      const body = page.locator('#sheetBody');
      await body.locator('svg.lchart').waitFor();
      assert.match(await body.locator('#histRead').innerText(), /4 nov/i, 'the readout does not start on the latest session');
      const hit = body.locator('svg.lchart [data-pt="0"]');
      assert.ok(await hit.evaluate((c) => c.getBoundingClientRect().width >= 24), 'the tap target of a point is under 24 px');
      await hit.tap();
      const read = await body.locator('#histRead').innerText();
      assert.match(read, /21 oct/i); assert.match(read, /75 kg × 8/);
    },
  },
  {
    name: 'a lift with no history has no History control, and one session shows the sheet without a graph',
    async run({ open }) {
      const a = await open({ state: state({}), hash: 'train' });
      const none = await openToday(a.page, 'legpress');
      assert.equal(await none.locator('[data-hist]').count(), 0, 'a History control on a lift that was never logged');
      await a.context.close();
      const b = await open({ state: state({ legpress: [{ d: '2026-11-04', sets: sets(120, [12, 11, 10]) }] }), hash: 'train' });
      const one = await openToday(b.page, 'legpress');
      await one.locator('.logger [data-hist]').tap();
      const text = await b.page.locator('#sheetBody').innerText();
      assert.match(text, /best so far:? 120 kg × 12/i);
      assert.match(text, /one session so far/i);
      assert.equal(await b.page.locator('#sheetBody svg.lchart').count(), 0);
      // sets of more than 10 reps give no estimate of a single
      assert.doesNotMatch(text, /estimated best single/i);
      assert.deepEqual(b.errors, []);
    },
  },
  {
    name: 'the Strength log opens the same history, and both screens name the same best set',
    async run({ open }) {
      const { page } = await open({ state: state({ squat: squat3 }), hash: 'prog' });
      const row = page.locator('#prTable tbody tr', { hasText: 'Back Squat' });
      assert.match(await row.innerText(), /80 kg × 8/);
      await row.locator('[data-hist]').tap();
      await page.locator('#sheet.on').waitFor();
      assert.match(await page.locator('#sheetBody').innerText(), /best so far:? 80 kg × 8/i);
    },
  },
  {
    name: 'a ticked set that beats every earlier session is called a new best, and nothing else is',
    async run({ open }) {
      const { page, errors, clock } = await open({ state: state({ squat: squat3 }), hash: 'train' });
      await openToday(page, 'squat');
      assert.equal(await pb(page, 'squat').count(), 0, 'a new best before anything was lifted');
      // the day's only set so far is lighter with more reps: the rule is weight first, so not a new best
      await typeSet(page, 'squat', 0, 70, 12); await tick(page, 'squat', 0); await clock.runFor(300);
      assert.equal(await pb(page, 'squat').count(), 0, 'a lighter set with more reps was called a new best');
      // the same as the best so far: not a new best
      await typeSet(page, 'squat', 1, 80, 8); await tick(page, 'squat', 1); await clock.runFor(300);
      assert.equal(await pb(page, 'squat').count(), 0, 'equalling the best was called a new best');
      // one more rep at the best weight: a new best, and it names what it beat
      await typeSet(page, 'squat', 2, 80, 9); await tick(page, 'squat', 2); await clock.runFor(300);
      assert.equal(await pb(page, 'squat').count(), 1, 'one more rep at the best weight was not announced');
      let t = await pb(page, 'squat').innerText();
      assert.match(t, /new best/i); assert.match(t, /80 kg × 9/); assert.match(t, /80 kg × 8/);
      // heavier: the line follows
      await typeSet(page, 'squat', 3, 82.5, 5); await tick(page, 'squat', 3); await clock.runFor(300);
      t = await pb(page, 'squat').innerText();
      assert.match(t, /82\.5 kg × 5/);
      // both taken back: no new best is left standing
      await page.locator(blk + '.logger[data-log="squat"] [data-del="3"]').tap();
      await page.locator(blk + '.logger[data-log="squat"] [data-del="2"]').tap();
      assert.equal(await pb(page, 'squat').count(), 0, 'the line stayed after the sets were cleared');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a first session, a row only copied from last time, and a typed slip are not new bests',
    async run({ open }) {
      const { page, clock } = await open({ state: state({ squat: squat3 }), hash: 'train' });
      // a lift with no history: nothing to beat
      await openToday(page, 'legpress');
      await typeSet(page, 'legpress', 0, 200, 12); await tick(page, 'legpress', 0); await clock.runFor(300);
      assert.equal(await pb(page, 'legpress').count(), 0, 'a first session was called a new best');
      // rows filled in by "Same as last time" are a plan until they are ticked
      await openToday(page, 'squat');
      await page.locator(blk + '.logger[data-log="squat"] [data-repeat]').tap();
      assert.equal(await pb(page, 'squat').count(), 0, 'rows copied from last time were called a new best');
      // 800 typed for 80 and ticked, then corrected: the line goes with the slip
      await typeSet(page, 'squat', 0, 800, 8); await tick(page, 'squat', 0); await clock.runFor(300);
      assert.equal(await pb(page, 'squat').count(), 1);
      await typeSet(page, 'squat', 0, 80, 8); await tick(page, 'squat', 1); await clock.runFor(300);
      assert.equal(await pb(page, 'squat').count(), 0, 'the line stayed after the slip was corrected');
    },
  },
];
