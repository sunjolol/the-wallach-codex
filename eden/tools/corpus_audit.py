#!/usr/bin/env python3
"""corpus_audit.py -- the full-corpus audit HARNESS (crack #4 fix, 2026-07-06).

The mandatory pre-Phase-G audit (memory: full-corpus-audit-before-phase-g) is human-
judgment work -- mis-labels, off-source citations, presentation bugs -- that the source
rule forbids an agent from resolving autonomously. This tool does the MACHINE-actionable
half: it reads every sealed claim shard and emits a reviewable WORKLIST (every claim by
kind + by book, each carrying any machine-detectable suspect flags), so the human review
is systematic and provable rather than a prose promise. It NEVER edits a claim.

Pairs with:
  - eden/tools/corpus-audit-status.json -- the structural lock (frozen_claim_count).
  - the corpus_audit_gate invariant -- blocks Phase G mining until phase_g_unlocked.

Run: `PYTHONUTF8=1 python eden/tools/corpus_audit.py`  ->  regenerates the worklist,
prints a summary. The worklist file is REGENERABLE (not sacred); it is the audit's
scratch surface, refreshed each run.

Machine flags (suspects, NOT verdicts -- a flag means "a human should look", never "wrong"):
  off_source        locator.book is not a books-meta book_id
  dose_without_dose kind == 'dose' but no numeric dose.amount
  no_verbatim       empty / missing verbatim
  no_claim_text     empty / missing claim_text
  over_hard_cap     verbatim exceeds the 1200-char hard ceiling
  table_shaped      verbatim looks like an un-headed table (many digit-runs / column bars)
  unknown_kind      kind not in the known claim-kind vocabulary
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CLAIMS_DIR = ROOT / "eden" / "corpus" / "claims"
META_PATH = ROOT / "eden" / "corpus" / "books-meta.json"
WORKLIST = ROOT / "eden" / "tools" / "corpus-audit-worklist.md"

# The known claim-kind vocabulary (from the observed sealed corpus). A kind outside
# this set is flagged for review -- it may be a typo or a new kind that needs a home.
KNOWN_KINDS = {
    "prevalence", "quote", "deficiency_sign", "mechanism", "prognosis",
    "personal_anecdote", "dose", "protocol", "interaction", "contraindication",
    "definition", "toxicity_sign", "food_source", "diagnostic_pattern",
}
HARD_CAP = 1200  # verbatim hard ceiling (corpus_verify #2 family)


def _book_ids():
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return {b["book_id"] for b in meta["books"]}


def _table_shaped(verbatim: str) -> bool:
    """Cheap heuristic for an un-headed table lifted into a verbatim: several runs of
    2+ digits AND either column bars or many multi-space gaps. Suspect, not a verdict."""
    import re
    digit_runs = len(re.findall(r"\d{2,}", verbatim))
    bars = verbatim.count("|")
    gaps = len(re.findall(r"\S {2,}\S", verbatim))
    return digit_runs >= 4 and (bars >= 2 or gaps >= 4)


def _flags(claim: dict, book_ids: set) -> list:
    flags = []
    loc = claim.get("locator") or {}
    if loc.get("book") not in book_ids:
        flags.append("off_source")
    kind = claim.get("kind")
    if kind not in KNOWN_KINDS:
        flags.append("unknown_kind")
    if kind == "dose":
        dose = claim.get("dose") or {}
        amt = dose.get("amount")
        if not isinstance(amt, (int, float)):
            flags.append("dose_without_dose")
    vb = (claim.get("verbatim") or "").strip()
    if not vb:
        flags.append("no_verbatim")
    else:
        if len(vb) > HARD_CAP:
            flags.append("over_hard_cap")
        if _table_shaped(vb):
            flags.append("table_shaped")
    if not (claim.get("claim_text") or "").strip():
        flags.append("no_claim_text")
    return flags


def build():
    book_ids = _book_ids()
    claims = []
    for shard in sorted(CLAIMS_DIR.glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            claims.append((shard.name, c))
    by_kind = defaultdict(list)
    by_book = defaultdict(int)
    flagged = []
    for shard_name, c in claims:
        by_kind[c.get("kind", "?")].append(c)
        by_book[(c.get("locator") or {}).get("book", "?")] += 1
        fl = _flags(c, book_ids)
        if fl:
            flagged.append((c.get("id", "?"), c.get("kind", "?"),
                            (c.get("locator") or {}).get("book", "?"), fl))
    return claims, by_kind, by_book, flagged


def render(claims, by_kind, by_book, flagged) -> str:
    lines = []
    lines.append("# Corpus audit worklist  (GENERATED -- regenerate with `python eden/tools/corpus_audit.py`)")
    lines.append("")
    lines.append("_The machine half of the mandatory pre-Phase-G full-corpus audit "
                 "(memory: full-corpus-audit-before-phase-g). Flags are SUSPECTS for human "
                 "review, never verdicts. This file is regenerable scratch, not a sacred log._")
    lines.append("")
    lines.append(f"**Total claims:** {len(claims)}  ·  **flagged for a look:** {len(flagged)}")
    lines.append("")
    lines.append("## By kind")
    for k in sorted(by_kind, key=lambda k: -len(by_kind[k])):
        lines.append(f"- `{k}` — {len(by_kind[k])}")
    lines.append("")
    lines.append("## By book")
    for b in sorted(by_book, key=lambda b: -by_book[b]):
        lines.append(f"- `{b}` — {by_book[b]}")
    lines.append("")
    lines.append("## Machine-flagged claims (review these first)")
    if not flagged:
        lines.append("_None flagged by the current heuristics. The human review still covers "
                     "every claim (flags are a starting point, not the whole audit)._")
    else:
        by_flag = defaultdict(list)
        for cid, kind, book, fl in flagged:
            for f in fl:
                by_flag[f].append((cid, kind, book))
        for f in sorted(by_flag, key=lambda f: -len(by_flag[f])):
            lines.append(f"### `{f}` — {len(by_flag[f])}")
            for cid, kind, book in by_flag[f][:200]:
                lines.append(f"- {cid}  ({kind}, {book})")
            if len(by_flag[f]) > 200:
                lines.append(f"- … +{len(by_flag[f]) - 200} more")
            lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    claims, by_kind, by_book, flagged = build()
    safe_rewrite(WORKLIST, render(claims, by_kind, by_book, flagged))
    print(f"corpus_audit — {len(claims)} claims, {len(flagged)} flagged for review")
    print(f"worklist written: {WORKLIST.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
