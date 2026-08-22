/**
 * views/scroll-keep.ts — repaint without moving the reader
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Coverage and the Regimen console both repaint by replacing `container.innerHTML`, and a
 * dose step, an add, a remove or a goal change each fires a recompute. Replacing a subtree
 * resets the scroll position of every scroller inside it, so without this the reader is
 * thrown back to the top and has to find their place again on every single step.
 *
 * ★ THERE ARE TWO SCROLLERS HERE, NOT ONE — AND THE SECOND WENT UNGUARDED.
 * The three workspaces share one PAGE scroller (`.app-workspace`, dashboard.css). That one
 * was guarded, and `render_probe_dose_scroll.js` has held it green ever since. The Daily
 * Protocol rail is its OWN scroller (`[data-rail-list]` — `max-height` + `overflow-y: auto`,
 * workspace-coverage.css), rebuilt by `buildRailRows` through `replaceChildren`, and nothing
 * guarded it: with more rows than fit, stepping the servings on a row near the bottom snapped
 * the rail back to the first row. Owner report, 2026-08-22.
 *
 * The probe passed throughout, because the probe only ever read `.app-workspace`. A gate is
 * exactly as wide as the thing it measures, and this one was one selector too narrow; it now
 * asserts both scrollers.
 *
 * ★ RESTORED SYNCHRONOUSLY, never inside a rAF. The replacement content is the same shape as
 * what it replaced, so the scroll height is already correct by the time this runs and the
 * browser clamps nothing. A rAF would paint the top for one frame first — which is the flash
 * itself.
 *
 * ★ ONE COPY, BOTH VIEWS. This was duplicated verbatim in coverage.ts and regimen.ts, which
 * is how the rail fix would have landed in one of them and not the other.
 */

/**
 * Run `paint`, then put both scrollers back where the reader left them.
 *
 * `container` is the view's mount host: the page scroller is an ANCESTOR of it and survives
 * the repaint, while the rail is a DESCENDANT and does not — its position is read off the old
 * element and written to whichever element takes its place.
 */
export function withScrollPreserved(container: HTMLElement, paint: () => void): void {
  const page = container.closest<HTMLElement>('.app-workspace');
  const pageTop = page === null ? 0 : page.scrollTop;
  const railBefore = container.querySelector<HTMLElement>('[data-rail-list]');
  const railTop = railBefore === null ? 0 : railBefore.scrollTop;

  paint();

  if (page !== null && pageTop > 0 && page.scrollTop !== pageTop) {
    page.scrollTop = pageTop;
  }
  if (railTop > 0) {
    const rail = container.querySelector<HTMLElement>('[data-rail-list]');
    if (rail !== null && rail.scrollTop !== railTop) {
      rail.scrollTop = railTop;
    }
  }
}
