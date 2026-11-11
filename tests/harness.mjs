// FORGE 90 test harness.
// Serves the app folder on localhost and drives the installed Google Chrome,
// emulating a phone, through playwright-core. Nothing is downloaded: the
// library is taken from ./node_modules if present, else from the npx cache
// the Playwright plugin already keeps on this machine.
//
//   node tests/run.mjs                 run every tests/*.test.mjs
//   node tests/run.mjs timer           run files whose name contains "timer"
//   FORGE_PAGE=index.html              which page to test (default index.html)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const PAGE = process.env.FORGE_PAGE || 'index.html';

/* Every test runs at this pretend moment, so fixtures can use fixed dates
   and still mean the same thing next month. A Wednesday. */
export const NOW = '2026-11-11T09:00:00';
export const TODAY = '2026-11-11';

function findPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [];
  if (process.env.PLAYWRIGHT_CORE) candidates.push(process.env.PLAYWRIGHT_CORE);
  candidates.push(path.join(ROOT, 'node_modules', 'playwright-core'));
  const npx = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'npm-cache', '_npx');
  try {
    for (const d of fs.readdirSync(npx)) candidates.push(path.join(npx, d, 'node_modules', 'playwright-core'));
  } catch { /* no npx cache */ }
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return require(c);
  }
  throw new Error('playwright-core not found. Run "npm i --no-save playwright-core" in ' + ROOT
    + ' or set PLAYWRIGHT_CORE to its folder.\nLooked in:\n  ' + candidates.join('\n  '));
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

/** Static file server on a free loopback port. `down()` makes every request fail, to test offline;
 *  `setRoot(dir)` swaps the folder being served, to test a new deployment reaching an open app. */
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    let dead = false;
    const srv = http.createServer((req, res) => {
      if (dead) { req.socket.destroy(); return; }
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += PAGE;
      const file = path.join(root, p);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, {
          'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        res.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({
      url: 'http://localhost:' + srv.address().port + '/',
      down: () => { dead = true; },
      up: () => { dead = false; },
      setRoot: (dir) => { root = path.resolve(dir); },
      close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }),
    }));
  });
}

export async function launch() {
  const pw = findPlaywright();
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: process.env.HEADED ? false : true,
    args: ['--host-resolver-rules=MAP localhost 127.0.0.1'],
  });
  return { pw, browser };
}

/**
 * Open the app on an emulated phone.
 *   state   object written to localStorage before the app boots (once per tab, so reloads keep what the app saved)
 *   key     localStorage key for `state` (default forge90_v1)
 *   extra   {key: string} more raw localStorage entries
 *   hash    tab to open, e.g. 'train'
 *   now     pretend date-time (default NOW); false = real clock
 *   sw      true to allow the service worker (default blocked, so a cached old build can never answer)
 *   device  playwright device name (default 'Pixel 7')
 * Returns { page, context, errors, clock }. `errors` collects uncaught page errors and console.error lines.
 */
export async function openApp(env, opts = {}) {
  const { pw, browser, base } = env;
  const dev = pw.devices[opts.device || 'Pixel 7'];
  const context = await browser.newContext({
    ...dev,
    serviceWorkers: opts.sw ? 'allow' : 'block',
    locale: 'en-GB',
    timezoneId: opts.tz || 'Asia/Karachi',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e))));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  if (opts.now !== false) await page.clock.install({ time: new Date(opts.now || NOW) });
  const seed = {};
  if (opts.state !== undefined) seed[opts.key || 'forge90_v1'] = JSON.stringify(opts.state);
  Object.assign(seed, opts.extra || {});
  await page.addInitScript((s) => {
    try {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for (const k in s) localStorage.setItem(k, s[k]);
    } catch (e) { /* storage blocked */ }
  }, seed);
  await page.goto(base + (opts.hash ? '#' + opts.hash : ''), { waitUntil: 'load' });
  return { page, context, errors, clock: page.clock };
}

/** A fresh state in the shape the 2 Oct 2026 build stores (key forge90_v1). */
export function v1State(over = {}) {
  const s = {
    profile: { start: '2026-11-09', w: 88, h: 180, age: 23, act: 1.45, goal: 75, split: 'five' },
    checks: {}, weights: {}, waist: {}, steps: {}, meas: [], logs: {}, food: {}, cond: {},
    ui: { theme: 'dark', diet: 'train', helpSeen: 1 },
  };
  for (const k in over) s[k] = (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) ? { ...s[k], ...over[k] } : over[k];
  return s;
}
