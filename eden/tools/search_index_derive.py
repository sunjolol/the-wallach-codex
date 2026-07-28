#!/usr/bin/env python3
"""
eden/tools/search_index_derive.py — DERIVE the shipped Search index from the pillars.

Joins the two hand-authored SOURCE files with the sealed corpus:
  - eden/corpus/search-enrichment.json  (authored: subject/also_about/facet/question/
        answer_short/topics per search-only claim id)
  - eden/catalog/search-entities.json   (entity registry; canon entities via canon_ref)
  - eden/corpus/claims/claims-*.json     (the sealed claim → answer/verbatim/page/book/tier1)
  - eden/corpus/essentials-canon.json    (canon display_name/symbol for canon_ref entities)
  - eden/corpus/books-meta.json          (book title/year for the composed cite)
  - eden/catalog/conditions.json         (also_about resolution)
into ONE derived artifact:
  - dashboard/assets/data/search/search-index.json  { books, entities, claims }

R1: this artifact is registered in eden/derived/MANIFEST.json, so derived_artifacts_fresh
re-runs build_index() and byte-compares to disk — a hand-edit or stale build is un-shippable.
build_index() is pure + deterministic (sorted). validate() (also called by the
search_index_wellformed invariant) hard-fails on a bad facet, an unresolved subject/also_about,
a missing authored field, a lowercase-initial question, or an empty derived answer/verbatim
— so poison can never reach the shipped index. (The old "must be search-only" check is retired:
search-only was killed 2026-07-27; an enriched claim may be dual-home tier-1.)

§00.A: every answer/verbatim shipped here is a byte-faithful projection of a sealed Wallach
claim; the derive never invents content, only re-homes + joins it.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent

# The closed facet taxonomy — MUST mirror core/schemas/search.ts SEARCH_FACETS (blueprint §4A).
SEARCH_FACETS = [
    'basics', 'warning', 'discovery', 'etymology', 'physiology', 'mechanism', 'sources',
    'uses', 'stance', 'protocol', 'history', 'big_question', 'biography',
]

# The runtime SearchEntitySchema.type enum — MUST mirror core/schemas/search.ts. The runtime
# Zod REJECTS THE WHOLE INDEX on an unknown type -> EMPTY_INDEX fallback -> every enriched search
# page blanks while the board stays GREEN (the Python derive validated everything else). Added
# 2026-07-27 after type:'compound'/'food' shipped past this gate and emptied the search index
# (mercury/ask/enriched all blank; only the corpus-embed-backed condition/essential pages survived).
ENTITY_TYPES = ['element', 'nutrient', 'substance', 'condition', 'concept', 'topic', 'person', 'event']

# Every authored `question` must read like a sentence a person would type -> it starts capitalized.
# A lowercase-initial question is the tell of a machine-lowercased or half-authored entry (2026-07-27:
# 25 shipped that way, hand-fixed to 0). Gated here so it can regress past neither the derive nor the
# search_index_wellformed invariant. LOWERCASE_OK_PREFIXES allowlists the rare genuinely-lowercase
# technical opener; extend it with a reason + a test case if one ever legitimately appears.
LOWERCASE_OK_PREFIXES = ('pH', 'mRNA', 'tRNA', 'rRNA')

ARTIFACT = 'dashboard/assets/data/search/search-index.json'


def _load(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def _claims_by_id():
    out = {}
    for shard in sorted((ROOT / 'eden' / 'corpus' / 'claims').glob('claims-*.json')):
        for c in json.loads(shard.read_text(encoding='utf-8')).get('claims', []):
            out[c['id']] = c
    return out


def _derive_answer(claim_text):
    """answer = claim_text minus the trailing ' In his words: "..."' verbatim tail (blueprint §8;
    the tail's exact words already live in the separate `verbatim` layer). Byte-faithful otherwise —
    the lead label (e.g. 'Mercury — the basics.') is KEPT (Luneth 2026-07-09)."""
    idx = claim_text.find(' In his words:')
    return claim_text[:idx].rstrip() if idx != -1 else claim_text


def _canon():
    return {e['slug']: e for e in _load('eden/corpus/essentials-canon.json')['essentials']}


def _conditions():
    return _load('eden/catalog/conditions.json').get('conditions', {})


def _condition_slugs():
    return set(_conditions().keys())


def validate(enr=None, reg=None, canon=None, claims_by_id=None):
    """Structural gate (shared by build_index + the search_index_wellformed invariant). Returns a
    list of human-readable violations ([] == clean). Validates only the ENRICHED claims that exist,
    so the board stays green as entities are added one at a time (completeness is a later gate)."""
    enr = _load('eden/corpus/search-enrichment.json')['enrichment'] if enr is None else enr
    reg = _load('eden/catalog/search-entities.json')['entities'] if reg is None else reg
    canon = _canon() if canon is None else canon
    claims_by_id = _claims_by_id() if claims_by_id is None else claims_by_id

    canon_slugs = set(canon.keys())
    reg_slugs = set(reg.keys())
    cond_slugs = _condition_slugs()
    resolvable = canon_slugs | reg_slugs | cond_slugs
    errs = []

    for cid in sorted(enr.keys()):
        a = enr[cid]
        c = claims_by_id.get(cid)
        if c is None:
            errs.append(f'{cid}: enrichment references a claim id that does not exist')
            continue
        # NOTE: an enriched claim may be search-only OR dual-home tier-1 (a claim that ALSO
        # maps an operational condition/essential is BOTH searchable and tier-1 — search-corpus
        # doctrine). So there is NO "must be search-only" check here: the tier-1 boundary runs the
        # OTHER direction (search-only must not leak INTO the operational tabs — search_only_indices_excluded).
        for fld in ('subject', 'facet', 'question', 'answer_short'):
            if not str(a.get(fld, '')).strip():
                errs.append(f'{cid}: missing authored field {fld!r}')
        if a.get('facet') not in SEARCH_FACETS:
            errs.append(f'{cid}: facet {a.get("facet")!r} not in the closed taxonomy')
        # Question must read as a real sentence -> starts capitalized (never a lowercase opener).
        _q = str(a.get('question', ''))
        _qs = _q.lstrip('\'"\u201c\u201d\u2018\u2019 \t')
        _first_alpha = next((ch for ch in _qs if ch.isalpha()), '')
        if _first_alpha.islower() and not _qs.startswith(LOWERCASE_OK_PREFIXES):
            errs.append(f'{cid}: question must start capitalized (got {_q[:40]!r})')
        subj = a.get('subject')
        if subj and subj not in (reg_slugs | canon_slugs):
            errs.append(f'{cid}: subject {subj!r} resolves to neither the registry nor essentials-canon')
        for ab in a.get('also_about', []):
            if ab not in resolvable:
                errs.append(f'{cid}: also_about {ab!r} resolves to no registry/canon/condition slug')
        if not _derive_answer(c.get('claim_text', '')).strip():
            errs.append(f'{cid}: derived answer is empty')
        if not str(c.get('verbatim', '')).strip():
            errs.append(f'{cid}: sealed verbatim is empty')
        sa = a.get('see_also')
        if sa is not None:
            ph = str(sa.get('phrase', '')).strip() if isinstance(sa, dict) else ''
            tgt = str(sa.get('target', '')).strip() if isinstance(sa, dict) else ''
            if not ph or not tgt:
                errs.append(f'{cid}: see_also must be an object with non-empty phrase + target')
            else:
                if tgt not in enr:
                    errs.append(f'{cid}: see_also target {tgt!r} is not an enriched claim')
                elif enr[tgt].get('subject') != subj:
                    errs.append(f'{cid}: see_also target {tgt!r} is on a different subject (must be same entity page)')
                if ph not in _derive_answer(c.get('claim_text', '')):
                    errs.append(f'{cid}: see_also phrase {ph!r} does not occur in the answer')

    for slug, r in reg.items():
        t = r.get('type')
        if t is not None and t not in ENTITY_TYPES:
            errs.append(f'registry {slug!r}: type {t!r} not in the runtime SearchEntitySchema enum {ENTITY_TYPES}')
        if r.get('canon_ref'):
            if slug not in canon_slugs:
                errs.append(f'registry {slug!r}: canon_ref but not an essentials-canon slug')
            if r.get('display_name'):
                errs.append(f'registry {slug!r}: canon_ref must OMIT display_name (pulled from canon)')
        if r.get('catalog_ref'):
            if slug not in cond_slugs:
                errs.append(f'registry {slug!r}: catalog_ref but not a catalog condition slug')
            if r.get('display_name'):
                errs.append(f'registry {slug!r}: catalog_ref must OMIT display_name (pulled from conditions)')
        if r.get('canon_ref') and r.get('catalog_ref'):
            errs.append(f'registry {slug!r}: cannot be both canon_ref and catalog_ref')
        ic = r.get('intro_claim')
        if ic is not None:
            if ic not in enr:
                errs.append(f'registry {slug!r}: intro_claim {ic!r} is not an enriched claim')
            elif enr[ic].get('subject') != slug:
                errs.append(f'registry {slug!r}: intro_claim {ic!r} is on a different subject (must be this entity\'s own claim)')
    return errs


def _entity_record(slug, reg, canon, cond_names, count):
    r = reg.get(slug, {})
    if r.get('canon_ref'):
        ce = canon[slug]
        rec = {
            'display_name': ce['display_name'],
            'common_name': ce.get('common_name', ce['display_name']),
            'type': r.get('type', 'nutrient'),
            'synonyms': r.get('synonyms', []),
            'related': r.get('related', []),
            'claim_count': count,
        }
        if ce.get('symbol'):
            rec['symbol'] = ce['symbol']
        return rec
    if r.get('catalog_ref'):
        return {
            'display_name': cond_names[slug],
            'type': r.get('type', 'condition'),
            'synonyms': r.get('synonyms', []),
            'related': r.get('related', []),
            'claim_count': count,
        }
    rec = {
        'display_name': r['display_name'],
        'type': r.get('type', 'concept'),
        'synonyms': r.get('synonyms', []),
        'related': r.get('related', []),
        'claim_count': count,
    }
    if r.get('symbol'):
        rec['symbol'] = r['symbol']
    # Optional hand-picked lede claim: names the claim whose answer_short is this entity page's
    # "at a glance" intro when the facet-priority default is not the best overview (validated in
    # validate() to be this entity's OWN enriched claim). Read by state/search.ts::entityLede.
    if r.get('intro_claim'):
        rec['intro_claim'] = r['intro_claim']
    return rec


def build_index():
    """Pure — returns the derived index object (no write). Used by derived_artifacts_fresh."""
    enr = _load('eden/corpus/search-enrichment.json')['enrichment']
    reg = _load('eden/catalog/search-entities.json')['entities']
    canon = _canon()
    cond_names = {slug: e.get('display_name', slug) for slug, e in _conditions().items()}
    claims_by_id = _claims_by_id()
    books_meta = {b['book_id']: b for b in _load('eden/corpus/books-meta.json')['books']}

    errs = validate(enr, reg, canon, claims_by_id)
    if errs:
        raise ValueError('search index INVALID — refuses to derive:\n  ' + '\n  '.join(errs))

    claims = []
    counts = {}
    for cid in sorted(enr.keys()):
        a = enr[cid]
        c = claims_by_id[cid]
        loc = c.get('locator') or {}
        rec = {
            'id': cid,
            'subject': a['subject'],
            'also_about': a.get('also_about', []),
            'facet': a['facet'],
            'question': a['question'],
            'answer_short': a['answer_short'],
            'answer': _derive_answer(c.get('claim_text', '')),
            'verbatim': c.get('verbatim', ''),
            # Roman-numeral / non-numeric front-matter pages (e.g. 'xix' for a book's
            # Introduction) can't fit the search-index numeric page field (SearchClaimSchema
            # page: number|null). Passing the raw string fails the RUNTIME safeParse, which
            # empties the WHOLE index (state/search.ts EMPTY_INDEX fallback) -> Explore/Foods
            # silently blank. Coerce any non-int page to null. (2026-07-21: RARE-000024, p.xix.)
            'page': (loc.get('page') if type(loc.get('page')) is int else None),
            'book_id': loc.get('book'),
            'topics': a.get('topics', []),
        }
        if a.get('see_also'):
            rec['see_also'] = a['see_also']
        # tier1_link means "this claim ALSO feeds the operational tier-1 tabs" — true ONLY for a
        # genuinely dual-home claim (NOT tagged search-only). A search-only claim may carry a
        # conditions array for search matching, but it is excluded from the operational indices
        # (search_only_indices_excluded), so it gets no ALSO-TIER-1 chips.
        tier1 = {}
        if 'search-only' not in c.get('tags', []):
            if c.get('essentials'):
                tier1['essentials'] = c['essentials']
            if c.get('conditions'):
                tier1['conditions'] = c['conditions']
            if c.get('symptoms'):
                tier1['symptoms'] = c['symptoms']
        if tier1:
            rec['tier1_link'] = tier1
        claims.append(rec)
        counts[a['subject']] = counts.get(a['subject'], 0) + 1

    books = {}
    for rec in claims:
        bid = rec['book_id']
        if bid and bid in books_meta and bid not in books:
            b = books_meta[bid]
            books[bid] = {'title': b['title'], 'year': b['year']}

    entities = {slug: _entity_record(slug, reg, canon, cond_names, counts[slug]) for slug in sorted(counts.keys())}

    return {
        'schema_version': 1,
        '_generated': 'DERIVED by eden/tools/search_index_derive.py from the sealed pillars — do not hand-edit',
        'books': books,
        'entities': entities,
        'claims': claims,
    }


def write_index():
    """Regenerate the on-disk artifact via safe_write (§17). Used by build_embeds.py."""
    import sys
    sys.path.insert(0, str(ROOT / 'tools'))
    import safe_write
    payload = json.dumps(build_index(), indent=2, ensure_ascii=False) + '\n'
    return safe_write.safe_rewrite(ROOT / ARTIFACT, payload)


if __name__ == '__main__':
    import sys
    if '--check' in sys.argv:
        v = validate()
        print('VALID' if not v else 'INVALID:\n  ' + '\n  '.join(v))
        sys.exit(1 if v else 0)
    n = write_index()
    print(f'wrote {ARTIFACT} ({n} B)')
