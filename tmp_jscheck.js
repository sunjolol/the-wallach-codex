
  // Background picker — swap between background-3 / 4 / 5 via the small picker in the header.
  // Persisted in localStorage so the user's choice survives reloads. Default = 3.
  // (Round-7 4-theme overhaul reverted due to performance regression. Will return as a proper
  // dark mode in a future round with perf-aware implementation.)
  (function() {
    const BG_KEY = 'dashboardBg';
    const VALID = new Set(['3', '4', '5']);
    function applyBg(n) {
      const choice = VALID.has(String(n)) ? String(n) : '3';
      document.documentElement.style.setProperty('--bg-image', `url("assets/background-${choice}.jpg")`);
      try { localStorage.setItem(BG_KEY, choice); } catch(e) {}
      document.querySelectorAll('.bg-swatch').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === choice);
      });
    }
    function init() {
      let saved = '3';
      try { saved = localStorage.getItem(BG_KEY) || '3'; } catch(e) {}
      // Migrate any old dashboardTheme setting silently → default bg 3
      if (!VALID.has(saved)) saved = '3';
      applyBg(saved);
      document.querySelectorAll('.bg-swatch').forEach(b => {
        b.addEventListener('click', () => applyBg(b.dataset.bg));
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  // Tab switching — two-level (top groups + subnav)
  // Track which tabs have been initialized so per-tab init runs only once
  const tabsInitialized = new Set();
  const groupConfig = {
    you:       { defaultTab: 'stand',   subTabs: [] },
    journey:   { defaultTab: 'journey', subTabs: [] },
    knowledge: { defaultTab: 'why',     subTabs: ['why', 'tools'] },
    regimen:   { defaultTab: 'regimen', subTabs: [] },
    labels:    { defaultTab: 'labels',  subTabs: [] }
  };

  function activateGroup(group, requestedTab) {
    const cfg = groupConfig[group];
    if (!cfg) return;
    const targetTab = (requestedTab && cfg.subTabs.includes(requestedTab))
      ? requestedTab
      : cfg.defaultTab;
    document.querySelectorAll('.tab-btn[data-group]').forEach(b => {
      b.classList.toggle('active', b.dataset.group === group);
    });
    document.querySelectorAll('nav.subtabs').forEach(s => {
      s.classList.toggle('hidden', s.id !== 'subnav-' + group);
    });
    const sub = document.getElementById('subnav-' + group);
    if (sub) {
      sub.querySelectorAll('.subtab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === targetTab);
      });
    }
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'tab-' + targetTab);
    });
    if (!tabsInitialized.has(targetTab)) {
      tabsInitialized.add(targetTab);
      if (targetTab === 'regimen' && typeof window.initRegimenTab === 'function') {
        window.initRegimenTab();
      }
    }
    // Run edit-target handler every time the labels tab is opened
    if (targetTab === 'labels' && typeof window.lcHandleEditTarget === 'function') {
      window.lcHandleEditTarget();
    }
  }
  window.activateGroup = activateGroup;

  document.querySelectorAll('.tab-btn[data-group]').forEach(btn => {
    btn.addEventListener('click', () => activateGroup(btn.dataset.group));
  });
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('nav.subtabs');
      if (!row) return;
      const grp = row.id.replace('subnav-', '');
      activateGroup(grp, btn.dataset.tab);
    });
  });

  // Pass 1 (2026-06-14 at 1:35 AM): the static gap-table + scenario-toggle UI was deleted from this
  // section. The periodic-table view uses live recompute (computeLiveCoverage) and reads from the
  // unified regimen, not from rendered HTML tables. Old applyFilters / categoryFilterMap / scenario
  // handlers removed because the elements they targeted no longer exist. The new search + quick-filter
  // are wired inside the periodic-table IIFE (see initEssentialsView).

  // ═══ "Your 90 Essentials" periodic-table view ═══════════════════════════════════════════
  // Reads .gap-row elements from the ACTIVE scenario panel (data-active="true") and builds
  // a color-coded tile grid grouped by category. Click a tile → detail panel with progress bar.
  (function() {
    const VITAMIN_MAP = {
      'Vitamin A': 'A', 'Vitamin C': 'C', 'Vitamin D': 'D', 'Vitamin E': 'E', 'Vitamin K': 'K',
      'Vitamin B1': 'B1', 'Vitamin B2': 'B2', 'Vitamin B3': 'B3', 'Vitamin B5': 'B5',
      'Vitamin B6': 'B6', 'Vitamin B7': 'B7', 'Vitamin B9': 'B9', 'Vitamin B12': 'B12',
    };
    const MINERAL_MAP = {
      'Calcium': 'Ca', 'Magnesium': 'Mg', 'Potassium': 'K', 'Sodium': 'Na',
      'Phosphorus': 'P', 'Sulfur': 'S', 'Chloride': 'Cl', 'Chlorine': 'Cl',
      'Zinc': 'Zn', 'Copper': 'Cu', 'Iron': 'Fe', 'Manganese': 'Mn', 'Chromium': 'Cr',
      'Selenium': 'Se', 'Molybdenum': 'Mo', 'Iodine': 'I', 'Cobalt': 'Co', 'Silicon': 'Si',
      'Vanadium': 'V', 'Boron': 'B', 'Lithium': 'Li', 'Tin': 'Sn', 'Nickel': 'Ni',
      'Yttrium': 'Y', 'Scandium': 'Sc', 'Strontium': 'Sr', 'Beryllium': 'Be',
      'Lanthanum': 'La', 'Cerium': 'Ce', 'Neodymium': 'Nd', 'Praseodymium': 'Pr',
      'Samarium': 'Sm', 'Europium': 'Eu', 'Gadolinium': 'Gd', 'Terbium': 'Tb',
      'Dysprosium': 'Dy', 'Holmium': 'Ho', 'Erbium': 'Er', 'Thulium': 'Tm',
      'Ytterbium': 'Yb', 'Lutetium': 'Lu', 'Rubidium': 'Rb', 'Cesium': 'Cs',
      'Barium': 'Ba', 'Hafnium': 'Hf', 'Tantalum': 'Ta', 'Tungsten': 'W',
      'Niobium': 'Nb', 'Bismuth': 'Bi', 'Thorium': 'Th', 'Uranium': 'U',
      'Germanium': 'Ge', 'Gallium': 'Ga', 'Bromine': 'Br', 'Rhenium': 'Re',
      'Zirconium': 'Zr', 'Indium': 'In', 'Tellurium': 'Te', 'Antimony': 'Sb',
    };
    const AMINO_MAP = {
      'Histidine': 'His', 'Isoleucine': 'Ile', 'Leucine': 'Leu', 'Lysine': 'Lys',
      'Methionine': 'Met', 'Phenylalanine': 'Phe', 'Threonine': 'Thr', 'Tryptophan': 'Trp',
      'Valine': 'Val', 'Arginine': 'Arg', 'Cysteine': 'Cys', 'Glutamine': 'Gln',
      'Glycine': 'Gly', 'Proline': 'Pro', 'Serine': 'Ser', 'Tyrosine': 'Tyr',
      'Taurine': 'Tau', 'Alanine': 'Ala', 'Asparagine': 'Asn', 'Aspartate': 'Asp',
      'Glutamate': 'Glu', 'Carnitine': 'Carn', 'Choline': 'Cho',
    };

    // Nutrients that connect to Luneth's three stated goals — used to mark tiles with a ★.
    const USER_GOAL_TERMS = [
      'Chromium', 'Vanadium', 'Vitamin B', 'Choline', 'Taurine',
      'Copper', 'Zinc', 'Vitamin E', 'Omega', 'Boron', 'Vitamin A',
    ];

    const CATEGORY_ORDER = [
      { key: 'fatty_acids', label: 'Fatty Acids' },
      { key: 'fats', label: 'Fatty Acids' },
      { key: 'vitamins', label: 'Vitamins' },
      { key: 'amino_acids', label: 'Amino Acids' },
      { key: 'amino', label: 'Amino Acids' },
      { key: 'major_minerals', label: 'Major Minerals' },
      { key: 'minerals', label: 'Minerals' },
      { key: 'trace_minerals', label: 'Trace Minerals' },
      { key: 'rare_earth', label: 'Rare Earth Elements' },
      { key: 'rare_earths', label: 'Rare Earth Elements' },
      { key: 'other', label: 'Other' },
    ];

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function abbreviate(fullName) {
      const cleaned = fullName.replace(/\s*\([^)]*\)\s*/g, '').trim();
      for (const [k, v] of Object.entries(VITAMIN_MAP)) {
        if (cleaned.startsWith(k)) return { symbol: v, shortName: 'Vit ' + v };
      }
      for (const [k, v] of Object.entries(MINERAL_MAP)) {
        if (cleaned.startsWith(k)) return { symbol: v, shortName: k.split(' ')[0] };
      }
      for (const [k, v] of Object.entries(AMINO_MAP)) {
        if (cleaned.startsWith(k)) return { symbol: v, shortName: k };
      }
      if (cleaned.startsWith('Omega-3')) return { symbol: 'ω3', shortName: 'Omega-3' };
      if (cleaned.startsWith('Omega-6')) return { symbol: 'ω6', shortName: 'Omega-6' };
      if (cleaned.startsWith('Omega-9')) return { symbol: 'ω9', shortName: 'Omega-9' };
      return { symbol: cleaned.slice(0, 3).toUpperCase(), shortName: cleaned.split(/\s+/)[0].slice(0, 9) };
    }

    function isGoalMatch(name) {
      const lower = name.toLowerCase();
      return USER_GOAL_TERMS.some(term => lower.includes(term.toLowerCase()));
    }

    function statusClass(rawStatus) {
      if (rawStatus === 'crit' || rawStatus === 'gap') return 'gap';
      if (rawStatus === 'warn') return 'warn';
      if (rawStatus === 'diet') return 'diet';
      if (rawStatus === 'ok') return 'ok';
      return 'mute';
    }

    function fillPercent(status) {
      if (status === 'ok') return 100;
      if (status === 'diet') return 72;
      if (status === 'warn') return 38;
      if (status === 'gap') return 6;
      return 0;
    }

    // ═══ LIVE RECOMPUTE LAYER ═══════════════════════════════════════════════════════════
    // Reads essentials targets from the embedded JSON + unified regimen items (REGIMEN_BASE_DATA
    // + localStorage overrides + manual items + label-scanned items) and computes per-essential
    // intake fresh on every render. Replaces the stale static gap-row HTML pipeline.

    const TARGETS_DATA = (function() {
      try {
        const el = document.getElementById('essentials-targets-data');
        return JSON.parse(el.textContent).essentials || [];
      } catch (e) { return []; }
    })();

    const BENEFITS_MAP = (function() {
      try {
        const el = document.getElementById('essentials-benefits-data');
        return JSON.parse(el.textContent) || {};
      } catch (e) { return {}; }
    })();

    const BEST_SUPPS_MAP = (function() {
      try {
        const el = document.getElementById('essentials-best-supplements');
        return JSON.parse(el.textContent) || {};
      } catch (e) { return {}; }
    })();

    const TARGETS_BY_NAME = (function() {
      const m = {};
      TARGETS_DATA.forEach(t => m[t.name.toLowerCase()] = t);
      return m;
    })();

    // Loose nutrient-name matcher: does a regimen nutrient name correspond to a target essential?
    function matchToEssential(nutrientName) {
      if (!nutrientName) return null;
      const nn = nutrientName.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
      // Direct
      if (TARGETS_BY_NAME[nn]) return TARGETS_BY_NAME[nn];
      // Try the cleaned variants
      for (const t of TARGETS_DATA) {
        const tn = t.name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
        if (tn === nn) return t;
        // Vitamin shortform: "Vitamin B12" matches "Vitamin B12 (Cobalamin)"
        if (nn.startsWith('vitamin ') && tn.startsWith('vitamin ')) {
          const nv = nn.replace('vitamin ', '').split(/\s|\(/)[0];
          const tv = tn.replace('vitamin ', '').split(/\s|\(/)[0];
          if (nv === tv) return t;
        }
        // Omega match
        if (nn.includes('omega') && tn.includes('omega')) {
          const nm = (nn.match(/omega[-\s]?(\d)/) || [])[1];
          const tm = (tn.match(/omega[-\s]?(\d)/) || [])[1];
          if (nm && tm && nm === tm) return t;
        }
        // Folate / Folic Acid
        if ((nn.includes('folate') || nn.includes('folic')) && tn.includes('folic')) return t;
      }
      return null;
    }

    function toMg(value, unit) {
      const u = (unit || 'mg').toLowerCase();
      if (u === 'g') return { v: value * 1000, u: 'mg' };
      if (u === 'mcg' || u === 'μg' || u === 'µg') return { v: value / 1000, u: 'mg' };
      if (u === 'iu') return { v: value, u: 'iu' };
      return { v: value, u: 'mg' };
    }

    function computeLiveCoverage() {
      // Reach into the Label Check IIFE's getUnifiedRegimenItems, exposed on window for cross-IIFE access.
      const fn = (typeof window.getUnifiedRegimenItems === 'function') ? window.getUnifiedRegimenItems : null;
      const items = fn ? fn().filter(i => !i._removed) : [];
      const out = {};
      TARGETS_DATA.forEach(t => {
        out[t.name] = { totalMg: 0, totalIU: 0, sources: [], target: t.target, category: t.category };
      });
      items.forEach(item => {
        const sf = parseFloat(item.scaling_factor);
        const scale = (isFinite(sf) && sf > 0) ? sf : 1;
        const displayName = item.name || item.product || 'Unknown';
        (item.nutrients || []).forEach(n => {
          if (!n || !n.name) return;
          const amt = parseFloat(n.amount);
          if (!isFinite(amt) || amt <= 0) return;
          const unit = (n.unit || 'mg').toLowerCase();
          const matched = matchToEssential(n.name);
          if (!matched) return;
          const scaled = amt * scale;
          const conv = toMg(scaled, unit);
          if (conv.u === 'iu') out[matched.name].totalIU += conv.v;
          else out[matched.name].totalMg += conv.v;
          out[matched.name].sources.push({
            sourceName: displayName, amount: scaled, unit: unit,
          });
        });
      });
      return out;
    }

    function classifyLive(computed) {
      const t = computed.target;
      const hasSrc = (computed.sources || []).length > 0;
      // No target stated by Wallach or Youngevity → mute (user can extend via Scanner later)
      if (!t || t.kind === 'unspecified') return hasSrc ? 'diet' : 'mute';
      // Wallach: "via diet" — assume covered if any source present
      if (t.kind === 'dietary') return hasSrc ? 'diet' : 'mute';
      // Trace via PDM: Wallach treats as covered as a group via plant-derived mineral complex.
      // If user has BTT 2.5 / UTT / Beyond Tangy Tangerine / Plant Derived Minerals in their stack,
      // call it 'ok' (Wallach considers this covered). Otherwise leave as 'mute' = pending coverage.
      if (t.kind === 'trace_pdm') {
        const stack = (computed.sources || []).map(s => (s.sourceName || '').toLowerCase()).join(' | ');
        const hasPDM = /\bbtt\b|tangerine|plant.derived|humic|colloidal|utt/i.test(stack);
        return hasPDM ? 'ok' : 'mute';
      }
      // Essential aminos in BTT 2.5 amino blend — same Wallach group-coverage as trace_pdm
      if (t.kind === 'wallach_collective') {
        const stack = (computed.sources || []).map(s => (s.sourceName || '').toLowerCase()).join(' | ');
        const hasBTT = /\bbtt\b|tangerine|utt|amino/i.test(stack);
        return hasBTT ? 'ok' : 'mute';
      }
      // Numeric targets — HBSP delivery, Wallach LPD baseline, Wallach clinical doses, etc.
      const isIU = (t.unit || '').toLowerCase() === 'iu';
      const current = isIU ? computed.totalIU : computed.totalMg;
      const low = isIU ? t.low : toMg(t.low, t.unit).v;
      if (current >= low * 0.95) return 'ok';
      if (current >= low * 0.30) return 'warn';
      return 'gap';
    }

    function titleCaseSourceName(name) {
      if (!name) return 'Unknown';
      let s = String(name).replace(/_/g, ' ');
      s = s.split(' ').map(w => {
        if (/^\d+\s*(g|oz|mg|mcg|ml|kg|lb)$/i.test(w)) return w.toLowerCase();
        if (/^\d/.test(w)) return w;
        if (w.length <= 1) return w.toUpperCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(' ');
      return s;
    }

    function formatSourceList(sources, capN) {
      if (!sources || !sources.length) return '<em style="color:var(--ink-mute);">No regimen items contribute — add via Scanner or Regimen tab.</em>';
      capN = capN || 8;
      const normalized = sources.slice().map(s => {
        const conv = toMg(parseFloat(s.amount) || 0, s.unit);
        return Object.assign({}, s, { _sort: conv.v });
      });
      normalized.sort((a, b) => b._sort - a._sort);
      const shown = normalized.slice(0, capN);
      const omitted = normalized.length - shown.length;
      const parts = shown.map(s => {
        const display = titleCaseSourceName(s.sourceName);
        const u = (s.unit || 'mg').toLowerCase();
        const amtStr = u === 'iu'
          ? Math.round(s.amount).toLocaleString() + ' IU'
          : (s.amount).toLocaleString(undefined, {maximumFractionDigits: 1}) + ' ' + u;
        return escapeHtml(display) + ' (' + amtStr + ')';
      });
      let result = parts.join('; ');
      if (omitted > 0) result += ' <span style="color:var(--ink-mute);">… +' + omitted + ' more</span>';
      return result;
    }

    function buildEssentialsGrid() {
      const host = document.getElementById('essentials-grid-host');
      if (!host) return;
      if (!TARGETS_DATA.length) {
        host.innerHTML = '<div style="text-align:center;color:var(--ink-mute);padding:20px;">Essentials targets data not loaded.</div>';
        return;
      }
      const liveData = computeLiveCoverage();
      const byCategory = {};
      TARGETS_DATA.forEach(t => {
        const cat = t.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        const d = liveData[t.name];
        const status = classifyLive(d);
        byCategory[cat].push({
          name: t.name,
          status: status,
          target: t.target,
          currentMg: d.totalMg,
          currentIU: d.totalIU,
          sources: d.sources,
        });
      });

      let html = '';
      const renderedCats = new Set();
      CATEGORY_ORDER.forEach(cat => {
        if (renderedCats.has(cat.key) || !byCategory[cat.key] || !byCategory[cat.key].length) return;
        renderedCats.add(cat.key);
        const items = byCategory[cat.key];
        html += '<div class="essentials-category">';
        html += '<div class="essentials-category-label">' + escapeHtml(cat.label) + ' (' + items.length + ')</div>';
        html += '<div class="essentials-row">';
        items.forEach(item => { html += renderTile(item); });
        html += '</div></div>';
      });
      Object.keys(byCategory).forEach(catKey => {
        if (renderedCats.has(catKey)) return;
        const items = byCategory[catKey];
        if (!items.length) return;
        html += '<div class="essentials-category">';
        html += '<div class="essentials-category-label">' + escapeHtml(catKey.replace(/_/g, ' ')) + ' (' + items.length + ')</div>';
        html += '<div class="essentials-row">';
        items.forEach(item => { html += renderTile(item); });
        html += '</div></div>';
      });

      host.innerHTML = html || '<div style="text-align:center;color:var(--ink-mute);padding:20px;">No essentials data available.</div>';
      host.querySelectorAll('.essential-tile').forEach(tile => {
        tile.addEventListener('click', () => { hideTooltip(); showEssentialDetail(tile); });
        // Hover preview — show floating card after a short delay, follow cursor, hide on leave
        tile.addEventListener('mouseenter', (e) => {
          if (tooltipTimer) clearTimeout(tooltipTimer);
          tooltipTimer = setTimeout(() => showTooltip(tile, e), 180);
        });
        tile.addEventListener('mousemove', (e) => {
          if (tooltipEl && tooltipEl.classList.contains('visible')) positionTooltip(tooltipEl, e);
        });
        tile.addEventListener('mouseleave', hideTooltip);
      });
      applyEssentialsFilters();
    }

    function renderTile(item) {
      const { symbol, shortName } = abbreviate(item.name);
      const goalCls = isGoalMatch(item.name) ? ' goal-match' : '';
      // Stash the whole payload on the element so showEssentialDetail can read it
      try { tilePayloads[item.name] = item; } catch(e){}
      return '<button type="button" class="essential-tile ' + item.status + goalCls + '"' +
        ' data-name="' + escapeHtml(item.name) + '"' +
        ' data-status="' + item.status + '"' +
        ' aria-label="' + escapeHtml(item.name) + '">' +
        '<span class="e-symbol">' + escapeHtml(symbol) + '</span>' +
        '<span class="e-name">' + escapeHtml(shortName) + '</span>' +
        '</button>';
    }
    // Tile payload registry — keyed by essential name. Avoids stuffing huge JSON in data-* attrs.
    const tilePayloads = {};

    // ═══ Hover preview tooltip — quick scan card before commit-click ═══════════════════════
    let tooltipEl = null;
    let tooltipTimer = null;

    function ensureTooltip() {
      if (tooltipEl) return tooltipEl;
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'essential-tile-tooltip';
      document.body.appendChild(tooltipEl);
      return tooltipEl;
    }

    function buildTooltipHTML(payload) {
      const name = payload.name;
      const status = payload.status;
      const target = payload.target || null;
      const sources = payload.sources || [];
      const statusLabel = { gap: 'Gap', warn: 'Partial', diet: 'Dietary', ok: 'Covered', mute: 'Unknown' }[status] || 'Unknown';

      let amtHtml = '';
      let barHtml = '';
      let statusTextHtml = '';
      const isNumeric = target && (target.kind === 'hbsp' || target.kind === 'wallach' || target.kind === 'wallach_clinical' || target.kind === 'range' || target.kind === 'single' || target.kind === 'temp_range');

      if (isNumeric) {
        const isIU = (target.unit || '').toLowerCase() === 'iu';
        const cur = isIU ? (payload.currentIU || 0) : (payload.currentMg || 0);
        const low = isIU ? target.low : toMg(target.low, target.unit).v;
        const high = isIU ? target.high : toMg(target.high, target.unit).v;
        const barMax = Math.max(high * 1.1, cur * 1.05);
        const fp = barMax > 0 ? Math.min(100, (cur / barMax) * 100) : 0;
        const unitTag = isIU ? 'iu' : 'mg';
        const curStr = fmtAmount(cur, unitTag);
        const tgtStr = (target.low === target.high)
          ? fmtAmount(low, unitTag)
          : fmtAmount(low, unitTag) + '–' + fmtAmount(high, unitTag);
        amtHtml = '<div class="tooltip-row"><span class="tt-label">CURRENT</span><span class="tt-value">' + escapeHtml(curStr) + '</span></div>' +
                  '<div class="tooltip-row"><span class="tt-label">TARGET</span><span class="tt-value">' + escapeHtml(tgtStr) + '</span></div>';
        barHtml = '<div class="tooltip-bar"><div class="tooltip-bar-fill ' + status + '" style="width: ' + fp.toFixed(1) + '%;"></div></div>';

        // Short status text under bar — same logic as detail panel but more compact
        let statusText = '';
        if (cur >= low) {
          if (cur > high) {
            const over = cur - high;
            const overPct = (over / high) * 100;
            statusText = 'OVER by ' + fmtAmount(over, unitTag) + ' (' + Math.round(overPct) + '% above range)';
          } else {
            statusText = 'Inside Wallach’s ideal range';
          }
        } else {
          const pct = (cur / low) * 100;
          statusText = 'At ' + Math.round(pct) + '% of low-end target';
        }
        statusTextHtml = '<div class="tooltip-status-text ' + status + '">' + escapeHtml(statusText) + '</div>';
      } else if (target && target.note) {
        const noteShort = target.note.length > 120 ? target.note.slice(0, 120) + '…' : target.note;
        amtHtml = '<div class="tooltip-note">' + escapeHtml(noteShort) + '</div>';
      }

      // Sources — top 2
      let srcHtml = '';
      if (sources && sources.length) {
        const top = sources.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 2);
        const srcList = top.map(s => titleCaseSourceName(s.sourceName)).join(' &middot; ');
        srcHtml = '<div class="tooltip-sources-label">From your regimen</div><div class="tooltip-sources">' + srcList + (sources.length > 2 ? ' <span class="tt-extra">(+' + (sources.length - 2) + ' more)</span>' : '') + '</div>';
      } else {
        srcHtml = '<div class="tooltip-sources-label">From your regimen</div><div class="tooltip-sources tt-empty">No regimen items contribute yet.</div>';
      }

      // Top Wallach benefits — first 3 pills, primary ones tinted teal
      let benefitsHtml = '';
      const rawTtBens = (BENEFITS_MAP[name] || []).slice(0, 3);
      const ttBens = rawTtBens.map(b => typeof b === 'string' ? { t: b, p: 0 } : b);
      if (ttBens.length) {
        const pills = ttBens.map(b => '<span class="tooltip-benefit-pill' + (b.p ? ' tooltip-benefit-primary' : '') + '">' + (b.p ? '<span class="primary-dot">●</span>' : '') + escapeHtml(b.t) + '</span>').join('');
        benefitsHtml = '<div class="tooltip-sources-label">Top Wallach benefits</div><div class="tooltip-benefits">' + pills + '</div>';
      }

      // Top ideal supplement — 1 card with name + cost/day
      let suppHtml = '';
      const suppData = BEST_SUPPS_MAP[name] || {};
      const topNumeric = (suppData.numeric || [])[0];
      const topTrace = (suppData.trace || [])[0];
      const top = topNumeric || topTrace;
      if (top) {
        const isTrace = !topNumeric && topTrace;
        const costStr = top.daily_cost != null ? '$' + top.daily_cost.toFixed(2) + '/day' : 'price n/a';
        const amtStr = isTrace ? '<span class="tt-trace-badge">trace coverage</span>' :
          '<span class="tt-supp-amount">' + escapeHtml((top.daily_amount_display || '') + ' ' + (top.display_unit || '')) + ' (' + top.pct_of_low_target + '%)</span>';
        suppHtml = '<div class="tooltip-sources-label">Best supplement</div>' +
          '<div class="tooltip-supp-card">' +
            '<div class="tt-supp-name">' + escapeHtml(top.product) + '</div>' +
            '<div class="tt-supp-stats">' + amtStr + ' &middot; <span class="tt-supp-cost">' + escapeHtml(costStr) + '</span></div>' +
          '</div>';
      }

      return '<div class="tooltip-title">' + escapeHtml(name) + '</div>' +
        '<span class="tooltip-status ' + status + '">' + statusLabel + '</span>' +
        amtHtml + barHtml + statusTextHtml + srcHtml + benefitsHtml + suppHtml +
        '<div class="tooltip-cta">CLICK FOR THE FULL BREAKDOWN →</div>';
    }

    function showTooltip(tile, e) {
      const tt = ensureTooltip();
      const payload = tilePayloads[tile.dataset.name];
      if (!payload) return;
      tt.innerHTML = buildTooltipHTML(payload);
      positionTooltip(tt, e);
      tt.classList.add('visible');
    }

    function positionTooltip(tt, e) {
      const rect = tt.getBoundingClientRect();
      const margin = 14;
      let left = e.clientX + margin;
      let top = e.clientY + margin;
      if (left + rect.width > window.innerWidth - 16) left = e.clientX - rect.width - margin;
      if (top + rect.height > window.innerHeight - 16) top = e.clientY - rect.height - margin;
      if (top < 8) top = 8;
      if (left < 8) left = 8;
      tt.style.left = left + 'px';
      tt.style.top = top + 'px';
    }

    function hideTooltip() {
      if (tooltipEl) tooltipEl.classList.remove('visible');
      if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; }
    }

    // ─── Number parsing ─────────────────────────────────────────────────────────────────
    // Goal: convert strings like "Ultimate EFA Plus 2632.5 mg" / "200 to 500 mg/day" /
    // "20,000 IU to 300,000 IU" / "5 g t.i.d. = 15 g/day clinical" into numbers + units.

    const UNIT_TO_BASE_MG = { mg: 1, mcg: 0.001, μg: 0.001, 'µg': 0.001, g: 1000 };

    function parseCurrentAmount(text) {
      if (!text) return null;
      // Sum all amounts in the text (e.g., "Ultimate Daily Classic 13.3 mg; Neutonic 4.2 mg" → 17.5 mg)
      const re = /(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|g|iu|IU)\b/gi;
      let m, totalMg = 0, totalIU = 0, anyMg = false, anyIU = false;
      while ((m = re.exec(text)) !== null) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        const unit = m[2].toLowerCase();
        if (unit === 'iu') { totalIU += val; anyIU = true; }
        else if (UNIT_TO_BASE_MG[unit] != null) { totalMg += val * UNIT_TO_BASE_MG[unit]; anyMg = true; }
      }
      if (anyMg) return { value: totalMg, unit: 'mg' };
      if (anyIU) return { value: totalIU, unit: 'iu' };
      return null;
    }

    function parseTargetRange(text) {
      if (!text) return null;
      // Try range with /day suffix first
      let m = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:to|–|—|-)\s*(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|g|iu|IU)\s*\/?\s*day/i);
      if (!m) m = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:to|–|—|-)\s*(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|g|iu|IU)/i);
      if (m) {
        return {
          low: parseFloat(m[1].replace(/,/g, '')),
          high: parseFloat(m[2].replace(/,/g, '')),
          unit: m[3].toLowerCase(),
        };
      }
      // Single target — look for ".../day" pattern preferentially
      m = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|g|iu|IU)\s*\/?\s*day/i);
      if (!m) m = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|g|iu|IU)/i);
      if (m) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        return { low: v, high: v, unit: m[2].toLowerCase() };
      }
      return null;
    }

    function toBaseUnit(val, unit) {
      const u = unit.toLowerCase();
      if (u === 'iu') return { v: val, u: 'iu' };
      return { v: val * (UNIT_TO_BASE_MG[u] || 1), u: 'mg' };
    }

    // Format a value with its appropriate unit. Prefers g if >= 1000 mg, mcg if < 0.5 mg.
    function fmtAmount(val, unit) {
      if (unit === 'iu') return val.toLocaleString() + ' IU';
      // unit is mg-equivalent
      if (val >= 1000) return (val / 1000).toLocaleString(undefined, {maximumFractionDigits: 2}) + ' g';
      if (val < 0.5) return (val * 1000).toLocaleString(undefined, {maximumFractionDigits: 1}) + ' mcg';
      return val.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' mg';
    }

    // ─── Per-goal Benefits matching ─────────────────────────────────────────────────────
    // Three goals on Luneth's Snapshot: Cognition (blue), Strength/T (red), Longevity (purple).
    // Longevity by definition matches ALL 90 essentials, so we surface it as the always-on baseline
    // in the legend rather than starring every tile with it. The two specific goals get explicit pills.
    const COGNITION_TERMS = ['choline', 'taurine', 'lecithin', 'b1', 'b2', 'b3', 'b5', 'b6', 'b7', 'b9', 'b12',
      'thiamine', 'riboflavin', 'niacin', 'pantothenic', 'pyridoxine', 'biotin', 'folate', 'folic', 'cobalamin',
      'chromium', 'vanadium', 'vitamin e', 'copper', 'zinc', 'omega-3', 'dha', 'epa', 'inositol'];
    const STRENGTH_TERMS = ['zinc', 'boron', 'vitamin a', 'beta-carotene', 'retinol', 'omega-3', 'omega-6',
      'omega-9', 'magnesium', 'efa', 'vitamin d'];

    function matchedGoals(name) {
      const lower = name.toLowerCase();
      const hit = [];
      if (COGNITION_TERMS.some(t => lower.includes(t))) hit.push('cognition');
      if (STRENGTH_TERMS.some(t => lower.includes(t))) hit.push('strength');
      return hit;
    }

    const GOAL_LABELS = {
      cognition: 'Cognition',
      strength: 'Strength & Testosterone',
      longevity: 'Longevity',
    };

    function showEssentialDetail(tile) {
      const panel = document.getElementById('essential-detail');
      if (!panel) return;
      document.querySelectorAll('.essential-tile.selected').forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');

      const name = tile.dataset.name;
      const sc = tile.dataset.status;
      const statusLabel = { gap: 'Gap', warn: 'Partial', diet: 'Dietary', ok: 'Covered', mute: 'Unknown' }[sc] || 'Unknown';

      // Pull the LIVE payload built by computeLiveCoverage (current totals, target, sources)
      const payload = tilePayloads[name] || {};
      const target = payload.target || null;
      const sources = payload.sources || [];
      const isIU = target && (target.unit || '').toLowerCase() === 'iu';
      const currentVal = isIU ? (payload.currentIU || 0) : (payload.currentMg || 0);

      // ─── Progress bar with REAL numbers ───────────────────────────────────────────────
      let progressHtml = '';
      const hasNumericTarget = target && (target.kind === 'hbsp' || target.kind === 'wallach' || target.kind === 'wallach_clinical' || target.kind === 'range' || target.kind === 'single' || target.kind === 'temp_range' || target.kind === 'amino_fallback');

      if (hasNumericTarget && currentVal >= 0) {
        const tLow = isIU ? target.low : toMg(target.low, target.unit).v;
        const tHigh = isIU ? target.high : toMg(target.high, target.unit).v;
        const unitTag = isIU ? 'iu' : 'mg';
        // When overshooting, the fill should reach 100% (no awkward gray gap)
        const isOver = currentVal > tHigh;
        // Bar scale: tHigh * 1.4 when not over, currentVal otherwise so 100% fill at over
        const barMax = isOver ? currentVal * 1.05 : Math.max(tHigh * 1.4, currentVal * 1.05);
        const curPct = isOver ? 100 : Math.min(100, (currentVal / barMax) * 100);
        const lowPct = Math.min(100, (tLow / barMax) * 100);
        const highPct = Math.min(100, (tHigh / barMax) * 100);
        const bandLeft = lowPct;
        const bandWidth = Math.max(0.8, highPct - lowPct);

        // Status text
        let statusText = '', statusCls = '';
        if (currentVal >= tLow) {
          if (currentVal > tHigh) {
            const over = currentVal - tHigh;
            const overPct = (over / tHigh) * 100;
            statusCls = overPct > 100 ? 'way-over' : 'over';
            statusText = 'OVER by ' + fmtAmount(over, unitTag) + ' (' + Math.round(overPct) + '% above the high end of Wallach\'s range)' + (overPct > 50 ? ' — could dial back or swap to a leaner SKU.' : '');
          } else {
            statusText = 'Inside Wallach\'s ideal range — you\'re hitting target.';
          }
        } else {
          const gap = tLow - currentVal;
          const pct = (currentVal / tLow) * 100;
          statusText = 'At ' + Math.round(pct) + '% of the low-end target. ' + fmtAmount(gap, unitTag) + ' more would close the gap.';
        }

        const tgtDisplay = (target.low === target.high)
          ? fmtAmount(isIU ? target.low : toMg(target.low, target.unit).v, unitTag)
          : fmtAmount(isIU ? target.low : toMg(target.low, target.unit).v, unitTag) + '–' + fmtAmount(isIU ? target.high : toMg(target.high, target.unit).v, unitTag);
        const curDisplay = fmtAmount(currentVal, unitTag);

        // Status-aware fill class
        const fillCls = (currentVal > tHigh) ? 'ok' :
                        (currentVal >= tLow) ? 'ok' :
                        (currentVal >= tLow * 0.40) ? 'warn' : 'gap';

        progressHtml =
          '<div class="essential-progress">' +
            '<div class="essential-progress-numbers">' +
              '<div class="essential-pb-current"><span class="lbl">CURRENT:</span> <span class="num">' + escapeHtml(curDisplay) + '</span></div>' +
              '<div class="essential-pb-target"><span class="lbl">TARGET:</span> <span class="num">' + escapeHtml(tgtDisplay) + '</span></div>' +
            '</div>' +
            '<div class="essential-progress-bar">' +
              '<div class="essential-pb-range-band" style="left: ' + bandLeft.toFixed(1) + '%; width: ' + bandWidth.toFixed(1) + '%;" title="Wallach ideal range"></div>' +
              '<div class="essential-progress-fill ' + fillCls + '" style="width: ' + curPct.toFixed(1) + '%;"></div>' +
            '</div>' +
            '<div class="essential-progress-status ' + statusCls + '">' + escapeHtml(statusText) + '</div>' +
          '</div>';
      } else {
        // No numeric target — show qualitative bar
        const fp = fillPercent(sc);
        const fallbackText = (target && target.note) ? target.note :
          (sc === 'ok' ? 'At/above target' : sc === 'diet' ? 'Covered via diet' : '—');
        progressHtml =
          '<div class="essential-progress">' +
            '<div class="essential-progress-numbers">' +
              '<div class="essential-pb-current"><span class="lbl">CURRENT:</span> <span class="num">' + (sources.length ? fmtAmount(currentVal, 'mg') : '—') + '</span></div>' +
              '<div class="essential-pb-target">' + escapeHtml(fallbackText) + '</div>' +
            '</div>' +
            '<div class="essential-progress-bar">' +
              '<div class="essential-progress-fill ' + sc + '" style="width: ' + fp + '%;"></div>' +
            '</div>' +
          '</div>';
      }

      // ─── What you get ─ source list (sorted high→low, capped, title-cased)
      const wygDisplay = formatSourceList(sources, 8);

      // ─── Wallach target ─ clean numeric + verbose note
      let tgtRowDisplay = '<em style="color:var(--ink-mute);">No Wallach-stated target available.</em>';
      if (target) {
        if (hasNumericTarget) {
          const low = isIU ? target.low : toMg(target.low, target.unit).v;
          const high = isIU ? target.high : toMg(target.high, target.unit).v;
          const unitTag = isIU ? 'iu' : 'mg';
          tgtRowDisplay = (target.low === target.high)
            ? '<strong>' + fmtAmount(low, unitTag) + '/day</strong>'
            : '<strong>' + fmtAmount(low, unitTag) + ' – ' + fmtAmount(high, unitTag) + '/day</strong>';
          if (target.note) tgtRowDisplay += ' <span style="color:var(--ink-mute);font-size:13px;">(' + escapeHtml(target.note) + ')</span>';
          if (target.kind === 'temp_range') {
            tgtRowDisplay += '<div style="margin-top:5px;font-size:11.5px;color:#8a5a14;background:#fbf2dc;padding:5px 9px;border-radius:5px;border:1px solid #e0c280;"><strong>Temporary placeholder.</strong> Not a Wallach stance — used for visual coverage only until Wallach\'s specific dose is confirmed.</div>';
          }
        } else if (target.note) {
          tgtRowDisplay = '<em style="color:var(--ink-mute);">' + escapeHtml(target.note) + '</em>';
        }
      }

      // ─── Benefits — per-goal colored stars FIRST, then gray Wallach-corpus benefits
      const goals = matchedGoals(name);
      // Pass 5 — benefits now distinguish PRIMARY (this essential is #1 source for the canonical
      // category) from SECONDARY. Primary pills get teal-tinted styling + small dot prefix.
      const rawBens = (BENEFITS_MAP[name] || []).slice(0, 10);
      // Normalize: handle string (legacy) or {t, p} object
      const wallachBenefits = rawBens.map(b => typeof b === 'string' ? { t: b, p: 0 } : b);

      const goalPills = goals.length
        ? goals.map(g => '<span class="benefit-pill ' + g + '"><span class="star">★</span>' + GOAL_LABELS[g] + '</span>').join('')
        : '<span class="benefit-pill longevity"><span class="star">★</span>' + GOAL_LABELS.longevity + ' (all 90)</span>';

      const wallachPills = wallachBenefits.length
        ? wallachBenefits.map(b => '<span class="benefit-pill wallach-benefit' + (b.p ? ' wallach-benefit-primary' : '') + '">' + (b.p ? '<span class="primary-dot">●</span>' : '') + escapeHtml(b.t) + '</span>').join('')
        : '';

      let benefitsHtml =
        '<div class="essential-detail-row">' +
          '<div class="label">Benefits</div>' +
          '<div class="value">' +
            '<div class="benefit-pills">' + goalPills + '</div>' +
            (wallachPills ? '<div class="benefits-subhead">Other benefits per Wallach corpus <span class="primary-legend">— <span class="primary-dot">●</span> primary source for the listed category</span></div><div class="benefit-pills">' + wallachPills + '</div>' : '') +
          '</div>' +
        '</div>';

      // ─── Ideal supplements (Youngevity-sourced, two tracks: numeric + trace coverage)
      // numeric track: products with explicit mg of the essential on the label
      // trace track: plant-derived mineral complex products (Wallach's group-coverage source)
      //   — for essentials Wallach treats as "trace via PDM" or where label doesn't quantify
      const suppData = BEST_SUPPS_MAP[name] || {};
      const numericSupps = (suppData.numeric || []).slice(0, 3);
      const traceSupps = (suppData.trace || []).slice(0, 3);
      let suppsHtml = '';

      if (numericSupps.length || traceSupps.length) {
        let cardsHtml = '';

        if (numericSupps.length) {
          const numericCards = numericSupps.map(s => {
            const amt = (s.daily_amount_display != null ? s.daily_amount_display : '') + ' ' + (s.display_unit || '');
            const pct = '(' + s.pct_of_low_target + '% of target)';
            const actualCost = s.daily_cost != null ? '$' + s.daily_cost.toFixed(2) + '/day' : 'price n/a';
            const targetCost = s.cost_at_target != null ? '$' + s.cost_at_target.toFixed(2) + '/day at target' : '';
            const servingsNote = s.daily_servings > 1 ? ' (' + s.daily_servings + '×/day per label)' : '';
            return '<div class="ideal-supp-card">' +
              '<div class="ideal-supp-name">' + escapeHtml(s.product) + '</div>' +
              '<div class="ideal-supp-stats"><span class="amount-num">' + escapeHtml(amt.trim()) + '</span> <span class="pct">' + escapeHtml(pct) + '</span>' + escapeHtml(servingsNote) + ' &middot; <span class="cost">' + escapeHtml(actualCost) + '</span></div>' +
              (targetCost ? '<div class="ideal-supp-norm">' + escapeHtml(targetCost) + ' (scaled comparison across products)</div>' : '') +
              '</div>';
          }).join('');
          cardsHtml += numericCards;
        }

        if (traceSupps.length) {
          const traceHeader = '<div class="ideal-supp-trace-header">Trace coverage via plant-derived mineral complex</div>';
          const traceCards = traceSupps.map(s => {
            const cost = s.daily_cost != null ? '$' + s.daily_cost.toFixed(2) + '/day' : 'price n/a';
            return '<div class="ideal-supp-card ideal-supp-trace">' +
              '<div class="ideal-supp-name">' + escapeHtml(s.product) + '</div>' +
              '<div class="ideal-supp-stats"><span class="trace-badge">trace coverage</span> &middot; <span class="cost">' + escapeHtml(cost) + '</span></div>' +
              '</div>';
          }).join('');
          cardsHtml += traceHeader + traceCards;
        }

        suppsHtml = '<div class="essential-detail-row"><div class="label">Ideal Supplements</div><div class="value"><div class="ideal-supps">' + cardsHtml + '</div></div></div>';
      }

            const legendHtml =
        '<div class="essential-benefits-legend">' +
          '<span class="legend-intro">★ Matches a stated goal</span>' +
          '<span class="legend-item"><span class="legend-star cognition">★</span>Cognition</span>' +
          '<span class="legend-item"><span class="legend-star strength">★</span>Strength &amp; Testosterone</span>' +
          '<span class="legend-item"><span class="legend-star longevity">★</span>Longevity (all 90 essentials)</span>' +
        '</div>';

      const sourceNote =
        '<div class="essential-data-source-note">' +
          '<strong>Live recompute:</strong> these totals are computed from your current regimen (REGIMEN_BASE_DATA + your edits in localStorage) and the embedded essentials targets. Updates immediately when you add/edit items in the Regimen tab.' +
        '</div>';

      panel.innerHTML =
        '<div class="essential-detail-header">' +
          '<h3 class="essential-detail-title" style="text-transform:none;">' + escapeHtml(name) + '</h3>' +
          '<div style="display:flex;gap:10px;align-items:center;">' +
            '<span class="essential-detail-status ' + sc + '">' + statusLabel + '</span>' +
            '<button type="button" class="essential-detail-close" id="essential-detail-close">Close</button>' +
          '</div>' +
        '</div>' +
        progressHtml +
        '<div class="essential-detail-row"><div class="label">What you get</div><div class="value">' + wygDisplay + '</div></div>' +
        '<div class="essential-detail-row"><div class="label">Wallach target</div><div class="value">' + tgtRowDisplay + '</div></div>' +
        benefitsHtml +
        suppsHtml +
        legendHtml +
        sourceNote;

      panel.hidden = false;
      const closeBtn = document.getElementById('essential-detail-close');
      if (closeBtn) closeBtn.addEventListener('click', closeEssentialDetail);
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function closeEssentialDetail() {
      const panel = document.getElementById('essential-detail');
      if (panel) panel.hidden = true;
      document.querySelectorAll('.essential-tile.selected').forEach(t => t.classList.remove('selected'));
    }

    let qfMode = 'all';
    let qSearch = '';
    function applyEssentialsFilters() {
      document.querySelectorAll('.essential-tile').forEach(tile => {
        const sc = tile.dataset.status;
        const matchQF = (qfMode === 'all') || (sc === 'gap' || sc === 'warn');
        const matchSearch = !qSearch || tile.dataset.name.toLowerCase().includes(qSearch.toLowerCase());
        tile.style.display = (matchQF && matchSearch) ? '' : 'none';
      });
    }

    function initEssentialsView() {
      buildEssentialsGrid();
      document.querySelectorAll('.qf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.qf-btn').forEach(b => b.classList.toggle('active', b === btn));
          qfMode = btn.dataset.qf;
          applyEssentialsFilters();
        });
      });
      const search = document.getElementById('gap-search');
      if (search) {
        search.addEventListener('input', e => {
          qSearch = e.target.value;
          applyEssentialsFilters();
        });
      }
    }

    // Expose so the scenario-toggle handler above can rebuild on switch
    window.buildEssentialsGrid = buildEssentialsGrid;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEssentialsView);
    } else {
      initEssentialsView();
    }
  })();

// === Label Check scoring engine + UI (v1.4 polished) ===
(function() {
  'use strict';

  // ---- Embedded reference data (subset; sync with knowledge/essentials-targets.json) ----
  const ESSENTIALS = [
    { name: "Calcium", target: "2,000 to 5,000 mg/day", low: 2000, high: 5000, unit: "mg" },
    { name: "Magnesium", target: "1,000 mg/day", low: 1000, high: 1000, unit: "mg" },
    { name: "Potassium", target: "5,500 mg/day", low: 5500, high: 5500, unit: "mg" },
    { name: "Sodium", target: "300 to 3,000 mg/day", low: 300, high: 3000, unit: "mg" },
    { name: "Zinc", target: "15 to 50 mg/day", low: 15, high: 50, unit: "mg" },
    { name: "Copper", target: "4 to 6 mg/day", low: 4, high: 6, unit: "mg" },
    { name: "Iron", target: "15 mg/day clinical", low: 15, high: 15, unit: "mg" },
    { name: "Manganese", target: "5 to 25 mg/day", low: 5, high: 25, unit: "mg" },
    { name: "Chromium", target: "200 to 500 mcg/day", low: 200, high: 500, unit: "mcg" },
    { name: "Selenium", target: "500 to 3,000 mcg/day", low: 500, high: 3000, unit: "mcg" },
    { name: "Iodine", target: "150 to 1,500 mcg/day", low: 150, high: 1500, unit: "mcg" },
    { name: "Boron", target: "1 mg/day clinical", low: 1, high: 1, unit: "mg" },
    { name: "Phosphorus", target: "800 to 1,500 mg/day", low: 800, high: 1500, unit: "mg" },
    { name: "Vitamin A", target: "20,000 to 300,000 IU", low: 20000, high: 300000, unit: "iu" },
    { name: "Vitamin C", target: "10,000 mg/day", low: 10000, high: 10000, unit: "mg" },
    { name: "Vitamin D", target: "1,000 IU/day", low: 1000, high: 1000, unit: "iu" },
    { name: "Vitamin E", target: "400 to 2,000 IU/day", low: 400, high: 2000, unit: "iu" },
    { name: "Vitamin K", target: "30 mcg/day", low: 30, high: 30, unit: "mcg" },
    { name: "Vitamin B1 (Thiamine)", target: "200 to 500 mg/day", low: 200, high: 500, unit: "mg" },
    { name: "Vitamin B2 (Riboflavin)", target: "200 to 500 mg/day", low: 200, high: 500, unit: "mg" },
    { name: "Vitamin B3 (Niacin)", target: "300 to 1,000 mg/day", low: 300, high: 1000, unit: "mg" },
    { name: "Vitamin B5 (Pantothenic Acid)", target: "200 to 500 mg/day", low: 200, high: 500, unit: "mg" },
    { name: "Vitamin B6 (Pyridoxine)", target: "200 to 500 mg/day", low: 200, high: 500, unit: "mg" },
    { name: "Vitamin B12 (Cobalamin)", target: "1,000 mcg/day", low: 1000, high: 1000, unit: "mcg" },
    { name: "Folate", target: "15 mg/day clinical", low: 15000, high: 15000, unit: "mcg" },
    { name: "Biotin", target: "500 to 3,000 mcg/day", low: 500, high: 3000, unit: "mcg" },
    { name: "Choline", target: "4 g/day cognitive", low: 4000, high: 4000, unit: "mg" },
    { name: "Inositol", target: "500 to 2,000 mg/day", low: 500, high: 2000, unit: "mg" },
    { name: "Omega-3 (EPA+DHA)", target: "5 to 15 g/day", low: 5000, high: 15000, unit: "mg" },
    { name: "Protein", target: "60-120 g/day", low: 60, high: 120, unit: "g" }
  ];

  // User's current daily intake (sync from stack_coverage.py --include-diet, snapshot 2026-06-13)
  const CURRENT_COVERAGE = {
    "Calcium": { amount: 376.8, unit: "mg" },
    "Magnesium": { amount: 151.7, unit: "mg" },
    "Potassium": { amount: 187.5, unit: "mg" },
    "Sodium": { amount: 1270, unit: "mg" },
    "Zinc": { amount: 3.4, unit: "mg" },
    "Copper": { amount: 0.9, unit: "mg" },
    "Iron": { amount: 2.9, unit: "mg" },
    "Manganese": { amount: 1.0, unit: "mg" },
    "Chromium": { amount: 26.7, unit: "mcg" },
    "Selenium": { amount: 81.2, unit: "mcg" },
    "Iodine": { amount: 147.7, unit: "mcg" },
    "Boron": { amount: 0, unit: "mg" },
    "Phosphorus": { amount: 516, unit: "mg" },
    "Vitamin A": { amount: 610, unit: "mcg" },
    "Vitamin C": { amount: 67.5, unit: "mg" },
    "Vitamin D": { amount: 681, unit: "iu" },
    "Vitamin E": { amount: 3.5, unit: "mg" },
    "Vitamin K": { amount: 9, unit: "mcg" },
    "Vitamin B1 (Thiamine)": { amount: 13.3, unit: "mg" },
    "Vitamin B2 (Riboflavin)": { amount: 14.6, unit: "mg" },
    "Vitamin B3 (Niacin)": { amount: 30.3, unit: "mg" },
    "Vitamin B5 (Pantothenic Acid)": { amount: 22.4, unit: "mg" },
    "Vitamin B6 (Pyridoxine)": { amount: 14.5, unit: "mg" },
    "Vitamin B12 (Cobalamin)": { amount: 530, unit: "mcg" },
    "Folate": { amount: 190, unit: "mcg" },
    "Biotin": { amount: 19, unit: "mcg" },
    "Choline": { amount: 1397, unit: "mg" },
    "Inositol": { amount: 13.3, unit: "mg" },
    "Omega-3 (EPA+DHA)": { amount: 4720, unit: "mg" },
    "Protein": { amount: 87, unit: "g" }
  };

  const GOAL_KEYWORDS = {
    cognition: ["cogniti","memory","focus","brain","neuro","mental","alzheimer","dementia","lecithin","choline","phosphatidyl","nerve","synaptic","myelin","mood"],
    hormones_strength: ["testosterone","hormone","libido","strength","muscle","androgen","estrogen","boron","tribulus","anabolic","vitality","sexual"],
    longevity_anti_aging: ["aging","longevity","anti-aging","youthful","lifespan","telomere","rejuven","centenarian"],
    joints_collagen: ["joint","cartilage","collagen","msm","glucosamine","chondroitin","arthritis","flexibility","mobility","tendon","ligament"],
    energy_metabolism: ["energy","metabolism","fatigue","stamina","endurance","atp","mitochondri","co-q10","coq10","b-complex","b vitamin"],
    immunity: ["immun","infection","antiviral","antimicrobial","lymph","thymus"],
    gut_digestion: ["digesti","gut","probiotic","enzyme","stomach","intestin","betaine","hcl","microbiome","bowel","colon"],
    cardiovascular: ["cardiovasc","heart","blood pressure","cholesterol","circulation","artery","stroke"],
    bone_skeletal: ["bone","osteoporosis","skeletal","spine","fracture","vertebr"],
    thyroid_endocrine: ["thyroid","adrenal","endocrine","cortisol"],
    skin_hair_nails: ["skin","hair","nail","wrinkle","biotin","silica"],
    blood_sugar: ["blood sugar","glucose","diabet","insulin","glycemic"],
    sleep_stress: ["sleep","insomnia","stress","relax","anxiety","calm","melatonin"],
    hydration_electrolyte: ["hydrat","electrolyte","sparkling beverage"]
  };

  // Wallach-anchored nutrient → goal map. Each goal lists the nutrients Wallach calls out as supporting it,
  // each paired with a brief why-snippet. Used by the Goal evidence panel in result rendering — surfaces
  // WHICH nutrients on the scanned label contribute to a matched goal, and WHY per Wallach.
  // Format: { goal_key: [{ nutrient: 'Display Name', why: 'short Wallach-anchored explanation' }, ...] }
  const NUTRIENT_TO_GOAL_MAP = {
    cognition: [
      { nutrient: 'Choline', why: 'Wallach: 4 g/day clinical for memory / focus; primary cognitive substrate.' },
      { nutrient: 'Lecithin', why: 'Wallach: dietary choline carrier; supports myelin / synaptic function.' },
      { nutrient: 'Chromium', why: 'Wallach: cognition pairs with vanadium; blood-sugar stability underwrites focus.' },
      { nutrient: 'Vanadium', why: 'Wallach: paired with Cr for cognition + blood-sugar stability.' },
      { nutrient: 'Zinc', why: 'Wallach: cognition cofactor; supports neurotransmitter synthesis.' },
      { nutrient: 'Copper', why: 'Wallach: cognitive cofactor; required for catecholamine synthesis.' },
      { nutrient: 'DHA', why: 'Wallach: essential fatty acid for brain membrane integrity.' },
      { nutrient: 'Omega-3', why: 'Wallach: EFA family; EPA+DHA support brain + nerve health.' },
      { nutrient: 'Vitamin E', why: 'Wallach: neuronal cellular membrane integrity.' },
      { nutrient: 'Vitamin B1 (Thiamine)', why: 'Wallach: nerve health; B-complex anchor for cognition.' },
      { nutrient: 'Vitamin B6 (Pyridoxine)', why: 'Wallach: cognition / mood; B-complex anchor.' },
      { nutrient: 'Vitamin B12 (Cobalamin)', why: 'Wallach: nerve / methylation; B-complex anchor for cognition.' },
      { nutrient: 'Taurine', why: 'Wallach: cognition / nerve support.' }
    ],
    hormones_strength: [
      { nutrient: 'Zinc', why: 'Wallach: 45-150 mg/day for testosterone protocol; T-supporting cofactor.' },
      { nutrient: 'Boron', why: 'Wallach: ≥1 mg clinical for hormonal balance; T-supporting.' },
      { nutrient: 'Vitamin A', why: 'Wallach: hormonal support; beta-carotene form preferred.' },
      { nutrient: 'Vitamin E', why: 'Wallach: hormone synthesis cofactor.' },
      { nutrient: 'Selenium', why: 'Wallach: hormone-supporting cofactor.' },
      { nutrient: 'Omega-3', why: 'Wallach: hormonal support via EFA pathway.' }
    ],
    longevity_anti_aging: [
      { nutrient: 'Selenium', why: 'Wallach: longevity-supporting mineral; aligned with hair-mineral baseline.' },
      { nutrient: 'Zinc', why: 'Wallach: cellular repair / longevity cofactor.' },
      { nutrient: 'Vitamin E', why: 'Wallach: antioxidant pathway for longevity.' }
    ],
    joints_collagen: [
      { nutrient: 'Collagen', why: 'Joint substrate; framework-adjacent (Wallach silent on collagen specifically).' },
      { nutrient: 'Collagen Peptides', why: 'Joint substrate; framework-adjacent — supports cartilage / tendon.' },
      { nutrient: 'Vitamin C', why: 'Wallach: collagen synthesis cofactor (ascorbate-dependent).' },
      { nutrient: 'Copper', why: 'Wallach: collagen + elastin cross-linking; aneurysm-prevention cofactor.' },
      { nutrient: 'Manganese', why: 'Wallach: bone / connective tissue cofactor.' },
      { nutrient: 'Boron', why: 'Wallach: joint / bone supporting cofactor.' }
    ],
    energy_metabolism: [
      { nutrient: 'Vitamin B1 (Thiamine)', why: 'Wallach: carbohydrate utilization for energy.' },
      { nutrient: 'Vitamin B2 (Riboflavin)', why: 'Wallach: cellular energy production.' },
      { nutrient: 'Vitamin B3 (Niacin)', why: 'Wallach: NAD+ pathway; ATP production.' },
      { nutrient: 'Vitamin B5 (Pantothenic Acid)', why: 'Wallach: CoA synthesis; energy substrate.' },
      { nutrient: 'Iron', why: 'Wallach: hemoglobin / oxygen transport for energy.' },
      { nutrient: 'Magnesium', why: 'Wallach: ATP cofactor.' }
    ],
    immunity: [
      { nutrient: 'Zinc', why: 'Wallach: immune cofactor.' },
      { nutrient: 'Vitamin C', why: 'Wallach: 10,000 mg/day clinical; immune anchor.' },
      { nutrient: 'Selenium', why: 'Wallach: antiviral / immune support.' },
      { nutrient: 'Vitamin A', why: 'Wallach: epithelial / immune support; beta-carotene form preferred.' }
    ],
    gut_digestion: [
      { nutrient: 'Fiber', why: 'Substrate for gut microbiome; not a Wallach 90-essential but tracked.' },
      { nutrient: 'Dietary Fiber', why: 'Substrate for gut microbiome; not a Wallach 90-essential but tracked.' }
    ],
    cardiovascular: [
      { nutrient: 'Copper', why: 'Wallach: elastin / vascular integrity; aneurysm-prevention cofactor.' },
      { nutrient: 'Magnesium', why: 'Wallach: vascular / heart-rhythm cofactor.' },
      { nutrient: 'Omega-3', why: 'Wallach: vascular EFA support.' },
      { nutrient: 'Selenium', why: 'Wallach: vascular / heart cofactor (Keshan disease region).' }
    ],
    bone_skeletal: [
      { nutrient: 'Calcium', why: 'Wallach: 2,000-5,000 mg/day clinical; bone foundation.' },
      { nutrient: 'Magnesium', why: 'Wallach: 1,000 mg/day; bone matrix cofactor; Ca:Mg ratio.' },
      { nutrient: 'Boron', why: 'Wallach: ≥1 mg clinical; bone density / Ca utilization.' },
      { nutrient: 'Vitamin D', why: 'Wallach: 1,000 IU/day baseline; Ca absorption.' },
      { nutrient: 'Vitamin K', why: 'Wallach: bone matrix; K2 form preferred.' },
      { nutrient: 'Phosphorus', why: 'Wallach: bone mineral matrix.' }
    ],
    thyroid_endocrine: [
      { nutrient: 'Iodine', why: 'Wallach: 150-1,500 mcg/day; thyroid foundation.' },
      { nutrient: 'Selenium', why: 'Wallach: 500-3,000 mcg/day; T4→T3 conversion cofactor.' },
      { nutrient: 'Vitamin B12 (Cobalamin)', why: 'Wallach: B12 + thyroid support pair; methylation.' }
    ],
    skin_hair_nails: [
      { nutrient: 'Biotin', why: 'Wallach: hair / nail cofactor.' },
      { nutrient: 'Collagen', why: 'Skin substrate; framework-adjacent.' },
      { nutrient: 'Collagen Peptides', why: 'Skin substrate; framework-adjacent.' },
      { nutrient: 'Vitamin C', why: 'Wallach: skin collagen synthesis cofactor.' }
    ],
    blood_sugar: [
      { nutrient: 'Chromium', why: 'Wallach: 200-500 mcg/day; insulin sensitivity cofactor.' },
      { nutrient: 'Vanadium', why: 'Wallach: paired with Cr for blood-sugar stability.' },
      { nutrient: 'Magnesium', why: 'Wallach: insulin signaling cofactor.' }
    ],
    hydration_electrolyte: [
      { nutrient: 'Sodium', why: 'Wallach: 300-3,000 mg/day; electrolyte baseline.' },
      { nutrient: 'Potassium', why: 'Wallach: 5,500 mg/day; counter-balance to sodium.' },
      { nutrient: 'Magnesium', why: 'Wallach: electrolyte / muscle relaxation.' },
      { nutrient: 'Calcium', why: 'Wallach: electrolyte / muscle function.' }
    ],
    sleep_stress: [
      { nutrient: 'Magnesium', why: 'Wallach: relaxation / sleep cofactor.' },
      { nutrient: 'Calcium', why: 'Wallach: pairs with Mg for relaxation.' }
    ]
  };

  // Friendly display names for goal keys (cognition → "Cognition", hormones_strength → "Hormones / strength")
  const GOAL_DISPLAY_NAMES = {
    cognition: 'Cognition',
    hormones_strength: 'Hormones / strength',
    longevity_anti_aging: 'Longevity / anti-aging',
    joints_collagen: 'Joints / collagen',
    energy_metabolism: 'Energy / metabolism',
    immunity: 'Immunity',
    gut_digestion: 'Gut / digestion',
    cardiovascular: 'Cardiovascular',
    bone_skeletal: 'Bone / skeletal',
    thyroid_endocrine: 'Thyroid / endocrine',
    skin_hair_nails: 'Skin / hair / nails',
    blood_sugar: 'Blood sugar',
    sleep_stress: 'Sleep / stress',
    hydration_electrolyte: 'Hydration / electrolyte'
  };

  const ANTI_LIST = {
    "fried oils / seed oils": ["canola oil","soybean oil","vegetable oil","sunflower oil","safflower oil","corn oil","cottonseed oil","rapeseed oil","hydrogenated"],
    "added sugar": ["high fructose corn syrup","corn syrup","cane sugar","evaporated cane juice","dextrose","maltodextrin"],
    "artificial sweeteners": ["sucralose","aspartame","acesulfame","saccharin","neotame"],
    "caffeine": ["caffeine","yerba mate","guarana","kola nut"],
    "gluten sources": ["wheat","barley","rye","malt","spelt","oats","oat","oatmeal","oat flour","oat syrup","oat groats","oat bran"],
    "msg / glutamate": ["monosodium glutamate","yeast extract","hydrolyzed protein"]
  };

  // Framework explanations rendered alongside each flag in the result panel
  const ANTI_LIST_NOTES = {
    "fried oils / seed oils": "Wallach: 'if it has oil in name, don't use it' — broad rule against industrial seed oils due to omega-6 oxidation. High-oleic variants (sunflower/safflower/canola bred for >80% oleic acid) are framework-adjacent — significantly more stable than standard, but the broad rule still applies.",
    "added sugar": "Wallach-direct: sugar raises urinary chromium loss 300% for 12 hours (Rare Earths Cr entry). Severity scales with daily exposure; low-dose trace use is bounded harm.",
    "artificial sweeteners": "Wallach acknowledges sucralose as acceptable (Hell's Kitchen). Aspartame and acesulfame are mainstream-controversial — framework-adjacent. Stevia is Wallach-friendly.",
    "caffeine": "Wallach-direct: caffeine raises urinary Cr loss for ~12 hrs per dose. Not anti-coffee absolute, but flag for Cr cofactor balance.",
    "gluten sources": "Wallach-direct on actual gluten proteins: wheat / barley / rye / malt / spelt — these always flag serious regardless of marketing. Oats flag by default (commercial supply chains carry cross-contamination risk). Operational rule: if ANY oat ingredient in the label is declared 'gluten-free' — in either word order ('gluten free oats' or 'oats (gluten free)') — ALL oat-derivatives in that product are presumed GF, because a brand certifying one oat ingredient operates in a GF-aware supply chain across the rest. A 'gluten-free' claim attached to a NON-oat ingredient (e.g., 'gluten-free pasta') does NOT certify oats. Hard gluten proteins appearing elsewhere still flag independently — no shutoff trick. Buckwheat is a pseudocereal, gluten-free despite the name.",
    "msg / glutamate": "Wallach: free glutamate is a neurotoxin concern. Common hidden sources: yeast extract, hydrolyzed protein."
  };

  // Hard-reject terms (single hit = REJECT regardless of dose)
  const HARD_REJECT_TERMS = new Set(["high fructose corn syrup","corn syrup","hydrogenated","monosodium glutamate","aspartame","acesulfame"]);

  // Serious categories — single hit = SAVE only, 2+ hits = REJECT (unless softened)
  const SERIOUS_ANTI = ["fried oils / seed oils","added sugar","gluten sources","msg / glutamate"];

  function tokens(s) { return new Set(String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t => t.length >= 2 && !['vitamin','acid','the','and','or','from','as'].includes(t))); }
  function namesMatch(a, b) { const ta = tokens(a), tb = tokens(b); for (const t of ta) if (tb.has(t)) return true; return false; }
  // Word-boundary keyword match — prevents false positives like "buckwheat" matching "wheat"
  function matchKeyword(text, kw) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
  }
  function normalize(amount, unit) {
    if (typeof amount !== 'number' || isNaN(amount)) return null;
    const u = (unit||'').toLowerCase().trim();
    if (u === 'mcg') return { family:'mass_mcg', value: amount };
    if (u === 'mg') return { family:'mass_mcg', value: amount * 1000 };
    if (u === 'g') return { family:'mass_mcg', value: amount * 1000000 };
    if (u === 'iu') return { family:'iu', value: amount };
    return null;
  }
  function formatAmt(valueBase, family, displayHint) {
    if (family === 'iu') return Math.round(valueBase) + ' IU';
    if (displayHint === 'g' || valueBase >= 1000000) return (valueBase/1000000).toFixed(1) + ' g';
    if (displayHint === 'mg' || valueBase >= 1000) return (valueBase/1000).toFixed(1) + ' mg';
    return Math.round(valueBase) + ' mcg';
  }

  function findEssential(name) {
    for (const e of ESSENTIALS) if (namesMatch(e.name, name)) return e;
    return null;
  }

  function alignmentScore(nutrients) {
    let a=0,p=0,m=0,u=0;
    for (const n of nutrients) {
      const al = n.form_alignment || 'unknown';
      if (al==='aligned') a++; else if (al==='partial') p++; else if (al==='misaligned') m++; else u++;
    }
    const total = a+p+m+u;
    const score = total ? (a*2 + p - m) / total : 0;
    return { score: Math.round(score*100)/100, aligned:a, partial:p, misaligned:m, unknown:u, total };
  }

  function gapFillFor(n, dailyServings, effectiveCov) {
    const cov_table = effectiveCov || CURRENT_COVERAGE;
    const ess = findEssential(n.name);
    if (!ess) return null;
    const norm = normalize(parseFloat(n.amount), n.unit);
    if (!norm) return null;
    const targetNorm = normalize(ess.low, ess.unit);
    if (!targetNorm) return null;
    if (norm.family !== targetNorm.family) return null;
    const addedPerDay = norm.value * dailyServings;
    const cov = cov_table[ess.name];
    const curr = cov ? (normalize(cov.amount, cov.unit) || {value:0}).value : 0;
    const gap = Math.max(0, targetNorm.value - curr);
    const pct = targetNorm.value > 0 ? Math.round(1000 * Math.min(addedPerDay, gap) / targetNorm.value) / 10 : 0;
    return {
      essential: ess.name,
      currentDisplay: cov ? (Number(cov.amount).toFixed(cov.amount < 10 ? 1 : 0) + ' ' + cov.unit) : '0',
      addedDisplay: formatAmt(addedPerDay, norm.family, ess.unit),
      target: ess.target,
      gapFillPct: pct
    };
  }

  // Effective coverage = embedded baseline + regimen additions
  function getEffectiveCoverage() {
    const base = {};
    for (const [k, v] of Object.entries(CURRENT_COVERAGE)) base[k] = { amount: v.amount, unit: v.unit };
    const r = loadRegimen();
    for (const item of r.items) {
      const dailyServings = parseFloat(item.label.servings) || 1;
      for (const n of (item.label.nutrients || [])) {
        const ess = findEssential(n.name);
        if (!ess) continue;
        const norm = normalize(parseFloat(n.amount), n.unit);
        const essNorm = normalize(ess.low, ess.unit);
        if (!norm || !essNorm || norm.family !== essNorm.family) continue;
        let factor = 1;
        if (ess.unit === 'mg' && norm.family === 'mass_mcg') factor = 1/1000;
        else if (ess.unit === 'g' && norm.family === 'mass_mcg') factor = 1/1000000;
        const added = norm.value * factor * dailyServings;
        if (!base[ess.name]) base[ess.name] = { amount: 0, unit: ess.unit };
        base[ess.name].amount = Math.round((base[ess.name].amount + added) * 100) / 100;
      }
    }
    return base;
  }

  function matchGoals(label) {
    const text = ((label.name||'')+' '+(label.category||'')+' '+(label.ingredients||'')+' '+(label.brand||'')).toLowerCase();
    const matched = [];
    for (const [goal, kws] of Object.entries(GOAL_KEYWORDS)) {
      for (const kw of kws) if (text.includes(kw)) { matched.push(goal); break; }
    }
    return matched;
  }

  // Rich version — returns matched goals with the specific triggers and meaningful-only filtering.
  //
  // Inclusion gates (a goal only surfaces a card if AT LEAST ONE holds):
  //   1. STRONG keyword match — keyword found in product name, category, or brand. Signals the product is
  //      purpose-built for this goal. Always counts.
  //   2. MEANINGFUL nutrient — a Wallach-mapped nutrient delivers ≥10% of Wallach's daily target per serving.
  //      For framework-adjacent nutrients (no Wallach target, e.g., Collagen), only counts when paired with
  //      a strong keyword (prevents trace collagen in random products from surfacing).
  //
  // Why this discriminates:
  //   - "Sunflower lecithin" in a granola's ingredient list is emulsifier dose (~50-200mg), not Wallach's
  //     cognitive-substrate framing. Trace ingredient ≠ substantive dose. WEAK keyword alone does not pass.
  //   - "Lecithin Brain Capsules" with cognition keyword in the NAME is purpose-built. STRONG keyword passes.
  //   - This mirrors the brain's "substance questions are dose / source / context questions" pitfall — the
  //     goal-match surface enforces it at the UX layer.
  function matchGoalsRich(label, gapFills) {
    const nameTxt = ((label.name||'') + ' ' + (label.category||'') + ' ' + (label.brand||'')).toLowerCase();
    const ingTxt = (label.ingredients||'').toLowerCase();
    const labelNutrients = label.nutrients || [];
    const dailyServings = parseFloat(label.servings) || 1;
    const MEANINGFUL_PCT_THRESHOLD = 10;  // % of Wallach daily target per serving

    // Pre-compute per-nutrient "% of Wallach daily target" — stable metric independent of user's current intake.
    // For nutrients not in ESSENTIALS (framework-adjacent like Collagen), hasTarget = false.
    const nutrientStats = {};
    for (const ln of labelNutrients) {
      const lnKey = (ln.name || '').toLowerCase().trim();
      const ess = findEssential(ln.name);
      let pctOfTarget = null;
      if (ess) {
        const norm = normalize(parseFloat(ln.amount), ln.unit);
        const targetNorm = normalize(ess.low, ess.unit);
        if (norm && targetNorm && norm.family === targetNorm.family && targetNorm.value > 0) {
          pctOfTarget = Math.round(1000 * (norm.value * dailyServings) / targetNorm.value) / 10;
        }
      }
      nutrientStats[lnKey] = { pctOfTarget, hasTarget: !!ess };
    }

    const matches = [];
    for (const [goal, kws] of Object.entries(GOAL_KEYWORDS)) {
      // Split keyword hits by location (strong = name/category/brand; weak = ingredients-only).
      const strongKws = [];
      const weakKws = [];
      for (const kw of kws) {
        if (nameTxt.includes(kw)) strongKws.push(kw);
        else if (ingTxt.includes(kw)) weakKws.push(kw);
      }

      // Find Wallach-mapped nutrients present on the label.
      const goalNutMap = NUTRIENT_TO_GOAL_MAP[goal] || [];
      const seenWhy = new Set();
      const allNutrientMatches = [];
      for (const gn of goalNutMap) {
        const b = gn.nutrient.toLowerCase().trim();
        const labelHit = labelNutrients.find(ln => {
          const a = (ln.name || '').toLowerCase().trim();
          return a === b || a.includes(b) || b.includes(a);
        });
        if (labelHit && !seenWhy.has(b)) {
          seenWhy.add(b);
          const lnKey = (labelHit.name || '').toLowerCase().trim();
          const stat = nutrientStats[lnKey] || { pctOfTarget: null, hasTarget: false };
          allNutrientMatches.push({
            nutrient: labelHit.name,
            why: gn.why,
            pctOfTarget: stat.pctOfTarget,
            hasTarget: stat.hasTarget
          });
        }
      }

      // Apply the threshold: meaningful = ≥10% of Wallach target. Framework-adjacent nutrients (no target)
      // are only included when paired with a strong keyword (purpose-built product).
      const meaningfulNutrients = allNutrientMatches.filter(n => {
        if (n.hasTarget) return n.pctOfTarget != null && n.pctOfTarget >= MEANINGFUL_PCT_THRESHOLD;
        return strongKws.length > 0;  // framework-adjacent + strong keyword = surface
      });

      // Goal qualifies if EITHER: strong keyword exists, OR at least one meaningful nutrient.
      const include = strongKws.length > 0 || meaningfulNutrients.length > 0;
      if (!include) continue;

      matches.push({
        goal,
        strongKws: strongKws.slice(0, 3),     // cap display
        weakKws: weakKws.slice(0, 3),         // tracked but not displayed; reserved for future tooltips
        nutrientMatches: meaningfulNutrients
      });
    }
    return matches;
  }

  function antiFlags(label) {
    const text = (label.ingredients||'').toLowerCase();
    const flags = [];
    const HARD_GLUTEN = new Set(["wheat","barley","rye","malt","spelt"]);
    const OAT_DERIVED = new Set(["oats","oat","oatmeal","oat flour","oat syrup","oat groats","oat bran"]);

    for (const [cat, kws] of Object.entries(ANTI_LIST)) {
      const hits = kws.filter(kw => matchKeyword(text, kw));
      if (!hits.length) continue;
      const flag = { category: cat, terms: hits };

      // ---- High-oleic nuance for sunflower/safflower/canola ----
      if (cat === "fried oils / seed oils") {
        const variants = ["sunflower oil","safflower oil","canola oil"];
        const variantHits = hits.filter(h => variants.includes(h));
        const otherHits = hits.filter(h => !variants.includes(h));
        if (variantHits.length && !otherHits.length) {
          const isHighOleic = /high oleic[^,.]*(sunflower|safflower|canola)/i.test(text);
          if (isHighOleic) {
            flag.nuance = "High-oleic variant detected — significantly more oxidation-stable than standard seed oil (>80% oleic acid, low omega-6). Wallach's broad rule still applies but severity is softened.";
            flag.softened = true;
          }
        }
      }

      // ---- Gluten-free oats nuance (oat-anchored declaration scoping) ----
      // Operational rule: if ANY oat ingredient in the label is declared "gluten-free"
      // (in either order — "gluten free oats" or "oats (gluten free)"), all oat-derivatives
      // in the product are presumed GF. A brand certifying one oat ingredient is operating
      // in a GF-aware supply chain across the rest. Hard gluten proteins (wheat / barley / rye /
      // malt / spelt) appearing elsewhere on the label STILL flag — no shutoff trick.
      if (cat === "gluten sources") {
        const hardHits = hits.filter(h => HARD_GLUTEN.has(h));
        const oatHits = hits.filter(h => OAT_DERIVED.has(h));

        // Pattern 1: "gluten free [oat term]" — GF declaration precedes oat ingredient
        const oatGfPre = /gluten[-\s]+free[^,]*\b(oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b/i;
        // Pattern 2: "[oat term] ... gluten free" — GF declaration trails oat ingredient in the same segment
        const oatGfPost = /\b(oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b[^,]*gluten[-\s]+free/i;
        const hasGFOatsAnchor = oatGfPre.test(text) || oatGfPost.test(text);

        if (hardHits.length > 0) {
          // Real gluten protein present — flag stays serious regardless of any GF claim
          flag.nuance = "Hard gluten proteins detected: " + hardHits.map(t => '"' + t + '"').join(", ") + ". Wallach-direct: wheat / barley / rye / malt / spelt are the actual gluten proteins. No softening — a gluten free oats declaration cannot shut off the trigger for actual gluten elsewhere on the label.";
        } else if (oatHits.length > 0) {
          if (hasGFOatsAnchor) {
            // At least one oat ingredient is declared GF — all oats in this product are presumed GF
            flag.nuance = "Oat-anchored gluten-free declaration detected on the label. Per the operational rule: once a brand certifies ANY oat ingredient as GF, they are operating in a GF-aware supply chain across all oat ingredients in that product. All oat hits (" + oatHits.map(t => '"' + t + '"').join(", ") + ") are presumed gluten-free. Flag softened.";
            flag.softened = true;
          } else {
            // No oat-specific GF declaration found
            flag.nuance = "Oat ingredients detected (" + oatHits.map(t => '"' + t + '"').join(", ") + ") with no gluten free oats declaration on the label. Standard commercial oats carry real cross-contamination risk from shared supply chains. A gluten-free claim attached to a non-oat ingredient (e.g., gluten-free pasta) does NOT certify the oats. Flag stays serious until brand certifies oat GF status.";
          }
        }
      }

      // ---- Determine severity per flag ----
      let severity = 'mild';
      for (const term of hits) {
        if (HARD_REJECT_TERMS.has(term)) { severity = 'hard'; break; }
      }
      if (severity !== 'hard') {
        if (SERIOUS_ANTI.includes(cat) && !flag.softened) severity = 'serious';
        else if (flag.softened) severity = 'softened';
      }
      flag.severity = severity;
      flags.push(flag);
    }
    return flags;
  }

  function containerFlag(label) {
    if (label.container === 'aluminum_can') {
      return [{ rule:'aluminum-tier-b', severity:'moderate', framing:'Tier-B aluminum exposure (practical-trade-off).' }];
    }
    return [];
  }

  function decideVerdict(alignment, gapFills, anti, conflicts, goals) {
    // Reasons are objects {label, items?} so the renderer can chip-style enumerable items (goals, gap-fills, anti-categories).
    // Single-fact reasons just have {label}. Renderer auto-detects via items presence.
    const reasonsFor = [], reasonsAgainst = [];
    if (alignment.score >= 1.5) reasonsFor.push({ label: `High form alignment (${alignment.score}/2.0, ${alignment.aligned}/${alignment.total} aligned)` });
    else if (alignment.score >= 0.5) reasonsFor.push({ label: `Moderate form alignment (${alignment.score}/2.0)` });
    if (alignment.misaligned > 0) reasonsAgainst.push({ label: `${alignment.misaligned} misaligned form${alignment.misaligned>1?'s':''} — non-Wallach-preferred` });

    const meaningful = gapFills.filter(g => g && g.gapFillPct >= 10);
    if (meaningful.length) {
      const top = [...meaningful].sort((a,b)=>b.gapFillPct-a.gapFillPct).slice(0,3);
      reasonsFor.push({ label: 'Meaningful gap-fill', items: top.map(g => `${g.essential} (+${g.gapFillPct}%)`) });
    } else if (gapFills.length) {
      reasonsAgainst.push({ label: 'No nutrient closes >10% of a current gap' });
    }
    if (goals.length) reasonsFor.push({
      label: 'Goal coverage',
      items: goals.slice(0, 4).map(g => (typeof GOAL_DISPLAY_NAMES !== 'undefined' && GOAL_DISPLAY_NAMES[g]) ? GOAL_DISPLAY_NAMES[g] : g)
    });

    // Tiered anti-flag handling — see ANTI_LIST_NOTES + HARD_REJECT_TERMS
    const hardHits = anti.filter(f => f.severity === 'hard');
    const seriousHits = anti.filter(f => f.severity === 'serious');
    const softHits = anti.filter(f => f.severity === 'softened' || f.severity === 'mild');
    if (hardHits.length) reasonsAgainst.push({ label: 'Hard-reject ingredients', items: hardHits.map(f => f.category) });
    if (seriousHits.length) reasonsAgainst.push({ label: 'Serious anti-list flags', items: seriousHits.map(f => f.category) });
    if (softHits.length) reasonsAgainst.push({ label: 'Mild / softened flags (nuance applied)', items: softHits.map(f => f.category) });
    const high = conflicts.filter(c => c.severity === 'high');
    if (high.length) reasonsAgainst.push({ label: 'High-severity conflicts', items: high.map(c => c.rule) });

    // Verdict logic — hard hits or 2+ serious hits trigger REJECT; otherwise SAVE/ADD ladder
    let verdict;
    if (high.length || hardHits.length || seriousHits.length >= 2) verdict = 'REJECT';
    else if (alignment.score >= 1.0 && meaningful.length && !seriousHits.length) verdict = 'ADD';
    else if (meaningful.length || alignment.score >= 0.5 || goals.length || seriousHits.length || softHits.length) verdict = 'SAVE';
    else verdict = 'REJECT';
    return { verdict, reasonsFor, reasonsAgainst };
  }

  function scan(label) {
    const alignment = alignmentScore(label.nutrients);
    const dailyServings = parseFloat(label.servings) || 1;
    const effectiveCov = getEffectiveCoverage();
    const gapFills = label.nutrients.map(n => gapFillFor(n, dailyServings, effectiveCov)).filter(Boolean);
    const goalMatches = matchGoalsRich(label, gapFills);
    const goals = goalMatches.map(g => g.goal);  // backward-compat string array — now reflects tightened set
    const anti = antiFlags(label);
    const conflicts = containerFlag(label);
    const { verdict, reasonsFor, reasonsAgainst } = decideVerdict(alignment, gapFills, anti, conflicts, goals);
    // Sparse-data flags surfaced in render + regimen confirm dialog
    const sparseNutrients = !label.nutrients || label.nutrients.length === 0;
    const sparseIngredients = !label.ingredients || label.ingredients.trim().length === 0;
    const result = { label, alignment, gapFills, goals, goalMatches, anti, conflicts, verdict, reasonsFor, reasonsAgainst, sparseNutrients, sparseIngredients };
    pushRecentScan(label, result);
    return result;
  }

  // ---- UI helpers ----
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  // ---- Drop zone ----


  // ---- Multi-image management (up to 3 slots) ----
  let lcImages = [];        // array of {id, dataUrl}
  let lcActiveId = null;
  const LC_MAX_IMAGES = 3;

  function addImageData(dataUrl) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    lcImages.push({ id, dataUrl });
    if (lcImages.length > LC_MAX_IMAGES) lcImages = lcImages.slice(-LC_MAX_IMAGES);
    lcActiveId = id;
    renderImages();
  }
  function removeImageById(id) {
    lcImages = lcImages.filter(im => im.id !== id);
    if (lcActiveId === id) lcActiveId = lcImages.length ? lcImages[lcImages.length - 1].id : null;
    renderImages();
  }
  function selectImage(id) { lcActiveId = id; renderImages(); }

  function renderImages() {
    const dz = $('lc-drop-zone');
    if (!dz) return;
    if (lcImages.length === 0) { dz.innerHTML = EMPTY_STATE_HTML; bindEmptyState(); renderStrip(); return; }
    const active = lcImages.find(im => im.id === lcActiveId) || lcImages[lcImages.length - 1];
    const slotsAvail = LC_MAX_IMAGES - lcImages.length;
    dz.innerHTML = '<img src="' + active.dataUrl + '" class="preview" alt="label">' +
      '<button type="button" class="clear-img" title="Remove this image">×</button>' +
      '<div class="ocr-overlay">' +
      '  <div class="ocr-action-row">' +
      '    <button type="button" class="ocr-btn" title="Auto-detect fields from ALL uploaded images">⚡ Auto-detect (all ' + lcImages.length + ')</button>' +
      (slotsAvail > 0 ? '    <button type="button" class="replace-btn" title="Upload another image (' + slotsAvail + ' slot' + (slotsAvail > 1 ? 's' : '') + ' left)">🔄 Add another</button>' : '') +
      '  </div>' +
      '  <div class="ocr-progress" hidden>' +
      '    <div class="ocr-progress-text">Loading…</div>' +
      '    <div class="ocr-progress-bar"><div class="ocr-progress-fill" style="width: 0%;"></div></div>' +
      '  </div>' +
      '</div>';
    dz.querySelector('.clear-img').addEventListener('click', ev => { ev.stopPropagation(); removeImageById(active.id); });
    dz.querySelector('.ocr-btn').addEventListener('click', ev => { ev.stopPropagation(); triggerOcr(); });
    const replaceBtn = dz.querySelector('.replace-btn');
    if (replaceBtn) {
      replaceBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = e => { if (e.target.files[0]) { const r = new FileReader(); r.onload = ev2 => addImageData(ev2.target.result); r.readAsDataURL(e.target.files[0]); } };
        input.click();
      });
    }
    renderStrip();
  }

  function renderStrip() {
    let strip = document.getElementById('lc-image-strip');
    if (!strip) return;
    if (lcImages.length <= 1) { strip.hidden = true; strip.innerHTML = ''; return; }
    strip.hidden = false;
    strip.innerHTML = lcImages.map((im, i) =>
      '<div class="lc-image-thumb' + (im.id === lcActiveId ? ' active' : '') + '" data-id="' + im.id + '" title="Image ' + (i+1) + ' — click to view, × to remove">' +
      '  <img src="' + im.dataUrl + '" alt="thumb">' +
      '  <button class="thumb-x" data-id="' + im.id + '" title="Remove">×</button>' +
      '</div>'
    ).join('');
    strip.querySelectorAll('.lc-image-thumb').forEach(t => {
      t.onclick = e => { if (e.target.classList.contains('thumb-x')) return; selectImage(parseInt(t.dataset.id)); };
    });
    strip.querySelectorAll('.thumb-x').forEach(b => {
      b.onclick = e => { e.stopPropagation(); removeImageById(parseInt(b.dataset.id)); };
    });
  }

  const EMPTY_STATE_HTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
      <p class="bold">Drop, paste, or upload a label image</p>
      <p class="hint">Up to 3 images supported (nutrition + ingredients + other). Click ⚡ Auto-detect to extract from all of them.</p>
      <input type="file" class="lc-file-input" accept="image/*" style="display:none">
      <span class="file-btn" data-role="upload-trigger">Choose file</span>
    </div>`;

  function bindEmptyState() {
    const dz = $('lc-drop-zone');
    const input = dz.querySelector('.lc-file-input');
    const trigger = dz.querySelector('[data-role="upload-trigger"]');
    if (input) input.addEventListener('change', e => { if (e.target.files[0]) { const r = new FileReader(); r.onload = ev => addImageData(ev.target.result); r.readAsDataURL(e.target.files[0]); } });
    if (trigger) trigger.addEventListener('click', e => { e.stopPropagation(); input && input.click(); });
  }

  function setupDropZone() {
    const dz = $('lc-drop-zone');
    function readImage(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = e => addImageData(e.target.result);
      r.readAsDataURL(file);
    }
    function resetDropZone() { lcImages = []; lcActiveId = null; renderImages(); }
    dz.addEventListener('click', e => {
      if (lcImages.length === 0) {
        const input = dz.querySelector('.lc-file-input');
        if (input) input.click();
      }
    });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('dragover');
      if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]);
    });
    bindEmptyState();
    document.addEventListener('paste', e => {
      const tab = $('tab-labels');
      if (!tab || !tab.classList.contains('active')) return;
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      const items = e.clipboardData ? e.clipboardData.items : [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          const file = items[i].getAsFile();
          if (file) { readImage(file); e.preventDefault(); break; }
        }
      }
    });
    setupDropZone.reset = resetDropZone;
  }

  // ---- Nutrient rows ----
  function addNutrientRow(name='', amount='', unit='mg', form='', alignment='unknown') {
    const tbody = $('lc-nutrient-rows');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="n-name" placeholder="e.g., Magnesium" value="${escapeHtml(name)}"></td>
      <td><input type="number" class="n-amount" step="any" value="${escapeHtml(amount)}"></td>
      <td><select class="n-unit">
        <option value="mg" ${unit==='mg'?'selected':''}>mg</option>
        <option value="mcg" ${unit==='mcg'?'selected':''}>mcg</option>
        <option value="g" ${unit==='g'?'selected':''}>g</option>
        <option value="iu" ${unit==='iu'?'selected':''}>IU</option>
      </select></td>
      <td><div style="display:flex;gap:6px;">
        <input type="text" class="n-form" placeholder="e.g., glycinate" value="${escapeHtml(form)}" style="flex:1;">
        <select class="n-alignment" style="width:auto;">
          <option value="unknown" ${alignment==='unknown'?'selected':''}>—</option>
          <option value="aligned" ${alignment==='aligned'?'selected':''}>✓ aligned</option>
          <option value="partial" ${alignment==='partial'?'selected':''}>◐ partial</option>
          <option value="misaligned" ${alignment==='misaligned'?'selected':''}>⚠ misaligned</option>
        </select>
      </div></td>
      <td class="actions-col"><button type="button" class="remove-row" title="Remove">×</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('.remove-row').addEventListener('click', () => tr.remove());
  }

  function gatherLabel() {
    const nutrients = [];
    document.querySelectorAll('#lc-nutrient-rows tr').forEach(tr => {
      const name = tr.querySelector('.n-name').value.trim();
      const amount = parseFloat(tr.querySelector('.n-amount').value);
      const unit = tr.querySelector('.n-unit').value;
      const form = tr.querySelector('.n-form').value.trim();
      const alignment = tr.querySelector('.n-alignment').value;
      if (name && !isNaN(amount)) nutrients.push({ name, amount, unit, form, form_alignment: alignment });
    });
    return {
      name: $('lc-name').value.trim(),
      brand: $('lc-brand').value.trim(),
      category: $('lc-category').value.trim(),
      container: $('lc-container').value,
      servings: parseFloat($('lc-servings').value) || 1,
      ingredients: $('lc-ingredients').value.trim(),
      nutrients
    };
  }

  function clearForm() {
    ['lc-name','lc-brand','lc-category','lc-ingredients','lc-user-notes'].forEach(id => {
      const el = $(id);
      if (el) { el.value = ''; el.classList.remove('autodetect'); }
    });
    $('lc-container').value = '';
    $('lc-container').classList.remove('autodetect');
    $('lc-servings').value = '1';
    $('lc-nutrient-rows').innerHTML = '';
    addNutrientRow();
    $('lc-result-panel').hidden = true;
    // Clear helper panel (suggestions, dismissed words, image reference)
    dismissedSuspects.clear();
    const sp = $('lc-suggestions-panel'); if (sp) { sp.hidden = true; sp.innerHTML = ''; }
    const ref = $('lc-image-reference'); if (ref) { ref.hidden = true; }
    const help = $('lc-ingredients-helper'); if (help) { help.hidden = true; }
    if (setupDropZone.reset) setupDropZone.reset();
  }

  // ---- Result render ----
  function renderResult(result) {
    const panel = $('lc-result-panel');
    panel.hidden = false;
    const banner = $('lc-verdict-banner');
    banner.className = 'verdict-banner ' + result.verdict;
    $('lc-verdict-icon').textContent = result.verdict==='ADD' ? '✓' : result.verdict==='REJECT' ? '✕' : '◐';
    $('lc-verdict-text').textContent = result.verdict==='SAVE' ? 'SAVE FOR LATER' : result.verdict;

    // Sparse-data banners — surfaced visibly but don't block the scan
    const banners = [];
    if (result.sparseNutrients && result.sparseIngredients) {
      banners.push('<div class="lc-sparse-banner sev-warn"><strong>Heads-up:</strong> No nutrients and no ingredients were entered. Verdict is based on name / category / container only. Useful for a quick goal-match check but won\'t affect gap-fill math.</div>');
    } else if (result.sparseNutrients) {
      banners.push('<div class="lc-sparse-banner sev-warn"><strong>⚠ No nutrients listed</strong> — verdict computed from ingredients + goal-matching only. Per Wallach: most modern food is nutrient-stripped anyway and supplementation is necessary — but if this is meant to contribute to your 90-essentials coverage, add the nutrient panel so gap-fill math reflects it. Saving or adding to regimen without nutrients means future gap-fill calcs won\'t include it.</div>');
    } else if (result.sparseIngredients) {
      banners.push('<div class="lc-sparse-banner sev-info"><strong>No ingredients text</strong> — anti-list scan skipped (assumes pure-supplement context). Verdict computed from nutrients + goals. Add ingredients text if there are other components to evaluate.</div>');
    }
    const bannersHost = document.getElementById('lc-sparse-banners');
    if (bannersHost) bannersHost.innerHTML = banners.join('');

    // Rich reasons rendering — each reason is {label, items?}. Items become colored pill chips (green in For,
    // red in Against). Legacy string-only reasons (from stored wishlist entries) still render correctly via normalization.
    const normalizeReason = r => (typeof r === 'string') ? { label: r } : { label: r.label || '', items: r.items || null };
    // All reasons render as chips inline with the ✓/✕ icon. If the reason has explicit items
    // (e.g. Goal coverage → ['Joints / collagen', 'Hydration / electrolyte']), each item becomes a chip.
    // Otherwise the reason's label text becomes a single chip. The legacy "Goal coverage" / "Form alignment"
    // label headers are dropped — the chip itself IS the message, easier to scan visually.
    const renderReasons = (ul, arr) => {
      if (!arr || !arr.length) { ul.innerHTML = '<li class="empty">(none)</li>'; return; }
      ul.innerHTML = arr.map(raw => {
        const r = normalizeReason(raw);
        const chipTexts = (r.items && r.items.length) ? r.items : [r.label];
        const chips = chipTexts.map(it => `<span class="reason-chip">${escapeHtml(it)}</span>`).join('');
        return `<li class="rich-reason"><span class="reason-chips">${chips}</span></li>`;
      }).join('');
    };
    renderReasons($('lc-reasons-for'), result.reasonsFor);
    renderReasons($('lc-reasons-against'), result.reasonsAgainst);

    const pct = Math.max(0, Math.min(2, result.alignment.score)) / 2 * 100;
    $('lc-align-fill').style.width = pct + '%';
    $('lc-align-score').textContent = result.alignment.score;
    // Inline goals summary — friendly names, comma-separated
    $('lc-goals-matched').textContent = result.goals.length
      ? result.goals.map(g => GOAL_DISPLAY_NAMES[g] || g).join(', ')
      : 'none';

    // Goal evidence panel — only meaningful matches surface (strong keyword OR nutrient ≥10% of Wallach target).
    // Trace ingredient keywords (e.g., sunflower lecithin in granola) and trivial nutrient amounts (1-8% of target)
    // do NOT trigger cards. Empty state shown when no meaningful goal contribution exists — that's the honest signal.
    const evidenceHost = $('lc-goal-evidence');
    if (evidenceHost) {
      if (!result.goalMatches || !result.goalMatches.length) {
        evidenceHost.innerHTML = '<div class="goal-empty">No nutrient delivers ≥10% of a Wallach daily target per serving, and the product name doesn\'t flag a goal-oriented purpose. This product isn\'t meaningfully contributing to any tracked goal in practical terms.</div>';
      } else {
        evidenceHost.innerHTML = result.goalMatches.map(m => {
          const friendlyName = GOAL_DISPLAY_NAMES[m.goal] || m.goal;
          let trigBar = '<div class="goal-triggers">';
          // Strong keywords (italic — from label text)
          for (const kw of (m.strongKws || [])) {
            trigBar += `<span class="trigger-chip kw">${escapeHtml(kw)}</span>`;
          }
          // Nutrient chips with % of Wallach target (when known)
          for (const n of (m.nutrientMatches || [])) {
            const pctText = (n.pctOfTarget != null) ? ` +${n.pctOfTarget}%` : '';
            trigBar += `<span class="trigger-chip pct">${escapeHtml(n.nutrient)}${pctText}</span>`;
          }
          trigBar += '</div>';
          // Why-list — Wallach snippet per contributing nutrient
          let whyList = '';
          if (m.nutrientMatches && m.nutrientMatches.length) {
            whyList = '<div class="nut-why-list">' + m.nutrientMatches.map(n =>
              `<div class="nut-why"><strong>${escapeHtml(n.nutrient)} —</strong><span class="why-text">${escapeHtml(n.why)}</span></div>`
            ).join('') + '</div>';
          }
          return `<div class="goal-row">
            <div class="goal-name">${escapeHtml(friendlyName)}</div>
            ${trigBar}
            ${whyList}
          </div>`;
        }).join('');
      }
    }

    const sorted = [...result.gapFills].sort((a,b) => (b.gapFillPct||0) - (a.gapFillPct||0));
    const gfWrap = $('lc-gap-fill-wrap');
    if (sorted.length) {
      let html = '<table class="gap-fill-table"><thead><tr><th>Essential</th><th>Your current</th><th>This adds</th><th>Wallach target</th><th>Gap-fill</th></tr></thead><tbody>';
      for (const g of sorted) {
        const pctClass = g.gapFillPct > 0 ? 'pct-positive' : 'pct-zero';
        const pctText = g.gapFillPct > 0 ? `+${g.gapFillPct}%` : (g.gapFillPct === 0 ? 'at target' : '—');
        html += `<tr><td>${escapeHtml(g.essential)}</td><td>${escapeHtml(g.currentDisplay)}</td><td>${escapeHtml(g.addedDisplay)}</td><td>${escapeHtml(g.target)}</td><td class="${pctClass}">${pctText}</td></tr>`;
      }
      html += '</tbody></table>';
      gfWrap.innerHTML = html;
    } else {
      gfWrap.innerHTML = '<p style="color:var(--ink-mute);font-style:italic;font-size:13px;">No 90-essential nutrients matched on this label.</p>';
    }

    const af = $('lc-anti-flags');
    if (result.anti.length) {
      af.innerHTML = result.anti.map(f => {
        const note = ANTI_LIST_NOTES[f.category] || '';
        const termsHtml = f.terms && f.terms.length
          ? `<div class="af-terms"><span class="af-terms-label">Matched in your ingredients:</span> <em>"${f.terms.map(escapeHtml).join('", "')}"</em></div>` : '';
        const nuanceHtml = f.nuance
          ? `<div class="af-nuance"><strong>Nuance:</strong> ${escapeHtml(f.nuance)}</div>` : '';
        const noteHtml = note
          ? `<div class="af-note"><strong>Framework:</strong> ${escapeHtml(note)}</div>` : '';
        const sevClass = f.severity || 'mild';
        return `<div class="anti-flag-card sev-${sevClass}">
          <div class="af-header">
            <span class="af-pill">${escapeHtml(f.category)}</span>
            <span class="af-severity">${escapeHtml(sevClass.toUpperCase())}</span>
          </div>
          ${termsHtml}
          ${nuanceHtml}
          ${noteHtml}
        </div>`;
      }).join('');
    } else {
      af.innerHTML = '<span class="anti-flags-empty">No anti-list ingredients flagged.</span>';
    }

    // Edit-mode discipline: when the user arrived at Label Check via Regimen "Full edit", the result-panel's
    // Save-to-wishlist and Add-to-regimen buttons are irrelevant — using them creates duplicate-loop traps
    // (e.g., scanning your own already-in-regimen item and clicking Save-to-wishlist adds a dupe wishlist
    // entry; clearForm then silently exits edit mode without committing the actual edit). Banner's Save
    // changes / Cancel are the only valid commit paths in edit mode.
    const inEditMode = (typeof lcGetEditTargetId === 'function') && !!lcGetEditTargetId();
    const saveBtn = $('lc-save-btn');
    const regBtn = $('lc-regimen-btn');
    const userNotesEl = $('lc-user-notes');
    let editNote = document.getElementById('lc-result-edit-note');

    if (inEditMode) {
      // Hide the wishlist/regimen commit paths + notes textarea
      if (saveBtn) saveBtn.style.display = 'none';
      if (regBtn) regBtn.style.display = 'none';
      if (userNotesEl) userNotesEl.style.display = 'none';
      // Show an explanatory note in their place
      if (!editNote) {
        editNote = document.createElement('div');
        editNote.id = 'lc-result-edit-note';
        editNote.className = 'lc-result-edit-note';
        editNote.innerHTML = '✎ You\'re editing an existing regimen item. Use <strong>Save changes</strong> in the orange banner above to commit your edits, or <strong>Cancel</strong> to discard.';
        const actions = document.querySelector('.result-actions');
        if (actions) actions.appendChild(editNote);
      }
      editNote.style.display = '';
    } else {
      // Normal scan mode — restore visibility and wire dedup-aware buttons
      if (saveBtn) saveBtn.style.display = '';
      if (regBtn) regBtn.style.display = '';
      if (userNotesEl) userNotesEl.style.display = '';
      if (editNote) editNote.style.display = 'none';

      // DEDUP: if this product is already in the regimen (e.g., user restored a scan of an item
      // they've already committed), hide both Save-for-later and Add-to-regimen — treat as existing.
      // Show an "Already in regimen" badge in their place so it's clear, and prevent accidental dupes.
      const alreadyInRegimen = inRegimen(result.label.name);
      if (alreadyInRegimen) {
        if (saveBtn) saveBtn.style.display = 'none';
        if (regBtn) regBtn.style.display = 'none';
        if (userNotesEl) userNotesEl.style.display = 'none';
        let regNote = document.getElementById('lc-result-regimen-note');
        if (!regNote) {
          regNote = document.createElement('div');
          regNote.id = 'lc-result-regimen-note';
          regNote.className = 'lc-result-edit-note';
          regNote.innerHTML = '✓ This item is already in your <strong>regimen</strong> — switch to the Regimen tab to edit or remove it.';
          const actions = document.querySelector('.result-actions');
          if (actions) actions.appendChild(regNote);
        } else {
          regNote.style.display = '';
        }
        return;
      } else {
        const regNote = document.getElementById('lc-result-regimen-note');
        if (regNote) regNote.style.display = 'none';
      }

      // Save button — preview-mode label: "Update saved item" when name already in wishlist, else "Save for later"
      // (Internal storage still called "wishlist" — user-facing label is "Save for later" / saved items.)
      const alreadyInWishlist = isInWishlist(result.label.name);
      const baseLabel = alreadyInWishlist ? 'Update saved item' : 'Save for later';
      saveBtn.textContent = baseLabel;
      saveBtn.onclick = () => {
        const wasUpdate = saveToWishlist(result, userNotesEl.value.trim());
        saveBtn.textContent = wasUpdate ? '✓ Updated' : '✓ Saved';
        setTimeout(() => {
          saveBtn.textContent = baseLabel;
          clearForm();
        }, 1500);
      };

      // Add to regimen — already dedup-aware ("✓ In regimen" when present). Just wire the click handler.
      if (regBtn) {
        const already = inRegimen(result.label.name);
        regBtn.textContent = already ? '✓ In regimen' : '+ Add to regimen';
        regBtn.className = 'lc-btn lc-btn-regimen' + (already ? ' committed' : '');
        regBtn.onclick = async () => {
          if (inRegimen(result.label.name)) return;
          if (result.sparseNutrients) {
            const ok = await showLcModal({
              title: 'Warning', titleSev: 'warn', icon: '⚠',
              body: 'No nutrient info added for this item. Tracking will be inaccurate until nutrient info clarified.',
              checkboxText: 'Confirm item has no nutrients',
              confirmText: 'Add Anyway', confirmTextConfirmed: 'Add Item', cancelText: 'Go Back'
            });
            if (!ok) return;
          }
          addToRegimen(result.label);
          regBtn.textContent = '✓ In regimen';
          regBtn.className = 'lc-btn lc-btn-regimen committed';
          setTimeout(() => { clearForm(); }, 1500);
        };
      }
    }
  }

  // ---- Wishlist (localStorage) ----
  const WISHLIST_KEY = 'lcWishlist_v1';
  const RECENT_KEY = 'lcRecentScans_v1';
  const REGIMEN_KEY = 'lcRegimen_v1';
  const MAX_RECENT = 5;
  function loadWishlist() {
    try { const raw = localStorage.getItem(WISHLIST_KEY); if (raw) return JSON.parse(raw); } catch(e){}
    return { items: [] };
  }
  function persistWishlist(w) { try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(w)); } catch(e){} }
  // Save to wishlist with name-based dedup. If an entry with the same name already exists, update it
  // in place (preserving the original id + addedDate, stamping updatedDate). Returns true if updated, false if new.
  // Matches the dedup-by-name discipline already used by addToRegimen — prevents accidental duplicates from
  // re-scans, edit-mode misclicks, and similar loops.
  function saveToWishlist(result, userNotes) {
    const w = loadWishlist();
    const nameKey = (result.label.name || '').toLowerCase().trim();
    const existingIdx = nameKey ? w.items.findIndex(i => (i.name || '').toLowerCase().trim() === nameKey) : -1;
    const today = new Date().toISOString().slice(0, 10);
    const entry = {
      id: existingIdx >= 0 ? w.items[existingIdx].id : (Date.now() + Math.floor(Math.random() * 1000)),
      name: result.label.name,
      brand: result.label.brand,
      category: result.label.category,
      verdict: result.verdict,
      addedDate: existingIdx >= 0 ? (w.items[existingIdx].addedDate || today) : today,
      topGapFills: [...result.gapFills].filter(g => g.gapFillPct > 0).sort((a, b) => b.gapFillPct - a.gapFillPct).slice(0, 5),
      userNotes,
      reasonsFor: result.reasonsFor,
      reasonsAgainst: result.reasonsAgainst,
      goals: result.goals,
      alignment: result.alignment,
      label_data: result.label
    };
    if (existingIdx >= 0) {
      entry.updatedDate = today;
      w.items[existingIdx] = entry;
    } else {
      w.items.unshift(entry);
    }
    persistWishlist(w);
    renderWishlist();
    return existingIdx >= 0;  // true = updated, false = new
  }
  function isInWishlist(name) {
    const w = loadWishlist();
    const k = (name || '').toLowerCase().trim();
    if (!k) return false;
    return w.items.some(i => (i.name || '').toLowerCase().trim() === k);
  }
  function removeFromWishlist(id) {
    const w = loadWishlist();
    w.items = w.items.filter(i => String(i.id) !== String(id));
    persistWishlist(w);
    renderWishlist();
  }
  function renderWishlist() {
    const c = $('lc-wishlist-container');
    const w = loadWishlist();
    if (!w.items.length) { c.innerHTML = '<div class="wishlist-empty">Wishlist is empty. Run a scan above to start populating.</div>'; return; }
    const cards = w.items.map(i => {
      const vLabel = i.verdict === 'SAVE' ? 'SAVE FOR LATER' : i.verdict;
      const noteHtml = i.userNotes ? `<div class="user-note">${escapeHtml(i.userNotes)}</div>` : '';
      const gapHtml = i.topGapFills && i.topGapFills.length
        ? '<div class="gap-fills-row">' + i.topGapFills.map(g => `<span class="gap-fill-tag">${escapeHtml(g.essential)} +${g.gapFillPct}%</span>`).join('') + '</div>' : '';
      const brand = i.brand ? `${escapeHtml(i.brand)} · ` : '';
      const inReg = inRegimen(i.name);
      const regAction = i.verdict === 'REJECT' ? '' : (inReg
        ? `<span class="in-regimen-badge">✓ In regimen</span><button class="regimen-remove" data-name="${escapeHtml(i.name)}">Remove from regimen</button>`
        : `<button class="regimen-btn" data-id="${i.id}">+ Add to regimen</button>`);
      return `<div class="wish-card">
        <button class="delete-btn" data-id="${i.id}" title="Remove">×</button>
        <div class="verdict-pill ${i.verdict}">${vLabel}</div>
        <h3 class="product-name">${escapeHtml(i.name)}</h3>
        <p class="meta">${brand}${escapeHtml(i.category || 'uncategorized')} · saved ${escapeHtml(i.addedDate)}</p>
        ${noteHtml}
        ${gapHtml}
        ${regAction ? `<div class="card-actions">${regAction}</div>` : ''}
      </div>`;
    }).join('');
    c.innerHTML = '<div class="wishlist-grid">' + cards + '</div>';
    c.querySelectorAll('.delete-btn').forEach(b => {
      b.onclick = async () => {
        const ok = await showLcModal({
          title: 'Remove from wishlist?', titleSev: 'crit', icon: '✕',
          body: 'This deletes the saved scan, notes, and gap-fill snapshot. The product won\'t appear in your wishlist anymore.',
          confirmText: 'Remove', cancelText: 'Go Back', confirmDanger: true
        });
        if (ok) removeFromWishlist(b.dataset.id);
      };
    });
    c.querySelectorAll('.regimen-btn').forEach(b => {
      b.onclick = async () => {
        const wid = b.dataset.id;
        const w = loadWishlist();
        const item = w.items.find(it => String(it.id) === String(wid));
        if (!item) return;
        const labelData = item.label_data || { name: item.name, brand: item.brand, category: item.category, servings: 1, nutrients: [] };
        const sparseNut = !labelData.nutrients || labelData.nutrients.length === 0;
        if (sparseNut) {
          const ok = await showLcModal({
            title: 'Warning', titleSev: 'warn', icon: '⚠',
            body: 'No nutrient info added for this item. Tracking will be inaccurate until nutrient info clarified.',
            checkboxText: 'Confirm item has no nutrients',
            confirmText: 'Add Anyway', confirmTextConfirmed: 'Add Item', cancelText: 'Go Back'
          });
          if (!ok) return;
        }
        addToRegimen(labelData, wid);
        // Adding to regimen — even from a wishlist card — is a terminal action; clear any in-flight scan form so context resets cleanly.
        // Brief delay so the wishlist re-render (✓ In regimen badge) is visible before the form clears.
        setTimeout(() => { clearForm(); }, 1500);
      };
    });
    c.querySelectorAll('.regimen-remove').forEach(b => {
      b.onclick = async () => {
        const ok = await showLcModal({
          title: 'Remove from regimen?', titleSev: 'warn', icon: '◐',
          body: 'Future scans won\'t factor this product into your effective coverage. The item stays in your wishlist.',
          confirmText: 'Remove', cancelText: 'Go Back', confirmDanger: true
        });
        if (ok) removeFromRegimen(b.dataset.name);
      };
    });
  }

  // ---- Editing helper: detect suspect words + show click-to-fix suggestions ----
  const dismissedSuspects = new Set();

  function findIngredientSuspects(text) {
    if (!text || text.length < 10) return [];
    const wordMatches = [...text.matchAll(/\b[A-Za-z]{3,}\b/g)];
    const suspects = [];
    const seen = new Set();
    for (const m of wordMatches) {
      const word = m[0];
      const lower = word.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      if (dismissedSuspects.has(lower)) continue;
      if (OCR_DICT_SET.has(lower)) continue;  // exact match — definitely correct
      const candidates = findSuggestionCandidates(lower);
      if (candidates.length > 0) suspects.push({ word, candidates });
      if (suspects.length >= 12) break;  // cap
    }
    return suspects;
  }

function findSuggestionCandidates(lowerWord) {
    const candidates = [];
    const lowerSet = new Set(lowerWord);
    const firstChar = lowerWord[0];
    for (const cand of OCR_DICT_SET) {
      if (cand.length < 3) continue;
      const lengthDiff = Math.abs(cand.length - lowerWord.length);
      if (lengthDiff > 5) continue;
      const dist = levenshtein(lowerWord, cand);
      const candSet = new Set(cand);
      let common = 0;
      lowerSet.forEach(c => { if (candSet.has(c)) common++; });
      const jaccard = common / new Set([...lowerSet, ...candSet]).size;
      const firstMatch = cand[0] === firstChar;
      // Suffix-match path: for OCR that ate the prefix (REDIENTS → INGREDIENTS)
      const suffixLen = Math.min(5, lowerWord.length);
      const suffixMatch = cand.length > lowerWord.length && lowerWord.length >= 4 &&
                          cand.endsWith(lowerWord.slice(-suffixLen));
      let score = Infinity;
      // Path 1: first-letter match + tight Levenshtein
      if (firstMatch) {
        const maxLev = lowerWord.length <= 4 ? 2 : (lowerWord.length <= 7 ? 3 : 4);
        if (dist <= maxLev) score = dist;
        // Path 2: first-letter match + decent overlap (catches topineg → tapioca)
        if (jaccard >= 0.4 && lengthDiff <= 2) score = Math.min(score, 4 - jaccard * 4);
      }
      // Path 3: suffix match for prefix-eaten words (REDIENTS → INGREDIENTS)
      if (suffixMatch && (cand.length - lowerWord.length) <= 5) score = Math.min(score, 5);
      // Path 4: prefix match — dict word starts with the OCR word (Orga → Organic, Buckw → Buckwheat)
      if (cand.startsWith(lowerWord) && cand.length > lowerWord.length && cand.length - lowerWord.length <= 5 && lowerWord.length >= 3) {
        score = Math.min(score, 1);
      }
      if (score < Infinity) candidates.push({ word: cand, score });
    }
    candidates.sort((a, b) => a.score - b.score);
    const seen = new Set();
    const out = [];
    for (const c of candidates) {
      if (seen.has(c.word)) continue;
      seen.add(c.word);
      out.push(c);
      if (out.length >= 4) break;
    }
    return out;
  }

  function renderHelperPanel() {
    const panel = $('lc-suggestions-panel');
    const helper = $('lc-ingredients-helper');
    const ref = $('lc-image-reference');
    if (!panel || !helper) return;
    const ingValue = $('lc-ingredients').value;
    // Image reference: show when there's an active image (from OCR or upload)
    if (lcImages && lcImages.length) {
      const active = lcImages.find(im => im.id === lcActiveId) || lcImages[lcImages.length - 1];
      $('lc-image-ref-img').src = active.dataUrl;
      ref.hidden = false;
    } else {
      ref.hidden = true;
    }
    // Suspect detection only after content present
    if (!ingValue || ingValue.length < 10) {
      panel.hidden = true;
      helper.hidden = ref.hidden;  // helper hides only if both empty
      return;
    }
    const suspects = findIngredientSuspects(ingValue);
    if (suspects.length === 0) {
      panel.hidden = true;
      helper.hidden = ref.hidden;
      return;
    }
    panel.hidden = false;
    helper.hidden = false;
    panel.innerHTML = '<div class="lc-suggestions-header">Possible OCR errors <span class="count">' + suspects.length + '</span><span class="hint">Click a suggestion to fix, or × to dismiss</span></div>' +
      suspects.map(s => `
        <div class="lc-suggestion-card">
          <span class="target">${escapeHtml(s.word)}</span>
          <span class="arrow">→</span>
          <span class="suggestions">
            ${s.candidates.map(c => `<button class="sug-btn" data-from="${escapeHtml(s.word)}" data-to="${escapeHtml(c.word)}">${escapeHtml(c.word)}</button>`).join('')}
          </span>
          <button class="dismiss-btn" data-word="${escapeHtml(s.word)}" title="Keep as-is (this is correct)">×</button>
        </div>
      `).join('');
    panel.querySelectorAll('.sug-btn').forEach(b => {
      b.onclick = () => replaceWordInIngredients(b.dataset.from, b.dataset.to);
    });
    panel.querySelectorAll('.dismiss-btn').forEach(b => {
      b.onclick = () => { dismissedSuspects.add(b.dataset.word.toLowerCase()); renderHelperPanel(); };
    });
    // Hover-to-highlight: hovering a card selects the target word in the textarea so user can see it in context
    panel.querySelectorAll('.lc-suggestion-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const target = card.querySelector('.target').textContent;
        const field = $('lc-ingredients');
        const idx = field.value.toLowerCase().indexOf(target.toLowerCase());
        if (idx !== -1) {
          field.focus();
          field.setSelectionRange(idx, idx + target.length);
          // Scroll the textarea so the selection is visible
          const lineHeight = parseInt(getComputedStyle(field).lineHeight) || 18;
          const linesBefore = (field.value.slice(0, idx).match(/\n/g) || []).length;
          field.scrollTop = Math.max(0, linesBefore * lineHeight - field.clientHeight / 2);
        }
      });
    });
  }

  function replaceWordInIngredients(fromWord, toWord) {
    const field = $('lc-ingredients');
    const escaped = fromWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'i');
    const newVal = field.value.replace(re, (match) => {
      if (match === match.toUpperCase()) return toWord.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return toWord[0].toUpperCase() + toWord.slice(1);
      return toWord;
    });
    field.value = newVal;
    renderHelperPanel();
  }

    // ---- Seed wishlist from CLI run if browser-wishlist is empty ----
  // ---- Recent scans (last 5, transient testing memory) ----
  function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || { items: [] }; } catch(e) { return { items: [] }; } }
  function pushRecentScan(label, result) {
    const r = loadRecent();
    r.items = r.items.filter(i => i.label.name !== label.name); // dedup by name
    r.items.unshift({
      id: Date.now() + Math.floor(Math.random()*1000),
      ts: new Date().toISOString(),
      label,
      verdict: result.verdict,
      alignment: result.alignment,
      goals: result.goals,
      gapFills: result.gapFills
    });
    if (r.items.length > MAX_RECENT) r.items = r.items.slice(0, MAX_RECENT);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch(e) {}
    renderRecent();
  }
  function restoreRecent(id) {
    const r = loadRecent();
    const item = r.items.find(i => String(i.id) === String(id));
    if (!item) return;
    // Dedup: if this product is already in the UNIFIED regimen (base data, scanned-and-added,
    // or manual), populate via lcPopulateFormFromItem — same path as Full Edit uses.
    // This handles base-data items (nutrients flat on item), label-scanned items (nutrients
    // under .label), AND overrides + _lc_label stash correctly. The previous loadRegimen()
    // path only checked the localStorage label-scanned items, missing base-data items entirely
    // and leaving the form blank.
    if (typeof getUnifiedRegimenItems === 'function' && typeof lcPopulateFormFromItem === 'function') {
      try {
        const unified = getUnifiedRegimenItems();
        const regItem = unified.find(u => u.name === item.label.name && !u._removed);
        if (regItem) {
          lcPopulateFormFromItem(regItem);
          setTimeout(() => $('lc-scan-btn').click(), 50);
          return;
        }
      } catch(e) { /* fall through to original behavior */ }
    }
    // Fall-through: original behavior for items not in regimen — use the scan snapshot
    $('lc-name').value = item.label.name || '';
    $('lc-brand').value = item.label.brand || '';
    $('lc-category').value = item.label.category || '';
    $('lc-container').value = item.label.container || '';
    $('lc-servings').value = item.label.servings || 1;
    $('lc-ingredients').value = item.label.ingredients || '';
    $('lc-nutrient-rows').innerHTML = '';
    for (const n of (item.label.nutrients || [])) addNutrientRow(n.name, n.amount, n.unit, n.form, n.form_alignment);
    if (!(item.label.nutrients || []).length) addNutrientRow();
    setTimeout(() => $('lc-scan-btn').click(), 50);
  }
  function renderRecent() {
    const c = $('lc-recent-scans');
    if (!c) return;
    const r = loadRecent();
    if (!r.items.length) { c.innerHTML = '<div class="recent-scans-empty">No recent scans yet. Each scan is logged here automatically — up to ' + MAX_RECENT + '.</div>'; return; }
    c.innerHTML = '<div class="recent-scans-list">' + r.items.map(i => {
      const vLabel = i.verdict === 'SAVE' ? 'SAVE' : i.verdict;
      const tsShort = new Date(i.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div class="recent-scan-row">
        <span class="verdict-mini ${i.verdict}">${vLabel}</span>
        <span class="name">${escapeHtml(i.label.name)}</span>
        <span class="ts">${tsShort}</span>
        <span class="actions">
          <button data-action="restore" data-id="${i.id}">Restore + re-scan</button>
        </span>
      </div>`;
    }).join('') + '</div>';
    c.querySelectorAll('button[data-action="restore"]').forEach(b => {
      b.onclick = () => restoreRecent(b.dataset.id);
    });
  }

  // ---- Regimen (committed daily intake additions) ----
  function loadRegimen() { try { return JSON.parse(localStorage.getItem(REGIMEN_KEY)) || { items: [] }; } catch(e) { return { items: [] }; } }
  function persistRegimen(r) { try { localStorage.setItem(REGIMEN_KEY, JSON.stringify(r)); } catch(e) {} }
  function addToRegimen(label, sourceWishlistId) {
    const r = loadRegimen();
    if (r.items.find(i => i.label && i.label.name === label.name)) return; // dedup
    r.items.unshift({ id: Date.now() + Math.floor(Math.random()*1000), label, addedDate: new Date().toISOString().slice(0,10) });
    persistRegimen(r);
    renderWishlist();
  }
  function removeFromRegimen(name) {
    const r = loadRegimen();
    r.items = r.items.filter(i => !(i.label && i.label.name === name));
    persistRegimen(r);
    renderWishlist();
  }
  function inRegimen(name) {
    return loadRegimen().items.some(i => i.label && i.label.name === name);
  }

  // ---- OCR (Tesseract.js, lazy-loaded from CDN on first use) ----
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load OCR engine from CDN. Check internet connection or use manual entry.'));
      document.head.appendChild(script);
    });
  }
  // Image preprocessing — upscale + grayscale + contrast boost makes Tesseract dramatically more accurate
  async function preprocessImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Upscale: target ~2000px on long side for clean OCR
          const target = 2000;
          const scale = Math.max(1, Math.min(3, target / Math.max(img.naturalWidth, img.naturalHeight)));
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Grayscale + contrast boost + soft thresholding
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
            // Gentler contrast — let Tesseract see actual grayscale nuance, not crushed black/white
            let v = (gray - 128) * 1.25 + 128;
            v = Math.max(0, Math.min(255, v));
            d[i] = d[i+1] = d[i+2] = v;
          }
          ctx.putImageData(id, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
      img.src = dataUrl;
    });
  }

  async function runOcr(imageData, progressCallback) {
    progressCallback('Preprocessing image...', 0);
    let processed;
    try { processed = await preprocessImage(imageData); } catch (e) { processed = imageData; }
    progressCallback('Warming up high-accuracy OCR...', 0.05);
    await loadTesseract();
    progressCallback('Starting recognition...', 0.1);
    const worker = await Tesseract.createWorker('eng', 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
      logger: m => {
        if (m.status === 'recognizing text') progressCallback('Reading text carefully...', 0.1 + m.progress * 0.9);
        else if (m.status === 'loading language traineddata') progressCallback('Downloading high-accuracy model (one-time, ~50MB)...', m.progress || 0);
        else if (m.status && m.status.length < 40) progressCallback(m.status, m.progress || 0);
      }
    });
    // PSM 6 = single uniform block of text — works better than default auto for ingredient lists & nutrition panels
    try { await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' }); } catch(e) {}
    const result = await worker.recognize(processed);
    await worker.terminate();
    return result.data.text;
  }
const OCR_FUZZY_DICT = [
    'organic','regenerative','certified','gluten','free','non-gmo','natural','flavor','flavors','color','colors','ingredients','nutrition','facts','contains',
    // Common ingredient-list connective words — flagging these as suspects produces noise. They're not food terms but they appear constantly.
    'and','or','for','with','less','than','may','contain','trace','amount','total','per','serving','daily','value','from','of','a','as','in','to','the','an',
    // Common food noun fragments that appear standalone
    'root','leaf','leaves','seeds','seed','nuts','nut','bean','beans','peel','rind','pulp','juice','meal','flour','grain','grains','flake','flakes','meal','base',
    'oats','oat','oatmeal','rolled','steel','cut','syrup','solids','groats','bran',
    // Fiber / texture / common nutrient-adjacent food words (added 2026-06-13 from press-test false-positive surface)
    'fiber','fibre','soluble','insoluble','dietary','prebiotic','probiotic','probiotics','peptide','peptides','isolate','isolates','hydrolyzed','collagen','calories',
    'ocean','sea','trace','mineral','minerals','electrolyte','electrolytes','sparkling','infused','beverage','berry','punch','flavor','flavors','flavour','flavours',
    'wheat','barley','rye','malt','spelt','buckwheat','amaranth','quinoa','rice','brown','millet','sorghum','teff',
    'sunflower','safflower','canola','soybean','corn','cottonseed','rapeseed','coconut','olive','avocado','palm','oil','high','oleic','hydrogenated',
    'cane','sugar','evaporated','fructose','corn','syrup','maple','honey','agave','dextrose','maltodextrin','molasses','stevia','sucralose','aspartame','acesulfame','saccharin','xylitol','erythritol','monk','fruit',
    'salt','sea','himalayan','kosher','iodized','pink',
    'cassava','tapioca','starch','cornstarch','potato','arrowroot',
    'cinnamon','vanilla','cocoa','chocolate','cacao','nutmeg','ginger','clove','turmeric',
    'pumpkin','sunflower','flax','chia','sesame','hemp','poppy','seeds','seed',
    'almonds','almond','cashews','cashew','walnuts','pecans','peanuts','pistachios','hazelnut','macadamia','brazil','nuts',
    'milk','cream','butter','cheese','yogurt','whey','casein','protein','isolate','concentrate','collagen','peptides','gelatin',
    'eggs','egg','whites','yolks',
    'vitamin','riboflavin','thiamine','niacin','pyridoxine','cobalamin','folate','biotin','choline','inositol',
    // Minerals removed from ingredient dictionary — they belong to nutrition facts; presence in this list caused false-OK on OCR errors like 'ZINC' appearing for 'CERTIFIED'.
    'freshness','enriched','fortified','extract','concentrate','blend','contains',
    'water','carbonated','sparkling','filtered','distilled','spring',
    'pea','soy','chickpea','lentil','bean','beans','black','navy','kidney','pinto',
    'lecithin','sunflower','soy','xanthan','guar','gum','pectin','agar',
    'citric','malic','ascorbic','tartaric','phosphoric','acid','sodium','bicarbonate','baking','soda','powder',
    'paprika','rosemary','thyme','oregano','basil','parsley','sage','garlic','onion'
  ];
  // Build lowercase set for fast lookup
  const OCR_DICT_SET = new Set(OCR_FUZZY_DICT.map(w => w.toLowerCase()));

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    let curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        curr[j] = Math.min(curr[j-1] + 1, prev[j] + 1, prev[j-1] + cost);
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }

  function ocrFuzzyFix(word) {
    if (!word || word.length < 3) return word;
    if (/[\d()]/.test(word)) return word;  // skip numbers and punctuation
    const lower = word.toLowerCase();
    // Already in dictionary — exact match, keep as-is (preserves user's case)
    if (OCR_DICT_SET.has(lower)) return word;
    // Find best Levenshtein match
    let best = null;
    let bestDist = Infinity;
    const maxDist = lower.length <= 4 ? 1 : (lower.length <= 7 ? 2 : 2);
    for (const candidate of OCR_DICT_SET) {
      if (Math.abs(candidate.length - lower.length) > 2) continue;
      const dist = levenshtein(lower, candidate);
      if (dist <= maxDist && dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
    if (!best) return word;
    // Preserve original casing pattern (Capitalized / UPPER / lower)
    if (word === word.toUpperCase()) return best.toUpperCase();
    if (word[0] === word[0].toUpperCase()) return best[0].toUpperCase() + best.slice(1);
    return best;
  }

  function ocrPostProcess(text) {
    // Tokenize while preserving punctuation/whitespace
    return text.replace(/[A-Za-z]+/g, m => ocrFuzzyFix(m));
  }

    function parseOcrText(rawText) {
    const out = { ingredients: '', nutrients: [], containerHint: '' };
    // Apply OCR fuzzy correction — fixes common misreads (Suntlower→Sunflower, Quineg→Quinoa, etc.)
    // Conservative: only words within 1-2 edits of a known food term get corrected; everything else passes through unchanged.
    rawText = ocrPostProcess(rawText);
    // Ingredients — relaxed whitespace + more stop conditions
    let ingMatch = rawText.match(/INGREDIENTS?\s*[:.]?\s*([\s\S]+?)(?:\n\s*\n|NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|DIRECTIONS|SUGGESTED\s+USE|OTHER\s+INGREDIENTS|CONTAINS\s*:|WARNING|ALLERGEN|MANUFACTURED|DISTRIBUTED|$)/i);
    if (ingMatch) {
      let ing = ingMatch[1].trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
      if (ing.length > 8) out.ingredients = ing;
    }
    // Fallback — if no INGREDIENTS header but the OCR text looks like a comma-separated ingredient list
    if (!out.ingredients) {
      const trimmed = rawText.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
      const commas = (trimmed.match(/,/g) || []).length;
      const hasNutritionHeader = /NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|Calories|Serving/i.test(trimmed);
      if (commas >= 4 && trimmed.length >= 30 && trimmed.length <= 2000 && !hasNutritionHeader) {
        out.ingredients = trimmed;
      }
    }
    // Nutrients — line by line
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const nutPat = /^([A-Z][A-Za-z\s()+\-\/]+?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\b/i;
    const skip = /^(calories|serving|amount per|daily value|total fat|saturated|trans fat|cholesterol|total carbohydrate|dietary fiber|total sugars|added sugars|nutrition|facts|amount)$/i;
    const seen = new Set();
    for (const line of lines) {
      const m2 = line.match(nutPat);
      if (!m2) continue;
      const name = m2[1].trim();
      if (skip.test(name)) continue;
      if (name.length < 2 || name.length > 55) continue;
      // Reject OCR noise patterns that survive the lazy regex match
      // (e.g., "Fo COLLAGEN To) Potassium 25mg" — unbalanced parens, colons, semicolons, or too many words mean the regex over-captured)
      const openParens = (name.match(/\(/g) || []).length;
      const closeParens = (name.match(/\)/g) || []).length;
      if (openParens !== closeParens) continue;
      if (/[:;]/.test(name)) continue;
      const wordCount = (name.match(/\b[A-Za-z]+\b/g) || []).length;
      if (wordCount > 4) continue;
      // Require at least one word >= 4 chars — rejects "Fo To" / "Of A" garbage prefixes
      const hasSubstantiveWord = (name.match(/\b[A-Za-z]{4,}\b/g) || []).length > 0;
      if (!hasSubstantiveWord) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.nutrients.push({ name, amount: parseFloat(m2[2]), unit: m2[3].toLowerCase() });
    }
    // Reversed-format catch: "12g COLLAGEN" / "11g PROTEIN" — number-and-unit-first, then name.
    // Common on can-front marketing graphics ("12g COLLAGEN", "11g PROTEIN") that the standard nutrition-facts regex won't match.
    // Restricted to a small allow-list of nutrients the user is likely to want tracked from these graphics.
    const reversedPat = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\s+([A-Z][A-Za-z\-]{3,20})\b/gi;
    const reversedAllow = new Set(['collagen','protein','fiber','peptides','calcium','magnesium','potassium','sodium']);
    let rm;
    while ((rm = reversedPat.exec(rawText)) !== null) {
      const nameLower = rm[3].toLowerCase();
      if (!reversedAllow.has(nameLower)) continue;
      // Normalize collagen-peptides aliasing — "12g COLLAGEN" and "Collagen Peptides 11g" should not double-add
      const canonical = (nameLower === 'peptides') ? 'Collagen Peptides' : (rm[3][0].toUpperCase() + rm[3].slice(1).toLowerCase());
      const key = canonical.toLowerCase();
      if (seen.has(key)) continue;
      // Also dedup against "collagen peptides" + "collagen" overlap
      if (key === 'collagen' && seen.has('collagen peptides')) continue;
      if (key === 'collagen peptides' && seen.has('collagen')) continue;
      seen.add(key);
      out.nutrients.push({ name: canonical, amount: parseFloat(rm[1]), unit: rm[2].toLowerCase() });
    }
    // Known-nutrient-name pass: scans the WHOLE rawText (not just line starts) for "Name N unit" patterns
    // restricted to a known-good nutrient list. This catches nutrition-facts data when Tesseract PSM 6
    // collapses the panel into one long line (no per-nutrient newlines), which defeats the line-anchored regex.
    // The allow-list prevents false positives from random capitalized words.
    const KNOWN_NUTRIENT_NAMES = [
      // Multi-word names FIRST (so longer matches win the dedup race)
      'Vitamin B12','Vitamin B6','Vitamin B5','Vitamin B3','Vitamin B2','Vitamin B1',
      'Vitamin A','Vitamin C','Vitamin D','Vitamin E','Vitamin K',
      'Collagen Peptides','Dietary Fiber','Total Carbohydrate','Total Sugars','Added Sugars',
      'Pantothenic Acid','Folic Acid','Ascorbic Acid',
      'Omega-3','Omega 3','EPA','DHA',
      // Single-word
      'Calcium','Magnesium','Potassium','Sodium','Iron','Zinc','Copper','Manganese','Chromium','Selenium','Iodine','Boron','Molybdenum','Phosphorus','Sulfur',
      'Thiamine','Riboflavin','Niacin','Pyridoxine','Cobalamin','Folate','Biotin','Choline','Inositol',
      'Protein','Collagen','Fiber'
    ];
    for (const nutName of KNOWN_NUTRIENT_NAMES) {
      // Match: NutrientName [optional parenthetical like "(Vit C)" or "(as ascorbic acid)"] AMOUNT UNIT
      // Stop before reaching the next known nutrient name or a non-number — keeps amount capture tight.
      const escaped = nutName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pat = new RegExp('\\b' + escaped + '\\b[\\s,]*(?:\\([^)]{1,30}\\)[\\s,]*)?(\\d+(?:\\.\\d+)?)\\s*(mg|mcg|g|iu)\\b', 'i');
      const m = rawText.match(pat);
      if (!m) continue;
      const key = nutName.toLowerCase();
      // Dedup against single/multi-word overlaps (Vitamin C vs C, Collagen vs Collagen Peptides)
      if (key === 'collagen' && seen.has('collagen peptides')) continue;
      if (key === 'fiber' && seen.has('dietary fiber')) continue;
      // Generic Vitamin-C-style dedup: if any 'vitamin X' is already seen, don't add bare 'X'
      if (seen.has(key)) continue;
      seen.add(key);
      out.nutrients.push({ name: nutName, amount: parseFloat(m[1]), unit: m[2].toLowerCase() });
    }
    // Container hint
    if (/\bfl\s*oz\b/i.test(rawText)) out.containerHint = 'aluminum_can';
    else if (/capsules?|softgels?|tablets?/i.test(rawText)) out.containerHint = 'capsule';
    else if (/powder|scoops?\b/i.test(rawText)) out.containerHint = 'powder';
    return out;
  }
  async function triggerOcr() {
    const dz = $('lc-drop-zone');
    if (!lcImages.length) return;
    const btn = dz.querySelector('.ocr-btn');
    const progress = dz.querySelector('.ocr-progress');
    const ptext = progress.querySelector('.ocr-progress-text');
    const pfill = progress.querySelector('.ocr-progress-fill');
    btn.disabled = true;
    progress.hidden = false;
    try {
      const merged = { ingredients: '', nutrients: [], containerHint: '' };
      const seenNut = new Set();
      for (let i = 0; i < lcImages.length; i++) {
        const im = lcImages[i];
        const baseLabel = 'Image ' + (i+1) + '/' + lcImages.length + ': ';
        const text = await runOcr(im.dataUrl, (msg, prog) => {
          ptext.textContent = baseLabel + msg;
          pfill.style.width = ((i + prog) / lcImages.length * 100) + '%';
        });
        const parsed = parseOcrText(text);
        if (parsed.ingredients && !merged.ingredients) merged.ingredients = parsed.ingredients;
        if (parsed.containerHint && !merged.containerHint) merged.containerHint = parsed.containerHint;
        for (const n of parsed.nutrients) {
          const key = n.name.toLowerCase();
          if (seenNut.has(key)) continue;
          seenNut.add(key);
          merged.nutrients.push(n);
        }
      }
      // Apply to form — only fill empty fields (preserve user edits)
      let filled = 0;
      if (merged.ingredients && !$('lc-ingredients').value.trim()) {
        const f = $('lc-ingredients'); f.value = merged.ingredients; f.classList.add('autodetect'); filled++;
      }
      if (merged.containerHint && !$('lc-container').value) {
        $('lc-container').value = merged.containerHint; $('lc-container').classList.add('autodetect'); filled++;
      }
      if (merged.nutrients.length > 0) {
        const existing = new Set();
        document.querySelectorAll('#lc-nutrient-rows .n-name').forEach(input => { if (input.value.trim()) existing.add(input.value.trim().toLowerCase()); });
        document.querySelectorAll('#lc-nutrient-rows tr').forEach(tr => {
          const ni = tr.querySelector('.n-name'); const ai = tr.querySelector('.n-amount');
          if (ni && !ni.value.trim() && (!ai.value || ai.value === '')) tr.remove();
        });
        let added = 0;
        for (const n of merged.nutrients) {
          if (existing.has(n.name.toLowerCase())) continue;
          addNutrientRow(n.name, n.amount, n.unit, '', 'unknown');
          const last = $('lc-nutrient-rows').lastElementChild;
          if (last) last.classList.add('autodetect');
          added++;
        }
        filled += added;
      }
      if (filled > 0) ptext.textContent = '✓ Auto-detected ' + filled + ' field' + (filled > 1 ? 's' : '') + ' across ' + lcImages.length + ' image' + (lcImages.length > 1 ? 's' : '');
      else ptext.textContent = '⚠ OCR ran but nothing parseable extracted. Try clearer images or enter manually.';
      // Surface OCR error suggestions immediately after auto-detect
      setTimeout(renderHelperPanel, 100);
      pfill.style.width = '100%';
      setTimeout(() => { progress.hidden = true; btn.disabled = false; }, 2200);
    } catch (err) {
      ptext.textContent = '❌ ' + (err.message || 'OCR failed');
      pfill.style.width = '0%';
      setTimeout(() => { progress.hidden = true; btn.disabled = false; }, 3500);
    }
  }

  // ---- Custom confirmation modal (replaces native confirm() for nicer UX) ----
  function showLcModal(opts) {
    return new Promise(resolve => {
      const cfg = Object.assign({
        title: 'Confirm', titleSev: 'warn', icon: '⚠',
        body: '', checkboxText: null,
        confirmText: 'Confirm', cancelText: 'Cancel',
        confirmDanger: false
      }, opts || {});
      let modal = document.getElementById('lc-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'lc-modal';
        modal.className = 'lc-modal';
        modal.hidden = true;
        modal.innerHTML = '<div class="lc-modal-backdrop"></div>' +
          '<div class="lc-modal-content">' +
          '  <h3 class="lc-modal-title"><span class="modal-icon"></span><span class="modal-title-text"></span></h3>' +
          '  <p class="lc-modal-body"></p>' +
          '  <label class="lc-modal-confirm" hidden><input type="checkbox"><span></span></label>' +
          '  <div class="lc-modal-actions">' +
          '    <button class="modal-cancel"></button>' +
          '    <button class="modal-confirm"></button>' +
          '  </div>' +
          '</div>';
        document.body.appendChild(modal);
      }
      const titleEl = modal.querySelector('.lc-modal-title');
      titleEl.className = 'lc-modal-title sev-' + cfg.titleSev;
      modal.querySelector('.modal-icon').textContent = cfg.icon;
      modal.querySelector('.modal-title-text').textContent = ' ' + cfg.title;
      modal.querySelector('.lc-modal-body').textContent = cfg.body;
      const cbLabel = modal.querySelector('.lc-modal-confirm');
      const cb = cbLabel.querySelector('input');
      const cbSpan = cbLabel.querySelector('span');
      const confirmBtn = modal.querySelector('.modal-confirm');
      const cancelBtn = modal.querySelector('.modal-cancel');
      if (cfg.checkboxText) {
        cbLabel.hidden = false;
        cbLabel.classList.remove('checked');
        cbSpan.textContent = cfg.checkboxText;
        cb.checked = false;
        // Add Anyway is always enabled — freedom to commit anyway, lack of nutrients is acknowledged via the warning itself.
        // Checking the box transforms the action label: "Add Anyway" → "Add Item" (semantic shift from acknowledging-risk to confirmed-decision)
        confirmBtn.disabled = false;
        confirmBtn.textContent = cfg.confirmText;
        cb.onchange = () => {
          cbLabel.classList.toggle('checked', cb.checked);
          confirmBtn.textContent = cb.checked ? (cfg.confirmTextConfirmed || cfg.confirmText) : cfg.confirmText;
          confirmBtn.classList.toggle('committed', cb.checked);
        };
      } else {
        cbLabel.hidden = true;
        cb.onchange = null;
        confirmBtn.disabled = false;
        confirmBtn.textContent = cfg.confirmText;
      }
      confirmBtn.className = 'modal-confirm' + (cfg.confirmDanger ? ' danger' : '');
      cancelBtn.textContent = cfg.cancelText;

      const escHandler = e => { if (e.key === 'Escape') close(false); };
      const close = result => {
        modal.hidden = true;
        document.removeEventListener('keydown', escHandler);
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.querySelector('.lc-modal-backdrop').onclick = null;
        resolve(result);
      };
      confirmBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
      modal.querySelector('.lc-modal-backdrop').onclick = () => close(false);
      document.addEventListener('keydown', escHandler);
      modal.hidden = false;
    });
  }

  function seedIfEmpty() {
    const w = loadWishlist();
    if (w.items.length === 0) {
      w.items.push({
        id: 1,
        name: 'HYDRA DNA Collagen Sparkling Beverage (Berry Punch)',
        brand: 'HYDRA DNA',
        category: 'beverage / collagen drink',
        verdict: 'SAVE',
        addedDate: '2026-06-13',
        topGapFills: [
          { essential: 'Calcium', gapFillPct: 1.5 },
          { essential: 'Magnesium', gapFillPct: 1.5 },
          { essential: 'Vitamin C', gapFillPct: 0.7 },
          { essential: 'Potassium', gapFillPct: 0.7 }
        ],
        userNotes: 'Currently substituting for Neutonic — primarily for caffeine reduction + joint substrate',
        reasonsFor: ['Moderate form alignment (1.43)', 'Goal coverage: joints_collagen, hydration_electrolyte'],
        reasonsAgainst: ['No nutrient closes >10% of a current gap'],
        goals: ['joints_collagen','hydration_electrolyte'],
        label_data: {
          name: 'HYDRA DNA Collagen Sparkling Beverage (Berry Punch)',
          brand: 'HYDRA DNA',
          category: 'beverage / collagen drink',
          servings: 1.5,
          container: 'aluminum_can',
          ingredients: 'Carbonated Water, Collagen Peptides, Tapioca Soluble Fiber, Natural Flavors, Citric Acid, Malic Acid, Sea Trace Minerals, Potassium Chloride, Mushroom Extract, Stevia, Ascorbic Acid (Vit C), Vegetable Juice (For Color), Himalayan Pink Salt, Fulvic Acid.',
          nutrients: [
            { name: 'Collagen Peptides', amount: 12, unit: 'g', form: 'hydrolyzed bovine collagen', form_alignment: 'aligned' },
            { name: 'Protein', amount: 11, unit: 'g', form: 'collagen (incomplete)', form_alignment: 'partial' },
            { name: 'Vitamin C (Ascorbic Acid)', amount: 45, unit: 'mg', form: 'ascorbic acid', form_alignment: 'partial' },
            { name: 'Calcium', amount: 20, unit: 'mg', form: 'sea trace minerals', form_alignment: 'partial' },
            { name: 'Magnesium', amount: 10, unit: 'mg', form: 'sea trace minerals', form_alignment: 'partial' },
            { name: 'Potassium', amount: 25, unit: 'mg', form: 'potassium chloride', form_alignment: 'aligned' },
            { name: 'Sodium', amount: 50, unit: 'mg', form: 'Himalayan salt + sea trace', form_alignment: 'aligned' }
          ]
        }
      });
      persistWishlist(w);
    }
  }

  // ---- Init ----

  // === MY REGIMEN: data + UI ===
  const REGIMEN_BASE_DATA = {
  "supplements": [
    {
      "id": "stk_Ultimate_Daily_Classic",
      "name": "Ultimate Daily Classic",
      "kind": "supplement",
      "source": "chat",
      "dose_text": "2 3 tablets/day",
      "scaling_factor": 0.667,
      "notes": "User takes 2 caps/day; label serving = 3 caps. All nutrient amounts in DB are per 3-cap serving; multiply by 0.667 for actual intake.",
      "actual_range": "",
      "timing": "with main meal",
      "category": "YGY foundational tablet",
      "what_it_does": "Provides a broad foundation for good health through vitamins, minerals, and antioxidant-rich botanicals.",
      "nutrients": [
        {
          "name": "Vitamin A (beta-carotene)",
          "amount": 480,
          "unit": "mcg",
          "form": "natural beta-carotene",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin C",
          "amount": 267,
          "unit": "mg",
          "form": "ascorbic acid",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin D3",
          "amount": 2.0,
          "unit": "mcg",
          "form": "cholecalciferol",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin E",
          "amount": 33.35,
          "unit": "mg",
          "form": "d-alpha-tocopheryl acetate",
          "alignment": "partial"
        },
        {
          "name": "Vitamin B1 (Thiamine)",
          "amount": 13.34,
          "unit": "mg",
          "form": "thiamine HCl",
          "alignment": "partial"
        },
        {
          "name": "Vitamin B2 (Riboflavin)",
          "amount": 13.34,
          "unit": "mg",
          "form": "riboflavin (form unspecified)",
          "alignment": "partial"
        },
        {
          "name": "Vitamin B3 (Niacin)",
          "amount": 13.34,
          "unit": "mg",
          "form": "inositol hexanicotinate",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B6 (Pyridoxine)",
          "amount": 13.34,
          "unit": "mg",
          "form": "pyridoxine HCl",
          "alignment": "partial"
        },
        {
          "name": "Folic Acid (Folate)",
          "amount": 167,
          "unit": "mcg DFE",
          "form": "calcium L-5-methyltetrahydrofolate",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 26.68,
          "unit": "mcg",
          "form": "methylcobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Biotin",
          "amount": 13.34,
          "unit": "mcg",
          "form": "biotin",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B5 (Pantothenic Acid)",
          "amount": 20.01,
          "unit": "mg",
          "form": "D-calcium pantothenate",
          "alignment": "aligned"
        },
        {
          "name": "Calcium",
          "amount": 267,
          "unit": "mg",
          "form": "dicalcium phosphate, hydroxyapatite",
          "alignment": "partial"
        },
        {
          "name": "Iron",
          "amount": 1.33,
          "unit": "mg",
          "form": "ferrous fumarate",
          "alignment": "partial"
        },
        {
          "name": "Phosphorus",
          "amount": 167,
          "unit": "mg",
          "form": "dicalcium phosphate, hydroxyapatite",
          "alignment": "partial"
        },
        {
          "name": "Iodine",
          "amount": 26.68,
          "unit": "mcg",
          "form": "from kelp",
          "alignment": "aligned"
        },
        {
          "name": "Magnesium",
          "amount": 67,
          "unit": "mg",
          "form": "magnesium amino acid chelate",
          "alignment": "partial"
        },
        {
          "name": "Zinc",
          "amount": 2.67,
          "unit": "mg",
          "form": "zinc bisglycinate chelate",
          "alignment": "aligned"
        },
        {
          "name": "Selenium",
          "amount": 40.02,
          "unit": "mcg",
          "form": "selenium amino acid chelate",
          "alignment": "partial"
        },
        {
          "name": "Copper",
          "amount": 0.53,
          "unit": "mg",
          "form": "copper bisglycinate chelate",
          "alignment": "aligned"
        },
        {
          "name": "Manganese",
          "amount": 1.33,
          "unit": "mg",
          "form": "manganese bisglycinate chelate",
          "alignment": "aligned"
        },
        {
          "name": "Chromium",
          "amount": 26.68,
          "unit": "mcg",
          "form": "chromium picolinate",
          "alignment": "partial"
        },
        {
          "name": "Potassium",
          "amount": 80,
          "unit": "mg",
          "form": "potassium citrate",
          "alignment": "aligned"
        },
        {
          "name": "Inositol",
          "amount": 13.34,
          "unit": "mg",
          "form": "inositol",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "stk_Ultimate_EFA_Plus",
      "name": "Ultimate EFA Plus",
      "kind": "supplement",
      "source": "chat",
      "dose_text": "4.5 1 softgel/day",
      "scaling_factor": 4.5,
      "notes": "Label = 1 softgel per serving, 3x daily. User: 3-6/day. Multiply per-softgel amounts by daily count.",
      "actual_range": "3-6 softgels/day; midpoint 4.5",
      "timing": "with larger meals (3 max per 4-5 hr window)",
      "category": "YGY EFA softgel (marine + flax)",
      "what_it_does": "Provides the right blend of essential fatty acids to promote overall good health, including targeted support for the heart.",
      "nutrients": [
        {
          "name": "Omega-3 (alpha-linolenic + EPA/DHA in marine form)",
          "amount": 2632,
          "unit": "mg",
          "form": "ALA 300 + EPA 171 + DHA 114 (per softgel)",
          "alignment": "aligned"
        },
        {
          "name": "Omega-6 (linoleic + GLA)",
          "amount": 549,
          "unit": "mg",
          "form": "Linoleic 103 + GLA 19 (per softgel)",
          "alignment": "aligned"
        },
        {
          "name": "Omega-9 (Arachidonic / Oleic)",
          "amount": 540,
          "unit": "mg",
          "form": "Oleic",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "stk_Ultimate_Gluco-Gel",
      "name": "Ultimate Gluco-Gel",
      "kind": "supplement",
      "source": "chat",
      "dose_text": "6 2 capsules/day",
      "scaling_factor": 3.0,
      "notes": "Label = 2 caps per serving. User: 4-8/day. Multiply per-serving amounts by 3 for 6-cap daily intake.",
      "actual_range": "4-8 caps/day; midpoint 6",
      "timing": "with meal ideally, flexible (5 max per 4-5 hr)",
      "category": "YGY joint / cartilage",
      "what_it_does": "Provides essential nutrients for healthy joints, cartilage, and bones.",
      "nutrients": [
        {
          "name": "Manganese",
          "amount": 6.0,
          "unit": "mg",
          "form": "manganese sulfate",
          "alignment": "partial"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "stk_Ultimate_Enzymes",
      "name": "Ultimate Enzymes",
      "kind": "supplement",
      "source": "chat",
      "dose_text": "1.5 1 capsule/day",
      "scaling_factor": 1.5,
      "notes": "Digestive enzyme \u2014 no 90-essential contribution. Counted for stack inventory but no nutrient math.",
      "actual_range": "1-2 capsules per meal, varies by meals/day",
      "timing": "30 min before animal-protein meals (situational)",
      "category": "YGY digestive enzymes",
      "what_it_does": "Provides essential enzymes to help with balanced digestion.",
      "nutrients": [],
      "has_nutrient_data": false
    },
    {
      "id": "stk_Neutonic_Productivity_Drink",
      "name": "Neutonic Productivity Drink",
      "kind": "supplement",
      "source": "chat",
      "dose_text": "2.0 1 can/day",
      "scaling_factor": 2.0,
      "notes": "Caffeine 240 mg/day midpoint (down from 300 mg/day after substitution with HYDRA DNA Collagen). Still above 200 mg conflict threshold but reduced. Counted as nutrient delivery for B-complex active forms + citicoline.",
      "actual_range": "1-2 cans/day; 2 typical, occasionally 1 (~1-2x/week)",
      "timing": "throughout day",
      "category": "Non-YGY nootropic / caffeinated beverage (per can)",
      "what_it_does": "",
      "nutrients": [
        {
          "name": "Vitamin B2 (Riboflavin)",
          "amount": 3.4,
          "unit": "mg",
          "form": "R5P (riboflavin-5-phosphate)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 400,
          "unit": "mcg",
          "form": "methylcobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Folic Acid (Folate)",
          "amount": 400,
          "unit": "mcg",
          "form": "methylfolate",
          "alignment": "aligned"
        },
        {
          "name": "Choline",
          "amount": 1000,
          "unit": "mg",
          "form": "citicoline (Cognizin)",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    }
  ],
  "diet": [
    {
      "id": "diet_egg_whole_large",
      "name": "Whole egg (large, ~50g)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 1 large egg (~50g)/day",
      "scaling_factor": 1.0,
      "notes": "Wallach recommends 8-12/day; current dose well below. Biggest single dietary improvement for goal 1 (cognition).",
      "category": "animal protein",
      "nutrients": [
        {
          "name": "Choline",
          "amount": 147,
          "unit": "mg",
          "form": "food-bound (phosphatidylcholine + free choline)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin D (cholecalciferol)",
          "amount": 41.0,
          "unit": "iu",
          "form": "animal-derived D3",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin A (retinol)",
          "amount": 80.0,
          "unit": "mcg",
          "form": "retinol (preformed)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 0.45,
          "unit": "mcg",
          "form": "food-bound cobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Folic Acid (Folate)",
          "amount": 24.0,
          "unit": "mcg",
          "form": "natural folate",
          "alignment": "aligned"
        },
        {
          "name": "Selenium",
          "amount": 15.0,
          "unit": "mcg",
          "form": "selenoprotein-bound",
          "alignment": "aligned"
        },
        {
          "name": "Iodine",
          "amount": 24.0,
          "unit": "mcg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin K2 (MK-4)",
          "amount": 9.0,
          "unit": "mcg",
          "form": "menaquinone-4 (animal-derived)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin E (tocopherols)",
          "amount": 0.5,
          "unit": "mg",
          "form": "alpha-tocopherol (food)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B2 (Riboflavin)",
          "amount": 0.2,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Biotin",
          "amount": 10.0,
          "unit": "mcg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B5 (Pantothenic Acid)",
          "amount": 0.7,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 0.6,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 86.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Protein",
          "amount": 6.0,
          "unit": "g",
          "form": "complete protein (all essential amino acids)",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_smoked_salmon_3oz",
      "name": "Smoked salmon (3 oz / 85g)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 3 oz (85g)/day",
      "scaling_factor": 1.0,
      "notes": "Average across week \u2014 actual pattern is 'often' per user log.",
      "category": "animal protein / marine",
      "nutrients": [
        {
          "name": "Omega-3 (EPA+DHA)",
          "amount": 1000,
          "unit": "mg",
          "form": "marine EPA+DHA (triglyceride)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin D (cholecalciferol)",
          "amount": 600,
          "unit": "iu",
          "form": "animal-derived D3",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 3.0,
          "unit": "mcg",
          "form": "food-bound cobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Selenium",
          "amount": 32.0,
          "unit": "mcg",
          "form": "selenomethionine + selenocysteine",
          "alignment": "aligned"
        },
        {
          "name": "Iodine",
          "amount": 65.0,
          "unit": "mcg",
          "form": "food-bound (marine)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B6 (Pyridoxine)",
          "amount": 0.5,
          "unit": "mg",
          "form": "food-bound (PLP)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B3 (Niacin)",
          "amount": 5.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin E (tocopherols)",
          "amount": 1.0,
          "unit": "mg",
          "form": "alpha-tocopherol",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin A (retinol)",
          "amount": 30.0,
          "unit": "mcg",
          "form": "retinol (preformed)",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 200,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 0.4,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B2 (Riboflavin)",
          "amount": 0.1,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Protein",
          "amount": 16.0,
          "unit": "g",
          "form": "complete protein",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_chicken_breaded_5oz",
      "name": "Breaded chicken strips (5 oz cooked / 140g)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 5 oz cooked (~140g)/day",
      "scaling_factor": 1.0,
      "notes": "Primary protein staple; gluten-free breading.",
      "category": "animal protein",
      "nutrients": [
        {
          "name": "Protein",
          "amount": 32.0,
          "unit": "g",
          "form": "complete protein",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B3 (Niacin)",
          "amount": 12.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B6 (Pyridoxine)",
          "amount": 0.7,
          "unit": "mg",
          "form": "food-bound (PLP)",
          "alignment": "aligned"
        },
        {
          "name": "Selenium",
          "amount": 30.0,
          "unit": "mcg",
          "form": "selenoprotein-bound",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 250,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 1.4,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 0.4,
          "unit": "mcg",
          "form": "food-bound cobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B5 (Pantothenic Acid)",
          "amount": 1.5,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_skyr_whole_milk_150g",
      "name": "Whole-milk Skyr (Siggi's, 150g)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "0.4 \u00d7 150g (~5 oz)/day",
      "scaling_factor": 0.4,
      "notes": "A few servings/week ~ 0.4/day average. Switching from lowfat in progress.",
      "category": "dairy",
      "nutrients": [
        {
          "name": "Protein",
          "amount": 6.8,
          "unit": "g",
          "form": "complete protein (casein + whey)",
          "alignment": "aligned"
        },
        {
          "name": "Calcium",
          "amount": 80,
          "unit": "mg",
          "form": "food-bound (casein-bound)",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 72,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 0.32,
          "unit": "mcg",
          "form": "food-bound cobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B2 (Riboflavin)",
          "amount": 0.12,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Iodine",
          "amount": 32.0,
          "unit": "mcg",
          "form": "food-bound (dairy)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin A (retinol)",
          "amount": 20.0,
          "unit": "mcg",
          "form": "retinol (preformed, whole-milk)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin D (cholecalciferol)",
          "amount": 40,
          "unit": "iu",
          "form": "animal-derived D3 (if fortified)",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 0.4,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B5 (Pantothenic Acid)",
          "amount": 0.2,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_cashews_raw_30g",
      "name": "Raw cashews (30g, ~22 nuts)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "0.7 \u00d7 30g (~22 cashews)/day",
      "scaling_factor": 0.7,
      "notes": "Via bars; ~0.7 servings/day estimated.",
      "category": "nuts",
      "nutrients": [
        {
          "name": "Magnesium",
          "amount": 56.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Copper",
          "amount": 0.42,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 1.19,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Manganese",
          "amount": 0.35,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 119,
          "unit": "mg",
          "form": "food-bound (some as phytate)",
          "alignment": "partial"
        },
        {
          "name": "Iron",
          "amount": 1.26,
          "unit": "mg",
          "form": "non-heme food-bound",
          "alignment": "partial"
        },
        {
          "name": "Protein",
          "amount": 3.5,
          "unit": "g",
          "form": "plant protein (incomplete)",
          "alignment": "partial"
        },
        {
          "name": "Selenium",
          "amount": 4.2,
          "unit": "mcg",
          "form": "food-bound",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_coconut_dried_10g",
      "name": "Dried shredded coconut (10g)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 10g (typical bar inclusion)/day",
      "scaling_factor": 1.0,
      "notes": "Via bars.",
      "category": "nuts/seeds",
      "nutrients": [
        {
          "name": "Manganese",
          "amount": 0.2,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Copper",
          "amount": 0.04,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Iron",
          "amount": 0.3,
          "unit": "mg",
          "form": "non-heme food-bound",
          "alignment": "partial"
        },
        {
          "name": "Magnesium",
          "amount": 9.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_dates_medjool_10g",
      "name": "Medjool date (10g, ~half a date)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 10g (typical bar inclusion)/day",
      "scaling_factor": 1.0,
      "notes": "Via bars; total sugar from this ~3g/day.",
      "category": "fruit / sugar",
      "nutrients": [
        {
          "name": "Potassium",
          "amount": 70.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Magnesium",
          "amount": 5.0,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        },
        {
          "name": "Copper",
          "amount": 0.04,
          "unit": "mg",
          "form": "food-bound",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_himalayan_salt_3g",
      "name": "Himalayan pink salt (3g pinch-level)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1 \u00d7 3g across the day/day",
      "scaling_factor": 1.0,
      "notes": "Standard daily salting.",
      "category": "mineral / seasoning",
      "nutrients": [
        {
          "name": "Sodium",
          "amount": 1200,
          "unit": "mg",
          "form": "sodium chloride",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "diet_hydra_dna_collagen_can",
      "name": "HYDRA DNA Collagen Sparkling Beverage (12 fl oz can, Berry Punch)",
      "kind": "diet",
      "source": "chat",
      "dose_text": "1.5 \u00d7 1 can (12 fl oz / 355 mL)/day",
      "scaling_factor": 1.5,
      "notes": "1-2 cans/day substituting for Neutonic \u2014 caffeine-free collagen+electrolyte drink. 12g collagen \u00d7 1.5 = 18g/day connective tissue substrate, sits in Wallach's joint protocol range (3-15 g/day cartilage).",
      "category": "beverage / collagen drink",
      "nutrients": [
        {
          "name": "Collagen Peptides",
          "amount": 18.0,
          "unit": "g",
          "form": "hydrolyzed bovine collagen peptides (glycine-proline-hydroxyproline rich)",
          "alignment": "aligned"
        },
        {
          "name": "Protein",
          "amount": 16.5,
          "unit": "g",
          "form": "collagen (incomplete protein - no tryptophan, low BCAA - joint substrate not muscle protein synthesis)",
          "alignment": "partial"
        },
        {
          "name": "Vitamin C (Ascorbic Acid)",
          "amount": 67.5,
          "unit": "mg",
          "form": "ascorbic acid",
          "alignment": "partial"
        },
        {
          "name": "Calcium",
          "amount": 30.0,
          "unit": "mg",
          "form": "from sea trace minerals",
          "alignment": "partial"
        },
        {
          "name": "Magnesium",
          "amount": 15.0,
          "unit": "mg",
          "form": "from sea trace minerals",
          "alignment": "partial"
        },
        {
          "name": "Potassium",
          "amount": 37.5,
          "unit": "mg",
          "form": "potassium chloride",
          "alignment": "aligned"
        },
        {
          "name": "Sodium",
          "amount": 75.0,
          "unit": "mg",
          "form": "Himalayan pink salt + sea trace minerals",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    }
  ],
  "recommended": [
    {
      "id": "rec_Majestic_Earth_Plant_Derived_Minerals_Liquid",
      "name": "Majestic Earth Plant Derived Minerals Liquid",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "1 1 fl oz/day",
      "scaling_factor": 1.0,
      "notes": "Goal 3 (90 essentials) anchor \u2014 rare-earth trace mineral foundation. Non-negotiable for 90-essentials coverage.",
      "category": "YGY trace mineral foundation (humic shale)",
      "nutrients": [
        {
          "name": "trace_via_PDM",
          "amount": 600,
          "unit": "mg total PDM complex",
          "form": "humic shale colloidal minerals",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_Ultimate_Selenium",
      "name": "Ultimate Selenium",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "3 1 capsule/day",
      "scaling_factor": 3.0,
      "notes": "Highest goal-overlap SKU. Cr 300 mcg (Wallach's diabetes target), Se 300 mcg (eye protocol), Zn 15 mg (hormonal axis).",
      "category": "YGY blood-sugar + Se SKU",
      "nutrients": [
        {
          "name": "Vitamin A (beta-carotene)",
          "amount": 2250,
          "unit": "mcg",
          "form": "beta-carotene",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin C",
          "amount": 360,
          "unit": "mg",
          "form": "ascorbic acid",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin D3",
          "amount": 15.0,
          "unit": "mcg",
          "form": "cholecalciferol",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin E",
          "amount": 60.0,
          "unit": "mg",
          "form": "d-alpha tocopheryl acetate",
          "alignment": "partial"
        },
        {
          "name": "Zinc",
          "amount": 15.0,
          "unit": "mg",
          "form": "zinc bisglycinate chelate",
          "alignment": "aligned"
        },
        {
          "name": "Selenium",
          "amount": 300,
          "unit": "mcg",
          "form": "l-selenomethionine",
          "alignment": "aligned"
        },
        {
          "name": "Copper",
          "amount": 1.5,
          "unit": "mg",
          "form": "copper bisglycinate chelate",
          "alignment": "aligned"
        },
        {
          "name": "Chromium",
          "amount": 300,
          "unit": "mcg",
          "form": "chromium nicotinate glycinate chelate",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_Ultimate_Iodine",
      "name": "Ultimate Iodine",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "1 2 sprays (0.38 ml)/day",
      "scaling_factor": 1.0,
      "notes": "Replace discontinued Survival Shield X-2.",
      "category": "YGY iodine spray (only verified format currently)",
      "nutrients": [
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 24.0,
          "unit": "mcg",
          "form": "methylcobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Iodine",
          "amount": 300,
          "unit": "mcg",
          "form": "from sodium iodide",
          "alignment": "partial"
        },
        {
          "name": "Zinc",
          "amount": 55.0,
          "unit": "mcg",
          "form": "from zinc sulfate",
          "alignment": "partial"
        },
        {
          "name": "Selenium",
          "amount": 11.0,
          "unit": "mcg",
          "form": "from sodium selenate",
          "alignment": "partial"
        },
        {
          "name": "Copper",
          "amount": 180,
          "unit": "mcg",
          "form": "from cupric chloride",
          "alignment": "partial"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_Synaptiv",
      "name": "Synaptiv",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "1 2 tablets/day",
      "scaling_factor": 1.0,
      "notes": "Goal 1 (cognition) \u2014 pro-line brain SKU.",
      "category": "YGY pro-line cognitive",
      "nutrients": [
        {
          "name": "Vitamin C",
          "amount": 20.0,
          "unit": "mg",
          "form": "ascorbic acid",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B1 (Thiamine)",
          "amount": 1.5,
          "unit": "mg",
          "form": "thiamine mononitrate",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B3 (Niacin)",
          "amount": 4.0,
          "unit": "mg",
          "form": "niacinamide",
          "alignment": "aligned"
        },
        {
          "name": "Folic Acid (Folate)",
          "amount": 75.0,
          "unit": "mcg DFE",
          "form": "folic acid (46 mcg)",
          "alignment": "partial"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 24.0,
          "unit": "mcg",
          "form": "methylcobalamin",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B5 (Pantothenic Acid)",
          "amount": 1.5,
          "unit": "mg",
          "form": "D-calcium pantothenate",
          "alignment": "aligned"
        },
        {
          "name": "Choline",
          "amount": 12.0,
          "unit": "mg",
          "form": "from 30 mg choline bitartrate",
          "alignment": "partial"
        },
        {
          "name": "Calcium",
          "amount": 160,
          "unit": "mg",
          "form": "from dicalcium phosphate",
          "alignment": "partial"
        },
        {
          "name": "Zinc",
          "amount": 2.5,
          "unit": "mg",
          "form": "zinc citrate",
          "alignment": "partial"
        },
        {
          "name": "Inositol",
          "amount": 30.0,
          "unit": "mg",
          "form": "inositol",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_Beyond_Osteo_FX_Liquid",
      "name": "Beyond Osteo FX Liquid",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "1 1 fl oz (30 mL)/day",
      "scaling_factor": 1.0,
      "notes": "Bone/Sr/sulfur cluster. Liquid form for higher boron (3 mg). Goals 2 (strength) + 3 (longevity).",
      "category": "YGY bone / Sr / sulfur cluster (liquid)",
      "nutrients": [
        {
          "name": "Vitamin D3",
          "amount": 10.0,
          "unit": "mcg",
          "form": "cholecalciferol",
          "alignment": "aligned"
        },
        {
          "name": "Calcium",
          "amount": 1200,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        },
        {
          "name": "Phosphorus",
          "amount": 300,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        },
        {
          "name": "Magnesium",
          "amount": 300,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        },
        {
          "name": "Zinc",
          "amount": 5.0,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "partial"
        },
        {
          "name": "Copper",
          "amount": 0.05,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "partial"
        },
        {
          "name": "Sulfur",
          "amount": 250,
          "unit": "mg",
          "form": "MSM",
          "alignment": "aligned"
        },
        {
          "name": "Strontium",
          "amount": 500,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        },
        {
          "name": "Boron",
          "amount": 3.0,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_Ancestral_Supplements_Grass_Fed_Beef_Liver",
      "name": "Ancestral Supplements Grass Fed Beef Liver",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "6 6 capsules/day",
      "scaling_factor": 1.0,
      "notes": "Organ meat bridge \u2014 user cannot stomach liver directly. Delivers retinol, Cu, heme iron, B12, folate, choline.",
      "category": "Non-YGY food-form supplement",
      "nutrients": [
        {
          "name": "Vitamin A (beta-carotene)",
          "amount": 4500,
          "unit": "mcg RAE",
          "form": "retinol (food-form)",
          "alignment": "aligned"
        },
        {
          "name": "Vitamin B12 (Cobalamin)",
          "amount": 60.0,
          "unit": "mcg",
          "form": "food-form",
          "alignment": "aligned"
        },
        {
          "name": "Folic Acid (Folate)",
          "amount": 250,
          "unit": "mcg",
          "form": "food-form folate",
          "alignment": "aligned"
        },
        {
          "name": "Copper",
          "amount": 7.5,
          "unit": "mg",
          "form": "food-form",
          "alignment": "aligned"
        },
        {
          "name": "Iron",
          "amount": 9.0,
          "unit": "mg",
          "form": "heme iron",
          "alignment": "aligned"
        },
        {
          "name": "Choline",
          "amount": 1500,
          "unit": "mg",
          "form": "food-form",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    },
    {
      "id": "rec_XeraTest",
      "name": "XeraTest",
      "kind": "recommended",
      "source": "chat",
      "dose_text": "2 2 tablets/day",
      "scaling_factor": 1.0,
      "notes": "Hormonal axis \u2014 try-and-observe goal-2 layer (Boron 3 mg + Zn 30 mg + Fenugreek). Pair with Ultimate Selenium for Cu co-factor.",
      "category": "YGY men's hormonal (gated on labs)",
      "nutrients": [
        {
          "name": "Zinc",
          "amount": 30.0,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "partial"
        },
        {
          "name": "Boron",
          "amount": 3.0,
          "unit": "mg",
          "form": "unspecified",
          "alignment": "aligned"
        }
      ],
      "has_nutrient_data": true
    }
  ]
};

  const RG_OVERRIDES_KEY = 'rgOverrides_v1';      // user edits keyed by id
  const RG_MANUAL_KEY = 'rgManualItems_v1';       // user-added items
  const RG_REMOVED_KEY = 'rgRemoved_v1';          // soft-deletes by id
  const RG_OUTCOMES_KEY = 'rgOutcomes_v1';        // outcome log keyed by id
  let rgFilter = 'all';

  function loadRgOverrides() { try { return JSON.parse(localStorage.getItem(RG_OVERRIDES_KEY)) || {}; } catch(e) { return {}; } }
  function saveRgOverride(id, patch) {
    const all = loadRgOverrides();
    all[id] = Object.assign(all[id] || {}, patch);
    try { localStorage.setItem(RG_OVERRIDES_KEY, JSON.stringify(all)); } catch(e) {}
  }
  function loadRgManual() { try { return JSON.parse(localStorage.getItem(RG_MANUAL_KEY)) || []; } catch(e) { return []; } }
  function saveRgManual(items) { try { localStorage.setItem(RG_MANUAL_KEY, JSON.stringify(items)); } catch(e) {} }
  function loadRgRemoved() { try { return new Set(JSON.parse(localStorage.getItem(RG_REMOVED_KEY)) || []); } catch(e) { return new Set(); } }
  function saveRgRemoved(set) { try { localStorage.setItem(RG_REMOVED_KEY, JSON.stringify([...set])); } catch(e) {} }
  function loadRgOutcomes() { try { return JSON.parse(localStorage.getItem(RG_OUTCOMES_KEY)) || {}; } catch(e) { return {}; } }
  function saveRgOutcomes(map) { try { localStorage.setItem(RG_OUTCOMES_KEY, JSON.stringify(map)); } catch(e) {} }

  function getUnifiedRegimenItems() {
    // Combine base data + label regimen + manual items + apply overrides + filter removed
    const overrides = loadRgOverrides();
    const manualItems = loadRgManual();
    const removed = loadRgRemoved();
    const labelReg = (function() {
      try { const r = JSON.parse(localStorage.getItem(REGIMEN_KEY)) || { items: [] }; return r.items; }
      catch(e) { return []; }
    })();
    const items = [];
    // Base items
    [...REGIMEN_BASE_DATA.supplements, ...REGIMEN_BASE_DATA.diet, ...REGIMEN_BASE_DATA.recommended].forEach(b => {
      const merged = Object.assign({}, b, overrides[b.id] || {});
      merged._removed = removed.has(b.id);
      items.push(merged);
    });
    // Label Check regimen items
    const wishlistItems = (function() {
      try { return (JSON.parse(localStorage.getItem(WISHLIST_KEY)) || { items: [] }).items; }
      catch(e) { return []; }
    })();
    labelReg.forEach(r => {
      const id = 'lbl_' + (r.id || r.label?.name || 'unknown');
      const labelNuts = (r.label?.nutrients || []).map(n => ({ name: n.name, amount: n.amount, unit: n.unit, form: n.form, alignment: n.form_alignment }));
      // If label has no nutrients (added from a legacy wishlist seed without label_data), fall back to wishlist topGapFills as approximations
      let derivedNuts = labelNuts;
      let hasNutrientData = labelNuts.length > 0;
      let nutrientNote = '';
      if (!hasNutrientData) {
        const matchWish = wishlistItems.find(w => w.name === r.label?.name);
        if (matchWish && matchWish.topGapFills && matchWish.topGapFills.length) {
          derivedNuts = matchWish.topGapFills.map(g => ({
            name: g.essential,
            amount: g.gapFillPct,
            unit: '% of Wallach target',
            form: 'from gap-fill summary',
            alignment: 'unknown'
          }));
          hasNutrientData = true;
          nutrientNote = 'Approximate — derived from Label Check gap-fill summary, not full nutrient panel. For exact daily intake, re-scan the label.';
        }
      }
      const merged = Object.assign({
        id, name: r.label?.name || 'Unnamed', kind: 'label', source: 'label-scan',
        dose_text: (r.label?.servings || 1) + ' serving(s)/day',
        category: r.label?.category || '', notes: '',
        nutrients: derivedNuts,
        has_nutrient_data: hasNutrientData,
        nutrient_note: nutrientNote,
      }, overrides[id] || {});
      merged._removed = removed.has(id);
      items.push(merged);
    });
    // Manual items
    manualItems.forEach(m => {
      const merged = Object.assign({}, m, overrides[m.id] || {});
      merged._removed = removed.has(m.id);
      items.push(merged);
    });
    return items;
  }

  function missingFlags(item) {
    const flags = [];
    if (!item.dose_text || /\?/.test(item.dose_text)) flags.push('missing dose');
    if (!item.has_nutrient_data && item.kind !== 'lifestyle' && item.kind !== 'other') flags.push('missing nutrient data');
    if (!item.notes) flags.push('no notes');
    return flags;
  }

  function sourceTagClass(source) {
    if (source === 'label-scan') return 'rg-tag-label';
    if (source === 'manual') return 'rg-tag-manual';
    return 'rg-tag-chat';
  }

  function renderRegimenTab() {
    const container = $('rg-grouped-container');
    if (!container) return;
    const items = getUnifiedRegimenItems().filter(it => {
      if (rgFilter === 'all') return true;
      if (rgFilter === 'supplement') return it.kind === 'supplement';
      if (rgFilter === 'diet') return it.kind === 'diet';
      if (rgFilter === 'label') return it.kind === 'label';
      if (rgFilter === 'recommended') return it.kind === 'recommended';
      return true;
    });
    if (!items.length) { container.innerHTML = '<div class="rg-empty">No items match this filter.</div>'; return; }
    // Group by kind
    const groupOrder = ['supplement', 'diet', 'label', 'recommended', 'lifestyle', 'other'];
    const groupLabels = {
      supplement: 'Supplements (active)', diet: 'Diet & food',
      label: 'Added via Label Check', recommended: 'Recommended (pending decision)',
      lifestyle: 'Lifestyle items', other: 'Other'
    };
    const grouped = {};
    items.forEach(it => {
      const k = it.kind || 'other';
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(it);
    });
    const html = [];
    groupOrder.forEach(k => {
      if (!grouped[k] || grouped[k].length === 0) return;
      html.push('<div class="rg-group">');
      html.push('  <div class="rg-group-header"><h3 class="rg-group-title">' + escapeHtml(groupLabels[k] || k) + '</h3><span class="rg-group-count">' + grouped[k].length + '</span></div>');
      html.push('  <div class="rg-cards-grid">');
      grouped[k].forEach(it => { html.push(renderRegimenCard(it)); });
      html.push('  </div></div>');
    });
    container.innerHTML = html.join('');
    bindRegimenCardActions();
  }

  function renderRegimenCard(item) {
    const flags = missingFlags(item);
    const tagsHtml = '<span class="rg-tag ' + sourceTagClass(item.source) + '">' + escapeHtml(item.source || 'chat') + '</span>' +
                     flags.map(f => '<span class="rg-tag rg-tag-missing">' + escapeHtml(f) + '</span>').join('') +
                     (item._removed ? '<span class="rg-tag rg-tag-removed">removed</span>' : '');
    const notesHtml = item.notes ? '<div class="rg-notes">' + escapeHtml(item.notes) + '</div>' : '';
    const outcomes = loadRgOutcomes()[item.id] || [];
    return '<div class="rg-card' + (item._removed ? ' removed' : '') + '" data-id="' + escapeHtml(item.id) + '">' +
      '  <h3 class="rg-name">' + escapeHtml(item.name) + '</h3>' +
      '  <span class="rg-dose">' + escapeHtml(item.dose_text || 'no dose set') + '</span>' +
      (item.category ? '  <p class="rg-meta">' + escapeHtml(item.category) + '</p>' : '') +
      '  <div class="rg-tags">' + tagsHtml + '</div>' +
      notesHtml +
      '  <div class="rg-actions">' +
      '    <button class="rg-toggle-expand">Details</button>' +
      '    <button class="rg-edit" title="Quick name/dose/notes edit. For full label re-scan, use Full edit.">Quick edit</button>' +
      '    <button class="rg-edit-full" title="Edit full label (nutrients + ingredients) in Label Check.">Full edit</button>' +
      '    <button class="rg-remove' + (item._removed ? ' rg-restore' : '') + '">' + (item._removed ? 'Restore' : 'Remove') + '</button>' +
      '  </div>' +
      '  <div class="rg-expanded">' +
      renderNutrientList(item) +
      renderEditForm(item) +
      renderOutcomeLog(item, outcomes) +
      '  </div>' +
      '</div>';
  }

  function renderNutrientList(item) {
    if (!item.nutrients || !item.nutrients.length) return '<h4>Nutrient breakdown</h4><p style="color:var(--ink-mute);font-size:12px;font-style:italic;">No nutrient data on file. ' + (item.kind === 'lifestyle' || item.kind === 'other' ? '' : 'Add via the edit form below if you want it factored into gap-fill math.') + '</p>';
    const noteHtml = item.nutrient_note ? '<p style="font-size:11.5px;color:var(--ink-mute);font-style:italic;margin:0 0 8px;padding:6px 10px;background:var(--warn-bg);border-left:3px solid var(--warn);border-radius:3px;">' + escapeHtml(item.nutrient_note) + '</p>' : '';
    return '<h4>Nutrient breakdown (daily, scaled)</h4>' + noteHtml + '<div class="rg-nutrient-list">' +
      item.nutrients.slice(0, 30).map(n => '<div class="nut-row"><span class="nut-name">' + escapeHtml(n.name) + '</span><span class="nut-amt">' + escapeHtml(String(n.amount)) + ' ' + escapeHtml(n.unit || '') + '</span></div>').join('') +
      '</div>';
  }

  function renderEditForm(item) {
    return '<h4>Quick edit</h4><p style="font-size:11.5px;color:var(--ink-mute);margin:0 0 10px;font-style:italic;">Updates name, dose, and notes only. For full nutrient + ingredient re-scan, click <strong>Full edit</strong> on the card &mdash; it jumps to Label Check with the form pre-populated.</p><div class="rg-edit-form">' +
      '<div><label>Name</label><input type="text" class="rg-ed-name" value="' + escapeHtml(item.name || '') + '"></div>' +
      '<div><label>Dose / serving</label><input type="text" class="rg-ed-dose" value="' + escapeHtml(item.dose_text || '') + '"></div>' +
      '<div class="span-2"><label>Notes</label><textarea class="rg-ed-notes" rows="2">' + escapeHtml(item.notes || '') + '</textarea></div>' +
      '</div>' +
      '<div class="rg-edit-actions">' +
      '  <button class="rg-cancel-btn">Cancel</button>' +
      '  <button class="rg-save-btn">Save changes</button>' +
      '</div>';
  }

  function renderOutcomeLog(item, entries) {
    return '<h4>Outcome log <span style="font-weight:400;color:var(--ink-faint);text-transform:none;letter-spacing:0;">(how it\'s going)</span></h4>' +
      '<div class="rg-outcome-log">' +
      (entries.length ? entries.slice().reverse().map(e => '<div class="rg-outcome-entry"><div class="when">' + escapeHtml(e.date) + '</div><div class="what">' + escapeHtml(e.note) + '</div></div>').join('') : '<div style="color:var(--ink-mute);font-size:12px;font-style:italic;padding:6px;">No entries yet.</div>') +
      '</div>' +
      '<div class="rg-outcome-add">' +
      '  <textarea class="rg-outcome-input" placeholder="How it\'s going — symptoms, changes, observations..."></textarea>' +
      '  <button class="rg-outcome-save">Log note</button>' +
      '</div>';
  }

  function bindRegimenCardActions() {
    document.querySelectorAll('#rg-grouped-container .rg-card').forEach(card => {
      const id = card.dataset.id;
      card.querySelector('.rg-toggle-expand').onclick = () => card.classList.toggle('expanded');
      card.querySelector('.rg-edit').onclick = () => {
        card.classList.add('expanded');
        // Scroll the edit form into view + focus the name input so it's distinct from Details (which just expands)
        const nameInput = card.querySelector('.rg-ed-name');
        if (nameInput) {
          setTimeout(() => {
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameInput.focus();
            nameInput.select();
          }, 80);
        }
      };
      const fullEditBtn = card.querySelector('.rg-edit-full');
      if (fullEditBtn) {
        fullEditBtn.onclick = () => {
          try { localStorage.setItem('lcEditTarget', id); } catch(e) {}
          if (typeof window.activateGroup === 'function') {
            window.activateGroup('labels');
          }
        };
      }
      card.querySelector('.rg-remove').onclick = async () => {
        const removed = loadRgRemoved();
        const isCurrentlyRemoved = removed.has(id);
        const ok = await showLcModal({
          title: isCurrentlyRemoved ? 'Restore item?' : 'Remove item?',
          titleSev: isCurrentlyRemoved ? 'info' : 'warn',
          icon: isCurrentlyRemoved ? '↺' : '◐',
          body: isCurrentlyRemoved ? 'Restore this item to your active regimen.' : 'Mark this item as no longer in your regimen. Original data is preserved — you can restore it later.',
          confirmText: isCurrentlyRemoved ? 'Restore' : 'Remove',
          cancelText: 'Cancel',
          confirmDanger: !isCurrentlyRemoved
        });
        if (!ok) return;
        if (isCurrentlyRemoved) removed.delete(id); else removed.add(id);
        saveRgRemoved(removed);
        renderRegimenTab();
      };
      card.querySelector('.rg-cancel-btn').onclick = () => card.classList.remove('expanded');
      card.querySelector('.rg-save-btn').onclick = () => {
        const name = card.querySelector('.rg-ed-name').value.trim();
        const dose = card.querySelector('.rg-ed-dose').value.trim();
        const notes = card.querySelector('.rg-ed-notes').value.trim();
        saveRgOverride(id, { name, dose_text: dose, notes });
        renderRegimenTab();
      };
      card.querySelector('.rg-outcome-save').onclick = () => {
        const input = card.querySelector('.rg-outcome-input');
        const note = input.value.trim();
        if (!note) return;
        const outcomes = loadRgOutcomes();
        if (!outcomes[id]) outcomes[id] = [];
        outcomes[id].push({ date: new Date().toISOString().slice(0, 10), note });
        saveRgOutcomes(outcomes);
        input.value = '';
        renderRegimenTab();
      };
    });
  }

  function initRegimenTab() {
    // Filter buttons
    document.querySelectorAll('.rg-filter-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.rg-filter-btn').forEach(b2 => b2.classList.remove('active'));
        b.classList.add('active');
        rgFilter = b.dataset.kind;
        renderRegimenTab();
      };
    });
    // Add form
    $('rg-add-btn').onclick = () => { $('rg-add-form').hidden = false; $('rg-new-name').focus(); };
    $('rg-add-cancel').onclick = () => { $('rg-add-form').hidden = true; clearAddForm(); };
    $('rg-add-save').onclick = () => {
      const name = $('rg-new-name').value.trim();
      if (!name) { alert('Please enter a name.'); $('rg-new-name').focus(); return; }
      const item = {
        id: 'man_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name,
        kind: $('rg-new-kind').value,
        source: 'manual',
        dose_text: $('rg-new-dose').value.trim() || '',
        category: $('rg-new-category').value.trim() || '',
        notes: $('rg-new-notes').value.trim() || '',
        nutrients: [],
        has_nutrient_data: false,
      };
      const manual = loadRgManual();
      manual.push(item);
      saveRgManual(manual);
      $('rg-add-form').hidden = true;
      clearAddForm();
      renderRegimenTab();
    };
    renderRegimenTab();
  }

  function clearAddForm() {
    ['rg-new-name','rg-new-dose','rg-new-category','rg-new-notes'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    $('rg-new-kind').value = 'supplement';
  }

  // ---- Edit-target integration (Regimen "Full edit" → Label Check) ----
  const LC_EDIT_TARGET_KEY = 'lcEditTarget';
  function lcGetEditTargetId() {
    try { return localStorage.getItem(LC_EDIT_TARGET_KEY) || ''; } catch(e) { return ''; }
  }
  function lcClearEditTarget() {
    try { localStorage.removeItem(LC_EDIT_TARGET_KEY); } catch(e) {}
  }
  function lcFindRegimenItem(id) {
    if (!id) return null;
    try {
      const items = (typeof getUnifiedRegimenItems === 'function') ? getUnifiedRegimenItems() : [];
      return items.find(it => String(it.id) === String(id)) || null;
    } catch(e) { return null; }
  }
  // Detect placeholder/approximate nutrient entries derived from Phase-11 self-heal (gap-fill summary).
  // These have form === 'from gap-fill summary' or unit === '% of Wallach target' and their amount is a percentage, not a real value.
  // Pre-populating the Label Check form with these produces wrong data — better to start empty and let auto-detect or manual entry provide real values.
  function lcNutrientLooksApproximate(n) {
    if (!n) return false;
    if ((n.form || '').toLowerCase().includes('gap-fill summary')) return true;
    if ((n.unit || '').toLowerCase().includes('% of wallach')) return true;
    return false;
  }
  function lcPopulateFormFromItem(item) {
    // Prefer a stashed full label (_lc_label) from a prior Full edit; otherwise reconstruct from item fields
    const stash = item._lc_label || {};
    $('lc-name').value = stash.name || item.name || '';
    $('lc-brand').value = stash.brand || item.brand || '';
    $('lc-category').value = stash.category || item.category || '';
    $('lc-container').value = stash.container || '';
    const servingsFromDose = (item.dose_text || '').match(/(\d+(?:\.\d+)?)/);
    $('lc-servings').value = stash.servings || (servingsFromDose ? servingsFromDose[1] : '1');
    // Decide what to populate first. Approximate-marker detection drives both nutrient suppression AND ingredient suppression —
    // when the original data on file came from Phase-11 self-heal (gap-fill summary), the user's intent is "start fresh".
    // We treat _lc_label as authoritative ONLY if its nutrients aren't approximate-marked too (covers the case where round-1
    // Full edit saved the placeholder values without manual correction).
    const stashIsApproximate = (stash.nutrients || []).some(lcNutrientLooksApproximate);
    const itemIsApproximate = (item.nutrients || []).some(lcNutrientLooksApproximate);
    const approximate = stashIsApproximate || itemIsApproximate;
    if (approximate) {
      // Start blank — user provides real values via auto-detect or manual entry
      $('lc-ingredients').value = '';
    } else {
      $('lc-ingredients').value = stash.ingredients || item.ingredients || '';
    }
    // Reset nutrient rows, then seed — but only with REAL data, not Phase-11 self-heal placeholders
    $('lc-nutrient-rows').innerHTML = '';
    let nuts;
    if (approximate) {
      nuts = [];
    } else if (stash.nutrients && stash.nutrients.length) {
      // _lc_label stash is real data from a prior Full edit
      nuts = stash.nutrients;
    } else {
      nuts = item.nutrients || [];
    }
    if (nuts.length) {
      nuts.forEach(n => addNutrientRow(
        n.name || '',
        (n.amount != null ? String(n.amount) : ''),
        n.unit || 'mg',
        n.form || '',
        n.form_alignment || n.alignment || 'unknown'
      ));
    } else {
      addNutrientRow();
    }
    // Annotate the edit banner with the approximate-data hint when applicable
    const labelHost = document.querySelector('#lc-edit-banner .lc-edit-label');
    if (labelHost) {
      labelHost.querySelectorAll('.lc-edit-hint').forEach(el => el.remove());
      if (approximate) {
        const hint = document.createElement('div');
        hint.className = 'lc-edit-hint';
        hint.textContent = 'Existing data on this item was approximate (derived from gap-fill summary, not a real label). Form starts blank so you can auto-detect or enter real values from the label.';
        labelHost.appendChild(hint);
      }
    }
    // Hide any prior result panel — user starts a fresh edit session
    $('lc-result-panel').hidden = true;
  }
  function lcExitEditMode(returnToRegimen) {
    lcClearEditTarget();
    const banner = $('lc-edit-banner');
    if (banner) {
      banner.classList.add('hidden');
      // Clean the approximate-data hint if it was appended
      banner.querySelectorAll('.lc-edit-hint').forEach(el => el.remove());
    }
    // Reset the form so re-entering Label Check is a clean slate.
    // Safe even when returnToRegimen navigates away — clear happens in the background and the user sees a fresh form next time they come back.
    if (typeof clearForm === 'function') clearForm();
    if (returnToRegimen && typeof window.activateGroup === 'function') {
      window.activateGroup('you', 'regimen');
    }
  }
  function lcSaveEditedItem() {
    const id = lcGetEditTargetId();
    if (!id) return;
    const label = gatherLabel();
    if (!label.name) { alert('Please enter a product name before saving.'); $('lc-name').focus(); return; }
    if (typeof saveRgOverride !== 'function') {
      alert('Save unavailable — regimen module not loaded.'); return;
    }
    const nutrientsForRegimen = label.nutrients.map(n => ({
      name: n.name, amount: n.amount, unit: n.unit, form: n.form, alignment: n.form_alignment
    }));
    saveRgOverride(id, {
      name: label.name,
      category: label.category,
      dose_text: (label.servings || 1) + ' serving(s)/day',
      nutrients: nutrientsForRegimen,
      has_nutrient_data: nutrientsForRegimen.length > 0,
      ingredients: label.ingredients,
      // Clear the Phase-11 self-heal "approximate" marker — this is now real data
      nutrient_note: '',
      _lc_label: label,
      _last_full_edit: new Date().toISOString().slice(0, 10)
    });
    if (typeof window.renderRegimenTab === 'function') window.renderRegimenTab();
    lcExitEditMode(true);
  }
  function lcHandleEditTarget() {
    const banner = $('lc-edit-banner');
    const nameEl = $('lc-edit-name');
    const backBtn = $('lc-edit-back-btn');
    const saveBtn = $('lc-edit-save-btn');
    if (!banner || !nameEl || !backBtn || !saveBtn) return;
    const id = lcGetEditTargetId();
    if (!id) { banner.classList.add('hidden'); return; }
    const item = lcFindRegimenItem(id);
    if (!item) {
      // Edit target stale — silently clear so we don't loop
      lcClearEditTarget();
      banner.classList.add('hidden');
      return;
    }
    nameEl.textContent = item.name || '(unnamed)';
    banner.classList.remove('hidden');
    lcPopulateFormFromItem(item);
    backBtn.onclick = () => lcExitEditMode(true);
    saveBtn.onclick = () => lcSaveEditedItem();
    // Bring banner into view so user knows they're in edit mode
    setTimeout(() => banner.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
  window.lcHandleEditTarget = lcHandleEditTarget;

  function init() {
    if (!$('lc-drop-zone')) return; // tab not present
    setupDropZone();
    addNutrientRow();
    // Wipe any state the browser restored from a previous session — autofill / form-state restoration can repopulate text inputs across refresh.
    // We want the Label Check form to be a clean slate on every page load. (Active edit-target persists via localStorage and re-engages when the labels tab is opened.)
    clearForm();
    $('lc-add-nutrient').addEventListener('click', () => addNutrientRow());
    $('lc-scan-btn').addEventListener('click', () => {
      const label = gatherLabel();
      if (!label.name) { alert('Please enter a product name.'); $('lc-name').focus(); return; }
      // No nutrient-rows required — scan can proceed on ingredients/goals/macros alone.
      // No ingredients required either — supplements with only nutrients are valid.
      // Sparse banners surface in the result panel and the regimen confirmation dialog.
      const result = scan(label);
      renderResult(result);
      setTimeout(() => $('lc-result-panel').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    $('lc-clear-btn').addEventListener('click', () => {
      // Clear preserves edit mode — user wants the form blank, banner stays visible so they can re-scan/re-enter then Save changes
      clearForm();
    });
    // Wire ingredients textarea to update suggestions in real-time (debounced)
    let helperTimeout;
    $('lc-ingredients').addEventListener('input', () => {
      clearTimeout(helperTimeout);
      helperTimeout = setTimeout(renderHelperPanel, 400);
    });
    seedIfEmpty();
    renderWishlist();
    renderRecent();
    // Initialize Regimen tab immediately on page load (don't wait for tab click)
    if (typeof initRegimenTab === 'function') {
      window.initRegimenTab = initRegimenTab;
      window.renderRegimenTab = renderRegimenTab;
      // Expose getUnifiedRegimenItems globally so the Periodic Table view (in a separate IIFE)
      // can compute live coverage. Without this, the periodic table falls back to empty items
      // and every tile reads as "gap".
      window.getUnifiedRegimenItems = getUnifiedRegimenItems;
      // Rebuild the essentials grid now that regimen data is accessible — the periodic table
      // may have rendered on DOMContentLoaded before this IIFE finished setting things up.
      if (typeof window.buildEssentialsGrid === 'function') {
        try { window.buildEssentialsGrid(); } catch(e) {}
      }
      initRegimenTab();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

