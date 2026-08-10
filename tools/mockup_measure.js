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
 *
 * And it PROVES THE PAGE SCROLLS, by scrolling it. A standalone page that links the app
 * CSS inherits `html, body { height:100%; overflow:hidden }` (dashboard.css:25 /
 * workspace-coverage.css:79) and is locked to the first viewport. That has reached
 * Luneth six times, every time past a green headless check, because element.screenshot()
 * and fullPage:true both capture regardless of root overflow. The only honest test is to
 * scroll and read scrollY back -- a computed-style check alone would still miss a page
 * locked some other way.
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

  // ── CAN THE USER SCROLL? (the wheel, not a scripted jump) ─────────────────
  // window.scrollTo() is NOT the user's path: `overflow: hidden` leaves an element a
  // scroll CONTAINER and only blocks user input, so a scripted jump succeeds on a page
  // the user cannot move at all. The first version of this check did exactly that and
  // passed a page that was provably locked. Two honest signals instead:
  //   1. the effective VIEWPORT overflow, using the real propagation rule -- the
  //      viewport takes html's overflow unless that is `visible`, then body's;
  //   2. a real wheel event dispatched through the browser's input pipeline.
  const pre = await page.evaluate(() => {
    const doc = document.documentElement;
    const htmlOv = getComputedStyle(doc).overflowY;
    const bodyOv = getComputedStyle(document.body).overflowY;
    return {
      needed: doc.scrollHeight > window.innerHeight + 4,
      scrollHeight: doc.scrollHeight, viewport: window.innerHeight,
      htmlOverflowY: htmlOv, bodyOverflowY: bodyOv,
      effective: htmlOv === 'visible' ? bodyOv : htmlOv,
    };
  });
  await page.mouse.move(700, 500);
  await page.mouse.wheel({ deltaY: 900 });
  await new Promise(r => setTimeout(r, 260));
  const wheeled = await page.evaluate(() =>
    window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  const scroll = Object.assign({}, pre, { wheeled });
  const scrollLocked = scroll.needed
    && (scroll.wheeled < 50 || ['hidden', 'clip'].includes(scroll.effective));

  const report = await page.evaluate(() => {
    const out = { containers: [], figures: [], collisions: [], clipped: [] };
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
      // A label that runs off the viewBox is truncated on screen but collides with
      // NOTHING, so the text-vs-text pass above cannot see it. Check the edges too.
      const vbx = svg.viewBox && svg.viewBox.baseVal;
      if (vbx && vbx.width) texts.forEach(t => {
        const bb = t.getBBox();
        const over = (bb.x + bb.width) - (vbx.x + vbx.width);
        const under = vbx.x - bb.x;
        const below = (bb.y + bb.height) - (vbx.y + vbx.height);
        if (over > 1) out.clipped.push(`right by ${over.toFixed(1)}px: "${t.textContent.trim().slice(0,32)}"`);
        else if (under > 1) out.clipped.push(`left by ${under.toFixed(1)}px: "${t.textContent.trim().slice(0,32)}"`);
        if (below > 1) out.clipped.push(`bottom by ${below.toFixed(1)}px: "${t.textContent.trim().slice(0,32)}"`);
      });
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
  console.log('SCROLL (proved by scrolling, not by reading a style):');
  if (!scroll.needed) {
    console.log(`  page fits the viewport (${scroll.scrollHeight} <= ${scroll.viewport}) -- nothing to scroll`);
  } else if (scrollLocked) {
    console.log(`  *** LOCKED *** ${scroll.scrollHeight}px of content, viewport ${scroll.viewport}px,`);
    console.log(`      a real wheel event moved ${scroll.wheeled}px; effective viewport overflow-y=${scroll.effective}.`);
    console.log(`      html overflow-y=${scroll.htmlOverflowY}  body overflow-y=${scroll.bodyOverflowY}`);
    console.log('      Cause: dashboard.css:25 / workspace-coverage.css:79 set');
    console.log('      `html, body { height:100%; overflow:hidden }` for the fixed app shell.');
    console.log('      Fix, in the page\'s own <style> AFTER the <link> tags:');
    console.log('        html, body { height: auto !important; overflow: auto !important; }');
    console.log('      `overflow-x: hidden` does NOT fix it -- overflow-y stays hidden.');
  } else {
    console.log(`  scrolls OK -- ${scroll.scrollHeight}px content, a real wheel moved ${scroll.wheeled}px (overflow-y=${scroll.effective})`);
  }
  if (failed.length) { console.log('FAILED RESOURCES (a 404 font falls back SILENTLY):'); failed.forEach(u => console.log('  ' + u)); }
  if (report.collisions.length) {
    console.log(`TEXT COLLISIONS (${report.collisions.length}):`);
    report.collisions.slice(0, 12).forEach(c => console.log('  ' + c));
  } else console.log('TEXT COLLISIONS: none');
  if (report.clipped.length) {
    console.log(`CLIPPED LABELS (${report.clipped.length}) -- text running off its own viewBox:`);
    report.clipped.slice(0, 12).forEach(c => console.log('  ' + c));
  } else console.log('CLIPPED LABELS: none');
  console.log('NOTE: text-vs-text only. A stroke through a label, or a label hidden behind an');
  console.log('      opaque shape, is INVISIBLE here. Screenshot and use your eyes.');
  await browser.close();
  process.exit(failed.length || report.collisions.length || report.clipped.length || scrollLocked ? 1 : 0);
})();
