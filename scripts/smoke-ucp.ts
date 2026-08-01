/**
 * Smoke test: UCP auth + Global Catalog search end-to-end.
 *
 * Verifies the full flow:
 *   1. Fetch a bearer token (Token tier) using SHOPIFY_CLIENT_ID/SECRET
 *   2. Call search_catalog on the Global Catalog MCP with our agent profile
 *   3. Print scopes, token expiry, and a sample of results
 *
 * Run with: npx tsx scripts/smoke-ucp.ts
 *
 * This is a throwaway probe — NOT part of the app. Excluded from tsconfig.
 * Resolves U-2 (actual rate limits by tier) and U-3 (shop GID resolution)
 * partially: we observe the response shape and any rate-limit headers.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env before importing app code that reads process.env at import time.
config({ path: resolve(import.meta.dirname, "..", ".env") });

const TOKEN_ENDPOINT = "https://api.shopify.com/auth/access_token";
const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";

async function main() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const profileUrl = process.env.UCP_AGENT_PROFILE_URL;

  if (!clientId || !clientSecret) {
    console.error(
      "SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set in .env",
    );
    process.exit(1);
  }
  if (!profileUrl) {
    console.error("UCP_AGENT_PROFILE_URL must be set in .env");
    process.exit(1);
  }

  // ── 1. Authenticate ──────────────────────────────────────────
  console.log("\n── 1. Authentication ──────────────────────────────\n");
  console.log(`  Client ID: ${clientId.slice(0, 8)}...`);

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error(
      `  Token fetch failed: ${tokenRes.status} ${tokenRes.statusText}`,
    );
    console.error(`  Response: ${body}`);
    process.exit(1);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const parts = tokenData.access_token.split(".");
  if (parts.length < 2) {
    console.error("  Token is not a valid JWT");
    process.exit(1);
  }
  const payload = JSON.parse(
    Buffer.from(parts[1] as string, "base64").toString("utf-8"),
  ) as Record<string, unknown>;

  console.log(`  JWT payload keys: ${Object.keys(payload).join(", ")}`);
  console.log(`  Scopes:   ${JSON.stringify(payload.scopes)}`);
  console.log(
    `  Expires:  ${new Date((payload.exp as number) * 1000).toLocaleTimeString()}`,
  );
  if (payload.limits) {
    console.log(`  Limits:   ${JSON.stringify(payload.limits)}`);
  }

  // ── 2. Verify profile URL is reachable ───────────────────────
  console.log("\n── 2. Agent profile URL ────────────────────────────\n");
  console.log(`  URL: ${profileUrl}`);
  const profileRes = await fetch(profileUrl);
  console.log(`  Status: ${profileRes.status} ${profileRes.statusText}`);
  if (!profileRes.ok) {
    console.error(
      "  Profile URL is not reachable — Shopify cannot negotiate capabilities.",
    );
    process.exit(1);
  }
  const profile = await profileRes.json();
  console.log(`  UCP version: ${profile.ucp?.version}`);
  console.log(
    `  Capabilities: ${Object.keys(profile.ucp?.capabilities ?? {}).join(", ")}`,
  );

  // ── 3. Call search_catalog ───────────────────────────────────
  console.log("\n── 3. Global Catalog search ────────────────────────\n");

  const searchBody = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: 1,
    params: {
      name: "search_catalog",
      arguments: {
        meta: {
          "ucp-agent": { profile: profileUrl },
        },
        catalog: {
          query: "SOT-223 voltage regulator",
          context: {
            intent: "Looking for SOT-223 package LDO voltage regulators",
          },
          pagination: { limit: 5 },
        },
      },
    },
  };

  console.log('  Query: "SOT-223 voltage regulator"');
  console.log("  Sending request...");

  const searchRes = await fetch(CATALOG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify(searchBody),
  });

  // Print rate-limit headers if present (informs U-2)
  const rateLimitHeaders: Record<string, string> = {};
  for (const [key, value] of searchRes.headers.entries()) {
    if (
      key.toLowerCase().includes("rate") ||
      key.toLowerCase().includes("x-shopify") ||
      key.toLowerCase().includes("retry")
    ) {
      rateLimitHeaders[key] = value;
    }
  }
  if (Object.keys(rateLimitHeaders).length > 0) {
    console.log("  Rate-limit headers:");
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      console.log(`    ${key}: ${value}`);
    }
  }

  console.log(`  HTTP status: ${searchRes.status} ${searchRes.statusText}`);

  if (!searchRes.ok) {
    const body = await searchRes.text();
    console.error(`  Search failed: ${body}`);
    process.exit(1);
  }

  const searchData = (await searchRes.json()) as {
    result?: { structuredContent?: unknown; messages?: unknown[] };
    error?: { code?: number; message?: string; data?: unknown };
  };

  if (searchData.error) {
    console.error(`  RPC error: ${JSON.stringify(searchData.error, null, 2)}`);
    process.exit(1);
  }

  if (searchData.result?.structuredContent) {
    const content = searchData.result.structuredContent as {
      products?: Array<{
        id?: string;
        title?: string;
        seller?: { id?: string; name?: string };
      }>;
      total_count?: number;
    };
    const products = content.products ?? [];
    console.log(
      `  total_count (estimate): ${content.total_count ?? "not provided"}`,
    );
    console.log(`  Products returned: ${products.length}`);
    for (const product of products.slice(0, 5)) {
      console.log(
        `    - ${product.title ?? "untitled"} | seller: ${product.seller?.name ?? "unknown"} (GID: ${product.seller?.id ?? "n/a"})`,
      );
    }
  } else {
    console.log("  No structuredContent in response");
    console.log(
      `  Full result: ${JSON.stringify(searchData.result, null, 2).slice(0, 500)}`,
    );
  }

  if (searchData.result?.messages?.length) {
    console.log(
      `  Messages: ${JSON.stringify(searchData.result.messages, null, 2)}`,
    );
  }

  console.log("\n── Done ────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
