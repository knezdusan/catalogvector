/**
 * U-8-A REFINED (DIRECTIVE-12 §1):
 * - Compute set overlap (Jaccard) alongside positional agreement
 * - Re-run nonsense query (run 3 terminated at 200 last time)
 * - Extend to 4 real queries
 * - Save raw product IDs from each run
 *
 * World A: low set overlap → padding is real (tail drawn fresh each time)
 * World B: high set overlap, low positional agreement → stable candidate set with noisy ordering
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

function ucpSearch(query: string, cursor?: string): { products: Array<{ id: string; title: string }>; pagination: { has_next_page: boolean; cursor?: string } } {
  const setArg = cursor ? `/query=${query.replace(/'/g, "'\\''")},cursor=${cursor}` : `/query=${query.replace(/'/g, "'\\''")}`;
  const cmd = `ucp catalog search --set '${setArg}' --json 2>/dev/null`;
  try {
    const output = execSync(cmd, { timeout: 60000, encoding: "utf8", env: { ...process.env } });
    const data = JSON.parse(output);
    const products = data.result?.products || [];
    const pagination = data.result?.pagination || { has_next_page: false };
    return { products, pagination };
  } catch (e) {
    console.error(`  UCP search failed: ${e}`);
    return { products: [], pagination: { has_next_page: false } };
  }
}

function ucpSearchAll(query: string, maxProducts = 300): Array<{ id: string; title: string }> {
  const all: Array<{ id: string; title: string }> = [];
  let cursor: string | undefined;
  while (all.length < maxProducts) {
    const { products, pagination } = ucpSearch(query, cursor);
    if (products.length === 0) break;
    all.push(...products);
    if (!pagination.has_next_page) break;
    cursor = pagination.cursor;
  }
  return all.slice(0, maxProducts);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function setOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  return intersection / Math.min(a.size, b.size);
}

function analyzeDeterminism(runs: Array<{ ids: string[]; titles: string[] }>, label: string) {
  const minLen = Math.min(...runs.map((r) => r.ids.length));

  // Positional agreement
  let firstDivergence: number | null = null;
  for (let rank = 0; rank < minLen; rank++) {
    if (!runs.every((r) => r.ids[rank] === runs[0].ids[rank])) {
      firstDivergence = rank + 1;
      break;
    }
  }

  const decileSize = Math.ceil(minLen / 10);
  const positionalByDecile: number[] = [];
  for (let d = 0; d < 10; d++) {
    const start = d * decileSize;
    const end = Math.min(start + decileSize, minLen);
    if (start >= minLen) break;
    let agreements = 0;
    for (let rank = start; rank < end; rank++) {
      if (runs.every((r) => r.ids[rank] === runs[0].ids[rank])) agreements++;
    }
    positionalByDecile.push(agreements / (end - start));
  }

  // Set overlap (Jaccard) — pairwise across all runs
  const sets = runs.map((r) => new Set(r.ids));
  const jaccardPairs: number[] = [];
  const overlapPairs: number[] = [];
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      jaccardPairs.push(jaccard(sets[i], sets[j]));
      overlapPairs.push(setOverlap(sets[i], sets[j]));
    }
  }
  const meanJaccard = jaccardPairs.reduce((s, x) => s + x, 0) / jaccardPairs.length;
  const meanOverlap = overlapPairs.reduce((s, x) => s + x, 0) / overlapPairs.length;

  // Set overlap restricted to ranks 13-300 (post-deterministic-prefix)
  const tailSets = runs.map((r) => new Set(r.ids.slice(12)));
  const tailJaccardPairs: number[] = [];
  for (let i = 0; i < tailSets.length; i++) {
    for (let j = i + 1; j < tailSets.length; j++) {
      tailJaccardPairs.push(jaccard(tailSets[i], tailSets[j]));
    }
  }
  const meanTailJaccard = tailJaccardPairs.reduce((s, x) => s + x, 0) / tailJaccardPairs.length;

  // Set overlap by decile
  const setOverlapByDecile: number[] = [];
  for (let d = 0; d < 10; d++) {
    const start = d * decileSize;
    const end = Math.min(start + decileSize, minLen);
    if (start >= minLen) break;
    const decileSets = runs.map((r) => new Set(r.ids.slice(start, end)));
    const decileJaccards: number[] = [];
    for (let i = 0; i < decileSets.length; i++) {
      for (let j = i + 1; j < decileSets.length; j++) {
        decileJaccards.push(jaccard(decileSets[i], decileSets[j]));
      }
    }
    setOverlapByDecile.push(decileJaccards.reduce((s, x) => s + x, 0) / decileJaccards.length);
  }

  console.log(`  ${label}: ${minLen} min products, first divergence at rank ${firstDivergence ?? "none"}`);
  console.log(`    Positional agreement by decile: ${positionalByDecile.map((a) => a.toFixed(2)).join(" ")}`);
  console.log(`    Set overlap (Jaccard) by decile: ${setOverlapByDecile.map((a) => a.toFixed(2)).join(" ")}`);
  console.log(`    Full-set Jaccard: ${meanJaccard.toFixed(4)} | Overlap: ${meanOverlap.toFixed(4)}`);
  console.log(`    Tail (ranks 13+) Jaccard: ${meanTailJaccard.toFixed(4)}`);
  console.log(`    World: ${meanTailJaccard > 0.8 ? "B (stable set, noisy order)" : meanTailJaccard < 0.3 ? "A (fresh draw padding)" : "MIXED"}`);

  return {
    query: label,
    runCounts: runs.map((r) => r.ids.length),
    firstDivergence,
    positionalByDecile,
    setOverlapByDecile,
    fullSetJaccard: meanJaccard,
    fullSetOverlap: meanOverlap,
    tailJaccard: meanTailJaccard,
    jaccardPairs,
    overlapPairs,
    tailJaccardPairs,
    // Save raw IDs for reproducibility
    rawIds: runs.map((r) => r.ids),
    rawTitles: runs.map((r) => r.titles),
  };
}

async function main() {
  console.log("=== U-8-A REFINED (DIRECTIVE-12 §1) ===\n");

  const realQueries = [
    "brake pads for 2018 Honda Civic Si",
    "cold air intake for 2023 Honda Civic Type R FL5",
    "BC Racing BR Series coilovers for 2009 Acura TL",
    "downpipe for 2018 Honda Civic Type R FK8",
  ];
  const nonsenseQuery = "zxqv flurbin widget";
  const runsPerQuery = 3;

  const realResults: ReturnType<typeof analyzeDeterminism>[] = [];

  for (const query of realQueries) {
    console.log(`\nReal query: "${query}"`);
    const runs: Array<{ ids: string[]; titles: string[] }> = [];
    for (let i = 0; i < runsPerQuery; i++) {
      console.log(`  Run ${i + 1}/${runsPerQuery}...`);
      const products = ucpSearchAll(query, 300);
      runs.push({
        ids: products.map((p) => p.id),
        titles: products.map((p) => p.title),
      });
      console.log(`    Got ${products.length} products`);
    }
    realResults.push(analyzeDeterminism(runs, query));
  }

  console.log(`\nNonsense query: "${nonsenseQuery}"`);
  const nonsenseRuns: Array<{ ids: string[]; titles: string[] }> = [];
  for (let i = 0; i < runsPerQuery; i++) {
    console.log(`  Run ${i + 1}/${runsPerQuery}...`);
    const products = ucpSearchAll(nonsenseQuery, 300);
    nonsenseRuns.push({
      ids: products.map((p) => p.id),
      titles: products.map((p) => p.title),
    });
    console.log(`    Got ${products.length} products`);
  }
  const nonsenseResult = analyzeDeterminism(nonsenseRuns, nonsenseQuery);

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log("Query | First Div | Full Jaccard | Tail Jaccard | World");
  for (const r of realResults) {
    const world = r.tailJaccard > 0.8 ? "B" : r.tailJaccard < 0.3 ? "A" : "MIXED";
    console.log(`  ${r.query.substring(0, 50).padEnd(50)} | ${String(r.firstDivergence).padStart(4)} | ${r.fullSetJaccard.toFixed(3)} | ${r.tailJaccard.toFixed(3)} | ${world}`);
  }
  const nsWorld = nonsenseResult.tailJaccard > 0.8 ? "B" : nonsenseResult.tailJaccard < 0.3 ? "A" : "MIXED";
  console.log(`  ${nonsenseQuery.substring(0, 50).padEnd(50)} | ${String(nonsenseResult.firstDivergence).padStart(4)} | ${nonsenseResult.fullSetJaccard.toFixed(3)} | ${nonsenseResult.tailJaccard.toFixed(3)} | ${nsWorld}`);

  // Save
  const results = {
    timestamp: new Date().toISOString(),
    directive: "DIRECTIVE-12 §1",
    method: "Determinism probe with set overlap (Jaccard) — 3 runs each, 4 real queries + 1 nonsense",
    realQueries: realResults,
    nonsenseQuery: nonsenseResult,
    interpretation: {
      worldA: "Low set overlap (<0.3 Jaccard) → tail drawn fresh each time → padding is real → 'absent at depth' is weak",
      worldB: "High set overlap (>0.8 Jaccard) with low positional agreement → stable candidate set, noisy ordering → 'absent at depth' is strong",
    },
  };

  fs.writeFileSync("scripts/output/u8a-refined-results.json", JSON.stringify(results, null, 2));
  console.log("\nResults saved to scripts/output/u8a-refined-results.json");
}

main().catch(console.error);
