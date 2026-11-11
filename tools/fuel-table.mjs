#!/usr/bin/env node
// The Fuel numbers for a range of people, to read with a human eye.
//   node tools/fuel-table.mjs [--days]     targets for each person; --days also prints the example day
// Nothing real is read or written: it runs the built app on a made-up state.
import { launch, serve, openApp, v2State, ROOT } from '../tests/harness.mjs';

const PEOPLE = [
  ['man 88 kg, lose fat',          { sex: 'm', age: 23, h: 180, w: 88, act: 1.45, goal: 'cut' }],
  ['man 70 kg, build muscle',      { sex: 'm', age: 25, h: 178, w: 70, act: 1.45, goal: 'gain' }],
  ['man 62 kg, build muscle',      { sex: 'm', age: 19, h: 172, w: 62, act: 1.55, goal: 'gain' }],
  ['man 105 kg, lose fat',         { sex: 'm', age: 38, h: 176, w: 105, act: 1.35, goal: 'cut' }],
  ['man 130 kg, lose fat',         { sex: 'm', age: 45, h: 182, w: 130, act: 1.35, goal: 'cut' }],
  ['man 80 kg, stay',              { sex: 'm', age: 50, h: 175, w: 80, act: 1.45, goal: 'maintain' }],
  ['man 75 kg, lose slowly',       { sex: 'm', age: 30, h: 175, w: 75, act: 1.55, goal: 'recomp' }],
  ['woman 62 kg, lose fat',        { sex: 'f', age: 30, h: 165, w: 62, act: 1.45, goal: 'cut' }],
  ['woman 48 kg, lose fat',        { sex: 'f', age: 40, h: 155, w: 48, act: 1.35, goal: 'cut' }],
  ['woman 55 kg, build muscle',    { sex: 'f', age: 24, h: 162, w: 55, act: 1.45, goal: 'gain' }],
  ['woman 85 kg, lose fat',        { sex: 'f', age: 35, h: 160, w: 85, act: 1.35, goal: 'cut' }],
  ['woman 68 kg, stay',            { sex: 'f', age: 55, h: 168, w: 68, act: 1.45, goal: 'maintain' }],
];
const days = process.argv.includes('--days');
const server = await serve(ROOT);
const { pw, browser } = await launch();
try {
  const { page, errors } = await openApp({ pw, browser, base: server.url }, { state: v2State() });
  await page.locator('#ro-today').waitFor();
  for (const [name, prof] of PEOPLE) {
    const r = await page.evaluate((o) => {
      S.profile = cleanProfile(Object.assign({}, S.profile, o), false);
      const t = targets();
      const day = (type) => { const d = mealPlan(type); return { k: d.k, p: d.p, c: d.c, f: d.f, wantK: d.wantK, meals: d.meals.map((m) => m.n + ' ' + m.k + ': ' + m.items.map((it) => MEALFOOD[it.id](it.q).join(' ')).join(', ')) }; };
      return { t, train: day('train'), rest: day('rest') };
    }, prof);
    const t = r.t;
    console.log('\n' + name + '  [' + prof.h + ' cm, ' + prof.age + ' y, x' + prof.act + ']');
    console.log('  burns ' + t.tdee + ' (rest ' + t.bmr + ')  target ' + t.kcal + (t.floored ? ' FLOOR' : '') + '  train ' + t.train + ' / rest ' + t.rest
      + '  P ' + t.prot + '  F ' + t.fat + '  C ' + t.carbT + '/' + t.carbR + '  ' + t.weekly.toFixed(2) + ' kg/wk  91d ' + t.target90 + '  water ' + t.water + ' L  z2 ' + t.z2.join('-'));
    for (const type of ['train', 'rest']) {
      const d = r[type];
      console.log('  ' + type + ' day: ' + d.k + ' kcal (want ' + d.wantK + ', ' + (d.k - d.wantK >= 0 ? '+' : '') + (d.k - d.wantK) + ')  P ' + d.p + ' (want ' + t.prot + ')  C ' + d.c + '  F ' + d.f);
      if (days) d.meals.forEach((m) => console.log('      ' + m));
    }
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
} finally {
  await browser.close();
  await server.close();
}
