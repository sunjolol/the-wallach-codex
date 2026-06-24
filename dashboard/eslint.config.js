// ═══════════════════════════════════════════════════════════════════════════
// eslint.config.js — §00 ESLint configuration (flat config format)
// ═══════════════════════════════════════════════════════════════════════════
//
// Builds on @antfu/eslint-config (gold-standard solo-dev preset) with our
// project-specific rules:
//
//   - eslint-plugin-boundaries enforces the views/ → state/ → core/ layer
//     architecture. Cross-layer violations fail lint.
//   - no-restricted-syntax bans large inline literals (the demo-data
//     antipattern) outside assets/data/
//   - max-lines: 800 (warn at 600) — god-file tripwire
//   - no-explicit-any: error — unknown at boundaries, narrow with Zod
//
// The §17 enforcement (direct localStorage access ban outside core/storage.ts)
// is enforced by tools/invariants.py rather than ESLint because it requires
// understanding chokepoint discipline that lint can't natively express.
// ═══════════════════════════════════════════════════════════════════════════

import antfu from '@antfu/eslint-config';
import boundaries from 'eslint-plugin-boundaries';

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  vue: false,
  react: false,
  jsonc: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: true,
  },
  ignores: [
    'assets/js/dist/**',
    'assets/js/legacy-dashboard.js',
    'assets/vendor/**',
    'assets/data/**',
    'assets/fonts/**',
    'components/**',
    'dashboard.html',
    'node_modules/**',
  ],
}, {
  plugins: {
    boundaries,
  },
  settings: {
    'boundaries/elements': [
      { type: 'core', pattern: 'assets/js/src/core/*' },
      { type: 'state', pattern: 'assets/js/src/state/*' },
      { type: 'views', pattern: 'assets/js/src/views/*' },
      { type: 'main', pattern: 'assets/js/src/main.ts' },
    ],
    'boundaries/include': ['assets/js/src/**/*.ts'],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'core', allow: [] },
        { from: 'state', allow: ['core'] },
        { from: 'views', allow: ['core', 'state', 'views'] },
        { from: 'main', allow: ['core', 'state', 'views'] },
      ],
    }],
  },
}, {
  files: ['assets/js/src/**/*.ts'],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'ArrayExpression[elements.length>10]',
      message: 'Inline arrays >10 elements are banned outside assets/data/ — extract to a JSON fixture file under assets/data/.',
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
    'no-restricted-globals': ['warn', { name: 'localStorage', message: 'Use the core/storage.ts chokepoint — direct localStorage access is banned outside that file (per §17 + §31).' }],
  },
}, {
  files: ['assets/js/src/core/storage.ts'],
  rules: {
    'no-restricted-globals': 'off',
  },
}, {
  // Turn off jsonc/sort-keys for our config files — semantic ordering is intentional
  // (e.g. description before scripts in package.json, library before compilerOptions in tsconfig)
  files: ['*.json', '*.jsonc'],
  rules: {
    'jsonc/sort-keys': 'off',
  },
});
