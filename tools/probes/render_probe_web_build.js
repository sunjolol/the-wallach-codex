// tools/probes/render_probe_web_build.js — DRIVE the website build before it is uploaded.
//
// Usage: PYTHONUTF8=1 python tools/build_web.py && node tools/probes/render_probe_web_build.js
//
// ★ WHY THIS EXISTS. On 2026-08-22 the live site served a superseded corpus: the page read
// "2,611 sourced claims" where the build reads 2,601, with NO error anywhere — a fresh bundle
// reading yesterday's data. Every header said the deploy was perfect; `curl` and the page's own
// fetch() of ONE url returned DIFFERENT BYTES. Content-hashing the split artifacts fixed the
// cause, but nothing has ever DRIVEN the web build, so a regression in it is invisible on
// file:// (nothing is fetched) and silent on the web (it just serves the wrong thing).
//
// THE METHOD IS A COMPARISON, NOT AN ASSERTION ABOUT A NUMBER. The same figure is read off the
// rendered page in BOTH distributions — file:// (where the corpus is inlined at build time) and
// http (where it is fetched) — and required to agree. There is no literal here to go stale, and
// a build that hydrates from the wrong artifact cannot agree with the one that inlines it.
//
// It also walks the surfaces that only the web build can break: anything the bundle STUBS OUT
// and fetches. Serves dist-web over a real http server on 127.0.0.1 — file:// would not
// exercise the fetch path at all, which is the entire point.

const path = require('path');
const fs = require('fs');
const http = require('http');
const REPO = path.resolve(__dirname, '..', '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER'); process.exit(2); }

const ROOT = path.join(REPO, 'dist-web');
if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.log('NO_DIST_WEB — run `PYTHONUTF8=1 python tools/build_web.py` first');
  process.exit(2);
}

// PORT 0 = let the OS pick a free one. A fixed port makes the probe fail with EADDRINUSE
// the moment anything else on the machine holds it — including its own previous run still
// in TIME_WAIT — which reads as a broken build rather than a busy socket.
const KD = '#drawer-knowledge-mount';
const wait = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
const check = (label, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `  ${detail}`}`);
  if (!cond) { fails.push(label); }
};

// Enough of a static server to exercise the fetch path. NOT a model of the real host: the
// production cache contract lives in .htaccess and is verified against the live domain.
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
  '.gz': 'application/octet-stream',
};
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') { rel = '/index.html'; }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

/** The corpus counts as the DRAWER renders them — the exact figure the incident got wrong. */
async function readCorpusCounts(page) {
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(700);
  const out = await page.evaluate(() => {
    const p = document.querySelector('#drawer-knowledge-mount .sh-hero p');
    const m = (p ? p.textContent : '').match(/([\d,]+) sourced claims from (\d+)/);
    return m ? { claims: m[1], books: m[2] } : null;
  });
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(300);
  return out;
}

async function boot(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  const errors = [];
  const responses = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => responses.push({ url: r.url(), status: r.status() }));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await wait(1400);
  await page.evaluate(() => {
    const b = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (b) { b.click(); }
  });
  await wait(500);
  return { page, errors, responses };
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const PORT = server.address().port;
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  console.log('\n── the FILE build (the truth anchor: its corpus is inlined) ──');
  const local = await boot(browser, 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/'));
  const localCounts = await readCorpusCounts(local.page);
  check('the file build renders its corpus counts', localCounts !== null, JSON.stringify(localCounts));
  await local.page.close();

  console.log('\n── the WEB build, over real http ──');
  const web = await boot(browser, `http://127.0.0.1:${PORT}/`);
  const bad = web.responses.filter(r => r.status >= 400);
  check('no response 4xx/5xx', bad.length === 0, JSON.stringify(bad.slice(0, 4)));
  check('no page errors', web.errors.length === 0, JSON.stringify(web.errors.slice(0, 3)));

  const webCounts = await readCorpusCounts(web.page);
  check('the web build hydrated at all', webCounts !== null, JSON.stringify(webCounts));
  // ★ THE COMPARISON. One build inlines the corpus, the other fetches it; disagreement means the
  // fetched artifact is not the built one, which is precisely the 2026-08-22 incident.
  check('BOTH distributions render the SAME corpus counts',
    localCounts !== null && webCounts !== null
    && localCounts.claims === webCounts.claims && localCounts.books === webCounts.books,
    `file ${JSON.stringify(localCounts)} vs web ${JSON.stringify(webCounts)}`);

  // Nothing may be requested from an UN-hashed artifact path: a fixed name is a name a cache
  // can serve a stale copy of, and that is the whole reason these three carry a digest.
  const artifactHits = web.responses.filter(r => /\/assets\/data\/.*\.json$/.test(r.url));
  const unhashed = artifactHits.filter(r => !/\.[0-9a-f]{8,}\.json$/.test(r.url));
  check('every fetched data artifact is content-hashed',
    artifactHits.length > 0 && unhashed.length === 0,
    `${artifactHits.length} fetched, ${unhashed.length} un-hashed`);

  console.log('\n── the surfaces, on the web build ──');
  await web.page.evaluate(() => window.dispatchEvent(new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } })));
  await wait(900);
  const reg = await web.page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')].filter(b => b.getBoundingClientRect().height > 0)[0];
    if (!block) { return null; }
    const nav = block.querySelector('.fs-pager');
    return {
      shape: nav ? [...nav.children].map(c => (c.textContent || '').trim()).join(' ') : null,
      hasFilter: !!block.querySelector('.fs-filter'),
      cats: block.querySelectorAll('[data-food-cat] option').length,
      tiles: block.querySelectorAll('.fs-tile').length,
    };
  });
  check('the Regimen foods block renders with its pager and filter',
    reg !== null && /^‹ 1 2 3 4 5 … \d+ ›$/.test(reg.shape) && reg.hasFilter && reg.tiles === 3,
    reg && `${reg.shape} · ${reg.cats} categories · ${reg.tiles} tiles`);

  await web.page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(600);
  await web.page.evaluate(k => document.querySelector(k + ' [data-kd-tab="products"]')?.click(), KD);
  await wait(600);
  const cat = await web.page.evaluate((k) => {
    const head = document.querySelector(k + ' .kd-section-head');
    return {
      head: head ? head.textContent.trim() : null,
      products: document.querySelectorAll(k + ' .kd-product-row[data-kd-product]').length,
      foods: document.querySelectorAll(k + ' .kd-product-row--food').length,
      kinds: document.querySelectorAll(k + ' .kd-catfilter__b').length,
    };
  }, KD);
  check('the mixed catalog renders both kinds', cat.products > 200 && cat.foods > 150 && cat.kinds === 3,
    `${cat.products} products, ${cat.foods} foods`);
  const m = (cat.head || '').match(/ALL (\d+) PRODUCTS \+ (\d+) FOODS/);
  check('its head agrees with the grid',
    m !== null && Number(m[1]) === cat.products && Number(m[2]) === cat.foods, cat.head);

  await web.page.evaluate(k => document.querySelector(k + ' .kd-product-row--food')?.click(), KD);
  await wait(600);
  const sheet = await web.page.evaluate((k) => {
    const d = document.querySelector(k + ' .kd-ep--food');
    if (!d) { return null; }
    const add = d.querySelector('[data-add-food]');
    return {
      name: (d.querySelector('.kd-ep-hero__name') || {}).textContent || '',
      rows: d.querySelectorAll('.kd-pf-nrow').length,
      heads: [...d.querySelectorAll('.kd-pf-nhead span')].map(s => s.textContent.trim()),
      addBg: add ? getComputedStyle(add).backgroundColor : null,
      addFont: add ? getComputedStyle(add).fontFamily : null,
    };
  }, KD);
  check('a food nutrient sheet opens', sheet !== null && sheet.rows > 0,
    sheet && `${sheet.name}, ${sheet.rows} rows`);
  check('its label column is Wallach\'s target', sheet !== null && sheet.heads[2] === '% of target',
    sheet && JSON.stringify(sheet.heads));
  // The web build rewrites and hashes every stylesheet; a rule lost in that pass would show up
  // here as a control falling back to the browser default, exactly as it did on file://.
  check('its Add button kept its styling through the CSS rewrite',
    sheet !== null && sheet.addBg !== null
    && !/rgba\(0, 0, 0, 0\)/.test(sheet.addBg) && /Chakra/.test(sheet.addFont || ''),
    sheet && `${sheet.addBg} / ${(sheet.addFont || '').split(',')[0]}`);

  const shot = path.join(process.env.FOODS_SHOT_DIR || path.join(REPO, 'temporary'), 'web-build.png');
  fs.mkdirSync(path.dirname(shot), { recursive: true });
  await web.page.screenshot({ path: shot });
  console.log('\nscreenshot:', shot);
  console.log(`\n${fails.length === 0 ? 'RESULT: PASS (now look at the screenshot)' : 'RESULT: FAIL — ' + fails.join(' | ')}`);

  await browser.close();
  server.close();
  process.exit(fails.length === 0 ? 0 : 1);
})();
