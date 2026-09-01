// Group-dots probe: the plant-derived run takes ONE DOT PER NAMING GOAL, and hovering a goal
// isolates its dot. MEASURES boxes + computed opacity — an "element exists" check passes on a
// dot collapsed to a 14x5px sliver with a perfectly correct gradient — and carries NEGATIVE
// CONTROLS: goals Wallach never names the complex for must produce NO dot, and hovering one
// must focus nothing.
const puppeteer = require('puppeteer');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = 'file:///' + path.posix.join(ROOT.replace(/\\/g, '/'), 'dashboard/dashboard.html');

// ★ THE EXPECTATION IS DERIVED, NEVER TYPED — 2026-08-31. This probe used to NAME the goals it
// believed Wallach does and does not name the complex for. The layout moved and the list did
// not, so for weeks all four of its controls asserted the opposite of the truth: `more-energy`
// NAMES the group and was being used as the NEGATIVE CONTROL, and the probe went red for being
// wrong about a perfectly correct app. A probe that hardcodes what it is measuring against
// stops being an instrument the moment the world moves. The layout IS the authority — read it.
const LAYOUT = require(path.join(ROOT, 'dashboard/assets/data/coverage-layout-data.json'));
const names = g => (g.groups || []).includes('plant-derived');
const NAMING = LAYOUT.goals.filter(names).map(g => g.id);
const SILENT = LAYOUT.goals.filter(g => !names(g)).map(g => g.id);

const readDots = () => Array.from(document.querySelectorAll('.essentials-subsection__goaldot')).map(d => {
  const r = d.getBoundingClientRect();
  const cs = getComputedStyle(d);
  return {
    goal: d.getAttribute('data-goal'),
    w: Math.round(r.width), h: Math.round(r.height),
    op: Number(cs.opacity).toFixed(2),
    focus: d.classList.contains('is-focus'),
    bg: cs.backgroundColor,
    sub: d.closest('.essentials-subsection').getAttribute('data-sub'),
  };
});

const enter = async (page, goals) => {
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  await page.type('.wc__name', 'Luneth');
  for (const g of goals) { await page.click(`.wc-goal[data-goal="${g}"]`); }
  await page.click('[data-go]');
  await new Promise(r => setTimeout(r, 700));
};

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files', '--use-angle=swiftshader'] });
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const checks = [];

  // 0. The split itself has to be non-trivial, or every control below is vacuous: a layout
  //    where every goal named the group would make the negative controls unfalsifiable, and one
  //    where none did would make the positive checks unreachable. Asserted, not assumed.
  checks.push([`the layout splits the goals both ways (${NAMING.length} name it, ${SILENT.length} do not)`,
    NAMING.length >= 3 && SILENT.length >= 3]);

  // 1. Three goals that DO name the complex -> three dots, all on plant-derived.
  await enter(page, NAMING.slice(0, 3));
  let d = await page.evaluate(readDots);
  checks.push(['3 naming goals -> 3 dots', d.length === 3]);
  checks.push(['every dot is on the plant-derived run', d.every(x => x.sub === 'plant-derived')]);
  checks.push(['dots are REAL boxes, not collapsed slivers', d.every(x => x.w >= 5 && x.h >= 5)]);
  checks.push(['each dot carries a DISTINCT hue', new Set(d.map(x => x.bg)).size === 3]);
  checks.push(['dots name their goals', new Set(d.map(x => x.goal)).size === 3]);

  // 2. HOVER isolates ONE dot — the whole reason dots beat a gradient bar.
  const HOVERED = NAMING[1];
  await page.hover(`.gchip[data-goal="${HOVERED}"]`);
  await new Promise(r => setTimeout(r, 260));
  d = await page.evaluate(readDots);
  const hov = d.find(x => x.goal === HOVERED);
  const others = d.filter(x => x.goal !== HOVERED);
  checks.push([`hovering ${HOVERED} focuses exactly ONE dot`, d.filter(x => x.focus).length === 1]);
  checks.push([`the focused dot is ${HOVERED}'s`, !!hov && hov.focus === true]);
  checks.push(['the hovered dot stays fully opaque', !!hov && Number(hov.op) === 1]);
  checks.push(['the OTHER dots visibly fade (this is the teach)', others.every(x => Number(x.op) < 0.5)]);

  // 3. NEGATIVE CONTROL — three goals that do NOT name the complex.
  const CONTROL = SILENT.slice(0, 3);
  await page.evaluate(() => localStorage.clear());
  await enter(page, CONTROL);
  d = await page.evaluate(readDots);
  checks.push([`NEGATIVE CONTROL: ${CONTROL.join(' + ')} -> NO dots`, d.length === 0]);

  // 4. MIXED: 2 naming + 2 not -> only the 2 naming get dots.
  const MIX = [NAMING[0], SILENT[0], NAMING[1], SILENT[1]];
  await page.evaluate(() => localStorage.clear());
  await enter(page, MIX);
  d = await page.evaluate(readDots);
  checks.push(['4 goals, only 2 of which name the complex -> exactly 2 dots', d.length === 2]);
  checks.push(['the 2 dots are the naming goals', new Set(d.map(x => x.goal)).size === 2
    && d.every(x => [NAMING[0], NAMING[1]].includes(x.goal))]);

  // 5. NEGATIVE CONTROL on the hover: hovering a NON-naming goal focuses nothing.
  await page.hover(`.gchip[data-goal="${SILENT[0]}"]`);
  await new Promise(r => setTimeout(r, 260));
  d = await page.evaluate(readDots);
  checks.push([`hovering ${SILENT[0]}, which names no complex, focuses NO dot`,
    d.filter(x => x.focus).length === 0]);

  console.log('DOTS ' + JSON.stringify(d));
  console.log('PAGE_ERRORS ' + errs.length);
  let bad = 0;
  for (const [name, ok] of checks) { if (!ok) { bad++; console.log('  FAIL · ' + name); } else { console.log('  ok   · ' + name); } }
  await b.close();
  if (bad || errs.length) { console.log(`FAIL · ${bad} check(s), ${errs.length} page error(s)`); process.exit(1); }
  console.log(`PASS · ${checks.length} checks — one dot per naming goal; hover isolates it`);
})();
