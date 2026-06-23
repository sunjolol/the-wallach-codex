# transcripts/

Raw Dr. Joel Wallach lecture, interview, and "Daily/Ask Doc" transcripts in
WebVTT (`.en.vtt`) format — captions pulled from YouTube and similar sources.
This is the **source corpus** that `wallach-refresh/` ingests: `ingest.py`
classifies each file (High / Moderate / Low / Exclude), cleans it into plain text
under `knowledge/transcripts-clean/`, and indexes it in `knowledge/manifest.csv`.

These are unedited third-party captions (messy, no speaker tags, occasional
mis-transcriptions). They feed the Wallach allowlist (`wallach-lecture`) behind
§00.A. Copyright handling — trimming long passages, attribution — is a deferred
Phase 4 polish task (see `genesis/02-clarifications-and-plan.md` §8.4); during the
build, Wild West Mode applies and the repo stays private.
