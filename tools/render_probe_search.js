// tools/render_probe_search.js — Ask-Wallach (the centered green popup) end-to-end.
//
// Usage: node tools/render_probe_search.js   (exit 0 = PASS, non-zero = FAIL)
//
// Verifies the CATCH-ALL search (2026-07-23). Every exact match is RICH: an entity resolves across
// the WHOLE Knowledge universe and shows ALL its claims — the enriched Q&A slice FIRST, then the raw
// sealed corpus — grouped into the five browse families (The Science / Cautions / What To Do /
// Wallach's Take / The Story), each capped with a working "See N more <family>" reveal, plus a
// "Keep exploring" row of live related pills. A non-enriched condition ("cancer") is as rich as an
// enriched one; "Learn More" opens the full Knowledge page (condition/essential detail or the topic
// overlay); a plain question still shows a best answer + de-truncated "more answers". Requires puppeteer.

const path = require('path');
const REPO = path.resolve(__dirname, '..');

let pup;
for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
  try { pup = require(c); break; } catch (e) { /* try next */ }
}
if (!pup) { console.log('NO_PUPPETEER (npm i -D puppeteer at repo root)'); process.exit(2); }

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await pup.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  const url = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').split(path.sep).join('/');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('GOTO_ERR', e.message));
  await wait(1500);

  await page.evaluate(() => {
    const veil = document.querySelector('.wc-veil');
    if (!veil) return;
    const btn = [...veil.querySelectorAll('button, a')].find(b => /browsing/i.test(b.textContent || ''));
    if (btn) btn.click();
  });
  await wait(400);

  const SR = '#drawer-search-mount';
  const openSearch = async () => {
    const isOpen = await page.evaluate((s) => document.querySelector(s)?.classList.contains('sr-open'), SR);
    if (!isOpen) { await page.evaluate(() => document.querySelector('.topbar__ask')?.click()); await wait(300); }
  };
  const type = async (val) => {
    await page.evaluate((s) => { const i = document.querySelector(s + ' .aw-search__input'); if (i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); } }, SR);
    await page.evaluate((a) => { const i = document.querySelector(a.s + ' .aw-search__input'); i.value = a.val; i.dispatchEvent(new Event('input', { bubbles: true })); }, { s: SR, val });
    await wait(220);
  };
  const snap = () => page.evaluate((s) => {
    const root = document.querySelector(s);
    const eback = root.querySelector('.eback');
    const groups = [...root.querySelectorAll('.fgroup')].map(g => ({
      family: g.getAttribute('data-family') || '',
      label: (g.querySelector('.fgroup__label')?.textContent || '').trim(),
      count: parseInt(g.querySelector('.fgroup__ct')?.textContent || '0', 10),
      rows: g.querySelectorAll('.arow').length,
      hidden: g.querySelectorAll('.arow--hidden').length,
      more: (g.querySelector('.fgroup__more')?.textContent || '').trim(),
      firstRowHasPrev: (g.querySelector('.arow .arow__prev')?.textContent || '').length > 0,
    }));
    return {
      heroName: (root.querySelector('.ehero__name')?.textContent || '').trim(),
      heroMeta: (root.querySelector('.ehero__meta')?.textContent || '').trim(),
      learnKind: eback ? (eback.getAttribute('data-aw-kind') || '') : '',
      groupCount: groups.length,
      totalRows: groups.reduce((n, g) => n + g.rows, 0),
      groups,
      heroClickable: root.querySelector('.ehero[data-aw-learnmore]') !== null,
      keepExploring: root.querySelector('.exrow') !== null,
      exClickable: root.querySelectorAll('.exrow button.relpill').length,
      bestAns: root.querySelector('.ans') !== null,
      scrMore: root.querySelector('.scr-more') !== null,
      moreBtnText: (root.querySelector('.scr-more .fgroup__more')?.textContent || '').trim(),
    };
  }, SR);

  await openSearch();
  const searchOpen = await page.evaluate((s) => document.querySelector(s)?.classList.contains('sr-open'), SR);
  const opening = await page.evaluate((s) => document.querySelectorAll(s + ' .kcard').length, SR);

  await type('cancer');   const cancer = await snap();
  await type('mercury');  const mercury = await snap();
  await type('calcium');  const calcium = await snap();
  await type('deficiency'); const ask = await snap();

  // Intent: a question that MENTIONS an entity routes to that entity's page when no claim is primarily
  // about it (kills "what causes cancer" -> a tangential gold claim).
  await type('what causes cancer'); const intentCancer = await snap();
  // Charged gate: a non-charged query must NEVER surface a homosexuality/intersex claim.
  await type('testosterone');
  const charged = await page.evaluate((s) => {
    const t = (document.querySelector(s + ' .scr-body')?.textContent || '').toLowerCase();
    return { hasCharged: /homosexual|intersex|gay gene/.test(t) };
  }, SR);
  // Explicit charged search still opens its page.
  await type('homosexuality'); const chargedExplicit = await snap();

  // "See N more" in the ask "more answers" reveals + retires. (Re-type: the intent/charged probes
  // above changed the query, so restore the ask view first.)
  await type('deficiency');
  await page.evaluate((s) => document.querySelector(s + ' .scr-more .fgroup__more')?.click(), SR);
  await wait(150);
  const askReveal = await page.evaluate((s) => {
    const w = document.querySelector(s + ' .scr-more');
    return { hidden: w ? w.querySelectorAll('.arow--hidden').length : -1, btn: w ? w.querySelector('.fgroup__more') !== null : true };
  }, SR);

  // "See N more" in a topic family group reveals + retires.
  await type('cancer');
  await page.evaluate((s) => document.querySelector(s + ' .fgroup__more')?.click(), SR);
  await wait(150);
  const groupReveal = await page.evaluate((s) => {
    const g = document.querySelector(s + ' .fgroup');
    return { hidden: g.querySelectorAll('.arow--hidden').length, btn: g.querySelector('.fgroup__more') !== null };
  }, SR);

  // Learn More (condition) → Knowledge Cancer page; single-drawer swap.
  await openSearch(); await type('cancer');
  await page.evaluate((s) => document.querySelector(s + ' .eback')?.click(), SR);
  await wait(400);
  const learnCancer = await page.evaluate((s) => {
    const k = document.getElementById('drawer-knowledge-mount');
    return {
      knowledgeOpen: k ? k.classList.contains('kd-open') : false,
      searchClosed: !(document.querySelector(s)?.classList.contains('sr-open')),
      condName: k ? (k.querySelector('.kd-ep--cond .kd-ep-hero__name')?.textContent || '').trim() : '',
    };
  }, SR);

  // Learn More (topic) → Explore topic overlay.
  await openSearch(); await type('mercury');
  await page.evaluate((s) => document.querySelector(s + ' .eback')?.click(), SR);
  await wait(400);
  const learnMercury = await page.evaluate(() => {
    const k = document.getElementById('drawer-knowledge-mount');
    return { topicTitle: k ? (k.querySelector('.kt-page .kt-title h1')?.textContent || '').trim() : '' };
  });

  const famLabels = g => g.groups.map(x => x.label);
  const out = { searchOpen, opening, cancer, mercury, calcium, ask, askReveal, groupReveal, learnCancer, learnMercury };
  console.log('SEARCH', JSON.stringify(out));
  console.log('PAGE_ERRORS', errs.length, errs.slice(0, 5).join(' | '));

  const checks = [
    ['popup opens', searchOpen === true],
    ['opening screen: 5 facet-family cards', opening === 5],
    // ── the CATCH-ALL: a non-enriched condition is RICH, not a hero + link ──
    ['cancer resolves to its entity page (hero)', cancer.heroName === 'Cancer'],
    ['cancer is RICH: >=3 family groups (not a bare hero)', cancer.groupCount >= 3],
    ['cancer shows ALL its claims: total answer count in hero (65)', /\b65 answers\b/.test(cancer.heroMeta)],
    ['cancer families are the browse families (The Science / Cautions / What To Do)', ['The Science', 'Cautions', 'What To Do'].every(l => famLabels(cancer).includes(l))],
    ['cancer renders real claim rows across groups (>=9 shown)', cancer.totalRows >= 9],
    ['cancer: every big group ends in a "See N more <family>" reveal', cancer.groups.filter(g => g.count > 3).every(g => /See \d+ more \w/.test(g.more) && g.hidden > 0)],
    ['cancer: Learn More opens its condition page', cancer.learnKind === 'condition'],
    ['cancer: keep-exploring row with live related pills', cancer.keepExploring === true && cancer.exClickable >= 1],
    ['cancer: the whole hero is a clickable Learn-More target', cancer.heroClickable === true],
    // ── intent + the charged-topic safety gate ──
    ['intent: "what causes cancer" routes to the Cancer page (not a tangential claim)', intentCancer.heroName === 'Cancer'],
    ['charged gate: "testosterone" never surfaces a homosexuality/intersex claim', charged.hasCharged === false],
    ['charged: an EXPLICIT search still opens its page (homosexuality)', /homosex/i.test(chargedExplicit.heroName)],
    // ── enriched entity: same family layout, topic Learn More ──
    ['mercury is grouped into families with rows', mercury.groupCount >= 3 && mercury.totalRows >= 5],
    ['mercury: Learn More opens its Explore topic', mercury.learnKind === 'topic'],
    // ── best-first: an essential leads each family with its enriched Q&A ──
    ['calcium shows its full claim set (134) not just the enriched slice', /\b134 answers\b/.test(calcium.heroMeta)],
    ['calcium: the first family leads with an enriched Q&A (a preview line)', calcium.groups.length > 0 && calcium.groups[0].firstRowHasPrev === true],
    ['topic "See N more" reveals the hidden rows and retires', groupReveal.hidden === 0 && groupReveal.btn === false],
    // ── the ask flow (a plain question) still de-truncates ──
    ['ask: a plain question shows a best answer + de-truncated "more answers"', ask.bestAns === true && ask.scrMore === true && /See \d+ more/.test(ask.moreBtnText)],
    ['ask "See N more" reveals + retires', askReveal.hidden === 0 && askReveal.btn === false],
    // ── cross-nav ──
    ['Learn More (condition): single-drawer swap → Knowledge Cancer page', learnCancer.knowledgeOpen === true && learnCancer.searchClosed === true && learnCancer.condName === 'Cancer'],
    ['Learn More (topic): opens the Mercury topic overlay', learnMercury.topicTitle === 'Mercury'],
    ['no page errors', errs.length === 0],
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  await browser.close();
  if (failed.length) { console.log('FAIL', JSON.stringify(failed)); process.exit(1); }
  console.log('PASS · Ask-Wallach catch-all · every exact match rich (all claims, categorized, Q&A-first, See-N-more) · keep-exploring · Learn-More cross-nav · de-truncated ask');
})().catch(e => { console.log('PROBE_ERR', e.message); process.exit(1); });
