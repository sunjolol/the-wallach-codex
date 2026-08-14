/**
 * views/palette.ts — Command Palette (⌘K) renderer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Visual contract: the live view (its v3 mockup was retired 2026-08-13).
 * Three result modes: JUMP TO / LOOKUP / ASK WALLACH.
 *
 * ASK WALLACH portability promise:
 *   - Pre-indexed TF-IDF over /knowledge/corpus/ Wallach text
 *   - No external API, no cloud LLM
 *   - Always returns a cited primary passage + relevance score
 *   - Gated by feature flag `palette_ask_wallach` (off/warn/on)
 *   - If no passage scores above threshold → "no source-rule answer found"
 *
 * Keyboard contract: ⌘K open, ↑↓ navigate, ⏎ select, ⌘⏎ ask wallach,
 *                    / scope, ESC close.
 *
 * SCAFFOLD STATUS (Round 1·A): pending Round 5.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface PaletteHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

export function mount(_container: HTMLElement): PaletteHandle {
  throw new Error('views/palette.mount — pending Round 5 migration');
}
