/**
 * DIRECTIVE-8-v2 §4.3 — Scoped-fallback test
 *
 * Issue two semantically unrelated scoped queries against TSP and report
 * the Jaccard overlap of their result sets. High overlap indicates
 * store-general fallback; low indicates genuine matching at a lower
 * relevance bar.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const PAGE_SIZE = 50;
const TSP_GID = "gid://shopify/Shop/1357086779";

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

async function fetchScoped(token: string, query: string): Promise<Set<string>> {
  let cursor: string | null = null;
  const handles = new Set<string>();
  let hasNextPage = true;
  let pages = 0;

  while (hasNextPage && pages < 20) {
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
            filters: { available: true, shops: [TSP_GID] },
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
    const products = (sc?.products ?? []) as Array<{
      variants?: Array<{ url?: string }>;
    }>;
    hasNextPage = sc?.pagination?.has_next_page ?? false;
    cursor = sc?.pagination?.cursor ?? null;
    pages++;

    for (const p of products) {
      const url = p.variants?.[0]?.url ?? "";
      const m = url.match(/\/products\/([^?]+)/);
      if (m) handles.add(m[1]);
    }
  }
  return handles;
}

async function main() {
  console.log("\nDIRECTIVE-8-v2 §4.3 — SCOPED-FALLBACK TEST");
  console.log("═".repeat(66));
  console.log(`Store: TSP (${TSP_GID})`);
  console.log(
    "Two semantically unrelated queries — Jaccard overlap determines fallback\n",
  );

  const token = await getAccessToken();

  // Two semantically unrelated queries
  const query1 = "brake pads for 2018 Honda Civic Si";
  const query2 = "lift kit for 2023 Ford F-150";

  console.log(`Query 1: "${query1}"`);
  const set1 = await fetchScoped(token, query1);
  console.log(`  ${set1.size} products`);

  console.log(`Query 2: "${query2}"`);
  const set2 = await fetchScoped(token, query2);
  console.log(`  ${set2.size} products`);

  // Jaccard overlap
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;

  console.log("\n=== RESULTS ===");
  console.log(`Set 1 size: ${set1.size}`);
  console.log(`Set 2 size: ${set2.size}`);
  console.log(`Intersection: ${intersection.size}`);
  console.log(`Union: ${union.size}`);
  console.log(
    `Jaccard overlap: ${jaccard.toFixed(3)} (${(jaccard * 100).toFixed(1)}%)`,
  );

  if (jaccard > 0.5) {
    console.log(
      "\n→ HIGH OVERLAP — store-general fallback (U-4 pattern). Scoped queries return the shop's general catalogue, not genuine matches.",
    );
  } else if (jaccard > 0.2) {
    console.log(
      "\n→ MODERATE OVERLAP — partial fallback. Some genuine matching, some fallback.",
    );
  } else {
    console.log(
      "\n→ LOW OVERLAP — genuine matching at a lower relevance bar. Scoped queries return different products for different queries.",
    );
  }

  // Show intersection products
  if (intersection.size > 0) {
    console.log(`\nIntersection products (${intersection.size}):`);
    for (const h of [...intersection].slice(0, 10)) {
      console.log(`  ${h}`);
    }
    if (intersection.size > 10)
      console.log(`  ... and ${intersection.size - 10} more`);
  }

  // Show first 5 from each set
  console.log(`\nSet 1 first 5:`);
  for (const h of [...set1].slice(0, 5)) console.log(`  ${h}`);
  console.log(`\nSet 2 first 5:`);
  for (const h of [...set2].slice(0, 5)) console.log(`  ${h}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
