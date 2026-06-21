/**
 * core/source-rule.ts — Wallach allowlist enforcement
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE CORNERSTONE: every numeric target, dose recommendation, deficiency
 * indicator, or health claim displayed by this system must cite a primary
 * source from the allowlist. No exceptions, including the user.
 *
 * Allowlisted markers:
 *   - 'dddl'   → Dead Doctors Don't Lie
 *   - 'rbs'    → Rare Earths: Forbidden Cures
 *   - 'eps'    → Epigenetics: The Death of the Genetic Theory
 *   - 'ygy'    → YGY Product Compendium (secondary, label data only)
 *   - 'wallach-lecture' → transcribed Wallach lecture corpus
 *
 * Round 118 doctrine: the source-rule walker validates every
 * `wallach_stance.citation` field at integrity-check time. This module
 * exports the runtime check + the marker set used by both lint-time
 * (tools/invariants.py) and runtime (state modules consuming citations).
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** The canonical set of source-rule markers. Add new ones via amendment. */
export const ALLOWLIST_MARKERS = ['dddl', 'rbs', 'eps', 'ygy', 'wallach-lecture'] as const;
export type SourceMarker = (typeof ALLOWLIST_MARKERS)[number];

/** A citation that passed the source-rule walker. */
export interface ValidatedCitation {
  raw: string;
  marker: SourceMarker;
  page?: number;
  chapter?: string;
}

/** Thrown when a citation does not match any allowlisted marker. */
export class SourceRuleViolation extends Error {
  constructor(public readonly citation: string) {
    super(`Source-rule violation: "${citation}" does not contain an allowlisted marker`);
    this.name = 'SourceRuleViolation';
  }
}

/**
 * Find the first allowlisted marker in a citation string. Case-insensitive
 * substring match. Returns null if no marker is present.
 */
function findMarker(citation: string): SourceMarker | null {
  const lower = citation.toLowerCase();
  for (const marker of ALLOWLIST_MARKERS) {
    if (lower.includes(marker)) {
      return marker;
    }
  }
  return null;
}

/** Returns true iff the citation string contains any allowlisted marker. */
export function isAllowlistedCitation(citation: string): boolean {
  return findMarker(citation) !== null;
}

/**
 * Parse a citation string into a structured form, or throw if disallowed.
 * Extracts optional page ("p. 127" / "page 127") and chapter ("ch. 3" /
 * "chapter 3"). The raw input is always preserved for the audit trail.
 */
export function parseCitation(citation: string): ValidatedCitation {
  const marker = findMarker(citation);
  if (marker === null) {
    throw new SourceRuleViolation(citation);
  }

  // Extract page number: "p. 127" / "p 127" / "page 127" / "p127"
  const pageMatch = /\bp(?:\.|age)?\s*(\d+)\b/i.exec(citation);
  const pageStr = pageMatch?.[1];
  const page = pageStr !== undefined ? Number.parseInt(pageStr, 10) : undefined;

  // Extract chapter identifier: "ch. 3" / "chapter 3" / "ch III"
  const chapterMatch = /\bch(?:\.|apter)?\s+(\S+)\b/i.exec(citation);
  const chapter = chapterMatch?.[1];

  const result: ValidatedCitation = { raw: citation, marker };
  if (page !== undefined) {
    result.page = page;
  }
  if (chapter !== undefined) {
    result.chapter = chapter;
  }
  return result;
}
