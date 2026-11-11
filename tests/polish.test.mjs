// Using it on a phone, in a gym: buttons a thumb can hit, a way back from a slip, and no double entry.
import assert from 'node:assert/strict';
import { v2State, TODAY } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();
const box = async (loc) => { const b = await loc.boundingBox(); return { w: Math.round(b.width), h: Math.round(b.height) }; };
const man = { sex: 'm', age: 23, h: 180, w: 88, act: 1.45, goal: 'cut' };
const YESTERDAY = '2026-11-10';
// today's session is already unfolded on Train: open one of its exercise cards
const openToday = async (page, id) => {
  await page.locator('details[data-dayblock="2"] .ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator('details[data-dayblock="2"] .logger[data-log="' + id + '"]').waitFor();
};

export default [
  {
    name: 'the tick and the clear button are big enough to hit, on a small phone too',
    async run({ open }) {
      for (const device of ['Pixel 7', 'iPhone SE']) {
        const { page, context } = await open({ state: v2State(), hash: 'train', device });
        await openToday(page, 'squat');
        const rowLoc = page.locator('.logger[data-log="squat"] .setrow').first();
        const ok = await box(rowLoc.locator('.ok')), del = await box(rowLoc.locator('.del'));
        const w = await box(rowLoc.locator('input[data-f="w"]'));
        assert.ok(ok.w >= 44 && ok.h >= 44, device + ': the tick is ' + ok.w + ' x ' + ok.h + ' px');
        assert.ok(del.w >= 40 && del.h >= 40, device + ': the clear button is ' + del.w + ' x ' + del.h + ' px');
        assert.ok(w.w >= 56 && w.h >= 40, device + ': the weight field is ' + w.w + ' x ' + w.h + ' px');
        const spill = await rowLoc.evaluate((el) => el.scrollWidth - el.clientWidth);
        assert.ok(spill <= 1, device + ': the set row is ' + spill + ' px wider than its box');
        const page_spill = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(page_spill <= 1, device + ': the page scrolls sideways by ' + page_spill + ' px');
        await context.close();
      }
    },
  },
  {
    name: 'a set cleared by mistake can be put back',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State(), hash: 'train' });
      await openToday(page, 'squat');
      const lg = page.locator('.logger[data-log="squat"]').first();
      await typeSet(page, 'squat', 0, 80, 8);
      await tick(page, 'squat', 0);
      await typeSet(page, 'squat', 1, 80, 7);
      await lg.locator('button[data-del="0"]').tap();                       // the thumb hit the cross, not the tick
      assert.equal(await lg.locator('input[data-set="0"][data-f="w"]').inputValue(), '');
      await lg.locator('[data-undo]').tap();
      assert.equal(await lg.locator('input[data-set="0"][data-f="w"]').inputValue(), '80');
      assert.equal(await lg.locator('input[data-set="0"][data-f="r"]').inputValue(), '8');
      assert.equal(await lg.locator('.setrow').first().evaluate((el) => el.classList.contains('done')), true, 'the row came back without its tick');
      assert.equal(await lg.locator('input[data-set="1"][data-f="r"]').inputValue(), '7', 'undo disturbed another row');
      assert.equal(await lg.locator('[data-undo]').count(), 0, 'the undo button stayed after it was used');
      const stored = await page.evaluate(() => S.logs.squat[0].sets[0]);
      assert.deepEqual([stored.w, stored.r, stored.done], [80, 8, 1]);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the phone\'s Back button closes an open sheet and leaves the app where it was',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State(), hash: 'fuel' });
      await page.locator('#s-fuel.on').waitFor();
      const url = page.url();
      await page.locator('#btnSet').tap();
      await page.locator('#sheet.on').waitFor();
      await page.goBack();
      await page.waitForFunction(() => !document.querySelector('#sheet.on'));
      assert.equal(page.url(), url, 'Back left the page');
      assert.equal(await page.locator('#s-fuel.on').count(), 1, 'Back changed the tab');
      // closing with the cross leaves no stray step behind: the next Back is not swallowed by a dead entry
      await page.locator('#btnGuide').tap();
      await page.locator('#sheet.on').waitFor();
      await page.locator('#sheet [data-close]').last().tap();
      await page.waitForFunction(() => !document.querySelector('#sheet.on') && !(history.state && history.state.sheet));
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'changing a number in Settings updates the screen underneath straight away',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: man }), hash: 'fuel' });
      await page.locator('#ro-macros').waitFor();
      assert.match(await page.locator('#ro-macros').innerText(), /2280/);
      await page.locator('#btnSet').tap();
      await page.locator('#f-w').fill('70');
      const want = await page.evaluate(() => targets().train);
      assert.notEqual(want, 2280);
      assert.match(await page.locator('#ro-macros').innerText(), new RegExp(String(want)), 'Fuel still shows the old numbers behind the sheet');
      const total = parseInt((await page.locator('#mealTotal').innerText()).replace(/[^0-9]/g, ' ').trim().split(/ +/)[0], 10);
      assert.ok(Math.abs(total - want) <= 90, 'the example day (' + total + ') was not rebuilt for the new target (' + want + ')');
    },
  },
  {
    name: 'the list ticks itself from what was logged, and unticks if the number drops',
    async run({ open }) {
      const food = {}; food[TODAY] = [{ n: 'A big day', k: 900, p: 200, c: 0, f: 10 }];
      const { page, clock } = await open({ state: v2State({ profile: man, food }) });
      await page.locator('#ro-today').waitFor();
      const pressed = (k) => page.locator('#checklist [data-chk="' + k + '"]').getAttribute('aria-pressed');
      assert.equal(await pressed('protein'), 'true', '200 g of protein is logged and the list does not show it');
      assert.equal(await pressed('steps'), 'false');
      const goal = await page.evaluate(() => stepsTarget(infoForDate(TODAY).week));
      await page.locator('#qSteps').fill(String(goal));
      await clock.runFor(800);
      assert.equal(await pressed('steps'), 'true', goal + ' steps are logged and the list does not show it');
      await page.locator('#qSteps').fill('3000');                             // a typing slip, corrected
      await clock.runFor(800);
      assert.equal(await pressed('steps'), 'false', 'the tick stayed after the steps fell under the target');
      await page.locator('#checklist [data-chk="steps"]').tap();              // ticked by hand: the app leaves it alone
      await page.locator('#qSteps').fill('3100');
      await clock.runFor(800);
      assert.equal(await pressed('steps'), 'true', 'a tick made by hand was removed');
      await tab(page, 'fuel');
      await page.locator('#foodTally .tallyitem').first().tap();              // the food was logged by mistake
      await tab(page, 'today');
      assert.equal(await pressed('protein'), 'false', 'the protein tick stayed after the food was removed');
    },
  },
  {
    name: 'yesterday\'s list can still be ticked, from the Map',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'plan' });
      await page.locator('[data-day="2"]').first().tap();                     // 10 Nov, day 2 of the block
      await page.locator('#sheet.on').waitFor();
      await page.locator('#sheet [data-daychk="water"]').tap();
      await page.locator('#sheet [data-daychk="sleep"]').tap();
      assert.deepEqual(await page.evaluate((d) => (S.checks[d] || []).slice().sort(), YESTERDAY), ['sleep', 'water']);
      assert.equal(await page.locator('#sheet [data-daychk="water"]').getAttribute('aria-pressed'), 'true');
      await page.locator('#sheet [data-daychk="water"]').tap();
      assert.deepEqual(await page.evaluate((d) => S.checks[d], YESTERDAY), ['sleep']);
      await page.locator('#sheet [data-close]').last().tap();
      await page.locator('[data-day="5"]').first().tap();                     // a day that has not happened yet
      await page.locator('#sheet.on').waitFor();
      assert.equal(await page.locator('#sheet [data-daychk]').count(), 0, 'a future day can be ticked');
    },
  },
  {
    name: 'one step target for the day, wherever it is shown',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const goal = await page.evaluate(() => stepsTarget(infoForDate(TODAY).week).toLocaleString());
      assert.match(await page.locator('#sessionCard').innerText(), new RegExp(goal + ' steps', 'i'));
      assert.match(await page.locator('#checklist [data-chk="steps"]').innerText(), new RegExp(goal + ' steps'));
      assert.match(await page.locator('#condCard').innerText(), new RegExp('of ' + goal));
    },
  },
];
