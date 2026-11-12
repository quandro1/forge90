// One-tap backup through the phone's share sheet (WhatsApp, Gmail, Drive), and a reminder for a log that
// lives on this phone only. Built on 12 Nov 2026 from the research into what would improve the app.
import assert from 'node:assert/strict';
import { v2State, NOW } from './harness.mjs';

const logs = { squat: [{ d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }, { w: 80, r: 7, done: 1 }] }] };
const weights = { '2026-11-02': 88.4, '2026-11-03': 88.1, '2026-11-04': 88 };
const DAY = 86400000, NOW_MS = new Date(NOW).getTime();      // the pretend moment every test runs at
/* A stand-in for the phone's share sheet. It keeps what the app hands over, so the test can read the file.
   ok: takes the file. cancel: the person closed the sheet. refuse: the phone would not open it. none: no share sheet. */
const sheet = (mode) => mode === 'none'
  ? `Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
     Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });`
  : `window.__shared = []; window.__shareCalls = 0;
     Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d) => !!(d && d.files && d.files.length) });
     Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => {
       window.__shareCalls++;
       ${mode === 'cancel' ? "throw new DOMException('closed', 'AbortError');" : ''}
       ${mode === 'refuse' ? "throw new DOMException('not allowed', 'NotAllowedError');" : ''}
       const f = d.files[0];
       window.__shared.push({ n: d.files.length, name: f.name, type: f.type, text: await f.text() });
     } });`;
const settings = async (page) => { await page.locator('#ro-today').waitFor(); await page.locator('#btnSet').tap(); await page.locator('#btnBackup').waitFor(); };

export default [
  {
    name: 'one tap hands the share sheet a text file that holds the whole log, and the app remembers it',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State({ logs, weights }), init: sheet('ok') });
      await settings(page);
      assert.match(await page.locator('#bkLine').innerText(), /no backup yet/i);
      await page.locator('#btnBackup').tap();
      await page.waitForFunction(() => window.__shared.length === 1);
      const f = await page.evaluate(() => window.__shared[0]);
      assert.equal(f.n, 1);
      assert.equal(f.name, 'forge90-backup-2026-11-11.txt');
      assert.equal(f.type, 'text/plain', 'a share sheet takes a text file, not the app\'s own file type');
      const saved = JSON.parse(f.text);
      assert.equal(saved.v, 2);
      assert.deepEqual(saved.logs.squat[0].sets.map((s) => [s.w, s.r]), [[80, 8], [80, 7]]);
      assert.equal(saved.weights['2026-11-03'], 88.1);
      await page.waitForFunction(() => /today/i.test(document.querySelector('#bkLine').textContent));
      assert.equal(typeof (await page.evaluate(() => S.ui.bk)), 'number');
      await page.reload();
      await settings(page);
      assert.match(await page.locator('#bkLine').innerText(), /last backup: today/i, 'the backup was forgotten after a reload');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the file that was shared restores the log on another phone',
    async run({ open }) {
      const a = await open({ state: v2State({ logs, weights }), init: sheet('ok') });
      await settings(a.page);
      await a.page.locator('#btnBackup').tap();
      await a.page.waitForFunction(() => window.__shared.length === 1);
      const f = await a.page.evaluate(() => window.__shared[0]);
      await a.context.close();
      const b = await open({ state: v2State() });
      await b.page.locator('#ro-today').waitFor();
      assert.equal(await b.page.evaluate(() => Object.keys(S.logs).length), 0);
      await b.page.locator('#btnSet').tap();
      const chooser = b.page.waitForEvent('filechooser');
      await b.page.locator('#btnImport').tap();
      const ch = await chooser;
      const accept = await ch.element().getAttribute('accept');
      assert.match(accept, /\.txt/, 'the restore picker does not offer text files: ' + accept);
      assert.match(accept, /\.json/, 'the restore picker no longer offers the older backup files: ' + accept);
      await ch.setFiles({ name: f.name, mimeType: 'text/plain', buffer: Buffer.from(f.text, 'utf8') });
      await b.page.waitForFunction(() => typeof S === 'object' && S.logs && S.logs.squat);
      assert.deepEqual(await b.page.evaluate(() => S.logs.squat[0].sets.map((s) => [s.w, s.r])), [[80, 8], [80, 7]]);
      assert.equal(await b.page.evaluate(() => S.weights['2026-11-03']), 88.1);
    },
  },
  {
    name: 'closing the share sheet without sending records no backup',
    async run({ open }) {
      const { page } = await open({ state: v2State({ logs, weights }), init: sheet('cancel') });
      await settings(page);
      await page.locator('#btnBackup').tap();
      await page.waitForFunction(() => window.__shareCalls === 1);
      await page.waitForFunction(() => /cancel/i.test(document.querySelector('#btnBackup').textContent));
      assert.equal(await page.evaluate(() => S.ui.bk), undefined, 'a backup was recorded although nothing was sent');
      assert.match(await page.locator('#bkLine').innerText(), /no backup yet/i);
    },
  },
  {
    name: 'where the phone has no share sheet, or will not open it, the same button saves the file instead',
    async run({ open }) {
      for (const mode of ['none', 'refuse']) {
        const { page } = await open({ state: v2State({ logs, weights }), init: sheet(mode) });
        await settings(page);
        const dl = page.waitForEvent('download');
        await page.locator('#btnBackup').tap();
        const file = await dl;
        assert.match(file.suggestedFilename(), /^forge90-backup-2026-11-11\.(json|txt)$/, mode + ': saved as ' + file.suggestedFilename());
        await page.waitForFunction(() => typeof S.ui.bk === 'number');
        await page.waitForFunction(() => /today/i.test(document.querySelector('#bkLine').textContent));
      }
    },
  },
  {
    name: 'Today reminds someone whose log lives on this phone only, and "Later" keeps it quiet for a week',
    async run({ open }) {
      const card = (page) => page.locator('#bkCard .card');
      const at = async (over, init) => { const o = await open({ state: v2State(over), init: init || sheet('ok') }); await o.page.locator('#ro-today').waitFor(); return o; };
      // a week of use, a log, never backed up: the reminder shows
      const a = await at({ logs, weights });
      assert.equal(await card(a.page).count(), 1, 'no reminder for a log that was never backed up');
      const text = await card(a.page).innerText();
      assert.match(text, /only on this phone/i);
      assert.match(text, /whatsapp|gmail|drive/i, 'it does not say where a copy can go');
      await card(a.page).locator('[data-bklater]').tap();
      assert.equal(await card(a.page).count(), 0);
      assert.equal(await a.page.evaluate(() => S.ui.bkLater), '2026-11-11');
      await a.page.reload();
      await a.page.locator('#ro-today').waitFor();
      assert.equal(await card(a.page).count(), 0, '"Later" was forgotten after a reload');
      // "Later" eight days ago: it is back
      const b = await at({ logs, weights, ui: { bkLater: '2026-11-03' } });
      assert.equal(await card(b.page).count(), 1, 'the reminder did not come back a week after "Later"');
      // the button on the card backs up, and the card goes
      await card(b.page).locator('[data-bknow]').tap();
      await b.page.waitForFunction(() => window.__shared.length === 1);
      await b.page.waitForFunction(() => !document.querySelector('#bkCard .card'));
      // backed up 5 days ago: quiet. 20 days ago: due again.
      const c = await at({ logs, weights, ui: { bk: NOW_MS - 5 * DAY } });
      assert.equal(await card(c.page).count(), 0, 'reminded although a backup is 5 days old');
      const d = await at({ logs, weights, ui: { bk: NOW_MS - 20 * DAY } });
      assert.equal(await card(d.page).count(), 1, 'no reminder although the last backup is 20 days old');
      assert.match(await card(d.page).innerText(), /20 days/);
      // nothing worth keeping yet, or only a few days of use: no reminder
      const e = await at({});
      assert.equal(await card(e.page).count(), 0, 'reminded with nothing logged');
      const f = await at({ logs: { squat: [{ d: '2026-11-08', sets: [{ w: 80, r: 8, done: 1 }] }] } });
      assert.equal(await card(f.page).count(), 0, 'reminded in the first week of use');
    },
  },
];
