/**
 * WORKFLOW TEMPLATE — page-read a batch of front-facing claims, then adversarially verify.
 *
 * Preserved 2026-08-02 from the wave-3 non-word sweep, the most evolved of the four run that day.
 * Copy it, swap the input file and the verdict vocabulary; keep the RULES block almost verbatim,
 * because every line in it is a mistake that was actually made or nearly made:
 *
 *   - "NEVER GUESS ... cannot read it => UNREADABLE"   an over-flagged unknown is recoverable; a
 *                                                       confident wrong reading is not.
 *   - "NEVER apply outside knowledge"                   the page's error is the book's. (Distinct
 *                                                       from FIXING a clear typo, which is
 *                                                       sanctioned — see books-are-riddled memory.)
 *   - "the spellchecker's guess carries no authority"   it wanted castro/gastro, penis/pedis,
 *                                                       honey/HOXEY.
 *   - "MOST OF THESE ARE PROBABLY LEGITIMATE"           62 of 105 were. Without this line agents
 *                                                       hunt for defects and invent them.
 *   - the already-ratified divergence list               an agent hit the silver claim, checked it,
 *                                                       and did NOT propose restoring a toxic dose.
 *   - "coverage < 0.85 => the page index is UNRELIABLE"  the locator lies and says so.
 *   - a skeptic per claimed defect, defaulting to        4 of ~50 claimed defects were refuted this
 *     refuted:true when glyphs are unclear               way and never reached the source.
 *
 * The pipeline shape matters too: verification runs per-item as each reader finishes, not behind a
 * barrier, so a slow slice never blocks a fast one.
 *
 * Paths below point at the session scratchpad as it ran. Repoint SP to tools/frontface/work.
 */
export const meta = {
  name: 'frontface-nonword-sweep',
  description: 'Page-read the 102 non-word tokens our own text carries that the second-OCR pass could not flag (shared errors)',
  phases: [
    { title: 'Read', detail: 'render each page and decide whether the token is a garble or legitimate' },
    { title: 'Verify', detail: 'independent skeptic re-reads every claimed defect' },
  ],
}

const SP = 'C:/Users/Light/AppData/Local/Temp/claude/C--Users-Light-Desktop-claude-health-expert/c4fab270-1db8-427f-a2ec-0550a948657e/scratchpad'

const SLICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const RULES = `
You are checking tokens in Wallach-corpus quotes that are NOT words of English. READ-ONLY: do NOT
write, edit, resnap or seal ANY file. Your only output is the JSON you return.

WHY THESE MATTER. They were found by scanning OUR OWN text, not by comparing it to anything. The
usual instrument (a second independent OCR of the same page) is blind here because BOTH passes made
the same error -- a measured 7-in-30 blind spot. So the page is the only arbiter.

INPUT: ${SP}/wave3.json is a JSON array of 86 claims, each {id, book, page, coverage, tokens[],
verbatim}. Each token is {token, guess, ctx}. "guess" is a SPELLCHECKER's suggestion and is often
WRONG -- treat it as a hint with no authority. Work only on your assigned entries.

★ MOST OF THESE ARE PROBABLY LEGITIMATE. Expect to confirm, not to fix. The books are full of:
  - botanical / taxonomic Latin: Leonurus cardiaca, Rauwolfia serpentina, Colchicum autumnale,
    Centaurea cyanus, Potentilla anserina, Tinea pedis
  - British or older spellings: caesium, paraesthesia, nitre
  - homeopathic and trade names: Silicea, Hoxsey, Preparation H
  - real technical terms a speller lacks: folates, urate, aspartate, colloidals, arrhythmias
Calling one of these a defect and "fixing" it would CORRUPT correct text. Only report a defect when
the page plainly prints something different from our token.

HOW TO SEE THE PAGE (no pdftoppm here; the Read tool cannot open a PDF page):
  rare-earths / lets-play-doctor / hells-kitchen -- "page" is a 1-BASED PDF page index:
      python "${SP}/render.py" <book> <page> "${SP}/w3-<id>.png" 3.0
      zoom:  python "${SP}/render.py" <book> <page> "${SP}/w3-<id>-z.png" 10.0 <x0> <y0> <x1> <y1>
             (x0 y0 x1 y1 are FRACTIONS of the page)
  epigenetics / immortality -- "page" is a Screenshot NUMBER; each capture is a TWO-PAGE SPREAD in a
  3840x1080 dual-monitor frame with the book in the left ~26%:
      python "${SP}/render_shot.py" <book> <N> "${SP}/w3-<id>.png" both 3
      bigger:  python "${SP}/render_shot.py" <book> <N> "${SP}/w3-<id>-L.png" left 8
  Then Read the PNG. If the passage is not there, try the neighbouring page/screenshot before
  concluding anything. If "coverage" is below 0.85 the page index is UNRELIABLE -- treat it as a
  hint and search nearby.

VERDICT per token:
  OURS_DEFECT   the page prints something different and our token is garbled. Give the page's exact
                word and enough surrounding words to locate the span uniquely.
  LEGITIMATE    the page prints the same token, and it is a real name/term/spelling. Say what it is
                (botanical Latin, British spelling, trade name, technical term...).
  BOOK_TYPO     the page prints the same token and it IS misspelled English (e.g. the page really
                prints "menapause"). This project corrects book typos inside the verbatim, so
                propose the correction -- but say clearly that the page carries the error.
  UNREADABLE    you cannot make out the glyphs.

HARD RULES - breaking these causes real harm:
1. NEVER GUESS. Cannot read it => UNREADABLE. State which tokens you resolved by SEEING glyphs.
2. NEVER let the spellchecker's "guess" decide. It suggested "castro" for "gastro", "penis" for
   "pedis" and "honey" for "HOXEY". Read the page and use the sentence's own sense.
3. DOSE UNITS, NUMBERS, SUBSTANCE NAMES are safety-critical -- read them at high zoom, never infer.
   A garbled substance name in a dose line (e.g. "mtin 50 mg t.i.d.") changes what a reader takes.
4. Proposals only. Change nothing.
`

const SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'located', 'tokens', 'notes'],
        properties: {
          id: { type: 'string' },
          located: { type: 'boolean' },
          page_used: { type: 'string' },
          tokens: {
            type: 'array',
            items: {
              type: 'object',
              required: ['token', 'verdict', 'saw_glyphs'],
              properties: {
                token: { type: 'string' },
                verdict: { type: 'string', enum: ['OURS_DEFECT', 'LEGITIMATE', 'BOOK_TYPO', 'UNREADABLE'] },
                page_prints: { type: 'string' },
                correction: { type: 'string', description: 'what our text should hold, if anything' },
                unique_context: { type: 'string' },
                what_it_is: { type: 'string', description: 'for LEGITIMATE: botanical Latin / British spelling / trade name / technical term' },
                saw_glyphs: { type: 'boolean' },
              },
            },
          },
          notes: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['id', 'refuted', 'reason'],
  properties: {
    id: { type: 'string' },
    refuted: { type: 'boolean' },
    reason: { type: 'string' },
  },
}

phase('Read')
const out = await pipeline(
  SLICES,
  (s, _o, i) => agent(
    `${RULES}\n\nRead ${SP}/wave3.json (86 entries). Work ONLY on entries where (index % 10) === ${i}.\n` +
    `Render each page, find each token, and judge it. Return one finding per claim.`,
    { label: `nonword:slice${i}`, phase: 'Read', schema: SCHEMA }),
  (res) => {
    if (!res || !res.findings) return []
    const suspect = res.findings.filter(f =>
      (f.tokens || []).some(t => t.verdict === 'OURS_DEFECT'))
    if (!suspect.length) return res.findings
    return parallel(suspect.map(f => () =>
      agent(
        `${RULES}\n\nAnother reader claims these tokens in ${f.id} (page/shot ${f.page_used}) are ` +
        `defects in OUR text:\n` +
        JSON.stringify((f.tokens || []).filter(t => t.verdict === 'OURS_DEFECT'), null, 1) +
        `\n\nIndependently render and READ that page and try to REFUTE it. Default to refuted:true ` +
        `if you cannot clearly see the glyphs. Remember most non-words in these books are ` +
        `legitimate botanical Latin, older spellings or trade names.`,
        { label: `verify:${f.id.slice(8)}`, phase: 'Verify', schema: VERDICT })
        .then(v => ({ ...f, verify: v }))
    )).then(ck => res.findings.map(f => ck.find(c => c.id === f.id) || f))
  }
)

const all = out.flat().filter(Boolean)
const tok = all.flatMap(f => (f.tokens || []).map(t => ({ ...t, id: f.id, refuted: f.verify && f.verify.refuted })))
return {
  claims: all.length,
  tokens: tok.length,
  defects: tok.filter(t => t.verdict === 'OURS_DEFECT' && !t.refuted),
  book_typos: tok.filter(t => t.verdict === 'BOOK_TYPO'),
  legitimate: tok.filter(t => t.verdict === 'LEGITIMATE').map(t => ({ id: t.id, token: t.token, what: t.what_it_is })),
  unreadable: tok.filter(t => t.verdict === 'UNREADABLE').map(t => ({ id: t.id, token: t.token })),
  refuted: all.filter(f => f.verify && f.verify.refuted).map(f => ({ id: f.id, reason: f.verify.reason })),
}
