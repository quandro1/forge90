// Rest timer: ticking a set must always start the rest.
import assert from 'node:assert/strict';
import { v1State } from './harness.mjs';

/** Open a day block and an exercise card on the Train tab. */
export async function openCard(page, block, id) {
  await page.locator('details[data-dayblock="' + block + '"] > summary').click();
  await page.locator('details[data-dayblock="' + block + '"] .ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator('details[data-dayblock="' + block + '"] .logger[data-log="' + id + '"]').waitFor();
}
export const row = (page, id, i) => page.locator('.logger[data-log="' + id + '"]').first();
export async function typeSet(page, id, i, w, r) {
  const lg = page.locator('.logger[data-log="' + id + '"]').first();
  if (w != null) await lg.locator('input[data-set="' + i + '"][data-f="w"]').fill(String(w));
  if (r != null) await lg.locator('input[data-set="' + i + '"][data-f="r"]').fill(String(r));
}
export async function tick(page, id, i) {
  await page.locator('.logger[data-log="' + id + '"]').first().locator('button[data-ok="' + i + '"]').tap();
}
export const timerState = (page) => page.evaluate(() => (typeof RT === 'undefined' || !RT) ? null : { id: RT.id, set: RT.set, done: !!RT.done, left: RT.end - Date.now() });

export default [
  {
    name: 'ticking a set starts the rest (reps inside the range)',
    async run({ open }) {
      const { page, errors } = await open({ state: v1State(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');            // 4 x 6-10, 2 min
      await typeSet(page, 'inclineBB', 0, 60, 8);
      await tick(page, 'inclineBB', 0);
      const rt = await timerState(page);
      assert.ok(rt, 'no rest timer is running after the tick');
      assert.equal(rt.id, 'inclineBB');
      assert.match(await page.locator('.rest[data-rest="inclineBB"] .rt-t').first().innerText(), /^\d:\d\d$/);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'ticking a set starts the rest when the set hit the TOP of the rep range',
    async run({ open }) {
      const { page, errors } = await open({ state: v1State(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');            // 4 x 6-10: 10 is the ceiling
      await typeSet(page, 'inclineBB', 0, 60, 10);
      await tick(page, 'inclineBB', 0);
      const rt = await timerState(page);
      assert.deepEqual(errors, [], 'the page threw');
      assert.ok(rt, 'no rest timer is running after the tick');
      assert.equal(rt.id, 'inclineBB');
      assert.ok(await page.locator('.logger[data-log="inclineBB"] .setrow.done').count() >= 1, 'the row is not shown as done');
    },
  },
  {
    name: 'the rest still starts when the progression hint cannot be computed',
    async run({ open }) {
      const { page } = await open({ state: v1State(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      await page.evaluate(() => { verdict = () => { throw new Error('hint failed'); }; });
      await typeSet(page, 'inclineBB', 0, 60, 8);
      await tick(page, 'inclineBB', 0);
      const rt = await timerState(page);
      assert.ok(rt, 'no rest timer is running after the tick');
      assert.equal(rt.id, 'inclineBB');
      assert.ok(await page.locator('.logger[data-log="inclineBB"] .setrow.done').count() >= 1, 'the row is not shown as done');
    },
  },
  {
    name: 'the rest still starts when the logbook cannot be redrawn at all',
    async run({ open }) {
      const { page } = await open({ state: v1State(), hash: 'train' });
      await openCard(page, 0, 'inclineBB');
      await typeSet(page, 'inclineBB', 0, 60, 8);
      await page.evaluate(() => { logger = () => { throw new Error('draw failed'); }; });
      await tick(page, 'inclineBB', 0);
      const rt = await timerState(page);
      assert.ok(rt, 'no rest timer is running after the tick');
      assert.equal(rt.id, 'inclineBB');
      assert.equal(await page.evaluate(() => S.logs.inclineBB[0].sets[0].done), 1, 'the set was not saved as done');
    },
  },
  {
    name: 'a card whose sets so far are all at the ceiling still opens after a reload',
    async run({ open }) {
      const st = v1State({ logs: { inclineBB: [{ d: '2026-11-11', sets: [{ w: 60, r: 10, done: 1 }, {}, {}, {}] }] } });
      const { page, errors } = await open({ state: st, hash: 'train' });
      await page.locator('details[data-dayblock="0"] > summary').click();
      await page.locator('details[data-dayblock="0"] .ex[data-ex="inclineBB"] .ex-h').click();
      await page.waitForTimeout(150);
      assert.deepEqual(errors, [], 'the page threw');
      assert.ok(await page.locator('details[data-dayblock="0"] .logger[data-log="inclineBB"]').count() === 1, 'the card opened empty');
    },
  },
];
