// The six programs and swapping an exercise: what the pre-release review found, each as a test.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const strength = { program: 'strength', dpw: 3, days: [1, 3, 5] };       // 11 Nov is a Wednesday: day B, deadlift and press

export default [
  {
    name: 'a swap never offers an exercise that is already in the same session',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [];
        for (const pid of PROGRAM_ORDER) for (const dpw of variantKeys(PROGRAMS[pid])) {
          setPlan(pid, dpw, PROGRAMS[pid].variants[dpw].days);
          sessions().forEach((s, si) => s.items.forEach((it, k) => {
            const others = s.items.filter((o, j) => j !== k).map((o) => o.ex);
            const offered = (swapRow(it.ex, si + '.' + k).match(/data-swap="([^"]+)"/g) || []).map((x) => x.slice(11, -1));
            offered.forEach((x) => { if (others.includes(x)) out.push(pid + ' ' + dpw + ' ' + s.name + ': ' + it.ex + ' -> ' + x); });
          }));
        }
        return out;
      });
      assert.deepEqual(bad, []);
    },
  },
  {
    name: 'a lift swapped into a slot built for another kind of lift takes its own reps and rest',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: strength }) });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const find = (id) => { const ss = sessions(); for (let si = 0; si < ss.length; si++) for (let k = 0; k < ss[si].items.length; k++) if (ss[si].items[k].ex === id) return [si, k]; return null; };
        const swapIn = (from, to) => { const at = find(from); S.swaps[slotKey(at[0], at[1])] = to; const it = sessions()[at[0]].items[at[1]]; const o = { sets: it.sets, reps: it.reps, rest: it.rest, was: PROGRAMS[S.profile.program].variants[S.profile.dpw].sessions[at[0]].items[at[1]] }; delete S.swaps[slotKey(at[0], at[1])]; return o; };
        const out = { dbBench: swapIn('benchBB', 'benchDB'), goblet: swapIn('squat', 'gobletSquat') };
        setPlan('build', 4, PROGRAMS.build.variants[4].days);
        out.rdlForCurl = swapIn('legcurl', 'rdl');
        out.inclineDbForBb = find('inclineBB') ? swapIn('inclineBB', 'inclineDB') : null;
        out.rowForRow = swapIn('cableRow', 'csRow');
        setPlan('foundation', 3, PROGRAMS.foundation.variants[3].days);
        out.squatForPress = swapIn('legpress', 'squat');
        { const at = find('legpress'); S.swaps[slotKey(at[0], at[1])] = 'squat'; out.squatNote = howHeavy('squat', at[0] + '.' + at[1]); delete S.swaps[slotKey(at[0], at[1])]; }
        return out;
      });
      assert.ok(r.dbBench.was.reps[1] <= 5, 'the fixture is not a 3-5 rep slot');
      assert.ok(r.dbBench.reps[0] >= 6, 'dumbbell bench press at ' + r.dbBench.reps.join('-') + ' reps');
      assert.equal(r.dbBench.sets, r.dbBench.was.sets, 'the number of sets changed');
      assert.ok(r.goblet.reps[0] >= 6, 'goblet squat at ' + r.goblet.reps.join('-') + ' reps');
      assert.ok(r.rdlForCurl.rest >= 120, 'a Romanian deadlift with ' + r.rdlForCurl.rest + ' s of rest');
      // a heavy lift put into a medium lift's slot takes its own reps, and its note agrees with them
      assert.deepEqual(r.squatForPress.reps, [6, 10], 'a back squat at ' + r.squatForPress.reps.join('-') + ' reps in a leg-press slot');
      assert.match(r.squatNote, /6–10/);
      assert.deepEqual(r.rowForRow.reps, r.rowForRow.was.reps, 'a like-for-like swap changed the reps');
      // the same kind of lift in an ordinary slot keeps the slot's prescription
      if (r.inclineDbForBb) assert.deepEqual([r.inclineDbForBb.reps, r.inclineDbForBb.rest], [r.inclineDbForBb.was.reps, r.inclineDbForBb.was.rest]);
    },
  },
  {
    name: 'the second heavy barbell lift of a session asks for lighter sets first',
    async run({ open }) {
      const logs = { ohp: [{ d: '2026-11-04', sets: [{ w: 50, r: 5, done: 1 }, { w: 50, r: 5, done: 1 }, { w: 50, r: 4, done: 1 }, { w: 50, r: 4, done: 1 }] }] };
      const { page } = await open({ state: v2State({ profile: strength, logs }), hash: 'train' });
      const day = 'details[data-dayblock="1"] ';
      const ids = await page.evaluate(() => sessions()[1].items.map((it) => it.ex));
      assert.deepEqual(ids.slice(0, 2), ['deadlift', 'ohp'], 'the fixture does not match day B');
      await page.locator(day + '.ex[data-ex="ohp"] .ex-h').click();
      const note = await page.locator(day + '.ex[data-ex="ohp"] .note.ramp').innerText();
      assert.match(note, /25 kg × 5.*37\.5 kg × 3/, note);
      await page.locator(day + '.ex[data-ex="deadlift"] .ex-h').click();        // the first lift is covered by the session's warm-up box
      assert.equal(await page.locator(day + '.ex[data-ex="deadlift"] .note.ramp').count(), 0);
      assert.match(await page.locator(day + '.warm').innerText(), /Band Pull-Apart/i, 'a day with a heavy press has no upper-body drill');
    },
  },
  {
    name: 'no plan puts two lower-body days back to back on its default days',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [], lower = (s) => /^(legs|hinge)$/.test(s.warm) && !/upper/i.test(s.name + ' ' + s.tag);
        for (const pid of PROGRAM_ORDER) for (const dpw of variantKeys(PROGRAMS[pid])) {
          const v = PROGRAMS[pid].variants[dpw], days = sortDays(v.days);
          if (v.sessions.every((s) => s.warm === 'full' || s.warm === 'strength')) continue;        // full-body plans rest a day between sessions
          for (let i = 0; i < days.length; i++) {
            const j = (i + 1) % days.length, next = (days[i] + 1) % 7 === days[j];
            if (next && lower(v.sessions[i]) && lower(v.sessions[j])) out.push(pid + ' ' + dpw + ': ' + v.sessions[i].name + ' then ' + v.sessions[j].name);
          }
        }
        return out;
      });
      assert.deepEqual(bad, []);
      assert.deepEqual(await page.evaluate(() => PROGRAMS.glutes.variants[4].days), [1, 2, 4, 6]);
    },
  },
];
