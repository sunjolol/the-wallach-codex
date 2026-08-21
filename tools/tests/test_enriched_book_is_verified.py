#!/usr/bin/env python3
"""Negative test for enriched_book_is_verified (§00.B "codify, don't promise").

THE ROOT CAUSE this gate exists for, 2026-08-02: claims were ENRICHED -- made front-facing -- from
books officially "raw" (untouched OCR) in eden/tools/purity-status.json, on the rule "we fix source
quotes as we enrich". That rule had NO GATE, was not kept, and nothing caught it, so users were
shown quotes reading "tisk"/"rea"/"ancer".

CASE 'new_enrichment_from_unverified_book_fires' IS the incident, reduced to one case. If it ever
flips silent, the exact failure this gate exists for can recur unnoticed.

The SPARING cases matter as much: a verified book, an individually-verified claim, and the
frozen grandfathered backlog must all stay silent, or the gate would redden the whole existing
front-facing corpus and be turned off within a day.

Run:  PYTHONUTF8=1 python tools/tests/test_enriched_book_is_verified.py"""
import importlib.util, json, sys, tempfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("invariants", ROOT/"tools"/"invariants.py")
inv = importlib.util.module_from_spec(spec); spec.loader.exec_module(inv)
res = []

REASON = "already front-facing when the gate landed; a backlog, not a correctness claim"

def fcase(name, claims, enriched, ledger, want_clean):
    with tempfile.TemporaryDirectory() as td:
        r = Path(td)
        (r/"eden"/"corpus"/"claims").mkdir(parents=True)
        (r/"tools"/"gate-fixtures").mkdir(parents=True)
        by_book = {}
        for cid, bk in claims.items(): by_book.setdefault(bk, []).append({"id": cid, "verbatim": "x"})
        for bk, cl in by_book.items():
            (r/"eden"/"corpus"/"claims"/f"claims-{bk}.json").write_text(
                json.dumps({"book_id": bk, "claims": cl}), encoding="utf-8")
        (r/"eden"/"corpus"/"search-enrichment.json").write_text(
            json.dumps({"enrichment": {c: {} for c in enriched}}), encoding="utf-8")
        (r/"tools"/"gate-fixtures"/"frontface-verified.json").write_text(
            json.dumps(ledger), encoding="utf-8")
        real = inv.ROOT
        try:
            inv.ROOT = r; ok_flag, msg = inv.check_enriched_book_is_verified()
        finally:
            inv.ROOT = real
    ok = ok_flag == want_clean
    print(f"  {'PASS' if ok else 'FAIL'}  {name:44s} want={'clean' if want_clean else 'RED':5s} "
          f"got={'clean' if ok_flag else 'RED':5s}  [{msg[:60]}]")
    res.append(ok)

CLAIMS = {"WAL-CLM-RAW-000001": "rawbook", "WAL-CLM-RAW-000002": "rawbook",
          "WAL-CLM-OK-000001": "goodbook"}
LEDGER = lambda **kw: {"books_verified": kw.get("books", []),
                       "claims_verified": kw.get("claims", []),
                       "grandfathered": {"reason": kw.get("reason", REASON),
                                         "claim_ids": kw.get("gf", {})}}

print("=" * 100); print("enriched_book_is_verified"); print("=" * 100)
# ★ LOAD-BEARING — THE INCIDENT: a NEW claim enriched from a raw book, in no ledger list.
fcase("new_enrichment_from_unverified_book_fires", CLAIMS,
      ["WAL-CLM-RAW-000002"], LEDGER(gf={"rawbook": ["WAL-CLM-RAW-000001"]}), False)
# SPARING: the book is verified -> anything from it may be front-faced.
fcase("verified_book_spared", CLAIMS, ["WAL-CLM-OK-000001"], LEDGER(books=["goodbook"]), True)
# SPARING: the escape hatch -- verify THIS claim against its page, then enrich it.
fcase("individually_verified_claim_spared", CLAIMS,
      ["WAL-CLM-RAW-000002"], LEDGER(claims=["WAL-CLM-RAW-000002"]), True)
# SPARING: the frozen backlog must not redden the existing front-facing corpus.
fcase("grandfathered_claim_spared", CLAIMS,
      ["WAL-CLM-RAW-000001"], LEDGER(gf={"rawbook": ["WAL-CLM-RAW-000001"]}), True)
# The backlog is a waiver, so it must carry a reason a reviewer can check.
fcase("reasonless_grandfather_red", CLAIMS,
      ["WAL-CLM-RAW-000001"], LEDGER(gf={"rawbook": ["WAL-CLM-RAW-000001"]}, reason="  "), False)
# Nothing enriched at all -> vacuously clean, never an invented failure.
fcase("no_enrichment_vacuously_clean", CLAIMS, [], LEDGER(), True)

print(); print("=" * 100); print("LIVE REPO"); print("=" * 100)
ok_flag, msg = inv.check_enriched_book_is_verified()
print(f"  {'PASS' if ok_flag else 'FAIL'}  live_repo_clean   {msg}")
res.append(ok_flag)
print("-" * 100)
if not all(res):
    print(f"FAIL — {sum(1 for r in res if not r)}/{len(res)} case(s) misbehaved."); sys.exit(1)
print(f"PASS — all {len(res)} cases: a NEW front-facing quote from an unverified book is RED (the "
      f"incident), while a verified book, an individually-verified claim and the frozen backlog stay "
      f"silent, and an unexplained waiver is itself RED.")
