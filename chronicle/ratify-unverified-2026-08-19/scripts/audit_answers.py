# -*- coding: utf-8 -*-
"""§00.A deterministic backstop: every number/dose in an authored answer_full must trace to the
   claim's own verbatim OR one of its tidbit_pool claim_texts (the closed Wallach set the agent had).
   Usage: python audit_answers.py <authored-results.json>"""
import json, re, sys

SCR = "C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/1a176016-a9bf-4e4c-bbfb-2f386ac79057/scratchpad"
inp = {a["proposed_id"]: a for a in json.load(open(SCR + "/author-input.json", encoding="utf-8"))}
results = json.load(open(sys.argv[1] if len(sys.argv) > 1 else SCR + "/authored-results.json", encoding="utf-8"))

NUM = re.compile(r"\d[\d,]*(?:\.\d+)?")
ONES = {1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten",
        11:"eleven",12:"twelve",13:"thirteen",14:"fourteen",15:"fifteen",16:"sixteen",17:"seventeen",
        18:"eighteen",19:"nineteen"}
TENS = {20:"twenty",30:"thirty",40:"forty",50:"fifty",60:"sixty",70:"seventy",80:"eighty",90:"ninety"}
def words_for(n):
    out=set()
    if n in ONES: out.add(ONES[n])
    if n in TENS: out.add(TENS[n]); out.add(TENS[n][:-1]+"ies")
    if 21<=n<=99 and n not in TENS:
        t,o=(n//10)*10,n%10
        if t in TENS and o in ONES: out.add(f"{TENS[t]}-{ONES[o]}"); out.add(f"{TENS[t]} {ONES[o]}")
    if n==100: out.update({"hundred","one hundred","a hundred"})
    return out

def source_blob(a):
    parts=[a.get("verbatim","")]+[p.get("claim_text","") for p in a.get("tidbit_pool",[])]
    return " ".join(parts)

flags=[]
for r in results:
    pid=r["proposed_id"]; a=inp.get(pid)
    if not a: flags.append((pid,"NO-INPUT","candidate not in author-input")); continue
    blob=source_blob(a); low=blob.lower(); dig=set(t.replace(",","") for t in NUM.findall(blob))
    af=r.get("answer_full","") or ""
    for tok in NUM.findall(af):
        n=tok.replace(",","")
        if len(n)<2: continue
        if n in dig: continue
        try: iv=int(n)
        except ValueError: iv=None
        if iv is not None and any(w in low for w in words_for(iv)): continue
        flags.append((pid,"NUM",f"'{tok}' not in source pool"))

COMMON=set("Yes No Wallach The That This These Those In He His She Her They Their It Its A An And But Because So For To Of As When Where Why How What If Then Both Others Other Cows Vegans Doctors Deficiency Treatment Note Heading American African Asia Africa China Chinese Native".split())
for r in results:
    pid=r["proposed_id"]; a=inp.get(pid)
    if not a: continue
    low=source_blob(a).lower()
    nouns=set(re.findall(r"\b([A-Z][a-zA-Z]{3,})\b", r.get("answer_full","") or ""))-COMMON
    for n in sorted(nouns):
        if n.lower() not in low: flags.append((pid,"NAME",f"proper noun '{n}' not in source pool"))

print(f"audited {len(results)} answers | number-trace flags: {sum(1 for f in flags if f[1]=='NUM')} | name flags: {sum(1 for f in flags if f[1]=='NAME')} | other: {sum(1 for f in flags if f[1] not in ('NUM','NAME'))}")
for pid,kind,msg in flags:
    print(f"  [{kind}] {pid}: {msg}")
# length + agent-notes summary
short=[r['proposed_id'] for r in results if r.get('genuinely_short')]
noted=[(r['proposed_id'],r.get('notes')) for r in results if (r.get('notes') or '').strip()]
print(f"\ngenuinely_short: {len(short)} | agent notes: {len(noted)}")
for pid,nt in noted: print(f"  note {pid}: {nt}")
wc=[(len((r.get('answer_full') or '').split()),r['proposed_id']) for r in results]
wc.sort()
print(f"\nword counts: min {wc[0]} | max {wc[-1]} | median {wc[len(wc)//2]}")
