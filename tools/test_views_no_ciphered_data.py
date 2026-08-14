"""Negative test for views_no_ciphered_data (R7: a gate is a WISH until proven to fire).

THE RULE: the decorative .ds-cipher glyph-scrambler may wrap view-LOCAL chrome, but never a
value sourced from the state/ or core/ layers -- i.e. never real data. Per CLAUDE.md's data
flow (pillars -> generators -> core/ -> state/ -> views/), that import boundary IS the
data/chrome line.

R9 HISTORY: the first cut banned ALL interpolation inside a cipher span. It over-fired on 4
legitimate view-local sites (hexSerial hashes in search; static placeholder serial +
OCR timings in regimen/scanner). Tightened to the boundary rule rather than loosened; these
cases are pinned below so the refinement can never silently regress.

Run: PYTHONUTF8=1 python tools/test_views_no_ciphered_data.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from invariants import _no_ciphered_data_impl  # noqa: E402

# ── MUST FIRE ────────────────────────────────────────────────────────────────
# The exact regression this gate exists for: the canon-derived count of Wallach's 90
# essentials handed to the scrambler. Rendered live as 80/90/30/90/90/91/90/94 (2026-07-14).
POISON_REAL_COUNT = '''
import { essentialCount, getOrCompute } from '../state/coverage.js';
const html = `<div class="coverage-hero__kicker">Your essentials ·
  <span class="ds-cipher" data-cipher-set="numfrac">${essentialCount()}</span> minerals</div>`;
'''

# Data reached via a property/method chain, not a bare call.
POISON_SNAPSHOT_FIELD = '''
import { getOrCompute } from '../state/coverage.js';
const html = `<span class="ds-cipher" data-cipher-set="numfrac">${getOrCompute().coveredCount}</span>`;
'''

# Data nested inside a local wrapper still reaches the scrambler.
POISON_WRAPPED = '''
import { essentialCount } from '../state/coverage.js';
const html = `<span class="ds-cipher">${escHTML(String(essentialCount()))}</span>`;
'''

# Attribute order / extra classes must not let it slip past.
POISON_REORDERED = '''
import { plural } from '../core/format.js';
const html = `<span data-cipher-set="hexa" class="ds-chrome ds-cipher tile__num">${plural(2, 'x')}</span>`;
'''

# ── MUST NOT FIRE (real sites in the app; pinned by the R9 refinement) ───────
# search.ts: a view-local hash producing a meaningless 4-hex serial.
CLEAN_HEXSERIAL = '''
import { getOrCompute } from '../state/coverage.js';
function hexSerial(seed) { return ((seed * 0x9E3779B9) >>> 0).toString(16); }
const html = `<span class="ds-cipher" data-cipher-set="hexa">S·${hexSerial(q.length * 7)}</span>`;
'''

# scanner.ts / regimen.ts: a static decorative literal arriving via a local placeholder struct.
CLEAN_LOCAL_LITERAL = '''
import { essentialCount } from '../state/coverage.js';
const STAGES = [{ name: 'EXTRACT', ms: '1.42s' }];
const html = `<span class="ds-cipher" data-cipher-set="alphanum">${escHTML(s.ms)}</span>`;
'''

# The cipher's actual purpose: a pure static literal.
CLEAN_STATIC = '''
const html = `<span class="ds-cipher" data-cipher-set="hexa">02·F71D</span>`;
'''

# Real data rendered OUTSIDE any cipher span is fine.
CLEAN_UNCIPHERED = '''
import { essentialCount } from '../state/coverage.js';
const html = `<div>Your essentials · ${essentialCount()} minerals</div>
  <span class="ds-cipher" data-cipher-set="hexa">A1B2</span>`;
'''


def main() -> int:
    failures = []

    must_fire = [
        ("poison_real_count", POISON_REAL_COUNT),
        ("poison_snapshot_field", POISON_SNAPSHOT_FIELD),
        ("poison_wrapped", POISON_WRAPPED),
        ("poison_reordered", POISON_REORDERED),
    ]
    must_pass = [
        ("clean_hexserial", CLEAN_HEXSERIAL),
        ("clean_local_literal", CLEAN_LOCAL_LITERAL),
        ("clean_static", CLEAN_STATIC),
        ("clean_unciphered", CLEAN_UNCIPHERED),
    ]

    for name, src in must_fire:
        ok, msg = _no_ciphered_data_impl([(f"views/{name}.ts", src)])
        if ok:
            failures.append(f"MISS: {name} -- gate stayed GREEN while scrambling state/core data")
        else:
            print(f"OK   {name}: fired -- {msg[msg.find('never data:'):][:70]}")

    for name, src in must_pass:
        ok, msg = _no_ciphered_data_impl([(f"views/{name}.ts", src)])
        if not ok:
            failures.append(f"FALSE POSITIVE: {name} -- fired on view-local chrome: {msg[:100]}")
        else:
            print(f"OK   {name}: green (view-local chrome)")

    if failures:
        print("\nFAILED:")
        for f in failures:
            print("  " + f)
        return 1
    print(f"\nAll {len(must_fire) + len(must_pass)} cases pass: fires on state/core data, spares view-local chrome.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
