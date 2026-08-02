"""Triage the non-word self-scan into a ranked read list.

WHY THIS SCAN EXISTS AT ALL. The corroboration instrument compares our text to a second OCR of the
same scan; its blind spot is a SHARED error. The 30-claim control sample measured that blind spot at
7/30, and four of those seven were plain garbles our own text carries in the open (`fmctose`,
`chemes`, `folicacidat`, `Itisa`). This scan attacks exactly that class from the other side -- it
never looks at the second OCR at all.

WHY RAW VOCABULARY IS NOT ENOUGH, measured before: a bare "not in the dictionary" detector returned
387 candidates that were almost all legitimate words (cofactor, peroxidation, Framingham). So the
triage below sorts by SHAPE and by one genuinely discriminating cross-reference.

★ THE CROSS-REFERENCE THAT MAKES THIS WORTH RUNNING. For each non-word token, ask whether the
corroboration pass ALREADY flagged that claim. If it did, the token is on the known list and needs
no new instrument. If it did NOT -- the two OCR passes agreed, and they agreed on a NON-WORD -- then
this is precisely the shared-error class nothing else can see. That subset is the prize.

BUCKETS (ranked):
  SHARED_NONWORD   corroboration found no disagreement here, yet our token is not a word. The
                   blind-spot class. Highest value.
  SPLIT_FRAGMENT   a token ending or starting with a hyphen -- a line-break split whose halves were
                   separated by something the hyphen gate cannot see (e.g. an injected page number:
                   `autoim- 132 mune`). A gate gap in its own right.
  KNOWN            the claim already carries a corroboration hunk; already on the read list.
  PROPER_NOUN      capitalized, not sentence-initial -- drug, person, place, genus. Usually fine.
  OTHER            everything else.
"""
import json, re, glob
from pathlib import Path
from collections import Counter, defaultdict

# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")

scan = json.loads((SP / "selfscan.json").read_text(encoding="utf-8"))["nonword"]

# which claims did the corroboration pass already flag?
flagged = set()
for f in glob.glob(str(SP / "corr2-*.json")):
    for r in json.loads(Path(f).read_text(encoding="utf-8")):
        if r.get("hunks") or not r.get("located") or r.get("coverage", 1) < 0.85:
            flagged.add(r["id"])

targets = json.loads((SP / "targets.json").read_text(encoding="utf-8"))
VB = {c["id"]: c["verbatim"] for b in targets for c in targets[b]}

from spellchecker import SpellChecker
SPELL = SpellChecker()


def bucket(h):
    tok = h["token"]
    if tok.endswith("-") or tok.startswith("-"):
        return "SPLIT_FRAGMENT"
    if h["id"] in flagged:
        return "KNOWN"
    # capitalized and not at the start of a sentence -> a name
    ctx = h["ctx"]
    i = ctx.find(tok)
    before = ctx[:i].rstrip()
    sentence_initial = (not before) or before.endswith((".", "!", "?", ":", ";"))
    if tok[:1].isupper() and not sentence_initial:
        return "PROPER_NOUN"
    return "SHARED_NONWORD"


rows = defaultdict(list)
for h in scan:
    rows[bucket(h)].append(h)

print("NON-WORD TRIAGE")
for k in ("SHARED_NONWORD", "SPLIT_FRAGMENT", "KNOWN", "PROPER_NOUN"):
    n = len(rows[k])
    claims = len({h["id"] for h in rows[k]})
    print(f"  {k:16s} {n:4d} hits in {claims:3d} claims")
print(f"  {'TOTAL':16s} {len(scan):4d} hits in {len({h['id'] for h in scan}):3d} claims")

# --- the prize bucket, ranked by how garble-shaped the token is -------------
def suggestion(tok):
    """The speller's single best correction, if it is a 1-2 edit neighbour."""
    t = re.sub(r"[^A-Za-z]", "", tok).lower()
    if not t:
        return None
    c = SPELL.correction(t)
    return c if c and c != t else None


print("\n=== SHARED_NONWORD, ranked (the corroboration blind spot) ===")
best = []
for h in rows["SHARED_NONWORD"]:
    s = suggestion(h["token"])
    best.append((0 if s else 1, h["book_freq"], h["token"], h["id"], s, h["ctx"]))
best.sort()
for rank, freq, tok, cid, sug, ctx in best[:60]:
    mark = f"-> {sug}" if sug else "(no near word)"
    print(f"  {cid[8:]:20s} f={freq:<3d} {tok!r:20s} {mark:22s} ...{ctx[:60]}")
print(f"  ... {len(best)} total")

print("\n=== SPLIT_FRAGMENT (hyphen splits the gate cannot see) ===")
for h in rows["SPLIT_FRAGMENT"][:25]:
    print(f"  {h['id'][8:]:20s} {h['token']!r:18s} ...{h['ctx'][:70]}")
print(f"  ... {len(rows['SPLIT_FRAGMENT'])} total in "
      f"{len({h['id'] for h in rows['SPLIT_FRAGMENT']})} claims")

json.dump({k: v for k, v in rows.items()}, open(SP / "nonword-triage.json", "w",
          encoding="utf-8"), indent=1)
