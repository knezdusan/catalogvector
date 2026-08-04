/**
 * DIRECTIVE-13 §1 H7: Membership test v2 — extract handles from variant URLs
 *
 * The Catalog products don't have a handle field, but variant URLs contain
 * the product handle: https://subimods.com/products/{handle}?variant=...
 *
 * Match by handle to get accurate membership.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface CatalogProduct {
  id: string;
  title: string;
  variants?: Array<{
    seller?: { domain: string; name: string };
    url?: string;
  }>;
}

const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";
const SUBIMODS_SELLER_DOMAIN = "subimods-com.myshopify.com";

function extractHandle(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/products\/([^?]+)/);
  return match ? match[1] : null;
}

function scopedSearchWithHandles(query: string, maxPages = 50): Map<string, CatalogProduct> {
  const results = new Map<string, CatalogProduct>();
  let cursor: string | undefined;
  let page = 0;

  while (page < maxPages) {
    page++;
    const setArgs = [
      `/query=${query.replace(/'/g, "'\\''")}`,
      `/filters/shops=["${SUBIMODS_SHOP_GID}"]`,
    ];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = (data.result?.products || []) as CatalogProduct[];
      const pagination = data.result?.pagination || {};

      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== SUBIMODS_SELLER_DOMAIN) continue;
        const handle = extractHandle(p.variants?.[0]?.url);
        if (handle && !results.has(handle)) {
          results.set(handle, p);
        }
      }

      if (page % 10 === 0) console.log(`  [${query}] page ${page}: ${results.size} unique handles`);

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return results;
}

// Load Subimods' full catalog
const fullCatalog = JSON.parse(fs.readFileSync("scripts/output/subimods-full-catalog.json", "utf8")) as Array<{
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  published_at: string;
  variant_count: number;
  variant_skus: string[];
  variant_prices: number[];
  image_count: number;
  option_names: string[];
  body_html_length: number;
}>;

const storeHandleMap = new Map<string, typeof fullCatalog[0]>();
for (const p of fullCatalog) {
  storeHandleMap.set(p.handle, p);
}

console.log(`Subimods /products.json: ${fullCatalog.length} products\n`);

// Run queries to build union of Catalog presence
const queries = [
  "subaru",
  "zxqv flurbin widget", // nonsense (U-4 fallback returns all)
  "COBB",
  "PRL Motorsports",
  "BC Racing",
  "IAG Performance",
  "Torque Solution",
  "Hardrace",
  "Clutch Masters",
  "Yokohama",
  "OLM",
  "oil filter",
  "brake pads",
  "coilovers",
  "exhaust",
  "intake",
  "downpipe",
  "tires",
  "wheels",
  "shifter",
  "suspension",
  "engine",
  "transmission",
  "radiator",
  "intercooler",
  "charge pipe",
  "boost control",
  "flywheel",
  "clutch",
  "headers",
  "catback",
  "springs",
  "strut",
  "control arm",
  "sway bar",
  "brake lines",
  "rotors",
  "spark plugs",
  "air filter",
  "fuel",
];

const catalogHandleMap = new Map<string, CatalogProduct>();

for (const q of queries) {
  console.log(`\nQuery: "${q}"`);
  const products = scopedSearchWithHandles(q);
  for (const [handle, p] of products) {
    if (!catalogHandleMap.has(handle)) {
      catalogHandleMap.set(handle, p);
    }
  }
  console.log(`  Found ${products.size} unique handles, union total: ${catalogHandleMap.size}`);
}

console.log(`\n=== UNION COMPLETE ===`);
console.log(`Total unique Subimods products in Catalog (by handle): ${catalogHandleMap.size}`);
console.log(`Total Subimods products in /products.json: ${fullCatalog.length}`);

// Match by handle
let matched = 0;
let notMatched = 0;
const matchedProducts: typeof fullCatalog = [];
const notMatchedProducts: typeof fullCatalog = [];

for (const p of fullCatalog) {
  if (catalogHandleMap.has(p.handle)) {
    matched++;
    matchedProducts.push(p);
  } else {
    notMatched++;
    notMatchedProducts.push(p);
  }
}

console.log(`\n=== MEMBERSHIP BY HANDLE ===`);
console.log(`Store products in Catalog: ${matched} (${(matched / fullCatalog.length * 100).toFixed(1)}%)`);
console.log(`Store products NOT in Catalog: ${notMatched} (${(notMatched / fullCatalog.length * 100).toFixed(1)}%)`);

// Check: Catalog handles not in store (deleted products)
let catalogOnlyCount = 0;
for (const handle of catalogHandleMap.keys()) {
  if (!storeHandleMap.has(handle)) catalogOnlyCount++;
}
console.log(`Catalog handles not in store (deleted/unpublished): ${catalogOnlyCount}`);

// Analyze the absent population
const absentVendors: Record<string, number> = {};
const absentTypes: Record<string, number> = {};
for (const p of notMatchedProducts) {
  absentVendors[p.vendor] = (absentVendors[p.vendor] || 0) + 1;
  absentTypes[p.product_type] = (absentTypes[p.product_type] || 0) + 1;
}

console.log(`\n=== ABSENT POPULATION BY VENDOR (top 15) ===`);
for (const [v, c] of Object.entries(absentVendors).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${v}: ${c}`);
}

console.log(`\n=== ABSENT POPULATION BY PRODUCT TYPE (top 15) ===`);
for (const [t, c] of Object.entries(absentTypes).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${t}: ${c}`);
}

// Save results
const output = {
  timestamp: new Date().toISOString(),
  directive: "DIRECTIVE-13 §1 H7",
  method: "Scoped search with filters.shops, extract handles from variant URLs, match to /products.json handles",
  totalStoreProducts: fullCatalog.length,
  totalCatalogHandles: catalogHandleMap.size,
  matchedStoreProducts: matched,
  absentStoreProducts: notMatched,
  presenceRate: matched / fullCatalog.length,
  catalogOnlyCount,
  absentVendors,
  absentTypes,
  matchedProducts: matchedProducts.map((p) => p.handle),
  absentProducts: notMatchedProducts.map((p) => ({
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    product_type: p.product_type,
    variant_skus: p.variant_skus,
    image_count: p.image_count,
    variant_count: p.variant_count,
    body_html_length: p.body_html_length,
    published_at: p.published_at,
    price_min: Math.min(...p.variant_prices),
    price_max: Math.max(...p.variant_prices),
  })),
};

fs.writeFileSync("scripts/output/subimods-membership-by-handle.json", JSON.stringify(output, null, 2));
console.log("\nSaved to scripts/output/subimods-membership-by-handle.json");
