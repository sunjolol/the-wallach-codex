#!/usr/bin/env python3
"""catalog.py -- the single read point for the Catalog pillar (eden/catalog/*).

The Catalog is a sealed, hand-edited pillar (blueprint Pillar 3): the canonical ID
registries both the Wallach Corpus and the Youngevity Product DB reference. Every
consumer that needs a condition/symptom display name, the umbrella->subtype map, or
the synonym phrasings reads them HERE -- never from a private copy -- so no fact lives
in two places (Charter R3). Promoted 2026-07-05 (Phase B) from the emergent derived
indices + eden/tools/{condition-taxonomy,condition-synonyms}.json (retired).

Loads are memoized once per process; the catalog is static during a derive/verify run.
Every accessor degrades gracefully to empty/None if a catalog file is absent (bootstrap
guard), so tooling never crashes before the pillar is installed.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent            # eden/tools
CATALOG = HERE.parent / "catalog"                  # eden/catalog
COND_PATH = CATALOG / "conditions.json"
SYMP_PATH = CATALOG / "symptoms.json"

_COND = None
_SYMP = None


def _conditions() -> dict:
    """slug -> {display_name, synonyms?, umbrella_of?} (memoized)."""
    global _COND
    if _COND is None:
        _COND = json.loads(COND_PATH.read_text(encoding="utf-8")).get("conditions", {}) if COND_PATH.exists() else {}
    return _COND


def _symptoms() -> dict:
    """slug -> {display_name} (memoized)."""
    global _SYMP
    if _SYMP is None:
        _SYMP = json.loads(SYMP_PATH.read_text(encoding="utf-8")).get("symptoms", {}) if SYMP_PATH.exists() else {}
    return _SYMP


# ---- identity ----
def condition_slugs() -> set:
    return set(_conditions())


def symptom_slugs() -> set:
    return set(_symptoms())


def condition_display(slug: str):
    e = _conditions().get(slug)
    return e["display_name"] if e else None


def symptom_display(slug: str):
    e = _symptoms().get(slug)
    return e["display_name"] if e else None


# ---- projections for the verbatim-naming rule (single source; no private files) ----
def condition_synonyms() -> dict:
    """slug -> [alt phrasings], only for conditions that carry any."""
    return {s: e["synonyms"] for s, e in _conditions().items() if e.get("synonyms")}


def condition_taxonomy() -> dict:
    """umbrella slug -> [child subtype slugs], only for umbrella conditions."""
    return {s: e["umbrella_of"] for s, e in _conditions().items() if e.get("umbrella_of")}
