/**
 * C5 — Expected-match resolver. ⭐ THE LOAD-BEARING COMPONENT.
 *
 * For a query, decide which of the store's own products genuinely satisfy it.
 * This is ground truth, and it is the reason this project is not a checklist.
 * Three stages, mirroring the VectorMatch funnel (TDD.md §5 C5):
 *   1. Cheap prefilter — spec-key overlap and lexical signals narrow candidates.
 *   2. Vector retrieval — pgvector HNSW cosine over composed text, top-k.
 *   3. Arbitration — an LLM adjudicates only the ambiguous band, with a
 *      rationale string that is persisted and published.
 *
 * Why this cannot reduce to a field loop: the query says `SOT-223`; the title
 * says `MIC5219-3.3YM5`; the package appears only in a `<table>` in `body_html`;
 * a competing SKU is `SOT-23-5` — visually adjacent, functionally wrong. Deciding
 * should_match requires extraction, normalization, semantic retrieval, and
 * adjudication of near-misses. Field presence answers none of it.
 *
 * Calibration is mandatory: a stratified sample (target ≥200 pairs) is
 * hand-labelled and inter-rater agreement is PUBLISHED as a headline number. If
 * agreement is poor, the score is not publishable — that is the honest failure
 * mode and it must be discoverable in Week 2, not Week 3.
 *
 * Interface: resolveExpectations(query, storeProducts): Promise<Expectation[]>
 * Testable boundary: golden set of hand-labelled pairs; regression-tested
 *   precision/recall. Arbitration prompt versioned; snapshot-tested for schema,
 *   not for prose.
 * Status: PENDING — and it is the acid test (BLUEPRINT.md §5).
 */
import type { Expectation } from "@/db/schema";

export async function resolveExpectations(
  _queryId: string,
  _storeProducts: Array<{
    id: string;
    title: string;
    bodyHtml?: string | null;
  }>,
): Promise<Expectation[]> {
  // TODO(C5): implement per TDD.md §5 C5. This is the acid test — if it collapses
  // into field-presence checks, the project has collapsed (BLUEPRINT.md §5).
  throw new Error(
    "C5 resolveExpectations not implemented (PENDING — acid test)",
  );
}
