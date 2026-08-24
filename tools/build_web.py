#!/usr/bin/env python3
"""
build_web.py — package the dashboard as a static WEBSITE build (nutrientcodex.com).

    PYTHONUTF8=1 python tools/build_web.py

This is the SECOND distribution. The primary artifact is still the file:// download in
`dashboard/`, and this script never modifies it — every transform below happens on COPIES
written into `dist-web/`. The design-system stylesheet is sealed against a golden hash, so
rewriting it in place is not an option and is not attempted.

Ruled 2026-08-20 (chronicle/decisions/2026-08-20-domain-name.md): the "no network at runtime /
cannot be taken offline" clause of CLAUDE.md scopes to the LOCAL build only. The web build is
allowed to fetch. Its own goals are: identical behaviour to local, fast, and set-and-forget.

WHAT THIS BUILD DOES, AND WHY EACH ONE IS SAFE
  1. Minifies the bundle.                 esbuild --minify. -19% raw, -4.6% gzipped (measured).
  2. Converts every font TTF -> WOFF2.    -50% (11.63 MB -> 5.81 MB, measured). ALL fonts are
                                          converted and shipped -- see FONTS below.
  3. Drops most of `assets/data/`.        13 MB. Almost every file there is INLINED into the
                                          bundle at build time and nothing fetches it. The
                                          exception is the SPLIT ARTIFACTS (step 8): those are
                                          stubbed OUT of the bundle and shipped as files, which
                                          is the entire point of the web build being fast.
  4. Drops `worker-offline.js`.           17.2 MB. state/ocr.ts branches on
                                          window.location.protocol and only loads that worker on
                                          file://. Over http it uses the lean worker.min.js.
  5. Drops `*.map`.                       18.1 MB. Never serve a sourcemap publicly.
  6. Content-hashes main.js + the CSS.    Lets `.htaccess` cache them for a year with NO staleness
                                          risk: a changed file gets a changed name. This is what
                                          makes "set and forget" literally true -- there is no
                                          cache to invalidate, ever.
  7. dashboard.html -> index.html.        So the bare domain serves the app.

FONTS -- read before "optimising" further
  A network trace of a real http load fetches exactly 7 of the 13 faces. The other 6
  (Merriweather x2 = 9.16 MB, Playfair x2, Crimson Pro x2) are never requested, because
  type-futurist.css remaps the serif/display tokens to Space Grotesk and Unbounded.
  They are STILL SHIPPED here, deliberately. Dropping them is a real 10.2 MB win but it is
  contingent on no theme path ever re-selecting those families, and that audit has not been
  done. Converting them to WOFF2 captures half the win at zero risk. Do the audit before
  taking the rest -- do not just delete them because this comment mentions the number.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DASH = ROOT / 'dashboard'
OUT = ROOT / 'dist-web'

# Copied verbatim. Paths under these are referenced BY CODE (state/ocr.ts corePath/langPath/
# workerPath, views/profile.ts avatar src) or BY THE SHELL (the favicon <link>s in
# dashboard.html), so they must keep their exact names -- do not hash them.
VERBATIM_DIRS = ['assets/avatars', 'assets/favicons', 'assets/vendor']
# Never shipped to the web. Each entry has a reason in the module docstring above.
EXCLUDE_NAMES = {'worker-offline.js'}
EXCLUDE_SUFFIX = {'.map'}


def say(msg: str) -> None:
    print(f'→ {msg}')


def ok(msg: str) -> None:
    print(f'✓ {msg}')


def die(msg: str) -> None:
    print(f'✗ {msg}', file=sys.stderr)
    sys.exit(1)


def sizeof(n: int) -> str:
    return f'{n / 1_048_576:.2f} MB' if n >= 1_048_576 else f'{n / 1024:.1f} KB'


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:10]


def tree_bytes(p: Path) -> int:
    return sum(f.stat().st_size for f in p.rglob('*') if f.is_file())


# --- 1. clean output ------------------------------------------------------
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)
say(f'output: {OUT}')

# --- 2. minified bundle ---------------------------------------------------
say('Bundling (web target — heavy artifacts stubbed out)…')
js_dir = OUT / 'assets' / 'js' / 'dist'
js_dir.mkdir(parents=True)
tmp_js = js_dir / 'main.tmp.js'
# tools/esbuild_web.mjs owns the split: the --define that arms state/data-split.ts, the
# onLoad stubs, and a metafile assertion that the stubs actually applied. Keeping that in one
# Node file means this script never has to know which artifacts are split.
cmd = ['node', str(ROOT / 'tools' / 'esbuild_web.mjs'), str(tmp_js)]
proc = subprocess.run(cmd, cwd=DASH, shell=(os.name == 'nt'), capture_output=True, text=True)
if proc.returncode != 0 or not tmp_js.exists():
    die(f'web bundle failed:\n{proc.stdout[-1500:]}\n{proc.stderr[-1500:]}')
js_bytes = tmp_js.read_bytes()
js_name = f'main.{digest(js_bytes)}.js'
tmp_js.rename(js_dir / js_name)
# The bundle carries the hashed filenames of the split artifacts (esbuild_web.mjs computes
# them and bakes them in as a --define), and writes them out here so step 5b knows what to
# name the files. Read it from the SIDECAR rather than re-hashing: two independent hashers
# that ever drift would produce a bundle asking for a file nobody shipped.
sidecar = js_dir / 'main.tmp.js.split-manifest.json'
if not sidecar.exists():
    die('esbuild_web.mjs wrote no split manifest — the bundle would fetch un-hashed names')
split_manifest = json.loads(sidecar.read_text(encoding='utf-8'))
sidecar.unlink()  # never ship it: it is build scaffolding, not an asset
ok(f'bundle · {js_name} ({sizeof(len(js_bytes))})')

# --- 3. fonts: TTF -> WOFF2 -----------------------------------------------
say('Converting fonts to WOFF2…')
try:
    from fontTools.ttLib import TTFont
except ImportError:
    die('fonttools is required (pip install fonttools brotli)')
font_out = OUT / 'assets' / 'fonts'
font_out.mkdir(parents=True)
ttf_total = woff_total = 0
for src in sorted((DASH / 'assets/fonts').glob('*.ttf')):
    raw = src.stat().st_size
    font = TTFont(str(src))
    font.flavor = 'woff2'
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    (font_out / f'{src.stem}.woff2').write_bytes(data)
    ttf_total += raw
    woff_total += len(data)
for extra in ('LICENSE.md', 'README.md'):
    p = DASH / 'assets/fonts' / extra
    if p.exists():
        shutil.copy2(p, font_out / extra)
ok(f'fonts · {sizeof(ttf_total)} TTF → {sizeof(woff_total)} WOFF2 '
   f'(-{100 * (1 - woff_total / ttf_total):.1f}%)')

# --- 4. CSS: repoint fonts, content-hash ----------------------------------
say('Rewriting stylesheets…')
css_out = OUT / 'assets' / 'styles'
css_out.mkdir(parents=True)
css_map: dict[str, str] = {}
# ★★ STYLESHEETS HELD BACK FROM THE WEB BUILD.
# The phone arrangement layer is APPROVED FOR THE LOCAL DASHBOARD ONLY and must not reach
# nutrientcodex.com until the owner has signed it off. It was added to the live dashboard surface
# without his approval on 2026-08-23; he ruled it may STAY LOCALLY because testing mobile against
# the real dashboard is easier than against a demo, and that it may NEVER ship to the web
# unapproved. This glob would have carried it there on the next build, silently, so the rule is
# enforced here rather than remembered. Its <link> is stripped from index.html below to match, and
# web_build_excludes_unapproved_styles gates both halves.
WEB_EXCLUDED_CSS = {'mobile.css'}

for src in sorted((DASH / 'assets/styles').glob('*.css')):
    if src.name in WEB_EXCLUDED_CSS:
        continue
    text = src.read_text(encoding='utf-8')
    before = text
    text = re.sub(r"(url\(['\"]?[^)'\"]+?)\.ttf(['\"]?\))", r'\1.woff2\2', text)
    text = re.sub(r"format\((['\"])truetype\1\)", r"format(\1woff2\1)", text)
    if '.ttf' in text:
        die(f'{src.name}: a .ttf reference survived the rewrite')
    if before != text and 'woff2' not in text:
        die(f'{src.name}: rewrite produced no woff2 reference')
    data = text.encode('utf-8')
    name = f'{src.stem}.{digest(data)}.css'
    (css_out / name).write_bytes(data)
    css_map[src.name] = name
ok(f'stylesheets · {len(css_map)} rewritten + hashed')

# --- 5. verbatim asset trees ----------------------------------------------
say('Copying assets…')
for rel in VERBATIM_DIRS:
    src_dir = DASH / rel
    if not src_dir.exists():
        continue
    for f in src_dir.rglob('*'):
        if not f.is_file():
            continue
        if f.name in EXCLUDE_NAMES or f.suffix in EXCLUDE_SUFFIX:
            continue
        dest = OUT / rel / f.relative_to(src_dir)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dest)
ok(f'assets · {", ".join(VERBATIM_DIRS)}')

# --- 5b. split artifacts --------------------------------------------------
# The ONLY files from assets/data/ that ship. The key list is read out of esbuild_web.mjs
# rather than repeated here: one hand-maintained list, not two. `split_data_manifest_agrees`
# reds the board if that list and the SplitKey union in state/data-split.ts ever disagree.
say('Shipping split artifacts…')
mjs = (ROOT / 'tools/esbuild_web.mjs').read_text(encoding='utf-8')
split_keys = re.findall(r"\{\s*key:\s*'([^']+)'", mjs)
if not split_keys:
    die('esbuild_web.mjs: SPLIT_ARTIFACTS unreadable — its shape changed')
# ★ THE NAMES COME FROM THE BUNDLE, NOT FROM HERE. The app fetches whatever esbuild_web.mjs
# baked into it, so this loop's only job is to make those names exist. A key the bundle never
# named is a file the app will never ask for; a name whose hash is not this file's hash is a
# fetch that 404s. Both hard-fail rather than shipping a build that is quietly broken on the
# web only — the exact class of defect the split has always been able to hide.
missing = [k for k in split_keys if not isinstance(split_manifest.get(k), str)]
if missing:
    die(f'the bundle named no shipped file for: {", ".join(missing)}')
split_bytes = 0
for key in split_keys:
    src = DASH / 'assets/data' / f'{key}.json'
    if not src.exists():
        die(f'split artifact declared but missing on disk: {src}')
    want = digest(src.read_bytes())
    dest = OUT / 'assets' / 'data' / split_manifest[key]
    if f'.{want}.' not in dest.name:
        die(f'{key}: the bundle asks for {dest.name}, which does not carry this file\'s hash ({want})')
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    split_bytes += dest.stat().st_size
ok(f'split artifacts · {len(split_keys)} shipped ({sizeof(split_bytes)}) — hashed, fetched, not inlined')

# --- 6. index.html --------------------------------------------------------
say('Writing index.html…')
html = (DASH / 'dashboard.html').read_text(encoding='utf-8')
# Drop the <link> for every held-back sheet, or index.html would point at a file that was never
# copied and the browser would 404 on it.
for excluded in sorted(WEB_EXCLUDED_CSS):
    html = re.sub(rf'[^\n]*\./assets/styles/{re.escape(excluded)}[^\n]*\n?', '', html)
    if excluded in html:
        die(f'index.html: a reference to the held-back {excluded} survived')
for original, hashed in css_map.items():
    needle = f'./assets/styles/{original}'
    if needle not in html:
        die(f'index.html: no reference found for {original} — the shell changed shape')
    html = html.replace(needle, f'./assets/styles/{hashed}')
needle = './assets/js/dist/main.js'
if needle not in html:
    die('index.html: no reference found for main.js — the shell changed shape')
html = html.replace(needle, f'./assets/js/dist/{js_name}')
if '.ttf' in html or 'main.js"' in html:
    die('index.html: an un-rewritten reference survived')
(OUT / 'index.html').write_text(html, encoding='utf-8', newline='')
ok('index.html')

# --- 7. .htaccess ---------------------------------------------------------
# ★★ THIS FILE ONLY RUNS IF NGINX DIRECT DELIVERY IS OFF. Measured on the live host 2026-08-21.
# SiteGround fronts Apache with NGINX and, by default, serves static files DIRECTLY — which
# bypasses Apache and therefore every rule below. Symptoms of the bypass, all of which we hit:
#   · `Server: nginx`, and NONE of the headers set here appear on any response
#   · index.html comes back `Cache-Control: max-age=15552000` (NGINX's 180-day default)
#   · the .gz still happens to be served correctly — by NGINX's octet-stream default, i.e. by
#     LUCK rather than by the ForceType rule below
# The 180-day one is the dangerous default: index.html is what points at the content-hashed
# asset names, so a returning visitor is pinned to one build for six months and NO update can
# reach them. Fix is Site Tools -> Speed -> Caching -> NGINX Direct Delivery OFF; Apache then
# serves static files, these rules apply, and brotli still works (verified, byte-identical
# wire sizes before and after).
#
# ★★ AND THERE IS A SECOND CACHE IN FRONT, WHICH THESE RULES DO NOT REACH. Measured on the
# live host 2026-08-22, after a deploy: every response carries `x-proxy-cache`, and the three
# split artifacts came back HIT with the PREVIOUS deploy's bytes — a fresh bundle reading a
# superseded corpus (knowledge_version 490 while 491 sat on disk), with no error anywhere and
# the claim count on screen simply wrong. `fetch(url, {cache:'reload'})` and `{cache:'no-store'}`
# both still returned HIT: those directives govern the BROWSER, not an upstream proxy.
# Flushing Site Tools -> Speed -> Caching cleared it, but a manual step you can silently forget
# is not a fix. The artifacts are therefore CONTENT-HASHED as of 2026-08-22 (step 5b), which is
# why `json` joins the immutable group below — the three JSON files are now the only .json
# shipped, and every one of them carries its own hash. Nothing here is cache-invalidated ever
# again; a change is simply a different object. The JS and CSS were never stale through any of
# this, for exactly that reason.
#
# ! VERIFY ON THE LIVE HOST AFTER EVERY DEPLOY — a host setting can silently revert this.
# The one-line proof that these rules are live at all (no server default emits these two):
#     curl -sI https://nutrientcodex.com/ | grep -iE 'x-content-type-options|referrer-policy'
# And the .gz rule, which is what breaks the Scanner if the host ignores it:
#     curl -sI https://nutrientcodex.com/assets/vendor/tesseract/lang-data/eng.traineddata.gz
# Content-Encoding MUST be absent. If the host adds it, the browser silently gunzips the model,
# tesseract.js then tries to gunzip plain data, and OCR fails on the web only. The stronger
# check, from the browser console on the live site, is that the gzip magic survives the trip:
#     fetch(u).then(r=>r.arrayBuffer()).then(b=>new Uint8Array(b)[0]===0x1f)   // must be true
HTACCESS = """# The Nutrient Codex — static hosting rules. Generated by tools/build_web.py; edit there.

DirectoryIndex index.html

# -- Compression ------------------------------------------------------------
# WOFF2 and the .gz model are already compressed — re-compressing them wastes CPU for ~0 bytes.
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# -- MIME -------------------------------------------------------------------
AddType application/wasm .wasm
AddType font/woff2 .woff2

# -- ★ The .gz trap ----------------------------------------------------------
# tesseract.js fetches eng.traineddata.gz and gunzips it ITSELF. If Apache tags the response
# Content-Encoding: gzip (its stock AddEncoding does), the browser gunzips it in transit and
# tesseract then fails on already-plain data. Deliver it opaque.
<FilesMatch "\\.traineddata\\.gz$">
  RemoveEncoding .gz
  ForceType application/octet-stream
  <IfModule mod_headers.c>
    Header unset Content-Encoding
  </IfModule>
</FilesMatch>

# -- Caching ----------------------------------------------------------------
# main.<hash>.js and *.<hash>.css carry their content hash in the filename, so a year is safe:
# a change produces a new name. index.html must NEVER be cached hard — it is what points at the
# hashed names, and a stale copy would pin users to an old build forever.
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|json|woff2|png|jpe?g|svg|webp|wasm)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(html|gz)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
  # The favicons are the one image with a FIXED name that might actually be replaced, and the
  # year-long rule above would pin a stale icon on every returning visitor -- the same shape of
  # trap that served a superseded corpus on 2026-08-22. They are ~2 KB each, so a conditional
  # request costs nothing and a new icon reaches everyone on their next load. This block is
  # LATER, so it wins for these two files only.
  <FilesMatch "^favicon-.*\\.png$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>

# -- Hygiene ----------------------------------------------------------------
Options -Indexes
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set Referrer-Policy "no-referrer"
</IfModule>
"""
(OUT / '.htaccess').write_text(HTACCESS, encoding='utf-8', newline='')
ok('.htaccess')

# --- 8. report ------------------------------------------------------------
first_load = len((OUT / 'index.html').read_bytes()) + len(js_bytes)
first_load += sum((css_out / n).stat().st_size for n in css_map.values())
print()
print('=' * 68)
print(f'  dist-web  ·  {sizeof(tree_bytes(OUT))}  across '
      f'{sum(1 for f in OUT.rglob("*") if f.is_file())} files')
print(f'  first load · {sizeof(first_load)} raw  (html + {len(css_map)} css + bundle; '
      'fonts load on top, already WOFF2-compressed)')
print('=' * 68)
print()
print('  Upload the CONTENTS of dist-web/ (including the dotfile .htaccess) into')
print('  public_html/ for the domain. Then verify on the live host:')
print('    curl -sI https://<domain>/assets/vendor/tesseract/lang-data/eng.traineddata.gz')
print('    → Content-Encoding must be ABSENT, or the Scanner breaks on the web only.')
