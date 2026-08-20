export const meta = {
  name: 'immortality-vision-verify',
  description: 'Vision-verify 25 Immortality corpus verbatims against Wallach Kindle screenshots (per-page groups)',
  phases: [{ title: 'Vision-verify', detail: 'one agent per book page, reads the image and confirms every digit + name' }],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    group_shot: { type: 'string' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          located: { type: 'boolean' },
          verdict: { type: 'string', enum: ['VERIFIED-CLEAN', 'DEFECTS', 'UNVERIFIABLE'] },
          defects: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { ours: { type: 'string' }, page_says: { type: 'string' } },
              required: ['ours', 'page_says'],
            },
          },
          corrected_verbatim: { type: 'string' },
          numbers_confirmed: { type: 'boolean' },
          notes: { type: 'string' },
        },
        required: ['id', 'located', 'verdict', 'defects', 'corrected_verbatim', 'numbers_confirmed', 'notes'],
      },
    },
  },
  required: ['group_shot', 'verdicts'],
}

function winpath(p) { return p.replace(/\//g, '\\') }

function buildPrompt(g) {
  const shots = g.screenshots.map(winpath)
  const shotList = shots.map(s => `  - ${s}`).join('\n')
  const claimsBlock = g.claims.map((c, i) => {
    const flags = (c.auditor_flags && c.auditor_flags.length) ? c.auditor_flags.join(' | ') : 'none'
    return [
      `CLAIM ${i + 1} — ${c.id}`,
      `  our_verbatim: """${c.verbatim}"""`,
      `  claim_asserts: ${c.claim_text}`,
      `  known_ocr_flags: ${flags}`,
    ].join('\n')
  }).join('\n\n')

  return `You are the final §00.A arbiter for a Wallach health corpus: every number and name shown to users must trace byte-exactly to the printed book. You verify stored verbatims against the actual page images.

BOOK: "The Age Beaters and Their Universal Currency for Immortality" (Joel D. Wallach, 2008), captured as Kindle screenshots.

IMPORTANT — image layout: each screenshot is a DUAL-MONITOR capture (~3840×1080). The BOOK is on the LEFT ~48% of the image and shows TWO facing book pages side by side. The RIGHT half is an unrelated desktop/chat — ignore it completely. Read only the printed book text on the left.

Read these image files with the Read tool (each is an absolute Windows path):
${shotList}

For EACH claim below, find its verbatim passage in the printed pages and compare OUR stored verbatim against what Wallach actually printed. Our verbatim was OCR'd from these same screenshots, so it may carry OCR errors — your job is to catch any place where our text differs from the page in a way that changes content.

Confirm for each claim:
1. Every DIGIT / number matches the page exactly — percentages, years, ages, doses, ratios like "104/72". THIS IS THE MOST IMPORTANT CHECK.
2. Every proper noun / name matches — people, places, journals, compounds.
3. Any word our verbatim renders differently from the page.

RULES:
- Vitamin subscripts: the page prints true subscripts (B₁₂, B₆, B₁, B₅). OCR mangles these to "B,," or "B,". Report the page's TRUE subscript for each occurrence (e.g. our "B," → page "B₁₂").
- Line-break / spacing artifacts are NOT content defects: a word split by a hyphen ("Beri- beri") or fused/split by a line wrap ("dy nasties", "thrombosisand", "Highintakes") is a layout artifact. Note it, but it does not change content and is not a DEFECT.
- A DEFECT is a genuine content difference: a wrong digit, a wrong/misspelled name, a dropped or added word that changes meaning, a misread letter that changes the word (e.g. "charleton"→"charlatan" is an OCR letter fix, note it; a wrong PERCENTAGE is a hard defect).
- If a passage is NOT on the provided pages, it may continue onto an adjacent screenshot in the list — check them. If still not found or the text is unreadable, mark UNVERIFIABLE and say why.

VERDICT per claim:
- VERIFIED-CLEAN: the page confirms our verbatim's content — every number and name matches (trivial subscript/line-break artifacts that don't change content are fine).
- DEFECTS: at least one genuine content difference; list each as {ours, page_says}.
- UNVERIFIABLE: could not locate or read the passage.

Also return corrected_verbatim: the page's true text for that passage, with OCR subscripts and spacing corrected to exactly what the page shows, PRESERVING the original line breaks (\\n positions) of our verbatim. It should equal our verbatim wherever the page agrees.

Return STRICT JSON matching the schema (group_shot = "${winpath(g.primary_shot)}"). Verify every claim; do not skip any.

CLAIMS TO VERIFY (${g.claims.length}):

${claimsBlock}`
}

phase('Vision-verify')
const groups = args
log(`Vision-verifying ${groups.reduce((n, g) => n + g.claims.length, 0)} claims across ${groups.length} book pages`)

const results = await parallel(groups.map((g) => () =>
  agent(buildPrompt(g), {
    label: `verify:shot-${g.primary_shot.match(/\((\d+)\)/)[1]}`,
    phase: 'Vision-verify',
    schema: VERDICT_SCHEMA,
    agentType: 'general-purpose',
  })
))

const flat = []
for (const r of results) {
  if (r && r.verdicts) for (const v of r.verdicts) flat.push(v)
}
const byVerdict = { 'VERIFIED-CLEAN': 0, 'DEFECTS': 0, 'UNVERIFIABLE': 0 }
for (const v of flat) byVerdict[v.verdict] = (byVerdict[v.verdict] || 0) + 1
log(`RESULTS: clean=${byVerdict['VERIFIED-CLEAN']} defects=${byVerdict['DEFECTS']} unverifiable=${byVerdict['UNVERIFIABLE']} (total ${flat.length})`)

return { total: flat.length, summary: byVerdict, verdicts: flat }
