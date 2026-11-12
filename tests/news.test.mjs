// The note on Today that says what an update changed: shown once, and only the updates this person has not read about.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const logs = { squat: [{ d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }] }] };
const card = (page) => page.locator('#helpCard .card');

export default [
  {
    name: 'someone who read the last note is told what this update changed, and only that',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ logs, ui: { helpSeen: 1, news: 1 } }) });
      await page.locator('#ro-today').waitFor();
      assert.equal(await card(page).count(), 1, 'nothing says what changed');
      const text = await card(page).innerText();
      assert.match(text, /new in this update/i);
      assert.match(text, /real body/i, 'the new body drawing is not mentioned');
      assert.match(text, /how to do it/i, 'it does not say where the drawing is');
      assert.match(text, /notch/i); assert.match(text, /grey line/i);
      assert.doesNotMatch(text, /deload weeks are explained/i, 'a note that was already read is shown again');
      await card(page).locator('[data-hidenews]').tap();
      assert.equal(await card(page).count(), 0);
      assert.equal(await page.evaluate(() => S.ui.news), await page.evaluate(() => NEWS));
      await page.reload();
      await page.locator('#ro-today').waitFor();
      assert.equal(await card(page).count(), 0, 'the note came back after a reload');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'someone who never closed the earlier note sees both, the newest first',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, ui: { helpSeen: 1 } }) });
      await page.locator('#ro-today').waitFor();
      const text = await card(page).innerText();
      assert.match(text, /real body/i);
      assert.match(text, /deload weeks are explained/i, 'the earlier note was dropped unread');
      assert.ok(text.search(/real body/i) < text.search(/deload weeks are explained/i), 'the newest change is not first');
    },
  },
  {
    name: 'someone who is up to date sees no note',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, ui: { helpSeen: 1, news: 99 } }) });
      await page.locator('#ro-today').waitFor();
      assert.equal(await card(page).count(), 0);
    },
  },
];
