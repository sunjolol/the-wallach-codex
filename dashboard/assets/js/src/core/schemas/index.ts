/**
 * core/schemas/index.ts — barrel export for all Zod schemas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Convenience import point for most callers: `import { RegimenSchema } from '@core/schemas'`.
 * backup.ts and profile.ts are deliberately absent — their consumers import them by path.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export * from './corpus.js';
export * from './coverage-layout.js';
export * from './coverage-status.js';
export * from './glossary.js';
export * from './knowledge.js';
export * from './log.js';
export * from './ocr-dict.js';
export * from './regimen.js';
export * from './scanner-corpus.js';
export * from './scanner.js';
export * from './product-detail.js';
export * from './nutrient-resolver.js';
export * from './fatty-acid-clarity.js';
export * from './mechanism-clarity.js';
export * from './recommender.js';
export * from './search.js';
export * from './view-copy.js';
export * from './entity-page.js';
export * from './entity-copy.js';
export * from './home-curation.js';
export * from './condition-categories.js';
export * from './foods-curation.js';
export * from './kids-exclusion.js';
export * from './starter-pack.js';
export * from './superseded-products.js';
export * from './dose-defaults.js';
export * from './pdm-coverage.js';
export * from './foods-composition.js';
export * from './efa-coverage.js';
export * from './orac-data.js';
export * from './orac-foods-data.js';
export * from './orac-products-data.js';
