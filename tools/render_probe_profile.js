// tools/render_probe_profile.js — Profile panel · Creator's Log boot-merge (Phase 2 L2).
//
// Usage: node tools/render_probe_profile.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the dashboard Creator's Log end-to-end: the rail profile chip opens
// the Profile panel, and the Creator's Log tab renders the CLI-fired entries that
// were inlined at build time (chronicle/creators-log/log.jsonl -> esbuild JSON
// import -> state/log.getEntries() boot-merge). The headless page has EMPTY
// localStorage, so any rendered entries prove the build-time embed surfaces in
// the app (the human truth-verification layer). Mirrors render_probe_knowledge.js.
// Requires puppeteer.

const path = require('path');
const fs = require('fs');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

// Truth anchor: the canonical embed the build inlined.
const embedPath = path.join(REPO, 'dashboard', 'assets', 'data', 'creators-log-embed.json');
const embedCount = JSON.parse(fs.readFileSync(embedPath, 'utf8')).length;

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  // Ensure empty localStorage so rendered entries can ONLY come from the embed.
  await page.evaluate(() => { try { localStorage.removeItem('wallachCreatorsLog_v1'); } catch (e) {} });

  // Panel absent at boot.
  const bootHasPanel = await page.evaluate(() => document.querySelector('.pf-panel') !== null);

  // Click the rail profile chip -> opens the panel.
  await page.evaluate(() => document.querySelector('.rail__profile')?.click());
  await wait(300);

  const opened = await page.evaluate(() => {
    const panel = document.querySelector('.pf-panel');
    const sub = panel?.querySelector('.pf-log__sum')?.textContent ?? '';
    const m = sub.match(/(\d+)\s+entr/);
    return {
      hasPanel: panel !== null,
      logEntries: document.querySelectorAll('.pf-logentry').length,
      subCount: m ? parseInt(m[1], 10) : -1,
      hasRoundClose: [...document.querySelectorAll('.pf-logentry .pf-logentry__pill')]
        .some(e => /ROUND CLOSE/.test(e.textContent || '')),
    };
  });

  // Close with Escape.
  await page.keyboard.press('Escape');
  await wait(200);
  const afterEsc = await page.evaluate(() => document.querySelector('.pf-panel') === null);

  console.log('PROFILE', JSON.stringify({ embedCount, bootHasPanel, opened, afterEsc }));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['no panel at boot', bootHasPanel === false],
    ['rail chip opens panel', opened.hasPanel === true],
    ['embed has entries (build inlined the ledger)', embedCount > 0],
    ['log entries render from embed with empty LS', opened.logEntries > 0],
    ['rendered count matches embed count', opened.logEntries === embedCount],
    ['subheader count matches rendered', opened.subCount === opened.logEntries],
    ['a real round-close entry surfaced', opened.hasRoundClose === true],
    ['Esc closes panel', afterEsc === true],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log(`PASS · Profile Creator's Log boot-merge · ${embedCount} embedded CLI entries surface in-app with empty localStorage`);
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
