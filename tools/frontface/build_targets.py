"""Rebuild the vision-sweep target set from the CURRENT sealed corpus.

WHY not reuse chronicle/frontface-ocr/worklist.json: it was built 2026-08-02 12:37, BEFORE that
session's ~200 source fixes + three reseals (kv 439 -> 444). Its verbatims and char_offsets are
pre-fix and would re-flag defects that are already corrected. The authoritative backlog is
verified.json::grandfathered.claim_ids (that is the set the enriched_book_is_verified gate reads);
this pairs each id with the verbatim the corpus holds TODAY.
"""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
OUT = WORK

led = json.loads((ROOT / "chronicle/frontface-ocr/verified.json").read_text(encoding="utf-8"))
grand = led["grandfathered"]["claim_ids"]
done = set(led["claims_verified"])

targets = {}
report = []
for book, ids in grand.items():
    claims = json.loads((ROOT / f"eden/corpus/claims/claims-{book}.json").read_text(encoding="utf-8"))["claims"]
    by_id = {c["id"]: c for c in claims}
    rows, missing = [], []
    for cid in ids:
        c = by_id.get(cid)
        if c is None:
            missing.append(cid)
            continue
        rows.append({"id": cid, "kind": c["kind"], "verbatim": c["verbatim"],
                     "verbatim_len": len(c["verbatim"]),
                     "locator": c.get("locator") or {}})
    targets[book] = rows
    report.append((book, len(ids), len(rows), len(missing), len(set(ids) & done)))

(OUT / "targets.json").write_text(json.dumps(targets, indent=1), encoding="utf-8")

print(f"{'book':20s} {'backlog':>8s} {'resolved':>9s} {'missing':>8s} {'alsoVerified':>13s} {'chars':>9s}")
tot = 0
for book, n, r, m, dv in report:
    ch = sum(x["verbatim_len"] for x in targets[book])
    tot += r
    print(f"{book:20s} {n:8d} {r:9d} {m:8d} {dv:13d} {ch:9d}")
print(f"{'TOTAL':20s} {'':8s} {tot:9d}")
