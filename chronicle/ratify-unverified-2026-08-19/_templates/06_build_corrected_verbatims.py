#!/usr/bin/env python
"""Apply the ruled typo corrections to the 25 keeper verbatims -> corrected verbatims.
Then re-run the condition-mapping sim on the CORRECTED verbatims."""
import json, os, sys, re
BASE = r"C:/Users/Light/Desktop/claude/health expert"
sys.path.insert(0, os.path.join(BASE, "eden/tools"))
import verbatim_audit as VA
import catalog

RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/immortality")
land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
DROP = {"WAL-CLM-IMMORT-000768","WAL-CLM-IMMORT-000775","WAL-CLM-IMMORT-000822","WAL-CLM-IMMORT-000827"}

# per-claim token corrections (old -> new). 811 'high' held pending Luneth's read.
CORR = {
  "WAL-CLM-IMMORT-000747": [("The 14 Hunza Practices", "Recorded birth defects are")],
  "WAL-CLM-IMMORT-000752": [("dy nasties", "dynasties")],
  "WAL-CLM-IMMORT-000757": [("charleton", "charlatan")],
  "WAL-CLM-IMMORT-000771": [("cocoagin", "cocoa"), ("compounds\nthermogenic", "compounds have\nthermogenic")],
  "WAL-CLM-IMMORT-000772": [("thrombosisand", "thrombosis and"), ("the affects of", "the effects of")],
  "WAL-CLM-IMMORT-000777": [("mono-saturated", "mono-unsaturated")],
  "WAL-CLM-IMMORT-000778": [("flavanoids", "flavonoids")],
  "WAL-CLM-IMMORT-000806": [("(B,)", "(B1)"), ("erythematosis", "erythematosus")],
  "WAL-CLM-IMMORT-000809": [("dysmenorr hea", "dysmenorrhea")],
  "WAL-CLM-IMMORT-000810": [("which lead to", "which led to")],
  "WAL-CLM-IMMORT-000812": [("thrombosisand", "thrombosis and"), ("the affects of", "the effects of")],
  "WAL-CLM-IMMORT-000824": [("B,,", "B12")],
}
HELD = {"WAL-CLM-IMMORT-000811": "high -> (hale?) pending Luneth read"}

COND_MAP = {"gastric_ulcers":"peptic_ulcers","gray hair":"gray_hair","heart_disease":"cardiovascular_disease",
            "irritability":"hyperirritability","loose_teeth":"periodontal_disease","type_2_diabetes":"diabetes"}
cond = json.load(open(os.path.join(BASE, "eden/corpus/indices/conditions.json"), encoding="utf-8"))
syn = catalog.condition_synonyms()

corrected = {}
report = []
for pid, c in land.items():
    if pid in DROP: continue
    vb = c["verbatim"]
    applied = []
    for old, new in CORR.get(pid, []):
        if old in vb:
            vb = vb.replace(old, new); applied.append((old, new))
        else:
            applied.append((old, "!!NOT-FOUND!!"))
    corrected[pid] = vb
    if applied:
        report.append((pid, applied))

print("=== corrections applied ===")
for pid, applied in report:
    for old, new in applied:
        flag = "  <-- CHECK" if new == "!!NOT-FOUND!!" else ""
        print(f"  {pid[8:]}: {old!r} -> {new!r}{flag}")

# save corrected verbatims
json.dump(corrected, open(os.path.join(RAT, "corrected-verbatims.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# re-run condition sim on CORRECTED verbatims
def normalize_conds(cs):
    out = []
    for x in cs:
        x2 = COND_MAP.get(x, x)
        if x2 not in out: out.append(x2)
    return out
def display(slug): return cond.get(slug, {}).get("display_name", slug.replace("_"," "))

print("\n=== condition-mapping on CORRECTED verbatims ===")
oks, fails = 0, []
for pid, c in land.items():
    if pid in DROP: continue
    conds = normalize_conds(c["conditions"])
    vbn = VA.norm(corrected[pid])
    for slug in conds:
        if slug not in cond:
            print(f"  !! {pid[8:]} UNREGISTERED {slug}"); continue
        if VA.names(vbn, slug, display(slug), syn):
            oks += 1
        else:
            fails.append((pid, slug, display(slug)))
print(f"OK={oks}  FAIL={len(fails)}")
for pid, slug, disp in fails:
    print(f"  x {pid[8:]} -> {slug} ({disp})")
