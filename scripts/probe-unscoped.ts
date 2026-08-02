/**
 * Stage 2.5 — Unscoped competitive retrieval (DIRECTIVE-5 §3)
 *
 * Re-issues the same frozen query set (commit b0365f6) with filters.shops
 * REMOVED. Only one parameter changes. Captures:
 *   - unscoped_presence@50 — does the declared target appear at all
 *   - unscoped_best_rank
 *   - competitor_displacement — seller domains in top 10, near-equivalent check
 *
 * H3 pre-registered decision rule:
 *   confirmed:  dropped presence@50 < retained by ≥ 0.30 absolute
 *   rejected:   difference ≤ 0.10
 *   inconclusive: between, or <6 pairs in either population, or <3 distinct targets
 *
 * Also runs Stage 2.5b (title-coverage test, H4) using the title-absent product
 * set assembled separately.
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
const _TSP_GID = "gid://shopify/Shop/1357086779";
const RATE_LIMIT_MS = 250;

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

interface CatalogResult {
  id: string;
  title: string;
  description?: unknown;
  metadata?: { tech_specs?: string };
  variants?: Array<Record<string, unknown>>;
}

async function issueQueryUnscoped(token: string, query: string) {
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
          filters: { available: true }, // NO shops filter — unscoped
          pagination: { limit: 50 },
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
  const products = (raw?.result?.structuredContent?.products ??
    []) as CatalogResult[];
  return { products, raw };
}

function handleOf(p: CatalogResult): string {
  const url = p.variants?.[0]?.url || "";
  return (url.match(/\/products\/([^?]+)/) || [])[1] || "";
}

function sellerDomain(p: CatalogResult): string {
  const url = p.variants?.[0]?.url || "";
  return (url.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
}

const VEHICLE_RE =
  /honda|acura|ford|subaru|mitsubishi|audi|scion|cadillac|holden|chevrolet|gmc|toyota|nissan|mazda|bmw|mercedes|lexus|hyundai|kia|volkswagen|vw/i;

function fieldPresence(p: CatalogResult): string {
  const t = VEHICLE_RE.test(p.title || "");
  const s = VEHICLE_RE.test(p.metadata?.tech_specs || "");
  return t && s ? "both" : t ? "title_only" : s ? "specs_only" : "neither";
}

async function main() {
  console.log("\nSTAGE 2.5 — UNSCOPED COMPETITIVE RETRIEVAL (DIRECTIVE-5 §3)");
  console.log("═".repeat(66));
  console.log(`Query set commit: ${QUERY_SET_COMMIT}`);
  console.log("filters.shops: REMOVED (unscoped)\n");

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

  // Build lookups
  const allTargets = new Map<
    string,
    {
      id: string;
      handle: string;
      title: string;
      population: "dropped" | "retained";
    }
  >();
  for (const p of querySet.products.dropped)
    allTargets.set(p.handle, { ...p, population: "dropped" });
  for (const p of querySet.products.retained)
    allTargets.set(p.handle, { ...p, population: "retained" });
  const targetById = new Map<string, string>();
  for (const p of querySet.products.dropped) targetById.set(p.id, p.handle);
  for (const p of querySet.products.retained) targetById.set(p.id, p.handle);

  const token = await getAccessToken();
  const transcript: unknown[] = [];
  const results: Array<{
    queryId: string;
    query: string;
    type: string;
    products: CatalogResult[];
  }> = [];

  for (const q of querySet.queries) {
    console.log(`  ${q.id}: ${q.query}`);
    const { products, raw } = await issueQueryUnscoped(token, q.query);
    transcript.push({
      step: "query",
      queryId: q.id,
      query: q.query,
      response: raw,
    });
    results.push({ queryId: q.id, query: q.query, type: q.type, products });
    console.log(`    → ${products.length} products`);

    // Print top 5 seller domains
    const domains: Record<string, number> = {};
    for (const p of products) {
      const d = sellerDomain(p);
      domains[d] = (domains[d] || 0) + 1;
    }
    const top5 = Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log(
      `    Top sellers: ${top5.map(([d, c]) => `${d}(${c})`).join(", ")}`,
    );

    // Check if any target appeared
    const targetHits = products.filter((p) => allTargets.has(handleOf(p)));
    if (targetHits.length > 0) {
      for (const p of targetHits) {
        const h = handleOf(p);
        const t = allTargets.get(h)!;
        const rank = products.indexOf(p) + 1;
        console.log(
          `    ★ ${t.population.toUpperCase()} target "${t.title.slice(0, 50)}" at rank ${rank} (${sellerDomain(p)})`,
        );
      }
    } else {
      console.log(`    ✗ No targets in top 50`);
    }
  }

  // Score
  console.log(`\n${"═".repeat(66)}`);
  console.log("SCORING — H3 (unscoped competitive retrieval)");
  console.log("═".repeat(66));

  const _relationalQueries = querySet.queries.filter(
    (q) => q.type === "relational",
  );
  const _intrinsicQueries = querySet.queries.filter(
    (q) => q.type === "intrinsic",
  );

  // Per-query target presence
  const queryResults: Array<{
    queryId: string;
    query: string;
    type: string;
    targetHits: Array<{
      targetId: string;
      rank: number;
      population: string;
      domain: string;
      fieldPresence: string;
    }>;
    presence50: boolean;
    bestRank: number | null;
    top10Domains: Array<{ domain: string; count: number; isTSP: boolean }>;
  }> = [];

  for (const r of results) {
    const qDef = querySet.queries.find((q) => q.id === r.queryId)!;
    const targetHandles = new Set(
      qDef.targets.map((tid) => targetById.get(tid)).filter(Boolean),
    );

    const targetHits: Array<{
      targetId: string;
      rank: number;
      population: string;
      domain: string;
      fieldPresence: string;
    }> = [];
    for (let i = 0; i < r.products.length; i++) {
      const p = r.products[i];
      const h = handleOf(p);
      if (targetHandles.has(h)) {
        const target = allTargets.get(h);
        let tid = "";
        for (const [id, handle] of targetById.entries()) {
          if (handle === h) {
            tid = id;
            break;
          }
        }
        targetHits.push({
          targetId: tid,
          rank: i + 1,
          population: target?.population || "other",
          domain: sellerDomain(p),
          fieldPresence: fieldPresence(p),
        });
      }
    }

    // Top 10 domains
    const top10Products = r.products.slice(0, 10);
    const top10Domains: Array<{
      domain: string;
      count: number;
      isTSP: boolean;
    }> = [];
    const domainCounts: Record<string, number> = {};
    for (const p of top10Products) {
      const d = sellerDomain(p);
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    }
    for (const [d, c] of Object.entries(domainCounts)) {
      top10Domains.push({
        domain: d,
        count: c,
        isTSP: d === "www.twostepperformance.com",
      });
    }

    queryResults.push({
      queryId: r.queryId,
      query: r.query,
      type: r.type,
      targetHits,
      presence50: targetHits.length > 0,
      bestRank:
        targetHits.length > 0
          ? Math.min(...targetHits.map((h) => h.rank))
          : null,
      top10Domains,
    });
  }

  // H3: population-level presence@50 for relational queries
  const droppedTargetHandles = new Set(
    querySet.products.dropped.map((p) => p.handle),
  );
  const retainedTargetHandles = new Set(
    querySet.products.retained.map((p) => p.handle),
  );

  let droppedPairs = 0,
    droppedPresent = 0;
  let retainedPairs = 0,
    retainedPresent = 0;
  const droppedDistinctTargets = new Set<string>();
  const retainedDistinctTargets = new Set<string>();

  for (const qr of queryResults.filter((qr) => qr.type === "relational")) {
    const qDef = querySet.queries.find((q) => q.id === qr.queryId)!;
    for (const tid of qDef.targets) {
      const handle = targetById.get(tid);
      if (!handle) continue;
      if (droppedTargetHandles.has(handle)) {
        droppedPairs++;
        const hit = qr.targetHits.find((h) => h.targetId === tid);
        if (hit) {
          droppedPresent++;
          droppedDistinctTargets.add(handle);
        }
      } else if (retainedTargetHandles.has(handle)) {
        retainedPairs++;
        const hit = qr.targetHits.find((h) => h.targetId === tid);
        if (hit) {
          retainedPresent++;
          retainedDistinctTargets.add(handle);
        }
      }
    }
  }

  const droppedPresence = droppedPairs > 0 ? droppedPresent / droppedPairs : 0;
  const retainedPresence =
    retainedPairs > 0 ? retainedPresent / retainedPairs : 0;
  const difference = retainedPresence - droppedPresence;

  console.log(`\nRelational queries only:`);
  console.log(
    `  Dropped: ${droppedPresent}/${droppedPairs} present@50 = ${droppedPresence.toFixed(3)} (${droppedDistinctTargets.size} distinct targets)`,
  );
  console.log(
    `  Retained: ${retainedPresent}/${retainedPairs} present@50 = ${retainedPresence.toFixed(3)} (${retainedDistinctTargets.size} distinct targets)`,
  );
  console.log(`  Difference (retained - dropped): ${difference.toFixed(3)}`);

  // H3 verdict
  let h3Verdict: string;
  if (
    droppedPairs < 6 ||
    retainedPairs < 6 ||
    droppedDistinctTargets.size < 3 ||
    retainedDistinctTargets.size < 3
  ) {
    h3Verdict = `INCONCLUSIVE — insufficient pairs (dropped=${droppedPairs}, retained=${retainedPairs}) or distinct targets (dropped=${droppedDistinctTargets.size}, retained=${retainedDistinctTargets.size})`;
  } else if (difference >= 0.3) {
    h3Verdict = `H3 CONFIRMED — coverage gap has commercial consequence (difference ${difference.toFixed(3)} ≥ 0.30)`;
  } else if (difference <= 0.1) {
    h3Verdict = `H3 REJECTED — no consequence detectable (difference ${difference.toFixed(3)} ≤ 0.10)`;
  } else {
    h3Verdict = `H3 INCONCLUSIVE — difference ${difference.toFixed(3)} is between 0.10 and 0.30`;
  }
  console.log(`\n  ${h3Verdict}`);

  // Intrinsic queries separately
  console.log(`\nIntrinsic queries (control — no vehicle in query):`);
  for (const qr of queryResults.filter((qr) => qr.type === "intrinsic")) {
    const hits =
      qr.targetHits
        .map((h) => `${h.population}#${h.targetId}@${h.rank}`)
        .join(", ") || "none";
    console.log(`  ${qr.queryId}: ${qr.query.slice(0, 40)} → ${hits}`);
  }

  // Competitor displacement table
  console.log(`\nCompetitor displacement (top 10 seller domains per query):`);
  for (const qr of queryResults) {
    const tspCount = qr.top10Domains.find((d) => d.isTSP)?.count || 0;
    const otherCount = 10 - tspCount;
    console.log(
      `  ${qr.queryId} [${qr.type.padEnd(10)}] TSP=${tspCount}/10 other=${otherCount}/10  ${qr.top10Domains
        .slice(0, 3)
        .map((d) => `${d.domain}(${d.count})`)
        .join(", ")}`,
    );
  }

  // Per-query detail
  console.log("\nPer-query target presence:");
  for (const qr of queryResults) {
    console.log(
      `  ${qr.queryId} [${qr.type.padEnd(10)}] ${qr.query.slice(0, 45)}`,
    );
    if (qr.targetHits.length > 0) {
      for (const h of qr.targetHits) {
        console.log(
          `    → ${h.population.padEnd(8)} ${h.targetId} rank ${h.rank} (${h.domain}, ${h.fieldPresence})`,
        );
      }
    } else {
      console.log(`    → no targets in top 50`);
    }
  }

  // Emit artifacts
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const jsonData = {
    querySetCommit: QUERY_SET_COMMIT,
    scoped: false,
    h3: {
      droppedPresence,
      retainedPresence,
      difference,
      verdict: h3Verdict,
      droppedPairs,
      retainedPairs,
      droppedDistinctTargets: droppedDistinctTargets.size,
      retainedDistinctTargets: retainedDistinctTargets.size,
    },
    queryResults,
    transcript,
  };
  const jsonPath = join(dir, `unscoped-${stamp}.json`);
  await writeFile(jsonPath, JSON.stringify(jsonData, null, 2), "utf8");

  const md: string[] = [
    "# Stage 2.5 — Unscoped competitive retrieval (DIRECTIVE-5 §3)",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Query set commit:** ${QUERY_SET_COMMIT}`,
    `**Scoping:** filters.shops REMOVED (unscoped)`,
    "",
    "## H3 verdict",
    "",
    `> ${h3Verdict}`,
    "",
    "| Population | Present@50 | Pairs | Distinct targets |",
    "|---|---|---|---|",
    `| Dropped | ${droppedPresence.toFixed(3)} (${droppedPresent}/${droppedPairs}) | ${droppedPairs} | ${droppedDistinctTargets.size} |`,
    `| Retained | ${retainedPresence.toFixed(3)} (${retainedPresent}/${retainedPairs}) | ${retainedPairs} | ${retainedDistinctTargets.size} |`,
    "",
    `**Difference (retained - dropped): ${difference.toFixed(3)}**`,
    "",
    "## Per-query results",
    "",
    "| Q | Type | Query | Target in top 50? | Best rank | Top 10 TSP count |",
    "|---|---|---|---|---|---|",
  ];
  for (const qr of queryResults) {
    const tspCount = qr.top10Domains.find((d) => d.isTSP)?.count || 0;
    md.push(
      `| ${qr.queryId} | ${qr.type} | ${qr.query} | ${qr.presence50 ? "YES" : "NO"} | ${qr.bestRank ?? "—"} | ${tspCount}/10 |`,
    );
  }
  md.push("");
  md.push("## Competitor displacement");
  md.push("");
  for (const qr of queryResults) {
    md.push(`### ${qr.queryId} [${qr.type}]: ${qr.query}`);
    md.push("");
    md.push("| Rank | Domain | Title | Field presence | Is target? |");
    md.push("|---|---|---|---|---|");
    for (let i = 0; i < Math.min(10, qr.targetHits.length || 0); i++) {
      // This won't work well — need products not hits
    }
    // List top 10 products
    const r = results.find((r) => r.queryId === qr.queryId)!;
    for (let i = 0; i < Math.min(10, r.products.length); i++) {
      const p = r.products[i];
      const h = handleOf(p);
      const isTarget = allTargets.has(h);
      md.push(
        `| ${i + 1} | ${sellerDomain(p)} | ${p.title?.slice(0, 60) || ""} | ${fieldPresence(p)} | ${isTarget ? "★" : ""} |`,
      );
    }
    md.push("");
  }

  const mdPath = join(dir, `unscoped-${stamp}.md`);
  await writeFile(mdPath, md.join("\n"), "utf8");

  console.log(`\n  Review sheet → ${mdPath}`);
  console.log(`  Transcript   → ${jsonPath}`);
}

main().catch((e) => {
  console.error("Probe crashed:", e);
  process.exit(1);
});
