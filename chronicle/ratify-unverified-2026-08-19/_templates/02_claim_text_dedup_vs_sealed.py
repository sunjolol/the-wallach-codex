#!/usr/bin/env python
"""Claim_text-level dedup of the 29 landing claims vs ALL sealed corpus claims."""
import json, difflib, re, os, glob

BASE = r"C:/Users/Light/Desktop/claude/health expert"
land = json.load(open(os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19/immortality/landing-input.json"), encoding="utf-8"))

# load ALL sealed claims across shards
sealed = []
for p in glob.glob(os.path.join(BASE, "eden/corpus/claims/claims-*.json")):
    if p.endswith(".sha256"): continue
    sh = json.load(open(p, encoding="utf-8"))
    for c in sh['claims']:
        sealed.append({"id": c['id'], "book": sh['book_id'], "claim_text": c.get('claim_text', ''),
                       "verbatim": c.get('verbatim', ''), "conditions": c.get('conditions', [])})
print(f"sealed claims loaded: {len(sealed)}")

def norm(s):
    return re.sub(r'\s+', ' ', (s or '')).strip().lower()

def nverb(s):  # verbatim normalize (ignore linebreaks/hyphens)
    s = re.sub(r'-\s+', '', s or '')
    return re.sub(r'[^a-z0-9]', '', s.lower())

def ratio(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()

print("\n=== CLAIM_TEXT dedup vs sealed (ratio>=0.90) ===")
for c in land:
    ct = c['claim_text']
    best = None
    for s in sealed:
        r = ratio(ct, s['claim_text'])
        if best is None or r > best[0]:
            best = (r, s)
    r, s = best
    if r >= 0.90:
        exact = "EXACT-BYTE" if ct.strip() == s['claim_text'].strip() else "near"
        vmatch = "SAME-VERBATIM" if nverb(c['verbatim']) == nverb(s['verbatim']) else "diff-verbatim"
        print(f"  ⚠ {c['proposed_id'][8:]}  r={r:.3f} [{exact}] vs {s['id'][8:]} ({s['book']}) [{vmatch}]")

print("\n=== CLAIM_TEXT near-dup (0.80<=ratio<0.90) for eyeball ===")
for c in land:
    ct = c['claim_text']
    hits = []
    for s in sealed:
        r = ratio(ct, s['claim_text'])
        if 0.80 <= r < 0.90:
            hits.append((r, s))
    hits.sort(reverse=True, key=lambda x: x[0])
    for r, s in hits[:2]:
        print(f"  ~ {c['proposed_id'][8:]} r={r:.3f} vs {s['id'][8:]} ({s['book']})")
        print(f"     ours: {ct[:150]}")
        print(f"     seal: {s['claim_text'][:150]}")
