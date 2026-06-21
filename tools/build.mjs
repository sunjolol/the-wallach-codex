#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// build.mjs — cross-platform dashboard build (replaces tools/build-dashboard.sh)
// ═══════════════════════════════════════════════════════════════════════════
// Usage:    node tools/build.mjs        OR    npm run build  (from dashboard/)
// Output:   dashboard/assets/js/dist/main.js  (committed runtime contract)
//           dashboard/assets/js/dist/main.js.map  (source map)
//
// What this does:
//   1. Verifies devDependencies are installed (suggests `npm install` if not)
//   2. Runs `tsc --noEmit` for type-checking only
//   3. Runs esbuild to bundle .ts → single browser-runnable IIFE
//   4. Verifies the output exists + is non-empty
//
// Works identically on Windows PowerShell, macOS Terminal, Linux bash.
// No shell-script dependency. The §00 cross-platform build.
// ═══════════════════════════════════════════════════════════════════════════

import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DASH = resolve(ROOT, 'dashboard');
const ENTRY = resolve(DASH, 'assets/js/src/main.ts');
const OUT = resolve(DASH, 'assets/js/dist/main.js');

function step(msg) { console.log(`→ ${msg}`); }
function ok(msg)   { console.log(`✓ ${msg}`); }
function fail(msg) { console.error(`✗ ${msg}`); process.exit(1); }

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  } catch (err) {
    fail(`Command failed: ${cmd}`);
  }
}

// ─── 1. Check devDependencies ──────────────────────────────────────────
if (!existsSync(resolve(DASH, 'node_modules'))) {
  step('node_modules missing — running `npm install` in dashboard/');
  run('npm install --no-audit --no-fund', DASH);
}

// ─── 2. Type-check ─────────────────────────────────────────────────────
step('Type-checking (tsc --noEmit)…');
run('npx tsc --noEmit', DASH);

// ─── 3. Bundle ─────────────────────────────────────────────────────────
step('Bundling with esbuild…');
const esbuildCmd = [
  'npx esbuild',
  `"${ENTRY}"`,
  '--bundle',
  '--format=iife',
  '--target=es2022',
  '--platform=browser',
  '--sourcemap',
  `--outfile="${OUT}"`,
].join(' ');
run(esbuildCmd, DASH);

// ─── 4. Verify output ──────────────────────────────────────────────────
if (!existsSync(OUT) || statSync(OUT).size === 0) {
  fail(`Build produced empty or missing output: ${OUT}`);
}
const sizeKB = (statSync(OUT).size / 1024).toFixed(1);
ok(`Build OK · ${OUT} (${sizeKB} KB)`);
