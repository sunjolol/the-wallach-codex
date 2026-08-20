#!/usr/bin/env python
"""For each keeper: candidate conditions + which registered conditions the CORRECTED
verbatim actually names (via the gate matcher). Reveals remap/synonym/drop options."""
import json, os, sys
BASE = r"C:/Users/Light/Desktop/claude/health expert"
sys.path.insert(0, os.path.join(BASE, "eden/tools"))
import verbatim_audit as VA
import catalog
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/immortality")
land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
corrected = json.load(open(os.path.join(RAT, "corrected-verbatims.json"), encoding="utf-8"))
DROP = {"WAL-CLM-IMMORT-000768","WAL-CLM-IMMORT-000775","WAL-CLM-IMMORT-000822","WAL-CLM-IMMORT-000827"}
COND_MAP = {"gastric_ulcers":"peptic_ulcers","gray hair":"gray_hair","heart_disease":"cardiovascular_disease",
            "irritability":"hyperirritability","loose_teeth":"periodontal_disease","type_2_diabetes":"diabetes"}
cond = json.load(open(os.path.join(BASE, "eden/corpus/indices/conditions.json"), encoding="utf-8"))
syn = catalog.condition_synonyms()
slugs = [k for k in cond if not k.startswith("_") and isinstance(cond[k], dict)]
def display(s): return cond.get(s,{}).get("display_name", s.replace("_"," "))
def norm_conds(cs):
    out=[]
    for x in cs:
        x2=COND_MAP.get(x,x)
        if x2 not in out: out.append(x2)
    return out

for pid in sorted(land):
    if pid in DROP: continue
    c=land[pid]
    vbn=VA.norm(corrected[pid])
    cand=norm_conds(c["conditions"])
    named=[s for s in slugs if VA.names(vbn, s, display(s), syn)]
    # which candidate conds are NOT named
    unnamed=[s for s in cand if s not in named]
    print(f"{pid[8:]}  Q: {c['question']}")
    print(f"   candidate conds : {cand}")
    print(f"   NAMED by verbatim: {named}")
    if unnamed: print(f"   >>> UNNAMED (fail): {unnamed}")
    print()
