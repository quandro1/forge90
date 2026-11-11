// Smoke: every tab and sheet draws, the everyday taps work, and nothing throws.
import assert from 'node:assert/strict';
import { v1State, finishSetup } from './harness.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();

export default [
  {
    name: 'every tab and sheet draws without an error (mid-block state)',
    async run({ open }) {
      const st = v1State({
        weights: { '2026-11-09': 88.2, '2026-11-10': 87.9, '2026-11-11': 87.8 },
        logs: { inclineBB: [{ d: '2026-11-09', sets: [{ w: 55, r: 8, done: 1 }, { w: 55, r: 8, done: 1 }, { w: 55, r: 7, done: 1 }, { w: 55, r: 6, done: 1 }] }] },
        checks: { '2026-11-09': ['protein', 'steps', 'sleep', 'session'] },
      });
      const { page, errors } = await open({ state: st });
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#dayline').innerText(), /day 3 of 91/i);

      for (const t of ['train', 'plan', 'fuel', 'prog', 'today']) {
        await tab(page, t);
        assert.ok(await page.locator('#s-' + t + '.on').count() === 1, 'tab ' + t + ' did not open');
      }
      // sheets
      await page.locator('#btnGuide').tap();
      await page.locator('#sheet.on #sheetBody details').first().waitFor();
      await page.locator('#sheet [data-close]').last().tap();
      await page.locator('#btnSet').tap();
      await page.locator('#sheet.on #f-start').waitFor();
      await page.locator('#sheet [data-close]').last().tap();
      await tab(page, 'train');
      await page.locator('#btnLib').tap();
      await page.locator('#sheet.on #libList .libitem').first().waitFor();
      await page.locator('#sheet [data-close]').last().tap();
      await tab(page, 'plan');
      await page.locator('#fullPunch button[data-day="3"]').tap();
      await page.locator('#sheet.on #sheetBody .readout').waitFor();
      await page.locator('#sheet [data-close]').last().tap();
      // every exercise card of every day opens and shows its logbook
      await tab(page, 'train');
      const blocks = await page.locator('#dayList details[data-dayblock]').count();
      assert.ok(blocks >= 3, 'no day blocks');
      for (let b = 0; b < blocks; b++) {
        const blk = page.locator('#dayList details[data-dayblock="' + b + '"]');
        if (!(await blk.evaluate((el) => el.open))) await blk.locator('> summary').click();
        const cards = await blk.locator('.ex').count();
        assert.ok(cards >= 3, 'day ' + b + ' has no exercises');
        for (let c = 0; c < cards; c++) {
          const card = blk.locator('.ex').nth(c);
          await card.locator('.ex-h').click();
          assert.equal(await card.locator('.logger').count(), 1, 'card ' + b + '/' + c + ' has no logbook');
        }
      }
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the everyday taps on Today and Fuel save',
    async run({ open }) {
      const { page, errors } = await open({ state: v1State() });
      await page.locator('#checklist [data-chk="protein"]').tap();
      await page.locator('#qWeight').fill('87.5');
      await tab(page, 'fuel');
      await page.locator('#foodChips .chip').first().tap();
      await page.waitForTimeout(400);
      const s = await page.evaluate(() => ({ checks: S.checks[TODAY], w: S.weights[TODAY], food: (S.food[TODAY] || []).length }));
      assert.deepEqual(s.checks, ['protein']);
      assert.equal(s.w, 87.5);
      assert.equal(s.food, 1);
      await page.reload();
      await page.locator('#s-fuel.on #foodTally .tallyitem').waitFor();   // the hash keeps you on Fuel
      const again = await page.evaluate(() => ({ checks: S.checks[TODAY], w: S.weights[TODAY], food: (S.food[TODAY] || []).length }));
      assert.deepEqual(again, s, 'state did not survive a reload');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a brand-new visitor gets a working app',
    async run({ open }) {
      const { page, errors } = await open({});
      await finishSetup(page);
      for (const t of ['train', 'plan', 'fuel', 'prog', 'today']) await tab(page, t);
      assert.match(await page.locator('#dayline').innerText(), /day 1 of 91/i);
      assert.deepEqual(errors, []);
    },
  },
];
