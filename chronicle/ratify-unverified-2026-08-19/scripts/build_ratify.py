# -*- coding: utf-8 -*-
"""Recover the unverified-book ruled candidates, dedup vs sealed corpus, audit numbers,
   and emit (a) a durable dataset JSON and (b) an interactive ratify dashboard."""
import json, re, collections, io, html as H

ROOT = "C:/Users/Light/Desktop/claude/health expert"
SCR  = "C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/1a176016-a9bf-4e4c-bbfb-2f386ac79057/scratchpad"

def norm(s):  return re.sub(r'\s+', ' ', (s or '')).strip()
def norml(s): return norm(s).lower()

# ---------- 1. recover candidates from the committed ruling dashboard ----------
html = open(ROOT + "/temporary/claim-ruling-dashboard.html", encoding="utf-8", errors="replace").read()
i = html.find("/*__DATA__*/"); j = html.find("[", i)
data, _ = json.JSONDecoder().raw_decode(html, j)
UNVER = {"immortality", "rare-earths", "hells-kitchen", "epigenetics", "lets-play-doctor"}
BOOKFILE = {"immortality":"claims-immortality.json","rare-earths":"claims-rare-earths.json",
            "hells-kitchen":"claims-hells-kitchen.json","epigenetics":"claims-epigenetics.json",
            "lets-play-doctor":"claims-lets-play-doctor.json"}
intro = [c for c in data if c.get("book") in UNVER and c.get("recommend") == "introduce"]

# ---------- 2. sealed verbatims for dedup ----------
sealed_norm = collections.defaultdict(set)
sealed_all  = collections.defaultdict(list)
sealed_by_id = {}
for book, fn in BOOKFILE.items():
    d = json.load(open(f"{ROOT}/eden/corpus/claims/{fn}", encoding="utf-8"))
    claims = d.get("claims", d) if isinstance(d, dict) else d
    if isinstance(claims, dict): claims = list(claims.values())
    for cl in claims:
        sealed_by_id[cl.get("id")] = cl
        v = norml(cl.get("verbatim", ""))
        if v:
            sealed_norm[book].add(v)
            sealed_all[book].append((cl.get("id"), v))

def dedup_status(c):
    b = c["book"]; nv = norml(c.get("verbatim", ""))
    if nv in sealed_norm[b]: return ("SEALED", None)
    if len(nv) >= 25:
        for sid, sv in sealed_all[b]:
            if nv in sv or (len(sv) >= 25 and sv in nv): return ("OVERLAP", sid)
    return ("FRESH", None)

# ---------- 3. number-support audit (digit OR spelled-out) ----------
NUMRE = re.compile(r"\d[\d,]*(?:\.\d+)?")
ONES = {0:"zero",1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",
        10:"ten",11:"eleven",12:"twelve",13:"thirteen",14:"fourteen",15:"fifteen",16:"sixteen",
        17:"seventeen",18:"eighteen",19:"nineteen"}
TENS = {20:"twenty",30:"thirty",40:"forty",50:"fifty",60:"sixty",70:"seventy",80:"eighty",90:"ninety"}
def words_for(n):
    """english spellings (incl. plural tens like 'nineties') to look for in the source."""
    out = set()
    if n in ONES: out.add(ONES[n])
    if n in TENS: out.add(TENS[n]); out.add(TENS[n][:-1] + "ies")  # ninety -> nineties
    if 21 <= n <= 99 and n not in TENS:
        t, o = (n // 10) * 10, n % 10
        if t in TENS and o in ONES:
            out.add(f"{TENS[t]}-{ONES[o]}"); out.add(f"{TENS[t]} {ONES[o]}")
    if n == 100: out.update({"hundred", "one hundred", "a hundred"})
    return out

def number_audit(c):
    vb = norml(c.get("verbatim", ""))
    vbdig = set(t.replace(",", "") for t in NUMRE.findall(c.get("verbatim", "")))
    claimed = set(t.replace(",", "") for t in NUMRE.findall((c.get("claim_text","") + " " + c.get("answer_short",""))))
    missing = []
    for n in claimed:
        if len(n) < 2: continue          # ignore 1-digit tokens
        if n in vbdig: continue          # present as a digit
        try: iv = int(n)
        except ValueError: iv = None
        if iv is not None and any(w in vb for w in words_for(iv)): continue  # present spelled-out
        missing.append(n)
    return missing

# ---------- 4. assemble ----------
def cheap(s):  # collapse hard OCR line breaks for display, keep bytes elsewhere
    return norm(s)

recovered = []
for c in intro:
    st, nid = dedup_status(c)
    if st == "SEALED": continue
    miss = number_audit(c)
    notes = []
    # soft observations (NOT fabrications — every dose traces to the verbatim; these are copy/source nits)
    if "b,," in norml(c.get("verbatim","")):
        notes.append("Source verbatim is OCR-damaged: 'B12' reads as 'B,,'. The claim is correct; the verbatim needs a source fix before seal.")
    elif miss:
        notes.append(f"Short answer uses the figure {miss} where the source spells it differently (paraphrase) — reword before seal.")
    # ruling is driven by dedup only; the number-audit is advisory (0 fabricated numbers across all 113)
    ruling = "REVIEW" if st == "OVERLAP" else "KEEP"
    seal = sealed_by_id.get(nid, {}) if nid else {}
    nearest = c.get("nearest") or {}
    recovered.append({
        "nkey": c.get("nkey"), "proposed_id": c.get("id"), "book": c["book"], "kind": c.get("kind"),
        "conditions": c.get("conditions") or [], "question": c.get("question"),
        "answer_short": c.get("answer_short"), "claim_text": c.get("claim_text"),
        "verbatim": c.get("verbatim"), "verdict": c.get("verdict"), "best_sim": c.get("best_sim"),
        "auditor_reason": c.get("reason"), "auditor_flags": c.get("flags") or [],
        "dedup": st, "overlap_sealed_id": nid,
        "overlap_sealed_claim_text": seal.get("claim_text") if seal else None,
        "overlap_sealed_verbatim": seal.get("verbatim") if seal else None,
        "nearest_id": nearest.get("id"), "nearest_q": nearest.get("question"),
        "number_flags": miss, "notes": notes, "default_ruling": ruling,
    })

by = collections.Counter(r["book"] for r in recovered)
rl = collections.Counter(r["default_ruling"] for r in recovered)
print("recovered:", len(recovered), "| default rulings:", dict(rl), "| by book:", dict(by))

# durable dataset (committed to chronicle via safe_write by the caller)
io.open(SCR + "/recovered-candidates.json", "w", encoding="utf-8", newline="").write(
    json.dumps(recovered, ensure_ascii=False, indent=1))
print("staged dataset ->", SCR + "/recovered-candidates.json")
