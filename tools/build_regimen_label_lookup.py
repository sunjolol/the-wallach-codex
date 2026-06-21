"""Build the regimen-label-lookup block from products-db.json.

Round 75 - Pass A. Connectivity primitive for the Regimen tab's Full edit flow:
when a user clicks "Full edit" on a regimen card, the Label Check form populator
(lcPopulateFormFromItem) consults this lookup by product name BEFORE falling back
to the partial nutrient data embedded in REGIMEN_BASE_DATA. The same lookup also
serves as the cross-tab connectivity layer for future passes (per-card cost
overlays, conflict checks, etc.).

Doctrine §3 - single source of truth. products-db.json is the canonical Youngevity
catalog; REGIMEN_BASE_DATA carries only regimen-membership metadata (id, dose,
notes, category); the lookup bridges them on demand by name.

Cross-platform discipline per Round 74 / lessons.md (2026-06-15 at 9:55 AM):
- encoding='utf-8' on every text-mode open()
- pathlib.Path for paths
- datetime.now(tz=utc) not utcnow()
- sys.executable for any subprocess
- avoid glibc-only strftime specifiers

The script also embeds the new JSON block into dashboard.html. If the block
already exists, it is replaced in place. If it doesn't exist, it is inserted
after the essentials-best-supplements block close so essentials-targets-data
stays the LAST JSON block before the main JS (preserving check_main_js_size).
"""

from __future__ import annotations

import datetime
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PRODUCTS_DB = REPO / "knowledge" / "products-db.json"
LOOKUP_OUT = REPO / "knowledge" / "regimen-label-lookup.json"
DASH = REPO / "dashboard" / "dashboard.html"
SAFE_WRITE = REPO / "tools" / "safe_write.py"

BLOCK_ID = "regimen-label-lookup"
INSERT_AFTER_BLOCK_ID = "essentials-best-supplements"


# ---------------------------------------------------------------------------
# Data transformation
# ---------------------------------------------------------------------------

# Plain "Name 200 mg" pattern (no parenthesized sub-ingredients).
NE_PATTERN_PLAIN = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s+(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
    r"(?P<rest>.*)$"
)

# Blend pattern: "Blend Name 75 mg (sub1, sub2, sub3)". Pass A.1 — was being
# discarded; now expanded into parent + child rows so blend sub-ingredients
# surface in the Full edit form.
NE_PATTERN_BLEND = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s+(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
    r"\s*\((?P<subs>[^)]+)\)"
)

# Form-qualifier pattern: "Vitamin A (beta-carotene) 500 mcg" — parens describe
# the form, not a blend list. Detected by paren-then-amount.
NE_PATTERN_FORM = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s*\((?P<form>[^)]+)\)\s+"
    r"(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
)

UNIT_NORMALIZE = {
    "mg": "mg", "MG": "mg",
    "mcg": "mcg", "MCG": "mcg", "ug": "mcg",
    "g": "g",
    "iu": "IU", "IU": "IU",
}


def parse_non_essential(s):
    """Parse a non_essentials string into structured form.

    Returns a list of dicts (Pass A.1 — was returning single dict / None):
    - Plain "Name X mg" -> single row, category=label_extra
    - "Vitamin A (beta-carotene) X mcg" -> single row with form field
    - "Blend Name X mg (sub1, sub2, ...)" -> parent row (category=blend_parent
      with sub_ingredients[]) + one child row per sub-ingredient
      (category=blend_child, amount=None, parent_blend=parent_name)
    Returns [] for unparseable entries (narrative strings, etc.).
    """
    if not isinstance(s, str):
        return []
    s = s.strip()
    if not s:
        return []
    # Try form-qualifier pattern first (paren before amount)
    m = NE_PATTERN_FORM.match(s)
    if m:
        try:
            amount = float(m.group("amount"))
        except (ValueError, TypeError):
            return []
        name = m.group("name").strip().rstrip(",").strip()
        if not name:
            return []
        unit = UNIT_NORMALIZE.get(m.group("unit"), m.group("unit").lower())
        return [{
            "name": name, "amount": amount, "unit": unit,
            "form": m.group("form").strip(),
            "alignment": "unknown", "category": "label_extra",
        }]
    # Try blend pattern (paren AFTER amount with sub-ingredient list)
    m = NE_PATTERN_BLEND.match(s)
    if m:
        try:
            amount = float(m.group("amount"))
        except (ValueError, TypeError):
            return []
        parent_name = m.group("name").strip().rstrip(",").strip()
        if not parent_name:
            return []
        unit = UNIT_NORMALIZE.get(m.group("unit"), m.group("unit").lower())
        subs = [x.strip().rstrip(".") for x in m.group("subs").strip().split(",") if x.strip()]
        out = [{
            "name": parent_name, "amount": amount, "unit": unit,
            "form": "proprietary blend ({0} sub-ingredients)".format(len(subs)),
            "alignment": "unknown", "category": "blend_parent",
            "sub_ingredients": subs,
        }]
        for sub in subs:
            out.append({
                "name": sub, "amount": None, "unit": "",
                "form": "from {0} ({1} mg total)".format(parent_name, amount),
                "alignment": "unknown", "category": "blend_child",
                "parent_blend": parent_name,
            })
        return out
    # Try plain pattern
    m = NE_PATTERN_PLAIN.match(s)
    if m:
        try:
            amount = float(m.group("amount"))
        except (ValueError, TypeError):
            return []
        name = m.group("name").strip().rstrip(",").strip()
        if not name:
            return []
        unit = UNIT_NORMALIZE.get(m.group("unit"), m.group("unit").lower())
        return [{
            "name": name, "amount": amount, "unit": unit,
            "form": "non_essential (from label)",
            "alignment": "unknown", "category": "label_extra",
        }]
    return []


def truncate_for_embed(text, max_chars=600):
    """Bound description prose at embed time. Full text stays in products-db."""
    if not isinstance(text, str):
        return ""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    last_period = cut.rfind(". ")
    if last_period > max_chars // 2:
        return cut[:last_period + 1].strip()
    return cut.rstrip() + "..."


def _slim_nutrient(name, amount, unit, form, alignment):
    """Emit only non-default fields. Consumer treats missing form / alignment
    as empty / 'unknown'. Shaves ~25% off per-row byte cost."""
    row = {"name": name, "amount": amount, "unit": unit or ""}
    if form:
        row["form"] = form
    if alignment and alignment != "unknown":
        row["alignment"] = alignment
    return row


def normalize_nutrients(nutrients_obj):
    """Convert products-db.nutrients (object keyed by name) to array form."""
    if not nutrients_obj:
        return []
    out = []
    if isinstance(nutrients_obj, list):
        for n in nutrients_obj:
            if isinstance(n, dict) and "name" in n:
                out.append(_slim_nutrient(
                    n.get("name", ""), n.get("amount"), n.get("unit", ""),
                    n.get("form", ""),
                    n.get("form_alignment") or n.get("alignment"),
                ))
        return out
    for name, v in nutrients_obj.items():
        if not isinstance(v, dict):
            continue
        out.append(_slim_nutrient(
            name, v.get("amount"), v.get("unit", ""),
            v.get("form", ""),
            v.get("form_alignment") or v.get("alignment"),
        ))
    return out


def slim_pricing(p):
    if not isinstance(p, dict):
        return {}
    out = {}
    for k in ("retail", "wholesale", "suggested_retail"):
        if k in p and p[k] is not None:
            out[k] = p[k]
    return out


def build_lookup(db):
    products = db.get("products", {})
    out_products = {}
    parsed_ne_total = 0
    skipped_ne_total = 0
    blends_expanded = 0
    for name, p in products.items():
        if not isinstance(p, dict):
            continue
        nutrients = normalize_nutrients(p.get("nutrients"))
        non_essentials_raw = p.get("non_essentials") or []
        non_essentials_parsed = []
        for ne in non_essentials_raw:
            rows = parse_non_essential(ne)
            if rows:
                # Pass A.1 schema refinement: keep ONLY quantified rows in the
                # nutrient-facts side (label_extra + blend_parent). blend_child
                # rows are NOT separate nutrient rows — they live as sub_ingredients
                # on the parent and get composed into the Ingredients text by the
                # populator. This is structurally correct (children have no
                # quantity) AND drops ~60% of the embed size relative to flattening.
                kept = [r for r in rows if r.get("category") != "blend_child"]
                non_essentials_parsed.extend(kept)
                parsed_ne_total += 1
                if any(r.get("category") == "blend_parent" for r in rows):
                    blends_expanded += 1
            else:
                skipped_ne_total += 1
        # Slim by design: empty-value fields dropped per product so byte cost
        # stays bounded. Consumer treats missing fields as empty via standard
        # JS truthiness (item.pricing?.retail ?? '').
        entry = {"nutrients": nutrients}
        if non_essentials_parsed:
            entry["non_essentials_parsed"] = non_essentials_parsed
        serving_size = p.get("serving_size", "")
        if serving_size:
            entry["serving_size"] = serving_size
        spc = p.get("servings_per_container")
        if spc:
            entry["servings_per_container"] = spc
        pricing = slim_pricing(p.get("pricing"))
        if pricing:
            entry["pricing"] = pricing
        category = p.get("category", "")
        if category:
            entry["category"] = category
        # Pass A.1: educational context fields from the Youngevity product page.
        # what_it_does + features are the concise per-product context the Full
        # edit populator uses to auto-compose an ingredient text draft.
        # description was dropped from the embed - the longest field per product,
        # mostly marketing prose, redundant with features for the populator's
        # needs. Full text stays in products-db for any future consumer that
        # needs it. Saves ~63 KB across the embed.
        wid = truncate_for_embed(p.get("what_it_does", ""), 300)
        if wid:
            entry["what_it_does"] = wid
        features = p.get("features") or []
        if features:
            entry["features"] = [str(f).strip() for f in features[:6] if str(f).strip()]
        out_products[name] = entry
    return {
        "_meta": {
            "purpose": (
                "Slim per-product label lookup keyed by product name. Bridges "
                "REGIMEN_BASE_DATA (regimen-membership metadata) and "
                "products-db.json (canonical Youngevity label data). Used by "
                "the Regimen tab's Full edit flow to populate the Label Check "
                "form with the full nutrient panel + parsed non-essentials "
                "(including blend-parent + blend-child rows) + serving / "
                "container / pricing metadata + educational context "
                "(features, description, what_it_does). Round 75 Pass A.1."
            ),
            "source": "knowledge/products-db.json",
            "generator": "tools/build_regimen_label_lookup.py",
            "generated_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "schema_version": 2,
            "product_count": len(out_products),
            "non_essentials_parsed": parsed_ne_total,
            "non_essentials_skipped": skipped_ne_total,
            "blends_expanded": blends_expanded,
        },
        "products": out_products,
    }


# ---------------------------------------------------------------------------
# Safe writes - route through tools/safe_write.py per protocol §17
# ---------------------------------------------------------------------------

def safe_rewrite(path, payload_bytes):
    tmp = path.with_suffix(path.suffix + ".payload.tmp")
    tmp.write_bytes(payload_bytes)
    try:
        result = subprocess.run(
            [sys.executable, str(SAFE_WRITE), "rewrite",
             str(path.relative_to(REPO)), "--payload-file", str(tmp)],
            cwd=REPO,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if result.returncode != 0:
            raise RuntimeError(
                "safe_write rewrite failed for {0}:\n  stdout: {1}\n  stderr: {2}".format(
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not PRODUCTS_DB.exists():
        print("FATAL: products-db not found at {0}".format(PRODUCTS_DB), file=sys.stderr)
        return 2
    with open(PRODUCTS_DB, "r", encoding="utf-8") as f:
        db = json.load(f)
    lookup = build_lookup(db)
    meta = lookup["_meta"]
    print(
        "Built lookup: {0} products, {1} non-essential rows parsed, {2} non-essential rows skipped (blends/unparseable).".format(
            meta["product_count"], meta["non_essentials_parsed"], meta["non_essentials_skipped"]
        )
    )
    canonical_bytes = json.dumps(lookup, ensure_ascii=False, indent=2).encode("utf-8")
    safe_rewrite(LOOKUP_OUT, canonical_bytes)
    print("Canonical: {0} ({1} bytes)".format(LOOKUP_OUT.relative_to(REPO), len(canonical_bytes)))
    new_size, action = embed_in_dashboard(lookup)
    print("Dashboard: {0} block id={1!r} ({2} bytes total)".format(action, BLOCK_ID, new_size))
    return 0


if __name__ == "__main__":
    sys.exit(main())
