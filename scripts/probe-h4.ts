/**
 * Stage 2.5b — H4 title-coverage test (DIRECTIVE-5 §4)
 *
 * Issues relational queries for vehicles stated in merchant data of title-absent
 * products (no vehicle in Catalog title) and matched title-present controls.
 * Measures presence@50 for both populations and applies the H4 decision rule.
 *
 * H4 pre-registered decision rule:
 *   supported:    title-absent presence@50 >= 0.40 below title-present (unscoped)
 *   rejected:     difference within 0.15
 *   inconclusive: between, or <8 title-absent products, or <6 matched pairs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const QUERY_SET_PATH = join(process.cwd(), "scripts", "h4-query-set.json");
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
          filters: { available: true },
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
  console.log("\nSTAGE 2.5b — H4 TITLE-COVERAGE TEST (DIRECTIVE-5 §4)");
  console.log("═".repeat(66));
  console.log("Scoping: UNSCOPED (no filters.shops)\n");

  const querySet = JSON.parse(await readFile(QUERY_SET_PATH, "utf8")) as {
    title_absent: Array<{
      id: string;
      handle: string;
      title: string;
      store: string;
    }>;
    title_present_controls: Array<{
      id: string;
      handle: string;
      title: string;
      store: string;
    }>;
    queries: Array<{
      id: string;
      type: string;
      population: string;
      query: string;
      target_handle: string;
      target_store: string;
      rationale: string;
    }>;
  };

  // Build handle → population lookup
  const handleToProduct = new Map<
    string,
    {
      id: string;
      title: string;
      store: string;
      population: "title_absent" | "title_present";
    }
  >();
  for (const p of querySet.title_absent)
    handleToProduct.set(p.handle, {
      id: p.id,
      title: p.title,
      store: p.store,
      population: "title_absent",
    });
  for (const p of querySet.title_present_controls)
    handleToProduct.set(p.handle, {
      id: p.id,
      title: p.title,
      store: p.store,
      population: "title_present",
    });

  const token = await getAccessToken();
  const transcript: unknown[] = [];
  const results: Array<{
    queryId: string;
    query: string;
    population: string;
    products: CatalogResult[];
  }> = [];

  for (const q of querySet.queries) {
    console.log(`  ${q.id} [${q.population.padEnd(14)}]: ${q.query}`);
    const { products, raw } = await issueQueryUnscoped(token, q.query);
    transcript.push({
      step: "query",
      queryId: q.id,
      query: q.query,
      response: raw,
    });
    results.push({
      queryId: q.id,
      query: q.query,
      population: q.population,
      products,
    });
    console.log(`    → ${products.length} products`);

    // Check if target appeared
    const targetHandle = q.target_handle;
    const targetHit = products.find((p) => handleOf(p) === targetHandle);
    if (targetHit) {
      const rank = products.indexOf(targetHit) + 1;
      console.log(
        `    ★ TARGET "${targetHandle.slice(0, 50)}" at rank ${rank} (${sellerDomain(targetHit)})`,
      );
    } else {
      console.log(`    ✗ Target "${targetHandle.slice(0, 50)}" NOT in top 50`);
    }

    // Also check if any same-store product appeared
    const storeHits = products.filter(
      (p) => sellerDomain(p) === q.target_store,
    );
    if (storeHits.length > 0) {
      console.log(`    Same-store products in top 50: ${storeHits.length}`);
      for (const p of storeHits.slice(0, 3)) {
        const h = handleOf(p);
        const rank = products.indexOf(p) + 1;
        const known = handleToProduct.get(h);
        const label = known ? `[${known.population}]` : "[other]";
        console.log(
          `      ${label} rank ${rank}: ${p.title?.slice(0, 60) ?? "???"}`,
        );
      }
    } else {
      console.log(`    No same-store products in top 50`);
    }
  }

  // Score
  console.log(`\n${"═".repeat(66)}`);
  console.log("SCORING — H4 (title-coverage hypothesis)");
  console.log("═".repeat(66));

  const queryResults: Array<{
    queryId: string;
    query: string;
    population: string;
    targetPresent: boolean;
    targetRank: number | null;
    sameStoreCount: number;
    top10: Array<{
      rank: number;
      domain: string;
      title: string;
      fieldPresence: string;
      isTargetStore: boolean;
    }>;
  }> = [];

  for (const r of results) {
    const qDef = querySet.queries.find((q) => q.id === r.queryId)!;
    const targetHandle = qDef.target_handle;
    const targetHit = r.products.find((p) => handleOf(p) === targetHandle);
    const sameStoreCount = r.products.filter(
      (p) => sellerDomain(p) === qDef.target_store,
    ).length;

    const top10 = r.products.slice(0, 10).map((p, i) => ({
      rank: i + 1,
      domain: sellerDomain(p),
      title: p.title?.slice(0, 80) ?? "???",
      fieldPresence: fieldPresence(p),
      isTargetStore: sellerDomain(p) === qDef.target_store,
    }));

    queryResults.push({
      queryId: r.queryId,
      query: r.query,
      population: r.population,
      targetPresent: !!targetHit,
      targetRank: targetHit ? r.products.indexOf(targetHit) + 1 : null,
      sameStoreCount,
      top10,
    });
  }

  // Population-level presence@50
  const taResults = queryResults.filter(
    (qr) => qr.population === "title_absent",
  );
  const tpResults = queryResults.filter(
    (qr) => qr.population === "title_present",
  );

  const taPresent = taResults.filter((qr) => qr.targetPresent).length;
  const tpPresent = tpResults.filter((qr) => qr.targetPresent).length;
  const taPresence = taResults.length > 0 ? taPresent / taResults.length : 0;
  const tpPresence = tpResults.length > 0 ? tpPresent / tpResults.length : 0;
  const difference = tpPresence - taPresence;

  console.log(
    `\nTitle-absent: ${taPresent}/${taResults.length} present@50 = ${taPresence.toFixed(3)}`,
  );
  console.log(
    `Title-present: ${tpPresent}/${tpResults.length} present@50 = ${tpPresence.toFixed(3)}`,
  );
  console.log(
    `Difference (title-present - title-absent): ${difference.toFixed(3)}`,
  );

  // H4 verdict
  let h4Verdict: string;
  if (taResults.length < 8) {
    h4Verdict = `INCONCLUSIVE — fewer than 8 title-absent products (${taResults.length} assembled)`;
  } else if (tpResults.length < 6) {
    h4Verdict = `INCONCLUSIVE — fewer than 6 matched title-present controls (${tpResults.length} assembled)`;
  } else if (difference >= 0.4) {
    h4Verdict = `H4 SUPPORTED — title dominates retrieval (difference ${difference.toFixed(3)} ≥ 0.40)`;
  } else if (difference <= 0.15) {
    h4Verdict = `H4 REJECTED — difference within 0.15 (${difference.toFixed(3)})`;
  } else {
    h4Verdict = `H4 INCONCLUSIVE — difference ${difference.toFixed(3)} is between 0.15 and 0.40`;
  }
  console.log(`\n  ${h4Verdict}`);

  // Per-query detail
  console.log("\nPer-query results:");
  console.log(
    "| Q | Population | Query | Target present? | Best rank | Same-store count |",
  );
  console.log("|---|---|---|---|---|---|");
  for (const qr of queryResults) {
    console.log(
      `| ${qr.queryId} | ${qr.population} | ${qr.query.slice(0, 45)} | ${qr.targetPresent ? "YES" : "NO"} | ${qr.targetRank ?? "—"} | ${qr.sameStoreCount} |`,
    );
  }

  // Competitor displacement
  console.log("\nCompetitor displacement (top 10 per query):");
  for (const qr of queryResults) {
    console.log(`\n### ${qr.queryId} [${qr.population}]: ${qr.query}`);
    console.log("| Rank | Domain | Title | Field presence | Target store? |");
    console.log("|---|---|---|---|---|");
    for (const t of qr.top10) {
      console.log(
        `| ${t.rank} | ${t.domain} | ${t.title} | ${t.fieldPresence} | ${t.isTargetStore ? "YES" : ""} |`,
      );
    }
  }

  // Emit artifacts
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const jsonData = {
    scoped: false,
    h4: {
      titleAbsentPresence: taPresence,
      titlePresentPresence: tpPresence,
      difference,
      verdict: h4Verdict,
      titleAbsentCount: taResults.length,
      titlePresentCount: tpResults.length,
      titleAbsentPresent: taPresent,
      titlePresentPresent: tpPresent,
    },
    queryResults,
    transcript,
  };
  const jsonPath = join(dir, `h4-${stamp}.json`);
  await writeFile(jsonPath, JSON.stringify(jsonData, null, 2), "utf8");

  const md: string[] = [
    "# Stage 2.5b — H4 title-coverage test (DIRECTIVE-5 §4)",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "**Scoping:** UNSCOPED (no filters.shops)",
    "",
    "## H4 verdict",
    "",
    `> ${h4Verdict}`,
    "",
    "| Population | Present@50 | Queries | |",
    "|---|---|---|---|",
    `| Title-absent | ${taPresence.toFixed(3)} (${taPresent}/${taResults.length}) | ${taResults.length} | |`,
    `| Title-present | ${tpPresence.toFixed(3)} (${tpPresent}/${tpResults.length}) | ${tpResults.length} | |`,
    "",
    `**Difference (title-present - title-absent): ${difference.toFixed(3)}**`,
    "",
    "## Per-query results",
    "",
    "| Q | Population | Query | Target present? | Best rank | Same-store count |",
    "|---|---|---|---|---|---|",
  ];
  for (const qr of queryResults) {
    md.push(
      `| ${qr.queryId} | ${qr.population} | ${qr.query} | ${qr.targetPresent ? "YES" : "NO"} | ${qr.targetRank ?? "—"} | ${qr.sameStoreCount} |`,
    );
  }
  md.push("");
  md.push("## Competitor displacement");
  md.push("");
  for (const qr of queryResults) {
    md.push(`### ${qr.queryId} [${qr.population}]: ${qr.query}`);
    md.push("");
    md.push("| Rank | Domain | Title | Field presence | Target store? |");
    md.push("|---|---|---|---|---|");
    for (const t of qr.top10) {
      md.push(
        `| ${t.rank} | ${t.domain} | ${t.title} | ${t.fieldPresence} | ${t.isTargetStore ? "YES" : ""} |`,
      );
    }
    md.push("");
  }

  const mdPath = join(dir, `h4-${stamp}.md`);
  await writeFile(mdPath, md.join("\n"), "utf8");

  console.log(`\nArtifacts:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
