// The rule-break lists in tests/mutations are what tools/mutate.mjs uses to check that the tests are watching.
// A list goes stale without a sound when the source line it breaks is rewritten, or the test it points at is
// renamed: these two checks keep every entry pointing at something real.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './harness.mjs';

const DIR = path.join(ROOT, 'tests', 'mutations');
const lists = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
  .map((f) => ({ f, list: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }));

export default [
  {
    name: 'every rule break in tests/mutations changes text that is in the source exactly once',
    async run() {
      const bad = [];
      let n = 0;
      for (const { f, list } of lists()) for (const m of list) {
        n++;
        for (const k of ['name', 'file', 'find', 'tests', 'expect']) assert.ok(typeof m[k] === 'string' && m[k], f + ': an entry has no "' + k + '"');
        assert.equal(typeof m.put, 'string', f + ' > ' + m.name + ': no "put"');
        assert.notEqual(m.put, m.find, f + ' > ' + m.name + ': it changes nothing');
        const src = fs.readFileSync(path.join(ROOT, m.file), 'utf8');
        const times = src.split(m.find).length - 1;
        if (times !== 1) bad.push(f + ' > ' + m.name + ' (its text occurs ' + times + ' times in ' + m.file + ')');
      }
      assert.ok(n > 0, 'no rule breaks were found');
      assert.deepEqual(bad, [], 'these rule breaks no longer match the source');
    },
  },
  {
    name: 'every rule break names a test file that exists and a test whose name holds its expected words',
    async run() {
      const all = fs.readdirSync(path.join(ROOT, 'tests')).filter((x) => x.endsWith('.test.mjs'));
      const bad = [];
      for (const { f, list } of lists()) for (const m of list) {
        const files = all.filter((x) => m.tests.split(' ').filter(Boolean).some((t) => x.includes(t)));
        if (!files.length) { bad.push(f + ' > ' + m.name + ' (no test file matches "' + m.tests + '")'); continue; }
        const names = [];
        for (const x of files) {
          const mod = await import(pathToFileURL(path.join(ROOT, 'tests', x)).href);
          names.push(...(mod.default || []).map((t) => String(t.name).toLowerCase()));
        }
        if (!names.some((nm) => nm.includes(m.expect.toLowerCase()))) bad.push(f + ' > ' + m.name + ' (no test in ' + files.join(', ') + ' is named with "' + m.expect + '")');
      }
      assert.deepEqual(bad, [], 'these rule breaks point at a test that is not there');
    },
  },
];
