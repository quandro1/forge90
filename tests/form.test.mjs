// Angles, grip, range and a comparison on every exercise, in view above the logbook (asked for on 12 Nov 2026).
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
const blk = 'details[data-dayblock="2"] ';            // Wednesday of the V-Taper week: the leg day
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
  return page.locator(blk + '.ex[data-ex="' + id + '"]');
};

export default [
  {
    name: 'every exercise carries form notes: angles with numbers, grip or feet, the range, and a comparison',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [], KINDS = ['up', 'lean', 'turn', 'out', 'bend', 'fwd'];
        const LIMIT = { up: 90, fwd: 90, lean: 90, turn: 90, out: 100, bend: 150 };          // what each drawing can show
        const clean = (s, lo, hi) => typeof s === 'string' && s.trim().length >= lo && s.length <= hi && !/<(?!\/?b>)/.test(s) && !/&[a-z]+;/.test(s) && !/undefined|\{|\}|—/.test(s);
        for (const id in EX) {
          const f = EX[id].form;
          if (!f || typeof f !== 'object') { out.push(id + ': no form notes'); continue; }
          if (!Array.isArray(f.angles) || f.angles.length < 1 || f.angles.length > 3) { out.push(id + ': needs 1 to 3 angles'); continue; }
          f.angles.forEach((a, i) => {
            const at = id + ' angle ' + (i + 1) + ': ';
            if (!Array.isArray(a) || a.length !== 5) { out.push(at + 'must be [what, kind, degrees, measured from, plain words]'); return; }
            if (!clean(a[0], 2, 24) || /<b>/.test(a[0])) out.push(at + 'label');
            if (KINDS.indexOf(a[1]) < 0) out.push(at + 'kind ' + a[1]);
            const d = a[2], num = (x) => typeof x === 'number' && x >= 0 && x <= (LIMIT[a[1]] || 0);
            if (!(num(d) || (Array.isArray(d) && d.length === 2 && num(d[0]) && num(d[1]) && d[0] < d[1])
              || (Array.isArray(d) && d.length === 3 && d[2] === 'move' && num(d[0]) && num(d[1]) && d[0] !== d[1]))) out.push(at + 'degrees ' + JSON.stringify(d));
            if (!clean(a[3], 3, 70) || /<b>/.test(a[3])) out.push(at + 'what it is measured from');
            if (!clean(a[4], 12, 130)) out.push(at + 'plain words');
          });
          // short on purpose: the block sits above the logbook and has to read at a glance on a phone
          if (!f.grip && !f.feet) out.push(id + ': neither grip nor feet');
          if (f.grip !== undefined && !clean(f.grip, 12, 140)) out.push(id + ': grip');
          if (f.feet !== undefined && !clean(f.feet, 12, 130)) out.push(id + ': feet');
          if (!clean(f.range, 20, 160)) out.push(id + ': range');
          if (!clean(f.like, 20, 160) || /<b>/.test(f.like)) out.push(id + ': comparison');
          for (const k in f) if (['angles', 'grip', 'feet', 'range', 'like'].indexOf(k) < 0) out.push(id + ': unknown field ' + k);
        }
        return out;
      });
      assert.deepEqual(bad, []);
      assert.equal(await page.evaluate(() => Object.keys(EX).length), 41);
    },
  },
  {
    name: 'the card shows them above the logbook and open, also for a lift that has history',
    async run({ open }) {
      const logs = { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }] };
      const { page, errors } = await open({ state: v2State({ logs }), hash: 'train' });
      const card = await openToday(page, 'squat');
      const fn = card.locator('.formnotes');
      assert.equal(await fn.count(), 1, 'no form notes on the card');
      assert.equal(await fn.evaluate((el) => el.open), true, 'the notes start folded');
      const above = await card.evaluate((el) => { const a = el.querySelector('.formnotes'), b = el.querySelector('.logger'); return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); });
      assert.ok(above, 'the notes are not above the logbook');
      const text = await fn.innerText();
      assert.match(text, /angles, grip and range/i);
      assert.match(text, /\d+(–\d+)?°/, 'no angle with a number: ' + text);
      for (const label of ['Grip', 'Feet', 'Range', 'Tempo', 'Like']) assert.match(text, new RegExp('(^|\\n)' + label + '\\b', 'i'), label + ' row missing');
      // the block is short enough to see the logbook under it without a long scroll: at most about one screen
      const tall = await fn.evaluate((el) => el.getBoundingClientRect().height);
      assert.ok(tall < 640, 'the notes are ' + Math.round(tall) + ' px tall');
      assert.doesNotMatch(text, /undefined|\{|\}/);
      const want = await page.evaluate(() => EX.squat.form.angles.length);
      assert.equal(await fn.locator('.ang').count(), want);
      assert.equal(await fn.locator('.ang svg.dial').count(), want, 'an angle has no drawing');
      const box = await fn.locator('.ang').first().boundingBox();
      assert.ok(box && box.height > 20 && box.width > 200, 'the first angle is not on screen');
      // the long guide stays folded for a lift with history; the notes do not depend on it
      assert.equal(await card.locator('details.how').evaluate((el) => el.open), false);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'folding the notes once keeps them folded on every card and after a reload; opening brings them back',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      const squat = await openToday(page, 'squat');
      await squat.locator('.formnotes > summary').click();
      assert.equal(await squat.locator('.formnotes').evaluate((el) => el.open), false);
      assert.equal(await page.evaluate(() => S.ui.formOff), 1);
      const press = await openToday(page, 'legpress');
      assert.equal(await press.locator('.formnotes').evaluate((el) => el.open), false, 'the next card opened its notes again');
      await page.reload();
      const again = await openToday(page, 'squat');
      assert.equal(await again.locator('.formnotes').evaluate((el) => el.open), false, 'the fold was forgotten after a reload');
      await openToday(page, 'legpress');
      await again.locator('.formnotes > summary').click();
      assert.equal(await again.locator('.formnotes').evaluate((el) => el.open), true);
      assert.ok(!(await page.evaluate(() => S.ui.formOff)));
      assert.equal(await page.locator(blk + '.ex[data-ex="legpress"] .formnotes').evaluate((el) => el.open), true, 'the other open card stayed folded');
    },
  },
  {
    name: 'each drawing shows the angle it names',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const arm = (kind, deg) => {
          const d = document.createElement('div'); d.innerHTML = dial(kind, deg);
          const l = d.querySelector('line.d-arm'); if (!l) return null;
          const x1 = +l.getAttribute('x1'), y1 = +l.getAttribute('y1'), x2 = +l.getAttribute('x2'), y2 = +l.getAttribute('y2');
          const deg2 = (a) => Math.round(a * 180 / Math.PI * 10) / 10;
          if (kind === 'up' || kind === 'fwd') return deg2(Math.atan2(y1 - y2, x2 - x1));
          if (kind === 'lean' || kind === 'turn') return deg2(Math.atan2(x2 - x1, y1 - y2));
          return deg2(Math.atan2(x2 - x1, y2 - y1));
        };
        const has = (kind, deg, sel) => { const d = document.createElement('div'); d.innerHTML = dial(kind, deg); return !!d.querySelector(sel); };
        const bad = [];
        // every angle in the library: the arm is drawn at the value (the middle of a range, the finish of a movement)
        for (const id in EX) for (const a of (EX[id].form || {}).angles || []) {
          const d = a[2], want = typeof d === 'number' ? d : d.length === 3 ? d[1] : (d[0] + d[1]) / 2, got = arm(a[1], d);
          if (got == null || Math.abs(got - want) > 0.6) bad.push(id + ' ' + a[0] + ': drawn at ' + got + ', says ' + want);
          if (typeof d !== 'number' && !has(a[1], d, 'path.d-band')) bad.push(id + ' ' + a[0] + ': a range without its band');
        }
        return {
          bad, up30: arm('up', 30), lean15: arm('lean', 15), out45: arm('out', 45), bend90: arm('bend', 90), bend0: arm('bend', 0),
          ref: has('up', 30, 'line.d-ref'), single: degText(30), range: degText([10, 15]), move: degText([100, 0, 'move']),
        };
      });
      assert.deepEqual(r.bad, []);
      assert.equal(r.up30, 30); assert.equal(r.lean15, 15); assert.equal(r.out45, 45); assert.equal(r.bend90, 90); assert.equal(r.bend0, 0);
      assert.ok(r.ref, 'no line to measure from');
      assert.equal(r.single, '30°'); assert.equal(r.range, '10–15°'); assert.equal(r.move, '100° → 0°');
    },
  },
  {
    name: 'the library guide carries the same notes',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#btnLib').scrollIntoViewIfNeeded();
      await page.locator('#btnLib').tap();
      const item = page.locator('#libList .libitem').first();
      await item.locator('details.how > summary').click();
      await item.locator('.formnotes').waitFor();
      assert.match(await item.locator('.formnotes').innerText(), /°/);
      assert.ok(await item.locator('.formnotes .ang svg.dial').count() >= 1);
    },
  },
  {
    name: 'the notes fit a small phone: nothing wider than the card',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train', device: 'iPhone SE' });
      for (const id of ['squat', 'legpress']) {
        const card = await openToday(page, id);
        const over = await card.evaluate((el) => { const w = el.getBoundingClientRect().right; return Array.from(el.querySelectorAll('.formnotes *')).filter((n) => n.getBoundingClientRect().right > w + 0.5).length; });
        assert.equal(over, 0, id + ': ' + over + ' elements stick out of the card');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, 'the page scrolls sideways');
    },
  },
];
