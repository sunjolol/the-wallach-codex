#!/usr/bin/env python3
"""Generate a design-mockup shell that renders in the REAL container geometry.

WHY THIS EXISTS
Mockups kept being authored as standalone white full-width pages and rejected on sight,
because a header does not live on a blank page -- it lives inside the tan `.kd-ep-fam`
box, tinted by the element's category accent, at an exact width. Rebuilding that shell by
hand each time meant it drifted: a figure authored at 820px rendered at scale 0.996 and
quietly taxed every label in it.

So the shell is GENERATED, and the stylesheet list is READ OUT OF dashboard.html rather
than copied. If the app adds a stylesheet, every future mockup gets it automatically.

WHAT IS FIXED, AND WHY ONLY THIS
The shell overrides position/overflow ONLY, to put the drawer back into document flow.
It never touches width, padding, border or box-sizing -- the moment it does, the geometry
stops being the real geometry and the mockup starts lying.

MEASURED GEOMETRY (verify with --measure, do not trust this comment):
  .kd-ep          screen   ~867px
  .kd-ep-fam      box       865px, padding var(--ds-space-5) = 24px a side
  => real ceiling for a FIGURE: 817px. The two shipped slots are exact: fork 700, rail 660.

THE CASCADE TRAP THIS DOES NOT SAVE YOU FROM
`#drawer-knowledge-mount .kd-ep-fam__figure { max-width: 560px }` is an ID selector. A
bare-class width override LOSES, so an 800-unit viewBox draws at 560px -- scale 0.70, and
every label inside is silently 30% smaller with nothing wrong in the source. Write
overrides at matching specificity:
  #drawer-knowledge-mount .kd-ep-fam__figure.<modifier> { max-width: ...px; }
The same applies to font-size, not just width.

USAGE
  python tools/mockup_harness.py --out temporary/zinc-demos.html \
         --category mineral --title "Zinc header - 4 concepts" \
         --panel "A. one-line pitch:path/to/panel-a.html" --panel "B. ...:panel-b.html"
  python tools/mockup_harness.py --measure temporary/zinc-demos.html
"""
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DASH = ROOT / "dashboard"


def stylesheet_hrefs():
    """Read the live <link rel=stylesheet> list out of dashboard.html.

    Derived, never copied: a hand-maintained duplicate of this list is exactly the
    single-source-of-truth violation that makes a mockup silently differ from the app.
    """
    html = (DASH / "dashboard.html").read_text(encoding="utf-8")
    hrefs = re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html)
    if not hrefs:
        hrefs = re.findall(r'<link[^>]+href="([^"]+\.css)"', html)
    if not hrefs:
        raise SystemExit("FATAL: no stylesheets found in dashboard.html -- refusing to "
                         "emit a shell that would render unstyled")
    return [h.replace("./", "") for h in hrefs]


def vendored_libs():
    man = DASH / "assets" / "vendor" / "libs" / "vendor-manifest.json"
    if not man.exists():
        return []
    return json.loads(man.read_text(encoding="utf-8")).get("libs", [])


SHELL_CSS = """
/* MOCKUP SHELL ONLY -- restores document flow by touching position/overflow only.
   Never width, padding, border or box-sizing: those ARE the geometry under test. */
html, body { height: auto; overflow: auto; }
body { background: var(--ds-paper-deep); margin: 0; padding: 0 0 90px; }
#drawer-knowledge-mount { position: relative; pointer-events: auto; }
#drawer-knowledge-mount.kd-open { position: relative; top: auto; bottom: auto; left: auto;
  margin: 0 auto 10px; overflow: visible; box-shadow: none; height: auto; }
#drawer-knowledge-mount .kd-body { flex: none; overflow: visible; }
.mk-label { max-width: 865px; margin: 40px auto 10px; padding: 13px 18px; background: #1a1612;
  color: #f2ead3; font-family: var(--ds-font-mono); font-size: .76rem; line-height: 1.6; }
.mk-label h2 { font-family: var(--ds-font-display); font-size: 1rem; margin: 0 0 6px; color: #fff; }
.mk-note { max-width: 865px; margin: 0 auto 26px; font-family: var(--ds-font-mono);
  font-size: .72rem; color: var(--ds-ink-faint); }
"""


def build(out: pathlib.Path, category: str, title: str, panels, depth: int):
    up = "../" * depth
    links = "\n".join(f'<link rel="stylesheet" href="{up}dashboard/{h}">'
                       for h in stylesheet_hrefs())
    libs = "\n".join(f'<script src="{up}dashboard/{l["file"]}"></script>'
                      for l in vendored_libs())
    lib_names = ", ".join(f'{l["package"]}@{l["version"]}' for l in vendored_libs())

    body = []
    for label, frag_path in panels:
        frag = pathlib.Path(frag_path).read_text(encoding="utf-8") if frag_path and pathlib.Path(frag_path).exists() else \
            '<div class="kd-ep-fam"><p style="font-family:var(--ds-font-mono);font-size:.8rem">'\
            'empty panel -- pass --panel "label:path/to/fragment.html"</p></div>'
        body.append(f'<div class="mk-label"><h2>{label}</h2></div>\n'
                    f'<div id="drawer-knowledge-mount" class="kd-open"><div class="kd-body">'
                    f'<div class="kd-essential-deep kd-ep" data-category="{category}">\n{frag}\n'
                    f'</div></div></div>')

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<!-- GENERATED by tools/mockup_harness.py. SCAFFOLDING, never shipped.
     Stylesheet list is read out of dashboard.html, so it cannot drift from the app.
     Vendored libraries available in this shell: {lib_names or "(none vendored)"} -->
{links}
{libs}
<style>{SHELL_CSS}</style>
</head>
<body>
<div class="mk-note">Generated shell &middot; real container geometry &middot; category
"{category}" &middot; verify with: python tools/mockup_harness.py --measure {out.as_posix()}</div>
{"".join(body)}
</body>
</html>
"""
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"OK  {out} written ({len(html)} chars, {len(panels)} panel(s))")
    print(f"    stylesheets: {len(stylesheet_hrefs())} (read from dashboard.html)")
    print(f"    libraries:   {lib_names or '(none)'}")
    print(f"    NEXT: open it, and never build live without Luneth's explicit approval.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--category", default="mineral")
    ap.add_argument("--title", default="Design mockups")
    ap.add_argument("--panel", action="append", default=[],
                    help='"Label:path/to/fragment.html" (repeatable)')
    ap.add_argument("--measure", help="report the TRUE rendered geometry of a shell")
    a = ap.parse_args()

    if a.measure:
        print("Run the headless measurement with:")
        print(f"  node tools/mockup_measure.js {a.measure}")
        return 0
    if not a.out:
        ap.error("--out is required unless --measure is used")
    out = pathlib.Path(a.out)
    if not out.is_absolute():
        out = ROOT / out
    depth = len(out.resolve().relative_to(ROOT).parts) - 1
    panels = []
    for p in a.panel:
        label, _, path = p.partition(":")
        panels.append((label.strip(), path.strip()))
    if not panels:
        panels = [("A", ""), ("B", ""), ("C", ""), ("D", "")]
    build(out, a.category, a.title, panels, depth)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
