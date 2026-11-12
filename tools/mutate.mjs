#!/usr/bin/env node
// Breaks one rule at a time in the source, builds, runs the tests named for it, and puts the source back.
// A rule counts as pinned only when a test fails AND that test's name holds the words expected for the rule:
// "some test failed" is not evidence that the right test is watching.
//
//   node tools/mutate.mjs tests/mutations/backup-history-week.json [more lists ...]
//
// A list is [{ "name", "file", "find", "put", "tests", "expect" }]:
//   name    the rule being broken, in plain words
//   file    the source file, from the app folder
//   find    text that occurs exactly once in that file
//   put     what replaces it (the broken rule)
//   tests   which test files to run (the filters of tests/run.mjs, space separated)
//   expect  words from the name of the test that should fail
//
// Verdicts: "caught by: <test>", "MISSED" (every test passed: a gap in the tests, or a change nobody can see),
// "CAUGHT BY ANOTHER TEST ONLY" (look at why), "BAD MUTATION" (the text is not there exactly once).
// The source is restored and rebuilt at the end, also when a run is interrupted by an error in a list.
// Do not run it while something else reads index.html (the suite, a review): it rebuilds the page each time.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lists = process.argv.slice(2);
if (!lists.length) { console.error('give at least one list, for example tests/mutations/backup-history-week.json'); process.exit(2); }
const run = (args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let pinned = 0, total = 0;
try {
  for (const lf of lists) {
    const list = JSON.parse(fs.readFileSync(path.resolve(ROOT, lf), 'utf8'));
    console.log('\n' + lf);
    for (const m of list) {
      total++;
      const file = path.join(ROOT, m.file), before = fs.readFileSync(file, 'utf8');
      const n = before.split(m.find).length - 1;
      let verdict;
      if (n !== 1) verdict = 'BAD MUTATION: the text occurs ' + n + ' times in ' + m.file;
      else {
        try {
          fs.writeFileSync(file, before.replace(m.find, () => m.put));
          if (run(['tools/build.mjs']).status !== 0) verdict = 'BUILD FAILED';
          else {
            const out = run(['tests/run.mjs', ...m.tests.split(' ')]).stdout || '';
            const failed = out.split('\n').filter((l) => /^\s+FAIL\s/.test(l)).map((l) => l.replace(/^\s+FAIL\s+/, '').trim());
            const mine = failed.filter((f) => f.toLowerCase().includes(m.expect.toLowerCase()));
            if (!failed.length) verdict = 'MISSED: every test still passes';
            else if (mine.length) { verdict = 'caught by: ' + mine[0] + (failed.length > 1 ? '  (+' + (failed.length - 1) + ' more)' : ''); pinned++; }
            else verdict = 'CAUGHT BY ANOTHER TEST ONLY: ' + failed.join(' | ');
          }
        } finally { fs.writeFileSync(file, before); }
      }
      console.log('  ' + m.name + '\n     ' + verdict);
    }
  }
} finally {
  const b = run(['tools/build.mjs']);
  console.log('\nsource restored and rebuilt: ' + ((b.stdout || '').trim().split('\n').pop() || 'build failed'));
}
console.log(pinned + ' of ' + total + ' pinned');
process.exit(pinned === total ? 0 : 1);
