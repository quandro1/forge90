// Deload weeks explained in plain words, a way to skip one, and "Same as last time" kept on a deload day (12 Nov 2026).
import assert from 'node:assert/strict';
import { v2State, finishSetup } from './harness.mjs';
import { tick } from './timer.test.mjs';

const sets = (w, reps) => reps.map((r) => ({ w, r, done: 1 }));
const blk = 'details[data-dayblock="2"] ';
const week6 = { start: '2026-10-05' };                    // 11 Nov is then day 38: week 6, a deload week (9 to 15 Nov)
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
  return page.locator(blk + '.logger[data-log="' + id + '"]');
};
const hint = (page, id) => page.locator(blk + '.logger[data-log="' + id + '"] .verdict').innerText();
const squat100 = { squat: [{ d: '2026-11-04', sets: sets(100, [10, 10, 10, 10]) }] };

export default [
  {
    name: 'a deload week is explained on Today in plain words, and stays one tap away after "Got it"',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ profile: week6 }) });
      await page.locator('#ro-today').waitFor();
      const card = page.locator('#dlCard .dlcard');
      assert.equal(await card.count(), 1, 'no explanation on Today in a deload week');
      const t = await card.innerText();
      for (const re of [/deload/i, /easy week/i, /tenth less weight/i, /10%/, /one set fewer/i, /three more reps/i, /week 6/i]) assert.match(t, re);
      assert.doesNotMatch(t, /RIR|RPE|CNS|supercompensat/i, 'jargon in the explanation');
      await card.locator('[data-dlok]').tap();
      assert.equal(await page.locator('#dlCard .dlcard').count(), 0, 'the card stayed after Got it');
      const line = page.locator('#dlCard .dlline');
      assert.match(await line.innerText(), /deload week/i);
      await page.reload();
      await page.locator('#ro-today').waitFor();
      assert.equal(await page.locator('#dlCard .dlcard').count(), 0, 'the card came back after a reload');
      await page.locator('#dlCard .dlline [data-dlwhy]').tap();
      assert.match(await page.locator('#sheetTitle').innerText(), /deload/i);
      const body = await page.locator('#sheetBody').innerText();
      for (const re of [/easy week/i, /week 6/i, /week 12/i, /last normal session/i]) assert.match(body, re);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a normal week shows nothing about deloads on Today',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      assert.equal((await page.locator('#dlCard').innerText()).trim(), '');
    },
  },
  {
    name: '"Train normally this week" turns the deload off everywhere, and it can be turned back on',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6, logs: squat100 }) });
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#dayline').innerText(), /deload/i);
      await page.locator('#dlCard [data-dlskip]').tap();
      assert.equal(await page.evaluate(() => isDeload()), false);
      assert.doesNotMatch(await page.locator('#dayline').innerText(), /deload/i);
      assert.doesNotMatch(await page.locator('#sessionCard').innerText(), /deload/i);
      assert.match(await page.locator('#dlCard .dlline').innerText(), /normally/i);
      assert.equal(await page.evaluate(() => dayInfo(38).deload), false, 'the Map still draws the week as a deload');
      await page.locator('#sessionCard [data-goday]').tap();
      const lg = await openToday(page, 'squat');
      assert.match(await hint(page, 'squat'), /^Today:.*105 kg/, await hint(page, 'squat'));
      assert.equal(await lg.locator('.dlchip').count(), 0);
      await page.reload();
      await page.locator('#dayList details[data-dayblock]').first().waitFor();
      assert.equal(await page.evaluate(() => isDeload()), false, 'the choice was forgotten after a reload');
      await page.evaluate(() => setTab('today'));
      await page.locator('#dlCard .dlline [data-dlwhy]').tap();
      await page.locator('#sheetBody [data-dlback]').tap();
      assert.equal(await page.evaluate(() => isDeload()), true);
      assert.match(await page.locator('#dayline').innerText(), /deload/i);
    },
  },
  {
    name: 'skipping the deload counts sessions already logged this week at the usual weight, and leaves lighter ones marked',
    async run({ open }) {
      const logs = {
        squat: [{ d: '2026-11-02', sets: sets(100, [10, 10, 10, 10]) }, { d: '2026-11-09', dl: 1, sets: sets(100, [10, 10, 10, 9]) }],   // trained as usual
        legpress: [{ d: '2026-11-02', sets: sets(140, [12, 12, 11]) }, { d: '2026-11-09', dl: 1, sets: sets(125, [12, 12]) }],          // took the deload
        legext: [{ d: '2026-11-09', dl: 1, sets: sets(40, [15, 14, 13]) }],                                                             // nothing earlier to compare with
        legcurl: [{ d: '2026-10-28', dl: 1, sets: sets(35, [12, 11, 10]) }],                                                            // not this week: untouched
      };
      const { page } = await open({ state: v2State({ profile: week6, logs }) });
      await page.locator('#dlCard [data-dlskip]').tap();
      const flags = await page.evaluate(() => ({ squat: !!S.logs.squat[1].dl, legpress: !!S.logs.legpress[1].dl, legext: !!S.logs.legext[0].dl, legcurl: !!S.logs.legcurl[0].dl }));
      assert.deepEqual(flags, { squat: false, legpress: true, legext: false, legcurl: true });
    },
  },
  {
    name: 'the logbook says what a deload session is, in words on the screen',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      const lg = await openToday(page, 'squat');
      assert.match(await lg.locator('.dlnote').innerText(), /easier on purpose/i);
      const h = await hint(page, 'squat');
      assert.match(h, /^Deload week: about 90 kg/, h);
      assert.match(h, /3 sets instead of 4/, h);
      assert.match(h, /three more reps/, h);
      assert.match(await lg.locator('.dlchip').innerText(), /on/i);
      await lg.locator('.dlnote [data-dlwhy]').tap();
      assert.match(await page.locator('#sheetTitle').innerText(), /deload/i);
      await page.keyboard.press('Escape');
      await lg.locator('.dlchip').tap();
      const lg2 = page.locator(blk + '.logger[data-log="squat"]');
      assert.match(await lg2.locator('.dlchip').innerText(), /off/i);
      assert.match(await hint(page, 'squat'), /^Today:/);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'Reference and the Map explain deload weeks too',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: week6 }) });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnGuide').tap();
      const txt = await page.locator('#sheetBody').evaluate((el) => { const d = Array.from(el.querySelectorAll('details')).find((x) => /deload/i.test(x.querySelector('summary').textContent)); return d ? d.textContent : ''; });
      assert.ok(txt.length > 300, 'no Reference entry about deload weeks');
      for (const re of [/week 6/i, /week 12/i, /easy week/i]) assert.match(txt, re);
      await page.keyboard.press('Escape');
      const day = await page.evaluate(() => { daySheet(38); return document.querySelector('#sheetBody').innerText; });
      assert.match(day, /easy week/i, 'the day sheet still explains a deload in shorthand');
    },
  },
  {
    name: '"Same as last time" is offered on a deload day and fills the lighter deload sets',
    async run({ open }) {
      const { page, clock, errors } = await open({ state: v2State({ profile: week6, logs: squat100 }), hash: 'train' });
      const lg = await openToday(page, 'squat');
      const btn = lg.locator('[data-repeat]');
      assert.equal(await btn.count(), 1, 'the button is hidden in a deload week');
      assert.match(await btn.innerText(), /same as last time/i);
      assert.match(await btn.innerText(), /easier/i);
      assert.match(await lg.locator('.lh .last').innerText(), /100×10/, 'last week is not shown');
      await btn.tap();
      const e = await page.evaluate(() => todayEntry('squat'));
      assert.deepEqual(e.sets, [{ pre: 1, w: 90, r: 10 }, { pre: 1, w: 90, r: 10 }, { pre: 1, w: 90, r: 10 }, {}]);
      assert.equal(e.dl, 1);
      const lg2 = page.locator(blk + '.logger[data-log="squat"]');
      for (const i of [0, 1, 2]) await tick(page, 'squat', i);
      await clock.runFor(300);
      assert.equal(await page.evaluate(() => loggedSets(todayEntry('squat')).length), 3);
      assert.match(await lg2.locator('.verdict').innerText(), /enough for today/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'in a normal week the button fills last time as it was',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs: squat100 }), hash: 'train' });
      const lg = await openToday(page, 'squat');
      assert.equal((await lg.locator('[data-repeat]').innerText()).trim().toLowerCase(), 'same as last time');
      await lg.locator('[data-repeat]').tap();
      assert.deepEqual(await page.evaluate(() => todayEntry('squat').sets), [{ pre: 1, w: 100, r: 10 }, { pre: 1, w: 100, r: 10 }, { pre: 1, w: 100, r: 10 }, { pre: 1, w: 100, r: 10 }]);
    },
  },
  {
    name: '"Done with this lift" asks about rows filled from last time instead of dropping them',
    async run({ open }) {
      const logs = { squat: [{ d: '2026-11-04', sets: sets(80, [8, 8, 7, 6]) }], legpress: [{ d: '2026-11-04', sets: sets(140, [12, 12, 11]) }], legext: [{ d: '2026-11-04', sets: sets(40, [15, 14, 13]) }] };
      const { page, clock, errors } = await open({ state: v2State({ logs }), hash: 'train' });
      // yes: the sets were done
      let lg = await openToday(page, 'squat');
      await lg.locator('[data-repeat]').tap();
      await page.locator(blk + '.logger[data-log="squat"] [data-savelog]').tap();
      let ask = page.locator(blk + '.logger[data-log="squat"] .askbar');
      await ask.waitFor();
      assert.match(await ask.innerText(), /4 sets/);
      assert.match(await ask.innerText(), /did you do/i);
      assert.equal(await page.evaluate(() => todayEntry('squat').sets.filter((s) => s.pre).length), 4, 'the rows were dropped before the answer');
      await ask.locator('[data-askyes]').tap();
      assert.deepEqual(await page.evaluate(() => todayEntry('squat').sets), [{ w: 80, r: 8, done: 1 }, { w: 80, r: 8, done: 1 }, { w: 80, r: 7, done: 1 }, { w: 80, r: 6, done: 1 }]);
      assert.equal(await page.locator(blk + '.logger[data-log="squat"] .askbar').count(), 0);
      assert.match(await hint(page, 'squat'), /^Next session:/);
      // no: they were not
      lg = await openToday(page, 'legpress');
      await lg.locator('[data-repeat]').tap();
      await page.locator(blk + '.logger[data-log="legpress"] [data-savelog]').tap();
      ask = page.locator(blk + '.logger[data-log="legpress"] .askbar');
      await ask.waitFor();
      await ask.locator('[data-askno]').tap();
      assert.equal(await page.evaluate(() => todayEntry('legpress')), null, 'sets that were not done were kept');
      assert.equal(await page.evaluate(() => S.logs.legpress.length), 1);
      // one row ticked, two left as filled: the question counts the two, and goes away when they are dealt with by hand
      lg = await openToday(page, 'legext');
      await lg.locator('[data-repeat]').tap();
      await tick(page, 'legext', 0);
      await clock.runFor(300);
      await page.locator(blk + '.logger[data-log="legext"] [data-savelog]').tap();
      ask = page.locator(blk + '.logger[data-log="legext"] .askbar');
      await ask.waitFor();
      assert.match(await ask.innerText(), /2 sets/);
      await tick(page, 'legext', 1);
      await clock.runFor(300);
      assert.equal(await page.locator(blk + '.logger[data-log="legext"] .askbar').count(), 0, 'the question stayed after the logbook was used again');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a returning user is told once what changed; a new user is not',
    async run({ open }) {
      const a = await open({ state: v2State({ logs: squat100 }) });
      await a.page.locator('#ro-today').waitFor();
      const card = a.page.locator('#helpCard .card');
      assert.equal(await card.count(), 1, 'nothing says what changed');
      assert.match(await card.innerText(), /angles/i);
      assert.match(await card.innerText(), /deload/i);
      await card.locator('[data-hidenews]').tap();
      assert.equal(await a.page.locator('#helpCard .card').count(), 0);
      await a.page.reload();
      await a.page.locator('#ro-today').waitFor();
      assert.equal(await a.page.locator('#helpCard .card').count(), 0, 'the note came back after a reload');
      await a.context.close();
      const b = await open({});
      await finishSetup(b.page);
      assert.match(await b.page.locator('#helpCard').innerText(), /how to use this/i);
      await b.page.locator('#helpCard [data-hidehelp]').tap();
      assert.equal(await b.page.locator('#helpCard .card').count(), 0, 'someone who has just set the app up was told what changed');
    },
  },
];
