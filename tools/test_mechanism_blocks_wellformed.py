#!/usr/bin/env python3
"""Negative test for mechanism_blocks_wellformed (the composed element-header shape, 2026-07-30).

Proof artifact: the composed shape moves a header's block ORDER and SELECTION out of the renderer
and into data, which buys one new failure class — a data-driven dispatch fails SILENTLY. An unknown
block type, a mistyped figure key, or a dead claim id renders '' and the page just looks a little
empty. This test proves the gate bites on each of those, and on two bugs the gate ITSELF had while
being written (both real, both found by running it rather than reading it):

  * the claim-id loader read `claim_id`, but the sealed shard field is `id` — so the id set came back
    EMPTY and all 26 genuine references reddened. A gate lying about clean data. Case
    "empty claim-id set REDDENS" pins the shape of that failure.
  * the declaration-span reader scanned to a literal "\\n);" that the real declaration (which ends
    "\\n]);") never contains, so the span ran to end-of-file and any z.literal() declared LATER
    would have answered for the block vocabulary. Case "ghost literal outside the union is IGNORED"
    pins the paren-matched fix.

Drives _mechanism_blocks_wellformed_impl with synthetic sources + stores, so the gate is proven to
bite without touching the real files. Run:

    PYTHONUTF8=1 python tools/test_mechanism_blocks_wellformed.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._mechanism_blocks_wellformed_impl

# A minimal but STRUCTURALLY REAL pair of sources: same declaration syntax as the shipped files, so
# the parsers are exercised the way they run for real (paren-matched span, brace-matched bodies).
SCHEMA_OK = """
const MechBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('eyebrow'), text: z.string() }).passthrough(),
  z.object({ type: z.literal('figure'), width: MechFigureWidthSchema }).passthrough(),
  z.object({ type: z.literal('quote'), claim: z.string() }).passthrough(),
]);
"""

VIEW_OK = """
function mechanismFigure(key, alt, labels) {
  switch (key) {
    case 'rancidity':
      return rancidityFigure(alt);
    case 'nail_spots':
      return nailSpotsFigure(alt, labels);
    default:
      return '';
  }
}

function renderMechBlocks(blocks) {
  return blocks.map((b) => {
    switch (b.type) {
      case 'eyebrow':
        return mechEyebrow(b.text);
      case 'figure':
        return mechFigureRow(mechSlotFigure(b.figure), b.width);
      case 'quote':
        return fatFamilyQuote(b.claim, b.highlight);
    }
  }).join(SEP);
}
"""

IDS = {"WAL-CLM-DDDL-000001", "WAL-CLM-RARE-000061"}

LEGACY_OK = {"mechanisms": [{
    "slug": "selenium", "figure": "rancidity", "quote_claim": "WAL-CLM-DDDL-000001",
    "beats": [{"n": "01", "traces": ["WAL-CLM-RARE-000061"]}],
}]}

COMPOSED_OK = {"mechanisms": [{"slug": "calcium", "blocks": [
    {"type": "eyebrow", "text": "A label"},
    {"type": "figure", "figure": {"key": "nail_spots", "alt": "a", "labels": {}}, "width": "rail"},
    {"type": "quote", "claim": "WAL-CLM-DDDL-000001"},
]}]}

# A ghost literal declared AFTER the union must not be read as part of the vocabulary.
SCHEMA_GHOST = SCHEMA_OK + """
const SomethingElse = z.object({ kind: z.literal('ghost') }).passthrough();
"""

# The schema grows a type; the renderer does not. This block would render NOTHING.
SCHEMA_EXTRA = SCHEMA_OK.replace(
    "  z.object({ type: z.literal('quote'), claim: z.string() }).passthrough(),",
    "  z.object({ type: z.literal('quote'), claim: z.string() }).passthrough(),\n"
    "  z.object({ type: z.literal('stat'), value: z.string() }).passthrough(),")

# The renderer handles a type no schema literal declares — unreachable code.
VIEW_EXTRA = VIEW_OK.replace(
    "      case 'quote':",
    "      case 'coda':\n        return mechProse('coda', b.text);\n      case 'quote':")

CASES = [
    # (name, store, schema_src, view_src, ids, expect_ok)
    ("legacy store + synced sources pass", LEGACY_OK, SCHEMA_OK, VIEW_OK, IDS, True),
    ("composed store + synced sources pass", COMPOSED_OK, SCHEMA_OK, VIEW_OK, IDS, True),
    ("both shapes together pass",
     {"mechanisms": LEGACY_OK["mechanisms"] + COMPOSED_OK["mechanisms"]},
     SCHEMA_OK, VIEW_OK, IDS, True),
    # ── the SPAN-SCOPING pin (a bug the gate itself had) ──
    ("ghost literal outside the union is IGNORED", LEGACY_OK, SCHEMA_GHOST, VIEW_OK, IDS, True),
    # ── the SYNC halves, both directions ──
    ("schema type with no renderer case REDDENS", LEGACY_OK, SCHEMA_EXTRA, VIEW_OK, IDS, False),
    ("renderer case with no schema type REDDENS", LEGACY_OK, SCHEMA_OK, VIEW_EXTRA, IDS, False),
    # ── figure keys ──
    ("legacy figure key the renderer cannot draw REDDENS",
     {"mechanisms": [dict(LEGACY_OK["mechanisms"][0], figure="does_not_exist")]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    ("composed figure key the renderer cannot draw REDDENS",
     {"mechanisms": [{"slug": "calcium", "blocks": [
         {"type": "figure", "figure": {"key": "typo_rail", "alt": "a", "labels": {}}, "width": "rail"}]}]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    ("legacy hook figure key is checked too",
     {"mechanisms": [dict(LEGACY_OK["mechanisms"][0],
                          hook={"figure": {"key": "ghost_fig", "alt": "a", "labels": {}}})]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    # ── claim resolution, both shapes ──
    ("legacy quote_claim that does not resolve REDDENS",
     {"mechanisms": [dict(LEGACY_OK["mechanisms"][0], quote_claim="WAL-CLM-NOPE-000999")]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    ("legacy beat trace that does not resolve REDDENS",
     {"mechanisms": [dict(LEGACY_OK["mechanisms"][0],
                          beats=[{"n": "01", "traces": ["WAL-CLM-NOPE-000998"]}])]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    ("composed quote claim that does not resolve REDDENS",
     {"mechanisms": [{"slug": "calcium", "blocks": [
         {"type": "quote", "claim": "WAL-CLM-NOPE-000997"}]}]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    ("composed split evidence claim is checked too",
     {"mechanisms": [{"slug": "calcium", "blocks": [
         {"type": "split", "left": {"quote_claim": "WAL-CLM-NOPE-000996"},
          "right": {"quote_claim": "WAL-CLM-DDDL-000001"}}]}]},
     SCHEMA_OK, VIEW_OK, IDS, False),
    # ── the empty-header case ──
    ("composed entry with an EMPTY block list REDDENS",
     {"mechanisms": [{"slug": "calcium", "blocks": []}]}, SCHEMA_OK, VIEW_OK, IDS, False),
    # ── THE GATE'S OWN BUG: an empty id set must read as broken, never as clean ──
    ("empty claim-id set REDDENS (the claim_id-vs-id bug)",
     LEGACY_OK, SCHEMA_OK, VIEW_OK, set(), False),
    # ── unreadable sources must fail LOUD, not pass vacuously ──
    ("missing MechBlockSchema declaration REDDENS", LEGACY_OK, "// nothing here", VIEW_OK, IDS, False),
    ("missing renderMechBlocks REDDENS", LEGACY_OK, SCHEMA_OK, "// nothing here", IDS, False),
]


def main():
    bad = 0
    for name, store, schema_src, view_src, ids, expect in CASES:
        ok, msg = impl(store, schema_src, view_src, ids)
        if ok != expect:
            bad += 1
            print(f"FAIL · {name} · expected ok={expect}, got ok={ok} · {msg}")
        else:
            print(f"ok   · {name}")
    print(f"\n{'PASS' if bad == 0 else 'FAIL'} · test_mechanism_blocks_wellformed · "
          f"{len(CASES) - bad}/{len(CASES)} cases")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
