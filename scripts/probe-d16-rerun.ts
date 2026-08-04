/**
 * DIRECTIVE-16 §3: Re-run of exhaustion, real-query tail, and tail-range World B.
 *
 * Uses the relaxed I-1 invariant (15% abort, 20% ceiling, overlap logging).
 * Paginates to actual termination, not just 2 pages.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { PaginationInvariant, type CatalogProduct } from "../src/lib/scanner/invariants";

function searchWithInvariants(
  query: string,
  maxPages = 50,
): {
  products: CatalogProduct[];
  pageBoundaries: Array<{ page: number; count: number; distinctSoFar: number; cursor: string | undefined; overlap: number }>;
  invariant: PaginationInvariant;
  totalCount: number | null;
} {
  const inv = new PaginationInvariant(0.2, 0.15);
  const allProducts: CatalogProduct[] = [];
  const pageBoundaries: Array<{ page: number; count: number; distinctSoFar: number; cursor: string | undefined; overlap: number }> = [];
  let cursor: string | undefined;
  let page = 0;
  let totalCount: number | null = null;

  while (page < maxPages) {
    page++;
    const setArgs = [`/query=${query.replace(/'/g, "'\\''")}`, "/pagination/limit=50"];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;

    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const rawProducts = (data.result?.products || []) as Array<Record<string, unknown>>;
      const pagination = data.result?.pagination || {};
      if (totalCount === null) totalCount = pagination.total_count ?? null;

      const products: CatalogProduct[] = rawProducts.map((p) => ({
        id: p.id as string,
        title: p.title as string,
        surface: "catalog-api" as const,
        variants: (p.variants as Array<Record<string, unknown>>) || [],
      }));

      // I-1 check (relaxed)
      const prevIds = allProducts.slice(-50).map((p) => p.id);
      const currentIds = new Set(products.map((p) => p.id));
      const overlap = [...currentIds].filter((id) => prevIds.includes(id)).length;

      inv.check({
        products,
        cursor: pagination.cursor as string | undefined,
        hasNextPage: pagination.has_next_page as boolean,
      });

      allProducts.push(...products);
      const distinctSoFar = new Set(allProducts.map((p) => p.id)).size;
      pageBoundaries.push({
        page,
        count: products.length,
        distinctSoFar,
        cursor: pagination.cursor as string | undefined,
        overlap,
      });

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor as string;
    } catch (e) {
      console.error(`  Error on page ${page}: ${e}`);
      break;
    }
  }

  return { products: allProducts, pageBoundaries, invariant: inv, totalCount };
}

// ─── 1. Exhaustion — paginate to actual termination ───────────────────────

function testExhaustion() {
  console.log("=== §3.1 EXHAUSTION (relaxed I-1, paginate to termination) ===\n");

  const realQuery = "brake pads for 2018 Honda Civic Si";
  const nonsenseQuery = "zxqv flurbin widget";

  console.log(`Real query: "${realQuery}"\n`);
  const realResult = searchWithInvariants(realQuery, 50);
  console.log(`Pages: ${realResult.pageBoundaries.length}`);
  console.log(`Total products: ${realResult.products.length}`);
  console.log(`Distinct IDs: ${new Set(realResult.products.map((p) => p.id)).size}`);
  console.log(`total_count from API: ${realResult.totalCount}`);
  const realStats = realResult.invariant.getOverlapStats();
  console.log(`Overlap events: ${realStats.count}, mean: ${(realStats.mean * 100).toFixed(1)}%, max: ${(realStats.max * 100).toFixed(1)}%`);
  console.log(`Page boundaries:`);
  for (const b of realResult.pageBoundaries) {
    console.log(`  Page ${b.page}: ${b.count} products, ${b.distinctSoFar} distinct, overlap: ${b.overlap}`);
  }

  console.log(`\nNonsense query: "${nonsenseQuery}"\n`);
  const nonsenseResult = searchWithInvariants(nonsenseQuery, 50);
  console.log(`Pages: ${nonsenseResult.pageBoundaries.length}`);
  console.log(`Total products: ${nonsenseResult.products.length}`);
  console.log(`Distinct IDs: ${new Set(nonsenseResult.products.map((p) => p.id)).size}`);
  console.log(`total_count from API: ${nonsenseResult.totalCount}`);
  const nonsenseStats = nonsenseResult.invariant.getOverlapStats();
  console.log(`Overlap events: ${nonsenseStats.count}, mean: ${(nonsenseStats.mean * 100).toFixed(1)}%, max: ${(nonsenseStats.max * 100).toFixed(1)}%`);

  fs.writeFileSync("scripts/output/d16-exhaustion.json", JSON.stringify({
    real: {
      query: realQuery,
      pages: realResult.pageBoundaries.length,
      totalProducts: realResult.products.length,
      distinctIds: new Set(realResult.products.map((p) => p.id)).size,
      totalCount: realResult.totalCount,
      pageBoundaries: realResult.pageBoundaries,
      overlapStats: realStats,
    },
    nonsense: {
      query: nonsenseQuery,
      pages: nonsenseResult.pageBoundaries.length,
      totalProducts: nonsenseResult.products.length,
      distinctIds: new Set(nonsenseResult.products.map((p) => p.id)).size,
      totalCount: nonsenseResult.totalCount,
      pageBoundaries: nonsenseResult.pageBoundaries,
      overlapStats: nonsenseStats,
    },
  }, null, 2));

  return { realResult, nonsenseResult };
}

// ─── 2. Real-query tail inspection ─────────────────────────────────────────

function testRealQueryTail(realResult: { products: CatalogProduct[] }) {
  console.log("\n=== §3.2 REAL-QUERY TAIL INSPECTION ===\n");

  // Draw 20 products from ranks 200-220 (if available)
  const tail200 = realResult.products.slice(200, 220);
  console.log("Real query — ranks 200-220:");
  if (tail200.length === 0) {
    console.log("  NOT AVAILABLE — query exhausted before rank 200");
  } else {
    for (let i = 0; i < tail200.length; i++) {
      console.log(`  Rank ${200 + i}: ${tail200[i].title?.substring(0, 80)}`);
    }
  }

  // Also draw from ranks 100-120
  const tail100 = realResult.products.slice(100, 120);
  console.log("\nReal query — ranks 100-120:");
  if (tail100.length === 0) {
    console.log("  NOT AVAILABLE — query exhausted before rank 100");
  } else {
    for (let i = 0; i < tail100.length; i++) {
      console.log(`  Rank ${100 + i}: ${tail100[i].title?.substring(0, 80)}`);
    }
  }

  // And the last 20 products
  const last20 = realResult.products.slice(-20);
  console.log(`\nReal query — last 20 (ranks ${realResult.products.length - 20}-${realResult.products.length}):`);
  for (let i = 0; i < last20.length; i++) {
    const rank = realResult.products.length - 20 + i;
    console.log(`  Rank ${rank}: ${last20[i].title?.substring(0, 80)}`);
  }

  fs.writeFileSync("scripts/output/d16-real-query-tail.json", JSON.stringify({
    ranks200to220: tail200.map((p, i) => ({ rank: 200 + i, id: p.id, title: p.title })),
    ranks100to120: tail100.map((p, i) => ({ rank: 100 + i, id: p.id, title: p.title })),
    last20: last20.map((p, i) => ({ rank: realResult.products.length - 20 + i, id: p.id, title: p.title })),
    totalProducts: realResult.products.length,
  }, null, 2));
}

// ─── 3. World B — tail-range determinism ───────────────────────────────────

function testWorldBTail() {
  console.log("\n=== §3.3 WORLD B — TAIL-RANGE DETERMINISM ===\n");

  const query = "brake pads for 2018 Honda Civic Si";
  const runs: CatalogProduct[][] = [];
  const overlapStats: Array<{ count: number; mean: number; max: number }> = [];

  for (let run = 0; run < 3; run++) {
    console.log(`Run ${run + 1}...`);
    const result = searchWithInvariants(query, 50);
    runs.push(result.products);
    const stats = result.invariant.getOverlapStats();
    overlapStats.push(stats);
    console.log(`  ${result.products.length} products, ${new Set(result.products.map((p) => p.id)).size} distinct IDs`);
    console.log(`  Overlap: ${stats.count} events, mean ${(stats.mean * 100).toFixed(1)}%, max ${(stats.max * 100).toFixed(1)}%`);
  }

  // Compute Jaccard for full set and for tail (ranks 50+)
  const sets = runs.map((r) => new Set(r.map((p) => p.id)));
  const jaccard = (a: Set<string>, b: Set<string>) => {
    let intersection = 0;
    for (const x of a) if (b.has(x)) intersection++;
    const union = a.size + b.size - intersection;
    return intersection / union;
  };

  const j01 = jaccard(sets[0], sets[1]);
  const j02 = jaccard(sets[0], sets[2]);
  const j12 = jaccard(sets[1], sets[2]);
  const avgJaccard = (j01 + j02 + j12) / 3;

  // Positional agreement for head (0-50) and tail (50+)
  let headMatch = 0;
  let tailMatch = 0;
  const minLen = Math.min(runs[0].length, runs[1].length, runs[2].length);
  for (let i = 0; i < minLen; i++) {
    if (runs[0][i].id === runs[1][i].id && runs[0][i].id === runs[2][i].id) {
      if (i < 50) headMatch++;
      else tailMatch++;
    }
  }

  // Tail set overlap (ranks 50+)
  const tailSets = runs.map((r) => new Set(r.slice(50).map((p) => p.id)));
  const tailJ01 = jaccard(tailSets[0], tailSets[1]);
  const tailJ02 = jaccard(tailSets[0], tailSets[2]);
  const tailJ12 = jaccard(tailSets[1], tailSets[2]);
  const tailAvgJaccard = (tailJ01 + tailJ02 + tailJ12) / 3;

  console.log(`\nFull-set Jaccard: ${avgJaccard.toFixed(4)}`);
  console.log(`Head (0-50) positional agreement: ${headMatch}/50 (${(headMatch / 50 * 100).toFixed(1)}%)`);
  console.log(`Tail (50+) positional agreement: ${tailMatch}/${minLen - 50} (${(tailMatch / Math.max(1, minLen - 50) * 100).toFixed(1)}%)`);
  console.log(`Tail-set Jaccard: ${tailAvgJaccard.toFixed(4)}`);

  fs.writeFileSync("scripts/output/d16-world-b-tail.json", JSON.stringify({
    query,
    runs: runs.map((r, i) => ({
      run: i,
      productCount: r.length,
      distinctIds: new Set(r.map((p) => p.id)).size,
      overlapStats: overlapStats[i],
    })),
    fullSetJaccard: { "0v1": j01, "0v2": j02, "1v2": j12, average: avgJaccard },
    tailSetJaccard: { "0v1": tailJ01, "0v2": tailJ02, "1v2": tailJ12, average: tailAvgJaccard },
    headPositional: { matches: headMatch, total: 50, rate: headMatch / 50 },
    tailPositional: { matches: tailMatch, total: Math.max(0, minLen - 50), rate: tailMatch / Math.max(1, minLen - 50) },
  }, null, 2));

  return { avgJaccard, tailAvgJaccard, headMatch, tailMatch, minLen };
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("DIRECTIVE-16 §3: Re-run of exhaustion, real-query tail, tail-range World B\n");
console.log("I-1 relaxed: 15% abort, 20% ceiling, overlap logging enabled\n");

const { realResult } = testExhaustion();
testRealQueryTail(realResult);
const worldB = testWorldBTail();

console.log("\n=== §3 RE-RUN COMPLETE ===");
console.log("Data saved to scripts/output/d16-exhaustion.json, d16-real-query-tail.json, d16-world-b-tail.json");
