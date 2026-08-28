/**
 * main.ts — the dashboard entry point.
 * ═══════════════════════════════════════════════════════════════════════════
 * The single module esbuild bundles into assets/js/dist/main.js, and the only
 * script dashboard.html loads. It wires the app shell: mounts each workspace
 * view into its slot, drives the rail and the two drawers, opens the profile
 * overlay, and paints the identity chip.
 *
 * installRecomputeTrigger() runs once at boot so Coverage stays in sync with
 * every Regimen mutation.
 *
 * Note on module side effects: state/scanner.ts and state/ocr.ts install their
 * window.lcScan* bridges at module load. They are NOT imported here — they
 * reach the bundle through views/scanner.ts, which imports them directly.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as events from './core/events.js';

import * as corpusState from './state/corpus.js';
import { hydrateCorpus } from './state/corpus.js';
import { installRecomputeTrigger } from './state/coverage.js';
import { loadSplit, prefetchSplit, SPLIT_DATA } from './state/data-split.js';
import { hydrateLogEmbed } from './state/log.js';
import { hydrateSearchIndex } from './state/search.js';
import * as profileState from './state/profile.js';
import * as regimenState from './state/regimen.js';

import * as coverageView from './views/coverage.js';
import * as knowledgeView from './views/knowledge.js';
import * as profileView from './views/profile.js';
import * as regimenView from './views/regimen.js';
import * as scannerView from './views/scanner.js';
import * as searchView from './views/search.js';
import { installFilterSheet } from './views/filter-sheet.js';
import { initGlossTooltip } from './views/gloss-tooltip.js';
import * as welcomeView from './views/welcome.js';

// ─── Rail navigation state ────────────────────────────────────────────────

type WorkspaceTarget = 'coverage' | 'regimen' | 'scanner' | 'search' | 'knowledge';

interface MountedView {
  unmount: () => void;
}

/** Tracks each workspace's mount handle for unmount on switch-away. */
const mounted: Partial<Record<WorkspaceTarget, MountedView>> = {};

/** Per-workspace scrollTop — the three workspaces share one .app-workspace scroll
 *  container, so switching views and back would otherwise dump you at the top. */
const scrollByView: Partial<Record<WorkspaceTarget, number>> = {};
let currentWorkspace: WorkspaceTarget | null = null;

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
 * strings as the initial paint; every navigation repaints them here, so Regimen and
 * Scanner do not inherit the Coverage title/deck.
 */
const WORKSPACE_HEADERS: Partial<Record<WorkspaceTarget, { name: string; deck: string }>> = {
  coverage: { name: 'Coverage', deck: 'Every essential Wallach named, measured against what you take.' },
  regimen: { name: 'Regimen', deck: 'Design your own protocols based on your goals + Import and export regimens for yourself or others' },
  scanner: { name: 'Scanner', deck: 'Scan a label to see how your favorite supplements stack up against your goals, or type/paste ingredients to see if it\'s safe' },
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

// ─── Overlay drawers (Search · S, Knowledge · K) ───────────

/** The structural subset of each view's DrawerHandle that the shell drives. */
interface DrawerHandle {
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  /** Knowledge only — open the drawer at an entity page (Ask-Wallach "Learn More"). */
  openEntity?: (kind: 'essential' | 'condition' | 'product' | 'topic', slug: string) => void;
  openTab?: (tab: 'home' | 'foods' | 'orac' | 'essentials' | 'conditions' | 'explore' | 'products') => void;
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

/**
 * Close the phone's GOALS popover, set by wireGoalsToggle.
 *
 * Module-level because navigateTo has to be able to call it: the popover BORROWS the Coverage
 * mount (see wireGoalsToggle), and a workspace switch resets every mount's display — leaving the
 * body classes claiming a popover that is no longer on screen.
 */
let closeGoalsPopover: () => void = () => { /* until wireGoalsToggle runs */ };

function navigateTo(target: WorkspaceTarget): void {
  // Switching workspace closes any open drawer overlay.
  closeAllDrawers();
  closeGoalsPopover();
  activateRailItem(target);
  setTopbarHeader(target);
  events.emit('rail:navigate', { target });

  // Remember where you were in the outgoing view before hiding it.
  const ws = document.querySelector<HTMLElement>('.app-workspace');
  if (ws !== null && currentWorkspace !== null && currentWorkspace !== target) {
    scrollByView[currentWorkspace] = ws.scrollTop;
  }
  currentWorkspace = target;

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
    if (ws !== null) {
      ws.scrollTop = scrollByView[target] ?? 0;
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
    if (ws !== null) {
      ws.scrollTop = scrollByView[target] ?? 0;
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
    if (ws !== null) {
      ws.scrollTop = scrollByView[target] ?? 0;
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

// ─── Drawer mounting + wiring (Search · S, Knowledge · K) ──────────────

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
 * Pull the corpus + search index in the web build, hydrate them, and tell the rail its
 * derived count is knowable now. Idempotent: loadSplit caches per key, so the second and
 * later calls are the same settled promise and the hydrators are cheap re-parses.
 */
async function ensureKnowledgeData(): Promise<void> {
  if (!SPLIT_DATA) {
    return;
  }
  const [corpusRaw, indexRaw] = await Promise.all([
    loadSplit('corpus-embed'),
    loadSplit('search/search-index'),
  ]);
  if (corpusRaw !== null) {
    hydrateCorpus(corpusRaw);
    events.emit('corpus:hydrated', { claimCount: corpusState.claimCount() });
  }
  if (indexRaw !== null) {
    hydrateSearchIndex(indexRaw);
  }
}

/**
 * Toggle one drawer. Only one overlay is open at a time, so opening one closes
 * the others first.
 */
async function toggleDrawer(target: WorkspaceTarget): Promise<void> {
  const handle = drawerHandles.get(target);
  if (handle === undefined) {
    return;
  }
  /*
   * Search and Knowledge are the only surfaces that read the corpus or the search index,
   * which is what makes them splittable at all — Coverage, Regimen and Scanner never touch
   * either. The web build fetches both, so wait here before opening: the drawer's open()
   * calls render() every time, so data that lands before this resolves is data the first
   * paint of the drawer already has. Boot prefetched them, so this is normally settled.
   * No-op in the file build.
   */
  await ensureKnowledgeData();
  for (const [other, h] of drawerHandles) {
    if (other !== target) {
      h.close();
    }
  }
  handle.toggle();
  syncDrawerRail();
}

/** Global keys: Esc closes any open drawer, bare 1/2/3 jump to a workspace, and a
 *  bare drawer key (S/K) toggles that drawer. */
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
    // A blocking overlay (arrival veil / profile console) owns the screen — a bare-key
    // drawer shortcut must not toggle a drawer behind it and leave it open once the modal closes.
    const modalOpen = (document.getElementById('welcomeHost')?.children.length ?? 0) > 0
      || document.querySelector('.pf-overlay') !== null;
    if (modalOpen) {
      return;
    }
    // Bare digit keys 1/2/3 jump to the three workspaces, matching the rail chips.
    // Deliberately unmodified: the guard just above rejects every modifier, and
    // Cmd/Ctrl+digit is browser-reserved anyway — so these behave exactly like S/K.
    const workspaceByDigit: Partial<Record<string, WorkspaceTarget>> = { 1: 'coverage', 2: 'regimen', 3: 'scanner' };
    const digitTarget = workspaceByDigit[ev.key];
    if (digitTarget !== undefined) {
      ev.preventDefault();
      navigateTo(digitTarget);
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
  // Same single-drawer swap, but landing on a TAB. The Regimen console's completion
  // state uses it to send a fully-covered user to Products.
  events.on('knowledge:open-tab', ({ tab }) => {
    closeAllDrawers();
    drawerHandles.get('knowledge')?.openTab?.(tab);
    syncDrawerRail();
  });
}

// ─── Profile panel ─────────────────────────────────────────────────────────

let profileHandle: { unmount: () => void } | null = null;
let profileOverlay: HTMLElement | null = null;
let profileTrigger: HTMLElement | null = null;

/** Focusable controls inside the profile modal — the focus trap cycles within these. */
const PF_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function hideProfilePanel(): void {
  if (profileHandle !== null) {
    profileHandle.unmount();
    profileHandle = null;
  }
  if (profileOverlay !== null) {
    profileOverlay.remove();
    profileOverlay = null;
  }
  // A11y: return focus to the control that opened the panel, not to <body> (focus-restore).
  if (profileTrigger !== null) {
    profileTrigger.focus();
    profileTrigger = null;
  }
}

async function showProfilePanel(): Promise<void> {
  if (profileOverlay !== null) {
    return;
  }
  // Remember what to hand focus back to on close (a11y focus-restore). Captured BEFORE the
  // await below — read after it, this would see wherever focus drifted while the fetch ran.
  profileTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  /*
   * The web build ships the Creator's Log as a fetched file instead of ~1 MB of first paint,
   * so the panel waits for it here. Boot already prefetched it, so this is normally an
   * already-settled promise; a cold miss pays the wait once. No-op in the file build, where
   * the embed is inlined and SPLIT_DATA is false.
   */
  if (SPLIT_DATA) {
    const raw = await loadSplit('creators-log-embed');
    if (raw !== null) {
      hydrateLogEmbed(raw);
    }
  }
  const overlay = document.createElement('div');
  overlay.className = 'pf-overlay';
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) {
      hideProfilePanel();
    }
  });
  overlay.addEventListener('pf:close', () => hideProfilePanel());
  // Trap Tab inside the dialog: aria-modal is advisory, so without this focus would fall to
  // the obscured-but-still-focusable rail/topbar behind the overlay.
  overlay.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') {
      return;
    }
    const panel = overlay.querySelector<HTMLElement>('.pf-panel');
    if (panel === null) {
      return;
    }
    const items = [...panel.querySelectorAll<HTMLElement>(PF_FOCUSABLE)].filter(el => el.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    }
    else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  });
  document.body.appendChild(overlay);
  profileOverlay = overlay;
  profileHandle = profileView.mount(overlay);
  // Move focus INTO the dialog so a keyboard/SR user is placed inside the modal, not left on
  // the now-obscured trigger (focus-in). The panel is a programmatic focus target.
  const panel = overlay.querySelector<HTMLElement>('.pf-panel');
  if (panel !== null) {
    panel.tabIndex = -1;
    panel.focus();
  }
}

/** The topbar "Ask Wallach" button — the always-visible, inviting entry that opens the Search drawer. */
function wireTopbarSearch(): void {
  const btn = document.querySelector<HTMLElement>('.topbar__ask');
  if (btn === null) {
    return;
  }
  btn.addEventListener('click', () => void toggleDrawer('search'));
}

/**
 * The topbar "Goals" button — PHONE ONLY, and hidden at every other width by
 * `.topbar__goals { display: none }` in dashboard.css.
 *
 * On a phone the coverage goal strip is not worth permanent height: it measured 136px of a
 * 759px usable screen, pinned, for one chip — and two of the three things it offers do not
 * work on a touch device at all (goal focus is bound to mouseover/mouseout; the remove X is
 * revealed on :hover). So the strip becomes a popover and this button is its handle, sitting
 * beside the avatar where it stays reachable no matter how far down the field you have
 * scrolled — which is the job the `position: sticky` used to do.
 *
 * This only ever toggles a class on <body>. It touches no state, so it cannot change a
 * coverage verdict or a count — the same guarantee the goal hover carries.
 */
function wireGoalsToggle(): void {
  const btn = document.querySelector<HTMLElement>('[data-goals-toggle]');
  if (btn === null) {
    return;
  }
  const OPEN = 'goals-open';
  // ★ THE BUTTON DID NOTHING ON REGIMEN AND SCANNER, AND THE REASON IS STRUCTURAL.
  // `.goalstrip` is rendered by views/coverage.ts INSIDE the Coverage workspace. On any other
  // tab that mount is `display: none`, and a `display: none` ancestor hides its subtree no
  // matter what position the popover CSS gives it — so the handle toggled a class and nothing
  // appeared. Reported 2026-08-28.
  // The popover BORROWS the mount rather than moving the strip out of it: coverage.ts binds ONE
  // delegated click listener to that container (per-element handlers would die on every
  // re-render), so a strip re-parented into the shell would keep rendering and stop working —
  // chips that no longer remove, an + ADD that no longer adds, with nothing on screen to say so.
  // Borrowing keeps the node exactly where its listener is. `goals-borrow` is what the phone
  // layer uses to blank the rest of that workspace while the popover is up.
  const BORROW = 'goals-borrow';
  const setOpen = (open: boolean): void => {
    document.body.classList.toggle(OPEN, open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const away = currentWorkspace !== 'coverage';
    const borrow = open && away;
    document.body.classList.toggle(BORROW, borrow);
    if (!away) {
      return;
    }
    const mountEl = document.getElementById('workspace-coverage-mount');
    if (mountEl === null) {
      return;
    }
    // The reader may never have opened Coverage, in which case the mount is EMPTY and the
    // popover would open onto nothing. Mount it on demand — the same call navigateTo makes.
    if (borrow && mounted.coverage === undefined) {
      mounted.coverage = coverageView.mount(mountEl);
    }
    mountEl.style.display = borrow ? 'block' : 'none';
  };
  closeGoalsPopover = () => { if (document.body.classList.contains(OPEN)) { setOpen(false); } };
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    setOpen(!document.body.classList.contains(OPEN));
  });
  // Tapping the field closes it, the way any popover should. The strip itself is excluded, or
  // the first tap on a chip would dismiss the thing you are trying to use.
  document.addEventListener('click', (ev) => {
    if (!document.body.classList.contains(OPEN)) {
      return;
    }
    const t = ev.target as HTMLElement | null;
    if (t !== null && (t.closest('.goalstrip') !== null || t.closest('[data-goals-toggle]') !== null)) {
      return;
    }
    setOpen(false);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && document.body.classList.contains(OPEN)) {
      setOpen(false);
    }
  });
}

function wireProfileChip(): void {
  const chip = document.querySelector<HTMLElement>('.rail__profile');
  if (chip === null) {
    return;
  }
  chip.style.cursor = 'pointer';
  chip.setAttribute('role', 'button');
  chip.setAttribute('tabindex', '0');
  chip.addEventListener('click', () => void showProfilePanel());
  chip.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      void showProfilePanel();
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

  // Publish the regimen chokepoints (the window.* slot ops) so inline DOM handlers and
  // headless probes can reach them. state/regimen.ts only DEFINES them; without this
  // call window.addSlot and friends are undefined.
  try {
    regimenState.installBridges();
  }
  catch (e) {
    console.warn('[main] installBridges threw:', e);
  }

  wireRail();
  // Cross-workspace jumps dispatched by views via the `wallach:navigate` CustomEvent.
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
  wireGoalsToggle();
  mountDrawers();
  wireDrawerKeys();
  // The rail highlight is DERIVED from drawer open-state, so it must re-sync on every
  // close path — including the drawer's own [X], which the shell never sees.
  events.on('drawer:toggled', () => syncDrawerRail());
  wireSearchToKnowledge();
  initGlossTooltip();
  // One delegated listener for every filter row on the page. Bound here rather than per row,
  // because both rows are rebuilt from scratch on every repaint — see views/filter-sheet.ts.
  installFilterSheet();

  /*
   * Default landing: Coverage. Deferred one tick so every listener registered above is
   * installed before the first view mounts and starts emitting.
   */
  setTimeout(() => navigateTo('coverage'), 0);

  /*
   * Web build only: pull the split artifacts now that the first view is queued. Starting
   * here rather than at module scope is the whole point — they must never compete with
   * first paint, only fill in behind it.
   */
  prefetchSplit(['creators-log-embed', 'corpus-embed', 'search/search-index']);
  /*
   * Hydrate as soon as they land rather than only on the first drawer open, so the rail's
   * derived corpus count fills itself in without the user having to go looking for it.
   */
  void ensureKnowledgeData();
}


/**
 * Paint the rail's identity slot from persisted state.
 *
 * No identity string lives in dashboard.html. A name hardcoded into markup cannot
 * reflect the user's choice, cannot be re-rendered, and is wrong for everyone who is
 * not the person who typed it. The browsing defaults are "You" on the profile slot and
 * "Codex" in the brand slot, both derived in ONE place (state/profile.ts::displayName)
 * so the two slots cannot drift apart.
 *
 * Subscribes to `profile:changed` so a later name change repaints without the caller
 * having to remember to — the cascade is the discipline.
 */
function wireProfileIdentity(): void {
  const paint = (): void => {
    const p = profileState.loadUserProfile();
    document.title = profileState.displayTitle(p);
    // Appearance rides on <html>: theme + accent drive theme.css APP-WIDE, applied from this
    // one place so the console, the rail, and every surface flip together.
    document.documentElement.dataset['theme'] = profileState.themeOf(p);
    document.documentElement.dataset['accent'] = profileState.accentOf(p);
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
      // The rail avatar shows the chosen image (a preset or an upload), else the name initial.
      const avSrc = profileState.avatarSrcOf(p);
      if (avSrc !== null) {
        const img = document.createElement('img');
        img.src = avSrc;
        img.alt = '';
        avEl.replaceChildren(img);
      }
      else {
        avEl.replaceChildren(document.createTextNode(profileState.displayInitial(p)));
      }
    }
    const subEl = document.getElementById('railBrandSub');
    if (subEl !== null) {
      /*
       * Derived from the sealed corpus — see state/corpus.ts::claimCount. In the web build
       * the corpus arrives over the wire, and until it does the count is UNKNOWN, not zero:
       * printing "Corpus · 0 entries" would assert a number the app does not have. Show the
       * bare label instead and repaint on 'corpus:hydrated'.
       */
      subEl.textContent = corpusState.isLoaded()
        ? `Corpus · ${corpusState.claimCount().toLocaleString()} entries`
        : 'Corpus';
    }
    if (brandEl !== null) {
      // The brand slot. Derived, never a literal in markup — this and the profile slot
      // come from ONE function (state/profile.ts::displayName) so they cannot drift apart.
      brandEl.textContent = profileState.displayName(p, 'brand');
    }
  };
  paint();
  events.on('profile:changed', paint);
  // The corpus count is derived, so it cannot be painted until the corpus exists.
  events.on('corpus:hydrated', paint);
}

/**
 * The arrival veil — mounted ONLY when the user has never been asked (state/profile.ts's
 * tri-state). Also re-openable as a goal picker: the "+ ADD" controls in the Coverage
 * strip and the Regimen view both fire `wallach:open-welcome`, because a button labelled
 * "+ ADD" that adds nothing breaks the promise its label makes.
 */
function wireWelcome(): void {
  const host = document.getElementById('welcomeHost');
  if (host === null) {
    return;
  }
  // NO onDone re-render callback, deliberately: the veil's exit writes through the
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
