import { defineConfig } from 'vitest/config';

/**
 * Unit tests target the framework-free domain layer, so plain Vitest is enough.
 * Browser-level checks (a11y, SEO, CSP) live in tests/e2e with Playwright.
 */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/seo/**/*.ts'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
