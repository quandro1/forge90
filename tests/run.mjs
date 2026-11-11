// Runs tests/*.test.mjs against the app in headless Chrome. See harness.mjs.
// Each test file default-exports an array of { name, run(ctx) }.
// ctx.open(opts) opens the app on an emulated phone (harness.openApp) and the
// page is closed for you afterwards; a test fails if it throws.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch, serve, openApp, ROOT, PAGE } from './harness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const filters = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = fs.readdirSync(HERE).filter((f) => f.endsWith('.test.mjs'))
  .filter((f) => !filters.length || filters.some((x) => f.includes(x))).sort();

const server = await serve(ROOT);
const { pw, browser } = await launch();
const env = { pw, browser, base: server.url, server };
let pass = 0, fail = 0;
const failures = [];
console.log('page under test: ' + PAGE + '  (' + server.url + ')');

for (const f of files) {
  const mod = await import(pathToFileURL(path.join(HERE, f)).href);
  const tests = mod.default || [];
  console.log('\n' + f);
  for (const t of tests) {
    const opened = [];
    const ctx = {
      env, server,
      open: async (opts) => { const o = await openApp(env, opts); opened.push(o); return o; },
    };
    const t0 = Date.now();
    try {
      await t.run(ctx);
      pass++;
      console.log('  ok    ' + t.name + '  (' + (Date.now() - t0) + ' ms)');
    } catch (e) {
      fail++;
      const msg = (e && e.message ? e.message : String(e)).split('\n').slice(0, 12).join('\n          ');
      failures.push(f + ' > ' + t.name);
      console.log('  FAIL  ' + t.name + '\n          ' + msg);
    } finally {
      for (const o of opened) { try { await o.context.close(); } catch { /* already closed */ } }
      server.up();
    }
  }
}

await browser.close();
await server.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '\n  ' + failures.join('\n  ') : ''));
process.exit(fail ? 1 : 0);
