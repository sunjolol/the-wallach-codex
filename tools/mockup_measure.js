#!/usr/bin/env node
/**
 * Report the TRUE rendered geometry of a mockup shell.
 *
 * WHY: "measure, do not estimate" is the rule that keeps getting relearned. A label
 * measured 197px against a ~140px estimate and collided twice; a figure authored at
 * 820px rendered at scale 0.996 and silently shrank every label in it.
 *
 * Reports, per figure: the authored viewBox width, the rendered CSS width, and the
 * resulting SCALE. Anything other than 1.000 means a declared px is NOT a screen px --
 * usually the ID-selector cascade trap (a bare-class max-width override losing to
 * `#drawer-knowledge-mount .kd-ep-fam__figure`, dropping you to the 560px base).
 *
 * Also runs a text-collision pass. Note its blind spot, stated rather than implied:
 * it compares text against text, so it CANNOT see a stroke routed through a label or a
 * label painted before an opaque shape that covers it. Those need eyes.
 */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const target = process.argv[2];
  if (!target) { console.error('usage: node tools/mockup_measure.js <shell.html>'); process.exit(2); }
  const url = 'file:///' + path.resolve(target).replace(/\\/g, '/');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const failed = [];
  page.on('requestfailed', r => failed.push(r.url()));
  await page.goto(url, { waitUntil: 'networkidle0' });

  const report = await page.evaluate(() => {
    const out = { containers: [], figures: [], collisions: [] };
    document.querySelectorAll('.kd-ep-fam').forEach((el, i) => {
      const cs = getComputedStyle(el);
      out.containers.push({ i, clientWidth: el.clientWidth,
        padL: cs.paddingLeft, padR: cs.paddingRight,
        figureCeiling: el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) });
    });
    document.querySelectorAll('svg').forEach((svg, i) => {
      const vb = (svg.getAttribute('viewBox') || '').split(/\s+/);
      const authored = vb.length === 4 ? parseFloat(vb[2]) : null;
      const rendered = svg.getBoundingClientRect().width;
      out.figures.push({ i, cls: svg.getAttribute('class') || '(none)', authored,
        rendered: +rendered.toFixed(1),
        scale: authored ? +(rendered / authored).toFixed(3) : null });
      const texts = [...svg.querySelectorAll('text')];
      for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
        const r1 = texts[a].getBoundingClientRect(), r2 = texts[b].getBoundingClientRect();
        if (r1.width && r2.width && !(r1.right < r2.left || r2.right < r1.left ||
            r1.bottom < r2.top || r2.bottom < r1.top))
          out.collisions.push(`"${texts[a].textContent.trim().slice(0,24)}" x "${texts[b].textContent.trim().slice(0,24)}"`);
      }
    });
    return out;
  });

  console.log('CONTAINERS (the real geometry):');
  report.containers.forEach(c => console.log(
    `  #${c.i}  clientWidth ${c.clientWidth}px  padding ${c.padL}/${c.padR}  => FIGURE CEILING ${c.figureCeiling}px`));
  console.log('FIGURES:');
  report.figures.forEach(f => {
    const flag = f.scale === null ? '(no viewBox)' : (f.scale === 1 ? 'scale 1.000 OK'
      : `*** scale ${f.scale} -- a declared px is NOT a screen px ***`);
    console.log(`  #${f.i}  ${f.cls}  authored ${f.authored} -> rendered ${f.rendered}  ${flag}`);
  });
  if (failed.length) { console.log('FAILED RESOURCES (a 404 font falls back SILENTLY):'); failed.forEach(u => console.log('  ' + u)); }
  if (report.collisions.length) {
    console.log(`TEXT COLLISIONS (${report.collisions.length}):`);
    report.collisions.slice(0, 12).forEach(c => console.log('  ' + c));
  } else console.log('TEXT COLLISIONS: none');
  console.log('NOTE: text-vs-text only. A stroke through a label, or a label hidden behind an');
  console.log('      opaque shape, is INVISIBLE here. Screenshot and use your eyes.');
  await browser.close();
  process.exit(failed.length || report.collisions.length ? 1 : 0);
})();
