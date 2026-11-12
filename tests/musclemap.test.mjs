// The body in "How to do it": real muscle shapes (MuscleMap, MIT), the working muscle lit in its own shape.
// Built on 12 Nov 2026 after the owner asked for better "body diagrams which show the target muscle".
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { v2State, ROOT } from './harness.mjs';

/* Draw the maps of one lift on the page, the way an opened guide does, and read them back. */
const drawn = (page, id) => page.evaluate((id) => {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:0;top:0;width:360px';
  host.innerHTML = mapsFor(EX[id]);
  document.body.appendChild(host);
  const figs = Array.from(host.querySelectorAll('.maps svg')).map((svg) => ({
    view: svg.dataset.view || '',
    shapes: Array.from(svg.querySelectorAll('.mz')).map((p) => {
      const b = p.getBBox();
      return { z: (p.dataset.z || '').split(' ').filter(Boolean), on: p.classList.contains('on'), sec: p.classList.contains('sec'), box: [b.x, b.y, b.width, b.height] };
    }),
    body: svg.querySelectorAll('.silo').length,
  }));
  const text = host.innerText;
  host.remove();
  return { figs, text, prim: EX[id].prim || [], sec: EX[id].sec || [] };
}, id);

/* WCAG contrast of two CSS colours as the browser resolves them (color-mix included). */
const contrastFn = `(a, b) => {
  const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d', { willReadFrequently: true });
  const lum = (col) => { g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = col; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(d[0]) + 0.7152 * f(d[1]) + 0.0722 * f(d[2]); };
  const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}`;

export default [
  {
    name: 'every muscle a lift names is lit in its own shape, in a view that is shown, and nothing else is lit',
    async run({ open }) {
      const { page, errors } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const ids = await page.evaluate(() => Object.keys(EX));
      assert.ok(ids.length >= 41, 'the sweep saw only ' + ids.length + ' exercises');
      const bad = [];
      for (const id of ids) {
        const d = await drawn(page, id);
        if (!d.figs.length) { bad.push(id + ': no figure'); continue; }
        const all = d.figs.flatMap((f) => f.shapes);
        for (const z of d.prim) if (!all.some((s) => s.on && s.z.includes(z))) bad.push(id + ': main muscle ' + z + ' has no lit shape');
        for (const z of d.sec) if (!all.some((s) => (s.sec || s.on) && s.z.includes(z))) bad.push(id + ': helper ' + z + ' has no lit shape');
        for (const s of all) {
          if (s.on && !s.z.some((z) => d.prim.includes(z))) bad.push(id + ': a shape of ' + (s.z.join('+') || 'no zone') + ' is lit as main');
          if (s.sec && (!s.z.some((z) => d.sec.includes(z)) || s.z.some((z) => d.prim.includes(z)))) bad.push(id + ': a shape of ' + (s.z.join('+') || 'no zone') + ' is lit as helper');
          if ((s.on || s.sec) && !(s.box[2] > 4 && s.box[3] > 4)) bad.push(id + ': a lit shape of ' + s.z.join('+') + ' has no size');
        }
        for (const f of d.figs) {
          if (!f.body) bad.push(id + ': the ' + f.view + ' figure has no body outline');
          if (f.shapes.length < 20) bad.push(id + ': the ' + f.view + ' figure has only ' + f.shapes.length + ' muscle shapes');
          if (!f.shapes.some((s) => s.on || s.sec)) bad.push(id + ': the ' + f.view + ' figure is shown with nothing lit');
        }
      }
      assert.deepEqual(bad, []);
      assert.deepEqual(errors, []);
    },
  },
  {
    name: 'upper chest and chest are two shapes, the upper one above the lower one',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const mid = (s) => s.box[1] + s.box[3] / 2;
      for (const [id, top, low] of [['inclineDB', 'on', 'sec'], ['benchBB', 'sec', 'on']]) {
        const d = await drawn(page, id);
        const front = d.figs.find((f) => f.view === 'front');
        assert.ok(front, id + ': no front figure');
        const up = front.shapes.filter((s) => s.z.includes('uchest')), dn = front.shapes.filter((s) => s.z.includes('chest'));
        assert.equal(up.length, 2, id + ': upper chest should be one shape a side');
        assert.equal(dn.length, 2, id + ': chest should be one shape a side');
        assert.ok(up.every((s) => s[top] && !s[low]) && dn.every((s) => s[low] && !s[top]), id + ': the two chest parts are not lit apart');
        assert.ok(Math.max(...up.map(mid)) < Math.min(...dn.map(mid)), id + ': the upper chest is not above the chest');
        // each part is a real share of the whole: the upper chest between a quarter and a half of the height
        const h = (a) => Math.max(...a.map((s) => s.box[1] + s.box[3])) - Math.min(...a.map((s) => s.box[1]));
        const share = h(up) / h(up.concat(dn));
        assert.ok(share > 0.25 && share < 0.6, id + ': the upper chest is ' + Math.round(share * 100) + '% of the chest height');
      }
    },
  },
  {
    name: 'a helper muscle is told from an unused one by an outline, not only by a shade',
    async run({ open }) {
      for (const theme of ['dark', 'light']) {
        const { page } = await open({ state: v2State({ ui: { theme } }) });
        await page.locator('#ro-today').waitFor();
        const r = await page.evaluate((src) => {
          const contrast = (0, eval)(src);
          const host = document.createElement('div'); host.innerHTML = mapsFor(EX.pulldown); document.body.appendChild(host);
          const cs = (sel) => { const el = host.querySelector(sel); return el ? getComputedStyle(el) : null; };
          const on = cs('.mz.on'), sec = cs('.mz.sec'), off = cs('.mz:not(.on):not(.sec)'), panel = getComputedStyle(host.querySelector('.maps'));
          const out = {
            mainVsOff: contrast(on.fill, off.fill),
            secStroke: sec.stroke, secStrokeW: parseFloat(sec.strokeWidth) || 0, offStroke: off.stroke,
            secLineVsOff: sec.stroke === 'none' ? 0 : contrast(sec.stroke, off.fill),
            secFillIsMain: sec.fill === on.fill,
            mainVsPanel: contrast(on.fill, panel.backgroundColor),
          };
          host.remove(); return out;
        }, contrastFn);
        assert.ok(r.mainVsOff >= 3, theme + ': main against unused is ' + r.mainVsOff.toFixed(2) + ':1');
        assert.notEqual(r.secStroke, 'none', theme + ': a helper muscle has no outline');
        assert.ok(r.secStrokeW > 0, theme + ': the helper outline has no width');
        assert.equal(r.offStroke, 'none', theme + ': an unused muscle is outlined too');
        assert.ok(r.secLineVsOff >= 3, theme + ': the helper outline against unused is ' + r.secLineVsOff.toFixed(2) + ':1');
        assert.equal(r.secFillIsMain, false, theme + ': a helper is filled like a main muscle');
        assert.ok(r.mainVsPanel >= 3, theme + ': main against the panel is ' + r.mainVsPanel.toFixed(2) + ':1');
      }
    },
  },
  {
    name: 'the legend says what the two colours mean, and names only what the lift uses',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const key = (id) => page.evaluate((id) => {
        const host = document.createElement('div'); host.innerHTML = mapsFor(EX[id]); document.body.appendChild(host);
        const k = host.querySelector('.mkey'); const t = k ? k.innerText.replace(/\s+/g, ' ').trim() : null;
        const sw = k ? Array.from(k.querySelectorAll('i')).map((i) => i.className) : [];
        host.remove(); return { t, sw };
      }, id);
      const both = await key('pulldown');           // lats, helped by biceps, mid-back and rear delts
      assert.ok(both.t, 'no legend under the figures');
      assert.match(both.t, /main/i); assert.match(both.t, /helps/i);        // shown in capitals by the style sheet
      assert.equal(both.sw.length, 2, 'the legend should show one swatch for each meaning');
      const one = await key('legext');              // quads only
      assert.match(one.t, /main/i);
      assert.doesNotMatch(one.t, /helps/i, 'a lift with no helper muscle has a "Helps" entry');
    },
  },
  {
    name: 'the figures are big enough to read and fit a small phone',
    async run({ open }) {
      const blk = 'details[data-dayblock="2"] ';
      for (const device of ['iPhone SE', 'Pixel 7']) {
        const { page, errors } = await open({ state: v2State(), hash: 'train', device });
        await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
        const card = page.locator(blk + '.ex[data-ex="squat"]');
        await card.locator('.maps svg').first().waitFor();
        const r = await card.evaluate((el) => {
          const maps = el.querySelector('.maps'), box = maps.getBoundingClientRect(), right = el.getBoundingClientRect().right;
          return {
            open: !!maps.closest('details.how').open,
            sizes: Array.from(maps.querySelectorAll('svg')).map((s) => { const b = s.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), s.checkVisibility()]; }),
            inside: Array.from(maps.querySelectorAll('svg')).every((s) => { const b = s.getBoundingClientRect(); return b.left >= box.left - 0.5 && b.right <= box.right + 0.5; }),
            over: box.right > right + 0.5,
            sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          };
        });
        assert.equal(r.open, true, device + ': the guide of a lift with no history should start open');
        assert.equal(r.sizes.length, 2, device + ': the squat should show the front and the back');
        for (const [w, h, shown] of r.sizes) {
          assert.ok(shown, device + ': a figure is not on screen');
          assert.ok(h >= 170, device + ': a figure is only ' + h + ' px tall');
          assert.ok(w >= 70, device + ': a figure is only ' + w + ' px wide');
        }
        assert.ok(r.inside && !r.over, device + ': the figures stick out of their box');
        assert.equal(r.sideways, false, device + ': the page scrolls sideways');
        assert.deepEqual(errors, []);
      }
    },
  },
  {
    name: 'on a small phone no muscle or equipment tag of any lift sticks out of its card',
    async run({ open }) {
      const blk = 'details[data-dayblock="2"] ';
      const { page } = await open({ state: v2State(), hash: 'train', device: 'iPhone SE' });
      await page.locator(blk + '.ex[data-ex="squat"] .ex-h').click();
      await page.locator(blk + '.ex[data-ex="squat"] .how-b .mtags').waitFor();
      const r = await page.evaluate((blk) => {
        const guide = document.querySelector(blk + '.ex[data-ex="squat"] .how-b');
        const w = guide.clientWidth - parseFloat(getComputedStyle(guide).paddingLeft) - parseFloat(getComputedStyle(guide).paddingRight);
        const host = document.createElement('div'); host.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px';
        document.body.appendChild(host);
        const bad = [];
        for (const id of Object.keys(EX)) {
          host.innerHTML = mapsFor(EX[id]);
          const right = host.getBoundingClientRect().right;
          host.querySelectorAll('.mtags .pill').forEach((p) => { if (p.getBoundingClientRect().right > right + 0.5) bad.push(id + ': "' + p.textContent + '"'); });
        }
        host.remove();
        return { w, bad };
      }, blk);
      assert.ok(r.w > 200 && r.w < 300, 'the guide of a small phone is ' + r.w + ' px wide');
      assert.deepEqual(r.bad, []);
    },
  },
  {
    name: 'in the light theme the body stands out from the panel behind it',
    async run({ open }) {
      const { page } = await open({ state: v2State({ ui: { theme: 'light' } }) });
      await page.locator('#ro-today').waitFor();
      const r = await page.evaluate((src) => {
        const contrast = (0, eval)(src);
        const host = document.createElement('div'); host.innerHTML = mapsFor(EX.squat); document.body.appendChild(host);
        const silo = getComputedStyle(host.querySelector('.silo')), panel = getComputedStyle(host.querySelector('.maps')).backgroundColor;
        const out = { theme: document.documentElement.dataset.theme, line: contrast(silo.stroke, panel), fill: contrast(silo.fill, panel) };
        host.remove(); return out;
      }, contrastFn);
      assert.equal(r.theme, 'light');
      assert.ok(r.line >= 1.5, 'the body outline against the panel is ' + r.line.toFixed(2) + ':1');
      assert.ok(r.fill >= 1.12, 'the body fill against the panel is ' + r.fill.toFixed(2) + ':1');
    },
  },
  {
    name: 'the drawing ships with its credit and licence text, and the app says whose it is',
    async run({ open }) {
      const { page } = await open({ state: v2State() });
      await page.locator('#ro-today').waitFor();
      const html = await (await page.request.get(page.url().split('#')[0])).text();
      assert.match(html, /Copyright \(c\) 2026 Jsplice \/ MuscleMap contributors/);
      assert.match(html, /Permission is hereby granted, free of charge/);
      assert.match(html, /THE SOFTWARE IS PROVIDED "AS IS"/);
      await page.locator('#btnSet').tap();
      const text = await page.locator('#sheetBody').innerText();
      assert.match(text, /MuscleMap/, 'Settings does not credit the drawing');
      assert.match(text, /MIT/);
    },
  },
  {
    name: 'the drawing data in the app is exactly what the kept source files build',
    async run() {
      const out = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'muscle-data.mjs'), '--check'], { encoding: 'utf8' });
      assert.match(out, /ok/);
    },
  },
];
