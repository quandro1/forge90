#!/usr/bin/env node
// Where the width goes on a narrow phone: the box of every ancestor of a set row.
//   node tools/widths.mjs [device]
import { launch, serve, openApp, v2State, ROOT } from '../tests/harness.mjs';
const device = process.argv[2] || 'iPhone SE';
const server = await serve(ROOT);
const { pw, browser } = await launch();
try {
  const { page } = await openApp({ pw, browser, base: server.url }, { state: v2State(), hash: 'train', device });
  await page.locator('details[data-dayblock="2"] .ex[data-ex="squat"] .ex-h').click();
  await page.locator('details[data-dayblock="2"] .logger[data-log="squat"]').waitFor();
  const rows = await page.evaluate(() => {
    const out = []; let el = document.querySelector('.logger[data-log="squat"] .setrow input');
    while (el && el !== document.documentElement) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/ +/).join('.') : ''))
        + '  w=' + Math.round(r.width) + '  pad=' + cs.paddingLeft + '/' + cs.paddingRight + '  mar=' + cs.marginLeft + '/' + cs.marginRight + '  bor=' + cs.borderLeftWidth);
      el = el.parentElement;
    }
    return out;
  });
  console.log(device + '  viewport ' + (await page.evaluate(() => innerWidth)) + ' px');
  rows.forEach((r) => console.log('  ' + r));
} finally {
  await browser.close();
  await server.close();
}
