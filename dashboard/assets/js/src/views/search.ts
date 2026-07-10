/**
 * views/search.ts — Search drawer (the "Ask-Wallach" surface)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer (mirrors the Knowledge drawer chrome, own sr-*
 * namespace + drawer-search.css so nothing leaks). Three render modes on ONE surface:
 *   - LANDING (empty query): a browse grid of every registered entity (icon · name ·
 *     type · claim count) — click a card to open its entity page.
 *   - ENTITY PAGE (query = a subject): a product-detail-style panel — header then one
 *     collapsible section per FACET (order tailored per entity type), each an FAQ list of
 *     question rows that expand to answer + verbatim + cite + RELATED pills.
 *   - ASK ANSWER (query = a question): the demo's ask-result card.
 *
 * ONE pill rule (renderPill): anywhere a slug is referenced (a claim's related entities, an
 * entity's related list), the pill is CLICKABLE + navigable iff that slug resolves to an entity
 * that has a page; otherwise it is a plain chip. So pills light up automatically as entities are
 * authored — no per-site wiring, no duplication (the structure decides). A nav back-stack lets
 * "‹ BACK" return to the previous card. Retrieval + data come from state/search.ts (offline, no LLM).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { SearchClaim } from '../core/schemas/index.js';
import {
  claimCount,
  composeCite,
  displayName,
  type EntitySummary,
  entityList,
  type FacetGroup,
  facetGroups,
  getEntity,
  indexTotals,
  resolveQuery,
  type SearchResult,
} from '../state/search.js';
import { glossify } from './glossify.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

/** Collapse OCR line-wrap whitespace so a verbatim quote reads as clean prose. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Per-type tile icons (author-vetted constant SVGs; monochrome line icons, inherit the tile
 * color). Used for entities WITHOUT an atomic symbol — elements/minerals keep their symbol.
 */
const TYPE_ICON: Record<string, string> = {
  substance: '<svg viewBox="0 0 24 24"><path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z"/><circle cx="12" cy="12" r="2.2"/></svg>',
  condition: '<svg viewBox="0 0 24 24"><path d="M2 12h4.5l2.5-6 4 13 2.5-7H22"/></svg>',
  concept: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.4"/><circle cx="6" cy="17" r="2.4"/><circle cx="18" cy="17" r="2.4"/><path d="M12 8.4 6.9 14.8M12 8.4l5.1 6.4M8.3 17h7.4"/></svg>',
  topic: '<svg viewBox="0 0 24 24"><path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8" cy="8" r="1.4"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/></svg>',
  nutrient: '<svg viewBox="0 0 24 24"><path d="M12 3.5c3.8 4.6 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.2-5.9 6-10.5z"/></svg>',
};

/**
 * Entity-SPECIFIC icon overrides (checked before the type icon) — for entities whose subject
 * deserves a bespoke mark. Color Therapy gets a full-color 6-segment wheel (the one deliberately
 * NOT monochrome; drawer-search.css opts .sr-icon-wheel out of the mono stroke rule). Luneth 2026-07-09.
 */
const ENTITY_ICON: Record<string, string> = {
  color_therapy: '<svg viewBox="0 0 24 24" class="sr-icon-wheel"><path fill="#e5484d" d="M12 12L12 3A9 9 0 0 1 19.79 7.5Z"/><path fill="#f5892a" d="M12 12L19.79 7.5A9 9 0 0 1 19.79 16.5Z"/><path fill="#ffc531" d="M12 12L19.79 16.5A9 9 0 0 1 12 21Z"/><path fill="#4ca259" d="M12 12L12 21A9 9 0 0 1 4.21 16.5Z"/><path fill="#4a7dff" d="M12 12L4.21 16.5A9 9 0 0 1 4.21 7.5Z"/><path fill="#9159f0" d="M12 12L4.21 7.5A9 9 0 0 1 12 3Z"/></svg>',
};

/** The tile face: an atomic symbol if the entity has one, else a bespoke entity icon, else the
 *  per-type icon, else a first letter. */
function tileGlyph(slug: string, e: { symbol?: string | null | undefined; type: string; display_name: string }): string {
  if (typeof e.symbol === 'string' && e.symbol.length > 0) {
    return escHTML(e.symbol);
  }
  return ENTITY_ICON[slug] ?? TYPE_ICON[e.type] ?? escHTML(e.display_name.charAt(0));
}

/**
 * The ONE pill primitive. A slug that resolves to an entity WITH a page becomes a clickable link
 * (navigates via the shared data-sr-entity handler → nav push); otherwise a plain chip. displayName
 * is the single source for the label. Used by both the per-claim RELATED row and the per-entity
 * RELATED list, so every pill everywhere behaves identically with zero duplicated logic.
 */
function renderPill(slug: string): string {
  const name = escHTML(displayName(slug));
  if (getEntity(slug) !== null) {
    return `<button class="sr-pill sr-pill--link" data-sr-entity="${escHTML(slug)}" title="Open ${name}">${name}</button>`;
  }
  return `<span class="sr-pill" title="Related to this">${name}</span>`;
}

/** The entities a claim connects to: authored also_about + its dual-home tier-1 links, deduped,
 *  minus the claim's own subject (no self-links). Ordered also_about → essentials → conditions → symptoms. */
function claimRelatedSlugs(claim: SearchClaim): string[] {
  const seen = new Set<string>([claim.subject]);
  const out: string[] = [];
  const add = (slugs: readonly string[] | undefined): void => {
    for (const s of slugs ?? []) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  };
  add(claim.also_about);
  add(claim.tier1_link?.essentials);
  add(claim.tier1_link?.conditions);
  add(claim.tier1_link?.symptoms);
  return out;
}

/** A claim's RELATED row — the cross-reference pills (was the confusing "ALSO TIER-1"). */
function renderClaimRelated(claim: SearchClaim): string {
  const slugs = claimRelatedSlugs(claim);
  if (slugs.length === 0) {
    return '';
  }
  const pills = slugs.map(renderPill).join('');
  return `<div class="sr-claim__related"><span class="sr-related__label">RELATED</span>${pills}</div>`;
}

function topicTags(claim: SearchClaim): string {
  if (claim.topics.length === 0) {
    return '';
  }
  const tags = claim.topics.map(t => `<span class="sr-tag">#${escHTML(t)}</span>`).join('');
  return `<div class="sr-claim__tags">${tags}</div>`;
}

/**
 * The answer, glossified; if the claim carries an in-answer cross-reference, the first
 * occurrence of its phrase becomes a link that jumps to the target claim's card (same page).
 */
function renderAnswer(claim: SearchClaim): string {
  const xref = claim.see_also;
  if (xref !== undefined && claim.answer.includes(xref.phrase)) {
    const i = claim.answer.indexOf(xref.phrase);
    const before = claim.answer.slice(0, i);
    const after = claim.answer.slice(i + xref.phrase.length);
    const link = `<button type="button" class="sr-xref" data-sr-jump="${escHTML(xref.target)}" title="Jump to the full answer">${escHTML(xref.phrase)}</button>`;
    return glossify(before) + link + glossify(after);
  }
  return glossify(claim.answer);
}

/** The expandable innards shared by an entity-page row + (minus the summary) the Ask card. */
function claimDetail(claim: SearchClaim): string {
  return `
      <div class="sr-claim__short">${escHTML(claim.answer_short)}</div>
      <div class="sr-claim__answer">${renderAnswer(claim)}</div>
      <blockquote class="sr-claim__verbatim">“${glossify(oneLine(claim.verbatim))}”</blockquote>
      <div class="sr-claim__cite">${escHTML(composeCite(claim))}</div>
      ${renderClaimRelated(claim)}
      ${topicTags(claim)}`;
}

/** One FAQ row: the question is the summary; expanding reveals the full answer + verbatim + cite. */
function renderClaimRow(claim: SearchClaim): string {
  return `
    <details class="sr-claim" data-sr-claim="${escHTML(claim.id)}">
      <summary class="sr-claim__summary">
        <span class="sr-claim__badge">?</span>
        <span class="sr-claim__qblock">
          <span class="sr-claim__q">${escHTML(claim.question)}</span>
          <span class="sr-claim__preview">${escHTML(claim.answer_short)}</span>
        </span>
        <span class="sr-claim__chev">›</span>
      </summary>
      <div class="sr-claim__body">${claimDetail(claim)}</div>
    </details>`;
}

function renderFacet(group: FacetGroup): string {
  const rows = group.claims.map(renderClaimRow).join('');
  return `
    <details class="sr-facet" data-facet="${escHTML(group.facet)}" open>
      <summary class="sr-facet__head">
        <span class="sr-facet__label">${escHTML(group.label)}</span>
        <span class="sr-facet__count">${group.claims.length}</span>
      </summary>
      <div class="sr-facet__body">${rows}</div>
    </details>`;
}

/** The entity-level RELATED list — curated cross-links for the whole entity (same pill rule). */
function renderRelated(subject: string): string {
  const e = getEntity(subject);
  if (e === null || e.related.length === 0) {
    return '';
  }
  const pills = e.related.map(renderPill).join('');
  return `
    <div class="sr-related">
      <span class="sr-related__label">RELATED</span>
      <div class="sr-related__chips">${pills}</div>
    </div>`;
}

/** Browse landing — every registered entity as a card. */
function renderLanding(noMatch: boolean): string {
  const ents = entityList();
  const noteHTML = noMatch
    ? '<div class="sr-note">No direct match — browse the entities below, or try a different word.</div>'
    : '';
  if (ents.length === 0) {
    return '<div class="sr-empty">— no entities in the index yet —</div>';
  }
  const card = (e: EntitySummary): string => `
    <button class="sr-ent-card" data-sr-entity="${escHTML(e.slug)}">
      <span class="sr-ent-card__sym">${tileGlyph(e.slug, e)}</span>
      <span class="sr-ent-card__idblock">
        <span class="sr-ent-card__name">${escHTML(e.display_name)}</span>
        <span class="sr-ent-card__meta">${escHTML(e.type.toUpperCase())} · ${e.claim_count} ENTR${e.claim_count === 1 ? 'Y' : 'IES'}</span>
      </span>
      <span class="sr-ent-card__chev">›</span>
    </button>`;
  return `
    ${noteHTML}
    <div class="sr-landing">
      <div class="sr-landing__eyebrow">BROWSE · ${ents.length} ENTIT${ents.length === 1 ? 'Y' : 'IES'}</div>
      <div class="sr-landing__grid">${ents.map(card).join('')}</div>
    </div>`;
}

function renderEntity(subject: string): string {
  const e = getEntity(subject);
  const groups = facetGroups(subject);
  const n = claimCount(subject);
  if (e === null || groups.length === 0) {
    return '<div class="sr-empty">— nothing to show for this entity yet —</div>';
  }
  const synLine = e.synonyms.length > 0 ? ` · also: ${e.synonyms.map(escHTML).join(', ')}` : '';
  const facetsHTML = groups.map(renderFacet).join('');
  return `
    <div class="sr-entity">
      <header class="sr-entity__head">
        <button class="sr-entity__back" data-sr-action="back" title="Back">‹ BACK</button>
        <div class="sr-entity__sym">${tileGlyph(subject, e)}</div>
        <div class="sr-entity__idblock">
          <h3 class="sr-entity__name">${escHTML(e.display_name)}</h3>
          <div class="sr-entity__meta">${escHTML(e.type.toUpperCase())} · ${n} ENTR${n === 1 ? 'Y' : 'IES'}${escHTML(synLine)}</div>
        </div>
      </header>
      <div class="sr-facets">${facetsHTML}</div>
      ${renderRelated(subject)}
    </div>`;
}

function renderAsk(claim: SearchClaim): string {
  return `
    <div class="sr-ask">
      <div class="sr-ask__badge"><span class="sr-ask__q-mark">?</span> ASK · WALLACH</div>
      <div class="sr-ask__q">${escHTML(claim.question)}</div>
      <div class="sr-ask__detail">${claimDetail(claim)}</div>
      <button class="sr-ask__more" data-sr-entity="${escHTML(claim.subject)}">MORE ON ${escHTML(displayName(claim.subject).toUpperCase())} →</button>
    </div>`;
}

function renderBody(result: SearchResult): string {
  if (result.mode === 'ask' && result.claim !== null) {
    return renderAsk(result.claim);
  }
  if (result.mode === 'entity') {
    return renderEntity(result.subject);
  }
  return renderLanding(result.noMatch);
}

function hexSerial(seed: number): string {
  return ((seed * 0x9E3779B9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
}

function renderShell(): string {
  const totals = indexTotals();
  return `
    <span class="ds-scan-line" aria-hidden="true"></span>
    <header class="sr-head">
      <div>
        <div class="sr-eyebrow"><span class="pulse-dot"></span>DRAWER · <span class="ds-cipher" data-cipher-set="hexa">SR·${hexSerial(totals.claims)}</span></div>
        <h2 class="sr-title">Search</h2>
        <div class="sr-sub">// ask Wallach anything — offline, in his own words</div>
      </div>
      <button class="sr-close" data-sr-action="close" title="Close (Esc)">×</button>
    </header>
    <div class="sr-searchbar">
      <span class="sr-searchbar__icon">⌕</span>
      <input class="sr-searchbar__input" type="text" placeholder="ASK A QUESTION OR NAME A SUBJECT…" autocomplete="off" spellcheck="false" />
      <button class="sr-searchbar__clear" data-sr-action="search-clear" type="button" aria-label="Clear" title="Clear">×</button>
    </div>
    <div class="sr-body"></div>
    <footer class="sr-footer">
      <span class="sr-footer__hint">${totals.entities} ENTIT${totals.entities === 1 ? 'Y' : 'IES'} · ${totals.claims} ENTRIES</span>
      <span class="sr-footer__spacer"></span>
      <button class="sr-action sr-action--expand" data-sr-action="expand"><span class="sr-action__glyph">⤢</span>EXPAND</button>
    </footer>`;
}

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): DrawerHandle {
  let isOpen = false;
  let isExpanded = false;
  let query = '';
  let lastKey = '';
  // Navigation back-stack: each entry is the query we were showing BEFORE a pill/card jump, so
  // "‹ BACK" pops to the previous card (and to the landing when empty). One source of nav truth.
  const navStack: string[] = [];

  const resultKey = (r: SearchResult): string => `${r.mode}|${r.subject}|${r.claim?.id ?? ''}|${r.noMatch}`;

  const paintBody = (force: boolean): void => {
    const result = resolveQuery(query);
    const key = resultKey(result);
    if (!force && key === lastKey) {
      return;
    }
    lastKey = key;
    const body = container.querySelector<HTMLElement>('.sr-body');
    if (body !== null) {
      body.innerHTML = renderBody(result);
      // Every repaint starts at the top: a fresh entity/landing must not inherit the
      // previous view's scroll offset (replacing innerHTML alone does not reset it when
      // the new content is at least as tall). Luneth 2026-07-09.
      body.scrollTop = 0;
    }
  };

  const syncSearchbar = (): void => {
    const input = container.querySelector<HTMLInputElement>('.sr-searchbar__input');
    if (input !== null) {
      input.value = query;
    }
    container.querySelector('.sr-searchbar')?.classList.toggle('has-query', query.trim().length > 0);
  };

  const render = (): void => {
    container.innerHTML = renderShell();
    lastKey = '';
    paintBody(true);
    syncSearchbar();
    const input = container.querySelector<HTMLInputElement>('.sr-searchbar__input');
    if (input !== null) {
      // Focus for immediate typing when opened.
      setTimeout(() => input.focus(), 0);
    }
  };

  const open = (): void => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    container.classList.add('sr-open');
    render();
  };
  const close = (): void => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    isExpanded = false;
    query = '';
    navStack.length = 0;
    container.classList.remove('sr-open', 'sr-expanded');
    container.innerHTML = '';
  };
  const toggle = (): void => {
    if (isOpen) {
      close();
    }
    else {
      open();
    }
  };
  const toggleExpanded = (): void => {
    isExpanded = !isExpanded;
    container.classList.toggle('sr-expanded', isExpanded);
  };

  /** Navigate to an entity page by its slug — push the current view so "‹ BACK" can return here. */
  const gotoEntity = (slug: string): void => {
    navStack.push(query);
    query = displayName(slug);
    syncSearchbar();
    paintBody(true);
  };
  /** Pop one step back — to the previous card, or the landing when the stack is empty. */
  const goBack = (): void => {
    query = navStack.pop() ?? '';
    syncSearchbar();
    paintBody(true);
  };
  /** Reset to the browse landing (clears the nav chain). */
  const gotoHome = (): void => {
    query = '';
    navStack.length = 0;
    syncSearchbar();
    paintBody(true);
  };

  /**
   * Jump to another claim's card on the current page (an in-answer cross-reference): open it +
   * any collapsed ancestor <details>, scroll it into view, and flash it so the eye lands on it.
   */
  const jumpToClaim = (id: string): void => {
    const el = container.querySelector<HTMLElement>(`[data-sr-claim="${id}"]`);
    if (el === null) {
      return;
    }
    for (let d: HTMLElement | null = el; d !== null; d = d.parentElement) {
      if (d instanceof HTMLDetailsElement) {
        d.open = true;
      }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('sr-claim--flash');
    setTimeout(() => el.classList.remove('sr-claim--flash'), 1400);
  };

  // ─── Events ──────────────────────────────────────────────────────────────

  container.addEventListener('input', (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null || !t.classList.contains('sr-searchbar__input')) {
      return;
    }
    // A manually-typed query is a fresh search — reset the nav chain so BACK goes to the landing.
    query = (t as HTMLInputElement).value;
    navStack.length = 0;
    container.querySelector('.sr-searchbar')?.classList.toggle('has-query', query.trim().length > 0);
    paintBody(false);
  });

  container.addEventListener('click', (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const jumpEl = target.closest<HTMLElement>('[data-sr-jump]');
    if (jumpEl !== null) {
      jumpToClaim(jumpEl.getAttribute('data-sr-jump') ?? '');
      return;
    }
    const entBtn = target.closest<HTMLElement>('[data-sr-entity]');
    if (entBtn !== null) {
      gotoEntity(entBtn.getAttribute('data-sr-entity') ?? '');
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-sr-action]');
    if (actionEl !== null) {
      const action = actionEl.getAttribute('data-sr-action');
      if (action === 'close') {
        close();
      }
      else if (action === 'expand') {
        toggleExpanded();
      }
      else if (action === 'back') {
        goBack();
      }
      else if (action === 'search-clear') {
        gotoHome();
        container.querySelector<HTMLInputElement>('.sr-searchbar__input')?.focus();
      }
    }
  });

  return {
    open,
    close,
    toggle,
    toggleExpanded,
    isOpen: () => isOpen,
  };
}
