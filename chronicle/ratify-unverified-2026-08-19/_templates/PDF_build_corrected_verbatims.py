#!/usr/bin/env python
"""Build corrected verbatims for rare-earths: de-hyphenate -\\n joins + content fixes.
443/447/457 kept as-is (ours already correct vs the page's own typos) -> logged as divergences."""
import json, os, sys, re
BASE = r"C:/Users/Light/Desktop/claude/health expert"
sys.path.insert(0, os.path.join(BASE, "eden/tools"))
import verbatim_audit as VA, catalog
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/rare-earths")
land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}

CONTENT = {
  "WAL-CLM-RARE-000442": [("B,,", "B12")],
  "WAL-CLM-RARE-000448": [("elastic tibers", "elastic fibers")],
  "WAL-CLM-RARE-000449": [("and\n\u2018suppuration", "and\nsuppuration")],
  "WAL-CLM-RARE-000458": [("cholesterol]", "cholesterol")],
  "WAL-CLM-RARE-000470": [("Armond", "Armand"), ("dispepsia", "dyspepsia")],
  "WAL-CLM-RARE-000471": [("Roboxin", "Robaxin"), ("Orphenidrine", "Orphenadrine")],
}
# page prints the typo, ours is already correct -> KEEP ours, log divergence (no .txt change)
KEEP_OURS = {
  "WAL-CLM-RARE-000443": [("HYPOTHYROIDISM", "HYPOTHYROISM")],   # (ours, page_prints)
  "WAL-CLM-RARE-000447": [("Jekyll", "Jykell"), ("Bi-polar\u201d disease", "Bi-polar\u201d disesase"), ("Hyperirritability", "Hyperirratability")],
  "WAL-CLM-RARE-000457": [("including", "icluding")],
}

corrected = {}
applied_report = []
for pid, c in land.items():
    vb = c["verbatim"]
    before = vb
    # 1. de-hyphenate line-break splits: "X-\nY" -> "XY"
    vb2 = re.sub(r"-\n", "", vb)
    dehyph = [m for m in re.findall(r"\w+-\n\w+", before)]
    # 2. content fixes
    fixes = []
    for old, new in CONTENT.get(pid, []):
        if old in vb2:
            vb2 = vb2.replace(old, new); fixes.append((old, new))
        else:
            fixes.append((old, "!!NOT-FOUND!!"))
    corrected[pid] = vb2
    if vb2 != before:
        applied_report.append((pid, len(dehyph), fixes))

print("=== corrected verbatims ===")
for pid, ndh, fixes in applied_report:
    print(f"  {pid[8:]}: de-hyphenated {ndh} split(s); fixes={fixes}")
notouch = [pid[8:] for pid in land if corrected[pid] == land[pid]['verbatim']]
print(f"unchanged (byte-identical to candidate): {notouch}")

# de-hyphenation sanity: show the joined words for review
print("\n=== de-hyphenation results (verify real words) ===")
for pid in ["WAL-CLM-RARE-000442","WAL-CLM-RARE-000469","WAL-CLM-RARE-000470"]:
    joins = re.findall(r"\w{2,}", re.sub(r"(\w+)-\n(\w+)", r"[\1\2]", land[pid]['verbatim']))
    bracketed = re.findall(r"\w+-\n\w+", land[pid]['verbatim'])
    print(f"  {pid[8:]}: {[b.replace(chr(10),'') .replace('-','') for b in bracketed]}")

json.dump(corrected, open(os.path.join(RAT, "corrected-verbatims.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump({"content_fixes": CONTENT, "keep_ours_divergences": KEEP_OURS}, open(os.path.join(RAT, "corrections-log.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("\nwrote corrected-verbatims.json + corrections-log.json")
