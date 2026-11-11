#!/usr/bin/env node
// FORGE 90 build: assembles the single-file app from src/.
//
//   node tools/build.mjs            write index.html (and stamp sw.js)
//   node tools/build.mjs --check    exit 1 if index.html is not what src/ builds
//
// src/index.template.html   the page shell, with two marker lines
// src/styles.css            replaces the /*__FORGE_CSS__*/ line
// src/js/*.js               concatenated in file-name order, replace /*__FORGE_JS__*/
//
// All the scripts share one global scope, exactly as they did when the app
// was one file, so the order of the files is the order of declaration.
// The service-worker cache name is derived from the built files, so a new
// build can never be served from an old cache by forgetting to bump it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const check = process.argv.includes('--check');

const tpl = read(path.join(SRC, 'index.template.html'));
const css = read(path.join(SRC, 'styles.css'));
const jsDir = path.join(SRC, 'js');
const parts = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort();
const js = parts.map((f) => {
  const t = read(path.join(jsDir, f));
  return t.endsWith('\n') ? t : t + '\n';
}).join('');

for (const m of ['/*__FORGE_CSS__*/\n', '/*__FORGE_JS__*/\n']) {
  if (tpl.split(m).length !== 2) { console.error('template must contain exactly one ' + m.trim() + ' line'); process.exit(2); }
}
let html = tpl.replace('/*__FORGE_CSS__*/\n', () => css).replace('/*__FORGE_JS__*/\n', () => js);

// optional build stamp: the template may carry __FORGE_BUILD__ (a short content hash)
const stampOf = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const build = stampOf(html.replace(/__FORGE_BUILD__/g, ''));
html = html.replace(/__FORGE_BUILD__/g, build);

// sw.js: CACHE follows the content of everything the worker precaches
const swPath = path.join(ROOT, 'sw.js');
let sw = fs.existsSync(swPath) ? read(swPath) : null;
let swOut = sw;
if (sw && /const CACHE = 'forge90-auto-[0-9a-f]+';/.test(sw)) {
  const assets = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
  const h = crypto.createHash('sha256').update(html);
  h.update(sw.replace(/const CACHE = 'forge90-auto-[0-9a-f]+';/, ''));
  for (const a of assets) { const p = path.join(ROOT, a); if (fs.existsSync(p)) h.update(fs.readFileSync(p)); }
  swOut = sw.replace(/const CACHE = 'forge90-auto-[0-9a-f]+';/, "const CACHE = 'forge90-auto-" + h.digest('hex').slice(0, 12) + "';");
}

const outPath = path.join(ROOT, 'index.html');
if (check) {
  const cur = fs.existsSync(outPath) ? read(outPath) : '';
  const okHtml = cur === html, okSw = !sw || swOut === sw;
  console.log((okHtml ? 'ok   ' : 'STALE') + ' index.html' + (sw ? '   ' + (okSw ? 'ok   ' : 'STALE') + ' sw.js cache name' : ''));
  process.exit(okHtml && okSw ? 0 : 1);
}
fs.writeFileSync(outPath, html);
if (sw && swOut !== sw) fs.writeFileSync(swPath, swOut);
console.log('built index.html  ' + html.length + ' chars from ' + parts.length + ' scripts  build ' + build
  + (sw ? '  cache ' + (swOut.match(/const CACHE = '([^']+)'/) || [])[1] : ''));
