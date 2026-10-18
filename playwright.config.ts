import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the *built* site served by `astro preview`, not the dev
 * server, because CSP hashes, inlined styles and image optimisation only exist
 * in the production output. That is what we want to assert on.
 */
const PORT = 4173;

/**
 * Optional: run against an installed browser (`PLAYWRIGHT_CHANNEL=chrome`) when
 * `playwright install` cannot download one, e.g. behind a TLS-intercepting proxy.
 * CI leaves it unset and uses the bundled Chromium.
 */
const requestedChannel = process.env.PLAYWRIGHT_CHANNEL?.trim();
const channel = requestedChannel === '' ? undefined : requestedChannel;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: {
    // `--ignore-lock` keeps the server in the foreground. Astro 7 otherwise backgrounds
    // `preview` when it detects a coding agent, and Playwright would see the process exit.
    command: `npm run preview -- --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
