# Pending — APPROVED mis-tag audit execution (run in a FRESH session)

**Luneth approved ALL 43 re-types + the IMMORT-000001 split on 2026-07-11** (review artifact
https://claude.ai/code/artifact/ec860c9c-530a-4da0-91a1-56eeff196399). RARE-000086 = KEEP as-is
(inferred pairings, §00.A). EPIGEN-000095 + IMMORT-000198 = KEEP mechanism (verifier rejected).
Source audit: workflow wf_b814baa8-ca4. This dir is DELETED after execution.

## What lands
- **43 claims re-typed mechanism/interaction -> deficiency_sign** (so their nutrient reaches the
  condition's restore pills). Batches: `retype-<book>.batch.json` (one per book).
- **IMMORT-000001 SPLIT** (a 2nd flattened claim, like Table 7-8): the original becomes
  goiter<-iodine (folded into `retype-immortality.batch.json`), + 4 new per-disease claims added
  via `immort-split.raw.json` (keshan_disease<-selenium, cardiomyopathy<-selenium, pica<-phosphorus,
  enzootic_ataxia<-copper). Each 1-condition (never a shotgun); all share the full 307-char verbatim
  (names every disease -> verbatim_names_mapped_conditions holds).

## ORDER (critical — same as Table 7-8; see [[batch-mining-workflow]], [[editing-sealed-corpus-claims]])
corpus_extract finalize reads existing from the SHARD and OVERWRITES the draft, so finalize the
immortality split FIRST, THEN mine_batch (which edits drafts), THEN seal ONCE:

```
cd "<repo root>"
# 0. confirm clean: all drafts == shards (else investigate)
# 1. add the 4 IMMORT-000001 split claims (rebuilds immortality draft = shard + 4)
PYTHONUTF8=1 python eden/tools/corpus_extract.py finalize --book immortality --raw chronicle/pending-mistag-audit-temp/immort-split.raw.json
# 2. re-type each book (dry-run first). immortality batch ALSO edits IMMORT-000001 -> goiter/iodine/deficiency_sign
for b in dddl-3e-2011 epigenetics immortality lets-play-doctor rare-earths; do
  PYTHONUTF8=1 python eden/tools/mine_batch.py apply --batch chronicle/pending-mistag-audit-temp/retype-$b.batch.json --dry-run
done
# then re-run each WITHOUT --dry-run
# 3. SEAL ONCE (user-authorized; re-goldens, bumps kv)
PYTHONUTF8=1 python eden/tools/corpus_seal.py
# 4. regenerate + verify
PYTHONUTF8=1 python eden/tools/corpus_embed.py && PYTHONUTF8=1 python eden/tools/entity_page_derive.py && PYTHONUTF8=1 python eden/tools/build_embeds.py
node tools/build.mjs
PYTHONUTF8=1 python tools/invariants.py           # entity_pills_justified stays green (grows); corpus_integrity kv bumps
node tools/render_probe_knowledge.js
```

## VERIFY the recovery (spot-checks)
- goiter restore includes copper (IMMORT-000180/DDDL-000025/RARE-000149 + the split original).
- prostate_cancer restore includes selenium; diabetes includes chromium; hypertension includes calcium;
  deafness includes manganese; aneurysm includes copper.

## Then: round-close (build-log + Creator's Log + rebuild + commit + push) and DELETE this dir.
