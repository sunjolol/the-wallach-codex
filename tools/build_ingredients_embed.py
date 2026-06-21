"""Build the slim ingredients embed for Pass E.

Round 75 Pass E. Reads knowledge/ingredients-master.json (Pass A.3 / A.3.5
output, with Wallach corpus citations) and produces a slim per-ingredient
lookup for the dashboard's ingredient-education layer. Embeds into
dashboard.html as <script type="application/json" id="ingredients-embed">.

The full master is 466 KB - too big to embed entirely. The slim form keeps
only what the click-popup UX needs:
- name (canonical display)
- canon (lowercase normalization key for lookup)
- cat (category from Pass A.3 classifier)
- al (aliases, capped at 3)
- w (top-1 Wallach citation: source + truncated snippet)
- ip (in_products count - "this is in N Youngevity products")
- pb (parent_blends count - "this is part of N blends across the catalog")
- dv (documented_via flag)

Per-entry: ~250 bytes. ~400 entries with useful data (citation OR products) =
~100 KB embedded. The full ingredients-master.json stays on disk for export-
bundle inclusion (Pass C.1 commitment) + future deeper UX surfaces.

Cross-platform discipline per Round 74:
- encoding='utf-8' on every text-mode open()
- pathlib.Path
- datetime.now(tz=utc)
- sys.executable for subprocess
Edit-tool ban per protocol §17 - all writes via tools/safe_write.py.
"""

from __future__ import annotations

import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MASTER = REPO / "knowledge" / "ingredients-master.json"
EMBED_OUT = REPO / "knowledge" / "ingredients-embed.json"
DASH = REPO / "dashboard" / "dashboard.html"
SAFE_WRITE = REPO / "tools" / "safe_write.py"

BLOCK_ID = "ingredients-embed"
# Insert AFTER regimen-label-lookup so essentials-targets-data stays the last
# JSON block before the main JS (preserves check_main_js_size).
INSERT_AFTER_BLOCK_ID = "regimen-label-lookup"

SNIPPET_MAX = 200
ALIAS_MAX = 3
# Filter: include ingredients with at least one of {wallach citation,
# product appearance, blend appearance}. Skips ingredients that exist in
# the master DB but have zero useful UX content.
def is_worth_embedding(entry):
    has_refs = bool(entry.get("wallach_refs"))
    in_products = (entry.get("in_products_count") or 0) > 0
    in_blends = bool(entry.get("parent_blends"))
    return has_refs or in_products or in_blends


def truncate_snippet(text, limit=SNIPPET_MAX):
    if not isinstance(text, str):
        return ""
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    last_space = cut.rfind(" ")
    if last_space > limit // 2:
        return cut[:last_space].rstrip() + "..."
    return cut.rstrip() + "..."


def slim_entry(entry):
    """Return a minimal entry. Field names use short keys to save bytes."""
    out = {
        "n": entry.get("name", ""),
        "c": entry.get("canon_key", ""),
    }
    cat = entry.get("category")
    if cat and cat != "other":
        out["cat"] = cat
    aliases = entry.get("aliases") or []
    if aliases:
        out["al"] = aliases[:ALIAS_MAX]
    refs = entry.get("wallach_refs") or []
    if refs:
        top = refs[0] or {}
        out["w"] = {
            "src": (top.get("source") or "")[:80],
            "sn": truncate_snippet(top.get("snippet") or "", SNIPPET_MAX),
        }
    ipc = entry.get("in_products_count") or 0
    if ipc > 0:
        out["ip"] = ipc
    pbc = len(entry.get("parent_blends") or [])
    if pbc > 0:
        out["pb"] = pbc
    dv = entry.get("documented_via")
    if dv:
        out["dv"] = dv
    return out


def build_embed():
    with open(MASTER, "r", encoding="utf-8") as f:
        master = json.load(f)
    ingredients_in = master.get("ingredients", {})
    slim_by_canon = {}
    skipped = 0
    for _name, entry in ingredients_in.items():
        if not isinstance(entry, dict):
            continue
        if not is_worth_embedding(entry):
            skipped += 1
            continue
        slim = slim_entry(entry)
        canon = slim.get("c") or slim.get("n", "").lower()
        if not canon:
            continue
        slim_by_canon[canon] = slim
    return {
        "_meta": {
            "purpose": (
                "Slim ingredients lookup for Pass E ingredient-education layer. "
                "Subset of knowledge/ingredients-master.json with short field "
                "names for embed compactness. Source-of-truth for ingredient "
                "data: ingredients-master.json. This file is derived."
            ),
            "source": "knowledge/ingredients-master.json",
            "generator": "tools/build_ingredients_embed.py",
            "generated_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "schema_version": 1,
            "ingredient_count": len(slim_by_canon),
            "skipped_no_content": skipped,
            "field_legend": {
                "n": "name (display)", "c": "canon (lowercase key)",
                "cat": "category", "al": "aliases (capped)",
                "w": "top wallach ref {src, sn}",
                "ip": "in_products count", "pb": "parent_blends count",
                "dv": "documented_via",
            },
        },
        "ingredients": slim_by_canon,
    }


# ---------------------------------------------------------------------------
# safe_write helper
# ---------------------------------------------------------------------------

def safe_rewrite(path, payload_bytes):
    tmp = path.with_suffix(path.suffix + ".payload.tmp")
    tmp.write_bytes(payload_bytes)
    try:
        result = subprocess.run(
            [sys.executable, str(SAFE_WRITE), "rewrite",
             str(path.relative_to(REPO)), "--payload-file", str(tmp)],
            cwd=REPO, capture_output=True, text=True, encoding="utf-8",
        )
        if result.returncode != 0:
            raise RuntimeError(
                "safe_write rewrite failed for {0}: stdout={1} stderr={2}".format(
                    path, result.stdout, result.stderr
                )
            )
        print(result.stdout.strip())
    finally:
        try:
            if tmp.exists():
                tmp.unlink()
        except (PermissionError, OSError):
            pass


# ---------------------------------------------------------------------------
# Dashboard embed
# ---------------------------------------------------------------------------

def find_block_bytes(data, block_id):
    pat = re.compile(rb'<script[^>]*id="' + re.escape(block_id.encode()) + rb'"[^>]*>')
    m = pat.search(data)
    if not m:
        return None
    open_start = m.start()
    open_end = m.end()
    close_start = data.find(b'</script>', open_end)
    if close_start < 0:
        return None
    close_end = close_start + len(b'</script>')
    return (open_start, open_end, close_start, close_end)


def build_block_bytes(payload_obj):
    payload_json = json.dumps(payload_obj, ensure_ascii=False, separators=(",", ":"))
    payload_bytes = payload_json.encode("utf-8")
    payload_bytes = payload_bytes.replace(b"</script>", b"<\\/script>")
    open_tag = '<script type="application/json" id="{0}">'.format(BLOCK_ID).encode("utf-8")
    close_tag = b'</script>'
    return open_tag + payload_bytes + close_tag


def embed_in_dashboard(payload_obj):
    data = DASH.read_bytes()
    new_block = build_block_bytes(payload_obj)
    existing = find_block_bytes(data, BLOCK_ID)
    if existing is not None:
        open_start, _, _, close_end = existing
        new_data = data[:open_start] + new_block + data[close_end:]
        action = "replaced"
    else:
        anchor = find_block_bytes(data, INSERT_AFTER_BLOCK_ID)
        if anchor is None:
            raise RuntimeError(
                "Anchor block not found in dashboard.html: id={0!r}. Cannot determine insertion point.".format(
                    INSERT_AFTER_BLOCK_ID
                )
            )
        _, _, _, anchor_close_end = anchor
        new_data = data[:anchor_close_end] + b"\n" + new_block + data[anchor_close_end:]
        action = "inserted"
    verify = find_block_bytes(new_data, BLOCK_ID)
    if verify is None:
        raise RuntimeError("Post-write verification: new block not findable.")
    _, vo, vc, _ = verify
    payload = new_data[vo:vc].replace(b"<\\/script>", b"</script>")
    try:
        json.loads(payload.decode("utf-8"))
    except Exception as e:
        raise RuntimeError("Post-write verification: new block does not parse as JSON: {0}".format(e))
    safe_rewrite(DASH, new_data)
    return (len(new_data), action)


def main():
    if not MASTER.exists():
        print("FATAL: ingredients-master not found at {0}. Run build_ingredients_master.py first.".format(MASTER), file=sys.stderr)
        return 2
    embed = build_embed()
    meta = embed["_meta"]
    print("Built embed: {0} ingredients (skipped {1} with no UX-useful content).".format(
        meta["ingredient_count"], meta["skipped_no_content"]
    ))
    canonical_bytes = json.dumps(embed, ensure_ascii=False, indent=2).encode("utf-8")
    safe_rewrite(EMBED_OUT, canonical_bytes)
    print("Canonical: {0} ({1} bytes)".format(EMBED_OUT.relative_to(REPO), len(canonical_bytes)))
    new_size, action = embed_in_dashboard(embed)
    print("Dashboard: {0} block id={1!r} ({2} bytes total)".format(action, BLOCK_ID, new_size))
    return 0


if __name__ == "__main__":
    sys.exit(main())
