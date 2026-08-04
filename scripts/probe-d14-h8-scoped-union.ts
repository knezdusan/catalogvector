/**
 * DIRECTIVE-14 §2 H8: Scoped search union for 3 stores, then check
 * Catalog handles not in /products.json by fetching the storefront URL.
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

function extractHandle(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/products\/([^?]+)/);
  return match ? match[1] : null;
}

function scopedSearchWithHandles(
  query: string,
  shopGid: string,
  sellerDomain: string,
  maxPages = 30,
): Map<string, string> {
  const results = new Map<string, string>();
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
      const products = (data.result?.products || []) as CatalogProduct[];
      const pagination = data.result?.pagination || {};

      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== sellerDomain) continue;
        const handle = extractHandle(p.variants?.[0]?.url);
        if (handle && !results.has(handle)) {
          results.set(handle, p.title);
        }
      }

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return results;
}

const stores = [
  {
    name: "subimods",
    domain: "www.subimods.com",
    shopGid: "gid://shopify/Shop/58735984815",
    sellerDomain: "subimods-com.myshopify.com",
    catalogFile: "scripts/output/subimods-full-catalog.json",
  },
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    shopGid: "gid://shopify/Shop/1357086779",
    sellerDomain: "two-step-performance.myshopify.com",
    catalogFile: "scripts/output/tsp-full-catalog.json",
  },
  {
    name: "map",
    domain: "www.maperformance.com",
    shopGid: "gid://shopify/Shop/8906136",
    sellerDomain: "modern-automotive-performance.myshopify.com",
    catalogFile: "scripts/output/map-full-catalog.json",
  },
];

const queries = [
  "subaru", "honda", "civic", "acura", "brake", "intake", "exhaust",
  "coilovers", "downpipe", "intercooler", "clutch", "flywheel",
  "wheels", "tires", "suspension", "engine", "turbo", "boost",
  "oil", "filter", "spark", "radiator", "charge pipe", "sway bar",
  "springs", "strut", "control arm", "rotors", "shifter", "fuel",
  "zxqv flurbin widget",
];

for (const store of stores) {
  console.log(`\n=== ${store.name.toUpperCase()} ===`);

  // Load store products
  const storeProducts = JSON.parse(fs.readFileSync(store.catalogFile, "utf8"));
  const storeHandles = new Set(storeProducts.map((p: any) => p.handle));
  console.log(`Store products: ${storeProducts.length}`);

  // Run scoped search union
  const catalogHandles = new Map<string, string>();
  for (const q of queries) {
    const products = scopedSearchWithHandles(q, store.shopGid, store.sellerDomain);
    for (const [handle, title] of products) {
      if (!catalogHandles.has(handle)) {
        catalogHandles.set(handle, title);
      }
    }
    process.stdout.write(".");
  }
  console.log(`\nCatalog handles recovered: ${catalogHandles.size}`);

  // Find Catalog handles NOT in store
  const catalogOnlyHandles: string[] = [];
  for (const handle of catalogHandles.keys()) {
    if (!storeHandles.has(handle)) {
      catalogOnlyHandles.push(handle);
    }
  }
  console.log(`Catalog handles NOT in /products.json: ${catalogOnlyHandles.length}`);

  // Save the catalog-only handles for this store
  fs.writeFileSync(
    `scripts/output/d14-h8-${store.name}-catalog-only.json`,
    JSON.stringify(
      catalogOnlyHandles.map((h) => ({ handle: h, title: catalogHandles.get(h) })),
      null,
      2,
    ),
  );
}

console.log("\n=== ALL STORES DONE ===");
