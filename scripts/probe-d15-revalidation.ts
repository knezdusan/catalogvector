/**
 * DIRECTIVE-15 §4: Re-validation through the instrumented library.
 *
 * 1. Exhaustion: paginate one real query and one nonsense query until
 *    has_next_page is false. Report terminating count, final page size,
 *    distinct-ID count at every page boundary. State exact CLI invocation.
 *
 * 2. World B: re-run the three-run determinism probe with correct pagination.
 *    Report set Jaccard and positional agreement, plus distinct-ID count per run.
 *
 * 3. Tail inspection: draw 20 products from true ranks 200-300 of a real query
 *    and 20 from a nonsense query. Hand-read the titles.
 *
 * 4. Depth-1000: confirm whether the DIRECTIVE-7 Stage 2 script paginated
 *    correctly. If not, the six absent and three absolutely-invisible targets
 *    are withdrawn pending a re-run.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { PaginationInvariant, type CatalogProduct } from "../src/lib/scanner/invariants";

// ─── Helper: paginated search with I-1 enforcement ────────────────────────

function searchWithInvariants(
  query: string,
  maxPages = 50,
): { products: CatalogProduct[]; pageBoundaries: Array<{ page: number; count: number; distinctSoFar: number; cursor: string | undefined }> } {
  const inv = new PaginationInvariant();
  const allProducts: CatalogProduct[] = [];
  const pageBoundaries: Array<{ page: number; count: number; distinctSoFar: number; cursor: string | undefined }> = [];
  let cursor: string | undefined;
  let page = 0;

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

      const products: CatalogProduct[] = rawProducts.map((p) => ({
        id: p.id as string,
        title: p.title as string,
        surface: "catalog-api" as const,
        variants: (p.variants as Array<Record<string, unknown>>) || [],
      }));

      // I-1 check
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
      });

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor as string;
    } catch (e) {
      console.error(`  Error on page ${page}: ${e}`);
      break;
    }
  }

  return { products: allProducts, pageBoundaries };
}

// ─── 1. Exhaustion ────────────────────────────────────────────────────────

function testExhaustion() {
  console.log("=== §4.1 EXHAUSTION ===\n");

  const realQuery = "brake pads for 2018 Honda Civic Si";
  const nonsenseQuery = "zxqv flurbin widget";

  console.log(`Real query: "${realQuery}"`);
  console.log(`CLI: ucp catalog search --set '/query=${realQuery}' --set '/pagination/cursor=<cursor>'\n`);

  const realResult = searchWithInvariants(realQuery);
  console.log(`Pages: ${realResult.pageBoundaries.length}`);
  console.log(`Total products: ${realResult.products.length}`);
  console.log(`Distinct IDs: ${new Set(realResult.products.map((p) => p.id)).size}`);
  console.log(`Page boundaries:`);
  for (const b of realResult.pageBoundaries) {
    console.log(`  Page ${b.page}: ${b.count} products, ${b.distinctSoFar} distinct so far, cursor: ${b.cursor?.substring(0, 20)}...`);
  }

  console.log(`\nNonsense query: "${nonsenseQuery}"`);
  console.log(`CLI: ucp catalog search --set '/query=${nonsenseQuery}' --set '/pagination/cursor=<cursor>'\n`);

  const nonsenseResult = searchWithInvariants(nonsenseQuery);
  console.log(`Pages: ${nonsenseResult.pageBoundaries.length}`);
  console.log(`Total products: ${nonsenseResult.products.length}`);
  console.log(`Distinct IDs: ${new Set(nonsenseResult.products.map((p) => p.id)).size}`);
  console.log(`Page boundaries:`);
  for (const b of nonsenseResult.pageBoundaries) {
    console.log(`  Page ${b.page}: ${b.count} products, ${b.distinctSoFar} distinct so far, cursor: ${b.cursor?.substring(0, 20)}...`);
  }

  // Save
  fs.writeFileSync("scripts/output/d15-exhaustion.json", JSON.stringify({
    real: {
      query: realQuery,
      pages: realResult.pageBoundaries.length,
      totalProducts: realResult.products.length,
      distinctIds: new Set(realResult.products.map((p) => p.id)).size,
      pageBoundaries: realResult.pageBoundaries,
    },
    nonsense: {
      query: nonsenseQuery,
      pages: nonsenseResult.pageBoundaries.length,
      totalProducts: nonsenseResult.products.length,
      distinctIds: new Set(nonsenseResult.products.map((p) => p.id)).size,
      pageBoundaries: nonsenseResult.pageBoundaries,
    },
  }, null, 2));

  return { realResult, nonsenseResult };
}

// ─── 2. World B — determinism probe ────────────────────────────────────────

function testWorldB() {
  console.log("\n=== §4.2 WORLD B (determinism) ===\n");

  const query = "brake pads for 2018 Honda Civic Si";
  const runs: CatalogProduct[][] = [];

  for (let run = 0; run < 3; run++) {
    console.log(`Run ${run + 1}...`);
    const result = searchWithInvariants(query, 50);
    runs.push(result.products);
    console.log(`  ${result.products.length} products, ${new Set(result.products.map((p) => p.id)).size} distinct IDs`);
  }

  // Compute Jaccard overlap between runs
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

  // Positional agreement: same product at same rank
  let positionalMatch = 0;
  const minLen = Math.min(runs[0].length, runs[1].length, runs[2].length);
  for (let i = 0; i < minLen; i++) {
    if (runs[0][i].id === runs[1][i].id && runs[0][i].id === runs[2][i].id) {
      positionalMatch++;
    }
  }

  console.log(`\nJaccard overlap:`);
  console.log(`  Run 0 vs Run 1: ${j01.toFixed(4)}`);
  console.log(`  Run 0 vs Run 2: ${j02.toFixed(4)}`);
  console.log(`  Run 1 vs Run 2: ${j12.toFixed(4)}`);
  console.log(`  Average: ${avgJaccard.toFixed(4)}`);
  console.log(`\nPositional agreement: ${positionalMatch} / ${minLen} (${(positionalMatch / minLen * 100).toFixed(1)}%)`);
  console.log(`Distinct IDs per run: ${sets.map((s, i) => `Run ${i}: ${s.size}`).join(", ")}`);

  fs.writeFileSync("scripts/output/d15-world-b.json", JSON.stringify({
    query,
    runs: runs.map((r, i) => ({
      run: i,
      productCount: r.length,
      distinctIds: new Set(r.map((p) => p.id)).size,
      productIds: r.map((p) => p.id),
    })),
    jaccard: { "0v1": j01, "0v2": j02, "1v2": j12, average: avgJaccard },
    positionalAgreement: { matches: positionalMatch, total: minLen, rate: positionalMatch / minLen },
  }, null, 2));

  return { avgJaccard, positionalMatch, minLen };
}

// ─── 3. Tail inspection ───────────────────────────────────────────────────

function testTail(realResult: { products: CatalogProduct[] }, nonsenseResult: { products: CatalogProduct[] }) {
  console.log("\n=== §4.3 TAIL INSPECTION ===\n");

  // Draw 20 products from ranks 200-300 of the real query
  const realTail = realResult.products.slice(200, 220);
  console.log("Real query — ranks 200-220:");
  for (let i = 0; i < realTail.length; i++) {
    console.log(`  Rank ${200 + i}: ${realTail[i].title?.substring(0, 80)}`);
  }

  // Draw 20 products from the nonsense query
  const nonsenseTail = nonsenseResult.products.slice(0, 20);
  console.log("\nNonsense query — first 20:");
  for (let i = 0; i < nonsenseTail.length; i++) {
    console.log(`  Rank ${i}: ${nonsenseTail[i].title?.substring(0, 80)}`);
  }

  fs.writeFileSync("scripts/output/d15-tail-inspection.json", JSON.stringify({
    real: realTail.map((p, i) => ({ rank: 200 + i, id: p.id, title: p.title })),
    nonsense: nonsenseTail.map((p, i) => ({ rank: i, id: p.id, title: p.title })),
  }, null, 2));
}

// ─── 4. Depth-1000 ────────────────────────────────────────────────────────

function testDepth1000() {
  console.log("\n=== §4.4 DEPTH-1000 ===\n");

  // Check if the depth-1000 script exists and inspect its pagination
  const scriptPath = "scripts/probe-depth1000.ts";
  if (!fs.existsSync(scriptPath)) {
    console.log(`Script not found: ${scriptPath}`);
    console.log("Checking for the script in other locations...");
    const files = fs.readdirSync("scripts").filter((f) => f.includes("depth"));
    console.log(`Found: ${files.join(", ")}`);
    return;
  }

  const script = fs.readFileSync(scriptPath, "utf8");

  // Check for the pagination bug pattern (comma-separated --set args)
  const hasCommaBug = script.includes("query=...,cursor=") || script.includes("',cursor=");
  const hasCorrectPagination = script.includes("--set '/pagination/cursor=") || script.includes("pagination/cursor");

  console.log(`Script: ${scriptPath}`);
  console.log(`Has comma-separated pagination bug: ${hasCommaBug}`);
  console.log(`Has correct separate --set pagination: ${hasCorrectPagination}`);

  // Check for I-1 invariant
  const hasInvariant = script.includes("PaginationInvariant") || script.includes("I-1");

  console.log(`Uses I-1 invariant: ${hasInvariant}`);

  if (hasCommaBug && !hasCorrectPagination) {
    console.log("\nVERDICT: Depth-1000 script has the pagination bug. Results are WITHDRAWN pending re-run.");
  } else if (hasCorrectPagination) {
    console.log("\nVERDICT: Depth-1000 script uses correct pagination. Results may be valid.");
  } else {
    console.log("\nVERDICT: Cannot determine pagination method. Manual review needed.");
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("DIRECTIVE-15 §4: Re-validation through instrumented library\n");

const { realResult, nonsenseResult } = testExhaustion();
const worldB = testWorldB();
testTail(realResult, nonsenseResult);
testDepth1000();

console.log("\n=== §4 RE-VALIDATION COMPLETE ===");
console.log("Data saved to scripts/output/d15-exhaustion.json, d15-world-b.json, d15-tail-inspection.json");
