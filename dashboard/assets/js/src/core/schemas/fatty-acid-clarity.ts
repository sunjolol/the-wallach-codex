/**
 * core/schemas/fatty-acid-clarity.ts — Zod schema for the omega clarity prose store
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Narrows `dashboard/assets/data/fatty-acid-clarity-data.json` — the GENERAL-reference
 * (non-Wallach) explainer shown on each omega essential's deep-dive so the naming stays
 * unambiguous (the source graphic mislabeled Omega-9). Not a claim, not doctrine; the view
 * renders it inside a clearly-marked "for clarity" alert.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { z } from 'zod';

export const FattyAcidSchema = z.object({
  abbr: z.string(),
  name: z.string(),
  primary: z.boolean(),
  description: z.string(),
}).passthrough();

export const OmegaFamilySchema = z.object({
  /** Canon fatty-acid slug: omega-3 | omega-6 | omega-9. */
  family: z.string(),
  label: z.string(),
  acids: z.array(FattyAcidSchema),
}).passthrough();

export const FattyAcidClaritySchema = z.object({
  disclaimer: z.string(),
  omegas: z.array(OmegaFamilySchema),
}).passthrough();

export type FattyAcidClarity = z.infer<typeof FattyAcidClaritySchema>;
export type OmegaFamily = z.infer<typeof OmegaFamilySchema>;
