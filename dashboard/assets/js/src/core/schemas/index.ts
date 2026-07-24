/**
 * core/schemas/index.ts — barrel export for all Zod schemas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single import point for callers: `import { RegimenSchema } from '@core/schemas'`.
 * As new state surfaces gain schemas (journey, goals), they're added here.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export * from './corpus.js';
export * from './coverage-layout.js';
export * from './coverage-status.js';
export * from './glossary.js';
export * from './goals.js';
export * from './journey.js';
export * from './knowledge.js';
export * from './log.js';
export * from './ocr-dict.js';
export * from './regimen.js';
export * from './scanner-corpus.js';
export * from './scanner.js';
export * from './product-detail.js';
export * from './nutrient-resolver.js';
export * from './fatty-acid-clarity.js';
export * from './recommender.js';
export * from './search.js';
export * from './view-copy.js';
export * from './entity-page.js';
export * from './entity-copy.js';
export * from './home-curation.js';
export * from './condition-categories.js';
export * from './foods-curation.js';
export * from './kids-exclusion.js';
export * from './pdm-coverage.js';
export * from './efa-coverage.js';
export * from './orac-data.js';
export * from './orac-foods-data.js';
export * from './orac-products-data.js';
