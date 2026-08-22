/**
 * core/provenance.ts — whose numbers are these?
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A regimen item is marked with WHERE its composition came from (the token Eden's wall
 * gates — see `scanner_user_items_marked`). Two of those tokens mean THE USER SUPPLIED THE
 * NUMBERS: they read a physical label and either photographed it (`user_scanned`) or typed
 * it in (`user_typed`). The rest mean the item IS a catalog product the user picked, whose
 * numbers belong to the sealed Product DB.
 *
 * ★ WHY THIS LIVES IN ONE FILE. The distinction is read in three places that must never
 * disagree: the auto-heal fork in state/coverage.ts (a user-supplied item is NEVER re-read
 * from the vault, or the user's own typed amounts would be silently replaced by sealed
 * composition), and the YOURS marks in views/coverage.ts + views/regimen.ts. Three
 * hand-typed `=== 'user_scanned'` comparisons is exactly the shape that drifts when a
 * fourth token lands, and the drift is SILENT — a wrong number rendered with no error.
 * `user_supplied_provenance_single_home` REDs on any such comparison outside this file.
 *
 * NOT a security boundary: the token is user-writable localStorage. It decides whose
 * numbers to render, nothing more.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** The provenance tokens whose composition came from the user, not the sealed catalog. */
export const USER_SUPPLIED_PROVENANCE: readonly string[] = ['user_scanned', 'user_typed'];

/**
 * A food added from the curated food catalog (state/foods.ts).
 *
 * ★ DELIBERATELY *NOT* IN USER_SUPPLIED_PROVENANCE. A food's numbers are USDA composition
 * joined to a Wallach target — nobody typed them — so a saved food MUST re-read the live
 * catalog on every paint, exactly as a vault product re-reads the vault. Marking it
 * user-supplied would freeze a stale snapshot: a corrected portion or a re-derived source
 * would never reach a regimen that already holds the food, silently and with no error.
 */
export const FOOD_CATALOG_PROVENANCE = 'food_catalog';

/**
 * True when the item is a food from the curated catalog, whose numbers heal from
 * foods-composition-data.json rather than from the product vault.
 */
export function isFoodCatalog(provenance: string): boolean {
  return provenance === FOOD_CATALOG_PROVENANCE;
}

/**
 * True when the item's nutrient numbers are the USER's own reading of a label — scanned
 * from a photo or typed by hand. Such an item keeps its own snapshot forever and carries
 * the YOURS mark; anything else is a catalog product and heals from the live vault.
 */
export function isUserSupplied(provenance: string): boolean {
  return USER_SUPPLIED_PROVENANCE.includes(provenance);
}
