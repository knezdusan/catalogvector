/**
 * DIRECTIVE-15 §5: Sitemap enumeration for 3 stores.
 *
 * Enumerate all products from /sitemap.xml → /sitemap_products_*.xml
 * for Subimods, TSP, and MAP. Three-way comparison:
 * sitemap products vs /products.json products vs Catalog handles.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { enumerateStoreFromSitemap, countProductsJson, compareEnumeration, type SitemapProduct } from "../src/lib/scanner/sitemap-enum";

const stores = [
  {
    name: "subimods",
    domain: "www.subimods.com",
    shopGid: "gid://shopify/Shop/58735984815",
    sellerDomain: "subimods-com.myshopify.com",
    productsJsonFile: "scripts/output/subimods-full-catalog.json",
  },
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    shopGid: "gid://shopify/Shop/1357086779",
    sellerDomain: "two-step-performance.myshopify.com",
    productsJsonFile: "scripts/output/tsp-full-catalog.json",
  },
  {
    name: "map",
    domain: "www.maperformance.com",
    shopGid: "gid://shopify/Shop/8906136",
    sellerDomain: "modern-automotive-performance.myshopify.com",
    productsJsonFile: "scripts/output/map-full-catalog.json",
  },
];

function extractHandle(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/products\/([^?]+)/);
  return match ? match[1] : null;
}

function scopedSearchHandles(query: string, shopGid: string, sellerDomain: string, maxPages = 30): Set<string> {
  const handles = new Set<string>();
  let cursor: string | undefined;
  let page = 0;

  while (page < maxPages) {
    page++;
    const setArgs = [
      `/query=${query.replace(/'/g, "'\\''")}`,
      `/filters/shops=["${shopGid}"]`,
    ];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.result?.products || [];
      const pagination = data.result?.pagination || {};

      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== sellerDomain) continue;
        const handle = extractHandle(p.variants?.[0]?.url);
        if (handle) handles.add(handle);
      }

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return handles;
}

const results: Array<any> = [];

for (const store of stores) {
  console.log(`\n=== ${store.name.toUpperCase()} ===`);

  // 1. Sitemap enumeration
  const sitemapProducts = enumerateStoreFromSitemap(store.domain);

  // 2. /products.json count (from saved file)
  const productsJsonData = JSON.parse(fs.readFileSync(store.productsJsonFile, "utf8"));
  const productsJsonHandles = new Set(productsJsonData.map((p: any) => p.handle));
  console.log(`  /products.json: ${productsJsonHandles.size} products`);

  // 3. Catalog handles (scoped search union — reuse existing data or run fresh)
  // For speed, use the existing catalog-only files from DIRECTIVE-14
  const catalogOnlyFile = `scripts/output/d14-h8-${store.name}-catalog-only.json`;
  let catalogHandles = new Set<string>();

  // We need the FULL catalog handle set, not just catalog-only
  // Run a quick scoped search union with a few queries
  console.log(`  Running scoped search union for Catalog handles...`);
  const queries = ["subaru", "honda", "civic", "brake", "intake", "exhaust", "coilovers", "zxqv flurbin widget"];
  for (const q of queries) {
    const handles = scopedSearchHandles(q, store.shopGid, store.sellerDomain);
    for (const h of handles) catalogHandles.add(h);
  }
  console.log(`  Catalog handles (partial union): ${catalogHandles.size}`);

  // 4. Three-way comparison
  const sitemapHandles = new Set(sitemapProducts.map((p) => p.handle));

  const sitemapAndProductsJson = [...sitemapHandles].filter((h) => productsJsonHandles.has(h)).length;
  const sitemapAndCatalog = [...sitemapHandles].filter((h) => catalogHandles.has(h)).length;
  const productsJsonAndCatalog = [...productsJsonHandles].filter((h) => catalogHandles.has(h)).length;

  const sitemapOnly = [...sitemapHandles].filter((h) => !productsJsonHandles.has(h) && !catalogHandles.has(h)).length;
  const productsJsonOnly = [...productsJsonHandles].filter((h) => !sitemapHandles.has(h) && !catalogHandles.has(h)).length;
  const catalogOnly = [...catalogHandles].filter((h) => !sitemapHandles.has(h) && !productsJsonHandles.has(h)).length;

  const allThree = [...sitemapHandles].filter((h) => productsJsonHandles.has(h) && catalogHandles.has(h)).length;

  const result = {
    store: store.name,
    domain: store.domain,
    sitemapCount: sitemapHandles.size,
    productsJsonCount: productsJsonHandles.size,
    catalogHandlesCount: catalogHandles.size,
    threeWayOverlap: allThree,
    sitemapAndProductsJson,
    sitemapAndCatalog,
    productsJsonAndCatalog,
    sitemapOnly,
    productsJsonOnly,
    catalogOnly,
    sitemapVsProductsJsonShortfall: sitemapHandles.size - productsJsonHandles.size,
    exhaustiveSource: sitemapHandles.size >= productsJsonHandles.size ? "sitemap" : "products.json",
  };

  console.log(`\n  Three-way comparison:`);
  console.log(`    Sitemap: ${result.sitemapCount}`);
  console.log(`    /products.json: ${result.productsJsonCount}`);
  console.log(`    Catalog (partial): ${result.catalogHandlesCount}`);
  console.log(`    All three: ${result.threeWayOverlap}`);
  console.log(`    Sitemap ∩ /products.json: ${result.sitemapAndProductsJson}`);
  console.log(`    Sitemap ∩ Catalog: ${result.sitemapAndCatalog}`);
  console.log(`    /products.json ∩ Catalog: ${result.productsJsonAndCatalog}`);
  console.log(`    Sitemap only: ${result.sitemapOnly}`);
  console.log(`    /products.json only: ${result.productsJsonOnly}`);
  console.log(`    Catalog only: ${result.catalogOnly}`);
  console.log(`    /products.json shortfall vs sitemap: ${result.sitemapVsProductsJsonShortfall}`);
  console.log(`    Exhaustive source: ${result.exhaustiveSource}`);

  results.push(result);

  // Save sitemap products
  fs.writeFileSync(`scripts/output/d15-sitemap-${store.name}.json`, JSON.stringify(sitemapProducts, null, 2));
}

// Save summary
fs.writeFileSync("scripts/output/d15-sitemap-enumeration.json", JSON.stringify(results, null, 2));
console.log("\n=== SUMMARY ===");
console.log("Store | Sitemap | /products.json | Shortfall | Exhaustive source");
for (const r of results) {
  console.log(`${r.store} | ${r.sitemapCount} | ${r.productsJsonCount} | ${r.sitemapVsProductsJsonShortfall} | ${r.exhaustiveSource}`);
}
console.log("\nSaved to scripts/output/d15-sitemap-enumeration.json");
