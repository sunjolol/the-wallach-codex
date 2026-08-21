#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// vendor-tesseract.js — one-shot downloader for Tesseract.js + lang data
// ═══════════════════════════════════════════════════════════════════════════
// USAGE:    node tools/vendor-tesseract.js
//
// PURPOSE:  Honors the dashboard's offline-portability promise by pulling the
//           OCR engine + English language model to local files. After this
//           runs, the Scanner workspace can scan labels with zero internet
//           dependency — works offline, works from file:// origin where
//           browsers normally block https script loads.
//
// DOWNLOADS (~22MB total):
//   - tesseract.min.js                  (main library, ~65KB)
//   - worker.min.js                     (web worker, ~120KB)
//   - tesseract-core-simd.wasm.js       (WASM core SIMD, ~4.5MB)
//   - tesseract-core-simd-lstm.wasm.js  (WASM core LSTM, ~3.8MB)
//   - eng.traineddata.gz                (English best-accuracy model, ~12.8MB)
//
// TARGET DIR:  dashboard/assets/vendor/tesseract/
//              dashboard/assets/vendor/tesseract/lang-data/
//
// The Scanner's OCR loader (dashboard/assets/js/src/state/ocr.ts) already points at
// these local paths instead of a CDN: loadTesseract() injects tesseract.min.js, and the
// createWorker() call sets corePath / langPath / workerPath to these vendored files.
// After running this script, run `node tools/build.mjs` — step 3b bundles the model into
// worker-offline.js, which the loader picks on a file:// origin — then refresh dashboard.html.
//
// SAFE TO RE-RUN: skips files that already exist on disk.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const ROOT = path.resolve(SCRIPT_DIR, '..');
const VENDOR_DIR = path.join(ROOT, 'dashboard', 'assets', 'vendor', 'tesseract');
const LANG_DIR = path.join(VENDOR_DIR, 'lang-data');

// Pinned versions for reproducibility
const TJS_VERSION = '5.1.1';
const TJS_CORE_VERSION = '5.1.1';
const LANG_VARIANT = '4.0.0_best';  // _best = high-accuracy, larger model

const FILES = [
  {
    label: 'tesseract.min.js (main library)',
    url: `https://cdn.jsdelivr.net/npm/tesseract.js@${TJS_VERSION}/dist/tesseract.min.js`,
    dest: path.join(VENDOR_DIR, 'tesseract.min.js'),
  },
  {
    label: 'worker.min.js (web worker)',
    url: `https://cdn.jsdelivr.net/npm/tesseract.js@${TJS_VERSION}/dist/worker.min.js`,
    dest: path.join(VENDOR_DIR, 'worker.min.js'),
  },
  {
    label: 'tesseract-core-simd.wasm.js',
    url: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TJS_CORE_VERSION}/tesseract-core-simd.wasm.js`,
    dest: path.join(VENDOR_DIR, 'tesseract-core-simd.wasm.js'),
  },
  {
    label: 'tesseract-core-simd-lstm.wasm.js',
    url: `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TJS_CORE_VERSION}/tesseract-core-simd-lstm.wasm.js`,
    dest: path.join(VENDOR_DIR, 'tesseract-core-simd-lstm.wasm.js'),
  },
  {
    label: 'eng.traineddata.gz (English best-accuracy model · ~12MB)',
    url: `https://tessdata.projectnaptha.com/${LANG_VARIANT}/eng.traineddata.gz`,
    dest: path.join(LANG_DIR, 'eng.traineddata.gz'),
  },
];

// ─── Setup ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

async function downloadOne(file) {
  if (fs.existsSync(file.dest)) {
    const sz = fs.statSync(file.dest).size;
    console.log(`  ✓ already on disk: ${path.relative(ROOT, file.dest)} (${formatBytes(sz)})`);
    return;
  }
  process.stdout.write(`  ↓ ${file.label}\n    from ${file.url}\n    `);
  const res = await fetch(file.url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${file.url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  ensureDir(path.dirname(file.dest));
  fs.writeFileSync(file.dest, buf);
  console.log(`→ ${path.relative(ROOT, file.dest)} (${formatBytes(buf.length)})`);
}

async function main() {
  console.log('━━━ Vendoring Tesseract.js for the Wallach dashboard ━━━');
  console.log(`Target: ${path.relative(ROOT, VENDOR_DIR)}/\n`);

  ensureDir(VENDOR_DIR);
  ensureDir(LANG_DIR);

  let totalBytes = 0;
  for (const file of FILES) {
    try {
      await downloadOne(file);
      if (fs.existsSync(file.dest)) totalBytes += fs.statSync(file.dest).size;
    } catch (e) {
      console.error(`  ✗ FAILED: ${file.label} — ${e.message}`);
      process.exit(1);
    }
  }

  console.log(`\n━━━ DONE · ${formatBytes(totalBytes)} vendored ━━━`);
  console.log('Refresh dashboard.html — Scanner OCR now works offline.');
}

main();
