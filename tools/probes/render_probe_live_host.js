// tools/probes/render_probe_live_host.js — AUDIT THE LIVE HOST, after every deploy.
//
// Usage: node tools/probes/render_probe_live_host.js [https://nutrientcodex.com/]
//        LIVE_HOST=https://other.example/ node tools/probes/render_probe_live_host.js
//
// ★ WHY THIS EXISTS, AND WHAT IT IS NOT.
// render_probe_web_build.js drives dist-web/ over a local http server and proves the BUILD is
// sound BEFORE upload. It states its own limit in its header: "the local server is NOT a model
// of SiteGround. The production cache contract lives in .htaccess and can only be verified
// against the live domain." THIS probe is that verification. Every check below is a property of
// the HOST — something that can be perfectly true in dist-web/ and false on the wire.
//
// THREE HOST-ONLY FAILURE MODES, ALL THREE ALREADY MET IN PRODUCTION:
//   1. NGINX DIRECT DELIVERY (2026-08-21). SiteGround fronts Apache with NGINX and by default
//      serves static files directly, which bypasses .htaccess ENTIRELY — every rule silently
//      does nothing. index.html then comes back Cache-Control: max-age=15552000, pinning a
//      returning visitor to one build for 180 days with no update able to reach them. It is a
//      HOST SETTING, and a host setting can revert without touching this repo.
//   2. THE PROXY CACHE (2026-08-22). A layer in front of Apache, which .htaccess cannot reach,
//      served the PREVIOUS deploy's split artifacts under the CURRENT deploy's URLs. The page
//      read 2,611 claims where the build read 2,601, with no error anywhere. `fetch(url,
//      {cache:'reload'})` and `{cache:'no-store'}` both still returned HIT: those directives
//      govern the BROWSER's cache, not an upstream proxy's object store.
//   3. THE .gz TRAP. If the host tags eng.traineddata.gz `Content-Encoding: gzip`, the browser
//      gunzips it in transit, tesseract.js then tries to gunzip already-plain data, and the
//      Scanner breaks ON THE WEB ONLY — the download is unaffected and looks fine.
//
// ★ THE CONTRACT IS READ, NOT RETYPED. Every header assertion is parsed out of the HTACCESS
// template in tools/build_web.py — the file that GENERATES the .htaccess we upload. Retyping it
// here would put the contract in two hand-maintained places (§00.B.1) and this probe would go on
// asserting a rule after someone changed it, or stay silent after someone added one. The parse
// is checked for vacuity FIRST: a template this cannot read is a FAIL, never a quiet
// zero-assertion pass. That also means the FilesMatch ORDER is modelled, not assumed — the
// favicon rule wins only because it comes later, and that is verified on the wire.
//
// ★ FRESHNESS IS PROVED TWO WAYS, ONE OF WHICH NEEDS NOTHING LOCAL.
//   · SELF-HASH (always runs). Every content-hashed asset carries the first 10 hex of its own
//     sha256 in its filename. Re-hashing the DELIVERED bytes and comparing them to the name
//     catches a proxy serving stale bytes under a fresh URL — precisely the 2026-08-22 incident
//     — with no local build to compare against and no literal that can go stale.
//   · DEPLOY PARITY (only when dist-web/ is present). The live index.html must name the same
//     assets the local build names, and every file the build ships must resolve on the host.
//     That second clause is the PARTIAL-UPLOAD check: 64 files go up over FTP and a dropped one
//     is completely silent.
//   A RED under PARITY means THE HOST IS BEHIND THE LOCAL BUILD. That is a different sentence
//   from "the host is broken", so the two live in separate sections and are counted separately.
//
// ★ WHY THIS IS NOT AN INVARIANT, STATED PLAINLY (R7). It cannot be. `tools/invariants.py` must
// be deterministic and offline; a gate that reaches a third-party host over the internet would
// make the board's colour depend on SiteGround and on whether the machine has wifi. This is a
// PROBE, run on demand after a deploy. The gate-able half — that the probe and the template
// agree about what the contract IS — is handled by deriving instead of asserting, above.
//
// ★ WHAT IT STILL CANNOT SEE. It cannot enumerate the SUPERSEDED artifacts piling up in
// public_html/ (~9 MB and growing: an overlay deploy never deletes). `Options -Indexes` is on
// by design, so there is no listing to read, and a name we no longer ship is a name we can no
// longer guess. Deliberately harmless — a visitor mid-session can still fetch what their cached
// index.html names — but this probe is not the thing that will find it.
//
// EXIT: 0 all pass · 1 a check failed · 2 N/A (no puppeteer, or the host did not resolve)

const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');
const { URL } = require('url');

const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist-web');
const RAW = process.argv[2] || process.env.LIVE_HOST || 'https://nutrientcodex.com/';
const BASE = RAW.replace(/\/+$/, '') + '/';
const UA = 'wallach-codex-live-host-probe';
const REQ_TIMEOUT = 45000;

const fails = [];
const parityFails = [];
let bucket = fails;
const check = (label, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${label}${detail === undefined ? '' : `  ${detail}`}`);
  if (!cond) { bucket.push(label); }
};
const section = (title) => console.log(`\n── ${title} ──`);
const wait = ms => new Promise(r => setTimeout(r, ms));

// --- the wire ---------------------------------------------------------------
// No automatic redirect following: the http -> https hop is one of the things under test, and a
// library that quietly follows it would report 200 for a host that never redirects at all.
function request(url, opts = {}) {
  const u = new URL(url);
  const mod = u.protocol === 'http:' ? http : https;
  const headers = Object.assign(
    { 'User-Agent': UA, 'Accept-Encoding': 'gzip, br' }, opts.headers || {});
  return new Promise((resolve, reject) => {
    const r = mod.request({
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || undefined,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers,
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        url, status: res.statusCode, headers: res.headers, raw: Buffer.concat(chunks),
      }));
    });
    r.setTimeout(REQ_TIMEOUT, () => r.destroy(new Error('timeout: ' + url)));
    r.on('error', reject);
    r.end();
  });
}

// ★ MEASUREMENT CORRECTION, 2026-08-21, kept here so it is not re-learned: `curl -I` sends no
// Accept-Encoding, so the server correctly does not compress and the first sweep reported every
// JSON artifact uncompressed. That was the instrument, not the host. Every request here sets it.
function body(res) {
  const enc = String(res.headers['content-encoding'] || '').toLowerCase();
  if (enc === 'br') { return zlib.brotliDecompressSync(res.raw); }
  if (enc === 'gzip') { return zlib.gunzipSync(res.raw); }
  if (enc === 'deflate') { return zlib.inflateSync(res.raw); }
  return res.raw;
}

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

async function pooled(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// --- the contract, parsed out of the generator ------------------------------
// The template is a Python triple-quoted string, so every backslash in it is DOUBLED in the
// source text. Un-double before treating a FilesMatch pattern as a regex.
function readContract() {
  const src = fs.readFileSync(path.join(REPO, 'tools', 'build_web.py'), 'utf8');
  const m = src.match(/^HTACCESS = """([\s\S]*?)"""/m);
  if (!m) { return null; }
  const text = m[1].replace(/\\\\/g, '\\');
  const globalSet = {};
  const groups = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const s = line.trim();
    let g;
    if ((g = s.match(/^<FilesMatch\s+"(.+)"\s*>$/))) {
      cur = { pattern: g[1], set: {}, unset: [], forceType: null };
      groups.push(cur);
    } else if (/^<\/FilesMatch>/.test(s)) {
      cur = null;
    } else if ((g = s.match(/^Header\s+set\s+([A-Za-z0-9-]+)\s+"(.*)"$/))) {
      (cur ? cur.set : globalSet)[g[1].toLowerCase()] = g[2];
    } else if ((g = s.match(/^Header\s+unset\s+([A-Za-z0-9-]+)/))) {
      if (cur) { cur.unset.push(g[1].toLowerCase()); }
    } else if ((g = s.match(/^ForceType\s+(\S+)/))) {
      if (cur) { cur.forceType = g[1]; }
    }
  }
  return { globalSet, groups, text };
}

/** Apache matches <FilesMatch> against the BASENAME, and the LAST matching Header set wins. */
function expectedHeader(contract, basename, header) {
  let val;
  for (const g of contract.groups) {
    let re;
    try { re = new RegExp(g.pattern); } catch (e) { continue; }
    if (re.test(basename) && g.set[header] !== undefined) { val = g.set[header]; }
  }
  return val;
}

function groupFor(contract, basename, pred) {
  return contract.groups.filter(g => {
    let re;
    try { re = new RegExp(g.pattern); } catch (e) { return false; }
    return re.test(basename) && pred(g);
  }).pop();
}

const normCC = v => String(v || '').split(',').map(s => s.trim()).filter(Boolean).sort().join(', ');

(async () => {
  console.log(`\n∴ LIVE HOST AUDIT · ${BASE}`);

  const contract = readContract();
  if (!contract) {
    console.log('NO_CONTRACT — could not read the HTACCESS template out of tools/build_web.py');
    process.exit(1);
  }

  section('the contract, as read from tools/build_web.py');
  const globalNames = Object.keys(contract.globalSet);
  const ccGroups = contract.groups.filter(g => g.set['cache-control'] !== undefined);
  // A parser that finds nothing must FAIL, not pass every clause vacuously. This is the clause
  // that stops a reshaped template from turning the whole probe into a no-op.
  check('the template parsed to a non-vacuous contract',
    globalNames.length >= 2 && ccGroups.length >= 3 && contract.groups.some(g => g.forceType),
    `${globalNames.length} global headers · ${ccGroups.length} cache groups · `
    + `${contract.groups.length} FilesMatch`);
  for (const n of globalNames) { console.log(`        global  ${n}: "${contract.globalSet[n]}"`); }
  for (const g of ccGroups) { console.log(`        ${g.pattern}  ->  "${g.set['cache-control']}"`); }

  // --- reachability + the instrument's own control --------------------------
  section('the host answers, and this instrument can tell states apart');
  let root;
  try {
    root = await request(BASE);
  } catch (e) {
    console.log(`NOT_APPLICABLE — ${BASE} did not resolve: ${e.message}`);
    console.log('(a name that does not resolve is this machine or DNS, not a failing contract)');
    process.exit(2);
  }
  check('the bare domain returns 200', root.status === 200, `status ${root.status}`);
  // ★ THE NEGATIVE CONTROL. If a host answers 200 to everything — a catch-all rewrite, a parked
  // page, a captive portal — then every "the file is there" clause below passes for free. Prove
  // the instrument distinguishes present from absent BEFORE trusting a single presence check.
  const nonsense = await request(BASE + 'no-such-file-9f3a2b7c.txt');
  check('a nonsense path returns 404, so presence checks mean something',
    nonsense.status === 404, `status ${nonsense.status}`);

  // --- 1. are the rules live at all? ---------------------------------------
  section('1 · .htaccess is being executed (NGINX Direct Delivery is OFF)');
  // No stock server default emits these two. Their presence is the proof that Apache — and
  // therefore every rule in the file — is in the request path at all.
  for (const name of globalNames) {
    check(`${name} is set on the bare domain`,
      String(root.headers[name] || '') === contract.globalSet[name],
      `"${root.headers[name] || '(absent)'}" (want "${contract.globalSet[name]}")`);
  }
  const wantIndexCC = expectedHeader(contract, 'index.html', 'cache-control');
  check('index.html is NOT cached hard',
    normCC(root.headers['cache-control']) === normCC(wantIndexCC),
    `"${root.headers['cache-control'] || '(absent)'}" (want "${wantIndexCC}")`);
  // The 180-day NGINX default is the specific shape of this failure, and it is worth naming
  // separately: it is what makes a content-hashed deploy unreachable for six months.
  const maxAge = Number((String(root.headers['cache-control'] || '').match(/max-age=(\d+)/) || [])[1]);
  check('index.html is not pinned to a long max-age', !(maxAge > 300), `max-age=${maxAge}`);

  section('2 · https is enforced');
  const plain = await request(BASE.replace(/^https:/, 'http:'));
  check('http:// redirects to https://',
    plain.status >= 300 && plain.status < 400
    && String(plain.headers.location || '').startsWith('https://'),
    `status ${plain.status} -> ${plain.headers.location || '(no Location)'}`);

  section('3 · hygiene');
  const listing = await request(BASE + 'assets/styles/');
  check('a directory path does not serve a listing (Options -Indexes)',
    listing.status !== 200, `status ${listing.status}`);
  const dotfile = await request(BASE + '.htaccess');
  check('.htaccess itself is not readable', dotfile.status !== 200, `status ${dotfile.status}`);

  // --- 4. the .gz trap ------------------------------------------------------
  section('4 · the .gz trap (the Scanner breaks on the web only if this is wrong)');
  const GZ = 'assets/vendor/tesseract/lang-data/eng.traineddata.gz';
  const gzGroup = groupFor(contract, path.basename(GZ), g => g.forceType || g.unset.length);
  // 64 KB, not 12.8 MB: enough to read the magic, and Content-Range reports the true total.
  const gz = await request(BASE + GZ, { headers: { Range: 'bytes=0-65535' } });
  check('the OCR model is served', gz.status === 200 || gz.status === 206,
    `status ${gz.status} · ${String(gz.headers['content-range'] || '(no range)')}`);
  check('Content-Encoding is ABSENT on it',
    gz.headers['content-encoding'] === undefined,
    `"${gz.headers['content-encoding'] || '(absent)'}"`);
  check('it is typed opaquely, per ForceType',
    !gzGroup || String(gz.headers['content-type'] || '').startsWith(gzGroup.forceType || ''),
    `"${gz.headers['content-type']}" (want "${gzGroup && gzGroup.forceType}")`);
  // ★ THE STRONGER FORM — AND IT MUST BE READ OFF THE DECODED BODY, NOT THE WIRE BYTES.
  // The real trap leaves the wire bytes ALONE: Apache's stock AddEncoding tags an already-gzip
  // file `Content-Encoding: gzip`, so the stream on the wire still starts 1f 8b while the
  // BROWSER hands tesseract.js the gunzipped payload. A magic check over `raw` would therefore
  // pass cheerfully on precisely the failure it exists to catch — this probe shipped that bug
  // for one draft. `body()` decodes exactly as a browser does, so these are the bytes
  // tesseract.js actually receives. And if the host both tags the response AND honours the
  // Range, the truncated stream cannot be decoded at all, which is also a fail, correctly.
  let seen = null;
  try { seen = body(gz); } catch (e) { seen = null; }
  check('the bytes tesseract.js receives still start with the gzip magic',
    seen !== null && seen.length >= 2 && seen[0] === 0x1f && seen[1] === 0x8b,
    seen === null
      ? `undecodable as "${gz.headers['content-encoding']}" — transformed in transit`
      : '0x' + Array.from(seen.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(''));
  const wantGzCC = expectedHeader(contract, path.basename(GZ), 'cache-control');
  check('it is not cached hard either',
    normCC(gz.headers['cache-control']) === normCC(wantGzCC),
    `"${gz.headers['cache-control'] || '(absent)'}" (want "${wantGzCC}")`);

  // --- 5. what the live shell names ----------------------------------------
  section('5 · the live shell, and the cache rules on what it names');
  const indexHtml = body(root).toString('utf8');
  const named = [...new Set((indexHtml.match(/\.\/assets\/[^"')\s]+/g) || []))];
  const hashable = named.filter(p => /\.(js|css)$/.test(p));
  check('the shell names its bundle and stylesheets', hashable.length > 0, `${hashable.length} refs`);
  // A fixed name is a name a cache can hand out a stale copy of. That is the entire reason these
  // carry a digest, so an un-hashed one is a regression in the cache contract itself.
  const unhashed = hashable.filter(p => !/\.[0-9a-f]{8,}\.(js|css)$/.test(p));
  check('every js/css the shell names is content-hashed', unhashed.length === 0,
    unhashed.slice(0, 3).join(' ') || 'none un-hashed');

  const sampled = hashable.slice(0, 3).concat([ 'assets/favicons/favicon-32x32.png' ]);
  for (const ref of sampled) {
    const rel = ref.replace(/^\.\//, '');
    const res = await request(BASE + rel);
    const want = expectedHeader(contract, path.basename(rel), 'cache-control');
    check(`${path.basename(rel)} carries its rule`,
      res.status === 200 && normCC(res.headers['cache-control']) === normCC(want),
      `${res.status} "${res.headers['cache-control'] || '(absent)'}" (want "${want}")`);
  }
  // The favicon is the one FIXED name that might actually be REPLACED, so a later FilesMatch
  // pulls it back out of the year-long group. That only works because Apache lets the LAST match
  // win — which is a property of the ORDER of the file, and is therefore worth proving on the
  // wire rather than by reading the template.
  const favCC = expectedHeader(contract, 'favicon-32x32.png', 'cache-control');
  const pngCC = expectedHeader(contract, 'anything.png', 'cache-control');
  check('the later favicon rule beats the year-long image rule',
    favCC !== pngCC && /must-revalidate/.test(favCC || ''),
    `favicon "${favCC}" vs png "${pngCC}"`);

  section('6 · compression is on for the text payloads');
  const bundleRef = hashable.find(p => /\.js$/.test(p));
  const bundle = await request(BASE + bundleRef.replace(/^\.\//, ''));
  check('the bundle arrives compressed',
    /^(br|gzip|deflate)$/.test(String(bundle.headers['content-encoding'] || '')),
    `${bundle.headers['content-encoding'] || '(identity)'} · `
    + `${(bundle.raw.length / 1024).toFixed(0)} KB on the wire`);

  // --- 7. freshness, with nothing local --------------------------------------
  section('7 · FRESHNESS — every hashed asset hashes to its own name');
  // ★ This is the 2026-08-22 diagnostic, and it needs no local build and no stored literal.
  // A content-hashed name is a claim about the bytes; re-hashing the delivered bytes tests it.
  // A proxy holding the previous deploy's object under this deploy's URL fails right here.
  const hashedRefs = hashable.filter(p => /\.[0-9a-f]{8,}\.(js|css)$/.test(p));
  const selfChecks = await pooled(hashedRefs, 6, async ref => {
    const rel = ref.replace(/^\.\//, '');
    const claimed = path.basename(rel).match(/\.([0-9a-f]{8,})\.(?:js|css)$/)[1];
    const res = await request(BASE + rel);
    const actual = sha256(body(res));
    return { rel, claimed, ok: res.status === 200 && actual.startsWith(claimed), actual };
  });
  const selfBad = selfChecks.filter(r => !r.ok);
  check('every hashed js/css the shell names hashes to its own filename',
    selfChecks.length > 0 && selfBad.length === 0,
    `${selfChecks.length} verified, ${selfBad.length} mismatched`
    + (selfBad.length ? ` — ${selfBad[0].rel} is really ${selfBad[0].actual.slice(0, 10)}` : ''));

  // --- 8. driven, in a real browser, against the real domain -----------------
  let pup;
  for (const c of [REPO + '/node_modules/puppeteer', REPO + '/dashboard/node_modules/puppeteer']) {
    try { pup = require(c); break; } catch (e) { /* try next */ }
  }
  let driven = null;
  if (!pup) {
    console.log('\n── 8 · driven ── SKIPPED: no puppeteer (headers were still checked above)');
  } else {
    section('8 · driven in a real browser, on the real domain');
    driven = await drive(pup);
  }

  // --- 9. deploy parity, only if there is a local build to compare against ---
  section('9 · DEPLOY PARITY — is the host serving THIS build?');
  bucket = parityFails;
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.log('  n/a   no dist-web/ — run `PYTHONUTF8=1 python tools/build_web.py` to compare');
    console.log('        (sections 1-8 above stand on their own; they need no local build)');
  } else {
    const localHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const localNamed = [...new Set((localHtml.match(/\.\/assets\/[^"')\s]+/g) || []))].sort();
    const liveNamed = [...named].sort();
    check('the live shell names exactly the assets the local build names',
      JSON.stringify(localNamed) === JSON.stringify(liveNamed),
      localNamed.length === liveNamed.length
        ? `${liveNamed.length} refs, identical`
        : `local ${localNamed.length} vs live ${liveNamed.length}`);
    if (JSON.stringify(localNamed) !== JSON.stringify(liveNamed)) {
      const onlyLocal = localNamed.filter(p => !liveNamed.includes(p));
      const onlyLive = liveNamed.filter(p => !localNamed.includes(p));
      for (const p of onlyLocal.slice(0, 4)) { console.log(`        built, not live:  ${p}`); }
      for (const p of onlyLive.slice(0, 4)) { console.log(`        live, not built:  ${p}`); }
    }

    // ★ THE PARTIAL-UPLOAD CHECK. 64 files go up over FTP; a dropped one is completely silent,
    // and the failure it produces later is a 404 on a path nobody is looking at.
    const shipped = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { walk(p); } else { shipped.push(p); }
      }
    })(DIST);
    const rels = shipped
      .map(p => path.relative(DIST, p).split(path.sep).join('/'))
      .filter(r => r !== '.htaccess' && !r.endsWith('/.htaccess'));
    // ★ `Accept-Encoding: identity`, deliberately. With compression negotiated, Content-Length
    // describes the COMPRESSED response and cannot be compared to a file on disk; asking for
    // identity makes the host report the true byte count, which turns a presence check into a
    // SIZE check for nothing. A truncated upload resolves 200 and is otherwise invisible.
    const heads = await pooled(rels, 8, async rel => {
      const res = await request(BASE + rel.split('/').map(encodeURIComponent).join('/'),
        { method: 'HEAD', headers: { 'Accept-Encoding': 'identity' } });
      return { rel, status: res.status, len: Number(res.headers['content-length']) };
    });
    const sizeOf = rel => fs.statSync(path.join(DIST, rel)).size;
    const missing = heads.filter(h => h.status !== 200);
    check('every file the build ships resolves on the host', missing.length === 0,
      `${rels.length} checked, ${missing.length} missing`
      + (missing.length ? ` — ${missing.slice(0, 3).map(m => `${m.rel} (${m.status})`).join(', ')}` : ''));
    const wrongSize = heads.filter(h =>
      h.status === 200 && Number.isFinite(h.len) && h.len !== sizeOf(h.rel));
    check('and each arrives at its full built size', wrongSize.length === 0,
      `${heads.length - missing.length} sized, ${wrongSize.length} wrong`
      + (wrongSize.length
        ? ` — ${wrongSize.slice(0, 2).map(w => `${w.rel} ${w.len} vs ${sizeOf(w.rel)}`).join(', ')}`
        : ''));

    // The three split artifacts are the ones the incident got wrong. Compare the DELIVERED bytes
    // to the built bytes, not the headers: on 2026-08-22 the headers looked fine and `curl` and
    // the page's own fetch() of ONE url returned DIFFERENT BYTES.
    const dataFiles = rels.filter(r => /^assets\/data\/.*\.json$/.test(r));
    const drift = (await pooled(dataFiles, 4, async rel => {
      const res = await request(BASE + rel);
      const live = sha256(body(res));
      const local = sha256(fs.readFileSync(path.join(DIST, rel)));
      return live === local ? null : { rel, live: live.slice(0, 10), local: local.slice(0, 10) };
    })).filter(Boolean);
    check('every split data artifact is byte-identical to the built one',
      dataFiles.length > 0 && drift.length === 0,
      `${dataFiles.length} compared, ${drift.length} differ`
      + (drift.length ? ` — ${drift[0].rel}: live ${drift[0].live} vs built ${drift[0].local}` : ''));
  }
  bucket = fails;

  // --- report ---------------------------------------------------------------
  console.log('');
  console.log('='.repeat(72));
  if (fails.length === 0 && parityFails.length === 0) {
    console.log('  RESULT: PASS — the host executes the contract AND serves this build.');
  } else {
    if (fails.length) {
      console.log(`  HOST CONTRACT FAILED (${fails.length}): ${fails.join(' | ')}`);
      console.log('    → the host is not applying .htaccess, or is applying it wrongly.');
      console.log('      First thing to check: Site Tools -> Speed -> Caching -> NGINX Direct');
      console.log('      Delivery must be OFF, or none of these rules run at all.');
    }
    if (parityFails.length) {
      console.log(`  DEPLOY PARITY FAILED (${parityFails.length}): ${parityFails.join(' | ')}`);
      console.log('    → THE HOST IS BEHIND THE LOCAL BUILD. This is not the same sentence as');
      console.log('      "the host is broken". Re-upload the CONTENTS of dist-web/ (including');
      console.log('      the dotfile .htaccess) into public_html/, then run this again.');
    }
  }
  console.log('='.repeat(72));
  if (driven) { console.log(`\nscreenshot: ${driven.shot}   ← a DOM probe is not a visual check`); }
  process.exit(fails.length + parityFails.length === 0 ? 0 : 1);
})().catch(e => {
  console.log('\nPROBE ERROR: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});

// ---------------------------------------------------------------------------
async function boot(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
  const errors = [];
  const responses = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') { errors.push('console: ' + m.text()); } });
  page.on('response', r => responses.push({ url: r.url(), status: r.status() }));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await wait(1600);
  await page.evaluate(() => {
    const b = document.querySelector('.wc-veil .ui-close, .wc-veil [data-wc-close], .wc-veil button');
    if (b) { b.click(); }
  });
  await wait(600);
  return { page, errors, responses };
}

/** The corpus counts as the DRAWER renders them — the exact figure the 2026-08-22 incident got wrong. */
async function readCorpusCounts(page) {
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(900);
  const out = await page.evaluate(() => {
    const p = document.querySelector('#drawer-knowledge-mount .sh-hero p');
    const m = (p ? p.textContent : '').match(/([\d,]+) sourced claims from (\d+)/);
    return m ? { claims: m[1], books: m[2] } : null;
  });
  await page.evaluate(() => document.querySelector('[data-rail-nav="knowledge"]')?.click());
  await wait(400);
  return out;
}

async function drive(pup) {
  const browser = await pup.launch({
    headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  // ★ THE TRUTH ANCHOR IS THE FILE BUILD, WHERE THE CORPUS IS INLINED AT BUILD TIME. Comparing
  // the two rendered figures beats asserting a number: there is no literal here to go stale, and
  // a host hydrating from a superseded artifact cannot agree with the build that inlines it.
  const localUrl = 'file://' + path.join(REPO, 'dashboard', 'dashboard.html').replace(/\\/g, '/');
  const local = await boot(browser, localUrl);
  const localCounts = await readCorpusCounts(local.page);
  check('the local file build renders its corpus counts (the anchor)',
    localCounts !== null, JSON.stringify(localCounts));
  await local.page.close();

  const live = await boot(browser, BASE);
  const bad = live.responses.filter(r => r.status >= 400);
  check('no response 4xx/5xx on the live site', bad.length === 0, JSON.stringify(bad.slice(0, 4)));
  check('no page errors on the live site', live.errors.length === 0,
    JSON.stringify(live.errors.slice(0, 3)));

  const liveCounts = await readCorpusCounts(live.page);
  check('the live site hydrated at all', liveCounts !== null, JSON.stringify(liveCounts));
  // ★ AND HERE IS EXACTLY WHAT THIS CLAUSE PROVES, WHICH IS LESS THAN IT LOOKS. The figure on
  // the page is `sum(books[].claim_count)` — a STORED per-book counter, not a count of the
  // claim set. It moved during the 2026-08-22 incident only because the stale artifact was a
  // whole earlier build whose counters differed. Two builds can carry identical counters and
  // different claim TEXT, and this comparison would smile at both. Proven by the `textdrift`
  // negative control, which changes a verbatim without touching a count: it stays green here
  // and is caught two clauses down, by the bytes. Keep both; neither subsumes the other.
  check('the LIVE SITE and the LOCAL BUILD render the SAME corpus counts',
    localCounts !== null && liveCounts !== null
    && localCounts.claims === liveCounts.claims && localCounts.books === liveCounts.books,
    `live ${JSON.stringify(liveCounts)} vs file ${JSON.stringify(localCounts)}`);

  const artifactHits = live.responses.filter(r => /\/assets\/data\/.*\.json$/.test(r.url));
  const unhashed = artifactHits.filter(r => !/\.[0-9a-f]{8,}\.json$/.test(r.url));
  check('the live page fetched no un-hashed data artifact',
    artifactHits.length > 0 && unhashed.length === 0,
    `${artifactHits.length} fetched, ${unhashed.length} un-hashed`);

  // ★★ THE SAME SELF-HASH TEST, ON THE ARTIFACTS THE INCIDENT ACTUALLY GOT WRONG. These three
  // are named INSIDE the bundle, never in the shell, so §7 cannot reach them — the only way to
  // learn their URLs is to watch what the page fetches, which is why this lives down here after
  // a real load. It needs no local build and no stored literal: a content-hashed name is a claim
  // about the bytes, and re-hashing the delivered bytes tests that claim directly. This is the
  // clause that closes the gap the count comparison above leaves open.
  const hashedData = artifactHits.filter(r => /\.[0-9a-f]{8,}\.json$/.test(r.url));
  const dataSelf = await pooled(hashedData, 3, async r => {
    const claimed = r.url.match(/\.([0-9a-f]{8,})\.json$/)[1];
    const res = await request(r.url);
    const actual = sha256(body(res));
    return { url: r.url, ok: res.status === 200 && actual.startsWith(claimed), actual };
  });
  const dataBad = dataSelf.filter(d => !d.ok);
  check('every data artifact it fetched hashes to its own filename',
    dataSelf.length > 0 && dataBad.length === 0,
    `${dataSelf.length} verified, ${dataBad.length} mismatched`
    + (dataBad.length
      ? ` — ${path.basename(dataBad[0].url)} is really ${dataBad[0].actual.slice(0, 10)}`
      : ''));

  // One real surface, driven over the wire. A stylesheet lost to a bad MIME type or a font that
  // 404s does not throw — it just renders wrong, which no header check can see.
  await live.page.evaluate(() => window.dispatchEvent(
    new CustomEvent('wallach:navigate', { detail: { to: 'regimen' } })));
  await wait(1100);
  const reg = await live.page.evaluate(() => {
    const block = [...document.querySelectorAll('.fs-block')]
      .filter(b => b.getBoundingClientRect().height > 0)[0];
    if (!block) { return null; }
    const nav = block.querySelector('.fs-pager');
    return {
      shape: nav ? [...nav.children].map(c => (c.textContent || '').trim()).join(' ') : null,
      hasFilter: !!block.querySelector('.fs-filter'),
      tiles: block.querySelectorAll('.fs-tile').length,
    };
  });
  check('the Regimen foods block renders with its pager and filter',
    reg !== null && /^‹ 1 2 3 4 5 … \d+ ›$/.test(reg.shape) && reg.hasFilter && reg.tiles === 3,
    reg && `${reg.shape} · ${reg.tiles} tiles`);

  const shot = path.join(process.env.LIVE_SHOT_DIR || path.join(REPO, 'temporary'), 'live-host.png');
  fs.mkdirSync(path.dirname(shot), { recursive: true });
  await live.page.screenshot({ path: shot });
  await browser.close();
  return { shot, localCounts, liveCounts };
}
