/**
 * views/regimen.ts — Regimen workspace view (STUB after §17 incident #5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STUB recovery from §17 incident #5 (2026-06-21). The previous implementation
 * (~290 lines, with slot cards + Save System UI) was lost without backup.
 *
 * Per main.ts comment: "Other workspaces fall back to legacy until their round
 * lands." This file exists as an importable module for main.ts's no-unused-
 * locals `_refs` hack. The legacy dashboard.html still renders the Regimen UI;
 * this view file is dormant until a future round reimplements it.
 *
 * Future round: rebuild with proper §00 patterns (Zod boundaries via
 * core/schemas/regimen, typed handlers, integration with state/regimen
 * chokepoints which are already Zod-bounded as of §00.15·B.1).
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** View identifier — exported so the namespace isn't empty for noUnusedLocals. */
export const VIEW_ID = 'regimen';
