/**
 * core/schemas/index.ts — barrel export for all Zod schemas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single import point for callers: `import { RegimenSchema } from '@core/schemas'`.
 * As new state surfaces gain schemas (journey, goals), they're added here.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export * from './coverage-layout.js';
export * from './coverage-status.js';
export * from './knowledge.js';
export * from './log.js';
export * from './regimen.js';
export * from './scanner.js';
