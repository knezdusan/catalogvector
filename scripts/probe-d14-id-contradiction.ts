/**
 * DIRECTIVE-14 §1 BLOCKING: Print product.id and variants[].seller.domain
 * side by side for one query's 300 rows. Report exact JSON paths.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";

interface CatalogProduct {
  id: string;
  title: string;
  variants: Array<{
    seller?: { domain: string; name: string };
    url?: string;
  }>;
}

function searchAll(query: string, maxProducts = 300): CatalogProduct[] {
  const all: CatalogProduct[] = [];
  let cursor: string | undefined;
  let page = 0;

  while (all.length < maxProducts) {
    page++;
    const setArgs = [`/query=${query.replace(/'/g, "'\\''")}`];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = (data.result?.products || []) as CatalogProduct[];
      const pagination = data.result?.pagination || {};

      if (products.length === 0) break;
      all.push(...products);

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return all.slice(0, maxProducts);
}

const query = "brake pads for 2018 Honda Civic Si";
console.log(`Fetching 300 products for: "${query}"\n`);

const products = searchAll(query, 300);
console.log(`Fetched ${products.length} products\n`);

// Print product.id and variants[].seller.domain side by side
console.log("=== product.id × variants[0].seller.domain (first 50 rows) ===");
console.log("JSON paths: product.id = result.products[].id, seller.domain = result.products[].variants[0].seller.domain");
console.log("");
for (let i = 0; i < Math.min(50, products.length); i++) {
  const p = products[i];
  const sellerDomain = p.variants?.[0]?.seller?.domain || "MISSING";
  const sellerName = p.variants?.[0]?.seller?.name || "MISSING";
  console.log(`Row ${i}: id=${p.id} | seller.domain=${sellerDomain} | seller.name=${sellerName} | title=${p.title?.substring(0, 50)}`);
}

// Count distinct product IDs
const idSet = new Set(products.map((p) => p.id));
console.log(`\nTotal rows: ${products.length}`);
console.log(`Distinct product IDs: ${idSet.size}`);

// For each distinct product ID, list all seller domains
console.log("\n=== Distinct product IDs with their seller domains ===");
const idToSellers = new Map<string, string[]>();
for (const p of products) {
  const sellers = idToSellers.get(p.id) || [];
  const domain = p.variants?.[0]?.seller?.domain || "MISSING";
  if (!sellers.includes(domain)) sellers.push(domain);
  idToSellers.set(p.id, sellers);
}

for (const [id, sellers] of idToSellers) {
  const count = products.filter((p) => p.id === id).length;
  console.log(`\n${id} (${count} rows):`);
  for (const s of sellers) {
    const sellerCount = products.filter((p) => p.id === id && p.variants?.[0]?.seller?.domain === s).length;
    console.log(`  ${s}: ${sellerCount} rows`);
  }
}

// Check: does any product have >1 variant?
const multiVariant = products.filter((p) => p.variants && p.variants.length > 1);
console.log(`\nProducts with >1 variant: ${multiVariant.length}`);

// Check: does any product have >1 distinct seller across its variants?
const multiSeller = products.filter((p) => {
  const sellers = new Set(p.variants?.map((v) => v.seller?.domain) || []);
  return sellers.size > 1;
});
console.log(`Products with >1 distinct seller (across variants): ${multiSeller.length}`);

// Key question: are the same product IDs coming from different sellers?
console.log("\n=== KEY QUESTION: Same product ID from different sellers? ===");
let sharedIdAcrossSellers = 0;
for (const [id, sellers] of idToSellers) {
  if (sellers.length > 1) {
    sharedIdAcrossSellers++;
    console.log(`SHARED: ${id} from ${sellers.length} sellers: ${sellers.join(", ")}`);
  }
}
console.log(`\nProduct IDs shared across multiple sellers: ${sharedIdAcrossSellers}`);
console.log(`Product IDs from a single seller: ${idSet.size - sharedIdAcrossSellers}`);

// Save full data
const output = {
  query,
  totalRows: products.length,
  distinctProductIds: idSet.size,
  productsWithMultipleVariants: multiVariant.length,
  productsWithMultipleSellers: multiSeller.length,
  sharedIdAcrossSellers,
  jsonPaths: {
    productId: "result.products[].id",
    sellerDomain: "result.products[].variants[0].seller.domain",
    sellerName: "result.products[].variants[0].seller.name",
  },
  rows: products.map((p, i) => ({
    row: i,
    productId: p.id,
    title: p.title,
    sellerDomain: p.variants?.[0]?.seller?.domain || "MISSING",
    sellerName: p.variants?.[0]?.seller?.name || "MISSING",
    variantCount: p.variants?.length || 0,
    variantUrl: p.variants?.[0]?.url || "MISSING",
  })),
  distinctIdsWithSellers: [...idToSellers.entries()].map(([id, sellers]) => ({
    id,
    rowCount: products.filter((p) => p.id === id).length,
    sellers,
  })),
};

fs.writeFileSync("scripts/output/d14-id-contradiction.json", JSON.stringify(output, null, 2));
console.log("\nSaved to scripts/output/d14-id-contradiction.json");
