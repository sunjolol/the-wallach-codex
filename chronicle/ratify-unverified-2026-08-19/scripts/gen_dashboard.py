# -*- coding: utf-8 -*-
"""Generate the interactive ratify dashboard from the recovered dataset."""
import json, io

SCR = "C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/1a176016-a9bf-4e4c-bbfb-2f386ac79057/scratchpad"
rec = json.load(open(SCR + "/recovered-candidates.json", encoding="utf-8"))

BOOKS = {  # id -> (label, color)
    "immortality":      ("Immortality",       "#6b4fa0"),
    "epigenetics":      ("Epigenetics",        "#2f7d7a"),
    "rare-earths":      ("Rare Earths",        "#a85a2a"),
    "hells-kitchen":    ("Hell's Kitchen",     "#9a4436"),
    "lets-play-doctor": ("Let's Play Doctor",  "#2f6fb0"),
}
n_keep   = sum(1 for r in rec if r["default_ruling"] == "KEEP")
n_review = sum(1 for r in rec if r["default_ruling"] == "REVIEW")
n_note   = sum(1 for r in rec if r["notes"])
DATA_JS = json.dumps(rec, ensure_ascii=False).replace("</", "<\\/")

book_tabs = "".join(
    f'<button class="tab" data-book="{bid}"><i style="background:{col}"></i>{lbl} '
    f'<b>{sum(1 for r in rec if r["book"]==bid)}</b></button>'
    for bid, (lbl, col) in BOOKS.items())
book_meta_js = json.dumps({bid: {"label": lbl, "color": col} for bid, (lbl, col) in BOOKS.items()})

PAGE = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ratify — unverified-book ruled claims</title>
<style>
:root{{--paper:#f4efe3;--paper2:#efe8d8;--card:#fbf7ee;--ink:#2a2118;--ink2:#6b5d4a;--line:#e0d6c0;
--accent:#c8642a;--ok:#3f7d4e;--okbg:#e7f1e6;--warn:#b7822b;--warnbg:#f7efd8;--bad:#b23b34;--badbg:#f6e2df;
--blue:#2f6fb0;--bluebg:#e6eef6;--shadow:0 1px 2px rgba(60,45,25,.08),0 6px 18px rgba(60,45,25,.06);}}
*{{box-sizing:border-box}} html,body{{margin:0;overflow-x:hidden}}
body{{background:var(--paper);color:var(--ink);font:15px/1.55 "Iowan Old Style","Palatino Linotype",Georgia,serif;padding-bottom:78px}}
.wrap{{max-width:1080px;margin:0 auto;padding:0 18px}}
header.top{{position:sticky;top:0;z-index:30;background:linear-gradient(var(--paper),var(--paper) 88%,rgba(244,239,227,.96));padding:14px 0 8px;border-bottom:1px solid var(--line)}}
h1{{font-size:21px;margin:0 0 3px}} .sub{{color:var(--ink2);font-size:12.5px;margin:0 0 9px;max-width:760px}}
.stats{{display:flex;gap:7px;flex-wrap:wrap;margin:6px 0}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:9px;padding:5px 11px;box-shadow:var(--shadow)}}
.stat b{{font-size:17px}} .stat span{{color:var(--ink2);font-size:11.5px;display:block}}
.controls{{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px}}
.controls input{{flex:1 1 200px;font:inherit;font-size:13px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}}
.tab,.rf{{font:inherit;font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:20px;background:var(--paper);color:var(--ink2);cursor:pointer;display:inline-flex;align-items:center;gap:5px}}
.tab i{{width:9px;height:9px;border-radius:50%;display:inline-block}} .tab b,.rf b{{font-size:11px;color:var(--ink2)}}
.tab.on,.rf.on{{background:var(--ink);color:#fff;border-color:var(--ink)}} .tab.on b,.rf.on b{{color:#fff}}
.rowlbl{{font-size:11px;color:var(--ink2);text-transform:uppercase;letter-spacing:.4px;margin:8px 4px 0;width:100%}}
main{{padding-top:8px}}
.card{{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--bk,#ccc);border-radius:12px;padding:12px 15px;margin:11px 0;box-shadow:var(--shadow)}}
.card.ruled-drop{{opacity:.62}}
.chd{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}}
.cid{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11.5px;color:var(--ink2)}}
.bk{{color:#fff;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px}}
.kind{{font-size:11.5px;color:var(--ink2);font-style:italic}}
.cond{{font-size:12px;color:var(--ink2)}} .verd{{margin-left:auto;font-size:10.5px;color:var(--ink2);font-family:ui-monospace,monospace}}
.badge{{font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px}}
.badge.fresh{{background:var(--okbg);color:var(--ok)}} .badge.overlap{{background:var(--warnbg);color:var(--warn)}}
.rec{{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.3px}}
.rec.keep{{background:var(--okbg);color:var(--ok)}} .rec.review{{background:var(--warnbg);color:var(--warn)}}
.q{{margin:5px 0}} .qt{{display:inline-block;font-family:ui-monospace,monospace;font-size:9.5px;color:#fff;background:var(--accent);border-radius:4px;padding:1px 5px;margin-right:5px;vertical-align:middle}}
.a{{margin:3px 0;font-size:13.5px}} .al{{display:inline-block;font-family:ui-monospace,monospace;font-size:9.5px;color:#fff;background:var(--ink2);border-radius:4px;padding:1px 5px;margin-right:5px;vertical-align:middle}}
.quote{{margin:8px 0 4px;padding:8px 12px;background:var(--paper2);border-left:3px solid var(--line);border-radius:6px;font-size:13px;color:#4a3d2c}}
.reason{{font-size:12px;color:var(--ink2);margin-top:5px}}
.note{{font-size:12px;color:var(--warn);background:var(--warnbg);border-radius:6px;padding:4px 9px;margin-top:6px}}
.twin{{margin-top:8px;border:1px dashed var(--warn);border-radius:8px;padding:8px 11px;background:#fbf4e2}}
.twin .th{{font-size:11px;color:var(--warn);font-weight:600;margin-bottom:3px}}
.twin .tq{{font-size:12.5px;color:#4a3d2c}} .twin code{{font-family:ui-monospace,monospace;font-size:11px;background:#fff;padding:0 4px;border-radius:4px}}
.rule{{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid var(--line)}}
.rule .lbl{{font-size:11px;color:var(--ink2)}}
.rb{{font:inherit;font-size:12px;padding:4px 12px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink2);cursor:pointer}}
.rb[data-d=keep].on{{background:var(--ok);border-color:var(--ok);color:#fff}}
.rb[data-d=merge].on{{background:var(--blue);border-color:var(--blue);color:#fff}}
.rb[data-d=drop].on{{background:var(--bad);border-color:var(--bad);color:#fff}}
.rb.sug{{border-style:dashed;border-color:var(--accent);color:var(--accent)}}
.rnote{{flex:1 1 180px;font:inherit;font-size:12px;padding:4px 8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink)}}
footer.bar{{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--card);border-top:1px solid var(--line);box-shadow:0 -4px 14px rgba(60,45,25,.08)}}
.barin{{max-width:1080px;margin:0 auto;padding:9px 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}}
.prog{{font-size:13px}} .prog b{{font-size:15px}}
.pill{{font-size:11.5px;padding:2px 8px;border-radius:20px}} .pill.k{{background:var(--okbg);color:var(--ok)}} .pill.m{{background:var(--bluebg);color:var(--blue)}} .pill.d{{background:var(--badbg);color:var(--bad)}} .pill.u{{background:var(--paper2);color:var(--ink2)}}
.act{{margin-left:auto;display:flex;gap:7px;flex-wrap:wrap}}
.btn{{font:inherit;font-size:12.5px;padding:6px 13px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);cursor:pointer}}
.btn.pri{{background:var(--accent);border-color:var(--accent);color:#fff}}
.modal{{position:fixed;inset:0;z-index:60;background:rgba(40,33,24,.5);display:none;align-items:center;justify-content:center;padding:20px}}
.modal.on{{display:flex}} .mbox{{background:var(--card);border-radius:14px;max-width:760px;width:100%;max-height:86vh;overflow:auto;padding:18px 20px;box-shadow:var(--shadow)}}
.mbox h3{{margin:0 0 4px}} .mbox p{{font-size:13px;color:var(--ink2);margin:0 0 10px}}
.mbox textarea{{width:100%;height:300px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}}
.mact{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}}
.empty{{text-align:center;color:var(--ink2);padding:40px;font-size:14px}}
</style></head><body>
<header class="top"><div class="wrap">
  <h1>Ratify — unverified-book ruled claims <span style="font-weight:400;color:var(--ink2);font-size:14px">· {len(rec)} recovered</span></h1>
  <p class="sub">Recovered from <code>temporary/claim-ruling-dashboard.html</code> · the 5 unverified books · <b>content-deduped against the sealed corpus</b> (61 already-sealed dropped). Every dose traces to its verbatim — 0 fabricated numbers. <b>Nothing is live.</b> Rule each, then <b>Export</b> — your rulings save to this browser AND to a JSON you hand back, so they can't vanish the way the originals did.</p>
  <div class="stats">
    <div class="stat"><b>{len(rec)}</b><span>to ratify</span></div>
    <div class="stat"><b>{n_keep}</b><span>fresh · suggest keep</span></div>
    <div class="stat"><b>{n_review}</b><span>overlap a sealed claim</span></div>
    <div class="stat"><b>{n_note}</b><span>carry a copy/OCR note</span></div>
  </div>
  <div class="controls">
    <input id="q" placeholder="filter — question, condition, id, text…">
    <button class="btn" id="acceptAll" title="set every unruled fresh card to keep">✓ Accept all {n_keep} keeps</button>
  </div>
  <div class="controls"><span class="rowlbl">book</span>
    <button class="tab on" data-book="all">All <b>{len(rec)}</b></button>{book_tabs}
  </div>
  <div class="controls"><span class="rowlbl">show</span>
    <button class="rf on" data-f="all">All</button>
    <button class="rf" data-f="overlap">Overlaps ({n_review})</button>
    <button class="rf" data-f="noted">Noted ({n_note})</button>
    <button class="rf" data-f="unruled">Unruled</button>
    <button class="rf" data-f="keep">Kept</button>
    <button class="rf" data-f="merge">Merged</button>
    <button class="rf" data-f="drop">Dropped</button>
  </div>
</div></header>

<main class="wrap"><div id="list"></div><div class="empty" id="empty" style="display:none">No cards match.</div></main>

<footer class="bar"><div class="barin">
  <span class="prog"><b id="pn">0</b> / {len(rec)} ruled</span>
  <span class="pill k">keep <b id="pk">0</b></span><span class="pill m">merge <b id="pm">0</b></span>
  <span class="pill d">drop <b id="pd">0</b></span><span class="pill u">unruled <b id="pu">{len(rec)}</b></span>
  <span class="pill d" id="swarn" style="display:none">⚑ browser storage off — Export to save your work</span>
  <div class="act">
    <button class="btn" id="reset">Reset</button>
    <button class="btn pri" id="export">Export rulings JSON ▸</button>
  </div>
</div></footer>

<div class="modal" id="modal"><div class="mbox">
  <h3>Your rulings</h3>
  <p>Saved in this browser already. <b>Download</b> the file (or copy the text) and hand it back to Claude to act on — nothing is sealed until you say so.</p>
  <textarea id="dump" readonly></textarea>
  <div class="mact"><button class="btn" id="copy">Copy</button><button class="btn pri" id="download">Download .json</button><button class="btn" id="close">Close</button></div>
</div></div>

<script>
const DATA = {DATA_JS};
const BOOKS = {book_meta_js};
const KEY = "ratify-unverified-2026-08-19";
let rulings = {{}}, storageOk = true;
try {{ rulings = JSON.parse(localStorage.getItem(KEY) || "{{}}"); }} catch(e) {{ rulings = {{}}; storageOk = false; }}
let curBook = "all", curFilter = "all", curText = "";

function esc(s){{ return (s==null?"":String(s)).replace(/[&<>"]/g, c=>({{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}}[c])); }}
function oneline(s){{ return esc((s||"").replace(/\\s+/g," ").trim()); }}

function cardHTML(r){{
  const b = BOOKS[r.book] || {{label:r.book,color:"#999"}};
  const dd = rulings[r.proposed_id] || {{}};
  const dec = dd.decision || "";
  const sug = r.default_ruling === "KEEP" ? "keep" : "";
  const dedup = r.dedup === "FRESH"
    ? '<span class="badge fresh">fresh</span>'
    : '<span class="badge overlap">overlaps '+esc(r.overlap_sealed_id)+'</span>';
  const rec = r.default_ruling === "KEEP"
    ? '<span class="rec keep">suggest: keep</span>'
    : '<span class="rec review">suggest: review — merge or drop</span>';
  const notes = (r.notes||[]).map(n=>'<div class="note">⚑ '+esc(n)+'</div>').join("");
  const aflags = (r.auditor_flags||[]).map(n=>'<div class="note">⚑ auditor: '+esc(n)+'</div>').join("");
  const reason = r.auditor_reason ? '<div class="reason"><b>Auditor:</b> '+oneline(r.auditor_reason)+'</div>' : "";
  const twin = r.dedup === "OVERLAP" ? (
    '<div class="twin"><div class="th">Already sealed — <code>'+esc(r.overlap_sealed_id)+'</code> — is this the same claim (drop / merge) or a distinct facet (keep)?</div>'
    + '<div class="tq"><b>full:</b> '+oneline(r.overlap_sealed_claim_text)+'</div>'
    + '<div class="tq" style="margin-top:4px"><b>quote:</b> “'+oneline(r.overlap_sealed_verbatim)+'”</div></div>') : "";
  const conds = (r.conditions||[]).join(", ");
  function rb(d,label){{ return '<button class="rb'+(dec===d?" on":"")+((!dec&&sug===d)?" sug":"")+'" data-id="'+esc(r.proposed_id)+'" data-d="'+d+'">'+label+'</button>'; }}
  return '<article class="card'+(dec==="drop"?" ruled-drop":"")+'" style="--bk:'+b.color+'" '
    + 'data-id="'+esc(r.proposed_id)+'" data-book="'+esc(r.book)+'" data-dedup="'+esc(r.dedup)+'" '
    + 'data-noted="'+((r.notes||[]).length?1:0)+'" '
    + 'data-text="'+esc(((r.question||"")+" "+(r.answer_short||"")+" "+conds+" "+r.proposed_id+" "+(r.claim_text||"")).toLowerCase())+'">'
    + '<div class="chd"><span class="cid">'+esc(r.proposed_id)+'</span>'
    + '<span class="bk" style="background:'+b.color+'">'+esc(b.label)+'</span>'
    + '<span class="kind">'+esc(r.kind||"")+'</span>'
    + (conds?'<span class="cond">· '+esc(conds)+'</span>':"")
    + dedup + rec
    + '<span class="verd">'+esc(r.verdict||"")+'</span></div>'
    + '<div class="q"><span class="qt">Q</span><b>'+esc(r.question)+'</b></div>'
    + '<div class="a"><span class="al">short</span>'+esc(r.answer_short)+'</div>'
    + '<div class="a"><span class="al">full</span>'+esc(r.claim_text)+'</div>'
    + '<div class="quote">“'+oneline(r.verbatim)+'”</div>'
    + reason + notes + aflags + twin
    + '<div class="rule"><span class="lbl">your ruling:</span>'
    + rb("keep","Keep") + rb("merge","Merge") + rb("drop","Drop")
    + '<input class="rnote" data-id="'+esc(r.proposed_id)+'" placeholder="note (optional)" value="'+esc(dd.note||"")+'"></div>'
    + '</article>';
}}

function visible(r){{
  if (curBook !== "all" && r.book !== curBook) return false;
  const dd = rulings[r.proposed_id] || {{}};
  if (curFilter === "overlap" && r.dedup !== "OVERLAP") return false;
  if (curFilter === "noted" && !(r.notes||[]).length) return false;
  if (curFilter === "unruled" && dd.decision) return false;
  if (["keep","merge","drop"].includes(curFilter) && dd.decision !== curFilter) return false;
  if (curText && !(((r.question||"")+" "+(r.answer_short||"")+" "+(r.conditions||[]).join(" ")+" "+r.proposed_id+" "+(r.claim_text||"")).toLowerCase().includes(curText))) return false;
  return true;
}}

function render(){{
  const list = document.getElementById("list");
  const vis = DATA.filter(visible);
  list.innerHTML = vis.map(cardHTML).join("");
  document.getElementById("empty").style.display = vis.length ? "none" : "";
  wire();
  updateCounts();
}}
function wire(){{
  document.querySelectorAll(".rb").forEach(b => b.onclick = () => {{
    const id = b.dataset.id, d = b.dataset.d, cur = (rulings[id]||{{}});
    if (cur.decision === d) {{ delete cur.decision; }} else {{ cur.decision = d; }}
    rulings[id] = cur; save();
    // update just this card's buttons + drop styling without full re-render
    const card = b.closest(".card");
    card.querySelectorAll(".rb").forEach(x => x.classList.toggle("on", x.dataset.d === rulings[id].decision));
    card.querySelectorAll(".rb").forEach(x => x.classList.remove("sug"));
    card.classList.toggle("ruled-drop", rulings[id].decision === "drop");
    updateCounts();
  }});
  document.querySelectorAll(".rnote").forEach(inp => inp.oninput = () => {{
    const id = inp.dataset.id; rulings[id] = rulings[id]||{{}}; rulings[id].note = inp.value; save();
  }});
}}
function save(){{ try {{ localStorage.setItem(KEY, JSON.stringify(rulings)); }} catch(e) {{ if(storageOk){{ storageOk=false; const w=document.getElementById("swarn"); if(w) w.style.display=""; }} }} }}
function updateCounts(){{
  let k=0,m=0,d=0;
  DATA.forEach(r => {{ const dec=(rulings[r.proposed_id]||{{}}).decision; if(dec==="keep")k++;else if(dec==="merge")m++;else if(dec==="drop")d++; }});
  const ruled=k+m+d;
  document.getElementById("pn").textContent=ruled;
  document.getElementById("pk").textContent=k;
  document.getElementById("pm").textContent=m;
  document.getElementById("pd").textContent=d;
  document.getElementById("pu").textContent=DATA.length-ruled;
}}

document.getElementById("q").oninput = e => {{ curText = e.target.value.toLowerCase().trim(); render(); }};
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("on")); t.classList.add("on"); curBook=t.dataset.book; render();
}});
document.querySelectorAll(".rf").forEach(t => t.onclick = () => {{
  document.querySelectorAll(".rf").forEach(x=>x.classList.remove("on")); t.classList.add("on"); curFilter=t.dataset.f; render();
}});
document.getElementById("acceptAll").onclick = () => {{
  DATA.forEach(r => {{ if(r.default_ruling==="KEEP" && !(rulings[r.proposed_id]||{{}}).decision){{ rulings[r.proposed_id]=Object.assign(rulings[r.proposed_id]||{{}},{{decision:"keep"}}); }} }});
  save(); render();
}};
document.getElementById("reset").onclick = () => {{ if(confirm("Clear all your rulings on this dashboard?")){{ rulings={{}}; save(); render(); }} }};
document.getElementById("export").onclick = () => {{
  const out = {{ schema:"ratify-rulings/1", dashboard:KEY, source:"temporary/claim-ruling-dashboard.html",
    note:"Human ratify of the recovered unverified-book ruled candidates. decision in keep|merge|drop; blank = unruled.",
    rulings: DATA.map(r => {{ const dd=rulings[r.proposed_id]||{{}}; return {{ proposed_id:r.proposed_id, book:r.book,
      dedup:r.dedup, overlap_sealed_id:r.overlap_sealed_id||null, suggested:r.default_ruling,
      decision:dd.decision||null, note:dd.note||null, question:r.question }}; }}) }};
  document.getElementById("dump").value = JSON.stringify(out, null, 1);
  document.getElementById("modal").classList.add("on");
}};
document.getElementById("close").onclick = () => document.getElementById("modal").classList.remove("on");
document.getElementById("copy").onclick = () => {{ const t=document.getElementById("dump"); t.select(); document.execCommand("copy"); }};
document.getElementById("download").onclick = () => {{
  const blob = new Blob([document.getElementById("dump").value], {{type:"application/json"}});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "ratify-rulings-2026-08-19.json"; a.click();
}};
render();
</script>
</body></html>"""

io.open(SCR + "/ratify-dashboard.html", "w", encoding="utf-8", newline="").write(PAGE)
print("wrote ratify-dashboard.html", len(PAGE), "bytes ·", len(rec), "cards ·", n_keep, "keep-sug ·", n_review, "overlap ·", n_note, "noted")
