/**
 * C8 — Orchestration (Inngest workflows).
 *
 * One Inngest function per store, fanned out from a run trigger; steps are
 * individually retryable so a single store failure never loses a run.
 * Idempotency keyed on (runId, storeId, stage). (TDD.md §5 C8)
 *
 * Status: PENDING — depends on I-7 (inngest) and C1..C6.
 *
 * Target shape (TDD.md §5 C8):
 *   export const scanStore = inngest.createFunction(
 *     { id: "scan-store", concurrency: { limit: 4 }, retries: 3 },
 *     { event: "scan/store.requested" },
 *     async ({ event, step }) => {
 *       const ingest  = await step.run("ingest",   () => ingestStore(event.data.domain));
 *       await          step.run("embed",           () => embedProducts(ingest.storeId));
 *       const queries = await step.run("queries",  () => synthesiseQueries(ingest.storeId));
 *       const runs    = await step.run("catalog",  () => runCatalogQueries(queries));
 *       const expect  = await step.run("expect",   () => resolveExpectations(queries));
 *       return step.run("score", () => scoreAll(expect, runs));
 *     },
 *   );
 */
export {}; // TODO(C8)
