/**
 * core/format.ts — tiny presentation formatters shared across views (layer: core).
 * Pure + dependency-free (core imports only zod, and this needs nothing).
 */

/**
 * The count-appropriate noun form — single-sources the singular/plural rule so no
 * view hardcodes "1 claims". Regular: plural(1, 'claim') -> 'claim',
 * plural(2, 'claim') -> 'claims'. Irregular plural: pass it explicitly,
 * e.g. plural(1, 'ENTRY', 'ENTRIES') -> 'ENTRY'.
 */
export function plural(n: number, one: string, many: string = `${one}s`): string {
  return n === 1 ? one : many;
}
