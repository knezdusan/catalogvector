/**
 * C6 — Retrieval scoring.
 *
 * Compare expectation to observation. Pure function. No I/O, no LLM.
 * Metrics (TDD.md §6.1): recall@10, recall@50, best_rank, retrieval_rate,
 * competitor_displacement. Miss classification (TDD.md §6.2):
 *   spec_unstructured · taxonomy_mismatch · variant_fragmentation ·
 *   title_uninformative · identifier_missing · not_enrolled · unexplained
 * `unexplained` is reported honestly and not minimised.
 *
 * Interface: score(expectations, catalogRun): Score
 * Testable boundary: trivially unit-testable; property tests earn their place
 *   (e.g. an empty result set always scores zero recall and null rank).
 * Status: PENDING
 */
import type { Expectation, Score } from "@/db/schema";

export type CatalogRunResult = {
  queryId: string;
  retrievedProductIds: string[];
};

export function score(
  _expectations: Expectation[],
  _catalogRun: CatalogRunResult,
): Score {
  // TODO(C6): implement per TDD.md §5 C6 + §6. Pure, deterministic.
  throw new Error("C6 score not implemented (PENDING)");
}
