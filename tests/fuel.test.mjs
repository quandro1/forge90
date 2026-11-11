// The Fuel tab: targets that follow the person, an example day that adds up to them, one day type, an honest trend.
import assert from 'node:assert/strict';
import { v2State } from './harness.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();
const setProfile = (page, over) => page.evaluate((o) => { S.profile = cleanProfile(Object.assign({}, S.profile, o), false); return targets(); }, over);

export default [
  {
    name: 'targets follow sex and goal, keep a safe floor, and never set protein on excess bodyweight',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      // the numbers the first user has trained on for months must not move
      let t = await setProfile(page, { sex: 'm', age: 23, h: 180, w: 88, act: 1.45, goal: 'cut' });
      assert.deepEqual([t.kcal, t.train, t.rest, t.prot, t.fat, t.target90], [2200, 2280, 2000, 185, 70, 82]);
      // a woman: the female equation, her own protein and fat
      t = await setProfile(page, { sex: 'f', age: 30, h: 165, w: 62, act: 1.45, goal: 'cut' });
      assert.deepEqual([t.bmr, t.kcal, t.prot, t.fat], [1340, 1550, 130, 50]);
      // a small, inactive woman: the deficit stops at the safe minimum, and no day goes under it
      t = await setProfile(page, { sex: 'f', age: 40, h: 155, w: 48, act: 1.35, goal: 'cut' });
      assert.equal(t.kcal, 1200);
      assert.ok(t.rest >= 1200 && t.train >= 1200, 'a day target is under the safe minimum: ' + t.rest + ' / ' + t.train);
      assert.equal(t.floored, true);
      // a heavy man: protein is set on the weight a lean body of his height would carry, not on 150 kg
      t = await setProfile(page, { sex: 'm', age: 35, h: 180, w: 150, act: 1.35, goal: 'cut' });
      assert.ok(t.prot <= 190, 'protein ' + t.prot + ' g was set on total bodyweight');
      // building muscle: a small surplus, and a target weight above today's
      t = await setProfile(page, { sex: 'm', age: 25, h: 178, w: 70, act: 1.45, goal: 'gain' });
      assert.ok(t.kcal > t.tdee && t.kcal - t.tdee <= 400, 'surplus ' + (t.kcal - t.tdee));
      assert.ok(t.target90 > 70);
      // holding weight: what you burn
      t = await setProfile(page, { goal: 'maintain' });
      assert.ok(Math.abs(t.kcal - t.tdee) <= 5);
      assert.equal(t.target90, 70);
      // the week always averages to the daily target, whatever the number of training days
      for (const [program, dpw] of [['vtaper', 5], ['vtaper', 4], ['lean', 3]]) {
        const r = await page.evaluate(([p, d]) => {
          S.profile = cleanProfile(Object.assign({}, S.profile, { program: p, dpw: d, days: PROGRAMS[p].variants[d].days, goal: 'cut', w: 88, h: 180, age: 23, sex: 'm' }), false);
          const t = targets(); return { avg: (t.train * d + t.rest * (7 - d)) / 7, kcal: t.kcal, rest: t.rest };
        }, [program, dpw]);
        assert.ok(Math.abs(r.avg - r.kcal) <= 12, program + ' ' + dpw + ': week averages ' + r.avg + ' against ' + r.kcal);
        assert.ok(r.kcal - r.rest <= 210, 'rest day is ' + (r.kcal - r.rest) + ' under the target');
      }
    },
  },
  {
    name: 'the example day adds up to the target for every kind of person, from the food list',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const res = await page.evaluate(() => {
        const bad = []; let n = 0;
        for (const sex of ['m', 'f']) for (const w of [45, 55, 62, 70, 88, 105, 130]) for (const goal of ['cut', 'recomp', 'maintain', 'gain'])
          for (const act of [1.35, 1.65]) for (const type of ['train', 'rest']) {
            S.profile = cleanProfile(Object.assign({}, S.profile, { sex, w, h: sex === 'f' ? 162 : 176, age: 30, act, goal }), false);
            const t = targets(), want = { k: type === 'train' ? t.train : t.rest, p: t.prot };
            const day = mealPlan(type); n++;
            const sum = day.meals.reduce((a, m) => ({ k: a.k + m.k, p: a.p + m.p }), { k: 0, p: 0 });
            const items = day.meals.flatMap((m) => m.items);
            if (Math.abs(day.k - sum.k) > 1 || Math.abs(day.p - sum.p) > 1) bad.push([sex, w, goal, act, type, 'total is not the sum of its meals']);
            if (items.some((it) => !(it.q > 0) || !FOOD[it.id])) bad.push([sex, w, goal, act, type, 'a bad item']);
            for (const m of day.meals) {
              const k = m.items.reduce((a, it) => a + FOOD[it.id][2] * it.q, 0);
              if (Math.abs(k - m.k) > 1) bad.push([sex, w, goal, act, type, m.n + ' does not add up']);
            }
            const reach = want.k <= 3600;                          // above this the plan says so instead of inventing food
            if (reach && Math.abs(day.k - want.k) > 90) bad.push([sex, w, goal, act, type, 'kcal ' + Math.round(day.k) + ' vs ' + want.k]);
            // never an example day under the safe minimum the app itself declares
            if (day.k < (sex === 'f' ? 1200 : 1500)) bad.push([sex, w, goal, act, type, 'the day is ' + day.k + ' kcal, under the safe minimum']);
            // protein is never short. It may run over by a little, or up to a fifth of the day's calories
            // where that is more: ordinary food carries that much, and a day forced under it is not a real day.
            if (day.p < want.p - 12 || day.p > Math.max(want.p + 30, 0.22 * want.k / 4)) bad.push([sex, w, goal, act, type, 'protein ' + Math.round(day.p) + ' vs ' + want.p]);
            // and it is a day someone would eat: a real portion of meat at lunch, not four bananas
            const qty = (id) => items.filter((it) => it.id === id).reduce((a, it) => a + it.q, 0);
            if (qty('chicken') < 1) bad.push([sex, w, goal, act, type, 'lunch has ' + qty('chicken') + ' palm of chicken']);
            if (qty('banana') > 3) bad.push([sex, w, goal, act, type, qty('banana') + ' bananas']);
          }
        return { n, bad: bad.slice(0, 10), count: bad.length };
      });
      assert.ok(res.n >= 200);
      assert.equal(res.count, 0, res.count + ' of ' + res.n + ' days are off, e.g. ' + JSON.stringify(res.bad));
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'the meal list on screen shows the same totals it claims',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: { sex: 'f', age: 30, h: 165, w: 62, goal: 'cut' } }), hash: 'fuel' });
      await page.locator('#mealList .meal').first().waitFor();
      const shown = await page.evaluate(() => Array.from(document.querySelectorAll('#mealList .meal .mc')).map((el) => parseInt(el.textContent, 10)));
      const total = parseInt((await page.locator('#mealTotal').innerText()).replace(/[^0-9]/g, ' ').trim().split(/ +/)[0], 10);
      assert.ok(shown.length >= 4);
      assert.equal(shown.reduce((a, b) => a + b, 0), total, 'the footer total is not the sum of the meals shown');
      const t = await page.evaluate(() => targets());
      const want = (await page.evaluate(() => dietType())) === 'train' ? t.train : t.rest;
      assert.ok(Math.abs(total - want) <= 90, 'the example day (' + total + ') does not fit the target (' + want + ')');
      assert.doesNotMatch(await page.locator('#s-fuel').innerText(), /9 AM|no oats|no fish/i);
    },
  },
  {
    name: 'Today and Fuel agree on what kind of day it is',
    async run({ open }) {
      // Saturday 14 Nov 2026: no lifting on a Monday-to-Friday plan
      const { page } = await open({ state: v2State({ profile: { sex: 'm', age: 23, h: 180, w: 88, goal: 'cut' } }), now: '2026-11-14T09:00:00' });
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#checklist [data-chk="cals"]').innerText(), /2000 kcal/);
      await tab(page, 'fuel');
      assert.match(await page.locator('#ro-macros').innerText(), /2000/);
      assert.match(await page.locator('#ro-macros').innerText(), /rest day/i);
      await page.locator('#dietSeg [data-diet="train"]').tap();        // "I am training today after all"
      assert.match(await page.locator('#ro-macros').innerText(), /2280/);
      await tab(page, 'today');
      assert.match(await page.locator('#checklist [data-chk="cals"]').innerText(), /2280 kcal/);
    },
  },
  {
    name: 'the weekly rate is read from dated weigh-ins, not from a count of entries',
    async run({ open }) {
      const weights = {};
      for (let i = 0; i < 12; i++) {                                   // 12 daily weigh-ins losing exactly 0.1 kg a day
        const d = new Date(2026, 9, 31 + i);
        weights[d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')] = Math.round((90 - 0.1 * i) * 10) / 10;
      }
      const { page } = await open({ state: v2State({ weights, profile: { goal: 'cut', w: 90 } }), hash: 'prog' });
      const pill = await page.locator('#trendPill').innerText();
      const rate = parseFloat(pill.replace('−', '-'));
      assert.ok(Math.abs(rate - (-0.7)) <= 0.06, 'a steady 0.7 kg a week reads as ' + pill);
    },
  },
];
