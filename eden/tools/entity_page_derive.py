#!/usr/bin/env python3
"""eden/tools/entity_page_derive.py — the per-entity page view-model (Phase H0 + H1).

Projects the pillars into ONE lean per-entity record per essential + condition so the
redesigned entity view (H2) reads a pure projection, never a hand-built map. LEAN by
design: each record carries claim IDs + derived extras (co-occurrence related, per-
condition protocol claims, a derived one-liner, the pill relations), NOT claim text —
the text / verbatim / citation resolve at render from corpus-embed.json + search-index.json
(already loaded). Targets (essentials-targets-data.json), live coverage % (regimen state),
and best-sources ranking (recommender) stay where they already live; this artifact does
not duplicate them.

H1 (derivation correctness, migration blueprint §4 H1 + §1.2) — LANDED here:
  * works_with (essential pages) = genuine interaction partners (essentials sharing a
    kind='interaction' claim), NOT the raw co-occurrence set (killing the "interacts with
    41" inflation + the phantom pills).
  * conditions (essential pages) / restore (condition pages) = the DIRECTED nutrient<->
    condition relation `maps(E,C)`, which fixes the essentials[]-union leak: a pill appears
    only when the essential genuinely maps to THIS entity, never via the flatten across a
    multi-condition claim. maps(E,C) holds iff a claim links E,C where kind is a directed
    prescription (protocol/dose — always) OR a focused nutrient<->condition tie
    (deficiency_sign/prognosis) that is NOT a "shotgun" (>= SHOTGUN_ESS essentials AND
    >= SHOTGUN_COND conditions — a many-to-many list whose per-pair mappings can't be
    recovered, e.g. the 10x10 Rare-Earths deficiency list).
  * PROMINENCE: protocol_claim_ids (the curated "what to do" source) excludes base-line-
    program / dose-table reference rows — a table row is never a curated recommendation.
The kind->colour category grouping stays at RENDER (view-copy kind_categories, gated by
claim_category_mapping_total); this artifact groups claims by raw KIND (a stable projection).

Deterministic (no timestamp; ordering is fixed) so build_data() byte-compares to disk
under derived_artifacts_fresh. Exposes build_data()/write_data() per the MANIFEST contract.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS_EMBED = ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json"
SEARCH_INDEX = ROOT / "dashboard" / "assets" / "data" / "search" / "search-index.json"
CANON = ROOT / "eden" / "corpus" / "essentials-canon.json"
CATALOG_COND = ROOT / "eden" / "catalog" / "conditions.json"
ARTIFACT_PATH = ROOT / "dashboard" / "assets" / "data" / "entity-page-data.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

# Display-ordering heuristics — mirror the TS consts (knowledge-corpus.ts CORPUS_KIND_PRIORITY,
# core/schemas/search.ts SEARCH_FACETS + FACET_ORDER_BY_TYPE). These are display ORDER, not
# canonical data; centralized with the entity view when it lands (H2). Any kind/facet not
# listed sorts after, alphabetically, so a new kind never silently vanishes.
KIND_PRIORITY = ["dose", "deficiency_sign", "toxicity_sign", "protocol", "mechanism", "prognosis"]
FACET_DEFAULT = ["basics", "warning", "discovery", "etymology", "physiology", "mechanism",
                 "sources", "uses", "stance", "protocol", "history", "big_question", "biography"]
FACET_CONDITION = ["stance", "mechanism", "protocol", "warning", "physiology", "basics",
                   "sources", "uses", "history", "big_question", "biography", "discovery", "etymology"]
RELATED_MAX = 8

# ── H1 pill derivation — the directed nutrient<->condition relation ──
# A "restore" pill (condition page) / "need help with a condition?" pill (essential page)
# appears ONLY when the essential genuinely maps to the entity. Never the essentials[]-union
# flatten across a multi-condition claim (the Audit-B leak).
PILL_DIRECTED_KINDS = frozenset({"protocol", "dose"})           # a directed prescription — always maps
PILL_ASSOC_KINDS = frozenset({"deficiency_sign", "prognosis"})  # focused nutrient<->condition tie — unless shotgun
SHOTGUN_ESS = 3   # a claim with >= SHOTGUN_ESS essentials AND >= SHOTGUN_COND conditions is a
SHOTGUN_COND = 3  # many-to-many "shotgun" list whose per-pair (E,C) mappings can't be recovered


def _load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def _ordered(keys, priority):
    """keys ordered by `priority` first (in that order), then the rest alphabetically."""
    present = list(keys)
    head = [k for k in priority if k in present]
    tail = sorted(k for k in present if k not in priority)
    return head + tail


def build_data() -> dict:
    embed = _load(CORPUS_EMBED)
    si = _load(SEARCH_INDEX)
    canon = _load(CANON)
    catcond = _load(CATALOG_COND)["conditions"]

    claims = embed["claims"]                       # id -> claim {book, kind, conditions[], essentials[], ...}
    embed_ess = embed["essentials"]                # slug -> {books_cited, claim_count, claims_by_kind}
    embed_cond = embed["conditions"]               # slug -> {books_cited, claim_count, claims_by_role}
    si_entities = si["entities"]                    # slug -> {display_name, type, synonyms, related, symbol, ...}
    si_claims = si["claims"]                        # list of faceted search claims

    ess_slugs = set(embed_ess.keys())
    cond_slugs = set(embed_cond.keys())

    # ── search-claim index: PRIMARY subject slug -> [search claims] (the entity's own
    # "worth knowing" Q&A; also_about is a cross-link, not the entity's own content) ──
    search_by_subject: dict = {}
    for sc in si_claims:
        slug = sc.get("subject")
        if slug:
            search_by_subject.setdefault(slug, []).append(sc)

    def search_sections(slug, ent_type):
        scs = search_by_subject.get(slug)
        if not scs:
            return []
        by_facet: dict = {}
        for sc in scs:
            by_facet.setdefault(sc["facet"], []).append(sc["id"])
        order = FACET_CONDITION if ent_type == "condition" else FACET_DEFAULT
        return [{"facet": f, "claim_ids": by_facet[f]}
                for f in order if f in by_facet]

    # ── one-liner: a search 'basics' answer_short, else the first tier-1 definition claim ──
    basics_by_subject: dict = {}
    for sc in si_claims:
        if sc["facet"] == "basics":
            basics_by_subject.setdefault(sc.get("subject"), sc)

    def one_liner(slug, claims_by_kind):
        sc = basics_by_subject.get(slug)
        if sc and sc.get("answer_short"):
            return sc["answer_short"]
        for cid in claims_by_kind.get("definition", []):
            txt = claims.get(cid, {}).get("claim_text")
            if txt:
                return txt
        return None

    # ── co-occurrence graph over entity slugs (essentials + conditions) sharing a claim ──
    # This is the SERENDIPITY signal (violet "keep exploring" + related-conditions), and is
    # DELIBERATELY broad. It is NOT the pill relation — the therapeutic pills use maps() below.
    cooc: dict = {}

    def bump(a, b):
        cooc.setdefault(a, {})
        cooc[a][b] = cooc[a].get(b, 0) + 1

    for c in claims.values():
        ents = sorted({*(s for s in c.get("essentials", []) if s in ess_slugs),
                       *(s for s in c.get("conditions", []) if s in cond_slugs)})
        for i, a in enumerate(ents):
            for b in ents[i + 1:]:
                bump(a, b)
                bump(b, a)

    def related(slug, only=None):
        row = cooc.get(slug, {})
        items = [(o, n) for o, n in row.items() if only is None or o in only]
        items.sort(key=lambda t: (-t[1], t[0]))     # count desc, slug asc — deterministic
        return [o for o, _ in items[:RELATED_MAX]]

    # ── H1: the DIRECTED nutrient<->condition relation `maps(E,C)` (the essentials[]-union fix) ──
    def _is_shotgun(c):
        return (len(c.get("essentials", [])) >= SHOTGUN_ESS
                and len(c.get("conditions", [])) >= SHOTGUN_COND)

    ess_conditions: dict = {}   # essential slug -> {condition slug}  (its "need help with?" pills)
    cond_essentials: dict = {}  # condition slug -> {essential slug}  (its "nutrients to restore" pills)
    for c in claims.values():
        k = c.get("kind")
        if k in PILL_DIRECTED_KINDS:
            contributes = True            # directed prescription — always maps
        elif k in PILL_ASSOC_KINDS:
            contributes = not _is_shotgun(c)   # focused tie only; a shotgun list can't pair
        else:
            contributes = False           # mechanism/toxicity/interaction/definition/... are not restore ties
        if not contributes:
            continue
        es = [e for e in c.get("essentials", []) if e in ess_slugs]
        cs = [s for s in c.get("conditions", []) if s in cond_slugs]
        for e in es:
            for s in cs:
                ess_conditions.setdefault(e, set()).add(s)
                cond_essentials.setdefault(s, set()).add(e)

    # ── H1: "works with" (essential pages) = genuine interaction partners, NOT co-occurrence ──
    works_with: dict = {}
    for c in claims.values():
        if c.get("kind") == "interaction":
            es = [e for e in c.get("essentials", []) if e in ess_slugs]
            for e in es:
                for e2 in es:
                    if e2 != e:
                        works_with.setdefault(e, set()).add(e2)

    # ── regroup a condition's claims (stored by role) into kind buckets ──
    def cond_record(ccorp):
        ids = []
        for role_ids in ccorp.get("claims_by_role", {}).values():
            ids.extend(role_ids)
        by_kind: dict = {}
        for cid in ids:
            k = claims.get(cid, {}).get("kind")
            if k:
                by_kind.setdefault(k, [])
                if cid not in by_kind[k]:
                    by_kind[k].append(cid)
        return [{"kind": k, "claim_ids": by_kind[k]} for k in _ordered(by_kind, KIND_PRIORITY)]

    def protocol_claim_ids(slug):
        """protocol + non-table dose claims mapping this condition (protocol first) — the real
        per-condition protocol summary source (replaces the generic boilerplate). PROMINENCE
        rule (H1): a base-line-program / dose-table reference row is NOT a curated
        recommendation, so it never auto-fills this curated primary slot (the fluoride-under-
        'what to do' defect)."""
        out = [cid for cid, c in claims.items()
               if slug in c.get("conditions", []) and c.get("kind") == "protocol"]
        out += [cid for cid, c in claims.items()
                if slug in c.get("conditions", []) and c.get("kind") == "dose"
                and not c.get("base_line_table")]
        return out

    # ── ESSENTIALS (all canon entries; count of `essential:true` is the 90) ──
    essentials_out: dict = {}
    ess_count = 0
    for e in canon["essentials"]:
        slug = e["slug"]
        if e.get("essential") is not False:
            ess_count += 1
        ecorp = embed_ess.get(slug, {})
        cbk = ecorp.get("claims_by_kind", {})
        si_ent = si_entities.get(slug, {})
        essentials_out[slug] = {
            "type": "essential",
            "name": e.get("display_name", slug),
            "symbol": e.get("symbol"),
            "category": e.get("category"),
            "is_essential": e.get("essential") is not False,
            "claim_count": ecorp.get("claim_count", 0),
            "books": ecorp.get("books_cited", []),
            "synonyms": si_ent.get("synonyms", []),
            "one_liner": one_liner(slug, cbk),
            "record": [{"kind": k, "claim_ids": cbk[k]} for k in _ordered(cbk, KIND_PRIORITY)],
            "search": search_sections(slug, "essential"),
            "conditions": sorted(ess_conditions.get(slug, set())),   # directed pills (H1)
            "works_with": sorted(works_with.get(slug, set())),       # interaction partners (H1)
            "related": related(slug),                                # co-occurrence (keep-exploring)
        }

    # ── CONDITIONS (every corpus-embed condition, i.e. those carrying claims) ──
    conditions_out: dict = {}
    for slug in sorted(embed_cond.keys()):
        ccorp = embed_cond[slug]
        si_ent = si_entities.get(slug, {})
        cbk_for_ol = {}
        for cid in (c for role in ccorp.get("claims_by_role", {}).values() for c in role):
            if claims.get(cid, {}).get("kind") == "definition":
                cbk_for_ol.setdefault("definition", []).append(cid)
        conditions_out[slug] = {
            "type": "condition",
            "name": (catcond.get(slug, {}) or {}).get("display_name", slug),
            "claim_count": ccorp.get("claim_count", 0),
            "books": ccorp.get("books_cited", []),
            "synonyms": si_ent.get("synonyms", []),
            "one_liner": one_liner(slug, cbk_for_ol),
            "protocol_claim_ids": protocol_claim_ids(slug),
            "restore": sorted(cond_essentials.get(slug, set())),     # directed pills (H1)
            "record": cond_record(ccorp),
            "search": search_sections(slug, "condition"),
            "related_conditions": related(slug, only=cond_slugs),
            "related": related(slug),
        }

    return {
        "_meta": {
            "_doc": "GENERATED per-entity page view-model (Phase H0 + H1). Lean: claim IDs + derived "
                    "extras only; text/verbatim/citation resolve at render from corpus-embed + "
                    "search-index. Pills are the DIRECTED maps(E,C) relation (H1 essentials[]-union "
                    "fix); works_with is interaction-kind; protocol_claim_ids drops base-line-table "
                    "rows (prominence). Regenerate: python eden/tools/entity_page_derive.py.",
            "counts": {"essentials": ess_count, "conditions": len(conditions_out)},
            "generated_from": ["corpus-embed.json", "search-index.json", "essentials-canon.json",
                               "catalog/conditions.json"],
        },
        "essentials": essentials_out,
        "conditions": conditions_out,
    }


def write_data() -> int:
    """Regenerate the on-disk artifact via safe_write (§17). Returns byte count."""
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(build_data(), ensure_ascii=False, indent=2)
    return safe_write.safe_rewrite(str(ARTIFACT_PATH), payload)


if __name__ == "__main__":
    n = write_data()
    print(f"OK  wrote {ARTIFACT_PATH.relative_to(ROOT).as_posix()} ({n} bytes)")
