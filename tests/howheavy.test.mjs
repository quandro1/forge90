// How heavy to go on each lift: heavy, medium or light, with the reason, on the card and in Reference.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const strength = { program: 'strength', dpw: 3, days: [1, 3, 5] };
/** open the card of an exercise in whichever session of the current plan holds it; returns the card locator */
async function openCardOf(page, id) {
  const at = await page.evaluate((x) => { const ss = sessions(); for (let si = 0; si < ss.length; si++) for (let k = 0; k < ss[si].items.length; k++) if (ss[si].items[k].ex === x) return si; return -1; }, id);
  assert.ok(at >= 0, id + ' is not in this plan');
  const blk = page.locator('details[data-dayblock="' + at + '"]');
  if (!(await blk.evaluate((el) => el.open))) await blk.locator('summary').first().click();
  const card = blk.locator('.ex[data-ex="' + id + '"]');
  await card.locator('.ex-h').click();
  await card.locator('.logger').waitFor();
  return card;
}

export default [
  {
    name: 'every exercise says how heavy to go and why, and the band agrees with its own rep range',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [];
        for (const id in EX) {
          const e = EX[id], t = e.typ, r = t.reps;
          if (['heavy', 'medium', 'light', 'body', 'hold'].indexOf(e.band) < 0) { out.push(id + ': no band'); continue; }
          if (typeof e.why !== 'string' || e.why.length < 40 || e.why.length > 330) out.push(id + ': the reason is missing, too short or too long');
          if (/[<>&]/.test(e.why || '')) out.push(id + ': markup in the reason');
          if (e.band === 'hold' && !t.hold) out.push(id + ': a hold without seconds');
          if (e.band === 'body' && e.load !== 'bw') out.push(id + ': bodyweight band on a loaded lift');
          if (e.band === 'heavy' && !(r && r[0] <= 6 && r[1] <= 10)) out.push(id + ': heavy but usually ' + (r || []).join('-') + ' reps');
          if (e.band === 'medium' && !(r && r[0] >= 8 && r[0] <= 10 && r[1] <= 15)) out.push(id + ': medium but usually ' + (r || []).join('-') + ' reps');
          if (e.band === 'light' && !(r && r[0] >= 10 && r[1] >= 12)) out.push(id + ': light but usually ' + (r || []).join('-') + ' reps');
        }
        // and no plan asks for something the band rules out
        for (const pid of PROGRAM_ORDER) for (const dpw of variantKeys(PROGRAMS[pid])) for (const s of PROGRAMS[pid].variants[dpw].sessions) for (const it of s.items) {
          const b = EX[it.ex].band, r = it.reps; if (!r) continue;
          if (b === 'heavy' && r[1] > 10) out.push(pid + ': ' + it.ex + ' is a heavy lift at ' + r.join('-'));
          if (b === 'light' && r[0] < 8) out.push(pid + ': ' + it.ex + ' is a light lift at ' + r.join('-'));
          if (b === 'medium' && (r[0] < 6 || r[1] > 15)) out.push(pid + ': ' + it.ex + ' is a medium lift at ' + r.join('-'));
        }
        return out;
      });
      assert.deepEqual(bad, []);
      assert.equal(await page.evaluate(() => EX.reardelt.band), 'light');
      assert.equal(await page.evaluate(() => EX.squat.band), 'heavy');
    },
  },
  {
    name: 'the card says it above the logbook, with the reps this plan asks for',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State(), hash: 'train' });
      const squat = await openCardOf(page, 'squat');
      const hh = squat.locator('.howheavy');
      assert.match(await hh.innerText(), /heavy/i);
      assert.match(await hh.innerText(), /6–10/);
      assert.doesNotMatch(await hh.innerText(), /\{reps\}/);
      const above = await squat.evaluate((el) => { const a = el.querySelector('.howheavy'), b = el.querySelector('.logger'); return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); });
      assert.ok(above, 'the note is not above the logbook');
      const rear = await openCardOf(page, 'reardelt');
      assert.match(await rear.locator('.howheavy').innerText(), /light/i);
      assert.match(await rear.locator('.howheavy').innerText(), /15–20/);
      const plank = await page.evaluate(() => howHeavy('plank', null));
      assert.match(plank, /hold/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'on the Strength plan the heavy lifts show that plan\'s lower reps',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: strength }), hash: 'train' });
      const squat = await openCardOf(page, 'squat');
      assert.match(await squat.locator('.howheavy').innerText(), /3–5/);
    },
  },
  {
    name: 'Reference lists every lift under heavy, medium or light',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnGuide').tap();
      const html = await page.locator('#sheetBody').evaluate((el) => { const d = Array.from(el.querySelectorAll('details')).find((x) => /heavy/i.test(x.querySelector('summary').textContent)); return d ? d.textContent : ''; });
      assert.ok(html.length > 200, 'no Reference entry about how heavy to go');
      const names = await page.evaluate(() => Object.keys(EX).map((id) => EX[id].name));
      const missing = names.filter((n) => !html.includes(n));
      assert.deepEqual(missing, [], 'lifts missing from the list');
      for (const word of ['Go heavy', 'Medium', 'Go light']) assert.ok(html.includes(word), word + ' is not a heading');
    },
  },
  {
    name: 'the library shows the band on every lift',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#btnLib').scrollIntoViewIfNeeded();
      await page.locator('#btnLib').tap();
      await page.locator('#libList .libitem').first().waitFor();
      const n = await page.locator('#libList .libitem').count(), withBand = await page.locator('#libList .libitem .band').count();
      assert.equal(withBand, n);
    },
  },
  {
    name: 'top-of-range advice on a bodyweight lift names that lift\'s own next step',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const adv = (id) => page.evaluate((i) => { const it = Object.assign({ ex: i }, EX[i].typ), top = repRange(it)[1], e = { d: '2026-11-04', sets: Array.from({ length: it.sets }, () => ({ r: top })) }; return adviceFrom(EX[i], it, e, [e]).txt; }, id);
      assert.match(await adv('pullup'), /help off/i);
      assert.match(await adv('pullup'), /belt/i);
      assert.match(await adv('hangraise'), /straight legs/i);
      assert.match(await adv('backExt'), /plate/i);
      assert.match(await adv('pushup'), /feet on a bench/i);
    },
  },
];
