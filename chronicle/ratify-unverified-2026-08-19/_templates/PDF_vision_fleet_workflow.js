export const meta = {
  name: 'rare-earths-vision-verify',
  description: 'Vision-verify rare-earths corpus verbatims against the Wallach PDF page renders',
  phases: [{ title: 'Vision-verify', detail: 'one agent per PDF page, reads the render and confirms every digit + name' }],
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    group_page: { type: 'number' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          id: { type: 'string' },
          located: { type: 'boolean' },
          verdict: { type: 'string', enum: ['VERIFIED-CLEAN', 'DEFECTS', 'UNVERIFIABLE'] },
          defects: {
            type: 'array',
            items: { type: 'object', additionalProperties: false,
                     properties: { ours: { type: 'string' }, page_says: { type: 'string' } },
                     required: ['ours', 'page_says'] },
          },
          corrected_verbatim: { type: 'string' },
          numbers_confirmed: { type: 'boolean' },
          notes: { type: 'string' },
        },
        required: ['id', 'located', 'verdict', 'defects', 'corrected_verbatim', 'numbers_confirmed', 'notes'],
      },
    },
  },
  required: ['group_page', 'verdicts'],
}

function buildPrompt(g) {
  const shotList = g.pngs.map(s => `  - ${s}`).join('\n')
  const claimsBlock = g.claims.map((c, i) => {
    const flags = c.auditor_flags.length ? c.auditor_flags.join(' | ') : 'none'
    return [`CLAIM ${i + 1} — ${c.id}`,
            `  our_verbatim: """${c.verbatim}"""`,
            `  claim_asserts: ${c.claim_text}`,
            `  known_flags: ${flags}`].join('\n')
  }).join('\n\n')

  return `You are the final §00.A arbiter for a Wallach health corpus: every number and name shown to users must trace byte-exactly to the printed book. You verify stored verbatims against the actual page images.

BOOK: "Rare Earths: Forbidden Cures" (Joel D. Wallach & Ma Lan, 1994). These are clean PDF page renders — one full book page per image (usually a two-column layout). Read the printed text directly.

Read these page image files with the Read tool (absolute Windows paths):
${shotList}

For EACH claim below, find its verbatim passage on the pages and compare OUR stored verbatim against what the book actually printed.

IMPORTANT context: our stored text was purified and is OFTEN CLEANER than any raw OCR. The PRINTED PAGE is the sole arbiter. Confirm, per claim:
1. Every DIGIT / number matches the page exactly — years, ages, counts, doses, ratios, table labels. THE MOST IMPORTANT CHECK. If a number reads as a time like "one and a half hours", report the page's exact wording (do NOT convert to minutes).
2. Every proper noun / name matches — people, places, drug names, journals, minerals.
3. Any word our verbatim renders differently from the page.

RULES:
- Vitamin subscripts: the page prints true subscripts (B12, B6, B1). OCR mangles these to "B,," or "B,". Report the page's TRUE reading.
- A line-break hyphen ("melan-choly", "depres-sion") or a word split/fused by a line wrap is a layout artifact, NOT a defect — note it, but it doesn't change content.
- A DEFECT is a genuine content difference: a wrong digit, a wrong/misspelled name, a dropped/added word that changes meaning, a misread letter. Where OUR text is correct and the raw OCR was wrong, that is NOT a defect (verdict CLEAN).
- If a claim references a specific NAMED framework (e.g. "Schuessler cell salts" / "tissue salts"), report explicitly whether that name appears ON THE PAGE near the passage, or only in a table caption / not at all. This matters for §00.A.
- If a passage is not on the given pages, mark UNVERIFIABLE and say why.

VERDICT per claim: VERIFIED-CLEAN (page confirms content, every number+name matches; trivial line-break artifacts OK) · DEFECTS (≥1 genuine content difference, list {ours, page_says}) · UNVERIFIABLE (couldn't locate/read).

Also return corrected_verbatim: the page's true text for the passage, OCR/subscripts fixed to exactly what the page shows; equal to our verbatim wherever the page agrees.

Return STRICT JSON matching the schema (group_page = ${g.primary_page}). Verify every claim.

CLAIMS TO VERIFY (${g.claims.length}):

${claimsBlock}`
}

phase('Vision-verify')
const groups = GROUPS
log(`Vision-verifying ${groups.reduce((n, g) => n + g.claims.length, 0)} rare-earths claims across ${groups.length} PDF pages`)

const results = await parallel(groups.map((g) => () =>
  agent(buildPrompt(g), {
    label: `verify:p${g.primary_page}`, phase: 'Vision-verify',
    schema: VERDICT_SCHEMA, agentType: 'general-purpose',
  })
))

const flat = []
for (const r of results) if (r && r.verdicts) for (const v of r.verdicts) flat.push(v)
const by = { 'VERIFIED-CLEAN': 0, 'DEFECTS': 0, 'UNVERIFIABLE': 0 }
for (const v of flat) by[v.verdict] = (by[v.verdict] || 0) + 1
log(`RESULTS: clean=${by['VERIFIED-CLEAN']} defects=${by['DEFECTS']} unverifiable=${by['UNVERIFIABLE']} (total ${flat.length})`)
return { total: flat.length, summary: by, verdicts: flat }
