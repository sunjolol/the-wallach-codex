"""Apply the 36 page-read subscript recoveries to the sealed book sources.

Each edit is anchored on a context window taken from the CLAIM'S OWN VERBATIM, which is a byte-exact
substring of the .txt -- so the anchor is guaranteed to exist and the window is widened until it is
UNIQUE in the file. Nothing is replaced on a bare token match; `B,` alone occurs many times and most
of them are boron.

★ 11 of the 47 detector hits are NOT here, and that is the point of having read the pages: in
rare-earths Table 7-8 the row `Ca, Mg, B, Cu, S` is a MINERAL LIST -- the B is BORON and the comma
is real. My subscript pattern made the word "vitamin" optional, so every boron in a list fired. A
rule would have turned boron into a vitamin in 5 claims.
"""
import json, re, sys, subprocess, os
from pathlib import Path

ROOT = Path(r"C:\Users\Light\Desktop\claude\health expert")
# Working data lives in tools/frontface/work/ (gitignored) so generated analysis never lands
# in a commit. Repointed from the session scratchpad 2026-08-02.
WORK = Path(__file__).resolve().parent / "work"
WORK.mkdir(parents=True, exist_ok=True)
SP = WORK
BOOKS = ROOT / "eden/corpus/books"
DRY = "--dry-run" in sys.argv

FILE = {"EPIGEN": "epigenetics.txt", "IMMORT": "immortality.txt",
        "RARE": "rare-earths-forbidden-cures.txt", "LETS": "lets-play-doctor-fourth-edition-1995.txt",
        "HELLS": "hk.txt"}

claims = {}
for p in (ROOT / "eden/corpus/claims").glob("claims-*.json"):
    for c in json.loads(p.read_text(encoding="utf-8"))["claims"]:
        claims[c["id"]] = c["verbatim"]

hits = json.loads((SP / "wave2-results.json").read_text(encoding="utf-8"))

# drop the boron false positives and any no-op, then de-duplicate
work, seen = [], set()
for h in hits:
    if h["page"].startswith("B,"):
        continue                      # boron in a mineral list -- a real comma, not a subscript
    if h["damaged"] == h["page"]:
        continue
    k = (h["id"], h["damaged"], h["page"])
    if k in seen:
        continue
    seen.add(k)
    work.append(h)

texts, plan, problems = {}, [], []
for h in work:
    book = h["id"].split("-")[2]
    fn = FILE[book]
    if fn not in texts:
        texts[fn] = BOOKS.joinpath(fn).read_text(encoding="utf-8")
    vb = claims[h["id"]]
    dmg = h["damaged"]
    i = vb.find(dmg)
    if i < 0:
        problems.append((h["id"], dmg, "not present in the claim verbatim (already fixed?)"))
        continue
    # widen the context window until it is unique in the whole book
    for pad in (25, 45, 80, 140, 240):
        lo, hi = max(0, i - pad), min(len(vb), i + len(dmg) + pad)
        old = vb[lo:hi]
        if texts[fn].count(old) == 1:
            break
    else:
        problems.append((h["id"], dmg, "no unique anchor even at 240 chars of context"))
        continue
    new = old.replace(dmg, h["page"], 1)
    if new == old:
        problems.append((h["id"], dmg, "replacement produced no change"))
        continue
    plan.append((fn, old, new, h["id"], dmg, h["page"]))

print(f"edits planned: {len(plan)}   (from {len(work)} recoveries; "
      f"{len(hits) - len(work)} detector hits dropped as boron/no-op)")
for fn, old, new, cid, d, p in plan:
    print(f"  {cid[8:]:20s} {d!r:14s} -> {p!r}")
if problems:
    print("\nPROBLEMS (reported, not silently skipped):")
    for x in problems:
        print("   ", x)

if DRY:
    print("\nDRY RUN - nothing written.")
    sys.exit(0)
if problems:
    print("\nABORTED - resolve the problems above first; nothing written.")
    sys.exit(1)

applied, shared = 0, []
for fn, old, new, cid, d, p in plan:
    n = texts[fn].count(old)
    if n == 1:
        texts[fn] = texts[fn].replace(old, new, 1)
        applied += 1
        continue
    # Two claims can quote the SAME span (e.g. IMMORT-000302 and -000307 both carry
    # "In pernicious anemia (B,, deficiency)"). The first edit consumes the anchor, so the second
    # finds 0. That is already-applied, not a failure -- but only if the corrected text is there.
    if n == 0 and texts[fn].count(new) >= 1:
        shared.append(cid)
        continue
    print(f"ABORT: anchor for {cid} matches {n} times and the correction is not present")
    sys.exit(1)
if shared:
    print(f"  shared-span claims already covered by an earlier edit: {shared}")
print(f"  edits actually applied: {applied}")

for fn, t in texts.items():
    stage = SP / f"stage2-{fn}"
    stage.write_text(t, encoding="utf-8", newline="\n")
    r = subprocess.run([sys.executable, str(ROOT / "tools/safe_write.py"), "rewrite",
                        str(BOOKS / fn), "--payload-file", str(stage)],
                       capture_output=True, text=True, env={**os.environ, "PYTHONUTF8": "1"})
    print(r.stdout.strip() or r.stderr.strip())
    if r.returncode != 0:
        sys.exit(1)
