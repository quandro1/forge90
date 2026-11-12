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
    name: 'the note for the backup, lift history and weekly muscles update says where each one is',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, ui: { helpSeen: 1, news: 2 } }) });
      await page.locator('#ro-today').waitFor();
      const text = await card(page).innerText();
      assert.match(text, /back up now/i); assert.match(text, /whatsapp|gmail|drive/i);
      assert.match(text, /history/i); assert.match(text, /new best/i);
      assert.match(text, /muscles this week/i); assert.match(text, /progress/i);
      assert.doesNotMatch(text, /real body/i, 'a note that was already read is shown again');
    },
  },
  {
    name: 'every update note is short: at most three points, each a few lines on a phone',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, ui: { helpSeen: 1, news: 99 } }) });
      await page.locator('#ro-today').waitFor();
      const notes = await page.evaluate(() => ({ latest: NEWS, notes: Object.keys(NEWS_NOTES).map((k) => ({ n: +k, items: NEWS_NOTES[k].map((t) => t.replace(/<\/?b>/g, '').length) })) }));
      assert.equal(Math.max(...notes.notes.map((x) => x.n)), notes.latest, 'NEWS is not the number of the newest note');
      for (const x of notes.notes) {
        assert.ok(x.items.length >= 1 && x.items.length <= 3, 'note ' + x.n + ' has ' + x.items.length + ' points');
        if (x.n >= 2) assert.ok(x.items.every((len) => len <= 240), 'note ' + x.n + ' has a point of ' + Math.max(...x.items) + ' characters');
      }
    },
  },
  {
    name: 'the note for the phone measuring and the tempo beeps says where each one is, and the guide explains them',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, ui: { helpSeen: 1, news: 3 } }) });
      await page.locator('#ro-today').waitFor();
      const text = await card(page).innerText();
      assert.match(text, /measure with phone/i); assert.match(text, /lay the phone/i);
      assert.match(text, /beeps/i); assert.match(text, /tempo/i);
      assert.doesNotMatch(text, /back up in one tap/i, 'a note that was already read is shown again');
      assert.ok((await card(page).locator('li').count()) <= 3, 'the note is long');
      await page.locator('#btnGuide').tap();
      const sec = page.locator('#sheetBody details', { hasText: 'Reading the angles' });
      await sec.locator('summary').click();
      const guide = await sec.innerText();
      assert.match(guide, /measure with phone/i); assert.match(guide, /beeps/i);
      assert.match(guide, /low note/i); assert.match(guide, /tap it again to stop/i);
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
