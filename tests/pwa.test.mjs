// App shell: offline after one visit, and a new deployment reaching a phone
// that still runs the build published on 2 Oct 2026.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, v1State } from './harness.mjs';

const OLD = path.join(ROOT, 'tests', '.out', 'build-2026-10-02');
/** The files exactly as published on 2 Oct 2026 (commit a3e9dbb), unpacked once. */
export function oldBuild() {
  if (fs.existsSync(path.join(OLD, 'index.html'))) return OLD;
  fs.mkdirSync(OLD, { recursive: true });
  const names = execFileSync('git', ['-C', ROOT, 'ls-tree', '-r', '--name-only', 'a3e9dbb'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);
  for (const n of names) {
    const buf = execFileSync('git', ['-C', ROOT, 'show', 'a3e9dbb:' + n], { maxBuffer: 64 * 1024 * 1024 });
    fs.mkdirSync(path.dirname(path.join(OLD, n)), { recursive: true });
    fs.writeFileSync(path.join(OLD, n), buf);
  }
  return OLD;
}
const precached = (page) => page.waitForFunction(async () => {
  if (!(await navigator.serviceWorker.getRegistration())) return false;
  const ks = await caches.keys();
  if (ks.length !== 1) return false;
  return (await (await caches.open(ks[0])).keys()).length >= 6;
}, null, { timeout: 20000 });
const buildOf = (page) => page.evaluate(() => { const m = document.querySelector('meta[name="forge-build"]'); return m ? m.content : null; });

export default [
  {
    name: 'after one visit the app opens with no network at all',
    async run({ open, server }) {
      const { page } = await open({ state: v1State(), sw: true });
      await precached(page);
      server.down();
      await page.reload();
      await page.locator('#ro-today').waitFor();
      assert.match(await page.locator('#dayline').innerText(), /day 3 of 91/i);
    },
  },
  {
    name: 'a phone on the 2 Oct build receives the new build, keeps its log, and works offline on it',
    async run({ open, server }) {
      server.setRoot(oldBuild());
      const logs = { inclineBB: [{ d: '2026-11-10', sets: [{ w: 60, r: 8, done: 1 }, { w: 60, r: 7, done: 1 }, {}, {}] }] };
      const { page, errors } = await open({ state: v1State({ logs }), sw: true });
      await precached(page);
      assert.equal(await buildOf(page), null, 'the old build should carry no build stamp');
      const oldCache = (await page.evaluate(() => caches.keys()))[0];

      server.setRoot(ROOT);                       // the new files are published
      await page.reload();                        // next time the phone opens the app with a signal
      await page.locator('#ro-today').waitFor();
      const build = await buildOf(page);
      assert.match(String(build), /^[0-9a-f]{10}$/, 'the page is still the old build');
      assert.deepEqual(await page.evaluate(() => S.logs.inclineBB), logs.inclineBB, 'the log changed');

      await page.waitForFunction(async (old) => {
        const ks = await caches.keys();
        return ks.length === 1 && ks[0] !== old && /^forge90-auto-[0-9a-f]{12}$/.test(ks[0])
          && (await (await caches.open(ks[0])).keys()).length >= 6;
      }, oldCache, { timeout: 20000 });

      server.down();
      await page.reload();
      await page.locator('#ro-today').waitFor();
      assert.equal(await buildOf(page), build, 'offline, the phone fell back to another build');
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|net::ERR/.test(e)), []);
    },
  },
];
