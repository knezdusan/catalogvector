/**
 * C1 — Store frontier.
 *
 * Produce N qualified stores in the chosen vertical. Candidate sources: Global
 * Catalog `search_catalog` with vertical queries (self-bootstrapping), public
 * Shopify-detection directories, vertical trade directories. Qualification:
 * reachable, `/products.json` open or fallback-parseable, product count above a
 * floor, genuinely in-vertical (LLM classification, sampled and hand-checked).
 *
 * Sampling bias must be documented: a frontier seeded from the Global Catalog
 * systematically excludes stores absent from it — itself a finding, not a defect,
 * but only if stated. (TDD.md §5 C1)
 *
 * Interface: discoverStores(vertical): Promise<StoreCandidate[]>
 * Testable boundary: pure function over fixture responses; qualification rules
 *   unit-tested against hand-labelled examples.
 * Status: PENDING
 */
import type { StoreCandidate } from "@/db/schema";

export async function discoverStores(
  _vertical: string,
): Promise<StoreCandidate[]> {
  // TODO(C1): implement per TDD.md §5 C1.
  throw new Error("C1 discoverStores not implemented (PENDING)");
}
