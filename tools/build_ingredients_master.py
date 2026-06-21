"""Build the master ingredients database from products-db.json + Wallach corpus.

Round 75 Pass A.3. Builds knowledge/ingredients-master.json — the deduplicated,
classified, Wallach-cross-referenced master list of every ingredient that
appears in any Youngevity product across the catalog. Powers Pass E (the
education layer) and serves as the connectivity substrate for future
ingredient-aware features (allergy flagging, conflict-aware adoption, etc.).

Architecture:
- Sweep every nutrient key + every non_essentials entry (including parsed
  blend sub-ingredients) across products-db.json.
- Normalize names (strip whitespace, lowercase comparison, common-suffix trim).
- Dedupe — merge aliases that point to the same ingredient.
- Classify each into one of nine categories (essential, vitamin, mineral_form,
  amino_acid, herb, botanical_extract, food, excipient, blend, other).
- Cross-reference Wallach corpus via tools/corpus_search.py for high-value
  ingredients (essentials always, others when likely to have material).
- Track per-ingredient provenance: which products contain it (in_products[]),
  which parent blends carry it (parent_blends[]).
- Emit canonical JSON + a human-readable markdown summary.

Source-rule note: ingredient *descriptions* are educational context, not Wallach
health-target claims, so the cornerstone allowlist applies only to wallach_refs[]
entries (which cite primary sources by construction). Documented-via field flags
which provenance produced each entry.

Cross-platform discipline per Round 74:
- encoding='utf-8' on every text-mode open()
- pathlib.Path
- datetime.now(tz=utc)
- sys.executable in any subprocess

Edit-tool ban per §17 — all writes via tools/safe_write.py.
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
ESSENTIALS = REPO / "knowledge" / "essentials-targets.json"
OUT_JSON = REPO / "knowledge" / "ingredients-master.json"
OUT_MD = REPO / "knowledge" / "ingredients-master.md"
SAFE_WRITE = REPO / "tools" / "safe_write.py"

# Direct import of corpus_search so cross-reference runs in-process
sys.path.insert(0, str(REPO / "tools"))
try:
    import corpus_search as _cs
except Exception as _e:
    _cs = None
    print("WARN: corpus_search import failed: {0} - wallach_refs will be empty".format(_e), file=sys.stderr)


# ---------------------------------------------------------------------------
# Name normalization
# ---------------------------------------------------------------------------

# Strip parenthesized modifiers like "(aerial parts)" or "(fruit)" for the
# canonical key; preserve them as alias context.
_PAREN_MOD = re.compile(r"\s*\([^)]*\)\s*$")
# Common honorifics / chemistry suffixes to trim for matching
_TRIM_SUFFIXES = [
    r"\s+HCl$", r"\s+hydrochloride$", r"\s+sulfate$", r"\s+citrate$",
    r"\s+gluconate$", r"\s+oxide$", r"\s+chloride$", r"\s+phosphate$",
    r"\s+bicarbonate$", r"\s+ascorbate$", r"\s+picolinate$",
    r"\s+aspartate$", r"\s+orotate$", r"\s+amino acid chelate$",
    r"\s+bisglycinate chelate$", r"\s+bisglycinate$", r"\s+glycinate$",
    r"\s+complex$", r"\s+blend$", r"\s+powder$", r"\s+extract$",
    r"\s+\(from .*?\)$",
]
_TRIM_RE = [re.compile(p, re.IGNORECASE) for p in _TRIM_SUFFIXES]


def canon_key(name):
    """Lowercase + strip-parens + strip-common-suffixes for dedup matching.
    The display name uses the most-common original casing across products."""
    if not isinstance(name, str):
        return ""
    s = _PAREN_MOD.sub("", name).strip()
    s_lower = s.lower()
    # Iteratively strip common suffixes (some names have multiple, e.g.,
    # "zinc bisglycinate chelate" -> "zinc")
    changed = True
    while changed:
        changed = False
        for r in _TRIM_RE:
            new = r.sub("", s_lower).strip()
            if new and new != s_lower:
                s_lower = new
                changed = True
    return s_lower


def canon_display(names_seen):
    """Pick the cleanest display name from the variants seen across products."""
    if not names_seen:
        return ""
    # Prefer the shortest non-empty name (least suffix noise)
    candidates = sorted([n.strip() for n in names_seen if n and n.strip()], key=len)
    return candidates[0] if candidates else ""


# ---------------------------------------------------------------------------
# Categorization
# ---------------------------------------------------------------------------

# Common excipients found on supplement labels (broadly recognized).
EXCIPIENT_NAMES = {
    "titanium dioxide", "silica", "silicon dioxide", "magnesium stearate",
    "stearic acid", "microcrystalline cellulose", "hypromellose",
    "croscarmellose sodium", "talc", "polydextrose", "dextrose",
    "maltodextrin", "calcium silicate", "cellulose", "gelatin",
    "vegetable cellulose", "rice flour", "rice bran", "rice hull",
    "natural flavors", "natural flavor", "citric acid", "calcium phosphate",
    "dicalcium phosphate", "tricalcium phosphate", "carrageenan",
    "xanthan gum", "guar gum", "stevia", "stevia leaf extract",
    "monk fruit", "sucralose", "ascorbyl palmitate", "vitamin e oil",
    "silica gel",
}

# Common foods (whole-food ingredients vs extracts)
FOOD_NAMES = {
    "blueberry", "raspberry", "strawberry", "cranberry", "bilberry",
    "grape", "apple", "orange", "lemon", "carrot", "spinach", "broccoli",
    "tomato", "ginger", "garlic", "tart cherry", "prune",
}

# Common herbs (single botanical names)
HERB_NAMES = {
    "ginkgo", "bacopa", "lemon balm", "ginseng", "rhodiola", "ashwagandha",
    "turmeric", "milk thistle", "dandelion", "echinacea", "nettle",
    "burdock", "saw palmetto", "valerian", "passionflower", "skullcap",
    "huperzia", "huperzine-a", "huperzine a",
}

VITAMIN_PREFIXES = ("vitamin ", "biotin", "folate", "folic acid",
                    "pantothenic acid", "thiamine", "thiamin", "riboflavin",
                    "niacin", "pyridoxine", "cobalamin", "tocopherol",
                    "cholecalciferol", "retinol", "menaquinone",
                    "phylloquinone", "ascorbic acid")

MINERAL_FORM_TOKENS = ("citrate", "gluconate", "oxide", "chloride",
                       "phosphate", "bicarbonate", "ascorbate", "picolinate",
                       "aspartate", "orotate", "chelate", "bisglycinate",
                       "glycinate", "stearate", "sulfate", "selenate",
                       "selenomethionine")

AMINO_ACID_NAMES = {
    "alanine", "arginine", "asparagine", "aspartic acid", "cysteine",
    "glutamic acid", "glutamine", "glycine", "histidine", "isoleucine",
    "leucine", "lysine", "methionine", "phenylalanine", "proline",
    "serine", "taurine", "threonine", "tryptophan", "tyrosine", "valine",
    "l-glutamine", "l-arginine", "l-lysine", "l-leucine", "l-tyrosine",
    "l-carnitine", "carnitine", "l-cysteine",
}

BLEND_TOKENS = ("blend", "complex", "matrix", "formula", "concentrate",
                "factors", "support complex")


def load_essentials_names():
    """Load the 92-essentials canonical list as a set of lowercase names + aliases."""
    if not ESSENTIALS.exists():
        return set()
    try:
        data = json.loads(ESSENTIALS.read_text(encoding="utf-8"))
    except Exception:
        return set()
    names = set()
    # essentials-targets has a nested structure; pull every leaf with a "name" field
    def walk(obj):
        if isinstance(obj, dict):
            if "name" in obj and isinstance(obj["name"], str):
                names.add(obj["name"].lower())
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)
    walk(data)
    return names


_ESSENTIALS_NAMES = None
def essentials():
    global _ESSENTIALS_NAMES
    if _ESSENTIALS_NAMES is None:
        _ESSENTIALS_NAMES = load_essentials_names()
    return _ESSENTIALS_NAMES


def classify(name, canon, raw_full=""):
    """Return one of the nine categories. Order matters — more specific
    classifiers fire before generic ones."""
    nl = (name or "").lower()
    cl = (canon or "").lower()
    full = (raw_full or "").lower()
    # 1. Wallach 92 essentials (canonical match against the essentials list)
    if cl in essentials() or nl in essentials():
        return "essential"
    # 2. Excipient (label fillers/binders)
    if cl in EXCIPIENT_NAMES or nl in EXCIPIENT_NAMES:
        return "excipient"
    # 3. Amino acid
    if cl in AMINO_ACID_NAMES or nl in AMINO_ACID_NAMES:
        return "amino_acid"
    # 4. Mineral form (zinc bisglycinate, calcium citrate, etc.)
    for tok in MINERAL_FORM_TOKENS:
        if tok in full:
            return "mineral_form"
    # 5. Vitamin (Vitamin K2 MK-7, etc.) — non-essential vitamin form
    if any(full.startswith(p) for p in VITAMIN_PREFIXES):
        return "vitamin"
    # 6. Blend/complex container
    if any(tok in full for tok in BLEND_TOKENS):
        return "blend"
    # 7. Herb
    if cl in HERB_NAMES or nl in HERB_NAMES:
        return "herb"
    # 8. Whole-food
    if cl in FOOD_NAMES or nl in FOOD_NAMES:
        return "food"
    # 9. Botanical extract (contains "extract" / specific species terms)
    if "extract" in full or "tincture" in full or "decoction" in full:
        return "botanical_extract"
    # Catch-all
    return "other"

# ---------------------------------------------------------------------------
# Sweep + dedupe
# ---------------------------------------------------------------------------

NE_PATTERN_PLAIN = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s+(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
)
NE_PATTERN_BLEND = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s+(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
    r"\s*\((?P<subs>[^)]+)\)"
)
NE_PATTERN_FORM = re.compile(
    r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/,'\.]*?)"
    r"\s*\((?P<form>[^)]+)\)\s+"
    r"(?P<amount>\d+(?:\.\d+)?)\s*"
    r"(?P<unit>mg|mcg|g|iu|ug|IU|MG|MCG)\b"
)


def sweep_products(products):
    """Return three sweeps:
    - direct_nutrients[canon] = {raw_names, in_products, amounts}
    - non_essentials[canon] = {raw_names, in_products, role}
    - blend_subs[canon] = {raw_names, parent_blends}
    """
    direct = {}
    nonessen = {}
    subs = {}
    for product_name, p in products.items():
        if not isinstance(p, dict):
            continue
        # Direct nutrients
        for nname, _ in (p.get("nutrients") or {}).items():
            canon = canon_key(nname)
            if not canon:
                continue
            entry = direct.setdefault(canon, {"raw_names": set(), "in_products": set()})
            entry["raw_names"].add(nname)
            entry["in_products"].add(product_name)
        # non_essentials parsing (mirrors build_regimen_label_lookup logic)
        for s in (p.get("non_essentials") or []):
            if not isinstance(s, str):
                continue
            s = s.strip()
            if not s:
                continue
            # Try form-qualifier first (paren BEFORE amount)
            m = NE_PATTERN_FORM.match(s)
            if m:
                nname = m.group("name").strip().rstrip(",").strip()
                if nname:
                    canon = canon_key(nname)
                    entry = nonessen.setdefault(canon, {"raw_names": set(), "in_products": set(), "is_blend_parent": False})
                    entry["raw_names"].add(nname)
                    entry["in_products"].add(product_name)
                continue
            # Try blend (paren AFTER amount with sub-list)
            m = NE_PATTERN_BLEND.match(s)
            if m:
                parent_name = m.group("name").strip().rstrip(",").strip()
                parent_canon = canon_key(parent_name)
                if parent_canon:
                    entry = nonessen.setdefault(parent_canon, {"raw_names": set(), "in_products": set(), "is_blend_parent": False})
                    entry["raw_names"].add(parent_name)
                    entry["in_products"].add(product_name)
                    entry["is_blend_parent"] = True
                sub_raw = m.group("subs").strip()
                sub_list = [x.strip().rstrip(".") for x in sub_raw.split(",") if x.strip()]
                for sub in sub_list:
                    sub_canon = canon_key(sub)
                    if not sub_canon:
                        continue
                    blend_key = "{0} ({1})".format(parent_name, product_name)
                    entry = subs.setdefault(sub_canon, {"raw_names": set(), "parent_blends": set()})
                    entry["raw_names"].add(sub)
                    entry["parent_blends"].add(blend_key)
                continue
            # Try plain
            m = NE_PATTERN_PLAIN.match(s)
            if m:
                nname = m.group("name").strip().rstrip(",").strip()
                if nname:
                    canon = canon_key(nname)
                    entry = nonessen.setdefault(canon, {"raw_names": set(), "in_products": set(), "is_blend_parent": False})
                    entry["raw_names"].add(nname)
                    entry["in_products"].add(product_name)
                continue
            # Unparseable narrative string — skip (already handled by Pass A.1 audit)
    return direct, nonessen, subs


# ---------------------------------------------------------------------------
# Wallach corpus cross-reference
# ---------------------------------------------------------------------------

# Module-level cache so the manifest is loaded once, not per query
_XREF_ENABLED = False
_MANIFEST_CACHED = False


def enable_xref():
    """Opt-in: caller must invoke before build_master() to enable corpus xref.
    Default-off because corpus_search.load_manifest() runs per query and 143
    queries with re-loaded manifest exceeds the bash subprocess timeout. The
    xref pass should be run separately via tools/build_ingredients_master.py
    --xref, which routes through this opt-in path with a one-time manifest
    preload (future optimization)."""
    global _XREF_ENABLED, _MANIFEST_CACHED
    _XREF_ENABLED = True
    if _cs is not None and not _MANIFEST_CACHED:
        try:
            # Force one manifest load up-front; corpus_search caches its own
            # internal state across calls within the same process.
            _cs.load_manifest()
            _MANIFEST_CACHED = True
        except Exception:
            pass


def _snippet_around_match(passage, query, max_len=200):
    """Pass E.0.4: re-center the snippet around the first occurrence of any
    query term. Previously the truncation grabbed the first 200 chars of the
    2000-char passage, often missing the actual match. The user spot-check on
    'Vitamin A' surfaced this: the visible 200 chars discussed Crohn's WBCs
    without showing where vitamin A appears in the source. Centering on the
    match shows the relevant text directly."""
    if not isinstance(passage, str) or not passage:
        return ""
    passage = passage.strip()
    if len(passage) <= max_len:
        return passage
    if not isinstance(query, str) or not query:
        return passage[:max_len] + "..."
    p_lower = passage.lower()
    best_idx = -1
    # Find earliest occurrence of any query term (whitespace-split). Skip
    # short tokens that would over-match across non-relevant occurrences.
    for term in query.lower().split():
        if len(term) < 3:
            continue
        idx = p_lower.find(term)
        if idx >= 0 and (best_idx < 0 or idx < best_idx):
            best_idx = idx
    if best_idx < 0:
        return passage[:max_len] + "..."
    half = max_len // 2
    start = max(0, best_idx - half)
    end = start + max_len
    if end > len(passage):
        end = len(passage)
        start = max(0, end - max_len)
    snippet = passage[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(passage):
        snippet = snippet + "..."
    return snippet


def wallach_xref(query):
    """Return list of refs (top 2) or [] if xref disabled / no match / corpus
    unavailable. Each ref: {source, tier, score, snippet (truncated around match)}."""
    if not _XREF_ENABLED:
        return []
    if _cs is None:
        return []
    try:
        results = _cs.search_corpus(query, max_results=2, books_only=False)
    except Exception:
        return []
    refs = []
    for r in results[:2]:
        passage = r.get("passage") or r.get("snippet") or ""
        snippet = _snippet_around_match(passage, query, max_len=240)
        refs.append({
            "source": r.get("source", ""),
            "tier": r.get("tier", ""),
            "score": r.get("score", 0),
            "snippet": snippet,
            "structured": bool(r.get("structured")),
        })
    return refs


# ---------------------------------------------------------------------------
# Build the master DB
# ---------------------------------------------------------------------------

def build_master(products):
    direct, nonessen, subs = sweep_products(products)
    # Merge: an ingredient can appear in direct + nonessen + subs. Union by canon.
    all_canons = set(direct) | set(nonessen) | set(subs)
    ingredients = {}
    cat_counts = {}
    xref_attempted = 0
    xref_hit = 0
    for canon in sorted(all_canons):
        raw_names = set()
        in_products = set()
        parent_blends = set()
        is_blend_parent = False
        if canon in direct:
            raw_names |= direct[canon]["raw_names"]
            in_products |= direct[canon]["in_products"]
        if canon in nonessen:
            raw_names |= nonessen[canon]["raw_names"]
            in_products |= nonessen[canon]["in_products"]
            is_blend_parent = is_blend_parent or nonessen[canon].get("is_blend_parent", False)
        if canon in subs:
            raw_names |= subs[canon]["raw_names"]
            parent_blends |= subs[canon]["parent_blends"]
        display = canon_display(raw_names)
        cat = classify(display, canon, " ".join(raw_names))
        if is_blend_parent:
            cat = "blend"
        # Cross-reference Wallach for high-value categories
        xref_categories = {"essential", "amino_acid", "vitamin", "mineral_form", "herb", "botanical_extract", "food"}
        wallach_refs = []
        documented_via = None
        if cat in xref_categories or cat == "excipient":
            xref_attempted += 1
            wallach_refs = wallach_xref(display)
            if wallach_refs:
                xref_hit += 1
                documented_via = "wallach_corpus"
        # If no corpus match, but in_products[] >= 1, documented via product page
        if not documented_via and in_products:
            documented_via = "products_db_features"
        elif not documented_via:
            documented_via = None
        # Aliases = raw_names minus the display (preserves variants)
        aliases = sorted([n for n in raw_names if n != display])
        entry = {
            "name": display,
            "canon_key": canon,
            "aliases": aliases,
            "category": cat,
            "wallach_refs": wallach_refs,
            "documented_via": documented_via,
            "in_products": sorted(in_products),
            "in_products_count": len(in_products),
            "parent_blends": sorted(parent_blends),
        }
        ingredients[display] = entry
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    return {
        "_meta": {
            "purpose": "Master ingredients database. Every ingredient that appears in any Youngevity product (direct nutrients + non_essentials + parsed blend sub-ingredients), deduplicated by normalized name, classified into category, cross-referenced against Wallach corpus where applicable. Source for Pass E education layer + future ingredient-aware features. Round 75 Pass A.3.",
            "source": "knowledge/products-db.json",
            "generator": "tools/build_ingredients_master.py",
            "generated_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "schema_version": 1,
            "ingredient_count": len(ingredients),
            "category_counts": cat_counts,
            "wallach_xref_attempted": xref_attempted,
            "wallach_xref_hit": xref_hit,
        },
        "ingredients": ingredients,
    }


# ---------------------------------------------------------------------------
# Markdown report
# ---------------------------------------------------------------------------

def render_markdown(master):
    meta = master["_meta"]
    ing = master["ingredients"]
    lines = []
    lines.append("# Master Ingredients Database")
    lines.append("")
    lines.append("_Generated: {0} UTC by `tools/build_ingredients_master.py`._".format(meta["generated_iso"]))
    lines.append("_Source: `knowledge/products-db.json`._".format())
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("- Total unique ingredients: **{0}**".format(meta["ingredient_count"]))
    lines.append("- Wallach corpus xref attempted: {0}".format(meta["wallach_xref_attempted"]))
    lines.append("- Wallach corpus xref hit: {0} ({1:.1f}%)".format(
        meta["wallach_xref_hit"],
        100.0 * meta["wallach_xref_hit"] / max(1, meta["wallach_xref_attempted"]),
    ))
    lines.append("")
    lines.append("## Category breakdown")
    lines.append("")
    lines.append("| Category | Count |")
    lines.append("|---|---:|")
    for cat in sorted(meta["category_counts"], key=lambda k: -meta["category_counts"][k]):
        lines.append("| {0} | {1} |".format(cat, meta["category_counts"][cat]))
    lines.append("")
    lines.append("## Ingredients by category (sample top 5 per category)")
    lines.append("")
    by_cat = {}
    for name, e in ing.items():
        by_cat.setdefault(e["category"], []).append(e)
    for cat in sorted(by_cat):
        items = sorted(by_cat[cat], key=lambda x: (-x["in_products_count"], x["name"]))
        lines.append("### {0} ({1})".format(cat, len(items)))
        lines.append("")
        lines.append("| Ingredient | In products | Wallach refs | Aliases |")
        lines.append("|---|---:|---:|---|")
        for e in items[:5]:
            aliases_str = ", ".join(e["aliases"][:2])
            if len(e["aliases"]) > 2:
                aliases_str += " +{0} more".format(len(e["aliases"]) - 2)
            lines.append("| {0} | {1} | {2} | {3} |".format(
                e["name"], e["in_products_count"],
                len(e["wallach_refs"]), aliases_str or "_(none)_",
            ))
        lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Safe write helper
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
            raise RuntimeError("safe_write rewrite failed for {0}: {1}".format(path, result.stderr))
        print(result.stdout.strip())
    finally:
        try:
            if tmp.exists():
                tmp.unlink()
        except (PermissionError, OSError):
            pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not PRODUCTS_DB.exists():
        print("FATAL: products-db not found at {0}".format(PRODUCTS_DB), file=sys.stderr)
        return 2
    import argparse
    ap = argparse.ArgumentParser(description="Build master ingredients DB.")
    ap.add_argument("--skip-xref", action="store_true",
                    help="Skip Wallach corpus cross-reference for fast iteration. xref is ON by default since Pass A.3.5 cached corpus_search loads (~25s for 143 queries).")
    args = ap.parse_args()
    if args.skip_xref:
        print("Wallach corpus cross-reference: SKIPPED (--skip-xref)")
    else:
        enable_xref()
        print("Wallach corpus cross-reference: enabled (Pass A.3.5 caching makes default-on viable)")
    with open(PRODUCTS_DB, "r", encoding="utf-8") as f:
        db = json.load(f)
    products = db.get("products", {})
    print("Sweeping {0} products...".format(len(products)))
    master = build_master(products)
    meta = master["_meta"]
    print("")
    print("Master DB built: {0} unique ingredients".format(meta["ingredient_count"]))
    print("Categories:")
    for cat, count in sorted(meta["category_counts"].items(), key=lambda x: -x[1]):
        print("  {0:>20s}: {1:>4}".format(cat, count))
    print("")
    print("Wallach xref: {0} attempted, {1} hit ({2:.1f}%)".format(
        meta["wallach_xref_attempted"], meta["wallach_xref_hit"],
        100.0 * meta["wallach_xref_hit"] / max(1, meta["wallach_xref_attempted"]),
    ))
    json_bytes = json.dumps(master, ensure_ascii=False, indent=2).encode("utf-8")
    safe_rewrite(OUT_JSON, json_bytes)
    md_bytes = render_markdown(master).encode("utf-8")
    safe_rewrite(OUT_MD, md_bytes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
