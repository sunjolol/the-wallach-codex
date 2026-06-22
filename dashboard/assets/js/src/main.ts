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

let knowledgeDrawer: knowledgeView.DrawerHandle | null = null;

function navigateTo(target: WorkspaceTarget): void {
  // Switching workspace closes the Knowledge drawer overlay if it's open.
  knowledgeDrawer?.close();
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
      if (target === 'knowledge') {
        toggleKnowledgeDrawer();
        return;
      }
      navigateTo(target);
    });
  }
}

// ─── Knowledge drawer (K) ────────────────────────────────────────────────────

/** Mount the Knowledge drawer overlay into its host once at boot. */
function mountKnowledgeDrawer(): void {
  const el = document.getElementById('drawer-knowledge-mount');
  if (el === null) {
    return;
  }
  knowledgeDrawer = knowledgeView.mount(el);
}

/** Toggle the Knowledge drawer and reflect its open-state on the rail item. */
function toggleKnowledgeDrawer(): void {
  if (knowledgeDrawer === null) {
    return;
  }
  knowledgeDrawer.toggle();
  const btn = document.querySelector<HTMLElement>('.rail__item[data-rail-nav="knowledge"]');
  if (btn !== null) {
    btn.classList.toggle('active', knowledgeDrawer.isOpen());
  }
}

/** Esc closes the drawer; bare "K" toggles it (ignored while typing or with a modifier). */
function wireKnowledgeKeys(): void {
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && knowledgeDrawer !== null && knowledgeDrawer.isOpen()) {
      toggleKnowledgeDrawer();
      return;
    }
    const t = ev.target as HTMLElement | null;
    const typing = t !== null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ((ev.key === 'k' || ev.key === 'K') && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
      ev.preventDefault();
      toggleKnowledgeDrawer();
    }
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
  mountKnowledgeDrawer();
  wireKnowledgeKeys();

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
