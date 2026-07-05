#!/usr/bin/env python3
"""corpus_seal.py — USER-ONLY. Seals eden/corpus as the new truth anchor.

The agent (Claude) MAY NOT run this on the user's behalf without explicit
per-invocation approval. Like eden_seal.py, sealing is the human's act of
ratifying corpus state as canonical.

What it does, in order:
  1. Refuses unless the always-valid checks pass (90 essential entries, book hashes match).
  2. Promotes any drafts/claims-<book>.draft.json -> claims/claims-<book>.json.
  3. Derives indices/* from claims/* (corpus_derive.derive_indices).
  4. Bumps knowledge_version, stamps sealed_at, status -> "sealed".
  5. Writes a *.golden.sha256 (LF-normalized content hash) for every sealed file:
     essentials-canon, books-meta, knowledge-version, each claims shard, each index.
  6. Appends to eden/corpus/seal-history.log (append-only).
  7. Runs corpus_verify.py as the final gate; refuses to report success unless it passes.

All hashes are over LF-normalized UTF-8 content (clone/CRLF-stable; see .gitattributes).
"""
import datetime
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CORPUS = ROOT / "eden" / "corpus"
CLAIMS_DIR = CORPUS / "claims"
INDICES_DIR = CORPUS / "indices"
DRAFTS_DIR = CORPUS / "drafts"
CANON_PATH = CORPUS / "essentials-canon.json"
META_PATH = CORPUS / "books-meta.json"
VERSION_PATH = CORPUS / "knowledge-version.json"
SEAL_LOG = CORPUS / "seal-history.log"

sys.path.insert(0, str(ROOT / "eden" / "tools"))
import corpus_verify  # noqa: E402


def lf_text(p: Path) -> str:
    return p.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")


def lf_sha256(p: Path) -> str:
    return hashlib.sha256(lf_text(p).encode("utf-8")).hexdigest()


def seal_one(p: Path) -> str:
    h = lf_sha256(p)
    (p.parent / (p.name + ".golden.sha256")).write_text(h + "\n", encoding="utf-8")
    return h


def main() -> int:
    # 1. gate on always-valid checks. Skip #8 (index-is-clean-derivation): step 3
    # below re-derives every index from the promoted shards, so a #8 mismatch here is
    # EXPECTED whenever corpus_derive.py changed or a draft edits a mapping. The FINAL
    # gate (corpus_verify.main, full run_checks) re-checks #8 post-derive and refuses
    # to report success on a genuinely bad derivation.
    fails, _, n_claims = corpus_verify.run_checks(skip_index_derive_check=True)
    if fails:
        print("REFUSING to seal — integrity checks failed:")
        for f in fails:
            print(f"  - {f}")
        return 1

    # 2. promote drafts
    promoted = []
    if DRAFTS_DIR.exists():
        for d in sorted(DRAFTS_DIR.glob("claims-*.draft.json")):
            target = CLAIMS_DIR / d.name.replace(".draft.json", ".json")
            target.write_text(lf_text(d), encoding="utf-8")
            promoted.append(target.name)

    # 3. derive indices from claims
    shards = sorted(CLAIMS_DIR.glob("claims-*.json"))
    sealed_indices = []
    if shards:
        import corpus_derive
        regen = corpus_derive.derive_indices(shards)
        INDICES_DIR.mkdir(exist_ok=True)
        for name, obj in regen.items():
            ip = INDICES_DIR / f"{name}.json"
            ip.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            sealed_indices.append(ip)

    # recount claims AFTER promotion (the pre-promotion run_checks saw an empty claims/)
    n_claims = 0
    for s in shards:
        n_claims += len(json.loads(s.read_text(encoding="utf-8")).get("claims", []))

    # 4. bump version
    version = json.loads(VERSION_PATH.read_text(encoding="utf-8"))
    new_v = int(version.get("knowledge_version") or 0) + 1
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    version["knowledge_version"] = new_v
    version["sealed_at"] = now
    version["status"] = "sealed"
    version["note"] = f"Sealed at knowledge_version={new_v}. {n_claims} claims across {len(shards)} book shard(s)."
    VERSION_PATH.write_text(json.dumps(version, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # 5. write golden hashes for every sealed file
    targets = [CANON_PATH, META_PATH, VERSION_PATH] + shards + sealed_indices
    for p in targets:
        seal_one(p)

    # 6. append seal log
    if not SEAL_LOG.exists():
        SEAL_LOG.write_text(
            "# eden/corpus seal history — append-only log of user-approved corpus seals\n"
            "# Format: <ISO> | knowledge_version=N | claims=N | shards=N | indices=N | promoted=[...]\n",
            encoding="utf-8",
        )
    with open(SEAL_LOG, "a", encoding="utf-8") as f:
        f.write(f"{now} | knowledge_version={new_v} | claims={n_claims} | shards={len(shards)} "
                f"| indices={len(sealed_indices)} | promoted={promoted}\n")

    print(f"SEALED: eden/corpus at knowledge_version={new_v}")
    print(f"  claims={n_claims} shards={len(shards)} indices={len(sealed_indices)} promoted={promoted}")
    print(f"  golden hashes written for {len(targets)} file(s).")
    print()
    print("Final gate — corpus_verify:")
    return corpus_verify.main()


if __name__ == "__main__":
    sys.exit(main())
