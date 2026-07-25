/**
 * core/schemas/mechanism-clarity.ts — the MECHANISM explainer prose-store schema.
 * ═══════════════════════════════════════════════════════════════════════════
 * Narrows the hand-authored dashboard/assets/data/mechanism-clarity-data.json — the per-element
 * "how it works" hero (selenium's rancidity mechanism is the first instance). A plain-language
 * GLOSS of Wallach's OWN sealed claims: each beat's `traces` are provenance-only (never rendered),
 * and his exact words + the stat figure are pulled BY CLAIM ID at render (never hand-typed
 * verbatim, R3). Keyed as an ARRAY (built into a Map by .map) so no id-keyed literal — the entity
 * page stays a pure projection (entity_render_is_projection). Mirrors fatty-acid-clarity.ts.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { z } from 'zod';

const MechStatSchema = z.object({
  value: z.string(),
  readout: z.string(),
  label: z.string(),
  claim: z.string(),
}).passthrough();

const MechBeatSchema = z.object({
  n: z.string(),
  title: z.string(),
  text: z.string(),
  hook: z.string(),
  traces: z.array(z.string()),
}).passthrough();

const MechanismSchema = z.object({
  slug: z.string(),
  facet: z.string(),
  eyebrow: z.string(),
  kill: z.string(),
  figure: z.string(),
  figure_alt: z.string(),
  beats: z.array(MechBeatSchema),
  quote_claim: z.string(),
  highlight: z.string().optional(),
  stat: MechStatSchema.optional(),
}).passthrough();

export const MechanismClaritySchema = z.object({
  disclaimer: z.string(),
  mechanisms: z.array(MechanismSchema),
}).passthrough();
