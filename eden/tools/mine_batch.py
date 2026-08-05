#!/usr/bin/env python3
"""mine_batch.py — transactional batch EDITOR for draft claims (the bulk-remediation fast path).

The batch mining workflow has two halves; this tool is the missing second one:
  - bulk ADD claims  -> corpus_extract.py finalize --raw  (existing: snaps each verbatim
                        to exact book bytes, assigns ids; append-only).
  - bulk EDIT claims -> THIS tool.

Why it exists: editing N draft claims used to mean N hand-staged safe_write calls (and a
seal after each). This applies a whole BATCH of field edits in ONE validate-all-then-write
pass (§00.B atomic + defense-in-depth), routed through safe_write.safe_rewrite (§17), so a
bulk remediation seals ONCE per batch, not once per edit.

Scope — edits ONLY the agent-owned SEMANTIC fields:
    claim_text * kind * essentials * other_substances * conditions * symptoms *
    dose * tags * confidence
It NEVER touches verbatim / char_offset / locator / id — those are snap-owned and guarded
by corpus_verify #2 (verbatim must be a real substring of the book). A verbatim change must
go through corpus_resnap / vb_apply; this tool HARD-REJECTS any attempt to set one here, so
the quote-integrity gate can never be bypassed through this path.

Up-front validation (fail fast, BEFORE the seal cycle): id must exist in the draft; only
editable fields; essentials subset of essentials-canon; kind in the allowed set; dose is
null-or-object; list fields are lists of non-empty strings; claim_text non-empty. If ANY
edit is invalid, NOTHING is written (transactional).

Batch file shape:
  { "book": "<book_id>",
    "edits": [ { "id": "WAL-CLM-...", "set": { "claim_text": "...", "conditions": ["x"] } } ] }

Usage:
  python eden/tools/mine_batch.py apply --batch <batch.json>            # write via safe_write
  python eden/tools/mine_batch.py apply --batch <batch.json> --dry-run  # report, write nothing
  python eden/tools/mine_batch.py selftest                              # self-check the applier
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
DRAFTS_DIR = CORPUS / "drafts"
CANON_PATH = CORPUS / "essentials-canon.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

# Mirrors corpus_extract.KINDS — keep in sync (same patch).
KINDS = {"dose", "protocol", "deficiency_sign", "toxicity_sign", "mechanism", "food_source",
         "interaction", "contraindication", "prognosis", "diagnostic_pattern", "prevalence",
         "quote", "definition", "personal_anecdote"}
CONFIDENCE = {"low", "medium", "high"}
# Agent-owned fields this tool may edit. Everything else (esp. verbatim / char_offset /
# locator / id) is snap-owned and rejected — a verbatim edit must go via corpus_resnap.
EDITABLE = {"claim_text", "kind", "essentials", "other_substances", "conditions",
            "symptoms", "dose", "tags", "confidence"}
LIST_FIELDS = {"essentials", "other_substances", "conditions", "symptoms", "tags"}


def load_canon() -> set:
    return {e["slug"] for e in json.loads(CANON_PATH.read_text(encoding="utf-8"))["essentials"]}


def plan_edits(claims, edits, canon):
    """Validate a batch WITHOUT mutating. Returns (ops, errors); ops is a list of
    (claim_dict, field, new_value, old_value) to apply IFF errors is empty."""
    by_id = {c.get("id"): c for c in claims}
    ops, errors = [], []
    for n, ed in enumerate(edits, 1):
        ctx = f"edit[{n}]"
        cid = ed.get("id")
        if not cid:
            errors.append(f"{ctx}: missing 'id'"); continue
        claim = by_id.get(cid)
        if claim is None:
            errors.append(f"{ctx}: id {cid!r} not found in draft"); continue
        st = ed.get("set")
        if not isinstance(st, dict) or not st:
            errors.append(f"{ctx} ({cid}): 'set' must be a non-empty object"); continue
        forbidden = [k for k in st if k not in EDITABLE]
        if forbidden:
            errors.append(f"{ctx} ({cid}): non-editable field(s) {forbidden} — verbatim/"
                          f"char_offset/id are snap-owned (use corpus_resnap/vb_apply)"); continue
        field_errs = []
        for k, v in st.items():
            if k == "claim_text":
                if not isinstance(v, str) or not v.strip():
                    field_errs.append("claim_text must be a non-empty string")
            elif k == "kind":
                if v not in KINDS:
                    field_errs.append(f"kind {v!r} not in the allowed set")
            elif k == "confidence":
                if v not in CONFIDENCE:
                    field_errs.append(f"confidence {v!r} not in {sorted(CONFIDENCE)}")
            elif k == "dose":
                if v is not None and not isinstance(v, dict):
                    field_errs.append("dose must be null or an object")
            elif k in LIST_FIELDS:
                if not isinstance(v, list) or any(not isinstance(x, str) or not x.strip() for x in v):
                    field_errs.append(f"{k} must be a list of non-empty strings")
                elif k == "essentials":
                    non_canon = [x for x in v if x not in canon]
                    if non_canon:
                        field_errs.append(f"non-canon essential slug(s) {non_canon}")
        if field_errs:
            errors.append(f"{ctx} ({cid}): " + "; ".join(field_errs)); continue
        for k, v in st.items():
            old = claim.get(k)
            if old != v:
                ops.append((claim, k, v, old))
    return ops, errors


def _fmt(v):
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    return s if len(s) <= 60 else s[:57] + "..."


def _detect_indent(raw: str, doc, path) -> int:
    """Return the indent that reproduces `raw` byte-exactly, or refuse to write.

    The pillars are NOT uniform -- lets-play-doctor is indent=2 and the other six
    drafts are indent=1 -- so a hardcoded indent silently reformats every file it
    guesses wrong about. That happened: a one-field claim_text edit here rewrote the
    entire lets-play-doctor draft, and corpus_seal promoted the reformat onto the
    sealed shard, burying a 2-line change in 40,000 diff lines. Measure, never assume.
    """
    for n in (1, 2, 3, 4):
        if json.dumps(doc, indent=n, ensure_ascii=False) + "\n" == raw:
            return n
    raise SystemExit(f"REFUSING TO WRITE {path}: no indent 1-4 reproduces it byte-exactly")

def cmd_apply(args) -> int:
    batch = json.loads(Path(args.batch).read_text(encoding="utf-8"))
    book = batch.get("book")
    if not book:
        print("batch missing 'book'"); return 1
    edits = batch.get("edits", [])
    if not isinstance(edits, list) or not edits:
        print("batch has no 'edits'"); return 1
    draft_path = DRAFTS_DIR / f"claims-{book}.draft.json"
    if not draft_path.exists():
        print(f"no draft for book {book!r}: {draft_path}"); return 1
    _raw = draft_path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    draft = json.loads(_raw)
    indent = _detect_indent(_raw, draft, draft_path)
    claims = draft.get("claims", [])
    canon = load_canon()

    ops, errors = plan_edits(claims, edits, canon)
    if errors:
        print(f"BATCH REJECTED — {len(errors)} error(s), nothing written:")
        for e in errors:
            print(f"  - {e}")
        return 1
    if not ops:
        print("no-op: every edit already matches the draft (nothing to write)."); return 0

    n_claims = len({c["id"] for c, *_ in ops})
    print(f"{'DRY-RUN — ' if args.dry_run else ''}{len(ops)} field change(s) across "
          f"{n_claims} claim(s) in {book}:")
    for c, f, nv, ov in ops:
        print(f"  {c['id']} * {f}: {_fmt(ov)}  ->  {_fmt(nv)}")
    if args.dry_run:
        print("dry-run: nothing written."); return 0

    for c, f, nv, ov in ops:
        c[f] = nv
    payload = json.dumps(draft, indent=indent, ensure_ascii=False) + "\n"
    nbytes = safe_write.safe_rewrite(draft_path, payload)
    print(f"APPLIED {len(ops)} change(s) -> {draft_path.relative_to(ROOT)} ({nbytes} B via safe_write).")
    print("Next (batch checkpoint): corpus_seal -> corpus_embed -> build -> invariants -> render probe.")
    return 0


def cmd_selftest(args) -> int:
    canon = {"magnesium", "zinc"}

    def fresh():
        return [
            {"id": "T-1", "kind": "dose", "essentials": ["zinc"], "other_substances": [],
             "conditions": ["acne"], "symptoms": [], "claim_text": "old text",
             "verbatim": "book bytes", "dose": None, "tags": [], "confidence": "medium"},
            {"id": "T-2", "kind": "definition", "essentials": ["magnesium"], "other_substances": [],
             "conditions": [], "symptoms": [], "claim_text": "def", "verbatim": "bytes",
             "dose": None, "tags": [], "confidence": "medium"},
        ]

    cases = []
    c = fresh()
    ops, errs = plan_edits(c, [{"id": "T-1", "set": {"claim_text": "new", "conditions": ["acne", "eczema"]}}], canon)
    cases.append(("valid edit -> 0 errors", len(errs) == 0))
    cases.append(("valid edit -> 2 ops", len(ops) == 2))
    cases.append(("plan does NOT mutate source until applied", c[0]["claim_text"] == "old text"))
    _, errs = plan_edits(fresh(), [{"id": "T-9", "set": {"claim_text": "x"}}], canon)
    cases.append(("unknown id rejected", len(errs) == 1 and "not found" in errs[0]))
    _, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"essentials": ["unobtanium"]}}], canon)
    cases.append(("non-canon essential rejected", len(errs) == 1 and "non-canon" in errs[0]))
    _, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"verbatim": "hacked"}}], canon)
    cases.append(("verbatim edit HARD-rejected", len(errs) == 1 and "non-editable" in errs[0]))
    _, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"claim_text": "   "}}], canon)
    cases.append(("empty claim_text rejected", len(errs) == 1))
    _, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"kind": "nonsense"}}], canon)
    cases.append(("bad kind rejected", len(errs) == 1))
    _, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"conditions": ["ok", "  "]}}], canon)
    cases.append(("blank list item rejected", len(errs) == 1))
    ops, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"claim_text": "ok"}},
                                     {"id": "T-2", "set": {"essentials": ["unobtanium"]}}], canon)
    cases.append(("mixed batch surfaces the bad edit (transactional)", len(errs) == 1))
    ops, errs = plan_edits(fresh(), [{"id": "T-1", "set": {"claim_text": "old text"}}], canon)
    cases.append(("no-op edit -> 0 ops", len(errs) == 0 and len(ops) == 0))

    fails = [name for name, ok in cases if not ok]
    for name, ok in cases:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    print(f"\n{'ALL SELFTESTS PASS' if not fails else str(len(fails)) + ' FAILURE(S)'}")
    return 0 if not fails else 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Transactional batch editor for draft claims (§17-routed).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    pa = sub.add_parser("apply", help="apply a batch of claim edits (validate-all-then-write)")
    pa.add_argument("--batch", required=True, help="path to the batch JSON")
    pa.add_argument("--dry-run", action="store_true", help="report planned changes, write nothing")
    sub.add_parser("selftest", help="self-check the applier logic")
    args = ap.parse_args()
    if args.cmd == "selftest":
        return cmd_selftest(args)
    return cmd_apply(args)


if __name__ == "__main__":
    sys.exit(main())
