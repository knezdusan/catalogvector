/**
 * DIRECTIVE-13 §1 H7: Membership test — determine which Subimods products
 * are in the Shopify Catalog.
 *
 * METHOD PROPOSAL (per directive §1.3):
 *   Use scoped search with filters.shops to enumerate Subimods' Catalog presence.
 *   Run multiple queries (broad + per-vendor) and take the UNION of results.
 *   Each result carries seller.domain, so we can verify the product is from Subimods.
 *
 * FALSE POSITIVE BEHAVIOR:
 *   - A scoped search may return products from other sellers if the shops filter
 *     is not strictly enforced. Mitigation: filter results by seller.domain === "subimods-com.myshopify.com"
 *   - Different queries may return the same product with different IDs (unlikely but possible).
 *     Mitigation: deduplicate by product ID.
 *
 * FALSE NEGATIVE BEHAVIOR:
 *   - A query that doesn't match a product's indexed text won't return it.
 *     Mitigation: use multiple broad queries covering all major vendors and product types.
 *   - Products with very generic titles may not be returned by specific queries.
 *     Mitigation: include a nonsense query (U-4 fallback returns all store's Catalog products).
 *
 * VALIDATION:
 *   - Hand-verify 20 products confirmed present (from Catalog search results)
 *   - Hand-verify 20 products confirmed absent (from /products.json but not in any Catalog search)
 *   - Report false positive and false negative rates
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface CatalogProduct {
  id: string;
  title: string;
  variants?: Array<{ seller?: { domain: string; name: string } }>;
}

const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";
const SUBIMODS_SELLER_DOMAIN = "subimods-com.myshopify.com";

function scopedSearch(query: string, maxPages = 50): CatalogProduct[] {
  const all: CatalogProduct[] = [];
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

      // Filter to only Subimods products
      const subimodsProducts = products.filter(
        (p) => p.variants?.[0]?.seller?.domain === SUBIMODS_SELLER_DOMAIN,
      );

      all.push(...subimodsProducts);
      if (page % 10 === 0) console.log(`  [${query}] page ${page}: ${all.length} Subimods products`);

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return all;
}

// Load Subimods' full catalog
const fullCatalog = JSON.parse(fs.readFileSync("scripts/output/subimods-full-catalog.json", "utf8"));
console.log(`Subimods /products.json: ${fullCatalog.length} products\n`);

// Run multiple queries to build union of Catalog presence
const queries = [
  "subaru", // broad
  "zxqv flurbin widget", // nonsense (U-4 fallback)
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

const catalogProductMap = new Map<string, CatalogProduct>();

for (const q of queries) {
  console.log(`\nQuery: "${q}"`);
  const products = scopedSearch(q);
  for (const p of products) {
    if (!catalogProductMap.has(p.id)) {
      catalogProductMap.set(p.id, p);
    }
  }
  console.log(`  Found ${products.length} Subimods products, union total: ${catalogProductMap.size}`);
}

console.log(`\n=== UNION COMPLETE ===`);
console.log(`Total unique Subimods products in Catalog: ${catalogProductMap.size}`);
console.log(`Total Subimods products in /products.json: ${fullCatalog.length}`);
console.log(`Catalog presence rate: ${(catalogProductMap.size / fullCatalog.length * 100).toFixed(1)}%`);
console.log(`Absent population: ${fullCatalog.length - catalogProductMap.size} (${((fullCatalog.length - catalogProductMap.size) / fullCatalog.length * 100).toFixed(1)}%)`);

// Save the Catalog product IDs and titles
const catalogProducts = [...catalogProductMap.values()].map((p) => ({
  id: p.id,
  title: p.title,
}));
fs.writeFileSync("scripts/output/subimods-catalog-membership.json", JSON.stringify({
  totalStoreProducts: fullCatalog.length,
  totalCatalogProducts: catalogProductMap.size,
  absentCount: fullCatalog.length - catalogProductMap.size,
  presenceRate: catalogProductMap.size / fullCatalog.length,
  catalogProducts,
}, null, 2));

console.log("\nSaved to scripts/output/subimods-catalog-membership.json");
