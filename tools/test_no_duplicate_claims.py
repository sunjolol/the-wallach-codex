#!/usr/bin/env python3
"""Negative test for no_duplicate_claims (Charter R3 / R7).

Proof artifact (§00.B "codify, don't promise"). A gate that has only ever been GREEN proves
nothing (memory: negative-control-or-it-proves-nothing). This drives _no_duplicate_claims_impl
directly with planted in-memory claims and asserts it REDDENS on the exact defect it was written
for -- the one that reached Luneth's screen on 2026-08-03 before the gate existed:

    two near-identical "What is Vitamin A?" cards on one entity page. WAL-CLM-EPIGEN-000213
    (a 128-char take) and -000214 (the 481-char full take) quoted the same span at the same
    char_offset with the same extracted_at, same subject, same facet -- and an 84-gate board
    reported all green while both rendered.

CASE 'vitaminA_twin_cards' replants that pair with its REAL sealed bytes (recovered from
b3551834^). It is the whole point of this file: if it ever goes GREEN, the gate has stopped
biting the class it exists for.

★ THE HARDER HALF IS THE OVER-FIRE GUARDS. Containment ALONE is not duplication -- 209
containment pairs exist in the sealed corpus BY DESIGN, because one Wallach paragraph
legitimately answers several questions. A gate that red-boards those is worse than no gate: it
would be baselined away within a week. Four cases pin the sparing, each lifted from real sealed
claims:
  * 'same_span_two_subjects'  -- DDDL-000030 (selenium/warning) + DDDL-000096
                                 (dietary_oils/mechanism), one span, two entity pages.
  * 'same_subject_two_facets' -- EPIGEN-000237 (vitamin-b1/basics) + -000238 (b1/mechanism),
                                 the basics sentence quoted again as the mechanism lead-in.
  * 'adjacent_table_rows'     -- LETS-000045 + -000046, neighbouring Base-Line dose rows that
                                 OVERLAP 51% but neither contains the other. This is why the
                                 signature is containment, not overlap: 9 real pairs look like
                                 this and every one of them is legitimate.
  * 'cross_book_repeat'       -- Wallach reuses passages between books and each book gets its
                                 own claim (memory: enrich-tier1-every-book-favor-newer), so
                                 the signature is scoped to ONE book.

'same_subject_two_facets' is a BOUNDARY case, not a law of nature: it is spared because the
signature Luneth ruled on 2026-08-03 requires the same facet. If that ruling ever changes, this
case is the thing that must change with it -- deliberately, with his say-so, not by a quiet
edit to the gate.

The allowlist cases pin the mechanism the handoff got wrong. The two ruled keep-both pairs live
IN-GATE, not in .claude/invariant-baseline.json, because that file is INVARIANT-scoped
(stop_round_close.py::_tolerated returns a set of invariant NAMES) -- one entry there tolerates
EVERY duplicate this gate will ever find. 'allowlist_is_not_blanket' proves the in-gate form
does not have that hole; 'stale_exception' proves a carve-out that stops firing is itself RED,
so a dead exception cannot sit in the source pretending to bless something.

Run:  PYTHONUTF8=1 python tools/test_no_duplicate_claims.py

Exit 0 = every case behaves; non-zero = the gate stopped biting (a real regression)."""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._no_duplicate_claims_impl
SHIPPED_ALLOWLIST = inv._DUPLICATE_KEEP_BOTH


def claim(cid, book, offset, verbatim, extracted="2026-07-26T23:03:23+00:00"):
    """A claim slim enough to read, carrying only the fields the gate touches."""
    return {"id": cid, "verbatim": verbatim, "extracted_at": extracted,
            "locator": {"book": book, "char_offset": offset}}


def enrich(*rows):
    return {cid: {"subject": subject, "facet": facet} for cid, subject, facet in rows}


# --- REAL BYTES, lifted from the sealed corpus so the fixtures mirror true shapes. ---
# The 2026-08-03 defect itself (recovered from b3551834^, epigenetics @ 1065286).
VIT_A_SHORT = ("This vitamin, isolated in 1913, which has many active forms including, retinol,\n"
               "retinoic acid and retinyl esters and precursors.")
VIT_A_FULL = VIT_A_SHORT + (" Beta carotene is a fat soluble\nvitamin A precursor that is required "
                            "for maintenance of vision and night vision\n(the Egyptians employed beef "
                            "liver juice, a natural source of vitamin A, to\ncure night blindness in "
                            "2000 BC), to maintain healthy skin and healthy mucus\nmembranes, bones, "
                            "and teeth; it has been shown to reduce the risk if epithelial\ncancers.")

# One span, two subjects -- DDDL-000030 / -000096 @ 585539. Legitimate by design.
OILS_SHORT = ("High intakes of vegetable oils,\nincluding salad dressing and cooking oils, concurrent "
              "with a selenium\ndeficiency is the quickest route to a heart attack and cancer.")
OILS_FULL = OILS_SHORT + (" The polyun‐\nsaturated configuration of the oils when heated or treated "
                          "with hydrogen\n(“trans fatty acids”) literally causes the rancidity "
                          "(“free radical” damage) of\ncellular fat")

# One subject, two facets -- EPIGEN-000237 / -000238 @ 1080764. Legitimate under the ruled signature.
B1_BASICS = ("This water soluble vitamin was discovered in 1897 and isolated in 1911.\nIt is a cofactor "
             "required for energy production and optimal metabolism of\ncarbohydrates.")
B1_MECHANISM = B1_BASICS + (" Thiamine combines with phosphorous to form the coenzyme\nthiamine "
                            "pyrophosphate (TPP), which functions as a cocarboxylase enzyme. TPP\nis "
                            "required for the oxidative decarboxylation of pyruvate to form active "
                            "acetate\nand acetyl coenzyme A, the critical compound of the Krebs cycle.")

# Adjacent Base-Line table rows -- LETS-000045 / -000046. 51% overlap, NEITHER contains the other.
ROW_A = "BIOTIN 200 mcg 200 mcg 500 to 3,000 mcg\nCALCIUM 800 mcg 2,000 mg 2,000 to 5,000 mg"
ROW_B = "CALCIUM 800 mcg 2,000 mg 2,000 to 5,000 mg\nCHLORIDE 1,700 mg 2,500 mg 500 to 2,500 mg"

# The selenium pair's real shape: TWO IDENTICAL verbatims (containment where neither is shorter).
SELENIUM = ("The selenium levels in\npreconception women is important to the maintenance of pregnancy "
            "as well\nas the prevention of muscular dystrophy in all of its forms")

# (name, claims, enrichment, approved, want_green, why)
CASES = [
    # ---- THE DEFECT. Both mechanisms from commit b3551834. ----
    ("vitaminA_twin_cards",
     [claim("WAL-CLM-EPIGEN-000213", "epigenetics", 1065286, VIT_A_SHORT),
      claim("WAL-CLM-EPIGEN-000214", "epigenetics", 1065286, VIT_A_FULL)],
     enrich(("WAL-CLM-EPIGEN-000213", "vitamin-a", "basics"),
            ("WAL-CLM-EPIGEN-000214", "vitamin-a", "basics")),
     {}, False,
     "MECHANISM 1 (same-batch double emission) -- the real 2026-08-03 defect. If this goes "
     "GREEN the gate no longer catches the thing it was built for"),

    ("cross_batch_remine",
     [claim("T-A", "epigenetics", 1065286, VIT_A_SHORT, extracted="2026-07-03T10:00:00+00:00"),
      claim("T-B", "epigenetics", 1065286, VIT_A_FULL, extracted="2026-07-27T18:16:42+00:00")],
     enrich(("T-A", "vitamin-a", "basics"), ("T-B", "vitamin-a", "basics")),
     {}, False,
     "MECHANISM 2 (cross-batch re-mining) -- a later pass re-mines a covered span. Pins that "
     "the gate does NOT key on extracted_at, which is the only thing separating the two mechanisms"),

    ("identical_verbatims",
     [claim("T-A", "dddl-3e-2011", 871109, SELENIUM),
      claim("T-B", "dddl-3e-2011", 871109, SELENIUM)],
     enrich(("T-A", "selenium", "physiology"), ("T-B", "selenium", "physiology")),
     {}, False,
     "the selenium pair's shape with the allowlist emptied -- equal-length containment must "
     "still fire, or every exact-twin duplicate walks through"),

    ("different_offsets_same_text",
     [claim("T-A", "epigenetics", 100, VIT_A_SHORT),
      claim("T-B", "epigenetics", 999999, VIT_A_FULL)],
     enrich(("T-A", "vitamin-a", "basics"), ("T-B", "vitamin-a", "basics")),
     {}, False,
     "string containment, not span arithmetic -- if a resnap ever drifts an offset the gate must "
     "keep firing, since a gate that goes quiet as the data gets WORSE is the recurring failure"),

    ("unenriched_pair",
     [claim("T-A", "hells-kitchen", 500, VIT_A_SHORT),
      claim("T-B", "hells-kitchen", 500, VIT_A_FULL)],
     {}, {}, False,
     "two claims with NO enrichment bucket together under (None, None) -- fail closed. 8 such "
     "claims exist today and none of them pair; a future one must not slip because it is unenriched"),

    # ---- THE OVER-FIRE GUARDS. Each is a real, legitimate corpus shape. ----
    ("same_span_two_subjects",
     [claim("WAL-CLM-DDDL-000030", "dddl-3e-2011", 585539, OILS_FULL),
      claim("WAL-CLM-DDDL-000096", "dddl-3e-2011", 585539, OILS_SHORT)],
     enrich(("WAL-CLM-DDDL-000030", "selenium", "warning"),
            ("WAL-CLM-DDDL-000096", "dietary_oils", "mechanism")),
     {}, True,
     "one span quoted to say two different things on two different entity pages -- the design, "
     "not a defect. 209 containment pairs corpus-wide look like this"),

    ("same_subject_two_facets",
     [claim("WAL-CLM-EPIGEN-000237", "epigenetics", 1080764, B1_BASICS),
      claim("WAL-CLM-EPIGEN-000238", "epigenetics", 1080764, B1_MECHANISM)],
     enrich(("WAL-CLM-EPIGEN-000237", "vitamin-b1", "basics"),
            ("WAL-CLM-EPIGEN-000238", "vitamin-b1", "mechanism")),
     {}, True,
     "BOUNDARY of the ruled signature: one subject, two sections -- the basics sentence quoted "
     "again as the mechanism lead-in. Spared because Luneth's rule requires the same facet; if "
     "that ruling changes, THIS case changes with it, deliberately"),

    ("adjacent_table_rows",
     [claim("WAL-CLM-LETS-000045", "lets-play-doctor", 139115, ROW_A),
      claim("WAL-CLM-LETS-000046", "lets-play-doctor", 139155, ROW_B)],
     enrich(("WAL-CLM-LETS-000045", "calcium", "protocol"),
            ("WAL-CLM-LETS-000046", "calcium", "protocol")),
     {}, True,
     "51% OVERLAP, zero containment -- neighbouring Base-Line dose rows carrying different "
     "numbers. This is why the signature is containment; an overlap threshold reddens 9 real pairs"),

    ("cross_book_repeat",
     [claim("T-A", "dddl-3e-2011", 100, VIT_A_FULL),
      claim("T-B", "epigenetics", 200, VIT_A_FULL)],
     enrich(("T-A", "vitamin-a", "basics"), ("T-B", "vitamin-a", "basics")),
     {}, True,
     "Wallach reuses passages across books and each book earns its own claim "
     "(enrich-tier1-every-book-favor-newer) -- the signature is scoped to ONE book"),

    ("no_verbatim_skipped",
     [claim("T-A", "epigenetics", 1065286, ""), claim("T-B", "epigenetics", 1065286, "")],
     enrich(("T-A", "vitamin-a", "basics"), ("T-B", "vitamin-a", "basics")),
     {}, True,
     "a claim with no verbatim has nothing to contain -- must skip, not crash or fire"),

    # ---- THE ALLOWLIST. The mechanism the handoff specified wrongly. ----
    ("approved_pair_spared",
     [claim("WAL-CLM-DDDL-000071", "dddl-3e-2011", 871109, SELENIUM),
      claim("WAL-CLM-DDDL-000137", "dddl-3e-2011", 871109, SELENIUM)],
     enrich(("WAL-CLM-DDDL-000071", "selenium", "physiology"),
            ("WAL-CLM-DDDL-000137", "selenium", "physiology")),
     {frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}): "ruled keep-both"}, True,
     "a pair on the in-gate allowlist is spared -- the two ruled keep-both pairs must not "
     "red-board a corpus Luneth already signed off"),

    ("allowlist_is_not_blanket",
     [claim("WAL-CLM-DDDL-000071", "dddl-3e-2011", 871109, SELENIUM),
      claim("WAL-CLM-DDDL-000137", "dddl-3e-2011", 871109, SELENIUM),
      claim("WAL-CLM-EPIGEN-000213", "epigenetics", 1065286, VIT_A_SHORT),
      claim("WAL-CLM-EPIGEN-000214", "epigenetics", 1065286, VIT_A_FULL)],
     enrich(("WAL-CLM-DDDL-000071", "selenium", "physiology"),
            ("WAL-CLM-DDDL-000137", "selenium", "physiology"),
            ("WAL-CLM-EPIGEN-000213", "vitamin-a", "basics"),
            ("WAL-CLM-EPIGEN-000214", "vitamin-a", "basics")),
     {frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}): "ruled keep-both"}, False,
     "★ THE HOLE A BASELINE ENTRY WOULD OPEN: an approved pair present alongside a real "
     "duplicate must STILL be RED. In .claude/invariant-baseline.json (invariant-scoped) this "
     "case would be tolerated and the vitamin-A defect would ship again"),

    ("stale_exception",
     [claim("T-A", "epigenetics", 100, "a wholly unrelated sentence about zinc.")],
     enrich(("T-A", "zinc", "basics")),
     {frozenset({"WAL-CLM-GONE-000001", "WAL-CLM-GONE-000002"}): "pair no longer exists"}, False,
     "a carve-out that no longer fires is a lie left in the source (R9) -- deleting, re-mapping "
     "or merging a blessed pair must force the exception out in the SAME patch"),
]


def main():
    fails = []
    for name, claims, enrichment, approved, want_green, why in CASES:
        ok, msg = impl(claims, enrichment, approved=approved)
        good = (ok == want_green)
        print("%s %-24s expect=%-5s got=%-5s  %s"
              % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
                 "GREEN" if ok else "RED", msg[:74]))
        if not good:
            fails.append((name, why, msg))

    # The shipped allowlist is a claim about the WORLD, not a build fix. Pin its exact
    # membership so growing it is a deliberate, reviewed act rather than a quiet edit.
    print()
    expected = {frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}),
                frozenset({"WAL-CLM-IMMORT-000135", "WAL-CLM-IMMORT-000389"}),
                frozenset({"WAL-CLM-DDDL-000071", "WAL-CLM-DDDL-000137"}),
                frozenset({"WAL-CLM-DDDL-000092", "WAL-CLM-DDDL-000517"}),
                frozenset({"WAL-CLM-DDDL-000115", "WAL-CLM-DDDL-000427"}),
                frozenset({"WAL-CLM-DDDL-000168", "WAL-CLM-DDDL-000436"}),
                frozenset({"WAL-CLM-DDDL-000337", "WAL-CLM-DDDL-000430"}),
                frozenset({"WAL-CLM-DDDL-000337", "WAL-CLM-DDDL-000440"}),
                frozenset({"WAL-CLM-DDDL-000354", "WAL-CLM-DDDL-000434"}),
                frozenset({"WAL-CLM-DDDL-000356", "WAL-CLM-DDDL-000450"}),
                frozenset({"WAL-CLM-DDDL-000356", "WAL-CLM-DDDL-000451"}),
                frozenset({"WAL-CLM-DDDL-000357", "WAL-CLM-DDDL-000452"}),
                frozenset({"WAL-CLM-DDDL-000385", "WAL-CLM-DDDL-000448"}),
                frozenset({"WAL-CLM-DDDL-000385", "WAL-CLM-DDDL-000474"}),
                frozenset({"WAL-CLM-DDDL-000394", "WAL-CLM-DDDL-000459"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000463"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000471"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000476"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000477"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000478"}),
                frozenset({"WAL-CLM-DDDL-000397", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000406", "WAL-CLM-DDDL-000465"}),
                frozenset({"WAL-CLM-DDDL-000406", "WAL-CLM-DDDL-000466"}),
                frozenset({"WAL-CLM-DDDL-000408", "WAL-CLM-DDDL-000481"}),
                frozenset({"WAL-CLM-DDDL-000408", "WAL-CLM-DDDL-000488"}),
                frozenset({"WAL-CLM-DDDL-000411", "WAL-CLM-DDDL-000485"}),
                frozenset({"WAL-CLM-DDDL-000415", "WAL-CLM-DDDL-000458"}),
                frozenset({"WAL-CLM-DDDL-000421", "WAL-CLM-DDDL-000467"}),
                frozenset({"WAL-CLM-DDDL-000428", "WAL-CLM-DDDL-000429"}),
                frozenset({"WAL-CLM-DDDL-000428", "WAL-CLM-DDDL-000444"}),
                frozenset({"WAL-CLM-DDDL-000429", "WAL-CLM-DDDL-000444"}),
                frozenset({"WAL-CLM-DDDL-000430", "WAL-CLM-DDDL-000440"}),
                frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000432"}),
                frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000495"}),
                frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000498"}),
                frozenset({"WAL-CLM-DDDL-000431", "WAL-CLM-DDDL-000501"}),
                frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000495"}),
                frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000498"}),
                frozenset({"WAL-CLM-DDDL-000432", "WAL-CLM-DDDL-000501"}),
                frozenset({"WAL-CLM-DDDL-000445", "WAL-CLM-DDDL-000523"}),
                frozenset({"WAL-CLM-DDDL-000448", "WAL-CLM-DDDL-000474"}),
                frozenset({"WAL-CLM-DDDL-000449", "WAL-CLM-DDDL-000516"}),
                frozenset({"WAL-CLM-DDDL-000450", "WAL-CLM-DDDL-000451"}),
                frozenset({"WAL-CLM-DDDL-000460", "WAL-CLM-DDDL-000461"}),
                frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000471"}),
                frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000477"}),
                frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000478"}),
                frozenset({"WAL-CLM-DDDL-000463", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000465", "WAL-CLM-DDDL-000466"}),
                frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000477"}),
                frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000478"}),
                frozenset({"WAL-CLM-DDDL-000471", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000476", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000477", "WAL-CLM-DDDL-000478"}),
                frozenset({"WAL-CLM-DDDL-000477", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000478", "WAL-CLM-DDDL-000483"}),
                frozenset({"WAL-CLM-DDDL-000481", "WAL-CLM-DDDL-000488"}),
                frozenset({"WAL-CLM-DDDL-000482", "WAL-CLM-DDDL-000559"}),
                frozenset({"WAL-CLM-DDDL-000490", "WAL-CLM-DDDL-000492"}),
                frozenset({"WAL-CLM-DDDL-000490", "WAL-CLM-DDDL-000577"}),
                frozenset({"WAL-CLM-DDDL-000492", "WAL-CLM-DDDL-000577"}),
                frozenset({"WAL-CLM-DDDL-000494", "WAL-CLM-DDDL-000578"}),
                frozenset({"WAL-CLM-DDDL-000494", "WAL-CLM-DDDL-000581"}),
                frozenset({"WAL-CLM-DDDL-000495", "WAL-CLM-DDDL-000498"}),
                frozenset({"WAL-CLM-DDDL-000495", "WAL-CLM-DDDL-000501"}),
                frozenset({"WAL-CLM-DDDL-000498", "WAL-CLM-DDDL-000501"}),
                frozenset({"WAL-CLM-DDDL-000529", "WAL-CLM-DDDL-000571"}),
                frozenset({"WAL-CLM-DDDL-000531", "WAL-CLM-DDDL-000562"}),
                frozenset({"WAL-CLM-DDDL-000532", "WAL-CLM-DDDL-000548"}),
                frozenset({"WAL-CLM-DDDL-000532", "WAL-CLM-DDDL-000563"}),
                frozenset({"WAL-CLM-DDDL-000548", "WAL-CLM-DDDL-000563"}),
                frozenset({"WAL-CLM-DDDL-000578", "WAL-CLM-DDDL-000581"}),
                frozenset({"WAL-CLM-IMMORT-000135", "WAL-CLM-IMMORT-000389"})}
    pinned = set(SHIPPED_ALLOWLIST) == expected
    print("%s allowlist_membership   expect=71 ruled pairs        got=%d pair(s)"
          % ("ok  " if pinned else "FAIL", len(SHIPPED_ALLOWLIST)))
    if not pinned:
        fails.append(("allowlist_membership",
                      "the in-gate keep-both allowlist changed; each entry is a claim about the "
                      "world and needs Luneth's ruling + this pin updated in the same patch",
                      "got: %s" % sorted(" + ".join(sorted(p)) for p in SHIPPED_ALLOWLIST)))
    for pair, reason in SHIPPED_ALLOWLIST.items():
        if len(reason) < 80:
            fails.append((" + ".join(sorted(pair)), "an allowlist entry must STATE its reason",
                          "reason too thin: %r" % reason))

    # And it must be green on the REAL sealed corpus, or it is unusable.
    claims = []
    for p in sorted((ROOT / "eden/corpus/claims").glob("claims-*.json")):
        claims.extend(json.loads(p.read_text(encoding="utf-8")).get("claims", []))
    enrichment = json.loads((ROOT / "eden/corpus/search-enrichment.json")
                            .read_text(encoding="utf-8")).get("enrichment", {})
    ok, msg = impl(claims, enrichment)
    print("%s real_corpus            expect=GREEN got=%-5s  %s"
          % ("ok  " if ok else "FAIL", "GREEN" if ok else "RED", msg[:74]))
    if not ok:
        fails.append(("real_corpus", "the gate must pass on the sealed corpus", msg))

    print()
    if fails:
        print("%d CASE(S) FAILED — the gate stopped biting:" % len(fails))
        for n, why, msg in fails:
            print("  %s: %s" % (n, why))
            print("     got: %s" % msg[:150])
        return 1
    print("all %d planted cases + the allowlist pin + the real corpus behave — the gate bites."
          % len(CASES))
    return 0


if __name__ == "__main__":
    sys.exit(main())
