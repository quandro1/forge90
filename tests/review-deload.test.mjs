// What the independent review of 12 Nov 2026 found in the deload, "Same as last time" and angle code, each as a test.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { v2State, ROOT } from './harness.mjs';
import { tick } from './timer.test.mjs';

const sets = (w, reps) => reps.map((r) => (w == null ? { r, done: 1 } : { w, r, done: 1 }));
const week6 = { start: '2026-10-05' };                    // 11 Nov is then day 38: week 6, a deload week (9 to 15 Nov)
const squat100 = { squat: [{ d: '2026-11-04', sets: sets(100, [10, 10, 10, 10]) }] };
/** open the card of an exercise in whichever session of the plan holds it; returns the logbook locator */
async function openCardOf(page, id) {
  const at = await page.evaluate((x) => { const ss = sessions(); for (let si = 0; si < ss.length; si++) for (let k = 0; k < ss[si].items.length; k++) if (ss[si].items[k].ex === x) return si; return -1; }, id);
  assert.ok(at >= 0, id + ' is not in this plan');
  const blk = page.locator('details[data-dayblock="' + at + '"]');
  if (!(await blk.evaluate((el) => el.open))) await blk.locator('summary').first().click();
  const card = blk.locator('.ex[data-ex="' + id + '"]');
  if (!(await card.evaluate((el) => el.classList.contains('open')))) await card.locator('.ex-h').click();
  await card.locator('.logger').waitFor();
  return card.locator('.logger');
}
const entry = (page, id) => page.evaluate((x) => todayEntry(x), id);
const hintOf = (lg) => lg.locator('.verdict').innerText();
const skipFromLogbook = async (page, lg) => { await lg.locator('.dlnote [data-dlwhy]').tap(); await page.locator('#sheetBody [data-dlskip]').tap(); };

export default [
  {
    name: 'skipping the deload takes away rows that were planned lighter, so the normal target stands',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      let lg = await openCardOf(page, 'squat');
      await lg.locator('[data-repeat]').tap();
      assert.equal((await entry(page, 'squat')).sets.filter((s) => s.pre).length, 3);
      await skipFromLogbook(page, page.locator('.logger[data-log="squat"]').first());
      const e = await entry(page, 'squat');
      assert.ok(!e || !e.sets.some((s) => s.pre), 'the lighter plan stayed after the deload was skipped: ' + JSON.stringify(e));
      assert.ok(!e || !e.dl);
      lg = page.locator('.logger[data-log="squat"]').first();
      assert.match(await hintOf(lg), /^Today:.*105 kg/);
      assert.equal(await lg.locator('.prenote').count(), 0);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the Deload chip never leaves rows planned for the other kind of session',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      await openCardOf(page, 'squat');
      const lg = () => page.locator('.logger[data-log="squat"]').first();
      // planned as a normal session, then marked as a deload
      await lg().locator('.dlchip').tap();
      await lg().locator('[data-repeat]').tap();
      assert.deepEqual((await entry(page, 'squat')).sets.map((s) => s.w), [100, 100, 100, 100]);
      await lg().locator('.dlchip').tap();
      assert.equal((await entry(page, 'squat')).sets.filter((s) => s.pre).length, 0, 'four full sets stayed planned inside a deload session');
      assert.equal(await lg().locator('.prenote').count(), 0);
      // planned as a deload, then marked as normal
      await lg().locator('[data-repeat]').tap();
      assert.deepEqual((await entry(page, 'squat')).sets.map((s) => s.w), [90, 90, 90, undefined]);
      await lg().locator('.dlchip').tap();
      assert.equal((await entry(page, 'squat')).sets.filter((s) => s.pre).length, 0, 'the lighter rows stayed planned inside a normal session');
      await lg().locator('[data-repeat]').tap();
      assert.deepEqual((await entry(page, 'squat')).sets.map((s) => s.w), [100, 100, 100, 100]);
    },
  },
  {
    name: 'skipping the deload from Today redraws a logbook that is open on Train, and turning it back on does too',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      await openCardOf(page, 'squat');
      const lg = () => page.locator('.logger[data-log="squat"]').first();
      await page.evaluate(() => setTab('today'));
      await page.locator('#dlCard [data-dlskip]').tap();
      await page.evaluate(() => setTab('train'));
      assert.equal(await lg().locator('.dlchip').count(), 0, 'the open logbook still shows the deload');
      assert.match(await hintOf(lg()), /^Today:.*105 kg/);
      assert.equal((await lg().locator('[data-repeat]').innerText()).trim().toLowerCase(), 'same as last time');
      await page.evaluate(() => setTab('today'));
      await page.locator('#dlCard [data-dlwhy]').tap();
      await page.locator('#sheetBody [data-dlback]').tap();
      await page.evaluate(() => setTab('train'));
      assert.equal(await lg().locator('.dlchip').count(), 1, 'the open logbook did not go back to the deload');
      assert.match(await hintOf(lg()), /^Deload week/);
    },
  },
  {
    name: 'turning the deload back on marks a logbook of today that has nothing logged in it',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      const lg = await openCardOf(page, 'squat');
      await lg.locator('[data-addset]').tap();
      assert.equal((await entry(page, 'squat')).dl, 1);
      await skipFromLogbook(page, page.locator('.logger[data-log="squat"]').first());
      assert.ok(!(await entry(page, 'squat')).dl);
      await page.evaluate(() => setTab('today'));
      await page.locator('#dlCard [data-dlwhy]').tap();
      await page.locator('#sheetBody [data-dlback]').tap();
      assert.equal((await entry(page, 'squat')).dl, 1, 'one lift stayed a normal session inside a deload week');
    },
  },
  {
    name: 'skipping keeps the mark on bodyweight, timed and same-weight sessions that really were easier',
    async run({ open }) {
      const logs = {
        pullup: [{ d: '2026-11-03', sets: sets(null, [8, 8, 7]) }, { d: '2026-11-10', dl: 1, sets: sets(null, [5, 5]) }],
        plank: [{ d: '2026-11-03', sets: sets(null, [60, 55, 50]) }, { d: '2026-11-10', dl: 1, sets: sets(null, [40, 35]) }],
        latRaise: [{ d: '2026-11-03', sets: sets(5, [20, 18, 16, 15]) }, { d: '2026-11-10', dl: 1, sets: sets(5, [12, 12, 12]) }],
        squat: [{ d: '2026-11-02', sets: sets(100, [10, 10, 10, 10]) }, { d: '2026-11-09', dl: 1, sets: sets(100, [10, 10, 10, 9]) }],       // trained as usual
        hangraise: [{ d: '2026-11-03', sets: sets(null, [12, 12, 11]) }, { d: '2026-11-10', dl: 1, sets: sets(null, [12, 12, 12]) }],     // as usual, no weight
      };
      const { page } = await open({ state: v2State({ profile: week6, logs }) });
      await page.locator('#dlCard [data-dlskip]').tap();
      const flags = await page.evaluate(() => { const o = {}; for (const id in S.logs) o[id] = !!S.logs[id][1].dl; return o; });
      assert.deepEqual(flags, { pullup: true, plank: true, latRaise: true, squat: false, hangraise: false });
    },
  },
  {
    name: '"Same as last time" in a deload week makes a lift easier even when its weight cannot go down',
    async run({ open }) {
      const logs = {
        hangraise: [{ d: '2026-11-04', sets: sets(null, [12, 12, 11]) }],            // bodyweight, no weight to take off
        legext: [{ d: '2026-11-04', sets: sets(5, [15, 15, 14]) }],                  // one plate: nothing lighter on the machine
        legcurl: [{ d: '2026-11-04', sets: sets(10, [12, 12, 11]) }],                // the next plate down is half the weight
        plank: [{ d: '2026-11-04', sets: sets(null, [60, 55, 50]) }],                // a timed hold
        rdl: [{ d: '2026-11-04', sets: sets(20, [10, 10, 9]) }],                     // the empty bar
        pullup: [{ d: '2026-11-04', sets: sets(5, [8, 8, 7]) }],                     // bodyweight with 5 kg added
        legpress: [{ d: '2026-11-04', sets: sets(140, [12, 12, 11]) }],              // an ordinary weighted lift
      };
      const { page, errors } = await open({ state: v2State({ profile: week6, logs }), hash: 'train' });
      const plan = await page.evaluate(() => { const o = {}; sessions().forEach((s) => s.items.forEach((it) => { o[it.ex] = it.sets; })); return o; });
      const fill = async (id) => {
        if (!plan[id]) return null;
        const lg = await openCardOf(page, id);
        assert.match(await lg.locator('[data-repeat]').innerText(), /same as last time, easier/i);
        await lg.locator('[data-repeat]').tap();
        const fresh = page.locator('.logger[data-log="' + id + '"]').first();
        assert.match(await fresh.locator('.prenote').innerText(), /made easier/i);
        return { rows: (await entry(page, id)).sets.filter((s) => s.pre).map((s) => [s.w, s.r]), hint: await hintOf(fresh), n: Math.max(2, plan[id] - 1) };
      };
      const seen = [];
      // `row` turns one of last time's sets into the row the deload should plan: one set fewer, in the same order
      const check = async (id, row, hint, noHint) => {
        const r = await fill(id); if (!r) return;
        seen.push(id);
        const want = logs[id][0].sets.slice(0, r.n).map(row);
        assert.deepEqual(r.rows, want, id + ': filled ' + JSON.stringify(r.rows));
        assert.match(r.hint, hint, id + ': ' + r.hint);
        if (noHint) assert.doesNotMatch(r.hint, noHint, id + ': ' + r.hint);
      };
      await check('hangraise', (s) => [undefined, s.r - 3], /three reps fewer/, /kg/);
      await check('legext', (s) => [5, s.r - 3], /the same 5 kg as last time/, /lightest setting|lighter than last time/);
      await check('legcurl', (s) => [10, s.r - 3], /the same 10 kg as last time/, /about 5 kg/);
      await check('plank', (s) => [undefined, Math.max(5, Math.round(s.r * 2 / 3 / 5) * 5)], /two thirds/, /three reps/);
      await check('rdl', (s) => [20, s.r - 3], /the same 20 kg as last time/, /15 kg/);
      await check('pullup', (s) => [2.5, s.r], /\+2\.5 kg/);
      await check('legpress', (s) => [130, s.r], /about 130 kg \(lighter than last time\)/);
      // three reps off, but never more than half of a short, heavy set
      assert.deepEqual(await page.evaluate(() => [12, 8, 6, 5, 4, 3, 2, 1].map((r) => deloadReps({}, r))), [9, 5, 3, 3, 2, 2, 1, 1]);
      assert.deepEqual(await page.evaluate(() => [60, 55, 30, 10].map((r) => deloadReps({ hold: [30, 60] }, r))), [40, 35, 20, 5]);
      assert.ok(seen.length >= 4, 'the fixture does not match the plan: only ' + seen.join(', '));
      assert.deepEqual(errors, []);
    },
  },
  {
    name: '"Same as last time" does not copy rows that were only planned last time',
    async run({ open }) {
      const logs = { squat: [{ d: '2026-11-04', sets: [{ w: 100, r: 10, done: 1 }, { w: 100, r: 10, done: 1 }, { pre: 1, w: 100, r: 10 }, { pre: 1, w: 100, r: 10 }] }] };
      const { page } = await open({ state: v2State({ logs }), hash: 'train' });
      const lg = await openCardOf(page, 'squat');
      assert.match(await lg.locator('.lh .last').innerText(), /100×10\s+100×10\s*$/);
      await lg.locator('[data-repeat]').tap();
      assert.deepEqual((await entry(page, 'squat')).sets, [{ pre: 1, w: 100, r: 10 }, { pre: 1, w: 100, r: 10 }, {}, {}]);
    },
  },
  {
    name: 'the question about unticked rows is announced, takes the focus, and goes away when a field is typed in',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs: squat100 }), hash: 'train' });
      const lg = await openCardOf(page, 'squat');
      await lg.locator('[data-repeat]').tap();
      await page.locator('.logger[data-log="squat"]').first().locator('[data-savelog]').focus();
      await page.keyboard.press('Enter');
      const bar = page.locator('.logger[data-log="squat"]').first().locator('.askbar');
      await bar.waitFor();
      assert.equal(await bar.getAttribute('role'), 'alert');
      assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.className), 'askbar', 'the question did not take the focus');
      await page.locator('.logger[data-log="squat"]').first().locator('input[data-set="0"][data-f="r"]').fill('5');
      assert.equal(await page.locator('.logger[data-log="squat"] .askbar').count(), 0, 'the question stayed on screen after a field was typed in');
      assert.equal(await page.evaluate(() => ASK), null);
    },
  },
  {
    name: 'an angle heading reads as separate words',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      const lg = await openCardOf(page, 'squat');
      const heads = await lg.locator('xpath=..').locator('.formnotes .ang-h').evaluateAll((els) => els.map((e) => e.textContent.replace(/ /g, ' ')));
      assert.deepEqual(heads, ['Toes 15–30° out from straight ahead', 'Knees 110–120° of bend, at the bottom']);
    },
  },
  {
    name: 'someone still looking at the first update note sees the new one after it',
    async run({ open }) {
      const { page } = await open({ state: v2State({ ui: { theme: 'dark', diet: 'train', helpSeen: 1, from: 1 } }) });
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#helpCard').innerText(), /the app was updated/i);
      await page.locator('#helpCard [data-hidenew]').tap();
      assert.match(await page.locator('#helpCard').innerText(), /new in this update/i, 'the new note was marked as read by the old one');
      await page.locator('#helpCard [data-hidenews]').tap();
      assert.equal(await page.locator('#helpCard .card').count(), 0);
    },
  },
  {
    name: 'Reference explains every kind of angle drawing the cards use',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnGuide').tap();
      const r = await page.locator('#sheetBody').evaluate((el) => {
        const d = Array.from(el.querySelectorAll('details')).find((x) => /reading the angles/i.test(x.querySelector('summary').textContent));
        return d ? { text: d.textContent, dials: d.querySelectorAll('svg.dial').length } : null;
      });
      assert.ok(r, 'no entry about reading the angles');
      assert.ok(r.dials >= 7, 'only ' + r.dials + ' drawings explained (up, from upright, a turn, forward, out, bend, a band)');
      assert.ok((r.text.match(/seen from above/gi) || []).length >= 2, 'the two kinds that are seen from above are not explained as such');
    },
  },
  {
    name: 'the content rules hold: degrees a drawing can show, no long dash, and the validator passes',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const LIMIT = { up: 90, fwd: 90, lean: 90, turn: 90, out: 100, bend: 150 }, out = [];
        for (const id in EX) {
          const f = EX[id].form;
          for (const a of f.angles) {
            const vals = typeof a[2] === 'number' ? [a[2]] : a[2].slice(0, 2);
            if (vals.some((v) => v > LIMIT[a[1]])) out.push(id + ' ' + a[0] + ': ' + a[1] + ' cannot show ' + vals.join('-'));
          }
          if (/—/.test(JSON.stringify(f))) out.push(id + ': a long dash in the form notes');
        }
        return out;
      });
      assert.deepEqual(bad, []);
      const v = spawnSync(process.execPath, ['tools/validate.mjs'], { cwd: ROOT, encoding: 'utf8' });
      assert.equal(v.status, 0, 'tools/validate.mjs failed:\n' + String(v.stdout).split('\n').filter((l) => /ERROR|EX\./.test(l)).slice(0, 8).join('\n'));
    },
  },
  {
    name: 'advice lines carry no long dash, and a timed hold is not called "bodyweight"',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const out = { dash: [], plank: [] };
        for (const id in EX) {
          const ex = EX[id], it = Object.assign({ ex: id }, ex.typ), rr = repRange(it), n = it.sets, w = (ex.load === 'bw' || ex.load === 'time') ? null : 20;
          const day = (reps) => ({ d: '2026-11-04', sets: reps.map((x) => (w == null ? { r: x } : { w, r: x })) });
          const lo = rr ? rr[0] : 5, hi = rr ? rr[1] : 8;
          const cases = [Array(n).fill(lo), Array(n).fill(hi), Array(n - 1).fill(lo), [hi].concat(Array(n - 1).fill(lo)), [Math.max(1, lo - 3)].concat(Array(n - 1).fill(lo))];
          for (const c of cases) {
            const e = day(c), t = adviceFrom(ex, it, e, [e]).txt;
            if (/—/.test(t)) out.dash.push(id + ': ' + t);
            if (id === 'plank') out.plank.push(t);
          }
        }
        return out;
      });
      assert.deepEqual(r.dash, []);
      assert.ok(r.plank.length >= 5);
      for (const t of r.plank) assert.doesNotMatch(t, /bodyweight/i, t);
    },
  },
  {
    name: 'the deload explanation says only what is true, in plain words',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6 }) });
      await page.locator('#ro-today').waitFor();
      const card = await page.locator('#dlCard .dlcard').innerText();
      await page.locator('#dlCard [data-dlwhy]').tap();
      const sheet = await page.locator('#sheetBody').innerText();
      for (const t of [card, sheet]) {
        assert.doesNotMatch(t, /nerves|lift more|five hard weeks|may you/i, 'a claim the review found untrue, or wording it found unclear');
        assert.match(t, /you still train/i);
        assert.match(t, /tenth less weight/i);
        assert.match(t, /10%/);
        assert.match(t, /could still do about three more reps/i);
        assert.match(t, /only two sets keeps both/i);
      }
      assert.match(sheet, /intervals/i, 'nothing about hard cardio in the easy week');
      assert.match(sheet, /charging a phone/i);
      assert.match(sheet, /can you skip it/i);
    },
  },
];
