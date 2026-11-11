// The logbook, the advice and the rest timer: what the pre-release review found, each as a test.
import assert from 'node:assert/strict';
import { v2State, TODAY } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const sets = (w, reps) => reps.map((r) => (w == null ? { r, done: 1 } : { w, r, done: 1 }));
const blk = 'details[data-dayblock="2"] ';
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
};
const hint = (page, id) => page.locator(blk + '.logger[data-log="' + id + '"] .verdict').innerText();
const week6 = { start: '2026-10-05' };                    // 11 Nov is then day 38: week 6, a deload week

export default [
  {
    name: 'advice to take weight off never names the weight you are already on',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [];
        for (const id in EX) {
          const ex = EX[id]; if (ex.load === 'bw' || ex.load === 'time') continue;
          const it = Object.assign({ ex: id }, ex.typ), rr = repRange(it), st = +ex.step || 2.5;
          for (const mult of [1, 2, 3, 4, 8]) {
            const w = st * mult, low = Math.max(1, rr[0] - 3);
            const day = (d, r) => ({ d: d, sets: Array.from({ length: it.sets }, () => ({ w: w, r: r })) });
            const cases = [
              [day('2026-11-04', low), [day('2026-11-04', low)]],                                            // far too heavy
              [day('2026-11-04', rr[0] - 1), [day('2026-10-28', rr[0] - 1), day('2026-11-04', rr[0] - 1)]],     // under the floor twice
              [day('2026-11-04', rr[0]), [day('2026-10-21', rr[0]), day('2026-10-28', rr[0]), day('2026-11-04', rr[0])]],   // three flat sessions
            ];
            for (const [e, hist] of cases) {
              const t = adviceFrom(ex, it, e, hist).txt;
              const m = t.match(/[Dd]rop to (?:about )?([^.]+?)(?:\.| and )|Take 10% off \(([^)]+)\)/);
              if (m && (m[1] || m[2]).trim() === kg(w)) out.push(id + ' at ' + w + ': ' + t);
            }
          }
        }
        return out;
      });
      assert.deepEqual(bad.slice(0, 4), [], bad.length + ' cases');
    },
  },
  {
    name: 'the deload line never names the weight you are already on either',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: { pecdeck: [{ d: '2026-11-02', sets: sets(5, [15, 15, 14]) }] } }) });
      await page.locator('#ro-today').waitFor();
      const t = await page.evaluate(() => verdict('pecdeck', Object.assign({ ex: 'pecdeck' }, EX.pecdeck.typ)).txt);
      assert.match(t, /^Deload/);
      assert.doesNotMatch(t, /about 5 kg \(10% under/);
    },
  },
  {
    name: 'an exercise swapped into a slot is prescribed in its own terms: seconds or reps, each side or not',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const find = (prog, dpw, id) => { const ss = sessionsOf(prog, dpw); for (let si = 0; si < ss.length; si++) for (let k = 0; k < ss[si].items.length; k++) if ((ss[si].items[k].base || ss[si].items[k].ex) === id) return [si, k]; return null; };
        const swapIn = (prog, dpw, from, to) => {
          setPlan(prog, dpw, PROGRAMS[prog].variants[dpw].days); const at = find(prog, dpw, from); if (!at) return 'no slot for ' + from;
          S.swaps[slotKey(at[0], at[1])] = to; const it = sessions()[at[0]].items[at[1]];
          const out = { ex: it.ex, text: rxText(it), hold: !!it.hold, each: !!it.each, first: firstTime(EX[it.ex], it) };
          delete S.swaps[slotKey(at[0], at[1])]; return out;
        };
        return {
          plankForPallof: swapIn('vtaper', 5, 'pallof', 'plank'),
          pallofForPlank: swapIn('foundation', 3, 'plank', 'pallof'),
          pressForSplit: swapIn('glutes', 4, 'bulgarian', 'legpress'),
          oneArmForCable: swapIn('vtaper', 5, 'cableRow', 'dbRow'),
        };
      });
      assert.equal(r.plankForPallof.hold, true, 'a plank is prescribed in reps: ' + r.plankForPallof.text);
      assert.equal(r.plankForPallof.each, false);
      assert.match(r.plankForPallof.first, /Hold/);
      assert.equal(r.pallofForPlank.hold, false, 'a Pallof press is prescribed in seconds: ' + r.pallofForPlank.text);
      assert.equal(r.pallofForPlank.each, true);
      assert.equal(r.pressForSplit.each, false, 'the leg press says each side: ' + r.pressForSplit.text);
      assert.equal(r.oneArmForCable.each, true, 'the one-arm row lost each side: ' + r.oneArmForCable.text);
    },
  },
  {
    name: 'reaching the top of the range gives advice that fits the lift',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const adv = (id, rows) => page.evaluate(([i, s]) => {
        const it = Object.assign({ ex: i }, EX[i].typ), e = { d: '2026-11-04', sets: s.slice(0, it.sets).concat(Array.from({ length: Math.max(0, it.sets - s.length) }, () => s[s.length - 1])) };
        return adviceFrom(EX[i], it, e, [e]).txt;
      }, [id, rows]);
      const top = async (id) => (await page.evaluate((i) => repRange(Object.assign({ ex: i }, EX[i].typ))[1], id));
      const leg = await adv('hangraise', [{ r: await top('hangraise') }]);
      assert.doesNotMatch(leg, /dumbbell|belt/i, leg);
      assert.match(leg, /straight legs/i, leg);
      const push = await adv('pushup', [{ r: await top('pushup') }]);
      assert.doesNotMatch(push, /dumbbell|belt|2\.5 kg/i, push);
      const press = await adv('inclineBB', [{ r: await top('inclineBB') }]);                 // a barbell lift logged with reps only
      assert.doesNotMatch(press, /dumbbell|belt/i, press);
      assert.match(press, /type the weight/i, press);
      const pull = await adv('pullup', [{ r: await top('pullup') }]);                        // bodyweight pull-ups: a belt is the right answer
      assert.match(pull, /belt/i, pull);
      const plus = await adv('pullup', [{ w: 5, r: await top('pullup') }]);
      assert.match(plus, /\+7\.5 kg/, 'added weight is written without its plus: ' + plus);
      const heavier = await adv('inclineBB', [{ w: 60, r: 10 }, { w: 60, r: 10 }, { w: 60, r: 10 }, { w: 62.5, r: 10 }]);
      assert.match(heavier, /62\.5 kg/, 'a heavier set at the top cancelled the increase: ' + heavier);
    },
  },
  {
    name: 'rows filled by "Same as last time" are a plan, not sets done, until they are ticked or changed',
    async run({ open }) {
      const last = (w, reps) => [{ d: '2026-11-04', sets: sets(w, reps) }];
      const logs = { squat: last(80, [8, 8, 7, 6]), legpress: last(140, [12, 12, 11]), legext: last(40, [15, 14, 13]), legcurl: last(35, [12, 11, 10]) };
      const { page, clock } = await open({ state: v2State({ logs }), hash: 'train' });
      const ids = await page.evaluate(() => infoForDate(TODAY).session.items.map((it) => it.ex).filter((id) => S.logs[id]));
      assert.ok(ids.length >= 4, 'the fixture does not match today\'s session: ' + ids.join(','));
      for (const id of ids) {
        await openToday(page, id);
        await page.locator(blk + '.logger[data-log="' + id + '"] [data-repeat]').tap();
      }
      await clock.runFor(400);
      assert.equal(await page.evaluate(() => (S.checks[TODAY] || []).includes('session')), false, 'the session ticked itself before a single set was lifted');
      assert.match(await hint(page, 'squat'), /^Today:/, 'the advice already moved on to next session');
      assert.equal(await page.locator(blk + '.logger[data-log="squat"] input[data-set="0"][data-f="w"]').inputValue(), '80');
      assert.equal(await page.evaluate(() => loggedSets(todayEntry('squat')).length), 0);
      await tick(page, 'squat', 0);                                             // done as planned
      await page.locator(blk + '.logger[data-log="squat"] input[data-set="1"][data-f="r"]').fill('7');   // done, one rep short
      assert.equal(await page.evaluate(() => loggedSets(todayEntry('squat')).length), 2);
      assert.match(await hint(page, 'squat'), /2 of 4 sets done/);
      // tomorrow, the two rows that were never done are not history
      assert.deepEqual(await page.evaluate(() => { const e = normalize(JSON.parse(JSON.stringify(S))).logs.squat.find((x) => x.d === TODAY); return loggedSets(e).map((s) => s.r); }), [8, 7]);
    },
  },
  {
    name: 'a lift logged with reps first never reads "same the same weight", and a weight typed afterwards reaches the rows under it',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State({ logs: { squat: [{ d: '2026-11-04', sets: sets(null, [9, 8, 8, 7]) }] } }), hash: 'train' });
      await openToday(page, 'squat');
      assert.doesNotMatch(await hint(page, 'squat'), /same the same|your the same/i);
      const lg = page.locator(blk + '.logger[data-log="squat"]');
      for (let i = 0; i < 4; i++) await lg.locator('input[data-set="' + i + '"][data-f="r"]').fill('10');
      await lg.locator('input[data-set="0"][data-f="w"]').fill('60');
      await clock.runFor(400);
      assert.deepEqual(await page.evaluate(() => todayEntry('squat').sets.map((s) => s.w)), [60, 60, 60, 60]);
      assert.equal(await lg.locator('input[data-set="3"][data-f="w"]').inputValue(), '60');
      await lg.locator('button[data-savelog]').tap();
      assert.match(await hint(page, 'squat'), /go to 6[25]/, await hint(page, 'squat'));
    },
  },
  {
    name: 'a short set on a bodyweight lift or a hold is not told to take weight off',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const t = await page.evaluate(() => {
        const one = (id, r) => { S.logs[id] = [{ d: TODAY, sets: [{ r: r }] }]; const v = verdict(id, Object.assign({ ex: id }, EX[id].typ)).txt; delete S.logs[id]; return v; };
        return [one('pushup', 3), one('plank', 10)];
      });
      for (const x of t) { assert.match(x, /fell to/, x); assert.doesNotMatch(x, /weight off/i, x); }
    },
  },
  {
    name: 'turning the Deload chip off shows the normal target at once',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: { squat: [{ d: '2026-11-04', sets: sets(100, [10, 10, 10, 10]) }] } }), hash: 'train' });
      await openToday(page, 'squat');
      assert.match(await hint(page, 'squat'), /^Deload/);
      await page.locator(blk + '.logger[data-log="squat"] [data-dl]').tap();     // "tap if you trained normally"
      assert.match(await hint(page, 'squat'), /^Today:.*105 kg/, await hint(page, 'squat'));
    },
  },
  {
    name: 'days a week changed in Settings redraws the tab underneath',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#dayList details[data-dayblock]').first().waitFor();
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 5);
      await page.locator('#btnSet').tap();
      await page.locator('#setDpw [data-dpw="4"]').tap();
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 4, 'Train still lists the five-day week');
      assert.equal(await page.locator('#splitSeg button.on').getAttribute('data-dpw'), '4');
    },
  },
  {
    name: 'on a deload day the rest timer counts the deload\'s sets',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: { squat: [{ d: '2026-11-04', sets: sets(100, [10, 10, 10, 10]) }] } }), hash: 'train' });
      await openToday(page, 'squat');
      for (let i = 0; i < 3; i++) { await typeSet(page, 'squat', i, 90, 8); await tick(page, 'squat', i); }
      const label = await page.locator(blk + '.rest[data-rest="squat"] .rt-l').innerText();
      assert.doesNotMatch(label, /set 4/i, 'the timer asks for a fourth set on a three-set deload: ' + label);
    },
  },
  {
    name: 'the cross hit by mistake, then the tick: the set comes back and is done',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await openToday(page, 'squat');
      const lg = page.locator(blk + '.logger[data-log="squat"]');
      await typeSet(page, 'squat', 0, 80, 8);
      await lg.locator('button[data-del="0"]').tap();
      await tick(page, 'squat', 0);
      assert.deepEqual(await page.evaluate(() => { const s = todayEntry('squat').sets[0]; return [s.w, s.r, s.done]; }), [80, 8, 1]);
      assert.equal(await lg.locator('.undobar').count(), 0, 'the Undo bar stayed after the set came back');
      // a cleared row in one exercise, then a blank row removed in another: the first Undo still works
      await typeSet(page, 'squat', 1, 80, 7);
      await lg.locator('button[data-del="1"]').tap();
      await openToday(page, 'legpress');
      const lp = page.locator(blk + '.logger[data-log="legpress"]');
      await lp.locator('[data-addset]').tap();
      await lp.locator('button[data-del="3"]').tap();
      await lg.locator('[data-undo]').tap();
      assert.deepEqual(await page.evaluate(() => { const s = todayEntry('squat').sets[1]; return [s.w, s.r]; }), [80, 7]);
    },
  },
  {
    name: 'a weight field cleared on purpose stays cleared after a reload',
    async run({ open }) {
      const logs = { pullup: [{ d: '2026-11-10', sets: [{ w: 10, r: 6, done: 1 }, { r: 8, done: 1 }, { r: 7, done: 1 }] }] };
      const { page } = await open({ state: v2State({ logs }) });
      await page.locator('#ro-today').waitFor();
      assert.deepEqual(await page.evaluate(() => S.logs.pullup[0].sets.map((s) => s.w ?? null)), [10, null, null]);
    },
  },
  {
    name: 'a new rest puts the page title back',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State(), hash: 'train' });
      await openToday(page, 'squat');
      await typeSet(page, 'squat', 0, 80, 8);
      await tick(page, 'squat', 0);
      await clock.runFor(181000);                                               // the rest runs out
      assert.match(await page.title(), /^GO/);
      await typeSet(page, 'squat', 1, 80, 8);
      await tick(page, 'squat', 1);
      assert.equal(await page.title(), 'FORGE 90');
    },
  },
];
