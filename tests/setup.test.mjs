// A general app: first-run set-up for a new person, choosing a target, training days, the next block.
import assert from 'node:assert/strict';
import { v1State, v2State } from './harness.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();

export default [
  {
    name: 'a new person is asked who they are and what they want, and gets their own plan and numbers',
    async run({ open }) {
      const { page, errors } = await open({});
      await page.locator('#setup.on').waitFor();
      // step 1: about you
      await page.locator('#setup [data-su="sex"][data-v="f"]').tap();
      await page.locator('#su-age').fill('30');
      await page.locator('#su-h').fill('165');
      await page.locator('#su-w').fill('62');
      await page.locator('#setup [data-su="goal"][data-v="cut"]').tap();
      await page.locator('#setup [data-su-next]').tap();
      // step 2: target
      await page.locator('#setup [data-su="program"][data-v="glutes"]').tap();
      await page.locator('#setup [data-su-next]').tap();
      // step 3: the week (Glutes & Legs is 4 days, Mon Tue Thu Sat: move Saturday to Sunday)
      await page.locator('#setup [data-su-day="6"]').tap();
      await page.locator('#setup [data-su-day="0"]').tap();
      await page.locator('#setup [data-su="start"][data-v="today"]').tap();
      await page.locator('#setup [data-su-done]').tap();
      await page.locator('#setup.on').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
      assert.equal(await page.locator('#setup.on').count(), 0, 'set-up did not close');

      const p = await page.evaluate(() => S.profile);
      assert.deepEqual({ sex: p.sex, age: p.age, h: p.h, w: p.w, goal: p.goal, program: p.program, dpw: p.dpw, days: p.days, start: p.start, setup: p.setup },
        { sex: 'f', age: 30, h: 165, w: 62, goal: 'cut', program: 'glutes', dpw: 4, days: [1, 2, 4, 0], start: '2026-11-11', setup: true });
      assert.match(await page.locator('#dayline').innerText(), /day 1 of 91/i);
      const t = await page.evaluate(() => targets());
      assert.equal(t.bmr, 1340, 'the female formula was not used');           // 10*62 + 6.25*165 - 5*30 - 161
      await tab(page, 'train');
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 4);
      assert.match(await page.locator('#planBar').innerText(), /Glutes & Legs/i);
      assert.match(await page.locator('#dayList details[data-dayblock="3"] .daytag').innerText(), /sunday/i);
      await page.reload();
      await page.waitForFunction(() => typeof S === 'object');
      assert.equal(await page.locator('#setup.on').count(), 0, 'set-up came back after a reload');
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'set-up refuses impossible numbers instead of building a plan on them',
    async run({ open }) {
      const { page } = await open({});
      await page.locator('#setup.on').waitFor();
      await page.locator('#su-age').fill('3');
      await page.locator('#su-h').fill('165');
      await page.locator('#su-w').fill('62');
      await page.locator('#setup [data-su-next]').tap();
      assert.equal(await page.locator('#su-age').count(), 1, 'moved on with an impossible age');
      assert.match(await page.locator('#setup .su-err').innerText(), /age/i);
    },
  },
  {
    name: 'someone who already uses the app is never sent through set-up',
    async run({ open }) {
      const { page } = await open({ state: v1State() });
      await page.locator('#ro-today').waitFor();
      assert.equal(await page.locator('#setup.on').count(), 0);
    },
  },
  {
    name: 'choosing another target from Train switches the plan from today and keeps every log',
    async run({ open }) {
      const logs = { squat: [{ d: '2026-11-04', sets: [{ w: 80, r: 8, done: 1 }] }] };
      const { page, errors } = await open({ state: v2State({ logs }), hash: 'train' });
      await page.locator('#planBar [data-pickplan]').tap();
      await page.locator('#sheet.on [data-plan="strength"] [data-useplan]').tap();
      await page.locator('#sheet.on [data-plan-when="now"]').tap();
      await page.locator('#sheet.on [data-plan-confirm]').tap();
      assert.equal(await page.locator('#sheet.on').count(), 0, 'the sheet stayed open');
      const s = await page.evaluate(() => ({ program: S.profile.program, dpw: S.profile.dpw, days: S.profile.days, start: S.profile.start, logs: S.logs, plans: S.plans.length }));
      assert.deepEqual({ program: s.program, dpw: s.dpw, days: s.days, start: s.start }, { program: 'strength', dpw: 3, days: [1, 3, 5], start: '2026-11-09' });
      assert.deepEqual(s.logs, logs);
      assert.equal(s.plans, 2);
      assert.equal(await page.locator('#dayList details[data-dayblock]').count(), 3);
      assert.match(await page.locator('#planBar').innerText(), /Strength/);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'training days can be chosen, and the wrong number of days cannot be saved',
    async run({ open }) {
      const { page } = await open({ state: v2State(), hash: 'train' });
      await page.locator('#planBar [data-pickplan]').tap();
      await page.locator('#sheet.on [data-plan="build"] [data-useplan]').tap();      // 4 days: Mon Tue Thu Fri
      await page.locator('#sheet.on [data-plan-day="2"]').tap();                     // drop Tuesday: 3 of 4
      assert.equal(await page.locator('#sheet.on [data-plan-confirm]').isDisabled(), true);
      await page.locator('#sheet.on [data-plan-day="0"]').tap();                     // add Sunday
      await page.locator('#sheet.on [data-plan-when="now"]').tap();
      await page.locator('#sheet.on [data-plan-confirm]').tap();
      assert.deepEqual(await page.evaluate(() => S.profile.days), [1, 4, 5, 0]);
      assert.match(await page.locator('#dayList details[data-dayblock="3"] .daytag').innerText(), /sunday/i);
    },
  },
  {
    name: 'after day 91 the next block can be started from Today, and nothing logged is lost',
    async run({ open }) {
      const logs = { squat: [{ d: '2026-10-20', sets: [{ w: 100, r: 8, done: 1 }] }] };
      const st = v2State({ profile: { start: '2026-08-03' }, logs, weights: { '2026-08-03': 88, '2026-11-10': 84 }, checks: { '2026-10-20': ['session'] } });
      const { page, errors } = await open({ state: st });
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#dayline').innerText(), /block complete/i);
      await page.locator('#sessionCard [data-newblock]').tap();
      await page.locator('#sheet.on [data-plan="vtaper"] [data-useplan]').tap();
      await page.locator('#sheet.on [data-plan-start="today"]').tap();
      await page.locator('#sheet.on [data-plan-confirm]').tap();
      const s = await page.evaluate(() => ({ start: S.profile.start, blocks: S.blocks, logs: S.logs, w: S.profile.w }));
      assert.equal(s.start, '2026-11-11');
      assert.equal(s.blocks.length, 1);
      assert.equal(s.blocks[0].start, '2026-08-03');
      assert.equal(s.blocks[0].end, '2026-11-01');
      assert.deepEqual(s.logs, logs);
      assert.match(await page.locator('#dayline').innerText(), /day 1 of 91/i);
      assert.deepEqual(errors, []);
    },
  },
];
