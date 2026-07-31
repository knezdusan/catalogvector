import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for CatalogVector.
 *
 * Phase 1 has no UI to test (TDD §8). This config is staged for when the public
 * results page is built. The `@next/playwright` `instant()` helper is available
 * for asserting Instant Navigation regressions on Cache Components routes.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
