import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Flat config. Type-aware rules are enabled for the TypeScript sources that
 * matter (domain, seo, scripts, tests); Astro templates get the plugin's
 * recommended + a11y rule sets.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  // Plain JS config files are not part of the TS project.
  {
    files: ['*.js', '*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Astro components: template linting + a11y. Type-aware rules do not apply to .astro.
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-strict'],
  {
    files: ['**/*.astro'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      // Safari drops list semantics when `list-style: none` is set; an explicit role restores them.
      'astro/jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      // A horizontally scrolling region must be focusable so keyboard users can scroll it (axe: scrollable-region-focusable).
      'astro/jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'] }],
    },
  },

  // Tests assert on fixtures they control; `!` is clearer than defensive branching there.
  {
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },

  // CLI scripts are meant to print.
  {
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },

  prettier,
);
