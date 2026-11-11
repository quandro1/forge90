// Fuel and Progress: what the pre-release review found, each as a test.
import assert from 'node:assert/strict';
import { v2State, TODAY } from './harness.mjs';

const tab = (page, name) => page.locator('.tabbar button[data-tab="' + name + '"]').tap();
const setProfile = (page, over) => page.evaluate((o) => { S.profile = cleanProfile(Object.assign({}, S.profile, o), false); return targets(); }, over);
const day = (n) => { const d = new Date(2026, 10, 11 - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/** daily weigh-ins for `n` days, the latest `ago` days back at `last` kg, after losing `perDay` kg a day (so earlier days are heavier) */
const weighIns = (n, last, perDay, ago = 0) => { const o = {}; for (let i = 0; i < n; i++) o[day(ago + i)] = Math.round((last + perDay * i) * 10) / 10; return o; };
const man = { sex: 'm', age: 23, h: 180, w: 88, act: 1.45, goal: 'cut' };
const smallWoman = { sex: 'f', age: 40, h: 155, w: 48, act: 1.35, goal: 'cut' };

export default [
  {
    name: 'no deficit is set for someone under a healthy weight, or under 18',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      let t = await setProfile(page, { sex: 'f', age: 22, h: 165, w: 45, act: 1.45, goal: 'cut' });       // BMI 16.5
      assert.ok(Math.abs(t.kcal - t.tdee) <= 5, 'an underweight woman is set to eat ' + (t.tdee - t.kcal) + ' kcal under what she burns');
      assert.equal(t.guard, 'bmi');
      assert.ok(t.target90 >= 45, 'her 91-day target is ' + t.target90 + ' kg');
      await tab(page, 'fuel');
      assert.match(await page.locator('#fuelGoal').innerText(), /not set a deficit/i);
      assert.doesNotMatch(await page.locator('#fuelGoal').innerText(), /down by/i);
      t = await setProfile(page, { sex: 'm', age: 15, h: 170, w: 55, act: 1.45, goal: 'recomp' });
      assert.ok(Math.abs(t.kcal - t.tdee) <= 5, 'a 15-year-old is set to eat ' + (t.tdee - t.kcal) + ' kcal under what he burns');
      assert.equal(t.guard, 'age');
      assert.equal(await page.evaluate(() => checkList().some((x) => x.k === 'creatine')), false, 'creatine is on a 15-year-old\'s list');
      // an adult near the line may lose, but the 91-day target never goes under a healthy weight
      t = await setProfile(page, { sex: 'f', age: 30, h: 170, w: 55, act: 1.65, goal: 'cut' });            // BMI 19.0
      assert.equal(t.guard, '');
      assert.ok(t.target90 >= 53.4, 'the target is ' + t.target90 + ' kg, under BMI 18.5 (53.5 kg)');
      // the same people may still hold or gain
      t = await setProfile(page, { sex: 'f', age: 22, h: 165, w: 45, act: 1.45, goal: 'gain' });
      assert.ok(t.kcal > t.tdee && t.guard === '');
    },
  },
  {
    name: 'someone already at the safe minimum is never told to eat less',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: smallWoman, weights: weighIns(12, 48, 0) }), hash: 'prog' });
      const v = await page.locator('#verdictCard').innerText();
      assert.match(v, /Flat|climbing|not moving/i, v);
      assert.doesNotMatch(v, /kcal a day off|take 1[05]0/i, v);
      assert.match(v, /steps/i, v);
      await page.evaluate(() => { S.profile.goal = 'maintain'; S.weights = Object.fromEntries(Object.entries(S.weights).map(([d, w], i, a) => [d, Math.round((48 + 0.1 * (a.length - 1 - i)) * 10) / 10])); renderProg(); });
      const m = await page.locator('#verdictCard').innerText();
      assert.doesNotMatch(m, /kcal a day off/i, m);
    },
  },
  {
    name: 'the 91-day target is anchored to the weight the block began at, and your own target weight is used',
    async run({ open }) {
      const weights = Object.assign({ '2026-10-05': 88 }, weighIns(12, 84.5, 0.064));          // a block that began at 88 kg on 5 Oct; 84.5 today, losing 0.45 kg a week
      const { page } = await open({ state: v2State({ profile: Object.assign({}, man, { start: '2026-10-05', w: 84.5, targetW: 80 }), weights }), hash: 'prog' });
      await page.locator('#chartBox svg').waitFor();
      const t = await page.evaluate(() => targets());
      assert.ok(t.target90 >= 81.5 && t.target90 <= 83, 'the 91-day target moved to ' + t.target90 + ' when the weight in Settings was updated');
      const text = await page.locator('#s-prog').innerText();
      assert.match(text, /your target[^.]*80/i, 'the target weight typed in Settings is shown nowhere');
      assert.match(text, /about \d+ weeks?/i, 'no estimate of when the target weight is reached');
    },
  },
  {
    name: 'protein never crowds the carbs out of a small day',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [];
        for (const sex of ['f', 'm']) for (const age of [20, 35, 50, 65, 75]) for (const h of [150, 160, 170, 180]) for (const bmi of [20, 25, 30, 35]) for (const act of [1.35, 1.55]) {
          const w = Math.round(bmi * h * h / 10000);
          S.profile = cleanProfile(Object.assign({}, S.profile, { sex, age, h, w, act, goal: 'cut' }), false);
          const t = targets(), ref = Math.min(w, 27 * h * h / 10000);
          if (t.carbR < 45) out.push([sex, age, h, w, 'rest-day carbs ' + t.carbR + ' g']);
          if (t.prot < Math.floor(ref * 1.6 / 5) * 5) out.push([sex, age, h, w, 'protein ' + t.prot + ' g is under 1.6 g per kg']);
          if (Math.abs(t.prot * 4 + t.fat * 9 + t.carbR * 4 - t.rest) > 12) out.push([sex, age, h, w, 'the rest-day numbers do not add up']);
        }
        return out;
      });
      assert.deepEqual(bad.slice(0, 5), [], bad.length + ' people');
    },
  },
  {
    name: 'when the safe minimum is as much as a person burns, the app says so instead of promising a loss',
    async run({ open }) {
      const tiny = { sex: 'f', age: 70, h: 150, w: 45, act: 1.35, goal: 'cut' };              // burns about 1,180 kcal: the 1,200 floor is above it
      const { page } = await open({ state: v2State({ profile: tiny, weights: weighIns(12, 45, 0) }), hash: 'fuel' });
      const g = await page.locator('#fuelGoal').innerText();
      assert.doesNotMatch(g, /up by about|down by about 0\.0/i, g);
      assert.match(g, /cannot set a deficit|no deficit/i, g);
      await tab(page, 'prog');
      assert.doesNotMatch(await page.locator('#verdictCard').innerText(), /On target/i);
    },
  },
  {
    name: 'what 91 days can do is the plan\'s own number, not a fixed range',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: { sex: 'f', age: 30, h: 165, w: 62, act: 1.45, goal: 'recomp' } }) });
      await page.locator('#ro-today').waitFor();
      const want = await page.evaluate(() => Math.max(1, Math.round(-targets().weekly * 13)));
      await page.locator('#btnGuide').tap();
      const text = await page.locator('#sheetBody').evaluate((el) => el.textContent);       // folded sections included
      assert.doesNotMatch(text, /4–7 kg/);
      assert.match(text, new RegExp('about ' + want + ' kg', 'i'));
    },
  },
  {
    name: 'a trend from weeks ago is not shown as today\'s',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: man, weights: weighIns(14, 86, 0.14, 25) }), hash: 'prog' });   // losing 1 kg a week, last weighed 25 days ago
      assert.doesNotMatch(await page.locator('#trendPill').innerText(), /kg\/week/);
      assert.match(await page.locator('#trendPill').innerText(), /no weigh-ins/i);
      assert.doesNotMatch(await page.locator('#verdictCard').innerText(), /too fast/i);
    },
  },
  {
    name: 'only calories can be "over": extra protein is never painted as a problem',
    async run({ open }) {
      const food = {}; food[TODAY] = [{ n: 'A lot of protein', k: 900, p: 240, c: 10, f: 90 }];
      const { page } = await open({ state: v2State({ profile: man, food }), hash: 'fuel' });
      await page.locator('#foodTotals .mrow').first().waitFor();
      const rows = await page.locator('#foodTotals .mrow').allInnerTexts();
      const protein = rows.find((r) => /^Protein/i.test(r)), fat = rows.find((r) => /^Fat/i.test(r));
      assert.doesNotMatch(protein, /over/i, protein);
      assert.doesNotMatch(fat, /over/i, fat);
      assert.equal(await page.locator('#foodTotals .mrow i.over').count(), 0);
    },
  },
  {
    name: 'a fast first fortnight is called a fast start, not muscle loss',
    async run({ open }) {
      const { page } = await open({ state: v2State({ profile: Object.assign({}, man, { start: day(12) }), weights: weighIns(12, 86.0, 0.17) }), hash: 'prog' });   // day 13 of the block, 1.2 kg a week
      const v = await page.locator('#verdictCard').innerText();
      assert.match(v, /fast start/i, v);
      assert.doesNotMatch(v, /takes muscle/i, v);
    },
  },
  {
    name: 'food portions say how big they are',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const f = await page.evaluate(() => { const o = {}; FOODCATS.forEach((c) => c[1].forEach((x) => { o[x[6]] = { name: x[0], portion: x[1], kcal: x[2] }; })); return o; });
      assert.match(f.softdrink.portion, /can|330/i);
      assert.match(f.chapati.portion, /small|45/i);
      assert.ok(f.roti && f.roti.kcal >= 180 && f.roti.kcal <= 215, 'no entry for a large home roti');
      assert.match(f.gyogurt.name, /low-fat/i);
      assert.match(f.naan.portion, /\d+ ?g/i);
    },
  },
  {
    name: 'the example day is never short of the protein it calls "at least"',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const bad = await page.evaluate(() => {
        const out = [];
        for (const sex of ['m', 'f']) for (const w of [50, 55, 62, 70, 88, 105]) for (const goal of ['cut', 'recomp', 'maintain', 'gain']) for (const act of [1.35, 1.65]) for (const type of ['train', 'rest']) {
          S.profile = cleanProfile(Object.assign({}, S.profile, { sex, w, h: sex === 'f' ? 162 : 176, age: 30, act, goal }), false);
          const d = mealPlan(type);
          if (d.p < d.wantP - 3) out.push([sex, w, goal, act, type, d.p + ' g against at least ' + d.wantP]);
        }
        return out;
      });
      assert.deepEqual(bad.slice(0, 5), [], bad.length + ' days');
    },
  },
];
