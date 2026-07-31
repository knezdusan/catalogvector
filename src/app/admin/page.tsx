/**
 * Local command center dashboard — PLACEHOLDER.
 *
 * No auth (BLUEPRINT.md §4: no multi-tenancy, no OAuth in Phase 1). Local-only UI
 * to view database results and trigger scans. Not exposed publicly.
 *
 * Status: PENDING.
 */
export default function AdminDashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">
        CatalogVector · Admin
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Local dashboard — placeholder.
      </p>
    </main>
  );
}
