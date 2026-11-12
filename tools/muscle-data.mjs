#!/usr/bin/env node
// FORGE 90: builds src/js/00-muscle-data.js, the body drawing, from the kept copy of MuscleMap's path data.
//
//   node tools/muscle-data.mjs            write src/js/00-muscle-data.js
//   node tools/muscle-data.mjs --check    exit 1 if that file is not what vendor/musclemap builds
//   node tools/muscle-data.mjs --report   also print every shape, its zone, and the sizes
//
// vendor/musclemap/male-front.ts, male-back.ts
//     the path data of Jsplice/MuscleMap (MIT), copied unchanged at the commit named in PIN.
//     The files are only ever read as text. Nothing in them is imported or run.
//
// What this tool does to the drawing, and nothing else:
//   1. gives every shape the app's zone id (ZONES below); shapes of muscles the app has no zone for
//      (abductors, adductors, the two knee shapes) are kept and never lit
//   2. divides the one chest shape a side into upper chest and chest along a slanted line (SPLIT)
//   3. rounds every coordinate to a whole number (the drawing is 1,536 units tall)
// The app's own code that draws it is src/js/00-muscle-map.js.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = path.join(ROOT, 'vendor', 'musclemap');
const OUT = path.join(ROOT, 'src', 'js', '00-muscle-data.js');
const PIN = '170cfacda79376dd59ac0cf2f7dfab8ff9f4443a';
// git blob hashes of the two files at PIN: a changed or re-fetched copy is refused, not silently used
const FILES = {
  front: ['male-front.ts', '2e552019eac8403d08a09b48ccbc62c14de0702e'],
  back: ['male-back.ts', 'edc7673311275cbe458310dca6a9015b67c741c7'],
};
const check = process.argv.includes('--check'), report = process.argv.includes('--report');

/* Which app zone each of the drawing's surfaces stands for. '' = drawn, never lit.
   Two zones on one shape: it lights for either (the front of the lower leg is one shape). */
const ZONES = {
  front: {
    TRAPEZIUS: 'traps', CHEST: '*chest', SHOULDER_FRONT: 'fdelt', SHOULDER_SIDE: 'sdelt', BICEPS: 'biceps', TRICEPS: 'triceps',
    FOREARM: 'forearm', OBLIQUE: 'obliques', CORE: 'abs', QUADRICEPS: 'quads', CALVES: 'fcalf bcalf', ABDUCTOR: '', ADDUCTOR: '',
  },
  back: {
    TRAPEZIUS: '*traps', SHOULDER_REAR: 'rdelt', SHOULDER_SIDE: 'sdelt', TRICEPS: 'triceps', FOREARM: 'forearm', RHOMBOID: 'midback',
    LATISSIMUS: 'lats', LOWER_BACK: 'lowerback', OBLIQUE: 'obliques', GLUTEUS: 'glutes', ABDUCTOR: '', ADDUCTOR: '',
    HAMSTRINGS: 'hams', CALVES: 'bcalf',
  },
};
/* The zones each view must be able to light (the view a zone is at home in; see 00-muscle-map.js). */
const HOME = {
  front: ['uchest', 'chest', 'fdelt', 'sdelt', 'biceps', 'forearm', 'abs', 'obliques', 'quads', 'fcalf'],
  back: ['traps', 'rdelt', 'lats', 'midback', 'lowerback', 'triceps', 'glutes', 'hams', 'bcalf'],
};
/* The chest is one shape a side in the drawing. The upper chest (the part that runs from the collarbone) is cut
   off along a line that starts `medial` of the way down the shape at the breastbone and ends `lateral` of the way
   down at the armpit, with a gap of `gap` units between the two parts, like the gaps between the other muscles. */
const SPLIT = { medial: 0.33, lateral: 0.52, gap: 5 };
/* In the back view the drawing has two trapezius shapes a side under one id: the upper one (neck to shoulder)
   and the long middle-and-lower one between the shoulder blades. The app calls the second "mid-back". */
const TRAPS_UPPER_ABOVE_Y = 300;
/* One box for both views, so the two figures are drawn to the same scale: x, y, width, height. */
const VIEWBOX = [196, 56, 632, 1396];

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const blobSha = (text) => { const b = Buffer.from(text, 'utf8'); return crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex'); };
const fail = (m) => { console.error('muscle-data: ' + m); process.exit(2); };

/* ------------------------------------------------------------------ SVG path strings */
const PATH_OK = /^[MmZzLlHhVvCcSsQqTt0-9+\-.,\s]+$/;        // no arcs in this drawing; an arc would be refused here
const ARGC = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0 };
/** "M1 2l3-4" -> [{cmd:'M',a:[1,2]},{cmd:'l',a:[3,-4]}]; repeated commands are written out one by one. */
function parsePath(d, where) {
  if (!d || !PATH_OK.test(d)) fail('not a plain SVG path string: ' + where);
  const segs = []; const n = d.length; let i = 0; let cmd = null;
  const skip = () => { while (i < n && (d[i] === ',' || d[i] <= ' ')) i++; };
  const numRe = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
  const num = () => {
    skip(); numRe.lastIndex = i; const m = numRe.exec(d);
    if (!m) fail('number expected at ' + i + ' in ' + where);
    i = numRe.lastIndex; return parseFloat(m[0]);
  };
  for (;;) {
    skip(); if (i >= n) break;
    const c = d[i];
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
      if (!(c.toUpperCase() in ARGC)) fail('unknown command ' + c + ' in ' + where);
      cmd = c; i++;
      if (c === 'Z' || c === 'z') { segs.push({ cmd, a: [] }); continue; }
    } else if (!cmd || cmd === 'Z' || cmd === 'z') fail('command expected at ' + i + ' in ' + where);
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    const a = []; for (let k = 0; k < ARGC[cmd.toUpperCase()]; k++) a.push(num());
    segs.push({ cmd, a });
  }
  return segs;
}
/** Round every coordinate to a whole number. For relative commands the rounding error is carried
 *  forward and corrected at the next point, so a point never drifts more than half a unit a side. */
function roundPath(segs) {
  const r = Math.round;
  let cx = 0, cy = 0, sx = 0, sy = 0;          // where the kept path really is / began
  let ex = 0, ey = 0, esx = 0, esy = 0;        // where the rounded path is / began
  let dev = 0; const out = [];
  for (const { cmd, a } of segs) {
    const U = cmd.toUpperCase(); const rel = cmd !== U;
    if (U === 'Z') { cx = sx; cy = sy; ex = esx; ey = esy; out.push({ cmd, a: [] }); continue; }
    let b; let tx = cx, ty = cy, nx = ex, ny = ey;
    if (U === 'H') { tx = rel ? cx + a[0] : a[0]; b = [rel ? r(tx - ex) : r(tx)]; nx = rel ? ex + b[0] : b[0]; }
    else if (U === 'V') { ty = rel ? cy + a[0] : a[0]; b = [rel ? r(ty - ey) : r(ty)]; ny = rel ? ey + b[0] : b[0]; }
    else {
      const pt = (x, y) => (rel ? [r(cx + x - ex), r(cy + y - ey)] : [r(x), r(y)]);
      b = []; for (let k = 0; k < a.length; k += 2) b.push(...pt(a[k], a[k + 1]));
      const L = a.length;
      tx = rel ? cx + a[L - 2] : a[L - 2]; ty = rel ? cy + a[L - 1] : a[L - 1];
      nx = rel ? ex + b[L - 2] : b[L - 2]; ny = rel ? ey + b[L - 1] : b[L - 1];
    }
    cx = tx; cy = ty; ex = nx; ey = ny;
    if (U === 'M') { sx = cx; sy = cy; esx = ex; esy = ey; }
    dev = Math.max(dev, Math.hypot(cx - ex, cy - ey));
    out.push({ cmd, a: b });
  }
  return { segs: out, dev };
}
/** Compact text form of whole-number segments: a space only where two numbers would run together. */
function writePath(segs) {
  let s = ''; let prev = null;
  for (const { cmd, a } of segs) {
    const U = cmd.toUpperCase();
    const again = prev === cmd && U !== 'M' && U !== 'Z';
    if (!again) s += cmd;
    a.forEach((v, k) => { const t = String(Object.is(v, -0) ? 0 : v); if ((k > 0 || again) && t[0] !== '-') s += ' '; s += t; });
    prev = cmd;
  }
  return s;
}
/** The path as closed rings of points (curves walked in steps of about `step` units). */
function flatten(segs, step = 2) {
  const rings = []; let ring = null;
  let x = 0, y = 0, sx = 0, sy = 0, px = null, py = null, pq = null;      // px,py: last cubic control; pq: last quadratic control
  const lerp = (a, b, t) => a + (b - a) * t;
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const len = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
    const n = Math.max(1, Math.ceil(len / step)); const x0 = x, y0 = y;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      ring.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
    }
    x = x3; y = y3;
  };
  for (const { cmd, a } of segs) {
    const U = cmd.toUpperCase(); const rel = cmd !== U; const ox = rel ? x : 0, oy = rel ? y : 0;
    if (U === 'M') { if (ring && ring.length > 2) rings.push(ring); x = ox + a[0]; y = oy + a[1]; sx = x; sy = y; ring = [[x, y]]; px = pq = null; continue; }
    if (!ring) fail('a path does not start with a move');
    if (U === 'Z') { x = sx; y = sy; px = pq = null; continue; }
    if (U === 'L') { x = ox + a[0]; y = oy + a[1]; ring.push([x, y]); px = pq = null; }
    else if (U === 'H') { x = ox + a[0]; ring.push([x, y]); px = pq = null; }
    else if (U === 'V') { y = oy + a[0]; ring.push([x, y]); px = pq = null; }
    else if (U === 'C') { const c2 = [ox + a[2], oy + a[3]]; cubic(ox + a[0], oy + a[1], c2[0], c2[1], ox + a[4], oy + a[5]); px = c2[0]; py = c2[1]; pq = null; }
    else if (U === 'S') { const c1 = px == null ? [x, y] : [2 * x - px, 2 * y - py]; const c2 = [ox + a[0], oy + a[1]]; cubic(c1[0], c1[1], c2[0], c2[1], ox + a[2], oy + a[3]); px = c2[0]; py = c2[1]; pq = null; }
    else if (U === 'Q' || U === 'T') {
      const q = U === 'Q' ? [ox + a[0], oy + a[1]] : (pq ? [2 * x - pq[0], 2 * y - pq[1]] : [x, y]);
      const e = U === 'Q' ? [ox + a[2], oy + a[3]] : [ox + a[0], oy + a[1]];
      cubic(lerp(x, q[0], 2 / 3), lerp(y, q[1], 2 / 3), lerp(e[0], q[0], 2 / 3), lerp(e[1], q[1], 2 / 3), e[0], e[1]); pq = q; px = null;
    }
  }
  if (ring && ring.length > 2) rings.push(ring);
  return rings;
}
const boxOf = (rings) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rings) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
};
/** Keep the part of a closed ring where side(p) <= 0 (one straight cut). */
function cut(ring, side) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length]; const dp = side(p), dq = side(q);
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
/** Drop points that sit within `tol` of the line between their neighbours (Douglas-Peucker on a closed ring). */
function simplify(ring, tol) {
  if (ring.length < 5) return ring;
  const keep = new Array(ring.length).fill(false);
  // start from the two points furthest apart, so the ring is opened at real corners
  let a = 0, b = 0, far = -1;
  for (let i = 0; i < ring.length; i++) { const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]); if (d > far) { far = d; b = i; } }
  keep[a] = keep[b] = true;
  const dist = (p, u, v) => { const dx = v[0] - u[0], dy = v[1] - u[1], L = dx * dx + dy * dy; if (!L) return Math.hypot(p[0] - u[0], p[1] - u[1]);
    const t = Math.max(0, Math.min(1, ((p[0] - u[0]) * dx + (p[1] - u[1]) * dy) / L)); return Math.hypot(p[0] - u[0] - t * dx, p[1] - u[1] - t * dy); };
  const walk = (i, j) => {                       // indexes along the ring from i to j (j may be past the end)
    let worst = -1, at = -1;
    for (let k = i + 1; k < j; k++) { const d = dist(ring[k % ring.length], ring[i % ring.length], ring[j % ring.length]); if (d > worst) { worst = d; at = k; } }
    if (worst > tol) { keep[at % ring.length] = true; walk(i, at); walk(at, j); }
  };
  walk(a, b); walk(b, a + ring.length);
  return ring.filter((_, i) => keep[i]);
}
/** Closed rings -> one path string of whole numbers: M x y, then relative lines. */
function ringsToPath(rings) {
  let s = '';
  for (const ring of rings) {
    const pts = []; for (const p of ring) { const q = [Math.round(p[0]), Math.round(p[1])]; const l = pts[pts.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) pts.push(q); }
    if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length < 3) continue;
    s += 'M' + pts[0][0] + ' ' + pts[0][1] + 'l';
    for (let i = 1; i < pts.length; i++) { const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1]; s += (i > 1 && dx >= 0 ? ' ' : '') + dx + (dy >= 0 ? ' ' : '') + dy; }
    s += 'z';
  }
  return s;
}

/* ------------------------------------------------------------------ the kept files */
function loadView(view) {
  const [file, sha] = FILES[view]; const src = read(path.join(VENDOR, file));
  if (blobSha(src) !== sha) fail(file + ' is not the copy at commit ' + PIN + ' (blob ' + blobSha(src) + ', expected ' + sha + ')');
  const oi = src.indexOf('const OUTLINE'), mi = src.indexOf('const MUSCLES'), ei = src.indexOf('export const');
  if (oi < 0 || mi < oi || ei < mi) fail('unexpected layout in ' + file);
  const objs = (text) => [...text.matchAll(/\{([^{}]*\bd:\s*"[^"]*"[^{}]*)\}/g)].map((m) => {
    const o = {}; for (const f of m[1].matchAll(/(\w+):\s*"([^"]*)"/g)) o[f[1]] = f[2]; return o;
  });
  const vb = (/viewBox:\s*"([^"]+)"/.exec(src) || [])[1];
  if (vb !== '0 0 1024 1536') fail(file + ': the drawing box is ' + vb + ', not 0 0 1024 1536');
  const outline = objs(src.slice(oi, mi));
  if (outline.length !== 1) fail(file + ': expected one body outline, found ' + outline.length);
  return { file, outline: outline[0].d, shapes: objs(src.slice(mi, ei)) };
}

function buildView(view) {
  const v = loadView(view); const map = ZONES[view]; const out = []; const rows = [];
  let dev = 0;
  const keepCurves = (d, where) => { const r = roundPath(parsePath(d, where)); dev = Math.max(dev, r.dev); return writePath(r.segs); };
  v.shapes.forEach((o, i) => {
    const where = v.file + ' shape ' + i + ' (' + (o.id || o.group) + ')';
    const name = o.id ? o.id.replace(/_(LEFT|RIGHT)$/, '') : null;
    if (name && !(name in map)) fail(where + ': no zone is set for ' + name);
    let zone = name ? map[name] : '';                      // a shape without an id is not one of the drawing's own surfaces: never lit
    const rings = flatten(parsePath(o.d, where)); const box = boxOf(rings);
    if (zone === '*traps') zone = box.y0 < TRAPS_UPPER_ABOVE_Y ? 'traps' : 'midback';
    if (zone === '*chest') {
      const left = (box.x0 + box.x1) / 2 < 512;            // on the left of the picture
      const xm = left ? box.x1 : box.x0, xl = left ? box.x0 : box.x1;
      const ym = box.y0 + SPLIT.medial * box.h, yl = box.y0 + SPLIT.lateral * box.h;
      const line = (x) => ym + (yl - ym) * (x - xm) / (xl - xm);
      const part = (sign) => rings.map((r) => simplify(cut(r, (p) => sign * (p[1] - line(p[0])) + SPLIT.gap / 2), 0.5)).filter((r) => r.length > 2);
      const up = ringsToPath(part(1)), low = ringsToPath(part(-1));
      if (!up || !low) fail(where + ': the chest did not divide into two parts');
      out.push(['uchest', up], ['chest', low]);
      rows.push([i, o.id, 'uchest + chest (divided)', box]);
      return;
    }
    out.push([zone, keepCurves(o.d, where)]);
    rows.push([i, o.id || o.group + ' (no id)', zone || '(never lit)', box]);
  });
  const lit = new Set(out.flatMap((m) => m[0].split(' ')).filter(Boolean));
  for (const z of HOME[view]) if (!lit.has(z)) fail(view + ': no shape for ' + z);
  return { o: keepCurves(v.outline, v.file + ' outline'), m: out, rows, dev };
}

const views = { front: buildView('front'), back: buildView('back') };
const licence = read(path.join(VENDOR, 'LICENSE')).split('\n---')[0].trim();
if (!/^MIT License/.test(licence) || !/Copyright \(c\) 2026 Jsplice \/ MuscleMap contributors/.test(licence)) fail('vendor/musclemap/LICENSE is not the expected MIT text');
const q = (s) => "'" + s + "'";
let js = '/* GENERATED FILE: do not edit by hand. Written by tools/muscle-data.mjs from vendor/musclemap. */\n'
  + '/*!\n'
  + ' * The body drawing: muscle shapes from MuscleMap (https://github.com/Jsplice/MuscleMap), the male front and\n'
  + ' * back figures at commit ' + PIN.slice(0, 7) + '. Changed for this app: coordinates rounded to whole numbers, and the chest shape\n'
  + ' * divided into upper chest and chest. Used under the MIT License, whose text follows.\n'
  + ' *\n'
  + licence.split('\n').map((l) => (' * ' + l).replace(/\s+$/, '')).join('\n') + '\n'
  + ' */\n'
  + 'const BODY_VB=' + q(VIEWBOX.join(' ')) + ';\n'
  + 'const BODY={\n';
for (const view of ['front', 'back']) {
  const v = views[view];
  js += view + ':{o:' + q(v.o) + ',\nm:[\n' + v.m.map((m) => '[' + q(m[0]) + ',' + q(m[1]) + ']').join(',\n') + '\n]}' + (view === 'front' ? ',' : '') + '\n';
}
js += '};\n';
if (js.includes('</script') || /[^\x00-\x7F]/.test(js.replace(licence, ''))) fail('the generated file holds text that does not belong in a script');

if (report) {
  for (const view of ['front', 'back']) {
    console.log('\n' + view + ': ' + views[view].m.length + ' shapes, largest shift from rounding ' + views[view].dev.toFixed(2) + ' units');
    for (const [i, id, zone, b] of views[view].rows) console.log(String(i).padStart(3) + '  ' + String(id).padEnd(22) + String(zone).padEnd(26) + [b.x0, b.y0, b.w, b.h].map((n) => n.toFixed(0).padStart(6)).join(''));
  }
  console.log('\n00-muscle-data.js: ' + Buffer.byteLength(js) + ' bytes, ' + zlib.gzipSync(js, { level: 9 }).length + ' gzip');
}
const cur = fs.existsSync(OUT) ? read(OUT) : '';
if (check) {
  console.log((cur === js ? 'ok   ' : 'STALE') + ' src/js/00-muscle-data.js');
  process.exit(cur === js ? 0 : 1);
}
if (cur !== js) fs.writeFileSync(OUT, js);
console.log((cur === js ? 'unchanged ' : 'wrote ') + 'src/js/00-muscle-data.js  ' + Buffer.byteLength(js) + ' bytes');
