#!/usr/bin/env python3
"""corpus_audit.py -- the full-corpus audit HARNESS (crack #4 fix, 2026-07-06;
pre-triage upgrade, 2026-07-08).

The mandatory pre-Phase-G audit (memory: full-corpus-audit-before-phase-g) is human-
judgment work -- mis-labels, off-source citations, presentation bugs -- that the source
rule forbids an agent from resolving autonomously. This tool does the MACHINE-actionable
half: it reads every sealed claim shard and emits a reviewable WORKLIST that pre-sorts
all claims into three tiers (SUSPECT / needs-a-look / likely-fine), and attaches to every
suspect a PROPOSED DISPOSITION -- a suggested action, phrased as a check, never a verdict,
so the human review is systematic and provable rather than a prose promise. It NEVER
edits a claim.

Pairs with:
  - eden/tools/corpus-audit-status.json -- the structural lock (frozen_claim_count).
  - the corpus_audit_gate invariant -- blocks Phase G mining until phase_g_unlocked.

Run: `PYTHONUTF8=1 python eden/tools/corpus_audit.py`  ->  regenerates the worklist,
prints a summary. The worklist file is REGENERABLE (not sacred); it is the audit's
scratch surface, refreshed each run.

WHY the 2026-07-08 upgrade (the kickoff review found it): the old single flag
`dose_without_dose` conflated two very different things -- (a) valid RANGE doses stored
as strings ("20-30", "5,000"), which the deriver parses correctly (a false alarm), and
(b) genuinely mis-labelled dose claims (RDA / average-intake / toxicity / per-kg figures
carrying kind="dose"). The harness now parses amounts the SAME way targets_derive does
(single source of truth), so it stops crying wolf on valid ranges, and it adds the
semantic detectors for the real mislabel class the old type-check could not see.

Suspect flags (a flag means "a human should look", NEVER "wrong"):
  STRUCTURE
    off_source          locator.book is not a books-meta book_id (books-only rule)
    no_verbatim         empty / missing verbatim
    no_claim_text       empty / missing claim_text
    over_hard_cap       verbatim exceeds the 1200-char hard ceiling
    table_shaped        verbatim looks like an un-headed table lifted whole (bars/gaps
                        signature, or 2+ ALL-CAPS-label rows -- Base Line Fig. 8-1 shape)
    unknown_kind        kind not in the known claim-kind vocabulary
  DOSE STRUCTURE
    dose_null           kind=="dose" but no structured dose amount at all
    dose_unparseable    kind=="dose", amount present but the deriver cannot read it
    dose_range_high_lost kind=="dose", a comma-bearing range whose HIGH end the deriver
                         silently drops ("1,000-1,500" -> low=1000, high=None) -- a real
                         targets_derive._parse_amount bug this audit surfaced
  DOSE SEMANTICS (the latent mislabel class -- kind=="dose" but the text is descriptive)
    dose_reports_rda      text cites the RDA / Recommended Dietary Allowance
    dose_reports_intake   text reports average/typical/dietary INTAKE (not a recommendation)
    dose_reports_toxicity text is about toxicity / a "not toxic up to" ceiling
    dose_per_kg           text gives a per-body-weight requirement (mg/kg), not a flat dose
  REVERSE MISLABEL
    nondose_states_dose  a non-dose claim whose text asserts a recommended/maintenance DOSE
                         (a possible MISSED dose claim)
"""
import json
import re
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


def _parse_amount(a):
    """Read a dose amount the SAME way the coverage deriver does. Imported from
    targets_derive so the audit's notion of "parseable / range" can never drift from
    the real target math (single source of truth); the dose_range_high_lost detector
    self-heals the moment the deriver's comma bug is fixed."""
    sys.path.insert(0, str(ROOT / "eden" / "tools"))
    from targets_derive import _parse_amount as deriver_parse
    return deriver_parse(a)


# --- semantic detectors (compiled once) ------------------------------------------------
# Descriptive-intake phrasing, deliberately NOT bare "intake": a genuine recommendation
# ("a daily intake of 5,000 mg") must stay clean, only reported/average intake trips this.
_RE_INTAKE = re.compile(
    r"average (american |adult )?(daily )?intake|average american|takes? in \d|"
    r"typical (daily )?intake|daily intake in food|dietary [\w ]*intake",
    re.I,
)
_RE_RDA = re.compile(r"\brda\b|recommended dietary allowance", re.I)
_RE_TOX = re.compile(r"toxic|toxicity", re.I)
_RE_PERKG = re.compile(r"mg\s*/\s*kg|per kilogram|per kg\b", re.I)
_RE_STATES_DOSE = re.compile(
    r"recommended (maintenance )?dose|maintenance dose (of|is|for)|"
    r"recommended (daily )?intake of \d",
    re.I,
)
# A lifted TABLE row: an ALL-CAPS label (>=3 letters -- BIOTIN, FOLIC, ZINC, TIN, VANADIUM)
# followed within a short non-lowercase window by a number (the Base Line Fig. 8-1 shape).
# Prose lists doses with LOWERCASE nutrient names + connectives ("zinc 50 mg t.i.d., vitamin
# A at 300,000 IU"), so this fires on a real headerless table, NOT on a sentence that merely
# names two doses. (The kickoff review found the loose "any word+number+mg" version mistook
# 9 prose protocol/mechanism paragraphs for tables -- this is the tightened replacement.)
_RE_TABLE_ROW = re.compile(r"\b[A-Z]{3,}\b[^a-z\n]{0,12}\d")


def _book_ids():
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return {b["book_id"] for b in meta["books"]}


def _table_shaped(verbatim: str) -> bool:
    """Suspect (not a verdict) that an un-headed / multi-row table was lifted whole:
    either the digit-run+bars/gaps signature, OR two-plus ALL-CAPS-label rows (the
    "COPPER 2 mg 3 to 4 mg / FLUORIDE 1.5 mg ..." shape the kickoff review found)."""
    digit_runs = len(re.findall(r"\d{2,}", verbatim))
    bars = verbatim.count("|")
    gaps = len(re.findall(r"\S {2,}\S", verbatim))
    if digit_runs >= 4 and (bars >= 2 or gaps >= 4):
        return True
    return len(_RE_TABLE_ROW.findall(verbatim)) >= 2


def _flags(claim: dict, book_ids: set) -> list:
    flags = []
    loc = claim.get("locator") or {}
    text = f"{claim.get('claim_text') or ''} {claim.get('verbatim') or ''}"

    # structure
    if loc.get("book") not in book_ids:
        flags.append("off_source")
    kind = claim.get("kind")
    if kind not in KNOWN_KINDS:
        flags.append("unknown_kind")

    # dose structure + semantics
    if kind == "dose":
        dose = claim.get("dose") or {}
        amt = dose.get("amount")
        if amt is None:
            flags.append("dose_null")
        else:
            low, high = _parse_amount(amt)
            if low is None:
                flags.append("dose_unparseable")
            elif high is None and isinstance(amt, str) and "," in amt and re.search(r"[-–]", amt):
                # a comma-bearing range the deriver truncates to its low end only
                flags.append("dose_range_high_lost")
        if _RE_RDA.search(text):
            flags.append("dose_reports_rda")
        if _RE_INTAKE.search(text):
            flags.append("dose_reports_intake")
        if _RE_TOX.search(text):
            flags.append("dose_reports_toxicity")
        if _RE_PERKG.search(text):
            flags.append("dose_per_kg")
    else:
        # reverse mislabel: a non-dose claim that asserts a recommended/maintenance dose
        if _RE_STATES_DOSE.search(text):
            flags.append("nondose_states_dose")

    # verbatim / claim_text health
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


# Proposed disposition per flag -- a CHECK to run, never a verdict. When several flags
# fire, the highest-priority one below leads; the rest are still listed on the claim line.
_DISPOSITION = {
    "off_source": "citation is not a books-meta book_id -- verify the source (books-only rule)",
    "dose_null": "kind=dose but no structured amount -- structure the stated dose, OR reclassify if it is not a Wallach recommendation",
    "dose_unparseable": "kind=dose but the amount string does not parse -- fix the amount or the schema",
    "dose_range_high_lost": "comma-range HIGH end dropped by targets_derive._parse_amount -- fix the parser; confirm this is a real target",
    "dose_reports_rda": "text cites the RDA -- verify Wallach is RECOMMENDING, not merely reporting the RDA (else reclassify dose->definition)",
    "dose_reports_intake": "text reports average/typical intake, not a recommendation -- likely reclassify dose->definition",
    "dose_reports_toxicity": "text is about toxicity -- verify this is a dose and not a toxicity_sign",
    "dose_per_kg": "per-body-weight requirement (mg/kg), not a flat supplement dose -- likely reclassify dose->definition/mechanism",
    "nondose_states_dose": "non-dose claim asserts a recommended/maintenance dose -- check for a MISSED dose claim",
    "table_shaped": "verbatim looks like a lifted table row/block -- check the verbatim is scoped + readable for this claim",
    "over_hard_cap": "verbatim exceeds the 1200-char hard cap -- trim to the mapped span",
    "no_verbatim": "no verbatim -- a claim must carry Wallach's exact words",
    "no_claim_text": "no claim_text -- add the plain-language summary",
    "unknown_kind": "kind is outside the known vocabulary -- fix the typo or register the new kind",
}
# lower index = leads the disposition line
_FLAG_PRIORITY = [
    "off_source", "dose_range_high_lost", "dose_null", "dose_unparseable",
    "dose_reports_rda", "dose_reports_intake", "dose_reports_toxicity", "dose_per_kg",
    "nondose_states_dose", "table_shaped", "over_hard_cap", "no_verbatim",
    "no_claim_text", "unknown_kind",
]


def _lead_flag(flags: list) -> str:
    for f in _FLAG_PRIORITY:
        if f in flags:
            return f
    return flags[0]


def build():
    book_ids = _book_ids()
    claims = []
    for shard in sorted(CLAIMS_DIR.glob("claims-*.json")):
        for c in json.loads(shard.read_text(encoding="utf-8")).get("claims", []):
            claims.append((shard.name, c))
    by_kind = defaultdict(list)
    by_book = defaultdict(int)
    rows = []  # (id, kind, book, flags, tier)
    for _shard_name, c in claims:
        kind = c.get("kind", "?")
        book = (c.get("locator") or {}).get("book", "?")
        by_kind[kind].append(c)
        by_book[book] += 1
        fl = _flags(c, book_ids)
        if fl:
            tier = "suspect"
        elif kind == "dose":
            tier = "needs-a-look"  # carries a number that drives coverage -- confirm each
        else:
            tier = "likely-fine"
        rows.append((c.get("id", "?"), kind, book, fl, tier))
    return claims, by_kind, by_book, rows


def render(claims, by_kind, by_book, rows) -> str:
    suspects = [r for r in rows if r[4] == "suspect"]
    needs = [r for r in rows if r[4] == "needs-a-look"]
    fine = [r for r in rows if r[4] == "likely-fine"]

    lines = []
    lines.append("# Corpus audit worklist  (GENERATED -- regenerate with `python eden/tools/corpus_audit.py`)")
    lines.append("")
    lines.append("_The machine half of the mandatory pre-Phase-G full-corpus audit "
                 "(memory: full-corpus-audit-before-phase-g). Every claim is pre-sorted into a "
                 "TIER; each suspect carries a PROPOSED DISPOSITION -- a check to run, never a "
                 "verdict. This file is regenerable scratch, not a sacred log._")
    lines.append("")
    lines.append(f"**Total claims:** {len(claims)}  ·  "
                 f"**suspect:** {len(suspects)}  ·  "
                 f"**needs-a-look:** {len(needs)}  ·  "
                 f"**likely-fine:** {len(fine)}")
    lines.append("")

    lines.append("## By kind")
    for k in sorted(by_kind, key=lambda k: -len(by_kind[k])):
        lines.append(f"- `{k}` — {len(by_kind[k])}")
    lines.append("")
    lines.append("## By book")
    for b in sorted(by_book, key=lambda b: -by_book[b]):
        lines.append(f"- `{b}` — {by_book[b]}")
    lines.append("")

    # ---- Tier 1: suspects (review first) -----------------------------------------------
    lines.append("## Tier 1 — SUSPECTS (review first)")
    lines.append("")
    if not suspects:
        lines.append("_None flagged by the current heuristics._")
    else:
        by_flag = defaultdict(int)
        for _cid, _k, _b, fl, _t in suspects:
            for f in fl:
                by_flag[f] += 1
        lines.append("**Flag tally:** " + "  ·  ".join(
            f"`{f}`×{by_flag[f]}" for f in sorted(by_flag, key=lambda f: -by_flag[f])))
        lines.append("")
        for cid, kind, book, fl, _t in sorted(suspects, key=lambda r: (r[2], r[0])):
            lead = _lead_flag(fl)
            flagstr = ", ".join(fl)
            lines.append(f"- **{cid}**  ({kind}, {book})")
            lines.append(f"  - flags: {flagstr}")
            lines.append(f"  - PROPOSED: {_DISPOSITION.get(lead, lead)}")
    lines.append("")

    # ---- Tier 2: needs-a-look (clean dose claims -- confirm the number) -----------------
    lines.append("## Tier 2 — needs-a-look (structurally clean dose claims; confirm the target number)")
    lines.append("")
    if not needs:
        lines.append("_None._")
    else:
        for cid, kind, book, _fl, _t in sorted(needs, key=lambda r: (r[2], r[0])):
            lines.append(f"- {cid}  ({kind}, {book})")
    lines.append("")

    # ---- Tier 3: likely-fine (lowest priority; still in audit scope) -------------------
    lines.append("## Tier 3 — likely-fine (counts only; lowest priority, still in scope)")
    lines.append("")
    fine_by_kind = defaultdict(int)
    for _cid, k, _b, _fl, _t in fine:
        fine_by_kind[k] += 1
    for k in sorted(fine_by_kind, key=lambda k: -fine_by_kind[k]):
        lines.append(f"- `{k}` — {fine_by_kind[k]}")
    lines.append("")
    lines.append("_Tier 3 is enumerated by count, not per-claim: these carry no machine-"
                 "detectable suspect signal. They remain in the audit's scope at the lowest "
                 "priority -- the shards are the review surface once Tiers 1-2 are clear._")
    return "\n".join(lines) + "\n"


def main() -> int:
    sys.path.insert(0, str(ROOT / "tools"))
    from safe_write import safe_rewrite
    claims, by_kind, by_book, rows = build()
    safe_rewrite(WORKLIST, render(claims, by_kind, by_book, rows))
    n_suspect = sum(1 for r in rows if r[4] == "suspect")
    n_needs = sum(1 for r in rows if r[4] == "needs-a-look")
    print(f"corpus_audit — {len(claims)} claims · {n_suspect} suspect · {n_needs} needs-a-look")
    print(f"worklist written: {WORKLIST.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
