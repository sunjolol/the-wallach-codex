# Worked example — what a good chunk looks like here

A fresh session learns the rhythm faster from one concrete walkthrough than from
abstract rules. This is **Chunk 6d** (2026-06-22, commit `2a1b155`) start to
finish — the chunk that closed the Scanner's value loop. Read it next to the
matching `chronicle/build-log.md` entry.

## 1. The goal (one sentence, decided before any code)

The Scanner could OCR a label and score it (Chunks 6b/6c), but a scored product
had **no way into the regimen** — the value loop was not closed. Goal: let a user
adopt a scanned product into their stack so it flows to live coverage.

## 2. The open question went to Luneth first

"Adopt to regimen" is naturally per-*product*, but the v3 mockup's parsed rows
carry per-*row* ADOPT/DISMISS buttons. Rather than guess, the agent surfaced the
ambiguity. Luneth chose a single product-level **"ADD TO REGIMEN"** action; the
per-row buttons stay display-only. Genuine ambiguities are asked, not assumed.

## 3. The build-log line (written in the same patch as the work)

> `[2026-06-22 16:39 EDT] scanner · Chunk 6d — adopt scanned product → §31`
> `saveRgManual → coverage (the core value path) · views/scanner.ts +`
> `render_probe_adopt.js (NEW) + dist/main.js · …`

One line, fixed shape: `timestamp · surface · what · files · rationale`.

## 4. What changed (and how it respected the architecture)

- A new `adoptProduct(label)` helper in `views/scanner.ts` builds a `RegimenItem`
  (`provenance: 'user_scanned'`) from the scored `ScanResult.label` and persists it
  through the **§31 `saveRgManual` chokepoint** — never a direct `localStorage`
  write. The chokepoint emits `regimen:changed`; Coverage already subscribes and
  recomputes live.
- A "+ ADD TO REGIMEN" button on the verdict card wires the click handler to it.
- **No new canonical data** entered the view — it reuses the already-scored label.
  (Anti-fakery: nothing hardcoded, nothing stubbed.)
- **Every write went through `tools/safe_write.py`**, never the Edit tool, never
  `eslint --fix`.

## 5. Verification (claims cite the command + output)

- `node tools/build.mjs` → Build OK (dist 277 KB raw; gzip well under the 250 KB
  budget).
- `tsc --noEmit` + `eslint` on the touched file → clean (lint fixed via
  `safe_write`, never `eslint --fix`).
- **New probe** `tools/render_probe_adopt.js` drives it headless: scans a strong
  multi, clicks adopt → `rgManualItems_v1` 0→1 with `provenance: 'user_scanned'`,
  the button confirms, navigate to Coverage → covered tiles 0→2. 0 page errors.
  PASS.
- All prior probes still PASS (no regression). Invariants 58/61 (the 3 reds are the
  unchanged date-gated Tacitus checks).

## 6. The round-close ritual

build ✓ · probes/tests ✓ · invariants ✓ (no regression) · build-log line ✓ ·
commit `2a1b155`. The fifth ritual item — a Creator's Log event via
`state/log.ts::log()` — was **honestly flagged as CLI-unfireable** (it writes
`localStorage`, which needs the dashboard open in a browser). When a step cannot
run, the chunk says so and logs why; it does not silently skip and claim "done."

## 7. The commit

`git -C "<repo root>" commit -F <BOM-less message file>`, then `git push`. The
commit subject mirrors the chunk: `Chunk 6d: adopt scanned product → §31
saveRgManual → coverage`. CRLF→LF warnings on commit are harmless.

---

**The shape to copy:** decide the goal → ask Luneth any genuine ambiguity →
build-log line → do the work through the chokepoints + `safe_write` → verify with a
command whose output you cite → run the five-item ritual → commit. If you cannot
complete a step, say so in the log; do not fake it.
