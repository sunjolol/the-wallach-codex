#!/usr/bin/env python3
"""products_verify.py — structural gate for the Youngevity Product DB (Pillar 2).

Mirrors catalog_verify.py: proves every product record is well-formed PURE FACTS
before it can seal. HARDENED against prose leakage (R4) — the ONLY long free-text
field allowed anywhere in the pillar is a blend's bounded `as_labeled` fidelity
token (single line, capped); every other string must be a short structured token.

Runs standalone today (pillar UNDER CONSTRUCTION); wires into tools/invariants.py
as `products_verify` when the pillar is complete + sealed. Exit 0 = clean, 1 = RED.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PRODUCTS = ROOT / "eden" / "products" / "products.json"

AS_LABELED_MAX = 1200         # bounded fidelity token (fits BTT whole-foods blends w/ full latin names; matches the corpus verbatim hard cap)
TOKEN_MAX = 120               # any other structured string
OTHER_ING_MAX = 350           # excipients/compound ingredients (parenthetical sub-lists) can be long but are still facts
ALLOWED_UNITS = {"mg", "mcg", "g", "iu", "mcg rae", "mcg dfe", "mg ne", "ml", "fl oz", None}
# A "prose" heuristic: a sentence-shaped token (". " + capital, or "; " glue) in a
# field that must be a short structured token = a leak. as_labeled is exempt (bounded).
PROSE_RE = re.compile(r"[.;]\s+[A-Z]")

errors: list[str] = []


def err(where: str, msg: str) -> None:
    errors.append(f"{where}: {msg}")


def check_token(where: str, s, *, max_len: int = TOKEN_MAX) -> None:
    """A structured string field — bounded, no prose shape. Compound ingredients
    (e.g. a micellized 'vitamin core' with a parenthetical sub-list) can be long but
    are still FACTS, so other_ingredients passes a higher max_len; PROSE_RE still
    blocks sentence-shaped text everywhere."""
    if not isinstance(s, str) or not s.strip():
        err(where, f"empty/non-string token: {s!r}")
        return
    if len(s) > max_len:
        err(where, f"token too long ({len(s)}>{max_len}) — prose leak? {s[:40]!r}")
    if PROSE_RE.search(s):
        err(where, f"prose-shaped text in a fact field: {s[:50]!r}")


def check_amount(where: str, v) -> None:
    # amounts may be numeric OR a label token like "<1" / "2,010"; never prose.
    if isinstance(v, (int, float)):
        return
    if isinstance(v, str) and re.fullmatch(r"[<>]?=?\s*[\d,]+(\.\d+)?", v.strip()):
        return
    if v is None:
        return
    err(where, f"amount not numeric/label-numeric: {v!r}")


def check_ingredient(where: str, ing: dict) -> None:
    if not isinstance(ing, dict):
        err(where, "ingredient not an object"); return
    check_token(where + ".name", ing.get("name"))
    if "pos" in ing and not isinstance(ing["pos"], int):
        err(where + ".pos", "pos must be int")
    for opt in ("part", "form", "latin", "standardization"):
        if opt in ing:
            check_token(f"{where}.{opt}", ing[opt])
    if "amount" in ing:
        check_amount(where + ".amount", ing["amount"])
    for i, sub in enumerate(ing.get("sub_ingredients", []) or []):
        if not isinstance(sub, dict):
            err(f"{where}.sub[{i}]", "not an object"); continue
        check_token(f"{where}.sub[{i}].name", sub.get("name"))
        if "latin" in sub:
            check_token(f"{where}.sub[{i}].latin", sub["latin"])


def check_component(where: str, c: dict) -> None:
    if not isinstance(c, dict):
        err(where, "component not an object"); return
    if not isinstance(c.get("serving_size"), str) or not c["serving_size"].strip():
        err(where + ".serving_size", "missing/empty")
    spc = c.get("servings_per_container")
    if spc is not None and not isinstance(spc, int):
        err(where + ".servings_per_container", f"must be int or null, got {spc!r}")
    # macros
    for mk, mv in (c.get("macros") or {}).items():
        if not isinstance(mv, dict):
            err(f"{where}.macros.{mk}", "not an object"); continue
        check_amount(f"{where}.macros.{mk}.amount", mv.get("amount"))
    # nutrients (quantified)
    if not isinstance(c.get("nutrients"), list):
        err(where + ".nutrients", "must be a list")
    for i, n in enumerate(c.get("nutrients", [])):
        w = f"{where}.nutrients[{i}]"
        check_token(w + ".name", n.get("name"))
        check_amount(w + ".amount", n.get("amount"))
        u = n.get("unit")
        if isinstance(u, str) and u.lower() not in ALLOWED_UNITS:
            err(w + ".unit", f"unexpected unit {u!r}")
        for opt in ("form", "unit_detail"):
            if opt in n:
                check_token(f"{w}.{opt}", n[opt])
    # blends
    if not isinstance(c.get("blends"), list):
        err(where + ".blends", "must be a list")
    for i, b in enumerate(c.get("blends", [])):
        w = f"{where}.blends[{i}]"
        check_token(w + ".name", b.get("name"))
        total = b.get("total")
        if total is not None:
            check_amount(w + ".total.amount", total.get("amount"))
        al = b.get("as_labeled")
        if not isinstance(al, str) or not al.strip():
            err(w + ".as_labeled", "missing/empty (required on every blend)")
        else:
            if "\n" in al:
                err(w + ".as_labeled", "must be single line")
            elif len(al) > AS_LABELED_MAX:
                err(w + ".as_labeled", f"too long ({len(al)}>{AS_LABELED_MAX})")
        ings = b.get("ingredients")
        if not isinstance(ings, list) or not ings:
            err(w + ".ingredients", "blend must have a non-empty ingredient list")
        for j, ing in enumerate(ings or []):
            check_ingredient(f"{w}.ingredients[{j}]", ing)
    # other ingredients — short excipient tokens
    for i, oi in enumerate(c.get("other_ingredients", []) or []):
        check_token(f"{where}.other_ingredients[{i}]", oi, max_len=OTHER_ING_MAX)
    # source label
    sl = c.get("source_label")
    if not isinstance(sl, str) or not sl.lower().endswith((".jpg", ".jpeg", ".png")):
        err(where + ".source_label", f"missing/invalid label ref: {sl!r}")


def main() -> int:
    if not PRODUCTS.exists():
        print(f"products_verify: {PRODUCTS} not found"); return 1
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    products = data.get("products")
    if not isinstance(products, dict):
        print("products_verify: top-level 'products' map missing"); return 1

    seen_labels: dict[str, str] = {}
    for pid, rec in products.items():
        where = f"products.{pid}"
        if rec.get("product_id") != pid:
            err(where, f"product_id {rec.get('product_id')!r} != key {pid!r}")
        if not isinstance(rec.get("name"), str) or not rec["name"].strip():
            err(where + ".name", "missing/empty")
        comps = rec.get("components")
        if not isinstance(comps, list) or not comps:
            err(where + ".components", "must be a non-empty list"); continue
        for i, c in enumerate(comps):
            cw = f"{where}.components[{i}]"
            check_component(cw, c)
            sl = c.get("source_label")
            if isinstance(sl, str):
                if sl in seen_labels and seen_labels[sl] != pid:
                    err(cw + ".source_label", f"label {sl} already used by {seen_labels[sl]}")
                seen_labels[sl] = pid

    if errors:
        print(f"products_verify: {len(errors)} PROBLEM(S) — RED\n")
        for e in errors:
            print("  ✗ " + e)
        return 1
    n_comp = sum(len(r["components"]) for r in products.values())
    print(f"products_verify: OK — {len(products)} product(s), {n_comp} component(s), 0 problems")
    return 0


if __name__ == "__main__":
    sys.exit(main())
