/**
 * U-7 floor characterisation — check what the nonsense query returns
 * and compare with U7-A to determine if it's a floor or loose matching.
 */

import { resolve } from "node:path";
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

async function fetchAllProducts(
  token: string,
  query: string,
): Promise<Array<{ id: string; title: string; domain: string }>> {
  let cursor: string | null = null;
  const all: Array<{ id: string; title: string; domain: string }> = [];
  let hasNextPage = true;
  let pages = 0;

  while (hasNextPage && pages < 40) {
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
    const products = (sc?.products ?? []) as Array<{
      id: string;
      title: string;
      variants?: Array<{ url?: string }>;
    }>;
    hasNextPage = sc?.pagination?.has_next_page ?? false;
    cursor = sc?.pagination?.cursor ?? null;
    pages++;

    for (const p of products) {
      const url = p.variants?.[0]?.url ?? "";
      const domain = (url.match(/^https?:\/\/([^/]+)/) || [])[1] ?? "";
      all.push({ id: p.id, title: p.title, domain });
    }
  }
  return all;
}

async function main() {
  const token = await getAccessToken();

  console.log("Fetching U7-A (brake pads)...");
  const u7a = await fetchAllProducts(token, "brake pads");
  console.log(`  ${u7a.length} products`);

  console.log("Fetching U7-D (zxqv flurbin widget)...");
  const u7d = await fetchAllProducts(token, "zxqv flurbin widget");
  console.log(`  ${u7d.length} products`);

  // Check overlap
  const u7aIds = new Set(u7a.map((p) => p.id));
  const overlap = u7d.filter((p) => u7aIds.has(p.id));
  console.log("\n=== OVERLAP ===");
  console.log(`U7-A: ${u7a.length} products`);
  console.log(`U7-D: ${u7d.length} products`);
  console.log(
    `Overlap (same product IDs): ${overlap.length} (${((overlap.length / u7d.length) * 100).toFixed(1)}% of U7-D)`,
  );

  // Check if "widget" appears in any U7-D titles
  const widgetTitles = u7d.filter((p) =>
    p.title.toLowerCase().includes("widget"),
  );
  console.log(
    `\nU7-D products with "widget" in title: ${widgetTitles.length} of ${u7d.length}`,
  );
  if (widgetTitles.length > 0) {
    console.log("  Examples:");
    for (const p of widgetTitles.slice(0, 5)) console.log(`    ${p.title}`);
  }

  // Show first 10 U7-D titles
  console.log("\n=== U7-D FIRST 10 TITLES ===");
  for (const p of u7d.slice(0, 10)) {
    console.log(`  ${p.title} — ${p.domain}`);
  }

  // Show first 10 U7-A titles for comparison
  console.log("\n=== U7-A FIRST 10 TITLES ===");
  for (const p of u7a.slice(0, 10)) {
    console.log(`  ${p.title} — ${p.domain}`);
  }

  // Check if U7-D products are from auto-parts stores or random stores
  const u7dDomains = new Map<string, number>();
  for (const p of u7d) {
    u7dDomains.set(p.domain, (u7dDomains.get(p.domain) ?? 0) + 1);
  }
  const topD = [...u7dDomains.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log("\n=== U7-D TOP 10 DOMAINS ===");
  for (const [d, c] of topD) {
    console.log(`  ${d}: ${c} products`);
  }

  // Check if any of the 3 absolutely invisible targets appear in U7-D
  const targetHandles = [
    "paragon-pbp370-brake-pads",
    "br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan",
    "icon-stage-4-w-billet-uca-suspension-kit-for-2021-2025-ford-f-150-4wd",
  ];
  console.log("\n=== ABSOLUTELY INVISIBLE TARGETS IN U7-D ===");
  for (const handle of targetHandles) {
    const found = u7d.some((p) => {
      // Can't check by handle since we don't have variant URLs in the summary
      // Check by title match
      return false;
    });
    // Actually, let me check by looking for the titles
  }
  // Check by title keywords
  const paragonInD = u7d.filter((p) =>
    p.title.toLowerCase().includes("paragon"),
  );
  const bcRacingInD = u7d.filter((p) =>
    p.title.toLowerCase().includes("bc racing"),
  );
  const iconInD = u7d.filter((p) => p.title.toLowerCase().includes("icon"));
  console.log(`  Paragon in U7-D: ${paragonInD.length}`);
  console.log(`  BC Racing in U7-D: ${bcRacingInD.length}`);
  console.log(`  ICON in U7-D: ${iconInD.length}`);

  // Also check in U7-A
  const paragonInA = u7a.filter((p) =>
    p.title.toLowerCase().includes("paragon"),
  );
  console.log(`  Paragon in U7-A: ${paragonInA.length}`);
  if (paragonInA.length > 0) {
    console.log("    Examples:");
    for (const p of paragonInA.slice(0, 3)) console.log(`      ${p.title}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
