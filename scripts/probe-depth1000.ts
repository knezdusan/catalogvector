/**
 * DIRECTIVE-7 §5 — Depth-1000 re-run
 *
 * Re-issue the frozen query set (commit b0365f6, unscoped, unchanged) with
 * pagination to depth 1000. For each target record: present at 3, 10, 50,
 * 200, 1000, or absent at depth.
 *
 * "Absent at depth 1000" is a categorically different observation from
 * "not in the top 50" and it is the only version of non-retrieval that
 * could support a merchant-facing claim.
 *
 * Pagination: limit=50 per page, depth capped at 1000 (TDD §2.4).
 * 20 pages × 50 = 1000 max results per query.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const QUERY_SET_PATH = join(
  process.cwd(),
  "scripts",
  "retrieval-query-set.json",
);
const QUERY_SET_COMMIT = "b0365f6c5d46efddbb7a3c29c0e113096584d7c7";
const RATE_LIMIT_MS = 250;
const MAX_DEPTH = 1000;
const PAGE_SIZE = 50;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.shopify.com/auth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CatalogProduct {
  id: string;
  title: string;
  description?: unknown;
  metadata?: { tech_specs?: string };
  variants?: Array<Record<string, unknown>>;
}

interface PageResult {
  products: CatalogProduct[];
  raw: unknown;
  hasNextPage: boolean;
  totalCount: number | null;
  cursor: string | null;
}

async function issueQueryPage(
  token: string,
  query: string,
  cursor: string | null,
): Promise<PageResult> {
  const pagination: { limit: number; cursor?: string } = {
    limit: PAGE_SIZE,
  };
  if (cursor) pagination.cursor = cursor;

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: process.env.UCP_AGENT_PROFILE_URL! } },
        catalog: {
          query,
          filters: { available: true },
          pagination,
        },
      },
    },
  };
  const res = await fetch(CATALOG_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.json();
  await sleep(RATE_LIMIT_MS);
  const sc = raw?.result?.structuredContent;
  const products = (sc?.products ?? []) as CatalogProduct[];
  const hasNextPage = sc?.pagination?.has_next_page ?? false;
  const totalCount = sc?.pagination?.total_count ?? null;
  const nextCursor = sc?.pagination?.cursor ?? null;
  return { products, raw, hasNextPage, totalCount, cursor: nextCursor };
}

function handleOf(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/\/products\/([^?]+)/) || [])[1] || "";
}

function sellerDomain(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
}

async function main() {
  console.log("\nDIRECTIVE-7 §5 — DEPTH-1000 RE-RUN");
  console.log("═".repeat(66));
  console.log(`Query set commit: ${QUERY_SET_COMMIT}`);
  console.log(`Scoping: UNSCOPED (no filters.shops)`);
  console.log(`Pagination: ${PAGE_SIZE}/page, max depth ${MAX_DEPTH}`);
  console.log();

  const querySet = JSON.parse(await readFile(QUERY_SET_PATH, "utf8")) as {
    queries: Array<{
      id: string;
      archetype: string;
      type: string;
      query: string;
      target_vehicle: string | null;
      targets: string[];
    }>;
    products: {
      dropped: Array<{ id: string; handle: string; title: string }>;
      retained: Array<{ id: string; handle: string; title: string }>;
    };
  };

  // Build target lookups
  const targetById = new Map<
    string,
    {
      id: string;
      handle: string;
      title: string;
      population: "dropped" | "retained";
    }
  >();
  for (const p of querySet.products.dropped)
    targetById.set(p.id, { ...p, population: "dropped" });
  for (const p of querySet.products.retained)
    targetById.set(p.id, { ...p, population: "retained" });

  const token = await getAccessToken();
  const transcript: unknown[] = [];
  const results: Array<{
    queryId: string;
    query: string;
    type: string;
    totalCount: number | null;
    totalProductsScanned: number;
    pages: number;
    targets: Array<{
      targetId: string;
      handle: string;
      population: string;
      present: boolean;
      rank: number | null;
      depthCategory: string;
    }>;
  }> = [];

  for (const q of querySet.queries) {
    console.log(`  ${q.id}: ${q.query}`);

    // Collect all target handles for this query
    const targetHandles = new Map<
      string,
      { id: string; handle: string; population: string }
    >();
    for (const tid of q.targets) {
      const t = targetById.get(tid);
      if (t)
        targetHandles.set(t.handle, {
          id: tid,
          handle: t.handle,
          population: t.population,
        });
    }

    // Paginate to depth 1000
    let cursor: string | null = null;
    let pageNum = 0;
    let totalScanned = 0;
    let totalCount: number | null = null;
    const foundTargets = new Map<
      string,
      { rank: number; targetId: string; population: string }
    >();

    while (totalScanned < MAX_DEPTH) {
      const page = await issueQueryPage(token, q.query, cursor);
      pageNum++;
      if (totalCount === null) totalCount = page.totalCount;

      // Search this page for targets
      for (let i = 0; i < page.products.length; i++) {
        const rank = totalScanned + i + 1;
        const h = handleOf(page.products[i]);
        const target = targetHandles.get(h);
        if (target && !foundTargets.has(h)) {
          foundTargets.set(h, {
            rank,
            targetId: target.id,
            population: target.population,
          });
        }
      }

      totalScanned += page.products.length;
      transcript.push({
        step: "page",
        queryId: q.id,
        query: q.query,
        page: pageNum,
        offset: totalScanned,
        productCount: page.products.length,
        hasNextPage: page.hasNextPage,
        totalCount: page.totalCount,
        response: page.raw,
      });

      if (!page.hasNextPage || page.products.length === 0) break;
      cursor = page.cursor;
      if (!cursor) break;
    }

    // Classify each target
    const targetResults = q.targets
      .map((tid) => {
        const t = targetById.get(tid);
        if (!t) return null;
        const found = foundTargets.get(t.handle);
        const rank = found ? found.rank : null;
        let depthCategory: string;
        if (rank === null) {
          depthCategory = "absent_at_depth";
        } else if (rank <= 3) {
          depthCategory = "present@3";
        } else if (rank <= 10) {
          depthCategory = "present@10";
        } else if (rank <= 50) {
          depthCategory = "present@50";
        } else if (rank <= 200) {
          depthCategory = "present@200";
        } else {
          depthCategory = "present@1000";
        }
        return {
          targetId: tid,
          handle: t.handle,
          population: t.population,
          present: !!found,
          rank,
          depthCategory,
        };
      })
      .filter(Boolean);

    const presentCount = targetResults.filter((t) => t!.present).length;
    const absentCount = targetResults.filter((t) => !t!.present).length;
    console.log(
      `    → ${totalScanned} products scanned (${pageNum} pages), total_count=${totalCount}`,
    );
    console.log(
      `    Targets: ${presentCount} present, ${absentCount} absent at depth ${MAX_DEPTH}`,
    );

    results.push({
      queryId: q.id,
      query: q.query,
      type: q.type,
      totalCount,
      totalProductsScanned: totalScanned,
      pages: pageNum,
      targets: targetResults as Array<{
        targetId: string;
        handle: string;
        population: string;
        present: boolean;
        rank: number | null;
        depthCategory: string;
      }>,
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(
    "\n\n══════════════════════════════════════════════════════════════════",
  );
  console.log("DEPTH-1000 SUMMARY");
  console.log(
    "══════════════════════════════════════════════════════════════════",
  );

  // Per population
  for (const pop of ["dropped", "retained"] as const) {
    const relTargets = results
      .filter((r) => r.type === "relational")
      .flatMap((r) => r.targets)
      .filter((t) => t.population === pop);
    const present = relTargets.filter((t) => t.present).length;
    const absent = relTargets.filter((t) => !t.present).length;
    console.log(
      `\n  ${pop.toUpperCase()} (relational, ${relTargets.length} pairs):`,
    );
    console.log(`    Present at any depth: ${present}/${relTargets.length}`);
    console.log(
      `    Absent at depth ${MAX_DEPTH}: ${absent}/${relTargets.length}`,
    );

    // Depth distribution
    const byDepth: Record<string, number> = {};
    for (const t of relTargets) {
      byDepth[t.depthCategory] = (byDepth[t.depthCategory] || 0) + 1;
    }
    console.log(`    Depth distribution:`);
    for (const cat of [
      "present@3",
      "present@10",
      "present@50",
      "present@200",
      "present@1000",
      "absent_at_depth",
    ]) {
      if (byDepth[cat]) console.log(`      ${cat}: ${byDepth[cat]}`);
    }
  }

  // Pooled
  const allRelTargets = results
    .filter((r) => r.type === "relational")
    .flatMap((r) => r.targets);
  const allPresent = allRelTargets.filter((t) => t.present).length;
  const allAbsent = allRelTargets.filter((t) => !t.present).length;
  console.log(`\n  POOLED (relational, ${allRelTargets.length} pairs):`);
  console.log(
    `    Present at any depth: ${allPresent}/${allRelTargets.length}`,
  );
  console.log(
    `    Absent at depth ${MAX_DEPTH}: ${allAbsent}/${allRelTargets.length}`,
  );

  // The critical question: how many absent at depth 1000?
  console.log(
    `\n  *** ABSENT AT DEPTH ${MAX_DEPTH}: ${allAbsent} of ${allRelTargets.length} ***`,
  );
  if (allAbsent === 0) {
    console.log(
      `  → Nothing measured in this project so far is invisibility. That is the finding.`,
    );
  }

  // Per-query detail
  console.log("\n  Per-query (relational):");
  console.log(
    "| Q | Query | Target | Pop | Present? | Rank | Depth category |",
  );
  console.log("|---|---|---|---|---|---|---|");
  for (const r of results.filter((r) => r.type === "relational")) {
    for (const t of r.targets) {
      console.log(
        `| ${r.queryId} | ${r.query.slice(0, 35)} | ${t.handle.slice(0, 30)} | ${t.population} | ${t.present ? "YES" : "NO"} | ${t.rank ?? "—"} | ${t.depthCategory} |`,
      );
    }
  }

  // Intrinsic queries too
  console.log("\n  Per-query (intrinsic):");
  console.log(
    "| Q | Query | Target | Pop | Present? | Rank | Depth category |",
  );
  console.log("|---|---|---|---|---|---|---|");
  for (const r of results.filter((r) => r.type === "intrinsic")) {
    for (const t of r.targets) {
      console.log(
        `| ${r.queryId} | ${r.query.slice(0, 35)} | ${t.handle.slice(0, 30)} | ${t.population} | ${t.present ? "YES" : "NO"} | ${t.rank ?? "—"} | ${t.depthCategory} |`,
      );
    }
  }

  // ─── Emit artifact ────────────────────────────────────────────────────
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const output = {
    directive: "DIRECTIVE-7 §5",
    timestamp: new Date().toISOString(),
    querySetCommit: QUERY_SET_COMMIT,
    scoping: "unscoped",
    maxDepth: MAX_DEPTH,
    pageSize: PAGE_SIZE,
    results,
    summary: {
      dropped: {
        totalPairs: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "dropped").length,
        present: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "dropped" && t.present).length,
        absent: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "dropped" && !t.present).length,
      },
      retained: {
        totalPairs: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "retained").length,
        present: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "retained" && t.present).length,
        absent: results
          .filter((r) => r.type === "relational")
          .flatMap((r) => r.targets)
          .filter((t) => t.population === "retained" && !t.present).length,
      },
      pooled: {
        totalPairs: allRelTargets.length,
        present: allPresent,
        absent: allAbsent,
      },
    },
  };

  const outJson = join(dir, `depth1000-${stamp}.json`);
  await writeFile(
    outJson,
    JSON.stringify({ ...output, transcript }, null, 2),
    "utf8",
  );
  console.log(`\n  Artifacts:`);
  console.log(`    JSON: ${outJson}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
