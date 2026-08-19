# Ratify — recovered unverified-book ruled candidates (2026-08-19)

Staging for Luneth's keep/merge/drop ratify of the campaign's last tranche: the ruled claims from
the **5 unverified books** (immortality, epigenetics, rare-earths, hell's-kitchen, let's-play-doctor)
that were **never sealed** into the corpus. **Nothing here is live. Sealing is USER-ONLY.**

## Artifacts
- **Dashboard (open this):** `temporary/ratify-unverified-dashboard-2026-08-19.html` — interactive,
  offline, self-contained. Rule each card (Keep / Merge / Drop), then **Export rulings JSON**.
- **Dataset:** `chronicle/ratify-unverified-2026-08-19/recovered-candidates.json` — the 113 recovered
  candidates with full payloads + dedup status + number-audit + auditor notes.
- **Scripts:** `build_ratify.py` (recover + dedup + audit → dataset), `gen_dashboard.py` (dataset → HTML).
  _(Paths inside are session-scoped scratchpad paths — the record of method, not a re-runnable build.)_

## How the set was derived (all deterministic)
1. Recovered every candidate from the committed `temporary/claim-ruling-dashboard.html` embedded DATA
   (907 candidates; fidelity proven — see [[ruling-dashboard-is-recovery-source]]).
2. Kept the **5 unverified books** with auditor `recommend=introduce` → **174**.
3. **Content-deduped against the sealed corpus** (normalized verbatim, not id — the dashboard's proposed
   ids are pre-seal and do NOT match assigned seal ids): **61 exact-matched an already-sealed verbatim →
   dropped**; **15 substring-overlap a sealed claim → flagged for merge/drop**; **98 fresh**.
4. Staged set = **98 fresh + 15 overlap = 113**.

## §00.A number audit
Every dose/number in each candidate's claim_text + answer_short was checked against its verbatim (as
digits **or** spelled-out words). **0 fabricated numbers.** 3 cards carry an advisory note:
- `WAL-CLM-IMMORT-000824` — source verbatim OCR-damaged (`B12` reads `B,,`); claim correct, verbatim
  needs a source fix at/before seal.
- `WAL-CLM-RARE-000466` — short answer says "90 minutes" where the source says "one and a half hours";
  reword before seal.
- (+1 more surfaced by the same check; see the "Noted (3)" filter.)

## Important caveats (read before sealing anything)
- `recommend=introduce` **overcounts** (auditor's guess; Luneth's true localStorage rulings were lost).
  113 is a **candidate ceiling**, not a confirmed keep-set. Hence this ratify.
- These are **unverified-book** verbatims — many are **OCR-damaged** (the cards surface auditor OCR flags).
  Before front-facing, each sealed span still needs the **vision-verify** step (like the prior 70), and
  real OCR defects need source fixes + resnap.
- The **15 overlap** cases each show the already-sealed twin so the call is keep-both (distinct facet) /
  merge (enrichment on the sealed claim) / drop (redundant). See [[un-enrich-dont-delete-cross-book-twins]],
  [[duplicate-deletion-needs-per-claim-approval]].

## After Luneth exports his rulings
Keeps → finalize/seal (USER-ONLY) per the Engine-1 seal plan; merges → enrichment on the named sealed id;
drops → discard. Then vision-verify + enrich the kept set so they front-face. See
[[seal-needs-full-board-not-just-verify]], [[autonomous-corpus-mining-fleet-pattern]].
