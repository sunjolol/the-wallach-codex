#!/usr/bin/env python3
"""verbatim_audit.py — does each claim's verbatim NAME every condition it surfaces under?

THE RULE: a Wallach quote shown under a condition MUST name that condition (or a
registered synonym) in the SHOWN verbatim text, else the link is unverifiable --
indistinguishable from a hallucination.

This is the shared matcher for two consumers:
  * the `verbatim_names_mapped_conditions` invariant (tools/invariants.py) — guards
    against NEW violations while the backlog is remediated;
  * the remediation report + baseline regeneration (this CLI).

Only claims that actually surface under a condition are checked — we iterate the
conditions index's `claims_by_role`, so a claim that maps no condition operationally
is never counted.

Matching (name-or-synonym): the verbatim, OCR-folded and
punctuation-stripped, must contain — as a contiguous phrase — the condition's
display name (stopwords dropped), its slug tokens, OR one registered synonym from
the Catalog pillar (eden/catalog/conditions.json, read via
catalog.condition_synonyms()). The synonym map lets faithful paraphrase links
("depressed immune system" ↔ immune_depression) verify.

CLI:
  report    — OK / FINDABLE / NOT_FINDABLE breakdown + per-book counts + samples
  baseline  — (re)write verbatim-audit-baseline.json = the allowlist of CURRENT
              violations the invariant tolerates; shrinks to {} as we remediate.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent            # eden/tools
CORPUS = HERE.parent / "corpus"                    # eden/corpus
ROOT = HERE.parent.parent                          # repo root
BASELINE_PATH = HERE / "verbatim-audit-baseline.json"
sys.path.insert(0, str(HERE))
import catalog  # noqa: E402  (Catalog pillar loader -- condition synonyms + taxonomy single-sourced)

# Words with no discriminating power for a condition name — dropped before match.
STOP = {"disease", "diseases", "syndrome", "disorder", "the", "and", "of", "chronic",
        "acute", "congenital", "deficiency", "s", "a", "in", "type", "problems", "condition"}
_FOLD = {"‘": "'", "’": "'", "“": '"', "”": '"', "—": "-", "–": "-"}

def norm(s: str) -> str:
    # Apostrophes are DROPPED, not turned into a space: a possessive disease name in the book
    # ("Reye's syndrome", "Erb's palsy") must match its catalogue form ("Reyes Syndrome",
    # "Erbs Palsy"). Turning ' into a space produced "reye s syndrome", which could never match.
    # Measured before changing: 2 violations resolved, 0 created.
    s = "".join(_FOLD.get(c, c) for c in s)
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower().replace("'", ""))
    return re.sub(r"\s+", " ", s).strip()

def sig_phrase(s: str) -> str:
    return " ".join(w for w in norm(s).split() if w not in STOP)


def accepted_phrases(slug: str, display: str, syn: dict) -> list:
    out = set()
    for base in (display, slug.replace("_", " ")):
        p = sig_phrase(base)
        if p:
            out.add(p)
    for alt in syn.get(slug, []):
        p = sig_phrase(alt)
        if p:
            out.add(p)
    return [p for p in out if p]


def names(text_norm: str, slug: str, display: str, syn: dict) -> bool:
    """True iff the normalized text names the condition (name / synonym).

    Compare against the STOPWORD-STRIPPED text (sig_phrase), not the raw normalized
    text: accepted_phrases are themselves stopword-stripped, so matching raw text
    makes a faithful phrase like "loss of libido" (sig "loss libido") fail against a
    verbatim "loss of libido" -- the "of" exists only on one side. Stripping both
    sides fixes that asymmetry (measured: 313->308 total, clears 5 legitimate
    "loss-of-sense-of-X" links, 0 regressions)."""
    text_sig = sig_phrase(text_norm)
    if any(p and p in text_sig for p in accepted_phrases(slug, display, syn)):
        return True
    # Named-by-proxy: an UMBRELLA condition is "named" when the
    # verbatim names any registered CHILD subtype (leukemia -> cancer); child->parent
    # only. The exact-condition-named rule stays the default; this is the logged
    # exception, surfaced per mapping by the umbrella_proxy_named info-invariant.
    for child in taxonomy().get(slug, []):
        if any(p and p in text_sig for p in accepted_phrases(child, child.replace("_", " "), syn)):
            return True
    return False


def load_syn() -> dict:
    """Condition synonyms, single-sourced from the Catalog pillar (eden/catalog/
    conditions.json) -- key = condition slug, value = alt phrasings Wallach uses."""
    return catalog.condition_synonyms()


_TAXONOMY = None


def load_taxonomy() -> dict:
    """Umbrella->children map, single-sourced from the Catalog pillar."""
    return catalog.condition_taxonomy()


def taxonomy() -> dict:
    """Cached umbrella->children map (read once)."""
    global _TAXONOMY
    if _TAXONOMY is None:
        _TAXONOMY = load_taxonomy()
    return _TAXONOMY


def proxy_named_mappings():
    """(claim_id, umbrella_slug, child_slug) for mappings an umbrella satisfies ONLY
    by naming a child subtype (not the umbrella word) — the named-by-proxy decisions,
    surfaced for human review by the umbrella_proxy_named invariant."""
    syn = load_syn()
    tax = taxonomy()
    cond, claim_by_id, _ = _load_corpus()
    out = []
    for slug, cinfo in cond.items():
        if not isinstance(cinfo, dict) or slug not in tax:
            continue
        disp = cinfo.get("display_name", slug)
        ids = set()
        for role_ids in (cinfo.get("claims_by_role") or {}).values():
            ids.update(role_ids)
        for cid in sorted(ids):
            c = claim_by_id.get(cid)
            if c is None:
                continue
            ts = sig_phrase(norm(c.get("verbatim", "")))
            if any(pp and pp in ts for pp in accepted_phrases(slug, disp, syn)):
                continue  # direct name — not a proxy
            for child in tax[slug]:
                if any(pp and pp in ts for pp in accepted_phrases(child, child.replace("_", " "), syn)):
                    out.append((cid, slug, child))
                    break
    return sorted(out)


def _load_corpus():
    cond = json.loads((CORPUS / "indices" / "conditions.json").read_text(encoding="utf-8"))
    meta = json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))
    file_of = {b["book_id"]: b["file"] for b in meta["books"]}
    claim_by_id, txt_by_bid = {}, {}
    for shard in (CORPUS / "claims").glob("claims-*.json"):
        d = json.loads(shard.read_text(encoding="utf-8"))
        bid = d["book_id"]
        txt_by_bid[bid] = (ROOT / file_of[bid]).read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
        for c in d["claims"]:
            claim_by_id[c["id"]] = c
    return cond, claim_by_id, txt_by_bid


def audit():
    """Return (violations, classified):
      violations : set of (claim_id, condition_slug) whose verbatim does NOT name it
      classified : list of (claim_id, slug, kind, book) with kind FINDABLE/NOT_FINDABLE
    Idempotent + side-effect-free; safe to call from the invariant."""
    syn = load_syn()
    cond, claim_by_id, txt_by_bid = _load_corpus()
    violations, classified, seen = set(), [], set()
    for slug, cinfo in cond.items():
        if not isinstance(cinfo, dict):
            continue
        disp = cinfo.get("display_name", slug)
        ids = set()
        for role_ids in (cinfo.get("claims_by_role") or {}).values():
            ids.update(role_ids)
        for cid in ids:
            c = claim_by_id.get(cid)
            if c is None or (cid, slug) in seen:
                continue
            seen.add((cid, slug))
            if names(norm(c.get("verbatim", "")), slug, disp, syn):
                continue
            violations.add((cid, slug))
            bid = c["locator"]["book"]
            off = c["locator"].get("char_offset")
            txt = txt_by_bid.get(bid, "")
            kind = "NOT_FINDABLE"
            if off is not None and txt:
                window = norm(txt[max(0, off - 250): off + len(c.get("verbatim", "")) + 900])
                if names(window, slug, disp, syn):
                    kind = "FINDABLE"
            classified.append((cid, slug, kind, bid))
    return violations, classified


def load_baseline() -> set:
    if not BASELINE_PATH.exists():
        return set()
    d = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    return {(cid, s) for cid, slugs in d.items() if not cid.startswith("_") for s in slugs}


def new_violations() -> set:
    """Violations NOT in the baseline allowlist — the invariant's failure set."""
    viol, _ = audit()
    return viol - load_baseline()


def cmd_report():
    viol, classified = audit()
    base = load_baseline()
    kinds = Counter(k for _, _, k, _ in classified)
    per_book = Counter(b for _, _, _, b in classified)
    print("=== verbatim-names-condition audit ===")
    print(f"  total violations : {len(viol)}")
    print(f"    FINDABLE       : {kinds['FINDABLE']} (condition is in the source near the claim -> extend verbatim)")
    print(f"    NOT_FINDABLE   : {kinds['NOT_FINDABLE']} (extend-far or drop the mapping)")
    print(f"  per book         : {dict(per_book)}")
    print(f"  baselined (allowlisted) : {len(base)}")
    print(f"  NEW (would FAIL the invariant): {len(viol - base)}")
    stale = base - viol
    if stale:
        print(f"  stale baseline entries (fixed -- prune from baseline): {len(stale)}")


def cmd_baseline():
    viol, _ = audit()
    by_claim = {}
    for cid, slug in sorted(viol):
        by_claim.setdefault(cid, []).append(slug)
    out = {"_doc": "Allowlist of KNOWN verbatim-names-condition violations tolerated by the "
                    "verbatim_names_mapped_conditions invariant. Generated by "
                    "`verbatim_audit.py baseline`. Shrinks to {} as verbatims are extended or "
                    "mappings dropped. NEW violations (not here) FAIL the board.",
           "_count": len(viol)}
    for cid in sorted(by_claim):
        out[cid] = sorted(by_claim[cid])
    sys.path.insert(0, str(ROOT / "tools"))
    import safe_write
    payload = json.dumps(out, ensure_ascii=False, indent=2) + "\n"
    n = safe_write.safe_rewrite(BASELINE_PATH, payload)
    print(f"OK wrote baseline ({n} B) — {len(viol)} tolerated violations across {len(by_claim)} claims")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "report":
        cmd_report()
    elif cmd == "baseline":
        cmd_baseline()
    else:
        print(f"unknown command '{cmd}' (report | baseline)")
        sys.exit(2)


if __name__ == "__main__":
    main()
