#!/usr/bin/env python3
"""vb_orphans.py — corpus-wide safety net for the Hybrid remediation policy.

Reads the current DRAFT shards (post-edit, pre-seal), replicates corpus_derive's
"surfaces" rule (drop search-only), and for every condition slug reports whether
AT LEAST ONE of its surfacing claims NAMES it in the verbatim. An ORPHAN = a
condition mapped by >=1 claim but named by NONE -> would show under a condition
with zero verifiable evidence. The Hybrid rule forbids creating orphans (drop only
when a sibling still names it; else split). Run after vb_apply --write, before seal.

Usage: python vb_orphans.py            (all books, drafts)
       python vb_orphans.py --sealed   (read sealed shards instead of drafts)
"""
import json
import sys
from pathlib import Path

# ROOT resolves from this file's location (eden/tools/<file> -> parents[2] = repo
# root), so the tool operates on the tree it lives in -- including a git worktree.
# (A hardcoded main-repo path silently read/WROTE the wrong tree from a worktree.)
ROOT = Path(__file__).resolve().parents[2]
AUDIT_DIR = ROOT / "eden" / "tools"
sys.path.insert(0, str(AUDIT_DIR))
import verbatim_audit as va  # noqa: E402

SEALED = "--sealed" in sys.argv
CORPUS = ROOT / "eden" / "corpus"
src_dir = CORPUS / "claims" if SEALED else CORPUS / "drafts"
pattern = "claims-*.json" if SEALED else "claims-*.draft.json"

syn = va.load_syn()
cond_index = json.loads((CORPUS / "indices" / "conditions.json").read_text(encoding="utf-8"))

claims = []
for s in sorted(src_dir.glob(pattern)):
    d = json.loads(s.read_text(encoding="utf-8"))
    claims.extend(d["claims"])
# surfaces rule: exclude search-only
surf = [c for c in claims if "search-only" not in c.get("tags", [])]

# condition slug -> mapping claims
by_cond = {}
for c in surf:
    for slug in c.get("conditions", []):
        by_cond.setdefault(slug, []).append(c)

orphans = []
for slug, cl in sorted(by_cond.items()):
    disp = cond_index.get(slug, {}).get("display_name", slug) if isinstance(cond_index.get(slug), dict) else slug
    named_by = [c["id"] for c in cl if va.names(va.norm(c.get("verbatim", "")), slug, disp, syn)]
    if not named_by:
        orphans.append((slug, [c["id"] for c in cl]))

print(f"=== orphan check ({'SEALED' if SEALED else 'DRAFTS'}) — {len(by_cond)} conditions ===")
if not orphans:
    print("  OK — every mapped condition is named by >=1 of its claims.")
else:
    print(f"  {len(orphans)} ORPHAN condition(s) (mapped but named by NONE):")
    for slug, ids in orphans:
        print(f"    ! {slug}  <- {ids}")
sys.exit(1 if orphans else 0)
