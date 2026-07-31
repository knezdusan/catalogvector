/**
 * Public homepage — PLACEHOLDER.
 *
 * Per BLUEPRINT.md §5 / TDD.md §9, the public site is a Phase 1 publication
 * artifact (PUB-1..4): a benchmark report, methodology write-up, and dataset.
 * This page is a stub until the publication pipeline (C9) produces content.
 *
 * Status: PENDING (see BLUEPRINT.md feature inventory, PUB-1..4).
 */
export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">CatalogVector</h1>
      <p className="mt-4 max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Outcome measurement of AI shopping-agent retrieval for
        technically-specified Shopify catalogs. Publication pending — see{" "}
        <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
          docs/
        </code>
        .
      </p>
    </main>
  );
}
