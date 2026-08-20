#!/usr/bin/env python
"""Render each LPD claim's PDF page (+ next) to PNG IN SCRATCHPAD (not repo), group by page, write fleet input."""
import json, os
import fitz
BASE = r"C:/Users/Light/Desktop/claude/health expert"
SCR = r"C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/95366a12-9f38-4bda-a400-366e05217891/scratchpad"
RAT = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/lets-play-doctor")
PNGDIR = os.path.join(SCR, "lpd_pages"); os.makedirs(PNGDIR, exist_ok=True)
PDF = os.path.join(BASE, "temporary/lets-play-doctor-pdf/Lets-Play-Doctor-PDF-by-Joel-Wallach-Lan-Ma.pdf")

land = {c["proposed_id"]: c for c in json.load(open(os.path.join(RAT, "landing-input.json"), encoding="utf-8"))}
corr = {r["id"]: r for r in json.load(open(os.path.join(RAT, "corroborate.json"), encoding="utf-8"))}

doc = fitz.open(PDF)
def render(pg):
    outp = os.path.join(PNGDIR, f"p{pg}.png")
    if not os.path.exists(outp):
        doc[pg-1].get_pixmap(matrix=fitz.Matrix(3.0, 3.0)).save(outp)
    return outp

groups = {}
for pid, r in corr.items():
    groups.setdefault(r["page"], {"page": r["page"], "claims": []})["claims"].append(pid)

out = []
for pg in sorted(groups):
    g = groups[pg]
    pages = [pg, pg+1] if pg+1 <= doc.page_count else [pg]
    pngs = [render(p).replace("/", "\\") for p in pages]
    claims = []
    for pid in g["claims"]:
        c = land[pid]
        claims.append({"id": pid, "verbatim": " ".join(c["verbatim"].split()),
                       "claim_text": " ".join(c["claim_text"].split()),
                       "auditor_flags": c.get("auditor_flags") or []})
    out.append({"primary_page": pg, "pngs": pngs, "claims": claims})
doc.close()
json.dump(out, open(os.path.join(RAT, "vision-groups.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"groups: {len(out)}  claims: {sum(len(g['claims']) for g in out)}")
for g in out:
    print(f"  page {g['primary_page']:3}  claims={[c['id'][8:] for c in g['claims']]}")
