#!/usr/bin/env python
"""Render each rare-earths claim's PDF page (+ next) to PNG, group by primary page, write fleet input."""
import json, os, sys
import fitz
BASE = r"C:/Users/Light/Desktop/claude/health expert"
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/rare-earths")
PNGDIR = os.path.join(RAT, "pages"); os.makedirs(PNGDIR, exist_ok=True)
PDF = os.path.join(BASE, "temporary/rare earths forbidden cures/rare-earths-forbidden-cures-pdf-by-joel-wallach-lan-ma-pdf.pdf")

land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
corr = {r["id"]: r for r in json.load(open(os.path.join(RAT, "corroborate.json"), encoding="utf-8"))}

doc = fitz.open(PDF)
def render(pg):
    outp = os.path.join(PNGDIR, f"p{pg}.png")
    if not os.path.exists(outp):
        pix = doc[pg-1].get_pixmap(matrix=fitz.Matrix(3.0, 3.0)); pix.save(outp)
    return outp

# group by primary page
groups = {}
for pid, r in corr.items():
    pg = r["page"]
    groups.setdefault(pg, {"page": pg, "claims": []})
    groups[pg]["claims"].append(pid)

out = []
for pg in sorted(groups):
    g = groups[pg]
    pages = [pg, pg+1] if pg+1 <= doc.page_count else [pg]
    pngs = [render(p) for p in pages]
    claims = []
    for pid in g["claims"]:
        c = land[pid]
        vb = " ".join(c["verbatim"].split())  # flatten for the prompt
        claims.append({"id": pid, "verbatim": vb, "claim_text": " ".join(c["claim_text"].split()),
                       "auditor_flags": c.get("auditor_flags") or []})
    out.append({"primary_page": pg, "pngs": [p.replace("/", "\\") for p in pngs], "claims": claims})
doc.close()
json.dump(out, open(os.path.join(RAT, "vision-groups.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"groups: {len(out)}  claims: {sum(len(g['claims']) for g in out)}")
for g in out:
    print(f"  page {g['primary_page']:3}  claims={[c['id'][8:] for c in g['claims']]}  pngs={len(g['pngs'])}")
