/**
 * state/search.ts — read boundary + retrieval for the Search subsystem (thin-slice)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Surfaces the two Search draft artifacts to views/search.ts:
 *   - the Mercury slice (13 faceted claims) and
 *   - the entity registry (Mercury + related).
 * Both are inlined at build via esbuild JSON import and validated ONCE through the Zod
 * boundary; a bad/absent artifact degrades to empty so the surface never throws.
 *
 * Pure reads + deterministic retrieval only — no mutation, no localStorage. This is the
 * offline "Ask-Wallach" resolver: it maps a plain-language query to either an ENTITY page
 * (subject/synonym hit) or an ASK answer (best-matching claim), field-weighted, no LLM
 * (blueprint §6 — protects the never-breaks/fully-portable guarantee).
 *
 * §00.A: every answer/verbatim here is a faithful projection of a sealed Wallach claim.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mercurySlice from '../../../data/search/mercury-slice.json';
import searchEntities from '../../../data/search/search-entities.json';
import {
  FACET_LABEL,
  SEARCH_FACETS,
  type SearchClaim,
  type SearchEntities,
  type SearchEntity,
  SearchEntitiesSchema,
  type SearchSlice,
  SearchSliceSchema,
} from '../core/schemas/index.js';

const EMPTY_SLICE: SearchSlice = { book: { book_id: '', title: '', year: 0 }, claims: [] };
const EMPTY_ENTITIES: SearchEntities = { entities: {} };

let sliceCache: SearchSlice | null = null;
let entitiesCache: SearchEntities | null = null;

function slice(): SearchSlice {
  if (sliceCache === null) {
    const parsed = SearchSliceSchema.safeParse(mercurySlice);
    sliceCache = parsed.success ? parsed.data : EMPTY_SLICE;
  }
  return sliceCache;
}

function registry(): SearchEntities {
  if (entitiesCache === null) {
    const parsed = SearchEntitiesSchema.safeParse(searchEntities);
    entitiesCache = parsed.success ? parsed.data : EMPTY_ENTITIES;
  }
  return entitiesCache;
}

// ─── Entity + claim reads ──────────────────────────────────────────────────

/** An entity registry entry by slug, or null. */
export function getEntity(slug: string): SearchEntity | null {
  return registry().entities[slug] ?? null;
}

/** Human display name for a slug — registry display_name, else a humanized fallback. */
export function displayName(slug: string): string {
  const e = getEntity(slug);
  if (e !== null) {
    return e.display_name;
  }
  return slug.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Every claim whose subject is this entity, in stable id order. */
export function claimsForSubject(subject: string): SearchClaim[] {
  return slice().claims
    .filter(c => c.subject === subject)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** One entity page's claims, grouped into the facet sections it actually has (canonical order). */
export interface FacetGroup {
  facet: string;
  label: string;
  claims: SearchClaim[];
}
export function facetGroups(subject: string): FacetGroup[] {
  const claims = claimsForSubject(subject);
  const out: FacetGroup[] = [];
  for (const facet of SEARCH_FACETS) {
    const inFacet = claims.filter(c => c.facet === facet);
    if (inFacet.length > 0) {
      out.push({ facet, label: FACET_LABEL[facet], claims: inFacet });
    }
  }
  return out;
}

/** Compose a display citation from the slice's ONE book meta + the claim's page (never hand-typed, R3). */
export function composeCite(claim: SearchClaim): string {
  const b = slice().book;
  const head = `${b.title.toUpperCase()}${b.year > 0 ? ` (${b.year})` : ''}`;
  return claim.page !== null ? `${head} · P.${claim.page}` : head;
}

// ─── Retrieval (deterministic, offline) ────────────────────────────────────

/** How a query resolved: an entity browse page, a single best Ask answer, or nothing matched. */
export interface SearchResult {
  mode: 'entity' | 'ask';
  subject: string;
  /** Present when mode === 'ask' — the single best-matching claim. */
  claim: SearchClaim | null;
  /** True when a non-empty query matched no entity + no claim (view shows a gentle note + browse fallback). */
  noMatch: boolean;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Entity slug whose slug / synonym / display_name matches the query exactly-ish, else null. */
function entityHit(q: string): string | null {
  for (const [slug, e] of Object.entries(registry().entities)) {
    if (slug === q || e.display_name.toLowerCase() === q) {
      return slug;
    }
    if (e.synonyms.some(s => s.toLowerCase() === q)) {
      return slug;
    }
  }
  return null;
}

/** Field-weighted score of a claim against a normalized query (subject/synonym > question/topic > answer > verbatim). */
function scoreClaim(c: SearchClaim, q: string): number {
  let score = 0;
  if (c.question.toLowerCase().includes(q)) {
    score += 6;
  }
  if (c.topics.some(t => t.includes(q) || q.includes(t))) {
    score += 4;
  }
  if (c.answer_short.toLowerCase().includes(q)) {
    score += 3;
  }
  if (c.answer.toLowerCase().includes(q)) {
    score += 1;
  }
  if (c.verbatim.toLowerCase().includes(q)) {
    score += 1;
  }
  return score;
}

/** The single best-matching claim for an Ask query (null if nothing clears the bar). */
export function ask(query: string): SearchClaim | null {
  const q = normalize(query);
  if (q.length < 2) {
    return null;
  }
  let best: SearchClaim | null = null;
  let bestScore = 0;
  for (const c of slice().claims) {
    const s = scoreClaim(c, q);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

/**
 * Resolve a plain-language query to a render intent. Empty query → the default entity
 * browse (Mercury). A subject/synonym hit → its entity page. Otherwise the best Ask
 * answer; if none clears the bar, fall back to browsing Mercury with a no-match note.
 */
export function resolveQuery(query: string): SearchResult {
  const q = normalize(query);
  const fallbackSubject = defaultSubject();
  if (q.length === 0) {
    return { mode: 'entity', subject: fallbackSubject, claim: null, noMatch: false };
  }
  const hit = entityHit(q);
  if (hit !== null) {
    return { mode: 'entity', subject: hit, claim: null, noMatch: false };
  }
  const best = ask(q);
  if (best !== null) {
    return { mode: 'ask', subject: best.subject, claim: best, noMatch: false };
  }
  return { mode: 'entity', subject: fallbackSubject, claim: null, noMatch: true };
}

/** The first registered entity (the slice's single subject) — the default landing page. */
export function defaultSubject(): string {
  const keys = Object.keys(registry().entities);
  return keys[0] ?? 'mercury';
}

/** Total claim count in the slice (for the header readout). */
export function claimCount(subject: string): number {
  return claimsForSubject(subject).length;
}

// ─── Bridge (window.* — reached by headless probes + the topbar search bar) ──

const bridge = window as Window & {
  wallachSearch?: {
    resolveQuery: typeof resolveQuery;
    facetGroups: typeof facetGroups;
    getEntity: typeof getEntity;
    composeCite: typeof composeCite;
    defaultSubject: typeof defaultSubject;
  };
};
bridge.wallachSearch = { resolveQuery, facetGroups, getEntity, composeCite, defaultSubject };
