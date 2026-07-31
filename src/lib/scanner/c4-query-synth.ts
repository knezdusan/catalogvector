/**
 * C4 — Buyer query synthesis.
 *
 * Generate queries a real buyer in this vertical would type. Queries derive from
 * the store's *actual* inventory, so a failure to retrieve is unambiguous — the
 * product exists and is in scope. Each query is tagged with an archetype so
 * results can be sliced by query difficulty. (TDD.md §5 C4)
 *
 * PENDING — PHASE 0: the archetype taxonomy and vocabulary. For electronic
 * components: parametric, part-number, cross-reference; for auto parts: fitment,
 * OEM-number, dimension. These are illustrations, not the design.
 *
 * Contract fixed now regardless of vertical: ≥3 archetypes; each query traceable
 * to ≥1 source product; queries generated once and frozen before any C3 call, so
 * the query set cannot be tuned to flatter the result. **Freezing the query set
 * before measurement is the difference between a paper and marketing.**
 *
 * Interface: synthesiseQueries(store, products): Promise<Query[]>
 * Testable boundary: given fixed products + fixed seed, output is deterministic
 *   and schema-valid. Archetype coverage asserted.
 * Status: PENDING
 */
import type { Query } from "@/db/schema";

export async function synthesiseQueries(
  _storeId: string,
  _products: Array<{ id: string; title: string; bodyHtml?: string | null }>,
): Promise<Query[]> {
  // TODO(C4): implement per TDD.md §5 C4. Archetype vocabulary PENDING — PHASE 0.
  throw new Error(
    "C4 synthesiseQueries not implemented (PENDING — PHASE 0 archetype vocabulary)",
  );
}
