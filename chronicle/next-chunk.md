# ★★★ NEXT SESSION — READ THIS FIRST.

**Campaign: the 452 ruled claims → Search.** Board 92/92 green, corpus **kv=476** (no re-seal — Option B).

## ✅ DONE — Engine 2: the 41 resolvable ruled claims are LIVE in Ask Wallach
Front-faced with a new **`answer_full`** search field. Each claim's search "full answer" now explains its
quote in plain English AND carries Wallach's actual solution (doses / foods / what-to-avoid) drawn from
across the whole corpus — per-claim depth: rich for "how do I fix it", concise for plain facts. The sealed
atomic claim_text is UNTOUCHED (Option B); answer_full sits beside answer_short in
`eden/corpus/search-enrichment.json`, and `search_index_derive.py` sources the search `answer` from it.
- Provenance: 41-agent per-claim synthesis over corpus dossiers → 41-agent adversarial §00.A verify (33
  clean, 8 fixed) → hand spot-checks. Every dose/number/study traces to a sealed claim.
- 2 new search-entities registered: `coronary_artery_disease`, `nystagmus`.
- EPIGEN-000472 routed to subject=insomnia (was calcium) to clear a no_duplicate_claims twin with 061.
- Render: `white-space:pre-line` on the answer containers shows the paragraph breaks.
- ⚠ VISUAL UNCONFIRMED: no styled screenshot was possible in-session. Eyeball the rich answers in the real
  app — search "can cataracts be reversed", "will exercise alone make me lose weight" — to confirm the
  paragraph render + long-answer layout look right; tune the pre-line spacing if needed.

## ▶ NEXT TASK — the 28 needs_new_topic ruled claims (Luneth's curation)
`chronicle/frontface-ocr/ruled-2026-08-18/enrich-worklist.json` — the `needs_new_topic:true` claims
(Hunza / Glacial Milk, resveratrol, Blue Zones, culinary ashes, longevity, Li-Ching-Yun, etc.). No
resolving subject → **NEW topic entities** = your curation. Author topic names/structure WITH him, register
in search-entities, then enrich to the SAME rich-answer_full bar (per-claim synthesis + §00.A verify). 8 of
them also need a question authored (`recovered_question:null`).

## AFTER THAT
The **92 UNSEALED** unverified ruled claims: recover from `temporary/claim-ruling-dashboard.html`
([[ruling-dashboard-is-recovery-source]]), seal, vision-verify, enrich — same pipeline, same answer_full bar.

## THE answer_full BAR (set this session — hold it)
A search "full answer" is NOT a one-line paraphrase of the quote. It FULLY explains the quote in plain
English and draws the actual Wallach solution from across the corpus — but PER-CLAIM: never pad a simple
factual/historical claim to look thorough. Every dose/number/study must trace to a sealed claim (§00.A).
answer_short stays the crisp lead-with-the-answer TL;DR. See [[answer-short-crisp-distinct-from-full]],
[[mining-serves-ask-wallach]].

## GENESIS
`genesis` → run genesis.py, report the board, then resume the 28 needs_new_topic curation unless redirected.
New invariant red = the only response.
