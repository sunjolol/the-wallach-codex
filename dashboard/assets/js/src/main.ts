/**
 * main.ts — dashboard entry point
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Wires the shell. Mounts views. Sets up rail navigation.
 *
 * ROUND 2 — COVERAGE WORKSPACE IS LIVE.
 *   - Rail "Coverage" → new view in #workspace-coverage-mount
 *   - All other rail items → fall back to legacy #legacy-workspace-host with
 *     the appropriate legacy tab activated (subsequent rounds migrate each)
 *   - state/coverage.installRecomputeTrigger() runs once at boot so coverage
 *     stays in sync with regimen mutations.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as eden from './core/eden.js';
import * as events from './core/events.js';
import * as sourceRule from './core/source-rule.js';
import * as storage from './core/storage.js';

import { installRecomputeTrigger } from './state/coverage.js';
import * as goalsState from './state/goals.js';
import * as journeyState from './state/journey.js';
import * as ocrState from './state/ocr.js';
import * as regimenState from './state/regimen.js';
import * as scannerState from './state/scanner.js';

import * as coverageView from './views/coverage.js';
import * as journeyView from './views/journey.js';
import * as knowledgeView from './views/knowledge.js';
import * as paletteView from './views/palette.js';
import * as profileView from './views/profile.js';
import * as regimenView from './views/regimen.js';
import * as scannerView from './views/scanner.js';

/*
 * Reference all unused imports so they're held by the bundler (scaffolds
 * still throw on call — that's intended until their rounds land).
 */
const _refs = { storage, events, eden, sourceRule, regimenState, scannerState, ocrState, goalsState, journeyState, regimenView, scannerView, knowledgeView, journeyView, paletteView, profileView };
void _refs;

// ─── Rail navigation state ────────────────────────────────────────────────

type WorkspaceTarget = 'coverage' | 'regimen' | 'scanner' | 'knowledge' | 'journey';

interface MountedView {
  unmount: () => void;
}

/** Maps rail target → the legacy tab ID that should be active when not migrated. */
const LEGACY_TAB_FOR: Record<WorkspaceTarget, string> = {
  coverage: 'tab-stand',
  regimen: 'tab-regimen',
  scanner: 'tab-tools',
  knowledge: 'tab-why',
  journey: 'tab-journey',
};

/** Tracks each workspace's mount handle for unmount on switch-away. */
const mounted: Partial<Record<WorkspaceTarget, MountedView>> = {};

function getLegacyHost(): HTMLElement | null {
  return document.getElementById('legacy-workspace-host');
}

function showLegacy(target: WorkspaceTarget): void {
  const host = getLegacyHost();
  if (host === null) {
    return;
  }
  host.style.display = '';
  // Switch the legacy inner tab if a legacy tab-switcher is available
  const legacyTabId = LEGACY_TAB_FOR[target];
  const w = window as Window & { showTab?: (id: string) => void };
  if (typeof w.showTab === 'function') {
    try {
      w.showTab(legacyTabId);
    }
    catch (e) {
      console.warn('[main] legacy showTab threw:', e);
    }
  }
}

function hideLegacy(): void {
  const host = getLegacyHost();
  if (host !== null) {
    host.style.display = 'none';
  }
}

function hideAllNewMounts(): void {
  for (const id of ['workspace-coverage-mount', 'workspace-regimen-mount', 'workspace-scanner-mount']) {
    const el = document.getElementById(id);
    if (el !== null) {
      el.style.display = 'none';
    }
  }
}

function activateRailItem(target: WorkspaceTarget): void {
  for (const btn of Array.from(document.querySelectorAll('.rail__item'))) {
    btn.classList.toggle('active', btn.getAttribute('data-rail-nav') === target);
  }
}

// ─── Drawers (Knowledge · K, Journey · J) ──────────────────────────────

/** The structural subset of each view's DrawerHandle that the shell drives. */
interface DrawerHandle {
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

/** One overlay drawer: a rail target, its mount slot, and a bare-key toggle. */
interface DrawerSpec {
  target: WorkspaceTarget;
  mountId: string;
  key: string;
  mount: (el: HTMLElement) => DrawerHandle;
}

const DRAWER_SPECS: readonly DrawerSpec[] = [
  { target: 'knowledge', mountId: 'drawer-knowledge-mount', key: 'k', mount: knowledgeView.mount },
  { target: 'journey', mountId: 'drawer-journey-mount', key: 'j', mount: journeyView.mount },
];

const drawerHandles = new Map<WorkspaceTarget, DrawerHandle>();

function isDrawerTarget(target: WorkspaceTarget): boolean {
  return DRAWER_SPECS.some(s => s.target === target);
}

function closeAllDrawers(): void {
  for (const handle of drawerHandles.values()) {
    handle.close();
  }
}

function navigateTo(target: WorkspaceTarget): void {
  // Switching workspace closes any open drawer overlay.
  closeAllDrawers();
  activateRailItem(target);
  events.emit('rail:navigate', { target });

  hideAllNewMounts();

  if (target === 'coverage') {
    hideLegacy();
    const mountEl = document.getElementById('workspace-coverage-mount');
    if (mountEl === null) {
      return;
    }
    mountEl.style.display = 'block';
    if (mounted.coverage === undefined) {
      mounted.coverage = coverageView.mount(mountEl);
    }
    return;
  }

  if (target === 'regimen') {
    hideLegacy();
    const mountEl = document.getElementById('workspace-regimen-mount');
    if (mountEl === null) {
      return;
    }
    mountEl.style.display = 'block';
    if (mounted.regimen === undefined) {
      mounted.regimen = regimenView.mount(mountEl);
    }
    return;
  }

  if (target === 'scanner') {
    hideLegacy();
    const mountEl = document.getElementById('workspace-scanner-mount');
    if (mountEl === null) {
      return;
    }
    mountEl.style.display = 'block';
    if (mounted.scanner === undefined) {
      mounted.scanner = scannerView.mount(mountEl);
    }
    return;
  }

  // Other workspaces fall back to legacy until their round lands.
  showLegacy(target);
}

function wireRail(): void {
  for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('.rail__item[data-rail-nav]'))) {
    const target = btn.getAttribute('data-rail-nav') as WorkspaceTarget | null;
    if (target === null) {
      continue;
    }
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (isDrawerTarget(target)) {
        toggleDrawer(target);
        return;
      }
      navigateTo(target);
    });
  }
}

// ─── Drawer mounting + wiring (shared K + J) ──────────────────────────

/** Mount every overlay drawer into its host once at boot. */
function mountDrawers(): void {
  for (const spec of DRAWER_SPECS) {
    const el = document.getElementById(spec.mountId);
    if (el === null) {
      continue;
    }
    drawerHandles.set(spec.target, spec.mount(el));
  }
}

/** Reflect each drawer's open-state on its rail item. */
function syncDrawerRail(): void {
  for (const spec of DRAWER_SPECS) {
    const btn = document.querySelector<HTMLElement>(`.rail__item[data-rail-nav="${spec.target}"]`);
    if (btn === null) {
      continue;
    }
    const handle = drawerHandles.get(spec.target);
    btn.classList.toggle('active', handle !== undefined && handle.isOpen());
  }
}

/**
 * Toggle one drawer. Only one overlay is open at a time, so opening one closes
 * the others first.
 */
function toggleDrawer(target: WorkspaceTarget): void {
  const handle = drawerHandles.get(target);
  if (handle === undefined) {
    return;
  }
  for (const [other, h] of drawerHandles) {
    if (other !== target) {
      h.close();
    }
  }
  handle.toggle();
  syncDrawerRail();
}

/** Esc closes any open drawer; a bare drawer key (K / J) toggles it. */
function wireDrawerKeys(): void {
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeAllDrawers();
      syncDrawerRail();
      return;
    }
    const t = ev.target as HTMLElement | null;
    const typing = t !== null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) {
      return;
    }
    for (const spec of DRAWER_SPECS) {
      if (ev.key.toLowerCase() === spec.key) {
        ev.preventDefault();
        toggleDrawer(spec.target);
        return;
      }
    }
  });
}

/**
 * Auto-derive — real app activity becomes Journey timeline events so the
 * timeline fills from genuine use (J1 reads real activity; there is no fake
 * seed). Deliberately excludes coverage:recomputed and regimen 'dose-edit':
 * both fire on every micro-change and would flood the timeline with redundant
 * noise. Only deliberate, low-frequency actions are recorded.
 */
function wireJourneyAutoDerive(): void {
  events.on('scanner:scan-complete', (p) => {
    const label = p.verdict === 'aligns'
      ? 'aligns with the framework'
      : p.verdict === 'partial' ? 'a partial match' : 'outside the framework';
    journeyState.logEvent({ kind: 'scan', title: `Scanned a product — ${label}`, occurredAt: new Date().toISOString() });
  });
  events.on('regimen:changed', (p) => {
    if (p.reason === 'dose-edit') {
      return;
    }
    const verb = p.reason === 'add'
      ? 'Added an item to'
      : p.reason === 'remove' ? 'Removed an item from' : 'Restored an item to';
    journeyState.logEvent({ kind: 'regimen', title: `${verb} your regimen`, occurredAt: new Date().toISOString() });
  });
  events.on('goals:updated', () => {
    journeyState.logEvent({ kind: 'milestone', title: 'Updated a goal', occurredAt: new Date().toISOString() });
  });
}

// ─── Profile panel ─────────────────────────────────────────────────────────

let profileHandle: { unmount: () => void } | null = null;
let profileOverlay: HTMLElement | null = null;

function hideProfilePanel(): void {
  if (profileHandle !== null) {
    profileHandle.unmount();
    profileHandle = null;
  }
  if (profileOverlay !== null) {
    profileOverlay.remove();
    profileOverlay = null;
  }
}

function showProfilePanel(): void {
  if (profileOverlay !== null) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'pf-overlay';
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) {
      hideProfilePanel();
    }
  });
  overlay.addEventListener('pf:close', () => hideProfilePanel());
  document.body.appendChild(overlay);
  profileOverlay = overlay;
  profileHandle = profileView.mount(overlay);
}

function wireProfileChip(): void {
  const chip = document.querySelector<HTMLElement>('.rail__profile');
  if (chip === null) {
    return;
  }
  chip.style.cursor = 'pointer';
  chip.setAttribute('role', 'button');
  chip.setAttribute('tabindex', '0');
  chip.addEventListener('click', () => showProfilePanel());
  chip.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      showProfilePanel();
    }
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && profileOverlay !== null) {
      hideProfilePanel();
    }
  });
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────

function bootstrap(): void {
  console.warn('[wallach·sys v3.27] dashboard module graph loaded · Round 2 (Coverage migrated)');

  // Install the coverage recompute trigger so regimen changes flow through.
  try {
    installRecomputeTrigger();
  }
  catch (e) {
    console.warn('[main] installRecomputeTrigger threw:', e);
  }

  wireRail();
  wireProfileChip();
  mountDrawers();
  wireDrawerKeys();
  wireJourneyAutoDerive();

  /*
   * Default landing: Coverage (the new view). Defer one tick so legacy JS
   * finishes its own DOMContentLoaded work first.
   */
  setTimeout(() => navigateTo('coverage'), 0);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
else {
  bootstrap();
}
