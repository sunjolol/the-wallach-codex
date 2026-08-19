# -*- coding: utf-8 -*-
"""Rebuild the ratify dashboard (v2) to review the rewritten answer_fulls.
   Shows NEW answer_full vs OLD claim_text + verbatim + audit flags, per-answer Good/Fix/Drop + export."""
import json, re, io

SCR = "C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/1a176016-a9bf-4e4c-bbfb-2f386ac79057/scratchpad"
inp = {a["proposed_id"]: a for a in json.load(open(SCR + "/author-input.json", encoding="utf-8"))}
authored = {r["proposed_id"]: r for r in json.load(open(SCR + "/authored-results.json", encoding="utf-8"))}

BOOKS = {"immortality":("Immortality","#6b4fa0"),"epigenetics":("Epigenetics","#2f7d7a"),
         "rare-earths":("Rare Earths","#a85a2a"),"hells-kitchen":("Hell's Kitchen","#9a4436"),
         "lets-play-doctor":("Let's Play Doctor","#2f6fb0")}
DROPPED = [  # the 6 dedup drops (+ Hunza already dropped by Luneth)
 ("WAL-CLM-EPIGEN-000532","WAL-CLM-EPIGEN-000465","Can a selenium deficiency cause an underactive thyroid?"),
 ("WAL-CLM-HELLS-000122","WAL-CLM-HELLS-000097","Is my depression connected to blood sugar or insulin resistance?"),
 ("WAL-CLM-IMMORT-000739","WAL-CLM-IMMORT-000492","How much calcium and iron are in juniper ash?"),
 ("WAL-CLM-EPIGEN-000552","WAL-CLM-EPIGEN-000480","Does aloe vera help heal stomach ulcers?"),
 ("WAL-CLM-IMMORT-000774","WAL-CLM-IMMORT-000516","Why does chocolate make you feel good?"),
 ("WAL-CLM-IMMORT-000732","WAL-CLM-IMMORT-000486","How did ancient humans get all 60 essential minerals?"),
]

# ---- inline §00.A audit (numbers + proper nouns) so flags render per card ----
NUM=re.compile(r"\d[\d,]*(?:\.\d+)?")
ONES={1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten",11:"eleven",12:"twelve",13:"thirteen",14:"fourteen",15:"fifteen",16:"sixteen",17:"seventeen",18:"eighteen",19:"nineteen"}
TENS={20:"twenty",30:"thirty",40:"forty",50:"fifty",60:"sixty",70:"seventy",80:"eighty",90:"ninety"}
def words_for(n):
    out=set()
    if n in ONES: out.add(ONES[n])
    if n in TENS: out.add(TENS[n]); out.add(TENS[n][:-1]+"ies")
    if 21<=n<=99 and n not in TENS:
        t,o=(n//10)*10,n%10
        if t in TENS and o in ONES: out.add(f"{TENS[t]}-{ONES[o]}"); out.add(f"{TENS[t]} {ONES[o]}")
    if n==100: out.update({"hundred","one hundred","a hundred"})
    return out
STOP=set("""Left Underneath Citing Pointing First Second Third Fittingly Beyond Among Knock Pulling Surgery Stopping
Besides Rather Despite Give Given Elsewhere Seen Probably Against Around Checking Caught Blocking Since Starve
Earths Rare Hells Hell Kitchen Americans South North East West Yes No Wallach The That This These Those
Their There Here Both Other Others When Where Why How What Because So For As If Then Its It He His She Her
They Unlike Instead Within Without Across Alongside Through Once While Every Each Also Even Still Meanwhile
Notably Crucially Importantly Yet Getting Keeping Taking Adding Cutting Eating Drinking Run Running Take
Doctors Note Heading African American Asia Africa China Chinese Native European England English French Dutch
Italian Japanese Deficiency Treatment Cows Vegans And But Or To Of In On At By With From Into Over Under About""".split())
def audit(pid, af):
    a=inp.get(pid,{})
    blob=(a.get("verbatim","")+" "+a.get("claim_text","")+" "+a.get("answer_short","")+" "
          +" ".join(p.get("claim_text","") for p in a.get("tidbit_pool",[])))
    low=blob.lower(); flat=re.sub(r"[-\s]+","",low); dig=set(t.replace(",","") for t in NUM.findall(blob))
    fl=[]; af=af or ""
    for m in NUM.finditer(af):
        tok=m.group(); n=tok.replace(",","")
        if len(n)<2 or n in dig: continue
        if af[max(0,m.start()-2):m.start()].strip().lower().endswith("b"): continue  # B6/B12 vitamin name
        try: iv=int(n)
        except: iv=None
        if iv is not None and any(w in low for w in words_for(iv)): continue
        fl.append(f"number {tok} not in source")
    for nn in sorted(set(re.findall(r"\b([A-Z][a-zA-Z]{3,})\b", af))-STOP):
        if nn.lower() in low or nn.lower() in flat: continue
        fl.append(f"name '{nn}' not traced to source — verify")
    return fl

data=[]
for pid,a in inp.items():
    r=authored.get(pid)
    af=(r or {}).get("answer_full","")
    data.append({
        "proposed_id":pid,"book":a["book"],"kind":a["kind"],"conditions":a.get("conditions") or [],
        "question":a["question"],"answer_short":re.sub(r"\s+"," ",a["answer_short"]).strip(),
        "old_full":re.sub(r"\s+"," ",a["claim_text"]).strip(),
        "new_full":af,"verbatim":re.sub(r"\s+"," ",a["verbatim"]).strip(),
        "notes":(r or {}).get("notes","") or "","genuinely_short":(r or {}).get("genuinely_short",False),
        "audit_flags":audit(pid,af),"missing": r is None,
    })
n_flag=sum(1 for d in data if d["audit_flags"])
n_note=sum(1 for d in data if d["notes"])
n_missing=sum(1 for d in data if d["missing"])
DATA_JS=json.dumps(data,ensure_ascii=False).replace("</","<\\/")
DROP_JS=json.dumps([{"pid":p,"twin":t,"q":q} for p,t,q in DROPPED],ensure_ascii=False)
BOOK_JS=json.dumps({k:{"label":v[0],"color":v[1]} for k,v in BOOKS.items()})
book_tabs="".join(f'<button class="tab" data-book="{b}"><i style="background:{c}"></i>{l} <b>{sum(1 for d in data if d["book"]==b)}</b></button>' for b,(l,c) in BOOKS.items())

PAGE=f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ratify — rewritten answers</title>
<style>
:root{{--paper:#f4efe3;--paper2:#efe8d8;--card:#fbf7ee;--ink:#2a2118;--ink2:#6b5d4a;--line:#e0d6c0;
--accent:#c8642a;--ok:#3f7d4e;--okbg:#e7f1e6;--warn:#b7822b;--warnbg:#f7efd8;--bad:#b23b34;--badbg:#f6e2df;
--blue:#2f6fb0;--bluebg:#e6eef6;--new:#eef4ea;--shadow:0 1px 2px rgba(60,45,25,.08),0 6px 18px rgba(60,45,25,.06);}}
*{{box-sizing:border-box}} html,body{{margin:0;overflow-x:hidden}}
body{{background:var(--paper);color:var(--ink);font:15px/1.6 "Iowan Old Style","Palatino Linotype",Georgia,serif;padding-bottom:78px}}
.wrap{{max-width:1080px;margin:0 auto;padding:0 18px}}
header.top{{position:sticky;top:0;z-index:30;background:linear-gradient(var(--paper),var(--paper) 88%,rgba(244,239,227,.96));padding:14px 0 8px;border-bottom:1px solid var(--line)}}
h1{{font-size:21px;margin:0 0 3px}} .sub{{color:var(--ink2);font-size:12.5px;margin:0 0 9px;max-width:820px}}
.stats{{display:flex;gap:7px;flex-wrap:wrap;margin:6px 0}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:9px;padding:5px 11px;box-shadow:var(--shadow)}}
.stat b{{font-size:17px}} .stat span{{color:var(--ink2);font-size:11.5px;display:block}}
.controls{{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}}
.controls input{{flex:1 1 200px;font:inherit;font-size:13px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}}
.tab,.rf{{font:inherit;font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:20px;background:var(--paper);color:var(--ink2);cursor:pointer;display:inline-flex;align-items:center;gap:5px}}
.tab i{{width:9px;height:9px;border-radius:50%;display:inline-block}} .tab b,.rf b{{font-size:11px;color:var(--ink2)}}
.tab.on,.rf.on{{background:var(--ink);color:#fff;border-color:var(--ink)}} .tab.on b,.rf.on b{{color:#fff}}
.rowlbl{{font-size:11px;color:var(--ink2);text-transform:uppercase;letter-spacing:.4px;margin:8px 4px 0}}
main{{padding-top:8px}}
.card{{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--bk,#ccc);border-radius:12px;padding:12px 15px;margin:11px 0;box-shadow:var(--shadow)}}
.card.ruled-drop{{opacity:.6}}
.chd{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}}
.cid{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;color:var(--ink2)}}
.bk{{color:#fff;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px}}
.kind{{font-size:11.5px;color:var(--ink2);font-style:italic}} .cond{{font-size:12px;color:var(--ink2)}}
.badge{{margin-left:auto;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}}
.badge.flag{{background:var(--badbg);color:var(--bad)}} .badge.note{{background:var(--warnbg);color:var(--warn)}} .badge.ok{{background:var(--okbg);color:var(--ok)}}
.q{{margin:5px 0;font-size:16px}} .qt{{display:inline-block;font-family:ui-monospace,monospace;font-size:9.5px;color:#fff;background:var(--accent);border-radius:4px;padding:1px 5px;margin-right:5px;vertical-align:middle}}
.short{{font-size:13px;color:var(--ink2);margin:3px 0 8px}}
.newbox{{background:var(--new);border:1px solid #cfe0c8;border-radius:9px;padding:10px 13px;margin:6px 0}}
.newbox .lbl{{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--ok);font-weight:700;margin-bottom:4px}}
.newbox p{{margin:0 0 8px}} .newbox p:last-child{{margin:0}}
details.was{{margin:6px 0}} details.was summary{{font-size:11.5px;color:var(--ink2);cursor:pointer}}
.oldfull{{font-size:12.5px;color:var(--ink2);font-style:italic;padding:6px 10px;border-left:2px solid var(--line);margin-top:5px}}
.quote{{margin:6px 0 2px;padding:7px 11px;background:var(--paper2);border-left:3px solid var(--line);border-radius:6px;font-size:12px;color:#5a4d3c}}
.note{{font-size:12px;border-radius:6px;padding:4px 9px;margin-top:6px}}
.note.warn{{color:var(--warn);background:var(--warnbg)}} .note.bad{{color:var(--bad);background:var(--badbg)}}
.rule{{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid var(--line)}}
.rule .lbl{{font-size:11px;color:var(--ink2)}}
.rb{{font:inherit;font-size:12px;padding:4px 12px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink2);cursor:pointer}}
.rb[data-d=good].on{{background:var(--ok);border-color:var(--ok);color:#fff}}
.rb[data-d=fix].on{{background:var(--warn);border-color:var(--warn);color:#fff}}
.rb[data-d=drop].on{{background:var(--bad);border-color:var(--bad);color:#fff}}
.rnote{{flex:1 1 180px;font:inherit;font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink)}}
.dropsec{{margin:20px 0}} .dropsec h2{{font-size:15px;border-left:4px solid var(--bad);padding-left:9px}}
.droprow{{font-size:12.5px;color:var(--ink2);padding:5px 0;border-bottom:1px solid var(--line)}} .droprow code{{font-family:ui-monospace,monospace;font-size:11px}}
footer.bar{{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--card);border-top:1px solid var(--line);box-shadow:0 -4px 14px rgba(60,45,25,.08)}}
.barin{{max-width:1080px;margin:0 auto;padding:9px 18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}}
.prog{{font-size:13px}} .prog b{{font-size:15px}}
.pill{{font-size:11.5px;padding:2px 8px;border-radius:20px}} .pill.g{{background:var(--okbg);color:var(--ok)}} .pill.f{{background:var(--warnbg);color:var(--warn)}} .pill.d{{background:var(--badbg);color:var(--bad)}} .pill.u{{background:var(--paper2);color:var(--ink2)}}
.act{{margin-left:auto;display:flex;gap:7px;flex-wrap:wrap}}
.btn{{font:inherit;font-size:12.5px;padding:6px 13px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}}
.btn.pri{{background:var(--accent);border-color:var(--accent);color:#fff}}
.modal{{position:fixed;inset:0;z-index:60;background:rgba(40,33,24,.5);display:none;align-items:center;justify-content:center;padding:20px}}
.modal.on{{display:flex}} .mbox{{background:var(--card);border-radius:14px;max-width:760px;width:100%;max-height:86vh;overflow:auto;padding:18px 20px;box-shadow:var(--shadow)}}
.mbox textarea{{width:100%;height:300px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}}
.mact{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}} .empty{{text-align:center;color:var(--ink2);padding:40px}}
</style></head><body>
<header class="top"><div class="wrap">
  <h1>Ratify — rewritten answers <span style="font-weight:400;color:var(--ink2);font-size:14px">· {len(data)} keeps</span></h1>
  <p class="sub">Every keep's <b>full answer re-authored</b> to the rich bar — mechanism + layman framing + corpus tidbits, natural length, drawn only from a closed Wallach pool (verbatim + related sealed claims). Each shows <b>NEW vs the old lazy answer</b> + the source quote. Flags = a number/name my audit couldn't trace to the pool, or an author note. <b>Nothing is live.</b> Mark each Good / Fix / Drop, then Export.</p>
  <div class="stats">
    <div class="stat"><b>{len(data)}</b><span>rewritten</span></div>
    <div class="stat"><b>{n_flag}</b><span>audit flags (review)</span></div>
    <div class="stat"><b>{n_note}</b><span>author notes</span></div>
    <div class="stat"><b>{len(DROPPED)}</b><span>dropped as dup</span></div>
  </div>
  <div class="controls"><input id="q" placeholder="filter — question, condition, id, text…">
    <button class="btn" id="acceptAll" title="mark all unflagged as Good">✓ Accept all clean</button></div>
  <div class="controls"><span class="rowlbl">book</span>
    <button class="tab on" data-book="all">All <b>{len(data)}</b></button>{book_tabs}</div>
  <div class="controls"><span class="rowlbl">show</span>
    <button class="rf on" data-f="all">All</button>
    <button class="rf" data-f="flag">Flagged ({n_flag})</button>
    <button class="rf" data-f="note">Noted ({n_note})</button>
    <button class="rf" data-f="unruled">Unruled</button>
    <button class="rf" data-f="good">Good</button><button class="rf" data-f="fix">Fix</button><button class="rf" data-f="drop">Drop</button></div>
</div></header>
<main class="wrap"><div id="list"></div><div class="empty" id="empty" style="display:none">No cards match.</div>
<div class="dropsec"><h2>Dropped as duplicates ({len(DROPPED)})</h2>
<div id="drops"></div></div></main>
<footer class="bar"><div class="barin">
  <span class="prog"><b id="pn">0</b> / {len(data)} reviewed</span>
  <span class="pill g">good <b id="pg">0</b></span><span class="pill f">fix <b id="pf">0</b></span>
  <span class="pill d">drop <b id="pd">0</b></span><span class="pill u">left <b id="pu">{len(data)}</b></span>
  <span class="pill d" id="swarn" style="display:none">⚑ storage off — Export to save</span>
  <div class="act"><button class="btn" id="reset">Reset</button><button class="btn pri" id="export">Export review JSON ▸</button></div>
</div></footer>
<div class="modal" id="modal"><div class="mbox"><h3>Your review</h3>
  <p style="font-size:13px;color:var(--ink2)">Saved in this browser. Download or copy and hand back to Claude. Nothing is sealed until you say so.</p>
  <textarea id="dump" readonly></textarea>
  <div class="mact"><button class="btn" id="copy">Copy</button><button class="btn pri" id="download">Download .json</button><button class="btn" id="close">Close</button></div>
</div></div>
<script>
const DATA={DATA_JS}, BOOKS={BOOK_JS}, DROPS={DROP_JS}, KEY="ratify-answers-2026-08-19";
let rulings={{}}, storageOk=true;
try{{ rulings=JSON.parse(localStorage.getItem(KEY)||"{{}}"); }}catch(e){{ rulings={{}}; storageOk=false; }}
let curBook="all",curFilter="all",curText="";
function esc(s){{return (s==null?"":String(s)).replace(/[&<>"]/g,c=>({{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}}[c]));}}
function paras(s){{return (s||"").split(/\\n\\n+/).map(p=>"<p>"+esc(p.replace(/\\n/g," "))+"</p>").join("");}}
function cardHTML(d){{
  const b=BOOKS[d.book]||{{label:d.book,color:"#999"}}; const dd=rulings[d.proposed_id]||{{}}; const dec=dd.decision||"";
  const badge=d.audit_flags.length?'<span class="badge flag">⚑ '+d.audit_flags.length+' audit flag'+(d.audit_flags.length>1?'s':'')+'</span>'
             :(d.notes?'<span class="badge note">author note</span>':'<span class="badge ok">clean</span>');
  const flags=d.audit_flags.map(f=>'<div class="note bad">⚑ '+esc(f)+' — check before seal</div>').join("");
  const note=d.notes?'<div class="note warn">✎ author: '+esc(d.notes)+'</div>':"";
  const conds=(d.conditions||[]).join(", ");
  const rb=(x,l)=>'<button class="rb'+(dec===x?" on":"")+'" data-id="'+esc(d.proposed_id)+'" data-d="'+x+'">'+l+'</button>';
  return '<article class="card'+(dec==="drop"?" ruled-drop":"")+'" style="--bk:'+b.color+'" data-id="'+esc(d.proposed_id)+'" data-book="'+esc(d.book)+'" '
    +'data-flag="'+(d.audit_flags.length?1:0)+'" data-note="'+(d.notes?1:0)+'" '
    +'data-text="'+esc((d.question+" "+d.answer_short+" "+conds+" "+d.proposed_id+" "+d.new_full).toLowerCase())+'">'
    +'<div class="chd"><span class="cid">'+esc(d.proposed_id)+'</span><span class="bk" style="background:'+b.color+'">'+esc(b.label)+'</span>'
    +'<span class="kind">'+esc(d.kind||"")+'</span>'+(conds?'<span class="cond">· '+esc(conds)+'</span>':"")+badge+'</div>'
    +'<div class="q"><span class="qt">Q</span><b>'+esc(d.question)+'</b></div>'
    +'<div class="short">'+esc(d.answer_short)+'</div>'
    +'<div class="newbox"><div class="lbl">New full answer</div>'+(d.new_full?paras(d.new_full):'<p style="color:var(--bad)">— not authored —</p>')+'</div>'
    +'<details class="was"><summary>show old (lazy) answer + source quote</summary>'
    +'<div class="oldfull"><b>was:</b> '+esc(d.old_full)+'</div>'
    +'<div class="quote">“'+esc(d.verbatim)+'”</div></details>'
    +flags+note
    +'<div class="rule"><span class="lbl">your call:</span>'+rb("good","Good")+rb("fix","Fix")+rb("drop","Drop")
    +'<input class="rnote" data-id="'+esc(d.proposed_id)+'" placeholder="note (optional)" value="'+esc(dd.note||"")+'"></div></article>';
}}
function visible(d){{
  if(curBook!=="all"&&d.book!==curBook) return false;
  const dd=rulings[d.proposed_id]||{{}};
  if(curFilter==="flag"&&!d.audit_flags.length) return false;
  if(curFilter==="note"&&!d.notes) return false;
  if(curFilter==="unruled"&&dd.decision) return false;
  if(["good","fix","drop"].includes(curFilter)&&dd.decision!==curFilter) return false;
  if(curText&&!((d.question+" "+d.answer_short+" "+d.proposed_id+" "+d.new_full).toLowerCase().includes(curText))) return false;
  return true;
}}
function render(){{
  const vis=DATA.filter(visible);
  document.getElementById("list").innerHTML=vis.map(cardHTML).join("");
  document.getElementById("empty").style.display=vis.length?"none":"";
  document.getElementById("drops").innerHTML=DROPS.map(x=>'<div class="droprow"><code>'+esc(x.pid)+'</code> — “'+esc(x.q)+'” → duplicates live <code>'+esc(x.twin)+'</code></div>').join("");
  wire(); counts();
}}
function wire(){{
  document.querySelectorAll(".rb").forEach(b=>b.onclick=()=>{{
    const id=b.dataset.id,x=b.dataset.d,c=rulings[id]||{{}};
    if(c.decision===x) delete c.decision; else c.decision=x; rulings[id]=c; save();
    const card=b.closest(".card"); card.querySelectorAll(".rb").forEach(y=>y.classList.toggle("on",y.dataset.d===rulings[id].decision));
    card.classList.toggle("ruled-drop",rulings[id].decision==="drop"); counts();
  }});
  document.querySelectorAll(".rnote").forEach(i=>i.oninput=()=>{{const id=i.dataset.id;rulings[id]=rulings[id]||{{}};rulings[id].note=i.value;save();}});
}}
function save(){{try{{localStorage.setItem(KEY,JSON.stringify(rulings));}}catch(e){{if(storageOk){{storageOk=false;document.getElementById("swarn").style.display="";}}}}}}
function counts(){{
  let g=0,f=0,d=0; DATA.forEach(x=>{{const v=(rulings[x.proposed_id]||{{}}).decision; if(v==="good")g++;else if(v==="fix")f++;else if(v==="drop")d++;}});
  pn.textContent=g+f+d; pg.textContent=g; pf.textContent=f; pd.textContent=d; pu.textContent=DATA.length-g-f-d;
}}
document.getElementById("q").oninput=e=>{{curText=e.target.value.toLowerCase().trim();render();}};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on"));t.classList.add("on");curBook=t.dataset.book;render();}});
document.querySelectorAll(".rf").forEach(t=>t.onclick=()=>{{document.querySelectorAll(".rf").forEach(x=>x.classList.remove("on"));t.classList.add("on");curFilter=t.dataset.f;render();}});
document.getElementById("acceptAll").onclick=()=>{{DATA.forEach(d=>{{if(!d.audit_flags.length&&!(rulings[d.proposed_id]||{{}}).decision){{rulings[d.proposed_id]=Object.assign(rulings[d.proposed_id]||{{}},{{decision:"good"}});}}}});save();render();}};
document.getElementById("reset").onclick=()=>{{if(confirm("Clear all your review marks?")){{rulings={{}};save();render();}}}};
document.getElementById("export").onclick=()=>{{
  const out={{schema:"ratify-answers-review/1",dashboard:KEY,
    review:DATA.map(d=>{{const dd=rulings[d.proposed_id]||{{}};return {{proposed_id:d.proposed_id,book:d.book,decision:dd.decision||null,note:dd.note||null,had_audit_flag:!!d.audit_flags.length,question:d.question}};}})}};
  document.getElementById("dump").value=JSON.stringify(out,null,1); document.getElementById("modal").classList.add("on");
}};
document.getElementById("close").onclick=()=>document.getElementById("modal").classList.remove("on");
document.getElementById("copy").onclick=()=>{{const t=document.getElementById("dump");t.select();document.execCommand("copy");}};
document.getElementById("download").onclick=()=>{{const b=new Blob([document.getElementById("dump").value],{{type:"application/json"}});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="ratify-answers-review-2026-08-19.json";a.click();}};
render();
</script></body></html>"""
io.open(SCR+"/ratify-dashboard-v2.html","w",encoding="utf-8",newline="").write(PAGE)
print("wrote ratify-dashboard-v2.html",len(PAGE),"bytes ·",len(data),"cards ·",n_flag,"flagged ·",n_note,"noted ·",n_missing,"missing-answer")
