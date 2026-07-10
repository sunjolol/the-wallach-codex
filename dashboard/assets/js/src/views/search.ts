/**
 * views/search.ts — Search drawer (the "Ask-Wallach" surface)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer (mirrors the Knowledge drawer chrome, own sr-*
 * namespace + drawer-search.css so nothing leaks). Three render modes on ONE surface
 * (blueprint §5):
 *   - LANDING (empty query): a browse grid of every registered entity (symbol · name ·
 *     type · claim count) — click a card to open its entity page.
 *   - ENTITY PAGE (query = a subject): a product-detail-style panel — header (symbol ·
 *     display_name · type · claim count · synonyms) then one collapsible section per FACET
 *     the entity has (BASICS · HOW IT WORKS · SOURCES …), each an FAQ list of question rows
 *     that expand to answer + verbatim + cite.
 *   - ASK ANSWER (query = a question): the demo's ask-result — a ? badge, the question,
 *     the short + full answer, an italic Wallach verbatim, a mono cite, and "MORE ON
 *     {SUBJECT}" back to the entity page.
 *
 * Retrieval + data come from state/search.ts (pure, offline, no LLM) reading the ONE derived
 * search index. §00 Zod boundary: all reads pass through core/schemas/search before field access.
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

/** A claim's dual-home chips — the operational tabs it also feeds (derived from the sealed claim). */
function tier1Chips(claim: SearchClaim): string {
  const link = claim.tier1_link;
  if (link === undefined) {
    return '';
  }
  const chips: string[] = [];
  for (const slug of link.essentials ?? []) {
    chips.push(`<span class="sr-t1 sr-t1--ess" title="Also an operational essential in Coverage/Knowledge">${escHTML(displayName(slug))}</span>`);
  }
  for (const slug of link.conditions ?? []) {
    chips.push(`<span class="sr-t1 sr-t1--cond" title="Also an indexed condition in Knowledge">${escHTML(displayName(slug))}</span>`);
  }
  if (chips.length === 0) {
    return '';
  }
  return `<div class="sr-claim__tier1"><span class="sr-claim__tier1-label">ALSO TIER-1</span>${chips.join('')}</div>`;
}

function topicTags(claim: SearchClaim): string {
  if (claim.topics.length === 0) {
    return '';
  }
  const tags = claim.topics.map(t => `<span class="sr-tag">#${escHTML(t)}</span>`).join('');
  return `<div class="sr-claim__tags">${tags}</div>`;
}

/** The expandable innards shared by an entity-page row + (minus the summary) the Ask card. */
function claimDetail(claim: SearchClaim): string {
  return `
      <div class="sr-claim__short">${escHTML(claim.answer_short)}</div>
      <div class="sr-claim__answer">${escHTML(claim.answer)}</div>
      <blockquote class="sr-claim__verbatim">“${escHTML(oneLine(claim.verbatim))}”</blockquote>
      <div class="sr-claim__cite">${escHTML(composeCite(claim))}</div>
      ${tier1Chips(claim)}
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

function renderRelated(subject: string): string {
  const e = getEntity(subject);
  if (e === null || e.related.length === 0) {
    return '';
  }
  const chips = e.related.map((slug) => {
    // A related entity that IS in the registry is a clickable cross-link; otherwise a plain chip.
    const known = getEntity(slug) !== null;
    return known
      ? `<button class="sr-related__chip sr-related__chip--link" data-sr-entity="${escHTML(slug)}" title="Open ${escHTML(displayName(slug))}">${escHTML(displayName(slug))}</button>`
      : `<span class="sr-related__chip" title="Related">${escHTML(displayName(slug))}</span>`;
  }).join('');
  return `
    <div class="sr-related">
      <span class="sr-related__label">RELATED</span>
      <div class="sr-related__chips">${chips}</div>
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
      <span class="sr-ent-card__sym">${escHTML(e.symbol ?? e.display_name.charAt(0))}</span>
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
        <button class="sr-entity__back" data-sr-action="home" title="Back to browse">‹ ALL</button>
        <div class="sr-entity__sym">${escHTML(e.symbol ?? e.display_name.charAt(0))}</div>
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

  /** Navigate to an entity page by setting the query to its display name (entityHit resolves it). */
  const gotoEntity = (slug: string): void => {
    query = displayName(slug);
    syncSearchbar();
    paintBody(true);
  };
  /** Return to the browse landing. */
  const gotoHome = (): void => {
    query = '';
    syncSearchbar();
    paintBody(true);
  };

  // ─── Events ──────────────────────────────────────────────────────────────

  container.addEventListener('input', (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null || !t.classList.contains('sr-searchbar__input')) {
      return;
    }
    query = (t as HTMLInputElement).value;
    container.querySelector('.sr-searchbar')?.classList.toggle('has-query', query.trim().length > 0);
    paintBody(false);
  });

  container.addEventListener('click', (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
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
      else if (action === 'home') {
        gotoHome();
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
