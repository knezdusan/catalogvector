/**
 * DIRECTIVE-13 §1 H7: Enumerate Subimods' full public catalog from /products.json
 * Paginate through all pages and save with key attributes.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface StoreProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string | string[];
  published_at: string;
  variants: Array<{ sku: string; price: string; available: boolean }>;
  images: Array<unknown>;
  options: Array<{ name: string }>;
  body_html: string;
}

let allProducts: StoreProduct[] = [];
let page = 0;

while (true) {
  page++;
  const cmd = `curl -sL "https://www.subimods.com/products.json?limit=250&page=${page}" 2>/dev/null > /tmp/subimods-page-${page}.json`;
  execSync(cmd, { timeout: 30000 });

  const raw = fs.readFileSync(`/tmp/subimods-page-${page}.json`, "utf8");
  const data = JSON.parse(raw);
  const products = data.products as StoreProduct[];

  if (products.length === 0) break;
  allProducts.push(...products);
  console.log(`Page ${page}: ${products.length} products (total: ${allProducts.length})`);

  if (products.length < 250) break;
  if (page > 20) break;
}

console.log(`\nTotal Subimods products in /products.json: ${allProducts.length}`);
console.log(`Unique IDs: ${new Set(allProducts.map((p) => p.id)).size}`);

// Clean and save with key attributes
const cleaned = allProducts.map((p) => ({
  id: p.id,
  title: p.title,
  handle: p.handle,
  vendor: p.vendor,
  product_type: p.product_type,
  tags: Array.isArray(p.tags) ? p.tags : String(p.tags).split(", "),
  published_at: p.published_at,
  variant_count: p.variants?.length || 0,
  variant_skus: p.variants?.map((v) => v.sku).filter(Boolean) || [],
  variant_prices: p.variants?.map((v) => parseFloat(v.price)) || [],
  image_count: p.images?.length || 0,
  option_names: p.options?.map((o) => o.name) || [],
  body_html_length: p.body_html?.length || 0,
}));

fs.writeFileSync("scripts/output/subimods-full-catalog.json", JSON.stringify(cleaned, null, 2));
console.log("Saved to scripts/output/subimods-full-catalog.json");

// Clean up temp files
for (let i = 1; i <= page; i++) {
  try { fs.unlinkSync(`/tmp/subimods-page-${i}.json`); } catch {}
}

// Summary stats
const vendors: Record<string, number> = {};
const types: Record<string, number> = {};
for (const p of cleaned) {
  vendors[p.vendor] = (vendors[p.vendor] || 0) + 1;
  types[p.product_type] = (types[p.product_type] || 0) + 1;
}

console.log("\nTop vendors:");
for (const [v, c] of Object.entries(vendors).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${v}: ${c}`);
}
console.log("\nTop product types:");
for (const [t, c] of Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${t}: ${c}`);
}
