// The swap to another exercise sits at the top of an opened lift, not inside the long guide (asked for on 12 Nov 2026).
import assert from 'node:assert/strict';
import { v2State, v1State } from './harness.mjs';

const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
const blk = 'details[data-dayblock="2"] ';            // Wednesday of the V-Taper week: the leg day
const known = { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] };   // a lift with history: its guide starts folded
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
  return page.locator(blk + '.ex[data-ex="' + id + '"]');
};
/* Where the swap buttons of a card are. A button inside a folded part still has a size when it is measured,
   so "on screen" is checked by the folds around it and by the browser's own visibility check. */
const where = (card) => card.evaluate((el) => {
  const b = Array.from(el.querySelectorAll('[data-swap]'));
  const before = (a, sel) => { const x = el.querySelector(sel); return !!(x && (a.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING)); };
  const guide = el.querySelector('details.how');
  return {
    n: b.length,
    inGuide: b.filter((x) => x.closest('details.how')).length,
    folded: b.filter((x) => x.closest('details:not([open])')).length,
    aboveNotes: b.every((x) => before(x, '.formnotes')),
    aboveLog: b.every((x) => before(x, '.logger')),
    shown: b.filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && x.checkVisibility(); }).length,
    guideOpen: !!(guide && guide.open),
    labels: b.map((x) => x.textContent.trim()),
    ids: b.map((x) => x.dataset.swap),
  };
});

export default [
  {
    name: 'the alternatives show as soon as a lift is opened, also when its guide is folded',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ logs: known }), hash: 'train' });
      const card = await openToday(page, 'squat');
      const w = await where(card);
      assert.ok(w.n >= 1, 'no swap buttons on the card');
      assert.equal(w.guideOpen, false, 'the guide of a lift with history should start folded');
      assert.equal(w.inGuide, 0, w.inGuide + ' swap buttons are still inside "How to do it"');
      assert.equal(w.folded, 0, 'swap buttons sit inside a folded part');
      assert.equal(w.shown, w.n, 'not every swap button is on screen');
      assert.ok(w.aboveNotes && w.aboveLog, 'the swap is not above the angles and the logbook');
      const text = await card.locator('.swapbox').innerText();
      assert.match(text, /station taken, or not in your gym\?/i);
      assert.match(text, /sets stays? the same/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'one tap swaps the lift in place, and the way back shows at once',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ logs: known }), hash: 'train' });
      const card = await openToday(page, 'squat');
      const w = await where(card);
      assert.equal(w.inGuide, 0, 'the swap buttons are inside "How to do it"');
      const alt = w.ids[0];
      assert.ok(alt && alt !== 'squat', 'nothing to swap to');
      const slot = await card.getAttribute('data-slot');
      await card.locator('[data-swap="' + alt + '"]').tap();
      await page.locator('.ex[data-slot="' + slot + '"][data-ex="' + alt + '"].open .logger').waitFor();
      assert.equal(await page.evaluate(() => Object.keys(S.swaps).length), 1);
      const fresh = page.locator('.ex[data-slot="' + slot + '"]');
      const back = await where(fresh);
      assert.ok(back.labels.some((t) => /^Back to /.test(t)), 'no way back: ' + back.labels.join(' | '));
      assert.equal(back.inGuide, 0, 'the way back is inside "How to do it"');
      assert.equal(back.shown, back.n, 'the way back is not on screen');
      await fresh.locator('[data-swap="squat"]').tap();
      await page.locator('.ex[data-slot="' + slot + '"][data-ex="squat"].open .logger').waitFor();
      assert.equal(await page.evaluate(() => Object.keys(S.swaps).length), 0);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'in every plan, a slot with an alternative shows it outside every fold, and a slot without one has no empty row',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const bad = []; let withAlt = 0, without = 0;
        for (const pid of PROGRAM_ORDER) for (const dpw of variantKeys(PROGRAMS[pid])) {
          setPlan(pid, dpw, PROGRAMS[pid].variants[dpw].days);
          sessions().forEach((s, si) => s.items.forEach((it, k) => {
            const ref = si + '.' + k, at = pid + ' ' + dpw + ' ' + s.name + ' / ' + it.ex + ': ';
            const want = (swapRow(it.ex, ref).match(/data-swap="/g) || []).length;
            const box = document.createElement('div'); fillEx(box, it.ex, ref);       // the function that draws an opened card
            const got = Array.from(box.querySelectorAll('[data-swap]')), log = box.querySelector('.logger');
            if (got.length !== want) bad.push(at + got.length + ' buttons drawn, ' + want + ' offered');
            if (got.some((b) => b.closest('details'))) bad.push(at + 'a swap button sits inside a fold');
            if (got.some((b) => !log || !(b.compareDocumentPosition(log) & Node.DOCUMENT_POSITION_FOLLOWING))) bad.push(at + 'a swap button is below the logbook');
            if (!want && box.querySelector('.swapbox')) bad.push(at + 'an empty swap row');
            if (want) withAlt++; else without++;
          }));
        }
        return { bad, withAlt, without };
      });
      assert.deepEqual(r.bad, []);
      assert.ok(r.withAlt > 0 && r.withAlt + r.without > 40, 'the sweep saw too little: ' + JSON.stringify([r.withAlt, r.without]));
    },
  },
  {
    name: 'the swap row fits a small phone and its buttons are big enough to tap',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs: known }), hash: 'train', device: 'iPhone SE' });
      const card = await openToday(page, 'squat');
      const r = await card.evaluate((el) => {
        const box = el.querySelector('.swapbox'); if (!box) return null;
        const right = el.getBoundingClientRect().right;
        return {
          over: Array.from(box.querySelectorAll('*')).filter((n) => n.getBoundingClientRect().right > right + 0.5).length,
          low: Array.from(box.querySelectorAll('[data-swap]')).map((b) => Math.round(b.getBoundingClientRect().height)).filter((h) => h < 40),
        };
      });
      assert.ok(r, 'no swap row at the top of the card');
      assert.equal(r.over, 0, r.over + ' elements stick out of the card');
      assert.deepEqual(r.low, [], 'swap buttons under 40 px tall');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, 'the page scrolls sideways');
    },
  },
  {
    name: 'the note for someone coming from the earlier version says where the swap is now',
    async run({ open }) {
      const { page } = await open({ state: v1State() });
      await page.locator('#helpCard .help').waitFor();
      const text = await page.locator('#helpCard').innerText();
      assert.match(text, /station taken\?/i);
      assert.doesNotMatch(text, /how to do it/i, 'the note still sends people into "How to do it" for the swap');
      assert.match(text, /open the lift/i);
    },
  },
];
