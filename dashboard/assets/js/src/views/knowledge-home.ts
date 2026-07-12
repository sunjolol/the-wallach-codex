/**
 * views/knowledge-home.ts — the Knowledge drawer's Home tab (Phase H2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The landing tab — the front door to the drawer. A pristine re-creation of the
 * signed-off demo's Home vision (hero + search · the essentials · common
 * conditions · explore), to be wired to REAL live data with all copy routed
 * through the contained view-copy store (state/copy.ts::ui) — never the demo's
 * fixture data or inline prose. This chunk lands the tab shell; the hero and the
 * three browse sections arrive in the following chunks.
 *
 * Layer: views/ — reads state/ + core/, never writes localStorage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** The Home landing tab. Content sections land in the following chunks. */
export function renderHomeTab(): string {
  return '<div class="kd-home"></div>';
}
