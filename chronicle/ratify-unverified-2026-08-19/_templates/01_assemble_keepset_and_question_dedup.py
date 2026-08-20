#!/usr/bin/env python
"""Phase 0 — assemble the immortality 29-claim landing set + question-dedup."""
import json, difflib, re, collections, os

BASE = r"C:/Users/Light/Desktop/claude/health expert"
RAT  = os.path.join(BASE, "chronicle/ratify-unverified-2026-08-19")

cands   = json.load(open(os.path.join(RAT, "recovered-candidates.json"), encoding="utf-8"))
rulings = {r['proposed_id']: r for r in json.load(open(os.path.join(RAT, "luneth-rulings-113.json"), encoding="utf-8"))['rulings']}
answers = {a['proposed_id']: a for a in json.load(open(os.path.join(RAT, "answer-fulls.json"), encoding="utf-8"))}
se      = json.load(open(os.path.join(BASE, "eden/corpus/search-enrichment.json"), encoding="utf-8"))['enrichment']

BOOK = "immortality"
imm  = [c for c in cands if c['book'] == BOOK]

# landing set = keep AND has approved answer_full
landing = [c for c in imm
           if rulings[c['proposed_id']]['decision'] == 'keep'
           and c['proposed_id'] in answers]
landing.sort(key=lambda c: c['proposed_id'])
print(f"LANDING SET: {len(landing)} claims")

def norm(s):
    return re.sub(r'[^a-z0-9 ]', ' ', (s or '').lower())

def toks(s):
    return set(norm(s).split())

def jaccard(a, b):
    A, B = toks(a), toks(b)
    if not A or not B: return 0.0
    return len(A & B) / len(A | B)

def ratio(a, b):
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()

# live questions (exclude the 3 known dup-targets? no — compare against ALL live)
live_q = [(pid, e.get('question', '')) for pid, e in se.items() if e.get('question')]
print(f"live questions: {len(live_q)}")

print("\n=== DEDUP vs LIVE search-enrichment (ratio>=0.82 OR jaccard>=0.72) ===")
flagged_live = []
for c in landing:
    q = c['question']
    best = None
    for pid, lq in live_q:
        r = ratio(q, lq); j = jaccard(q, lq)
        if r >= 0.82 or j >= 0.72:
            if best is None or max(r, j) > max(best[2], best[3]):
                best = (pid, lq, r, j)
    if best:
        flagged_live.append((c['proposed_id'], q, best))
        print(f"  ⚠ {c['proposed_id']}  r={best[2]:.2f} j={best[3]:.2f}")
        print(f"     ours : {q}")
        print(f"     live : {best[1]}  ({best[0]})")
if not flagged_live:
    print("  (none)")

print("\n=== DEDUP within landing set (each pair) ===")
flagged_self = []
for i in range(len(landing)):
    for k in range(i+1, len(landing)):
        a, b = landing[i], landing[k]
        r = ratio(a['question'], b['question']); j = jaccard(a['question'], b['question'])
        if r >= 0.82 or j >= 0.72:
            flagged_self.append((a['proposed_id'], b['proposed_id'], r, j))
            print(f"  ⚠ {a['proposed_id']} <-> {b['proposed_id']}  r={r:.2f} j={j:.2f}")
            print(f"     {a['question']}")
            print(f"     {b['question']}")
if not flagged_self:
    print("  (none)")

# also: near-miss report (0.70-0.82) so we can eyeball
print("\n=== NEAR-MISS vs live (0.72<=ratio<0.82) for manual eyeball ===")
for c in landing:
    q = c['question']
    for pid, lq in live_q:
        r = ratio(q, lq)
        if 0.72 <= r < 0.82:
            print(f"  ~ {c['proposed_id']} r={r:.2f}: {q}  ||  {lq} ({pid})")

# dump landing input joined with answers
out = []
for c in landing:
    a = answers[c['proposed_id']]
    out.append({
        "proposed_id": c['proposed_id'],
        "kind": c['kind'],
        "conditions": c['conditions'],
        "question": c['question'],
        "answer_short": c['answer_short'],
        "answer_full": a['answer_full'],
        "used_claim_ids": a.get('used_claim_ids'),
        "genuinely_short": a.get('genuinely_short'),
        "claim_text": c['claim_text'],
        "verbatim": c['verbatim'],
        "dedup": c['dedup'],
        "number_flags": c.get('number_flags'),
        "auditor_flags": c.get('auditor_flags'),
        "notes": c.get('notes'),
        "answer_notes": a.get('notes'),
    })
outdir = os.path.join(RAT, "immortality")
os.makedirs(outdir, exist_ok=True)
with open(os.path.join(outdir, "landing-input.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f"\nwrote {outdir}/landing-input.json ({len(out)} claims)")

# kind + condition summary
print("\n=== KIND distribution ===", dict(collections.Counter(c['kind'] for c in landing)))
allconds = collections.Counter()
for c in landing:
    for cc in c['conditions']:
        allconds[cc] += 1
print("=== CONDITIONS referenced ===")
for cond, n in allconds.most_common():
    print(f"   {cond}: {n}")
nocond = [c['proposed_id'] for c in landing if not c['conditions']]
print(f"=== claims with NO conditions ({len(nocond)}): ===", nocond)
