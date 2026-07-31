/**
 * C3 — Global Catalog MCP client.
 *
 * Issue UCP catalog calls and persist raw responses. Endpoint:
 *   POST https://catalog.shopify.com/api/ucp/mcp  (JSON-RPC 2.0)
 * Auth: a UCP agent profile hosted at a well-known URL, referenced as
 *   `meta.ucp-agent.profile` on every request. No merchant OAuth.
 * Persist `requestBody` and `results` verbatim to `catalog_runs`. Never trust
 * `total_count` (it is an estimate). Paginate to the 1000-result cap only where
 * scoring design requires depth. (TDD.md §2.4, §5 C3)
 *
 * Interface: searchCatalog(input): Promise<CatalogSearchResult>
 * Testable boundary: contract tests against recorded responses; one live smoke
 *   test in CI, skipped without credentials.
 * Status: BLOCKED on I-4 (UCP agent profile).
 */
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
  _input: CatalogSearchInput,
): Promise<CatalogSearchResult> {
  // TODO(C3): implement per TDD.md §5 C3. Blocked on I-4.
  throw new Error("C3 searchCatalog not implemented (BLOCKED on I-4)");
}
