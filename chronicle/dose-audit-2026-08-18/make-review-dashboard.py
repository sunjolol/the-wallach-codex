# -*- coding: utf-8 -*-
import json, io, html as H

ROOT = "C:/Users/Light/Desktop/claude/health expert"
SCR = r"C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/f257545b-dc79-470e-8018-d06b13e3d8ec/scratchpad"

audit = {"#" + r["nkey"].split("#")[1]: r for r in json.load(open(ROOT + "/chronicle/dose-audit-2026-08-18/recovered-24-dose-audit.json", encoding="utf-8"))}
enr = json.load(open(ROOT + "/chronicle/dose-audit-2026-08-18/enrichment-22.json", encoding="utf-8"))
e2 = json.load(open(ROOT + "/chronicle/frontface-ocr/ruled-2026-08-18/engine2-findings.json", encoding="utf-8"))

ORDER = ["#320","#321","#323","#324","#325","#333","#409","#509","#524","#525",
         "#552","#553","#555","#563","#564","#565","#615","#623","#624","#625","#657","#662"]
HELD = ["#347","#550"]
SUBJLABEL = {"vitamin-b9":"Folic acid","vitamin-a":"Vitamin A","vitamin-e":"Vitamin E","vitamin-b6":"Vitamin B6",
 "vitamin-b12":"Vitamin B12","zinc":"Zinc","selenium":"Selenium","magnesium":"Magnesium","tryptophan":"L-tryptophan",
 "flavonoids":"Bioflavonoids","lecithin":"Lecithin","dietary-fiber":"Fiber","omega-3":"Essential fatty acids"}
def cat(subj):
    if subj in ("zinc","selenium","magnesium"): return ("mineral","#2f6fb0")
    if subj in ("vitamin-b9","vitamin-a","vitamin-e","vitamin-b6","vitamin-b12"): return ("vitamin","#c8642a")
    if subj == "tryptophan": return ("amino","#3f7d4e")
    if subj in ("omega-3","omega-6"): return ("omega","#7a4fb0")
    if subj == "flavonoids": return ("flavonoid","#b7822b")
    return ("other","#8a7c66")

def esc(s): return H.escape(str(s or ""))
def oneline(s): return esc(" ".join((s or "").split()))

# ---- Engine 1 clean cards ----
def claim_card(nk):
    r = audit[nk]; e = enr.get(nk, {})
    subj = e.get("subject","?"); label = SUBJLABEL.get(subj, subj)
    catname, col = cat(subj)
    conds = ", ".join(r.get("conditions") or [])
    flags = ""
    if r.get("flags"):
        flags = "".join(f'<div class="flag">⚑ {esc(f)}</div>' for f in r["flags"])
    return f'''<article class="claim" data-cat="{catname}" data-text="{esc((r.get('question','')+' '+label+' '+conds).lower())}" style="--cat:{col}">
      <div class="chd"><span class="cnum">{nk}</span> <span class="ctag" style="background:{col}">{esc(label)}</span>
        <span class="ccond">{esc(conds)}</span> <span class="cverd">{esc(r.get('verdict',''))}</span></div>
      <div class="qrow"><span class="qlbl">Q</span> <b>{esc(r.get('question'))}</b></div>
      <div class="arow"><span class="albl">short</span> {esc(r.get('answer_short'))}</div>
      <div class="arow"><span class="albl">full</span> {esc(r.get('claim_text'))}</div>
      <div class="quote">“{oneline(r.get('verbatim'))}”</div>
      <div class="meta">subject <code>{esc(subj)}</code> · facet <code>{esc(e.get('facet','protocol'))}</code> · also_about <code>{esc(', '.join(e.get('also_about') or []))}</code></div>
      {flags}
    </article>'''

clean_html = "\n".join(claim_card(nk) for nk in ORDER)

# ---- Conflicts ----
CONFLICTS = [
 {"nk":"#347","nutrient":"Folic acid","cond":"gout",
  "dddl":"20–50 mg/day","dddl_src":"DDDL 2011 (newer)","dddl_q":"Use folic acid at 20-50 mg/day, cherries…",
  "lets":"10–75 mg/day","lets_src":"LETS 1995 · WAL-CLM-LETS-000288","lets_q":"folic acid at 10-75 mg/day, cherries and cherry juice…"},
 {"nk":"#550","nutrient":"Vitamin E","cond":"cataracts",
  "dddl":"2,000 IU/day","dddl_src":"DDDL 2011 (newer) · sealed 354/433/434","dddl_q":"…the base line vitamin/mineral supplement plus vitamin E at 2,000 IU/day…",
  "lets":"400 IU/day","lets_src":"LETS 1995 · WAL-CLM-LETS-000207","lets_q":"Treatment of cataracts… plus vitamin E at 400 IU/day…"},
]
def conflict_card(c):
    r = audit[c["nk"]]
    return f'''<article class="conflict">
      <div class="chd"><span class="cnum">{c['nk']}</span> <span class="ctag" style="background:#b23b34">CONFLICT · HELD</span>
        <b>{esc(c['nutrient'])} for {esc(c['cond'])}</b></div>
      <div class="cmp">
        <div class="side newer"><div class="sidehd">{esc(c['dddl_src'])}</div><div class="dose">{esc(c['dddl'])}</div><div class="cq">“{esc(c['dddl_q'])}”</div></div>
        <div class="vs">vs</div>
        <div class="side"><div class="sidehd">{esc(c['lets_src'])}</div><div class="dose">{esc(c['lets'])}</div><div class="cq">“{esc(c['lets_q'])}”</div></div>
      </div>
      <div class="note">Same nutrient, same condition, different amount — proven by reading both books. Both values <b>already coexist</b> in the sealed corpus as protocol claims, so this is a pre-existing edition divergence. Your rule: <i>favor newest, but prove it</i> ⇒ DDDL. <b>Recovered Q:</b> {esc(r.get('question'))}</div>
      <div class="choices"><b>Your ruling:</b>
        <span class="opt">seal DDDL facet ({esc(c['dddl'])})</span>
        <span class="opt">keep both as an edition divergence</span>
        <span class="opt">drop this facet</span></div>
    </article>'''
conflicts_html = "\n".join(conflict_card(c) for c in CONFLICTS)

# ---- Engine 2 ----
def book_rows():
    from collections import Counter
    c = Counter(x["book"] for x in e2["target_70"])
    src = {"epigenetics":"Screenshot spread (dual-monitor)","immortality":"Screenshot spread (dual-monitor)",
           "lets-play-doctor":"PDF text-layer + render","rare-earths":"PDF text-layer + render","hells-kitchen":"PDF text-layer + render"}
    return "".join(f"<tr><td>{esc(b)}</td><td class='num'>{n}</td><td>{esc(src.get(b,''))}</td></tr>" for b,n in sorted(c.items()))

def corrob_rows():
    vision = e2.get("vision_verified", {})
    rows = ""
    for book, recs in e2["corroboration_pdf"].items():
        for r in recs:
            if not r.get("located"): cor, cls = "UNLOCATED","warn"
            elif r.get("hunks"):
                cov = r.get("coverage")
                cor = f"DIVERGE · {len(r['hunks'])} hunk · cov {cov}"; cls = "warn" if (cov or 1) >= 0.85 else "bad"
            else: cor, cls = "agree","ok"
            v = vision.get(r["id"], {})
            vv = f"<b class='ok'>{esc(v['verdict'])}</b> (p{v['page']})" if v else "—"
            rows += f"<tr><td><code>{esc(r['id'])}</code></td><td>{esc(book)}</td><td class='num'>{esc(r.get('page'))}</td><td class='{cls}'>{esc(cor)}</td><td>{vv}</td></tr>"
    return rows

vision_notes = "".join(
    f"<li><code>{esc(cid)}</code> → <b class='ok'>{esc(v['verdict'])}</b> (rendered p{v['page']}). {esc(v['note'])}</li>"
    for cid, v in e2.get("vision_verified", {}).items())

# ---- Decisions ----
DECISIONS = [
 ("Seal Engine 1 now?", "I STAGED the 22 clean claims but sealed nothing — the set is a reconstruction and §00.A makes sealing dose amounts your act (the doses are already live via parent protocol claims, so nothing's lost by waiting). Confirm to seal, or tell me to hold.", ["Seal the 22 now","Hold — I'll review first"]),
 ("Rule the 2 held dose conflicts", "folic-acid/gout (20–50 vs 10–75) and vitamin-E/cataracts (2,000 vs 400 IU). Favor-newest ⇒ DDDL. See the Conflicts tab.", ["Seal DDDL facets","Keep both","Drop"]),
 ("dose:null on all 22", "I left the structured dose object null — the amount is byte-exact in claim_text + verbatim, and these are condition-therapeutic doses, not maintenance targets (they don't feed amounts_wallach_only). Matches 2/4 existing condition-dose claims.", ["Fine — keep null","Populate structured dose objects"]),
 ("#657 B12 / shingles disposition", "Auditor flagged it: reconcile as an added search question on WAL-CLM-DDDL-000278, NOT a new independent claim. I staged it as a new claim for consistency.", ["New claim (as staged)","Enrichment-only on DDDL-000278"]),
 ("#325 EFA / psoriasis mapping", "Mapped essentials to [omega-3, omega-6]. The EFA-collective dose is a known singleton case ([[efa-collective-dose-is-singleton]]).", ["Keep [omega-3, omega-6]","Use EFA-collective handling"]),
 ("Keep-both dedup pairs", "All 22 are per-nutrient slices of already-sealed protocol sentences (several share one span — e.g. cataracts #552/#553/#555). At seal they trip no_duplicate_claims and need _DUPLICATE_KEEP_BOTH allowlisting, exactly like Engine-1's 71 pairs.", ["Allowlist at seal","Review pairs first"]),
 ("Engine 2 front-face", "Held per your instruction — verified.json untouched. The 2 vision-clean claims (LETS-000523/524) are ready to move into claims_verified when you sign off.", ["Move the 2 verified now","Wait for the full 70 sweep"]),
]
def decision_card(i, d):
    title, body, opts = d
    o = "".join(f'<span class="opt">{esc(x)}</span>' for x in opts)
    return f'<article class="decision"><div class="dhd"><span class="dnum">{i}</span> <b>{esc(title)}</b></div><div class="dbody">{esc(body)}</div><div class="choices">{o}</div></article>'
decisions_html = "\n".join(decision_card(i+1, d) for i, d in enumerate(DECISIONS))

# counts
n_clean = len(ORDER); n_conf = len(HELD); n_e2 = len(e2["target_70"]); n_vv = len(e2.get("vision_verified",{}))

PAGE = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dose audit + frontface — review</title>
<style>
:root{{--paper:#f4efe3;--paper2:#efe8d8;--card:#fbf7ee;--ink:#2a2118;--ink2:#6b5d4a;--line:#e0d6c0;--accent:#c8642a;
--ok:#3f7d4e;--okbg:#e7f1e6;--warn:#b7822b;--warnbg:#f6eed6;--bad:#b23b34;--badbg:#f6e2df;
--shadow:0 1px 2px rgba(60,45,25,.08),0 6px 18px rgba(60,45,25,.06);}}
*{{box-sizing:border-box}} html,body{{margin:0}}
body{{background:var(--paper);color:var(--ink);font:15px/1.55 "Iowan Old Style","Palatino Linotype",Georgia,serif;padding-bottom:60px}}
.wrap{{max-width:1080px;margin:0 auto;padding:0 18px}}
header.top{{position:sticky;top:0;z-index:20;background:linear-gradient(var(--paper),var(--paper) 82%,rgba(244,239,227,0));padding:16px 0 8px;border-bottom:1px solid var(--line)}}
h1{{font-size:22px;margin:0 0 3px}} .sub{{color:var(--ink2);font-size:13px;margin:0 0 10px}}
.stats{{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px 12px;box-shadow:var(--shadow)}}
.stat b{{font-size:18px}} .stat span{{color:var(--ink2);font-size:12px;display:block}}
nav{{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}}
nav a{{font-size:13px;text-decoration:none;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 12px}}
nav a:hover{{border-color:var(--accent);color:var(--accent)}}
section{{margin:26px 0}} h2{{font-size:18px;border-left:4px solid var(--accent);padding-left:10px;margin:0 0 4px}}
.shd{{color:var(--ink2);font-size:13px;margin:0 0 14px}}
.filters{{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}}
.filters input{{flex:1 1 220px;font:inherit;font-size:13px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}}
.fbtn{{font:inherit;font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:20px;background:var(--paper);color:var(--ink2);cursor:pointer}}
.fbtn.on{{background:var(--accent);color:#fff;border-color:var(--accent)}}
.claim{{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--cat,#ccc);border-radius:12px;padding:12px 15px;margin:10px 0;box-shadow:var(--shadow)}}
.chd{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:7px}}
.cnum{{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:var(--ink2)}}
.ctag{{color:#fff;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:20px}}
.ccond{{color:var(--ink2);font-size:12.5px;font-style:italic}} .cverd{{margin-left:auto;font-size:11px;color:var(--ink2);font-family:ui-monospace,monospace}}
.qrow{{margin:4px 0}} .qlbl,.albl{{display:inline-block;font-family:ui-monospace,monospace;font-size:10px;color:#fff;background:var(--ink2);border-radius:4px;padding:1px 5px;vertical-align:middle;margin-right:4px}}
.qlbl{{background:var(--accent)}}
.arow{{margin:3px 0;font-size:14px}}
.quote{{margin:8px 0 4px;padding:8px 12px;background:var(--paper2);border-left:3px solid var(--line);border-radius:6px;font-size:13.5px;color:#4a3d2c}}
.meta{{font-size:11.5px;color:var(--ink2);margin-top:4px}} .meta code,code{{font-family:ui-monospace,monospace;font-size:11.5px;background:var(--paper2);padding:0 4px;border-radius:4px}}
.flag{{font-size:12px;color:var(--warn);background:var(--warnbg);border-radius:6px;padding:4px 8px;margin-top:6px}}
.conflict{{background:var(--card);border:1px solid var(--bad);border-radius:12px;padding:14px 16px;margin:12px 0;box-shadow:var(--shadow)}}
.cmp{{display:flex;gap:12px;align-items:stretch;margin:10px 0}}
.side{{flex:1;background:var(--paper2);border:1px solid var(--line);border-radius:10px;padding:10px 12px}}
.side.newer{{border-color:var(--ok);background:var(--okbg)}}
.sidehd{{font-size:11.5px;color:var(--ink2);font-weight:600}} .dose{{font-size:22px;font-weight:700;margin:4px 0}}
.cq{{font-size:12px;color:#4a3d2c;font-style:italic}} .vs{{align-self:center;color:var(--ink2);font-size:13px}}
.note{{font-size:13px;color:#4a3d2c;margin:8px 0}} .choices{{margin-top:8px;display:flex;gap:7px;flex-wrap:wrap}}
.opt{{font-size:12px;border:1px dashed var(--accent);color:var(--accent);border-radius:20px;padding:3px 11px}}
table{{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0}}
th,td{{text-align:left;padding:6px 9px;border-bottom:1px solid var(--line)}} th{{color:var(--ink2);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px}}
td.num{{text-align:right;font-family:ui-monospace,monospace}} .ok{{color:var(--ok)}} .warn{{color:var(--warn)}} .bad{{color:var(--bad);font-weight:600}}
.callout{{background:var(--okbg);border:1px solid var(--ok);border-radius:10px;padding:10px 14px;margin:10px 0;font-size:13.5px}}
.callout ul{{margin:6px 0 0;padding-left:18px}} .callout li{{margin:4px 0}}
.decision{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 15px;margin:10px 0;box-shadow:var(--shadow)}}
.dhd{{margin-bottom:4px}} .dnum{{display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;background:var(--accent);color:#fff;border-radius:50%;font-size:12px;font-family:ui-monospace,monospace}}
.dbody{{font-size:13.5px;color:#4a3d2c;margin:4px 0}}
.prov{{font-size:13.5px;color:#4a3d2c}} .prov code{{font-size:12px}}
.legend{{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink2);margin:6px 0}}
.dot{{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:middle}}
</style></head><body>
<header class="top"><div class="wrap">
  <h1>Dose audit + frontface — review</h1>
  <p class="sub">2026-08-18 · autonomous run · <b>nothing sealed</b> — staged for your ratify. Board 92/92 green, kv=473 unchanged.</p>
  <div class="stats">
    <div class="stat"><b>{n_clean}</b><span>clean dose claims (seal-ready)</span></div>
    <div class="stat"><b>{n_conf}</b><span>held dose conflicts</span></div>
    <div class="stat"><b>{n_e2}</b><span>Engine-2 claims to verify</span></div>
    <div class="stat"><b>{n_vv}</b><span>vision-verified clean</span></div>
    <div class="stat"><b>{len(DECISIONS)}</b><span>decisions for you</span></div>
  </div>
  <nav><a href="#decisions">① Decisions for you</a><a href="#clean">② 22 clean claims</a><a href="#conflicts">③ Conflicts</a><a href="#engine2">④ Engine 2</a><a href="#prov">⑤ Provenance</a></nav>
</div></header>
<div class="wrap">

<section id="decisions"><h2>① Decisions that need you</h2>
<p class="shd">Everything below is a judgment call I made or held while you were out — including things you didn't name. Nothing is committed.</p>
{decisions_html}
</section>

<section id="clean"><h2>② Engine 1 · {n_clean} clean dose claims (seal-ready)</h2>
<p class="shd">Every verbatim byte-exact in the DDDL source. Shown in your review form: Q / short / full / quote. Category-coloured by nutrient.</p>
<div class="legend"><span><i class="dot" style="background:#2f6fb0"></i>mineral</span><span><i class="dot" style="background:#c8642a"></i>vitamin</span><span><i class="dot" style="background:#3f7d4e"></i>amino</span><span><i class="dot" style="background:#7a4fb0"></i>omega</span><span><i class="dot" style="background:#b7822b"></i>flavonoid</span><span><i class="dot" style="background:#8a7c66"></i>other</span></div>
<div class="filters"><input id="q" placeholder="filter claims (nutrient, condition, question)…">
  <button class="fbtn on" data-cat="all">all</button><button class="fbtn" data-cat="mineral">minerals</button><button class="fbtn" data-cat="vitamin">vitamins</button><button class="fbtn" data-cat="amino">aminos</button><button class="fbtn" data-cat="omega">omegas</button><button class="fbtn" data-cat="other">other</button></div>
<div id="claims">{clean_html}</div>
</section>

<section id="conflicts"><h2>③ Held dose conflicts · {n_conf}</h2>
<p class="shd">Same nutrient + same condition, different amount across editions. Held per your "hold conflicts, seal the clean" instruction.</p>
{conflicts_html}
</section>

<section id="engine2"><h2>④ Engine 2 · vision-verify (staged, front-face held)</h2>
<p class="shd">70 sealed unverified-book ruled claims, blocked from front-facing by <code>enriched_book_is_verified</code> until page-read. I corroborated the 9 PDF-book ones and vision-verified 2 flagged divergences. verified.json untouched.</p>
<h3 style="font-size:14px;margin:14px 0 2px">Corroboration (PDF text-layer) — ranks, never verifies</h3>
<table><thead><tr><th>Claim</th><th>Book</th><th>Page</th><th>Corroboration</th><th>Vision verdict</th></tr></thead><tbody>{corrob_rows()}</tbody></table>
<div class="callout"><b>Vision-verified against the page image this session (the ground truth):</b><ul>{vision_notes}</ul>
<div style="font-size:12.5px;color:var(--ink2);margin-top:6px">⚠ <code>WAL-CLM-RARE-000403</code> — corroboration coverage 0.19 (&lt;0.85) = the locator mislocated it; needs a neighbour-page read, not a fix.</div></div>
<h3 style="font-size:14px;margin:14px 0 2px">The 70-claim target set</h3>
<table><thead><tr><th>Book</th><th>Claims</th><th>Page source</th></tr></thead><tbody>{book_rows()}</tbody></table>
<p class="shd" style="margin-top:8px">Remaining next session: corroborate + vision-read the 61 epigenetics/immortality (dual-monitor Screenshot crops) + the RARE neighbour; fix/resnap any real defects; then <b>you</b> move clean ids into <code>claims_verified</code>.</p>
</section>

<section id="prov"><h2>⑤ Provenance — how this was recovered</h2>
<div class="prov">
<p>The 22 dose claims and the unverified-book payloads lived only in the prior session's scratchpad <code>0ce0c20f</code> — which was <b>deleted</b> (scratchpads are session-scoped). I recovered every payload from the committed <code>temporary/claim-ruling-dashboard.html</code>, which embeds all <b>907</b> ruled candidates. <b>Fidelity proven:</b> 190 already-sealed claims match it byte-for-byte; all 24 dose verbatims are byte-exact in the DDDL source, zero fabricated.</p>
<p><code>recommend=introduce</code> gives 24 dose candidates; your exact 22-of-24 ruling was in localStorage (lost). My dose-conflict audit independently holds 2 → lands at 22. I did not guess which 2 you dropped — the 2 I hold are held on §00.A conflict grounds.</p>
<p style="color:var(--ink2);font-size:12.5px">Staged files: <code>chronicle/dose-audit-2026-08-18/</code> · <code>chronicle/frontface-ocr/ruled-2026-08-18/</code>. This dashboard is a read-only view; it changes nothing.</p>
</div>
</section>
</div>
<script>
const q=document.getElementById('q'), cards=[...document.querySelectorAll('#claims .claim')];
let curCat='all';
function apply(){{const t=(q.value||'').toLowerCase();cards.forEach(c=>{{const okC=curCat==='all'||c.dataset.cat===curCat;const okT=!t||c.dataset.text.includes(t);c.style.display=(okC&&okT)?'':'none';}});}}
q.addEventListener('input',apply);
document.querySelectorAll('.fbtn').forEach(b=>b.addEventListener('click',()=>{{document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('on'));b.classList.add('on');curCat=b.dataset.cat;apply();}}));
</script>
</body></html>'''

with io.open(SCR + "/dose-review-dashboard.html", "w", encoding="utf-8", newline="") as f:
    f.write(PAGE)
print("wrote dose-review-dashboard.html", len(PAGE), "bytes;", n_clean, "clean,", n_conf, "conflicts,", n_e2, "e2 target,", len(DECISIONS), "decisions")
