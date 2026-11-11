// The logbook and its next-target hint: behaviours found wrong by the 11 Nov 2026 audit.
import assert from 'node:assert/strict';
import { v1State } from './harness.mjs';
import { openCard, typeSet, tick } from './timer.test.mjs';

const hint = (page, id) => page.locator('.logger[data-log="' + id + '"] .verdict').first().innerText();
const sets = (page, id) => page.evaluate((x) => (S.logs[x] || []).find((e) => e.d === TODAY).sets, id);
// week 4 of a block (not a deload week): started Mon 19 Oct 2026, today is Wed 11 Nov
const base = (over) => v1State(Object.assign({ profile: { start: '2026-10-19', split: 'five' } }, over));
const S4 = (w, reps) => reps.map((r) => (r == null ? {} : { w, r, done: 1 }));

export default [
  {
    name: "today's target stays on screen until the session is finished",
    async run({ open }) {
      const st = base({ logs: { inclineBB: [{ d: '2026-11-04', sets: S4(60, [9, 8, 8, 7]) }] } });
      const { page, errors } = await open({ state: st, hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      const before = await hint(page, 'inclineBB');
      assert.match(before, /^Today: same 60 kg/);
      assert.match(before, /set 1 \(9 → 10\)/);
      await typeSet(page, 'inclineBB', 0, 60, 10);
      await tick(page, 'inclineBB', 0);
      const mid = await hint(page, 'inclineBB');
      assert.match(mid, /^Today: same 60 kg/, 'the target for the session in progress was replaced: ' + mid);
      assert.match(mid, /1 of 4 sets done/);
      for (const [i, r] of [[1, 9], [2, 8], [3, 8]]) { await typeSet(page, 'inclineBB', i, 60, r); await tick(page, 'inclineBB', i); }
      assert.match(await hint(page, 'inclineBB'), /^Next session: /);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'an extra lighter set does not cancel an earned increase',
    async run({ open }) {
      const st = base({ logs: { pushdown: [{ d: '2026-11-09', sets: [{ w: 30, r: 15, done: 1 }, { w: 30, r: 15, done: 1 }, { w: 30, r: 15, done: 1 }, { w: 20, r: 12, done: 1 }] }] } });
      const { page } = await open({ state: st, hash: 'train' });
      await openCard(page, 0, 'pushdown');                       // 3 sets prescribed
      const h = await hint(page, 'pushdown');
      assert.match(h, /one plate heavier/, h);
    },
  },
  {
    name: 'a skipped row is named by its real row number',
    async run({ open }) {
      const st = base({ logs: { inclineBB: [{ d: '2026-11-04', sets: [{ w: 60, r: 10, done: 1 }, {}, { w: 60, r: 8, done: 1 }, { w: 60, r: 7, done: 1 }, { w: 60, r: 7, done: 1 }] }] } });
      const { page } = await open({ state: st, hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      const h = await hint(page, 'inclineBB');
      assert.match(h, /set 3 \(8 → 9\)/, h);
    },
  },
  {
    name: 'reps typed on a row with no weight take the weight from the row above',
    async run({ open }) {
      const { page } = await open({ state: base(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      await typeSet(page, 'inclineBB', 0, 60, 8);
      await typeSet(page, 'inclineBB', 1, null, 8);
      await typeSet(page, 'inclineBB', 2, null, 7);
      const s = await sets(page, 'inclineBB');
      assert.equal(s[1].w, 60, 'row 2 was stored without its weight');
      assert.equal(s[2].w, 60);
      assert.equal(await page.locator('.logger[data-log="inclineBB"] input[data-set="1"][data-f="w"]').first().inputValue(), '60');
    },
  },
  {
    name: '"Same as last time" fills empty rows and never overwrites a row that has data',
    async run({ open }) {
      const st = base({ logs: { inclineBB: [{ d: '2026-11-04', sets: S4(60, [9, 8, 8, 7]) }] } });
      const { page } = await open({ state: st, hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      await typeSet(page, 'inclineBB', 0, 62.5, 8);
      await tick(page, 'inclineBB', 0);
      await page.locator('.logger[data-log="inclineBB"] [data-repeat]').first().tap();
      const s = await sets(page, 'inclineBB');
      assert.deepEqual(s[0], { w: 62.5, r: 8, done: 1 }, 'the set already logged today was overwritten');
      // the copied rows are marked as a plan: they count as sets only once ticked or changed
      assert.deepEqual(s.slice(1), [{ pre: 1, w: 60, r: 8 }, { pre: 1, w: 60, r: 8 }, { pre: 1, w: 60, r: 7 }]);
    },
  },
  {
    name: 'a decimal comma is a decimal point, not a tenfold weight',
    async run({ open }) {
      const { page } = await open({ state: base(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      const w = page.locator('.logger[data-log="inclineBB"] input[data-set="0"][data-f="w"]').first();
      await w.pressSequentially('22,5');
      assert.equal((await sets(page, 'inclineBB'))[0].w, 22.5);
      await w.fill('');
      await w.pressSequentially('٢٢٫٥');                          // Arabic-Indic digits and decimal mark
      assert.equal((await sets(page, 'inclineBB'))[0].w, 22.5);
    },
  },
  {
    name: 'a deload week: the logbook says so, the session is marked, and the week after ignores it',
    async run({ open }) {
      // started Mon 5 Oct 2026: Wed 11 Nov is day 38, week 6 = deload
      const logs = { squat: [{ d: '2026-11-04', sets: S4(100, [10, 10, 10, 10]) }] };
      const a = await open({ state: v1State({ profile: { start: '2026-10-05', split: 'five' }, logs }), hash: 'train' });
      await a.page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
      const h = await hint(a.page, 'squat');
      assert.match(h, /deload/i, h);
      assert.match(h, /90 kg/, h);
      for (const i of [0, 1, 2]) { await typeSet(a.page, 'squat', i, 90, 8); await tick(a.page, 'squat', i); }
      const entry = await a.page.evaluate(() => S.logs.squat.find((e) => e.d === TODAY));
      assert.equal(entry.dl, 1, 'the deload session is not marked');
      assert.deepEqual(a.errors, []);
      await a.context.close();

      // one week later (week 7): the reference must be the 100 kg session, not the deload one
      const later = { squat: [logs.squat[0], { d: '2026-11-11', dl: 1, sets: [{ w: 90, r: 8, done: 1 }, { w: 90, r: 8, done: 1 }, { w: 90, r: 8, done: 1 }, {}] }] };
      const b = await open({ state: v1State({ profile: { start: '2026-10-05', split: 'five' }, logs: later }), hash: 'train', now: '2026-11-18T09:00:00' });
      await b.page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
      const h2 = await hint(b.page, 'squat');
      assert.match(h2, /105 kg/, 'the hint anchored on the deload session: ' + h2);
      assert.match(await b.page.locator('.logger[data-log="squat"] .lh .last').first().innerText(), /100×10/);
    },
  },
];
