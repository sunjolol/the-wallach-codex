#!/usr/bin/env python3
"""Negative test for search_no_twin_questions -- the twin-question gate.

Proof artifact (§00.B "codify, don't promise"). A gate that has only ever been GREEN proves
nothing. This drives _search_no_twin_questions_impl directly with planted in-memory enrichment
and asserts it REDDENS on the exact defect it was written for -- the one found on a fully green
board while a duplicate sweep was already under way:

    the Vitamin D entity page STILL rendered "What are the symptoms of vitamin D deficiency?" beside
    "What are the signs of vitamin D deficiency?", and "Can too much vitamin D be dangerous?" beside
    "Can too much vitamin D be harmful?". Cross-book, different-content, synonym-worded twins that
    no_duplicate_claims (same-book + verbatim containment) is blind to by construction.

CASES 'vitaminD_signs_symptoms' / 'vitaminD_dangerous_harmful' replant the real pairs. They are the
whole point of this file: if either goes GREEN the gate has stopped biting the class it exists for.

THE OVER-FIRE GUARDS matter as much -- fold-equality must NOT collapse genuinely different questions:
  * 'definition_vs_function' -- negative_ion_therapy 'what IS it' (basics) vs 'what does it DO' (uses).
    These are DIFFERENT questions and the gate must pass them with NO allowlist entry: the normalizer
    keeps 'do' as a content word (only 'does'/'did' are dropped), so 'what is X' -> {} and 'what does
    X do' -> {do} never collide. This is why the shipped allowlist is EMPTY.
  * 'cross_subject_not_twin' -- the SAME question on two different pages is not a twin; a card only
    twins another card on the SAME entity page (subject). Grouping is per-subject.
  * 'compound_question_differs' -- a broader compound question ("what does X do, and signs of low X")
    is NOT fold-equal to the bare "signs of X deficiency" (it keeps the 'do'), so it is left for human
    review (merge vs narrow), never auto-flagged as an exact twin.

The allowlist MECHANISM is still proven, with real fold-equal pairs, so it is ready the first time a
genuine false positive appears: 'allowlist_spares_pair' shows an approved pair is spared, and
'allowlist_is_not_blanket' shows approving ONE pair does not tolerate a DIFFERENT real twin -- the
hole a .claude/invariant-baseline.json entry would open (that file is invariant-scoped: one entry
tolerates EVERY twin). 'stale_exception' shows a carve-out that stops firing is itself RED.

Run:  PYTHONUTF8=1 python tools/tests/test_search_no_twin_questions.py
Exit 0 = every planted case behaves; non-zero = the gate stopped biting (a real regression).

NOTE: the gate shipped FIRST, RED at 19 twins, and all 19 were then resolved under it in
reviewed batches. The corpus is now twin-free, so this file hard-asserts that the real corpus
stays green -- a regression that re-introduces a twin fails here as well as on the board."""
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._search_no_twin_questions_impl
SHIPPED_ALLOWLIST = inv._TWIN_QUESTION_KEEP_BOTH


def enrich(*rows):
    """rows: (cid, subject, question, facet) -> the enrichment dict the gate reads."""
    return {cid: {"subject": s, "question": q, "facet": f} for cid, s, q, f in rows}


# Real fold-equal pairs, reused across cases.
VITD = (("WAL-CLM-EPIGEN-000032", "vitamin-d", "What are the symptoms of vitamin D deficiency?", "warning"),
        ("WAL-CLM-LETS-000039", "vitamin-d", "What are the signs of vitamin D deficiency?", "physiology"))
BIOTIN = (("WAL-CLM-EPIGEN-000042", "biotin", "What are the signs of biotin deficiency?", "physiology"),
          ("WAL-CLM-RARE-000240", "biotin", "What are the symptoms of a biotin deficiency?", "physiology"))
VITD_PAIR = frozenset({"WAL-CLM-EPIGEN-000032", "WAL-CLM-LETS-000039"})

# (name, enrichment, approved, want_green, why)
CASES = [
    # ---- THE DEFECT. The real 2026-08-07 vitamin-D twins. ----
    ("vitaminD_signs_symptoms", enrich(*VITD), {}, False,
     "the real signs/symptoms twin. If this goes GREEN the gate no longer catches the thing it was "
     "built for -- the cross-book synonym twin no_duplicate_claims cannot see"),

    ("vitaminD_dangerous_harmful",
     enrich(("WAL-CLM-DDDL-000083", "vitamin-d", "Can too much vitamin D be dangerous?", "warning"),
            ("WAL-CLM-LETS-000040", "vitamin-d", "Can too much vitamin D be harmful?", "warning")),
     {}, False,
     "the real toxicity twin -- 'dangerous' and 'harmful' fold together; two warning cards, one page"),

    # ---- OVER-FIRE GUARDS. Fold-equality must not collapse different questions. ----
    ("definition_vs_function",
     enrich(("WAL-CLM-LETS-000108", "negative_ion_therapy", "What is negative ion therapy?", "basics"),
            ("WAL-CLM-LETS-000109", "negative_ion_therapy", "What does negative ion therapy do?", "uses")),
     {}, True,
     "a definition card and a function card on one page are DIFFERENT questions -- passed with NO "
     "allowlist because the normalizer keeps 'do' ('what is X' -> {} vs 'what does X do' -> {do})"),

    ("cross_subject_not_twin",
     enrich(("T-A", "copper", "What are the signs of copper deficiency?", "physiology"),
            ("T-B", "zinc", "What are the signs of zinc deficiency?", "physiology")),
     {}, True,
     "the same question shape on TWO different pages is not a twin -- a card only twins another on the "
     "SAME entity page; grouping is per-subject"),

    ("compound_question_differs",
     enrich(("T-A", "iron", "What does iron do, and what are the signs of low iron?", "physiology"),
            ("T-B", "iron", "What are the symptoms of iron deficiency?", "physiology")),
     {}, True,
     "a broader compound question keeps its 'do' and is NOT fold-equal to the bare signs question -- "
     "left for human review (merge vs narrow), never auto-flagged as an exact twin"),

    ("clearly_distinct_questions",
     enrich(("T-A", "vitamin-d", "What is vitamin D?", "basics"),
            ("T-B", "vitamin-d", "How much vitamin D does Wallach recommend daily?", "protocol"),
            ("T-C", "vitamin-d", "Is vitamin D a hormone?", "big_question")),
     {}, True,
     "three genuinely different vitamin-D cards must all pass -- the page is mostly good, the gate is surgical"),

    # ---- THE ALLOWLIST MECHANISM (proven with real fold-equal pairs, ready for a future false positive). ----
    ("allowlist_spares_pair", enrich(*VITD), {VITD_PAIR: "ruled keep-both (test only)"}, True,
     "an approved fold-equal pair is spared -- the mechanism a future confirmed-distinct pair will use"),

    ("allowlist_is_not_blanket", enrich(*VITD, *BIOTIN), {VITD_PAIR: "ruled keep-both (test only)"}, False,
     "approving the vitamin-D pair must NOT tolerate the DIFFERENT biotin twin -- the hole a baseline "
     "entry (invariant-scoped) would open, shipping every other twin"),

    ("stale_exception",
     enrich(("T-A", "zinc", "What is zinc?", "basics")),
     {frozenset({"WAL-CLM-GONE-1", "WAL-CLM-GONE-2"}): "pair no longer fold-equal"}, False,
     "a carve-out that no longer fires is a lie left in the source -- resolving a blessed twin "
     "must force its exception out in the SAME patch"),
]


def main():
    fails = []
    for name, enrichment, approved, want_green, why in CASES:
        ok, msg = impl(enrichment, approved=approved)
        good = (ok == want_green)
        print("%s %-30s expect=%-5s got=%-5s  %s"
              % ("ok  " if good else "FAIL", name, "GREEN" if want_green else "RED",
                 "GREEN" if ok else "RED", msg[:56]))
        if not good:
            fails.append((name, why, msg))

    # Pin the shipped allowlist membership. EMPTY today (the 19 fold-equal pairs are all real twins);
    # growing it must be a deliberate, reviewed act with a reason + a test, never a quiet edit.
    print()
    pinned = (len(SHIPPED_ALLOWLIST) == 0)
    print("%s allowlist_membership   expect=0 (empty)             got=%d pair(s)"
          % ("ok  " if pinned else "FAIL", len(SHIPPED_ALLOWLIST)))
    if not pinned:
        fails.append(("allowlist_membership",
                      "the in-gate keep-both allowlist is no longer empty; each entry needs a human "
                      "ruling + this pin updated + a reason >= 80 chars, in the same patch",
                      "got: %s" % sorted(" + ".join(sorted(p)) for p in SHIPPED_ALLOWLIST)))
    for pair, reason in SHIPPED_ALLOWLIST.items():
        if len(reason) < 80:
            fails.append((" + ".join(sorted(pair)), "an allowlist entry must STATE its reason",
                          "reason too thin: %r" % reason))

    # The REAL corpus must stay twin-free. ENFORCE_GREEN is on below, so this is a hard assertion,
    # not a meter: a regression that re-introduces a twin fails here as well as on the board.
    print()
    enr_p = ROOT / "eden" / "corpus" / "search-enrichment.json"
    if enr_p.exists():
        enrichment = json.loads(enr_p.read_text(encoding="utf-8")).get("enrichment", {})
        ok, msg = impl(enrichment)
        m = re.match(r"(\d+) twin-question pair", msg)
        remaining = int(m.group(1)) if m else (0 if ok else -1)
        print("INFO real_corpus twins remaining = %s (must be 0) -- %s"
              % (remaining, "GREEN" if ok else "RED"))
        ENFORCE_GREEN = True  # the corpus is twin-free, so this is a hard assertion, not a meter
        if ENFORCE_GREEN and not ok:
            fails.append(("real_corpus", "the corpus must stay twin-free", msg))

    print()
    if fails:
        print("%d CASE(S) FAILED -- the gate stopped biting:" % len(fails))
        for n, why, msg in fails:
            print("  %s: %s" % (n, why))
            print("     got: %s" % msg[:150])
        return 1
    print("all %d planted cases + the allowlist pin behave -- the gate bites." % len(CASES))
    return 0


if __name__ == "__main__":
    sys.exit(main())
