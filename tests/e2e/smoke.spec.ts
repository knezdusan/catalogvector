import { expect, test } from "@playwright/test";

/**
 * Smoke test — staged for when the public results page exists (TDD §8: no
 * Playwright in Phase 1 until a public results page is built).
 *
 * When Cache Components routes land, use the `@next/playwright` `instant()`
 * helper to assert Instant Navigation regressions:
 *
 *   import { instant } from "@next/playwright";
 *   await instant(page, async () => {
 *     await page.click('a[href="/dataset"]');
 *     await expect(page.locator("h1")).toContainText("Dataset");
 *   });
 */
test.skip("public home renders (staged — no UI in Phase 1)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("CatalogVector");
});
