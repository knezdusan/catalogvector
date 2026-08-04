/**
 * DIRECTIVE-14 §2 H8: Fetch /products.json for TSP and MAP
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

async function fetchStoreCatalog(domain: string, name: string) {
  const allProducts: any[] = [];
  let page = 0;

  while (true) {
    page++;
    const cmd = `curl -sL "https://${domain}/products.json?limit=250&page=${page}" 2>/dev/null > /tmp/${name}-page-${page}.json`;
    execSync(cmd, { timeout: 30000 });

    const raw = fs.readFileSync(`/tmp/${name}-page-${page}.json`, "utf8");
    const data = JSON.parse(raw);
    const products = data.products;

    if (products.length === 0) break;
    allProducts.push(...products);
    console.log(`${name} page ${page}: ${products.length} products (total: ${allProducts.length})`);

    if (products.length < 250) break;
    if (page > 30) break;
  }

  const cleaned = allProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    vendor: p.vendor,
    product_type: p.product_type,
    published_at: p.published_at,
    variant_count: p.variants?.length || 0,
    variant_skus: p.variants?.map((v: any) => v.sku).filter(Boolean) || [],
    variant_prices: p.variants?.map((v: any) => parseFloat(v.price)) || [],
    image_count: p.images?.length || 0,
  }));

  fs.writeFileSync(`scripts/output/${name}-full-catalog.json`, JSON.stringify(cleaned, null, 2));
  console.log(`\n${name}: ${cleaned.length} products saved to scripts/output/${name}-full-catalog.json`);

  // Clean up temp files
  for (let i = 1; i <= page; i++) {
    try { fs.unlinkSync(`/tmp/${name}-page-${i}.json`); } catch {}
  }

  return cleaned;
}

fetchStoreCatalog("www.twostepperformance.com", "tsp");
console.log("\n---\n");
fetchStoreCatalog("www.maperformance.com", "map");
