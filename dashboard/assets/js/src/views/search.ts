/**
 * views/search.ts — Ask-Wallach (the centered green command-palette popup)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ONE surface, four render modes over the derived search index (state/search.ts, offline, no LLM):
 *   - OPENING (empty query): "browse by kind of answer" — the five facet-FAMILY cards.
 *   - QUESTION (a plain-language query): a best-answer card (Wallach's exact words in the one serif)
 *     + colour-coded "more answers" rows + a "keep exploring" topic card.
 *   - TOPIC (a query that exactly names an entity): its page — hero + every answer grouped by facet.
 *   - EMPTY (a query that matches nothing): a calm dead-end with real suggestion chips.
 *
 * Colour is DATA-DRIVEN, never a TS colour literal (view_category_not_hardcoded): a result element
 * carries data-facet (→ its family colour) or data-type (→ its entity-type colour); drawer-search.css
 * maps both to --k. Book sourcing stays SILENT everywhere — verbatims are attributed to the person,
 * never a title/year. The host is the scrim; `.scr` (data-aw-pop) is the panel — click outside closes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { SearchClaim, SearchEntity } from '../core/schemas/index.js';
import { emit } from '../core/events.js';
import { facetLabel, ui } from '../state/copy.js';
import { getConditionPage, getEssentialPage } from '../state/entity-page.js';
import {
  claimCount,
  displayName,
  type EntityAnswer,
  type EntityFamily,
  entityFamilies,
  entityList,
  type EntitySummary,
  type FamilyCount,
  familyCounts,
  getEntity,
  isChargedEntity,
  relatedSlugs,
  resolveQuery,
  type SearchResult,
  subjectFacetHints,
} from '../state/search.js';
import { glossify } from './glossify.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
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
 * colour). Used for entities WITHOUT an atomic symbol — elements/minerals keep their symbol.
 */
const TYPE_ICON: Record<string, string> = {
  substance: '<svg viewBox="0 0 24 24"><path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z"/><circle cx="12" cy="12" r="2.2"/></svg>',
  condition: '<svg viewBox="0 0 24 24"><path d="M2 12h4.5l2.5-6 4 13 2.5-7H22"/></svg>',
  concept: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.4"/><circle cx="6" cy="17" r="2.4"/><circle cx="18" cy="17" r="2.4"/><path d="M12 8.4 6.9 14.8M12 8.4l5.1 6.4M8.3 17h7.4"/></svg>',
  topic: '<svg viewBox="0 0 24 24"><path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8" cy="8" r="1.4"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/></svg>',
  nutrient: '<svg viewBox="0 0 24 24"><path d="M12 3.5c3.8 4.6 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.2-5.9 6-10.5z"/></svg>',
  // A wide essential (from entity-page, type literal 'essential') with no atomic symbol borrows the
  // nutrient droplet, so its hero glyph is a mark rather than a bare first letter.
  essential: '<svg viewBox="0 0 24 24"><path d="M12 3.5c3.8 4.6 6 7.6 6 10.5a6 6 0 0 1-12 0c0-2.9 2.2-5.9 6-10.5z"/></svg>',
};

/**
 * Entity-SPECIFIC icon overrides (checked before the type icon) — for entities whose subject
 * deserves a bespoke mark. Color Therapy gets a full-colour 6-segment wheel (the one deliberately
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

/** The entities a claim connects to: authored also_about + its dual-home tier-1 links, deduped,
 *  minus the claim's own subject. Ordered also_about → essentials → conditions → symptoms. */
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

/** One related pill — a clickable, type-coloured cross-link when the slug resolves to an entity
 *  with a page; otherwise a plain chip. `data-type` sets the pill's own --k (its entity colour). */
function renderRelPill(slug: string): string {
  const name = escHTML(displayName(slug));
  // Clickable when the slug resolves ANYWHERE in the universe — a search entity OR a wider
  // condition/essential page (the catch-all: a related condition is a live jump, not a dead chip).
  const e = getEntity(slug);
  const type = e !== null
    ? e.type
    : getConditionPage(slug) !== null ? 'condition' : getEssentialPage(slug) !== null ? 'essential' : '';
  if (type !== '') {
    return `<button class="relpill" data-type="${escHTML(type)}" data-sr-entity="${escHTML(slug)}" title="Open ${name}">${name}</button>`;
  }
  return `<span class="relpill relpill--plain" title="Related to this">${name}</span>`;
}

/** A claim's RELATED row — the cross-reference pills, each coloured by its entity type. */
function renderRelated(claim: SearchClaim): string {
  const slugs = claimRelatedSlugs(claim);
  if (slugs.length === 0) {
    return '';
  }
  return `<div class="relrow"><span class="rellabel">Related</span>${slugs.map(renderRelPill).join('')}</div>`;
}

/**
 * The answer, glossified; if the claim carries an in-answer cross-reference, the first occurrence
 * of its phrase becomes a link that jumps to the target claim's card on the same page.
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

/** The crown-jewel Wallach verbatim (the one serif — Playfair), attributed to the person, no cite. */
function renderVerbatim(claim: SearchClaim): string {
  if (claim.verbatim.trim().length === 0) {
    return '';
  }
  return `<blockquote class="vq">${glossify(oneLine(claim.verbatim))}<span class="vq__attr">— Dr. Wallach, in his own words</span></blockquote>`;
}

/** The deeper answer body — shown only when it says more than the one-line answer_short. */
function renderAnswerBody(claim: SearchClaim): string {
  if (claim.answer.trim() === claim.answer_short.trim()) {
    return '';
  }
  return `<div class="ans__body">${renderAnswer(claim)}</div>`;
}

/** The innards shared by an expanded answer row + the best-answer card: short → deeper → verbatim. */
function claimInner(claim: SearchClaim): string {
  return `<div class="ans__short">${escHTML(claim.answer_short)}</div>${renderAnswerBody(claim)}${renderVerbatim(claim)}`;
}

// ─── QUESTION results (best answer + more answers + keep exploring) ─────────

/** The best-answer card — facet-coloured bar + kind pill + question + answer + verbatim + related. */
function renderBestAnswer(claim: SearchClaim): string {
  return `
    <div class="ans" data-facet="${escHTML(claim.facet)}">
      <span class="facetpill"><i></i>${escHTML(facetLabel(claim.facet))}</span>
      <div class="ans__q">${escHTML(claim.question)}</div>
      ${claimInner(claim)}
      ${renderRelated(claim)}
    </div>`;
}

/** One collapsible answer row — question + 2-line preview collapsed; the facet pill sits at the
 *  bottom-right and disappears on expand (so the claim text keeps a uniform left edge). */
function renderArow(claim: SearchClaim, hidden: boolean): string {
  return `
    <details class="arow${hidden ? ' arow--hidden' : ''}" data-facet="${escHTML(claim.facet)}" data-sr-claim="${escHTML(claim.id)}">
      <summary class="arow__sum">
        <span class="arow__text"><span class="arow__q">${escHTML(claim.question)}</span><span class="arow__prev">${escHTML(claim.answer_short)}</span></span>
        <span class="arow__chev">›</span>
        <span class="arow__pill">${escHTML(facetLabel(claim.facet))}</span>
      </summary>
      <div class="arow__body">${claimInner(claim)}</div>
    </details>`;
}

/** The "keep exploring" topic card (ghost-number), coloured by the entity's type. */
function renderTcard(subject: string): string {
  const e = getEntity(subject);
  if (e === null) {
    return '';
  }
  const n = claimCount(subject);
  const hints = subjectFacetHints(subject).map(escHTML).join(' · ');
  return `
    <button class="tcard" data-type="${escHTML(e.type)}" data-sr-entity="${escHTML(subject)}">
      <div class="tcard-ghost">${n}</div>
      <div class="tcard-cat"><i></i>${escHTML(e.type)}</div>
      <div class="tcard-name">${escHTML(displayName(subject))}</div>
      <div class="tcard-foot"><b>${n} ${n === 1 ? 'answer' : 'answers'}</b>${hints.length > 0 ? ` · ${hints}` : ''}</div>
    </button>`;
}

function renderQuestionResults(claims: SearchClaim[]): string {
  const best = claims[0] as SearchClaim;
  const more = claims.slice(1);
  // "More answers": every ranked hit past the best (no hard slice) — first MORE_CAP visible, the rest
  // behind the same "See N more" reveal the facet groups use. .scr-more carries the green --k so the
  // button reads in the Ask-Wallach accent (each row keeps its own per-facet colour).
  const moreHTML = more.length > 0
    ? `<div class="scr-label">More answers</div><div class="scr-more">${revealRows(more, MORE_CAP)}</div>`
    : '';
  return `
    <div class="scr-label">Best answer</div>
    ${renderBestAnswer(best)}
    ${moreHTML}
    <div class="scr-label">Keep exploring</div>
    ${renderTcard(best.subject)}`;
}

// ─── TOPIC page (exact-match entity → every answer, grouped by facet) ───────

// A soft cap with a working reveal: the first `cap` rows show, the rest render collapsed behind a
// "See N more" button that reveals them in place — the ONE truncation pattern across the surface, no
// hard slice that silently drops rows (Luneth 2026-07-23: "no arbitrary truncation ... a working See
// N more everywhere"). FAM_CAP governs a topic-page family group; MORE_CAP the ask "more answers".
const FAM_CAP = 3;
const MORE_CAP = 4;

/** Shown rows + collapsed (hidden) rows + a "See N more" reveal button when any are hidden. */
function revealRows(claims: SearchClaim[], cap: number): string {
  const rows = claims.slice(0, cap).map(c => renderArow(c, false)).join('')
    + claims.slice(cap).map(c => renderArow(c, true)).join('');
  const hiddenN = Math.max(0, claims.length - cap);
  const more = hiddenN > 0
    ? `<button class="fgroup__more" data-aw-morebtn>See ${hiddenN} more <span class="fm-arrow">→</span></button>`
    : '';
  return `${rows}${more}`;
}

/** One answer row on an entity page — an enriched Q&A OR a presentation-enriched raw claim. Both wear
 *  the family colour (data-family) + a specific pill (facet or kind); a raw claim shows its paraphrase
 *  as the title and Wallach's exact words on expand, so it reads like the rest of the results. */
function renderEntityRow(a: EntityAnswer, hidden: boolean): string {
  const prev = a.prev.length > 0 ? `<span class="arow__prev">${escHTML(a.prev)}</span>` : '';
  const short = a.short.length > 0 ? `<div class="ans__short">${escHTML(a.short)}</div>` : '';
  const body = a.body.length > 0 ? `<div class="ans__body">${glossify(a.body)}</div>` : '';
  const verbatim = a.verbatim.trim().length > 0
    ? `<blockquote class="vq">${glossify(oneLine(a.verbatim))}<span class="vq__attr">— Dr. Wallach, in his own words</span></blockquote>`
    : '';
  return `
    <details class="arow${hidden ? ' arow--hidden' : ''}" data-family="${escHTML(a.familyId)}" data-sr-claim="${escHTML(a.id)}">
      <summary class="arow__sum">
        <span class="arow__text"><span class="arow__q">${escHTML(a.title)}</span>${prev}</span>
        <span class="arow__chev">›</span>
        <span class="arow__pill">${escHTML(a.pill)}</span>
      </summary>
      <div class="arow__body">${short}${body}${verbatim}</div>
    </details>`;
}

/** One FAMILY section of an entity page — the coloured family header + its answers (best-first),
 *  capped at FAM_CAP with a "See N more <family>" reveal (every category ends in a real See-N-more). */
function renderFamilyGroup(fam: EntityFamily): string {
  const shown = fam.answers.slice(0, FAM_CAP).map(a => renderEntityRow(a, false)).join('');
  const rest = fam.answers.slice(FAM_CAP);
  const hidden = rest.map(a => renderEntityRow(a, true)).join('');
  const more = rest.length > 0
    ? `<button class="fgroup__more" data-aw-morebtn>See ${rest.length} more ${escHTML(ui(`search_fam_${fam.familyId}_more`))} <span class="fm-arrow">→</span></button>`
    : '';
  return `
    <div class="fgroup" data-family="${escHTML(fam.familyId)}">
      <div class="fgroup__head"><span class="fgroup__label">${escHTML(ui(`search_fam_${fam.familyId}_name`))}</span><span class="fgroup__ct">${fam.count}</span><span class="fgroup__rule"></span></div>
      ${shown}${hidden}
      ${more}
    </div>`;
}

/**
 * A hero descriptor for the topic page, from EITHER the enriched search entity OR — when the query
 * resolved to the wider Knowledge universe (a condition/essential with no enriched search claims) —
 * that page's own record. This is the CATCH-ALL: a non-enriched entity ("cancer") still gets the
 * full Mercury-style hero + a "Learn More →" into its Knowledge page, instead of a dead-end.
 */
interface HeroSrc { name: string; type: string; symbol: string | null; synonyms: string[]; count: number }
function heroFor(subject: string, e: SearchEntity | null): HeroSrc | null {
  if (e !== null) {
    return { name: e.display_name, type: e.type, symbol: e.symbol ?? null, synonyms: e.synonyms, count: claimCount(subject) };
  }
  const c = getConditionPage(subject);
  if (c !== null) {
    return { name: c.name, type: 'condition', symbol: null, synonyms: c.synonyms, count: c.claim_count };
  }
  const es = getEssentialPage(subject);
  if (es !== null) {
    return { name: es.name, type: 'essential', symbol: es.symbol, synonyms: es.synonyms, count: es.claim_count };
  }
  return null;
}

/**
 * The Learn-More target kind — a Knowledge page this entity can open. Conditions + essentials open
 * their detail page; any OTHER resolved search entity opens its Explore topic overlay. So the button
 * now appears for basically every resolved topic (Luneth 2026-07-23: "Learn More should basically
 * ALWAYS appear because ANY topic has a full page by default"), self-healing as pages are authored.
 * Products land in the fast-follow (openDetail already routes 'product'; the emitter is what's to add).
 */
function learnKind(subject: string, e: SearchEntity | null): 'condition' | 'essential' | 'topic' | null {
  if (getConditionPage(subject) !== null) {
    return 'condition';
  }
  if (getEssentialPage(subject) !== null) {
    return 'essential';
  }
  return e !== null ? 'topic' : null;
}

/** The keep-exploring row — related entities as live pills (the catch-all makes wide ones clickable),
 *  so an exact match always offers somewhere interesting to go next instead of dead-ending. */
function renderKeepExploring(subject: string): string {
  const slugs = relatedSlugs(subject);
  if (slugs.length === 0) {
    return '';
  }
  return `<div class="scr-label">Keep exploring</div><div class="exrow">${slugs.map(renderRelPill).join('')}</div>`;
}

function renderTopicPage(subject: string): string {
  const e = getEntity(subject);
  const hero = heroFor(subject, e);
  if (hero === null) {
    return '<div class="aw-empty-line">— nothing to show for this topic yet —</div>';
  }
  const families = entityFamilies(subject);
  const total = families.reduce((acc, f) => acc + f.count, 0);
  const n = total > 0 ? total : hero.count;
  const syn = hero.synonyms.length > 0 ? ` · also: ${hero.synonyms.map(escHTML).join(', ')}` : '';
  const kind = learnKind(subject, e);
  // The WHOLE hero is the Learn-More hit target (name, glyph, meta, blank space) — data-aw-learnmore
  // on the .ehero itself; the button stays as the visible cue (and keyboard focus). Luneth 2026-07-23.
  const heroCls = kind !== null ? 'ehero ehero--link' : 'ehero';
  const heroAttrs = kind !== null ? ` data-aw-learnmore="${escHTML(subject)}" data-aw-kind="${kind}"` : '';
  const learnMore = kind !== null
    ? `<button class="eback" data-aw-learnmore="${escHTML(subject)}" data-aw-kind="${kind}">Learn More →</button>`
    : '';
  const groupsHTML = families.length > 0
    ? families.map(renderFamilyGroup).join('')
    : '<div class="aw-empty-line">— no sealed claims on this yet —</div>';
  return `
    <div class="${heroCls}" data-type="${escHTML(hero.type)}"${heroAttrs}>
      <span class="ehero__sym">${tileGlyph(subject, { symbol: hero.symbol, type: hero.type, display_name: hero.name })}</span>
      <span class="ehero__id">
        <span class="ehero__name">${escHTML(hero.name)}</span>
        <span class="ehero__meta">${escHTML(hero.type)} · ${n} ${n === 1 ? 'answer' : 'answers'}${escHTML(syn)}</span>
      </span>
      ${learnMore}
    </div>
    ${groupsHTML}
    ${renderKeepExploring(subject)}`;
}

// ─── OPENING (browse by kind) + EMPTY (no match) ───────────────────────────

/** The opening screen — one card per facet FAMILY with its real claim count (colour by data-family). */
function renderOpening(): string {
  const card = (f: FamilyCount): string => `
    <button class="kcard" data-family="${escHTML(f.id)}" data-aw-family="${escHTML(f.id)}">
      <span class="kcard-main">
        <span class="kcard-name">${escHTML(ui(`search_fam_${f.id}_name`))}</span>
        <span class="kcard-facets">${escHTML(ui(`search_fam_${f.id}_sub`))}</span>
      </span>
      <span class="kcard-n">${f.count}</span>
    </button>`;
  return `
    <div class="scr-label">${escHTML(ui('search_browse_label'))}</div>
    <div class="kstack">${familyCounts().map(card).join('')}</div>`;
}

/** No-match: a calm dead-end with real suggestion chips (the busiest topics), never a bare "no results". */
function renderEmpty(query: string): string {
  const sugg = entityList()
    .filter(e => !isChargedEntity(e.slug))
    .sort((a, b) => b.claim_count - a.claim_count)
    .slice(0, 5);
  const chip = (e: EntitySummary): string =>
    `<button class="echip" data-type="${escHTML(e.type)}" data-sr-entity="${escHTML(e.slug)}">${escHTML(e.display_name)}</button>`;
  return `
    <div class="empty">
      <div class="empty__h">Nothing on that yet</div>
      <div class="empty__p">No match for “${escHTML(query)}.” Try one of these:</div>
      <div class="empty__chips">${sugg.map(chip).join('')}</div>
    </div>`;
}

function renderBody(result: SearchResult): string {
  if (result.mode === 'ask' && result.claims.length > 0) {
    return renderQuestionResults(result.claims);
  }
  if (result.mode === 'entity') {
    return renderTopicPage(result.subject);
  }
  if (result.noMatch) {
    return renderEmpty(result.query);
  }
  return renderOpening();
}

/** The centered green popup shell: green-chrome head + neumorphic search bar + the result body.
 *  The mount host is the scrim; `.scr` (data-aw-pop) is the panel — a click outside it closes. */
function renderShell(): string {
  return `
    <div class="scr" data-aw-pop>
      <div class="scr-head">
        <div class="scr-id">Ask <em>Wallach</em></div>
        <div class="aw-search">
          <div class="aw-search__well">
            <input class="aw-search__input" type="text" placeholder="${escHTML(ui('search_placeholder'))}" autocomplete="off" spellcheck="false" />
            <span class="aw-search__btn"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg></span>
          </div>
        </div>
      </div>
      <div class="scr-body"></div>
    </div>`;
}

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): DrawerHandle {
  let isOpen = false;
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
    const body = container.querySelector<HTMLElement>('.scr-body');
    if (body !== null) {
      body.innerHTML = renderBody(result);
      // Every repaint starts at the top: a fresh topic/opening must not inherit the previous
      // view's scroll offset (replacing innerHTML alone does not reset it). Luneth 2026-07-09.
      body.scrollTop = 0;
    }
  };

  const syncSearchbar = (): void => {
    const input = container.querySelector<HTMLInputElement>('.aw-search__input');
    if (input !== null) {
      input.value = query;
    }
  };

  const render = (): void => {
    container.innerHTML = renderShell();
    lastKey = '';
    paintBody(true);
    syncSearchbar();
    const input = container.querySelector<HTMLInputElement>('.aw-search__input');
    if (input !== null) {
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
    emit('drawer:toggled', { target: 'search', open: true });
  };
  const close = (): void => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    query = '';
    container.classList.remove('sr-open');
    container.innerHTML = '';
    emit('drawer:toggled', { target: 'search', open: false });
  };
  const toggle = (): void => {
    if (isOpen) {
      close();
    }
    else {
      open();
    }
  };

  /** Navigate to a topic page by slug — the search bar shows its name; exact-match resolves the page. */
  const gotoEntity = (slug: string): void => {
    query = displayName(slug);
    syncSearchbar();
    paintBody(true);
  };

  /**
   * Jump to another claim's card on the current page (an in-answer cross-reference): open it + any
   * collapsed ancestor <details>, scroll it into view, and flash it so the eye lands on it.
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
    if (t === null || !t.classList.contains('aw-search__input')) {
      return;
    }
    query = (t as HTMLInputElement).value;
    paintBody(false);
  });

  container.addEventListener('click', (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    // A click on the scrim (the mount host, outside the popup panel) closes — a centered modal.
    if (target.closest('[data-aw-pop]') === null) {
      close();
      return;
    }
    // "Learn More →" → open this entity's Knowledge page: a condition/essential/product detail page,
    // or an Explore topic overlay for any other entity. main.ts does the single-drawer swap (close
    // search, open Knowledge at the entity). 'product' is accepted ahead of its fast-follow emitter.
    const learnEl = target.closest<HTMLElement>('[data-aw-learnmore]');
    if (learnEl !== null) {
      const kind = learnEl.getAttribute('data-aw-kind');
      if (kind === 'essential' || kind === 'condition' || kind === 'topic' || kind === 'product') {
        emit('knowledge:open-entity', { kind, slug: learnEl.getAttribute('data-aw-learnmore') ?? '' });
      }
      return;
    }
    // "See N more" reveals the rest of the rows in its block — a facet group OR the ask "more answers".
    // Both hold their overflow behind .arow--hidden; the button retires itself after revealing.
    const moreBtn = target.closest<HTMLElement>('[data-aw-morebtn]');
    if (moreBtn !== null) {
      const scope = moreBtn.closest('.fgroup, .scr-more');
      scope?.querySelectorAll('.arow--hidden').forEach(el => el.classList.remove('arow--hidden'));
      moreBtn.remove();
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
    }
  });

  return {
    open,
    close,
    toggle,
    isOpen: () => isOpen,
  };
}
