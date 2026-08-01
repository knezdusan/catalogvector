/**
 * C3 — Global Catalog MCP client.
 *
 * Issue UCP catalog calls and persist raw responses. Endpoint:
 *   POST https://catalog.shopify.com/api/ucp/mcp  (JSON-RPC 2.0)
 *
 * Two separate concerns (TDD.md §2.4, corrected 31 Jul 2026):
 *   1. Capability negotiation: agent profile URL in `meta.ucp-agent.profile`.
 *      Profile hosted at public/ucp-agent-profile.json (GitHub raw URL).
 *   2. Authentication: `Authorization: Bearer <token>` header (Token tier).
 *      Token fetched at runtime via src/lib/scanner/ucp-auth.ts.
 *
 * Persist `requestBody` and `results` verbatim to `catalog_runs`. Never trust
 * `total_count` (it is an estimate). Paginate to the 1000-result cap only where
 * scoring design requires depth. (TDD.md §2.4, §5 C3)
 *
 * Interface: searchCatalog(input): Promise<CatalogSearchResult>
 * Testable boundary: contract tests against recorded responses; one live smoke
 *   test in CI, skipped without credentials.
 * Status: I-4 RESOLVED (no approval needed). Implementation PENDING.
 */
import { env } from "@/lib/env";
import { getUcpAccessToken } from "@/lib/scanner/ucp-auth";

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";

export type CatalogSearchInput = {
  query: string;
  intent?: string;
  shopGids?: string[]; // ≤ 1000
  cursor?: string;
  limit?: number; // ≤ 50
};

export type CatalogSearchResult = {
  // TODO(C3): materialize from the Zod `CatalogSearchResponse` in TDD.md §5 C3.
  structuredContent: unknown;
  messages?: unknown[];
};

export async function searchCatalog(
  input: CatalogSearchInput,
): Promise<CatalogSearchResult> {
  if (!env.UCP_AGENT_PROFILE_URL) {
    throw new Error("UCP_AGENT_PROFILE_URL must be set (see .env.example)");
  }

  const { accessToken } = await getUcpAccessToken();

  const body = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: 1,
    params: {
      name: "search_catalog",
      arguments: {
        meta: {
          "ucp-agent": { profile: env.UCP_AGENT_PROFILE_URL },
        },
        catalog: {
          query: input.query,
          context: input.intent ? { intent: input.intent } : undefined,
          filters: input.shopGids ? { shops: input.shopGids } : undefined,
          pagination: { limit: input.limit ?? 50 },
        },
      },
    },
  };

  // TODO(C3): wire through C7 rate limiter before this fetch.
  // TODO(C3): persist requestBody + response verbatim to catalog_runs.
  const res = await fetch(CATALOG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Catalog search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    result?: CatalogSearchResult;
    error?: unknown;
  };

  if (data.error) {
    throw new Error(`Catalog search RPC error: ${JSON.stringify(data.error)}`);
  }

  if (!data.result) {
    throw new Error("Catalog search returned no result and no error");
  }

  return data.result;
}
