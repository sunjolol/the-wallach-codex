#!/usr/bin/env python3
"""corpus_embed.py — sealed corpus -> slim dashboard embed (pure, deterministic).

The offline file:// dashboard cannot fetch() local files, so the sealed Wallach
claim graph is inlined into the bundle at build time (esbuild JSON import in
state/corpus.ts). This tool projects the sealed indices + claim shards into ONE
slim, view-shaped JSON at dashboard/assets/data/corpus-embed.json.

Single source of truth stays the sealed corpus (claims/* + indices/* + books-meta);
the embed holds no independent state and is regenerated whenever the corpus changes.
An invariant (corpus_embed_synced) byte/semantic-compares build_embed() against the
on-disk embed so a stale build can never let the in-app Knowledge drawer lie.

There is NO timestamp in the embed: knowledge_version (from knowledge-version.json)
is the freshness stamp, so a re-derive is deterministic and the sync invariant can
compare object-equal.

The `books` map carries EVERY in-housed book (books-meta.json) with its REAL per-book
claim_count (so the Corpus tab shows current books + honest counts, never fabricated
cites). `planned_books` mirrors books-roadmap.json — Wallach books not yet in-housed,
shown 'coming soon' so the corpus visibly grows.

Slimming: the full claim atom carries audit metadata (extracted_at/reviewed_*/
review_state/superseded_by/tags/locator). The runtime needs only the load-bearing
fields, so each claim is projected to {id, kind, claim_text, verbatim, dose, book,
essentials, other_substances, conditions, symptoms, confidence}. The essentials
index is joined with essentials-canon.json to carry layout_key + symbol (the
Coverage periodic-table join key the Knowledge view already holds).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
ROADMAP_PATH = CORPUS / "books-roadmap.json"
EMBED_PATH = ROOT / "dashboard" / "assets" / "data" / "corpus-embed.json"

sys.path.insert(0, str(ROOT / "tools"))
import safe_write  # noqa: E402

_CODE_STOPWORDS = {"the", "of", "a", "an", "and", "in", "on", "to", "for"}


def book_code(title: str) -> str:
    """Deterministic short spine code from a title: significant-word initials,
    capped at 4 chars (e.g. 'Dead Doctors Don't Lie' -> 'DDDL'). Falls back to the
    longest word's first 4 chars for single-word titles ('Immortality' -> 'IMMO')."""
    words = re.findall(r"[A-Za-z][A-Za-z']*", title)
    sig = [w for w in words if w.lower() not in _CODE_STOPWORDS]
    acro = "".join(w[0] for w in sig).upper()
    if len(acro) >= 2:
        return acro[:4]
    longest = max(words, key=len) if words else title
    return longest.upper()[:4]


def _slim_claim(c: dict) -> dict:
    """Project a full claim atom to the runtime-needed fields."""
    return {
        "id": c["id"],
        "kind": c["kind"],
        "claim_text": c["claim_text"],
        "verbatim": c["verbatim"],
        "dose": c.get("dose"),
        "book": c["locator"]["book"],
        "essentials": c.get("essentials", []),
        "other_substances": c.get("other_substances", []),
        "conditions": c.get("conditions", []),
        "symptoms": c.get("symptoms", []),
        "confidence": c.get("confidence", "medium"),
        # tier lets non-index surfaces (the book browser) distinguish tier-1
        # operational claims from tier-2 search-only ones, which are stripped
        # from the derived indices but still ride in the claims map.
        "tier": 2 if "search-only" in c.get("tags", []) else 1,
    }


def build_embed() -> dict:
    """Deterministic projection of the sealed corpus into the slim embed dict.

    Reads the SEALED indices (guaranteed equal to a fresh derive by corpus_verify
    check #8) + the claim shards + the canon (for layout_key/symbol) + books-meta
    (every in-housed book + real per-book claim_count) + books-roadmap (planned
    books) + knowledge-version (the freshness stamp)."""
    canon = json.loads((CORPUS / "essentials-canon.json").read_text(encoding="utf-8"))
    canon_by_slug = {e["slug"]: e for e in canon["essentials"]}
    ess_idx = json.loads((CORPUS / "indices" / "essentials.json").read_text(encoding="utf-8"))
    cond_idx = json.loads((CORPUS / "indices" / "conditions.json").read_text(encoding="utf-8"))
    version = json.loads((CORPUS / "knowledge-version.json").read_text(encoding="utf-8"))["knowledge_version"]
    books_meta = json.loads((CORPUS / "books-meta.json").read_text(encoding="utf-8"))["books"]

    # ---- claims: slim map over every sealed shard, keyed by id ----
    claims = {}
    for shard in sorted((CORPUS / "claims").glob("claims-*.json")):
        data = json.loads(shard.read_text(encoding="utf-8"))
        for c in data.get("claims", []):
            claims[c["id"]] = _slim_claim(c)

    # ---- per-book claim_count (the real metric — never a fabricated cite total) ----
    book_claim_count = {}
    for c in claims.values():
        book_claim_count[c["book"]] = book_claim_count.get(c["book"], 0) + 1

    # ---- essentials: full canon set (90), each joined with layout_key + symbol ----
    essentials = {}
    for slug, entry in ess_idx.items():
        ce = canon_by_slug.get(slug, {})
        essentials[slug] = {
            "slug": slug,
            "display_name": entry["display_name"],
            "layout_key": ce.get("layout_key", entry["display_name"]),
            "category": entry["category"],
            "symbol": ce.get("symbol", ""),
            "claim_count": entry["claim_count"],
            "claims_by_kind": entry["claims_by_kind"],
            "deficiency_signs": entry["deficiency_signs"],
            "conditions_treated": entry["conditions_treated"],
            "interacts_with": entry["interacts_with"],
            "books_cited": entry["books_cited"],
        }

    # ---- conditions: as derived (slug -> roles) ----
    conditions = {}
    for slug, entry in cond_idx.items():
        conditions[slug] = {
            "slug": slug,
            "display_name": entry["display_name"],
            "claim_count": entry["claim_count"],
            "claims_by_role": entry["claims_by_role"],
            "essentials_involved": entry["essentials_involved"],
            "other_substances_involved": entry["other_substances_involved"],
            "books_cited": entry["books_cited"],
        }

    # ---- books: EVERY in-housed book + real claim_count + spine code ----
    books = {}
    for b in books_meta:
        bid = b["book_id"]
        books[bid] = {
            "title": b["title"],
            "edition": b.get("edition"),
            "year": b.get("year"),
            "authors": b.get("authors", []),
            "code": book_code(b["title"]),
            "claim_count": book_claim_count.get(bid, 0),
            "status": "active",
        }

    # ---- planned_books: roadmap titles not yet in-housed (coming soon) ----
    planned_books = []
    if ROADMAP_PATH.exists():
        roadmap = json.loads(ROADMAP_PATH.read_text(encoding="utf-8"))
        for p in roadmap.get("planned", []):
            planned_books.append({
                "title": p["title"],
                "authors": p.get("authors", []),
                "code": book_code(p["title"]),
            })

    return {
        "knowledge_version": version,
        "books": books,
        "planned_books": planned_books,
        "essentials": essentials,
        "conditions": conditions,
        "claims": claims,
    }


def render() -> str:
    """The on-disk embed text: compact, sorted, single trailing newline."""
    return json.dumps(build_embed(), ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")) + "\n"


def write_embed() -> int:
    """Regenerate dashboard/assets/data/corpus-embed.json via safe_write (§17)."""
    EMBED_PATH.parent.mkdir(parents=True, exist_ok=True)
    return safe_write.safe_rewrite(EMBED_PATH, render())


if __name__ == "__main__":
    n = write_embed()
    e = build_embed()
    active = len(e["books"])
    planned = len(e["planned_books"])
    print(f"OK  wrote corpus-embed.json ({n} B) · knowledge_version={e['knowledge_version']} · "
          f"{active} books ({planned} planned) · {len(e['essentials'])} essentials · "
          f"{len(e['conditions'])} conditions · {len(e['claims'])} claims")
