/**
 * DIRECTIVE-8-v2 §5 — Store-level visibility
 *
 * 5.1: Diagnose Intec Racing — brand+SKU queries vs natural-language
 * 5.2: 10-store scan — 5 natural-language + 5 brand/SKU per store
 *
 * Descriptive only. No hypothesis, no threshold.
 */

import { mkdir, read, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const PAGE_SIZE = 50;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.shopify.com/auth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CatalogProduct {
  id: string;
  title: string;
  variants?: Array<{ url?: string; seller?: { id?: string } }>;
}

interface StoreProduct {
  handle: string;
  title: string;
  domain: string;
  brand: string;
  sku: string;
}

// Extract brand and SKU from product title/handle
function extractBrandAndSku(
  title: string,
  handle: string,
): { brand: string; sku: string } {
  // Try to extract a brand name (first 1-3 words that look like a brand)
  const titleParts = title.split(/\s+/);
  const brand = titleParts.slice(0, 2).join(" ");

  // Try to extract a SKU/part number from the handle
  // SKUs are often at the end of handles like "-krfd17stage2fox" or "-z23-evolution"
  const skuMatch = handle.match(/-([a-z]{2,5}[\d]+)/);
  const sku = skuMatch ? skuMatch[1].toUpperCase() : "";

  return { brand, sku };
}

// Get products from a store via scoped query
async function getStoreProducts(
  token: string,
  gid: string,
  domain: string,
  count: number,
): Promise<StoreProduct[]> {
  let cursor: string | null = null;
  const products: StoreProduct[] = [];
  let hasNextPage = true;
  let pages = 0;

  while (hasNextPage && pages < 10 && products.length < count) {
    const pagination: { limit: number; cursor?: string } = { limit: PAGE_SIZE };
    if (cursor) pagination.cursor = cursor;

    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: {
            "ucp-agent": { profile: process.env.UCP_AGENT_PROFILE_URL! },
          },
          catalog: {
            query: "auto parts",
            filters: { available: true, shops: [gid] },
            pagination,
          },
        },
      },
    };
    const res = await fetch(CATALOG_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const raw = await res.json();
    await sleep(RATE_LIMIT_MS);
    const sc = raw?.result?.structuredContent;
    const pageProducts = (sc?.products ?? []) as CatalogProduct[];
    hasNextPage = sc?.pagination?.has_next_page ?? false;
    cursor = sc?.pagination?.cursor ?? null;
    pages++;

    for (const p of pageProducts) {
      if (products.length >= count) break;
      const url = p.variants?.[0]?.url ?? "";
      const handle = (url.match(/\/products\/([^?]+)/) || [])[1] ?? "";
      const { brand, sku } = extractBrandAndSku(p.title, handle);
      products.push({ handle, title: p.title, domain, brand, sku });
    }
  }
  return products;
}

// Check if any product from a given domain appears in the top N results
async function checkStorePresence(
  token: string,
  query: string,
  domain: string,
  topN: number,
): Promise<{ present: boolean; rank: number | null; productCount: number }> {
  let cursor: string | null = null;
  let rank = 0;
  let hasNextPage = true;
  let pages = 0;
  let productCount = 0;

  while (hasNextPage && pages < 10) {
    const pagination: { limit: number; cursor?: string } = { limit: PAGE_SIZE };
    if (cursor) pagination.cursor = cursor;

    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: {
            "ucp-agent": { profile: process.env.UCP_AGENT_PROFILE_URL! },
          },
          catalog: {
            query,
            filters: { available: true },
            pagination,
          },
        },
      },
    };
    const res = await fetch(CATALOG_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const raw = await res.json();
    await sleep(RATE_LIMIT_MS);
    const sc = raw?.result?.structuredContent;
    const products = (sc?.products ?? []) as CatalogProduct[];
    hasNextPage = sc?.pagination?.has_next_page ?? false;
    cursor = sc?.pagination?.cursor ?? null;
    pages++;

    for (const p of products) {
      rank++;
      productCount++;
      const url = p.variants?.[0]?.url ?? "";
      const d = (url.match(/^https?:\/\/([^/]+)/) || [])[1] ?? "";
      if (d === domain) {
        return { present: true, rank, productCount };
      }
    }
  }
  return { present: false, rank: null, productCount };
}

// Derive 5 natural-language queries from store products
function deriveNaturalLanguageQueries(products: StoreProduct[]): string[] {
  const queries: string[] = [];
  for (const p of products.slice(0, 5)) {
    // Use the product title as a natural-language query
    // Truncate to first 6-8 words for a natural query
    const words = p.title.split(/\s+/).slice(0, 8);
    queries.push(words.join(" "));
  }
  return queries;
}

// Derive 5 brand+SKU queries from store products
function deriveBrandSkuQueries(products: StoreProduct[]): string[] {
  const queries: string[] = [];
  for (const p of products.slice(0, 5)) {
    if (p.sku) {
      queries.push(`${p.brand} ${p.sku}`);
    } else {
      // Fallback: use brand + first significant word from handle
      const handleWords = p.handle.split("-").filter((w) => w.length > 2);
      queries.push(`${p.brand} ${handleWords[0] ?? ""}`.trim());
    }
  }
  return queries;
}

const STORES = [
  {
    name: "TSP",
    domain: "www.twostepperformance.com",
    gid: "gid://shopify/Shop/1357086779",
  },
  {
    name: "MAP",
    domain: "www.maperformance.com",
    gid: "gid://shopify/Shop/8906136",
  },
  {
    name: "Intec",
    domain: "www.intecracing.com",
    gid: "gid://shopify/Shop/56215076911",
  },
  {
    name: "Subimods",
    domain: "www.subimods.com",
    gid: "gid://shopify/Shop/58735984815",
  },
  {
    name: "Springrates",
    domain: "www.springrates.com",
    gid: "gid://shopify/Shop/2183",
  },
  {
    name: "BremboStore",
    domain: "www.brembostore.com",
    gid: "gid://shopify/Shop/87629234525",
  },
  {
    name: "UnityPerf",
    domain: "unity-performance.com",
    gid: "gid://shopify/Shop/6900809818",
  },
  {
    name: "EBCBrakeShop",
    domain: "www.ebcbrakeshop.co.uk",
    gid: "gid://shopify/Shop/91454210339",
  },
  {
    name: "Valvetronic",
    domain: "valvetronic.com",
    gid: "gid://shopify/Shop/8669986875",
  },
  {
    name: "JDMuscle",
    domain: "jdmuscleusa.com",
    gid: "gid://shopify/Shop/7587037237",
  },
];

async function main() {
  console.log("\nDIRECTIVE-8-v2 §5 — STORE-LEVEL VISIBILITY");
  console.log("═".repeat(66));
  console.log("§5.1: Intec Racing diagnosis");
  console.log("§5.2: 10-store scan (5 NL + 5 brand/SKU per store)");
  console.log();

  const token = await getAccessToken();

  const results: Array<{
    store: string;
    domain: string;
    gid: string;
    products: StoreProduct[];
    naturalLanguageQueries: string[];
    brandSkuQueries: string[];
    naturalLanguageResults: Array<{
      query: string;
      present: boolean;
      rank: number | null;
      productCount: number;
    }>;
    brandSkuResults: Array<{
      query: string;
      present: boolean;
      rank: number | null;
      productCount: number;
    }>;
    nlPresenceRate: number;
    bsPresenceRate: number;
  }> = [];

  for (const store of STORES) {
    console.log(`\n--- ${store.name} (${store.domain}) ---`);

    // Get 5 products from this store
    const products = await getStoreProducts(token, store.gid, store.domain, 5);
    console.log(`  Found ${products.length} products from scoped query`);
    for (const p of products) {
      console.log(
        `    ${p.title.substring(0, 60)} — brand="${p.brand}" sku="${p.sku}"`,
      );
    }

    if (products.length === 0) {
      console.log(
        `  NO PRODUCTS FOUND — store may not be enrolled or query too narrow`,
      );
      results.push({
        store: store.name,
        domain: store.domain,
        gid: store.gid,
        products: [],
        naturalLanguageQueries: [],
        brandSkuQueries: [],
        naturalLanguageResults: [],
        brandSkuResults: [],
        nlPresenceRate: 0,
        bsPresenceRate: 0,
      });
      continue;
    }

    // Derive queries
    const nlQueries = deriveNaturalLanguageQueries(products);
    const bsQueries = deriveBrandSkuQueries(products);

    console.log(`  NL queries: ${nlQueries.map((q) => `"${q}"`).join(", ")}`);
    console.log(`  BS queries: ${bsQueries.map((q) => `"${q}"`).join(", ")}`);

    // Check presence for each NL query (unscoped, top 300)
    const nlResults: Array<{
      query: string;
      present: boolean;
      rank: number | null;
      productCount: number;
    }> = [];
    for (const q of nlQueries) {
      const result = await checkStorePresence(token, q, store.domain, 300);
      nlResults.push({ query: q, ...result });
      console.log(
        `  NL: "${q.substring(0, 50)}" → ${result.present ? `rank ${result.rank}` : "ABSENT"} (${result.productCount} products)`,
      );
    }

    // Check presence for each brand/SKU query
    const bsResults: Array<{
      query: string;
      present: boolean;
      rank: number | null;
      productCount: number;
    }> = [];
    for (const q of bsQueries) {
      const result = await checkStorePresence(token, q, store.domain, 300);
      bsResults.push({ query: q, ...result });
      console.log(
        `  BS: "${q.substring(0, 50)}" → ${result.present ? `rank ${result.rank}` : "ABSENT"} (${result.productCount} products)`,
      );
    }

    const nlPresent = nlResults.filter((r) => r.present).length;
    const bsPresent = bsResults.filter((r) => r.present).length;
    const nlRate = nlResults.length > 0 ? nlPresent / nlResults.length : 0;
    const bsRate = bsResults.length > 0 ? bsPresent / bsResults.length : 0;

    console.log(
      `  NL presence rate: ${nlPresent}/${nlResults.length} = ${nlRate.toFixed(3)}`,
    );
    console.log(
      `  BS presence rate: ${bsPresent}/${bsResults.length} = ${bsRate.toFixed(3)}`,
    );

    results.push({
      store: store.name,
      domain: store.domain,
      gid: store.gid,
      products,
      naturalLanguageQueries: nlQueries,
      brandSkuQueries: bsQueries,
      naturalLanguageResults: nlResults,
      brandSkuResults: bsResults,
      nlPresenceRate: nlRate,
      bsPresenceRate: bsRate,
    });
  }

  // ── Summary table ──
  console.log("\n" + "═".repeat(66));
  console.log("STORE-LEVEL VISIBILITY SUMMARY");
  console.log("═".repeat(66));
  console.log(
    `{"Store":<15} {"Domain":<35} {"NL rate":<10} {"BS rate":<10} {"NL present":<12} {"BS present":<12}`,
  );
  console.log("-".repeat(100));
  for (const r of results) {
    const nlPresent = r.naturalLanguageResults.filter((x) => x.present).length;
    const bsPresent = r.brandSkuResults.filter((x) => x.present).length;
    const nlStr = `${nlPresent}/${r.naturalLanguageResults.length}`;
    const bsStr = `${bsPresent}/${r.brandSkuResults.length}`;
    console.log(
      `${r.store.padEnd(15)} ${r.domain.padEnd(35)} ${r.nlPresenceRate.toFixed(3).padEnd(10)} ${r.bsPresenceRate.toFixed(3).padEnd(10)} ${nlStr.padEnd(12)} ${bsStr.padEnd(12)}`,
    );
  }

  // ── Intec diagnosis ──
  console.log("\n" + "═".repeat(66));
  console.log("INTEC RACING DIAGNOSIS (§5.1)");
  console.log("═".repeat(66));
  const intec = results.find((r) => r.store === "Intec");
  if (intec) {
    console.log(`Products found: ${intec.products.length}`);
    console.log(`NL presence rate: ${intec.nlPresenceRate.toFixed(3)}`);
    console.log(`BS presence rate: ${intec.bsPresenceRate.toFixed(3)}`);

    if (intec.bsPresenceRate > 0.5 && intec.nlPresenceRate < 0.2) {
      console.log(
        "\n→ Findable by brand/SKU, absent by natural language → IV02 mechanism at store scale",
      );
    } else if (intec.bsPresenceRate < 0.2) {
      console.log(
        "\n→ Not findable at all → enrollment or catalogue-linking defect",
      );
    } else {
      console.log(
        "\n→ Mixed pattern — some brand/SKU findable, some not. Needs individual product analysis.",
      );
    }
  }

  // ── Save transcript ──
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(dir, `store-visibility-${stamp}.json`);
  await writeFile(outPath, JSON.stringify(results, null, 2));
  console.log(`\n  Transcript → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
