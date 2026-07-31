/**
 * Scan trigger UI — PLACEHOLDER.
 *
 * Local UI to click a button and start a store scan. Fires the Inngest
 * `scan/store.requested` event (TDD.md C8). No auth.
 *
 * Status: PENDING (depends on C8 orchestration).
 */
export default function ScansPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-32">
      <h1 className="text-3xl font-semibold tracking-tight">Scans</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Scan trigger — placeholder.
      </p>
    </main>
  );
}
