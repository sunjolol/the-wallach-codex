"""Sync each draft's verbatim + char_offset from its RESNAPPED shard.

WHY, and why this is not optional: `corpus_resnap --write` updates the SHARD and books-meta only.
corpus_seal then promotes draft -> shard, so sealing without this step SILENTLY replaces resnap's
corrected offsets with stale ones. That has happened four separate times (S12, S44, 2026-07-17,
2026-07-24) -- which is why corpus_seal now carries draft_offset_failures() as a refuse-to-promote
guard. It currently reports 735 failures; this is the step that clears them.

Only `verbatim` and `locator.char_offset` are copied. Everything else in the draft -- mappings,
claim_text, tags, review state -- is the draft's own and is left untouched, because a draft can
legitimately differ from its shard on those fields.
"""
import json, sys, subprocess, os
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
DRY = "--dry-run" in sys.argv
BOOKS = ["epigenetics", "rare-earths", "lets-play-doctor", "immortality", "hells-kitchen",
         "dddl-3e-2011", "iaiyh"]

total = 0
for book in BOOKS:
    dpath = ROOT / f"eden/corpus/drafts/claims-{book}.draft.json"
    spath = ROOT / f"eden/corpus/claims/claims-{book}.json"
    if not dpath.exists():
        continue
    draft = json.loads(dpath.read_text(encoding="utf-8"))
    shard = {c["id"]: c for c in json.loads(spath.read_text(encoding="utf-8"))["claims"]}
    changed, orphan = 0, []
    for c in draft["claims"]:
        s = shard.get(c["id"])
        if s is None:
            orphan.append(c["id"])
            continue
        before = (c["verbatim"], (c.get("locator") or {}).get("char_offset"))
        c["verbatim"] = s["verbatim"]
        if c.get("locator") is not None and s.get("locator") is not None:
            c["locator"]["char_offset"] = s["locator"].get("char_offset")
        if before != (c["verbatim"], (c.get("locator") or {}).get("char_offset")):
            changed += 1
    # the draft's knowledge_version follows the shard's, as promotion would set it
    print(f"  {book:18s} {changed:4d} claims synced"
          + (f"  ORPHANS (in draft, not shard): {orphan}" if orphan else ""))
    total += changed
    if changed and not DRY:
        stage = SP / f"stage-draft-{book}.json"
        stage.write_text(json.dumps(draft, indent=1, ensure_ascii=False) + "\n",
                         encoding="utf-8", newline="\n")
        r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite",
                            str(dpath), "--payload-file", str(stage)],
                           capture_output=True, text=True,
                           env={**os.environ, "PYTHONUTF8": "1"})
        print("   ", (r.stdout.strip() or r.stderr.strip())[:120])
        if r.returncode != 0:
            sys.exit(1)

print(f"\ntotal draft claims synced: {total}" + ("   (DRY RUN)" if DRY else ""))
