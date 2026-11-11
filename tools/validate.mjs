#!/usr/bin/env node
// Checks the content (exercise library and programs) against rules a machine can hold.
//   node tools/validate.mjs            errors fail (exit 1), warnings are listed
//   node tools/validate.mjs --table    also print the weekly sets per muscle for every plan
//
// Weekly volume is counted in "fractional sets": a set counts 1 for a muscle the lift
// names as primary (prim) and 0.5 for one it names as secondary (sec). The bands are
// working conventions built on the published dose-response work, not laws: a plan at the
// edge of a band is a judgement call, which is why most band checks are warnings.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const js = path.join(ROOT, 'src', 'js');
const src = ['00-muscle-map.js', '10-exercises.js', '11-warmups.js', '20-programs.js']
  .map((f) => fs.readFileSync(path.join(js, f), 'utf8')).join('\n')
  + '\n;globalThis.__out={EX,PROGRAMS,PROGRAM_ORDER,WARM,WARMSETS,FRONT_ZONES,BACK_ZONES,ZN};';
const ctx = vm.createContext({});
vm.runInContext(src, ctx);
const { EX, PROGRAMS, PROGRAM_ORDER, WARM, WARMSETS, FRONT_ZONES, BACK_ZONES } = ctx.__out;

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const ZONES = new Set([...Object.keys(FRONT_ZONES), ...Object.keys(BACK_ZONES)]);
// muscle-map zone -> the muscle group volume is counted for
const GROUP = { uchest: 'chest', chest: 'chest', fdelt: 'fdelt', sdelt: 'sdelt', rdelt: 'rdelt', biceps: 'biceps', triceps: 'triceps',
  lats: 'lats', midback: 'midback', traps: 'midback', lowerback: 'erectors', quads: 'quads', hams: 'hams', glutes: 'glutes',
  bcalf: 'calves', abs: 'abs', obliques: 'abs', forearm: null, fcalf: null };
const MAJOR = ['chest', 'lats', 'midback', 'quads', 'hams', 'glutes'];
const SMALL = ['fdelt', 'sdelt', 'rdelt', 'biceps', 'triceps', 'calves', 'abs'];
const ALL = [...MAJOR, ...SMALL];
const BANDS = {
  build:    { major: [8, 20], small: [6, 20], emphasis: [12, 24], lower: [4, 14] },
  maintain: { major: [5, 14], small: [3, 12], emphasis: [8, 16], lower: [3, 12] },
  strength: { major: [5, 16], small: [3, 12], emphasis: [8, 18], lower: [3, 12] },
};
const SPINAL = new Set(['squat', 'rdl', 'deadlift', 'hipthrust']);
const LOADS = new Set(['bb', 'db', 'db1', 'machine', 'cable', 'bw', 'time']);
const KINDS = new Set(['compound', 'isolation', 'core']);
const GROUPS = new Set(['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core']);
const BANDS3 = new Set(['heavy', 'medium', 'light', 'body', 'hold']);

/* fractional credit per muscle group for one exercise */
function credit(id) {
  const e = EX[id], c = {};
  for (const z of e.prim || []) { const g = GROUP[z]; if (g) c[g] = 1; }
  for (const z of e.sec || []) { const g = GROUP[z]; if (g && !c[g]) c[g] = 0.5; }
  return c;
}
const isPress = (id) => EX[id].kind === 'compound' && (EX[id].prim.some((z) => ['chest', 'uchest', 'fdelt'].includes(z)));
const isPull = (id) => EX[id].kind === 'compound' && (EX[id].prim.some((z) => ['lats', 'midback'].includes(z))) && id !== 'deadlift';

/* ---------- exercise cards ---------- */
const textOk = (s) => typeof s === 'string' && s.trim().length > 0 && !/<(?!\/?b>)/.test(s) && !/&[a-z]+;/.test(s);
for (const id of Object.keys(EX)) {
  const e = EX[id], at = 'EX.' + id + ': ';
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(id)) err(at + 'bad id');
  for (const k of ['name', 'tag', 'equip', 'cue', 'tempo', 'feel', 'check', 'weight']) if (!textOk(e[k])) err(at + k + ' missing or carries markup other than <b>');
  if (e.safe !== undefined && !textOk(e.safe)) err(at + 'safe is not clean text');
  if (!GROUPS.has(e.group)) err(at + 'group ' + e.group);
  if (!KINDS.has(e.kind)) err(at + 'kind ' + e.kind);
  if (!LOADS.has(e.load)) err(at + 'load ' + e.load);
  if (typeof e.step !== 'number' || e.step < 0) err(at + 'step');
  if (!Array.isArray(e.prim) || !e.prim.length || e.prim.length > 2) err(at + 'prim must name 1 or 2 zones');
  for (const z of [...(e.prim || []), ...(e.sec || [])]) if (!ZONES.has(z)) err(at + 'unknown muscle zone ' + z);
  if ((e.sec || []).some((z) => (e.prim || []).includes(z))) err(at + 'a zone is both prim and sec');
  if (!Array.isArray(e.setup) || e.setup.length < 2 || e.setup.length > 4 || !e.setup.every(textOk)) err(at + 'setup needs 2-4 clean steps');
  if (!Array.isArray(e.rep) || e.rep.length !== 3 || e.rep.map((r) => r[0]).join() !== 'Start,Move,Finish' || !e.rep.every((r) => textOk(r[1]))) err(at + 'rep must be Start, Move, Finish');
  if (!Array.isArray(e.fix) || e.fix.length < 2 || e.fix.length > 3 || !e.fix.every((f) => textOk(f[0]) && textOk(f[1]))) err(at + 'fix needs 2-3 [problem, fix] pairs');
  if (!Array.isArray(e.swap)) err(at + 'swap missing');
  for (const s of e.swap || []) {
    if (!EX[s]) { err(at + 'swap names unknown exercise ' + s); continue; }
    if (s === id) err(at + 'swaps to itself');
    const mine = new Set((e.prim || []).map((z) => GROUP[z])), other = [...(EX[s].prim || []), ...(EX[s].sec || [])].map((z) => GROUP[z]);
    if (![...mine].some((g) => other.includes(g))) warn(at + 'swap ' + s + ' does not train the same primary muscle');
  }
  const t = e.typ;
  // how heavy the lift goes, and that its usual reps agree with it
  if (!BANDS3.has(e.band)) err(at + 'band must be heavy, medium, light, body or hold');
  if (!textOk(e.why) || /<b>/.test(e.why) || e.why.length > 330) err(at + 'why is missing, too long, or carries markup');
  if (e.next !== undefined && (!textOk(e.next) || e.load !== 'bw')) err(at + 'next is for bodyweight lifts and must be clean text');
  if (t && t.reps) {
    const r = t.reps;
    if (e.band === 'heavy' && !(r[0] <= 6 && r[1] <= 10)) err(at + 'heavy lift with a usual range of ' + r.join('-'));
    if (e.band === 'medium' && !(r[0] >= 8 && r[0] <= 10 && r[1] <= 15)) err(at + 'medium lift with a usual range of ' + r.join('-'));
    if (e.band === 'light' && !(r[0] >= 10 && r[1] >= 12)) err(at + 'light lift with a usual range of ' + r.join('-'));
  }
  if ((e.band === 'hold') !== (e.load === 'time')) err(at + 'band hold goes with a timed lift, and only with one');
  if (e.band === 'body' && e.load !== 'bw') err(at + 'band body on a lift that is not bodyweight');
  if (!t || !(t.sets >= 1 && t.sets <= 6) || !(t.rest >= 30 && t.rest <= 300)) err(at + 'typ sets/rest');
  else if (!rxOk(t)) err(at + 'typ reps/hold');
  if ((e.load === 'time') !== !!(t && t.hold)) err(at + 'a timed hold needs load "time" and typ.hold, and only then');
  for (const k of ['cue', 'feel', 'check', 'weight', 'tempo', ...(e.setup || []), ...(e.rep || []).map((r) => r[1]), ...(e.fix || []).flat()])
    { const s = e[k] !== undefined && typeof e[k] === 'string' ? e[k] : k; if (typeof s === 'string' && s.replace(/<\/?b>/g, '').length > 250) warn(at + 'a text runs past 250 characters: ' + s.slice(0, 40) + '…'); }
  if (/\blike (a|an|the)\b|\bas if\b|\bimagine\b|\bpretend\b/i.test(JSON.stringify([e.cue, e.setup, e.rep, e.feel, e.fix, e.check]))) warn(at + 'reads like a comparison (the cards describe the body, not other objects)');
}
function rxOk(it) {
  if (it.hold) return Array.isArray(it.hold) && it.hold.length === 2 && it.hold[0] > 0 && it.hold[0] <= it.hold[1] && it.reps === undefined;
  return Array.isArray(it.reps) && it.reps.length === 2 && Number.isInteger(it.reps[0]) && Number.isInteger(it.reps[1]) && it.reps[0] >= 1 && it.reps[0] <= it.reps[1] && it.reps[1] <= 30;
}

/* ---------- warm-ups ---------- */
for (const k of Object.keys(WARMSETS)) for (const d of WARMSETS[k].drills) if (!WARM[d]) err('WARMSETS.' + k + ': unknown drill ' + d);

/* ---------- programs ---------- */
const workSecs = (it) => (it.hold ? (it.hold[0] + it.hold[1]) / 2 : ((it.reps[0] + it.reps[1]) / 2) * 3.5) * (it.each ? 2 : 1);
const sessionMin = (s) => (s.items.reduce((t, it) => t + it.sets * (workSecs(it) + it.rest) + 90, 0) + 600) / 60;
const tables = [];
for (const pid of PROGRAM_ORDER) if (!PROGRAMS[pid]) err('PROGRAM_ORDER names unknown program ' + pid);
for (const pid of Object.keys(PROGRAMS)) {
  const P = PROGRAMS[pid], pa = 'PROGRAMS.' + pid + ': ';
  if (!PROGRAM_ORDER.includes(pid)) err(pa + 'missing from PROGRAM_ORDER');
  for (const k of ['name', 'line', 'who']) if (!textOk(P[k])) err(pa + k);
  if (!Array.isArray(P.about) || !P.about.length || !P.about.every(textOk)) err(pa + 'about');
  for (const z of P.focus || []) if (!ZONES.has(z)) err(pa + 'focus names unknown zone ' + z);
  if (!P.variants[P.def]) err(pa + 'def names a variant that does not exist');
  const prof = (P.check && P.check.profile) || 'build', band = BANDS[prof];
  if (!band) { err(pa + 'unknown check.profile'); continue; }
  for (const key of Object.keys(P.variants)) {
    const V = P.variants[key], va = pa + key + '-day: ';
    if (+key !== V.sessions.length) err(va + 'has ' + V.sessions.length + ' sessions');
    if (!Array.isArray(V.days) || V.days.length !== V.sessions.length || new Set(V.days).size !== V.days.length || V.days.some((d) => !(d >= 0 && d <= 6))) err(va + 'days');
    const seen = {}, tot = {}, freq = {}, perDay = [];
    let press = 0, pull = 0;
    ALL.concat(['erectors']).forEach((g) => { tot[g] = 0; freq[g] = 0; });
    V.sessions.forEach((s, si) => {
      const sa = va + 'day ' + (si + 1) + ' (' + s.name + '): ';
      if (!textOk(s.name) || !textOk(s.tag) || !textOk(s.focus)) err(sa + 'name, tag or focus');
      if (!WARMSETS[s.warm]) err(sa + 'unknown warm-up set ' + s.warm);
      if (s.items.length > 8) err(sa + s.items.length + ' exercises (at most 8)');
      const day = {}; let sets = 0, spinalSeen = false, coreBeforeSpinal = false;
      s.items.forEach((it, k) => {
        const e = EX[it.ex];
        if (!e) { err(sa + 'unknown exercise ' + it.ex); return; }
        if (!(it.sets >= 1 && it.sets <= 6) || !rxOk(it) || !(it.rest >= 30 && it.rest <= 300) || it.rest % 15) err(sa + it.ex + ' prescription');
        if (!!it.hold !== (e.load === 'time')) err(sa + it.ex + ': hold seconds and a timed exercise must go together');
        const sig = JSON.stringify([it.sets, it.reps || it.hold, !!it.each, it.rest]);
        if (seen[it.ex] && seen[it.ex] !== sig) err(va + it.ex + ' is prescribed two different ways in one week');
        seen[it.ex] = sig;
        if (!!it.each !== !!(e.typ && e.typ.each)) warn(sa + it.ex + ': "each side" differs from the library entry');
        // a plan never asks for reps the lift's band rules out
        if (it.reps) {
          if (e.band === 'heavy' && it.reps[1] > 10) err(sa + it.ex + ' is a heavy lift at ' + it.reps.join('-') + ' reps');
          if (e.band === 'medium' && (it.reps[0] < 6 || it.reps[1] > 15)) err(sa + it.ex + ' is a medium lift at ' + it.reps.join('-') + ' reps');
          if (e.band === 'light' && it.reps[0] < 8) err(sa + it.ex + ' is a light lift at ' + it.reps.join('-') + ' reps');
        }
        const floor = e.kind === 'compound' ? (it.each ? 90 : 120) : 60;
        if (it.rest < floor) warn(sa + it.ex + ' rests ' + it.rest + ' s (floor ' + floor + ')');
        if (k === 0 && e.kind !== 'compound') err(sa + 'does not open with a compound lift');
        if (e.kind === 'core' && s.items.slice(k + 1).some((x) => SPINAL.has(x.ex))) coreBeforeSpinal = true;
        sets += it.sets;
        const c = credit(it.ex);
        for (const g in c) day[g] = (day[g] || 0) + it.sets * c[g];
        if (isPress(it.ex)) press += it.sets;
        if (isPull(it.ex)) pull += it.sets;
      });
      if (coreBeforeSpinal) err(sa + 'core work comes before a lift that loads the spine');
      if (sets > 25) err(sa + sets + ' sets (at most 25)');
      const min = sessionMin(s), cap = (P.check && P.check.maxMin) || 76;
      if (min > cap) err(sa + 'about ' + Math.round(min) + ' min (cap ' + cap + ')');
      for (const g in day) { tot[g] += day[g]; if (day[g] >= 2) freq[g]++; if (day[g] > 12) warn(sa + g + ' gets ' + day[g] + ' sets in one session'); }
      perDay.push({ sets, min: Math.round(min) });
    });
    const emph = new Set(((P.check && P.check.emphasis) || [])), low = new Set((P.check && P.check.lower) || []), opt = new Set((P.check && P.check.optional) || []);
    const groupOf = (z) => GROUP[z] || z;
    const E = new Set([...emph].map(groupOf));
    for (const g of ALL) {
      if (opt.has(g)) continue;
      const b = E.has(g) ? band.emphasis : low.has(g) ? band.lower : MAJOR.includes(g) ? band.major : band.small;
      if (tot[g] < b[0]) (tot[g] < b[0] - 2 ? err : warn)(va + g + ' ' + tot[g] + ' weekly sets, under ' + b[0]);
      if (tot[g] > b[1]) warn(va + g + ' ' + tot[g] + ' weekly sets, over ' + b[1]);
      if (freq[g] < 2 && !low.has(g) && g !== 'calves' && g !== 'abs') warn(va + g + ' is trained on only ' + freq[g] + ' day a week');
    }
    if (prof === 'build' && !low.size) {
      const r = pull / (press || 1), hq = tot.hams / (tot.quads || 1);
      if (r < 0.9 || r > 1.6) warn(va + 'pull:press ' + pull + ':' + press);
      if (hq < 0.6 || hq > 1.4) warn(va + 'hamstring:quad ' + hq.toFixed(2));
    }
    for (const m of (P.check && P.check.mains) || []) {
      const n = V.sessions.reduce((a, s) => a + s.items.filter((it) => it.ex === m).reduce((x, it) => x + it.sets, 0), 0);
      if (n < 3 || n > 10) err(va + 'main lift ' + m + ' has ' + n + ' weekly sets (3-10)');
    }
    tables.push({ plan: P.name + ' · ' + key + ' days', tot, perDay, pull, press });
  }
}
const used = new Set(Object.values(PROGRAMS).flatMap((P) => Object.values(P.variants).flatMap((V) => V.sessions.flatMap((s) => s.items.map((it) => it.ex)))));
const unused = Object.keys(EX).filter((id) => !used.has(id));

if (process.argv.includes('--table')) {
  const cols = [...ALL, 'erectors'];
  console.log('\nWeekly fractional sets per muscle (prim = 1, sec = 0.5)\n');
  console.log('plan'.padEnd(28) + cols.map((c) => c.slice(0, 6).padStart(7)).join('') + '   sets/day (min)');
  for (const t of tables) console.log(t.plan.padEnd(28) + cols.map((c) => String(t.tot[c]).padStart(7)).join('') + '   ' + t.perDay.map((d) => d.sets + '(' + d.min + ')').join(' ') + '   pull:press ' + t.pull + ':' + t.press);
  console.log('\nin the library but in no plan: ' + (unused.join(', ') || 'none'));
}
console.log('\n' + Object.keys(EX).length + ' exercises, ' + Object.keys(PROGRAMS).length + ' programs, ' + tables.length + ' variants');
if (warns.length) console.log('\nWARNINGS (' + warns.length + ')\n  ' + warns.join('\n  '));
if (errors.length) { console.log('\nERRORS (' + errors.length + ')\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\ncontent ok' + (warns.length ? ' (with warnings)' : ''));
