/**
 * DIRECTIVE-16 §2: Re-fetch /products.json with full instrumentation.
 *
 * The prior fetch loop may have broken early on a page boundary (timeout,
 * rate limit, or unhandled error) rather than Shopify capping the endpoint.
 * Both shortfall stores terminated on exact multiples of 250.
 *
 * This script:
 *   - Asserts every page returns exactly 250 until a short page terminates
 *   - Logs every HTTP status and every retry
 *   - Reports the terminating page size
 *   - Retries on failure with exponential backoff
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface PageLog {
  page: number;
  httpStatus: number;
  productCount: number;
  expectedCount: number;
  isFullPage: boolean;
  isTerminal: boolean;
  retryCount: number;
  responseSize: number;
  timestamp: string;
}

interface StoreResult {
  store: string;
  domain: string;
  totalProducts: number;
  totalPages: number;
  terminatingPageSize: number;
  terminatedOnBoundary: boolean;
  pageLogs: PageLog[];
  allHandles: string[];
  error: string | null;
}

function fetchPage(domain: string, page: number, maxRetries = 3): { status: number; body: string; retries: number } {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const url = `https://${domain}/products.json?limit=250&page=${page}`;
      const res = fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CatalogVector/1.0)" },
        signal: AbortSignal.timeout(45000),
      });

      // fetch is synchronous in Node 22+ with --experimental-fetch, but we need to await
      // Actually, use execSync with curl writing to a temp file to avoid ENOBUFS
      const tmpFile = `/tmp/d16-page-${page}.json`;
      const cmd = `curl -sL -w "%{http_code}" -o "${tmpFile}" "https://${domain}/products.json?limit=250&page=${page}" 2>/dev/null`;
      const statusOutput = execSync(cmd, { timeout: 45000, encoding: "utf8" }).trim();
      const status = parseInt(statusOutput, 10);

      if (status === 200) {
        const body = fs.readFileSync(tmpFile, "utf8");
        return { status, body, retries };
      }

      if (status === 429) {
        retries++;
        const waitMs = 1000 * retries * retries;
        console.log(`    429 on page ${page}, retry ${retries}/${maxRetries} after ${waitMs}ms`);
        execSync(`sleep ${Math.ceil(waitMs / 1000)}`);
        continue;
      }

      return { status, body: "", retries };
    } catch (e) {
      retries++;
      const waitMs = 1000 * retries * retries;
      console.log(`    Error on page ${page}: ${e}, retry ${retries}/${maxRetries} after ${waitMs}ms`);
      execSync(`sleep ${Math.ceil(waitMs / 1000)}`);
    }
  }

  return { status: 0, body: "", retries };
}

function fetchStoreProducts(domain: string, storeName: string): StoreResult {
  console.log(`\n=== ${storeName.toUpperCase()} (${domain}) ===`);

  const allProducts: Array<{ id: number; handle: string; title: string }> = [];
  const pageLogs: PageLog[] = [];
  let page = 0;
  let error: string | null = null;

  while (page < 500) {
    page++;
    const result = fetchPage(domain, page);
    const timestamp = new Date().toISOString();

    let productCount = 0;
    let responseSize = result.body.length;

    if (result.status === 200 && result.body) {
      try {
        const data = JSON.parse(result.body);
        const products = (data.products || []) as Array<{ id: number; handle: string; title: string }>;
        productCount = products.length;

        for (const p of products) {
          allProducts.push(p);
        }
      } catch (e) {
        error = `JSON parse error on page ${page}: ${e}`;
        console.log(`  Page ${page}: PARSE ERROR — ${error}`);
        pageLogs.push({
          page, httpStatus: result.status, productCount: 0, expectedCount: 250,
          isFullPage: false, isTerminal: false, retryCount: result.retries,
          responseSize, timestamp,
        });
        break;
      }
    }

    const isFullPage = productCount === 250;
    const isTerminal = productCount < 250 || result.status !== 200;

    pageLogs.push({
      page,
      httpStatus: result.status,
      productCount,
      expectedCount: 250,
      isFullPage,
      isTerminal,
      retryCount: result.retries,
      responseSize,
      timestamp,
    });

    console.log(
      `  Page ${page}: HTTP ${result.status}, ${productCount} products ` +
        `(full: ${isFullPage}, terminal: ${isTerminal}, retries: ${result.retries})`,
    );

    // Assert: every non-terminal page must return exactly 250
    if (result.status === 200 && !isTerminal && !isFullPage) {
      error = `Page ${page} returned ${productCount} products (expected 250) but was not terminal. Possible fetch bug.`;
      console.log(`  *** ASSERTION FAILED: ${error}`);
      break;
    }

    if (isTerminal) {
      if (result.status !== 200) {
        error = `Page ${page} returned HTTP ${result.status}. Fetch stopped.`;
        console.log(`  *** FETCH STOPPED: ${error}`);
      } else {
        console.log(`  Terminal page: ${productCount} products (boundary: ${productCount === 0})`);
      }
      break;
    }
  }

  const totalPages = pageLogs.length;
  const terminatingPageSize = pageLogs.length > 0 ? pageLogs[pageLogs.length - 1].productCount : 0;
  const terminatedOnBoundary = terminatingPageSize === 250 || terminatingPageSize === 0;

  console.log(`\n  Total products: ${allProducts.length}`);
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Terminating page size: ${terminatingPageSize}`);
  console.log(`  Terminated on boundary: ${terminatedOnBoundary}`);
  console.log(`  Error: ${error || "none"}`);

  return {
    store: storeName,
    domain,
    totalProducts: allProducts.length,
    totalPages,
    terminatingPageSize,
    terminatedOnBoundary,
    pageLogs,
    allHandles: allProducts.map((p) => p.handle),
    error,
  };
}

// ─── Sitemap verification ──────────────────────────────────────────────────

function verifySitemap(storeName: string): {
  totalUrls: number;
  uniqueUrls: number;
  uniqueHandles: number;
  duplicateUrls: number;
  duplicateHandles: number;
  nonProductUrls: number;
} {
  const sitemapData = JSON.parse(
    fs.readFileSync(`scripts/output/d15-sitemap-${storeName}.json`, "utf8"),
  ) as Array<{ handle: string; url: string }>;

  const allUrls = sitemapData.map((p) => p.url);
  const allHandles = sitemapData.map((p) => p.handle);
  const uniqueUrls = new Set(allUrls);
  const uniqueHandles = new Set(allHandles);
  const nonProductUrls = allUrls.filter((u) => !u.includes("/products/")).length;

  return {
    totalUrls: allUrls.length,
    uniqueUrls: uniqueUrls.size,
    uniqueHandles: uniqueHandles.size,
    duplicateUrls: allUrls.length - uniqueUrls.size,
    duplicateHandles: allHandles.length - uniqueHandles.size,
    nonProductUrls,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("DIRECTIVE-16 §2: /products.json re-fetch with full instrumentation\n");

const stores = [
  { name: "subimods", domain: "www.subimods.com" },
  { name: "tsp", domain: "www.twostepperformance.com" },
  { name: "map", domain: "www.maperformance.com" },
];

const results: StoreResult[] = [];

for (const store of stores) {
  const result = fetchStoreProducts(store.domain, store.name);
  results.push(result);

  // Save the full product list
  fs.writeFileSync(
    `scripts/output/d16-products-json-${store.name}.json`,
    JSON.stringify(result, null, 2),
  );
}

// Sitemap verification
console.log("\n=== SITEMAP VERIFICATION ===\n");
for (const store of stores) {
  const v = verifySitemap(store.name);
  console.log(`${store.name}:`);
  console.log(`  Total URLs: ${v.totalUrls}`);
  console.log(`  Unique URLs: ${v.uniqueUrls}`);
  console.log(`  Unique handles: ${v.uniqueHandles}`);
  console.log(`  Duplicate URLs: ${v.duplicateUrls}`);
  console.log(`  Duplicate handles: ${v.duplicateHandles}`);
  console.log(`  Non-product URLs: ${v.nonProductUrls}`);
}

// Summary
console.log("\n=== SUMMARY ===\n");
console.log("Store | /products.json (new) | /products.json (old) | Pages | Terminating size | On boundary | Error");
for (const r of results) {
  const oldCounts: Record<string, number> = { subimods: 5250, tsp: 2608, map: 7750 };
  console.log(
    `${r.store} | ${r.totalProducts} | ${oldCounts[r.store]} | ${r.totalPages} | ${r.terminatingPageSize} | ${r.terminatedOnBoundary} | ${r.error || "none"}`,
  );
}

fs.writeFileSync("scripts/output/d16-products-json-refetch.json", JSON.stringify(results, null, 2));
console.log("\nSaved to scripts/output/d16-products-json-refetch.json");
