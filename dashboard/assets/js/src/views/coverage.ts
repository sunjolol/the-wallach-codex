/**
 * views/coverage.ts — Coverage workspace view (STUB after §17 incident #5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STUB recovery from §17 incident #5 (2026-06-21). The previous implementation
 * (~360 lines, the Chunk A coverage CSS + render structure with periodic-table
 * tile rendering and section heads) was lost without backup.
 *
 * This file exposes the minimum `mount()` API that main.ts calls; the rendered
 * output is a placeholder communicating to the user that the workspace is
 * pending reconstruction. The substrate is intact:
 *
 *   - state/coverage.ts (recompute + snapshot, §00-clean)
 *   - core/schemas/* (Zod boundaries)
 *   - core/events.ts (regimen:changed subscriber wiring)
 *
 * Future round: rebuild renderer per v3.2 mockup + knowledge/design-wisdom.
 * The state layer doesn't need changes; only the render layer.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

/**
 * Mount the Coverage workspace into the given container. Returns a handle
 * for future update/unmount calls.
 */
export function mount(container: HTMLElement): MountHandle {
  container.innerHTML = `
    <div class="ws-stub" style="padding:48px;font-family:system-ui;color:#e7d5b5;">
      <h2 style="margin:0 0 12px;font-size:24px;letter-spacing:.02em;">Coverage — pending reconstruction</h2>
      <p style="margin:0 0 8px;line-height:1.5;">This view was lost in <strong>§17 incident #5</strong> (2026-06-21 mass-corruption event).</p>
      <p style="margin:0;line-height:1.5;opacity:.7;">The substrate (core/, state/, schemas/) is intact. See <code style="font-family:ui-monospace,monospace;">chronicle/contradictions/2026-06-21-§17-mass-corruption-5.md</code> for the full incident report.</p>
    </div>
  `;
  return {
    update: () => { /* no-op until reimplemented */ },
    unmount: () => {
      container.innerHTML = '';
    },
  };
}
