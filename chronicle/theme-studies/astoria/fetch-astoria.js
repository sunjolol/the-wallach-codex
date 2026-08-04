// Pull the pen's rendered document and EVERY asset it references into the repo, so the
// theme study runs entirely from local files with the network off. Luneth authorised
// copying these assets directly.
//
// Nothing here passes through the model's context: the HTML/CSS lands on disk and only a
// manifest (name, type, bytes) is printed.
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTDIR = process.argv[2];
const ASSETS = path.join(OUTDIR, 'astoria-assets');
fs.mkdirSync(ASSETS, { recursive: true });

const HDRS = { 'Referer': 'https://codepen.io/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: HDRS }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        const next = new URL(res.headers.location, url).href;
        res.resume();
        return resolve(get(next, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(res.statusCode + ' ' + url)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buf: Buffer.concat(chunks), type: res.headers['content-type'] || '' }));
    }).on('error', reject);
  });
}

const EXT = {
  'image/png': '.png', 'image/webp': '.webp', 'image/jpeg': '.jpg', 'image/gif': '.gif',
  'image/svg+xml': '.svg', 'font/otf': '.otf', 'font/ttf': '.ttf', 'font/woff2': '.woff2',
  'font/woff': '.woff', 'application/font-woff': '.woff',
};

function localName(url, type) {
  let base = decodeURIComponent(url.split('?')[0].split('/').pop() || 'asset');
  base = base.replace(/[^A-Za-z0-9._-]/g, '_');
  if (!/\.[A-Za-z0-9]{2,5}$/.test(base)) {
    const t = (type || '').split(';')[0].trim();
    base += EXT[t] || '.bin';
  }
  // the jcink fonts are served with an ODF mimetype; trust the extension in the URL
  return base;
}

(async () => {
  console.log('fetching the rendered document...');
  const doc = await get('https://cdpn.io/pharaohleap/fullpage/wBojQLN');
  let html = doc.buf.toString('utf8');
  fs.writeFileSync(path.join(OUTDIR, 'astoria-raw.html'), html, 'utf8');
  console.log(`  astoria-raw.html  ${doc.buf.length} B`);

  // Any stylesheet the document links (CodePen serves the compiled CSS separately)
  const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)]
    .map(m => new URL(m[1], 'https://cdpn.io/').href);
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  let css = inlineCss;
  for (const l of cssLinks) {
    try {
      const r = await get(l);
      css += '\n/* ' + l + ' */\n' + r.buf.toString('utf8');
      console.log(`  linked css ${l.split('/').pop()}  ${r.buf.length} B`);
    } catch (e) { console.log('  css FAIL ' + l + ' ' + e.message); }
  }
  fs.writeFileSync(path.join(OUTDIR, 'astoria-raw.css'), css, 'utf8');
  console.log(`  astoria-raw.css   ${Buffer.byteLength(css)} B  (${cssLinks.length} linked + inline)`);

  // every off-machine URL referenced anywhere
  const pool = css + '\n' + html;
  const urls = new Set();
  for (const m of pool.matchAll(/url\(\s*['"]?(https?:\/\/[^)'"]+)['"]?\s*\)/gi)) urls.add(m[1]);
  for (const m of pool.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+\.(?:png|jpe?g|webp|gif|svg|otf|ttf|woff2?))["']/gi)) urls.add(m[1]);
  for (const m of pool.matchAll(/background-image\s*:\s*url\(\s*['"]?(https?:\/\/[^)'"]+)/gi)) urls.add(m[1]);
  // inline style attributes carry the character avatars
  for (const m of pool.matchAll(/background-image\s*:\s*url\(([^)]+)\)/gi)) {
    const u = m[1].replace(/['"]/g, '').trim();
    if (/^https?:\/\//.test(u)) urls.add(u);
  }

  console.log(`\n${urls.size} external assets referenced`);
  const map = {};
  let ok = 0, fail = 0, bytes = 0;
  for (const u of urls) {
    try {
      const r = await get(u);
      let name = localName(u, r.type);
      // avoid collisions between same-named files from different hosts
      if (map[name] && map[name] !== u) name = Math.abs(hash(u)).toString(36) + '-' + name;
      fs.writeFileSync(path.join(ASSETS, name), r.buf);
      map[u] = name; bytes += r.buf.length; ok++;
      console.log(`  OK   ${name.padEnd(38)} ${String(r.buf.length).padStart(8)} B  ${r.type.split(';')[0]}`);
    } catch (e) { fail++; console.log(`  FAIL ${u}  ${e.message}`); }
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  fs.writeFileSync(path.join(OUTDIR, 'astoria-assets.json'), JSON.stringify(map, null, 1), 'utf8');
  console.log(`\n${ok} downloaded, ${fail} failed, ${(bytes / 1024).toFixed(0)} KB total`);
  console.log(`assets -> ${ASSETS}`);
})();
