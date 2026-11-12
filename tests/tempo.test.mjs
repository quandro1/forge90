// Tempo beeps: "Beeps" beside a lift's tempo line plays the pace of a rep, round and round, until stopped.
// A note at the start of each part (low for the slow part, high for the fast part, in between for a hold)
// and a soft tick on each further second. Built on 12 Nov 2026 from the research into what would improve the app.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

/* Put a lift's form notes on the page (the production drawing of them) and listen in on every note played. */
const stage = async (page, ids) => {
  await page.locator('#ro-today').waitFor({ state: 'attached' });
  await page.evaluate((ids) => {
    window.__tones = [];
    const real = window.tone;
    window.tone = function (hz, dur, gain) { window.__tones.push({ hz, strong: gain > 0.3, at: Date.now() }); return real.apply(this, arguments); };
    const host = document.createElement('div'); host.id = 'tempoHost';
    host.innerHTML = ids.map((id) => '<div data-lift="' + id + '">' + formNotes(id, true) + '</div>').join('');
    document.querySelector('#main').prepend(host);
  }, ids);
};
const btn = (page, id) => page.locator('#tempoHost [data-lift="' + id + '"] [data-tempo]');
const heard = (page) => page.evaluate(() => window.__tones.map((t) => (t.strong ? 'S' : 't') + t.hz));

export default [
  {
    name: 'every lift\'s tempo line is understood in full, or the lift offers no beeps',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const all = await page.evaluate(() => Object.keys(EX).map((id) => ({ id, tempo: EX[id].tempo, plan: tempoPlan(id), link: (() => { const d = document.createElement('div'); d.innerHTML = formNotes(id, true); return d.querySelectorAll('[data-tempo]').length; })() })));
      const bad = [], none = [];
      for (const x of all) {
        if (!x.plan) { none.push(x.id); if (x.link) bad.push(x.id + ': a Beeps button without a beat'); continue; }
        if (x.link !== 1) bad.push(x.id + ': ' + x.link + ' Beeps buttons');
        // the same line, read here on its own: its parts, and the seconds printed in it (the upper end of "2–3 s")
        const first = x.tempo.split('.')[0], parts = first.split(', ');
        const nums = [...first.matchAll(/<b>(\d+)(?:–(\d+))? s<\/b>/g)].map((m) => +(m[2] || m[1]));
        if (x.plan.length !== parts.length) bad.push(x.id + ': ' + x.plan.length + ' parts for "' + first + '"');
        const secs = x.plan.reduce((a, p) => a + p.secs, 0), want = nums.reduce((a, n) => a + n, 0) + (parts.length - nums.length);
        if (secs !== want) bad.push(x.id + ': a rep of ' + secs + ' s, the line adds up to ' + want);
        for (const p of x.plan) {
          if (!new RegExp('\\b' + p.label + '\\b').test(first)) bad.push(x.id + ': the part "' + p.label + '" is not in the line');
          if (!(p.secs >= 1 && p.secs <= 3)) bad.push(x.id + ': a part of ' + p.secs + ' s');
          if (/^(hold|squeeze|pause)$/.test(p.label) !== (p.pitch === 'mid')) bad.push(x.id + ': "' + p.label + '" is pitched ' + p.pitch);
        }
        if (x.plan.filter((p) => p.pitch === 'low').length !== 1) bad.push(x.id + ': the slow part is not marked once');
        if (x.plan.length < 2 || x.plan.length > 4) bad.push(x.id + ': ' + x.plan.length + ' parts');
      }
      assert.deepEqual(bad, []);
      assert.deepEqual(none.sort(), ['deadlift', 'lunge', 'plank'], 'the lifts without a beat');
      const plan = (id) => all.find((x) => x.id === id).plan.map((p) => p.label + ' ' + p.secs + ' ' + p.pitch);
      assert.deepEqual(plan('inclineDB'), ['down 3 low', 'up 1 high']);
      assert.deepEqual(plan('ohp'), ['up 1 high', 'down 2 low']);
      assert.deepEqual(plan('pallof'), ['out 2 high', 'hold 2 mid', 'back 2 low']);
      assert.deepEqual(plan('calf'), ['pause 2 mid', 'up 1 high', 'hold 1 mid', 'down 3 low']);
      assert.deepEqual(plan('latRaise'), ['up 1 high', 'hold 1 mid', 'down 3 low']);
      // a line with one part that is not understood gets no beat at all, never a beat with that part left out
      const odd = await page.evaluate(() => {
        EX.__odd = { tempo: '<b>3 s</b> down, drive up hard, <b>1 s</b> hold.' };
        EX.__one = { tempo: '<b>3 s</b> down.' };
        const r = [tempoPlan('__odd'), tempoPlan('__one'), tempoPlan('nothing-by-this-name')];
        delete EX.__odd; delete EX.__one; return r;
      });
      assert.deepEqual(odd, [null, null, null]);
    },
  },
  {
    name: 'Beeps plays the tempo round and round: a note for each part, a tick for each further second',
    async run({ open }) {
      const { page, errors, clock } = await open({ state: v2State() });
      await stage(page, ['inclineDB']);                              // 3 s down, 1 s up
      assert.deepEqual(await heard(page), [], 'a note before anything was tapped');
      await btn(page, 'inclineDB').tap();
      await clock.runFor(8100);
      assert.deepEqual(await heard(page), ['S440', 't440', 't440', 'S880', 'S440', 't440', 't440', 'S880', 'S440']);
      const times = await page.evaluate(() => window.__tones.map((t) => t.at - window.__tones[0].at));
      times.forEach((t, i) => assert.ok(Math.abs(t - i * 1000) <= 120, 'note ' + (i + 1) + ' came ' + t + ' ms after the first'));
      assert.match(await btn(page, 'inclineDB').innerText(), /stop/i);
      assert.equal(await btn(page, 'inclineDB').getAttribute('aria-pressed'), 'true');
      const now = page.locator('#tempoHost [data-tempo-now]');
      assert.match(await now.innerText(), /down/i);
      await clock.runFor(3000);
      assert.match(await now.innerText(), /up/i);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the beeps stop on Stop, and tapping again starts one beat, not two',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State() });
      await stage(page, ['inclineDB']);
      await btn(page, 'inclineDB').tap();
      await clock.runFor(1100);
      await btn(page, 'inclineDB').tap();                            // Stop
      const n = (await heard(page)).length;
      await clock.runFor(5000);
      assert.equal((await heard(page)).length, n, 'notes after Stop');
      assert.equal(await page.evaluate(() => TEMPO), null);
      assert.doesNotMatch(await btn(page, 'inclineDB').innerText(), /stop/i, 'the button still says Stop');
      assert.match(await btn(page, 'inclineDB').innerText(), /beeps/i);
      assert.equal(await btn(page, 'inclineDB').getAttribute('aria-pressed'), 'false');
      assert.equal((await page.locator('#tempoHost [data-tempo-now]').innerText()).trim(), '');
      await page.evaluate(() => { window.__tones.length = 0; });
      await btn(page, 'inclineDB').tap();
      await clock.runFor(2100);
      assert.deepEqual(await heard(page), ['S440', 't440', 't440'], 'a second start plays more than one beat');
    },
  },
  {
    name: 'only one lift beeps at a time, and the beat stops by itself after three minutes',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State() });
      await stage(page, ['inclineDB', 'ohp']);
      await btn(page, 'inclineDB').tap();
      await clock.runFor(500);
      await btn(page, 'ohp').tap();                                  // press up 1 s, 2 s down
      assert.equal(await page.evaluate(() => TEMPO.id), 'ohp');
      assert.doesNotMatch(await btn(page, 'inclineDB').innerText(), /stop/i, 'the first lift still shows Stop');
      assert.equal(await btn(page, 'inclineDB').getAttribute('aria-pressed'), 'false');
      assert.equal((await page.locator('#tempoHost [data-lift="inclineDB"] [data-tempo-now]').innerText()).trim(), '', 'the first lift still names a part of the rep');
      await page.evaluate(() => { window.__tones.length = 0; });
      await clock.runFor(3100);
      // its own beat, and only its own: after the first note, 2 s down then the next press up
      assert.deepEqual(await heard(page), ['S440', 't440', 'S880'], 'the second lift does not play its own beat alone');
      await clock.runFor(181000);
      assert.equal(await page.evaluate(() => TEMPO), null, 'still beeping after three minutes');
      assert.match(await btn(page, 'ohp').innerText(), /beeps/i);
    },
  },
  {
    name: 'ticking a set stops the beeps of the set that was just done',
    async run({ open }) {
      const { page, clock, errors } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#dayList details').first().waitFor({ state: 'attached' });
      const at = await page.evaluate(() => { const s = sessions(); for (let si = 0; si < s.length; si++) for (const it of s[si].items) if (tempoPlan(it.ex)) return { si, id: it.ex }; return null; });
      const blk = page.locator('details[data-dayblock="' + at.si + '"]');
      if (!(await blk.evaluate((d) => d.open))) await blk.locator('> summary').click();
      const card = blk.locator('.ex[data-ex="' + at.id + '"]');
      await card.locator('.ex-h').click();
      const b = card.locator('.formnotes [data-tempo]');
      await b.waitFor();
      const r = await b.evaluate((x) => ({ shown: x.checkVisibility(), h: x.getBoundingClientRect().height, inside: x.getBoundingClientRect().right <= x.closest('.ex').getBoundingClientRect().right + 0.5 }));
      assert.ok(r.shown && r.inside, 'the Beeps button is not on screen inside the card');
      assert.ok(r.h >= 30, 'the Beeps button is ' + Math.round(r.h) + ' px tall');
      await b.tap();
      await clock.runFor(700);
      assert.equal(await page.evaluate(() => TEMPO && TEMPO.id), at.id);
      await typeSet(page, at.id, 0, 40, 8); await tick(page, at.id, 0); await clock.runFor(300);
      assert.equal(await page.evaluate(() => TEMPO), null, 'the beeps went on after the set was ticked');
      assert.ok(await page.evaluate(() => !!RT), 'the rest did not start');
      assert.deepEqual(errors, []);
    },
  },
];
