#!/usr/bin/env python3
"""Negative test for fonts_declared_and_shipped.

Proof artifact: the gate must GREEN on the real tree and REDDEN on each way the fonts
directory and the stylesheets can fall out of step -- in BOTH directions, because a font cut
breaks in both. The half that matters most is the silent one: a font file nobody declares
renders nothing, errors nowhere and appears on no surface, so 9.21 MB of never-selected faces
rode in every download for months and only an audit that drove the app found them.

★ AND ONE CASE HERE IS A *GREEN* CASE ON PURPOSE. Case (3) removes a face's file AND its
declarations together -- the legitimate cut. A gate that reddened on that would make the very
operation it exists to protect impossible, so "permits a complete cut" is asserted, not
assumed.

Drives _fonts_declared_and_shipped_impl with tampered inputs; writes nothing to the tree. The
tampering is DERIVED from whatever the real files currently say -- never a hardcoded family
name -- so it survives the font set changing, which is the whole point of shipping it beside
a change that removes two faces.

    PYTHONUTF8=1 python tools/tests/test_fonts_declared_and_shipped.py

Exit 0 = every case behaves; non-zero = the gate stopped biting."""
import importlib.util
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FONTS = ROOT / "dashboard" / "assets" / "fonts"
STYLES = ROOT / "dashboard" / "assets" / "styles"

spec = importlib.util.spec_from_file_location("invariants", ROOT / "tools" / "invariants.py")
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)
impl = inv._fonts_declared_and_shipped_impl

SUFFIXES = {".ttf", ".otf", ".woff", ".woff2"}
real_disk = {p.name for p in FONTS.iterdir() if p.is_file() and p.suffix.lower() in SUFFIXES}
real_sheets = {p.name: p.read_text(encoding="utf-8") for p in sorted(STYLES.glob("*.css"))}


def resolver(disk):
    """A src url resolves iff its basename is a file we ship AND it points into ../fonts/."""
    def resolves(_css_name, url):
        if "../fonts/" not in url.replace("\\", "/"):
            return None
        base = url.replace("\\", "/").rsplit("/", 1)[-1]
        return base if base in disk else None
    return resolves


failures = []


def expect(label, ok, msg, want_green, must_say=None):
    if ok != want_green:
        failures.append(f"{label}: expected {'GREEN' if want_green else 'RED'}, got "
                        f"{'GREEN' if ok else 'RED'} -- {msg}")
        return
    if not want_green and must_say and must_say not in msg:
        failures.append(f"{label}: RED for the wrong reason -- wanted {must_say!r}, got {msg!r}")


# (0) GREEN on the real tree. If this fails nothing below means anything.
ok, msg = impl(real_disk, real_sheets, resolver(real_disk))
expect("(0) real tree", ok, msg, True)
if not ok:
    print("\n".join(failures))
    sys.exit(1)

# Pick a victim face from whatever is really declared, so this survives the set changing.
face_re = re.compile(r"@font-face\s*\{(.*?)\}", re.S)
src_re = re.compile(r"src:\s*url\(\s*['\"]?([^)'\"]+)['\"]?\s*\)")
victim_sheet = None
victim_file = None
for name, text in real_sheets.items():
    for body in face_re.findall(text):
        m = src_re.search(body)
        if m:
            base = m.group(1).rsplit("/", 1)[-1]
            if base in real_disk:
                victim_sheet, victim_file = name, base
                break
    if victim_file:
        break
assert victim_file, "could not derive a victim face from the real stylesheets"

# (1) THE FILE IS GONE, THE DECLARATION STAYS. Half a cut: the app declares a face whose
#     bytes are not there.
disk_missing = real_disk - {victim_file}
ok, msg = impl(disk_missing, real_sheets, resolver(disk_missing))
expect("(1) file deleted, @font-face kept", ok, msg, False, "does not exist")

# (2) THE DECLARATION IS GONE, THE FILE STAYS. The other half, and the silent one -- this is
#     the shape that shipped 9.21 MB of unreachable bytes.
stripped = dict(real_sheets)
for name, text in list(stripped.items()):
    stripped[name] = "".join(
        "" if (victim_file in blk) else blk
        for blk in re.split(r"(@font-face\s*\{.*?\})", text, flags=re.S))
ok, msg = impl(real_disk, stripped, resolver(real_disk))
expect("(2) @font-face deleted, file kept", ok, msg, False, "declared by no @font-face")

# (3) ★ BOTH HALVES TOGETHER -- the legitimate cut. MUST STAY GREEN, or the gate forbids the
#     operation it was written to make safe.
ok, msg = impl(disk_missing, stripped, resolver(disk_missing))
expect("(3) complete cut (file AND declarations)", ok, msg, True)

# (4) A DECLARATION POINTING SOMEWHERE ELSE. A path typo resolves to nothing, and the file it
#     meant to name is then an orphan -- both clauses should speak.
repathed = {n: t.replace("../fonts/" + victim_file, "../vendor/" + victim_file)
            for n, t in real_sheets.items()}
ok, msg = impl(real_disk, repathed, resolver(real_disk))
expect("(4) src url repointed outside ../fonts/", ok, msg, False, "does not exist")

# (5) VACUITY, BOTH WAYS. An empty font set and a stylesheet set with no @font-face at all
#     must FAIL. A checker that finds nothing and says "clean" is the one outcome that must
#     never happen -- it is how a whole gate silently stops existing.
ok, msg = impl(set(), real_sheets, resolver(set()))
expect("(5a) empty fonts directory", ok, msg, False, "cannot be empty")

ok, msg = impl(real_disk, {"nothing.css": "body { color: red; }"}, resolver(real_disk))
expect("(5b) no @font-face anywhere", ok, msg, False, "parse found")

if failures:
    print("FAIL — the gate did not behave:")
    for f in failures:
        print("  " + f)
    sys.exit(1)

print(f"OK — fonts_declared_and_shipped behaves on all 7 cases "
      f"(victim derived: {victim_file} in {victim_sheet}; {len(real_disk)} faces on disk)")
