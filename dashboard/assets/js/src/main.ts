/**
 * main.ts — dashboard entry point
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Wires the shell. Mounts views. Sets up rail navigation.
 *
 * Rail navigation mounts each workspace view into its own slot.
 *   - state/coverage.installRecomputeTrigger() runs once at boot so coverage
 *     stays in sync with regimen mutations.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as eden from './core/eden.js';
import * as events from './core/events.js';
import * as sourceRule from './core/source-rule.js';
import * as storage from './core/storage.js';

import * as corpusState from './state/corpus.js';
import { installRecomputeTrigger } from './state/coverage.js';
import * as ocrState from './state/ocr.js';
import * as profileState from './state/profile.js';
import * as regimenState from './state/regimen.js';
import * as scannerState from './state/scanner.js';

import * as coverageView from './views/coverage.js';
import * as knowledgeView from './views/knowledge.js';
import * as paletteView from './views/palette.js';
import * as profileView from './views/profile.js';
import * as regimenView from './views/regimen.js';
import * as scannerView from './views/scanner.js';
import * as searchView from './views/search.js';
import { initGlossTooltip } from './views/gloss-tooltip.js';
import * as welcomeView from './views/welcome.js';

/*
 * Reference all unused imports so they're held by the bundler (scaffolds
 * still throw on call — that's intended until their rounds land).
 */
const _refs = { storage, events, eden, sourceRule, regimenState, scannerState, ocrState, regimenView, scannerView, knowledgeView, paletteView, profileView };
void _refs;

// ─── Rail navigation state ────────────────────────────────────────────────

type WorkspaceTarget = 'coverage' | 'regimen' | 'scanner' | 'search' | 'knowledge';

interface MountedView {
  unmount: () => void;
}

/** Tracks each workspace's mount handle for unmount on switch-away. */
const mounted: Partial<Record<WorkspaceTarget, MountedView>> = {};

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

/**
 * Per-workspace topbar identity (name + deck). The shell markup ships the Coverage
 * strings as the initial paint; every navigation repaints them here so Regimen and
 * Scanner no longer inherit the Coverage title/deck (each demo carries its own).
 */
const WORKSPACE_HEADERS: Partial<Record<WorkspaceTarget, { name: string; deck: string }>> = {
  coverage: { name: 'Coverage', deck: 'Every essential Wallach named, measured against what you take.' },
  regimen: { name: 'Regimen', deck: 'A calm, coverage-led cockpit: one gauge over your 90, your save-slots switch across the top, your best next moves sit below.' },
  scanner: { name: 'Scanner', deck: 'Scan \u2192 Confirm \u2192 Result \u2014 the verdict fires only on reads you confirm.' },
};

function setTopbarHeader(target: WorkspaceTarget): void {
  const head = WORKSPACE_HEADERS[target];
  if (head === undefined) {
    return;
  }
  const nameEl = document.querySelector<HTMLElement>('.topbar__breadcrumb .np__name');
  const deckEl = document.querySelector<HTMLElement>('.topbar__breadcrumb .np__deck');
  if (nameEl !== null) {
    nameEl.textContent = head.name;
  }
  if (deckEl !== null) {
    deckEl.textContent = head.deck;
  }
}

// ─── Drawers (Knowledge · K) ──────────────────────────────

/** The structural subset of each view's DrawerHandle that the shell drives. */
interface DrawerHandle {
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  /** Knowledge only — open the drawer at an entity page (Ask-Wallach "Learn More"). */
  openEntity?: (kind: 'essential' | 'condition' | 'product' | 'topic', slug: string) => void;
}

/** One overlay drawer: a rail target, its mount slot, and a bare-key toggle. */
interface DrawerSpec {
  target: WorkspaceTarget;
  mountId: string;
  key: string;
  mount: (el: HTMLElement) => DrawerHandle;
}

const DRAWER_SPECS: readonly DrawerSpec[] = [
  { target: 'search', mountId: 'drawer-search-mount', key: 's', mount: searchView.mount },
  { target: 'knowledge', mountId: 'drawer-knowledge-mount', key: 'k', mount: knowledgeView.mount },
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
  setTopbarHeader(target);
  events.emit('rail:navigate', { target });

  hideAllNewMounts();

  if (target === 'coverage') {
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

// ─── Drawer mounting + wiring (Knowledge · K) ──────────────────────────

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

/** Esc closes any open drawer; a bare drawer key (K) toggles it. */
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
 * Ask-Wallach "Learn More" → the Knowledge detail page. The search popup emits knowledge:open-entity;
 * here we perform the single-drawer swap (close search, open Knowledge at the entity, sync the rail)
 * so the one-overlay-at-a-time invariant holds.
 */
function wireSearchToKnowledge(): void {
  events.on('knowledge:open-entity', ({ kind, slug }) => {
    closeAllDrawers();
    drawerHandles.get('knowledge')?.openEntity?.(kind, slug);
    syncDrawerRail();
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

/** The topbar "Ask Wallach" button — the always-visible, inviting entry that opens the Search drawer. */
function wireTopbarSearch(): void {
  const btn = document.querySelector<HTMLElement>('.topbar__ask');
  if (btn === null) {
    return;
  }
  btn.addEventListener('click', () => toggleDrawer('search'));
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

  // Install the §31 bridges (window.* chokepoints + slot ops) so DOM handlers
  // and headless probes can reach them. This was dead code until P3 — defined in
  // state/regimen.ts but never called — so window.addSlot etc. were undefined.
  try {
    regimenState.installBridges();
  }
  catch (e) {
    console.warn('[main] installBridges threw:', e);
  }

  wireRail();
  // Cross-workspace jumps dispatched by views (coverage -> regimen, regimen -> scanner).
  window.addEventListener('wallach:navigate', (ev) => {
    const detail = (ev as CustomEvent<{ to?: string }>).detail;
    const to = detail?.to;
    if (to === 'coverage' || to === 'regimen' || to === 'scanner') {
      navigateTo(to);
    }
  });
  wireProfileChip();
  wireProfileIdentity();
  wireWelcome();
  wireTopbarSearch();
  mountDrawers();
  wireDrawerKeys();
  // The rail highlight is DERIVED from drawer open-state, so it must re-sync on every
  // close path — including the drawer's own [X], which the shell never sees.
  events.on('drawer:toggled', () => syncDrawerRail());
  wireSearchToKnowledge();
  initGlossTooltip();

  /*
   * Default landing: Coverage (the new view). Defer one tick so legacy JS
   * finishes its own DOMContentLoaded work first.
   */
  setTimeout(() => navigateTo('coverage'), 0);
}


/**
 * Paint the rail's identity slot from persisted state.
 *
 * The shell used to hardcode the string "Luneth" (and the avatar "L") straight into
 * dashboard.html. That is a value living in the markup where nothing can reach it: it
 * cannot reflect a user's choice, it cannot be re-rendered, and it is wrong for every
 * user who is not Luneth. Luneth 2026-07-15: the browsing default is "You" on the profile
 * tab, "Codex" in the top-left brand slot -- both derived in ONE place
 * (state/profile.ts::displayName) so the two slots cannot drift apart.
 *
 * Subscribes to `profile:changed` so a later name change repaints without the caller
 * having to remember to (§31: the cascade is the discipline).
 */
function wireProfileIdentity(): void {
  const paint = (): void => {
    const p = profileState.loadUserProfile();
    document.title = profileState.displayTitle(p);
    const nameEl = document.getElementById('railProfileName');
    const avEl = document.getElementById('railAvatar');
    const brandEl = document.getElementById('railBrandName');
    if (nameEl !== null) {
      // textContent, never innerHTML: the name is the app's only free-text field, and
      // escape-by-default is what actually stops script injection here (the Zod schema
      // is the second layer, not the first). See core/schemas/profile.ts.
      nameEl.textContent = profileState.displayName(p, 'profile');
    }
    if (avEl !== null) {
      avEl.textContent = profileState.displayInitial(p);
    }
    const subEl = document.getElementById('railBrandSub');
    if (subEl !== null) {
      // Derived from the sealed corpus at boot — see state/corpus.ts::claimCount.
      subEl.textContent = `Corpus · ${corpusState.claimCount().toLocaleString()} entries`;
    }
    if (brandEl !== null) {
      // The BRAND slot (2026-07-16). It hardcoded the literal "LUNETH" in dashboard.html
      // — a value living in markup where nothing can reach it, and wrong for every user who
      // is not Luneth. displayName's 'brand' slot existed for exactly this and had no
      // caller; both slots derive from ONE place so they cannot drift apart.
      brandEl.textContent = profileState.displayName(p, 'brand');
    }
  };
  paint();
  events.on('profile:changed', paint);
}

/**
 * The arrival veil — mounted ONLY when the user has never been asked (state/profile.ts's
 * tri-state). Also re-openable as a goal picker: the Coverage strip's "+ ADD" fires
 * `wallach:open-welcome`, because a button labelled "+ ADD" that adds nothing is the
 * PROFILE lesson inverted — a label is a promise.
 */
function wireWelcome(): void {
  const host = document.getElementById('welcomeHost');
  if (host === null) {
    return;
  }
  // NO onDone re-render callback, deliberately: the veil's exit writes through the §31
  // chokepoints (saveUserProfile → 'profile:changed', saveRgUserGoals → 'regimen:changed'),
  // and both surfaces already subscribe. The cascade IS the discipline — a manual re-render
  // here would be a second, ad-hoc path doing what the chokepoint does for free, and it
  // would rot the moment the event contract changed.
  const open = (): void => {
    welcomeView.mount(host);
  };
  if (welcomeView.shouldShowWelcome()) {
    open();
  }
  window.addEventListener('wallach:open-welcome', open);
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
else {
  bootstrap();
}
