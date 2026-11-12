// "Measure with phone": on the lifts with a bench or seat angle, the phone lies on the pad and shows its slope.
// Built on 12 Nov 2026 from the research into what would improve the app.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const tilt = (page, beta, gamma) => page.evaluate(([b, g]) => { window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: b, gamma: g })); }, [beta, gamma || 0]);
const read = (page) => page.evaluate(() => ({
  num: document.querySelector('#tiltNum').textContent.trim(),
  state: document.querySelector('#tiltState').textContent.replace(/\s+/g, ' ').trim(),
  cls: document.querySelector('#tiltState').className,
}));
/* open a lift's "Measure with phone" from the page's own drawing of its form notes */
const openTilt = async (page, id) => {
  await page.locator('#ro-today').waitFor({ state: 'attached' });
  await page.evaluate((id) => {
    const host = document.createElement('div'); host.id = 'tiltHost'; host.innerHTML = formNotes(id, true);
    document.querySelector('#main').prepend(host);
  }, id);
  await page.locator('#tiltHost [data-tilt]').tap({ timeout: 6000 });
  await page.locator('#sheet.on #tiltNum').waitFor({ timeout: 6000 });
  await page.waitForFunction(() => TILT && TILT.ready);       // the phone has answered the question about its movement, if it asks one
};

export default [
  {
    name: 'the four bench and seat angles offer "Measure with phone", and no other row does',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate(() => {
        const rows = [], bad = [];
        for (const id in EX) {
          const d = document.createElement('div'); d.innerHTML = formNotes(id, true);
          const btns = d.querySelectorAll('[data-tilt]');
          EX[id].form.angles.forEach((a, i) => {
            const want = !!(a[5] && a[5].phone), row = d.querySelectorAll('.ang')[i], has = !!row.querySelector('[data-tilt]');
            if (want) rows.push(EX[id].name + ': ' + a[0]);
            if (want !== has) bad.push(id + ' ' + a[0] + ': ' + (has ? 'offers it' : 'does not offer it'));
            if (want && !/^(up|lean)$/.test(a[1])) bad.push(id + ' ' + a[0] + ': a phone cannot measure a "' + a[1] + '" angle');
          });
          if (btns.length !== EX[id].form.angles.filter((a) => a[5] && a[5].phone).length) bad.push(id + ': ' + btns.length + ' buttons');
        }
        return { rows, bad };
      });
      assert.deepEqual(r.bad, []);
      assert.deepEqual(r.rows.sort(), ['Incline Barbell Press: Bench', 'Incline Dumbbell Press: Bench', 'Leg Extension: Seat back', 'Seated Dumbbell Shoulder Press: Bench back']);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'on the card the link is on screen under its angle, big enough to tap, and opens the measuring sheet',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State(), hash: 'train', device: 'iPhone SE' });
      await page.locator('#dayList details').first().waitFor({ state: 'attached' });
      // the first lift of this plan that has an incline bench to set
      const at = await page.evaluate(() => { const s = sessions(); for (let si = 0; si < s.length; si++) for (const it of s[si].items) if (it.ex === 'inclineDB' || it.ex === 'inclineBB') return { si, id: it.ex }; return null; });
      assert.ok(at, 'the plan under test has no incline press');
      const blk = page.locator('details[data-dayblock="' + at.si + '"]');
      if (!(await blk.evaluate((d) => d.open))) await blk.locator('> summary').click();
      const card = blk.locator('.ex[data-ex="' + at.id + '"]');
      await card.locator('.ex-h').click();
      const btn = card.locator('.formnotes [data-tilt]');
      await btn.waitFor();
      const r = await btn.evaluate((b) => { const x = b.getBoundingClientRect(), c = b.closest('.ex').getBoundingClientRect(); return { shown: b.checkVisibility(), h: x.height, inside: x.right <= c.right + 0.5, row: !!b.closest('.ang'), text: b.textContent.trim() }; });
      assert.ok(r.shown && r.row, 'the link is not on screen in its angle row');
      assert.match(r.text, /measure with phone/i);
      assert.ok(r.h >= 32, 'the link is ' + Math.round(r.h) + ' px tall');
      assert.ok(r.inside, 'the link sticks out of the card');
      await btn.tap();
      await page.locator('#sheet.on #tiltNum').waitFor();
      const text = await page.locator('#sheetBody').innerText();
      assert.match(text, /30°/, 'the sheet does not name the target');
      assert.match(text, /lay the phone/i);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, 'the page scrolls sideways');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the sheet shows the slope the phone reports and says "right" only inside the target',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State() });
      await openTilt(page, 'inclineDB');                        // bench 30° up from flat
      assert.equal((await read(page)).num, '—', 'a number before the phone has reported anything');
      await tilt(page, 10);
      let r = await read(page);
      assert.equal(r.num, '10°'); assert.match(r.state, /too flat/i); assert.match(r.state, /raise/i); assert.doesNotMatch(r.cls, /\bok\b/);
      await tilt(page, 31);
      r = await read(page);
      assert.equal(r.num, '31°'); assert.match(r.state, /right/i); assert.match(r.cls, /\bok\b/);
      await tilt(page, 47);
      r = await read(page);
      assert.equal(r.num, '47°'); assert.match(r.state, /too steep/i); assert.match(r.state, /lower/i); assert.doesNotMatch(r.cls, /\bok\b/);
      // the edges of "right": 3 degrees either side of one number
      for (const [b, ok] of [[26, false], [27, true], [33, true], [34, false]]) {
        await tilt(page, 60); await tilt(page, b);
        assert.equal(/\bok\b/.test((await read(page)).cls), ok, b + '° ' + (ok ? 'should' : 'should not') + ' count as right for a 30° bench');
      }
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the slope is the same whichever way round the phone lies, face up or face down',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await openTilt(page, 'inclineDB');
      await tilt(page, 0, 30);                                  // rolled sideways along the slope
      assert.equal((await read(page)).num, '30°');
      await tilt(page, 60, 0); await tilt(page, 20, 20);        // diagonal: cos = cos20 x cos20 -> 28°
      assert.equal((await read(page)).num, '28°');
      await tilt(page, 60, 0); await tilt(page, 150, 0);        // face down on a 30° slope
      assert.equal((await read(page)).num, '30°');
      assert.equal(await page.evaluate(() => [tiltAngle(0, 0), tiltAngle(90, 0), tiltAngle(-45, 0), tiltAngle(180, 0)].map((x) => Math.round(x)).join()), '0,90,45,0');
    },
  },
  {
    name: 'a seat back is counted from upright, with its own words',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await openTilt(page, 'legext');                           // seat back 20-40° back from upright
      assert.match(await page.locator('#sheetBody').innerText(), /20–40°/);
      await tilt(page, 60);                                     // the phone is 60° from level against the pad: 30° back from upright
      let r = await read(page);
      assert.equal(r.num, '30°'); assert.match(r.cls, /\bok\b/);
      await tilt(page, 85);                                     // nearly upright
      r = await read(page);
      assert.equal(r.num, '5°'); assert.match(r.state, /too upright/i); assert.doesNotMatch(r.cls, /\bok\b/);
      await tilt(page, 30);                                     // lying far back
      r = await read(page);
      assert.equal(r.num, '60°'); assert.match(r.state, /too far back/i);
    },
  },
  {
    name: 'a reading sent by the browser itself reaches the sheet, and a phone that sends none is told so',
    async run({ open }) {
      const a = await open({ state: v2State() });
      await openTilt(a.page, 'inclineDB');
      const cdp = await a.page.context().newCDPSession(a.page);
      await cdp.send('DeviceOrientation.setDeviceOrientationOverride', { alpha: 0, beta: 29, gamma: 0 });
      await a.page.waitForFunction(() => document.querySelector('#tiltNum').textContent.trim() === '29°');
      assert.match((await read(a.page)).cls, /\bok\b/);
      await a.context.close();
      const b = await open({ state: v2State() });
      await openTilt(b.page, 'inclineDB');
      await b.clock.runFor(3200);
      const r = await read(b.page);
      assert.equal(r.num, '—');
      assert.match(r.state, /no reading/i);
    },
  },
  {
    name: 'closing the sheet stops the measuring',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State() });
      await openTilt(page, 'inclineDB');
      await tilt(page, 30);
      assert.equal(await page.evaluate(() => !!TILT), true);
      await page.locator('#sheet .panel [data-close]').first().tap();
      await page.waitForFunction(() => !document.querySelector('#sheet.on'));
      assert.equal(await page.evaluate(() => TILT), null, 'still measuring after the sheet was closed');
      await tilt(page, 45);                                     // a late reading must not throw or reopen anything
      assert.equal(await page.locator('#sheet.on').count(), 0);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'a phone that asks before sharing its movement is asked from the tap, and a "no" is explained',
    async run({ open }) {
      const ask = (answer) => `window.__asked = 0; DeviceOrientationEvent.requestPermission = async () => { window.__asked++; return '${answer}'; };`;
      const no = await open({ state: v2State(), init: ask('denied') });
      await openTilt(no.page, 'inclineDB');
      await no.page.waitForFunction(() => /not allowed/i.test(document.querySelector('#tiltState').textContent));
      assert.equal(await no.page.evaluate(() => window.__asked), 1);
      await tilt(no.page, 30);
      assert.equal((await read(no.page)).num, '—', 'a reading was shown although the phone said no');
      await no.context.close();
      const yes = await open({ state: v2State(), init: ask('granted') });
      await openTilt(yes.page, 'inclineDB');
      await yes.page.waitForFunction(() => window.__asked === 1);
      await tilt(yes.page, 30);
      await yes.page.waitForFunction(() => document.querySelector('#tiltNum').textContent.trim() === '30°');
    },
  },
];
