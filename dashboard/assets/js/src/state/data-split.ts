/**
 * ═══════════════════════════════════════════════════════════════════════════
 * state/data-split.ts — the web build's on-demand loader for the heavy artifacts
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * The file:// build inlines every artifact in assets/data/ into the bundle, because a page
 * opened from disk cannot fetch(). That is correct for the download, and it is the whole
 * reason the bundle is ~13 MB. The WEB build (tools/build_web.py) has no such limit, so it
 * stubs the heaviest artifacts OUT of the bundle and ships them as plain files fetched after
 * first paint. Same source, two distributions.
 *
 * Ruled 2026-08-20 (chronicle/decisions/2026-08-20-domain-name.md): CLAUDE.md's "no network
 * at runtime" clause scopes to the LOCAL build. Every fetch here is SAME-ORIGIN and relative,
 * so nothing points off-machine — which is what `offline_no_runtime_network` actually gates,
 * and it still passes with this module present.
 *
 * WHICH BUILD AM I IN?
 * `__SPLIT_DATA__` is an esbuild --define: `false` in the file build (where the artifacts stay
 * inlined and nothing here ever runs) and `true` in the web build. A build that forgets to
 * define it reads as `false` — i.e. it falls back to the INLINED artifact, which is the safe
 * direction: a stale-but-present dataset beats a missing one.
 *
 * HONEST LIMIT — read before trusting this
 * A failed fetch resolves to `null`, and each consumer then keeps whatever it already had
 * (in the web build, the empty stub). That is ABSENT data, not fabricated data, so it does
 * not breach the anti-fakery rule — but it IS a silent degradation: the Creator's Log section
 * would simply not render. It is accepted because these files are same-origin static assets
 * on the host that just served the bundle; if they 404, the app itself did not load either.
 * If a split artifact ever becomes load-bearing for a primary surface, that surface needs a
 * real failure state before it may be split.
 */

/** esbuild --define. Declared, never bundled — see the header. */
declare const __SPLIT_DATA__: boolean;
declare const __SPLIT_MANIFEST__: Record<string, string>;

/**
 * True only in the web build. `typeof` rather than a bare read so a build that omits the
 * define degrades to the inlined path instead of throwing a ReferenceError at module scope.
 */
export const SPLIT_DATA: boolean
  = typeof __SPLIT_DATA__ === 'boolean' ? __SPLIT_DATA__ : false;

/**
 * The artifacts the web build ships as files. Each key is the path under assets/data/
 * WITHOUT the .json suffix, so it doubles as the fetch path. Keep this list in step with
 * the `SPLIT_ARTIFACTS` list in tools/esbuild_web.mjs — the gate `split_data_manifest_agrees`
 * fails the board if they diverge, because a key stubbed out of the bundle but never shipped
 * is a dataset that silently vanishes on the web only.
 */
export type SplitKey =
  | 'corpus-embed'
  | 'creators-log-embed'
  | 'search/search-index';

/**
 * key → the filename the web build actually shipped, content-hashed by tools/esbuild_web.mjs
 * and injected here as a --define. Empty in the file build, where nothing is fetched at all.
 *
 * ★ THE HASH IS THE CACHE CONTRACT. These artifacts used to ship under fixed names, and on
 * 2026-08-22 SiteGround's proxy served the previous deploy's corpus for hours after an upload
 * — a fresh bundle reading a superseded corpus, with no error anywhere. `cache: 'reload'` and
 * `cache: 'no-store'` did not shift it, because those govern the browser and not an upstream
 * proxy. A changed name is the only instruction every layer must obey. See the long note in
 * tools/esbuild_web.mjs.
 */
const MANIFEST: Partial<Record<SplitKey, string>>
  = typeof __SPLIT_MANIFEST__ === 'object' && __SPLIT_MANIFEST__ !== null
    ? __SPLIT_MANIFEST__
    : {};

/**
 * Where `key` actually lives.
 *
 * The un-hashed fallback is for a build that armed __SPLIT_DATA__ but not the manifest — the
 * shape every web build shipped before 2026-08-22. It cannot happen through build_web.py,
 * which hard-fails if the bundle names a file it did not write, and esbuild_web.mjs hard-fails
 * if a hash cannot be computed; the fallback exists so the failure is a 404 on one artifact
 * rather than a malformed URL, and it is deliberately NOT a silent success.
 */
function pathFor(key: SplitKey): string {
  return `./assets/data/${MANIFEST[key] ?? `${key}.json`}`;
}

/** One in-flight (or settled) promise per key, so N callers cause exactly one request. */
const requests = new Map<SplitKey, Promise<unknown>>();

/**
 * Fetch a split artifact once, ever. Resolves to the parsed JSON, or `null` in the file
 * build (nothing to fetch — it is already inlined) and on any failure. The caller validates:
 * this returns `unknown` deliberately, so nothing untyped crosses into typed-land here.
 */
export function loadSplit(key: SplitKey): Promise<unknown> {
  if (!SPLIT_DATA) {
    return Promise.resolve(null);
  }
  const running = requests.get(key);
  if (running !== undefined) {
    return running;
  }
  const request = fetch(pathFor(key))
    .then(async (res): Promise<unknown> => {
      if (!res.ok) {
        console.warn(`[data-split] ${key}: HTTP ${res.status}`);
        return null;
      }
      return await (res.json() as Promise<unknown>);
    })
    .catch((err: unknown): unknown => {
      console.warn(`[data-split] ${key} failed:`, err);
      return null;
    });
  requests.set(key, request);
  return request;
}

/**
 * Start the fetches without waiting for them. Called once from boot AFTER the first view is
 * scheduled, so a split artifact is usually already in memory by the time a user navigates to
 * the surface that needs it, and `loadSplit` at the point of use is then a resolved promise.
 * A no-op in the file build.
 */
export function prefetchSplit(keys: readonly SplitKey[]): void {
  if (!SPLIT_DATA) {
    return;
  }
  for (const key of keys) {
    void loadSplit(key);
  }
}
