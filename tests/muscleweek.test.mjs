// "Muscles this week" in Progress: sets per muscle so far this week, on the body, against what the plan asks for.
// A set counts 1 for a lift's main muscle and half for a helper (the rule tools/validate.mjs counts by).
// Built on 12 Nov 2026 from the research into what would improve the app.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
// block started Mon 19 Oct 2026: Wed 11 Nov is in week 4 (Mon 9 to Sun 15 Nov), not a deload week
const week4 = (logs, over) => v2State(Object.assign({ logs, profile: { start: '2026-10-19' } }, over || {}));
const thisWeek = {
  inclineDB: [{ d: '2026-11-09', sets: sets(24, [10, 9, 9, 8]) }],                       // upper chest 4; chest, front delts, triceps 2 each
  pulldown: [{ d: '2026-11-10', sets: sets(55, [12, 11, 10]) }],                         // lats 3; biceps, mid-back, rear delts 1.5 each
  squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }],                            // last week: must not count
};
const card = (page) => page.locator('#muscleWeek .card');
const contrastFn = `(a, b) => {
  const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d', { willReadFrequently: true });
  const lum = (col) => { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = col; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]); };
  return [lum(a), lum(b)];
}`;

export default [
  {
    name: 'this week\'s sets are counted per muscle: a main muscle a whole set, a helper half, last week not at all',
    async run({ open }) {
      const { page, errors } = await open({ state: week4(thisWeek), hash: 'prog' });
      await card(page).waitFor({ timeout: 8000 });
      const done = await page.evaluate(() => weekDone(weekSpan().dates));
      assert.deepEqual(done, { uchest: 4, chest: 2, fdelt: 2, triceps: 2, lats: 3, biceps: 1.5, midback: 1.5, rdelt: 1.5 });
      const text = await card(page).innerText();
      assert.match(text, /muscles this week/i);
      assert.match(text, /week 4/i);
      assert.match(text, /7 sets/i, 'the card does not say how many sets were logged this week');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a set ticked in Train shows on the body in Progress',
    async run({ open }) {
      const { page, clock } = await open({ state: week4(thisWeek), hash: 'train' });
      const blk = 'details[data-dayblock="2"] ';
      await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
      await page.locator(blk + '.logger[data-log="squat"]').waitFor();
      await typeSet(page, 'squat', 0, 80, 8); await tick(page, 'squat', 0); await clock.runFor(300);
      await page.locator('.tabbar button[data-tab="prog"]').tap();
      await card(page).waitFor({ timeout: 8000 });
      const r = await page.evaluate(() => ({
        quads: weekDone(weekSpan().dates).quads,
        lit: Array.from(document.querySelectorAll('#muscleWeek svg.body .mz')).filter((p) => (p.dataset.z || '').split(' ').includes('quads')).map((p) => p.className.baseVal),
      }));
      assert.equal(r.quads, 1);
      assert.ok(r.lit.length >= 2 && r.lit.every((c) => /\bv1\b/.test(c)), 'the quads are not shaded after a set: ' + r.lit.join(' | '));
      assert.match(await card(page).innerText(), /8 sets/i);
    },
  },
  {
    name: 'the body is shaded in three steps by sets, and a muscle with none stays grey',
    async run({ open }) {
      const logs = Object.assign({}, thisWeek, {
        pullup: [{ d: '2026-11-10', sets: sets(0, [8, 7, 6, 5]) }],                        // lats +4, biceps +2, mid-back +2, rear delts +2
        dbRow: [{ d: '2026-11-10', sets: sets(26, [10, 10, 9, 9]) }],                       // lats +4, mid-back +2, biceps +2, rear delts +2
      });
      for (const theme of ['dark', 'light']) {
        const { page } = await open({ state: week4(logs, { ui: { theme } }), hash: 'prog' });
        await card(page).waitFor({ timeout: 8000 });
        const r = await page.evaluate((src) => {
          const lum = (0, eval)(src);
          const cls = (z) => { const p = Array.from(document.querySelectorAll('#muscleWeek svg.body .mz')).find((x) => (x.dataset.z || '').split(' ').includes(z)); return p ? p.className.baseVal : null; };
          const fill = (sel) => { const p = document.querySelector('#muscleWeek svg.body ' + sel); return p ? getComputedStyle(p).fill : null; };
          const L = (a) => lum(a, a)[0];
          return {
            done: weekDone(weekSpan().dates),
            lats: cls('lats'), midback: cls('midback'), uchest: cls('uchest'), quads: cls('quads'),
            lum: [L(fill('.mz:not(.v1):not(.v2):not(.v3)')), L(fill('.mz.v1')), L(fill('.mz.v2')), L(fill('.mz.v3'))],
            key: Array.from(document.querySelectorAll('#muscleWeek .mw-key span')).map((s) => s.textContent.trim()),
            figs: document.querySelectorAll('#muscleWeek svg.body').length,
          };
        }, contrastFn);
        assert.equal(r.done.lats, 11); assert.equal(r.done.midback, 5.5);
        assert.match(r.lats, /\bv3\b/, theme + ': 11 sets is not the strongest step');
        assert.match(r.midback, /\bv2\b/, theme + ': 5.5 sets is not the middle step');
        assert.match(r.uchest, /\bv1\b/, theme + ': 4 sets is not the first step');
        assert.doesNotMatch(r.quads, /\bv[123]\b/, theme + ': a muscle with no sets is shaded');
        assert.equal(r.figs, 2, theme + ': the card should show the front and the back');
        // one colour in steps: every step further from the unshaded muscle than the one before, and the first step clearly not grey
        const [off, a, b, c] = r.lum, dir = Math.sign(c - off);
        assert.ok(dir * (a - off) > 0 && dir * (b - a) > 0 && dir * (c - b) > 0, theme + ': the steps are not in order: ' + r.lum.map((x) => x.toFixed(3)).join(', '));
        const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
        assert.ok(ratio(a, off) >= 1.8, theme + ': the first step against an unshaded muscle is ' + ratio(a, off).toFixed(2) + ':1');
        assert.ok(ratio(b, a) >= 1.25 && ratio(c, b) >= 1.25, theme + ': two steps are too close: ' + ratio(b, a).toFixed(2) + ', ' + ratio(c, b).toFixed(2));
        assert.deepEqual(r.key, ['none', 'under 5', '5 to 9', '10 or more']);
      }
    },
  },
  {
    name: 'what the plan asks for this week is read from the plan of each day, with one set fewer in a deload week',
    async run({ open }) {
      for (const [start, wk, deload] of [['2026-10-19', 4, false], ['2026-10-05', 6, true]]) {
        const { page } = await open({ state: v2State({ logs: thisWeek, profile: { start } }), hash: 'prog' });
        await card(page).waitFor({ timeout: 8000 });
        const r = await page.evaluate(() => ({
          week: infoForDate(TODAY).week, deload: infoForDate(TODAY).deload,
          planned: weekPlanned(weekSpan().dates),
          items: sessions().map((s) => s.items.map((it) => ({ ex: it.ex, sets: it.sets, prim: EX[it.ex].prim, sec: EX[it.ex].sec || [] }))),
        }));
        assert.equal(r.week, wk); assert.equal(r.deload, deload);
        // the same sum, worked out here from the plan's own list
        const want = {};
        for (const s of r.items) for (const it of s) {
          const n = deload ? Math.max(2, it.sets - 1) : it.sets;
          for (const z of it.prim) want[z] = (want[z] || 0) + n;
          for (const z of it.sec) if (!it.prim.includes(z)) want[z] = (want[z] || 0) + n * 0.5;
        }
        assert.deepEqual(r.planned, want, 'week ' + wk);
        assert.ok(Object.keys(want).length >= 12, 'the plan names only ' + Object.keys(want).length + ' muscles');
      }
    },
  },
  {
    name: 'a muscle the plan trains this week that has no set yet is named, and the list gives done against planned',
    async run({ open }) {
      const { page } = await open({ state: week4(thisWeek), hash: 'prog' });
      await card(page).waitFor({ timeout: 8000 });
      const text = await card(page).innerText();
      assert.match(text, /not trained yet this week:[^\n]*quads/i);
      assert.doesNotMatch(text.match(/not trained yet this week:[^\n]*/i)[0], /upper chest|lats/i, 'a muscle that was trained is listed as not trained');
      await card(page).locator('details > summary').click();
      const rows = await card(page).locator('.mw-row').evaluateAll((els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
      const planned = await page.evaluate(() => weekPlanned(weekSpan().dates));
      const row = (name) => rows.find((x) => x.toLowerCase().startsWith(name.toLowerCase()));
      assert.match(row('Upper chest'), new RegExp('4 of ' + planned.uchest + '\\b'), row('Upper chest'));
      assert.match(row('Biceps'), new RegExp('1\\.5 of ' + String(planned.biceps).replace('.', '\\.')), row('Biceps'));
      assert.match(row('Quads'), new RegExp('0 of ' + planned.quads + '\\b'), row('Quads'));
      // every bar is a share of what is planned, never wider than its track
      const bars = await card(page).locator('.mw-row .pbar').evaluateAll((els) => els.map((e) => e.firstElementChild.getBoundingClientRect().width / e.getBoundingClientRect().width));
      assert.ok(bars.length >= 10 && bars.every((b) => b >= 0 && b <= 1.001), 'a bar is wider than its track');
    },
  },
  {
    name: 'someone who has never logged a lift sees no card, and outside a block it covers the last seven days',
    async run({ open }) {
      const a = await open({ state: week4({}), hash: 'prog' });
      await a.page.locator('#prTable').waitFor();
      assert.equal(await card(a.page).count(), 0, 'an empty card for someone with no lifts logged');
      await a.context.close();
      const b = await open({ state: v2State({ logs: thisWeek, profile: { start: '2026-12-01' } }), hash: 'prog' });
      await card(b.page).waitFor({ timeout: 8000 });
      const text = await card(b.page).innerText();
      assert.match(text, /last 7 days/i);
      assert.match(text, /7 sets/i, '5 to 11 Nov holds 7 logged sets (the squat of 4 Nov is a day too old): ' + text.slice(0, 120));
    },
  },
  {
    name: 'the card fits a small phone',
    async run({ open }) {
      const { page } = await open({ state: week4(thisWeek), hash: 'prog', device: 'iPhone SE' });
      await card(page).waitFor({ timeout: 8000 });
      await card(page).locator('details > summary').click();
      const r = await card(page).evaluate((el) => {
        const right = el.getBoundingClientRect().right;
        return { over: Array.from(el.querySelectorAll('*')).filter((n) => n.getBoundingClientRect().right > right + 0.5).length, figs: Array.from(el.querySelectorAll('svg.body')).map((s) => Math.round(s.getBoundingClientRect().height)) };
      });
      assert.equal(r.over, 0, r.over + ' parts stick out of the card');
      assert.ok(r.figs.every((h) => h >= 150), 'the figures are ' + r.figs.join(' and ') + ' px tall');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, 'the page scrolls sideways');
    },
  },
];
