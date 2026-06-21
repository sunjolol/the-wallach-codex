// ═══════════════════════════════════════════════════════════════════════════
// dist/main.js — built artifact (Round 2 polish: periodic symbols + banners)
// ───────────────────────────────────────────────────────────────────────────
// Source of truth: ../src/main.ts (+ src/core, src/state, src/views)
// Build command:    bash tools/build-dashboard.sh
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── core/events.ts ──────────────────────────────────────────────────────
  const subscribers = Object.create(null);
  function ensureSet(event) {
    let set = subscribers[event];
    if (!set) { set = new Set(); subscribers[event] = set; }
    return set;
  }
  function on(event, handler) {
    const set = ensureSet(event);
    set.add(handler);
    return () => { set.delete(handler); };
  }
  function emit(event, payload) {
    const set = subscribers[event];
    if (!set) return;
    for (const handler of set) {
      try { handler(payload); } catch (e) { console.warn('[events] ' + event + ' handler error:', e); }
    }
  }

  // ── core/storage.ts ─────────────────────────────────────────────────────
  const storageSubs = new Set();
  let nativeListenerInstalled = false;
  function installNativeListener() {
    if (nativeListenerInstalled) return;
    nativeListenerInstalled = true;
    window.addEventListener('storage', function (ev) {
      if (ev.key === null) return;
      for (const handler of storageSubs) {
        try { handler(ev.key, ev.newValue); } catch (e) { console.warn('[storage] handler error:', e); }
      }
      if (/^rgSlot/.test(ev.key) || ev.key === 'lcRegimen_v1') {
        emit('regimen:changed', { slotId: ev.key, reason: 'restore' });
      }
    });
  }
  function onStorageChange(handler) {
    installNativeListener();
    storageSubs.add(handler);
    return function () { storageSubs.delete(handler); };
  }

  // ── state/coverage.ts ───────────────────────────────────────────────────
  let cachedSnapshot = null;
  let wireInstalled = false;

  // Wallach 3-tier mineral classification — the source-rule sub-categorization
  // that the demo mockup envisions. The data has all 61 minerals tagged as the
  // flat "minerals" category; we apply this mapping at recompute time so the
  // Coverage workspace renders them in the 3 visually-distinct tiers per the
  // mockup. Counts: Foundational 11 + Major Trace 14 + Rare Trace 36 = 61.
  const FOUNDATIONAL_MINERALS = new Set([
    'calcium','magnesium','sodium','potassium','phosphorus','chloride','iron',
    'zinc','copper','manganese','sulfur',
  ]);
  const MAJOR_TRACE_MINERALS = new Set([
    'iodine','selenium','chromium','molybdenum','cobalt','vanadium','boron',
    'fluoride','silica','lithium','nickel','tin','strontium','bromine',
  ]);
  // Everything else in minerals (rare earths + ultra-trace) falls to rare-trace.
  // These are the 36 minerals closed via the plant-derived aggregate-vehicle
  // (DOCT·02) — source-not-quantity per Wallach.

  function mineralTier(name) {
    const n = String(name || '').toLowerCase().trim();
    if (FOUNDATIONAL_MINERALS.has(n)) return 'foundational';
    if (MAJOR_TRACE_MINERALS.has(n)) return 'major-trace';
    return 'rare-trace';
  }

  function normCategory(raw, name) {
    const c = String(raw || '').toLowerCase();
    // Apply 3-tier split for raw "minerals" category using the name
    if (c === 'minerals' || c === 'mineral' || c === 'macro' || c === 'major') {
      return mineralTier(name);
    }
    if (c === 'foundational' || c === 'foundational-minerals') return 'foundational';
    if (c === 'major-trace' || c === 'major_trace' || c === 'majortrace') return 'major-trace';
    if (c === 'rare-trace' || c === 'rare_trace' || c === 'raretrace' || c === 'trace') return 'rare-trace';
    if (c === 'vitamins' || c === 'vitamin') return 'vitamins';
    if (c === 'amino_acids' || c === 'amino-acids' || c === 'aminos' || c === 'amino' || c === 'amino_acid') return 'aminos';
    if (c === 'fatty_acids' || c === 'fatty-acids' || c === 'fatty-acid' || c === 'fatty_acid' || c === 'fattyacid' || c === 'omega') return 'fatty-acids';
    return 'other';
  }

  // Comprehensive symbol map — covers every element in the 61-mineral set
  // plus all the standard vitamins, aminos, and fatty acids.
  const SYMBOL_MAP = {
    // ─ Minerals (61) — proper periodic-table 1-2 letter symbols ─
    'aluminum':'Al', 'arsenic':'As', 'barium':'Ba', 'beryllium':'Be', 'boron':'B',
    'bromine':'Br', 'calcium':'Ca', 'carbon':'C', 'cerium':'Ce', 'cesium':'Cs',
    'chloride':'Cl', 'chlorine':'Cl', 'chromium':'Cr', 'cobalt':'Co', 'copper':'Cu',
    'dysprosium':'Dy', 'erbium':'Er', 'europium':'Eu', 'fluoride':'F', 'fluorine':'F',
    'gadolinium':'Gd', 'gallium':'Ga', 'germanium':'Ge', 'gold':'Au', 'hafnium':'Hf',
    'holmium':'Ho', 'hydrogen':'H', 'iodine':'I', 'iron':'Fe', 'lanthanum':'La',
    'lithium':'Li', 'lutetium':'Lu', 'magnesium':'Mg', 'manganese':'Mn', 'molybdenum':'Mo',
    'neodymium':'Nd', 'nickel':'Ni', 'niobium':'Nb', 'nitrogen':'N', 'oxygen':'O',
    'phosphorus':'P', 'potassium':'K', 'praseodymium':'Pr', 'rhenium':'Re', 'rubidium':'Rb',
    'samarium':'Sm', 'scandium':'Sc', 'selenium':'Se', 'silica':'Si', 'silicon':'Si',
    'silver':'Ag', 'sodium':'Na', 'strontium':'Sr', 'sulfur':'S', 'sulphur':'S',
    'tantalum':'Ta', 'terbium':'Tb', 'thulium':'Tm', 'tin':'Sn', 'titanium':'Ti',
    'vanadium':'V', 'ytterbium':'Yb', 'yttrium':'Y', 'zinc':'Zn', 'zirconium':'Zr',
    // ─ Vitamins ─
    'vitamin a':'A', 'vitamin b1':'B₁', 'thiamine':'B₁', 'thiamin':'B₁',
    'vitamin b2':'B₂', 'riboflavin':'B₂',
    'vitamin b3':'B₃', 'niacin':'B₃', 'niacinamide':'B₃',
    'vitamin b5':'B₅', 'pantothenic acid':'B₅',
    'vitamin b6':'B₆', 'pyridoxine':'B₆',
    'vitamin b7':'B₇', 'biotin':'B₇',
    'vitamin b9':'B₉', 'folate':'B₉', 'folic acid':'B₉',
    'vitamin b12':'B₁₂', 'cobalamin':'B₁₂', 'methylcobalamin':'B₁₂',
    'vitamin c':'C', 'ascorbic acid':'C',
    'vitamin d':'D', 'vitamin d3':'D₃', 'cholecalciferol':'D₃',
    'vitamin e':'E', 'tocopherol':'E',
    'vitamin k':'K', 'vitamin k1':'K₁', 'vitamin k2':'K₂',
    'choline':'Cho', 'inositol':'Ino', 'flavonoid':'Fla', 'flavonoids':'Fla',
    'pabba':'Pa', 'paba':'Pa', 'lipoic acid':'α-La',
    // ─ Amino acids (12 essentials per Wallach) ─
    'histidine':'His', 'isoleucine':'Ile', 'leucine':'Leu', 'lysine':'Lys',
    'methionine':'Met', 'phenylalanine':'Phe', 'threonine':'Thr', 'tryptophan':'Trp',
    'valine':'Val', 'arginine':'Arg', 'cysteine':'Cys', 'cystine':'Cys',
    'tyrosine':'Tyr', 'taurine':'Tau', 'glutamine':'Gln', 'glycine':'Gly',
    // ─ Fatty acids ─
    'omega-3':'ω3', 'omega-6':'ω6', 'omega-7':'ω7', 'omega-9':'ω9',
  };

  function deriveSymbol(name) {
    if (!name) return '?';
    // 1. Normalize: lowercase, strip parens
    const norm = String(name).toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
    // 2. Direct lookup
    if (SYMBOL_MAP[norm]) return SYMBOL_MAP[norm];
    // 3. Prefix lookup (handles "vitamin b12 (cobalamin)" → already stripped to "vitamin b12")
    for (const k of Object.keys(SYMBOL_MAP)) {
      if (norm.startsWith(k)) return SYMBOL_MAP[k];
    }
    // 4. Try the legacy window.essentialSymbol if it exists
    if (typeof window.essentialSymbol === 'function') {
      try {
        const s = window.essentialSymbol(name);
        if (s && s.length <= 4 && s !== '?') return s;
      } catch { /* ignore */ }
    }
    // 5. Fallback: first letter capitalized + second letter lowercase
    const first = norm.split(/\s+/)[0] || '?';
    if (first.length >= 2) return first.charAt(0).toUpperCase() + first.charAt(1).toLowerCase();
    return first.charAt(0).toUpperCase();
  }

  function buildTileId(symbol, name) {
    if (symbol && symbol.length > 0 && symbol !== '?') return 'tile_' + symbol.toLowerCase().replace(/\W+/g, '_');
    return 'tile_' + name.toLowerCase().replace(/\W+/g, '_');
  }

  function readTargets() {
    const el = document.getElementById('essentials-targets-data');
    if (el) {
      try {
        const parsed = JSON.parse(el.textContent || '{}');
        if (parsed && Array.isArray(parsed.essentials)) return parsed.essentials;
      } catch (e) { console.warn('[state/coverage] essentials-targets-data parse error:', e); }
    }
    if (Array.isArray(window.TARGETS_DATA)) return window.TARGETS_DATA;
    return [];
  }

  function recompute() {
    const tiles = [];
    const targets = readTargets();
    let legacyData = {};
    if (typeof window.computeLiveCoverage === 'function') {
      try {
        const result = window.computeLiveCoverage();
        if (result instanceof Map) legacyData = Object.fromEntries(result.entries());
        else if (result && typeof result === 'object') legacyData = result;
      } catch (e) { console.warn('[state/coverage] legacy computeLiveCoverage threw:', e); }
    }
    for (const t of targets) {
      const symbol = deriveSymbol(t.name);
      const tileId = buildTileId(symbol, t.name);
      const lookupKey = String(t.name || '').toLowerCase();
      const legacy = legacyData[lookupKey] || legacyData[tileId] || {};
      const sources = legacy.sources || [];
      tiles.push({
        tileId: tileId,
        category: normCategory(t.category, t.name),
        symbol: symbol,
        name: t.name,
        covered: Boolean(legacy.covered) || sources.length > 0,
        fillPercent: typeof legacy.fillPercent === 'number' ? legacy.fillPercent : 0,
        coveredBy: sources.map(function (s) { return s.productId || s.productName || ''; }).filter(Boolean),
        aggregateVehicle: sources.some(function (s) { return s.viaAggregate === true; }),
      });
    }
    const byCategory = {};
    for (const tile of tiles) {
      const bucket = byCategory[tile.category] || { total: 0, covered: 0 };
      bucket.total += 1;
      if (tile.covered) bucket.covered += 1;
      byCategory[tile.category] = bucket;
    }
    const coveredCount = tiles.filter(function (t) { return t.covered; }).length;
    cachedSnapshot = {
      tiles: tiles, coveredCount: coveredCount, totalCount: tiles.length,
      computedAt: new Date().toISOString(), byCategory: byCategory,
    };
    emit('coverage:recomputed', { coveredCount: coveredCount, totalCount: tiles.length });
    return cachedSnapshot;
  }
  function getOrCompute() { return cachedSnapshot || recompute(); }
  function installRecomputeTrigger() {
    if (wireInstalled) return;
    wireInstalled = true;
    on('regimen:changed', function () { recompute(); });
    onStorageChange(function (key) {
      if (/^rgSlot/.test(key) || key === 'lcRegimen_v1') recompute();
    });
    const original = window.triggerRegimenRerender;
    if (typeof original === 'function') {
      window.triggerRegimenRerender = function () {
        try { original(); } finally { recompute(); }
      };
    }
  }

  // ── views/coverage.ts ───────────────────────────────────────────────────
  const SECTION_DEFS = [
    { category: 'foundational',kicker: 'FOUNDATIONAL · §1', title: 'Foundational Minerals',  subtitle: '// the eleven majors every Wallach protocol opens with',          serialPrefix: 'M·FND' },
    { category: 'major-trace', kicker: 'MAJOR TRACE · §2',  title: 'Major Trace Minerals',    subtitle: '// established RDAs · trace amounts that matter at the gram-scale', serialPrefix: 'M·MJT' },
    { category: 'rare-trace',  kicker: 'RARE TRACE · §3',   title: 'Rare Trace Minerals',     subtitle: '// source-not-quantity · closed via plant-derived aggregate-vehicle', serialPrefix: 'M·RRT' },
    { category: 'vitamins',    kicker: 'VITAMINS · §4',     title: 'Essential Vitamins',      subtitle: '// the sixteen — water + fat soluble',                              serialPrefix: 'V·ESS' },
    { category: 'aminos',      kicker: 'AMINOS · §5',       title: 'Essential Amino Acids',   subtitle: '// the twelve the body cannot synthesize',                          serialPrefix: 'A·ESS' },
    { category: 'fatty-acids', kicker: 'FATTY ACIDS · §6',  title: 'Essential Fatty Acids',   subtitle: '// omega-3 · omega-6 · omega-7 · omega-9',                          serialPrefix: 'F·ESS' },
  ];
  const CATEGORY_LABEL = {
    'minerals':'MINERAL', 'foundational':'FOUNDATIONAL', 'major-trace':'MAJOR TRACE', 'rare-trace':'RARE TRACE',
    'vitamins':'VITAMIN', 'aminos':'AMINO', 'fatty-acids':'FATTY ACID', 'other':'OTHER',
  };

  function escHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function hexSerial(seed) {
    return ((seed * 0x9e3779b9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
  }

  // Strip parenthetical clarifications for the strip display so long names
  // like "Vitamin A (Retinol / Beta-Carotene)" become "Vitamin A". The full
  // form stays in the tooltip and the data attributes.
  function stripParens(name) {
    return String(name || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
  }

  function renderTile(tile, idx) {
    const symbolDisplay = tile.symbol || tile.name.slice(0, 2).toUpperCase();
    const stripName = stripParens(tile.name);
    const fillClamped = Math.max(0, Math.min(1, tile.fillPercent));
    const fillBarWidth = Math.round(fillClamped * 100);
    const stateClass = tile.aggregateVehicle ? 'pt-tile--agg'
      : tile.covered ? 'pt-tile--covered' : 'pt-tile--gap';
    const sourcesAttr = tile.coveredBy.length > 0 ? ' data-sources="' + escHTML(tile.coveredBy.join('|')) + '"' : '';
    return '<button class="pt-tile ' + stateClass + '" data-tile-id="' + escHTML(tile.tileId)
      + '" data-tile-name="' + escHTML(tile.name) + '" data-tile-symbol="' + escHTML(symbolDisplay)
      + '" data-tile-category="' + escHTML(tile.category) + '"' + sourcesAttr
      + ' title="' + escHTML(tile.name) + ' — ' + (tile.covered ? 'covered' : 'gap')
      + (tile.aggregateVehicle ? ' (via PDM)' : '') + '">'
      + '<span class="pt-tile__num">' + pad2(idx + 1) + '</span>'
      + '<span class="pt-tile__sym">' + escHTML(symbolDisplay) + '</span>'
      + '<span class="pt-tile__strip"><span class="pt-tile__name">' + escHTML(stripName) + '</span></span>'
      + '<span class="pt-tile__fill" style="width: ' + fillBarWidth + '%;"></span>'
      + '</button>';
  }

  // MAIN_SECTION_DEFS — the 4 top-level Wallach categories per the v3.2 mockup.
  // Minerals is special: it nests three sub-sections (Foundational / Major Trace
  // / Rare Trace) using the category strings we already classify into.
  const MAIN_SECTION_DEFS = [
    { id: 'minerals',    num: '§1', title: 'Minerals',       sub: '// 60 essentials · 11 foundational + 14 major trace + 35 rare trace',
      subsections: [
        { category: 'foundational', label: 'Foundational',  rank: '01', hint: 'every Wallach protocol opens here · supplement direct' },
        { category: 'major-trace',  label: 'Major Trace',   rank: '02', hint: 'established RDAs · trace amounts that matter' },
        { category: 'rare-trace',   label: 'Rare Trace',    rank: '03', hint: 'source-not-quantity · closed via plant-derived aggregate vehicle' },
      ],
      gridClass: 'essentials-grid--minerals',
    },
    { id: 'vitamins',    num: '§2', title: 'Vitamins',       sub: '// the sixteen — water + fat soluble',
      subsections: null, category: 'vitamins',
      gridClass: 'essentials-grid--vitamins',
    },
    { id: 'aminos',      num: '§3', title: 'Amino Acids',    sub: '// the twelve the body cannot synthesize',
      subsections: null, category: 'aminos',
      gridClass: 'essentials-grid--aminos',
    },
    { id: 'fatty-acids', num: '§4', title: 'Fatty Acids',    sub: '// omega-3 · omega-6 · omega-7 · omega-9',
      subsections: null, category: 'fatty-acids',
      gridClass: 'essentials-grid--fats',
    },
  ];

  function renderSubsection(sub, tiles) {
    const subTiles = tiles.filter(function (t) { return t.category === sub.category; });
    if (subTiles.length === 0) return '';
    const covered = subTiles.filter(function (t) { return t.covered; }).length;
    return '<section class="essentials-subsection" data-subsection="' + sub.category + '">'
      + '<div class="essentials-subsection__label">'
      + '<span class="essentials-subsection__rank">' + escHTML(sub.rank) + '</span>'
      + '<span>' + escHTML(sub.label) + '</span>'
      + '<span class="essentials-subsection__count">' + covered + ' / ' + subTiles.length + '</span>'
      + '<span class="essentials-subsection__hint">// ' + escHTML(sub.hint) + '</span>'
      + '</div>'
      + '<div class="essentials-grid essentials-grid--minerals">'
      + subTiles.map(function (t, i) { return renderTile(t, i); }).join('')
      + '</div></section>';
  }

  function renderMainSection(main, allTiles) {
    let myTiles;
    if (main.subsections) {
      const cats = main.subsections.map(function (s) { return s.category; });
      myTiles = allTiles.filter(function (t) { return cats.indexOf(t.category) >= 0; });
    } else {
      myTiles = allTiles.filter(function (t) { return t.category === main.category; });
    }
    if (myTiles.length === 0) return '';
    const covered = myTiles.filter(function (t) { return t.covered; }).length;

    const inner = main.subsections
      ? main.subsections.map(function (s) { return renderSubsection(s, allTiles); }).join('')
      : '<div class="essentials-grid ' + main.gridClass + '">'
        + myTiles.map(function (t, i) { return renderTile(t, i); }).join('')
        + '</div>';

    return '<section class="essentials-section" data-section="' + main.id + '">'
      + '<header class="essentials-section__head">'
      + '<span class="essentials-section__num">' + escHTML(main.num) + '</span>'
      + '<h3 class="essentials-section__title">' + escHTML(main.title) + '</h3>'
      + '<div class="essentials-section__sub">' + escHTML(main.sub) + '</div>'
      + '<div class="essentials-section__stat"><strong>' + covered + '</strong> / ' + myTiles.length + ' covered</div>'
      + '</header>'
      + '<div class="essentials-section__divider"></div>'
      + inner
      + '</section>';
  }

  function renderShell(snap) {
    const sectionsHTML = MAIN_SECTION_DEFS.map(function (m) {
      return renderMainSection(m, snap.tiles);
    }).join('');
    return '<div class="coverage-main">'
      // ─ Hero card with border-travel + scan-line ambient motion
      + '<section class="coverage-hero ds-border-travel">'
      + '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<header class="coverage-hero__head"><div>'
      + '<div class="coverage-hero__kicker">Your essentials · '
      + '<span class="ds-cipher" data-cipher-set="numfrac">' + snap.totalCount + '</span>'
      + ' minerals + vitamins + amino acids + fats</div>'
      + '<h2 class="coverage-hero__title">Coverage'
      + '<em>// live from your active regimen · <span class="ds-cipher" data-cipher-set="hexa">CV·' + hexSerial(snap.coveredCount + snap.totalCount) + '</span></em>'
      + '</h2></div>'
      + '<div class="coverage-stat">'
      + '<span class="coverage-stat__num">' + snap.coveredCount + '</span>'
      + '<span class="coverage-stat__den">/ ' + snap.totalCount + '</span>'
      + '<span class="coverage-stat__label">essentials<br>covered</span>'
      + '</div></header>'
      // ─ Periodic host with the 4 main sections
      + '<div class="periodic-host">'
      + '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<div class="essentials-host">' + sectionsHTML + '</div>'
      + '</div>'
      + '</section></div>';
  }

  const COVERAGE_CSS = [
    // ─── Coverage hero card — wraps the whole workspace ───────────────────
    '.coverage-main{display:flex;flex-direction:column;gap:var(--ds-space-6);padding:var(--ds-space-6)}',
    '.coverage-hero{background:var(--ds-paper);border-radius:var(--ds-radius-md);padding:var(--ds-space-7);box-shadow:var(--ds-elev-2);position:relative;overflow:hidden}',
    '.coverage-hero__head{display:grid;grid-template-columns:1fr auto;gap:var(--ds-space-5);align-items:end;margin-bottom:var(--ds-space-6);padding-bottom:var(--ds-space-5);border-bottom:1px solid var(--ds-rule-soft);position:relative}',
    '.coverage-hero__head::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 6%,var(--ds-accent) 13%,transparent 15%,transparent 85%,var(--ds-tech) 88%,var(--ds-tech) 92%,transparent 95%)}',
    '.coverage-hero__kicker{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-3)}',
    '.coverage-hero__kicker::before{content:"";width:16px;height:1px;background:var(--ds-accent)}',
    '.coverage-hero__title{font-family:var(--ds-font-display-interface);font-size:clamp(1.8rem,2.4vw,2.4rem);font-weight:700;color:var(--ds-ink);letter-spacing:0;text-transform:uppercase;margin:0;line-height:1.05}',
    '.coverage-hero__title em{font-style:normal;font-weight:400;color:var(--ds-accent-deep);letter-spacing:.02em;text-transform:none;font-family:var(--ds-font-mono);font-size:.5em;display:block;margin-top:var(--ds-space-2)}',
    // ─── Coverage stat (the kill-shot slab) ───────────────────────────────
    '.coverage-stat{display:flex;align-items:baseline;gap:var(--ds-space-2);background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);padding:var(--ds-space-4) var(--ds-space-5);border-radius:var(--ds-radius-sm);color:var(--ds-paper);position:relative;overflow:hidden}',
    '.coverage-stat::before{content:"";position:absolute;top:50%;left:30%;width:180px;height:180px;transform:translate(-50%,-50%);background:radial-gradient(circle,var(--ds-accent) 0%,transparent 70%);opacity:.25;pointer-events:none;animation:ds-stat-pulse 4s ease-in-out infinite}',
    '@keyframes ds-stat-pulse{0%,100%{opacity:.22;transform:translate(-50%,-50%) scale(1)}50%{opacity:.32;transform:translate(-50%,-50%) scale(1.1)}}',
    '@keyframes ds-numeric-glow{0%,100%{text-shadow:0 0 24px rgba(255,126,60,.45)}50%{text-shadow:0 0 36px rgba(255,126,60,.65)}}',
    '.coverage-stat__num{font-family:var(--ds-font-display-artifact);font-size:3rem;font-weight:400;line-height:1;color:var(--ds-accent-bright);letter-spacing:.02em;position:relative;animation:ds-numeric-glow 4s ease-in-out infinite}',
    '.coverage-stat__den{font-family:var(--ds-font-display-artifact);font-size:1.5rem;font-weight:400;color:var(--ds-ink-faint);position:relative}',
    '.coverage-stat__label{margin-left:var(--ds-space-3);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-accent-soft);line-height:1.3;position:relative}',
    // ─── Periodic host + essentials host (the scan-line carrier) ──────────
    '.periodic-host{position:relative;overflow:hidden;padding:var(--ds-space-3) 0;margin-bottom:var(--ds-space-3)}',
    '.essentials-host{position:relative;padding:var(--ds-space-3) 0}',
    // ─── Main section header (the 4 mockup-aligned sections) ──────────────
    '.essentials-section{margin-bottom:var(--ds-space-7)}',
    '.essentials-section:last-child{margin-bottom:0}',
    '.essentials-section__head{display:grid;grid-template-columns:auto auto 1fr auto;gap:var(--ds-space-4);align-items:baseline;margin-bottom:var(--ds-space-2);padding:0 2px}',
    '.essentials-section__num{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-xl);color:var(--ds-accent);letter-spacing:.05em;line-height:1;text-shadow:0 0 12px rgba(255,126,60,.3)}',
    '.essentials-section__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.04em;text-transform:uppercase;margin:0;line-height:1}',
    '.essentials-section__sub{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.essentials-section__stat{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-accent-deep);font-weight:600}',
    '.essentials-section__stat strong{font-family:var(--ds-font-display-artifact);font-weight:400;color:var(--ds-accent);font-size:1.15em}',
    // ─── Section divider — broken hairline + corner crosshairs ────────────
    '.essentials-section__divider{position:relative;height:1px;background:linear-gradient(to right,var(--ds-rule) 0%,var(--ds-rule) 20%,transparent 22%,transparent 28%,var(--ds-accent) 30%,var(--ds-accent) 36%,transparent 38%,transparent 100%);margin-bottom:var(--ds-space-4)}',
    '.essentials-section__divider::before,.essentials-section__divider::after{content:"";position:absolute;width:6px;height:6px;border:1px solid var(--ds-tech)}',
    '.essentials-section__divider::before{left:0;top:-3px;border-right:0;border-bottom:0}',
    '.essentials-section__divider::after{right:0;top:-3px;border-left:0;border-bottom:0}',
    // ─── Sub-section (used inside Minerals for Foundational/Major/Rare) ───
    '.essentials-subsection{margin-bottom:var(--ds-space-5)}',
    '.essentials-subsection:last-child{margin-bottom:0}',
    '.essentials-subsection__label{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);display:flex;align-items:baseline;gap:var(--ds-space-2);margin:0 0 var(--ds-space-2);font-weight:600}',
    '.essentials-subsection__rank{font-family:var(--ds-font-display-artifact);font-size:.9rem;font-weight:400;color:var(--ds-accent);letter-spacing:.05em}',
    '.essentials-subsection__count{color:var(--ds-accent-deep);font-weight:700}',
    '.essentials-subsection__hint{color:var(--ds-ink-faint);font-style:normal;font-weight:500;margin-left:auto}',
    // ─── Grid density variants per category ───────────────────────────────
    '.essentials-grid{display:grid;gap:var(--ds-space-2)}',
    '.essentials-grid--minerals{grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:4px}',
    '.essentials-grid--vitamins{grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}',
    '.essentials-grid--aminos{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px}',
    '.essentials-grid--fats{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:var(--ds-space-3)}',
    '.pt-tile{position:relative;overflow:hidden;cursor:pointer;background:var(--ds-paper-light);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-sm);padding:var(--ds-space-2) var(--ds-space-1) 0;display:flex;flex-direction:column;align-items:center;aspect-ratio:1/1.2;transition:all var(--ds-motion-fast) var(--ds-ease-out);text-align:center}',
    '.pt-tile:hover{border-color:var(--ds-accent);transform:translateY(-1px);box-shadow:0 4px 12px -3px rgba(255,126,60,.25);z-index:2}',
    '.pt-tile__num{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:.05em;color:var(--ds-ink-faint);font-weight:600;position:absolute;top:4px;right:5px;line-height:1}',
    '.pt-tile__sym{font-family:Playfair Display,Georgia,serif;font-size:1.65rem;line-height:1;color:var(--ds-ink);letter-spacing:.02em;margin-top:var(--ds-space-2);margin-bottom:var(--ds-space-1)}',
    '.pt-tile__strip{margin-top:auto;margin-left:-8px;margin-right:-8px;width:calc(100% + 16px);background:var(--ds-ink);color:var(--ds-paper-light);padding:5px 3px;font-family:var(--ds-font-display-interface);font-size:9.5px;line-height:1.15;font-weight:700;letter-spacing:.03em;text-transform:uppercase;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:24px}',
    '.pt-tile__fill{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);box-shadow:0 0 6px var(--ds-accent-soft)}',
    '.pt-tile--gap{background:var(--ds-paper-light)}',
    '.pt-tile--gap .pt-tile__strip{background:var(--ds-ink-medium)}',
    '.pt-tile--covered{background:var(--ds-status-ok-soft)}',
    '.pt-tile--covered .pt-tile__sym{color:var(--ds-status-ok)}',
    '.pt-tile--covered .pt-tile__strip{background:var(--ds-status-ok)}',
    '.pt-tile--agg{background:linear-gradient(135deg,var(--ds-accent-wash) 0%,var(--ds-paper-light) 100%)}',
    '.pt-tile--agg .pt-tile__sym{color:var(--ds-accent-deep)}',
    '.pt-tile--agg .pt-tile__strip{background:linear-gradient(90deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%)}',
    '.pt-tile--agg .pt-tile__fill{display:none}',
    // ─── Legacy migration banner ──────────────────────────────────────────
    '.legacy-banner{margin:0 var(--ds-space-6) var(--ds-space-4);padding:var(--ds-space-4) var(--ds-space-5);background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);color:var(--ds-paper);border-radius:var(--ds-radius-md);position:relative;overflow:hidden;box-shadow:var(--ds-elev-2)}',
    '.legacy-banner::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 8%,var(--ds-accent) 18%,transparent 22%,transparent 78%,var(--ds-tech) 82%,var(--ds-tech) 92%,transparent 95%)}',
    '.legacy-banner__head{display:flex;align-items:center;gap:var(--ds-space-3);margin-bottom:var(--ds-space-2)}',
    '.legacy-banner__kicker{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent-bright);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.legacy-banner__kicker::before{content:"";width:8px;height:8px;background:var(--ds-status-warn);border-radius:50%;box-shadow:0 0 8px var(--ds-status-warn-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.legacy-banner__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-paper);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.15}',
    '.legacy-banner__body{font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);font-weight:500;color:var(--ds-paper);line-height:1.4;margin:0;opacity:.85}',
    '.legacy-banner__body strong{color:var(--ds-accent-bright);font-weight:700}',
  ].join('\n');

  let coverageStyleInjected = false;
  function injectCoverageStyles() {
    if (coverageStyleInjected) return;
    coverageStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/coverage.ts');
    style.textContent = COVERAGE_CSS;
    document.head.appendChild(style);
  }

  function _covEssentialByName(name) {
    const all = readTargets();
    const norm = String(name || '').toLowerCase().trim();
    return all.find(function (e) { return String(e.name || '').toLowerCase().trim() === norm; }) || null;
  }
  function _covCoveringProducts(tileName) {
    // Walk legacy regimen items + check which contain this essential nutrient.
    // Best-effort: looks at each item's label.nutrients[].name for substring match.
    let items = [];
    try { const r = JSON.parse(localStorage.getItem('lcRegimen_v1') || 'null'); items = (r && Array.isArray(r.items)) ? r.items : []; }
    catch { items = []; }
    const norm = String(tileName || '').toLowerCase();
    const matches = [];
    items.forEach(function (it) {
      const label = it.label || {};
      const nutrients = Array.isArray(label.nutrients) ? label.nutrients : [];
      const hit = nutrients.some(function (n) {
        const nn = String((n && n.name) || '').toLowerCase();
        return nn.includes(norm) || norm.includes(nn);
      });
      if (hit) matches.push(label.name || '(unnamed)');
    });
    return matches;
  }
  function _covRenderFlyout(essential) {
    if (!essential) return '';
    const sym = deriveSymbol(essential.name);
    const cat = essential.category || 'unknown';
    const stance = essential.wallach_stance || {};
    const citation = stance.citation || '— no citation on file —';
    const stanceBody = stance.stance || '— no Wallach stance recorded for this essential yet —';
    const target = essential.target;
    const targetText = target ? (typeof target === 'object' ? JSON.stringify(target) : String(target)) : '—';
    const covering = _covCoveringProducts(essential.name);
    const coveringHTML = covering.length === 0
      ? '<div class="cov-fly__empty">— not currently covered by any regimen item —</div>'
      : '<div class="cov-fly__products">' + covering.map(function (p) {
          return '<span class="cov-fly__product-chip">' + escHTML(p) + '</span>';
        }).join('') + '</div>';
    return '<div class="cov-fly">'
      + '<header class="cov-fly__head">'
      + '<div class="cov-fly__sym-row">'
      + '<div class="cov-fly__sym">' + escHTML(sym) + '</div>'
      + '<div class="cov-fly__name-block">'
      + '<h3 class="cov-fly__name">' + escHTML(essential.name) + '</h3>'
      + '<div class="cov-fly__cat">' + escHTML(cat.toUpperCase()) + '</div>'
      + '</div></div>'
      + '<button class="cov-fly__close" data-cov-fly-close>×</button>'
      + '</header>'
      + '<div class="cov-fly__body">'
      + '<div class="cov-fly__section-head">WALLACH SAYS</div>'
      + '<p class="cov-fly__stance">' + escHTML(stanceBody) + '</p>'
      + '<div class="cov-fly__cite">CITED · <strong>' + escHTML(citation) + '</strong></div>'
      + '<div class="cov-fly__section-head">TARGET</div>'
      + '<div class="cov-fly__target">' + escHTML(targetText) + '</div>'
      + '<div class="cov-fly__section-head">FOUND IN YOUR REGIMEN</div>'
      + coveringHTML
      + '</div></div>';
  }
  function _covInjectFlyoutCSS() {
    const FLY_CSS = [
      '.cov-fly{position:fixed;top:90px;right:32px;width:440px;max-height:75vh;background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 0 0 1px var(--ds-accent),0 30px 70px -20px rgba(26,22,18,.40),0 12px 30px -12px rgba(255,126,60,.20);z-index:200;display:flex;flex-direction:column;overflow:hidden}',
      '.cov-fly__head{padding:var(--ds-space-5) var(--ds-space-6) var(--ds-space-4);background:linear-gradient(135deg,var(--ds-paper-darker) 0%,var(--ds-paper) 100%);border-bottom:1px solid var(--ds-rule);display:grid;grid-template-columns:1fr auto;gap:var(--ds-space-3);align-items:start}',
      '.cov-fly__sym-row{display:flex;align-items:baseline;gap:var(--ds-space-3)}',
      '.cov-fly__sym{font-family:Playfair Display,Georgia,serif;font-size:2.4rem;color:var(--ds-ink);letter-spacing:.02em;line-height:1}',
      '.cov-fly__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.1}',
      '.cov-fly__cat{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);color:var(--ds-tech);margin-top:4px;text-transform:uppercase}',
      '.cov-fly__close{width:32px;height:32px;background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink-soft);font-size:1.1rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-mono)}',
      '.cov-fly__close:hover{border-color:var(--ds-ink);color:var(--ds-ink)}',
      '.cov-fly__body{padding:var(--ds-space-4) var(--ds-space-6);overflow-y:auto;display:flex;flex-direction:column;gap:var(--ds-space-3)}',
      '.cov-fly__section-head{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2);margin-top:var(--ds-space-2)}',
      '.cov-fly__section-head::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
      '.cov-fly__stance{font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);font-weight:500;color:var(--ds-ink-medium);line-height:1.5;margin:0}',
      '.cov-fly__cite{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);background:var(--ds-accent-wash);padding:var(--ds-space-2) var(--ds-space-3);border-radius:var(--ds-radius-xs);border-left:2px solid var(--ds-accent)}',
      '.cov-fly__cite strong{color:var(--ds-accent-deep);font-weight:600}',
      '.cov-fly__target{font-family:var(--ds-font-mono);font-size:var(--ds-text-sm);color:var(--ds-ink);background:var(--ds-paper-deep);padding:var(--ds-space-2) var(--ds-space-3);border-radius:var(--ds-radius-xs);font-weight:600}',
      '.cov-fly__products{display:flex;flex-wrap:wrap;gap:4px}',
      '.cov-fly__product-chip{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-tech);background:var(--ds-tech-wash);padding:3px 8px;border-radius:var(--ds-radius-pill);font-weight:600}',
      '.cov-fly__empty{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);text-align:center;padding:var(--ds-space-3)}',
    ].join('\n');
    if (document.querySelector('style[data-injected-by="cov-fly"]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'cov-fly');
    style.textContent = FLY_CSS;
    document.head.appendChild(style);
  }

  function mountCoverage(container) {
    injectCoverageStyles();
    _covInjectFlyoutCSS();
    let flyoutEl = null;
    function renderInto(snap) { container.innerHTML = renderShell(snap); }
    renderInto(getOrCompute());
    const unsubscribe = on('coverage:recomputed', function () { renderInto(recompute()); });
    function closeFlyout() {
      if (flyoutEl && flyoutEl.parentNode) flyoutEl.parentNode.removeChild(flyoutEl);
      flyoutEl = null;
    }
    function openFlyoutFor(name) {
      closeFlyout();
      const essential = _covEssentialByName(name);
      if (!essential) return;
      flyoutEl = document.createElement('div');
      flyoutEl.innerHTML = _covRenderFlyout(essential);
      const inner = flyoutEl.firstElementChild;
      document.body.appendChild(inner);
      flyoutEl = inner;
    }
    function clickHandler(ev) {
      const target = ev.target;
      const tile = target && target.closest ? target.closest('.pt-tile') : null;
      if (tile) {
        const name = tile.getAttribute('data-tile-name');
        if (name) openFlyoutFor(name);
        return;
      }
    }
    function bodyClickHandler(ev) {
      // Close flyout if user clicks outside it
      if (!flyoutEl) return;
      if (flyoutEl.contains(ev.target)) {
        if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute('data-cov-fly-close')) {
          closeFlyout();
        }
        return;
      }
      // Clicked outside the flyout — but allow tile clicks to re-open with new essential
      const tile = ev.target && ev.target.closest ? ev.target.closest('.pt-tile') : null;
      if (!tile) closeFlyout();
    }
    container.addEventListener('click', clickHandler);
    document.body.addEventListener('click', bodyClickHandler);
    return {
      unmount: function () {
        unsubscribe();
        container.removeEventListener('click', clickHandler);
        document.body.removeEventListener('click', bodyClickHandler);
        closeFlyout();
        container.innerHTML = '';
      },
    };
  }

  // ── state/regimen.ts (Round 3 chokepoint migration) ─────────────────────
  // 5 §31-protected mutation helpers, native implementations. Bridged via
  // window.* AFTER legacy boot so cross-IIFE callers transparently route here.
  const REGIMEN_KEY        = 'lcRegimen_v1';
  const RG_OVERRIDES_KEY   = 'rgOverrides_v1';
  const RG_MANUAL_KEY      = 'rgManualItems_v1';
  const RG_REMOVED_KEY     = 'rgRemoved_v1';
  const RG_USER_GOALS_KEY  = 'rgUserGoals_v1';

  function _lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {
      console.warn('[state/regimen] lsSet failed for ' + key + ':', e);
    }
  }
  function _fireLegacyTrigger(label) {
    if (typeof window.triggerRegimenRerender === 'function') {
      try { window.triggerRegimenRerender(label); }
      catch (e) { console.warn('[state/regimen] triggerRegimenRerender threw:', e); }
    }
  }

  function persistRegimen(r, sourceLabel) {
    _lsSet(REGIMEN_KEY, r);
    _fireLegacyTrigger(sourceLabel || 'persistRegimen');
    emit('regimen:changed', { slotId: REGIMEN_KEY, reason: 'restore' });
  }
  function saveRgOverride(id, patch) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(RG_OVERRIDES_KEY) || '{}') || {}; }
    catch (e) { all = {}; }
    const key = String(id);
    all[key] = Object.assign(all[key] || {}, patch || {});
    _lsSet(RG_OVERRIDES_KEY, all);
    _fireLegacyTrigger('saveRgOverride:' + id);
    emit('regimen:changed', { slotId: RG_OVERRIDES_KEY, reason: 'dose-edit' });
  }
  function saveRgManual(items) {
    _lsSet(RG_MANUAL_KEY, items);
    _fireLegacyTrigger('saveRgManual');
    emit('regimen:changed', { slotId: RG_MANUAL_KEY, reason: 'add' });
  }
  function saveRgRemoved(setOfIds) {
    const arr = setOfIds instanceof Set ? Array.from(setOfIds) : (Array.isArray(setOfIds) ? setOfIds : []);
    _lsSet(RG_REMOVED_KEY, arr);
    _fireLegacyTrigger('saveRgRemoved');
    emit('regimen:changed', { slotId: RG_REMOVED_KEY, reason: 'remove' });
  }
  function saveRgUserGoals(goalsArray) {
    const cleaned = Array.isArray(goalsArray)
      ? goalsArray.filter(function (g) { return typeof g === 'string' && g.length > 0; })
      : [];
    _lsSet(RG_USER_GOALS_KEY, cleaned);
    _fireLegacyTrigger('saveRgUserGoals');
    emit('regimen:changed', { slotId: RG_USER_GOALS_KEY, reason: 'add' });
  }
  function installRegimenBridges() {
    window.persistRegimen    = persistRegimen;
    window.saveRgOverride    = saveRgOverride;
    window.saveRgManual      = saveRgManual;
    window.saveRgRemoved     = saveRgRemoved;
    window.saveRgUserGoals   = saveRgUserGoals;
  }


  // ── views/regimen.ts (Round 3·B) ────────────────────────────────────────
  function _loadRegimen() {
    try { const r = JSON.parse(localStorage.getItem(REGIMEN_KEY) || 'null'); return (r && Array.isArray(r.items)) ? r : { items: [] }; }
    catch { return { items: [] }; }
  }
  function _loadOverrides() {
    try { const r = JSON.parse(localStorage.getItem(RG_OVERRIDES_KEY) || '{}'); return (r && typeof r === 'object' && !Array.isArray(r)) ? r : {}; }
    catch { return {}; }
  }
  function _loadRemoved() {
    try { const r = JSON.parse(localStorage.getItem(RG_REMOVED_KEY) || '[]'); return new Set(Array.isArray(r) ? r : []); }
    catch { return new Set(); }
  }
  function _readSlotMeta() {
    if (typeof window.readSlotMeta === 'function') { try { return window.readSlotMeta() || {}; } catch { return {}; } }
    return {};
  }
  function _hex(seed) { return ((seed * 0x9e3779b9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4); }

  function _renderItemRow(item, overrides) {
    const id = String(item.id);
    const name = (item.label && item.label.name) || '(unnamed)';
    const ovr = overrides[id] || {};
    const dose = ovr.dose != null ? ovr.dose : 1;
    const perDay = ovr.perDay != null ? ovr.perDay : 1;
    const unit = String(ovr.unit || 'SERVING');
    const scaling = ovr.scaling != null ? ovr.scaling : 1.0;
    const iconChar = (name || '?').charAt(0).toUpperCase();
    const pips = Array(10).fill(0).map(function (_, i) { return i < 3 ? '<span class="contrib-pip fill"></span>' : '<span class="contrib-pip"></span>'; }).join('');
    return '<div class="regimen-item-row" data-item-id="' + escHTML(id) + '">'
      + '<div class="regimen-item-row__icon">' + escHTML(iconChar) + '</div>'
      + '<div class="regimen-item-row__body">'
      + '<h4 class="regimen-item-row__name">' + escHTML(name) + '</h4>'
      + '<div class="regimen-item-row__contrib"><span class="regimen-item-row__contrib-label">CONTRIBUTES</span>' + pips + '</div>'
      + '</div>'
      + '<div class="dose-block">'
      + '<input class="dose-input" type="text" value="' + escHTML(dose) + '" data-dose-field="dose" />'
      + '<span class="dose-unit dose-unit--label">' + escHTML(unit) + '</span>'
      + '<span class="dose-sep">×</span>'
      + '<input class="dose-input" type="text" value="' + escHTML(perDay) + '" data-dose-field="perDay" />'
      + '<span class="dose-unit dose-unit--label">PER DAY</span>'
      + '</div>'
      + '<span class="scaling">×' + Number(scaling).toFixed(1) + '</span>'
      + '<button class="btn-remove" data-action="remove" title="Remove">×</button>'
      + '</div>';
  }

  function _renderSlotCard(num, data, isActive) {
    if (!data || !data.label) {
      return '<article class="slot-card empty" data-slot-num="' + num + '">'
        + '<div class="slot-card__empty-mark">+</div>'
        + '<div class="slot-card__empty-label">EMPTY SLOT</div></article>';
    }
    const serial = _hex(num * 7);
    const stats = data.stats || {};
    const supps = stats.supplements || 0;
    const covered = stats.essentialsCovered || 0;
    const total = stats.essentialsTotal || 92;
    let stamp = '—';
    if (data.lastEdited) {
      try { stamp = 'EDIT ' + new Date(data.lastEdited).toLocaleDateString(); }
      catch { stamp = 'EDIT ' + data.lastEdited; }
    }
    const numStr = num < 10 ? '0' + num : String(num);
    const activeMark = isActive ? '<span class="ds-scan-line" aria-hidden="true"></span>' : '';
    return '<article class="slot-card ' + (isActive ? 'active ds-border-travel' : '') + '" data-slot-num="' + num + '">'
      + activeMark
      + '<div class="slot-card__serial">' + (isActive ? '● ' : '')
      + '<span class="ds-cipher" data-cipher-set="hexa">' + numStr + '·' + serial + '</span>'
      + (isActive ? ' · ACTIVE' : '') + '</div>'
      + '<div class="slot-card__num">' + numStr + '</div>'
      + '<h3 class="slot-card__name">' + escHTML(data.label) + '</h3>'
      + '<div class="slot-card__items">' + supps + ' items · <span class="slot-card__coverage">' + covered + '</span>/' + total + '</div>'
      + '<div class="slot-card__stamp">' + escHTML(stamp) + '</div></article>';
  }

  function _renderRegimenShell() {
    const meta = _readSlotMeta();
    const activeNum = meta.currentSlot || 1;
    const regimen = _loadRegimen();
    const overrides = _loadOverrides();
    const removed = _loadRemoved();
    const visibleItems = regimen.items.filter(function (it) { return !removed.has(it.id); });

    const slotsHTML = [1, 2, 3, 4, 5].map(function (n) {
      return _renderSlotCard(n, meta['slot' + n], n === activeNum);
    }).join('');

    const activeSlot = meta['slot' + activeNum];
    const activeName = (activeSlot && activeSlot.label) || 'Active Regimen';
    const stats = (activeSlot && activeSlot.stats) || {};
    const covered = stats.essentialsCovered || 0;
    const total = stats.essentialsTotal || 92;
    const numStr = activeNum < 10 ? '0' + activeNum : String(activeNum);

    const itemsHTML = visibleItems.length === 0
      ? '<div class="active-slot__empty">— no items in this slot yet —</div>'
      : visibleItems.map(function (it) { return _renderItemRow(it, overrides); }).join('');

    return '<div class="ws-regimen"><div class="regimen-grid"><div class="regimen-main">'
      + '<section class="slots-showcase">'
      + '<header class="slots-showcase__head"><div>'
      + '<div class="slots-showcase__kicker">YOUR CARTRIDGES · 5 SLOTS · '
      + '<span class="ds-cipher" data-cipher-set="hexa">' + numStr + '·' + _hex(activeNum * 7) + '</span> ACTIVE</div>'
      + '<h2 class="slots-showcase__title">CARTRIDGES <em>// each slot is a standalone protocol — save, switch, share</em></h2>'
      + '</div><button class="slots-showcase__new" data-action="new-slot">+ NEW CARTRIDGE</button></header>'
      + '<div class="slots-grid">' + slotsHTML + '</div></section>'
      + '<section class="active-slot">'
      + '<header class="active-slot__head">'
      + '<div class="active-slot__eyebrow"><span class="pulse-dot"></span>EDITING · SLOT '
      + '<span class="ds-cipher" data-cipher-set="hexa">' + numStr + '·' + _hex(activeNum * 7) + '</span></div>'
      + '<div class="active-slot__title-row"><div>'
      + '<h2 class="active-slot__title">' + escHTML(activeName) + '</h2>'
      + '<div class="active-slot__meta"><span><strong>' + visibleItems.length + '</strong> items</span><span>·</span><span>SYNCED</span></div>'
      + '</div><div class="active-slot__stat">'
      + '<span class="active-slot__stat-num">' + covered + '</span>'
      + '<span class="active-slot__stat-den">/ ' + total + '</span>'
      + '<span class="active-slot__stat-label">essentials<br>covered</span></div></div></header>'
      + '<div class="active-slot__items">' + itemsHTML + '</div>'
      + '<div class="active-slot__actions">'
      + '<button class="cart-action cart-action--primary" data-action="add-item"><span class="cart-action__glyph">+</span>ADD ITEM</button>'
      + '<button class="cart-action" data-action="save"><span class="cart-action__glyph">⊕</span>SAVE</button>'
      + '<button class="cart-action" data-action="duplicate"><span class="cart-action__glyph">⎘</span>DUPLICATE</button>'
      + '<span class="cart-action__spacer"></span>'
      + '<button class="cart-action" data-action="import"><span class="cart-action__glyph">⇡</span>IMPORT</button>'
      + '<button class="cart-action" data-action="export"><span class="cart-action__glyph">⇣</span>EXPORT</button>'
      + '<button class="cart-action" data-action="vault"><span class="cart-action__glyph">⌭</span>VAULT</button>'
      + '</div></section></div>'
      + '<aside class="regimen-side">'
      + '<section class="side-panel"><header class="side-panel__head">'
      + '<div class="side-panel__eyebrow">RECOMMENDATIONS · ROUND 3·B PLACEHOLDER</div>'
      + '<h3 class="side-panel__title">Recommendations</h3></header>'
      + '<div class="side-panel__list"><div class="side-panel__empty">— wired in polish pass · pull from legacy goal-driven engine —</div></div></section>'
      + '<section class="side-panel"><header class="side-panel__head">'
      + '<div class="side-panel__eyebrow">WISHLIST · ROUND 3·B PLACEHOLDER</div>'
      + '<h3 class="side-panel__title">Wishlist</h3></header>'
      + '<div class="side-panel__list"><div class="side-panel__empty">— wired in polish pass —</div></div></section>'
      + '</aside></div></div>';
  }

  const REGIMEN_CSS = [
    '.ws-regimen{padding:var(--ds-space-6)}',
    '.regimen-grid{display:grid;grid-template-columns:1fr 380px;gap:var(--ds-space-6)}',
    '.regimen-main{display:flex;flex-direction:column;gap:var(--ds-space-6);min-width:0}',
    '.slots-showcase{background:var(--ds-paper);border-radius:var(--ds-radius-md);padding:var(--ds-space-6);box-shadow:var(--ds-elev-2);position:relative;overflow:hidden}',
    '.slots-showcase__head{display:grid;grid-template-columns:1fr auto;align-items:end;gap:var(--ds-space-4);margin-bottom:var(--ds-space-5);padding-bottom:var(--ds-space-4);border-bottom:1px solid var(--ds-rule-soft)}',
    '.slots-showcase__kicker{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-3)}',
    '.slots-showcase__kicker::before{content:"";width:16px;height:1px;background:var(--ds-accent)}',
    '.slots-showcase__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-2xl);font-weight:700;color:var(--ds-ink);text-transform:uppercase;margin:0;line-height:1}',
    '.slots-showcase__title em{font-style:normal;font-weight:400;color:var(--ds-accent-deep);font-family:var(--ds-font-mono);font-size:.55em;display:block;margin-top:var(--ds-space-2);text-transform:none;letter-spacing:.05em}',
    '.slots-showcase__new{background:transparent;border:1px dashed var(--ds-accent);color:var(--ds-accent-deep);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);letter-spacing:var(--ds-track-wide);text-transform:uppercase;padding:.55rem .9rem;border-radius:var(--ds-radius-pill);cursor:pointer;font-weight:600}',
    '.slots-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:var(--ds-space-3)}',
    '.slot-card{background:var(--ds-paper-deep);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);padding:var(--ds-space-4);display:flex;flex-direction:column;gap:var(--ds-space-2);cursor:pointer;position:relative;overflow:hidden;transition:all var(--ds-motion-fast) var(--ds-ease-out);aspect-ratio:1/1.05}',
    '.slot-card:hover{border-color:var(--ds-accent);transform:translateY(-2px);box-shadow:0 6px 14px -3px rgba(255,126,60,.25)}',
    '.slot-card__serial{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-tech);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.slot-card__num{font-family:var(--ds-font-display-artifact);font-size:1.6rem;font-weight:400;color:var(--ds-ink);letter-spacing:.02em;line-height:1}',
    '.slot-card__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;line-height:1.1;margin:0}',
    '.slot-card__items{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:auto}',
    '.slot-card__coverage{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep);letter-spacing:.04em}',
    '.slot-card__stamp{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-faint);letter-spacing:.05em;text-transform:uppercase;margin-top:var(--ds-space-1)}',
    '.slot-card.active{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);border-color:var(--ds-accent);box-shadow:0 0 0 1px var(--ds-accent),0 8px 24px -6px rgba(255,126,60,.35)}',
    '.slot-card.active::before{content:"";position:absolute;top:-1px;right:-1px;width:60px;height:60px;background:radial-gradient(circle at top right,var(--ds-accent) 0%,transparent 70%);opacity:.4;pointer-events:none}',
    '.slot-card.active .slot-card__serial{color:var(--ds-accent-bright)}',
    '.slot-card.active .slot-card__num{color:var(--ds-accent-bright);text-shadow:0 0 20px rgba(255,126,60,.5)}',
    '.slot-card.active .slot-card__name{color:var(--ds-paper)}',
    '.slot-card.active .slot-card__items{color:var(--ds-accent-soft)}',
    '.slot-card.active .slot-card__coverage{color:var(--ds-accent-bright)}',
    '.slot-card.active .slot-card__stamp{color:var(--ds-tech-dim)}',
    '.slot-card.empty{border-style:dashed;border-color:var(--ds-rule-bright);background:transparent;align-items:center;justify-content:center}',
    '.slot-card.empty .slot-card__empty-mark{font-family:var(--ds-font-display-artifact);font-size:2rem;color:var(--ds-ink-faint);letter-spacing:.05em}',
    '.slot-card.empty .slot-card__empty-label{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.active-slot{background:var(--ds-paper);border-radius:var(--ds-radius-md);padding:0;box-shadow:var(--ds-elev-2);position:relative;overflow:hidden}',
    '.active-slot__head{padding:var(--ds-space-6) var(--ds-space-7);border-bottom:1px solid var(--ds-rule-soft);background:var(--ds-paper-darker);position:relative}',
    '.active-slot__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.active-slot__eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 6px var(--ds-accent-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.active-slot__title-row{display:grid;grid-template-columns:1fr auto;align-items:end;gap:var(--ds-space-5)}',
    '.active-slot__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-2xl);font-weight:700;color:var(--ds-ink);letter-spacing:.01em;text-transform:uppercase;margin:0}',
    '.active-slot__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:var(--ds-space-2);display:flex;gap:var(--ds-space-3)}',
    '.active-slot__meta strong{color:var(--ds-ink);font-weight:600}',
    '.active-slot__stat{display:flex;align-items:baseline;gap:var(--ds-space-2);background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);padding:var(--ds-space-3) var(--ds-space-4);border-radius:var(--ds-radius-sm);color:var(--ds-paper);position:relative;overflow:hidden}',
    '.active-slot__stat-num{font-family:var(--ds-font-display-artifact);font-size:2.2rem;font-weight:400;line-height:1;color:var(--ds-accent-bright);letter-spacing:.02em;text-shadow:0 0 30px rgba(255,126,60,.4)}',
    '.active-slot__stat-den{font-family:var(--ds-font-display-artifact);font-size:1.2rem;color:var(--ds-ink-faint)}',
    '.active-slot__stat-label{margin-left:var(--ds-space-2);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-accent-soft);line-height:1.3}',
    '.active-slot__items{padding:var(--ds-space-4) var(--ds-space-5);display:flex;flex-direction:column;gap:var(--ds-space-2)}',
    '.active-slot__empty{padding:var(--ds-space-5);text-align:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.regimen-item-row{display:grid;grid-template-columns:48px 1fr auto auto auto;align-items:center;gap:var(--ds-space-4);padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.regimen-item-row:hover{border-color:var(--ds-accent);box-shadow:0 2px 8px -2px rgba(255,126,60,.15)}',
    '.regimen-item-row__icon{width:44px;height:44px;background:linear-gradient(135deg,var(--ds-paper-darker) 0%,var(--ds-paper-deep) 100%);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-sm);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep)}',
    '.regimen-item-row__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0 0 var(--ds-space-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.regimen-item-row__contrib{display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.regimen-item-row__contrib-label{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.contrib-pip{display:inline-block;width:12px;height:6px;background:var(--ds-paper-darker);border-radius:1px}',
    '.contrib-pip.fill{background:var(--ds-accent)}',
    '.dose-block{display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.dose-input{width:48px;background:var(--ds-paper);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);padding:4px 6px;font-family:var(--ds-font-mono);font-size:var(--ds-text-sm);font-weight:600;color:var(--ds-ink);text-align:center}',
    '.dose-input:focus{outline:none;border-color:var(--ds-accent);box-shadow:0 0 0 2px var(--ds-accent-soft)}',
    '.dose-sep{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);letter-spacing:var(--ds-track-wider);text-transform:uppercase}',
    '.dose-unit{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600;padding-right:4px}',
    '.dose-unit--label{color:var(--ds-ink);font-weight:700}',
    '.scaling{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-tech);background:var(--ds-tech-wash);padding:4px 8px;border-radius:var(--ds-radius-pill);font-weight:600}',
    '.btn-remove{width:28px;height:28px;border-radius:var(--ds-radius-sm);background:transparent;border:1px solid transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ds-ink-soft);font-size:1.1rem;transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.btn-remove:hover{border-color:var(--ds-status-err);color:var(--ds-status-err);background:var(--ds-status-err-soft)}',
    '.active-slot__actions{display:flex;align-items:center;gap:var(--ds-space-2);padding:var(--ds-space-4) var(--ds-space-7);background:var(--ds-paper-darker);border-top:1px solid var(--ds-rule);flex-wrap:wrap}',
    '.cart-action{background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink);padding:.55rem 1rem;font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:600;letter-spacing:var(--ds-track-wide);text-transform:uppercase;border-radius:var(--ds-radius-sm);cursor:pointer;display:inline-flex;align-items:center;gap:var(--ds-space-2);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.cart-action:hover{border-color:var(--ds-accent);color:var(--ds-accent-deep)}',
    '.cart-action__glyph{font-family:var(--ds-font-mono);font-size:var(--ds-text-sm);color:var(--ds-tech)}',
    '.cart-action--primary{background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);color:var(--ds-paper-light);border-color:var(--ds-accent-deep);box-shadow:0 1px 0 rgba(255,255,255,.3) inset,var(--ds-glow-accent-sm)}',
    '.cart-action--primary:hover{color:var(--ds-paper-light);transform:translateY(-1px)}',
    '.cart-action--primary .cart-action__glyph{color:var(--ds-paper-light)}',
    '.cart-action__spacer{flex:1}',
    '.regimen-side{display:flex;flex-direction:column;gap:var(--ds-space-5)}',
    '.side-panel{background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:var(--ds-elev-1);display:flex;flex-direction:column;overflow:hidden}',
    '.side-panel__head{padding:var(--ds-space-4) var(--ds-space-5);border-bottom:1px solid var(--ds-rule-soft);background:var(--ds-paper-darker)}',
    '.side-panel__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-tech);font-weight:600;margin-bottom:var(--ds-space-2)}',
    '.side-panel__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0}',
    '.side-panel__list{padding:var(--ds-space-3)}',
    '.side-panel__empty{padding:var(--ds-space-4);text-align:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
  ].join('\n');

  let regimenStyleInjected = false;
  function injectRegimenStyles() {
    if (regimenStyleInjected) return;
    regimenStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/regimen.ts');
    style.textContent = REGIMEN_CSS;
    document.head.appendChild(style);
  }

  function mountRegimen(container) {
    injectRegimenStyles();
    function renderInto() { container.innerHTML = _renderRegimenShell(); }
    renderInto();
    const unsub = on('regimen:changed', renderInto);
    function changeHandler(ev) {
      const target = ev.target;
      if (!target || target.tagName !== 'INPUT' || !target.classList.contains('dose-input')) return;
      const row = target.closest('.regimen-item-row');
      if (!row) return;
      const itemId = row.getAttribute('data-item-id');
      const field = target.getAttribute('data-dose-field');
      if (!itemId || !field) return;
      const num = parseFloat(target.value);
      if (Number.isNaN(num)) return;
      const patch = {}; patch[field] = num;
      saveRgOverride(itemId, patch);
    }
    container.addEventListener('change', changeHandler);
    function clickHandler(ev) {
      const target = ev.target;
      const removeBtn = target && target.closest ? target.closest('[data-action="remove"]') : null;
      if (removeBtn) {
        const row = removeBtn.closest('.regimen-item-row');
        const itemId = row && row.getAttribute('data-item-id');
        if (itemId) {
          const set = _loadRemoved();
          set.add(Number(itemId));
          saveRgRemoved(set);
        }
        return;
      }
      // Slot card click → load that slot
      const slotCard = target && target.closest ? target.closest('.slot-card[data-slot-num]') : null;
      if (slotCard && !slotCard.classList.contains('active')) {
        const num = Number(slotCard.getAttribute('data-slot-num'));
        if (num && typeof window.loadFromSlot === 'function') {
          try { window.loadFromSlot(num); }
          catch (e) { console.warn('[views/regimen] loadFromSlot threw:', e); }
        }
        return;
      }
      // Cart action buttons → bridge to legacy exposures
      const actionEl = target && target.closest ? target.closest('[data-action]') : null;
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      if (action === 'remove') return;
      try {
        if (action === 'save' && typeof window.saveCurrentToSlot === 'function') {
          // Legacy expects a slot num — use current active slot
          const meta = _readSlotMeta();
          const current = meta.currentSlot || 1;
          window.saveCurrentToSlot(current);
        } else if (action === 'duplicate' && typeof window.showSlotInputModal === 'function') {
          // Legacy slot-input modal handles duplicate via dialog flow
          window.showSlotInputModal({ mode: 'duplicate' });
        } else if (action === 'new-slot' && typeof window.showSlotInputModal === 'function') {
          window.showSlotInputModal({ mode: 'new' });
        } else if (action === 'add-item') {
          // Switch to Scanner workspace so user can add via scan
          navigateTo('scanner');
        } else if (action === 'import' || action === 'export' || action === 'vault') {
          // These tap into the legacy save-system modal. If a legacy entry
          // exists, trigger; otherwise log a stub.
          const fnName = action === 'import' ? 'showSaveSystemImport'
            : action === 'export' ? 'showSaveSystemExport'
            : 'showRecoveryVault';
          if (typeof window[fnName] === 'function') {
            window[fnName]();
          } else {
            console.info('[views/regimen] no legacy fn for ' + action + ' — polish++ task');
          }
        } else {
          console.info('[views/regimen] action stub:', action);
        }
      } catch (e) {
        console.warn('[views/regimen] action ' + action + ' threw:', e);
      }
    }
    container.addEventListener('click', clickHandler);
    return {
      unmount: function () {
        unsub();
        container.removeEventListener('change', changeHandler);
        container.removeEventListener('click', clickHandler);
        container.innerHTML = '';
      },
    };
  }


  // ── state/scanner.ts + views/scanner.ts (Round 4·B) ─────────────────────
  const RECENT_SCANS_KEY = 'lcRecentScans_v1';

  function _getScanHistory() {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_SCANS_KEY) || 'null');
      return (r && Array.isArray(r.items)) ? r.items : [];
    } catch { return []; }
  }
  function _getLastScan() {
    const items = _getScanHistory();
    return items.length > 0 ? items[0] : null;
  }

  function _verdictBucket(v) {
    if (v === 'ADD') return 'ok';
    if (v === 'SAVE') return 'warn';
    return 'err';
  }
  function _verdictHeadline(v) {
    if (v === 'ADD') return 'ALIGNS WITH WALLACH';
    if (v === 'SAVE') return 'PARTIAL ALIGNMENT';
    return 'OUT OF ALIGNMENT';
  }
  function _timeAgo(iso) {
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const min = Math.floor(ms / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return min + 'm ago';
      const h = Math.floor(min / 60);
      if (h < 24) return h + 'h ago';
      return Math.floor(h / 24) + 'd ago';
    } catch { return ''; }
  }

  function _renderEmptyStage() {
    return '<section class="scan-stage">'
      + '<header class="scan-stage__head"><div>'
      + '<div class="scan-stage__kicker"><span class="pulse-dot"></span>READY · NO ACTIVE CAPTURE</div>'
      + '<h2 class="scan-stage__title">Scanner <em>// drop a label · extract · parse · verdict</em></h2>'
      + '</div></header>'
      + '<label class="scan-canvas scan-canvas--empty" for="scn-file-input">'
      + '<input type="file" id="scn-file-input" accept="image/*" style="display:none" />'
      + '<div class="scan-canvas__drop-mark">⌖</div>'
      + '<div class="scan-canvas__drop-headline">DROP LABEL HERE</div>'
      + '<div class="scan-canvas__drop-sub">CLICK TO BROWSE · OR DRAG AN IMAGE</div>'
      + '<div class="scan-canvas__drop-formats"><span>JPG</span><span>PNG</span><span>HEIC</span><span>PDF</span></div>'
      + '</label></section>';
  }
  function _renderActiveStage(scan) {
    const captureId = 'SC·' + _hex(scan.id);
    return '<section class="scan-stage ds-border-travel">'
      + '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<header class="scan-stage__head"><div>'
      + '<div class="scan-stage__kicker"><span class="pulse-dot"></span>LAST CAPTURE · '
      + '<span class="ds-cipher" data-cipher-set="hexa">' + captureId + '</span></div>'
      + '<h2 class="scan-stage__title">' + escHTML(scan.label.name)
      + ' <em>// captured ' + escHTML(_timeAgo(scan.ts)) + ' · phase 4/4</em></h2>'
      + '</div>'
      + '<div class="scan-stage__head-stat">'
      + '<span>VERDICT <strong>' + escHTML(scan.verdict) + '</strong></span><span>·</span>'
      + '<span>ALIGN <strong>' + (scan.alignment && scan.alignment.score ? scan.alignment.score.toFixed(1) : '0.0') + '/2.0</strong></span>'
      + '</div></header>'
      + '<div class="scan-stage__controls">'
      + '<span class="scan-stage__meta"><span>CAPTURE <strong>' + captureId + '</strong></span>'
      + '<span>·</span><span>' + (scan.gapFills ? scan.gapFills.length : 0) + ' GAPS DETECTED</span></span>'
      + '<span class="scan-stage__spacer"></span>'
      + '<button class="scan-btn" data-action="rescan"><span class="scan-btn__glyph">↺</span>RE-SCAN</button>'
      + '<button class="scan-btn" data-action="adopt"><span class="scan-btn__glyph">+</span>ADOPT</button>'
      + '</div></section>';
  }
  function _renderPipeline(scan) {
    const allDone = scan !== null;
    const stages = [
      { name: 'EXTRACT', sub: 'tesseract OCR', ms: '1.42s' },
      { name: 'PARSE',   sub: 'eden grammar',  ms: '0.31s' },
      { name: 'MATCH',   sub: 'vault lookup',  ms: '2.11s' },
      { name: 'VERDICT', sub: 'wallach align', ms: '0.08s' },
    ];
    const stagesHTML = stages.map(function (s) {
      return '<div class="stage ' + (allDone ? 'stage--done' : 'stage--queued') + '">'
        + '<div class="stage__dot">' + (allDone ? '✓' : '○') + '</div>'
        + '<div class="stage__name">' + s.name + '</div>'
        + '<div class="stage__sub">' + s.sub + '</div>'
        + '<div class="stage__ms">' + (allDone ? s.ms : '—') + '</div></div>';
    }).join('');
    return '<section class="pipeline"><header class="pipeline__head"><div>'
      + '<div class="pipeline__eyebrow">PIPELINE · <span class="ds-cipher" data-cipher-set="hexa">PL·' + _hex((scan && scan.id) || 1) + '</span> · 4 STAGES</div>'
      + '<h2 class="pipeline__title">Extract · Parse · Match · Verdict</h2></div>'
      + '<div class="pipeline__total">TOTAL ELAPSED <strong>' + (allDone ? '3.92s' : '—') + '</strong></div></header>'
      + '<div class="pipeline__stages">' + stagesHTML + '</div></section>';
  }
  function _renderGapFillRow(gf, idx) {
    const pct = Number(gf.gapFillPct) || 0;
    const heat = pct >= 30 ? 'xl' : pct >= 15 ? 'lg' : pct >= 5 ? 'md' : 'sm';
    return '<div class="parsed-row parsed-row--ok"><div class="parsed-row__status">✓</div>'
      + '<div class="parsed-row__body">'
      + '<span class="parsed-row__raw">DETECTED · gap-fill #' + (idx + 1) + '</span>'
      + '<h4 class="parsed-row__name">' + escHTML(gf.essential) + '</h4></div>'
      + '<span class="parsed-row__mapped">' + (gf.amountClaimed ? (gf.amountClaimed + ' ' + (gf.unit || '')) : '→ matched') + '</span>'
      + '<span class="parsed-row__confidence">' + pct.toFixed(0) + '<small>% gap</small></span>'
      + '<span class="parsed-row__tag" data-heat="' + heat + '"><span class="parsed-row__tag-sign">+</span>' + pct.toFixed(0) + '</span>'
      + '<div class="parsed-row__actions"><button class="parsed-row__btn">DETAILS</button></div></div>';
  }
  function _renderParsedList(scan) {
    if (!scan) {
      return '<section class="parsed"><header class="parsed__head"><div>'
        + '<div class="parsed__eyebrow">INGREDIENTS · WAITING</div>'
        + '<h2 class="parsed__title">Parsed &amp; Mapped</h2></div></header>'
        + '<div class="parsed__list"><div class="parsed__empty">— drop a label to populate this list —</div></div></section>';
    }
    const top = (scan.gapFills || []).slice(0, 8);
    const itemsHTML = top.length === 0
      ? '<div class="parsed__empty">— no gap-fills detected for this scan —</div>'
      : top.map(_renderGapFillRow).join('');
    return '<section class="parsed"><header class="parsed__head"><div>'
      + '<div class="parsed__eyebrow">INGREDIENTS · <span class="ds-cipher" data-cipher-set="hexa">IG·' + _hex(scan.id) + '</span> · ' + top.length + ' DETECTED</div>'
      + '<h2 class="parsed__title">Parsed &amp; Mapped</h2></div>'
      + '<div class="parsed__legend">'
      + '<span class="parsed__legend-key"><span class="dot dot--ok"></span>VAULT HIT</span>'
      + '<span class="parsed__legend-key"><span class="dot dot--warn"></span>FUZZY MATCH</span>'
      + '<span class="parsed__legend-key"><span class="dot dot--err"></span>UNKNOWN</span>'
      + '</div></header>'
      + '<div class="parsed__list">' + itemsHTML + '</div></section>';
  }
  function _renderVerdict(scan) {
    if (!scan) {
      return '<section class="verdict"><div class="verdict__grid"><div class="verdict__lead">'
        + '<div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT · STANDING BY</div>'
        + '<h2 class="verdict__headline">NO ACTIVE SCAN</h2>'
        + '<p class="verdict__body">Drop a label or pick from history to see the Wallach-alignment verdict.</p>'
        + '</div></div></section>';
    }
    const bucket = _verdictBucket(scan.verdict);
    const align = scan.alignment || {};
    const score = (align.score != null ? align.score : 0).toFixed(1);
    return '<section class="verdict verdict--' + bucket + '"><div class="verdict__grid"><div class="verdict__lead">'
      + '<div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT · '
      + '<span class="ds-cipher" data-cipher-set="hexa">VD·' + _hex(scan.id) + '</span></div>'
      + '<h2 class="verdict__headline">' + _verdictHeadline(scan.verdict) + '</h2>'
      + '<p class="verdict__body">' + escHTML(scan.label.name) + ' scored <strong>' + score + '/2.0</strong> form-alignment. '
      + (scan.gapFills ? scan.gapFills.length : 0) + ' essentials touched; '
      + (scan.goals ? scan.goals.length : 0) + ' goal' + ((scan.goals && scan.goals.length === 1) ? '' : 's') + ' matched.</p>'
      + '<div class="verdict__source">SCANNED · <strong>' + escHTML(new Date(scan.ts).toLocaleString()) + '</strong></div></div>'
      + '<div class="verdict__stats">'
      + '<div class="verdict-stat"><div class="verdict-stat__num">+' + (scan.gapFills ? scan.gapFills.length : 0) + '</div><div class="verdict-stat__label">gap-fills detected</div></div>'
      + '<div class="verdict-stat"><div class="verdict-stat__num">' + (align.aligned || 0) + '<small>/' + (align.total || 0) + '</small></div><div class="verdict-stat__label">forms aligned</div></div>'
      + '<div class="verdict-stat"><div class="verdict-stat__num">' + (scan.goals ? scan.goals.length : 0) + '</div><div class="verdict-stat__label">goals matched</div></div>'
      + '<div class="verdict-stat verdict-stat--warn"><div class="verdict-stat__num">' + (align.misaligned || 0) + '</div><div class="verdict-stat__label">forms misaligned</div></div>'
      + '</div></div></section>';
  }
  function _renderHistoryRow(entry) {
    const bucket = _verdictBucket(entry.verdict);
    const initial = (entry.label && entry.label.name) ? entry.label.name.charAt(0).toUpperCase() : '?';
    return '<div class="history-row" data-scan-id="' + entry.id + '">'
      + '<div class="history-row__thumb">' + escHTML(initial) + '</div>'
      + '<div class="history-row__body">'
      + '<h4 class="history-row__name">' + escHTML(entry.label.name) + '</h4>'
      + '<div class="history-row__stamp">' + escHTML(_timeAgo(entry.ts)) + '</div></div>'
      + '<span class="history-row__verdict history-row__verdict--' + bucket + '">' + entry.verdict + '</span></div>';
  }
  function _renderScannerShell() {
    const history = _getScanHistory();
    const lastScan = _getLastScan();
    const stage = lastScan ? _renderActiveStage(lastScan) : _renderEmptyStage();
    const historyHTML = history.length === 0
      ? '<div class="side-panel__empty">— no scans yet · drop a label to begin —</div>'
      : history.slice(0, 12).map(_renderHistoryRow).join('');
    return '<div class="ws-scanner"><div class="scanner-grid">'
      + '<div class="scanner-main">'
      + stage + _renderPipeline(lastScan) + _renderParsedList(lastScan) + _renderVerdict(lastScan)
      + '</div>'
      + '<aside class="scanner-side">'
      + '<section class="side-panel"><header class="side-panel__head"><div>'
      + '<div class="side-panel__eyebrow">HISTORY · <span class="ds-cipher" data-cipher-set="hexa">HS·' + _hex(history.length) + '</span></div>'
      + '<h3 class="side-panel__title">Recent Scans</h3></div>'
      + '<div class="side-panel__count"><strong>' + history.length + '</strong> TOTAL</div></header>'
      + '<div class="side-panel__list">' + historyHTML + '</div></section>'
      + '<section class="scan-controls"><div class="scan-controls__title">SCAN CONTROLS · ROUND 4·B</div>'
      + '<div class="scan-controls__grid">'
      + '<button class="scan-btn scan-btn--primary" data-action="new-scan"><span class="scan-btn__glyph">+</span>NEW SCAN</button>'
      + '<button class="scan-btn" data-action="export"><span class="scan-btn__glyph">⇣</span>EXPORT JSON</button>'
      + '<button class="scan-btn" data-action="clear"><span class="scan-btn__glyph">×</span>CLEAR</button>'
      + '</div>'
      + '<div class="scan-controls__note">// drop-zone upload + clear-history wired in polish pass</div></section>'
      + '</aside></div></div>';
  }

  const SCANNER_CSS = [
    '.ws-scanner{padding:var(--ds-space-6)}',
    '.scanner-grid{display:grid;grid-template-columns:1fr 340px;gap:var(--ds-space-6)}',
    '.scanner-main{display:flex;flex-direction:column;gap:var(--ds-space-6);min-width:0}',
    '.scan-stage{background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:var(--ds-elev-2);position:relative;overflow:hidden}',
    '.scan-stage__head{padding:var(--ds-space-5) var(--ds-space-6) var(--ds-space-4);border-bottom:1px solid var(--ds-rule-soft);background:var(--ds-paper-darker);display:grid;grid-template-columns:1fr auto;align-items:end;gap:var(--ds-space-5)}',
    '.scan-stage__kicker{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.scan-stage__kicker .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 6px var(--ds-accent-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.scan-stage__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-2xl);font-weight:700;color:var(--ds-ink);letter-spacing:.01em;text-transform:uppercase;margin:0;line-height:1}',
    '.scan-stage__title em{font-style:normal;font-weight:400;color:var(--ds-accent-deep);font-family:var(--ds-font-mono);font-size:.55em;display:block;margin-top:var(--ds-space-2);text-transform:none;letter-spacing:.05em}',
    '.scan-stage__head-stat{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);display:flex;gap:var(--ds-space-3)}',
    '.scan-stage__head-stat strong{color:var(--ds-ink);font-weight:600}',
    '.scan-canvas{position:relative;display:flex;align-items:center;justify-content:center;min-height:300px}',
    '.scan-canvas--empty{flex-direction:column;gap:var(--ds-space-3);background:linear-gradient(135deg,var(--ds-paper-deep) 0%,var(--ds-paper-darker) 100%);border:2px dashed var(--ds-rule-bright);border-radius:var(--ds-radius-xs);margin:var(--ds-space-5);min-height:240px;cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.scan-canvas--empty:hover{border-color:var(--ds-accent)}',
    '.scan-canvas__drop-mark{font-family:var(--ds-font-display-artifact);font-size:3rem;color:var(--ds-accent-deep);line-height:1}',
    '.scan-canvas__drop-headline{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;text-align:center}',
    '.scan-canvas__drop-sub{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.scan-canvas__drop-formats{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);display:flex;gap:var(--ds-space-3);margin-top:var(--ds-space-2)}',
    '.scan-canvas__drop-formats span{padding:2px 8px;background:var(--ds-paper);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-pill)}',
    '.scan-stage__controls{display:flex;gap:var(--ds-space-2);padding:var(--ds-space-4) var(--ds-space-6);background:var(--ds-paper-darker);border-top:1px solid var(--ds-rule);align-items:center}',
    '.scan-stage__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);display:inline-flex;align-items:center;gap:var(--ds-space-3)}',
    '.scan-stage__meta strong{color:var(--ds-ink);font-weight:600}',
    '.scan-stage__spacer{flex:1}',
    '.scan-btn{background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;padding:.45rem .85rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:inline-flex;align-items:center;gap:var(--ds-space-2);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.scan-btn:hover{border-color:var(--ds-accent);color:var(--ds-accent-deep)}',
    '.scan-btn__glyph{font-family:var(--ds-font-mono);color:var(--ds-tech)}',
    '.scan-btn--primary{background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);color:var(--ds-paper-light);border-color:var(--ds-accent-deep);box-shadow:0 1px 0 rgba(255,255,255,.3) inset,var(--ds-glow-accent-sm);justify-content:center}',
    '.scan-btn--primary:hover{color:var(--ds-paper-light);transform:translateY(-1px)}',
    '.scan-btn--primary .scan-btn__glyph{color:var(--ds-paper-light)}',
    '.pipeline{background:var(--ds-paper);border-radius:var(--ds-radius-md);padding:var(--ds-space-5) var(--ds-space-6);box-shadow:var(--ds-elev-1);position:relative;overflow:hidden}',
    '.pipeline__head{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:var(--ds-space-4);margin-bottom:var(--ds-space-4);padding-bottom:var(--ds-space-3);border-bottom:1px solid var(--ds-rule-soft)}',
    '.pipeline__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-tech);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2);margin-bottom:var(--ds-space-1)}',
    '.pipeline__eyebrow::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
    '.pipeline__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0}',
    '.pipeline__total{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.pipeline__total strong{color:var(--ds-ink);font-weight:600}',
    '.pipeline__stages{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--ds-space-3);position:relative}',
    '.pipeline__stages::before{content:"";position:absolute;top:22px;left:8%;right:8%;height:1px;background:linear-gradient(to right,var(--ds-rule) 0%,var(--ds-accent) 35%,var(--ds-accent) 65%,var(--ds-rule) 100%);z-index:0}',
    '.stage{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:var(--ds-space-2);padding-top:4px}',
    '.stage__dot{width:36px;height:36px;border-radius:50%;background:var(--ds-paper);border:2px solid var(--ds-rule);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-md);color:var(--ds-ink-soft);font-weight:700;position:relative;z-index:1}',
    '.stage__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase}',
    '.stage__sub{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.stage__ms{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);color:var(--ds-tech);font-weight:600;font-variant-numeric:tabular-nums}',
    '.stage--done .stage__dot{background:var(--ds-status-ok);border-color:var(--ds-status-ok);color:var(--ds-paper-light);box-shadow:0 0 0 4px var(--ds-status-ok-soft)}',
    '.stage--done .stage__sub{color:var(--ds-status-ok)}',
    '.stage--queued .stage__dot{background:var(--ds-paper-deep);border-color:var(--ds-rule);color:var(--ds-ink-faint)}',
    '.stage--queued .stage__name{color:var(--ds-ink-soft)}',
    '.stage--queued .stage__sub,.stage--queued .stage__ms{color:var(--ds-ink-faint)}',
    '.parsed{background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:var(--ds-elev-2);overflow:hidden}',
    '.parsed__head{padding:var(--ds-space-5) var(--ds-space-6) var(--ds-space-4);border-bottom:1px solid var(--ds-rule-soft);background:var(--ds-paper-darker);display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:var(--ds-space-4)}',
    '.parsed__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-2)}',
    '.parsed__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xl);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0}',
    '.parsed__legend{display:flex;align-items:center;gap:var(--ds-space-4);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.parsed__legend-key{display:inline-flex;align-items:center;gap:var(--ds-space-1)}',
    '.parsed__legend-key .dot{width:8px;height:8px;border-radius:50%;display:inline-block}',
    '.parsed__legend-key .dot--ok{background:var(--ds-status-ok)}',
    '.parsed__legend-key .dot--warn{background:var(--ds-status-warn)}',
    '.parsed__legend-key .dot--err{background:var(--ds-status-err)}',
    '.parsed__list{display:flex;flex-direction:column;padding:var(--ds-space-4) var(--ds-space-5);gap:var(--ds-space-2)}',
    '.parsed__empty{padding:var(--ds-space-5);text-align:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.parsed-row{display:grid;grid-template-columns:28px 1fr auto auto auto auto;align-items:center;gap:var(--ds-space-4);padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-left:3px solid var(--ds-status-ok);border-radius:var(--ds-radius-sm);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.parsed-row:hover{border-color:var(--ds-accent);box-shadow:0 2px 8px -2px rgba(255,126,60,.15)}',
    '.parsed-row__status{width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);font-weight:700;color:var(--ds-paper-light);background:var(--ds-status-ok)}',
    '.parsed-row__raw{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);display:block;margin-bottom:2px}',
    '.parsed-row__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.parsed-row__mapped{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-tech);background:var(--ds-tech-wash);padding:4px 10px;border-radius:var(--ds-radius-pill);font-weight:600;white-space:nowrap}',
    '.parsed-row__confidence{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);color:var(--ds-ink);font-weight:700;font-variant-numeric:tabular-nums}',
    '.parsed-row__confidence small{font-size:var(--ds-text-micro);color:var(--ds-ink-soft);font-weight:500;text-transform:uppercase}',
    '.parsed-row__tag{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);letter-spacing:.02em;color:var(--ds-paper-light);font-weight:400;padding:4px 10px;border-radius:var(--ds-radius-pill);background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);box-shadow:0 2px 8px -1px rgba(255,126,60,.3);display:inline-flex;align-items:baseline;gap:2px;line-height:1}',
    '.parsed-row__tag[data-heat="sm"]{background:var(--ds-accent-wash);color:var(--ds-accent-deep);box-shadow:none;font-size:var(--ds-text-sm);padding:3px 8px}',
    '.parsed-row__tag[data-heat="md"]{background:var(--ds-accent-soft);color:var(--ds-accent-deep);box-shadow:0 1px 4px -1px rgba(255,126,60,.2)}',
    '.parsed-row__tag[data-heat="lg"]{font-size:var(--ds-text-lg);padding:5px 12px}',
    '.parsed-row__tag[data-heat="xl"]{font-size:var(--ds-text-xl);padding:6px 14px;background:linear-gradient(135deg,var(--ds-accent-hot) 0%,#ff3d00 100%);box-shadow:0 4px 14px -2px rgba(255,126,60,.5)}',
    '.parsed-row__tag-sign{font-size:.55em;font-weight:700;font-family:var(--ds-font-mono);opacity:.85}',
    '.parsed-row__btn{background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;padding:5px 10px;border-radius:var(--ds-radius-pill);cursor:pointer}',
    '.parsed-row__btn:hover{border-color:var(--ds-tech);color:var(--ds-tech)}',
    '.verdict{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);border-radius:var(--ds-radius-md);padding:var(--ds-space-6) var(--ds-space-7);box-shadow:var(--ds-elev-3);color:var(--ds-paper);position:relative;overflow:hidden}',
    '.verdict::after{content:"";position:absolute;top:-40px;right:-40px;width:220px;height:220px;background:radial-gradient(circle,var(--ds-accent) 0%,transparent 65%);opacity:.2;pointer-events:none}',
    '.verdict__grid{display:grid;grid-template-columns:1.4fr 1fr;gap:var(--ds-space-6);align-items:center;position:relative;z-index:1}',
    '.verdict__lead{display:flex;flex-direction:column;gap:var(--ds-space-3)}',
    '.verdict__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent-bright);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.verdict__eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 10px var(--ds-accent);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.verdict__headline{font-family:var(--ds-font-display-artifact);font-size:2.2rem;font-weight:400;letter-spacing:.02em;text-transform:uppercase;line-height:1;color:var(--ds-paper);margin:0}',
    '.verdict__body{font-family:var(--ds-font-sans);font-size:var(--ds-text-md);font-weight:500;color:var(--ds-paper);line-height:1.45;margin:0;opacity:.95}',
    '.verdict__body strong{color:var(--ds-accent-bright);font-weight:700}',
    '.verdict__source{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-tech-dim);border-top:1px solid var(--ds-ink-medium);padding-top:var(--ds-space-2);margin-top:var(--ds-space-1)}',
    '.verdict__source strong{color:var(--ds-tech);font-weight:600}',
    '.verdict__stats{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--ds-space-4)}',
    '.verdict-stat{background:rgba(255,255,255,.04);border:1px solid var(--ds-ink-medium);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3) var(--ds-space-4);display:flex;flex-direction:column;gap:4px}',
    '.verdict-stat__num{font-family:var(--ds-font-display-artifact);font-size:1.8rem;line-height:1;color:var(--ds-accent-bright);letter-spacing:.02em}',
    '.verdict-stat__num small{font-size:.55em;color:var(--ds-ink-faint);font-family:var(--ds-font-display-artifact)}',
    '.verdict-stat__label{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-accent-soft)}',
    '.verdict-stat--warn .verdict-stat__num{color:var(--ds-status-warn)}',
    '.verdict-stat--warn .verdict-stat__label{color:rgba(232,200,116,.85)}',
    '.scanner-side{display:flex;flex-direction:column;gap:var(--ds-space-5)}',
    '.scanner-side .side-panel__head{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:var(--ds-space-3)}',
    '.scanner-side .side-panel__count{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);letter-spacing:var(--ds-track-wider);text-transform:uppercase;align-self:end}',
    '.scanner-side .side-panel__count strong{color:var(--ds-ink);font-weight:600}',
    '.history-row{display:grid;grid-template-columns:36px 1fr auto;gap:var(--ds-space-3);align-items:center;padding:var(--ds-space-3);background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out);margin-bottom:var(--ds-space-2)}',
    '.history-row:hover{border-color:var(--ds-accent);transform:translateX(-1px)}',
    '.history-row__thumb{width:36px;height:36px;background:linear-gradient(135deg,var(--ds-paper-darker) 0%,var(--ds-paper-deep) 100%);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep)}',
    '.history-row__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.history-row__stamp{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.history-row__verdict{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:var(--ds-radius-pill)}',
    '.history-row__verdict--ok{color:var(--ds-status-ok);background:var(--ds-status-ok-soft)}',
    '.history-row__verdict--warn{color:var(--ds-status-warn-deep,#8a6d20);background:var(--ds-status-warn-soft)}',
    '.history-row__verdict--err{color:var(--ds-status-err);background:var(--ds-status-err-soft)}',
    '.scan-controls{background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:var(--ds-elev-1);padding:var(--ds-space-4) var(--ds-space-5);display:flex;flex-direction:column;gap:var(--ds-space-3)}',
    '.scan-controls__title{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.scan-controls__title::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
    '.scan-controls__grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--ds-space-2)}',
    '.scan-controls__grid .scan-btn--primary{grid-column:1/-1}',
    '.scan-controls__note{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);text-align:center;margin-top:var(--ds-space-2)}',
  ].join('\n');

  let scannerStyleInjected = false;
  function injectScannerStyles() {
    if (scannerStyleInjected) return;
    scannerStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/scanner.ts');
    style.textContent = SCANNER_CSS;
    document.head.appendChild(style);
  }

  function mountScanner(container) {
    injectScannerStyles();
    function renderInto() { container.innerHTML = _renderScannerShell(); }
    renderInto();
    const unsubScan = on('scanner:scan-complete', renderInto);
    const unsubReg  = on('regimen:changed', renderInto);

    function handleImageFile(file) {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        console.warn('[views/scanner] not an image file:', file && file.type);
        return;
      }
      // Bridge to legacy lcScanImage — single image→scan-result entry point.
      // It runs OCR → parse → scoring → logs to recent scans (which triggers
      // our scanner:scan-complete event → re-render).
      const reader = new FileReader();
      reader.onload = function () {
        const dataUrl = reader.result;
        if (typeof window.lcScanImage !== 'function') {
          console.warn('[views/scanner] window.lcScanImage not available — legacy not loaded?');
          alert('Scanner bridge not ready — try refreshing the page.');
          return;
        }
        // Go straight to scan. If Tesseract files are missing, loadTesseract's
        // script.onerror fires with the actionable "run vendor-tesseract.js"
        // message — that bubbles up via the .catch in _scnRunScan. No fetch
        // pre-flight (Firefox blocks fetch from file:// to local files, which
        // gives false positives even when the files exist).
        _scnRunScan(dataUrl);
      };
      reader.onerror = function (e) { console.warn('[views/scanner] FileReader error:', e); };
      reader.readAsDataURL(file);
    }

    // Runs after pre-flight verifies the Tesseract vendor files exist.
    function _scnRunScan(dataUrl) {
      const headline = container.querySelector('.scan-canvas__drop-headline');
      const sub = container.querySelector('.scan-canvas__drop-sub');
      if (headline) headline.textContent = 'SCANNING…';
      if (sub) sub.textContent = 'OCR running · please wait';

      function onProgress(ev) {
        if (sub && ev && ev.detail) {
          sub.textContent = (ev.detail.message || 'WORKING…').toUpperCase()
            + (ev.detail.progress ? ' · ' + Math.round(ev.detail.progress * 100) + '%' : '');
        }
      }
      window.addEventListener('lcscan:progress', onProgress);

      window.lcScanImage(dataUrl).then(function (result) {
        window.removeEventListener('lcscan:progress', onProgress);
        emit('scanner:scan-complete', {
          captureId: String(Date.now()),
          verdict: result && result.verdict === 'ADD' ? 'aligns'
            : result && result.verdict === 'SAVE' ? 'partial' : 'out'
        });
      }).catch(function (err) {
        window.removeEventListener('lcscan:progress', onProgress);
        console.warn('[views/scanner] lcScanImage failed:', err);
        let msg = '';
        if (err) {
          if (err.message) msg = err.message;
          else if (typeof err === 'string') msg = err;
          else if (err.name) msg = err.name + ' (see console)';
          else { try { msg = JSON.stringify(err); } catch { msg = String(err); } }
        }
        if (!msg) msg = 'unknown error — open DevTools console for details';
        if (headline) headline.textContent = 'SCAN FAILED';
        if (sub) sub.textContent = msg.toUpperCase();
      });
    }

    function changeHandler(ev) {
      const target = ev.target;
      if (target && target.id === 'scn-file-input') {
        const file = target.files && target.files[0];
        if (file) handleImageFile(file);
      }
    }
    function dragOverHandler(ev) {
      // ALWAYS preventDefault on dragover within the scanner container so the
      // browser doesn't cancel the drag session. Visual highlight only when
      // hovering the actual empty drop zone.
      ev.preventDefault();
      const dropzone = ev.target && ev.target.closest ? ev.target.closest('.scan-canvas--empty') : null;
      if (dropzone) {
        dropzone.style.borderColor = 'var(--ds-accent)';
        dropzone.style.background = 'var(--ds-accent-wash)';
      }
    }
    function dragLeaveHandler(ev) {
      const dropzone = ev.target && ev.target.closest ? ev.target.closest('.scan-canvas--empty') : null;
      if (dropzone) {
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
      }
    }
    function dropHandler(ev) {
      ev.preventDefault();  // Always prevent browser's default file-open
      const dropzone = ev.target && ev.target.closest ? ev.target.closest('.scan-canvas--empty') : null;
      if (dropzone) {
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
      }
      const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (file) handleImageFile(file);
    }
    // Paste handler — captures clipboard image (e.g., screenshot or image copy)
    function pasteHandler(ev) {
      const items = ev.clipboardData && ev.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            ev.preventDefault();
            handleImageFile(file);
            return;
          }
        }
      }
    }

    function clickHandler(ev) {
      const actionEl = ev.target && ev.target.closest ? ev.target.closest('[data-action]') : null;
      if (actionEl) {
        const action = actionEl.getAttribute('data-action');
        if (action === 'new-scan') {
          // Trigger the file input click programmatically
          const input = container.querySelector('#scn-file-input');
          if (input) input.click();
        } else if (action === 'clear') {
          // Clear scan history (with confirm via window.confirm if available)
          if (typeof window.confirm === 'function' && !window.confirm('Clear all scan history?')) return;
          try {
            localStorage.removeItem('lcRecentScans_v1');
            renderInto();
          } catch (e) { console.warn('[views/scanner] clear history threw:', e); }
        } else if (action === 'rescan') {
          const input = container.querySelector('#scn-file-input');
          if (input) input.click();
        } else if (action === 'export') {
          // Export scan history as JSON download
          try {
            const history = _getScanHistory();
            const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'scan-history-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(a.href);
          } catch (e) { console.warn('[views/scanner] export threw:', e); }
        } else {
          console.info('[views/scanner] action stub:', action);
        }
      }
      const row = ev.target && ev.target.closest ? ev.target.closest('.history-row') : null;
      if (row) {
        // History row click → re-show that scan in the stage. For now, log;
        // full re-open requires setting an "active scan" state separate from
        // history[0]. Polish++ task.
        console.info('[views/scanner] history row clicked, scan id:', row.getAttribute('data-scan-id'));
      }
    }

    container.addEventListener('click', clickHandler);
    container.addEventListener('change', changeHandler);
    container.addEventListener('dragover', dragOverHandler);
    container.addEventListener('dragleave', dragLeaveHandler);
    container.addEventListener('drop', dropHandler);
    // Paste needs to be on document — clipboard events only fire on focused elements
    document.addEventListener('paste', pasteHandler);

    return {
      unmount: function () {
        unsubScan(); unsubReg();
        container.removeEventListener('click', clickHandler);
        container.removeEventListener('change', changeHandler);
        container.removeEventListener('dragover', dragOverHandler);
        container.removeEventListener('dragleave', dragLeaveHandler);
        container.removeEventListener('drop', dropHandler);
        document.removeEventListener('paste', pasteHandler);
        container.innerHTML = '';
      },
    };
  }


  // ── views/knowledge.ts (Round 5·A) ──────────────────────────────────────
  const KD_BOOKS = [
    { id: 'DDDL', title: "Dead Doctors Don't Lie", chapters: 12, cites: 286, author: 'Wallach' },
    { id: 'RBS',  title: 'Rare Earths: Forbidden Cures', chapters: 16, cites: 412, author: 'Wallach' },
    { id: 'EPS',  title: 'Epigenetics: The Death of the Genetic Theory', chapters: 9, cites: 188, author: 'Wallach' },
    { id: 'YGY',  title: 'YGY Product Compendium', chapters: 0, cites: 59, author: 'Secondary · label data only' },
  ];
  const KD_DOCTRINES = [
    { id: 'DOCT·01', title: 'Source-Rule · Wallach Primary Only', featured: true,
      body: 'Every numeric target, dose recommendation, deficiency indicator, or health claim displayed by this system must cite a primary source from the Wallach corpus or the YGY product allowlist. No exceptions, including the user.',
      cite: 'ENFORCED BY check_no_unsourced_claims · invariant tier · critical' },
    { id: 'DOCT·02', title: 'Aggregate-Vehicle Coverage (PDM)', featured: false,
      body: 'Plant-derived minerals are defined by sourcing, not by amounts. If a plant-derived mineral aggregate is present in a product, every trace mineral in that aggregate is considered covered — binary, not graduated.',
      cite: "CITED · Dead Doctors Don't Lie · ch. 4" },
    { id: 'DOCT·03', title: 'BTT Layering Order', featured: false,
      body: 'Beyond Tangy Tangerine is the foundational morning layer — vitamins, aminos, foundational minerals. Stack PDM on top for the rare-trace closure. Add EFA Plus for fatty acids.',
      cite: 'CITED · Wallach lecture corpus · YGY protocol guide' },
    { id: 'DOCT·04', title: 'Trace Minerals: Source-Not-Quantity', featured: false,
      body: 'For the 35 rare trace minerals, presence in a plant-derived vehicle is the qualifying criterion. Mass-spec verification is unnecessary if the source is doctrinally sound.',
      cite: 'CITED · Rare Earths · ch. 9' },
    { id: 'DOCT·05', title: 'Atomic LS Write Discipline (§17)', featured: false,
      body: 'Every regimen LS write goes through a verified round-trip set → re-read → reject-on-mismatch loop. Silent truncations taught us this. Writes that cannot confirm fail loudly.',
      cite: 'PROVED · Round 73 lessons + 9 truncation incidents' },
    { id: 'DOCT·06', title: '§31 Chokepoint Discipline', featured: false,
      body: 'Every regimen mutation flows through one of 5 named chokepoint helpers. Each fires triggerRegimenRerender so all subscribed surfaces re-render. State drift is structurally impossible by module design, not vigilance.',
      cite: 'CITED · Round 150 · enforced by check_regimen_state_mutation_routing' },
    { id: 'DOCT·07', title: 'Eden Sealed-Canonical', featured: false,
      body: 'Sealed canonical files (design-system.css, eden corpus) carry hash anchors. Agent reads freely, never writes after sealing. Drift detected at startup; reads from drifted files fail loudly.',
      cite: 'CITED · Round 157 · enforced by eden_hash_integrity + write_protection invariants' },
  ];

  function _readEssentialsForKd() {
    const el = document.getElementById('essentials-targets-data');
    if (!el) return [];
    try { const p = JSON.parse(el.textContent || '{}'); return Array.isArray(p && p.essentials) ? p.essentials : []; }
    catch { return []; }
  }
  function _readProductsForKd() {
    // Shape is { _meta: {...}, products: { "Product Name": {brand, nutrients, ...}, ... } }
    // Keys ARE the product names; entries don't have a name field of their own.
    const el = document.getElementById('regimen-label-lookup');
    if (!el) return [];
    try {
      const parsed = JSON.parse(el.textContent || '{}');
      const productsMap = parsed && parsed.products;
      if (!productsMap || typeof productsMap !== 'object') return [];
      const out = [];
      for (const key of Object.keys(productsMap)) {
        const entry = productsMap[key];
        if (entry && typeof entry === 'object') {
          out.push({
            name: entry.canonical_name || key,
            brand: entry.brand || 'YGY',
            nutrients: Array.isArray(entry.nutrients) ? entry.nutrients : [],
            category: entry.category || '',
            tagline: entry.tagline || '',
          });
        }
      }
      return out;
    } catch { return []; }
  }

  function _kdRenderCorpus() {
    const booksHTML = KD_BOOKS.map(function (b) {
      return '<div class="kd-book-row"><div class="kd-book-row__spine"><span>' + escHTML(b.id) + '</span></div>'
        + '<div class="kd-book-row__body"><h4 class="kd-book-row__title">' + escHTML(b.title) + '</h4>'
        + '<div class="kd-book-row__meta">' + escHTML(b.author) + (b.chapters > 0 ? ' · ' + b.chapters + ' CHAPTERS' : '') + ' · ' + b.cites + ' CITES</div></div>'
        + '<div class="kd-book-row__count">' + b.cites + '<small>cites</small></div></div>';
    }).join('');
    return '<div class="kd-featured-citation">'
      + '<div class="kd-featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>'
      + '<p class="kd-featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 3 essential fatty acids — 91 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>'
      + '<div class="kd-featured-citation__attr"><strong>Wallach</strong> · Dead Doctors Don\'t Lie · ch. 1 · paraphrase per primary corpus</div>'
      + '</div><div class="kd-section-head">PRIMARY CORPUS · WALLACH</div>' + booksHTML;
  }
  function _kdRenderEssentials() {
    const essentials = _readEssentialsForKd();
    if (essentials.length === 0) return '<div class="kd-empty">— essentials data not loaded —</div>';
    const tilesHTML = essentials.slice(0, 60).map(function (e) {
      return '<div class="kd-essential-tile" data-essential="' + escHTML(e.name) + '">'
        + '<div class="kd-essential-tile__sym">' + escHTML(e.name.charAt(0).toUpperCase()) + '</div>'
        + '<div class="kd-essential-tile__name">' + escHTML(e.name) + '</div>'
        + '<div class="kd-essential-tile__meta">' + escHTML(e.category) + '</div></div>';
    }).join('');
    const more = essentials.length > 60 ? '<div class="kd-more">— + ' + (essentials.length - 60) + ' more · scroll filter wired in polish pass —</div>' : '';
    return '<div class="kd-section-head">ALL ' + essentials.length + ' ESSENTIALS · CLICK TO DEEP-DIVE</div>'
      + '<div class="kd-essentials-grid">' + tilesHTML + '</div>' + more;
  }
  function _kdRenderProducts() {
    const products = _readProductsForKd();
    if (products.length === 0) return '<div class="kd-empty">— vault data not loaded · 59 known products live in regimen-label-lookup —</div>';
    const productsHTML = products.slice(0, 30).map(function (p) {
      return '<div class="kd-product-row"><div class="kd-product-row__icon">' + escHTML((p.name || '?').charAt(0).toUpperCase()) + '</div>'
        + '<div class="kd-product-row__body"><h4 class="kd-product-row__name">' + escHTML(p.name || '(unnamed)') + '</h4>'
        + '<div class="kd-product-row__meta">' + escHTML(p.brand || 'YGY') + ' · ' + ((p.nutrients && p.nutrients.length) || 0) + ' NUTRIENTS LISTED</div></div>'
        + '<span class="kd-product-row__verdict">VAULT</span></div>';
    }).join('');
    const more = products.length > 30 ? '<div class="kd-more">— + ' + (products.length - 30) + ' more · scroll wired in polish pass —</div>' : '';
    return '<div class="kd-section-head">PRODUCTS VAULT · ' + products.length + ' ENTRIES</div>' + productsHTML + more;
  }
  function _kdRenderDoctrine() {
    return KD_DOCTRINES.map(function (d) {
      return '<div class="kd-doctrine-card' + (d.featured ? ' featured' : '') + '">'
        + '<div class="kd-doctrine-card__id">' + escHTML(d.id) + (d.featured ? ' · CORNERSTONE' : '') + '</div>'
        + '<h4 class="kd-doctrine-card__title">' + escHTML(d.title) + '</h4>'
        + '<p class="kd-doctrine-card__body">' + escHTML(d.body) + '</p>'
        + '<div class="kd-doctrine-card__cite">' + escHTML(d.cite) + '</div></div>';
    }).join('');
  }
  // Knowledge tab renderers now accept an optional filter string to narrow
  // results. Filter is case-insensitive substring match against the most
  // identifying field per tab (title / name / etc.).
  function _kdRenderTab(tab, filter) {
    const f = (filter || '').toLowerCase().trim();
    if (tab === 'corpus') return _kdRenderCorpusFiltered(f);
    if (tab === 'essentials') return _kdRenderEssentialsFiltered(f);
    if (tab === 'products') return _kdRenderProductsFiltered(f);
    if (tab === 'doctrine') return _kdRenderDoctrineFiltered(f);
    return '';
  }

  function _kdMatches(f, ...fields) {
    if (!f) return true;
    return fields.some(function (v) { return String(v || '').toLowerCase().includes(f); });
  }

  function _kdRenderCorpusFiltered(f) {
    const matchedBooks = KD_BOOKS.filter(function (b) { return _kdMatches(f, b.title, b.id, b.author); });
    const booksHTML = matchedBooks.map(function (b) {
      return '<div class="kd-book-row"><div class="kd-book-row__spine"><span>' + escHTML(b.id) + '</span></div>'
        + '<div class="kd-book-row__body"><h4 class="kd-book-row__title">' + escHTML(b.title) + '</h4>'
        + '<div class="kd-book-row__meta">' + escHTML(b.author) + (b.chapters > 0 ? ' · ' + b.chapters + ' CHAPTERS' : '') + ' · ' + b.cites + ' CITES</div></div>'
        + '<div class="kd-book-row__count">' + b.cites + '<small>cites</small></div></div>';
    }).join('');
    // Featured citation hides when filtering
    const featured = f ? '' : '<div class="kd-featured-citation">'
      + '<div class="kd-featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>'
      + '<p class="kd-featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 3 essential fatty acids — 91 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>'
      + '<div class="kd-featured-citation__attr"><strong>Wallach</strong> · Dead Doctors Don\'t Lie · ch. 1 · paraphrase per primary corpus</div></div>';
    const head = '<div class="kd-section-head">' + (f ? matchedBooks.length + ' MATCHES · FILTER "' + escHTML(f) + '"' : 'PRIMARY CORPUS · WALLACH') + '</div>';
    if (f && matchedBooks.length === 0) return featured + head + '<div class="kd-empty">— no books matching "' + escHTML(f) + '" —</div>';
    return featured + head + booksHTML;
  }

  function _kdRenderEssentialsFiltered(f) {
    const essentials = _readEssentialsForKd();
    const matched = essentials.filter(function (e) { return _kdMatches(f, e.name, e.category); });
    if (matched.length === 0) {
      return '<div class="kd-section-head">' + (f ? '0 MATCHES · FILTER "' + escHTML(f) + '"' : 'ALL ESSENTIALS') + '</div>'
        + '<div class="kd-empty">— ' + (essentials.length === 0 ? 'essentials data not loaded' : 'no essentials matching "' + escHTML(f) + '"') + ' —</div>';
    }
    const tilesHTML = matched.slice(0, 60).map(function (e) {
      return '<div class="kd-essential-tile" data-essential="' + escHTML(e.name) + '">'
        + '<div class="kd-essential-tile__sym">' + escHTML(e.name.charAt(0).toUpperCase()) + '</div>'
        + '<div class="kd-essential-tile__name">' + escHTML(e.name) + '</div>'
        + '<div class="kd-essential-tile__meta">' + escHTML(e.category) + '</div></div>';
    }).join('');
    const more = matched.length > 60 ? '<div class="kd-more">— + ' + (matched.length - 60) + ' more —</div>' : '';
    const head = f
      ? '<div class="kd-section-head">' + matched.length + ' MATCHES · FILTER "' + escHTML(f) + '"</div>'
      : '<div class="kd-section-head">ALL ' + essentials.length + ' ESSENTIALS · CLICK TO DEEP-DIVE</div>';
    return head + '<div class="kd-essentials-grid">' + tilesHTML + '</div>' + more;
  }

  function _kdRenderProductsFiltered(f) {
    const products = _readProductsForKd();
    const matched = products.filter(function (p) { return _kdMatches(f, p.name, p.brand, p.category, p.tagline); });
    if (matched.length === 0) {
      return '<div class="kd-section-head">' + (f ? '0 MATCHES · FILTER "' + escHTML(f) + '"' : 'PRODUCTS VAULT') + '</div>'
        + '<div class="kd-empty">— ' + (products.length === 0 ? 'vault data not loaded' : 'no products matching "' + escHTML(f) + '"') + ' —</div>';
    }
    const productsHTML = matched.slice(0, 30).map(function (p) {
      return '<div class="kd-product-row"><div class="kd-product-row__icon">' + escHTML((p.name || '?').charAt(0).toUpperCase()) + '</div>'
        + '<div class="kd-product-row__body"><h4 class="kd-product-row__name">' + escHTML(p.name || '(unnamed)') + '</h4>'
        + '<div class="kd-product-row__meta">' + escHTML(p.brand || 'YGY') + ' · ' + ((p.nutrients && p.nutrients.length) || 0) + ' NUTRIENTS LISTED</div></div>'
        + '<span class="kd-product-row__verdict">VAULT</span></div>';
    }).join('');
    const more = matched.length > 30 ? '<div class="kd-more">— + ' + (matched.length - 30) + ' more —</div>' : '';
    const head = f
      ? '<div class="kd-section-head">' + matched.length + ' MATCHES · FILTER "' + escHTML(f) + '"</div>'
      : '<div class="kd-section-head">PRODUCTS VAULT · ' + products.length + ' ENTRIES</div>';
    return head + productsHTML + more;
  }

  function _kdRenderDoctrineFiltered(f) {
    const matched = KD_DOCTRINES.filter(function (d) { return _kdMatches(f, d.title, d.body, d.cite, d.id); });
    if (f && matched.length === 0) {
      return '<div class="kd-section-head">0 MATCHES · FILTER "' + escHTML(f) + '"</div>'
        + '<div class="kd-empty">— no doctrines matching "' + escHTML(f) + '" —</div>';
    }
    const head = f ? '<div class="kd-section-head">' + matched.length + ' MATCHES · FILTER "' + escHTML(f) + '"</div>' : '';
    const cards = matched.map(function (d) {
      return '<div class="kd-doctrine-card' + (d.featured ? ' featured' : '') + '">'
        + '<div class="kd-doctrine-card__id">' + escHTML(d.id) + (d.featured ? ' · CORNERSTONE' : '') + '</div>'
        + '<h4 class="kd-doctrine-card__title">' + escHTML(d.title) + '</h4>'
        + '<p class="kd-doctrine-card__body">' + escHTML(d.body) + '</p>'
        + '<div class="kd-doctrine-card__cite">' + escHTML(d.cite) + '</div></div>';
    }).join('');
    return head + cards;
  }

  function _kdRenderShell(activeTab, filter) {
    const essentialsCount = _readEssentialsForKd().length;
    const productsCount = _readProductsForKd().length;
    const tabs = [
      { id: 'corpus',     label: 'Corpus',     count: KD_BOOKS.length + ' BOOKS' },
      { id: 'essentials', label: 'Essentials', count: essentialsCount + ' TILES' },
      { id: 'products',   label: 'Products',   count: (productsCount || 59) + ' KNOWN' },
      { id: 'doctrine',   label: 'Doctrine',   count: KD_DOCTRINES.length + ' RULES' },
    ];
    const tabsHTML = tabs.map(function (t) {
      return '<button class="kd-tab' + (t.id === activeTab ? ' active' : '') + '" data-kd-tab="' + t.id + '">'
        + '<span>' + escHTML(t.label) + '</span>'
        + '<span class="kd-tab__count">' + escHTML(t.count) + '</span></button>';
    }).join('');
    const filterVal = escHTML(filter || '');
    return '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<header class="kd-head"><div>'
      + '<div class="kd-eyebrow"><span class="pulse-dot"></span>DRAWER · <span class="ds-cipher" data-cipher-set="hexa">KN·' + _hex(activeTab.length * 7) + '</span></div>'
      + '<h2 class="kd-title">Knowledge</h2>'
      + '<div class="kd-sub">// the corpus, the essentials, the products, the doctrine</div>'
      + '</div><button class="kd-close" data-kd-action="close" title="Close (Esc)">×</button></header>'
      + '<div class="kd-tabs">' + tabsHTML + '</div>'
      + '<div class="kd-search"><span class="kd-search-icon">⌕</span>'
      + '<input class="kd-search-input" type="text" value="' + filterVal + '" placeholder="SEARCH ' + activeTab.toUpperCase() + '…" />'
      + '</div>'
      + '<div class="kd-body">' + _kdRenderTab(activeTab, filter) + '</div>'
      + '<footer class="kd-footer">'
      + '<button class="kd-action" data-kd-action="pin"><span class="kd-action__glyph">⊕</span>PIN</button>'
      + '<button class="kd-action" data-kd-action="share"><span class="kd-action__glyph">↗</span>SHARE</button>'
      + '<button class="kd-action" data-kd-action="cite"><span class="kd-action__glyph">⌑</span>CITE</button>'
      + '<span class="kd-action__spacer"></span>'
      + '<button class="kd-action kd-action--expand" data-kd-action="expand"><span class="kd-action__glyph">⤢</span>EXPAND</button>'
      + '</footer>';
  }

  const KNOWLEDGE_CSS = [
    '#drawer-knowledge-mount{position:absolute;top:0;bottom:0;left:220px;width:600px;background:var(--ds-paper);border-right:1px solid var(--ds-rule);display:none;flex-direction:column;overflow:hidden;box-shadow:8px 0 24px -8px rgba(26,22,18,.22),16px 0 56px -16px rgba(26,22,18,.18);z-index:10;transition:width var(--ds-motion-base) var(--ds-ease-out);pointer-events:none}',
    '#drawer-knowledge-mount.kd-open{display:flex;pointer-events:auto}',
    '#drawer-knowledge-mount.kd-expanded{width:calc(100vw - 220px)}',
    '#drawer-knowledge-mount > *{pointer-events:auto}',
    '#drawer-knowledge-mount::after{content:"";position:absolute;top:var(--ds-space-7);bottom:var(--ds-space-7);right:-1px;width:1px;background:linear-gradient(to bottom,transparent 0%,var(--ds-accent) 8%,var(--ds-accent) 12%,transparent 14%,transparent 86%,var(--ds-accent) 88%,var(--ds-accent) 92%,transparent 100%);z-index:1}',
    '.kd-head{padding:var(--ds-space-5);background:var(--ds-paper-darker);border-bottom:1px solid var(--ds-rule);position:relative;display:grid;grid-template-columns:1fr auto;align-items:start;gap:var(--ds-space-3)}',
    '.kd-head::after{content:"";position:absolute;left:var(--ds-space-5);right:var(--ds-space-5);bottom:-1px;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 6%,var(--ds-accent) 13%,transparent 15%,transparent 85%,var(--ds-tech) 88%,var(--ds-tech) 92%,transparent 95%)}',
    '.kd-eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.kd-eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 6px var(--ds-accent-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.kd-title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-2xl);font-weight:700;color:var(--ds-ink);letter-spacing:.01em;text-transform:uppercase;margin:0;line-height:1}',
    '.kd-sub{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:var(--ds-space-2)}',
    '.kd-close{width:32px;height:32px;background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink-soft);font-size:1.1rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-mono);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.kd-close:hover{border-color:var(--ds-ink);color:var(--ds-ink)}',
    '.kd-tabs{display:grid;grid-template-columns:repeat(4,1fr);background:var(--ds-paper);border-bottom:1px solid var(--ds-rule-soft);position:relative}',
    '.kd-tab{background:transparent;border:0;padding:var(--ds-space-3) var(--ds-space-2);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-ink-soft);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:all var(--ds-motion-fast) var(--ds-ease-out);border-bottom:2px solid transparent}',
    '.kd-tab:hover{color:var(--ds-ink);background:var(--ds-paper-deep)}',
    '.kd-tab.active{color:var(--ds-accent-deep);background:var(--ds-paper);border-bottom-color:var(--ds-accent)}',
    '.kd-tab.active::before{content:"";position:absolute;top:0;left:30%;right:30%;height:2px;background:linear-gradient(90deg,transparent,var(--ds-accent),transparent);box-shadow:0 0 8px var(--ds-accent)}',
    '.kd-tab__count{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:.05em;color:var(--ds-ink-faint);font-weight:600}',
    '.kd-tab.active .kd-tab__count{color:var(--ds-accent)}',
    '.kd-search{padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-deep);border-bottom:1px solid var(--ds-rule-soft);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.kd-search-icon{font-family:var(--ds-font-mono);color:var(--ds-tech);font-size:var(--ds-text-md)}',
    '.kd-search-input{flex:1;background:transparent;border:0;outline:none;font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);color:var(--ds-ink);padding:4px 0}',
    '.kd-search-input::placeholder{color:var(--ds-ink-faint);text-transform:uppercase;font-size:var(--ds-text-xs);letter-spacing:var(--ds-track-wide)}',
    '.kd-search-kbd{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);background:var(--ds-paper);border:1px solid var(--ds-rule);padding:2px 6px;border-radius:var(--ds-radius-xs)}',
    '.kd-body{flex:1;overflow-y:auto;padding:var(--ds-space-4) var(--ds-space-5)}',
    '.kd-section-head{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2);margin:var(--ds-space-4) 0 var(--ds-space-3)}',
    '.kd-section-head::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
    '.kd-section-head:first-child{margin-top:0}',
    '.kd-empty,.kd-more{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);text-align:center;padding:var(--ds-space-4)}',
    '.kd-featured-citation{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);border-radius:var(--ds-radius-md);padding:var(--ds-space-5);color:var(--ds-paper);position:relative;overflow:hidden;box-shadow:var(--ds-elev-2);margin-bottom:var(--ds-space-4)}',
    '.kd-featured-citation::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 8%,var(--ds-accent) 18%,transparent 22%,transparent 78%,var(--ds-tech) 82%,var(--ds-tech) 92%,transparent 95%)}',
    '.kd-featured-citation::after{content:"";position:absolute;top:-20px;right:-20px;width:140px;height:140px;background:radial-gradient(circle,var(--ds-accent) 0%,transparent 65%);opacity:.2;pointer-events:none}',
    '.kd-featured-citation__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent-bright);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2);margin-bottom:var(--ds-space-3);position:relative}',
    '.kd-featured-citation__eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 8px var(--ds-accent)}',
    '.kd-featured-citation__quote{font-family:Playfair Display,Georgia,serif;font-style:italic;font-size:var(--ds-text-md);line-height:1.45;color:var(--ds-paper);margin:0 0 var(--ds-space-3);position:relative}',
    '.kd-featured-citation__attr{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-tech-dim);border-top:1px solid var(--ds-ink-medium);padding-top:var(--ds-space-2);position:relative}',
    '.kd-featured-citation__attr strong{color:var(--ds-accent-bright);font-weight:600}',
    '.kd-book-row{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3) var(--ds-space-4);display:grid;grid-template-columns:36px 1fr auto;gap:var(--ds-space-3);align-items:center;cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out);margin-bottom:var(--ds-space-2)}',
    '.kd-book-row:hover{border-color:var(--ds-accent);box-shadow:0 2px 8px -2px rgba(255,126,60,.15)}',
    '.kd-book-row__spine{width:36px;height:44px;background:linear-gradient(135deg,var(--ds-accent-deep) 0%,var(--ds-accent-hot) 100%);border-radius:2px;box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 2px 6px -1px rgba(255,126,60,.4);position:relative;display:flex;align-items:center;justify-content:center}',
    '.kd-book-row__spine span{font-family:var(--ds-font-display-artifact);font-size:.7rem;color:var(--ds-paper-light);letter-spacing:.05em;writing-mode:vertical-rl;text-orientation:mixed}',
    '.kd-book-row__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.15}',
    '.kd-book-row__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:2px}',
    '.kd-book-row__count{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep);letter-spacing:.02em}',
    '.kd-book-row__count small{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);letter-spacing:var(--ds-track-wider);text-transform:uppercase;display:block;margin-top:2px;font-weight:500}',
    '.kd-essentials-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--ds-space-2)}',
    '.kd-essential-tile{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3);cursor:pointer;display:flex;flex-direction:column;gap:4px;position:relative;transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.kd-essential-tile:hover{border-color:var(--ds-accent);transform:translateY(-1px)}',
    '.kd-essential-tile__sym{font-family:Playfair Display,Georgia,serif;font-size:1.5rem;color:var(--ds-ink);letter-spacing:.02em;line-height:1}',
    '.kd-essential-tile__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase}',
    '.kd-essential-tile__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:auto}',
    '.kd-product-row{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-left:3px solid var(--ds-status-ok);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3) var(--ds-space-4);display:grid;grid-template-columns:36px 1fr auto;gap:var(--ds-space-3);align-items:center;cursor:pointer;margin-bottom:var(--ds-space-2);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.kd-product-row:hover{border-color:var(--ds-accent)}',
    '.kd-product-row__icon{width:36px;height:36px;background:linear-gradient(135deg,var(--ds-paper-darker) 0%,var(--ds-paper-deep) 100%);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep)}',
    '.kd-product-row__name{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.kd-product-row__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.kd-product-row__verdict{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:var(--ds-radius-pill);color:var(--ds-status-ok);background:var(--ds-status-ok-soft)}',
    '.kd-doctrine-card{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);padding:var(--ds-space-4);margin-bottom:var(--ds-space-3);position:relative;cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out);overflow:hidden}',
    '.kd-doctrine-card:hover{border-color:var(--ds-accent);box-shadow:0 4px 12px -3px rgba(255,126,60,.18)}',
    '.kd-doctrine-card__id{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-tech);font-weight:600;margin-bottom:var(--ds-space-1)}',
    '.kd-doctrine-card__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0 0 var(--ds-space-2);line-height:1.15}',
    '.kd-doctrine-card__body{font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);line-height:1.5;color:var(--ds-ink-medium);font-weight:500;margin-bottom:var(--ds-space-3)}',
    '.kd-doctrine-card__cite{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);border-top:1px solid var(--ds-rule-soft);padding-top:var(--ds-space-2)}',
    '.kd-doctrine-card.featured{background:linear-gradient(135deg,var(--ds-accent-wash) 0%,var(--ds-paper) 100%);border-color:var(--ds-accent);box-shadow:0 6px 16px -4px rgba(255,126,60,.2)}',
    '.kd-doctrine-card.featured::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 15%,var(--ds-accent) 35%,transparent 40%)}',
    '.kd-footer{padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-darker);border-top:1px solid var(--ds-rule);display:flex;gap:var(--ds-space-2);align-items:center}',
    '.kd-action{background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;padding:.45rem .85rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:inline-flex;align-items:center;gap:var(--ds-space-2);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.kd-action:hover{border-color:var(--ds-accent);color:var(--ds-accent-deep)}',
    '.kd-action__glyph{font-family:var(--ds-font-mono);color:var(--ds-tech)}',
    '.kd-action__spacer{flex:1}',
  ].join('\n');

  let knowledgeStyleInjected = false;
  function injectKnowledgeStyles() {
    if (knowledgeStyleInjected) return;
    knowledgeStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/knowledge.ts');
    style.textContent = KNOWLEDGE_CSS;
    document.head.appendChild(style);
  }

  function mountKnowledge(container) {
    injectKnowledgeStyles();
    let kdOpen = false;
    let kdExpanded = false;
    let kdActiveTab = 'corpus';
    let kdFilter = '';
    function render() {
      container.innerHTML = _kdRenderShell(kdActiveTab, kdFilter);
      // Restore input focus + cursor to end after re-render so the user
      // can keep typing without their cursor jumping.
      const input = container.querySelector('.kd-search-input');
      if (input && kdFilter) {
        try { input.focus(); input.setSelectionRange(kdFilter.length, kdFilter.length); }
        catch { /* ignore */ }
      }
    }
    function open() {
      if (kdOpen) return;
      kdOpen = true;
      container.classList.add('kd-open');
      render();
    }
    function close() {
      if (!kdOpen) return;
      kdOpen = false;
      kdExpanded = false;
      kdFilter = '';
      container.classList.remove('kd-open', 'kd-expanded');
      container.innerHTML = '';
    }
    function toggle() { kdOpen ? close() : open(); }
    function toggleExpanded() {
      kdExpanded = !kdExpanded;
      container.classList.toggle('kd-expanded', kdExpanded);
    }
    function clickHandler(ev) {
      const target = ev.target;
      const tabBtn = target && target.closest ? target.closest('[data-kd-tab]') : null;
      if (tabBtn) {
        const next = tabBtn.getAttribute('data-kd-tab');
        if (next && next !== kdActiveTab) { kdActiveTab = next; kdFilter = ''; render(); }
        return;
      }
      const actionEl = target && target.closest ? target.closest('[data-kd-action]') : null;
      if (actionEl) {
        const action = actionEl.getAttribute('data-kd-action');
        if (action === 'close') close();
        else if (action === 'expand') toggleExpanded();
        else console.info('[views/knowledge] action stub:', action);
      }
    }
    function inputHandler(ev) {
      if (!ev.target || !ev.target.classList || !ev.target.classList.contains('kd-search-input')) return;
      kdFilter = ev.target.value;
      render();
    }
    container.addEventListener('click', clickHandler);
    container.addEventListener('input', inputHandler);
    on('regimen:changed', function () { if (kdOpen) render(); });
    return { open: open, close: close, toggle: toggle, toggleExpanded: toggleExpanded, isOpen: function () { return kdOpen; } };
  }


  // ── views/journey.ts (Round 5·B) ────────────────────────────────────────
  // 600px overlay drawer, 4 tabs: Timeline / Goals / Check-ins / Milestones.
  // Timeline synthesizes events from regimen, scan history, and coverage
  // changes (real data). Goals + Check-ins + Milestones are demo stubs until
  // their own state modules ship in a later round.

  function _jdBuildTimeline() {
    const events = [];

    // 1. User-logged events (from the LOG EVENT form) — these are first-class
    _jdLoadLoggedEvents().forEach(function (e) {
      const isSymptom = e.kind === 'symptom' || e.kind === 'checkin' || (e.sev != null);
      events.push({
        ts: e.ts || new Date().toISOString(),
        kind: isSymptom ? 'symptom' : (e.kind || 'milestone'),
        title: isSymptom
          ? 'Check-in logged · ' + (e.sev || '?') + '/5 severity'
          : (e.title || 'Logged event'),
        detail: e.note || e.detail || '',
        delta: Array.isArray(e.tags) && e.tags.length ? '#' + e.tags.join(' #') : null,
      });
    });

    // 2. Scan events
    const scans = _getScanHistory();
    scans.slice(0, 5).forEach(function (s) {
      events.push({
        ts: s.ts,
        kind: 'scan',
        title: 'Scanned ' + (s.label && s.label.name ? s.label.name : '(unnamed)'),
        detail: 'Verdict: ' + s.verdict + ' · ' + (s.gapFills ? s.gapFills.length : 0) + ' gap-fills detected',
        delta: '+' + (s.gapFills ? s.gapFills.length : 0) + ' essentials touched',
      });
    });

    // 3. Regimen items (most recent additions)
    const regimen = _loadRegimen();
    regimen.items.slice(0, 4).forEach(function (it) {
      events.push({
        ts: it.addedDate ? (it.addedDate + 'T12:00:00Z') : new Date().toISOString(),
        kind: 'regimen',
        title: 'Added ' + (it.label && it.label.name ? it.label.name : '(unnamed)') + ' to regimen',
        detail: 'Provenance: ' + (it.provenance || 'unknown'),
      });
    });

    // 4. Fallback only if NOTHING exists
    if (events.length === 0) {
      events.push({
        ts: new Date().toISOString(),
        kind: 'milestone',
        title: 'Dashboard v3.27 — Round 5 complete',
        detail: 'All 6 workspaces migrated to the new design system. Polish pass next.',
        delta: '+6 workspaces',
      });
    }

    events.sort(function (a, b) { return new Date(b.ts).getTime() - new Date(a.ts).getTime(); });
    return events;
  }

  function _jdTimeAgo(iso) {
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const min = Math.floor(ms / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return min + 'm ago';
      const h = Math.floor(min / 60);
      if (h < 24) return h + 'h ago';
      const d = Math.floor(h / 24);
      if (d < 7) return d + 'd ago';
      return new Date(iso).toLocaleDateString();
    } catch { return ''; }
  }

  function _jdRenderTimeline() {
    const events = _jdBuildTimeline();
    if (events.length === 0) return '<div class="jd-empty">— no events logged yet —</div>';

    // Group by day
    const byDay = {};
    events.forEach(function (e) {
      const day = e.ts.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);
    });
    const dayKeys = Object.keys(byDay).sort(function (a, b) { return b.localeCompare(a); });

    let html = '<div class="jd-timeline">';
    dayKeys.forEach(function (day) {
      let dayLabel = day;
      try { dayLabel = new Date(day + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase(); }
      catch { /* ignore */ }
      html += '<div class="jd-tl-day"><div class="jd-tl-day__stamp">' + escHTML(dayLabel) + '</div>';
      byDay[day].forEach(function (e) {
        const kindGlyph = e.kind === 'scan' ? '⌖' : e.kind === 'regimen' ? '▤' : e.kind === 'coverage' ? '◉' : e.kind === 'symptom' ? '!' : '✦';
        html += '<div class="jd-tl-event jd-tl-event--' + e.kind + '">'
          + '<div class="jd-tl-event__dot"></div>'
          + '<div class="jd-tl-event__glyph">' + kindGlyph + '</div>'
          + '<div class="jd-tl-event__body">'
          + '<div class="jd-tl-event__meta"><span class="jd-tl-event__kind">' + e.kind.toUpperCase() + '</span> · ' + escHTML(_jdTimeAgo(e.ts)) + '</div>'
          + '<h4 class="jd-tl-event__title">' + escHTML(e.title) + '</h4>'
          + (e.detail ? '<div class="jd-tl-event__detail">' + escHTML(e.detail) + '</div>' : '')
          + (e.delta ? '<span class="jd-tl-event__delta jd-tl-event__delta--ok">' + escHTML(e.delta) + '</span>' : '')
          + '</div></div>';
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  const JD_DEMO_GOALS = [
    { id: 'G·4E22', title: 'Close all 35 rare-trace tiles', pct: 82, num: 29, den: 35, due: 'SEP 01', featured: true, blockers: [] },
    { id: 'G·8A17', title: 'Add Omega-3 source (currently O6 only)', pct: 4, num: 0, den: 3, due: 'JUL 15', featured: false, blockers: ['Scan Ultimate EFA', 'Pick source'] },
    { id: 'G·1C9F', title: '60-day BTT layering streak', pct: 23, num: 14, den: 60, due: 'AUG 19', featured: false, blockers: [] },
  ];

  function _jdRenderGoals() {
    return JD_DEMO_GOALS.map(function (g) {
      const blockersHTML = g.blockers.length === 0 ? '' :
        '<div class="jd-goal__blockers">BLOCKED BY · '
        + g.blockers.map(function (b) { return '<span class="jd-goal__blocker-chip">' + escHTML(b) + '</span>'; }).join('')
        + '</div>';
      return '<div class="jd-goal' + (g.featured ? ' featured' : '') + '">'
        + '<header class="jd-goal__head"><div>'
        + '<div class="jd-goal__id">GOAL · <span class="ds-cipher" data-cipher-set="hexa">' + g.id + '</span>' + (g.featured ? ' · FEATURED' : '') + '</div>'
        + '<h4 class="jd-goal__title">' + escHTML(g.title) + '</h4>'
        + '</div><div class="jd-goal__due">DUE<strong>' + escHTML(g.due) + '</strong></div></header>'
        + '<div class="jd-goal__progress"><span class="jd-goal__pct">' + g.pct + '<small>%</small></span>'
        + '<span class="jd-goal__counts"><strong>' + g.num + '</strong> / ' + g.den + '</span></div>'
        + '<div class="jd-goal__bar"><div class="jd-goal__bar-fill" style="width: ' + Math.max(2, g.pct) + '%;"></div></div>'
        + blockersHTML
        + '</div>';
    }).join('') + '<div class="jd-note">— goal-edit wired in polish pass · this is the read view —</div>';
  }

  const JD_DEMO_CHECKINS = [
    { date: '20', mo: 'JUN', sev: 3, note: 'Sugar cravings hit hard around 3pm. Crashed after lunch. Sleep was okay though — woke up only once.', tags: ['CRAVINGS', 'ENERGY-LOW', 'PM'], crossref: 'chromium gap in active slot' },
    { date: '19', mo: 'JUN', sev: 4, note: 'Great morning. Energy steady through the workday. Took BTT before breakfast, PDM at lunch.', tags: ['ENERGY-GOOD', 'FOCUS'], crossref: null },
    { date: '17', mo: 'JUN', sev: 2, note: 'Joints stiff in the morning. Looser by mid-day. Started PDM 4 days ago.', tags: ['JOINTS', 'AM'], crossref: 'PDM started JUN·13 · 4d ago' },
  ];

  function _jdLoadLoggedEvents() {
    try {
      const r = JSON.parse(localStorage.getItem(JOURNEY_LOG_KEY) || '[]');
      return Array.isArray(r) ? r : [];
    } catch { return []; }
  }

  function _jdRenderOneCheckin(c) {
    const sevPips = Array(5).fill(0).map(function (_, i) {
      let cls = '';
      if (i < c.sev) cls = c.sev >= 4 ? 'fill-ok' : c.sev >= 3 ? 'fill-warn' : 'fill-warn';
      return '<span class="jd-sev-pip ' + cls + '"></span>';
    }).join('');
    const sevLabel = c.sev >= 4 ? 'STRONG' : c.sev >= 3 ? 'MODERATE' : 'MILD';
    const tagsHTML = (c.tags || []).map(function (t) { return '<span class="jd-checkin__tag">' + escHTML(t) + '</span>'; }).join('');
    const crossref = c.crossref ? '<div class="jd-checkin__correlate">CROSS-REF · <strong>' + escHTML(c.crossref) + '</strong></div>' : '';
    return '<div class="jd-checkin">'
      + '<div class="jd-checkin__date"><div class="jd-checkin__date-day">' + escHTML(c.date) + '</div>'
      + '<div class="jd-checkin__date-mo">' + escHTML(c.mo) + '</div></div>'
      + '<div class="jd-checkin__body">'
      + '<div class="jd-checkin__row"><div class="jd-checkin__severity">' + sevPips + '</div>'
      + '<span class="jd-checkin__sev-label"><strong>' + c.sev + ' / 5</strong> · ' + sevLabel + '</span></div>'
      + '<p class="jd-checkin__note">' + escHTML(c.note) + '</p>'
      + '<div class="jd-checkin__tags">' + tagsHTML + '</div>'
      + crossref + '</div></div>';
  }

  function _jdLoggedToCheckin(e) {
    let date = '?', mo = '?';
    try {
      const d = new Date(e.ts);
      date = String(d.getDate());
      mo = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    } catch { /* ignore */ }
    return {
      date: date, mo: mo,
      sev: e.sev || 3,
      note: e.note || '',
      tags: Array.isArray(e.tags) ? e.tags : [],
      crossref: null,
    };
  }

  function _jdRenderCheckins() {
    const entryStub = '<button class="jd-checkin-entry" data-jd-action="log"><span class="jd-checkin-entry__glyph">+</span>QUICK CHECK-IN — HOW ARE YOU FEELING?<span class="jd-checkin-entry__spacer"></span><span class="jd-checkin-entry__kbd">⌘.</span></button>';
    // Real logged entries first (newest top), then demo entries below
    const logged = _jdLoadLoggedEvents()
      .filter(function (e) { return e.kind === 'symptom' || e.kind === 'checkin' || (e.sev != null && e.note); })
      .map(_jdLoggedToCheckin);
    const loggedHTML = logged.map(_jdRenderOneCheckin).join('');
    const demoHTML = JD_DEMO_CHECKINS.map(_jdRenderOneCheckin).join('');
    const demoHead = '<div class="jd-section-head">— DEMO ENTRIES BELOW —</div>';
    const yourCount = logged.length > 0
      ? '<div class="jd-section-head">YOUR CHECK-INS · ' + logged.length + ' LOGGED</div>'
      : '';
    return entryStub + yourCount + loggedHTML + demoHead + demoHTML
      + '<div class="jd-note">— your real check-ins persist to localStorage (key: wallachJourneyLog_v1) —</div>';
  }

  const JD_DEMO_MILESTONES = [
    { id: 'MILE·09', badge: '35', title: 'First PDM Scan Adopted', doctrine: 'aggregate-vehicle coverage', earned: 'TODAY', fresh: true, locked: false },
    { id: 'MILE·08', badge: '11', title: 'All Foundational Minerals Covered', doctrine: 'foundational-11 closed', earned: 'JUN·02 · 19D AGO', fresh: false, locked: false },
    { id: 'MILE·07', badge: '7d', title: '7-Day BTT Layering Streak', doctrine: 'BTT layering order', earned: 'JUN·11 · 10D AGO', fresh: false, locked: false },
    { id: 'MILE·10', badge: '60d', title: '60-Day BTT Layering Streak', doctrine: 'PROGRESS · 14 / 60 DAYS', earned: 'UNLOCKS · AUG·19', fresh: false, locked: true },
    { id: 'MILE·22', badge: '92', title: 'All 92 Essentials Covered', doctrine: 'full-spectrum closure · LEGENDARY', earned: 'PROGRESS · 47 / 92', fresh: false, locked: true },
  ];

  function _jdRenderMilestones() {
    return JD_DEMO_MILESTONES.map(function (m) {
      const cls = 'jd-milestone' + (m.fresh ? ' fresh' : '') + (m.locked ? ' locked' : '');
      return '<div class="' + cls + '">'
        + '<div class="jd-milestone__badge">' + escHTML(m.badge) + '</div>'
        + '<div class="jd-milestone__body">'
        + '<div class="jd-milestone__id">' + escHTML(m.id) + (m.fresh ? ' · JUST EARNED' : m.locked ? ' · LOCKED' : '') + '</div>'
        + '<h4 class="jd-milestone__title">' + escHTML(m.title) + '</h4>'
        + '<div class="jd-milestone__doctrine">' + (m.locked && !m.doctrine.includes('PROGRESS') ? 'DOCTRINE · ' : m.locked ? '' : 'DOCTRINE · ') + '<strong>' + escHTML(m.doctrine) + '</strong></div>'
        + '<div class="jd-milestone__earned">' + escHTML(m.earned) + '</div>'
        + '</div></div>';
    }).join('') + '<div class="jd-note">— milestone triggers wired in polish pass · these are demo entries —</div>';
  }

  function _jdRenderTab(tab) {
    if (tab === 'timeline') return _jdRenderTimeline();
    if (tab === 'goals') return _jdRenderGoals();
    if (tab === 'checkins') return _jdRenderCheckins();
    if (tab === 'milestones') return _jdRenderMilestones();
    return '';
  }

  function _jdRenderShell(activeTab) {
    const tlEventsCount = _jdBuildTimeline().length;
    const tabs = [
      { id: 'timeline',   label: 'Timeline',   count: tlEventsCount + ' EVENTS' },
      { id: 'goals',      label: 'Goals',      count: JD_DEMO_GOALS.length + ' ACTIVE' },
      { id: 'checkins',   label: 'Check-ins',  count: JD_DEMO_CHECKINS.length + ' LOGGED' },
      { id: 'milestones', label: 'Milestones', count: JD_DEMO_MILESTONES.filter(function (m) { return !m.locked; }).length + ' / ' + JD_DEMO_MILESTONES.length },
    ];
    const tabsHTML = tabs.map(function (t) {
      return '<button class="jd-tab' + (t.id === activeTab ? ' active' : '') + '" data-jd-tab="' + t.id + '">'
        + '<span>' + escHTML(t.label) + '</span>'
        + '<span class="jd-tab__count">' + escHTML(t.count) + '</span></button>';
    }).join('');
    return '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<header class="jd-head"><div>'
      + '<div class="jd-eyebrow"><span class="pulse-dot"></span>DRAWER · <span class="ds-cipher" data-cipher-set="hexa">JN·' + _hex(activeTab.length * 11) + '</span></div>'
      + '<h2 class="jd-title">Journey</h2>'
      + '<div class="jd-sub">// timeline · goals · check-ins · milestones</div>'
      + '</div><button class="jd-close" data-jd-action="close" title="Close (Esc)">×</button></header>'
      + '<div class="jd-tabs">' + tabsHTML + '</div>'
      + '<div class="jd-search"><span class="jd-search-icon">⌕</span>'
      + '<input class="jd-search-input" type="text" placeholder="SEARCH ' + activeTab.toUpperCase() + '…" />'
      + '</div>'
      + '<div class="jd-body">' + _jdRenderTab(activeTab) + '</div>'
      + '<footer class="jd-footer">'
      + '<button class="jd-action jd-action--primary" data-jd-action="log"><span class="jd-action__glyph">+</span>LOG EVENT</button>'
      + '<button class="jd-action" data-jd-action="pin"><span class="jd-action__glyph">⊕</span>PIN</button>'
      + '<button class="jd-action" data-jd-action="export"><span class="jd-action__glyph">⇣</span>EXPORT</button>'
      + '<span class="jd-action__spacer"></span>'
      + '<button class="jd-action jd-action--expand" data-jd-action="expand"><span class="jd-action__glyph">⤢</span>EXPAND</button>'
      + '</footer>';
  }

  const JOURNEY_CSS = [
    '#drawer-journey-mount{position:absolute;top:0;bottom:0;left:220px;width:600px;background:var(--ds-paper);border-right:1px solid var(--ds-rule);display:none;flex-direction:column;overflow:hidden;box-shadow:8px 0 24px -8px rgba(26,22,18,.22),16px 0 56px -16px rgba(26,22,18,.18);z-index:10;transition:width var(--ds-motion-base) var(--ds-ease-out);pointer-events:none}',
    '#drawer-journey-mount.jd-open{display:flex;pointer-events:auto}',
    '#drawer-journey-mount.jd-expanded{width:calc(100vw - 220px)}',
    '#drawer-journey-mount > *{pointer-events:auto}',
    '#drawer-journey-mount::after{content:"";position:absolute;top:var(--ds-space-7);bottom:var(--ds-space-7);right:-1px;width:1px;background:linear-gradient(to bottom,transparent 0%,var(--ds-accent) 8%,var(--ds-accent) 12%,transparent 14%,transparent 86%,var(--ds-accent) 88%,var(--ds-accent) 92%,transparent 100%);z-index:1}',
    '.jd-head{padding:var(--ds-space-5);background:var(--ds-paper-darker);border-bottom:1px solid var(--ds-rule);position:relative;display:grid;grid-template-columns:1fr auto;align-items:start;gap:var(--ds-space-3)}',
    '.jd-head::after{content:"";position:absolute;left:var(--ds-space-5);right:var(--ds-space-5);bottom:-1px;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 6%,var(--ds-accent) 13%,transparent 15%,transparent 85%,var(--ds-tech) 88%,var(--ds-tech) 92%,transparent 95%)}',
    '.jd-eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.jd-eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 6px var(--ds-accent-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.jd-title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-2xl);font-weight:700;color:var(--ds-ink);letter-spacing:.01em;text-transform:uppercase;margin:0;line-height:1}',
    '.jd-sub{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:var(--ds-space-2)}',
    '.jd-close{width:32px;height:32px;background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink-soft);font-size:1.1rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-mono);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.jd-close:hover{border-color:var(--ds-ink);color:var(--ds-ink)}',
    '.jd-tabs{display:grid;grid-template-columns:repeat(4,1fr);background:var(--ds-paper);border-bottom:1px solid var(--ds-rule-soft);position:relative}',
    '.jd-tab{background:transparent;border:0;padding:var(--ds-space-3) var(--ds-space-2);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-ink-soft);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:all var(--ds-motion-fast) var(--ds-ease-out);border-bottom:2px solid transparent}',
    '.jd-tab:hover{color:var(--ds-ink);background:var(--ds-paper-deep)}',
    '.jd-tab.active{color:var(--ds-accent-deep);background:var(--ds-paper);border-bottom-color:var(--ds-accent)}',
    '.jd-tab.active::before{content:"";position:absolute;top:0;left:30%;right:30%;height:2px;background:linear-gradient(90deg,transparent,var(--ds-accent),transparent);box-shadow:0 0 8px var(--ds-accent)}',
    '.jd-tab__count{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:.05em;color:var(--ds-ink-faint);font-weight:600}',
    '.jd-tab.active .jd-tab__count{color:var(--ds-accent)}',
    '.jd-search{padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-deep);border-bottom:1px solid var(--ds-rule-soft);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.jd-search-icon{font-family:var(--ds-font-mono);color:var(--ds-tech);font-size:var(--ds-text-md)}',
    '.jd-search-input{flex:1;background:transparent;border:0;outline:none;font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);color:var(--ds-ink);padding:4px 0}',
    '.jd-search-input::placeholder{color:var(--ds-ink-faint);text-transform:uppercase;font-size:var(--ds-text-xs);letter-spacing:var(--ds-track-wide)}',
    '.jd-body{flex:1;overflow-y:auto;padding:var(--ds-space-4) var(--ds-space-5)}',
    '.jd-empty,.jd-note{font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);text-align:center;padding:var(--ds-space-4)}',
    '.jd-section-head{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600;display:flex;align-items:center;gap:var(--ds-space-2);margin:var(--ds-space-4) 0 var(--ds-space-3)}',
    '.jd-section-head::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
    // ─── TIMELINE ───
    '.jd-timeline{position:relative;padding-left:28px}',
    '.jd-timeline::before{content:"";position:absolute;left:11px;top:8px;bottom:8px;width:2px;background:linear-gradient(to bottom,var(--ds-accent) 0%,var(--ds-rule) 8%,var(--ds-rule) 92%,transparent 100%)}',
    '.jd-tl-day{position:relative;padding-bottom:var(--ds-space-5)}',
    '.jd-tl-day__stamp{position:relative;font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:700;margin-bottom:var(--ds-space-2);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.jd-tl-day__stamp::before{content:"";position:absolute;left:-23px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--ds-accent);box-shadow:0 0 0 3px var(--ds-paper),0 0 0 4px var(--ds-accent),0 0 12px var(--ds-accent)}',
    '.jd-tl-event{position:relative;display:grid;grid-template-columns:24px 1fr;gap:var(--ds-space-3);padding:var(--ds-space-2) 0;margin-bottom:var(--ds-space-2)}',
    '.jd-tl-event__dot{position:absolute;left:-23px;top:16px;width:8px;height:8px;border-radius:50%;background:var(--ds-paper);border:2px solid var(--ds-rule-bright);z-index:1}',
    '.jd-tl-event--scan .jd-tl-event__dot{border-color:var(--ds-tech);background:var(--ds-tech-wash)}',
    '.jd-tl-event--regimen .jd-tl-event__dot{border-color:var(--ds-accent);background:var(--ds-accent-wash)}',
    '.jd-tl-event--coverage .jd-tl-event__dot{border-color:var(--ds-status-ok);background:var(--ds-status-ok-soft)}',
    '.jd-tl-event--symptom .jd-tl-event__dot{border-color:var(--ds-status-warn);background:var(--ds-status-warn-soft)}',
    '.jd-tl-event--milestone .jd-tl-event__dot{border-color:var(--ds-accent-hot);background:var(--ds-accent-soft)}',
    '.jd-tl-event__glyph{width:24px;height:24px;background:var(--ds-paper-light);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-sm);color:var(--ds-ink-soft);font-weight:700}',
    '.jd-tl-event--scan .jd-tl-event__glyph{color:var(--ds-tech);border-color:var(--ds-tech);background:var(--ds-tech-wash)}',
    '.jd-tl-event--regimen .jd-tl-event__glyph{color:var(--ds-accent-deep);border-color:var(--ds-accent);background:var(--ds-accent-wash)}',
    '.jd-tl-event--coverage .jd-tl-event__glyph{color:var(--ds-status-ok);border-color:var(--ds-status-ok);background:var(--ds-status-ok-soft)}',
    '.jd-tl-event--milestone .jd-tl-event__glyph{color:var(--ds-accent-deep);border-color:var(--ds-accent);background:var(--ds-accent-soft)}',
    '.jd-tl-event__meta{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-bottom:2px;display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.jd-tl-event__kind{padding:1px 6px;border-radius:var(--ds-radius-pill);font-weight:700;font-size:var(--ds-text-micro);background:var(--ds-paper-darker);color:var(--ds-ink-medium)}',
    '.jd-tl-event--scan .jd-tl-event__kind{background:var(--ds-tech-wash);color:var(--ds-tech)}',
    '.jd-tl-event--regimen .jd-tl-event__kind{background:var(--ds-accent-wash);color:var(--ds-accent-deep)}',
    '.jd-tl-event--coverage .jd-tl-event__kind{background:var(--ds-status-ok-soft);color:var(--ds-status-ok)}',
    '.jd-tl-event--milestone .jd-tl-event__kind{background:var(--ds-accent-soft);color:var(--ds-accent-deep)}',
    '.jd-tl-event__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.2}',
    '.jd-tl-event__detail{font-family:var(--ds-font-sans);font-size:var(--ds-text-mini);font-weight:500;color:var(--ds-ink-medium);line-height:1.4;margin-top:2px}',
    '.jd-tl-event__delta{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep);letter-spacing:.02em;margin-top:2px;display:inline-block}',
    '.jd-tl-event__delta--ok{color:var(--ds-status-ok)}',
    // ─── GOALS ───
    '.jd-goal{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-md);padding:var(--ds-space-4);margin-bottom:var(--ds-space-3);position:relative;overflow:hidden;cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.jd-goal:hover{border-color:var(--ds-accent);box-shadow:0 4px 12px -3px rgba(255,126,60,.18)}',
    '.jd-goal__head{display:grid;grid-template-columns:1fr auto;align-items:start;gap:var(--ds-space-3);margin-bottom:var(--ds-space-3)}',
    '.jd-goal__id{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-tech);font-weight:600;margin-bottom:var(--ds-space-1);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.jd-goal__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.15}',
    '.jd-goal__due{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);text-align:right;white-space:nowrap}',
    '.jd-goal__due strong{color:var(--ds-ink);font-weight:600;display:block}',
    '.jd-goal__progress{display:flex;align-items:baseline;gap:var(--ds-space-2);margin-bottom:var(--ds-space-2)}',
    '.jd-goal__pct{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-xl);color:var(--ds-accent-deep);letter-spacing:.02em;line-height:1}',
    '.jd-goal__pct small{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);letter-spacing:var(--ds-track-wider);text-transform:uppercase;font-weight:500}',
    '.jd-goal__counts{margin-left:auto;font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.jd-goal__counts strong{color:var(--ds-ink);font-weight:600}',
    '.jd-goal__bar{height:6px;background:var(--ds-paper-darker);border-radius:var(--ds-radius-pill);overflow:hidden;position:relative}',
    '.jd-goal__bar-fill{height:100%;background:linear-gradient(90deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);border-radius:var(--ds-radius-pill);box-shadow:0 0 8px var(--ds-accent-soft)}',
    '.jd-goal__blockers{margin-top:var(--ds-space-3);padding-top:var(--ds-space-3);border-top:1px solid var(--ds-rule-soft);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.jd-goal__blocker-chip{display:inline-flex;font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;background:var(--ds-status-warn-soft);color:var(--ds-status-warn-deep,#8a6d20);padding:3px 8px;border-radius:var(--ds-radius-pill);margin:4px 4px 0 0}',
    '.jd-goal.featured{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);color:var(--ds-paper);border-color:var(--ds-accent);box-shadow:0 6px 18px -4px rgba(255,126,60,.32)}',
    '.jd-goal.featured::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 15%,var(--ds-accent) 35%,transparent 40%)}',
    '.jd-goal.featured .jd-goal__title{color:var(--ds-paper)}',
    '.jd-goal.featured .jd-goal__id{color:var(--ds-accent-bright)}',
    '.jd-goal.featured .jd-goal__due{color:var(--ds-tech-dim)}',
    '.jd-goal.featured .jd-goal__due strong{color:var(--ds-paper)}',
    '.jd-goal.featured .jd-goal__pct{color:var(--ds-accent-bright);text-shadow:0 0 20px rgba(255,126,60,.4)}',
    '.jd-goal.featured .jd-goal__pct small{color:var(--ds-ink-faint)}',
    '.jd-goal.featured .jd-goal__counts{color:var(--ds-ink-faint)}',
    '.jd-goal.featured .jd-goal__counts strong{color:var(--ds-paper)}',
    '.jd-goal.featured .jd-goal__bar{background:rgba(255,255,255,.08)}',
    // ─── CHECK-INS ───
    '.jd-checkin-entry{background:var(--ds-paper);border:1px dashed var(--ds-accent);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3) var(--ds-space-4);margin-bottom:var(--ds-space-3);display:flex;align-items:center;gap:var(--ds-space-2);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);color:var(--ds-accent-deep);font-weight:700;letter-spacing:.02em;text-transform:uppercase;cursor:pointer;width:100%}',
    '.jd-checkin-entry:hover{background:var(--ds-accent-wash)}',
    '.jd-checkin-entry__glyph{font-family:var(--ds-font-mono);font-size:var(--ds-text-md);color:var(--ds-accent)}',
    '.jd-checkin-entry__spacer{flex:1}',
    '.jd-checkin-entry__kbd{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);background:var(--ds-paper-deep);border:1px solid var(--ds-rule);padding:2px 6px;border-radius:var(--ds-radius-xs)}',
    '.jd-checkin{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3) var(--ds-space-4);margin-bottom:var(--ds-space-2);display:grid;grid-template-columns:48px 1fr;gap:var(--ds-space-3)}',
    '.jd-checkin__date{display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--ds-paper);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);padding:var(--ds-space-1) 0}',
    '.jd-checkin__date-day{font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep);letter-spacing:.02em;line-height:1}',
    '.jd-checkin__date-mo{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:.08em;color:var(--ds-ink-soft);text-transform:uppercase;margin-top:2px}',
    '.jd-checkin__row{display:flex;align-items:center;gap:var(--ds-space-3);margin-bottom:var(--ds-space-2)}',
    '.jd-checkin__severity{display:flex;gap:3px}',
    '.jd-sev-pip{width:14px;height:6px;background:var(--ds-paper-darker);border-radius:1px}',
    '.jd-sev-pip.fill-warn{background:var(--ds-status-warn)}',
    '.jd-sev-pip.fill-err{background:var(--ds-status-err)}',
    '.jd-sev-pip.fill-ok{background:var(--ds-status-ok)}',
    '.jd-checkin__sev-label{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600}',
    '.jd-checkin__sev-label strong{color:var(--ds-ink)}',
    '.jd-checkin__note{font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);font-weight:500;color:var(--ds-ink-medium);line-height:1.45;margin:0 0 var(--ds-space-2)}',
    '.jd-checkin__tags{display:flex;flex-wrap:wrap;gap:4px}',
    '.jd-checkin__tag{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wide);text-transform:uppercase;color:var(--ds-tech);background:var(--ds-tech-wash);padding:2px 7px;border-radius:var(--ds-radius-pill);font-weight:600}',
    '.jd-checkin__correlate{margin-top:var(--ds-space-2);padding-top:var(--ds-space-2);border-top:1px solid var(--ds-rule-soft);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.jd-checkin__correlate strong{color:var(--ds-accent-deep);font-weight:700}',
    // ─── MILESTONES ───
    '.jd-milestone{background:var(--ds-paper-light);border:1px solid var(--ds-rule-soft);border-radius:var(--ds-radius-md);padding:var(--ds-space-4);margin-bottom:var(--ds-space-3);display:grid;grid-template-columns:56px 1fr;gap:var(--ds-space-4);align-items:center;position:relative;overflow:hidden}',
    '.jd-milestone__badge{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-lg);color:var(--ds-paper-light);letter-spacing:.02em;box-shadow:0 0 0 1px var(--ds-paper) inset,0 0 0 3px var(--ds-accent),0 0 12px rgba(255,126,60,.4),var(--ds-elev-2);position:relative}',
    '.jd-milestone__id{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-tech);font-weight:600;margin-bottom:var(--ds-space-1)}',
    '.jd-milestone__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0 0 var(--ds-space-1);line-height:1.15}',
    '.jd-milestone__doctrine{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft)}',
    '.jd-milestone__doctrine strong{color:var(--ds-accent-deep);font-weight:700}',
    '.jd-milestone__earned{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:.05em;text-transform:uppercase;color:var(--ds-ink-faint);margin-top:var(--ds-space-1)}',
    '.jd-milestone.locked .jd-milestone__badge{background:var(--ds-paper-darker);color:var(--ds-ink-faint);box-shadow:0 0 0 1px var(--ds-paper) inset,0 0 0 2px var(--ds-rule),inset 0 1px 2px rgba(0,0,0,.08)}',
    '.jd-milestone.locked .jd-milestone__title{color:var(--ds-ink-soft)}',
    '.jd-milestone.locked .jd-milestone__id{color:var(--ds-ink-faint)}',
    '.jd-milestone.fresh{background:linear-gradient(135deg,var(--ds-accent-wash) 0%,var(--ds-paper) 100%);border-color:var(--ds-accent);box-shadow:0 6px 18px -4px rgba(255,126,60,.30)}',
    '.jd-milestone.fresh .jd-milestone__badge{animation:badge-pulse 2.4s ease-in-out infinite}',
    '@keyframes badge-pulse{0%,100%{box-shadow:0 0 0 1px var(--ds-paper) inset,0 0 0 3px var(--ds-accent),0 0 12px rgba(255,126,60,.4),var(--ds-elev-2)}50%{box-shadow:0 0 0 1px var(--ds-paper) inset,0 0 0 4px var(--ds-accent),0 0 22px rgba(255,126,60,.7),var(--ds-elev-2)}}',
    // ─── FOOTER ───
    '.jd-footer{padding:var(--ds-space-3) var(--ds-space-4);background:var(--ds-paper-darker);border-top:1px solid var(--ds-rule);display:flex;gap:var(--ds-space-2);align-items:center}',
    '.jd-action{background:transparent;border:1px solid var(--ds-rule);color:var(--ds-ink);font-family:var(--ds-font-display-interface);font-size:var(--ds-text-xs);font-weight:700;letter-spacing:var(--ds-track-wide);text-transform:uppercase;padding:.45rem .85rem;border-radius:var(--ds-radius-sm);cursor:pointer;display:inline-flex;align-items:center;gap:var(--ds-space-2);transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.jd-action:hover{border-color:var(--ds-accent);color:var(--ds-accent-deep)}',
    '.jd-action__glyph{font-family:var(--ds-font-mono);color:var(--ds-tech)}',
    '.jd-action--primary{background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);color:var(--ds-paper-light);border-color:var(--ds-accent-deep);box-shadow:0 1px 0 rgba(255,255,255,.3) inset,var(--ds-glow-accent-sm)}',
    '.jd-action--primary:hover{color:var(--ds-paper-light)}',
    '.jd-action--primary .jd-action__glyph{color:var(--ds-paper-light)}',
    '.jd-action__spacer{flex:1}',
    // ─── LOG EVENT inline form ───
    '.jd-log-form{padding:var(--ds-space-4);display:flex;flex-direction:column;gap:var(--ds-space-4)}',
    '.jd-log-form__head{display:flex;justify-content:space-between;align-items:center}',
    '.jd-log-form__head h3{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-lg);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0}',
    '.jd-log-form__label{display:flex;flex-direction:column;gap:var(--ds-space-2);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600}',
    '.jd-log-form__sev{display:flex;gap:var(--ds-space-2)}',
    '.jd-log-form__sev-btn{flex:1;padding:var(--ds-space-3);background:var(--ds-paper-light);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-sm);font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-ink);cursor:pointer;transition:all var(--ds-motion-fast) var(--ds-ease-out)}',
    '.jd-log-form__sev-btn:hover{border-color:var(--ds-accent)}',
    '.jd-log-form__sev-btn.active{background:linear-gradient(135deg,var(--ds-accent) 0%,var(--ds-accent-hot) 100%);color:var(--ds-paper-light);border-color:var(--ds-accent-deep);box-shadow:var(--ds-glow-accent-sm)}',
    '.jd-log-form__note,.jd-log-form__tags{background:var(--ds-paper-light);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-sm);padding:var(--ds-space-3);font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);color:var(--ds-ink);width:100%;box-sizing:border-box;resize:vertical}',
    '.jd-log-form__note:focus,.jd-log-form__tags:focus{outline:none;border-color:var(--ds-accent);box-shadow:0 0 0 2px var(--ds-accent-soft)}',
    '.jd-log-form__tags{font-family:var(--ds-font-mono);font-size:var(--ds-text-xs);letter-spacing:var(--ds-track-wide);text-transform:uppercase}',
    '.jd-log-form__actions{display:flex;justify-content:flex-end;gap:var(--ds-space-2)}',
  ].join('\n');

  let journeyStyleInjected = false;
  function injectJourneyStyles() {
    if (journeyStyleInjected) return;
    journeyStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/journey.ts');
    style.textContent = JOURNEY_CSS;
    document.head.appendChild(style);
  }

  const JOURNEY_LOG_KEY = 'wallachJourneyLog_v1';

  function _jdAppendEvent(entry) {
    let log = [];
    try { log = JSON.parse(localStorage.getItem(JOURNEY_LOG_KEY) || '[]') || []; }
    catch { log = []; }
    log.unshift(Object.assign({ id: Date.now(), ts: new Date().toISOString() }, entry));
    // Cap at 200 entries (FIFO)
    if (log.length > 200) log = log.slice(0, 200);
    try { localStorage.setItem(JOURNEY_LOG_KEY, JSON.stringify(log)); }
    catch (e) { console.warn('[views/journey] save log threw:', e); }
    emit('journey:event-logged', { eventId: String(log[0].id), kind: entry.kind || 'event' });
  }

  function _jdRenderLogForm() {
    return '<div class="jd-log-form">'
      + '<div class="jd-log-form__head"><h3>Log a check-in</h3>'
      + '<button class="jd-action" data-jd-action="cancel-log">CANCEL</button></div>'
      + '<label class="jd-log-form__label">SEVERITY (1–5)'
      + '<div class="jd-log-form__sev" data-jd-sev="3">'
      + [1,2,3,4,5].map(function (n) { return '<button type="button" class="jd-log-form__sev-btn' + (n === 3 ? ' active' : '') + '" data-sev-value="' + n + '">' + n + '</button>'; }).join('')
      + '</div></label>'
      + '<label class="jd-log-form__label">NOTE<textarea class="jd-log-form__note" rows="4" placeholder="What\'s going on? Energy, symptoms, observations…"></textarea></label>'
      + '<label class="jd-log-form__label">TAGS (comma-separated)<input class="jd-log-form__tags" type="text" placeholder="e.g. ENERGY, JOINTS, PM" /></label>'
      + '<div class="jd-log-form__actions">'
      + '<button class="jd-action jd-action--primary" data-jd-action="submit-log">+ LOG EVENT</button>'
      + '</div></div>';
  }

  function mountJourney(container) {
    injectJourneyStyles();
    let jdOpen = false;
    let jdExpanded = false;
    let jdActiveTab = 'timeline';
    let jdLogging = false;  // true when LOG EVENT form is shown
    function render() {
      if (jdLogging) {
        container.innerHTML = _jdRenderShell(jdActiveTab);
        // Replace body with the form
        const body = container.querySelector('.jd-body');
        if (body) body.innerHTML = _jdRenderLogForm();
      } else {
        container.innerHTML = _jdRenderShell(jdActiveTab);
      }
    }
    function open() { if (jdOpen) return; jdOpen = true; container.classList.add('jd-open'); render(); }
    function close() { if (!jdOpen) return; jdOpen = false; jdExpanded = false; jdLogging = false; container.classList.remove('jd-open', 'jd-expanded'); container.innerHTML = ''; }
    function toggle() { jdOpen ? close() : open(); }
    function toggleExpanded() { jdExpanded = !jdExpanded; container.classList.toggle('jd-expanded', jdExpanded); }

    function clickHandler(ev) {
      const target = ev.target;
      // Severity button picker inside log form
      const sevBtn = target && target.closest ? target.closest('.jd-log-form__sev-btn') : null;
      if (sevBtn) {
        const parent = sevBtn.closest('.jd-log-form__sev');
        if (parent) {
          parent.setAttribute('data-jd-sev', sevBtn.getAttribute('data-sev-value'));
          parent.querySelectorAll('.jd-log-form__sev-btn').forEach(function (b) {
            b.classList.toggle('active', b === sevBtn);
          });
        }
        return;
      }
      const tabBtn = target && target.closest ? target.closest('[data-jd-tab]') : null;
      if (tabBtn) {
        const next = tabBtn.getAttribute('data-jd-tab');
        if (next && next !== jdActiveTab) { jdActiveTab = next; jdLogging = false; render(); }
        return;
      }
      const actionEl = target && target.closest ? target.closest('[data-jd-action]') : null;
      if (actionEl) {
        const action = actionEl.getAttribute('data-jd-action');
        if (action === 'close') close();
        else if (action === 'expand') toggleExpanded();
        else if (action === 'log') {
          jdLogging = true;
          jdActiveTab = 'checkins';
          render();
        }
        else if (action === 'cancel-log') {
          jdLogging = false;
          render();
        }
        else if (action === 'submit-log') {
          const form = container.querySelector('.jd-log-form');
          if (!form) return;
          const sevEl = form.querySelector('.jd-log-form__sev');
          const noteEl = form.querySelector('.jd-log-form__note');
          const tagsEl = form.querySelector('.jd-log-form__tags');
          const sev = Number(sevEl ? sevEl.getAttribute('data-jd-sev') : 3) || 3;
          const note = noteEl ? noteEl.value.trim() : '';
          const tags = tagsEl ? tagsEl.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];
          if (!note) {
            if (noteEl) noteEl.focus();
            return;
          }
          _jdAppendEvent({ kind: 'symptom', sev: sev, note: note, tags: tags });
          jdLogging = false;
          render();
        }
        else console.info('[views/journey] action stub:', action);
      }
    }
    container.addEventListener('click', clickHandler);
    on('regimen:changed', function () { if (jdOpen) render(); });
    on('scanner:scan-complete', function () { if (jdOpen) render(); });
    on('journey:event-logged', function () { if (jdOpen) render(); });
    return { open: open, close: close, toggle: toggle, toggleExpanded: toggleExpanded, isOpen: function () { return jdOpen; } };
  }


  // ── views/palette.ts (Round 5·C) ────────────────────────────────────────
  // Centered scrim modal · ⌘K (or Ctrl+K) opens · Esc closes · ↑↓ navigate.
  // Three result modes: JUMP TO / LOOKUP / ASK WALLACH (feature-flagged).

  function _palBuildIndex() {
    // Build a searchable index from the same data the other views read.
    const idx = [];
    // 1. Navigate targets
    const navs = [
      { kind: 'nav', label: 'Coverage workspace', path: 'WS·01 · periodic table',  target: 'coverage', kbd: '⌘1' },
      { kind: 'nav', label: 'Regimen workspace',  path: 'WS·02 · slots + cart',    target: 'regimen',  kbd: '⌘2' },
      { kind: 'nav', label: 'Scanner workspace',  path: 'WS·03 · OCR pipeline',    target: 'scanner',  kbd: '⌘3' },
      { kind: 'nav', label: 'Knowledge drawer',   path: 'DRAWER · 4 tabs',          target: 'knowledge', kbd: 'K' },
      { kind: 'nav', label: 'Journey drawer',     path: 'DRAWER · 4 tabs',          target: 'journey',  kbd: 'J' },
    ];
    navs.forEach(function (n) { idx.push(n); });

    // 2. Essentials (92)
    const essentials = _readEssentialsForKd();
    essentials.forEach(function (e) {
      idx.push({ kind: 'lookup-essential', label: e.name, path: 'ESSENTIAL · ' + e.category, target: 'essential:' + e.name });
    });

    // 3. Products
    const products = _readProductsForKd();
    products.forEach(function (p) {
      idx.push({ kind: 'lookup-product', label: p.name, path: 'PRODUCT · ' + (p.brand || 'YGY'), target: 'product:' + p.name });
    });

    // 4. Scan history → searchable
    const scans = _getScanHistory();
    scans.slice(0, 20).forEach(function (s) {
      const name = s.label && s.label.name ? s.label.name : '(unnamed scan)';
      idx.push({ kind: 'lookup-scan', label: name, path: 'SCAN · ' + s.verdict + ' · ' + _timeAgo(s.ts), target: 'scan:' + s.id });
    });

    return idx;
  }

  // Stopwords — common English words that carry no semantic value in a
  // product/essential lookup. Filtered out before token matching so queries
  // like "what should i take for gym gains" don't false-positive on "for"
  // matching "FORmula" or "FORm" inside product names.
  const PAL_STOPWORDS = new Set([
    'the','and','for','with','from','into','than','then','this','that','these','those',
    'you','your','their','they','them','our','its','his','her','him','she','about',
    'what','how','why','who','when','where','which','whom','will','can','should',
    'could','would','may','might','must','shall','was','were','are','been','being',
    'have','has','had','take','get','got','give','make','made','any','all','some',
    'just','only','more','most','less','also','too','very','really','still',
    'but','not','nor','yet','as','do','does','did','done','if','of',
  ]);

  function _palFuzzyMatch(query, item) {
    if (!query) return 0;
    const q = query.toLowerCase();
    const l = item.label.toLowerCase();
    if (l === q) return 100;
    if (l.startsWith(q)) return 80;
    if (l.includes(q)) return 50;
    // Token match — drop short tokens AND stopwords before matching.
    const tokens = q.split(/\s+/).filter(function (t) {
      return t.length >= 3 && !PAL_STOPWORDS.has(t);
    });
    if (tokens.length === 0) return 0;
    let score = 0;
    let hits = 0;
    tokens.forEach(function (t) { if (l.includes(t)) { score += 10; hits++; } });
    return hits > 0 ? score : 0;
  }

  function _palSearch(query, idx) {
    if (!query.trim()) {
      // Default: show navs + 3 most-recent scans + a few essentials
      return idx.filter(function (i) { return i.kind === 'nav' || i.kind === 'lookup-scan'; }).slice(0, 8);
    }
    const scored = idx.map(function (i) { return { item: i, score: _palFuzzyMatch(query, i) }; })
      .filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 20)
      .map(function (s) { return s.item; });
    return scored;
  }

  function _palHighlightMatch(label, query) {
    if (!query.trim()) return escHTML(label);
    const q = query.toLowerCase();
    const l = label.toLowerCase();
    const i = l.indexOf(q);
    if (i < 0) return escHTML(label);
    return escHTML(label.slice(0, i))
      + '<span class="pal-row__match-frag">' + escHTML(label.slice(i, i + query.length)) + '</span>'
      + escHTML(label.slice(i + query.length));
  }

  function _palLooksLikeQuestion(q) {
    const t = q.trim().toLowerCase();
    if (t.length < 8) return false;
    if (t.endsWith('?')) return true;
    return /^(how|what|why|is|can|should|when|where|does|do|will)/.test(t);
  }

  function _palRenderRow(item, isSelected, query) {
    const kindIcon = item.kind === 'nav' ? '◉'
      : item.kind === 'lookup-essential' ? (item.label.charAt(0).toUpperCase())
      : item.kind === 'lookup-product' ? (item.label.charAt(0).toUpperCase())
      : item.kind === 'lookup-scan' ? '⌖'
      : '?';
    const iconClass = item.kind === 'nav' ? 'pal-row__icon pal-row__icon--workspace'
      : item.kind === 'lookup-scan' ? 'pal-row__icon pal-row__icon--tech'
      : 'pal-row__icon';
    const kbdHTML = item.kbd
      ? '<div class="pal-row__kbd-row">' + item.kbd.split('').map(function (c) { return '<span class="pal-row__kbd">' + escHTML(c) + '</span>'; }).join('') + '</div>'
      : '<div class="pal-row__kbd-row"><span class="pal-row__kbd">⏎</span></div>';
    return '<div class="pal-row' + (isSelected ? ' selected' : '') + '" data-pal-target="' + escHTML(item.target) + '">'
      + '<div class="' + iconClass + '">' + escHTML(kindIcon) + '</div>'
      + '<div class="pal-row__body">'
      + '<h4 class="pal-row__title">' + _palHighlightMatch(item.label, query) + '</h4>'
      + '<div class="pal-row__path">' + escHTML(item.path) + '</div>'
      + '</div>' + kbdHTML + '</div>';
  }

  function _palRenderShell(query, selectedIdx, idx) {
    const results = _palSearch(query, idx);
    const navRes = results.filter(function (i) { return i.kind === 'nav'; });
    const lookupRes = results.filter(function (i) { return i.kind !== 'nav'; });
    const isQuestion = _palLooksLikeQuestion(query);

    let html = '<div class="pal-scrim-inner"><div class="pal">'
      + '<span class="ds-scan-line" aria-hidden="true"></span>'
      + '<header class="pal__head"><div class="pal__eyebrow">'
      + '<span class="pulse-dot"></span>COMMAND PALETTE · <span class="ds-cipher" data-cipher-set="hexa">CP·' + _hex(query.length * 17 + 1) + '</span>'
      + '<span class="pal__eyebrow-spacer"></span>'
      + '<span class="pal__scope-pill">SCOPE · ALL</span>'
      + '</div>'
      + '<div class="pal__input-row">'
      + '<span class="pal__input-icon">⌕</span>'
      + '<input class="pal__input" type="text" value="' + escHTML(query) + '" placeholder="JUMP · LOOKUP · ASK WALLACH…" />'
      + '<span class="pal__kbd-esc">ESC</span>'
      + '</div></header>'
      + '<div class="pal__body">';

    // ASK WALLACH section — renders FIRST when input is question-shaped
    // (otherwise users miss it under 19+ fuzzy lookup results).
    if (isQuestion) {
      html += '<section class="pal__section pal__section--ask">'
        + '<div class="pal__section-head">ASK WALLACH <span class="beta">BETA</span><span class="count">SCAFFOLD · NOT YET WIRED</span></div>'
        + '<div class="ask-result"><div class="ask-result__question">QUERY · "' + escHTML(query) + '"</div>'
        + '<blockquote class="ask-result__quote">The TF-IDF over the local Wallach corpus will land in the polish pass. For now, the palette recognizes question-shaped queries (ends in "?" or starts with how/what/why/is/can/should/when/where/does/do/will) and would route here.</blockquote>'
        + '<div class="ask-result__cite">PENDING · <strong>corpus index build · polish pass</strong>'
        + '<span class="ask-result__cite-score">RELEVANCE · <strong>—</strong></span></div>'
        + '<div class="ask-result__guards">'
        + '<span class="ask-result__guard">LOCAL CORPUS</span>'
        + '<span class="ask-result__guard">NO EXTERNAL API</span>'
        + '<span class="ask-result__guard">SOURCE-RULE ENFORCED</span>'
        + '<span class="ask-result__guard">FLAG · palette_ask_wallach</span>'
        + '</div></div></section>';
    }
    // JUMP TO section
    if (navRes.length > 0) {
      html += '<section class="pal__section"><div class="pal__section-head">JUMP TO <span class="count">' + navRes.length + ' RESULTS</span></div>';
      navRes.forEach(function (r) { html += _palRenderRow(r, results.indexOf(r) === selectedIdx, query); });
      html += '</section>';
    }
    // LOOKUP section
    if (lookupRes.length > 0) {
      html += '<section class="pal__section"><div class="pal__section-head">LOOKUP <span class="count">' + lookupRes.length + ' RESULTS</span></div>';
      lookupRes.slice(0, 10).forEach(function (r) { html += _palRenderRow(r, results.indexOf(r) === selectedIdx, query); });
      html += '</section>';
    }

    if (results.length === 0 && !isQuestion) {
      html += '<div class="pal__empty">— no matches for "' + escHTML(query) + '" —</div>';
    }

    html += '</div>'
      + '<footer class="pal__footer">'
      + '<span class="pal__hint"><span class="kbd">↑</span><span class="kbd">↓</span> NAVIGATE</span>'
      + '<span class="pal__hint"><span class="kbd">⏎</span> SELECT</span>'
      + '<span class="pal__hint"><span class="kbd">⌘</span><span class="kbd">⏎</span> ASK WALLACH</span>'
      + '<span class="pal__hint"><span class="kbd">ESC</span> CLOSE</span>'
      + '<span class="pal__footer-spacer"></span>'
      + '<span class="pal__footer-sig">⌖ WALLACH·SYS v3.27</span>'
      + '</footer></div></div>';
    return html;
  }

  const PALETTE_CSS = [
    '#palette-mount{position:fixed;inset:0;z-index:100;display:none;pointer-events:none}',
    '#palette-mount.pal-open{display:block;pointer-events:auto;background:rgba(26,22,18,.55);backdrop-filter:blur(6px) saturate(1.1);-webkit-backdrop-filter:blur(6px) saturate(1.1);animation:pal-scrim-in 200ms ease-out}',
    '@keyframes pal-scrim-in{from{opacity:0}to{opacity:1}}',
    '.pal-scrim-inner{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:12vh}',
    '.pal{width:720px;max-height:72vh;background:var(--ds-paper);border-radius:var(--ds-radius-md);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 0 0 1px var(--ds-accent),0 40px 90px -20px rgba(26,22,18,.55),0 16px 40px -10px rgba(255,126,60,.22);display:flex;flex-direction:column;overflow:hidden;position:relative;isolation:isolate;animation:pal-in 250ms cubic-bezier(0.34,1.4,0.64,1)}',
    '@keyframes pal-in{from{opacity:0;transform:translateY(-12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '.pal::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 6%,var(--ds-accent) 18%,transparent 22%,transparent 78%,var(--ds-tech) 82%,var(--ds-tech) 92%,transparent 95%);z-index:2}',
    '.pal__head{padding:var(--ds-space-5) var(--ds-space-6) var(--ds-space-4);background:var(--ds-paper-darker);border-bottom:1px solid var(--ds-rule);position:relative}',
    '.pal__head::after{content:"";position:absolute;left:var(--ds-space-6);right:var(--ds-space-6);bottom:-1px;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 6%,var(--ds-accent) 13%,transparent 15%,transparent 85%,var(--ds-tech) 88%,var(--ds-tech) 92%,transparent 95%)}',
    '.pal__eyebrow{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-accent);font-weight:600;margin-bottom:var(--ds-space-3);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.pal__eyebrow .pulse-dot{width:6px;height:6px;background:var(--ds-accent);border-radius:50%;box-shadow:0 0 6px var(--ds-accent-soft);animation:ds-pulse-animate 2s ease-in-out infinite}',
    '.pal__eyebrow-spacer{flex:1}',
    '.pal__scope-pill{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);color:var(--ds-tech);background:var(--ds-tech-wash);padding:3px 8px;border-radius:var(--ds-radius-pill);font-weight:600;text-transform:uppercase}',
    '.pal__input-row{display:grid;grid-template-columns:auto 1fr auto;gap:var(--ds-space-3);align-items:center}',
    '.pal__input-icon{font-family:var(--ds-font-mono);font-size:1.6rem;color:var(--ds-accent);text-shadow:0 0 12px var(--ds-accent-soft);line-height:1}',
    '.pal__input{background:transparent;border:0;outline:0;font-family:var(--ds-font-display-interface);font-size:1.5rem;font-weight:500;color:var(--ds-ink);letter-spacing:.01em;padding:4px 0;width:100%}',
    '.pal__input::placeholder{color:var(--ds-ink-faint);text-transform:uppercase;letter-spacing:var(--ds-track-wide);font-size:1.05rem}',
    '.pal__kbd-esc{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);background:var(--ds-paper);border:1px solid var(--ds-rule);padding:4px 8px;border-radius:var(--ds-radius-xs);letter-spacing:.05em}',
    '.pal__body{flex:1;overflow-y:auto;padding:var(--ds-space-3) 0}',
    '.pal__empty{padding:var(--ds-space-5);text-align:center;font-family:var(--ds-font-mono);font-size:var(--ds-text-mini);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint)}',
    '.pal__section{padding:var(--ds-space-2) 0}',
    '.pal__section + .pal__section{border-top:1px solid var(--ds-rule-soft);margin-top:var(--ds-space-2)}',
    '.pal__section-head{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-widest);text-transform:uppercase;color:var(--ds-ink-soft);font-weight:600;padding:var(--ds-space-2) var(--ds-space-6);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.pal__section-head::before{content:"";width:12px;height:1px;background:var(--ds-accent)}',
    '.pal__section-head .count{margin-left:auto;color:var(--ds-ink-faint);font-weight:500}',
    '.pal-row{display:grid;grid-template-columns:32px 1fr auto;gap:var(--ds-space-3);align-items:center;padding:var(--ds-space-3) var(--ds-space-6);cursor:pointer;border-left:2px solid transparent;transition:all var(--ds-motion-fast) var(--ds-ease-out);position:relative}',
    '.pal-row:hover{background:var(--ds-paper-deep)}',
    '.pal-row.selected{background:var(--ds-accent-wash);border-left-color:var(--ds-accent)}',
    '.pal-row__icon{width:32px;height:32px;background:var(--ds-paper-light);border:1px solid var(--ds-rule);border-radius:var(--ds-radius-xs);display:flex;align-items:center;justify-content:center;font-family:var(--ds-font-display-artifact);font-size:var(--ds-text-md);color:var(--ds-accent-deep)}',
    '.pal-row__icon--tech{color:var(--ds-tech);border-color:var(--ds-tech);background:var(--ds-tech-wash);font-family:var(--ds-font-mono)}',
    '.pal-row__icon--workspace{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);color:var(--ds-accent-bright);border-color:var(--ds-ink)}',
    '.pal-row__body{min-width:0}',
    '.pal-row__title{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-md);font-weight:700;color:var(--ds-ink);letter-spacing:.02em;text-transform:uppercase;margin:0;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pal-row__match-frag{background:var(--ds-accent-wash);color:var(--ds-accent-deep);padding:0 2px;border-radius:2px;font-weight:800}',
    '.pal-row__path{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);margin-top:2px}',
    '.pal-row__kbd-row{display:inline-flex;gap:4px}',
    '.pal-row__kbd{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink-soft);background:var(--ds-paper);border:1px solid var(--ds-rule);padding:2px 6px;border-radius:var(--ds-radius-xs);letter-spacing:.05em}',
    '.pal-row.selected .pal-row__kbd{background:var(--ds-accent-wash);border-color:var(--ds-accent);color:var(--ds-accent-deep)}',
    // Ask Wallach section — dark heroic treatment
    '.pal__section--ask{background:linear-gradient(135deg,var(--ds-ink) 0%,var(--ds-ink-medium) 100%);color:var(--ds-paper);margin:var(--ds-space-3) var(--ds-space-3);border-radius:var(--ds-radius-md);position:relative;overflow:hidden;border:1px solid var(--ds-accent)}',
    '.pal__section--ask::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 8%,var(--ds-accent) 18%,transparent 22%)}',
    '.pal__section--ask::after{content:"";position:absolute;top:-30px;right:-30px;width:160px;height:160px;background:radial-gradient(circle,var(--ds-accent) 0%,transparent 65%);opacity:.2;pointer-events:none}',
    '.pal__section--ask + .pal__section{border-top:0}',
    '.pal__section--ask .pal__section-head{color:var(--ds-accent-bright);position:relative}',
    '.pal__section--ask .pal__section-head::before{background:var(--ds-accent-bright)}',
    '.pal__section--ask .pal__section-head .beta{margin-left:var(--ds-space-2);background:var(--ds-accent);color:var(--ds-paper-light);padding:1px 6px;border-radius:var(--ds-radius-pill);font-weight:700;font-size:var(--ds-text-micro)}',
    '.pal__section--ask .pal__section-head .count{color:var(--ds-tech-dim)}',
    '.ask-result{padding:var(--ds-space-4) var(--ds-space-5) var(--ds-space-4);position:relative}',
    '.ask-result__question{font-family:var(--ds-font-display-interface);font-size:var(--ds-text-sm);letter-spacing:.02em;color:var(--ds-tech-dim);text-transform:uppercase;font-weight:600;margin-bottom:var(--ds-space-3);display:flex;align-items:center;gap:var(--ds-space-2)}',
    '.ask-result__question::before{content:"?";font-family:var(--ds-font-display-artifact);background:var(--ds-accent);color:var(--ds-paper-light);width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.85rem;box-shadow:0 0 10px rgba(255,126,60,.4)}',
    '.ask-result__quote{font-family:Playfair Display,Georgia,serif;font-style:italic;font-size:var(--ds-text-md);line-height:1.5;color:var(--ds-paper);margin:0 0 var(--ds-space-3);position:relative;padding-left:var(--ds-space-4);border-left:2px solid var(--ds-accent)}',
    '.ask-result__cite{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-tech-dim);display:flex;align-items:center;gap:var(--ds-space-3)}',
    '.ask-result__cite strong{color:var(--ds-accent-bright);font-weight:600}',
    '.ask-result__cite-score{margin-left:auto;background:rgba(255,255,255,.06);border:1px solid var(--ds-ink-medium);padding:3px 8px;border-radius:var(--ds-radius-pill);font-weight:600}',
    '.ask-result__cite-score strong{color:var(--ds-accent-bright)}',
    '.ask-result__guards{margin-top:var(--ds-space-3);padding-top:var(--ds-space-3);border-top:1px solid var(--ds-ink-medium);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-faint);line-height:1.5;display:flex;flex-wrap:wrap;gap:var(--ds-space-3)}',
    '.ask-result__guard{display:inline-flex;align-items:center;gap:4px}',
    '.ask-result__guard::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--ds-status-ok);box-shadow:0 0 6px var(--ds-status-ok-soft)}',
    // Footer
    '.pal__footer{display:flex;align-items:center;gap:var(--ds-space-4);padding:var(--ds-space-3) var(--ds-space-6);background:var(--ds-paper-darker);border-top:1px solid var(--ds-rule);font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);letter-spacing:var(--ds-track-wider);text-transform:uppercase;color:var(--ds-ink-soft);position:relative}',
    '.pal__footer::before{content:"";position:absolute;top:0;left:var(--ds-space-6);right:var(--ds-space-6);height:1px;background:linear-gradient(to right,transparent 0%,var(--ds-accent) 4%,var(--ds-accent) 10%,transparent 12%)}',
    '.pal__hint{display:inline-flex;align-items:center;gap:var(--ds-space-2)}',
    '.pal__hint .kbd{font-family:var(--ds-font-mono);font-size:var(--ds-text-micro);color:var(--ds-ink);background:var(--ds-paper);border:1px solid var(--ds-rule);padding:2px 6px;border-radius:var(--ds-radius-xs);font-weight:600}',
    '.pal__footer-spacer{flex:1}',
    '.pal__footer-sig{color:var(--ds-tech);font-weight:600}',
  ].join('\n');

  let paletteStyleInjected = false;
  function injectPaletteStyles() {
    if (paletteStyleInjected) return;
    paletteStyleInjected = true;
    const style = document.createElement('style');
    style.setAttribute('data-injected-by', 'views/palette.ts');
    style.textContent = PALETTE_CSS;
    document.head.appendChild(style);
  }

  function mountPalette(container) {
    injectPaletteStyles();
    let palOpen = false;
    let palQuery = '';
    let palSelected = 0;
    let palIndex = null;  // Built lazily on first open
    function results() { return _palSearch(palQuery, palIndex || []); }
    function render() {
      container.innerHTML = _palRenderShell(palQuery, palSelected, palIndex || []);
      // Re-focus input after every render (cipher updates etc.)
      const input = container.querySelector('.pal__input');
      if (input) {
        input.focus();
        // Move cursor to end
        try { input.setSelectionRange(palQuery.length, palQuery.length); } catch { /* ignore */ }
      }
    }
    function open() {
      if (palOpen) return;
      if (!palIndex) palIndex = _palBuildIndex();
      palOpen = true;
      palQuery = '';
      palSelected = 0;
      container.classList.add('pal-open');
      render();
    }
    function close() {
      if (!palOpen) return;
      palOpen = false;
      container.classList.remove('pal-open');
      container.innerHTML = '';
    }
    function toggle() { palOpen ? close() : open(); }

    // Input handling (event delegation since we re-render)
    container.addEventListener('input', function (ev) {
      if (!ev.target || !ev.target.classList || !ev.target.classList.contains('pal__input')) return;
      palQuery = ev.target.value;
      palSelected = 0;
      render();
    });
    // Scrim click → close
    container.addEventListener('click', function (ev) {
      const target = ev.target;
      // Click on the scrim background (#palette-mount itself) closes
      if (target === container) { close(); return; }
      // Click on result row → activate
      const row = target && target.closest ? target.closest('.pal-row') : null;
      if (row) {
        const dest = row.getAttribute('data-pal-target');
        if (dest) {
          if (dest === 'coverage' || dest === 'regimen' || dest === 'scanner' || dest === 'knowledge' || dest === 'journey') {
            close();
            navigateTo(dest);
          } else {
            console.info('[views/palette] target stub:', dest);
            close();
          }
        }
      }
    });
    // Keyboard nav
    container.addEventListener('keydown', function (ev) {
      if (!palOpen) return;
      const res = results();
      if (ev.key === 'ArrowDown') { ev.preventDefault(); palSelected = Math.min(palSelected + 1, res.length - 1); render(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); palSelected = Math.max(palSelected - 1, 0); render(); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        const target = res[palSelected];
        if (target && target.target) {
          if (['coverage','regimen','scanner','knowledge','journey'].indexOf(target.target) >= 0) {
            close();
            navigateTo(target.target);
          } else {
            console.info('[views/palette] enter on:', target.target);
            close();
          }
        }
      }
    });
    return { open: open, close: close, toggle: toggle, isOpen: function () { return palOpen; } };
  }

  // ── main.ts ─────────────────────────────────────────────────────────────
  const LEGACY_GROUP_FOR = {
    coverage:'you', regimen:'regimen', scanner:'labels',
    knowledge:'knowledge', journey:'journey',
  };
  // ROUND_FOR maps a workspace target → the round that migrates its VIEW.
  // ALL surfaces migrated. The banner system stays in code in case future
  // workspaces are added pre-migration; currently empty = no banners shown.
  const ROUND_FOR = {};
  const TITLE_FOR = {
    regimen: 'Regimen', scanner: 'Scanner', knowledge: 'Knowledge', journey: 'Journey',
  };
  const mounted = {};

  function getLegacyHost() { return document.getElementById('legacy-workspace-host'); }

  function ensureLegacyBanner(target) {
    // Inject a "migration pending" banner at the top of the legacy host so the
    // visual mismatch reads as intentional, not broken. One banner instance
    // total — its content swaps per target.
    const host = getLegacyHost();
    if (!host) return;
    let banner = document.getElementById('legacy-migration-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'legacy-migration-banner';
      banner.className = 'legacy-banner';
      host.insertBefore(banner, host.firstChild);
    }
    const round = ROUND_FOR[target];
    const title = TITLE_FOR[target] || 'Workspace';
    if (round) {
      banner.innerHTML =
        '<div class="legacy-banner__head">'
        + '<div class="legacy-banner__kicker">LEGACY VIEW · ROUND ' + round + ' MIGRATION PENDING</div>'
        + '</div>'
        + '<h4 class="legacy-banner__title">' + title + ' workspace — old design hosted in place</h4>'
        + '<p class="legacy-banner__body">'
        + 'This is the original teal-themed UI, kept fully functional inside the new chrome until '
        + '<strong>Round ' + round + '</strong> migrates ' + title + ' to the new design system. '
        + 'Every chokepoint, every state mutation, every wired feature still works exactly as before.'
        + '</p>';
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  }

  function showLegacy(target) {
    const host = getLegacyHost();
    if (!host) return;
    host.style.display = '';
    ensureLegacyBanner(target);
    const group = LEGACY_GROUP_FOR[target];
    if (group && typeof window.activateGroup === 'function') {
      try { window.activateGroup(group); } catch (e) { console.warn('[main] activateGroup threw:', e); }
    }
  }
  function hideLegacy() {
    const host = getLegacyHost();
    if (host) host.style.display = 'none';
  }
  function hideAllNewMounts() {
    const ids = ['workspace-coverage-mount', 'workspace-regimen-mount', 'workspace-scanner-mount'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  }
  function activateRailItem(target) {
    for (const btn of Array.from(document.querySelectorAll('.rail__item'))) {
      btn.classList.toggle('active', btn.getAttribute('data-rail-nav') === target);
    }
  }
  function navigateTo(target) {
    // Knowledge + Journey are DRAWER overlays, not workspace switches.
    if (target === 'knowledge') {
      const mountEl = document.getElementById('drawer-knowledge-mount');
      if (!mountEl) return;
      if (!mounted.knowledge) mounted.knowledge = mountKnowledge(mountEl);
      // Close the other drawer if open
      if (mounted.journey && mounted.journey.isOpen()) mounted.journey.close();
      mounted.knowledge.toggle();
      return;
    }
    if (target === 'journey') {
      const mountEl = document.getElementById('drawer-journey-mount');
      if (!mountEl) return;
      if (!mounted.journey) mounted.journey = mountJourney(mountEl);
      if (mounted.knowledge && mounted.knowledge.isOpen()) mounted.knowledge.close();
      mounted.journey.toggle();
      return;
    }
    activateRailItem(target);
    emit('rail:navigate', { target: target });
    hideAllNewMounts();
    if (target === 'coverage') {
      hideLegacy();
      const mountEl = document.getElementById('workspace-coverage-mount');
      if (!mountEl) return;
      mountEl.style.display = 'block';
      if (!mounted.coverage) mounted.coverage = mountCoverage(mountEl);
      return;
    }
    if (target === 'regimen') {
      hideLegacy();
      const mountEl = document.getElementById('workspace-regimen-mount');
      if (!mountEl) return;
      mountEl.style.display = 'block';
      if (!mounted.regimen) mounted.regimen = mountRegimen(mountEl);
      return;
    }
    if (target === 'scanner') {
      hideLegacy();
      const mountEl = document.getElementById('workspace-scanner-mount');
      if (!mountEl) return;
      mountEl.style.display = 'block';
      if (!mounted.scanner) mounted.scanner = mountScanner(mountEl);
      return;
    }
    showLegacy(target);
  }
  function wireRail() {
    for (const btn of Array.from(document.querySelectorAll('.rail__item[data-rail-nav]'))) {
      const target = btn.getAttribute('data-rail-nav');
      if (!target) continue;
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        navigateTo(target);
      });
    }
  }
  function bootstrap() {
    console.info('[wallach·sys v3.27] dashboard module graph loaded · Polish pass · all 6 surfaces wired');
    // Ensure palette is mounted at boot so ⌘K is ready immediately
    const paletteMountEl = document.getElementById('palette-mount');
    if (paletteMountEl && !mounted.palette) mounted.palette = mountPalette(paletteMountEl);

    // Global keyboard shortcuts
    document.addEventListener('keydown', function (ev) {
      // ⌘K / Ctrl+K → toggle command palette
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault();
        if (mounted.palette) mounted.palette.toggle();
        return;
      }
      // Esc → close any open overlay (palette first, then drawers)
      if (ev.key === 'Escape') {
        if (mounted.palette && mounted.palette.isOpen()) { mounted.palette.close(); return; }
        if (mounted.knowledge && mounted.knowledge.isOpen()) { mounted.knowledge.close(); return; }
        if (mounted.journey && mounted.journey.isOpen()) { mounted.journey.close(); return; }
      }
    });
    // Install regimen chokepoint bridges — overwrites legacy window.persistRegimen
    // etc. so cross-IIFE callers route through state/regimen native impls.
    try { installRegimenBridges(); } catch (e) { console.warn('[main] installRegimenBridges threw:', e); }
    try { installRecomputeTrigger(); } catch (e) { console.warn('[main] installRecomputeTrigger threw:', e); }
    wireRail();
    setTimeout(function () { navigateTo('coverage'); }, 0);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
