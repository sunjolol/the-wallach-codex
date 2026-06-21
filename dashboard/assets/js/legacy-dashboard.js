// ═══════════════════════════════════════════════════════════════════════════
// legacy-dashboard.js — parked legacy logic (Round 1·B extraction)
// ───────────────────────────────────────────────────────────────────────────
// Lifted VERBATIM from dashboard.html lines 4985–13874 (main JS) and
// 21866–21937 (creators-log handler IIFE) on 2026-06-21. Not one byte was
// altered. Every Round-archaeology comment, every §31 chokepoint, every
// state mutation lives exactly as it did before the extraction.
//
// MIGRATION STATUS: this file shrinks each subsequent round as chokepoints
// move out of here and into their proper modules under assets/js/src/.
//   Round 2 → coverage logic migrates to state/coverage.ts + views/coverage.ts
//   Round 3 → regimen logic migrates to state/regimen.ts + views/regimen.ts
//   Round 4 → scanner logic migrates to state/scanner.ts + views/scanner.ts
//   Round 5 → drawers + palette + creators-log handler migrate; this file is
//             deleted entirely.
//
// While this file exists, the slim new dashboard.html still loads it (as a
// classic non-module script, so the IIFE structure works exactly as before).
// ═══════════════════════════════════════════════════════════════════════════

// ─── Block A · Main dashboard JS (was dashboard.html lines 4985–13874) ───
// ───────────────────────────────────────────────────────────────────────────
  // localStorage migration framework (P2.3 / Round 54 — doctrine §4 + §9)
  // ───────────────────────────────────────────────────────────────────────────
  // Centralized versioned-schema layer for every localStorage key in this
  // dashboard. All localStorage access MUST go through lsRead / lsWrite /
  // lsRemove. Direct localStorage.* calls outside this block are forbidden
  // (audited by tools/dashboard_integrity.py check_no_direct_ls).
  //
  // Schema registration: every key declares its type ('json' for objects/arrays,
  // 'raw' for plain strings). Adding a new localStorage key without registering
  // it here triggers a console warning at first access.
  //
  // Migrations: when a schema needs to evolve, add an entry to LS_MIGRATIONS
  // with {from, to, migrate}. On read of the new key, the framework checks for
  // the old key, runs the migrator, writes the new shape, deletes the old.
  // This is the structural promise from open-threads P2.3: months of accumulated
  // user data (regimens, wishlists, outcomes) survive schema evolution without
  // silent data loss.
  const LS_SCHEMAS = {
    'lcRegimen_v1':     { type: 'json' },
    'lcWishlist_v1':    { type: 'json' },
    'lcRecentScans_v1': { type: 'json' },
    'rgOverrides_v1':   { type: 'json' },
    'rgManualItems_v1': { type: 'json' },
    'rgRemoved_v1':     { type: 'json' },
    'rgOutcomes_v1':    { type: 'json' },
    'rgUserGoals_v1':   { type: 'json' },  // Round 156 follow-up — user-selected goals via goal-picker UI
    'edenResetCompleted_v1': { type: 'raw' },  // Round 157 / Eden — one-time reset migration guard flag
    'dashboardBg':      { type: 'raw' },
    'lcEditTarget':     { type: 'raw' },
    // Round 126 — Pass F save-cartridge slot persistence. (Deprecated as of
    // Round 130a. Round 130a collapsed 4 keys → 1 key for atomic writes.
    // These four keys remain registered ONLY so the Round 130a migration can
    // read them, then they're wiped. Reads/writes during normal operation
    // go through rgSaveSystem exclusively.)
    'rgSlot1':          { type: 'json' },
    'rgSlot2':          { type: 'json' },
    'rgSlot3':          { type: 'json' },
    'rgSlotMeta':       { type: 'json' },
    // Round 130a — Save System single source of truth. Holds slots + trash +
    // recents + integrity field in one atomic blob. See SAVE_SYSTEM_VERSION
    // + the Save System module below for the schema.
    'rgSaveSystem':     { type: 'json' }
  };
  const LS_MIGRATIONS = [];

  function lsRead(key, defaultValue) {
    const schema = LS_SCHEMAS[key];
    if (!schema) {
      console.warn('[ls] read of unregistered key:', key);
      return defaultValue;
    }
    for (const m of LS_MIGRATIONS) {
      if (m.to === key && localStorage.getItem(key) === null) {
        const old = localStorage.getItem(m.from);
        if (old !== null) {
          try {
            const fromSchema = LS_SCHEMAS[m.from];
            const oldData = (fromSchema && fromSchema.type === 'raw') ? old : JSON.parse(old);
            const newData = m.migrate(oldData);
            if (schema.type === 'raw') localStorage.setItem(key, String(newData));
            else localStorage.setItem(key, JSON.stringify(newData));
            localStorage.removeItem(m.from);
          } catch (e) {
            console.error('[ls] migration ' + m.from + ' -> ' + m.to + ' failed:', e);
          }
        }
      }
    }
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    if (schema.type === 'raw') return raw;
    try { return JSON.parse(raw); }
    catch (e) {
      console.warn('[ls] parse error for ' + key + ':', e);
      return defaultValue;
    }
  }

  function lsWrite(key, value) {
    const schema = LS_SCHEMAS[key];
    if (!schema) {
      console.warn('[ls] write to unregistered key:', key);
      return false;
    }
    try {
      if (schema.type === 'raw') localStorage.setItem(key, String(value));
      else localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[ls] write failed for ' + key + ':', e);
      return false;
    }
  }

  function lsRemove(key) {
    if (!LS_SCHEMAS[key]) console.warn('[ls] remove of unregistered key:', key);
    try { localStorage.removeItem(key); } catch (e) { console.warn('[ls] remove failed:', e); }
  }

  window.lsRead = lsRead;
  window.lsWrite = lsWrite;
  window.lsRemove = lsRemove;

  // Delegated listener for the data-open-on-click pattern (CSP-friendly replacement
  // for the previous inline onclick on the OCR-source-image preview).
  document.addEventListener('click', function(e) {
    const el = e.target;
    if (el && el.tagName === 'IMG' && el.dataset && el.dataset.openOnClick === 'true' && el.src) {
      window.open(el.src, '_blank');
    }
  });

  // ── User data export (P4.10 / Round 58 — doctrine §9 reversibility / portability)
  // ─────────────────────────────────────────────────────────────────────────────
  // The user owns their data. Click → bundle every LS_SCHEMAS-registered key
  // into a JSON file → download. Schema version stamped per key + an export
  // metadata block. Companion to the migration framework (Round 54): future
  // versions of the dashboard can import these bundles and migrate forward.
  function buildDataExport() {
    const bundle = {
      _export: {
        app: 'Wallach-Framework Dashboard',
        exported_at: new Date().toISOString(),
        exported_at_local: new Date().toString(),
        format: 'wallach-dashboard-export-v1',
        // Round 138 (Phase 3 of vision-default-regimen.md) — cart-as-share-primitive:
        // `creator` and `description` are populated by the Export modal so a
        // shared regimen carries author + pitch text into the importer's preview.
        // Reserved keys (`license`, `price`, `attribution_url`, `signature`) stay
        // unwritten in v1 — the importer tolerates them but the exporter does
        // not synthesize them yet. The "leave-room-without-shipping" discipline.
        creator: null,
        description: null,
      },
      versions: null,
      keys: {},
    };
    // Pull versions for cross-reference at import time
    try {
      const vd = document.getElementById('versions-data');
      if (vd) bundle.versions = JSON.parse(vd.textContent);
    } catch (_) {}
    // Every registered schema key — except Pass F slot persistence keys.
    // Slot keys (rgSlot1/2/3 + rgSlotMeta) are EXCLUDED to prevent recursive
    // bundle-inside-bundle. Slots hold their OWN export bundles; exporting the
    // current state shouldn't pull in all the save slots too. (Round 126.)
    const PASS_F_SLOT_KEYS_LOCAL = ['rgSlot1', 'rgSlot2', 'rgSlot3', 'rgSlotMeta', 'rgSaveSystem'];
    for (const key of Object.keys(LS_SCHEMAS)) {
      if (PASS_F_SLOT_KEYS_LOCAL.indexOf(key) !== -1) continue;
      try {
        const value = lsRead(key, null);
        bundle.keys[key] = {
          type: LS_SCHEMAS[key].type,
          value,
          schema_version: 1, // bump at migration time
        };
      } catch (e) {
        bundle.keys[key] = { error: String(e) };
      }
    }
    return bundle;
  }

  function downloadDataExport() {
    const bundle = buildDataExport();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    a.download = 'wallach-dashboard-export-' + ts + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // Wire the Export button (DOMContentLoaded for safety; the button is in the
  // Regimen panel which renders at initial load).
  function wireExportButton() {
    const btn = document.getElementById('rg-export-btn');
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1';
      btn.addEventListener('click', downloadDataExport);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireExportButton);
  } else {
    wireExportButton();
  }
  window.downloadDataExport = downloadDataExport;
  window.buildDataExport = buildDataExport;
  // ───────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // Round 126 — Pass F save-cartridge feature
  // ───────────────────────────────────────────────────────────────────────────
  //
  // Round 58 shipped buildDataExport() + downloadDataExport() — only the
  // EXPORT half. Pass F adds the IMPORT half, in-app save slots, and the
  // shareable .cart file flow. Design commitments per
  // memory/vision-pass-f-save-cartridge.md + 2026-06-18 user direction:
  //   - 3 save slots (Gameboy-honest)
  //   - Accept both .cart and .json; save as .cart
  //   - Replace as default merge strategy; clear count comparison in modal
  //   - Forever-compat via LS_MIGRATIONS chain
  //   - Forward-only cross-version (refuse newer-than-current with clear msg)
  //   - Share-safe export mode deferred to Pass F.1
  //   - Wishlist included by default with per-section opt-out
  //
  // The slot data shape mirrors buildDataExport's wire format. Each slot
  // stores its own bundle; saving captures current state INTO the slot,
  // loading APPLIES the slot's state back via applyImportBundle.

  const PASS_F_SLOT_KEYS = ['rgSlot1', 'rgSlot2', 'rgSlot3', 'rgSlotMeta', 'rgSaveSystem'];

  // Round 128 — 8-color accent palette. Round 126's hardcoded "slot 1 = teal /
  // slot 2 = coral / slot 3 = periwinkle" was mockup-fakery (no system substrate
  // — the color depended on slot index, not on a real user choice). Now: 8 named
  // palettes, user picks at save time, falls back to a rotation (slot N → palette
  // N mod 8) only if no choice has been made. Each palette is keyed by `name`
  // and the render reads meta.slotN.accent (string name) to look up the colors.
  const SLOT_PALETTES = {
    teal:       { fg: '#0F6E56', mid: '#1d9e75', soft: '#9FE1CB', mist: '#E1F5EE', label: 'Teal' },
    coral:      { fg: '#993C1D', mid: '#d85a30', soft: '#F0997B', mist: '#FAECE7', label: 'Coral' },
    periwinkle: { fg: '#3C3489', mid: '#7F77DD', soft: '#AFA9EC', mist: '#EEEDFE', label: 'Periwinkle' },
    amber:      { fg: '#854F0B', mid: '#d97706', soft: '#fcd34d', mist: '#fef3c7', label: 'Amber' },
    sage:       { fg: '#3B6D11', mid: '#639922', soft: '#C0DD97', mist: '#EAF3DE', label: 'Sage' },
    wine:       { fg: '#72243E', mid: '#b91c5c', soft: '#f9a8d4', mist: '#fce7f3', label: 'Wine' },
    slate:      { fg: '#1f2937', mid: '#475569', soft: '#cbd5e1', mist: '#f1f5f9', label: 'Slate' },
    indigo:     { fg: '#312e81', mid: '#4f46e5', soft: '#a5b4fc', mist: '#e0e7ff', label: 'Indigo' }
  };
  const PALETTE_ORDER = ['teal','coral','periwinkle','amber','sage','wine','slate','indigo'];
  function getPalette(name) { return SLOT_PALETTES[name] || SLOT_PALETTES.teal; }
  function defaultAccentForSlot(n) { return PALETTE_ORDER[(n - 1) % PALETTE_ORDER.length]; }

  // Backwards-compat shim — anywhere old code does SLOT_ACCENTS[n], map n to the
  // default palette. Once we re-render, the user's choice (meta.slotN.accent)
  // takes over.
  const SLOT_ACCENTS = {
    1: Object.assign({ name: 'teal' },       SLOT_PALETTES.teal),
    2: Object.assign({ name: 'coral' },      SLOT_PALETTES.coral),
    3: Object.assign({ name: 'periwinkle' }, SLOT_PALETTES.periwinkle)
  };

  // 25-icon registry — grouped by category for the picker's visual grouping
  // (each group gets a tinted card background in the picker). Per-icon path
  // strings live here so the picker and the slot render share one source.
  const ICON_REGISTRY = [
    // Energetic / activation
    { name: 'bolt',      group: 'energetic', label: 'Energy' },
    { name: 'sun',       group: 'energetic', label: 'Morning' },
    { name: 'flame',     group: 'energetic', label: 'Metabolism' },
    { name: 'dumbbell',  group: 'energetic', label: 'Strength' },
    { name: 'coffee',    group: 'energetic', label: 'Caffeine' },
    // Calming / restorative
    { name: 'moon',      group: 'calming',   label: 'Sleep' },
    { name: 'droplet',   group: 'calming',   label: 'Hydration' },
    { name: 'leaf',      group: 'calming',   label: 'Botanical' },
    { name: 'flower',    group: 'calming',   label: 'Beauty' },
    { name: 'snowflake', group: 'calming',   label: 'Cleanse' },
    // Focus / cognitive
    { name: 'brain',     group: 'focus',     label: 'Cognition' },
    { name: 'target',    group: 'focus',     label: 'Focus' },
    { name: 'eye',       group: 'focus',     label: 'Vision' },
    { name: 'compass',   group: 'focus',     label: 'Strategy' },
    { name: 'crystal',   group: 'focus',     label: 'Clarity' },
    // Structural / protective
    { name: 'bone',      group: 'structural',label: 'Skeletal' },
    { name: 'heart',     group: 'structural',label: 'Cardio' },
    { name: 'shield',    group: 'structural',label: 'Immune' },
    { name: 'mountain',  group: 'structural',label: 'Endurance' },
    { name: 'infinity',  group: 'structural',label: 'Longevity' },
    // Daily / general
    { name: 'pill',      group: 'daily',     label: 'Supplements' },
    { name: 'atom',      group: 'daily',     label: 'Essentials' },
    { name: 'flask',     group: 'daily',     label: 'Formula' },
    { name: 'sparkles',  group: 'daily',     label: 'Special' },
    { name: 'luggage',   group: 'daily',     label: 'Travel' }
  ];
  // Subtle background tints per icon group — quiet category personality without
  // overwhelming variety. Each group's tint reads from the SLOT_PALETTES so the
  // language stays consistent.
  const ICON_GROUP_TINTS = {
    energetic:  { bg: '#fdf2d6', fg: '#854F0B' },
    calming:    { bg: '#dcf2eb', fg: '#0F6E56' },
    focus:      { bg: '#e8e5fb', fg: '#3C3489' },
    structural: { bg: '#e3e8f0', fg: '#1f2937' },
    daily:      { bg: '#f5efe3', fg: '#5C4423' }
  };

  // Extension to iconSVG — adds the new icons Round 128 needs (bolt, moon,
  // flame, etc.). The original iconSVG closure can't be extended in-place from
  // this code position, so we wrap it with an extended palette here.
  const ICON_PATHS_EXT = {
    bolt:      '<path d="M13 3 L4 14 L11 14 L11 21 L20 10 L13 10 Z"/>',
    flame:     '<path d="M12 2c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7c0 2 1 3 3 3c0-3-1-5 0-7z"/>',
    dumbbell:  '<rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="5" y="11" width="2" height="2"/><rect x="17" y="11" width="2" height="2"/><rect x="7" y="10" width="10" height="4" rx="1"/>',
    coffee:    '<path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 4c0 1 1 1 1 2M11 4c0 1 1 1 1 2"/>',
    moon:      '<path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z"/>',
    droplet:   '<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z"/>',
    leaf:      '<path d="M3 21c0-8 7-15 18-18c-1 9-5 18-15 18zM3 21c5-5 9-8 15-10"/>',
    flower:    '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V4M12 14.5V20M9.5 12H4M14.5 12H20M9.5 9.5L6 6M14.5 9.5L18 6M9.5 14.5L6 18M14.5 14.5L18 18"/>',
    snowflake: '<path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93M9 5l3 3 3-3M9 19l3-3 3 3M5 9l3 3-3 3M19 9l-3 3 3 3"/>',
    brain:     '<path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 3v2a3 3 0 0 0 2 3v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2a3 3 0 0 0 2-3v-2a3 3 0 0 0-2-3V6a3 3 0 0 0-3-3H9z"/><path d="M9 9c1 1 3 1 3 0M12 9c0 1 2 1 3 0M12 3v18"/>',
    eye:       '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    compass:   '<circle cx="12" cy="12" r="9"/><path d="M16 8l-3 5-5 3 3-5z"/>',
    crystal:   '<path d="M12 2 L20 9 L12 22 L4 9 Z"/><path d="M4 9h16M12 2v20"/>',
    bone:      '<path d="M5 5a2 2 0 0 1 4 0a2 2 0 0 0 2 2l6 6a2 2 0 0 0 2 2a2 2 0 0 1 0 4a2 2 0 0 1-4 0a2 2 0 0 0-2-2l-6-6a2 2 0 0 0-2-2a2 2 0 0 1 0-4z"/>',
    heart:     '<path d="M12 21s-8-5-8-12a5 5 0 0 1 9-3a5 5 0 0 1 9 3c0 7-8 12-8 12z" stroke-linejoin="round"/>',
    shield:    '<path d="M12 2l8 4v7c0 5-4 8-8 9c-4-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    mountain:  '<path d="M3 20l6-12 4 7 3-5 5 10z"/>',
    infinity:  '<path d="M8 12c0-3 2-5 4-5s4 2 4 5s2 5 4 5s4-2 4-5s-2-5-4-5s-4 2-4 5s-2 5-4 5s-4-2-4-5s2-5 4-5"/>',
    flask:     '<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/><path d="M7 14h10"/>',
    sparkles:  '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l0.7 2.1L22 17l-2.3 0.9L19 20l-0.7-2.1L16 17l2.3-0.9z"/><path d="M5 17l0.5 1.5L7 19l-1.5 0.5L5 21l-0.5-1.5L3 19l1.5-0.5z"/>'
  };
  // Override iconSVG to also handle the new icons — falls through to the
  // original for legacy names (download/upload/copy/etc.).
  const __iconSVG_inner = iconSVG;
  iconSVG = function(name) {
    if (ICON_PATHS_EXT[name]) {
      return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-0.15em;display:inline-block;flex-shrink:0;pointer-events:none;">' + ICON_PATHS_EXT[name] + '</svg>';
    }
    return __iconSVG_inner(name);
  };
  window.iconSVG = iconSVG;
  window.SLOT_PALETTES = SLOT_PALETTES;
  window.ICON_REGISTRY = ICON_REGISTRY;
  window.getPalette = getPalette;

  const PASS_F_FORMAT_VERSION = 'wallach-dashboard-export-v1';

  function parseImportBundle(text) {
    let bundle;
    try {
      bundle = JSON.parse(text);
    } catch (e) {
      throw new Error('This file is not valid JSON. (' + e.message + ')');
    }
    if (!bundle || !bundle._export || !bundle._export.format) {
      throw new Error('This file is not a Wallach dashboard cartridge — missing _export.format header.');
    }
    if (bundle._export.format !== PASS_F_FORMAT_VERSION) {
      throw new Error("This cartridge is in format '" + bundle._export.format + "' but this dashboard reads '" + PASS_F_FORMAT_VERSION + "'. Newer cartridges need an updated dashboard.");
    }
    if (!bundle.keys || typeof bundle.keys !== 'object') {
      throw new Error('This cartridge is missing the keys block — corrupt or partial export.');
    }
    // Round 138 (Phase 3 of vision-default-regimen.md) — leave-room-without-shipping
    // discipline. Tolerated top-level fields (not validated here, not consumed
    // by the importer yet, preserved on the returned bundle for any downstream
    // surface that wants them):
    //   _export.creator       — author of a shared cart (Round 138)
    //   _export.description   — author's pitch / intent (Round 138)
    //   _export.license       — reserved for future share/monetize
    //   _export.price         — reserved for future share/monetize
    //   _export.attribution_url — reserved for future share/monetize
    //   _export.signature     — reserved for future cart-integrity attestation
    // Unknown fields beyond these are also silently preserved; importer never
    // errors on extras. The format-version gate above is the only hard contract.
    return bundle;
  }

  // Round 138 (Phase 3 of vision-default-regimen.md) — provenance stamping +
  // legacy backfill at import time.
  //
  // Rule: if the incoming bundle's `_export.creator` is non-empty, the cart is
  // somebody else's published regimen. All imported items get stamped with
  // `provenance: 'imported_cart'` + `original_creator: <that creator>` so the
  // attribution survives across import/re-export cycles.
  //
  // If `_export.creator` is empty/null (self-export backup OR pre-Round-138
  // legacy cart that predates the field), each item keeps its existing
  // provenance. Items WITHOUT provenance (legacy, pre-Round 134) get backfilled
  // to `provenance: 'user_manual'` as the conservative best-guess default per
  // vision-default-regimen.md Round 134 addendum.
  function _stampImportedProvenance(key, value, originalCreator) {
    const isThirdParty = !!(originalCreator && String(originalCreator).trim());
    function stamp(item) {
      if (!item || typeof item !== 'object') return item;
      if (isThirdParty) {
        // Third-party cart: override provenance regardless of prior value.
        return Object.assign({}, item, {
          provenance: 'imported_cart',
          original_creator: String(originalCreator).trim()
        });
      }
      // Self-import: keep existing provenance OR backfill to user_manual.
      if (item.provenance && typeof item.provenance === 'string') return item;
      return Object.assign({}, item, { provenance: 'user_manual' });
    }
    if (key === 'lcRegimen_v1') {
      if (!value || typeof value !== 'object') return value;
      const items = Array.isArray(value.items) ? value.items.map(stamp) : value.items;
      return Object.assign({}, value, { items: items });
    }
    if (key === 'rgManualItems_v1') {
      if (!Array.isArray(value)) return value;
      return value.map(stamp);
    }
    // Other keys: no item-shape, no stamping.
    return value;
  }

  function applyImportBundle(bundle, strategy) {
    strategy = strategy || 'replace';
    if (strategy !== 'replace' && strategy !== 'merge') {
      throw new Error('Unknown apply strategy: ' + strategy);
    }
    const result = { ok: 0, fail: 0, skipped: 0 };
    // Round 138 — extract creator for provenance stamping. Top-level reserved
    // keys (`license`, `price`, `attribution_url`, `signature`) are silently
    // tolerated on import (we never read them yet) — leave-room-without-shipping.
    const originalCreator = (bundle && bundle._export && bundle._export.creator) || null;
    for (const key of Object.keys(bundle.keys)) {
      if (PASS_F_SLOT_KEYS.indexOf(key) !== -1) { result.skipped++; continue; }
      if (!LS_SCHEMAS[key]) { result.skipped++; continue; }
      const entry = bundle.keys[key];
      if (!entry || typeof entry !== 'object' || entry.error) { result.skipped++; continue; }
      try {
        const stampedValue = _stampImportedProvenance(key, entry.value, originalCreator);
        if (strategy === 'replace') {
          lsWrite(key, stampedValue);
        } else {
          const current = lsRead(key, null);
          lsWrite(key, mergeBundleEntry(current, stampedValue));
        }
        result.ok++;
      } catch (e) {
        result.fail++;
      }
    }
    return result;
  }

  function mergeBundleEntry(current, incoming) {
    if (Array.isArray(current) && Array.isArray(incoming)) {
      const seen = new Set(current.map(x => x && x.id).filter(Boolean));
      return current.concat(incoming.filter(x => x && x.id && !seen.has(x.id)));
    }
    if (current && typeof current === 'object' && incoming && typeof incoming === 'object') {
      return Object.assign({}, current, incoming);
    }
    return incoming !== undefined ? incoming : current;
  }

  function computeSlotStats(bundle) {
    // Round 135 — full merge mirror of getUnifiedRegimenItems so adopted
    // recommendations get counted in slot stats.
    //
    // Prior bug (Rounds 126/128): computeSlotStats read only lcRegimen_v1 +
    // rgManualItems_v1, missing the two big layers — REGIMEN_BASE_DATA items
    // (where the recommendations live) and rgOverrides_v1 (where adoption
    // stamps kind:'supplement' + _adopted_at). Slot card stats stayed stale
    // when users adopted; essentialsCovered stayed at 0 for the same reason.
    //
    // Fix: mirror getUnifiedRegimenItems exactly — BASE_DATA + label-scanned
    // regimen + manual, all with overrides applied and removed-set filtered.
    // Then count active items only (kind === 'recommended' is NOT active —
    // those are surfaced for Adopt but don't contribute to live coverage).
    const keys = bundle.keys || {};
    const overridesEntry = keys['rgOverrides_v1'] && keys['rgOverrides_v1'].value;
    const overrides = (overridesEntry && typeof overridesEntry === 'object' && !Array.isArray(overridesEntry)) ? overridesEntry : {};
    const removedEntry = keys['rgRemoved_v1'] && keys['rgRemoved_v1'].value;
    const removedSet = new Set(Array.isArray(removedEntry) ? removedEntry : []);
    const regEntry = keys['lcRegimen_v1'] && keys['lcRegimen_v1'].value;
    const labelReg = (regEntry && Array.isArray(regEntry.items)) ? regEntry.items : [];
    const manEntry = keys['rgManualItems_v1'] && keys['rgManualItems_v1'].value;
    const manualItems = Array.isArray(manEntry) ? manEntry : [];

    const merged = [];

    // Layer 1: BASE_DATA (supplements + diet) + EFFECTIVE recommended with overrides applied.
    // Round 149 fix: mirror getUnifiedRegimenItems' Round 141 effective-recommended layer.
    // Prior bug: used REGIMEN_BASE_DATA.recommended (HBSP trio) directly while
    // getUnifiedRegimenItems used getEffectiveRecommendedItems (goal-driven for users
    // with goals). Adopting a goal-driven item wrote rgOverrides keyed by the
    // goal-driven ID; computeSlotStats iterated over HBSP IDs and found no matching
    // override, leaving them all as kind='recommended' → filtered to 0 supplements.
    try {
      // Cross-IIFE: REGIMEN_BASE_DATA lives in the Label Check IIFE; the
      // Label Check init exposes it on window for us. Falls back to empty if
      // the Label Check IIFE hasn't fired yet (early load-time race).
      const base = (typeof window !== 'undefined' && window.REGIMEN_BASE_DATA && typeof window.REGIMEN_BASE_DATA === 'object') ? window.REGIMEN_BASE_DATA : { supplements: [], diet: [], recommended: [] };

      // Build stack-names set for the goal-driven engine's de-dup (matches
      // getUnifiedRegimenItems' construction at line ~11580). Read from this
      // bundle's snapshot of lcRegimen + manualItems + BASE supps/diet.
      const _stackNames = new Set();
      (Array.isArray(base.supplements) ? base.supplements : []).forEach(b => { if (b && b.name) _stackNames.add(b.name); });
      (Array.isArray(base.diet) ? base.diet : []).forEach(b => { if (b && b.name) _stackNames.add(b.name); });
      labelReg.forEach(r => { const n = (r && r.label && r.label.name); if (n) _stackNames.add(n); });
      manualItems.forEach(it => { const n = (it && it.label && it.label.name) || (it && it.name); if (n) _stackNames.add(n); });

      // Effective recommended: goal-driven when goals exist + engine produces items,
      // HBSP trio fallback otherwise. Mirrors getEffectiveRecommendedItems.
      const _effectiveRec = (typeof window !== 'undefined' && typeof window.getEffectiveRecommendedItems === 'function')
        ? window.getEffectiveRecommendedItems(_stackNames)
        : (Array.isArray(base.recommended) ? base.recommended : []);

      const baseItems = []
        .concat(Array.isArray(base.supplements) ? base.supplements : [])
        .concat(Array.isArray(base.diet) ? base.diet : [])
        .concat(Array.isArray(_effectiveRec) ? _effectiveRec : []);
      const _slotSeenIds = new Set();
      for (const b of baseItems) {
        if (!b || !b.id) continue;
        if (removedSet.has(b.id)) continue;
        merged.push(Object.assign({}, b, overrides[b.id] || {}));
        _slotSeenIds.add(b.id);
      }
      // Round 156 follow-up #5 + #9 — orphan-adopted reconciliation, gated
      // on kind='supplement' (same fix as getUnifiedRegimenItems). Mirrors
      // the regimen-render path so slot stats count the same items.
      for (const oid of Object.keys(overrides)) {
        if (_slotSeenIds.has(oid)) continue;
        const ov = overrides[oid];
        if (!ov || !ov._adopted_snapshot) continue;
        if (ov.kind !== 'supplement') continue;  // gate per #9
        if (removedSet.has(oid)) continue;
        const reconstructed = Object.assign({}, ov._adopted_snapshot, ov);
        reconstructed.id = oid;
        merged.push(reconstructed);
      }
    } catch (_) {}

    // Layer 2: label-scanned regimen items (lcRegimen_v1) — kind defaults to 'label' (treat as supplement unless overridden)
    for (const r of labelReg) {
      const baseId = 'lbl_' + (r.id || (r.label && r.label.name) || 'unknown');
      if (removedSet.has(baseId)) continue;
      const item = {
        id: baseId,
        name: (r.label && r.label.name) || 'Unnamed',
        kind: 'label',
        nutrients: (r.label && r.label.nutrients) || []
      };
      merged.push(Object.assign(item, overrides[baseId] || {}));
    }

    // Layer 3: manual items (rgManualItems_v1)
    for (const m of manualItems) {
      if (!m || !m.id) continue;
      if (removedSet.has(m.id)) continue;
      merged.push(Object.assign({}, m, overrides[m.id] || {}));
    }

    // Count by post-override kind. Active = supplement | diet | food | label.
    // 'recommended' is NOT active (recommendation surface only).
    let supplements = 0, foods = 0;
    const active = [];
    for (const it of merged) {
      if (!it || typeof it !== 'object') continue;
      const kind = String(it.kind || '').toLowerCase();
      if (kind === 'recommended') continue;  // surfaced for Adopt, not active
      if (kind === 'diet' || kind === 'food') { foods++; active.push(it); continue; }
      // supplement | label | anything-else-defined → supplement column
      supplements++;
      active.push(it);
    }

    // Essentials coverage: unique essentials the ACTIVE items meaningfully
    // contribute to. Uses getItemEssentialContributions if exposed; falls back
    // to 0 if the helper isn't ready (early init race tolerated by doctrine §7).
    let essentialsCovered = 0;
    try {
      if (typeof window.getItemEssentialContributions === 'function') {
        const seen = new Set();
        for (const it of active) {
          try {
            const contribs = window.getItemEssentialContributions(it);
            if (Array.isArray(contribs)) {
              for (const c of contribs) {
                // Round 156 follow-up — accept both `.name` (the actual
                // shape getItemEssentialContributions returns; line ~11174)
                // and `.essentialName` (legacy field name; kept for
                // backward compatibility) and bare strings. Prior bug: only
                // `.essentialName` was checked; the function returns `.name`
                // so nothing accumulated. Slot card stayed 0/92 even with
                // real per-card contributions visible.
                const key = c && (c.name || c.essentialName);
                if (key) seen.add(key);
                else if (typeof c === 'string') seen.add(c);
              }
            }
          } catch (_) {}
        }
        essentialsCovered = seen.size;
      }
    } catch (_) {}

    return { supplements: supplements, foods: foods, essentialsCovered: essentialsCovered, essentialsTotal: 92 };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Round 130a — Save System: single source of truth + atomic writes.
  // ────────────────────────────────────────────────────────────────────────
  //
  // Replaces the Round 126 model (4 separate localStorage keys with
  // non-atomic writes) with one canonical blob:
  //
  //   {
  //     version: 1,
  //     slots: { "1": {data, meta}|null, "2": ..., "3": ... },
  //     currentSlot: 1|2|3|null,
  //     trash: [ { data, meta, deletedAt, originalSlot, trashId } ],
  //     recents: [ { action, slotN, label, ts } ],
  //     integrity: { lastSavedAt, lastSavedChecksum }
  //   }
  //
  // All reads/writes go through loadSystem()/persistSystem(). Single key
  // = atomic localStorage.setItem guarantees no desync between data + meta.
  // Auto-migrates Round 126's 4-key shape on first load.
  //
  // Trash: FIFO up to 20 entries. New deletions push out the oldest. Trash
  // is hidden from primary UI; accessible via the Recovery Vault (Round 130b).
  // Recents: append-only audit log of last 10 substantive actions.
  // Integrity: 32-bit fold checksum of the slots block — sync, fast, detects
  // corruption (not under attack — this is closed-system within the browser).

  const SAVE_SYSTEM_VERSION = 1;
  const TRASH_MAX = 20;
  const RECENTS_MAX = 10;
  const SAVE_SYSTEM_KEY = 'rgSaveSystem';

  function defaultSystem() {
    return {
      version: SAVE_SYSTEM_VERSION,
      slots: { '1': null, '2': null, '3': null },
      currentSlot: null,
      trash: [],
      recents: [],
      integrity: { lastSavedAt: null, lastSavedChecksum: null }
    };
  }

  // Simple 32-bit fold — detection not security. Sync, fast.
  function ckSum32(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;  // unsigned
  }

  function validateSystemShape(sys) {
    if (!sys || typeof sys !== 'object') return false;
    if (typeof sys.version !== 'number') return false;
    if (!sys.slots || typeof sys.slots !== 'object') return false;
    if (!Array.isArray(sys.trash)) return false;
    if (!Array.isArray(sys.recents)) return false;
    return true;
  }

  // Migration: Round 126 keys → Round 130a system blob. Detects the old
  // shape by checking for rgSlotMeta existence; reads the four old keys,
  // assembles the new shape, persists it, then wipes the old keys.
  function migrateLegacyIfPresent() {
    let migrated = false;
    let legacyMeta = null;
    try { legacyMeta = lsRead('rgSlotMeta', null); } catch (_) {}
    if (!legacyMeta) return false;

    const sys = defaultSystem();
    sys.currentSlot = (typeof legacyMeta.currentSlot === 'number') ? legacyMeta.currentSlot : null;

    for (let n = 1; n <= 3; n++) {
      const slotMeta = legacyMeta['slot' + n];
      if (!slotMeta) continue;
      let data = null;
      try { data = lsRead('rgSlot' + n, null); } catch (_) {}
      if (!data) continue;
      sys.slots[String(n)] = {
        data: data,
        meta: {
          label: slotMeta.label || 'Slot ' + n,
          lastEdited: slotMeta.lastEdited || new Date().toISOString(),
          iconName: slotMeta.iconName || null,
          accent: slotMeta.accent || defaultAccentForSlot(n),
          stats: slotMeta.stats || { supplements: 0, foods: 0, essentialsCovered: 0, essentialsTotal: 92 }
        }
      };
      migrated = true;
    }
    sys.recents.push({ action: 'migrate-from-r126', slotN: null, label: null, ts: new Date().toISOString() });
    persistSystem(sys);

    // Wipe legacy keys atomically AFTER successful persist
    try { lsRemove('rgSlot1'); } catch (_) {}
    try { lsRemove('rgSlot2'); } catch (_) {}
    try { lsRemove('rgSlot3'); } catch (_) {}
    try { lsRemove('rgSlotMeta'); } catch (_) {}
    return migrated;
  }

  function loadSystem() {
    let raw = null;
    try { raw = lsRead(SAVE_SYSTEM_KEY, null); } catch (_) {}
    if (raw && validateSystemShape(raw)) {
      // Optional integrity check — non-blocking
      try {
        if (raw.integrity && raw.integrity.lastSavedChecksum != null) {
          const expected = raw.integrity.lastSavedChecksum;
          const actual = ckSum32(JSON.stringify(raw.slots));
          if (expected !== actual) {
            console.warn('[saveSystem] checksum mismatch — slots block may be corrupted. expected=' + expected + ' actual=' + actual);
            // Don't refuse to load — surface as warning; future Round 130c surfaces this to the user
          }
        }
      } catch (_) {}
      return raw;
    }
    // No valid system blob — try legacy migration
    if (migrateLegacyIfPresent()) {
      // Re-read after migration
      try { raw = lsRead(SAVE_SYSTEM_KEY, null); } catch (_) {}
      if (raw && validateSystemShape(raw)) return raw;
    }
    return defaultSystem();
  }

  function persistSystem(sys) {
    if (!validateSystemShape(sys)) throw new Error('Save System: invalid shape, refusing to persist');
    sys.integrity = sys.integrity || {};
    sys.integrity.lastSavedAt = new Date().toISOString();
    sys.integrity.lastSavedChecksum = ckSum32(JSON.stringify(sys.slots));
    try {
      lsWrite(SAVE_SYSTEM_KEY, sys);
    } catch (e) {
      // Round 130c — quota / write-failure handling. The most common cause
      // is QuotaExceededError (storage is full). Try to free room by
      // shrinking the trash to the most-recent 5 entries, then retry once.
      // If that still fails, surface the error to the user.
      const isQuota = e && (e.name === 'QuotaExceededError' || (e.code && e.code === 22) || /quota/i.test(e.message || ''));
      if (isQuota && Array.isArray(sys.trash) && sys.trash.length > 5) {
        sys.trash.length = 5;
        try {
          lsWrite(SAVE_SYSTEM_KEY, sys);
          // Surface a non-blocking warning so the user knows we trimmed trash
          if (typeof showLcModal === 'function') {
            showLcModal({
              title: 'Vault trimmed', titleSev: 'warn', icon: '⚠',
              body: 'Browser storage was filling up — the Recovery Vault was trimmed to the most-recent 5 deletions to keep your active slots safe. Consider exporting a cartridge as backup.',
              confirmText: 'OK', cancelText: ''
            });
          }
          return;
        } catch (e2) { /* fall through to error below */ }
      }
      if (typeof showLcModal === 'function') {
        showLcModal({
          title: 'Save failed — browser storage full', titleSev: 'danger', icon: '✗',
          body: 'Your browser refused to write the new save. The most common cause is storage being full. Recommended: use Export to download a cartridge backup, then clear the Recovery Vault.',
          confirmText: 'OK', cancelText: ''
        });
      }
      throw e;
    }
  }

  // Round 130c — cross-tab sync. When the user has two tabs of the dashboard
  // open and saves in one, the other tab's UI stays stale until refresh.
  // Listen to localStorage 'storage' events for the SAVE_SYSTEM_KEY and
  // re-render. Browser fires this event on OTHER tabs (not the originating
  // tab) when localStorage changes.
  if (typeof window !== 'undefined' && !window.__rgSaveSyncWired) {
    window.__rgSaveSyncWired = true;
    window.addEventListener('storage', function(ev) {
      if (ev.key !== SAVE_SYSTEM_KEY) return;
      if (typeof window.renderRegimenSlots === 'function') {
        try { window.renderRegimenSlots(); } catch (_) {}
      }
    });
  }

  function pushRecent(sys, action, slotN, label) {
    sys.recents = sys.recents || [];
    sys.recents.unshift({ action: action, slotN: slotN, label: label || null, ts: new Date().toISOString() });
    if (sys.recents.length > RECENTS_MAX) sys.recents.length = RECENTS_MAX;
  }

  // ── Slot operations (public API) ──────────────────────────────────────

  function readSlotMeta() {
    // Compat shim — existing render code expects the old flat meta shape:
    //   { currentSlot, slot1, slot2, slot3 } where slotN = the meta sub-object
    // The new system stores slots = { "1": {data, meta} }. Translate.
    const sys = loadSystem();
    const flat = {
      currentSlot: sys.currentSlot,
      slot1: sys.slots['1'] ? sys.slots['1'].meta : null,
      slot2: sys.slots['2'] ? sys.slots['2'].meta : null,
      slot3: sys.slots['3'] ? sys.slots['3'].meta : null
    };
    return flat;
  }

  function writeSlotMeta(_meta) {
    // Compat shim — silently no-op. Round 130a stops writing meta separately;
    // all writes now go through persistSystem(). If any legacy code reaches
    // here, the warning is intentional so we can find + remove the caller.
    console.warn('[saveSystem] writeSlotMeta called — legacy path. State is now managed atomically via persistSystem; this no-op is harmless but the caller should be refactored.');
  }

  function saveCurrentToSlot(n, label, opts) {
    if (n !== 1 && n !== 2 && n !== 3) throw new Error('Slot index must be 1, 2, or 3');
    opts = opts || {};
    const bundle = buildDataExport();
    const stats = computeSlotStats(bundle);
    const cleanLabel = String(label || '').trim().slice(0, 60) || ('Slot ' + n);
    const sys = loadSystem();
    const prevSlot = sys.slots[String(n)];
    const prevMeta = prevSlot ? prevSlot.meta : {};
    const iconName = (opts.iconName !== undefined) ? opts.iconName : (prevMeta.iconName || null);
    const accent = (opts.accent !== undefined) ? opts.accent : (prevMeta.accent || defaultAccentForSlot(n));
    sys.slots[String(n)] = {
      data: bundle,
      meta: {
        label: cleanLabel,
        lastEdited: new Date().toISOString(),
        iconName: iconName,
        accent: accent,
        stats: stats
      }
    };
    sys.currentSlot = n;
    pushRecent(sys, 'save', n, cleanLabel);
    persistSystem(sys);
    return sys.slots[String(n)].meta;
  }

  function loadFromSlot(n) {
    if (n !== 1 && n !== 2 && n !== 3) throw new Error('Slot index must be 1, 2, or 3');
    const sys = loadSystem();
    const slot = sys.slots[String(n)];
    if (!slot || !slot.data) throw new Error('Slot ' + n + ' is empty.');
    const result = applyImportBundle(slot.data, 'replace');
    sys.currentSlot = n;
    pushRecent(sys, 'load', n, slot.meta && slot.meta.label || null);
    persistSystem(sys);
    return result;
  }

  // Round 130a — deleteSlot now MOVES the slot to trash (FIFO max 20)
  // rather than discarding. Round 130b ships the vault UI to restore.
  function deleteSlot(n) {
    if (n !== 1 && n !== 2 && n !== 3) throw new Error('Slot index must be 1, 2, or 3');
    const sys = loadSystem();
    const slot = sys.slots[String(n)];
    if (!slot) return;  // already empty
    sys.trash = sys.trash || [];
    sys.trash.unshift({
      data: slot.data,
      meta: slot.meta,
      deletedAt: new Date().toISOString(),
      originalSlot: n,
      trashId: 't' + Date.now() + Math.floor(Math.random() * 1000)
    });
    if (sys.trash.length > TRASH_MAX) sys.trash.length = TRASH_MAX;
    sys.slots[String(n)] = null;
    if (sys.currentSlot === n) sys.currentSlot = null;
    pushRecent(sys, 'delete', n, slot.meta && slot.meta.label || null);
    persistSystem(sys);
  }

  // Round 130b — restoreFromTrash + clearTrash. Defined here so Round 130c
  // robustness pass can wrap them with quota/error handling without
  // disturbing 130b's UI work.
  function getTrash() {
    const sys = loadSystem();
    return Array.isArray(sys.trash) ? sys.trash.slice() : [];
  }
  function restoreFromTrash(trashId, intoSlot) {
    const sys = loadSystem();
    const idx = (sys.trash || []).findIndex(function(t) { return t.trashId === trashId; });
    if (idx === -1) throw new Error('Trash entry not found.');
    const entry = sys.trash[idx];
    // Pick target slot — if intoSlot specified use that; else first empty
    let target = intoSlot;
    if (!target) {
      for (let n = 1; n <= 3; n++) {
        if (!sys.slots[String(n)]) { target = n; break; }
      }
      if (!target) throw new Error('No empty slot available — delete one first or specify a target.');
    }
    if (target !== 1 && target !== 2 && target !== 3) throw new Error('Target slot must be 1, 2, or 3');
    // If target has data, push it to trash too (recursive safety net)
    if (sys.slots[String(target)]) {
      sys.trash.unshift({
        data: sys.slots[String(target)].data,
        meta: sys.slots[String(target)].meta,
        deletedAt: new Date().toISOString(),
        originalSlot: target,
        trashId: 't' + Date.now() + Math.floor(Math.random() * 1000)
      });
      if (sys.trash.length > TRASH_MAX) sys.trash.length = TRASH_MAX;
    }
    // Restore the entry
    sys.slots[String(target)] = { data: entry.data, meta: entry.meta };
    sys.trash.splice(idx, 1);
    pushRecent(sys, 'restore', target, entry.meta && entry.meta.label || null);
    persistSystem(sys);
    return target;
  }
  function clearTrash() {
    const sys = loadSystem();
    sys.trash = [];
    pushRecent(sys, 'clear-trash', null, null);
    persistSystem(sys);
  }

  window.loadSystem = loadSystem;
  window.persistSystem = persistSystem;
  window.getTrash = getTrash;
  window.restoreFromTrash = restoreFromTrash;
  window.clearTrash = clearTrash;

  // ── Round 134 — Default Regimen + REGIMEN_SLOT_INVARIANT ──────────────
  //
  // The two-lane architecture's foundation (vision-default-regimen.md).
  //
  // ensureDefaultSlot(provenance) creates slot 1 with provenance-aware
  // default constants the first time a regimen item is added.
  //   - 'user_scanned'        → DEFAULT_REGIMEN_SCANNED  (freedom lane)
  //   - anything else         → DEFAULT_REGIMEN_ENGINE   (authoritative lane)
  //
  // addItemToRegimen(item, provenance) is the shared primitive every
  // entry point routes through. Phase 1 ships it; Phase 2 wires the
  // entry points (scanner adopt, recommendation adopt, manual add).
  //
  // assertRegimenSlotInvariant() is the load-time + post-mutation runtime
  // sanity check that self-heals the items-without-slot failure mode.
  // The load-time arm IS the Path A migration logic — Luneth's existing
  // items-without-slot state triggers the auto-wrap on first reload.

  const DEFAULT_REGIMEN_ENGINE = Object.freeze({
    name:   'My Regimen',
    icon:   'bolt',     // ICON_REGISTRY label 'Energy', name 'bolt' — verified
    accent: 'indigo'    // SLOT_PALETTES key — verified
  });

  const DEFAULT_REGIMEN_SCANNED = Object.freeze({
    name:   'My Regimen (Scanned)',
    icon:   'heart',    // ICON_REGISTRY label 'Cardio', name 'heart' — verified
    accent: 'amber'     // SLOT_PALETTES key — verified
  });

  const VALID_PROVENANCE = Object.freeze([
    'wallach_essential',
    'wallach_recommendation_adopted',
    'user_scanned',
    'user_manual',
    'imported_cart'
  ]);

  function pickDefaultRegimenForProvenance(provenance) {
    if (provenance === 'user_scanned') return DEFAULT_REGIMEN_SCANNED;
    return DEFAULT_REGIMEN_ENGINE;
  }

  // Public API: ensureDefaultSlot(provenance)
  // No-op if any slot already exists. Otherwise creates slot 1 with the
  // provenance-appropriate defaults, bundles current live state, persists.
  function ensureDefaultSlot(provenance) {
    const sys = loadSystem();
    const anySlotExists = Object.values(sys.slots).some(s => s !== null);
    if (anySlotExists) return null;  // no-op

    const tpl = pickDefaultRegimenForProvenance(provenance);
    const meta = saveCurrentToSlot(1, tpl.name, { iconName: tpl.icon, accent: tpl.accent });
    if (typeof showQuietToast === 'function') {
      try { showQuietToast('Saved as ' + tpl.name); } catch(_) {}
    }
    return meta;
  }

  // Public API: syncActiveSlotBundle()
  // Policy A live-bind: writes current live dashboard state into the active
  // slot's bundle, preserving the slot's existing label / icon / accent.
  // No-op if no active slot. Called after every regimen mutation in Phase 2.
  function syncActiveSlotBundle() {
    const sys = loadSystem();
    const n = sys.currentSlot;
    if (n !== 1 && n !== 2 && n !== 3) return null;
    const slot = sys.slots[String(n)];
    if (!slot || !slot.meta) return null;
    return saveCurrentToSlot(n, slot.meta.label, {
      iconName: slot.meta.iconName,
      accent: slot.meta.accent
    });
  }

  // Public API: applyRegimenSlotEffects(provenance)  [Round 135 / Phase 2]
  // Side-effects-only helper. Entry points that have their OWN LS write
  // (rgOverrides_v1 for Adopt, rgManualItems_v1 for manual add) call this
  // AFTER their write to fire the shared slot side-effects:
  //   1. ensureDefaultSlot(provenance) — creates default slot if none
  //   2. syncActiveSlotBundle()        — Policy A live-bind
  //   3. assertRegimenSlotInvariant()  — runtime sanity check
  //   4. best-effort re-renders
  // Entry points that write to lcRegimen_v1 (scanner/wishlist → addToRegimen)
  // call this too. addItemToRegimen below also delegates to this for the
  // side-effects portion — single source of truth for the side-effect chain.
  function applyRegimenSlotEffects(provenance) {
    if (!VALID_PROVENANCE.includes(provenance)) {
      console.warn('[applyRegimenSlotEffects] unknown provenance "' + provenance + '" — defaulting to user_manual');
      provenance = 'user_manual';
    }
    try { ensureDefaultSlot(provenance); } catch(e) { console.error('[applyRegimenSlotEffects] ensureDefaultSlot failed', e); }
    try { syncActiveSlotBundle(); } catch(e) { console.error('[applyRegimenSlotEffects] sync failed', e); }
    try { assertRegimenSlotInvariant(); } catch(_) {}
    // Round 150 — re-renders delegated to triggerRegimenRerender so the four
    // chokepoint save helpers can fire the cascade WITHOUT triggering slot
    // creation / sync. See operating-protocols.md §31 (Cross-Surface State Sync).
    triggerRegimenRerender('slot-effects:' + provenance);
  }

  // Round 150 — Layer 1 of the Cross-Surface State Sync system (§31).
  // The canonical "after a regimen-state mutation, re-render every surface that
  // reads from it" primitive. The 4 chokepoint save helpers
  // (persistRegimen / saveRgOverride / saveRgManual / saveRgRemoved) each call
  // window.triggerRegimenRerender() after their lsWrite — no mutation can land
  // without firing all subscribed surfaces. Failure family from Rounds 134/141/149:
  // mutation on surface A leaves stale state on surface B until manual reload.
  // §31 chokepoint discipline closes that loop.
  function triggerRegimenRerender(mutationLabel) {
    // In-memory mutation log (debug-visible at window.__regimenMutationLog).
    if (!window.__regimenMutationLog) window.__regimenMutationLog = [];
    window.__regimenMutationLog.push({ ts: Date.now(), label: mutationLabel || 'unknown' });
    if (window.__regimenMutationLog.length > 50) {
      window.__regimenMutationLog.splice(0, window.__regimenMutationLog.length - 50);
    }
    // Round 151 — sync the active slot's bundle BEFORE renders so the slot card
    // picks up fresh stats. Prior bug (Round 150): cascade re-rendered surfaces
    // but never refreshed slot.meta.stats, so the slot card showed stale counts
    // after every mutation that didn't go through applyRegimenSlotEffects (e.g.,
    // removeFromRegimen → persistRegimen → triggerRegimenRerender → render of
    // stale slot data). syncActiveSlotBundle is a no-op when no slot is current
    // and writes to a non-regimen LS key, so no §31 chokepoint cascade fires.
    try { syncActiveSlotBundle(); } catch(e) { console.error('[triggerRegimenRerender] syncActiveSlotBundle failed', e); }
    // Subscribed surface re-renders. Best-effort per doctrine §7 (graceful
    // degradation) — one surface's render failure doesn't break the cascade.
    try { if (typeof window.renderRegimenSlots === 'function') window.renderRegimenSlots(); } catch(e) { console.error('[triggerRegimenRerender] renderRegimenSlots failed', e); }
    try { if (typeof window.renderRegimen === 'function') window.renderRegimen(); } catch(e) { console.error('[triggerRegimenRerender] renderRegimen failed', e); }
    try { if (typeof window.renderWishlist === 'function') window.renderWishlist(); } catch(e) { console.error('[triggerRegimenRerender] renderWishlist failed', e); }
    // Round 156 follow-up — goal-picker re-renders on every regimen mutation so
    // the selected state pills reflect any cross-tab changes immediately.
    try { if (typeof window.renderGoalPicker === 'function') window.renderGoalPicker(); } catch(e) { console.error('[triggerRegimenRerender] renderGoalPicker failed', e); }
    // Round 156 follow-up #6 — periodic table on You tab. Live coverage data
    // comes from buildEssentialsGrid which reads the live regimen + computes
    // per-essential coverage. Without this call, add/remove on Regimen tab
    // wasn't reflected on You tab until manual reload.
    try { if (typeof window.buildEssentialsGrid === 'function') window.buildEssentialsGrid(); } catch(e) { console.error('[triggerRegimenRerender] buildEssentialsGrid failed', e); }
    // External subscribers (debug overlays, future surfaces) listen here.
    try {
      document.dispatchEvent(new CustomEvent('regimen:mutated', {
        detail: { label: mutationLabel || 'unknown', ts: Date.now() }
      }));
    } catch(_) {}
  }

  // Public API: addItemToRegimen(item, provenance)
  // Canonical low-level primitive for "add a fresh item to lcRegimen_v1".
  // Scanner/wishlist entry points call addToRegimen() (in the Label Check
  // IIFE) which mirrors this write shape; Adopt + manual paths have their
  // own LS keys and call applyRegimenSlotEffects() directly.
  // Item shape: `{id?, label: {name, ...}, addedDate?}` + provenance stamp.
  function addItemToRegimen(item, provenance) {
    if (!item || !item.label || !item.label.name) {
      console.error('[addItemToRegimen] invalid item — needs item.label.name');
      return false;
    }
    if (!VALID_PROVENANCE.includes(provenance)) {
      console.warn('[addItemToRegimen] unknown provenance "' + provenance + '" — defaulting to user_manual');
      provenance = 'user_manual';
    }

    // 1. Append to live regimen items (lcRegimen_v1) via the existing shape
    let r;
    try {
      r = lsRead('lcRegimen_v1', { items: [] });
      if (!r || !Array.isArray(r.items)) r = { items: [] };
    } catch(_) { r = { items: [] }; }

    if (r.items.some(i => i && i.label && i.label.name === item.label.name)) {
      // Dedup — name already present, treat as no-op success
      return true;
    }

    const newItem = Object.assign({}, item, {
      id: item.id || (Date.now() + Math.floor(Math.random() * 1000)),
      addedDate: item.addedDate || new Date().toISOString().slice(0,10),
      provenance: provenance
    });
    r.items.unshift(newItem);

    // Round 150 §31 — route through window.persistRegimen (the sole chokepoint
    // helper for lcRegimen_v1). At call time (user-action), the Label Check
    // IIFE has already initialized and exposed persistRegimen — both IIFEs
    // init at DOMContentLoaded before any user input is possible. If the
    // helper is missing, fail the write and surface the error (no silent
    // bootstrap drift — doctrine §1).
    if (typeof window.persistRegimen !== 'function') {
      console.error('[addItemToRegimen] window.persistRegimen not exposed — Label Check IIFE init missing or broken');
      return false;
    }
    try {
      window.persistRegimen(r);
    } catch(e) {
      console.error('[addItemToRegimen] persistRegimen failed', e);
      return false;
    }

    // 2. Fire shared side-effects (slot ensure + sync + invariant + renders)
    applyRegimenSlotEffects(provenance);

    return true;
  }

  // Public API: assertRegimenSlotInvariant()
  // The REGIMEN_SLOT_INVARIANT runtime check. Fires after every mutation
  // AND on DOMContentLoaded (load-time arm = Path A migration).
  // Returns 'ok' | 'healed' | 'empty'.
  function assertRegimenSlotInvariant() {
    let items = [];
    try {
      const r = lsRead('lcRegimen_v1', { items: [] });
      items = (r && Array.isArray(r.items)) ? r.items : [];
    } catch(_) {}

    const sys = loadSystem();
    const anySlotExists = Object.values(sys.slots).some(s => s !== null);

    if (items.length === 0 && !anySlotExists) return 'empty';

    if (items.length > 0 && !anySlotExists) {
      console.warn('[REGIMEN_SLOT_INVARIANT] ' + items.length + ' item(s) exist without a slot — auto-creating default (Path A migration / self-heal).');
      // Provenance 'user_manual' = safest fallback for legacy items whose
      // origin is unknown. Triggers ENGINE template (My Regimen / bolt / indigo).
      try { ensureDefaultSlot('user_manual'); } catch(e) { console.error('[REGIMEN_SLOT_INVARIANT] heal-create failed', e); return 'error'; }
      try { syncActiveSlotBundle(); } catch(_) {}
      return 'healed';
    }
    return 'ok';
  }

  // Wire load-time arm: fires DOMContentLoaded OR immediately if already loaded.
  // Round 156 — load-time arm also refreshes the current slot's cached stats
  // via syncActiveSlotBundle() when a current slot exists. Prior bug
  // (Saturday Item 3 v1): adopting goal-driven items before Round 155 saved
  // the slot bundle with `stats.essentialsCovered = 0` because the engine
  // shipped items with `nutrients: []`. Round 155 wired the nutrients; this
  // round refreshes the cached stats on next page load so the slot card
  // catches up. Sync is idempotent (no behavior change on already-fresh
  // bundles) and graceful-degrading per doctrine §7.
  if (typeof window !== 'undefined' && !window.__rgInvariantWired) {
    window.__rgInvariantWired = true;
    const _wireRgInvariant = function() {
      try { assertRegimenSlotInvariant(); }
      catch(e) { console.error('[REGIMEN_SLOT_INVARIANT] init check failed', e); }
      // Round 156 — refresh current-slot cached stats from live state.
      try {
        const sys = loadSystem();
        if (sys && sys.currentSlot && (typeof syncActiveSlotBundle === 'function')) {
          syncActiveSlotBundle();
        }
      } catch(e) { console.error('[REGIMEN_SLOT_INVARIANT] load-time slot sync failed', e); }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _wireRgInvariant);
    } else {
      setTimeout(_wireRgInvariant, 0);
    }
  }

  // Expose for cross-scope access per operating-protocols §17 (Round 131 lesson)
  window.DEFAULT_REGIMEN_ENGINE = DEFAULT_REGIMEN_ENGINE;
  window.DEFAULT_REGIMEN_SCANNED = DEFAULT_REGIMEN_SCANNED;
  window.VALID_PROVENANCE = VALID_PROVENANCE;
  window.ensureDefaultSlot = ensureDefaultSlot;
  window.syncActiveSlotBundle = syncActiveSlotBundle;
  window.addItemToRegimen = addItemToRegimen;
  window.applyRegimenSlotEffects = applyRegimenSlotEffects;  // Round 135 / Phase 2
  window.triggerRegimenRerender = triggerRegimenRerender;    // Round 150 / §31
  window.assertRegimenSlotInvariant = assertRegimenSlotInvariant;

  function downloadAsCart(bundle, label) {
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    const safe = String(label || 'regimen').trim()
      .replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'regimen';
    a.download = safe + '-' + ts + '.cart';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  window.parseImportBundle = parseImportBundle;
  window.applyImportBundle = applyImportBundle;
  window.saveCurrentToSlot = saveCurrentToSlot;
  window.loadFromSlot = loadFromSlot;
  window.deleteSlot = deleteSlot;
  window.downloadAsCart = downloadAsCart;
  window.readSlotMeta = readSlotMeta;
  window.computeSlotStats = computeSlotStats;
  window.SLOT_ACCENTS = SLOT_ACCENTS;

  // ----- Render + interaction wiring for the slot section -----

  function escapeRgSlot(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;';
  }); }

  // Round 127 — inline SVG icon set. Tabler webfont was assumed but is NOT
  // loaded in the dashboard (was preloaded only in the visualization tool
  // during mockup design — different surface). Inline SVGs render in any
  // context, scale with font-size via width/height="1em", inherit color via
  // stroke="currentColor". Zero external dependencies.
  function iconSVG(name) {
    const open = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-0.15em;display:inline-block;flex-shrink:0;pointer-events:none;">';
    const close = '</svg>';
    const P = {
      floppy:   '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
      download: '<path d="M12 4v13M6 11l6 6 6-6M5 20h14"/>',
      upload:   '<path d="M12 20V7M6 13l6-6 6 6M5 4h14"/>',
      copy:     '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
      plus:     '<path d="M12 5v14M5 12h14"/>',
      sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
      target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
      luggage:  '<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M10 7V4h4v3M9 12v4M15 12v4"/>',
      pill:     '<path d="M10.5 20.5a4.95 4.95 0 0 1-7-7L13.5 3.5a4.95 4.95 0 0 1 7 7L10.5 20.5z"/><path d="M8.5 8.5l7 7"/>',
      salad:    '<path d="M3 11h18l-1.5 8a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5z"/><circle cx="8" cy="8" r="2.5"/><circle cx="13" cy="6" r="2.5"/><circle cx="17" cy="9" r="2.5"/>',
      atom:     '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-60 12 12)"/>',
      x:        '<path d="M6 6l12 12M18 6L6 18"/>',
      trash:    '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'
    };
    return open + (P[name] || '') + close;
  }
  window.iconSVG = iconSVG;

  // Round 127 — showLcModal-based input prompt. Replaces browser prompt()
  // which the user explicitly named as bad UX (matching design lesson).
  // Returns Promise<{ ok, value }> where value is the trimmed input.
  function showSlotInputModal(opts) {
    return new Promise(function(resolve) {
      const inputId = 'rg-slot-input-' + Date.now();
      const bodyHtml =
        '<label for="' + inputId + '" style="display:block;font-size:13px;color:#2E3742;margin-bottom:8px;font-weight:500;">' + escapeRgSlot(opts.label || 'Value') + '</label>'
        + '<input id="' + inputId + '" type="text" maxlength="60" value="' + escapeRgSlot(opts.defaultValue || '') + '" placeholder="' + escapeRgSlot(opts.placeholder || '') + '" style="width:100%;padding:10px 12px;font-size:14px;border:1px solid #b5bcc4;border-radius:6px;box-sizing:border-box;background:#fff;color:#2E3742;" autocomplete="off">';
      showLcModal({
        title: opts.title || 'Name this',
        titleSev: 'info',
        icon: opts.icon || '✎',
        bodyHtml: bodyHtml,
        confirmText: opts.confirmText || 'Save',
        cancelText: opts.cancelText || 'Cancel'
      }).then(function(ok) {
        const el = document.getElementById(inputId);
        const value = el ? String(el.value || '').trim() : '';
        resolve({ ok: !!ok, value: value });
      });
      setTimeout(function() {
        const el = document.getElementById(inputId);
        if (el) { el.focus(); el.select(); }
      }, 30);
    });
  }
  window.showSlotInputModal = showSlotInputModal;

  function renderSlotCard(n, slotMeta, isCurrent) {
    // Round 128 — substrate-rooted render. No hardcoded personality icon, no
    // hardcoded color, no fake dots. Reads user's choices from slotMeta.
    const filled = !!slotMeta;
    const card = document.createElement('div');
    card.className = 'rg-slot-card ' + (filled ? (isCurrent ? 'is-active' : 'is-inactive') : 'is-empty');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.dataset.slot = String(n);

    if (!filled) {
      card.innerHTML = '<div class="rg-slot-plus" aria-hidden="true">' + iconSVG('plus') + '</div>'
                     + '<div class="rg-slot-empty-label">New save</div>'
                     + '<div class="rg-slot-empty-hint">Click to save current</div>';
      card.setAttribute('aria-label', 'Save current regimen to slot ' + n + ' (empty)');
      return card;
    }

    // Resolve accent from user choice (with rotation fallback)
    const accentName = slotMeta.accent || defaultAccentForSlot(n);
    const pal = getPalette(accentName);
    card.style.setProperty('--slot-accent-fg', pal.fg);
    card.style.setProperty('--slot-accent-mid', pal.mid);
    card.style.setProperty('--slot-accent-soft', pal.soft);
    card.style.setProperty('--slot-accent-mist', pal.mist);

    const stats = slotMeta.stats || { supplements: 0, foods: 0, essentialsCovered: 0, essentialsTotal: 92 };
    const segments = 12;
    const filledSegs = Math.max(0, Math.min(segments, Math.round((stats.essentialsCovered / Math.max(1, stats.essentialsTotal)) * segments)));
    const stripHtml = [];
    for (let i = 0; i < segments; i++) {
      const idxFromBottom = segments - i;
      let cls = '';
      if (idxFromBottom <= filledSegs) {
        cls = (idxFromBottom > filledSegs - 2) ? 'mid' : 'on';
      }
      stripHtml.push('<span class="' + cls + '"></span>');
    }

    // User-chosen icon (or no icon at all if they opted out)
    const iconBlock = slotMeta.iconName
      ? '<span class="rg-slot-personality-icon">' + iconSVG(slotMeta.iconName) + '</span>'
      : '';
    const pill = isCurrent ? '<span class="rg-slot-pill">CURRENT</span>' : '';
    const numStr = (n < 10 ? '0' : '') + n;
    const cov = stats.essentialsCovered + '/' + stats.essentialsTotal;

    card.innerHTML =
      '<button type="button" class="rg-slot-delete-btn" aria-label="Delete slot ' + n + '" data-slot-delete="' + n + '">' + iconSVG('trash') + '</button>'
      + '<div class="rg-slot-content">'
        + '<div class="rg-slot-header-row">'
          + '<div class="rg-slot-number">' + numStr + '</div>'
          + pill
        + '</div>'
        + '<div class="rg-slot-name-row">'
          + iconBlock
          + '<div class="rg-slot-name">' + escapeRgSlot(slotMeta.label) + '</div>'
        + '</div>'
        + '<div class="rg-slot-subtitle">' + stats.supplements + ' supplement' + (stats.supplements === 1 ? '' : 's') + ' · ' + stats.foods + ' food' + (stats.foods === 1 ? '' : 's') + '</div>'
        + '<div class="rg-slot-footer">'
          + '<span class="rg-slot-coverage-label">essentials covered</span>'
          + '<span class="rg-slot-coverage-num">' + cov + '</span>'
        + '</div>'
      + '</div>'
      + '<div class="rg-slot-strip">' + stripHtml.join('') + '</div>'
      + (isCurrent ? '<div class="rg-slot-energy-line"></div>' : '');

    card.setAttribute('aria-label', 'Slot ' + n + ': ' + slotMeta.label + (isCurrent ? ' (currently loaded)' : ''));

    // Round 129 — direct event binding on the delete button. The grid-level
    // event delegation in wireSlotCardClicks was failing to fire in production
    // for reasons not fully traced (possible event-flow conflict with the card
    // hover/focus state changes). Direct binding eliminates any propagation
    // uncertainty. Also stops propagation so the parent card's click handler
    // (load-this-slot) doesn't fire after.
    // Round 129 + 131 — direct event binding on the delete button. The modal
    // opening serves as the visual click receipt; no inline button-flash
    // needed (removed in Round 132 — the proper delete ceremony at the card
    // level is now the canonical acknowledgment surface).
    const delBtn = card.querySelector('.rg-slot-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        try {
          confirmDeleteSlot(n);
        } catch (e) {
          if (typeof flashDeleteDiag === 'function') flashDeleteDiag('confirmDeleteSlot threw at top level: ' + (e && e.message || e));
        }
      });
      delBtn.addEventListener('keydown', function(ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.stopPropagation();
        ev.preventDefault();
        try { confirmDeleteSlot(n); }
        catch (e) {
          if (typeof flashDeleteDiag === 'function') flashDeleteDiag('confirmDeleteSlot threw at top level: ' + (e && e.message || e));
        }
      });
    }

    return card;
  }

  // Round 130b — Recovery Vault toggle state. Click the floppy icon in the
  // section header to enter vault mode (slots grid hides, trash list shows).
  // Click again or use the close button inside the vault to exit. Not
  // announced anywhere in primary UI — quiet "yes we thought of that"
  // surface that exists for the moment of regret.
  let vaultModeActive = false;

  function renderRegimenSlots() {
    const grid = document.getElementById('rg-slots-grid');
    const vault = document.getElementById('rg-slots-vault');
    const detail = document.getElementById('rg-slots-detail');
    const title = document.getElementById('rg-slots-title');
    const subtitle = document.getElementById('rg-slots-subtitle');
    const section = document.getElementById('rg-slots-section');
    if (!grid) return;

    const meta = readSlotMeta();
    if (section) section.classList.toggle('is-vault-mode', vaultModeActive);
    if (title) title.textContent = vaultModeActive ? 'Recovery Vault' : 'Regimen Slots';
    if (subtitle) subtitle.textContent = vaultModeActive
      ? 'Recently deleted saves — restore any of them back.'
      : 'Save and switch between your personalized regimens.';

    if (vaultModeActive) {
      grid.hidden = true;
      if (detail) detail.hidden = true;
      if (vault) { vault.hidden = false; renderRecoveryVault(vault); }
      return;
    }

    grid.hidden = false;
    if (vault) vault.hidden = true;
    const current = meta.currentSlot;
    grid.textContent = '';
    for (let n = 1; n <= 3; n++) {
      grid.appendChild(renderSlotCard(n, meta['slot' + n], current === n));
    }
    const allFilled = !!(meta.slot1 && meta.slot2 && meta.slot3);
    if (!allFilled) {
      const nextEmpty = !meta.slot1 ? 1 : !meta.slot2 ? 2 : 3;
      const phantom = document.createElement('div');
      phantom.className = 'rg-slot-card is-empty';
      phantom.setAttribute('role', 'button');
      phantom.setAttribute('tabindex', '0');
      phantom.dataset.slot = 'next';
      phantom.dataset.target = String(nextEmpty);
      phantom.innerHTML = '<div class="rg-slot-plus" aria-hidden="true">' + iconSVG('plus') + '</div>'
                       + '<div class="rg-slot-empty-label">New save</div>'
                       + '<div class="rg-slot-empty-hint">Click to save current</div>';
      phantom.setAttribute('aria-label', 'Save current regimen to next empty slot ' + nextEmpty);
      grid.appendChild(phantom);
    }

    renderSlotDetailPanel(meta);
    wireSlotCardClicks();
    updateSaveButtonState(meta);
  }

  function toggleVaultMode() {
    vaultModeActive = !vaultModeActive;
    renderRegimenSlots();
  }
  window.toggleVaultMode = toggleVaultMode;

  function renderRecoveryVault(vaultEl) {
    const trash = getTrash();
    vaultEl.textContent = '';

    if (trash.length === 0) {
      vaultEl.innerHTML =
        '<div class="rg-vault-empty">'
          + '<div class="rg-vault-empty-icon" aria-hidden="true">' + iconSVG('trash') + '</div>'
          + '<div class="rg-vault-empty-title">No recent deletions</div>'
          + '<div class="rg-vault-empty-sub">Anything you delete shows up here for the next 20 deletions. Plenty of time to change your mind.</div>'
          + '<button type="button" class="rg-vault-close-btn" id="rg-vault-close-empty">Back to slots</button>'
        + '</div>';
      const closeBtn = document.getElementById('rg-vault-close-empty');
      if (closeBtn) closeBtn.addEventListener('click', toggleVaultMode);
      return;
    }

    let html = '<div class="rg-vault-header">'
      + '<div class="rg-vault-header-info">'
        + '<div class="rg-vault-count">' + trash.length + ' deleted save' + (trash.length === 1 ? '' : 's') + ' · keeping the last 20</div>'
      + '</div>'
      + '<div class="rg-vault-header-actions">'
        + '<button type="button" class="rg-vault-clear-btn" id="rg-vault-clear-btn"><span style="display:inline-flex;font-size:13px;">' + iconSVG('trash') + '</span>Clear vault</button>'
        + '<button type="button" class="rg-vault-close-btn" id="rg-vault-close-btn">Back to slots</button>'
      + '</div>'
    + '</div>'
    + '<div class="rg-vault-list">';

    trash.forEach(function(entry) {
      const pal = getPalette(entry.meta && entry.meta.accent ? entry.meta.accent : 'slate');
      const label = (entry.meta && entry.meta.label) || ('Slot ' + entry.originalSlot);
      const stats = (entry.meta && entry.meta.stats) || { supplements: 0, foods: 0, essentialsCovered: 0, essentialsTotal: 92 };
      let deletedAgo = '';
      try {
        const ms = Date.now() - new Date(entry.deletedAt).getTime();
        if (ms < 60000) deletedAgo = 'just now';
        else if (ms < 3600000) deletedAgo = Math.round(ms / 60000) + ' min ago';
        else if (ms < 86400000) deletedAgo = Math.round(ms / 3600000) + ' hour' + (Math.round(ms / 3600000) === 1 ? '' : 's') + ' ago';
        else deletedAgo = Math.floor(ms / 86400000) + ' day' + (Math.floor(ms / 86400000) === 1 ? '' : 's') + ' ago';
      } catch (_) {}

      const iconBlock = (entry.meta && entry.meta.iconName)
        ? '<span class="rg-vault-entry-icon" style="color:' + pal.mid + ';">' + iconSVG(entry.meta.iconName) + '</span>'
        : '';

      html += '<div class="rg-vault-entry" data-trash-id="' + entry.trashId + '" style="border-left-color:' + pal.mid + ';">'
        + '<div class="rg-vault-entry-num" style="color:' + pal.fg + ';">' + (entry.originalSlot < 10 ? '0' : '') + entry.originalSlot + '</div>'
        + '<div class="rg-vault-entry-info">'
          + '<div class="rg-vault-entry-title">' + iconBlock + '<span>' + escapeRgSlot(label) + '</span></div>'
          + '<div class="rg-vault-entry-stats">' + stats.supplements + ' supp · ' + stats.foods + ' food · ' + stats.essentialsCovered + '/' + stats.essentialsTotal + ' ess</div>'
          + '<div class="rg-vault-entry-deleted">Deleted ' + escapeRgSlot(deletedAgo) + ' · was slot ' + entry.originalSlot + '</div>'
        + '</div>'
        + '<button type="button" class="rg-vault-restore-btn" data-restore-id="' + entry.trashId + '" title="Restore this save to the first empty slot">Restore</button>'
      + '</div>';
    });

    html += '</div>';
    vaultEl.innerHTML = html;

    const clearBtn = document.getElementById('rg-vault-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        showLcModal({
          title: 'Clear the entire vault?',
          titleSev: 'warn', icon: '⚠',
          body: 'This permanently removes ALL ' + trash.length + ' deleted save' + (trash.length === 1 ? '' : 's') + ' from the vault. After this, they cannot be recovered. Your current slots are not affected.',
          confirmText: 'Yes, clear it',
          cancelText: 'Keep them',
          confirmDanger: true
        }).then(function(ok) {
          if (!ok) return;
          try {
            clearTrash();
            renderRegimenSlots();
          } catch (e) {
            showLcModal({ title: 'Clear failed', titleSev: 'danger', icon: '✗',
              body: e.message, confirmText: 'OK', cancelText: '' });
          }
        });
      });
    }
    const closeBtn = document.getElementById('rg-vault-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', toggleVaultMode);
    vaultEl.querySelectorAll('.rg-vault-restore-btn').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        const trashId = btn.dataset.restoreId;
        attemptRestore(trashId);
      });
    });
  }

  function attemptRestore(trashId) {
    const sys = loadSystem();
    const entry = (sys.trash || []).find(function(t) { return t.trashId === trashId; });
    if (!entry) {
      showLcModal({ title: 'Restore failed', titleSev: 'danger', icon: '✗',
        body: 'That entry is no longer in the vault.', confirmText: 'OK', cancelText: '' });
      return;
    }
    const emptySlot = !sys.slots['1'] ? 1 : !sys.slots['2'] ? 2 : (!sys.slots['3'] ? 3 : null);
    const label = (entry.meta && entry.meta.label) || 'Slot';
    if (emptySlot) {
      try {
        restoreFromTrash(trashId);
        renderRegimenSlots();
        showLcModal({ title: 'Restored', titleSev: 'info', icon: '✓',
          body: '"' + label + '" restored to slot ' + emptySlot + '.',
          confirmText: 'OK', cancelText: '' });
      } catch (e) {
        showLcModal({ title: 'Restore failed', titleSev: 'danger', icon: '✗',
          body: e.message, confirmText: 'OK', cancelText: '' });
      }
      return;
    }
    const slot1Label = sys.slots['1'] && sys.slots['1'].meta && sys.slots['1'].meta.label || 'Slot 1';
    const slot2Label = sys.slots['2'] && sys.slots['2'].meta && sys.slots['2'].meta.label || 'Slot 2';
    const slot3Label = sys.slots['3'] && sys.slots['3'].meta && sys.slots['3'].meta.label || 'Slot 3';
    const html =
      '<div style="font-family:Inter,system-ui,sans-serif;margin-bottom:10px;color:#1f2937;font-size:13px;">All three slots are full. Pick one to overwrite — the existing save in that slot will be moved to the vault (you can restore it from here too):</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;">'
      + '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1f2937;"><input type="radio" name="rg-restore-slot" value="1" checked> Slot 1 — ' + escapeRgSlot(slot1Label) + '</label>'
      + '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1f2937;"><input type="radio" name="rg-restore-slot" value="2"> Slot 2 — ' + escapeRgSlot(slot2Label) + '</label>'
      + '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#1f2937;"><input type="radio" name="rg-restore-slot" value="3"> Slot 3 — ' + escapeRgSlot(slot3Label) + '</label>'
      + '</div>';
    showLcModal({
      title: 'Overwrite which slot?', titleSev: 'warn', icon: '⚠',
      bodyHtml: html, confirmText: 'Restore', cancelText: 'Cancel'
    }).then(function(ok) {
      if (!ok) return;
      const radios = document.querySelectorAll('input[name="rg-restore-slot"]');
      let target = 1;
      for (const r of radios) { if (r.checked) { target = parseInt(r.value, 10); break; } }
      try {
        restoreFromTrash(trashId, target);
        renderRegimenSlots();
        showLcModal({ title: 'Restored', titleSev: 'info', icon: '✓',
          body: '"' + label + '" restored to slot ' + target + '. The previous save in slot ' + target + ' is now in the vault.',
          confirmText: 'OK', cancelText: '' });
      } catch (e) {
        showLcModal({ title: 'Restore failed', titleSev: 'danger', icon: '✗',
          body: e.message, confirmText: 'OK', cancelText: '' });
      }
    });
  }

  function renderSlotDetailPanel(meta) {
    const panel = document.getElementById('rg-slots-detail');
    if (!panel) return;
    const current = meta.currentSlot;
    const slot = current ? meta['slot' + current] : null;
    if (!slot) {
      panel.hidden = true;
      panel.textContent = '';
      return;
    }
    // Round 128 — substrate-rooted detail panel. Reads user-chosen icon + color
    // from slot meta; no hardcoded fallbacks except color rotation (which IS
    // user-overridable via Customize).
    const accentName = slot.accent || defaultAccentForSlot(current);
    const pal = getPalette(accentName);
    const stats = slot.stats || { supplements: 0, foods: 0, essentialsCovered: 0, essentialsTotal: 92 };
    const numStr = (current < 10 ? '0' : '') + current;
    let lastEdited = slot.lastEdited || '';
    try { lastEdited = new Date(slot.lastEdited).toLocaleDateString(); } catch (_) {}

    const iconBlock = slot.iconName
      ? '<span class="rg-slot-detail-personality" style="color:' + pal.mid + ';">' + iconSVG(slot.iconName) + '</span>'
      : '';

    panel.hidden = false;
    panel.innerHTML =
      '<div class="rg-slot-detail-num" style="background:' + pal.fg + ';border-color:' + pal.mid + ';">' + numStr + '</div>'
      + '<div class="rg-slot-detail-info">'
        + '<div class="rg-slot-detail-title">' + iconBlock + escapeRgSlot(slot.label) + '</div>'
        + '<div class="rg-slot-detail-sub">Last edited ' + escapeRgSlot(lastEdited) + '</div>'
      + '</div>'
      + '<div class="rg-slot-detail-stats">'
        + '<div class="rg-slot-stat"><span class="rg-slot-stat-icon">' + iconSVG('pill') + '</span><span class="rg-slot-stat-value"><strong>' + stats.supplements + '</strong> supplement' + (stats.supplements === 1 ? '' : 's') + '</span></div>'
        + '<div class="rg-slot-stat"><span class="rg-slot-stat-icon">' + iconSVG('leaf') + '</span><span class="rg-slot-stat-value"><strong>' + stats.foods + '</strong> food' + (stats.foods === 1 ? '' : 's') + '</span></div>'
        + '<div class="rg-slot-stat"><span class="rg-slot-stat-icon">' + iconSVG('atom') + '</span><span class="rg-slot-stat-value"><strong>' + stats.essentialsCovered + '</strong>/' + stats.essentialsTotal + ' essentials</span></div>'
      + '</div>'
      + '<div class="rg-slot-detail-status" style="background:' + pal.mist + ';">'
        + '<span class="rg-slot-detail-status-dot" style="background:' + pal.mid + ';"></span>'
        + '<span class="rg-slot-detail-status-text" style="color:' + pal.fg + ';">Current Regimen</span>'
      + '</div>';
  }

  function updateSaveButtonState(meta) {
    const dupBtn = document.getElementById('rg-slots-duplicate-btn');
    if (dupBtn) {
      const hasAnyFilled = !!(meta.slot1 || meta.slot2 || meta.slot3);
      const hasAnyEmpty = !meta.slot1 || !meta.slot2 || !meta.slot3;
      dupBtn.disabled = !(hasAnyFilled && hasAnyEmpty);
    }
  }

  function wireSlotCardClicks() {
    const grid = document.getElementById('rg-slots-grid');
    if (!grid || grid.dataset.wired === '1') return;
    grid.dataset.wired = '1';
    grid.addEventListener('click', function(ev) {
      // Delete button takes priority — don't trigger card activation
      const delBtn = ev.target.closest('.rg-slot-delete-btn');
      if (delBtn) {
        ev.stopPropagation();
        ev.preventDefault();
        const n = parseInt(delBtn.dataset.slotDelete, 10);
        if (n >= 1 && n <= 3) confirmDeleteSlot(n);
        return;
      }
      const card = ev.target.closest('.rg-slot-card');
      if (!card) return;
      handleSlotCardActivation(card);
    });
    grid.addEventListener('keydown', function(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const delBtn = ev.target.closest('.rg-slot-delete-btn');
      if (delBtn) {
        ev.preventDefault();
        const n = parseInt(delBtn.dataset.slotDelete, 10);
        if (n >= 1 && n <= 3) confirmDeleteSlot(n);
        return;
      }
      const card = ev.target.closest('.rg-slot-card');
      if (!card) return;
      ev.preventDefault();
      handleSlotCardActivation(card);
    });
  }

  function handleSlotCardActivation(card) {
    const slotId = card.dataset.slot;
    if (slotId === 'next') {
      const target = parseInt(card.dataset.target, 10);
      promptSaveToSlot(target);
      return;
    }
    const n = parseInt(slotId, 10);
    if (!(n >= 1 && n <= 3)) return;
    const meta = readSlotMeta();
    if (!meta['slot' + n]) {
      promptSaveToSlot(n);
    } else {
      if (meta.currentSlot === n) return;
      try {
        loadFromSlot(n);
        renderRegimenSlots();
        if (typeof window.renderRegimen === 'function') { try { window.renderRegimen(); } catch (_) {} }
      } catch (e) {
        showLcModal({
          title: 'Load failed', titleSev: 'danger', icon: '✗',
          body: 'Could not load slot ' + n + ': ' + e.message,
          confirmText: 'OK', cancelText: ''
        });
      }
    }
  }

  function promptSaveToSlot(n) {
    showCustomizeSlotModal(n);
  }

  // Round 128 — "Customize slot" modal. Replaces the plain-input save flow.
  // Live preview at top, name input, 25-icon grid (grouped by category with
  // tinted backgrounds), 8-color palette row rendered as mini slot-card
  // previews. Build is "choose your character" energy — gamified personalization
  // without going corny. Uses showLcModal's bodyHtml + stamps event handlers
  // after the modal renders.
  function showCustomizeSlotModal(n) {
    const meta = readSlotMeta();
    const existing = meta['slot' + n];
    const initial = {
      label: existing ? existing.label : '',
      iconName: existing ? (existing.iconName || null) : null,
      accent: existing ? (existing.accent || defaultAccentForSlot(n)) : defaultAccentForSlot(n)
    };
    let state = Object.assign({}, initial);
    const sessionId = 'cust' + n + '-' + Date.now();

    function previewCardHtml(s) {
      const pal = getPalette(s.accent);
      const iconBlock = s.iconName
        ? '<span style="color:' + pal.fg + ';display:inline-flex;align-items:center;font-size:14px;">' + iconSVG(s.iconName) + '</span>'
        : '';
      const labelText = s.label ? escapeRgSlot(s.label) : '<span style="opacity:0.45;">Untitled slot</span>';
      return '<div id="cust-preview-card-' + sessionId + '" style="background:#f5fbf9;border-radius:10px;border-left:4px solid ' + pal.mid + ';padding:14px 18px 12px 14px;display:flex;align-items:center;gap:14px;font-family:Inter,system-ui,sans-serif;">'
        + '<div style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:34px;font-weight:700;color:' + pal.fg + ';letter-spacing:-0.03em;line-height:1;">' + (n < 10 ? '0' : '') + n + '</div>'
        + '<div style="flex:1;display:flex;flex-direction:column;gap:2px;">'
          + '<div style="display:flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:#1f2937;">' + iconBlock + '<span>' + labelText + '</span></div>'
          + '<div style="font-size:12px;color:' + pal.mid + ';font-weight:500;">Live preview · how this slot will look</div>'
        + '</div>'
      + '</div>';
    }

    function iconCellHtml(icon) {
      const tint = ICON_GROUP_TINTS[icon.group] || ICON_GROUP_TINTS.daily;
      return '<button type="button" data-cust-icon="' + icon.name + '" title="' + escapeRgSlot(icon.label) + '" '
        + 'style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;'
        + 'background:' + tint.bg + ';border:1px solid ' + tint.bg + ';border-radius:9px;'
        + 'padding:10px 4px 6px;cursor:pointer;font-family:inherit;color:' + tint.fg + ';'
        + 'transition:transform 0.12s, border-color 0.12s, box-shadow 0.12s;"'
        + '>'
        + '<span style="font-size:20px;line-height:1;display:flex;align-items:center;">' + iconSVG(icon.name) + '</span>'
        + '<span style="font-size:9px;letter-spacing:0.04em;text-transform:uppercase;color:' + tint.fg + ';opacity:0.7;font-weight:500;">' + escapeRgSlot(icon.label) + '</span>'
      + '</button>';
    }

    function colorSwatchHtml(name) {
      const pal = getPalette(name);
      return '<button type="button" data-cust-color="' + name + '" title="' + escapeRgSlot(pal.label) + '" '
        + 'style="position:relative;background:#f5fbf9;border:1.5px solid ' + pal.mid + ';border-left:4px solid ' + pal.mid + ';border-radius:8px;'
        + 'padding:10px 8px 8px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:flex-start;gap:2px;'
        + 'transition:transform 0.12s, box-shadow 0.12s;width:100%;"'
        + '>'
        + '<span style="font-family:\'Space Grotesk\',Inter,sans-serif;font-size:18px;font-weight:700;color:' + pal.fg + ';letter-spacing:-0.02em;line-height:1;">' + (n < 10 ? '0' : '') + n + '</span>'
        + '<span style="font-size:10px;color:' + pal.fg + ';opacity:0.8;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;">' + escapeRgSlot(pal.label) + '</span>'
      + '</button>';
    }

    function iconNoneCellHtml() {
      return '<button type="button" data-cust-icon="__none__" title="No icon" '
        + 'style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;'
        + 'background:#f3f4f6;border:1px dashed #9ca3af;border-radius:9px;'
        + 'padding:10px 4px 6px;cursor:pointer;font-family:inherit;color:#6b7280;'
        + 'transition:transform 0.12s, border-color 0.12s;"'
        + '>'
        + '<span style="font-size:20px;line-height:1;display:flex;align-items:center;">' + iconSVG('x') + '</span>'
        + '<span style="font-size:9px;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;opacity:0.85;font-weight:500;">No icon</span>'
      + '</button>';
    }

    const groupedIcons = {};
    ICON_REGISTRY.forEach(function(ic) {
      if (!groupedIcons[ic.group]) groupedIcons[ic.group] = [];
      groupedIcons[ic.group].push(ic);
    });
    const groupOrder = ['energetic','calming','focus','structural','daily'];
    const groupLabels = { energetic: 'Activation', calming: 'Restore', focus: 'Focus', structural: 'Structure', daily: 'Daily' };

    let iconGridHtml = '';
    groupOrder.forEach(function(g) {
      const items = groupedIcons[g] || [];
      iconGridHtml += '<div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;font-weight:600;margin:10px 0 6px;">' + groupLabels[g] + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">'
        + items.map(iconCellHtml).join('') + '</div>';
    });
    // Append a "No icon" cell as the final option in its own row
    iconGridHtml += '<div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;font-weight:600;margin:10px 0 6px;">Opt out</div>'
                  + '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">' + iconNoneCellHtml() + '</div>';

    const colorRowHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">'
      + PALETTE_ORDER.map(colorSwatchHtml).join('')
      + '</div>';

    const inputId = 'cust-name-' + sessionId;
    const previewHostId = 'cust-preview-' + sessionId;
    const iconHostId = 'cust-icons-' + sessionId;
    const colorHostId = 'cust-colors-' + sessionId;

    const bodyHtml =
      '<div style="font-family:Inter,system-ui,-apple-system,sans-serif;color:#1f2937;">'
        + '<div id="' + previewHostId + '" style="margin-bottom:14px;">' + previewCardHtml(state) + '</div>'
        + '<label for="' + inputId + '" style="display:block;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:5px;">Name your slot</label>'
        + '<input id="' + inputId + '" type="text" maxlength="60" value="' + escapeRgSlot(state.label) + '" placeholder="Untitled slot" '
        + 'style="width:100%;padding:11px 14px;font-size:15px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;background:#fff;color:#1f2937;font-family:inherit;margin-bottom:14px;" autocomplete="off">'
        + '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:2px;">Pick an icon</div>'
        + '<div id="' + iconHostId + '">' + iconGridHtml + '</div>'
        + '<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;font-weight:600;margin:14px 0 5px;">Pick a color</div>'
        + '<div id="' + colorHostId + '">' + colorRowHtml + '</div>'
      + '</div>';

    showLcModal({
      title: existing ? 'Customize slot ' + n : 'Save to slot ' + n,
      titleSev: 'info',
      icon: '✎',
      bodyHtml: bodyHtml,
      confirmText: 'Save slot',
      cancelText: 'Cancel'
    }).then(function(ok) {
      if (!ok) return;
      const nameEl = document.getElementById(inputId);
      const finalLabel = nameEl ? String(nameEl.value || '').trim() : '';
      try {
        saveCurrentToSlot(n, finalLabel || ('Slot ' + n), { iconName: state.iconName, accent: state.accent });
        renderRegimenSlots();
      } catch (e) {
        showLcModal({ title: 'Save failed', titleSev: 'danger', icon: '✗',
          body: 'Could not save slot ' + n + ': ' + e.message, confirmText: 'OK', cancelText: '' });
      }
    });

    // Wire interactivity once the modal has rendered (next microtask).
    setTimeout(function() {
      const previewHost = document.getElementById(previewHostId);
      const iconHost = document.getElementById(iconHostId);
      const colorHost = document.getElementById(colorHostId);
      const nameEl = document.getElementById(inputId);

      function applyIconHighlight() {
        if (!iconHost) return;
        iconHost.querySelectorAll('button[data-cust-icon]').forEach(function(btn) {
          const isSel = (btn.dataset.custIcon === '__none__' && state.iconName === null)
                     || (btn.dataset.custIcon === state.iconName);
          btn.style.transform = isSel ? 'scale(1.04)' : '';
          btn.style.boxShadow = isSel ? '0 0 0 2px #1d9e75 inset' : '';
          btn.style.borderColor = isSel ? '#1d9e75' : btn.style.borderColor;
        });
      }
      function applyColorHighlight() {
        if (!colorHost) return;
        colorHost.querySelectorAll('button[data-cust-color]').forEach(function(btn) {
          const isSel = btn.dataset.custColor === state.accent;
          btn.style.transform = isSel ? 'scale(1.04)' : '';
          btn.style.boxShadow = isSel ? '0 0 0 2px #1d9e75 inset' : '';
        });
      }
      function refreshPreview() {
        if (!previewHost) return;
        previewHost.innerHTML = previewCardHtml(state);
      }
      function setIcon(name) {
        state.iconName = (name === '__none__') ? null : name;
        applyIconHighlight();
        refreshPreview();
      }
      function setColor(name) {
        state.accent = name;
        applyColorHighlight();
        refreshPreview();
      }

      if (iconHost) {
        iconHost.addEventListener('click', function(ev) {
          const btn = ev.target.closest('button[data-cust-icon]');
          if (!btn) return;
          setIcon(btn.dataset.custIcon);
        });
      }
      if (colorHost) {
        colorHost.addEventListener('click', function(ev) {
          const btn = ev.target.closest('button[data-cust-color]');
          if (!btn) return;
          setColor(btn.dataset.custColor);
        });
      }
      if (nameEl) {
        nameEl.addEventListener('input', function() {
          state.label = nameEl.value || '';
          refreshPreview();
        });
        nameEl.focus();
      }
      applyIconHighlight();
      applyColorHighlight();
    }, 30);
  }
  window.showCustomizeSlotModal = showCustomizeSlotModal;

  // Round 131 — Visible diagnostic toast. Shown via fixed-position div appended
  // to body, so it's visible regardless of modal layering or showLcModal state.
  // Self-destructs after 8 seconds. Used when delete path fails — surfaces ground
  // truth to the user so we can stop guessing what's broken.
  function flashDeleteDiag(msg) {
    try {
      const tag = document.createElement('div');
      tag.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#7a1f1f;color:#fff;padding:14px 20px;border-radius:8px;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,0.45);font:13px/1.45 -apple-system,system-ui,sans-serif;max-width:80vw;letter-spacing:0.01em;';
      tag.textContent = '[delete diagnostic] ' + msg;
      document.body.appendChild(tag);
      setTimeout(function() { try { document.body.removeChild(tag); } catch (_) {} }, 8000);
    } catch (_) {}
    try { console.warn('[deleteSlot] ' + msg); } catch (_) {}
  }
  window.flashDeleteDiag = flashDeleteDiag;

  // Round 132 — showQuietToast: shared "did a thing" acknowledgment primitive.
  // Per the polish-with-leverage principle (design-knowledge.md), this is the
  // canonical surface for soft confirmations across the dashboard. Future
  // consumers: save confirmations, restore confirmations, import success,
  // any other "completed without ceremony" acknowledgment.
  //
  // Usage:
  //   showQuietToast('Moved to Recovery Vault');
  //   showQuietToast('Saved to slot 2');
  //
  // CSS sister: .lc-quiet-toast — handles all visual styling + animation.
  // JS responsibility: create element, set text, append to body, teardown
  // after animation completes (~3.1s).
  function showQuietToast(message) {
    if (!message) return;
    try {
      const el = document.createElement('div');
      el.className = 'lc-quiet-toast';
      el.textContent = String(message);
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
      setTimeout(function() {
        try { document.body.removeChild(el); } catch (_) {}
      }, 3100);
    } catch (_) {}
  }
  window.showQuietToast = showQuietToast;

  // Round 132 — runDeleteCeremony: shared delete-with-animation flow.
  // Tags the card with .is-deleting (CSS handles the 600ms ceremony), shows
  // the quiet toast, then commits the data mutation + re-render after the
  // animation completes. Decoupled into its own function so future delete
  // surfaces (wishlist items, regimen items, trash entries) can call the
  // same primitive with their own (slotElement, deleteFn, toastMessage) args.
  //
  // Args:
  //   cardEl       — DOM element to animate (the visual deletable)
  //   doDelete     — function called after animation completes to mutate data
  //   doRender     — function called after doDelete to refresh the UI
  //   toastMessage — string shown via showQuietToast (e.g., 'Moved to Recovery Vault')
  //   onError      — optional function called if doDelete or doRender throws
  function runDeleteCeremony(cardEl, doDelete, doRender, toastMessage, onError) {
    if (toastMessage) showQuietToast(toastMessage);
    let fired = false;
    function complete() {
      if (fired) return;
      fired = true;
      try {
        if (typeof doDelete === 'function') doDelete();
        if (typeof doRender === 'function') doRender();
      } catch (e) {
        if (typeof onError === 'function') {
          try { onError(e); } catch (_) {}
        } else if (typeof flashDeleteDiag === 'function') {
          flashDeleteDiag('Delete ceremony commit threw: ' + (e && e.message || e));
        }
      }
    }
    if (!cardEl) {
      // No element to animate — just complete immediately
      complete();
      return;
    }
    cardEl.classList.add('is-deleting');
    cardEl.addEventListener('animationend', complete, { once: true });
    // Safety timeout — if animationend doesn't fire (very old browser,
    // prefers-reduced-motion may shorten to 1ms), force completion at 750ms.
    setTimeout(complete, 750);
  }
  window.runDeleteCeremony = runDeleteCeremony;

  function confirmDeleteSlot(n) {
    try { console.log('[deleteSlot] confirmDeleteSlot called for slot ' + n); } catch (_) {}
    let meta;
    try {
      meta = readSlotMeta();
    } catch (e) {
      flashDeleteDiag('readSlotMeta threw: ' + (e && e.message || e));
      return;
    }
    const slot = meta['slot' + n];
    if (!slot) {
      const presentKeys = Object.keys(meta).filter(function(k) { return k.indexOf('slot') === 0 && meta[k]; });
      flashDeleteDiag('Slot ' + n + ' lookup returned null. Slots with data: ' + (presentKeys.join(', ') || '(none)') + '. currentSlot=' + meta.currentSlot);
      return;
    }
    // Round 131 — Use window.showLcModal explicitly. The bare `showLcModal`
    // identifier was failing to resolve from outer-script scope because
    // showLcModal lives inside an IIFE (function declarations inside an IIFE
    // are scoped to that IIFE, not the outer script). Exposed as
    // window.showLcModal inside the IIFE; we read it here.
    const modalFn = window.showLcModal;
    if (typeof modalFn !== 'function') {
      flashDeleteDiag('window.showLcModal is not a function (type: ' + typeof modalFn + '). The IIFE must expose it.');
      return;
    }
    try {
      const p = modalFn({
        title: 'Delete slot ' + n + '?',
        titleSev: 'warn',
        icon: '⚠',
        body: 'This will permanently delete "' + slot.label + '" (slot ' + n + '). The slot becomes empty. Your CURRENT regimen state is not affected — only the saved snapshot is removed.',
        confirmText: 'Delete slot',
        cancelText: 'Keep slot',
        confirmDanger: true
      });
      if (!p || typeof p.then !== 'function') {
        flashDeleteDiag('showLcModal returned non-Promise: ' + typeof p);
        return;
      }
      p.then(function(ok) {
        if (!ok) return;
        // Round 132 — delete ceremony: animate the card + soft toast + delayed
        // data mutation. Decoupled so future deletables consume the same flow.
        const grid = document.getElementById('rg-slots-grid');
        const cardEl = grid ? grid.querySelector('.rg-slot-card[data-slot="' + n + '"]') : null;
        runDeleteCeremony(
          cardEl,
          function() { deleteSlot(n); },
          function() { renderRegimenSlots(); },
          'Moved to Recovery Vault',
          function(e) { flashDeleteDiag('Delete commit threw: ' + (e && e.message || e)); }
        );
      }, function(err) {
        flashDeleteDiag('Modal Promise rejected: ' + (err && err.message || err));
      });
    } catch (e) {
      flashDeleteDiag('showLcModal threw: ' + (e && e.message || e));
    }
  }
  window.confirmDeleteSlot = confirmDeleteSlot;

  function wireSlotActionButtons() {
    const importBtn = document.getElementById('rg-slots-import-btn');
    const exportBtn = document.getElementById('rg-slots-export-btn');
    const dupBtn    = document.getElementById('rg-slots-duplicate-btn');
    const saveBtn   = document.getElementById('rg-slots-save-btn');
    const iconBtn   = document.getElementById('rg-slots-icon-btn');
    if (iconBtn && !iconBtn.dataset.wired) {
      iconBtn.dataset.wired = '1';
      iconBtn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        toggleVaultMode();
      });
    }

    if (importBtn && !importBtn.dataset.wired) {
      importBtn.dataset.wired = '1';
      importBtn.addEventListener('click', function() {
        if (typeof window.openImportCartModal === 'function') {
          window.openImportCartModal();
        } else {
          showLcModal({ title: 'Import unavailable', titleSev: 'warn', icon: '⚠',
            body: 'Import modal is not wired in this build.', confirmText: 'OK', cancelText: '' });
        }
      });
    }
    if (exportBtn && !exportBtn.dataset.wired) {
      exportBtn.dataset.wired = '1';
      exportBtn.addEventListener('click', function() {
        if (typeof window.openExportCartModal === 'function') {
          window.openExportCartModal();
        } else {
          const meta = readSlotMeta();
          const cur = meta.currentSlot;
          const defaultLabel = cur && meta['slot' + cur] ? meta['slot' + cur].label : 'My regimen';
          showSlotInputModal({
            title: 'Export cartridge', icon: '⤒',
            label: 'Cartridge label (becomes the filename)',
            defaultValue: defaultLabel,
            confirmText: 'Download'
          }).then(function(r) {
            if (!r.ok) return;
            downloadAsCart(buildDataExport(), r.value || defaultLabel);
          });
        }
      });
    }
    if (dupBtn && !dupBtn.dataset.wired) {
      dupBtn.dataset.wired = '1';
      dupBtn.addEventListener('click', function() {
        const meta = readSlotMeta();
        const cur = meta.currentSlot;
        if (!cur) {
          showLcModal({ title: 'No slot loaded', titleSev: 'info', icon: 'ℹ',
            body: 'Load a slot first, then click Duplicate to copy it to an empty slot.',
            confirmText: 'OK', cancelText: '' });
          return;
        }
        const empty = !meta.slot1 ? 1 : !meta.slot2 ? 2 : (!meta.slot3 ? 3 : null);
        if (!empty) {
          showLcModal({ title: 'All slots are full', titleSev: 'warn', icon: '⚠',
            body: 'Delete a slot first to make room for a duplicate.',
            confirmText: 'OK', cancelText: '' });
          return;
        }
        const source = meta['slot' + cur];
        showSlotInputModal({
          title: 'Duplicate slot ' + cur + ' → slot ' + empty, icon: '⎘',
          label: 'Name the duplicated slot',
          defaultValue: (source.label || ('Slot ' + cur)) + ' (copy)',
          confirmText: 'Duplicate'
        }).then(function(r) {
          if (!r.ok) return;
          try {
            saveCurrentToSlot(empty, r.value || (source.label + ' (copy)'));
            renderRegimenSlots();
          } catch (e) {
            showLcModal({ title: 'Duplicate failed', titleSev: 'danger', icon: '✗',
              body: e.message, confirmText: 'OK', cancelText: '' });
          }
        });
      });
    }
    if (saveBtn && !saveBtn.dataset.wired) {
      saveBtn.dataset.wired = '1';
      saveBtn.addEventListener('click', function() {
        // Round 138 (Phase 4) — button now invokes the three-option New Regimen
        // flow. The legacy "save current to active slot" path is preserved via
        // openNewRegimenModal's Save branch (which routes through saveCurrentToSlot
        // for an empty slot) but the previous always-save semantics are GONE —
        // every press now passes through the explicit choice modal so users
        // never silently overwrite a slot.
        if (typeof window.openNewRegimenModal === 'function') {
          window.openNewRegimenModal();
        } else {
          // Fallback path if the modal helper somehow didn't wire — should never
          // trigger in production but graceful-degradation per doctrine §7.
          showLcModal({
            title: 'New regimen flow unavailable',
            titleSev: 'warn', icon: '⚠',
            body: 'The New Regimen modal is not wired in this build. Falling back to legacy save behavior.',
            confirmText: 'OK', cancelText: ''
          });
          const meta = readSlotMeta();
          const cur = meta.currentSlot;
          if (cur) {
            promptSaveToSlot(cur);
          } else {
            const empty = !meta.slot1 ? 1 : !meta.slot2 ? 2 : (!meta.slot3 ? 3 : 1);
            promptSaveToSlot(empty);
          }
        }
      });
    }
  }

  function initRegimenSlots() {
    if (!document.getElementById('rg-slots-section')) return;
    wireSlotActionButtons();
    renderRegimenSlots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegimenSlots);
  } else {
    initRegimenSlots();
  }

  window.renderRegimenSlots = renderRegimenSlots;
  window.initRegimenSlots = initRegimenSlots;

  // ----- Import + Export modals (Round 126) -----

  function openImportCartModal() {
    let picker = document.getElementById('rg-cart-file-picker');
    if (!picker) {
      picker = document.createElement('input');
      picker.type = 'file';
      picker.id = 'rg-cart-file-picker';
      picker.accept = '.cart,.json,application/json';
      picker.style.display = 'none';
      picker.addEventListener('change', handleCartFileSelected);
      document.body.appendChild(picker);
    }
    picker.value = '';
    picker.click();
  }

  function handleCartFileSelected(ev) {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
      let bundle;
      try {
        bundle = parseImportBundle(reader.result);
      } catch (e) {
        showLcModal({
          title: 'Import failed',
          titleSev: 'danger', icon: '✗',
          body: e.message,
          confirmText: 'OK', cancelText: ''
        });
        return;
      }
      showImportPreviewModal(bundle, file.name);
    };
    reader.onerror = function() {
      showLcModal({ title: 'Could not read file', titleSev: 'danger', icon: '✗',
        body: String(reader.error && reader.error.message || 'unknown error'),
        confirmText: 'OK', cancelText: '' });
    };
    reader.readAsText(file);
  }

  function summarizeBundle(bundle) {
    const out = { supplements: 0, foods: 0, wishlist: 0, scans: 0, outcomes: 0, label: '', exportedAt: '' };
    const keys = bundle.keys || {};
    const regEntry = keys['lcRegimen_v1'] && keys['lcRegimen_v1'].value;
    const manEntry = keys['rgManualItems_v1'] && keys['rgManualItems_v1'].value;
    const regItems = (regEntry && Array.isArray(regEntry.items)) ? regEntry.items : [];
    const manItems = Array.isArray(manEntry) ? manEntry : [];
    const items = regItems.concat(manItems);
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const kind = String(it.kind || '').toLowerCase();
      if (kind === 'diet' || kind === 'food') out.foods++; else out.supplements++;
    }
    const wl = keys['lcWishlist_v1'] && keys['lcWishlist_v1'].value;
    if (Array.isArray(wl)) out.wishlist = wl.length;
    const sc = keys['lcRecentScans_v1'] && keys['lcRecentScans_v1'].value;
    if (Array.isArray(sc)) out.scans = sc.length;
    const oc = keys['rgOutcomes_v1'] && keys['rgOutcomes_v1'].value;
    if (oc && typeof oc === 'object') out.outcomes = Object.keys(oc).length;
    out.label = (bundle._export && bundle._export.label) || '';
    out.exportedAt = (bundle._export && bundle._export.exported_at) || '';
    return out;
  }

  function showImportPreviewModal(bundle, filename) {
    const sum = summarizeBundle(bundle);
    const curBundle = buildDataExport();
    const curSum = summarizeBundle(curBundle);
    let exportedStr = '';
    try { exportedStr = sum.exportedAt ? new Date(sum.exportedAt).toLocaleString() : ''; } catch (_) {}

    // Round 138 — surface creator + description from the bundle to the importer
    // so they see who made the cart and what it's for before they confirm. This
    // is the cart-as-share-primitive contract: attribution is visible to the
    // importer at the decision point, not hidden in JSON.
    const cartCreator = (bundle._export && bundle._export.creator) || '';
    const cartDescription = (bundle._export && bundle._export.description) || '';

    const html =
      '<div style="margin-bottom:14px;padding:10px 12px;background:#E1F5EE;border-radius:6px;border-left:3px solid #1d9e75;">'
        + '<div style="font-size:11px;color:#0F6E56;letter-spacing:0.06em;margin-bottom:4px;">CARTRIDGE</div>'
        + '<div style="font-size:14px;font-weight:500;color:#085041;">' + escapeRgSlot(sum.label || filename || 'Untitled') + '</div>'
        + (cartCreator ? '<div style="font-size:12px;color:#085041;margin-top:4px;">by <strong>' + escapeRgSlot(cartCreator) + '</strong></div>' : '')
        + (exportedStr ? '<div style="font-size:11px;color:#2d8276;margin-top:2px;">Exported ' + escapeRgSlot(exportedStr) + '</div>' : '')
        + (cartDescription ? '<div style="font-size:12px;color:#2E3742;margin-top:8px;padding-top:8px;border-top:1px solid rgba(15,110,86,0.25);white-space:pre-wrap;">' + escapeRgSlot(cartDescription) + '</div>' : '')
      + '</div>'
      + '<table style="width:100%;font-size:12px;margin-bottom:14px;border-collapse:collapse;">'
        + '<thead><tr style="color:#5f6a78;font-size:11px;letter-spacing:0.04em;">'
          + '<th style="text-align:left;padding:4px 0;font-weight:500;">Section</th>'
          + '<th style="text-align:right;padding:4px 0;font-weight:500;">Current</th>'
          + '<th style="text-align:right;padding:4px 0;font-weight:500;">Cartridge</th>'
        + '</tr></thead><tbody>'
        + '<tr><td style="padding:4px 0;">Supplements</td><td style="text-align:right;">' + curSum.supplements + '</td><td style="text-align:right;font-weight:500;color:#085041;">' + sum.supplements + '</td></tr>'
        + '<tr><td style="padding:4px 0;">Foods</td><td style="text-align:right;">' + curSum.foods + '</td><td style="text-align:right;font-weight:500;color:#085041;">' + sum.foods + '</td></tr>'
        + '<tr><td style="padding:4px 0;">Wishlist</td><td style="text-align:right;">' + curSum.wishlist + '</td><td style="text-align:right;font-weight:500;color:#085041;">' + sum.wishlist + '</td></tr>'
        + '<tr><td style="padding:4px 0;">Recent scans</td><td style="text-align:right;">' + curSum.scans + '</td><td style="text-align:right;font-weight:500;color:#085041;">' + sum.scans + '</td></tr>'
        + '<tr><td style="padding:4px 0;">Outcomes</td><td style="text-align:right;">' + curSum.outcomes + '</td><td style="text-align:right;font-weight:500;color:#085041;">' + sum.outcomes + '</td></tr>'
      + '</tbody></table>'
      + '<div style="margin-bottom:6px;font-size:12px;font-weight:500;color:#2E3742;">Strategy</div>'
      + '<label style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid #b5bcc4;border-radius:6px;margin-bottom:6px;cursor:pointer;" data-strategy="replace">'
        + '<input type="radio" name="rg-import-strategy" value="replace" checked style="margin-top:2px;">'
        + '<div><div style="font-weight:500;font-size:12px;color:#2E3742;">Replace</div><div style="font-size:11px;color:#5f6a78;">Overwrite your current data with the cartridge. Use when adopting a shared stack.</div></div>'
      + '</label>'
      + '<label style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;" data-strategy="merge">'
        + '<input type="radio" name="rg-import-strategy" value="merge" style="margin-top:2px;">'
        + '<div><div style="font-weight:500;font-size:12px;color:#2E3742;">Merge</div><div style="font-size:11px;color:#5f6a78;">Add cartridge items to current; skip duplicates by id. Use when adding pieces of someone else\'s stack to yours.</div></div>'
      + '</label>';

    showLcModal({
      title: 'Import cartridge',
      titleSev: 'info', icon: '⤓',
      bodyHtml: html,
      confirmText: 'Apply cartridge',
      cancelText: 'Cancel'
    }).then(function(ok) {
      if (!ok) return;
      const radios = document.querySelectorAll('input[name="rg-import-strategy"]');
      let strategy = 'replace';
      for (const r of radios) { if (r.checked) { strategy = r.value; break; } }
      try {
        applyImportBundle(bundle, strategy);
        renderRegimenSlots();
        if (typeof window.renderRegimen === 'function') { try { window.renderRegimen(); } catch (_) {} }
        showLcModal({
          title: 'Cartridge applied',
          titleSev: 'info', icon: '✓',
          body: 'Imported ' + sum.supplements + ' supplements, ' + sum.foods + ' foods, ' + sum.wishlist + ' wishlist items.',
          confirmText: 'OK', cancelText: ''
        });
      } catch (e) {
        showLcModal({
          title: 'Apply failed',
          titleSev: 'danger', icon: '✗',
          body: e.message,
          confirmText: 'OK', cancelText: ''
        });
      }
    });
  }

  function openExportCartModal() {
    const meta = readSlotMeta();
    const cur = meta.currentSlot;
    const defaultLabel = cur && meta['slot' + cur] ? meta['slot' + cur].label : 'My regimen';

    // Round 138 — surface saved creator/description from prior exports if any.
    // We don't persist these in LS (would couple them to LS schema bloat); we
    // re-read the last-active slot's cached _export metadata if the user is
    // re-exporting from a loaded slot, otherwise empty defaults.
    const lastExportMeta = (cur && meta['slot' + cur] && meta['slot' + cur].lastExportMeta) || {};
    const defaultCreator = lastExportMeta.creator || '';
    const defaultDescription = lastExportMeta.description || '';

    const html =
      '<div style="margin-bottom:14px;">'
        + '<label style="display:block;font-size:12px;font-weight:500;color:#2E3742;margin-bottom:6px;">Cartridge label</label>'
        + '<input type="text" id="rg-export-label-input" maxlength="60" value="' + escapeRgSlot(defaultLabel) + '" placeholder="e.g., Morning Reset, Travel Stack..." style="width:100%;padding:8px 10px;font-size:13px;border:1px solid #b5bcc4;border-radius:6px;box-sizing:border-box;">'
        + '<div style="font-size:11px;color:#5f6a78;margin-top:4px;">Becomes the filename — letters, numbers, hyphens only.</div>'
      + '</div>'
      + '<div style="margin-bottom:14px;">'
        + '<label style="display:block;font-size:12px;font-weight:500;color:#2E3742;margin-bottom:6px;">Your name (optional, for sharing)</label>'
        + '<input type="text" id="rg-export-creator-input" maxlength="80" value="' + escapeRgSlot(defaultCreator) + '" placeholder="e.g., Dr. Joel Wallach, or just your handle" style="width:100%;padding:8px 10px;font-size:13px;border:1px solid #b5bcc4;border-radius:6px;box-sizing:border-box;">'
        + '<div style="font-size:11px;color:#5f6a78;margin-top:4px;">If you share this cart, importers see who made it. Leave blank for a personal backup.</div>'
      + '</div>'
      + '<div style="margin-bottom:14px;">'
        + '<label style="display:block;font-size:12px;font-weight:500;color:#2E3742;margin-bottom:6px;">Description (optional)</label>'
        + '<textarea id="rg-export-description-input" maxlength="400" rows="3" placeholder="What this regimen is for, who it suits, anything an importer should know..." style="width:100%;padding:8px 10px;font-size:13px;border:1px solid #b5bcc4;border-radius:6px;box-sizing:border-box;resize:vertical;font-family:inherit;">' + escapeRgSlot(defaultDescription) + '</textarea>'
        + '<div style="font-size:11px;color:#5f6a78;margin-top:4px;">Helps importers understand the intent before they adopt it.</div>'
      + '</div>'
      + '<div style="margin-bottom:8px;font-size:12px;font-weight:500;color:#2E3742;">What to include</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px;">'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="lcRegimen_v1" checked> Regimen items</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="rgManualItems_v1" checked> Manual diet items</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="lcWishlist_v1" checked> Wishlist</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="lcRecentScans_v1" checked> Recent scans</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="rgOutcomes_v1" checked> Outcomes</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="rgOverrides_v1" checked> Item overrides</label>'
        + '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #b5bcc4;border-radius:6px;cursor:pointer;"><input type="checkbox" data-section="rgRemoved_v1" checked> Removed items log</label>'
      + '</div>'
      + '<div style="font-size:11px;color:#5f6a78;margin-top:8px;">Save slots and background preference are never included; they stay local to this dashboard.</div>';

    showLcModal({
      title: 'Eject cartridge',
      titleSev: 'info', icon: '⤒',
      bodyHtml: html,
      confirmText: 'Eject and download',
      cancelText: 'Cancel'
    }).then(function(ok) {
      if (!ok) return;
      const labelInput = document.getElementById('rg-export-label-input');
      const label = labelInput ? labelInput.value.trim() : defaultLabel;
      // Round 138 — collect Creator + Description from the new modal inputs.
      // Empty strings normalize to null so importers can distinguish
      // "self-export with no creator" from "third-party cart with creator set".
      const creatorInput = document.getElementById('rg-export-creator-input');
      const creator = creatorInput && creatorInput.value.trim() ? creatorInput.value.trim() : null;
      const descriptionInput = document.getElementById('rg-export-description-input');
      const description = descriptionInput && descriptionInput.value.trim() ? descriptionInput.value.trim() : null;
      const boxes = document.querySelectorAll('input[type="checkbox"][data-section]');
      const keep = {};
      for (const b of boxes) keep[b.dataset.section] = !!b.checked;
      const bundle = buildDataExport();
      bundle._export.label = label;
      bundle._export.creator = creator;
      bundle._export.description = description;
      const filteredKeys = {};
      for (const k of Object.keys(bundle.keys)) {
        if (keep[k] === false) continue;
        filteredKeys[k] = bundle.keys[k];
      }
      bundle.keys = filteredKeys;
      downloadAsCart(bundle, label);
    });
  }

  window.openImportCartModal = openImportCartModal;
  window.openExportCartModal = openExportCartModal;

  // ───────────────────────────────────────────────────────────────────────────
  // Round 138 (Phase 4 of vision-default-regimen.md) — "+ New regimen" flow
  // ───────────────────────────────────────────────────────────────────────────
  //
  // Replaces the bare "Save" button click. Three intents collapse into a single
  // modal with radio choice + confirm/cancel chrome (consistent with the Import
  // preview modal's Replace/Merge pattern):
  //
  //   (a) "Save current → Start new"  — save current state to next empty slot,
  //                                     then clear live state, then a fresh
  //                                     default slot creates on next add.
  //   (b) "Discard current → Start new" — clear live state WITHOUT saving;
  //                                     fresh default creates on next add.
  //   (c) "Cancel"                    — close modal, no state change.
  //
  // "Hover-pause" cue for the destructive option (per vision spec) is deferred
  // to a future polish round; current visual emphasis is the red border + ⚠
  // tag + plain-English consequence framing on the Discard option.

  function startNewRegimen() {
    // Clear the four live-state LS keys atomically (each through lsRemove for
    // schema-aware cleanup; the new default slot creates on next add via
    // ensureDefaultSlot → addItemToRegimen path).
    try { lsRemove('lcRegimen_v1'); } catch (_) {}
    try { lsRemove('rgManualItems_v1'); } catch (_) {}
    try { lsRemove('rgOverrides_v1'); } catch (_) {}
    try { lsRemove('rgRemoved_v1'); } catch (_) {}
    // Detach active slot binding so the next add fires ensureDefaultSlot fresh.
    try {
      const sys = loadSystem();
      sys.currentSlot = null;
      persistSystem(sys);
    } catch (e) {
      console.warn('[startNewRegimen] could not detach currentSlot', e);
    }
    // Re-render whatever surfaces are wired.
    try { renderRegimenSlots(); } catch (_) {}
    if (typeof window.renderRegimen === 'function') { try { window.renderRegimen(); } catch (_) {} }
    if (typeof showQuietToast === 'function') { try { showQuietToast('Started a new regimen'); } catch (_) {} }
  }

  function openNewRegimenModal() {
    const meta = readSlotMeta();
    const filledSlots = ['1','2','3'].filter(n => meta['slot' + n]).length;
    const emptySlot = !meta.slot1 ? 1 : (!meta.slot2 ? 2 : (!meta.slot3 ? 3 : null));
    const cur = meta.currentSlot;
    const curLabel = (cur && meta['slot' + cur]) ? meta['slot' + cur].label : null;

    // Compose body: contextual lead + 2 radio choices (save / discard) styled
    // to telegraph the difference. Save defaults to selected.
    const noEmptySlotMsg = emptySlot
      ? ''
      : '<div style="font-size:11px;color:#a05a1f;margin-top:4px;">⚠ All 3 slots are full — Save will require you to delete a slot first, or choose Discard.</div>';

    const html =
      '<div style="margin-bottom:12px;font-size:13px;color:#2E3742;line-height:1.5;">'
        + 'Starting a new regimen clears your current items so you can build something fresh. '
        + (curLabel ? 'Your active slot is <strong>' + escapeRgSlot(curLabel) + '</strong>. ' : '')
        + 'What should we do with the current state?'
      + '</div>'
      + '<label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:1px solid #b5bcc4;border-radius:6px;margin-bottom:8px;cursor:pointer;" data-strategy="save">'
        + '<input type="radio" name="rg-newreg-strategy" value="save"' + (emptySlot ? ' checked' : '') + ' style="margin-top:2px;">'
        + '<div><div style="font-weight:500;font-size:13px;color:#2E3742;">Save current → Start new</div>'
        + '<div style="font-size:11px;color:#5f6a78;margin-top:2px;">Saves your current regimen' + (emptySlot ? ' to slot ' + emptySlot : '') + ' first, then clears live state. You can return to it anytime.</div>'
        + noEmptySlotMsg
        + '</div>'
      + '</label>'
      + '<label style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:1px solid #d6877a;background:rgba(214,135,122,0.06);border-radius:6px;cursor:pointer;" data-strategy="discard">'
        + '<input type="radio" name="rg-newreg-strategy" value="discard"' + (emptySlot ? '' : ' checked') + ' style="margin-top:2px;">'
        + '<div><div style="font-weight:500;font-size:13px;color:#8d3a2a;">⚠ Discard current → Start new</div>'
        + '<div style="font-size:11px;color:#5f6a78;margin-top:2px;">Wipes your current regimen items without saving. ' + (filledSlots > 0 ? 'Items in your save slots are untouched.' : 'There are no save slots to fall back to — this is permanent.') + '</div>'
        + '</div>'
      + '</label>';

    return showLcModal({
      title: 'Start a new regimen',
      titleSev: 'info',
      icon: '＋',
      bodyHtml: html,
      confirmText: 'Start new regimen',
      cancelText: 'Cancel'
    }).then(function(ok) {
      if (!ok) return false;
      // Read the chosen strategy.
      const radios = document.querySelectorAll('input[name="rg-newreg-strategy"]');
      let strategy = emptySlot ? 'save' : 'discard';
      for (const r of radios) { if (r.checked) { strategy = r.value; break; } }
      if (strategy === 'save') {
        if (!emptySlot) {
          showLcModal({
            title: 'All slots are full',
            titleSev: 'warn', icon: '⚠',
            body: 'Delete a slot first to make room for the save, or pick Discard instead.',
            confirmText: 'OK', cancelText: ''
          });
          return false;
        }
        // Prompt for the slot label, then save + start new.
        return showSlotInputModal({
          title: 'Name your current regimen', icon: '⤓',
          label: 'Slot ' + emptySlot + ' label',
          defaultValue: curLabel || 'My regimen',
          confirmText: 'Save and start new'
        }).then(function(r) {
          if (!r.ok) return false;
          try {
            saveCurrentToSlot(emptySlot, r.value || ('Slot ' + emptySlot));
            startNewRegimen();
            return true;
          } catch (e) {
            showLcModal({ title: 'Save failed', titleSev: 'danger', icon: '✗',
              body: e.message, confirmText: 'OK', cancelText: '' });
            return false;
          }
        });
      }
      // strategy === 'discard'
      startNewRegimen();
      return true;
    });
  }

  window.startNewRegimen = startNewRegimen;
  window.openNewRegimenModal = openNewRegimenModal;
  // ───────────────────────────────────────────────────────────────────────────

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
      try { lsWrite(BG_KEY, choice); } catch(e) {}
      document.querySelectorAll('.bg-swatch').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === choice);
      });
    }
    function init() {
      let saved = '3';
      try { saved = lsRead(BG_KEY, '3'); } catch(e) {}
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

  // ── Benefit-pill citation popup (P3.6 / Round 57) ────────────────────────
  // Click handler for .benefit-pill.wallach-benefit opens a centered modal
  // citing the Wallach corpus for (essential, benefit) pair. Specific cites
  // for ~40 well-known pairs; for others, falls back to the essential's
  // primary source (from the now-error-mode source-rule allowlist).
  const BENEFIT_CITATIONS = {"Zinc": [{"match": "testosterone", "title": "Zinc → testosterone production", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Zinc is the prostate's master cofactor for testosterone synthesis; deficiency drops serum T and tanks libido. RDA range 15-50 mg/day per Let's Play Doctor."}, {"match": "wound", "title": "Zinc → wound healing", "cite": "Let's Play Doctor (Wallach) — Zinc is the cofactor for collagen cross-linking and skin repair; topical/oral protocol for slow-healing wounds is 50 mg/day."}, {"match": "immune", "title": "Zinc → immune function", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — T-cell maturation requires zinc; deficiency presents as recurrent infections, slow wound healing, white spots on nails."}, {"match": "taste", "title": "Zinc → taste / appetite", "cite": "Let's Play Doctor — Hypogeusia (loss of taste) is a classic zinc-deficiency presentation; reversible at 30-50 mg/day."}], "Magnesium": [{"match": "sleep", "title": "Magnesium → sleep quality", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Magnesium relaxes smooth muscle and quiets neural firing; bedtime dose 400-800 mg associated with deeper sleep, leg-cramp relief."}, {"match": "muscle", "title": "Magnesium → muscle relaxation / gym recovery", "cite": "Let's Play Doctor (Wallach) — Magnesium is the cofactor for ATP hydrolysis and muscle relaxation post-contraction; deficiency drives cramps, twitches, restless legs."}, {"match": "cardiovas", "title": "Magnesium → cardiovascular tone", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Magnesium is the natural calcium channel blocker; HBSP 2.5 delivers 620 mg/day via Beyond Osteo FX + BTT."}], "Boron": [{"match": "bone", "title": "Boron → bone density", "cite": "Dead Doctors Don't Lie (Wallach, 1999) + Rare Earths — Boron is essential for calcium retention in bone; deficiency presents as osteoporosis. HBSP 2.5 delivers 7 mg/day."}, {"match": "testosterone", "title": "Boron → testosterone optimization", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Boron raises serum testosterone and dihydrotestosterone; 6-7 mg/day from HBSP 2.5 maintains the hormonal baseline."}, {"match": "joint", "title": "Boron → joint integrity / arthritis", "cite": "Let's Play Doctor (Wallach) — Boron is a structural cofactor for cartilage matrix; deficiency tracks with osteoarthritis prevalence."}], "Iodine": [{"match": "thyroid", "title": "Iodine → thyroid function", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Iodine is required for T3/T4 synthesis; Ultimate Iodine (Youngevity) label-stated 300 mcg/day. Goiter prevention cofactor with Cu + Mo + Tyrosine."}, {"match": "metabolic", "title": "Iodine → metabolic rate", "cite": "Let's Play Doctor (Wallach) — Iodine deficiency drops basal metabolic rate; signs include cold intolerance, weight gain, low energy."}, {"match": "breast", "title": "Iodine → breast tissue health", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Iodine concentrates in breast tissue; sufficiency may protect against fibrocystic disease per Wallach's protocol notes."}], "Selenium": [{"match": "thyroid", "title": "Selenium → thyroid (T4 → T3 conversion)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Selenium is the cofactor for deiodinase enzymes that convert T4 to active T3; HBSP 2.5 delivers 100 mcg/day."}, {"match": "antioxidant", "title": "Selenium → glutathione peroxidase", "cite": "Let's Play Doctor (Wallach) — Selenium is the catalytic atom in glutathione peroxidase, the body's primary peroxide-scavenging enzyme."}], "Chromium": [{"match": "blood sugar", "title": "Chromium → blood sugar / insulin sensitivity", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Chromium picolinate is the cofactor for insulin receptor binding; deficiency presents as Type-2 diabetes risk. HBSP 2.5 delivers 200 mcg/day."}, {"match": "weight", "title": "Chromium → weight regulation", "cite": "Let's Play Doctor (Wallach) — Caffeine and sugar both deplete chromium 300% for 12 hours per dose; supplementation is the lever for stabilizing intake."}], "Vanadium": [{"match": "blood sugar", "title": "Vanadium → blood sugar (insulin mimetic)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Vanadium is insulin-mimetic; clinical dose 250 mcg for diabetes per Wallach. Slender FX Sweet Eze label: 200 mcg/day."}, {"match": "diabet", "title": "Vanadium → diabetes protocol", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — 50–200 mcg three times daily for blood sugar regulation in diabetic protocols."}], "Copper": [{"match": "aneurysm", "title": "Copper → aneurysm prevention", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Copper is required for lysyl oxidase, the enzyme that cross-links collagen + elastin in arterial walls. Deficiency tracks with aortic aneurysm risk. HBSP 2.5 delivers 1.1 mg/day."}, {"match": "connective", "title": "Copper → connective tissue / collagen", "cite": "Let's Play Doctor (Wallach) — Copper deficiency presents as fragile vessels, skin laxity, premature gray hair (also requires Cu)."}, {"match": "gray hair", "title": "Copper → hair pigmentation", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Copper is cofactor for tyrosinase, the enzyme producing melanin. Premature graying = copper deficiency marker."}], "Vitamin C (Ascorbic Acid)": [{"match": "collagen", "title": "Vitamin C → collagen synthesis", "cite": "Let's Play Doctor (Wallach) — Vitamin C is the cofactor for prolyl + lysyl hydroxylase in collagen formation. HBSP 2.5 delivers 1 g/day baseline."}, {"match": "immune", "title": "Vitamin C → immune function", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Wallach's flu/cold protocol is bowel-tolerance dosing (4-10 g/day in divided doses)."}, {"match": "antioxidant", "title": "Vitamin C → antioxidant", "cite": "Let's Play Doctor (Wallach) — Vitamin C regenerates vitamin E and quenches free radicals in aqueous compartments."}], "Vitamin E (Tocopherol)": [{"match": "fertility", "title": "Vitamin E → fertility / reproductive", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Vitamin E is the lipid-phase antioxidant of reproductive tissue; deficiency tracks with infertility and recurrent miscarriage. HBSP 2.5 delivers 100 mg/day."}, {"match": "cardio", "title": "Vitamin E → cardiovascular protection", "cite": "Let's Play Doctor (Wallach) — Vitamin E prevents LDL oxidation, which is the actual plaque-initiating event (not LDL itself per Wallach's framing)."}], "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)": [{"match": "bone", "title": "Vitamin D → calcium absorption / bone", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Vitamin D is required for intestinal calcium uptake and bone remodeling. HBSP 2.5 delivers 38.8 mcg/day combined D2+D3."}], "Vitamin B12 (Cobalamin)": [{"match": "nerve", "title": "Vitamin B12 → nerve / myelin", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B12 is the cofactor for myelin sheath maintenance; deficiency presents as peripheral neuropathy, tingling, balance issues. HBSP 2.5 delivers 0.5 mg/day."}, {"match": "energy", "title": "Vitamin B12 → energy / red blood cells", "cite": "Let's Play Doctor (Wallach) — B12 deficiency tracks with megaloblastic anemia (fatigue + pale + cognitive fog)."}], "Folic Acid (Folate)": [{"match": "DNA", "title": "Folate → DNA synthesis", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Folate is required for purine + pyrimidine synthesis; deficiency tracks with neural-tube defects, megaloblastic anemia. HBSP 2.5 delivers 400 mcg/day."}], "Calcium": [{"match": "bone", "title": "Calcium → bone matrix", "cite": "Let's Play Doctor (Wallach) — Calcium is the bone mineral substrate; HBSP 2.5 delivers 2.53 g/day via Beyond Osteo FX (Wallach's flagship bone-system pack)."}, {"match": "muscle", "title": "Calcium → muscle contraction", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Calcium triggers actin-myosin sliding; deficiency presents as cramps + tetany."}], "Omega-3 (alpha-linolenic + EPA/DHA in marine form)": [{"match": "cardio", "title": "Omega-3 → cardiovascular protection", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — EPA/DHA reduce systemic inflammation and platelet aggregation. HBSP 2.5 delivers 1.755 g/day via Ultimate EFA Plus."}, {"match": "brain", "title": "Omega-3 → brain / cognition", "cite": "Let's Play Doctor (Wallach) — DHA is a primary brain structural lipid; deficiency tracks with cognitive decline, mood disorders."}, {"match": "inflamm", "title": "Omega-3 → anti-inflammatory", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Omega-3:Omega-6 ratio is the key inflammatory-set-point lever."}], "Lysine": [{"match": "herpes", "title": "Lysine → herpes (HSV) suppression", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Lysine competes with arginine at viral replication sites; clinical dose 1-6 g/day 'to effect' with 500 mg/day maintenance."}], "Tryptophan": [{"match": "anxiety", "title": "Tryptophan → anxiety / serotonin precursor", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Tryptophan is the serotonin precursor; clinical anxiety/hypoglycemia stack uses up to 10 g three times daily."}], "Tyrosine": [{"match": "goiter", "title": "Tyrosine → goiter prevention (with iodine)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Tyrosine + Iodine + Cu + Mo are the four-cofactor stack for thyroid hormone synthesis; clinical dose 2 g t.i.d."}], "Taurine": [{"match": "macular", "title": "Taurine → macular degeneration", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Taurine concentrates in the retina; 2-5 g/day in Wallach's macular degeneration protocol. Maintenance 500 mg t.i.d."}], "Phenylalanine": [{"match": "joint", "title": "Phenylalanine → joint pain", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — D-phenylalanine inhibits enkephalinase, prolonging endorphin action; clinical dose 1.5 g three times daily for joint pain."}], "Manganese": [{"match": "carpal tunnel", "title": "Manganese → carpal tunnel syndrome", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Manganese deficiency is Wallach's named root cause of carpal tunnel; clinical dose 50 mg/day per LPD protocol."}, {"match": "kidney stone", "title": "Manganese → kidney stones", "cite": "Let's Play Doctor (Wallach) — Manganese is structural for connective-tissue matrix; deficiency tracks with calcium-oxalate stone formation."}, {"match": "bruxism", "title": "Manganese → bruxism (teeth grinding)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Manganese deficiency causes nocturnal bruxism in Wallach's mineral-deficiency taxonomy."}], "Molybdenum": [{"match": "goiter", "title": "Molybdenum → goiter-prevention cofactor", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Molybdenum partners with Iodine, Copper, and Tyrosine in Wallach's four-cofactor stack for thyroid hormone synthesis. ReVERSE!® label-stated 75 mcg/day."}, {"match": "sulfite", "title": "Molybdenum → sulfite detoxification", "cite": "Let's Play Doctor (Wallach) — Molybdenum is the catalytic atom in sulfite oxidase; deficiency presents as sulfite sensitivity (wine, dried fruit headaches)."}], "Strontium": [{"match": "bone", "title": "Strontium → bone density", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Strontium substitutes for calcium in hydroxyapatite, increasing bone density. HBSP 2.5 delivers 1 g/day via Beyond Osteo FX."}, {"match": "osteoporosis", "title": "Strontium → osteoporosis reversal", "cite": "Let's Play Doctor (Wallach) — Strontium at 600-1700 mg/day reverses osteoporosis per Wallach's bone-density protocol; works synergistically with Calcium + Boron + Vitamin D from HBSP."}], "Silica": [{"match": "hair", "title": "Silica → hair / skin / nails", "cite": "Let's Play Doctor (Wallach) — Silica is structural for hair keratin, nail matrix, and skin collagen cross-linking. Ultimate Hair Skin & Nails (Youngevity) label: 80 mg/day."}, {"match": "collagen", "title": "Silica → collagen synthesis", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Silica is required cofactor for hydroxyproline formation in collagen; deficiency tracks with skin laxity and brittle nails."}], "Sulfur": [{"match": "joint", "title": "Sulfur → joint cartilage", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Sulfur is structural for cartilage proteoglycans (MSM, glucosamine sulfate). HBSP 2.5 delivers 500 mg/day."}, {"match": "connective", "title": "Sulfur → connective tissue / hair / nails", "cite": "Let's Play Doctor (Wallach) — Sulfur via methionine + cysteine builds keratin disulfide bonds; deficiency presents as brittle hair / nails / dull skin."}], "Fluoride": [{"match": "osteoporosis", "title": "Fluoride → osteoporosis (clinical dose)", "cite": "Let's Play Doctor (Wallach) — Fluoride at 20 mg/day prescription level for osteoporosis. Distinct from municipal water fluoridation (different dose / source / context per Wallach's framework decomposition)."}, {"match": "bone", "title": "Fluoride → bone integration", "cite": "Let's Play Doctor (Wallach) — Fluoride substitutes for hydroxyl in hydroxyapatite, hardening bone matrix at supplement-level doses (≠ tap-water dose context)."}], "Iron": [{"match": "anemia", "title": "Iron → hematopoiesis / anemia", "cite": "Let's Play Doctor (Wallach) — Iron is required for heme synthesis; HBSP 2.5 delivers 1 mg/day baseline. Higher therapeutic doses for confirmed iron-deficiency anemia only."}], "Phosphorus": [{"match": "bone", "title": "Phosphorus → bone matrix (with Ca)", "cite": "Let's Play Doctor (Wallach) — Phosphorus partners with Calcium in hydroxyapatite at ~1:2 ratio. HBSP 2.5 delivers 600 mg/day via Beyond Osteo FX."}, {"match": "ATP", "title": "Phosphorus → ATP / energy currency", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Phosphorus is the high-energy bond carrier in ATP; deficiency presents as fatigue and low gym output."}], "Potassium": [{"match": "blood pressure", "title": "Potassium → blood-pressure regulation", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Potassium balances sodium at the cellular pump (Na/K-ATPase); deficiency tracks with hypertension. HBSP 2.5 delivers 100 mg/day baseline (most comes from diet)."}, {"match": "muscle", "title": "Potassium → muscle contraction / cramps", "cite": "Let's Play Doctor (Wallach) — Potassium triggers repolarization in muscle cells; deficiency presents as cramps + arrhythmias."}], "Sodium": [{"match": "adrenal", "title": "Sodium → adrenal function", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Wallach is explicitly anti-restriction on sodium ('salt to taste'); deficiency stresses adrenal aldosterone production. Range 1.5-3 g/day per LPD baseline."}, {"match": "hydration", "title": "Sodium → hydration / electrolyte balance", "cite": "Let's Play Doctor (Wallach) — Sodium is the primary extracellular cation; deficiency drives fluid loss, fatigue, dizziness. Wallach pushes back against low-sodium guidelines."}], "Chloride": [{"match": "stomach acid", "title": "Chloride → stomach acid (HCl)", "cite": "Let's Play Doctor (Wallach) — Chloride is the anion in hydrochloric acid; deficiency reduces gastric acidity and downstream protein digestion. ~2,500 mg/day from dietary salt."}, {"match": "digestion", "title": "Chloride → digestive function", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Low chloride / low stomach acid is upstream of many 'gut' symptoms in Wallach's framework. HCl supplementation is the lever in his digestive protocols."}], "Germanium": [{"match": "immune", "title": "Germanium → immune stimulation", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Germanium 50 mg/day in immune-stimulation protocols (Wallach-cited). Otherwise covered as trace via plant-derived mineral complex in Beyond Tangy Tangerine."}], "Silver": [{"match": "antimicrobial", "title": "Silver → antimicrobial (topical + internal)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Colloidal Silver (Youngevity) for topical and antimicrobial use. Label: 40 mcg/day in 4-dropper dose."}], "Vitamin A (Retinol / beta-carotene)": [{"match": "vision", "title": "Vitamin A → vision (rhodopsin / night vision)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Vitamin A is rhodopsin substrate in retinal rod cells; deficiency presents as night blindness, dry eye. HBSP 2.5 delivers 0.81 mg/day."}, {"match": "immune", "title": "Vitamin A → mucosal immune barrier", "cite": "Let's Play Doctor (Wallach) — Vitamin A maintains epithelial / mucosal integrity (gut, respiratory tract); deficiency tracks with recurrent infections."}, {"match": "skin", "title": "Vitamin A → skin / epithelium", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Vitamin A regulates keratinocyte differentiation; deficiency drives hyperkeratosis, follicular plugging."}], "Vitamin B1 (Thiamine)": [{"match": "beriberi", "title": "Vitamin B1 → beriberi / heart failure", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B1 deficiency causes beriberi (wet form = cardiomyopathy, dry form = peripheral neuropathy). HBSP 2.5 delivers 30 mg/day."}, {"match": "energy", "title": "Vitamin B1 → carbohydrate metabolism", "cite": "Let's Play Doctor (Wallach) — B1 is cofactor for pyruvate dehydrogenase; deficiency blocks ATP yield from glucose."}], "Vitamin B2 (Riboflavin)": [{"match": "energy", "title": "Vitamin B2 → mitochondrial energy", "cite": "Let's Play Doctor (Wallach) — B2 is the substrate for FAD / FMN in the electron transport chain. HBSP 2.5 delivers 30 mg/day."}, {"match": "eye", "title": "Vitamin B2 → corneal / ocular health", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B2 deficiency causes cheilitis, corneal vascularization, photosensitivity."}], "Vitamin B3 (Niacin)": [{"match": "pellagra", "title": "Vitamin B3 → pellagra prevention", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B3 deficiency causes pellagra (dermatitis, dementia, diarrhea); HBSP 2.5 delivers 40 mg/day baseline."}, {"match": "cholesterol", "title": "Vitamin B3 → cholesterol regulation", "cite": "Let's Play Doctor (Wallach) — Niacin at 1-3 g/day lowers LDL and raises HDL; flushing is the dose marker."}], "Vitamin B5 (Pantothenic Acid)": [{"match": "adrenal", "title": "Vitamin B5 → adrenal cortisol synthesis", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B5 is the substrate for Coenzyme A, central to adrenal steroidogenesis. HBSP 2.5 delivers 150 mg/day."}, {"match": "energy", "title": "Vitamin B5 → CoA / acetyl-CoA metabolism", "cite": "Let's Play Doctor (Wallach) — B5 is essential for energy metabolism via CoA. Deficiency presents as fatigue, adrenal exhaustion."}], "Vitamin B6 (Pyridoxine)": [{"match": "homocysteine", "title": "Vitamin B6 → homocysteine clearance (with B12 + folate)", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — B6/B12/Folate are the trio that converts homocysteine back to methionine; elevated homocysteine = cardiovascular risk per Wallach's framing."}, {"match": "mood", "title": "Vitamin B6 → serotonin / neurotransmitter synthesis", "cite": "Let's Play Doctor (Wallach) — B6 is the cofactor for aromatic amino acid decarboxylase (tryptophan → serotonin, tyrosine → dopamine)."}], "Vitamin K (Menaquinone = K2)": [{"match": "bone", "title": "Vitamin K2 → bone calcium routing", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — K2 activates osteocalcin to bind calcium into bone (vs depositing it in arteries). HBSP 2.5 delivers 30 mcg/day."}, {"match": "blood clot", "title": "Vitamin K → blood clotting (factor synthesis)", "cite": "Let's Play Doctor (Wallach) — K1 is required for hepatic synthesis of clotting factors II, VII, IX, X; deficiency presents as easy bruising."}], "Biotin": [{"match": "hair", "title": "Biotin → hair / nail strength", "cite": "Let's Play Doctor (Wallach) — Biotin is structural for keratin synthesis; deficiency presents as brittle nails, hair loss. HBSP 2.5 delivers 0.6 mg/day."}], "Choline": [{"match": "liver", "title": "Choline → liver fat clearance", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Choline is required for VLDL packaging in liver; deficiency tracks with fatty liver."}, {"match": "brain", "title": "Choline → acetylcholine / cognition", "cite": "Let's Play Doctor (Wallach) — Choline is the substrate for acetylcholine synthesis; cognitive performance + memory cofactor."}], "Inositol": [{"match": "cataract", "title": "Inositol → cataract (cited protocol)", "cite": "Let's Play Doctor (Wallach) — Inositol 150 mg/day appears in Wallach's cataract protocol (with Tyrosine, Vitamin C, Bioflavonoids)."}], "Arginine": [{"match": "nitric oxide", "title": "Arginine → nitric oxide / circulation", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Arginine is the substrate for nitric oxide synthase; supports endothelial vasodilation and circulation."}, {"match": "growth hormone", "title": "Arginine → growth hormone support", "cite": "Let's Play Doctor (Wallach) — Arginine stimulates pituitary GH release at pharmacologic doses; gym-recovery and lean-mass adjunct."}, {"match": "cataract", "title": "Arginine → cataract (300 mg/day, LPD)", "cite": "Let's Play Doctor (Wallach) — 300 mg/day in Wallach's cataract protocol alongside Cysteine, Tyrosine, Inositol."}], "Methionine": [{"match": "macular", "title": "Methionine → macular degeneration cofactor", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — Methionine appears in Wallach's macular degeneration cofactor stack (with Taurine, Lutein, Zinc)."}, {"match": "liver", "title": "Methionine → liver methylation / detox", "cite": "Let's Play Doctor (Wallach) — Methionine is the SAM-e precursor; supports phase II liver methylation."}], "Omega-6 (linoleic + GLA)": [{"match": "skin", "title": "Omega-6 → skin barrier / eczema", "cite": "Dead Doctors Don't Lie (Wallach, 1999) — GLA (gamma-linolenic acid) supports skin barrier integrity; Wallach lists it in eczema / dry-skin protocols. HBSP 2.5 delivers 366 mg/day via Ultimate EFA Plus."}, {"match": "hormone", "title": "Omega-6 → prostaglandin / hormonal balance", "cite": "Let's Play Doctor (Wallach) — Omega-6 series prostaglandins regulate inflammation and reproductive signaling; ratio with Omega-3 is the lever."}]};

  function findBenefitCitation(essentialName, benefitText) {
    const entries = BENEFIT_CITATIONS[essentialName] || [];
    const lower = (benefitText || '').toLowerCase();
    for (const c of entries) {
      if (lower.indexOf(c.match.toLowerCase()) !== -1) return { ...c, exact: true };
    }
    // Fallback: pull the essential's general source from the targets data block
    try {
      const tgts = JSON.parse(document.getElementById('essentials-targets-data').textContent);
      const ess = (tgts.essentials || []).find(e => e.name === essentialName);
      const src = ess && ess.target && ess.target.source;
      if (src) {
        return {
          title: essentialName + ' → ' + benefitText,
          cite: 'No specific Wallach citation curated for this (essential, benefit) pair yet. Falling back to the essential\'s primary Wallach/Youngevity source: ' + src,
          exact: false
        };
      }
    } catch (e) { /* swallow */ }
    return {
      title: essentialName + ' → ' + benefitText,
      cite: 'No Wallach citation captured for this pair. The essential is one of the 90; the specific benefit-attribution is open backlog.',
      exact: false
    };
  }

  function showCitationPopup(essentialName, benefitText) {
    const c = findBenefitCitation(essentialName, benefitText);
    const popup = document.getElementById('citation-popup');
    if (!popup) return;
    document.getElementById('cp-title').textContent = c.title;
    document.getElementById('cp-cite').textContent = c.cite;
    document.getElementById('cp-eyebrow').textContent = c.exact ? 'Wallach citation' : 'Wallach citation (fallback)';
    document.getElementById('cp-source-tag').hidden = !c.exact;
    const fb = document.getElementById('cp-fallback-note');
    if (c.exact) { fb.hidden = true; fb.textContent = ''; }
    else { fb.hidden = false; fb.textContent = 'Tip: specific Wallach citations are being curated round-by-round. This pair is on the backlog.'; }
    popup.classList.add('open');
    popup.setAttribute('aria-hidden', 'false');
  }

  function hideCitationPopup() {
    const popup = document.getElementById('citation-popup');
    if (!popup) return;
    popup.classList.remove('open');
    popup.setAttribute('aria-hidden', 'true');
  }

  // Delegated click handler — works for static + dynamically rendered pills
  document.addEventListener('click', function(e) {
    const pill = e.target.closest && e.target.closest('.benefit-pill.wallach-benefit');
    if (pill) {
      // Find the essential name from the nearest detail-panel ancestor
      const panel = pill.closest('[data-essential-name]');
      const essentialName = panel ? panel.getAttribute('data-essential-name') : '';
      const benefitText = (pill.textContent || '').replace(/^●\s*/, '').trim();
      if (essentialName) showCitationPopup(essentialName, benefitText);
      return;
    }
    const popup = document.getElementById('citation-popup');
    if (popup && popup.classList.contains('open')) {
      // Close on backdrop click or close-button click
      if (e.target === popup || (e.target.classList && e.target.classList.contains('citation-popup-close'))) {
        hideCitationPopup();
      }
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideCitationPopup();
  });


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
        // Vitamin shortform: three-tier resolution (each tighter than the last):
        //   1. Direct equality of first token: "vitamin b12" === "vitamin b12"
        //   2. Bare-letter ↔ letter+digit (XOR): "vitamin d" ↔ "vitamin d2".
        //      Only fires when exactly ONE side is bare (the other has a digit).
        //      Rejects "vitamin b12" ↔ "vitamin b1" (both have digits).
        //   3. Substring match for both-digit cases: "vitamin d3" ↔ "vitamin d2 + d3"
        //      via word-boundary literal check. Rejects b12 ↔ b1 (no "b12" in "b1").
        // Round 99 spot-check fix replaces an overpermissive OR rule that had
        // "vitamin b12" silently matching the first B-vitamin in iteration order.
        if (nn.startsWith('vitamin ') && tn.startsWith('vitamin ')) {
          const nv = nn.replace('vitamin ', '').split(/\s|\(|\+/)[0];
          const tv = tn.replace('vitamin ', '').split(/\s|\(|\+/)[0];
          if (nv === tv) return t;
          const nvBase = nv.replace(/\d+$/, '');
          const tvBase = tv.replace(/\d+$/, '');
          // Tier 2: bare ↔ digit-suffix (XOR).
          if (nvBase && nvBase === tvBase && (nv === nvBase) !== (tv === tvBase)) return t;
          // Tier 3: both have digits — match only if nv appears as word-bounded
          // token in tn (handles "d3" matching "d2 + d3"; rejects "b12" / "b1").
          if (nv !== nvBase && tv !== tvBase) {
            if (new RegExp('\\b' + nv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(tn)) return t;
          }
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
      // Round 135 — Issue 2: recommendations don't contribute to live coverage
      // until Adopt promotes them to kind:'supplement'. Mirrors computeSlotStats
      // discipline — coverage surfaces reflect the active stack, not suggestions
      // the user hasn't acted on.
      const items = fn ? fn().filter(i => !i._removed && i.kind !== 'recommended') : [];
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
      // Pass 7 — Wallach treats this as dietary by default; clinical doses are a
      // condition-specific lever (e.g., Taurine for macular degeneration). Status reflects
      // basic dietary coverage; the clinical-lever doses surface in the detail panel.
      if (t.kind === 'dietary_with_clinical_lever') {
        // Round 70 v2 fix: when a numeric Wallach target (low) is present, classify by
        // coverage status like any other numeric kind. Color reflects coverage; the
        // clover icon (✤) is the dietary-first signal independently. 'gap' returns when
        // current is significantly below target REGARDLESS of source presence — Luneth's
        // explicit rule is 'gray only when no defined total can be logically deduced'.
        if (t.low && t.low > 0) {
          const isIU = (t.unit || '').toLowerCase() === 'iu';
          const current = isIU ? computed.totalIU : computed.totalMg;
          const low = isIU ? t.low : toMg(t.low, t.unit).v;
          if (current >= low * 0.95) return 'ok';
          if (current >= low * 0.30) return 'warn';
          return 'gap';
        }
        // No numeric target — genuinely dietary-only (the 5 BCAAs + Histidine + Threonine
        // without specific clinical-dose protocols). 'diet' badge stays only here.
        if (!hasSrc) return 'mute';
        const stack = (computed.sources || []).map(s => (s.sourceName || '').toLowerCase()).join(' | ');
        const hasBTT = /\bbtt\b|tangerine|utt|amino|hbsp/i.test(stack);
        return hasBTT ? 'ok' : 'diet';
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
          // Round 115 — Wallach-stance Phase 1 infrastructure. Thread the
          // optional wallach_stance object from TARGETS_DATA into the tile
          // payload so showEssentialDetail can render the pull-quote at the
          // top of the detail panel when present. Will be undefined for
          // entries without a stance — renderer skips the row entirely.
          wallach_stance: t.wallach_stance,
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
      const kindCls = (item.target && item.target.kind === 'dietary_with_clinical_lever') ? ' dietary-lever-tile' : '';
      // Stash the whole payload on the element so showEssentialDetail can read it
      try { tilePayloads[item.name] = item; } catch(e){}
      // Build a search blob for benefit-aware filtering: name + symbol + benefits
      // texts + benefit-citation match keys + goal-match marker. The applyEssentialsFilters
      // function matches against this blob so users can search "testosterone" and find
      // Zinc, Boron, etc. (Round 72 fix — placeholder advertised this all along.)
      const searchParts = [item.name, symbol, shortName];
      if (goalCls) searchParts.push('goal-match');
      try {
        const bens = (typeof BENEFITS_MAP !== 'undefined' && BENEFITS_MAP[item.name]) || [];
        bens.forEach(b => {
          if (typeof b === 'string') searchParts.push(b);
          else if (b && typeof b === 'object' && b.t) searchParts.push(b.t);
        });
      } catch(e){}
      try {
        const cites = (typeof BENEFIT_CITATIONS !== 'undefined' && BENEFIT_CITATIONS[item.name]) || [];
        cites.forEach(c => {
          if (c && c.match) searchParts.push(c.match);
          if (c && c.title) searchParts.push(c.title);
        });
      } catch(e){}
      const searchBlob = searchParts.join(' ').toLowerCase();
      return '<button type="button" class="essential-tile ' + item.status + goalCls + kindCls + '"' +
        ' data-name="' + escapeHtml(item.name) + '"' +
        ' data-status="' + item.status + '"' +
        ' data-search="' + escapeHtml(searchBlob) + '"' +
        (goalCls ? ' data-goal-match="1"' : '') +
        ' aria-label="' + escapeHtml(item.name) + '">' +
        '<span class="e-symbol">' + escapeHtml(symbol) + '</span>' +
        '<span class="e-name">' + escapeHtml(shortName) + '</span>' +
        (kindCls ? '<span class="tile-leaf" aria-hidden="true" title="Dietary by default · clinical-lever doses for specific conditions">✤</span>' : '') +
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
      const isNumeric = target && (target.kind === 'hbsp' || target.kind === 'wallach' || target.kind === 'wallach_clinical' || target.kind === 'range' || target.kind === 'single' || target.kind === 'temp_range' || (target.kind === 'dietary_with_clinical_lever' && target.low && target.low > 0));

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
        // Round 70 v2: when dietary_with_clinical_lever has a numeric target, append a
        // small dietary-default line so the clover meaning is still visible alongside
        // the coverage progress bar.
        if (target.kind === 'dietary_with_clinical_lever') {
          const dietaryDefaultShort = target.dietary_default || 'via diet';
          statusTextHtml += '<div class="tooltip-dietary-row tooltip-dietary-compact">' +
                              '<span class="tooltip-dietary-leaf" aria-hidden="true">✤</span>' +
                              '<span class="tooltip-dietary-compact-label">Recommended via diet:</span>' +
                              '<span class="tooltip-dietary-compact-value">' + escapeHtml(dietaryDefaultShort) + '</span>' +
                            '</div>';
        }
      } else if (target && target.kind === 'dietary_with_clinical_lever') {
        // Pass 7 polish — surface the dietary default path prominently in the tooltip
        // so users who never click can still see what Wallach actually recommends.
        const dietaryDefault = target.dietary_default || 'via diet';
        amtHtml = '<div class="tooltip-dietary-row">' +
                    '<span class="tooltip-dietary-leaf" aria-hidden="true">✤</span>' +
                    '<div class="tooltip-dietary-stack">' +
                      '<div class="tooltip-dietary-label">RECOMMENDED VIA DIET</div>' +
                      '<div class="tooltip-dietary-value">' + escapeHtml(dietaryDefault) + '</div>' +
                    '</div>' +
                  '</div>';
        // Also keep the editorial note (clinical-lever context) if present, but smaller
        if (target.note) {
          const noteShort = target.note.length > 110 ? target.note.slice(0, 110) + '…' : target.note;
          amtHtml += '<div class="tooltip-dietary-note">' + escapeHtml(noteShort) + '</div>';
        }
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
      // Round 70 fix: dietary_with_clinical_lever WITH a numeric low/high also gets a
      // progress bar (Omega-6, Omega-9, 7 of 12 aminos). The clover icon stays on the
      // tile and the dietary-default callout still appears in the detail panel — the
      // progress bar is additive, not a replacement.
      const hasNumericTarget = target && (
        target.kind === 'hbsp' || target.kind === 'wallach' || target.kind === 'wallach_clinical' ||
        target.kind === 'range' || target.kind === 'single' || target.kind === 'temp_range' ||
        target.kind === 'amino_fallback' ||
        (target.kind === 'dietary_with_clinical_lever' && target.low && target.low > 0)
      );
      const isDietaryLever = target && target.kind === 'dietary_with_clinical_lever';

      if (hasNumericTarget && currentVal >= 0) {
        const tLow = isIU ? target.low : toMg(target.low, target.unit).v;
        const tHigh = isIU ? target.high : toMg(target.high, target.unit).v;
        const unitTag = isIU ? 'iu' : 'mg';
        // When overshooting, the fill should reach 100% (no awkward gray gap)
        const isOver = currentVal > tHigh;
        // Bar scale: tHigh * 1.4 when not over, currentVal otherwise so 100% fill at over
        const barMax = isOver ? currentVal * 1.05 : Math.max(tHigh * 1.4, currentVal * 1.05);
        const curPct = isOver ? 100 : Math.min(100, (currentVal / barMax) * 100);
        // Round 99: Wallach range-band overlay removed per Luneth's direction —
        // bar shows progress-fill only; current/target labels live above as text.
        // The lowPct/highPct/bandLeft/bandWidth computations are no longer needed.

        // Status text
        let statusText = '', statusCls = '';
        if (currentVal >= tLow) {
          if (currentVal > tHigh) {
            const over = currentVal - tHigh;
            const overPct = (over / tHigh) * 100;
            statusCls = overPct > 100 ? 'way-over' : 'over';
            statusText = 'OVER by ' + fmtAmount(over, unitTag) + ' (' + Math.round(overPct) + '% above the high end of the daily target)' + (overPct > 50 ? ' — could dial back or swap to a leaner SKU.' : '');
          } else {
            statusText = 'Inside the daily target range — you\'re hitting target.';
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
              '<div class="essential-progress-fill ' + fillCls + '" style="width: ' + curPct.toFixed(1) + '%;"></div>' +
            '</div>' +
            '<div class="essential-progress-status ' + statusCls + '">' + escapeHtml(statusText) + '</div>' +
          '</div>';
        // Round 70: for dietary_with_clinical_lever with numeric target, ALSO append
        // the dietary-default callout + clinical-lever bubble below the progress bar.
        if (isDietaryLever) {
          const dietaryDefault = target.dietary_default || 'via diet';
          const tLowMgL = target.low ? toMg(target.low, target.unit).v : null;
          const tHighMgL = target.high ? toMg(target.high, target.unit).v : null;
          const hasClinicalRangeL = tLowMgL !== null && tLowMgL > 0;
          const clinicalRangeL = hasClinicalRangeL
            ? (tLowMgL === tHighMgL ? fmtAmount(tLowMgL, 'mg') : fmtAmount(tLowMgL, 'mg') + ' – ' + fmtAmount(tHighMgL, 'mg'))
            : null;
          progressHtml +=
            '<div class="essential-progress dietary-lever" style="margin-top:14px;">' +
              '<div class="essential-pb-default-row">' +
                '<span class="essential-leaf" aria-hidden="true">✤</span>' +
                '<div class="default-label-stack">' +
                  '<span class="default-label">RECOMMENDED VIA DIET</span>' +
                  '<span class="default-value">' + escapeHtml(dietaryDefault) + '</span>' +
                '</div>' +
              '</div>' +
              (hasClinicalRangeL
                ? '<div class="essential-pb-lever-callout">' +
                    '<div class="lever-callout-header">CLINICAL LEVER <span class="lever-callout-sublabel">if you have a specific condition</span></div>' +
                    '<div class="lever-callout-range">' + escapeHtml(clinicalRangeL) + '/day</div>' +
                    (target.note ? '<div class="lever-callout-note">' + escapeHtml(target.note) + '</div>' : '') +
                  '</div>'
                : '') +
            '</div>';
        }
      } else if (isDietaryLever) {
        // Round 70: no numeric target — show dietary-default + clinical-lever only
        // (this path now only triggers for dietary_with_clinical_lever WITHOUT a low/high,
        // e.g., the 5 aminos without specific clinical-dose protocols).
        const dietaryDefault = target.dietary_default || 'via diet';
        progressHtml =
          '<div class="essential-progress dietary-lever">' +
            '<div class="essential-pb-default-row">' +
              '<span class="essential-leaf" aria-hidden="true">✤</span>' +
              '<div class="default-label-stack">' +
                '<span class="default-label">RECOMMENDED VIA DIET</span>' +
                '<span class="default-value">' + escapeHtml(dietaryDefault) + '</span>' +
              '</div>' +
            '</div>' +
            (sources.length
              ? '<div class="essential-pb-floor-row"><span class="floor-label">CURRENT FROM REGIMEN:</span> <span class="floor-value">' + escapeHtml(fmtAmount(currentVal, 'mg')) + '/day</span></div>'
              : '') +
            (target.note ? '<div class="lever-callout-note-only">' + escapeHtml(target.note) + '</div>' : '') +
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

      // Round 115 — Wallach-stance Phase 1 infrastructure. When the payload
      // carries a wallach_stance object {quote, citation, context?}, render a
      // pull-quote block above the operational rows. The framework speaks
      // first; the numbers contextualize. Per doctrine §7 graceful degradation:
      // absence renders nothing — the panel falls back to the prior shape.
      // Per doctrine §5 escape by default: every field passes through escapeHtml
      // before insertion. The quote can carry punctuation, em-dashes, and other
      // characters that would break innerHTML if unescaped.
      let stanceHtml = '';
      const stance = payload.wallach_stance;
      if (stance && typeof stance === 'object' && stance.quote && stance.citation) {
        const ctxHtml = stance.context ? '<span class="stance-context">' + escapeHtml(stance.context) + '</span>' : '';
        // Round 124 — read-more popup. When expanded_context is present, add a
        // "Read more" affordance that opens a modal with the fuller passage.
        // The affordance carries data-essential-name + data-expanded-context-id
        // so the click handler can resolve the content. Per doctrine §5 escape
        // by default: all dynamic content goes through escapeHtml AND the
        // modal renderer uses textContent (not innerHTML) for the passage body.
        const hasExpanded = stance.expanded_context && typeof stance.expanded_context === 'string' && stance.expanded_context.length > 0;
        const readMoreHtml = hasExpanded
          ? '<button type="button" class="stance-read-more" data-essential-name="' + escapeHtml(name) + '" aria-label="Read fuller passage from Wallach">Read more &rarr;</button>'
          : '';
        stanceHtml =
          '<div class="essential-detail-stance">' +
            '<div class="stance-eyebrow">Wallach on this</div>' +
            '<div class="stance-quote">' + escapeHtml(stance.quote) + '</div>' +
            '<div class="stance-attr">' +
              '<span class="stance-citation">' + escapeHtml(stance.citation) + '</span>' +
              ctxHtml +
              readMoreHtml +
            '</div>' +
          '</div>';
      }

      panel.innerHTML =
        '<div class="essential-detail-header">' +
          '<h3 class="essential-detail-title" style="text-transform:none;">' + escapeHtml(name) + '</h3>' +
          '<div style="display:flex;gap:10px;align-items:center;">' +
            '<span class="essential-detail-status ' + sc + '">' + statusLabel + '</span>' +
            '<button type="button" class="essential-detail-close" id="essential-detail-close">Close</button>' +
          '</div>' +
        '</div>' +
        progressHtml +
        stanceHtml +
        '<div class="essential-detail-row"><div class="label">What you get</div><div class="value">' + wygDisplay + '</div></div>' +
        '<div class="essential-detail-row"><div class="label">Daily target</div><div class="value">' + tgtRowDisplay + '</div></div>' +
        benefitsHtml +
        suppsHtml +
        legendHtml +
        sourceNote;

      panel.dataset.essentialName = name;
      panel.hidden = false;
      const closeBtn = document.getElementById('essential-detail-close');
      if (closeBtn) closeBtn.addEventListener('click', closeEssentialDetail);
      // Round 124 — wire any newly-rendered Read-more affordance in this panel.
      const readMoreBtn = panel.querySelector('.stance-read-more');
      if (readMoreBtn) {
        readMoreBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openStanceModal(name);
        });
      }
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function closeEssentialDetail() {
      const panel = document.getElementById('essential-detail');
      if (panel) panel.hidden = true;
      document.querySelectorAll('.essential-tile.selected').forEach(t => t.classList.remove('selected'));
    }

    // Round 124 — Read-more stance modal. Frutiger-Aero teal palette (distinct
    // from the Tacitus dashboard's dark roman velvet). Lazy-creates the modal
    // element on first call so the HTML doesn't bloat the initial render. All
    // dynamic content is inserted via textContent — doctrine §5 escape-by-default;
    // the expanded_context can carry quotes, em-dashes, and other characters that
    // would break innerHTML if mis-handled.
    function ensureStanceModal() {
      let backdrop = document.getElementById('stance-modal-backdrop');
      if (backdrop) return backdrop;
      backdrop = document.createElement('div');
      backdrop.id = 'stance-modal-backdrop';
      backdrop.className = 'stance-modal-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-labelledby', 'stance-modal-title');

      const modal = document.createElement('div');
      modal.className = 'stance-modal';

      const header = document.createElement('div');
      header.className = 'stance-modal-header';
      const eyebrow = document.createElement('div');
      eyebrow.className = 'stance-modal-eyebrow';
      eyebrow.textContent = 'Wallach on this — fuller passage';
      const title = document.createElement('h3');
      title.id = 'stance-modal-title';
      title.className = 'stance-modal-title';
      header.appendChild(eyebrow);
      header.appendChild(title);

      const body = document.createElement('div');
      body.className = 'stance-modal-body';
      body.id = 'stance-modal-body';

      const footer = document.createElement('div');
      footer.className = 'stance-modal-footer';
      const cite = document.createElement('span');
      cite.className = 'stance-modal-citation';
      cite.id = 'stance-modal-citation';
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'stance-modal-close';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', closeStanceModal);
      footer.appendChild(cite);
      footer.appendChild(closeBtn);

      modal.appendChild(header);
      modal.appendChild(body);
      modal.appendChild(footer);
      backdrop.appendChild(modal);

      // Click-outside-to-close. Click on modal itself is stopped.
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) closeStanceModal();
      });
      modal.addEventListener('click', (ev) => ev.stopPropagation());

      document.body.appendChild(backdrop);
      return backdrop;
    }
    function openStanceModal(essentialName) {
      // Look up the stance from the global TARGETS_DATA via the essential name.
      // Walk the flat embed for the matching essential.
      let stance = null;
      try {
        const embed = JSON.parse(document.getElementById('essentials-targets-data').textContent);
        const entry = (embed.essentials || []).find(e => e.name === essentialName);
        stance = entry && entry.wallach_stance ? entry.wallach_stance : null;
      } catch (e) { /* graceful fail */ }
      if (!stance || !stance.expanded_context) {
        console.warn('openStanceModal: no expanded_context for', essentialName);
        return;
      }
      const backdrop = ensureStanceModal();
      const titleEl = document.getElementById('stance-modal-title');
      const bodyEl = document.getElementById('stance-modal-body');
      const citeEl = document.getElementById('stance-modal-citation');
      if (titleEl) titleEl.textContent = essentialName;
      if (bodyEl)  bodyEl.textContent  = stance.expanded_context;
      if (citeEl)  citeEl.textContent  = stance.citation || '';
      backdrop.setAttribute('data-open', 'true');
      // Focus the close button for keyboard users.
      const closeBtn = backdrop.querySelector('.stance-modal-close');
      if (closeBtn) closeBtn.focus();
    }
    function closeStanceModal() {
      const backdrop = document.getElementById('stance-modal-backdrop');
      if (backdrop) backdrop.removeAttribute('data-open');
    }
    // Esc-to-close (page-level listener; only fires when backdrop is open)
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      const backdrop = document.getElementById('stance-modal-backdrop');
      if (backdrop && backdrop.getAttribute('data-open') === 'true') closeStanceModal();
    });

    let qfMode = 'all';
    let qSearch = '';
    function applyEssentialsFilters() {
      const q = (qSearch || '').toLowerCase();
      document.querySelectorAll('.essential-tile').forEach(tile => {
        const sc = tile.dataset.status;
        let matchQF;
        if (qfMode === 'gaps')      matchQF = (sc === 'gap' || sc === 'warn');
        else if (qfMode === 'goals') matchQF = tile.dataset.goalMatch === '1';
        else                         matchQF = true; // 'all'
        const blob = tile.dataset.search || tile.dataset.name.toLowerCase();
        const matchSearch = !q || blob.includes(q);
        tile.style.display = (matchQF && matchSearch) ? '' : 'none';
      });
    }

    function initEssentialsView() {
      buildEssentialsGrid();
      // Conditional surfacing for "Goal Matched Only" — only show if the user has
      // at least one goal-matched tile (multi-user-ready: empty USER_GOAL_TERMS or
      // no goal matches → button hidden, button group degrades to All/Gaps only).
      const hasGoalMatches = document.querySelectorAll('.essential-tile[data-goal-match="1"]').length > 0;
      const goalsBtn = document.querySelector('.qf-btn[data-qf="goals"]');
      if (goalsBtn) goalsBtn.style.display = hasGoalMatches ? '' : 'none';
      document.querySelectorAll('.qf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.style.display === 'none') return; // hidden buttons are inert
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
    // Stage B+C (Round 99): expose the unified coverage primitives so Label
    // Check operates over the same dataset the Periodic Table view does.
    //   - computeLiveCoverage(): the live regimen → coverage pipeline
    //   - TARGETS_DATA: the canonical 92-essentials target dataset (HBSP-derived,
    //     Youngevity-primary). Replaces the legacy ESSENTIALS array as the
    //     single source of essentials targets.
    //   - matchToEssential(name): the fuzz-matcher (paren-strip + vitamin
    //     shortform + omega + folate) used to resolve nutrient names to
    //     TARGETS_DATA entries. Same primitive on both surfaces.
    // Closes the doctrine §3 (single source of truth) violation + the
    // semantic contradiction (two different "covered" thresholds) surfaced by
    // Tacitus session #6 and the build>test spot-check that followed.
    window.computeLiveCoverage = computeLiveCoverage;
    window.TARGETS_DATA = TARGETS_DATA;
    window.matchToEssential = matchToEssential;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEssentialsView);
    } else {
      initEssentialsView();
    }
  })();

// === Label Check scoring engine + UI (v1.4 polished) ===
(function() {
  'use strict';

  // ESSENTIALS array retired Round 99 Stage B+C (2026-06-16). The hand-curated
  // ~30-entry subset has been replaced by TARGETS_DATA (92 entries, exposed via
  // window.TARGETS_DATA from the Periodic Table IIFE). findEssential now
  // delegates to window.matchToEssential. Reasons:
  //   1. Two essentials datasets in one file = doctrine §3 violation
  //   2. Two different "covered" thresholds across the dashboard (Periodic
  //      Table used pack-extrapolation; Label Check used book-range) = real
  //      semantic contradiction surfaced by Tacitus session #6 + the
  //      Round 99 spot-check during Stage B
  //   3. Per Luneth's Round 99 doctrinal call: Youngevity-pack values are the
  //      operational arithmetic across the dashboard; Wallach's stated book
  //      ranges retire from verdict math and move to the educational layer
  //      (planned for a follow-up round — see open-threads)

  // DIETARY_BASELINE — non-regimen daily intake contributions.
  // Renamed from CURRENT_COVERAGE in Round 99 Stage B (2026-06-16) when
  // getEffectiveCoverage was delegated to computeLiveCoverage (the live unified
  // regimen pipeline). The old name implied "current state baseline"; the new
  // name reflects the intended role: dietary floor that regimen items add on top of.
  //
  // Regenerated 2026-06-17 via `python tools/stack_coverage.py --diet-only
  // --format json`. Previous snapshot was contaminated with supplement intake
  // (generated via --include-diet which blends both). Now reflects true dietary
  // contribution only. Values dropped substantially across B-vitamins and trace
  // minerals — the old values were largely from the user supplement stack, not food.
  const DIETARY_BASELINE = {
    "Calcium": { amount: 110, unit: "mg" },
    "Copper": { amount: 0.4, unit: "mg" },
    "Iodine": { amount: 121, unit: "mcg" },
    "Iron": { amount: 1.6, unit: "mg" },
    "Magnesium": { amount: 85, unit: "mg" },
    "Manganese": { amount: 0.5, unit: "mg" },
    "Phosphorus": { amount: 727, unit: "mg" },
    "Potassium": { amount: 108, unit: "mg" },
    "Selenium": { amount: 81.2, unit: "mcg" },
    "Sodium": { amount: 1275, unit: "mg" },
    "Zinc": { amount: 4, unit: "mg" },
    "Vitamin A (Retinol / beta-carotene)": { amount: 130, unit: "mcg" },
    "Vitamin B2 (Riboflavin)": { amount: 0.4, unit: "mg" },
    "Vitamin B3 (Niacin)": { amount: 17, unit: "mg" },
    "Vitamin B5 (Pantothenic Acid)": { amount: 2.4, unit: "mg" },
    "Vitamin B6 (Pyridoxine)": { amount: 1.2, unit: "mg" },
    "Vitamin B12 (Cobalamin)": { amount: 4.2, unit: "mcg" },
    "Vitamin C (Ascorbic Acid)": { amount: 67.5, unit: "mg" },
    "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)": { amount: 681, unit: "iu" },
    "Vitamin K (Menaquinone = K2)": { amount: 9, unit: "mcg" },
    "Biotin": { amount: 10, unit: "mcg" },
    "Choline": { amount: 147, unit: "mg" },
    "Folic Acid (Folate)": { amount: 24, unit: "mcg" },
    "Omega-3 (alpha-linolenic + EPA/DHA in marine form)": { amount: 1000, unit: "mg" },
    "Omega-6 (linoleic + GLA)": { amount: 1000, unit: "mg" },
    "Omega-9 (Arachidonic / Oleic)": { amount: 1000, unit: "mg" },
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
    hydration_electrolyte: 'Hydration / electrolyte',
    // Round 135 — completes the canonical-19 goal taxonomy (was missing these 5)
    essential_baseline: 'Essential baseline',
    detox_cleanse: 'Detox / cleanse',
    prostate_urinary: 'Prostate / urinary',
    weight_management: 'Weight management',
    eye_vision: 'Eye / vision'
  };

  // Round 135 — Source-field display map. Raw source keys (e.g. 'wallach_hbsp_default',
  // 'label-scan') MUST NEVER surface to the UI as-is. Lookup here first; humanizeKey
  // is the last-resort fallback. See displayName() below.
  const SOURCE_DISPLAY_NAMES = {
    'chat': 'Chat',
    'wallach_hbsp_default': 'HBSP 2.5 default',
    'label-scan': 'Label scan',
    'manual': 'Manual',
    'recommendation': 'Recommendation',
    'wallach_essential': 'Wallach essential',
    'wallach_recommendation_adopted': 'Adopted recommendation',
    'user_scanned': 'Scanned',
    'user_manual': 'Manual',
    'imported_cart': 'Imported cart'
  };

  // Round 135 — Last-resort humanizer for key-shaped strings.
  // Converts 'snake_case_key' or 'kebab-case-key' -> 'Snake Case Key'.
  // ANY user-visible text derived from a key MUST route through displayName()
  // or its sub-functions — raw keys never reach the surface. Codified as
  // lessons.md entry + design-knowledge.md entry (Round 135).
  function humanizeKey(key) {
    if (key == null) return '';
    const s = String(key).trim();
    if (!s) return '';
    return s.split(/[_-]+/)
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  // Generic display-name resolver: explicit map first, then humanize fallback.
  function displayName(key, explicitMap) {
    if (!key) return '';
    if (explicitMap && Object.prototype.hasOwnProperty.call(explicitMap, key)) {
      return explicitMap[key];
    }
    return humanizeKey(key);
  }
  // Expose for cross-IIFE access (mirrors the GOAL_DISPLAY_NAMES window export pattern)
  if (typeof window !== 'undefined') {
    window.SOURCE_DISPLAY_NAMES = SOURCE_DISPLAY_NAMES;
    window.humanizeKey = humanizeKey;
    window.displayName = displayName;
    window.GOAL_DISPLAY_NAMES = GOAL_DISPLAY_NAMES;
  }

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

  // Stage B+C (Round 99): findEssential delegates to window.matchToEssential
  // — the unified matcher operating over TARGETS_DATA (92 essentials,
  // Youngevity-pack-derived per Round 24 doctrine). Returns a TARGETS_DATA
  // entry shape: { name, category, target: { kind, low, high, unit, note, source } }.
  // Consumers (gapFillFor, getEffectiveCoverage adapter) read via the new shape.
  // namesMatch is preserved but no longer called — see below.
  function findEssential(name) {
    if (typeof window.matchToEssential !== 'function') return null; // graceful degradation
    return window.matchToEssential(name);
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

  // Stage B+C (Round 99): operates on TARGETS_DATA entry shape returned by
  // findEssential → window.matchToEssential. Reads ess.target.{low,high,unit}
  // instead of legacy ess.{low,high,unit}. Constructs the display string from
  // the same fields. Returns null for non-numeric kinds (trace_pdm,
  // wallach_collective, etc.) — same behavior the old code had when ess.low
  // was missing.
  function gapFillFor(n, dailyServings, effectiveCov) {
    const cov_table = effectiveCov || DIETARY_BASELINE;
    const ess = findEssential(n.name);
    if (!ess || !ess.target || ess.target.low == null) return null;
    const tgt = ess.target;
    const norm = normalize(parseFloat(n.amount), n.unit);
    if (!norm) return null;
    const targetNorm = normalize(tgt.low, tgt.unit);
    if (!targetNorm) return null;
    if (norm.family !== targetNorm.family) return null;
    const addedPerDay = norm.value * dailyServings;
    const cov = cov_table[ess.name];
    const curr = cov ? (normalize(cov.amount, cov.unit) || {value:0}).value : 0;
    const gap = Math.max(0, targetNorm.value - curr);
    const pct = targetNorm.value > 0 ? Math.round(1000 * Math.min(addedPerDay, gap) / targetNorm.value) / 10 : 0;
    const tgtDisplay = (tgt.low === tgt.high)
      ? tgt.low + ' ' + tgt.unit + '/day'
      : tgt.low + '–' + tgt.high + ' ' + tgt.unit + '/day';
    return {
      essential: ess.name,
      currentDisplay: cov ? (Number(cov.amount).toFixed(cov.amount < 10 ? 1 : 0) + ' ' + cov.unit) : '0',
      addedDisplay: formatAmt(addedPerDay, norm.family, tgt.unit),
      target: tgtDisplay,
      gapFillPct: pct
    };
  }

  // Effective coverage = dietary baseline + live regimen (unified pipeline).
  //
  // Stage B+C (Round 99, 2026-06-16): iterates TARGETS_DATA (the unified
  // 92-essentials Youngevity-pack dataset) and builds a base table keyed by
  // TARGETS_DATA names. DIETARY_BASELINE entries are matched in via paren-strip
  // equality (covers the 8 vitamin form-suffix cases like "Vitamin A" ↔
  // "Vitamin A (Retinol / beta-carotene)") and unit-converted to the target's
  // native unit. Live regimen contribution from window.computeLiveCoverage adds
  // on top in the same unit. Returns base keyed by TARGETS_DATA name — matches
  // what findEssential (now delegating to matchToEssential) returns, so
  // gapFillFor's cov_table[ess.name] lookup always lines up.
  //
  // Graceful degradation: if TARGETS_DATA or computeLiveCoverage aren't exposed
  // on window (cross-IIFE bootstrap window), returns DIETARY_BASELINE keys
  // unchanged. Bounded degraded path — no live regimen visible but no crash.
  // The IIFE init order makes this transient in practice; the defense is for
  // future-refactor safety (doctrine §7).
  function getEffectiveCoverage() {
    // Inline unit converter (mass family + IU). Returns null if incompatible
    // (e.g., mg→iu has no conversion — they measure different things).
    function unitConv(value, fromUnit, toUnit) {
      const f = (fromUnit || '').toLowerCase(), tu = (toUnit || '').toLowerCase();
      if (f === tu) return value;
      if (f === 'iu' || tu === 'iu') return null;
      let mg;
      if (f === 'mg') mg = value;
      else if (f === 'mcg') mg = value / 1000;
      else if (f === 'g') mg = value * 1000;
      else return null;
      if (tu === 'mg') return mg;
      if (tu === 'mcg') return mg * 1000;
      if (tu === 'g') return mg / 1000;
      return null;
    }

    const targets = (typeof window.TARGETS_DATA !== 'undefined') ? window.TARGETS_DATA : null;
    if (!targets || !targets.length) {
      // Fully degraded — return DIETARY_BASELINE keys as-is. Better than crash.
      const base = {};
      for (const [k, v] of Object.entries(DIETARY_BASELINE)) base[k] = { amount: v.amount, unit: v.unit };
      return base;
    }

    const computeFn = (typeof window.computeLiveCoverage === 'function') ? window.computeLiveCoverage : null;
    let live = null;
    if (computeFn) {
      try { live = computeFn(); } catch(e) { live = null; }
    }

    // Pre-resolve DIETARY_BASELINE keys to TARGETS_DATA names via
    // matchToEssential — same matcher the live pipeline uses for nutrient
    // names. Built once per call so getEffectiveCoverage doesn't re-resolve
    // per target. Round 99 spot-check fix: handles "Vitamin D" / "Folate" /
    // "Omega-3 (EPA+DHA)" / etc. that the naive paren-strip missed.
    const matchFn = (typeof window.matchToEssential === 'function') ? window.matchToEssential : null;
    const dbByTargetName = {};
    if (matchFn) {
      for (const [dbKey, dbEntry] of Object.entries(DIETARY_BASELINE)) {
        const matched = matchFn(dbKey);
        if (matched && matched.name) {
          dbByTargetName[matched.name] = dbEntry;
        }
      }
    }

    const base = {};
    for (const t of targets) {
      const tgt = t.target;
      if (!tgt || tgt.low == null) continue; // Non-numeric kind — skipped (gapFillFor returns null for these)
      const targetUnit = (tgt.unit || 'mg').toLowerCase();
      let amount = 0;

      // Pull DIETARY_BASELINE contribution via the matchToEssential-resolved map.
      const dbEntry = dbByTargetName[t.name];
      if (dbEntry) {
        const converted = unitConv(dbEntry.amount, dbEntry.unit, targetUnit);
        if (converted != null) amount += converted;
      }

      // Add live regimen contribution (in target's native unit).
      if (live) {
        const liveEntry = live[t.name];
        if (liveEntry) {
          if (targetUnit === 'iu') {
            amount += (liveEntry.totalIU || 0);
          } else {
            const liveAdd = unitConv(liveEntry.totalMg || 0, 'mg', targetUnit);
            if (liveAdd != null) amount += liveAdd;
          }
        }
      }

      if (amount > 0) {
        base[t.name] = { amount: Math.round(amount * 100) / 100, unit: targetUnit };
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

  function scan(label, opts) {
    // Pass D.1: opts.logToRecent (default true) lets non-Label-Check callers
    // (the Regimen tab's adoption modal) reuse the same scoring engine without
    // polluting the recent-scans log. Doctrine §3 single source of truth: same
    // verdict + reasons across surfaces; the side effect is opt-out.
    const cfg = Object.assign({ logToRecent: true }, opts || {});
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
    if (cfg.logToRecent) pushRecentScan(label, result);
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
      <td><input type="text" class="n-name" placeholder="e.g., Magnesium" value="${escapeHtml(name)}" maxlength="100"></td>
      <td><input type="number" class="n-amount" step="any" value="${escapeHtml(amount)}" maxlength="500"></td>
      <td><select class="n-unit">
        <option value="mg" ${unit==='mg'?'selected':''}>mg</option>
        <option value="mcg" ${unit==='mcg'?'selected':''}>mcg</option>
        <option value="g" ${unit==='g'?'selected':''}>g</option>
        <option value="iu" ${unit==='iu'?'selected':''}>IU</option>
      </select></td>
      <td><div style="display:flex;gap:6px;">
        <input type="text" class="n-form" placeholder="e.g., glycinate" value="${escapeHtml(form)}" style="flex:1;" maxlength="100">
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
      // Round 139 — `category` is now driven by the binary swap bar (diet|supplement)
      // rather than the freeform text input. The legacy `lc-category` hidden field
      // remains for backward compat but always reads empty post-Round-139. The
      // canonical type discriminator is `kind`; `category` mirrors kind for any
      // downstream legacy reader that hasn't been updated yet.
      category: $('lc-category').value.trim(),
      kind: (typeof window.getLcScannerKind === 'function') ? window.getLcScannerKind() : 'diet',
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
      let html = '<table class="gap-fill-table"><thead><tr><th>Essential</th><th>Your current</th><th>This adds</th><th>Daily target</th><th>Gap-fill</th></tr></thead><tbody>';
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
    try { const w = lsRead(WISHLIST_KEY, null); if (w && Array.isArray(w.items)) return w; } catch(e){}
    return { items: [] };
  }
  function persistWishlist(w) { try { lsWrite(WISHLIST_KEY, w); } catch(e){} }
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
  // Round 157 / Eden severance: Eden items (EDEN-LOCKED-* IDs OR canonical
  // Eden-catalog names) MUST NEVER be admitted to recent scans. The Scanner
  // tab is a separate input universe; Eden items are immutable + locked.
  // _isEdenSeverable() returns true if this label looks like an Eden item
  // attempting to slip into the Scanner namespace — reject loud.
  function _isEdenSeverable(label) {
    if (!label || typeof label !== 'object') return false;
    if (typeof label.eden_id === 'string' && label.eden_id.indexOf('EDEN-LOCKED-') === 0) return true;
    if (typeof label.id === 'string' && label.id.indexOf('EDEN-LOCKED-') === 0) return true;
    // Eden product cross-check by canonical name — defense-in-depth
    try {
      const lookupEl = document.getElementById('regimen-label-lookup');
      if (lookupEl) {
        const lookupData = JSON.parse(lookupEl.textContent);
        const products = (lookupData && lookupData.products) || {};
        const labelName = label.name;
        if (labelName && products[labelName] && products[labelName].eden_id) {
          // The name matches an Eden product. Sever — Scanner cannot touch this.
          return true;
        }
      }
    } catch(_) {}
    return false;
  }
  function loadRecent() {
    try {
      const r = lsRead(RECENT_KEY, { items: [] });
      if (!r || !Array.isArray(r.items)) return { items: [] };
      // Boot-time scrub: drop any items that look like Eden zombies. Defense-
      // in-depth against the case where an Eden item somehow leaked into LS
      // before this rule shipped (or via a future bug).
      const before = r.items.length;
      r.items = r.items.filter(it => !_isEdenSeverable(it && it.label));
      if (r.items.length < before) {
        console.warn('[Eden severance] scrubbed ' + (before - r.items.length) + ' Eden zombie(s) from recent scans');
        try { lsWrite(RECENT_KEY, r); } catch(_) {}
      }
      return r;
    } catch(e) { return { items: [] }; }
  }
  function pushRecentScan(label, result) {
    // Round 157 / Eden severance — Eden items can never enter Recent scans.
    if (_isEdenSeverable(label)) {
      console.error('[Eden severance] refused to add Eden item to recent scans:', label && label.name);
      return;
    }
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
    try { lsWrite(RECENT_KEY, r); } catch(e) {}
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
    // Round 139 — populate the swap bar from item.kind (or item.label.kind),
    // marked as fromHeuristic so a subsequent user click can override.
    if (typeof window.setLcScannerKind === 'function') {
      const k = (item.label.kind || item.kind || '').toLowerCase();
      if (k === 'diet' || k === 'food') window.setLcScannerKind('diet', { fromHeuristic: true });
      else if (k === 'supplement') window.setLcScannerKind('supplement', { fromHeuristic: true });
      else window.setLcScannerKind('diet', { fromHeuristic: true });
    }
    if (typeof window.clearLcKindOverride === 'function') window.clearLcKindOverride();
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
  function loadRegimen() { try { const r = lsRead(REGIMEN_KEY, { items: [] }); return (r && Array.isArray(r.items)) ? r : { items: [] }; } catch(e) { return { items: [] }; } }
  function persistRegimen(r) {
    // Round 150 (§31 Cross-Surface State Sync chokepoint) — every regimen LS
    // write fires triggerRegimenRerender so all subscribed surfaces re-render.
    try { lsWrite(REGIMEN_KEY, r); } catch(e) {}
    try { if (typeof window.triggerRegimenRerender === 'function') window.triggerRegimenRerender('persistRegimen'); } catch(_) {}
  }
  // Round 150 §31 — cross-IIFE exposure so the Save System IIFE's addItemToRegimen
  // routes through the same chokepoint. Failure case the exposure prevents: a
  // second lsWrite path bypassing the trigger cascade.
  if (typeof window !== 'undefined') window.persistRegimen = persistRegimen;
  function addToRegimen(label, sourceWishlistId, provenance) {
    // Round 135 / Phase 2 — provenance + shared slot side-effects.
    // Both existing call sites (scanner-result direct add + wishlist promote)
    // originate from scanned items, so default = 'user_scanned'. Callers
    // pass a different provenance explicitly when adding via a non-scanner
    // path that still routes through this function.
    provenance = provenance || 'user_scanned';
    const r = loadRegimen();
    if (r.items.find(i => i.label && i.label.name === label.name)) return; // dedup
    r.items.unshift({
      id: Date.now() + Math.floor(Math.random()*1000),
      label,
      addedDate: new Date().toISOString().slice(0,10),
      provenance: provenance
    });
    persistRegimen(r);
    // Fire shared slot side-effects (ensureDefaultSlot + sync + invariant + renders).
    if (typeof window.applyRegimenSlotEffects === 'function') {
      try { window.applyRegimenSlotEffects(provenance); } catch(e) { console.error('[addToRegimen] applyRegimenSlotEffects failed', e); }
    }
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
  // Round 153 §31 cross-IIFE exposure — Regimen tab IIFE's rg-remove handler
  // needs to hard-delete scanner-sourced items from lcRegimen_v1 (Bug B user
  // direction: items reappear in Wishlist for re-adding). Mirror addToRegimen
  // + inRegimen for symmetry; both already in active cross-IIFE callsites.
  if (typeof window !== 'undefined') {
    window.removeFromRegimen = removeFromRegimen;
    window.addToRegimen = addToRegimen;
    window.inRegimen = inRegimen;
  }

  // ---- OCR (Tesseract.js, lazy-loaded from CDN on first use) ----
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Round 161 polish — load from vendored local copy (see tools/vendor-tesseract.js).
      // Honors the 4-year-portability rule: zero external runtime resources.
      script.src = './assets/vendor/tesseract/tesseract.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Could not load local OCR engine. Run `node tools/vendor-tesseract.js` once to vendor Tesseract files into dashboard/assets/vendor/tesseract/.'));
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
    // Round 161 polish — all paths point at the vendored local copy
    // (see tools/vendor-tesseract.js). corePath points at the directory;
    // tesseract.js auto-selects between simd / simd-lstm based on browser
    // feature detection.
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath: './assets/vendor/tesseract/worker.min.js',
      corePath: './assets/vendor/tesseract/',
      langPath: './assets/vendor/tesseract/lang-data',
      logger: m => {
        if (m.status === 'recognizing text') progressCallback('Reading text carefully...', 0.1 + m.progress * 0.9);
        else if (m.status === 'loading language traineddata') progressCallback('Loading language model from local vendor...', m.progress || 0);
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
      // Pass E.0.3: support cfg.bodyHtml for callers that need structured HTML
      // (Pass E's ingredient popup uses this for the styled quote layout).
      // Default path stays .textContent (XSS-safe) for arbitrary body text.
      if (cfg.bodyHtml) {
        modal.querySelector('.lc-modal-body').innerHTML = cfg.bodyHtml;
      } else {
        modal.querySelector('.lc-modal-body').textContent = cfg.body;
      }
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
      // Pass E.0.3: hide Cancel button entirely when cancelText is empty —
      // Pass E's ingredient popup needs a single Close button, not a teased
      // empty-text Cancel. Backwards-compatible: callers that pass any
      // non-empty cancelText get the existing two-button layout.
      if (cfg.cancelText) {
        cancelBtn.hidden = false;
        cancelBtn.textContent = cfg.cancelText;
      } else {
        cancelBtn.hidden = true;
        cancelBtn.textContent = '';
      }

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
  // Round 131 — Expose showLcModal on window so callers OUTSIDE this IIFE can
  // reach it. confirmDeleteSlot (defined at outer script scope) was failing
  // to resolve the bare `showLcModal` identifier because function declarations
  // inside an IIFE are scoped to that IIFE. Save flow worked by accident
  // (showCustomizeSlotModal is also outer-scope but its showLcModal calls
  // happened to resolve via a different fluke — exposing on window is the
  // structural fix that makes the call always work).
  window.showLcModal = showLcModal;

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
    "supplements": [],
    "diet": [],
    "recommended": [
      {
        "id": "EDEN-LOCKED-btt-2-5-canister",
        "name": "BTT 2.5 Canister",
        "kind": "recommended",
        "source": "wallach_hbsp_default",
        "dose_text": "2 scoops (15g) daily",
        "scaling_factor": 1.0,
        "notes": "",
        "actual_range": "",
        "timing": "",
        "category": "YGY foundational mineral multi (newer powder form)",
        "what_it_does": "Provides the body with the vitamins, prebiotics, probiotics, amino acids, and enzymes needed for optimal health.",
        "nutrients": [
          {
            "name": "Vitamin A (beta-carotene)",
            "amount": 810,
            "unit": "mcg RAE",
            "form": "retinyl palmitate (46%) + beta-carotene (54%)",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin C",
            "amount": 1000,
            "unit": "mg",
            "form": "ascorbic acid",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin D3",
            "amount": 18.8,
            "unit": "mcg",
            "form": "cholecalciferol",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin E",
            "amount": 100,
            "unit": "mg",
            "form": "d-alpha tocopheryl acetate",
            "alignment": "partial"
          },
          {
            "name": "Vitamin B1 (Thiamine)",
            "amount": 30,
            "unit": "mg",
            "form": "thiamine mononitrate",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin B2 (Riboflavin)",
            "amount": 30,
            "unit": "mg",
            "form": "riboflavin",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin B3 (Niacin)",
            "amount": 40,
            "unit": "mg NE",
            "form": "niacinamide",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin B6 (Pyridoxine)",
            "amount": 30,
            "unit": "mg",
            "form": "pyridoxine HCl",
            "alignment": "partial"
          },
          {
            "name": "Folic Acid (Folate)",
            "amount": 400,
            "unit": "mcg DFE",
            "form": "calcium-L-5-methylfolate",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin B12 (Cobalamin)",
            "amount": 500,
            "unit": "mcg",
            "form": "methylcobalamin",
            "alignment": "aligned"
          },
          {
            "name": "Biotin",
            "amount": 600,
            "unit": "mcg",
            "form": "biotin",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin B5 (Pantothenic Acid)",
            "amount": 150,
            "unit": "mg",
            "form": "D-calcium pantothenate",
            "alignment": "aligned"
          },
          {
            "name": "Choline",
            "amount": 25,
            "unit": "mg",
            "form": "choline bitartrate",
            "alignment": "partial"
          },
          {
            "name": "Calcium",
            "amount": 130,
            "unit": "mg",
            "form": "Ca gluconate/ascorbate/citrate",
            "alignment": "partial"
          },
          {
            "name": "Iron",
            "amount": 1,
            "unit": "mg",
            "form": "ferrous gluconate",
            "alignment": "partial"
          },
          {
            "name": "Magnesium",
            "amount": 20,
            "unit": "mg",
            "form": "Mg gluconate and oxide",
            "alignment": "partial"
          },
          {
            "name": "Zinc",
            "amount": 2,
            "unit": "mg",
            "form": "zinc gluconate",
            "alignment": "partial"
          },
          {
            "name": "Selenium",
            "amount": 100,
            "unit": "mcg",
            "form": "selenomethionine",
            "alignment": "aligned"
          },
          {
            "name": "Copper",
            "amount": 1,
            "unit": "mg",
            "form": "copper gluconate",
            "alignment": "partial"
          },
          {
            "name": "Chromium",
            "amount": 200,
            "unit": "mcg",
            "form": "chromium chelate",
            "alignment": "partial"
          },
          {
            "name": "Potassium",
            "amount": 100,
            "unit": "mg",
            "form": "K gluconate and citrate",
            "alignment": "aligned"
          },
          {
            "name": "Boron",
            "amount": 1,
            "unit": "mg",
            "form": "boron citrate",
            "alignment": "aligned"
          },
          {
            "name": "Vitamin K (Menaquinone = K2)",
            "amount": 30,
            "unit": "mcg",
            "form": "menaquinone-7 (K2 MK-7)",
            "alignment": "aligned"
          }
        ],
        "has_nutrient_data": true,
        "_eden_id": "EDEN-LOCKED-btt-2-5-canister",
        "_eden_version": 1
      },
      {
        "id": "EDEN-LOCKED-beyond-osteo-fx-powder",
        "name": "Beyond Osteo FX Powder",
        "kind": "recommended",
        "source": "wallach_hbsp_default",
        "dose_text": "1 scoop (12.8 g) daily",
        "scaling_factor": 1.0,
        "notes": "",
        "actual_range": "",
        "timing": "",
        "category": "YGY bone / Sr / sulfur cluster",
        "what_it_does": "Supplies calcium, trace minerals, and other nutrients that can help the body better absorb calcium.",
        "nutrients": [
          {
            "name": "Vitamin D3",
            "amount": 25,
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
            "amount": 600,
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
            "amount": 5,
            "unit": "mg",
            "form": "unspecified",
            "alignment": "partial"
          },
          {
            "name": "Copper",
            "amount": 0.1,
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
            "amount": 1,
            "unit": "mg",
            "form": "unspecified",
            "alignment": "aligned"
          }
        ],
        "has_nutrient_data": true,
        "_eden_id": "EDEN-LOCKED-beyond-osteo-fx-powder",
        "_eden_version": 1
      },
      {
        "id": "EDEN-LOCKED-ultimate-efa-plus",
        "name": "Ultimate EFA Plus",
        "kind": "recommended",
        "source": "wallach_hbsp_default",
        "dose_text": "1 softgel daily",
        "scaling_factor": 1.0,
        "notes": "",
        "actual_range": "",
        "timing": "",
        "category": "YGY EFA softgel (marine + flax)",
        "what_it_does": "Provides the right blend of essential fatty acids to promote overall good health, including targeted support for the heart.",
        "nutrients": [
          {
            "name": "Omega-3 (alpha-linolenic + EPA/DHA in marine form)",
            "amount": 585,
            "unit": "mg",
            "form": "ALA 300 + EPA 171 + DHA 114 (per softgel)",
            "alignment": "aligned"
          },
          {
            "name": "Omega-6 (linoleic + GLA)",
            "amount": 122,
            "unit": "mg",
            "form": "Linoleic 103 + GLA 19 (per softgel)",
            "alignment": "aligned"
          },
          {
            "name": "Omega-9 (Arachidonic / Oleic)",
            "amount": 120,
            "unit": "mg",
            "form": "Oleic",
            "alignment": "aligned"
          }
        ],
        "has_nutrient_data": true,
        "_eden_id": "EDEN-LOCKED-ultimate-efa-plus",
        "_eden_version": 1
      }
    ]
  };
  // Round 135 — expose BASE_DATA on window for cross-IIFE access.
  // computeSlotStats (Save System IIFE) reads this to merge BASE_DATA items
  // into the slot's stats so adopted recommendations get counted.
  if (typeof window !== 'undefined') window.REGIMEN_BASE_DATA = REGIMEN_BASE_DATA;

  // Round 157 / Eden — boot-time integrity check on the three Eden-derived
  // embeds. Reads eden_version from each, confirms they all match, sets
  // window.__edenIntegrityOK accordingly. Recommendation surfaces should
  // gate on this flag — if false, fall back to safe display ("Eden integrity
  // failed — recommendations unavailable until catalog is rebuilt").
  //
  // This is DEFENSE-IN-DEPTH against the server-side check_eden_embeds_match_canonical
  // invariant. If somehow the embeds drift in flight (browser cache, partial
  // load, etc.), this catches it at the render layer too. No silent failures.
  (function() {
    if (typeof window === 'undefined') return;
    let versions = [];
    try {
      const lookupEl = document.getElementById('regimen-label-lookup');
      if (lookupEl) {
        const lookupData = JSON.parse(lookupEl.textContent);
        if (lookupData && lookupData._meta && typeof lookupData._meta.eden_version !== 'undefined') {
          versions.push({embed: 'regimen-label-lookup', v: lookupData._meta.eden_version});
        }
      }
    } catch(_) {}
    try {
      const goalEl = document.getElementById('goal-recommendations-data');
      if (goalEl) {
        const goalData = JSON.parse(goalEl.textContent);
        if (goalData && (typeof goalData._eden_version !== 'undefined' || typeof goalData.eden_version !== 'undefined')) {
          versions.push({embed: 'goal-recommendations-data', v: goalData._eden_version || goalData.eden_version});
        }
      }
    } catch(_) {}
    try {
      // REGIMEN_BASE_DATA.recommended items each carry _eden_version (per eden_build.py)
      if (Array.isArray(REGIMEN_BASE_DATA.recommended) && REGIMEN_BASE_DATA.recommended.length > 0) {
        const first = REGIMEN_BASE_DATA.recommended[0];
        if (first && typeof first._eden_version !== 'undefined') {
          versions.push({embed: 'REGIMEN_BASE_DATA.recommended[0]', v: first._eden_version});
        }
      }
    } catch(_) {}
    // If any embed is missing its eden_version, OR versions disagree, integrity fails
    if (versions.length === 0) {
      console.error('[Eden] integrity check FAILED — no eden_version stamps found on any embed. Recommendation system may be in pre-Eden state.');
      window.__edenIntegrityOK = false;
      window.__edenIntegrityDetail = 'no_version_stamps';
      return;
    }
    const first = versions[0].v;
    const drift = versions.find(v => v.v !== first);
    if (drift) {
      console.error('[Eden] integrity check FAILED — version drift across embeds:', JSON.stringify(versions));
      window.__edenIntegrityOK = false;
      window.__edenIntegrityDetail = 'version_drift';
      return;
    }
    window.__edenIntegrityOK = true;
    window.__edenIntegrityVersion = first;
    console.info('[Eden] integrity check PASSED — eden_version ' + first + ' across ' + versions.length + ' embed(s).');
  })();

  const RG_OVERRIDES_KEY = 'rgOverrides_v1';      // user edits keyed by id
  const RG_MANUAL_KEY = 'rgManualItems_v1';       // user-added items
  const RG_REMOVED_KEY = 'rgRemoved_v1';          // soft-deletes by id
  const RG_OUTCOMES_KEY = 'rgOutcomes_v1';        // outcome log keyed by id
  const RG_USER_GOALS_KEY = 'rgUserGoals_v1';     // user-selected goals (Round 134 — UI ships Round 156 follow-up)
  let rgFilter = 'all';
  // Pass C.2 hotfix: rgGroupBy declared with safe 'kind' default. The Pass C.2
  // crash was: `let rgGroupBy = hasUserGoals() ? 'goal' : 'kind';` called
  // hasUserGoals() at module-load time, which did `typeof RG_GOAL_ORDER` — but
  // RG_GOAL_ORDER is `const` declared LATER in this same IIFE. TDZ throws
  // ReferenceError, the whole regimen IIFE fails to register exports, and the
  // user's regimen tab renders empty even though localStorage data is intact.
  // The real default-to-goal logic runs in initRegimenTab() (below) where all
  // module-scope const/let declarations are guaranteed to be initialized.
  let rgGroupBy = 'kind';
  function hasUserGoals() {
    return (typeof RG_GOAL_ORDER !== 'undefined') && Array.isArray(RG_GOAL_ORDER) && RG_GOAL_ORDER.length > 0;
  }
  let rgSortBy = 'coverage';  // Pass C.1: 'coverage' (default, desc count of meaningful contributions) | 'name' (A-Z)

  function rgSortItems(items) {
    // Pass C.1: pre-compute _covCount once per item; reused across all sort calls
    // within a render. The Pass B.1 threshold (>=15% of Wallach low target) is
    // baked in via getItemEssentialContributions — sub-threshold trace amounts
    // don't inflate the coverage count, so the sort can't be cheated.
    items.forEach(it => {
      if (it._covCount == null) {
        it._covCount = (typeof getItemEssentialContributions === 'function')
          ? getItemEssentialContributions(it).length : 0;
      }
    });
    const sorted = items.slice();
    if (rgSortBy === 'name') {
      sorted.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    } else {
      // 'coverage' default: desc by meaningful-contribution count, tiebreak by name asc
      sorted.sort((a, b) => {
        const dc = (b._covCount || 0) - (a._covCount || 0);
        if (dc !== 0) return dc;
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });
    }
    return sorted;
  }

  // Pass B — Goal-anchored grouping. Map each user-stated goal to the nutrient-name
  // fragments that signal an item serves that goal. Sourced from memory/user-goals.md.
  // The matcher is substring + case-insensitive, so "Vitamin B" matches "Vitamin B1 (Thiamine)",
  // "Vitamin B12 (Cobalamin)", etc. The longevity_anti_aging goal is special: it matches
  // any item carrying >=5 distinct nutrients (multi-essential foundational products) OR
  // mentions "90 essential" / "longevity" in its notes/category.
  // Round 135 — Issue 4: hardcoded chat-seeded goal taxonomy wiped.
  // Empty defaults until the goal-picker UI round (filed in open-threads for
  // tomorrow) wires LS-backed goal reading from a user-set list. With these
  // empty, hasUserGoals() returns false -> Goal grouping button grays out +
  // rgGroupBy auto-falls-back to 'kind' (existing fallback ~line 11479).
  // USER_GOAL_NUTRIENTS will be re-populated from the canonical 19-goal taxonomy
  // (catalog-index/goal-to-products.json + hydration_electrolyte) when the
  // goal-picker round ships. RG_GOAL_LABELS will source from GOAL_DISPLAY_NAMES
  // (the canonical display-name map) at that time.
  const USER_GOAL_NUTRIENTS = {};
  const RG_GOAL_LABELS = {};
  const RG_GOAL_ORDER = [];

  // Pass B.1: meaningful-amount threshold. An item only matches a goal if it
  // carries a goal-relevant nutrient at >=15% of that nutrient's Wallach low-end
  // target (same pattern as Pass 3's 20% ideal-supplements threshold). Without
  // this, a Medjool date with 5mg magnesium (0.8% of 620mg target) trivially
  // matched cognition + hormones because "Magnesium" is on those goal lists.
  const RG_MEANINGFUL_THRESHOLD = 0.15;
  let _essentialsTargetCache = null;
  function getEssentialsTargets() {
    if (_essentialsTargetCache !== null) return _essentialsTargetCache;
    _essentialsTargetCache = {};
    try {
      const el = document.getElementById('essentials-targets-data');
      if (!el) return _essentialsTargetCache;
      const parsed = JSON.parse(el.textContent);
      const list = (parsed && parsed.essentials) || [];
      list.forEach(e => {
        if (!e || !e.name) return;
        const key = e.name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
        _essentialsTargetCache[key] = {
          fullName: e.name,
          low: (e.target && typeof e.target.low === 'number') ? e.target.low : null,
          unit: (e.target && e.target.unit) ? e.target.unit.toLowerCase() : null,
          kind: (e.target && e.target.kind) || null,
        };
      });
    } catch(_e) { /* leave cache empty — every contribution check returns false */ }
    return _essentialsTargetCache;
  }
  // Basic unit conversion to mg-equivalent. IU is intentionally not converted
  // (vitamin-specific math is too noisy for a first-pass threshold check); IU
  // nutrients fall through to "no meaningful contribution" which is a conservative
  // default — biases toward false-negative matches, matching the user's stated
  // concern that the matcher was too permissive.
  function toMgEquivalent(amount, unit) {
    if (typeof amount !== 'number' || amount <= 0 || !unit) return null;
    const u = String(unit).toLowerCase();
    if (u === 'mg') return amount;
    if (u === 'mcg' || u === 'ug' || u === 'µg') return amount / 1000;
    if (u === 'g') return amount * 1000;
    return null;  // IU or unknown — skip
  }
  function nutrientNormalizedName(name) {
    return String(name || '').toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
  }
  function isMeaningfulContribution(itemNutrient) {
    if (!itemNutrient || !itemNutrient.name) return false;
    const targets = getEssentialsTargets();
    const key = nutrientNormalizedName(itemNutrient.name);
    const t = targets[key];
    if (!t) {
      // Not in 92 essentials at all — check if it's a recognized form variant
      // (e.g., "Vitamin B12" item nutrient vs "Vitamin B12 (Cobalamin)" target).
      // Try prefix-match: target name starts with item name's first significant tokens.
      const itemFirstTwo = key.split(/\s+/).slice(0, 2).join(' ');
      const fallbackKey = Object.keys(targets).find(k => k.startsWith(itemFirstTwo) && itemFirstTwo.length >= 4);
      if (!fallbackKey) return false;
      const ft = targets[fallbackKey];
      if (!ft || ft.low == null || !ft.unit) return false;
      const itemMg = toMgEquivalent(itemNutrient.amount, itemNutrient.unit);
      const targetMg = toMgEquivalent(ft.low, ft.unit);
      if (itemMg == null || targetMg == null || targetMg <= 0) return false;
      return (itemMg / targetMg) >= RG_MEANINGFUL_THRESHOLD;
    }
    if (t.low == null || !t.unit) return false;  // non-numeric target (trace_pdm etc.) — skip
    const itemMg = toMgEquivalent(itemNutrient.amount, itemNutrient.unit);
    const targetMg = toMgEquivalent(t.low, t.unit);
    if (itemMg == null || targetMg == null || targetMg <= 0) return false;
    return (itemMg / targetMg) >= RG_MEANINGFUL_THRESHOLD;
  }

  // Pass B.2: protein-ratio strength match. Foods with substantial protein per
  // serving (>=5g) qualify for the hormones_strength goal as a "protein-based"
  // match — distinct from nutrient-threshold match — even when no Wallach
  // essential meaningfully contributes. Bio-availability + protein-quality
  // differentiation explicitly deferred (user-stated, 2026-06-15): once corpus
  // data on strength foods is denser, this auto-promotes to full nutrient match.
  // For now the chip rendering surfaces a visible caveat per the user's request.
  const PROTEIN_STRENGTH_THRESHOLD_G = 5;
  function getItemProteinG(item) {
    if (!item || !item.nutrients) return 0;
    for (const n of item.nutrients) {
      const name = (n && n.name || '').toLowerCase();
      if (name === 'protein') {
        // Amount is per-day-scaled grams (the dose_text scaling has already been applied)
        const amt = typeof n.amount === 'number' ? n.amount : parseFloat(n.amount);
        if (!isNaN(amt) && amt > 0) return amt;
      }
    }
    return 0;
  }

  // Pass C — Stack-as-coverage-shape. Per-item compute of which of the 92
  // essentials this item meaningfully contributes to (>=15% of Wallach low
  // target — reuses the Pass B.1 threshold), with contribution % surfaced as
  // colored coverage cells. Each cell links back to its periodic-table tile
  // via window.activateGroup('you') + synthetic tile click — connectivity-by-
  // navigation, no new helper API needed in the Periodic Table IIFE.
  const RG_COV_MAX_CELLS = 10;  // overflow indicator beyond this
  // Symbol abbreviation map for the most common essentials; fallback below.
  const RG_ESSENTIAL_SYMBOLS = {
    'vitamin a': 'A', 'vitamin c': 'C', 'vitamin d': 'D', 'vitamin d3': 'D',
    'vitamin e': 'E', 'vitamin k': 'K', 'vitamin k2': 'K2',
    'vitamin b1': 'B1', 'vitamin b2': 'B2', 'vitamin b3': 'B3', 'vitamin b5': 'B5',
    'vitamin b6': 'B6', 'vitamin b12': 'B12', 'biotin': 'B7', 'folate': 'B9',
    'folic acid': 'B9', 'pantothenic acid': 'B5', 'choline': 'Cho',
    'calcium': 'Ca', 'magnesium': 'Mg', 'potassium': 'K+', 'sodium': 'Na',
    'iron': 'Fe', 'zinc': 'Zn', 'copper': 'Cu', 'selenium': 'Se',
    'iodine': 'I', 'chromium': 'Cr', 'manganese': 'Mn', 'molybdenum': 'Mo',
    'phosphorus': 'P', 'boron': 'B', 'vanadium': 'V', 'silicon': 'Si',
    'silica': 'Si', 'sulfur': 'S', 'strontium': 'Sr', 'germanium': 'Ge',
    'omega-3': 'ω3', 'omega-6': 'ω6', 'omega-9': 'ω9',
    'taurine': 'Tau', 'arginine': 'Arg', 'lysine': 'Lys', 'methionine': 'Met',
    'tyrosine': 'Tyr', 'plant derived minerals': 'PDM',
  };
  function essentialSymbol(name) {
    if (!name) return '?';
    const norm = String(name).toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (RG_ESSENTIAL_SYMBOLS[norm]) return RG_ESSENTIAL_SYMBOLS[norm];
    // Try prefix match (e.g., "vitamin b12 (cobalamin)" already stripped to "vitamin b12")
    for (const k of Object.keys(RG_ESSENTIAL_SYMBOLS)) {
      if (norm.startsWith(k)) return RG_ESSENTIAL_SYMBOLS[k];
    }
    // Fallback: first 3 chars of first word, capitalized
    const first = norm.split(/\s+/)[0] || norm;
    return first.charAt(0).toUpperCase() + first.slice(1, 3);
  }
  function contributionTier(pct) {
    if (pct >= 100) return 'tier-full';
    if (pct >= 60) return 'tier-strong';
    if (pct >= 30) return 'tier-mid';
    if (pct >= 15) return 'tier-soft';
    return 'tier-faint';
  }
  function getItemEssentialContributions(item) {
    if (!item || !item.nutrients) return [];
    const targets = (typeof getEssentialsTargets === 'function') ? getEssentialsTargets() : {};
    // Round 158 — honor scaling_factor (driven by dose_amount × times_per_day).
    // Prior to this, the per-card essentials badge was unscaled even when the
    // Periodic Table coverage was scaled — visible inconsistency when the user
    // bumped their dose. Now both surfaces use the same scaled amount.
    const _sf = parseFloat(item.scaling_factor);
    const scale = (isFinite(_sf) && _sf > 0) ? _sf : 1;
    const out = [];
    item.nutrients.forEach(n => {
      if (!n || !n.name) return;
      const key = nutrientNormalizedName(n.name);
      let t = targets[key];
      if (!t) {
        const itemFirstTwo = key.split(/\s+/).slice(0, 2).join(' ');
        const fallbackKey = Object.keys(targets).find(k => k.startsWith(itemFirstTwo) && itemFirstTwo.length >= 4);
        if (fallbackKey) t = targets[fallbackKey];
      }
      if (!t || t.low == null || !t.unit) return;
      const itemMg = toMgEquivalent(n.amount, n.unit);
      const targetMg = toMgEquivalent(t.low, t.unit);
      if (itemMg == null || targetMg == null || targetMg <= 0) return;
      const scaledItemMg = itemMg * scale;
      const pct = (scaledItemMg / targetMg) * 100;
      if (pct < 15) return;  // below meaningful threshold
      out.push({
        name: t.fullName || n.name,
        pct: pct,
        tier: contributionTier(pct),
        symbol: essentialSymbol(t.fullName || n.name),
        amountMg: scaledItemMg,
        targetMg: targetMg,
      });
    });
    // Dedupe by essential name (an item could list the same essential twice across direct + non_essentials)
    const seen = new Set();
    const deduped = [];
    out.sort((a, b) => b.pct - a.pct).forEach(c => {
      if (!seen.has(c.name)) { seen.add(c.name); deduped.push(c); }
    });
    return deduped;
  }
  // Pass D.1: synthesize a label-like object from a regimen item so we can pass
  // it through window.lcScan for unified scoring + verdict + reasons. The shape
  // matches what scan() expects (see Label Check IIFE): name, brand, category,
  // servings, ingredients, nutrients[{name, amount, unit, form, form_alignment}].
  function syntheticLabelFromItem(item) {
    return {
      name: (item && item.name) || '',
      brand: (item && item.brand) || 'Youngevity',
      category: (item && item.category) || '',
      container: '',
      servings: 1,
      ingredients: (item && item.ingredients) || '',
      nutrients: ((item && item.nutrients) || []).map(n => ({
        name: (n && n.name) || '',
        amount: n && n.amount,
        unit: (n && n.unit) || '',
        form: (n && n.form) || '',
        form_alignment: (n && (n.alignment || n.form_alignment)) || 'unknown',
      })),
    };
  }

  function itemHasBlendBonus(item) {
    if (!item || !item.nutrients) return false;
    return item.nutrients.some(n => n && n.category === 'blend_parent' && n.sub_ingredients && n.sub_ingredients.length);
  }

  // Pass E — Ingredient education layer. Reads the embedded ingredients-embed
  // JSON block (slim form of knowledge/ingredients-master.json from Pass A.3+).
  // Returns the slim entry for a given ingredient name, or null if not found.
  // Lookup is case-insensitive on the normalized canon key with paren-stripping
  // to match how the embed was built. Cached on first call.
  let _ingredientsEmbedCache = null;
  function loadIngredientsEmbed() {
    if (_ingredientsEmbedCache !== null) return _ingredientsEmbedCache;
    _ingredientsEmbedCache = {};
    try {
      const el = document.getElementById('ingredients-embed');
      if (!el) return _ingredientsEmbedCache;
      const parsed = JSON.parse(el.textContent);
      _ingredientsEmbedCache = (parsed && parsed.ingredients) || {};
    } catch(_e) { /* leave empty - all lookups will return null */ }
    return _ingredientsEmbedCache;
  }
  function getIngredientInfo(name) {
    if (!name) return null;
    const lookup = loadIngredientsEmbed();
    const canon = String(name).toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (lookup[canon]) return lookup[canon];
    // Fallback prefix-match for "Vitamin B12" → "vitamin b12 (cobalamin)"
    const firstTwo = canon.split(/\s+/).slice(0, 2).join(' ');
    if (firstTwo.length >= 4) {
      const hit = Object.keys(lookup).find(k => k.startsWith(firstTwo));
      if (hit) return lookup[hit];
    }
    return null;
  }
  // Pass E: open the existing citation-popup (Round 56) with ingredient data.
  // Reuses the popup's structural shape (cp-eyebrow, cp-title, cp-cite,
  // cp-source-tag, cp-fallback-note) so no new modal/popup surface is added.
  // Doctrine §3 — single popup for cite-style info reveals; consumers pass
  // their own content via the same field contract.
  // Pass E.0.3: map raw corpus filenames to human-readable titles. The Wallach
  // corpus has ~5 active sources (books + a discontinued Hell's Kitchen
  // transcript); each gets a curated display name + year + co-author credit
  // where applicable. Unknown sources fall back to a cleaned version of the
  // filename so users always see SOMETHING readable.
  // Pass E.0.4: web-verified publication years. Previously inferred from
  // filenames/recollection (wrong on all three). Verified June 2026:
  // - Let's Play Doctor: 1989 (Wellness Publication, 4th ed.)
  // - Dead Doctors Don't Lie: 1999 (book; the 2011 in the EPUB filename was
  //   just the e-book conversion year)
  // - Rare Earths: Forbidden Cures: 1994 (1994 copyright; later printings)
  // - Hell's Kitchen: transcript with no firm publication year — left undated
  const WALLACH_SOURCE_NAMES = {
    "421125261-Let-s-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.txt": "Let's Play Doctor! — Dr. Joel D. Wallach & Dr. Ma Lan (1989)",
    "Joel_D__Wallach_-_Dead_Doctors_Don_t_Lie__2011___EPUB__-_roflcopter2110.txt": "Dead Doctors Don't Lie — Dr. Joel D. Wallach (1999)",
    "pdfcoffee_com_rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf-free.txt": "Rare Earths: Forbidden Cures — Dr. Joel D. Wallach & Dr. Ma Lan (1994)",
    "788873904-Dr-Joel-Wallach-Joel-D-Wallach-JD-Wallach-Ma-Lan-MD-Hell-s-Kitchen-Cau.txt": "Hell's Kitchen — Dr. Joel D. Wallach & Dr. Ma Lan",
  };
  function humanizeWallachSource(srcFilename) {
    if (!srcFilename) return '';
    if (WALLACH_SOURCE_NAMES[srcFilename]) return WALLACH_SOURCE_NAMES[srcFilename];
    // Best-effort cleanup of unknown filenames: strip extension, replace
    // separators with spaces, collapse multiple spaces. Transcript filenames
    // also fall through here.
    let s = srcFilename.replace(/\.(txt|pdf|epub|vtt)$/i, '');
    s = s.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }

  // Pass E.1: load the curated essentials-benefits-data block — the same
  // source the Periodic Table view uses for its "Known benefits" pills.
  // This is the canonical Youngevity-sourced quick-reference content per
  // essential. User direction (E.1): drop the Wallach corpus snippet path
  // from the popup, lean on the per-essential benefit list as the educational
  // tidbit. One source serves all surfaces — doctrine §3 in action.
  let _benefitsCache = null;
  let _quickrefCache = null;
  function loadEssentialsBenefits() {
    if (_benefitsCache !== null) return _benefitsCache;
    _benefitsCache = {};
    try {
      const el = document.getElementById('essentials-benefits-data');
      if (!el) return _benefitsCache;
      _benefitsCache = JSON.parse(el.textContent) || {};
    } catch(_e) { /* leave empty */ }
    return _benefitsCache;
  }
  function loadIngredientsQuickref() {
    // Pass E.1.2 — curated quick-reference snippets for non-essential
    // ingredients (botanicals, amino acids, fatty acids, common blend
    // sub-ingredients). Same {t,p} schema as essentials-benefits-data
    // so a single matcher can serve both datasets.
    if (_quickrefCache !== null) return _quickrefCache;
    _quickrefCache = {};
    try {
      const el = document.getElementById('ingredients-quickref-data');
      if (!el) return _quickrefCache;
      _quickrefCache = JSON.parse(el.textContent) || {};
    } catch(_e) { /* leave empty */ }
    return _quickrefCache;
  }
  function findBenefitsForIngredient(name) {
    // Pass E.1.2: search BOTH curated datasets, returning the first hit.
    // Essentials are checked first (richer entries — 4-6 benefits each).
    // Quickref is the fallback for botanicals + non-essential nutrients.
    if (!name) return null;
    const hit = _matchBenefitsIn(name, loadEssentialsBenefits());
    if (hit) return hit;
    return _matchBenefitsIn(name, loadIngredientsQuickref());
  }
  function _matchBenefitsIn(name, benefits) {
    // Pass E.1.1 matcher logic (parameterized in E.1.2 so it's reusable).
    // Token-subset + digit-base fallback handles form-suffixed keys:
    //   "VITAMIN D3"  → "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)" ✓
    //   "Vitamin D"   → same key ✓ (via base "d" matching base("d2")="d")
    //   "Vitamin K1"  → "Vitamin K (Menaquinone = K2)" ✓ (base "k" matches "k")
    //   "Vitamin B12" → "Vitamin B12 (Cobalamin)" ✓ (verbatim)
    //   "Ashwagandha" → "Ashwagandha" ✓ (single ≥3-char token, exact tokens)
    if (!benefits || !Object.keys(benefits).length) return null;
    const lower = (s) => String(s == null ? '' : s).toLowerCase().trim();
    const tokens = (s) => (lower(s).match(/[a-z0-9]+/g) || []);
    const baseTok = (t) => t.replace(/\d+$/, '');
    const qLower = lower(name);
    const qTokens = tokens(name);
    if (qTokens.length === 0) return null;
    const entries = Object.keys(benefits).map(k => ({
      full: k,
      lower: lower(k),
      tokens: tokens(k),
      value: benefits[k],
    }));
    // 1. Exact case-insensitive match against the full key.
    for (const e of entries) {
      if (e.lower === qLower) return e.value;
    }
    // 2. Token-subset match with digit-base fallback. Guard against trivial
    //    single-token queries (< 3 chars) to prevent over-matching.
    if (qTokens.length >= 2 || qTokens[0].length >= 3) {
      for (const e of entries) {
        const allMatch = qTokens.every(qt => {
          if (e.tokens.includes(qt)) return true;
          const qb = baseTok(qt);
          if (!qb) return false;
          return e.tokens.some(kt => baseTok(kt) === qb);
        });
        if (allMatch) return e.value;
      }
    }
    // 3. Last-resort paren-stripped equality (handles "Iron (Ferrous Fumarate)"
    //    → "Iron" where the query has parens the key doesn't).
    const strip = (s) => lower(s).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const qStripped = strip(name);
    if (qStripped) {
      for (const e of entries) {
        if (strip(e.full) === qStripped) return e.value;
      }
    }
    return null;
  }

  function showIngredientPopup(name) {
    // Pass E.1: Quick-reference UX using the curated essentials-benefits-data
    // (Wallach + Youngevity catalog-sourced benefit lists). The popup is now
    // an educational "what does this nutrient do" surface — light, scannable,
    // pills for each benefit. The Wallach corpus snippet path is removed from
    // the popup (data still lives in master DB for future power-user surfaces
    // like Tacitus' notebook). For non-essential ingredients (botanicals,
    // blend sub-ingredients), we fall back to lightweight metadata; future
    // passes can curate per-non-essential descriptions if useful.
    const info = getIngredientInfo(name);
    const benefits = findBenefitsForIngredient(name);
    function esc(s) {
      const d = document.createElement('div');
      d.textContent = String(s == null ? '' : s);
      return d.innerHTML;
    }
    let bodyHtml = '<div class="ingredient-popup-body">';
    // Category pill (always shown when we have one)
    if (info && info.cat) {
      const cat = info.cat.replace(/_/g, ' ');
      const catTitle = cat.charAt(0).toUpperCase() + cat.slice(1);
      bodyHtml += '<span class="ingredient-cat">' + esc(catTitle) + '</span>';
    }
    if (benefits && benefits.length) {
      // Primary path: benefits list as pills. Primary benefits (p===1) get
      // a small dot prefix to set them apart visually.
      bodyHtml += '<p class="ingredient-quote-lead">Quick reference — what this nutrient is known for:</p>';
      bodyHtml += '<div class="benefit-pills">';
      benefits.slice(0, 12).forEach(b => {
        const text = b && b.t ? b.t : String(b || '');
        const isPrimary = b && b.p === 1;
        const dot = isPrimary ? '<span class="star">●</span> ' : '';
        bodyHtml += '<span class="benefit-pill general">' + dot + esc(text) + '</span>';
      });
      bodyHtml += '</div>';
    } else if (info) {
      // Non-essential ingredient (botanical / blend sub-ingredient / etc.)
      // OR essential that's not in the benefits dataset for some reason.
      let txt = "No Youngevity quick-reference captured for this ingredient yet.";
      if (info.ip) txt += ' Found in ' + info.ip + ' Youngevity product' + (info.ip === 1 ? '' : 's') + '.';
      if (info.pb) txt += ' Appears as a sub-ingredient in ' + info.pb + ' proprietary blend' + (info.pb === 1 ? '' : 's') + '.';
      bodyHtml += '<div class="ingredient-no-quote">' + esc(txt) + '</div>';
    } else {
      bodyHtml += '<div class="ingredient-no-quote">Not yet in the master ingredients database. Could be a brand-specific blend name or something the catalog sweep hasn\'t captured yet.</div>';
    }
    // Quiet footer with aliases + product/blend counts
    if (info) {
      const extras = [];
      if (info.al && info.al.length) extras.push('Also known as: ' + info.al.join(', '));
      if (benefits && typeof info.ip === 'number' && info.ip > 0) extras.push('Found in ' + info.ip + ' Youngevity product' + (info.ip === 1 ? '' : 's') + '.');
      if (info.pb) extras.push('Sub-ingredient in ' + info.pb + ' blend' + (info.pb === 1 ? '' : 's') + '.');
      if (extras.length) {
        bodyHtml += '<p class="ingredient-footer">' + esc(extras.join(' ')) + '</p>';
      }
    }
    bodyHtml += '</div>';
    if (typeof showLcModal === 'function') {
      showLcModal({
        title: name || '(ingredient)',
        titleSev: 'info',
        icon: 'ℹ',
        bodyHtml: bodyHtml,
        confirmText: 'Close',
        cancelText: ''
      });
    } else {
      alert((name || 'Ingredient') + '\n\n(modal helper not available)');
    }
  }
  // Pass E.0.1 — delegated click handler at document level (defense in depth
  // alongside the per-card wiring in bindRegimenCardActions). Catches clicks
  // on .rg-ingredient-pill elements regardless of render-lifecycle timing.
  // Same pattern as the Label Check IIFE's benefit-pill delegation (Round 56).
  document.addEventListener('click', function(e) {
    if (!e.target || !e.target.closest) return;
    const pill = e.target.closest('.rg-ingredient-pill:not(.no-data)[data-ingredient-name]');
    if (!pill) return;
    e.preventDefault();
    e.stopPropagation();
    showIngredientPopup(pill.dataset.ingredientName);
  });

  function getItemGoalMatchesWithReasons(item) {
    // Returns {matches: [...], reasons: {goalKey: 'nutrient' | 'protein'}}
    const matches = [];
    const reasons = {};
    if (!item) return { matches, reasons };
    const nutrients = item.nutrients || [];
    const notes = ((item.notes || '') + ' ' + (item.category || '') + ' ' + (item.what_it_does || '')).toLowerCase();
    const meaningfulNutrients = nutrients.filter(isMeaningfulContribution);
    const meaningfulNames = meaningfulNutrients.map(n => (n.name || '').toLowerCase());
    // cognition + hormones_strength: nutrient-threshold match (Pass B.1)
    for (const goalKey of ['cognition', 'hormones_strength']) {
      const terms = USER_GOAL_NUTRIENTS[goalKey] || [];
      const hit = terms.some(term => {
        const t = term.toLowerCase();
        return meaningfulNames.some(n => n.includes(t));
      });
      if (hit) {
        matches.push(goalKey);
        reasons[goalKey] = 'nutrient';
      }
    }
    // Pass B.2: protein-ratio match for hormones_strength. Adds the goal if
    // not already matched via nutrient; if already matched via nutrient, the
    // 'nutrient' reason wins (it's the stronger signal).
    const proteinG = getItemProteinG(item);
    if (proteinG >= PROTEIN_STRENGTH_THRESHOLD_G) {
      if (!matches.includes('hormones_strength')) {
        matches.push('hormones_strength');
        reasons.hormones_strength = 'protein';
      }
      // else: nutrient reason stays (stronger signal than protein-only)
    }
    // longevity_anti_aging: meaningful >=3 essentials OR notes-hint
    const longevityHints = ['90 essential', '90 for life', 'longevity', 'foundational', 'hbsp', 'healthy body start pak', 'multivitamin', 'multimineral'];
    const hasLongevityNotes = longevityHints.some(h => notes.includes(h));
    if (meaningfulNutrients.length >= 3 || hasLongevityNotes) {
      matches.push('longevity_anti_aging');
      reasons.longevity_anti_aging = 'nutrient';
    }
    return { matches, reasons };
  }

  function getItemGoalMatches(item) {
    // Back-compat wrapper. Callers wanting reasons should use the With-Reasons variant.
    return getItemGoalMatchesWithReasons(item).matches;
  }

  function loadRgOverrides() { try { const r = lsRead(RG_OVERRIDES_KEY, {}); return (r && typeof r === "object" && !Array.isArray(r)) ? r : {}; } catch(e) { return {}; } }

  // Round 156 follow-up #9 — boot-time stale-override migration.
  // Walks rgOverrides_v1 once at page load and drops entries whose ID
  // doesn't correspond to any currently-canonical product. Catches:
  //   - Legacy `rec_*` prefix (pre-Round-134 ID scheme)
  //   - `stk_Beyond_Osteo_FX_Liquid` (replaced by stk_Beyond_Osteo_FX_Powder in v2.00)
  //   - Any future product rename/retirement
  // Migration is idempotent: re-running on an already-clean overrides map
  // is a no-op (no canonical IDs match the stale shape, so no deletions).
  // Goalrec_ IDs are preserved unconditionally — they're dynamic per goal
  // engine output and may be valid at any moment.
  // Round 157 / Eden — one-time user state reset migration.
  // When Eden ships, all old IDs become stale (stk_*, goalrec_*, rec_*).
  // Rather than translate, we wipe the user's regimen state to true clean
  // slate (user explicitly approved this). Guard flag in LS prevents
  // re-firing across reloads — once you've reset, you keep your new state.
  function migrateEdenFullReset() {
    const EDEN_RESET_FLAG_KEY = 'edenResetCompleted_v1';
    try {
      // Route through framework helpers (lsRead/lsRemove/lsWrite) — keys are
      // registered in LS_SCHEMAS so the framework layer accepts them.
      const flagVal = lsRead(EDEN_RESET_FLAG_KEY, '');
      if (flagVal === 'true') return;
      const wipeKeys = ['lcRegimen_v1', 'rgOverrides_v1', 'rgManualItems_v1',
                       'rgRemoved_v1', 'rgUserGoals_v1', 'rgOutcomes_v1',
                       'rgSaveSystem', 'lcRecentScans_v1', 'lcWishlist_v1'];
      let removed = 0;
      wipeKeys.forEach(k => {
        try { lsRemove(k); removed++; } catch(_) {}
      });
      lsWrite(EDEN_RESET_FLAG_KEY, 'true');
      console.info('[Eden full-reset] migration complete — wiped ' + removed +
                   ' LS key(s) for Eden clean slate. This runs once per browser.');
    } catch(e) {
      console.error('[Eden full-reset] failed:', e);
    }
  }
  function migrateRgOverrides() {
    try {
      const overrides = loadRgOverrides();
      const baseIds = new Set();
      (REGIMEN_BASE_DATA.supplements || []).forEach(b => { if (b && b.id) baseIds.add(b.id); });
      (REGIMEN_BASE_DATA.diet || []).forEach(b => { if (b && b.id) baseIds.add(b.id); });
      (REGIMEN_BASE_DATA.recommended || []).forEach(b => { if (b && b.id) baseIds.add(b.id); });
      const dropped = [];
      const kept = {};
      Object.keys(overrides).forEach(function(oid) {
        // Keep if matches a current canonical base ID.
        if (baseIds.has(oid)) { kept[oid] = overrides[oid]; return; }
        // Keep if it's a goal-engine ID (dynamic; valid only when engine
        // currently produces it, but we don't know that here without
        // querying every possible goal combination — conservative keep).
        if (oid.indexOf('goalrec_') === 0) { kept[oid] = overrides[oid]; return; }
        // Keep if it's a label-scanned item (Scanner path).
        if (oid.indexOf('lbl_') === 0) { kept[oid] = overrides[oid]; return; }
        // Drop everything else.
        dropped.push(oid);
      });
      if (dropped.length > 0) {
        try { lsWrite(RG_OVERRIDES_KEY, kept); } catch(e) {}
        console.info('[migrateRgOverrides] dropped ' + dropped.length + ' stale override(s): ' + dropped.join(', '));
      }
    } catch (e) {
      console.error('[migrateRgOverrides] failed:', e);
    }
  }
  // Fire Eden full-reset migration FIRST (idempotent via guard flag), then
  // the regular override-cleanup migration. Order matters — reset wipes
  // everything, so subsequent override cleanup is a no-op.
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        migrateEdenFullReset();
        migrateRgOverrides();
      });
    } else {
      setTimeout(function() {
        migrateEdenFullReset();
        migrateRgOverrides();
      }, 0);
    }
  }

  function saveRgOverride(id, patch) {
    // Round 150 §31 chokepoint — see persistRegimen for the discipline.
    const all = loadRgOverrides();
    all[id] = Object.assign(all[id] || {}, patch);
    try { lsWrite(RG_OVERRIDES_KEY, all); } catch(e) {}
    try { if (typeof window.triggerRegimenRerender === 'function') window.triggerRegimenRerender('saveRgOverride:' + id); } catch(_) {}
  }
  function loadRgManual() { try { const r = lsRead(RG_MANUAL_KEY, []); return Array.isArray(r) ? r : []; } catch(e) { return []; } }
  function saveRgManual(items) {
    // Round 150 §31 chokepoint — see persistRegimen for the discipline.
    try { lsWrite(RG_MANUAL_KEY, items); } catch(e) {}
    try { if (typeof window.triggerRegimenRerender === 'function') window.triggerRegimenRerender('saveRgManual'); } catch(_) {}
  }
  function loadRgRemoved() { try { const r = lsRead(RG_REMOVED_KEY, []); return new Set(Array.isArray(r) ? r : []); } catch(e) { return new Set(); } }
  function saveRgRemoved(set) {
    // Round 150 §31 chokepoint — see persistRegimen for the discipline.
    try { lsWrite(RG_REMOVED_KEY, [...set]); } catch(e) {}
    try { if (typeof window.triggerRegimenRerender === 'function') window.triggerRegimenRerender('saveRgRemoved'); } catch(_) {}
  }
  function loadRgOutcomes() { try { const r = lsRead(RG_OUTCOMES_KEY, {}); return (r && typeof r === "object" && !Array.isArray(r)) ? r : {}; } catch(e) { return {}; } }
  function saveRgOutcomes(map) { try { lsWrite(RG_OUTCOMES_KEY, map); } catch(e) {} }

  // Round 156 follow-up — User goal-picker LS chokepoint.
  // The thin abstraction `getCurrentGoals()` (Round 141) reads rgUserGoals_v1
  // first, falls back to the embedded user_stated_goals. The picker UI ships
  // here as the LS writer. Per Pattern D / §31 chokepoint discipline: writes
  // route through saveRgUserGoals() which fires triggerRegimenRerender so
  // every subscribed surface (regimen tab, slot stats, recommended-tab,
  // goal-picker itself) refreshes after a goal toggle.
  function loadRgUserGoals() {
    try { const r = lsRead(RG_USER_GOALS_KEY, null); return Array.isArray(r) ? r : null; } catch(e) { return null; }
  }
  function saveRgUserGoals(goalsArray) {
    // Round 150 §31 chokepoint — see persistRegimen for the discipline.
    const cleaned = Array.isArray(goalsArray) ? goalsArray.filter(g => typeof g === 'string' && g.length > 0) : [];
    try { lsWrite(RG_USER_GOALS_KEY, cleaned); } catch(e) {}
    try { if (typeof window.triggerRegimenRerender === 'function') window.triggerRegimenRerender('saveRgUserGoals'); } catch(_) {}
  }

  // ========================================================================
  // Round 141 — Goal-driven recommendations engine (the closed loop)
  // ========================================================================
  // See memory/essence/saga.md Round 141 entry for full context + rollback recipe.
  // Architectural commitment per Round 134/135 + §27/§28: when the user has ≥1
  // stated goal, query goal-to-products + product-pricing data → top-N by
  // cost-effectiveness across goals → overlay BASE_DATA.recommended at render
  // time (NOT by mutating BASE_DATA). When zero goals: fall back to HBSP 2.5
  // trio (the canonical default in REGIMEN_BASE_DATA.recommended).
  // Patterns consulted (per §27): Atomic safe_write (Round 73 §17), Cross-
  // boundary allowlist (Round 135 — getEffectiveRecommendedItems exposed via
  // window for cross-IIFE access by computeSlotStats etc.).
  // Inline-comment label (per §28): every function below tagged "Round 141".
  let _goalRecsCache = null;
  function _loadGoalRecsData() {
    if (_goalRecsCache !== null) return _goalRecsCache;
    try {
      const el = document.getElementById('goal-recommendations-data');
      if (!el) { _goalRecsCache = { goal_to_products: {}, product_pricing: {}, user_stated_goals: [] }; return _goalRecsCache; }
      _goalRecsCache = JSON.parse(el.textContent);
    } catch (e) {
      console.warn('[goal-recs] data parse failed', e);
      _goalRecsCache = { goal_to_products: {}, product_pricing: {}, user_stated_goals: [] };
    }
    return _goalRecsCache;
  }
  // Round 141 — getCurrentGoals: thin abstraction over user goals per Round 134
  // Round 134 named this as the structural concession for a future chat input;
  // for v1, returns the user_stated_goals from the embedded data block. Future
  // round adds a goal-picker UI + LS-backed storage; the function signature
  // stays the same.
  function getCurrentGoals() {
    try {
      const lsGoals = lsRead('rgUserGoals_v1', null);
      // Round 156 follow-up #7 — honor an EXPLICIT empty array as "user
      // wants no goals → HBSP fallback recommendations". Prior bug:
      // `length > 0` check fell through to the embedded user_stated_goals
      // when the user removed all their goal-picker selections, so the
      // recommendations stayed goal-driven instead of reverting to the
      // foundation HBSP trio. The LS write IS the user's intent; honor it.
      if (Array.isArray(lsGoals)) return lsGoals;
    } catch (e) { /* fall through to default */ }
    const data = _loadGoalRecsData();
    return Array.isArray(data.user_stated_goals) ? data.user_stated_goals.slice() : [];
  }
  // Round 141 → Round 156 follow-up — computeGoalDrivenRecommendations.
  // Algorithm (Round 156 follow-up — user-directed quality upgrade):
  //   1. For each user goal, get the goal's product list from goal-to-products.
  //   2. Look up each product in regimen-label-lookup for nutrient panel +
  //      classify into brand tier (mainline Youngevity vs sub-brand).
  //   3. Score = (meaningful_essentials_count * goal_count) / daily_cost.
  //      The breadth multiplier rewards multi-nutrient products over
  //      single-nutrient cheap products (user complaint: ProJoba Omega
  //      with just Omega-3 was ranking above Ultimate EFA Plus which has
  //      a fuller nutrient panel for slightly more $).
  //   4. Two-stage sort: tier 1 (mainline Youngevity) ALWAYS ranks above
  //      tier 2 (sub-brand). Within each tier, sort by score descending.
  //      Sub-brand products only fill slots after tier-1 is exhausted.
  //   5. Skip products already in the user's stack (deduplication).
  //   6. Return top-6 (was 3; user wanted broader recommendation set).
  //
  // Brand tier heuristic — exception-first then name-based pattern.
  //
  // Exceptions list: products that ALWAYS classify as tier 1 regardless of
  // whether they later match a sub-brand pattern. Two reasons (user-named
  // Round 156 follow-up #3, 2026-06-20):
  //   1. Specific sub-brand products that are well-curated and earn their
  //      place on the recommendation surface — e.g., ChiYo3 Energy (Goji
  //      Juice) for the energy goal.
  //   2. Pre-emptive insurance: if a future Cura/Vision pass correctly
  //      re-classifies a product as sub-brand based on accurate brand-
  //      ownership data (e.g., ReVERSE!® is actually Tai Wellness-made
  //      under a Wallach collab), the exception preserves the tier-1
  //      placement that the user has already endorsed.
  //
  // Add new exceptions here as the user names them.
  const _BRAND_TIER_EXCEPTIONS = new Set([
    'ReVERSE!®',                       // Tai Wellness brand, Wallach-endorsed collab
    'ChiYo3 Energy (Goji Juice)',      // sub-brand product, well-curated for energy goal
  ]);
  // Sub-brand patterns: name substring match triggers tier 2 unless the
  // exception list overrides. "Biometics" REMOVED 2026-06-20 — Biometics is
  // a YGY-owned brand line (the category text labels it "(YGY brand)"), so
  // all Biometics products are tier 1 by default. Within-brand quality
  // differences are handled by the breadth-weighted scoring below.
  function _inferBrandTier(name) {
    if (_BRAND_TIER_EXCEPTIONS.has(name)) return 1;
    const subBrandPatterns = [
      'ProJoba', 'Good Herbs', 'True2Life',
      'Tai Wellness', "Nature's Pearl", 'ChiYo3', 'Harmony Drops',
      'Sea Mineral', 'Sta-Natural'
    ];
    for (const p of subBrandPatterns) {
      if (name.indexOf(p) !== -1) return 2;
    }
    return 1;
  }

  function computeGoalDrivenRecommendations(goals, currentStackNames) {
    if (!goals || !goals.length) return null;
    const data = _loadGoalRecsData();
    const g2p = data.goal_to_products || {};
    const pricing = data.product_pricing || {};
    const labelDb = getRegimenLabelLookup() || {};
    const stackSet = currentStackNames instanceof Set ? currentStackNames : new Set(currentStackNames || []);
    const scores = {};  // name -> { name, goals, goal_count, category, tier, ... }
    for (const goal of goals) {
      const list = g2p[goal];
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        const name = entry.product;
        if (!name) continue;
        if (stackSet.has(name)) continue;
        if (!scores[name]) {
          // Look up the product's nutrient panel + count meaningful
          // essential contributions at 1 serving/day. Falls back to 0 if
          // the lookup or contribution helper isn't available (early
          // load-time race; doctrine §7 graceful degradation).
          const lookup = labelDb[name] || {};
          const nutrients = Array.isArray(lookup.nutrients) ? lookup.nutrients : [];
          let meaningfulCount = 0;
          try {
            if (typeof getItemEssentialContributions === 'function') {
              const synthetic = { nutrients: nutrients };
              const contribs = getItemEssentialContributions(synthetic);
              meaningfulCount = Array.isArray(contribs) ? contribs.length : 0;
            }
          } catch (_) {}
          scores[name] = {
            name: name,
            goals: [],
            goal_count: 0,
            category: entry.category || '',
            tagline: entry.tagline || '',
            nutrient_count: nutrients.length,
            meaningful_essentials_count: meaningfulCount,
            tier: _inferBrandTier(name)
          };
        }
        if (scores[name].goals.indexOf(goal) === -1) {
          scores[name].goals.push(goal);
          scores[name].goal_count += 1;
        }
      }
    }
    const ranked = [];
    for (const name of Object.keys(scores)) {
      const s = scores[name];
      const pp = pricing[name];
      if (!pp || !pp.daily_cost_at_1_serving) continue;
      s.daily_cost = pp.daily_cost_at_1_serving;
      s.servings_per_container = pp.servings_per_container;
      s.retail = pp.retail;
      // Breadth-weighted cost-effectiveness. Floor breadth at 1 so products
      // without lookup data (no nutrient panel yet) still rank somewhere
      // rather than score 0.
      const breadth = Math.max(1, s.meaningful_essentials_count);
      s.cost_effectiveness = (breadth * s.goal_count) / Math.max(s.daily_cost, 0.01);
      ranked.push(s);
    }
    // Two-stage sort: tier 1 (mainline) ALWAYS ranks above tier 2 (sub-brand).
    // Within each tier, sort by cost_effectiveness descending. Sub-brand
    // products fill remaining slots only after tier 1 is exhausted.
    ranked.sort(function(a, b) {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.cost_effectiveness - a.cost_effectiveness;
    });
    return ranked.slice(0, 6);
  }
  // Round 141 — buildGoalDrivenRecommendedItems: shape the engine's output into
  // the same item shape as REGIMEN_BASE_DATA.recommended entries so the rest of
  // the render pipeline (chips, Adopt button, computeSlotStats, etc.) works
  // without any changes. The synthetic items carry `source: 'goal_driven'` and
  // `_goalrec_meta` metadata for future UI surfaces (cost display, goal chips).
  function buildGoalDrivenRecommendedItems(currentStackNames) {
    const goals = getCurrentGoals();
    if (!goals || !goals.length) return null;
    const ranked = computeGoalDrivenRecommendations(goals, currentStackNames);
    if (!ranked || !ranked.length) return null;
    // Round 155 / Saturday Item 3 (Path B) — wire goal-engine items to the
    // products-db-derived regimen-label-lookup so synthetic items carry full
    // nutrient profiles. Round 141 shipped these as `nutrients: []` because
    // the engine output didn't carry the panel; Round 154 worked around the
    // empty array with the Adopt-modal `isGoalDriven` branch. With the
    // lookup wired, downstream consumers (computeSlotStats, periodic table,
    // lcScan verdict, essentials contribution count) all see real data —
    // and the Round 154 branch retires in the same patch.
    const labelDb = getRegimenLabelLookup() || {};
    return ranked.map(function(r) {
      const lookup = labelDb[r.name] || {};
      const hasNutrients = Array.isArray(lookup.nutrients) && lookup.nutrients.length > 0;
      // Round 156 — dose_text is the badge-driving field for missingFlags() at
      // line ~11776; an empty string fires "missing dose" on every card. Derive
      // from lookup.serving_size when present so adopted items render cleanly.
      // Round 156 — has_nutrient_data is the badge-driving field for the
      // "missing nutrient data" flag (line ~11777). Set true when the lookup
      // actually carried a nutrient panel; doctrine §1 (no silent passing-true).
      const doseText = lookup.serving_size
        ? (String(lookup.serving_size) + ' daily')
        : '';
      return {
        id: 'goalrec_' + r.name.replace(/[^a-zA-Z0-9]/g, '_'),
        name: r.name,
        kind: 'recommended',
        source: 'goal_driven',
        dose_text: doseText,
        notes: r.tagline || ('Recommended via goal coverage: ' + r.goals.join(', ')),
        actual_range: '',
        timing: '',
        category: r.category || lookup.category || '',
        what_it_does: r.tagline || lookup.what_it_does || '',
        // Real Youngevity-label data via the Round 75 Pass A connectivity
        // primitive — slice() to defensively copy so consumers can't mutate
        // the memoized lookup cache.
        nutrients: hasNutrients ? lookup.nutrients.slice() : [],
        non_essentials: Array.isArray(lookup.non_essentials_parsed) ? lookup.non_essentials_parsed.slice() : [],
        serving_size: lookup.serving_size || '',
        servings_per_container: (lookup.servings_per_container != null)
          ? lookup.servings_per_container : r.servings_per_container,
        features: Array.isArray(lookup.features) ? lookup.features.slice() : [],
        has_nutrient_data: hasNutrients,
        _goalrec_meta: {
          goals: r.goals.slice(),
          goal_count: r.goal_count,
          daily_cost: r.daily_cost,
          retail: r.retail,
          servings_per_container: r.servings_per_container,
          cost_effectiveness: r.cost_effectiveness,
          // Round 155 — track whether lookup connected; useful for diagnosing
          // any future product-name-mismatch issue between the goal engine
          // and the regimen-label-lookup keys.
          lookup_hit: hasNutrients
        }
      };
    });
  }
  // Round 157 / Eden — getEffectiveRecommendedItems: additive model.
  //
  // User's engineering loop (verbatim spirit):
  //   1. Default items only go away if you remove them (rgRemoved soft-delete)
  //   2. Choosing a goal ADDS more recommendations, doesn't replace HBSP
  //   3. Engine ensures at least 6 TOTAL recommendations
  //   4. AND ensures at least 3 representative items per chosen goal
  //   5. No upper limit (soft cap at 30 for sanity / runaway protection)
  //
  // Eden makes this clean: all items have stable EDEN-LOCKED-* IDs, dedup by
  // ID is straightforward, user-scanned/manual items live in a parallel
  // universe the engine never reads.
  //
  // The additive set:
  //   - BASE = HBSP trio (REGIMEN_BASE_DATA.recommended)
  //   - GOAL_DRIVEN = per-goal top candidates from buildGoalDrivenRecommendedItems
  //   - FILL = additional goal candidates added until floors are met
  function getEffectiveRecommendedItems(currentStackNames) {
    const TOTAL_FLOOR = 6;
    const PER_GOAL_FLOOR = 3;
    const SOFT_CAP = 30;

    // Layer 1: HBSP base (always included; rgRemoved filtering happens downstream)
    const base = (REGIMEN_BASE_DATA.recommended || []).slice();
    const seenIds = new Set(base.map(b => b && b.id).filter(Boolean));
    const out = base.slice();

    const goals = getCurrentGoals();
    if (goals && goals.length > 0) {
      // Layer 2: goal-driven candidates from engine. Dedup by ID against base.
      const goalDriven = buildGoalDrivenRecommendedItems(currentStackNames) || [];
      goalDriven.forEach(it => {
        if (it && it.id && !seenIds.has(it.id)) {
          seenIds.add(it.id);
          out.push(it);
        }
      });

      // Layer 3: per-goal fill. Compute coverage per goal; for any goal
      // with < PER_GOAL_FLOOR items, pull more candidates from that goal's
      // product list. Loop until floor met OR no more candidates available.
      const countForGoal = function(gkey) {
        let count = 0;
        out.forEach(it => {
          // Item "fits" a goal if its goals[] (engine output) includes it,
          // OR its _goalrec_meta.goals includes it, OR (for HBSP) it's
          // referenced from the Eden goal_to_products data.
          const itGoals = (it && it.goals) || (it && it._goalrec_meta && it._goalrec_meta.goals) || [];
          if (Array.isArray(itGoals) && itGoals.indexOf(gkey) !== -1) count++;
        });
        return count;
      };

      const data = _loadGoalRecsData();
      const g2p = data.goal_to_products || {};
      const pricing = data.product_pricing || {};
      const labelDb = getRegimenLabelLookup() || {};

      goals.forEach(gkey => {
        if (out.length >= SOFT_CAP) return;
        const products = g2p[gkey] || [];
        for (const entry of products) {
          if (out.length >= SOFT_CAP) break;
          if (countForGoal(gkey) >= PER_GOAL_FLOOR) break;
          const name = entry.product;
          if (!name) continue;
          // Dedup by Eden ID derived from the canonical product
          // (matches buildGoalDrivenRecommendedItems' ID derivation)
          const candidateId = 'goalrec_' + name.replace(/[^a-zA-Z0-9]/g, '_');
          if (seenIds.has(candidateId)) continue;
          // Skip if name is in currentStackNames (already in user's stack)
          const stackSet = currentStackNames instanceof Set ? currentStackNames : new Set(currentStackNames || []);
          if (stackSet.has(name)) continue;
          // Build candidate via the existing engine path so it has all the
          // structural metadata. Cheaper: synthesize directly from the data we have.
          const lookup = labelDb[name] || {};
          const pp = pricing[name] || {};
          const hasNutrients = Array.isArray(lookup.nutrients) && lookup.nutrients.length > 0;
          const synthItem = {
            id: candidateId,
            name: name,
            kind: 'recommended',
            source: 'goal_driven_fill',
            dose_text: lookup.serving_size ? (String(lookup.serving_size) + ' daily') : '',
            notes: entry.tagline || ('Recommended via per-goal floor: ' + gkey),
            actual_range: '',
            timing: '',
            category: lookup.category || entry.category || '',
            what_it_does: entry.tagline || lookup.what_it_does || '',
            nutrients: hasNutrients ? lookup.nutrients.slice() : [],
            non_essentials: Array.isArray(lookup.non_essentials_parsed) ? lookup.non_essentials_parsed.slice() : [],
            serving_size: lookup.serving_size || '',
            servings_per_container: lookup.servings_per_container,
            has_nutrient_data: hasNutrients,
            goals: [gkey],
            _goalrec_meta: {
              goals: [gkey],
              goal_count: 1,
              daily_cost: pp.daily_cost_at_1_serving,
              retail: pp.retail,
              servings_per_container: pp.servings_per_container,
              source: 'per_goal_fill'
            }
          };
          seenIds.add(candidateId);
          out.push(synthItem);
        }
      });
    }

    // Layer 4: total-floor fill. If total still < TOTAL_FLOOR and we have
    // goals, keep adding more candidates from any selected goal until floor
    // met OR exhausted. Goals processed in order; round-robin would be
    // overkill for this scope.
    if (goals && goals.length > 0 && out.length < TOTAL_FLOOR) {
      const data = _loadGoalRecsData();
      const g2p = data.goal_to_products || {};
      const pricing = data.product_pricing || {};
      const labelDb = getRegimenLabelLookup() || {};
      const stackSet = currentStackNames instanceof Set ? currentStackNames : new Set(currentStackNames || []);

      for (const gkey of goals) {
        if (out.length >= TOTAL_FLOOR || out.length >= SOFT_CAP) break;
        const products = g2p[gkey] || [];
        for (const entry of products) {
          if (out.length >= TOTAL_FLOOR || out.length >= SOFT_CAP) break;
          const name = entry.product;
          if (!name) continue;
          const candidateId = 'goalrec_' + name.replace(/[^a-zA-Z0-9]/g, '_');
          if (seenIds.has(candidateId)) continue;
          if (stackSet.has(name)) continue;
          const lookup = labelDb[name] || {};
          const pp = pricing[name] || {};
          const hasNutrients = Array.isArray(lookup.nutrients) && lookup.nutrients.length > 0;
          seenIds.add(candidateId);
          out.push({
            id: candidateId,
            name: name,
            kind: 'recommended',
            source: 'goal_driven_total_floor',
            dose_text: lookup.serving_size ? (String(lookup.serving_size) + ' daily') : '',
            notes: entry.tagline || ('Recommended via total-floor fill: ' + gkey),
            category: lookup.category || entry.category || '',
            what_it_does: entry.tagline || lookup.what_it_does || '',
            nutrients: hasNutrients ? lookup.nutrients.slice() : [],
            non_essentials: Array.isArray(lookup.non_essentials_parsed) ? lookup.non_essentials_parsed.slice() : [],
            serving_size: lookup.serving_size || '',
            servings_per_container: lookup.servings_per_container,
            has_nutrient_data: hasNutrients,
            goals: [gkey],
            _goalrec_meta: { goals: [gkey], goal_count: 1, daily_cost: pp.daily_cost_at_1_serving, source: 'total_floor_fill' }
          });
        }
      }
    }

    return out;
  }
  // Cross-IIFE exposure per Round 135 allowlist pattern (Pattern: Cross-boundary
  // allowlist + critical invariant). computeSlotStats and other surfaces in
  // OTHER IIFEs may need this; expose via window now to avoid the silent-
  // fallback failure family.
  if (typeof window !== 'undefined') {
    window.getCurrentGoals = getCurrentGoals;
    window.computeGoalDrivenRecommendations = computeGoalDrivenRecommendations;
    window.buildGoalDrivenRecommendedItems = buildGoalDrivenRecommendedItems;
    window.getEffectiveRecommendedItems = getEffectiveRecommendedItems;
    // Round 156 follow-up — getItemEssentialContributions is consumed by
    // computeSlotStats (Save System IIFE, line ~5429) via window.X but was
    // never exported. The typeof check at line 5425 silently fell back to
    // essentialsCovered = 0; live per-card pills worked (same IIFE call)
    // but slot card stats showed 0/92. User-visible regression caught
    // after the v1 Item 11 ship. Defines exposure here so the next reload
    // picks it up and slot stats accumulate per-item contributions.
    window.getItemEssentialContributions = getItemEssentialContributions;
  }

  function getUnifiedRegimenItems() {
    // Combine base data + label regimen + manual items + apply overrides + filter removed
    const overrides = loadRgOverrides();
    const manualItems = loadRgManual();
    const removed = loadRgRemoved();
    const labelReg = (function() {
      try { const r = lsRead(REGIMEN_KEY, { items: [] }); return r.items; }
      catch(e) { return []; }
    })();
    const items = [];
    // Round 141 — compute the effective recommended set BEFORE building the
    // base-item spread. Goal-driven recommendations overlay the HBSP trio at
    // render time per Round 134/135 architectural commitment (NOT by mutating
    // BASE_DATA). We pre-compute the stack name set from existing supplements
    // + diet so the engine can deduplicate (avoid recommending products the
    // user already has).
    const _stackNamesForRec = new Set();
    [...REGIMEN_BASE_DATA.supplements, ...REGIMEN_BASE_DATA.diet].forEach(function(b) {
      if (b && b.name) _stackNamesForRec.add(b.name);
    });
    try {
      const r = lsRead(REGIMEN_KEY, { items: [] });
      (r.items || []).forEach(function(it) {
        const n = (it && it.label && it.label.name) || (it && it.name);
        if (n) _stackNamesForRec.add(n);
      });
    } catch (e) { /* defensive */ }
    manualItems.forEach(function(it) {
      const n = (it && it.label && it.label.name) || (it && it.name);
      if (n) _stackNamesForRec.add(n);
    });
    const _effectiveRecommended = (typeof getEffectiveRecommendedItems === 'function')
      ? getEffectiveRecommendedItems(_stackNamesForRec)
      : (REGIMEN_BASE_DATA.recommended || []);
    // Base items
    const _seenIds = new Set();
    [...REGIMEN_BASE_DATA.supplements, ...REGIMEN_BASE_DATA.diet, ..._effectiveRecommended].forEach(b => {
      const merged = Object.assign({}, b, overrides[b.id] || {});
      merged._removed = removed.has(b.id);
      items.push(merged);
      if (b && b.id) _seenIds.add(b.id);
    });
    // Round 156 follow-up #5 + #9 — orphan-adopted reconciliation. Reconstruct
    // an adopted item from its snapshot when the engine no longer surfaces it.
    // Round 156 follow-up #9 — gate on `kind === 'supplement'` so UNADOPTED
    // items don't zombify forever. Prior bug: Unadopt set kind back to
    // 'recommended' but left _adopted_snapshot in place; this loop then
    // resurrected every unadopted item with snapshot as a "GOAL DRIVEN"
    // recommendation, even when the engine wasn't producing them (no goals).
    Object.keys(overrides).forEach(function(oid) {
      if (_seenIds.has(oid)) return;
      const ov = overrides[oid];
      if (!ov || !ov._adopted_snapshot) return;
      if (ov.kind !== 'supplement') return;  // only actively adopted items
      if (removed.has(oid)) return;
      const reconstructed = Object.assign({}, ov._adopted_snapshot, ov);
      reconstructed.id = oid;
      reconstructed._removed = false;
      items.push(reconstructed);
    });
    // Label Check regimen items
    const wishlistItems = (function() {
      try { return (lsRead(WISHLIST_KEY, { items: [] })).items; }
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
        // Stage A (Round 99): surface label.servings as scaling_factor so
        // computeLiveCoverage (Periodic Table) correctly scales lcRegimen items
        // by daily servings — fixes pre-existing undercount where scaling_factor
        // was absent on Label Check items and defaulted to 1.
        scaling_factor: parseFloat(r.label?.servings) || 1,
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
    // Round 156 follow-up #8 — fall back to nutrients[] presence when
    // has_nutrient_data field isn't explicitly set. The HBSP trio in
    // REGIMEN_BASE_DATA has populated nutrients[] but no has_nutrient_data
    // flag, so the badge fired even though the data was present. Treat a
    // non-empty nutrients array as the authoritative signal.
    const hasNutData = item.has_nutrient_data || (Array.isArray(item.nutrients) && item.nutrients.length > 0);
    if (!hasNutData && item.kind !== 'lifestyle' && item.kind !== 'other') flags.push('missing nutrient data');
    if (!item.notes) flags.push('no notes');
    return flags;
  }

  function sourceTagClass(source) {
    if (source === 'label-scan') return 'rg-tag-label';
    if (source === 'manual') return 'rg-tag-manual';
    return 'rg-tag-chat';
  }

  // Round 156 follow-up — Goal Picker (v1). Renders the user-selectable goals
  // grid. Categories grouped for visual clarity; all visible (no expand/collapse
  // per user direction). Tap-to-toggle wires through saveRgUserGoals chokepoint
  // which fires triggerRegimenRerender → cascade re-renders this surface PLUS
  // the regimen tab + slot stats + wishlist. v2 polish + Plan C energy split
  // (energy_metabolism → energy_deficiencies + energy_boost + Wallach corpus
  // education content) ship in the next session per user-confirmed sequencing.
  const GOAL_CATEGORIES = [
    {
      id: 'foundation',
      label: 'Foundation',
      goals: [
        { key: 'essential_baseline', symbol: '◆', name: 'Essential Baseline' }
      ]
    },
    {
      id: 'mind_energy',
      label: 'Mind & Energy',
      goals: [
        { key: 'cognition', symbol: '◍', name: 'Cognition' },
        { key: 'energy_metabolism', symbol: '⚡', name: 'Energy' },
        { key: 'sleep_stress', symbol: '☾', name: 'Sleep & Stress' },
        { key: 'thyroid_endocrine', symbol: 'T', name: 'Thyroid' }
      ]
    },
    {
      id: 'structure',
      label: 'Structure',
      goals: [
        { key: 'bone_skeletal', symbol: '⊞', name: 'Bone & Skeletal' },
        { key: 'joints_collagen', symbol: '⊙', name: 'Joints & Collagen' },
        { key: 'skin_hair_nails', symbol: '✦', name: 'Skin, Hair & Nails' }
      ]
    },
    {
      id: 'internal',
      label: 'Internal Health',
      goals: [
        { key: 'cardiovascular', symbol: '♥', name: 'Cardiovascular' },
        { key: 'gut_digestion', symbol: '◯', name: 'Gut & Digestion' },
        { key: 'immunity', symbol: '✚', name: 'Immunity' },
        { key: 'detox_cleanse', symbol: '↻', name: 'Detox & Cleanse' },
        { key: 'blood_sugar', symbol: '◐', name: 'Blood Sugar' }
      ]
    },
    {
      id: 'hormonal',
      label: 'Hormones',
      goals: [
        { key: 'hormones_strength', symbol: '⚏', name: 'Hormones & Strength' },
        { key: 'prostate_urinary', symbol: '▽', name: 'Prostate & Urinary' }
      ]
    },
    {
      id: 'longevity_vision',
      label: 'Longevity & Vision',
      goals: [
        { key: 'weight_management', symbol: '⚖', name: 'Weight Management' },
        { key: 'longevity_anti_aging', symbol: '∞', name: 'Longevity & Anti-aging' },
        { key: 'eye_vision', symbol: '◎', name: 'Eye & Vision' }
      ]
    }
  ];

  function renderGoalPicker() {
    const host = document.getElementById('rg-goals-grid');
    if (!host) return;
    // Only count LS-stored goals as "selected" — the embedded fallback
    // (user_stated_goals from memory/user-goals.md) drives the engine's
    // default behavior but doesn't represent user picks in this UI. Otherwise
    // a fresh user would see 3 pre-selected pills they never clicked.
    const lsGoals = (typeof window.loadRgUserGoals === 'function') ? window.loadRgUserGoals() : null;
    const selected = new Set(Array.isArray(lsGoals) ? lsGoals : []);
    const parts = [];
    for (const cat of GOAL_CATEGORIES) {
      parts.push(
        '<div class="rg-goals-cat" data-cat="' + cat.id + '">' +
          '<div class="rg-goals-cat-label">' + escapeHtml(cat.label) + '</div>' +
          '<div class="rg-goals-cat-pills">'
      );
      for (const g of cat.goals) {
        const isSel = selected.has(g.key);
        parts.push(
          '<button type="button" class="rg-goal-pill' + (isSel ? ' is-selected' : '') + '"' +
            ' data-goal-key="' + escapeHtml(g.key) + '"' +
            ' aria-pressed="' + (isSel ? 'true' : 'false') + '"' +
            ' title="' + escapeHtml(g.name) + '">' +
            '<span class="rg-goal-pill-symbol" aria-hidden="true">' + escapeHtml(g.symbol) + '</span>' +
            '<span class="rg-goal-pill-name">' + escapeHtml(g.name) + '</span>' +
          '</button>'
        );
      }
      parts.push('</div></div>');
    }
    host.innerHTML = parts.join('');
    const counter = document.getElementById('rg-goals-counter');
    if (counter) counter.textContent = selected.size + ' selected';
    const empty = document.getElementById('rg-goals-empty');
    if (empty) empty.hidden = selected.size > 0;
    // Attach click handlers (no delegation — small set, direct handler is cheap).
    const buttons = host.querySelectorAll('.rg-goal-pill');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function() {
        const key = this.getAttribute('data-goal-key');
        if (!key) return;
        const lsNow = (typeof window.loadRgUserGoals === 'function') ? (window.loadRgUserGoals() || []) : [];
        const set = new Set(lsNow);
        if (set.has(key)) set.delete(key); else set.add(key);
        if (typeof window.saveRgUserGoals === 'function') {
          window.saveRgUserGoals(Array.from(set));
        }
        // The chokepoint fires triggerRegimenRerender → renderGoalPicker
        // re-runs via the cascade. No manual re-render here.
      };
    }
  }

  // Expose for cross-IIFE consumers. saveRgUserGoals + loadRgUserGoals power
  // any future cross-tab consumer that needs to read/write user goals; the
  // engine in the Save System IIFE already uses getCurrentGoals (which reads
  // rgUserGoals_v1 LS directly via lsRead), but explicit exposure here keeps
  // the chokepoint discipline parallel to the other §31 helpers.
  if (typeof window !== 'undefined') {
    window.renderGoalPicker = renderGoalPicker;
    window.saveRgUserGoals = saveRgUserGoals;
    window.loadRgUserGoals = loadRgUserGoals;
  }

  // Round 158 — preserves expanded card IDs + scroll position + focused field
  // across a renderRegimenTab call. Wraps renderRegimenTab and restores state
  // after the rebuild. Use this for in-card dose-input changes so the user can
  // keep clicking without the page scrolling back to top or the card collapsing.
  function renderRegimenTabPreservingState() {
    const expandedIds = new Set();
    try {
      document.querySelectorAll('#rg-grouped-container .rg-card.expanded').forEach(el => {
        if (el.dataset && el.dataset.id) expandedIds.add(el.dataset.id);
      });
    } catch (_) {}
    const scrollY = window.scrollY || window.pageYOffset || 0;
    let focusInfo = null;
    try {
      const active = document.activeElement;
      if (active && active.classList && active.dataset && active.dataset.cardId) {
        const cls = ['rg-card-dose', 'rg-card-times', 'rg-ed-name', 'rg-ed-notes']
          .find(c => active.classList.contains(c));
        if (cls) {
          focusInfo = { cardId: active.dataset.cardId, cls,
            selStart: active.selectionStart, selEnd: active.selectionEnd };
        }
      }
    } catch (_) {}
    renderRegimenTab();
    try {
      expandedIds.forEach(id => {
        const sel = '#rg-grouped-container .rg-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id.replace(/"/g, '\\"')) + '"]';
        const card = document.querySelector(sel);
        if (card) card.classList.add('expanded');
      });
    } catch (_) {}
    try { window.scrollTo(0, scrollY); } catch (_) {}
    if (focusInfo) {
      try {
        const sel = '#rg-grouped-container .rg-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(focusInfo.cardId) : focusInfo.cardId.replace(/"/g, '\\"')) + '"]';
        const card = document.querySelector(sel);
        if (card) {
          const target = card.querySelector('.' + focusInfo.cls);
          if (target) {
            target.focus();
            if (target.setSelectionRange && focusInfo.selStart != null) {
              try { target.setSelectionRange(focusInfo.selStart, focusInfo.selEnd); } catch (_) {}
            }
          }
        }
      } catch (_) {}
    }
  }

  function renderRegimenTab() {
    // Round 156 follow-up — render the goal picker first; same-IIFE call, no
    // cross-IIFE indirection needed. Subsequent re-renders fire via the §31
    // cascade in Save System IIFE.
    try { renderGoalPicker(); } catch(e) { console.error('[renderRegimenTab] renderGoalPicker failed', e); }
    const container = $('rg-grouped-container');
    if (!container) return;
    const items = getUnifiedRegimenItems().filter(it => {
      // Round 135 — Issue 3: removed items disappear from regimen view entirely.
      // Data preserved in rgRemoved_v1; future recovery surface can re-render them.
      if (it._removed) return false;
      // Round 135 — Issue 1: 'recommended' kind items appear ONLY in their dedicated tab.
      // Until Adopt promotes them to kind:'supplement', they don't pollute All/Supplements/Diet.
      if (rgFilter === 'all') return it.kind !== 'recommended';
      if (rgFilter === 'supplement') return it.kind === 'supplement';
      if (rgFilter === 'diet') return it.kind === 'diet';
      if (rgFilter === 'label') return it.kind === 'label';
      if (rgFilter === 'recommended') return it.kind === 'recommended';
      return it.kind !== 'recommended';
    });
    if (!items.length) {
      // Round 135 — Recommended-tab Restore Defaults affordance.
      // When the user has removed one or more default recommendations (HBSP 2.5
      // trio: BTT 2.5, Beyond Osteo FX Liquid, Ultimate EFA Plus) AND the
      // current view is empty, surface a button to bring them back. Cheap
      // safety net for the "deleted everything, need to start over" case.
      let emptyHTML = '<div class="rg-empty">No items match this filter.';
      if (rgFilter === 'recommended') {
        // Round 158 v3 — restore-button detection rewritten to read HBSP IDs
        // dynamically from REGIMEN_BASE_DATA.recommended (no more hardcoded
        // stk_* prefix — those legacy IDs don't exist after Eden migration;
        // HBSP IDs are now EDEN-LOCKED-* and the static allowlist missed them
        // entirely, which was the "restore button never appears" bug).
        // Also detects HBSP that has been ADOPTED (kind=supplement override)
        // — adopted-HBSP doesn't sit in rgRemoved but it IS missing from
        // Recommended, so the empty state needs to offer a restore path.
        const hbspIds = (Array.isArray(REGIMEN_BASE_DATA.recommended) ? REGIMEN_BASE_DATA.recommended : [])
          .map(b => b && b.id).filter(Boolean);
        const removed = loadRgRemoved();
        const overrides = loadRgOverrides();
        // (a) HBSP IDs that were soft-removed
        const removedHbsp = hbspIds.filter(id => removed.has(id));
        // (b) HBSP IDs that were Adopted (kind override moves them to supplement)
        const adoptedHbsp = hbspIds.filter(id => {
          const ov = overrides[id];
          return ov && ov.kind && ov.kind !== 'recommended';
        });
        // (c) Any non-HBSP recommendation in rgRemoved (legacy stk_* or goalrec_*)
        const removedOther = [...removed].filter(id =>
          typeof id === 'string' && !hbspIds.includes(id) &&
          (id.indexOf('goalrec_') === 0 || id.indexOf('stk_') === 0)
        );
        const totalMissing = removedHbsp.length + adoptedHbsp.length + removedOther.length;
        if (totalMissing > 0) {
          const restoreIds = [...new Set([...removedHbsp, ...adoptedHbsp, ...removedOther])];
          const allHbsp = (removedOther.length === 0);
          const hasAdopted = adoptedHbsp.length > 0;
          const label = allHbsp
            ? (hasAdopted ? 'Restore HBSP defaults to Recommended' : 'Restore default recommendations')
            : 'Restore removed recommendations';
          const subtext = allHbsp
            ? 'HBSP 2.5: BTT 2.5 Canister + Beyond Osteo FX Powder + Ultimate EFA Plus'
              + (hasAdopted ? ' — they were Adopted; restore moves them back to Recommended' : '')
            : totalMissing + ' item(s) missing — restore to see them again';
          emptyHTML += '<br><br><button type="button" class="rg-restore-defaults-btn" data-restore-ids="' + escapeHtml(restoreIds.join(',')) + '" style="padding:10px 22px;border:1px solid var(--teal-deep);background:var(--teal-deep);color:white;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,0.06);">' + escapeHtml(label) + '</button>';
          emptyHTML += '<div style="margin-top:8px;font-size:12px;color:var(--ink-mute);">' + escapeHtml(subtext) + '</div>';
        }
      }
      emptyHTML += '</div>';
      container.innerHTML = emptyHTML;
      const restoreBtn = container.querySelector('.rg-restore-defaults-btn');
      if (restoreBtn) {
        restoreBtn.onclick = () => {
          // Round 158 v3 — Restore now handles both removed AND adopted HBSP.
          //   (a) Removed (rgRemoved): delete the entry to bring them back.
          //   (b) Adopted (kind override → supplement): clear the kind/
          //       _adopted_at/_adopted_snapshot override so they return to
          //       Recommended exactly like the Unadopt path.
          // Goals are NOT auto-cleared here — that was Round 156's behavior
          // and it's surprising when the user only wants HBSP back. If they
          // want clean-slate, they can remove goals separately.
          const idsAttr = restoreBtn.getAttribute('data-restore-ids') || '';
          const fallbackHbsp = (Array.isArray(REGIMEN_BASE_DATA.recommended) ? REGIMEN_BASE_DATA.recommended : [])
            .map(b => b && b.id).filter(Boolean);
          const ids = idsAttr ? idsAttr.split(',').filter(Boolean) : fallbackHbsp;
          const removed = loadRgRemoved();
          const overrides = loadRgOverrides();
          ids.forEach(id => {
            removed.delete(id);
            // If an override forces kind!=recommended for this ID, neutralize it
            const ov = overrides[id];
            if (ov && ov.kind && ov.kind !== 'recommended') {
              saveRgOverride(id, { kind: 'recommended', _adopted_at: null, _adopted_snapshot: null });
            }
          });
          saveRgRemoved(removed);
          renderRegimenTab();
        };
      }
      return;
    }
    // Compute goal-matches once per item; reused by both grouping modes
    // (groupBy=goal needs it for placement, groupBy=kind needs it for chips).
    // Pass B.2: also stash match-reasons so the chip renderer can distinguish
    // nutrient-threshold matches from protein-based matches visually.
    items.forEach(it => {
      const r = getItemGoalMatchesWithReasons(it);
      it._goalMatches = r.matches;
      it._goalMatchReasons = r.reasons;
    });
    // Pass C.1: sort once before grouping; the grouped views inherit the order.
    // _covCount is memoized on each item by rgSortItems so subsequent renders
    // (filter / groupBy / sortBy switches) reuse the computation.
    const sortedItems = rgSortItems(items);
    if (rgGroupBy === 'goal') {
      renderRegimenByGoal(container, sortedItems);
    } else {
      renderRegimenByKind(container, sortedItems);
    }
    bindRegimenCardActions();
  }

  function renderRegimenByKind(container, items) {
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
      grouped[k].forEach(it => { html.push(renderRegimenCard(it, k)); });
      html.push('  </div></div>');
    });
    container.innerHTML = html.join('');
  }

  function renderRegimenByGoal(container, items) {
    // Pass B: bucket items by which user-stated goals they serve. Items matching
    // multiple goals appear in EACH goal section (intentional — the user wants
    // to see "what's serving this goal" answerable per-goal). Items matching no
    // goal land in the "Not goal-tagged" tail section.
    const buckets = {};
    const noGoalBucket = [];
    RG_GOAL_ORDER.forEach(g => { buckets[g] = []; });
    items.forEach(it => {
      const matches = it._goalMatches || [];
      if (!matches.length) {
        noGoalBucket.push(it);
        return;
      }
      matches.forEach(g => {
        if (buckets[g]) buckets[g].push(it);
      });
    });
    const html = [];
    RG_GOAL_ORDER.forEach(g => {
      const bucket = buckets[g];
      if (!bucket || !bucket.length) {
        // Empty-goal-section placeholder so the user sees "this goal has nothing in your stack yet"
        html.push('<div class="rg-group">');
        html.push('  <div class="rg-group-header"><h3 class="rg-group-title">' + escapeHtml(RG_GOAL_LABELS[g] || g) + '</h3><span class="rg-group-count">0</span></div>');
        html.push('  <div class="rg-empty" style="padding:14px;color:var(--ink-mute);font-style:italic;font-size:13px;">Nothing in your stack currently maps to this goal. Either add a relevant supplement or check the Recommended tab.</div>');
        html.push('</div>');
        return;
      }
      html.push('<div class="rg-group">');
      html.push('  <div class="rg-group-header"><h3 class="rg-group-title">' + escapeHtml(RG_GOAL_LABELS[g] || g) + '</h3><span class="rg-group-count">' + bucket.length + '</span></div>');
      html.push('  <div class="rg-cards-grid">');
      bucket.forEach(it => { html.push(renderRegimenCard(it, 'goal:' + g)); });
      html.push('  </div></div>');
    });
    if (noGoalBucket.length) {
      html.push('<div class="rg-group">');
      html.push('  <div class="rg-group-header"><h3 class="rg-group-title">Not goal-tagged</h3><span class="rg-group-count">' + noGoalBucket.length + '</span></div>');
      html.push('  <p style="font-size:12px;color:var(--ink-mute);font-style:italic;margin:0 0 10px;">These items don\'t match any of your stated goals via the substring heuristic. They may still be supporting general health — add an explicit note in their card to surface intent.</p>');
      html.push('  <div class="rg-cards-grid">');
      noGoalBucket.forEach(it => { html.push(renderRegimenCard(it, 'goal:none')); });
      html.push('  </div></div>');
    }
    container.innerHTML = html.join('');
  }

  function renderRegimenCard(item, currentSection) {
    const flags = missingFlags(item);
    // Round 135 — source pill routes through displayName so raw keys
    // (e.g. 'wallach_hbsp_default') never surface to the UI.
    const sourceKey = item.source || 'chat';
    const sourceLabel = (typeof window.displayName === 'function')
      ? window.displayName(sourceKey, window.SOURCE_DISPLAY_NAMES)
      : sourceKey;
    const tagsHtml = '<span class="rg-tag ' + sourceTagClass(sourceKey) + '">' + escapeHtml(sourceLabel) + '</span>' +
                     flags.map(f => '<span class="rg-tag rg-tag-missing">' + escapeHtml(f) + '</span>').join('') +
                     (item._removed ? '<span class="rg-tag rg-tag-removed">removed</span>' : '');
    const notesHtml = item.notes ? '<div class="rg-notes">' + escapeHtml(item.notes) + '</div>' : '';
    const outcomes = loadRgOutcomes()[item.id] || [];
    // Pass B: goal-chip cluster. Always rendered (even in kind-mode) so users see
    // which goals each item serves at a glance. In goal-mode, the chip matching
    // the current section is rendered with the 'primary' style to show "this is
    // why this item is in this section."
    // Pass B/B.2: surface goal-match chips with reason-aware styling. nutrient-
    // threshold matches use the standard teal chip; protein-based matches use a
    // distinct amber/dashed style with a tooltip caveat explaining the bio-
    // availability limit + the "auto-promotes once Wallach corpus data on
    // strength foods is denser" framing per user direction.
    if (!item._goalMatches && typeof getItemGoalMatchesWithReasons === 'function') {
      const r = getItemGoalMatchesWithReasons(item);
      item._goalMatches = r.matches;
      item._goalMatchReasons = r.reasons;
    }
    const goalMatches = item._goalMatches || [];
    const goalReasons = item._goalMatchReasons || {};
    let goalChipsHtml = '';
    if (goalMatches.length) {
      const currentGoal = (currentSection || '').startsWith('goal:') ? currentSection.slice(5) : null;
      goalChipsHtml = '<div class="rg-goal-chips">' + goalMatches.map(g => {
        const reason = goalReasons[g] || 'nutrient';
        const classes = ['rg-goal-chip'];
        if (g === currentGoal) classes.push('primary');
        if (reason === 'protein') classes.push('protein-based');
        // Pass B.2 follow-up: for the protein-based hormones_strength chip,
        // the "Strength" narrative is more honest about why the chip fired
        // (protein → strength, not protein → hormone balance). The nutrient
        // variant keeps "Hormones" because Zn/Boron/Mg matches are as much
        // about hormone balance as strength per se.
        let label;
        if (reason === 'protein' && g === 'hormones_strength') {
          label = 'Strength';
        } else {
          // Round 135 — route through GOAL_DISPLAY_NAMES (canonical-19) + humanize fallback.
          // RG_GOAL_LABELS is now empty by default until goal-picker UI ships;
          // GOAL_DISPLAY_NAMES is the cross-IIFE canonical map. humanizeKey is
          // the absolute last resort so raw keys never reach the user.
          const goalFull = (RG_GOAL_LABELS[g])
            || (typeof window.GOAL_DISPLAY_NAMES !== 'undefined' && window.GOAL_DISPLAY_NAMES[g])
            || (typeof window.humanizeKey === 'function' ? window.humanizeKey(g) : g);
          label = goalFull.split(' /')[0];
        }
        const labelText = (reason === 'protein') ? (label + ' (via protein)') : label;
        const goalTooltipBase = (RG_GOAL_LABELS[g])
          || (typeof window.GOAL_DISPLAY_NAMES !== 'undefined' && window.GOAL_DISPLAY_NAMES[g])
          || (typeof window.humanizeKey === 'function' ? window.humanizeKey(g) : g);
        const tooltip = (reason === 'protein')
          ? 'Strength match via high protein per serving (>=5g/day-scaled). NOT yet Wallach-aligned via specific nutrients — the framework on strength-specific foods is still being indexed. Once corpus coverage on strength foods is denser, items will auto-promote to full nutrient-threshold match. Bio-availability + protein-quality differentiation deferred for now.'
          : goalTooltipBase;
        return '<span class="' + classes.join(' ') + '" title="' + escapeHtml(tooltip) + '">' + escapeHtml(labelText) + '</span>';
      }).join('') + '</div>';
    }
    return '<div class="rg-card' + (item._removed ? ' removed' : '') + '" data-id="' + escapeHtml(item.id) + '">' +
      '  <h3 class="rg-name">' + escapeHtml(item.name) + '</h3>' +
      '  <span class="rg-dose">' + escapeHtml(item.dose_text || 'no dose set') + '</span>' +
      (item.category ? '  <p class="rg-meta">' + escapeHtml(item.category) + '</p>' : '') +
      goalChipsHtml +
      (function() {
        // Pass C: coverage strip — which of the 92 essentials this item
        // meaningfully contributes to + how much. Clicking a cell routes to
        // the Periodic Table tile for that essential (inter-connectivity).
        const contributions = (typeof getItemEssentialContributions === 'function')
          ? getItemEssentialContributions(item) : [];
        const hasBlend = (typeof itemHasBlendBonus === 'function') ? itemHasBlendBonus(item) : false;
        if (!contributions.length && !hasBlend) return '';
        const shown = contributions.slice(0, RG_COV_MAX_CELLS);
        const overflow = contributions.length - shown.length;
        const cells = shown.map(c => {
          const pctRounded = Math.round(c.pct);
          const tooltip = c.name + ' — ' + pctRounded + '% of Wallach low target ('
            + (Math.round(c.amountMg * 1000) / 1000) + ' / ' + (Math.round(c.targetMg * 1000) / 1000)
            + ' mg). Click to open this essential\'s tile in the Periodic Table.';
          return '<span class="rg-cov-cell ' + c.tier + '" '
            + 'data-essential-name="' + escapeHtml(c.name) + '" '
            + 'title="' + escapeHtml(tooltip) + '">' + escapeHtml(c.symbol) + '</span>';
        }).join('');
        const overflowHtml = overflow > 0
          ? '<span class="rg-cov-overflow">+ ' + overflow + ' more</span>'
          : '';
        const blendHtml = hasBlend
          ? '<span class="rg-cov-blend" title="This item also contains proprietary blends with sub-ingredients we can\'t quantify per-nutrient. Likely contributes additional essentials beyond what\'s shown above.">+ blends ✨</span>'
          : '';
        return '<div class="rg-coverage-strip">' +
               '<span class="rg-coverage-strip-label">Contributes to:</span>' +
               cells + overflowHtml + blendHtml +
               '</div>';
      })() +
      '  <div class="rg-tags">' + tagsHtml + '</div>' +
      notesHtml +
      // Round 158 — inline Dose + Per Day on the card itself (modifiable directly
      // without opening Details). Lives above the action row so the primary dosing
      // signal is visible at-a-glance. Persists on `change` (blur or Enter) and
      // re-renders preserving expansion + scroll. Input validation: number-only,
      // min=0, max=20 (sanity cap), decimals typeable.
      (function() {
        const da = (item.dose_amount != null && isFinite(parseFloat(item.dose_amount))) ? parseFloat(item.dose_amount) : 1;
        const tp = (item.times_per_day != null && isFinite(parseFloat(item.times_per_day))) ? parseFloat(item.times_per_day) : 1;
        return '  <div class="rg-card-dose-row" title="Dose × per-day drives scaling for nutrient math (Periodic Table, slot stats, per-card essentials).">' +
          '    <label class="rg-card-dose-label">Dose <input type="number" class="rg-card-dose" min="0" max="20" step="1" value="' + escapeHtml(String(da)) + '" data-card-id="' + escapeHtml(item.id) + '"></label>' +
          '    <label class="rg-card-dose-label">Per Day <input type="number" class="rg-card-times" min="0" max="20" step="1" value="' + escapeHtml(String(tp)) + '" data-card-id="' + escapeHtml(item.id) + '"></label>' +
          '    <span class="rg-card-dose-eff" title="Effective daily multiplier = Dose × Per Day. Drives scaling_factor.">= <strong>' + (da * tp).toFixed(2).replace(/\.?0+$/, '') + '</strong>/day</span>' +
          '  </div>';
      })() +
      // Round 158 v2 — two primary buttons per card, sized for thumb-friendly
      // interaction. Recommended: [Details] [Add to Regimen]. Supplement (or
      // other modifiable kinds): [Details] [Remove]. Recommended items have no
      // Remove (deletion is goal-controlled, not user-controlled).
      '  <div class="rg-actions">' +
      '    <button class="rg-toggle-expand rg-btn-primary">Details</button>' +
      (item.kind === 'recommended'
        ? '    <button class="rg-adopt rg-btn-primary" title="Add this item to your active regimen. Dose / Per Day values above seed the initial scaling.">Add to Regimen</button>'
        : (item.kind === 'supplement' || item.kind === 'label' || item.kind === 'diet' || item.kind === 'other' || item.kind === 'lifestyle'
            ? '    <button class="rg-remove rg-btn-primary' + (item._removed ? ' rg-restore' : '') + '">' + (item._removed ? 'Restore' : 'Remove') + '</button>'
            : '')) +
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
    // Round 158 — scale displayed nutrient amounts by scaling_factor (driven by
    // dose_amount × times_per_day). The header reads "(daily, scaled)" so this
    // matches user expectation. Unscaled values are kept in the catalog.
    const _sf = parseFloat(item.scaling_factor);
    const scale = (isFinite(_sf) && _sf > 0) ? _sf : 1;
    const scaleNote = (scale !== 1) ? ' <span style="font-weight:400;color:var(--ink-mute);font-size:11px;">(×' + scale + ' from your dose)</span>' : '';
    return '<h4>Nutrient breakdown (daily, scaled)' + scaleNote + '</h4>' + noteHtml +
      '<p style="font-size:11px;color:var(--ink-mute);font-style:italic;margin:0 0 6px;">Click any nutrient name to learn what Wallach says about it + where else it appears in the catalog.</p>' +
      '<div class="rg-nutrient-list">' +
      item.nutrients.slice(0, 30).map(n => {
        // Pass E: wrap nutrient name in a clickable pill if the ingredients-embed
        // has data for it. no-data variant has no underline so users aren't
        // teased with a clickable affordance that leads to "no info" content.
        const hasData = (typeof getIngredientInfo === 'function') && !!getIngredientInfo(n.name);
        const pillClass = 'rg-ingredient-pill' + (hasData ? '' : ' no-data');
        const nameHtml = '<span class="nut-name"><span class="' + pillClass + '" data-ingredient-name="' + escapeHtml(n.name) + '">' + escapeHtml(n.name) + '</span></span>';
        const rawAmt = parseFloat(n.amount);
        const scaledAmt = (isFinite(rawAmt)) ? (rawAmt * scale) : n.amount;
        const displayAmt = (typeof scaledAmt === 'number') ? (Number.isInteger(scaledAmt) ? String(scaledAmt) : scaledAmt.toFixed(2).replace(/\.?0+$/, '')) : String(scaledAmt);
        return '<div class="nut-row">' + nameHtml + '<span class="nut-amt">' + escapeHtml(displayAmt) + ' ' + escapeHtml(n.unit || '') + '</span></div>';
      }).join('') +
      '</div>';
  }

  function renderEditForm(item) {
    // Round 158 — dose inputs moved out of Details to the card itself (inline
    // Dose + Per Day row). Details only handles cosmetic name + notes overrides.
    // For Recommended items, this form is suppressed entirely and replaced
    // with an Adopt CTA. Output values are escapeHtml'd; inputs carry maxlength.
    if (item.kind === 'recommended') {
      // Round 158 v2 — Adopt CTA moved back to the card action row ("Add to
      // Regimen"). Details for Recommended is now read-only context: tagline +
      // what-it-does. The Add to Regimen button on the card is the action path.
      const tagline = item.tagline || item.what_it_does || '';
      if (!tagline) return '';
      return '<h4>What this is</h4>' +
        '<p style="font-size:12.5px;color:var(--ink-soft);margin:0 0 6px;line-height:1.5;">' +
        escapeHtml(tagline) + '</p>';
    }
    return '<h4>Quick edit</h4><p style="font-size:11.5px;color:var(--ink-mute);margin:0 0 10px;font-style:italic;">Cosmetic — name + notes only. Dose is on the card itself. Your edits live in this browser (rgOverrides_v1); the Eden catalog is never modified.</p><div class="rg-edit-form">' +
      '<div class="span-2"><label>Name <span style="color:var(--ink-faint);font-weight:400;font-size:10.5px;">(display only)</span></label><input type="text" class="rg-ed-name" value="' + escapeHtml(item.name || '') + '" maxlength="200"></div>' +
      '<div class="span-2"><label>Notes</label><textarea class="rg-ed-notes" rows="2" maxlength="2000">' + escapeHtml(item.notes || '') + '</textarea></div>' +
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
      '  <textarea class="rg-outcome-input" placeholder="How it\'s going — symptoms, changes, observations..." maxlength="5000"></textarea>' +
      '  <button class="rg-outcome-save">Log note</button>' +
      '</div>';
  }

  function bindRegimenCardActions() {
    // Round 158 v2 — per-card try/catch. A thrown error from one card's
    // querySelector or handler binding must NOT kill the forEach loop and
    // leave subsequent cards unbound. (That was the bug that broke Details on
    // every card after the first when .rg-edit was removed but its binding
    // was still unguarded.) Console.error surfaces the problem without silent
    // breakage — discipline §11 truth-anchoring: no silent failures.
    document.querySelectorAll('#rg-grouped-container .rg-card').forEach(card => {
      try {
      const id = card.dataset.id;
      const toggleBtn = card.querySelector('.rg-toggle-expand');
      if (toggleBtn) toggleBtn.onclick = () => card.classList.toggle('expanded');
      // Pass C: coverage-cell clicks route to the Periodic Table tile for that
      // essential. activateGroup('you') switches tab; we then look up the tile
      // by [data-name="<essential>"] and synthesize a click which the periodic-
      // table IIFE has wired to showEssentialDetail. If the tile can't be found
      // (multi-user case where the essential isn't in the rendered grid), the
      // tab activation still happens — graceful degradation.
      // Pass E: ingredient-pill clicks open the citation-popup with Pass A.3
      // master DB content. Only wires up cells that have data (rg-ingredient-pill
      // without .no-data); the no-data variant is non-interactive so users
      // don't get teased with a clickable affordance that leads to nothing.
      card.querySelectorAll('.rg-ingredient-pill:not(.no-data)[data-ingredient-name]').forEach(pill => {
        pill.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof showIngredientPopup === 'function') {
            showIngredientPopup(pill.dataset.ingredientName);
          }
        };
      });
      card.querySelectorAll('.rg-cov-cell[data-essential-name]').forEach(cell => {
        cell.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const name = cell.dataset.essentialName;
          if (typeof window.activateGroup === 'function') window.activateGroup('you');
          setTimeout(() => {
            const tile = document.querySelector('.essential-tile[data-name="' + (name.replace(/"/g, '\\"')) + '"]');
            if (tile) {
              tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => tile.click(), 250);
            }
          }, 80);
        };
      });
      // Round 158 — null-guard .rg-edit (Quick edit button was removed in this
      // round). Without the guard, querySelector returns null and `.onclick = `
      // throws TypeError, which propagates out of the forEach callback and stops
      // iteration — meaning all subsequent cards lose their click handlers,
      // including their Details toggle. That was the "only the first Details
      // works" bug.
      const editBtn = card.querySelector('.rg-edit');
      if (editBtn) {
        editBtn.onclick = () => {
          card.classList.add('expanded');
          const nameInput = card.querySelector('.rg-ed-name');
          if (nameInput) {
            setTimeout(() => {
              nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              nameInput.focus();
              nameInput.select();
            }, 80);
          }
        };
      }
      const fullEditBtn = card.querySelector('.rg-edit-full');
      if (fullEditBtn) {
        fullEditBtn.onclick = () => {
          try { lsWrite('lcEditTarget', id); } catch(e) {}
          if (typeof window.activateGroup === 'function') {
            window.activateGroup('labels');
          }
        };
      }
      // Round 158 — same null-guard treatment. Recommended cards don't render
      // a Remove button (you can't delete Recommended items; goals control them).
      const removeBtn = card.querySelector('.rg-remove');
      if (removeBtn) removeBtn.onclick = async () => {
        // Round 158 — Remove now has three behaviors based on item kind:
        //   1. ADOPTED recommendation (kind=supplement + _adopted_at): un-adopt
        //      back to Recommended (the user's requested semantic — "Remove" on
        //      Regimen cards moves items back to Recommended, doesn't destroy).
        //   2. SCANNER-sourced label item (kind=label): hard-delete via Label
        //      Check chokepoint; item reappears in Wishlist for re-add.
        //   3. MANUAL/other supplement (no _adopted_at): soft-delete via
        //      rgRemoved so it can be restored from the empty-state button.
        const item = getUnifiedRegimenItems().find(x => x.id === id);
        if (!item) return;
        const isAdoptedRec = item.kind === 'supplement' && item._adopted_at;
        const isLabelItem = item.kind === 'label';
        const removed = loadRgRemoved();
        const isCurrentlyRemoved = removed.has(id);
        let title, body, confirmText, danger;
        if (isCurrentlyRemoved) {
          title = 'Restore item?';
          body = 'Restore this item to your active regimen.';
          confirmText = 'Restore';
          danger = false;
        } else if (isAdoptedRec) {
          title = 'Move back to Recommended?';
          body = 'Remove this item from your active regimen and return it to Recommended. Original data is preserved; you can re-add at any time.';
          confirmText = 'Remove';
          danger = false;
        } else if (isLabelItem) {
          title = 'Remove from regimen?';
          body = 'Remove this scanner-added item from your regimen. It will reappear in the Wishlist (Scanner tab) so you can re-add it or permanently remove it from there.';
          confirmText = 'Remove';
          danger = true;
        } else {
          title = 'Remove item?';
          body = 'Mark this item as no longer in your regimen. Original data is preserved — you can restore it later.';
          confirmText = 'Remove';
          danger = true;
        }
        const ok = await showLcModal({
          title: title,
          titleSev: isCurrentlyRemoved || isAdoptedRec ? 'info' : 'warn',
          icon: isCurrentlyRemoved ? '↺' : (isAdoptedRec ? '↩' : '◐'),
          body: body,
          confirmText: confirmText,
          cancelText: 'Cancel',
          confirmDanger: danger
        });
        if (!ok) return;
        if (isAdoptedRec && !isCurrentlyRemoved) {
          // Un-adopt: clear the kind override + _adopted_at + _adopted_snapshot.
          // Same logic as the old Unadopt button (Round 156 follow-up #9).
          saveRgOverride(id, { kind: 'recommended', _adopted_at: null, _adopted_snapshot: null });
        } else if (isLabelItem && !isCurrentlyRemoved) {
          if (typeof window.removeFromRegimen === 'function') {
            window.removeFromRegimen(item.name);
          } else {
            console.error('[rg-remove] window.removeFromRegimen not exposed — falling back to soft-delete');
            removed.add(id);
            saveRgRemoved(removed);
          }
        } else {
          if (isCurrentlyRemoved) removed.delete(id); else removed.add(id);
          saveRgRemoved(removed);
        }
        renderRegimenTab();
      };
      // Round 158 — null-guard: Recommended cards no longer render rg-cancel-btn
      // (their Details expansion shows only an Adopt CTA). Guard prevents a null
      // ref from blowing up the rest of bindRegimenCardActions for recommended items.
      const cancelBtn = card.querySelector('.rg-cancel-btn');
      if (cancelBtn) cancelBtn.onclick = () => card.classList.remove('expanded');
      // Pass D: Adopt button click → preview modal → on confirm, override the
      // item's kind to 'supplement' + stamp _adopted_at. The chip cluster + coverage
      // strip ABOVE the button row are the live preview — no separate preview UI
      // needed. Modal carries the confirmation text + lists what changes.
      const adoptBtn = card.querySelector('.rg-adopt');
      if (adoptBtn) {
        adoptBtn.onclick = async () => {
          const items = getUnifiedRegimenItems();
          const it = items.find(x => x.id === id);
          if (!it) return;
          // Round 155 / Saturday Item 3 (Path B) — Round 154's `isGoalDriven`
          // branch retired. Goal-driven items now carry full nutrient profiles
          // (wired via getRegimenLabelLookup in buildGoalDrivenRecommendedItems
          // — Round 155 same patch). All recommendations flow through the
          // unified lcScan verdict + essentials-contribution path. No more
          // curated bypass; verdict reflects real product data.
          const covCount = (typeof getItemEssentialContributions === 'function')
            ? getItemEssentialContributions(it).length : 0;
          const matchesFresh = (typeof getItemGoalMatches === 'function')
            ? getItemGoalMatches(it) : [];
          let goalLabels = matchesFresh.map(g =>
            (typeof RG_GOAL_LABELS !== 'undefined' && RG_GOAL_LABELS[g]) ? RG_GOAL_LABELS[g] : g);
          // For goal-driven items, _goalrec_meta.goals is the engine-asserted
          // goal list — if the nutrient-based matcher returned empty (rare
          // edge case where a product's stated goal doesn't match a nutrient
          // mapping), prefer the engine's assertion. Preserves the Round 154
          // honest-goals fallback even though the data-pending case is gone.
          if (goalLabels.length === 0 && it._goalrec_meta && Array.isArray(it._goalrec_meta.goals)) {
            goalLabels = it._goalrec_meta.goals.map(g =>
              (typeof RG_GOAL_LABELS !== 'undefined' && RG_GOAL_LABELS[g]) ? RG_GOAL_LABELS[g] : g);
          }
          let scanResult = null;
          if (typeof window.lcScan === 'function') {
            try { scanResult = window.lcScan(syntheticLabelFromItem(it), { logToRecent: false }); }
            catch (e) { scanResult = null; }
          }
          const parts = ['Add "' + (it.name || 'this item') + '" from Recommended to your active stack?'];
          const verdict = scanResult ? scanResult.verdict : null;
          const headerLine = verdict
            ? (verdict === 'ADD' ? '✓ Verdict: ADD — strong fit for your stack.'
              : verdict === 'SAVE' ? '◐ Verdict: SAVE — worth considering, with caveats.'
              : '⚠ Verdict: REJECT — has flags worth knowing about.')
            : '';
          const essentialsLine = 'Meaningfully contributes to ' + covCount + ' essential' + (covCount === 1 ? '' : 's') + '.';
          const goalsBlock = goalLabels.length
            ? 'Matches your goals:\n' + goalLabels.map(g => '  • ' + g).join('\n')
            : "Doesn't currently match any of your stated goals.";
          function reasonLine(r) {
            const items = (r.items && r.items.length) ? ' — ' + r.items.slice(0, 3).join(', ') : '';
            return '  • ' + r.label + items;
          }
          const forBlock = (scanResult && scanResult.reasonsFor && scanResult.reasonsFor.length)
            ? 'In favor:\n' + scanResult.reasonsFor.slice(0, 3).map(reasonLine).join('\n')
            : '';
          const againstBlock = (scanResult && scanResult.reasonsAgainst && scanResult.reasonsAgainst.length)
            ? 'Worth knowing:\n' + scanResult.reasonsAgainst.slice(0, 3).map(reasonLine).join('\n')
            : '';
          if (headerLine) parts.push(headerLine);
          parts.push(essentialsLine);
          parts.push(goalsBlock);
          if (forBlock) parts.push(forBlock);
          if (againstBlock) parts.push(againstBlock);
          parts.push('You can revert at any time via the Unadopt button on the moved card.');
          const body = parts.join('\n\n');
          // Title selection — verdict-aware from Pass D.1 (Round 88). The
          // Round 154 goal-driven curated-title branch retired with the rest
          // of the isGoalDriven bypass.
          const titleCfg = (scanResult && scanResult.verdict === 'REJECT')
            ? { title: 'Add anyway? This item has flags.', titleSev: 'warn', icon: '⚠', confirmText: 'Add anyway' }
            : (scanResult && scanResult.verdict === 'SAVE')
            ? { title: 'Add this recommendation? (with caveats)', titleSev: 'info', icon: '◐', confirmText: 'Add to Regimen' }
            : { title: 'Add this recommendation to your regimen?', titleSev: 'info', icon: '✓', confirmText: 'Add to Regimen' };
          const ok = await showLcModal({
            title: titleCfg.title,
            titleSev: titleCfg.titleSev,
            icon: titleCfg.icon,
            body: body,
            confirmText: titleCfg.confirmText,
            cancelText: 'Cancel'
          });
          if (!ok) return;
          const todayIso = new Date().toISOString().slice(0, 10);
          // Round 156 follow-up #5 — also save a snapshot of the full item so
          // it survives goal changes. Prior bug: when the user changed goals
          // to one the engine didn't surface this product for, the override
          // had no base item to attach to → adopted item invisible in slot
          // stats AND regimen render. Mental model: "I added it; it's in my
          // regimen; goals shouldn't remove it." Snapshot lives in the override
          // alongside kind/_adopted_at. Reconciliation pass in computeSlotStats
          // and getUnifiedRegimenItems picks up orphan-adopted snapshots.
          saveRgOverride(id, {
            kind: 'supplement',
            _adopted_at: todayIso,
            _adopted_snapshot: it
          });
          // Round 135 / Phase 2 — Adopt fires shared slot side-effects with
          // 'wallach_recommendation_adopted' provenance. Adopt persists via
          // rgOverrides_v1 (a kind override on the existing recommendation),
          // not lcRegimen_v1 — so we call the side-effects helper directly.
          if (typeof window.applyRegimenSlotEffects === 'function') {
            try { window.applyRegimenSlotEffects('wallach_recommendation_adopted'); } catch(e) { console.error('[Adopt] applyRegimenSlotEffects failed', e); }
          }
          renderRegimenTab();
        };
      }
      const unadoptBtn = card.querySelector('.rg-unadopt');
      if (unadoptBtn) {
        unadoptBtn.onclick = async () => {
          const ok = await showLcModal({
            title: 'Unadopt this item?',
            titleSev: 'warn',
            icon: '↩',
            body: 'Move this item back to Recommended. The original recommendation data is preserved; you can re-adopt at any time.',
            confirmText: 'Unadopt',
            cancelText: 'Cancel'
          });
          if (!ok) return;
          // Round 156 follow-up #9 — Override.kind back to recommended; clear
          // both _adopted_at AND _adopted_snapshot. Leaving the snapshot
          // behind was the zombie bug — orphan-adopted reconciliation would
          // resurrect the unadopted item on every render until rgRemoved
          // explicitly suppressed it. Clearing the snapshot at Unadopt time
          // means once you unadopt, the item truly returns to the engine's
          // control (engine produces it or it doesn't).
          saveRgOverride(id, { kind: 'recommended', _adopted_at: null, _adopted_snapshot: null });
          renderRegimenTab();
        };
      }
      // Round 158 — Save handler now only persists name + notes (dose lives on
      // the card row, persisted by its own change handler). Null-guarded because
      // Recommended-kind expansion has no Save button — only an Adopt CTA.
      const saveBtn = card.querySelector('.rg-save-btn');
      if (saveBtn) {
        saveBtn.onclick = () => {
          const nameEl = card.querySelector('.rg-ed-name');
          const notesEl = card.querySelector('.rg-ed-notes');
          const name = nameEl ? nameEl.value.trim().slice(0, 200) : '';
          const notes = notesEl ? notesEl.value.trim().slice(0, 2000) : '';
          saveRgOverride(id, { name, notes });
          renderRegimenTabPreservingState();
        };
      }
      // Round 158 — inline card-row Dose + Per Day handlers. Persist on change
      // (blur or Enter), then re-render preserving expansion + scroll. Live
      // effective-multiplier preview updates on every keystroke.
      // Validation: parseFloat strips non-numerics; min/max clamp to [0, 20].
      const cardDoseInput = card.querySelector('.rg-card-dose');
      const cardTimesInput = card.querySelector('.rg-card-times');
      const cardEffEl = card.querySelector('.rg-card-dose-eff strong');
      const clampDose = v => {
        const n = parseFloat(v);
        if (!isFinite(n) || n < 0) return 0;
        if (n > 20) return 20;
        return n;
      };
      const updateCardEffective = () => {
        if (!cardDoseInput || !cardTimesInput || !cardEffEl) return;
        const sd = clampDose(cardDoseInput.value);
        const st = clampDose(cardTimesInput.value);
        cardEffEl.textContent = (sd * st).toFixed(2).replace(/\.?0+$/, '') || '0';
      };
      const persistCardDose = () => {
        if (!cardDoseInput || !cardTimesInput) return;
        const sd = clampDose(cardDoseInput.value);
        const st = clampDose(cardTimesInput.value);
        saveRgOverride(id, {
          dose_amount: sd,
          times_per_day: st,
          scaling_factor: sd * st,
        });
        renderRegimenTabPreservingState();
      };
      if (cardDoseInput) {
        cardDoseInput.addEventListener('input', updateCardEffective);
        cardDoseInput.addEventListener('change', persistCardDose);
      }
      if (cardTimesInput) {
        cardTimesInput.addEventListener('input', updateCardEffective);
        cardTimesInput.addEventListener('change', persistCardDose);
      }
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
      } catch (cardErr) {
        // Round 158 v2 — defensive: surface the per-card binding error in the
        // console without aborting binding for the rest of the cards. Closes
        // the failure family that broke Details + Add to Regimen for every
        // card past the first when an unguarded querySelector returned null.
        try { console.error('[bindRegimenCardActions] card binding failed:', card && card.dataset && card.dataset.id, cardErr); } catch(_) {}
      }
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
    // Pass B: group-by toggle. Pass C.2: reordered Goal | Kind (Goal default)
    // + disable Goal button when user has no stated goals + sync the active-class
    // to rgGroupBy. Pass C.2 hotfix: rgGroupBy is set HERE (init-time, not at
    // module-load) so RG_GOAL_ORDER is guaranteed to be in scope when
    // hasUserGoals() is consulted.
    const goalBtn = document.querySelector('.rg-groupby-btn[data-groupby="goal"]:not(.rg-sortby-btn)');
    const kindBtn = document.querySelector('.rg-groupby-btn[data-groupby="kind"]:not(.rg-sortby-btn)');
    if (goalBtn && kindBtn) {
      if (!hasUserGoals()) {
        // Multi-user-ready: gray-out Goal button + tooltip. No chat/assistant
        // language per user direction (Pass C.2) — the dashboard must be
        // achievable without any chat dependency for the future shipping path.
        rgGroupBy = 'kind';
        goalBtn.disabled = true;
        goalBtn.classList.add('disabled');
        goalBtn.title = 'You have no stated goals yet. Add at least one to enable goal-grouping.';
        goalBtn.classList.remove('active');
        kindBtn.classList.add('active');
      } else {
        // Default state: Goal active, Kind inactive
        rgGroupBy = 'goal';
        goalBtn.classList.add('active');
        kindBtn.classList.remove('active');
      }
    }
    document.querySelectorAll('.rg-groupby-btn:not(.rg-sortby-btn)').forEach(b => {
      b.onclick = () => {
        if (b.disabled) return;
        document.querySelectorAll('.rg-groupby-btn:not(.rg-sortby-btn)').forEach(b2 => b2.classList.remove('active'));
        b.classList.add('active');
        rgGroupBy = b.dataset.groupby;
        renderRegimenTab();
      };
    });
    // Pass C.1: sort selector (Coverage default | A-Z). Orthogonal to filter
    // AND to groupBy — switching sort never resets either other axis.
    document.querySelectorAll('.rg-sortby-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('.rg-sortby-btn').forEach(b2 => b2.classList.remove('active'));
        b.classList.add('active');
        rgSortBy = b.dataset.sortby;
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
      // Round 135 / Phase 2 — manual-add fires shared slot side-effects with
      // 'user_manual' provenance. Manual additions persist via rgManualItems_v1
      // (a raw array), not lcRegimen_v1 — so we call the side-effects helper
      // directly. ensureDefaultSlot will create 'My Regimen' (ENGINE template)
      // on first add.
      if (typeof window.applyRegimenSlotEffects === 'function') {
        try { window.applyRegimenSlotEffects('user_manual'); } catch(e) { console.error('[manual-add] applyRegimenSlotEffects failed', e); }
      }
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
    try { return lsRead(LC_EDIT_TARGET_KEY, ''); } catch(e) { return ''; }
  }
  function lcClearEditTarget() {
    try { lsRemove(LC_EDIT_TARGET_KEY); } catch(e) {}
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
  // Round 75 Pass A — regimen-label-lookup connectivity layer. Reads the
  // products-db-derived JSON block embedded at id="regimen-label-lookup" and
  // memoizes the products dict so subsequent lookups are O(1). Returns {} when
  // the block is missing or unparseable (graceful degradation — populator falls
  // back to item fields). Doctrine §3 — single source of truth for label data.
  let _rlLookupCache = null;
  function getRegimenLabelLookup() {
    if (_rlLookupCache !== null) return _rlLookupCache;
    try {
      const el = document.getElementById('regimen-label-lookup');
      if (!el) { _rlLookupCache = {}; return _rlLookupCache; }
      const parsed = JSON.parse(el.textContent);
      _rlLookupCache = (parsed && parsed.products) || {};
    } catch(e) { _rlLookupCache = {}; }
    return _rlLookupCache;
  }
  // Pass A.1 — auto-compose an ingredient-text draft from the lookup when no
  // stash / item ingredients exist. Surfaces: (a) parsed blend sub-ingredients
  // from the Supplement Facts non_essentials field (previously discarded),
  // (b) features array from the Youngevity product page, (c) what_it_does
  // one-liner. User can edit / replace with actual "Other Ingredients" panel
  // text from the label image when they want exact text for label-scoring.
  function composeIngredientsFromLookup(lookup) {
    if (!lookup) return '';
    const lines = [];
    const blends = (lookup.non_essentials_parsed || []).filter(function(r) {
      return r && r.category === 'blend_parent' && r.sub_ingredients && r.sub_ingredients.length;
    });
    if (blends.length) {
      lines.push('PROPRIETARY BLENDS (from Supplement Facts):');
      blends.forEach(function(b) {
        lines.push('• ' + b.name + ' (' + b.amount + ' ' + b.unit + '): ' + b.sub_ingredients.join(', '));
      });
      lines.push('');
    }
    if (lookup.features && lookup.features.length) {
      lines.push('PRODUCT FEATURES:');
      lookup.features.forEach(function(f) { lines.push('• ' + f); });
      lines.push('');
    }
    if (lookup.what_it_does) {
      lines.push('ABOUT: ' + lookup.what_it_does);
      lines.push('');
    }
    if (lines.length) {
      lines.push('— Auto-composed from the canonical Youngevity catalog. Edit / replace with the actual "Other Ingredients" panel text from the label if needed for exact scoring.');
    }
    return lines.join('\n').trim();
  }
  function lcPopulateFormFromItem(item) {
    // Three-tier source priority: stash (user's prior Full edit) → lookup
    // (products-db canonical) → item fields (REGIMEN_BASE_DATA partial). The
    // lookup tier closes the Pass A bug — recommendations had no ingredients,
    // partial nutrients, no container/serving data on the item itself, so the
    // form rendered blank or partial. Now any item whose name matches the
    // products-db catalog gets the full Youngevity label data on Full edit.
    const stash = item._lc_label || {};
    const lookup = (getRegimenLabelLookup() || {})[item.name] || {};
    $('lc-name').value = stash.name || item.name || '';
    $('lc-brand').value = stash.brand || item.brand || '';
    $('lc-category').value = stash.category || item.category || lookup.category || '';
    // Round 139 — set swap bar from stash → item → lookup. kind takes
    // precedence over the legacy freeform `category` for type discrimination.
    if (typeof window.setLcScannerKind === 'function') {
      const k = (stash.kind || item.kind || lookup.kind || '').toString().toLowerCase();
      if (k === 'diet' || k === 'food') window.setLcScannerKind('diet', { fromHeuristic: true });
      else if (k === 'supplement') window.setLcScannerKind('supplement', { fromHeuristic: true });
      else window.setLcScannerKind('diet', { fromHeuristic: true });
    }
    if (typeof window.clearLcKindOverride === 'function') window.clearLcKindOverride();
    $('lc-container').value = stash.container || (lookup.servings_per_container != null ? String(lookup.servings_per_container) : '');
    const servingsFromDose = (item.dose_text || '').match(/(\d+(?:\.\d+)?)/);
    const servingsFromLookup = (lookup.serving_size || '').match(/(\d+(?:\.\d+)?)/);
    $('lc-servings').value = stash.servings || (servingsFromDose ? servingsFromDose[1] : '') || (servingsFromLookup ? servingsFromLookup[1] : '') || '1';
    // Decide what to populate first. Approximate-marker detection drives both nutrient suppression AND ingredient suppression —
    // when the original data on file came from Phase-11 self-heal (gap-fill summary), the user's intent is "start fresh".
    // We treat _lc_label as authoritative ONLY if its nutrients aren't approximate-marked too (covers the case where round-1
    // Full edit saved the placeholder values without manual correction). Lookup data is never approximate by construction.
    const stashIsApproximate = (stash.nutrients || []).some(lcNutrientLooksApproximate);
    const itemIsApproximate = (item.nutrients || []).some(lcNutrientLooksApproximate);
    const approximate = stashIsApproximate || itemIsApproximate;
    // Ingredient text source priority (Pass A.1):
    // (1) approximate → blank (force user to provide real values)
    // (2) stash.ingredients (user's prior Full edit)
    // (3) item.ingredients (REGIMEN_BASE_DATA, usually empty)
    // (4) auto-composed from lookup (blends + features + what_it_does)
    // (5) blank
    let ingredientsAutoComposed = false;
    if (approximate) {
      $('lc-ingredients').value = '';
    } else if (stash.ingredients) {
      $('lc-ingredients').value = stash.ingredients;
    } else if (item.ingredients) {
      $('lc-ingredients').value = item.ingredients;
    } else {
      const composed = composeIngredientsFromLookup(lookup);
      $('lc-ingredients').value = composed;
      ingredientsAutoComposed = composed.length > 0;
    }
    // Reset nutrient rows, then seed. Source priority:
    // (1) approximate → blank (force user to provide real values)
    // (2) stash.nutrients (user's prior Full edit, real data)
    // (3) lookup.nutrients + lookup.non_essentials_parsed (canonical products-db)
    // (4) item.nutrients (REGIMEN_BASE_DATA partial)
    $('lc-nutrient-rows').innerHTML = '';
    let nuts;
    let lookupHit = false;
    if (approximate) {
      nuts = [];
    } else if (stash.nutrients && stash.nutrients.length) {
      nuts = stash.nutrients;
    } else if (lookup.nutrients && lookup.nutrients.length) {
      nuts = lookup.nutrients.slice();
      if (lookup.non_essentials_parsed && lookup.non_essentials_parsed.length) {
        nuts = nuts.concat(lookup.non_essentials_parsed);
      }
      lookupHit = true;
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
    // Annotate the edit banner with the data-provenance hint when applicable
    const labelHost = document.querySelector('#lc-edit-banner .lc-edit-label');
    if (labelHost) {
      labelHost.querySelectorAll('.lc-edit-hint').forEach(el => el.remove());
      if (approximate) {
        const hint = document.createElement('div');
        hint.className = 'lc-edit-hint';
        hint.textContent = 'Existing data on this item was approximate (derived from gap-fill summary, not a real label). Form starts blank so you can auto-detect or enter real values from the label.';
        labelHost.appendChild(hint);
      } else if (lookupHit) {
        const hint = document.createElement('div');
        hint.className = 'lc-edit-hint';
        hint.textContent = ingredientsAutoComposed
          ? 'Nutrient panel + ingredient draft pre-populated from the canonical Youngevity catalog (products-db). Replace the ingredient text with the actual "Other Ingredients" panel from the label if you want exact label-scoring.'
          : 'Nutrient panel pre-populated from the canonical Youngevity catalog (products-db). Ingredient text not on file — add it from the label if you want it scored.';
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
    // Pass A.1: hide the bottom-bar mirror too
    const bottomBar = $('lc-edit-bottom-bar');
    if (bottomBar) bottomBar.hidden = true;
    // Reset the form so re-entering Label Check is a clean slate.
    // Safe even when returnToRegimen navigates away — clear happens in the background and the user sees a fresh form next time they come back.
    if (typeof clearForm === 'function') clearForm();
    if (returnToRegimen && typeof window.activateGroup === 'function') {
      // Pass A.1 fix: previously called activateGroup('you', 'regimen') which
      // fell through to you.defaultTab='stand' because 'regimen' is not a
      // subTab of 'you' — it's its own top-level group. User landed on the
      // periodic table page instead of the Regimen tab. Direct group call.
      window.activateGroup('regimen');
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
    const bottomBar = $('lc-edit-bottom-bar');
    if (!id) {
      banner.classList.add('hidden');
      if (bottomBar) bottomBar.hidden = true;
      return;
    }
    const item = lcFindRegimenItem(id);
    if (!item) {
      // Edit target stale — silently clear so we don't loop
      lcClearEditTarget();
      banner.classList.add('hidden');
      if (bottomBar) bottomBar.hidden = true;
      return;
    }
    nameEl.textContent = item.name || '(unnamed)';
    banner.classList.remove('hidden');
    lcPopulateFormFromItem(item);
    backBtn.onclick = () => lcExitEditMode(true);
    saveBtn.onclick = () => lcSaveEditedItem();
    // Pass A.1: bottom-bar mirror so save/cancel stay reachable after scrolling
    // through a long nutrient table. Bar is hidden by default; shown only here.
    if (bottomBar) {
      bottomBar.hidden = false;
      const bottomName = $('lc-edit-bottom-name');
      if (bottomName) bottomName.textContent = item.name || '(unnamed)';
      const bottomCancel = $('lc-edit-bottom-cancel');
      const bottomSave = $('lc-edit-bottom-save');
      if (bottomCancel) bottomCancel.onclick = () => lcExitEditMode(true);
      if (bottomSave) bottomSave.onclick = () => lcSaveEditedItem();
    }
    // Bring banner into view so user knows they're in edit mode
    setTimeout(() => banner.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
  window.lcHandleEditTarget = lcHandleEditTarget;
  // Pass D.1: expose scan() for cross-IIFE consumption by the Regimen tab's
  // adoption modal. Decisions doc names this as the unified-evaluation
  // commitment (Pass B.2 follow-up). Callers should pass {logToRecent: false}
  // to avoid logging non-label-scan invocations into the recent-scans list.
  window.lcScan = scan;

  // Round 161 polish — single image-to-scan-result bridge so the new
  // dashboard's Scanner workspace can drive an OCR scan without reaching
  // into IIFE-private helpers. Mirrors what triggerOcr() does for the
  // legacy drop zone, but takes a single data URL and returns the scan.
  async function lcScanImage(dataUrl) {
    if (!dataUrl) throw new Error('lcScanImage: no dataUrl provided');
    const text = await runOcr(dataUrl, function (msg, prog) {
      // Surface progress on a typed event the new Scanner view can subscribe to.
      try {
        window.dispatchEvent(new CustomEvent('lcscan:progress', {
          detail: { message: msg, progress: prog }
        }));
      } catch (_) {}
    });
    const parsed = parseOcrText(text);
    const label = {
      name: parsed.containerHint || 'Scanned label',
      brand: '',
      servings: 1,
      nutrients: parsed.nutrients || [],
      ingredients: parsed.ingredients || '',
    };
    return scan(label, { logToRecent: true });
  }
  window.lcScanImage = lcScanImage;

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
      // Round 139 — reset swap bar to default + clear user-override flag.
      if (typeof window.setLcScannerKind === 'function') window.setLcScannerKind('diet', { fromHeuristic: true });
      if (typeof window.clearLcKindOverride === 'function') window.clearLcKindOverride();
    });

    // Round 139 v7 — same verified pattern from Juxtopposed CodePen, parameters
    // tuned per user request (sunrise-orange replaces red, DIET=LEFT default).
    // Class renamed: `.off-red` → `.is-supplement` (semantic for non-red palette).
    // Public API unchanged from v1-v6 for backward compat.
    (function initLcKindSwap() {
      const toggle = document.getElementById('lc-kind-swap');
      const hidden = document.getElementById('lc-kind');
      if (!toggle || !hidden) return;
      const control = toggle.closest('.lc-kind-control');
      if (!control) return;
      const switchEl = toggle.querySelector('.lc-kind-switch');
      const caption = control.querySelector('.lc-kind-caption');
      let userOverride = false;

      function setKind(value, opts) {
        opts = opts || {};
        if (value !== 'diet' && value !== 'supplement') value = 'diet';
        if (opts.fromHeuristic && userOverride) return;
        hidden.value = value;
        control.setAttribute('data-value', value);
        toggle.setAttribute('data-value', value);
        toggle.setAttribute('aria-checked', value === 'supplement' ? 'true' : 'false');
        // DIET = no .is-supplement class (green left); SUPPLEMENT = .is-supplement (orange right)
        if (switchEl) {
          if (value === 'supplement') {
            switchEl.classList.add('is-supplement');
          } else {
            switchEl.classList.remove('is-supplement');
          }
        }
        if (caption) caption.textContent = (value === 'diet' ? 'DIET' : 'SUPPLEMENT') + ' MODE';
        if (!opts.fromHeuristic) userOverride = true;
      }

      // Click the toggle — flip the state
      toggle.addEventListener('click', function() {
        const cur = control.getAttribute('data-value') || 'diet';
        setKind(cur === 'diet' ? 'supplement' : 'diet');
      });

      // Keyboard nav (v7 flipped): Left/Home = DIET (left position); Right/End = SUPPLEMENT (right position).
      toggle.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'Home') {
          e.preventDefault(); setKind('diet');
        } else if (e.key === 'ArrowRight' || e.key === 'End') {
          e.preventDefault(); setKind('supplement');
        }
        // Space / Enter handled by the button's native click event
      });

      // Name-based heuristic — only fires when the user hasn't overridden.
      const DIET_KEYWORDS = ['water', 'drink', 'juice', 'tea', 'coffee', 'kombucha', 'milk', 'broth', 'soda', 'smoothie', 'kefir', 'cider'];
      const SUPP_KEYWORDS = ['capsule', 'tablet', 'softgel', 'multivitamin', 'extract', 'powder', 'tincture'];
      function maybeAutoSetFromName() {
        const nameEl = document.getElementById('lc-name');
        if (!nameEl) return;
        const name = (nameEl.value || '').toLowerCase();
        if (!name) return;
        if (userOverride) return;
        for (const kw of DIET_KEYWORDS) {
          if (name.includes(kw)) { setKind('diet', { fromHeuristic: true }); return; }
        }
        for (const kw of SUPP_KEYWORDS) {
          if (name.includes(kw)) { setKind('supplement', { fromHeuristic: true }); return; }
        }
      }
      const nameInput = document.getElementById('lc-name');
      if (nameInput) {
        let nameTimeout;
        nameInput.addEventListener('input', () => {
          clearTimeout(nameTimeout);
          nameTimeout = setTimeout(maybeAutoSetFromName, 200);
        });
      }

      window.setLcScannerKind = setKind;
      window.getLcScannerKind = () => hidden.value;
      window.clearLcKindOverride = () => { userOverride = false; };
    })();
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
      // Round 156 follow-up #7 — cascade compatibility alias. Multiple call
      // sites (triggerRegimenRerender, ~line 6095; older code paths at
      // ~6742/7358/7491) reference `window.renderRegimen` but only
      // `window.renderRegimenTab` was exposed — every call no-op'd silently.
      // That's why goal changes didn't refresh recommendations live. Alias
      // makes both names point at the same function.
      window.renderRegimen = renderRegimenTab;
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

// ─── Block B · Creators-log handler IIFE (was lines 21866–21937) ─────────
(function() {
    function clInit() {
      // Version-reader: pulls from versions-data JSON block and updates all
      // [data-version-slot] elements. Single source of truth for banner + sysinfo display.
      try {
        const vEl = document.getElementById('versions-data');
        if (vEl) {
          const v = JSON.parse(vEl.textContent).current;
          const DASH_SEP = ' — ';
          const slots = {
            'updated-pill':    'Updated ' + (v.updated_display || v.updated_iso || ''),
            'brain-pill':      'Chronicle v' + v.brain + (v.brain_label ? DASH_SEP + v.brain_label : ''),
            'cl-brain':        'v' + v.brain + (v.brain_label ? DASH_SEP + v.brain_label : ''),
            'cl-dashboard':    'v' + v.dashboard + (v.dashboard_label ? DASH_SEP + v.dashboard_label : ''),
            'tools-brain':     'Chronicle v' + v.brain + (v.brain_label ? DASH_SEP + v.brain_label : ''),
            'footer-version':  'Dashboard v' + v.dashboard + ' · Chronicle v' + v.brain + ' · updated ' + (v.updated_display || v.updated_iso || ''),
          };
          document.querySelectorAll('[data-version-slot]').forEach(el => {
            const key = el.getAttribute('data-version-slot');
            if (slots[key]) el.textContent = slots[key];
          });
          // Populate Journey-tab timeline from versions.json history
          const timeline = document.getElementById('journey-timeline');
          const obj = JSON.parse(vEl.textContent);
          if (timeline && obj.history && Array.isArray(obj.history)) {
            const html = obj.history.map(h => {
              const title = (h.title || ('Chronicle v' + h.brain + ' + Dashboard v' + h.dashboard + (h.summary ? DASH_SEP + h.summary : ''))).replace(/^Brain v/, 'Chronicle v').replace(/ \+ Brain v/g, ' + Chronicle v');
              const body = h.body || h.summary || '';
              const dateLabel = h.date + (h.round ? (' — Round ' + h.round) : '');
              const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              return '<li><div class="date">' + esc(dateLabel) + '</div><div class="title">' + esc(title) + '</div><div class="body">' + esc(body) + '</div></li>';
            }).join('\n');
            timeline.innerHTML = html;
          }
        }
      } catch (e) { /* don't block log init on version read failure */ }
      const enterBtn = document.getElementById('cl-enter-btn');
      const exitBtn = document.getElementById('cl-exit-btn');
      const log = document.getElementById('creators-log');
      if (!enterBtn || !log) return;
      const sections = ['saga', 'lessons', 'decisions', 'changelog', 'notebook'];
      const CLOSE_TAG = '<' + '/script>';
      const ESCAPED = '<\\/script>';
      sections.forEach(key => {
        const dataEl = document.getElementById('cl-data-' + key);
        const targetEl = document.getElementById('cl-' + key);
        if (dataEl && targetEl) {
          // Reverse the embed-time escape so the visible text reads cleanly
          const raw = dataEl.textContent.split(ESCAPED).join(CLOSE_TAG);
          targetEl.textContent = raw;
        }
      });
      enterBtn.addEventListener('click', () => {
        // Toggle behavior — clicking the gate when the log is already open
        // closes it (previous regression: open-only handler left the only
        // close path through the Exit button at the bottom of the panel).
        const willOpen = !!log.hidden;
        log.hidden = !willOpen;
        enterBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
      if (exitBtn) exitBtn.addEventListener('click', () => {
        log.hidden = true;
        enterBtn.setAttribute('aria-expanded', 'false');
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', clInit);
    } else {
      clInit();
    }
  })();