#!/usr/bin/env node
// dashboard_smoke.js — render-time smoke test for dashboard.html.
// Adds runtime invariants on top of the static integrity checks: actually
// loads the dashboard in a headless browser, verifies the critical structural
// elements render, and captures JS console errors.
//
// USAGE
//   node tools/dashboard_smoke.js              # exits 0 on pass, 1 on any failure
//   node tools/dashboard_smoke.js --verbose    # show all checks even on pass
//
// EXIT CODES
//   0  all checks pass
//   1  one or more checks fail (real failure)
//   2  puppeteer (or playwright) not installed — skipped with explanation
//   3  unexpected error inside the smoke test itself
//
// INSTALL (user-side, one-time)
//   npm install --save-dev puppeteer
// or
//   npm install --save-dev playwright   (then update the require() line below)
//
// The integrity tool's check_smoke_test treats exit 2 as a non-failing skip
// (with informational note) so unconfigured environments don't break CI.
// Once installed, the check becomes a runtime invariant per doctrine §6.

'use strict';

const path = require('path');
const fs = require('fs');

const DASH_PATH = path.resolve(__dirname, '..', 'dashboard', 'dashboard.html');
const VERBOSE = process.argv.includes('--verbose');

// Critical selectors — every one must be present in the rendered DOM.
// Source: dashboard structural contract documented in dashboard/README.md.
const CRITICAL_SELECTORS = [
  { selector: 'header', label: 'Header element' },
  { selector: '.menu-stack', label: 'Top-tab menu stack' },
  { selector: '[data-group="you"]', label: 'You tab group' },
  { selector: '[data-group="journey"]', label: 'Journey tab group' },
  { selector: '[data-group="knowledge"]', label: 'Knowledge tab group' },
  { selector: '[data-group="regimen"]', label: 'Regimen feature tab' },
  { selector: '[data-group="labels"]', label: 'Label-check feature tab' },
  { selector: '#essentials-grid-host', label: 'Essentials periodic-table grid host' },
  { selector: '#cl-enter-btn', label: "Creator's Log entry button" },
  { selector: '#citation-popup', label: 'Citation popup container (P3.6)' },
  { selector: '#rg-export-btn', label: 'Data export button (P4.10)' },
  { selector: 'script[id="versions-data"]', label: 'Versions data block' },
  { selector: 'script[id="essentials-targets-data"]', label: 'Essentials targets data block' },
];

// Behaviors — runtime UX flows that must succeed. Each runs in a fresh state
// (the test reloads the page between behaviors so state from one doesn't
// pollute another). Doctrine §6 extended from "selector exists" to
// "interaction produces expected post-state."
const BEHAVIORS = [
  {
    name: 'Essential tile click opens detail panel',
    run: async (page) => {
      // Find ANY tile, click it, assert detail panel un-hides + has the right essential name
      const tile = await page.$('.essential-tile[data-name]');
      if (!tile) throw new Error('No essential tile with data-name found in the grid');
      const name = await page.evaluate((el) => el.getAttribute('data-name'), tile);
      await tile.click();
      await new Promise((r) => setTimeout(r, 300));
      const result = await page.evaluate(() => {
        const panel = document.getElementById('essential-detail');
        return {
          exists: !!panel,
          hidden: panel ? panel.hidden : true,
          essentialName: panel ? panel.dataset.essentialName : null,
        };
      });
      if (!result.exists) throw new Error('Detail panel #essential-detail does not exist');
      if (result.hidden) throw new Error('Detail panel is still hidden after tile click');
      if (result.essentialName !== name) {
        throw new Error('Detail panel data-essential-name=' + result.essentialName + ' does not match clicked tile name=' + name);
      }
    },
  },
  {
    name: 'Benefit pill click opens citation popup',
    run: async (page) => {
      // Open detail first
      const tile = await page.$('.essential-tile[data-name]');
      if (!tile) throw new Error('No tile to seed the test');
      await tile.click();
      await new Promise((r) => setTimeout(r, 300));
      // Then click a Wallach benefit pill
      const pill = await page.$('.benefit-pill.wallach-benefit');
      if (!pill) throw new Error('No .benefit-pill.wallach-benefit visible after opening detail panel');
      await pill.click();
      await new Promise((r) => setTimeout(r, 300));
      const isOpen = await page.evaluate(() => {
        const popup = document.getElementById('citation-popup');
        return popup && popup.classList.contains('open');
      });
      if (!isOpen) throw new Error('Citation popup did not get .open class after benefit-pill click');
    },
  },
  {
    name: 'ESC key closes citation popup',
    run: async (page) => {
      // Seed: open detail + open popup
      const tile = await page.$('.essential-tile[data-name]');
      await tile.click();
      await new Promise((r) => setTimeout(r, 200));
      const pill = await page.$('.benefit-pill.wallach-benefit');
      await pill.click();
      await new Promise((r) => setTimeout(r, 200));
      // Press ESC
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 200));
      const stillOpen = await page.evaluate(() => {
        const popup = document.getElementById('citation-popup');
        return popup && popup.classList.contains('open');
      });
      if (stillOpen) throw new Error('Citation popup did not close on ESC key');
    },
  },
  {
    name: 'buildDataExport() produces a well-formed bundle',
    run: async (page) => {
      const bundle = await page.evaluate(() => {
        if (typeof window.buildDataExport !== 'function') return null;
        return window.buildDataExport();
      });
      if (!bundle) throw new Error('window.buildDataExport is not exposed');
      if (!bundle._export || bundle._export.format !== 'wallach-dashboard-export-v1') {
        throw new Error('Export bundle missing or wrong format: ' + JSON.stringify(bundle._export));
      }
      if (!bundle.keys || typeof bundle.keys !== 'object') {
        throw new Error('Export bundle missing keys block');
      }
      const expectedKeys = ['lcRegimen_v1', 'lcWishlist_v1', 'rgOverrides_v1', 'dashboardBg'];
      for (const k of expectedKeys) {
        if (!(k in bundle.keys)) {
          throw new Error('Export bundle missing expected key: ' + k);
        }
      }
    },
  },
  {
    name: 'lsWrite then lsRead roundtrips data through the framework',
    run: async (page) => {
      const result = await page.evaluate(() => {
        if (typeof window.lsRead !== 'function' || typeof window.lsWrite !== 'function') {
          return { ok: false, why: 'lsRead/lsWrite not exposed on window' };
        }
        // Use a real-shape probe so even if cleanup fails the next behavior
        // doesn't crash on .items being undefined.
        const probe = { items: [], _smokeProbe: 'smoke-' + Date.now() };
        const writeOk = window.lsWrite('lcRegimen_v1', probe);
        if (!writeOk) return { ok: false, why: 'lsWrite returned false' };
        const readBack = window.lsRead('lcRegimen_v1', null);
        if (!readBack || readBack._smokeProbe !== probe._smokeProbe) {
          return { ok: false, why: 'roundtrip mismatch', readBack };
        }
        // Test unregistered-key warning path
        const unregistered = window.lsRead('totally-not-registered', 'fallback');
        if (unregistered !== 'fallback') {
          return { ok: false, why: 'unregistered key did not return defaultValue' };
        }
        // Clean up the probe so the next behavior runs against fresh state
        try { window.lsRemove('lcRegimen_v1'); } catch (_) {}
        return { ok: true };
      });
      if (!result.ok) throw new Error('LS roundtrip failed: ' + result.why);
    },
  },
  {
    name: 'Top-tab click switches active panel',
    run: async (page) => {
      // Click Journey tab; assert journey panel becomes active + you panel deactivates
      await page.click('.tab-btn.slab-btn[data-group="journey"]');
      await new Promise((r) => setTimeout(r, 250));
      const r1 = await page.evaluate(() => {
        const journey = document.querySelector('.tab-panel[data-group="journey"]');
        const you = document.querySelector('.tab-panel[data-group="you"]');
        return {
          journeyActive: journey && journey.classList.contains('active'),
          youActive: you && you.classList.contains('active'),
        };
      });
      if (!r1.journeyActive) throw new Error('Journey tab click did not activate the journey panel');
      if (r1.youActive) throw new Error('You panel still active after switching to journey');
      // Click back to You
      await page.click('.tab-btn.slab-btn[data-group="you"]');
      await new Promise((r) => setTimeout(r, 250));
      const r2 = await page.evaluate(() => {
        const you = document.querySelector('.tab-panel[data-group="you"]');
        return { youActive: you && you.classList.contains('active') };
      });
      if (!r2.youActive) throw new Error('You tab click did not re-activate the you panel');
    },
  },
  {
    name: 'Regimen add-form opens on +Add click',
    run: async (page) => {
      // Switch to Regimen tab first
      await page.click('.tab-btn.slab-btn[data-group="regimen"]');
      await new Promise((r) => setTimeout(r, 200));
      // Verify the add form starts hidden
      const startHidden = await page.evaluate(() => {
        const form = document.getElementById('rg-add-form');
        return form && form.hasAttribute('hidden');
      });
      if (!startHidden) throw new Error('Regimen add-form should start hidden but is not');
      // Click +Add by hand
      await page.click('#rg-add-btn');
      await new Promise((r) => setTimeout(r, 250));
      const nowVisible = await page.evaluate(() => {
        const form = document.getElementById('rg-add-form');
        return form && !form.hasAttribute('hidden');
      });
      if (!nowVisible) throw new Error('Regimen add-form did not un-hide after +Add click');
      // Verify the name input is focusable
      const inputExists = await page.$('#rg-new-name');
      if (!inputExists) throw new Error('rg-new-name input missing in add-form');
    },
  },
  {
    name: 'Essentials search input filters the periodic-table grid',
    run: async (page) => {
      // Count tiles before
      const beforeCount = await page.evaluate(() => {
        return document.querySelectorAll('.essential-tile[data-name]').length;
      });
      if (beforeCount < 50) throw new Error('Expected ~92 tiles, got ' + beforeCount);
      // Type a specific search term
      await page.focus('#gap-search');
      await page.keyboard.type('zinc');
      await new Promise((r) => setTimeout(r, 350));
      // After typing, expect some tiles to be hidden / search to take effect.
      // The filter may either hide tiles (display:none) or class-mark them; we
      // assert the visible count dropped meaningfully.
      const afterCount = await page.evaluate(() => {
        const tiles = Array.from(document.querySelectorAll('.essential-tile[data-name]'));
        const visible = tiles.filter((t) => {
          const cs = window.getComputedStyle(t);
          return cs.display !== 'none' && cs.visibility !== 'hidden' && !t.hasAttribute('hidden');
        });
        return visible.length;
      });
      if (afterCount >= beforeCount) {
        throw new Error('Search did not reduce visible tile count (before=' + beforeCount + ', after=' + afterCount + ')');
      }
      if (afterCount === 0) {
        throw new Error('Search hid ALL tiles for query "zinc" — Zinc should match itself');
      }
    },
  },
  {
    name: 'Pass F roundtrip — export → clear → import restores state',
    run: async (page) => {
      const result = await page.evaluate(() => {
        if (typeof window.buildDataExport !== 'function'
            || typeof window.parseImportBundle !== 'function'
            || typeof window.applyImportBundle !== 'function'
            || typeof window.lsRead !== 'function'
            || typeof window.lsWrite !== 'function'
            || typeof window.lsRemove !== 'function') {
          return { ok: false, why: 'Pass F functions not exposed on window' };
        }
        // Seed unique probe data
        const probeMark = 'passf-roundtrip-' + Date.now();
        const probeReg = { items: [{ id: probeMark, name: 'Probe item', kind: 'supplement' }] };
        const probeWl  = [{ id: probeMark, name: 'Probe wishlist' }];
        window.lsWrite('lcRegimen_v1', probeReg);
        window.lsWrite('lcWishlist_v1', probeWl);

        // Export current state
        const bundle = window.buildDataExport();
        if (!bundle || !bundle._export || bundle._export.format !== 'wallach-dashboard-export-v1') {
          return { ok: false, why: 'buildDataExport returned bad bundle' };
        }

        // Clear localStorage keys (simulate fresh-install or wipe)
        window.lsRemove('lcRegimen_v1');
        window.lsRemove('lcWishlist_v1');
        const reg1 = window.lsRead('lcRegimen_v1', null);
        const wl1  = window.lsRead('lcWishlist_v1', null);
        if (reg1 !== null || wl1 !== null) {
          return { ok: false, why: 'lsRemove did not clear keys', reg1, wl1 };
        }

        // Re-parse the bundle (round-trip via JSON serialization to exercise parseImportBundle)
        let reparsed;
        try {
          reparsed = window.parseImportBundle(JSON.stringify(bundle));
        } catch (e) {
          return { ok: false, why: 'parseImportBundle threw: ' + e.message };
        }
        if (!reparsed.keys) return { ok: false, why: 'reparsed bundle missing keys' };

        // Apply bundle with replace strategy
        const applyResult = window.applyImportBundle(reparsed, 'replace');
        if (!applyResult || applyResult.ok < 1) {
          return { ok: false, why: 'applyImportBundle wrote nothing', applyResult };
        }

        // Verify probe data is restored byte-equal
        const reg2 = window.lsRead('lcRegimen_v1', null);
        const wl2  = window.lsRead('lcWishlist_v1', null);
        if (!reg2 || !Array.isArray(reg2.items) || reg2.items.length !== 1 || reg2.items[0].id !== probeMark) {
          return { ok: false, why: 'lcRegimen_v1 did not round-trip', reg2 };
        }
        if (!Array.isArray(wl2) || wl2.length !== 1 || wl2[0].id !== probeMark) {
          return { ok: false, why: 'lcWishlist_v1 did not round-trip', wl2 };
        }

        // Cleanup
        try { window.lsRemove('lcRegimen_v1'); window.lsRemove('lcWishlist_v1'); } catch (_) {}
        return { ok: true };
      });
      if (!result.ok) throw new Error('Pass F roundtrip failed: ' + result.why);
    },
  },
  {
    name: 'Pass F slot persistence — save then load restores via slot meta',
    run: async (page) => {
      const result = await page.evaluate(() => {
        if (typeof window.saveCurrentToSlot !== 'function'
            || typeof window.loadFromSlot !== 'function'
            || typeof window.readSlotMeta !== 'function'
            || typeof window.deleteSlot !== 'function') {
          return { ok: false, why: 'Slot functions not exposed' };
        }
        const probeMark = 'passf-slot-' + Date.now();
        const probeReg = { items: [{ id: probeMark, name: 'Slot probe', kind: 'supplement' }] };
        window.lsWrite('lcRegimen_v1', probeReg);

        // Save current state to slot 3 (using 3 so we don't disturb the user's typical 1/2 slots)
        window.saveCurrentToSlot(3, 'Smoke probe slot');
        const meta1 = window.readSlotMeta();
        if (!meta1.slot3 || meta1.slot3.label !== 'Smoke probe slot' || meta1.currentSlot !== 3) {
          return { ok: false, why: 'saveCurrentToSlot did not update meta', meta1 };
        }

        // Mutate the live state
        window.lsWrite('lcRegimen_v1', { items: [] });

        // Load slot 3 — should restore probe
        window.loadFromSlot(3);
        const reg = window.lsRead('lcRegimen_v1', null);
        if (!reg || !Array.isArray(reg.items) || reg.items.length !== 1 || reg.items[0].id !== probeMark) {
          return { ok: false, why: 'loadFromSlot did not restore probe', reg };
        }

        // Cleanup
        try { window.deleteSlot(3); window.lsRemove('lcRegimen_v1'); } catch (_) {}
        return { ok: true };
      });
      if (!result.ok) throw new Error('Slot persistence failed: ' + result.why);
    },
  },
];

// Tolerated console messages — pattern matches that don't count as failures.
// Add to this list when a known-benign console.warn/info should be excluded.
const TOLERATED_PATTERNS = [
  /^\[ls\]/i,           // Framework warns for unregistered keys are intentional UX
];

async function main() {
  // Try puppeteer first; fall back to playwright.
  let launcher = null;
  let puppeteerName = null;
  try {
    launcher = require('puppeteer');
    puppeteerName = 'puppeteer';
  } catch (e1) {
    try {
      launcher = require('playwright').chromium;
      puppeteerName = 'playwright';
    } catch (e2) {
      console.log(JSON.stringify({
        status: 'skip',
        reason: 'neither puppeteer nor playwright is installed in node_modules',
        install: 'npm install --save-dev puppeteer  (or playwright)',
      }));
      process.exit(2);
    }
  }

  if (!fs.existsSync(DASH_PATH)) {
    console.error('ERROR: dashboard.html not found at', DASH_PATH);
    process.exit(3);
  }

  let browser, page;
  try {
    if (puppeteerName === 'puppeteer') {
      browser = await launcher.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      page = await browser.newPage();
    } else {
      browser = await launcher.launch({ headless: true });
      const context = await browser.newContext();
      page = await context.newPage();
    }

    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      const t = msg.type();
      if (t === 'error' || t === 'warning') {
        const text = msg.text();
        if (!TOLERATED_PATTERNS.some((p) => p.test(text))) {
          consoleErrors.push({ type: t, text });
        }
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(String(err && err.stack || err));
    });

    // file:// URL for the local dashboard
    const fileUrl = 'file://' + DASH_PATH.split(path.sep).join('/');
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Settle: wait for initial render to complete
    await new Promise((r) => setTimeout(r, 500));

    // Check critical selectors
    const missing = [];
    const found = [];
    for (const item of CRITICAL_SELECTORS) {
      const handle = await page.$(item.selector);
      if (handle) found.push(item.label);
      else missing.push(`${item.label} (selector: ${item.selector})`);
    }

    // Check behaviors — each runs against a freshly-reloaded page to avoid
    // state pollution. A failure in one behavior is captured but doesn't stop
    // the others from running (we want the full failure picture, not just
    // first-fail).
    const behaviorResults = { passed: 0, failed: [] };
    for (const b of BEHAVIORS) {
      try {
        // Fresh page reload + LS clear between behaviors. The reload alone
        // is not enough because puppeteer persists localStorage across
        // page.goto() within the same browser context. Without the clear,
        // probes written by one behavior pollute the next.
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.evaluate(() => {
          try { localStorage.clear(); } catch (_) {}
        });
        // Reload again so the dashboard re-inits with cleared storage
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
        await new Promise((r) => setTimeout(r, 400));
        await b.run(page);
        behaviorResults.passed += 1;
      } catch (e) {
        behaviorResults.failed.push({
          name: b.name,
          error: (e && e.message) || String(e),
        });
      }
    }

    await browser.close();

    const allPass = (
      missing.length === 0 &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0 &&
      behaviorResults.failed.length === 0
    );
    const report = {
      status: allPass ? 'pass' : 'fail',
      driver: puppeteerName,
      checks: {
        critical_selectors: { total: CRITICAL_SELECTORS.length, found: found.length, missing },
        behaviors: {
          total: BEHAVIORS.length,
          passed: behaviorResults.passed,
          failed: behaviorResults.failed,
        },
        console_errors: consoleErrors,
        page_errors: pageErrors,
      },
    };

    if (report.status === 'pass') {
      console.log(JSON.stringify({
        status: 'pass',
        driver: puppeteerName,
        summary: `${found.length}/${CRITICAL_SELECTORS.length} selectors, ${behaviorResults.passed}/${BEHAVIORS.length} behaviors, 0 console errors, 0 page errors`,
      }));
      if (VERBOSE) console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    } else {
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
  } catch (err) {
    if (browser) { try { await browser.close(); } catch (_) {} }
    const errStr = String(err && (err.message || err.stack) || err);
    // Graceful skip when the chromium binary isn't installed (distinct from
    // "puppeteer driver not installed" — same operational outcome, smoke test
    // cannot run). Treat as exit 2 so the integrity tool's check_smoke_test
    // reports "skipped" instead of "failed".
    if (/Could not find Chrome|Failed to launch the browser process|browsers? install/i.test(errStr)) {
      console.log(JSON.stringify({
        status: 'skip',
        reason: 'puppeteer is installed but chromium binary is missing (cache not provisioned in this environment)',
        install: 'npx puppeteer browsers install chrome',
      }));
      process.exit(2);
    }
    console.error('ERROR inside smoke test:', err && err.stack || err);
    process.exit(3);
  }
}

main();
