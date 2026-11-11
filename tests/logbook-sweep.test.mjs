// Sweep: the logbook and its next-target hint must survive ANY numbers a person can log.
// Scripted cases only cover the inputs someone thought of; this walks every exercise through
// reps below / at / above each end of its range, with fewer / exactly / more sets than
// prescribed, with and without a weight, for today and for a past day.
import assert from 'node:assert/strict';
import { v1State } from './harness.mjs';

export default [
  {
    name: 'no combination of logged sets makes the logbook or the hint throw',
    async run({ open }) {
      const { page, errors } = await open({ state: v1State(), hash: 'train' });
      const res = await page.evaluate(() => {
        const fails = []; let n = 0;
        for (const id of Object.keys(EX)) {
          const e = EX[id], tgt = +e.sets || 3, rr = repRange(e.reps);
          const reps = rr ? [0, 1, rr[0] - 1, rr[0], rr[0] + 1, rr[1] - 1, rr[1], rr[1] + 1, 60] : [0, 1, 5, 12, 45, 90];
          for (const d of [TODAY, '2026-11-09'])
            for (const count of [1, Math.max(1, tgt - 1), tgt, tgt + 2])
              for (const w of [null, 0, 2.5, 62.5])
                for (const r of reps)
                  for (const shape of ['flat', 'drop', 'gap']) {
                    const sets = Array.from({ length: count }, (_, i) => {
                      if (shape === 'gap' && i === 1) return {};                       // a skipped row
                      const s = { r: shape === 'drop' ? Math.max(0, r - 2 * i) : r, done: 1 };
                      if (w != null) s.w = w;
                      return s;
                    });
                    S.logs[id] = [{ d, sets }];
                    n++;
                    try {
                      const v = verdict(id);
                      if (!v || typeof v.txt !== 'string' || !v.txt || /undefined|NaN|null/.test(v.txt)) fails.push([id, d, count, w, r, shape, 'hint: ' + (v && v.txt)]);
                      const h = logger(id);
                      if (typeof h !== 'string' || h.indexOf('data-log="' + id + '"') < 0) fails.push([id, d, count, w, r, shape, 'logbook did not draw']);
                    } catch (err) { fails.push([id, d, count, w, r, shape, String(err && err.message)]); }
                  }
          delete S.logs[id];
        }
        return { n, fails: fails.slice(0, 12), failCount: fails.length };
      });
      assert.ok(res.n > 5000, 'the sweep did not run (' + res.n + ' cases)');
      assert.equal(res.failCount, 0, res.failCount + ' of ' + res.n + ' cases failed, e.g. ' + JSON.stringify(res.fails));
      assert.deepEqual(errors, []);
    },
  },
];
