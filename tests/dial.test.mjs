// The angle drawings read at a glance: notches at 30, 45, 60 and 90 degrees, a grey line with a cross for the
// common mistake, and a swing where a joint travels. Built on 12 Nov 2026 after the owner asked for better angle diagrams.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

/* Helpers that run in the page. `angleOf` reads the angle a line shows, the way the drawing of that kind is measured. */
const pageHelpers = `
window.__dial = {
  angleOf(kind, x1, y1, x2, y2) {
    const deg = (a) => Math.round(a * 180 / Math.PI * 10) / 10;
    if (kind === 'up' || kind === 'fwd') return deg(Math.atan2(y1 - y2, x2 - x1));
    if (kind === 'lean' || kind === 'turn') return deg(Math.atan2(x2 - x1, y1 - y2));
    return deg(Math.atan2(x2 - x1, y2 - y1));
  },
  draw(kind, d, opt) { const host = document.createElement('div'); host.innerHTML = dial(kind, d, opt); document.body.appendChild(host); return host; },
  num(el, k) { return +el.getAttribute(k); },
  right(d) { return typeof d === 'number' ? [d, d] : [Math.min(d[0], d[1]), Math.max(d[0], d[1])]; },
};`;
const ready = async (open, opts) => {
  const o = await open({ state: v2State(), init: pageHelpers, ...(opts || {}) });
  await o.page.locator('#ro-today').waitFor({ state: 'attached' });      // on the Train tab the Today readout is there but not shown
  return o;
};

export default [
  {
    name: 'every angle drawing has notches at 30, 45, 60 and 90 degrees, on its rim',
    async run({ open }) {
      const { page, errors } = await ready(open);
      const bad = await page.evaluate(() => {
        const D = window.__dial, out = [];
        const rows = [['up', 30], ['fwd', [20, 30]], ['lean', 15], ['turn', [0, 90, 'move']], ['out', 45], ['bend', [110, 120]]];
        for (const id in EX) for (const a of EX[id].form.angles) rows.push([a[1], a[2], id + ' ' + a[0]]);
        for (const [kind, d, where] of rows) {
          const host = D.draw(kind, d), g = DIAL[kind], at = (where || kind) + ': ';
          const ticks = Array.from(host.querySelectorAll('line.d-tick')).map((l) => {
            const x1 = D.num(l, 'x1'), y1 = D.num(l, 'y1'), x2 = D.num(l, 'x2'), y2 = D.num(l, 'y2');
            return { deg: D.angleOf(kind, g.x, g.y, (x1 + x2) / 2, (y1 + y2) / 2), len: Math.hypot(x2 - x1, y2 - y1), far: Math.max(Math.hypot(x1 - g.x, y1 - g.y), Math.hypot(x2 - g.x, y2 - g.y)), near: Math.min(Math.hypot(x1 - g.x, y1 - g.y), Math.hypot(x2 - g.x, y2 - g.y)) };
          });
          for (const want of [30, 45, 60, 90]) if (!ticks.some((t) => Math.abs(t.deg - want) <= 0.6)) out.push(at + 'no notch at ' + want);
          for (const t of ticks) {
            if (t.len < 2 || t.len > 7) out.push(at + 'a notch ' + t.len.toFixed(1) + ' units long');
            if (t.far > g.r + 2.5 || t.near < g.r - 7) out.push(at + 'a notch is not on the rim');
            if (!ticks.length || ![30, 45, 60, 90, 120].some((w) => Math.abs(t.deg - w) <= 0.6)) out.push(at + 'a notch at ' + t.deg);
          }
          host.remove();
        }
        return out;
      });
      assert.deepEqual(bad, []);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a row that names a mistake draws it as a grey line with a cross, well away from the right position',
    async run({ open }) {
      const { page } = await ready(open);
      const r = await page.evaluate(() => {
        const D = window.__dial, out = [], NOT_LIMIT = { up: 90, fwd: 90, lean: 90, turn: 90, out: 115, bend: 150 };
        let withNot = 0, without = 0;
        for (const id in EX) for (const a of EX[id].form.angles) {
          const at = id + ' ' + a[0] + ': ', opt = a[5], g = DIAL[a[1]];
          const host = D.draw(a[1], a[2], opt), lines = host.querySelectorAll('line.d-not'), cross = host.querySelectorAll('.d-x');
          if (opt === undefined) {
            without++;
            if (lines.length || cross.length) out.push(at + 'a mistake is drawn but the row names none');
          } else {
            withNot++;
            const n = opt.not, [lo, hi] = D.right(a[2]);
            if (typeof n !== 'number' || n < 0 || n > NOT_LIMIT[a[1]]) { out.push(at + 'the mistake is at ' + n); host.remove(); continue; }
            if (n > lo - 15 && n < hi + 15) out.push(at + 'the mistake at ' + n + ' is too close to the right position ' + lo + '-' + hi);
            if (cross.length !== 1) out.push(at + cross.length + ' crosses');
            else {
              const b = cross[0].getBBox(), want = dialPoint(g, n, g.r);
              if (Math.hypot(b.x + b.width / 2 - want[0], b.y + b.height / 2 - want[1]) > 1) out.push(at + 'the cross is not at the end of the mistake');
              if (b.width < 3 || b.width > 7) out.push(at + 'the cross is ' + b.width.toFixed(1) + ' units wide');
            }
            if (n > 0) {
              if (lines.length !== 1) out.push(at + lines.length + ' grey lines');
              else {
                const l = lines[0], got = D.angleOf(a[1], D.num(l, 'x1'), D.num(l, 'y1'), D.num(l, 'x2'), D.num(l, 'y2'));
                if (Math.abs(got - n) > 0.6) out.push(at + 'the grey line is drawn at ' + got + ', the mistake is ' + n);
                const arm = host.querySelector('line.d-arm');
                if (getComputedStyle(l).stroke === getComputedStyle(arm).stroke) out.push(at + 'the grey line has the colour of the right position');
                if (!(l.compareDocumentPosition(arm) & Node.DOCUMENT_POSITION_FOLLOWING)) out.push(at + 'the grey line is drawn over the right position');
              }
            } else if (lines.length) out.push(at + 'a mistake at 0 sits on the line it is measured from: the cross alone marks it');
          }
          host.remove();
        }
        const bench = EX.inclineDB.form.angles[0], back = EX.deadlift.form.angles[0];
        return { out, withNot, without, bench: bench[5] && bench[5].not, back: back[5] && back[5].not };
      });
      assert.deepEqual(r.out, []);
      assert.ok(r.withNot >= 25, 'only ' + r.withNot + ' rows draw a mistake');
      assert.ok(r.without >= 20, 'only ' + r.without + ' rows are left without one');
      assert.equal(r.bench, 60, 'the incline bench should show "steeper than 45°" as the mistake');
      assert.ok(r.back >= 20, 'the deadlift should show a rounded back as the mistake');
    },
  },
  {
    name: 'where a joint travels, the line starts at the start, swings to the finish and stays there',
    async run({ open }) {
      const { page } = await ready(open);
      const r = await page.evaluate(() => {
        const D = window.__dial, out = []; let moves = 0, still = 0;
        for (const id in EX) for (const a of EX[id].form.angles) {
          const at = id + ' ' + a[0] + ': ', d = a[2], move = Array.isArray(d) && d.length === 3, g = DIAL[a[1]];
          const host = D.draw(a[1], d, a[5]), arm = host.querySelector('line.d-arm'), anims = arm.getAnimations();
          if (!move) { still++; if (anims.length || arm.classList.contains('d-swing')) out.push(at + 'a fixed angle swings'); host.remove(); continue; }
          moves++;
          if (anims.length !== 1) { out.push(at + anims.length + ' animations on the line'); host.remove(); continue; }
          const an = anims[0], tm = an.effect.getComputedTiming();
          if (tm.iterations !== 3 || tm.direction !== 'alternate') out.push(at + 'runs ' + tm.iterations + ' times, ' + tm.direction);
          if (!(tm.duration >= 800 && tm.duration <= 2000)) out.push(at + 'one pass takes ' + tm.duration + ' ms');
          const shown = () => {                       // the angle the line is drawn at right now, with its rotation applied
            const m = new DOMMatrixReadOnly(getComputedStyle(arm).transform);
            const vx = D.num(arm, 'x2') - D.num(arm, 'x1'), vy = D.num(arm, 'y2') - D.num(arm, 'y1');
            return D.angleOf(a[1], 0, 0, m.a * vx + m.c * vy, m.b * vx + m.d * vy);
          };
          an.pause(); an.currentTime = 0;
          const first = shown();
          if (Math.abs(first - d[0]) > 0.7) out.push(at + 'starts at ' + first + ', the movement starts at ' + d[0]);
          an.currentTime = tm.duration;                // the end of the first pass
          const mid = shown();
          if (Math.abs(mid - d[1]) > 0.7) out.push(at + 'the first pass ends at ' + mid + ', the movement ends at ' + d[1]);
          an.finish();
          const last = shown();
          if (Math.abs(last - d[1]) > 0.7) out.push(at + 'comes to rest at ' + last + ', the movement ends at ' + d[1]);
          const o = getComputedStyle(arm).transformOrigin.split(' ').map(parseFloat);
          if (Math.abs(o[0] - g.x) > 0.05 || Math.abs(o[1] - g.y) > 0.05) out.push(at + 'turns about ' + o.join(',') + ', the joint is at ' + g.x + ',' + g.y);
          host.remove();
        }
        return { out, moves, still };
      });
      assert.deepEqual(r.out, []);
      assert.ok(r.moves >= 10, 'only ' + r.moves + ' rows have a movement');
      assert.ok(r.still >= 40, 'only ' + r.still + ' fixed rows were checked');
    },
  },
  {
    name: 'when the phone asks for less motion, nothing swings',
    async run({ open }) {
      const { page } = await ready(open);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const r = await page.evaluate(() => {
        const D = window.__dial, host = D.draw('bend', [100, 0, 'move']), arm = host.querySelector('line.d-arm');
        const out = { anims: arm.getAnimations().length, name: getComputedStyle(arm).animationName, at: D.angleOf('bend', D.num(arm, 'x1'), D.num(arm, 'y1'), D.num(arm, 'x2'), D.num(arm, 'y2')), tf: getComputedStyle(arm).transform };
        host.remove(); return out;
      });
      assert.equal(r.anims, 0, 'the line still animates');
      assert.equal(r.name, 'none');
      assert.equal(r.at, 0, 'the line does not rest at the finish');
      assert.equal(r.tf, 'none');
    },
  },
  {
    name: 'the card passes each row\'s mistake to its drawing, and the guide explains the new marks',
    async run({ open }) {
      const { page, errors } = await ready(open, { hash: 'train' });
      const blk = 'details[data-dayblock="2"] ';
      await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
      const fn = page.locator(blk + '.ex[data-ex="squat"] .formnotes');
      await fn.locator('.ang svg.dial').first().waitFor();
      const want = await page.evaluate(() => EX.squat.form.angles.filter((a) => a[5]).length);
      assert.ok(want >= 1, 'the squat names no mistake');
      assert.equal(await fn.locator('.dial .d-x').count(), want, 'the card does not draw the mistake');
      assert.ok(await fn.locator('.dial .d-tick').count() >= 8, 'the card draws no notches');
      await page.locator('#btnGuide').tap();
      const sec = page.locator('#sheetBody details', { hasText: 'Reading the angles' });
      await sec.locator('summary').click();
      const text = await sec.innerText();
      assert.match(text, /notch/i); assert.match(text, /grey line/i); assert.match(text, /cross/i); assert.match(text, /swings?/i);
      assert.ok(await sec.locator('.dial .d-x').count() >= 1, 'the guide shows no example of a mistake');
      assert.deepEqual(errors, []);
    },
  },
];
