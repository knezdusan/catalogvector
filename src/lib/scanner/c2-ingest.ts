/**
 * C2 — Storefront ingestion adapter.
 *
 * Normalize one store's public catalogue into `products`. Primary `/products.json`
 * paginated at 250. Fallback for disabled endpoints: `/collections/all` + per-product
 * JSON-LD. Zod-validate every payload before persistence — third-party data is
 * hostile. `rawHash` gates re-embedding. Every response passes through C7. Honour
 * `robots.txt`; identify with a real user agent and contact URL. (TDD.md §5 C2)
 *
 * Interface: ingestStore(domain): Promise<IngestResult>
 * Testable boundary: adapter is pure over recorded fixtures. Fixture set must
 *   include: normal store, disabled endpoint, HTML spec table, PDF-linked specs,
 *   single-variant-per-product anti-pattern, non-English store.
 * Status: PENDING
 */
export type IngestResult = {
  storeId: string;
  productCount: number;
  productsJsonAvailable: "yes" | "disabled" | "unknown";
};

export async function ingestStore(_domain: string): Promise<IngestResult> {
  // TODO(C2): implement per TDD.md §5 C2. Zod schemas for RawVariant and
  // ProductsJsonResponse are sketched in TDD.md §5 C2 — replicate verbatim.
  throw new Error("C2 ingestStore not implemented (PENDING)");
}
