#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// esbuild_web.mjs — the WEB bundle: same source, heavy artifacts left out
// ═══════════════════════════════════════════════════════════════════════════
// Usage:   node tools/esbuild_web.mjs <outfile>      (called by tools/build_web.py)
//
// This differs from tools/build.mjs — the file:// build — in exactly two ways:
//
//   1. --define:__SPLIT_DATA__=true, which switches state/data-split.ts from "everything is
//      inlined, do nothing" to "fetch these after first paint".
//   2. An onLoad hook that replaces each SPLIT_ARTIFACT's JSON with the EMPTY value its Zod
//      schema accepts, so the payload never enters the bundle at all. build_web.py copies the
//      real file into dist-web/assets/data/ for state/data-split.ts to fetch.
//
// Stubbing to the schema's empty value rather than to `null` is deliberate: the consumer's
// existing "bad or absent embed reads as empty" path then handles the pre-hydration moment
// with no new branch, and a hydration that never arrives degrades to absent data rather than
// to a crash. Absent is honest; invented would not be.
//
// ★ SPLIT_ARTIFACTS must agree with the SplitKey union in state/data-split.ts. The invariant
// `split_data_manifest_agrees` reds the board when they diverge — a key stubbed here but not
// declared there (or the reverse) is a dataset that silently empties on the web ONLY, which is
// precisely the class of defect a file:// test run cannot see.
// ═══════════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DASH = resolve(ROOT, 'dashboard');

// esbuild is a devDependency of dashboard/, but this file lives in tools/ — a bare import
// would resolve upward from here and find no node_modules at the repo root. Resolve from the
// dashboard package instead, which is the same copy tools/build.mjs uses via `npx`.
const { build } = createRequire(resolve(DASH, 'package.json'))('esbuild');

/**
 * The artifacts the web build fetches instead of inlining.
 *   key   — path under assets/data/ without the .json, doubling as the fetch path
 *   empty — the value the consumer's schema accepts when the payload is absent
 */
export const SPLIT_ARTIFACTS = [
  { key: 'creators-log-embed', empty: '[]' },
  // The empty values below are the consumers' own EMPTY_CORPUS / EMPTY_INDEX shapes. Stub
  // with a SCHEMA-VALID empty rather than `null` or `{}`: a valid empty flows through the
  // normal Zod path, where a malformed stub would instead exercise the parse-failure
  // branch and make every pre-hydration read look like a corrupt artifact.
  { key: 'corpus-embed', empty: '{"knowledge_version":0,"books":{},"planned_books":[],"essentials":{},"conditions":{},"umbrellas":{},"claims":{}}' },
  { key: 'search/search-index', empty: '{"books":{},"entities":{},"claims":[]}' },
];

/**
 * key → the FILENAME the web build ships, carrying that artifact's own content hash.
 *
 * ★ WHY THESE ARE HASHED AT ALL. Everything else the web build emits is content-hashed
 * already, and tools/build_web.py says why in as many words: "a changed file gets a changed
 * name … there is no cache to invalidate, ever." These three were the one place that promise
 * was not kept — stable names, changing contents — and on 2026-08-22 it came due: SiteGround's
 * proxy served the PREVIOUS deploy's corpus-embed.json for hours after an upload
 * (`x-proxy-cache: HIT`, Last-Modified a day stale), so the live site answered from
 * knowledge_version 490 while 491 sat on disk beside a fresh bundle. Ten claims that the new
 * seal had removed were publicly readable and the claim count on screen was wrong.
 *
 * ★ AND WHY Cache-Control WAS NOT THE FIX. The obvious repair is a must-revalidate header,
 * and it does not work: `fetch(url, {cache: 'reload'})` and `{cache: 'no-store'}` both still
 * came back `x-proxy-cache: HIT`. Those directives govern the BROWSER's cache; an upstream
 * proxy's own object store is under no obligation to honour them. A new filename is the only
 * instruction every layer must obey, because it is not an instruction — it is a different
 * object. The JS and CSS were never stale through any of this, for exactly that reason.
 *
 * The digest matches build_web.py's `digest()` (sha256, first 10 hex), but the two never
 * compute it independently: this function is the single source and build_web.py reads the
 * manifest this file writes.
 */
function splitManifest() {
  const out = {};
  for (const { key } of SPLIT_ARTIFACTS) {
    const src = resolve(DASH, 'assets/data', `${key}.json`);
    const hash = createHash('sha256').update(readFileSync(src)).digest('hex').slice(0, 10);
    // `key` may carry a directory ('search/search-index'), and it must survive into the name
    // so the shipped path still matches what the manifest tells the app to fetch.
    out[key] = `${key}.${hash}.json`;
  }
  return out;
}

/** Replace each split artifact's contents with its empty shape, before esbuild reads it. */
const splitDataPlugin = {
  name: 'split-data',
  setup(pluginBuild) {
    for (const { key, empty } of SPLIT_ARTIFACTS) {
      // Both separators: this runs on Windows and on CI.
      const pattern = new RegExp(`[\\\\/]data[\\\\/]${key.replace('/', '[\\\\/]')}\\.json$`);
      pluginBuild.onLoad({ filter: pattern }, () => ({ contents: empty, loader: 'json' }));
    }
  },
};

const outfile = process.argv[2];
if (outfile === undefined) {
  console.error('usage: node tools/esbuild_web.mjs <outfile>');
  process.exit(1);
}

// Computed BEFORE the bundle, because the bundle has to carry it: the app cannot fetch a
// hashed name it was not told. That ordering is what makes the chain airtight — index.html is
// never cached hard, it names the hashed bundle, and the bundle names the hashed artifacts.
const manifest = splitManifest();
for (const { key } of SPLIT_ARTIFACTS) {
  if (typeof manifest[key] !== 'string') {
    console.error(`✗ ${key}: no hashed filename computed — the artifact is missing or unreadable`);
    process.exit(1);
  }
}

const result = await build({
  entryPoints: [resolve(DASH, 'assets/js/src/main.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  minify: true,
  outfile,
  // A define's value is raw JS source text, so a JSON object literal is exactly right here.
  define: { __SPLIT_DATA__: 'true', __SPLIT_MANIFEST__: JSON.stringify(manifest) },
  plugins: [splitDataPlugin],
  logLevel: 'warning',
  metafile: true,
});

// Prove the stub actually took. esbuild resolving the JSON by a path this regex misses would
// silently inline the payload again and the only symptom would be a bundle that is quietly
// megabytes too big — so assert on the metafile rather than trusting the filter.
const inputs = Object.keys(result.metafile.inputs);
for (const { key } of SPLIT_ARTIFACTS) {
  const hit = inputs.find(p => p.replace(/\\/g, '/').endsWith(`data/${key}.json`));
  if (hit === undefined) {
    console.error(`✗ ${key}: not in the module graph at all — the import moved or was removed`);
    process.exit(1);
  }
  const bytes = result.metafile.inputs[hit].bytes;
  if (bytes > 4096) {
    console.error(`✗ ${key}: stub did not apply — esbuild read ${bytes} B, not the empty shape`);
    process.exit(1);
  }
}
// The sidecar is how build_web.py learns which names to write the files under. Emitting it
// rather than having that script re-derive the hashes keeps ONE implementation of the naming:
// two independent hashers that drift produce a bundle asking for a file nobody shipped.
writeFileSync(`${outfile}.split-manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`✓ web bundle · ${SPLIT_ARTIFACTS.length} artifact(s) stubbed out, hashed and named`);
