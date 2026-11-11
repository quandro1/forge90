// Sweep: the logbook and its next-target hint must survive ANY numbers a person can log.
// Scripted cases only cover the inputs someone thought of; this walks every exercise, and
// every item of every program, through reps below / at / above each end of its range, with
// fewer / exactly / more sets than prescribed, with and without a weight, for today and for
// past days. (On the 2 Oct 2026 build 4,704 of 27,360 such combinations crashed the logbook.)
import assert from 'node:assert/strict';
import { v1State } from './harness.mjs';

export default [
  {
    name: 'no combination of logged sets makes the logbook or the hint throw or print a blank',
    async run({ open }) {
      const { page, errors } = await open({ state: v1State(), hash: 'train' });
      const res = await page.evaluate(() => {
        const fails = []; let n = 0;
        const cases = [];                                   // [exercise id, item, slot ref or '']
        for (const id of Object.keys(EX)) cases.push([id, Object.assign({ ex: id }, EX[id].typ), '']);
        for (const pid of Object.keys(PROGRAMS)) for (const k of Object.keys(PROGRAMS[pid].variants))
          PROGRAMS[pid].variants[k].sessions.forEach((s) => s.items.forEach((it) => cases.push([it.ex, it, ''])));
        sessions().forEach((s, si) => s.items.forEach((it, k) => cases.push([it.ex, it, si + '.' + k])));
        const bad = (t) => typeof t !== 'string' || !t || /undefined|NaN|null|\[object/.test(t);
        for (const [id, it, ref] of cases) {
          const tgt = +it.sets || 3, rr = repRange(it);
          const reps = rr ? [0, 1, rr[0] - 1, rr[0], rr[0] + 1, rr[1] - 1, rr[1], rr[1] + 1, 75] : [0, 1, 5, 12, 45];
          const weights = ref ? [null, 62.5] : [null, 0, 2.5, 62.5];
          for (const past of [0, 1, 3])                      // 0: today only; 1: one past session; 3: three past sessions
            for (const count of [1, Math.max(1, tgt - 1), tgt, tgt + 2])
              for (const w of weights)
                for (const r of reps)
                  for (const shape of ['flat', 'drop', 'gap']) {
                    const mk = () => Array.from({ length: count }, (_, i) => {
                      if (shape === 'gap' && i === 1) return {};
                      const s = { r: shape === 'drop' ? Math.max(0, r - 2 * i) : r, done: 1 };
                      if (w != null) s.w = w;
                      return s;
                    });
                    const days = past === 0 ? [TODAY] : past === 1 ? ['2026-11-09'] : ['2026-10-26', '2026-11-02', '2026-11-09'];
                    S.logs[id] = days.map((d) => ({ d, sets: mk() }));
                    n++;
                    try {
                      const v = verdict(id, it);
                      if (!v || bad(v.txt)) fails.push([id, past, count, w, r, shape, 'hint: ' + (v && v.txt)]);
                      const h = logger(id, ref);
                      if (typeof h !== 'string' || h.indexOf('data-log="' + id + '"') < 0 || /undefined|NaN/.test(h)) fails.push([id, past, count, w, r, shape, 'logbook did not draw cleanly']);
                    } catch (err) { fails.push([id, past, count, w, r, shape, String(err && err.message)]); }
                  }
          delete S.logs[id];
        }
        return { n, fails: fails.slice(0, 12), failCount: fails.length };
      });
      assert.ok(res.n > 20000, 'the sweep did not run (' + res.n + ' cases)');
      assert.equal(res.failCount, 0, res.failCount + ' of ' + res.n + ' cases failed, e.g. ' + JSON.stringify(res.fails));
      assert.deepEqual(errors, []);
    },
  },
];
