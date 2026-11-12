// Using it on a phone: what the pre-release review found in the screens, each as a test.
import assert from 'node:assert/strict';
import { v2State, TODAY } from './harness.mjs';
import { typeSet, tick } from './timer.test.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();
const blk = 'details[data-dayblock="2"] ';
const openToday = async (page, id) => {
  await page.locator(blk + '.ex[data-ex="' + id + '"] .ex-h').click();
  await page.locator(blk + '.logger[data-log="' + id + '"]').waitFor();
};
const height = async (loc) => Math.round((await loc.first().boundingBox()).height);
/* WCAG contrast of two CSS variables, composited as plain colours */
const contrast = (page, fg, bg) => page.evaluate(([a, b]) => {
  const css = getComputedStyle(document.documentElement);
  const lum = (name) => {
    const hex = css.getPropertyValue(name).trim().replace('#', '');
    const c = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = lum(a), y = lum(b);
  return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100;
}, [fg, bg]);

export default [
  {
    name: 'a choice in set-up does not throw the page back to the top',
    async run({ open }) {
      const { page } = await open({ device: 'iPhone SE' });
      await page.locator('#setup.on').waitFor();
      await page.locator('#setup [data-su="exp"][data-v="no"]').tap();            // near the bottom of step 1
      const y = await page.evaluate(() => document.querySelector('#setup').scrollTop);
      assert.ok(y > 100, 'the page jumped to the top after a tap (scrollTop ' + y + ')');
      await page.locator('#su-age').fill('30'); await page.locator('#su-h').fill('170'); await page.locator('#su-w').fill('70');
      await page.locator('#setup [data-su-next]').tap();                          // a new step does start at the top
      assert.equal(await page.evaluate(() => document.querySelector('#setup').scrollTop), 0);
    },
  },
  {
    name: 'the controls used between sets and every day are at least 40 px tall',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: { start: '2026-10-05' } }), hash: 'train' });   // week 6: the Deload chip shows
      await openToday(page, 'squat');
      const small = [];
      const check = async (name, loc, min = 40) => { const h = await height(loc); if (h < min) small.push(name + ' ' + h + ' px'); };
      await check('Rest button', page.locator(blk + '.rest .rt-idle .btn'));
      await check('Deload chip', page.locator(blk + '.dlchip'));
      await check('Video link', page.locator(blk + '.ex[data-ex="squat"] .lk.v'));
      await check('Days-a-week switch', page.locator('#splitSeg button'));
      const tiny = await page.locator(blk + '.warm .lk.tiny').first().boundingBox();
      if (tiny.width < 40 || tiny.height < 40) small.push('warm-up video link ' + Math.round(tiny.width) + ' x ' + Math.round(tiny.height));
      await check('Swap button', page.locator(blk + '.ex[data-ex="squat"] [data-swap]'));
      await tab(page, 'fuel');
      await check('Training day / Rest day switch', page.locator('#dietSeg button'));
      await check('Food category tab', page.locator('#foodCats button'));
      await tab(page, 'today');
      await check('+ Zone 2', page.locator('#condCard [data-cond="z2"]'));
      assert.deepEqual(small, []);
    },
  },
  {
    name: 'small text passes contrast in both themes',
    async run({ open }) {
      for (const theme of ['light', 'dark']) {
        const { page, context } = await open({ state: v2State({ ui: { theme, diet: 'train', helpSeen: 1 } }) });
        await page.locator('#ro-today').waitFor();
        const low = [];
        for (const [fg, bg] of [['--text-faint', '--sunken'], ['--text-faint', '--raised'], ['--text-faint', '--surface'], ['--text-faint', '--ground'],
          ['--ember', '--sunken'], ['--ember', '--surface'], ['--ember-ink', '--ember'], ['--good', '--sunken'], ['--text-dim', '--sunken']]) {
          const c = await contrast(page, fg, bg);
          if (c < 4.5) low.push(theme + ': ' + fg + ' on ' + bg + ' ' + c);
        }
        assert.deepEqual(low, []);
        await context.close();
      }
    },
  },
  {
    name: 'an impossible body weight is not stored, and a past weigh-in can be corrected',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State({ weights: { '2026-11-10': 48.9 } }) });      // yesterday's slip: 84.9 was meant
      await page.locator('#ro-today').waitFor();
      await page.locator('#qWeight').fill('849');                                 // the decimal key was missed
      await clock.runFor(700);
      assert.equal(await page.evaluate((d) => S.weights[d], TODAY), undefined, '849 kg was stored');
      await tab(page, 'plan');
      await page.locator('#s-plan [data-day="2"]').tap();                         // 10 Nov
      await page.locator('#sheet.on [data-dayweight]').fill('84.9');
      await clock.runFor(400);
      assert.equal(await page.evaluate(() => S.weights['2026-11-10']), 84.9);
      await page.locator('#sheet.on [data-dayweight]').fill('');
      await clock.runFor(400);
      assert.equal(await page.evaluate(() => S.weights['2026-11-10']), undefined, 'an emptied weigh-in stayed');
    },
  },
  {
    name: 'the phone\'s Back button in set-up goes back a step and keeps what was typed',
    async run({ open }) {
      const { page } = await open({});
      await page.locator('#setup.on').waitFor();
      const url = page.url();
      await page.locator('#su-age').fill('30'); await page.locator('#su-h').fill('170'); await page.locator('#su-w').fill('70');
      await page.locator('#setup [data-su-next]').tap();
      await page.locator('#setupTitle', { hasText: 'Your target' }).waitFor();
      await page.goBack();
      await page.locator('#setupTitle', { hasText: 'About you' }).waitFor({ timeout: 4000 });
      assert.equal(page.url(), url, 'Back left the app');
      assert.equal(await page.locator('#su-w').inputValue(), '70');
      await page.locator('#setup [data-su-next]').tap();                          // and the on-screen Back does the same
      await page.locator('#setup [data-su-back]').tap();
      await page.locator('#setupTitle', { hasText: 'About you' }).waitFor({ timeout: 4000 });
      assert.equal(await page.locator('#su-age').inputValue(), '30');
    },
  },
  {
    name: 'set-up covers the whole screen and offers to restore a backup',
    async run({ open }) {
      const { page } = await open({});
      await page.locator('#setup.on').waitFor();
      assert.equal(Math.round((await page.locator('#setup').boundingBox()).y), 0, 'the header shows above the set-up screen');
      assert.equal(await page.locator('#setup #btnImport').count(), 1, 'someone moving phones cannot restore without finishing set-up');
    },
  },
  {
    name: 'creatine counts toward the score only on days it is ticked',
    async run({ open }) {
      const six = ['protein', 'cals', 'steps', 'water', 'session', 'sleep'];
      const checks = { '2026-11-09': six, '2026-11-10': six }; checks[TODAY] = six;
      const { page } = await open({ state: v2State({ checks }) });
      await page.locator('#ro-today').waitFor();
      assert.equal(await page.locator('#chkCount').innerText(), '6 / 6');
      await tab(page, 'prog');
      assert.match(await page.locator('#habitGrid > div > div').first().getAttribute('title'), /100%/);
      await tab(page, 'today');
      await page.locator('#checklist [data-chk="creatine"]').tap();
      assert.equal(await page.locator('#chkCount').innerText(), '7 / 7');
    },
  },
  {
    name: 'the rest-day card is not restyled by the rest-timer rule',
    async run({ open }) {
      const { page } = await open({ state: v2State(), now: '2026-11-14T09:00:00' });         // a Saturday
      await page.locator('#sessionCard .session.rest').waitFor();
      const s = await page.locator('#sessionCard .session.rest').evaluate((el) => { const c = getComputedStyle(el); return [c.marginLeft, c.marginBottom, c.borderTopLeftRadius]; });
      assert.deepEqual(s.slice(0, 2), ['0px', '0px'], 'the card took the timer\'s margins');
      assert.notEqual(s[2], '9px', 'the card took the timer\'s corners');
    },
  },
  {
    name: 'the four-figure readout stays in even cells on a narrow phone',
    async run({ open }) {
      const { page } = await open({ state: v2State(), device: 'iPhone SE' });
      await page.locator('#ro-today').waitFor();
      const cells = await page.locator('#ro-today > div').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; }));
      assert.equal(cells.length, 4);
      const widths = new Set(cells.map((c) => c[2]));
      assert.ok(Math.max(...widths) - Math.min(...widths) <= 1, 'cells of different widths: ' + JSON.stringify(cells));
      const rows = new Set(cells.map((c) => c[1]));
      assert.ok(rows.size === 1 || rows.size === 2, 'the readout broke into ' + rows.size + ' rows');
      if (rows.size === 2) assert.equal(cells.filter((c) => c[1] === cells[0][1]).length, 2, 'three cells on one row and one alone below');
    },
  },
  {
    name: 'a switch tells a screen reader which side is chosen',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'fuel' });
      await page.locator('#dietSeg button').first().waitFor();
      const pressed = () => page.locator('#dietSeg button').evaluateAll((els) => els.map((e) => e.dataset.diet + ':' + e.getAttribute('aria-pressed')));
      assert.deepEqual(await pressed(), ['train:true', 'rest:false']);                        // Wednesday: a training day
      await page.locator('#dietSeg [data-diet="rest"]').tap();
      assert.deepEqual(await pressed(), ['train:false', 'rest:true']);
      await tab(page, 'train');
      assert.equal(await page.locator('#splitSeg button.on').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#splitSeg button:not(.on)').first().getAttribute('aria-pressed'), 'false');
    },
  },
  {
    name: 'the Map and Today ask for the same number of Zone 2 sessions',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'plan' });
      const text = await page.locator('#s-plan').evaluate((el) => el.textContent);
      assert.doesNotMatch(text, /2–3×/);
      const want = await page.evaluate(() => COND[2].z2);
      assert.match(text, new RegExp('Weeks 5–8[^W]*' + want + '×'));
    },
  },
  {
    name: '"Open the session" leaves the session\'s name in view, under the header',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#sessionCard [data-goday]').tap();
      await page.locator('#s-train.on').waitFor();
      await page.waitForTimeout(900);                                             // the smooth scroll
      const r = await page.evaluate(() => [document.querySelector('details[data-dayblock="2"] > summary').getBoundingClientRect().top, document.querySelector('header.top').getBoundingClientRect().bottom]);
      assert.ok(r[0] >= r[1] - 1, 'the session name is ' + Math.round(r[1] - r[0]) + ' px under the header');
    },
  },
  {
    name: 'a measurement is deleted only on a second tap',
    async run({ open }) {
      const { page } = await open({ state: v2State({ meas: [{ d: '2026-11-09', waist: 92, chest: 104 }] }), hash: 'prog' });
      const del = page.locator('#measTable [data-delmeas]');
      await del.waitFor();
      const b = await del.boundingBox();
      assert.ok(b.width >= 40 && b.height >= 40, 'the delete button is ' + Math.round(b.width) + ' x ' + Math.round(b.height) + ' px');
      await del.tap();
      assert.equal(await page.evaluate(() => S.meas.length), 1, 'one tap deleted the measurement');
      await page.locator('#measTable [data-delmeas]').tap();
      assert.equal(await page.evaluate(() => S.meas.length), 0);
    },
  },
  {
    name: 'nothing on screen says a session has to be saved by hand',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State(), hash: 'train' });
      await openToday(page, 'squat');
      const lg = page.locator(blk + '.logger[data-log="squat"]');
      assert.doesNotMatch(await lg.innerText(), /save session/i);
      assert.match(await lg.locator('[data-savelog]').innerText(), /done with this lift/i);
      for (let i = 0; i < 4; i++) { await typeSet(page, 'squat', i, 80, 8); await tick(page, 'squat', i); }
      await clock.runFor(181000);
      assert.doesNotMatch(await page.locator(blk + '.rest[data-rest="squat"] .rt-l').innerText(), /save/i);
      // the floating timer is not read out every second; only its end is announced
      assert.equal(await page.locator('#restPill').getAttribute('aria-live'), null);
      assert.match(await page.locator('#restSay').evaluate((el) => el.textContent), /rest done/i);
    },
  },
  {
    name: 'the plan sheet says why Confirm is not ready yet',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#planBar [data-pickplan]').tap();
      await page.locator('#sheet.on [data-plan="build"] [data-useplan]').tap();
      assert.equal(await page.locator('#sheet.on [data-plan-confirm]').isDisabled(), true);
      assert.match(await page.locator('#sheet.on .pickhint').innerText(), /choose when/i);
      await page.locator('#sheet.on [data-plan-when="now"]').tap();
      assert.equal(await page.locator('#sheet.on [data-plan-confirm]').isDisabled(), false);
      assert.equal(await page.locator('#sheet.on .pickhint').count(), 0);
    },
  },
  {
    name: 'the theme has its own small key, so start-up does not parse the whole log twice',
    async run({ open }) {
      const { page, clock } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      await page.locator('#btnTheme').tap();
      await clock.runFor(400);
      const want = await page.evaluate(() => S.ui.theme);
      assert.equal(await page.evaluate(() => localStorage.getItem('forge90_theme')), want);
    },
  },
];
