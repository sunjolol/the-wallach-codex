"""Negative control for check_css_comment_no_premature_close (Charter R9 / verification
doctrine): a gate that only ever passes proves nothing. This re-breaks CSS three ways and
asserts the guard goes RED, and confirms it stays GREEN on clean CSS and on the one shape
that LOOKS like the bug but is legitimate (a '*/' inside a string).

Run: PYTHONUTF8=1 python tools/test_css_comment_no_premature_close.py
Exit 0 = all cases held; non-zero = the guard has regressed."""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from invariants import _css_comment_no_premature_close_impl, _premature_comment_close_hits  # noqa: E402

failures = []


def expect(name, files, want_ok):
    ok, msg = _css_comment_no_premature_close_impl(files)
    if ok != want_ok:
        failures.append(f"{name}: expected ok={want_ok}, got ok={ok} — {msg}")


# 1. Clean CSS with a normal comment + rule — GREEN.
expect("clean", [("a.css", "/* a normal comment */\n.x { color: red; }\n")], True)

# 2. THE REAL BUG (2026-08-17): a '*/' inside a token glob in a comment body closes the
#    comment early; the '.rr-btn--danger' rule right after it is silently dropped. RED.
real = (
    "/* (H) Deep status hues.\n"
    "   The base --ds-status-*/--ds-accent-deep are left alone (correct on cream). */\n"
    ':root[data-theme="dark"] .rr-btn--danger {\n'
    "  color: color-mix(in srgb, var(--ds-status-err) 66%, var(--ds-ink));\n"
    "}\n"
)
expect("real-theme-bug", [("theme.css", real)], False)

# 3. Another glob shape: '--o-*/--sev-*' — RED.
expect("token-glob", [("b.css", "/* families --o-*/--sev-* handled below */\n.y { color: blue; }\n")], False)

# 4. A '*/' legitimately INSIDE a string (content value) — must NOT flag. GREEN.
expect("star-slash-in-string", [("c.css", '.z::before { content: "*/"; }\n')], True)

# 5. Escaped quote inside a string must not desync the scanner. GREEN.
expect("escaped-quote", [("d.css", '.q::after { content: "a\\"b"; }\n/* fine */\n.r { top: 0; }\n')], True)

# 6. The real bug's orphan '*/' is reported at the intended-close line (line 2 here).
hits = _premature_comment_close_hits(real)
if not hits or hits[0][0] != 2:
    failures.append(f"line-report: expected an orphan */ on line 2, got {hits}")

# 7. Mixed batch — one clean file, one broken file → RED overall, names the broken file.
ok, msg = _css_comment_no_premature_close_impl([("ok.css", ".a{}\n"), ("bad.css", "/* x-*/y */\n.b{}\n")])
if ok or "bad.css" not in msg:
    failures.append(f"mixed-batch: expected RED naming bad.css, got ok={ok} — {msg}")

if failures:
    print("FAIL — check_css_comment_no_premature_close regressed:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("OK — premature-comment-close guard fires RED on 3 planted breaks, stays GREEN on clean")
print("     CSS + a legitimate '*/'-in-string; orphan line reported correctly.")
