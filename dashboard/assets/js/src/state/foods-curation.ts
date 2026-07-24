/**
 * state/foods-curation.ts -- read boundary for the Absorption tab curation config
 * ===========================================================================
 *
 * Surfaces dashboard/assets/data/foods-curation.json to the Absorption view: the SPECIAL
 * curated selections (the home-page-curation philosophy -- a hand-tuned persuasive landing,
 * every other tab pure formula). The view imports RESOLVED claims + food cards here, never
 * the raw IDs/slugs.
 *
 * The offline file:// app cannot fetch(), so the store is inlined at build via esbuild JSON
 * import and validated ONCE through the Zod boundary; a bad/absent store reads as empty and
 * the surface degrades gracefully (never throws).
 *
 * The good/bad-foods classification (remove/eat/conditional) is the ONLY editorial call here;
 * each food's one-line "why" is pulled LIVE from its own sealed claim (a faceted answer, chosen
 * by facet priority), so no health prose is hand-authored -- the classification points, the
 * corpus speaks. Pure reads only; no source-rule obligation on the slug lists themselves.
 * ===========================================================================
 */

import curationData from '../../../data/foods-curation.json';
import { type FoodsCuration, FoodsCurationSchema, type SearchClaim } from '../core/schemas/index.js';
import { claimsForSubject, displayName, getSearchClaim } from './search.js';

const EMPTY: FoodsCuration = { hero_claims: [], remove: [], eat: [], conditional: [], enzyme_claims: [] };

let cached: FoodsCuration | null = null;

/** Parse + cache once (bad/absent data -> empty; the surface then renders nothing). */
function data(): FoodsCuration {
  if (cached === null) {
    const parsed = FoodsCurationSchema.safeParse(curationData);
    cached = parsed.success ? parsed.data : EMPTY;
  }
  return cached;
}

/**
 * The curated crown-jewel claims that anchor the landing's two-pronged thesis, in curated
 * order (mantra -> prevalence -> fix). An id that resolves to nothing is silently skipped.
 */
export function foodsThesisClaims(): SearchClaim[] {
  const out: SearchClaim[] = [];
  for (const id of data().hero_claims) {
    const c = getSearchClaim(id);
    if (c !== null) {
      out.push(c);
    }
  }
  return out;
}

/**
 * Section 04's digestive-enzyme claims, in curated reading order (the instruction -> the scale ->
 * the mechanism -> the counter-move). An id that resolves to nothing is silently skipped, exactly
 * like the hero list, so a curation edit can never blank the tab.
 */
export function foodsEnzymeClaims(): SearchClaim[] {
  const out: SearchClaim[] = [];
  for (const id of data().enzyme_claims) {
    const c = getSearchClaim(id);
    if (c !== null) {
      out.push(c);
    }
  }
  return out;
}

/** One good/bad-food card: the entity name + a one-line "why" taken from its own sealed claim. */
export interface FoodCard {
  slug: string;
  name: string;
  why: string;
}

/**
 * Pick a subject's most on-point one-line answer by facet priority (e.g. a REMOVE food leads
 * with its warning/mechanism; an EAT food with its protocol), falling back to its first claim.
 * The text is a sealed claim's answer_short -- faithful, never hand-authored.
 */
/**
 * The card shows a claim's answer WITHOUT its question, so a leading "Yes -- "/"No -- "
 * (which answers the hidden question) reads oddly standing alone -- drop it.
 */
function cleanWhy(s: string): string {
  return s.replace(/^(?:yes|no)\s*[—–-]+\s*/i, '');
}

/**
 * The card 'why' is a TEASER -- the full rich answer lives on the topic page the card links
 * to, so on the small card we cap to ~200 chars, cutting at the last sentence end (or word
 * boundary) so every card stays a uniform few lines instead of dumping a whole paragraph.
 */
function teaser(s: string): string {
  const CAP = 200;
  if (s.length <= CAP) {
    return s;
  }
  const slice = s.slice(0, CAP);
  const sent = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  if (sent >= 120) {
    return slice.slice(0, sent + 1);
  }
  const sp = slice.lastIndexOf(' ');
  return `${slice.slice(0, sp > 0 ? sp : CAP)}…`;
}

function pickWhy(slug: string, order: readonly string[]): string {
  const claims = claimsForSubject(slug);
  for (const facet of order) {
    const hit = claims.find(c => c.facet === facet);
    if (hit !== undefined) {
      return teaser(cleanWhy(hit.answer_short));
    }
  }
  return teaser(cleanWhy(claims[0]?.answer_short ?? ''));
}

function cards(slugs: readonly string[], order: readonly string[]): FoodCard[] {
  return slugs
    .map(slug => ({ slug, name: displayName(slug), why: pickWhy(slug, order) }))
    .filter(c => c.why.length > 0);
}

/** Foods to take out (bad) -- led by the warning/mechanism claim. */
export function foodsRemove(): FoodCard[] {
  return cards(data().remove, ['warning', 'mechanism', 'physiology']);
}

/** Foods to favor (good) -- led by the general STANCE claim (then uses/basics/protocol), so a card never opens with an extreme dose. */
export function foodsEat(): FoodCard[] {
  return cards(data().eat, ['stance', 'uses', 'basics', 'protocol']);
}

/** Conditional foods -- Wallach's stance turns on the FORM/context; led by the stance/warning. */
export function foodsConditional(): FoodCard[] {
  return cards(data().conditional, ['stance', 'warning', 'protocol', 'basics']);
}

/** The featured villi pull-quote: the resolved sealed claim + the phrase to highlight from, or null. */
export function foodsVilliQuote(): { claim: SearchClaim; highlightFrom: string } | null {
  const q = data().villi_quote;
  if (q === undefined) {
    return null;
  }
  const claim = getSearchClaim(q.id);
  return claim !== null ? { claim, highlightFrom: q.highlight_from } : null;
}
