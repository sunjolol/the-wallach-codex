#!/usr/bin/env python
"""Surgically patch immortality.txt at the 12 claims' spans (11 edits; 812 rides on 772).
Verify every corrected verbatim lands as an exact substring, then stage the patched .txt + --fix map."""
import json, os
BASE = r"C:/Users/Light/Desktop/claude/health expert"
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/immortality")
SCR = r"C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/95366a12-9f38-4bda-a400-366e05217891/scratchpad"

sh = {c["id"]: c for c in json.load(open(os.path.join(BASE, "eden/corpus/claims/claims-immortality.json"), encoding="utf-8"))["claims"]}
idmap = json.load(open(os.path.join(RAT, "idmap.json"), encoding="utf-8"))
corr = json.load(open(os.path.join(RAT, "corrected-verbatims.json"), encoding="utf-8"))

# sealed id -> corrected verbatim (only where changed)
fix_map = {}
patches = []  # (lo, hi, corrected) span replacements
CONTAINED = {"WAL-CLM-IMMORT-000539"}  # 812 rides on 772's span
for pid, sid in idmap.items():
    c = sh[sid]; ovb = c["verbatim"]; cvb = corr[pid]
    if ovb == cvb:
        continue
    fix_map[sid] = cvb
    if sid in CONTAINED:
        continue
    lo = c["locator"]["char_offset"]; hi = lo + len(ovb)
    patches.append((lo, hi, cvb, sid))

txt = open(os.path.join(BASE, "eden/corpus/books/immortality.txt"), encoding="utf-8").read()
assert "\r" not in txt, "expected LF-only"

# verify each patch's span currently equals the ORIGINAL verbatim (safety)
for lo, hi, cvb, sid in patches:
    assert txt[lo:hi] == sh[sid]["verbatim"], f"span mismatch {sid}"

# apply descending offset order
for lo, hi, cvb, sid in sorted(patches, reverse=True):
    txt = txt[:lo] + cvb + txt[hi:]

# verify EVERY corrected verbatim (all 12 incl 812) is now an exact substring exactly once-ish
problems = []
for sid, cvb in fix_map.items():
    n = txt.count(cvb)
    if n < 1:
        problems.append(f"{sid[8:]}: corrected verbatim NOT FOUND in patched txt")
    # (n>1 acceptable for short/contained; resnap handles uniqueness by skeleton)
print("PATCH VERIFY:", "OK" if not problems else "PROBLEMS")
for p in problems: print("  ", p)
print(f"patched txt bytes: {len(txt.encode('utf-8'))} (orig 800210)")
print(f"span edits applied: {len(patches)}  |  --fix entries: {len(fix_map)}")

# stage patched txt (LF) + fix map
open(os.path.join(SCR, "immortality_patched.txt"), "w", encoding="utf-8", newline="").write(txt)
json.dump(fix_map, open(os.path.join(SCR, "imm_fix_map.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(fix_map, open(os.path.join(RAT, "resnap-fix-map.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("staged immortality_patched.txt + imm_fix_map.json")
