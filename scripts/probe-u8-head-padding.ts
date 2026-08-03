/**
 * U-8: Head/padding boundary probe — REFINED
 *
 * U8-B: Token-overlap decay. Binary "any token" is too coarse for auto parts
 * (every product contains "brake" or "honda"). Added fractional overlap:
 * fraction of query tokens found in product text. This decays even when
 * binary overlap stays at 1.0.
 *
 * U8-A: Determinism. Same query 3x, compare product-ID sequences.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const STOPWORDS = new Set([
  "a", "an", "the", "for", "of", "in", "on", "at", "to", "with", "and", "or", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "can", "this", "that", "these", "those",
  "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "when", "where", "why",
  "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "not", "only", "own", "same", "so", "than", "too", "very", "just", "but", "if", "as", "by",
  "from", "about", "into", "through", "during", "before", "after", "above", "below", "up",
  "down", "out", "off", "over", "under", "again", "further", "then", "once", "here", "there",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function productText(p: { title: string; tech_specs?: Record<string, unknown> | null; description?: { plain?: string } | string }): string {
  let text = (p.title || "").toLowerCase();
  if (p.tech_specs) text += " " + JSON.stringify(p.tech_specs).toLowerCase();
  if (typeof p.description === "string") text += " " + p.description.toLowerCase();
  else if (p.description?.plain) text += " " + p.description.plain.toLowerCase();
  return text;
}

// --- UCP CLI wrapper ---

function ucpSearch(query: string, cursor?: string): { products: Array<{ id: string; title: string; metadata?: { tech_specs?: Record<string, unknown> | null } }>; pagination: { has_next_page: boolean; cursor?: string; total_count?: number } } {
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

function ucpSearchAll(query: string, maxProducts = 350): Array<{ id: string; title: string; metadata?: { tech_specs?: Record<string, unknown> | null } }> {
  const all: Array<{ id: string; title: string; metadata?: { tech_specs?: Record<string, unknown> | null } }> = [];
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

// --- U8-B: Token-overlap decay ---

function computeDeciles(products: Array<{ title: string; metadata?: { tech_specs?: Record<string, unknown> | null } }>, queryTokens: string[]) {
  const n = products.length;
  const decileSize = Math.ceil(n / 10);
  const deciles: Array<{ decile: number; rankRange: [number, number]; binaryRate: number; fractionalRate: number; binaryCount: number; fractionalSum: number }> = [];

  for (let d = 0; d < 10; d++) {
    const start = d * decileSize;
    const end = Math.min(start + decileSize, n);
    if (start >= n) break;
    let binaryCount = 0;
    let fractionalSum = 0;
    for (let i = start; i < end; i++) {
      const text = productText(products[i]);
      const matched = queryTokens.filter((t) => text.includes(t));
      if (matched.length > 0) binaryCount++;
      fractionalSum += matched.length / queryTokens.length;
    }
    const count = end - start;
    deciles.push({
      decile: d,
      rankRange: [start + 1, end],
      binaryRate: binaryCount / count,
      fractionalRate: fractionalSum / count,
      binaryCount,
      fractionalSum,
    });
  }
  return deciles;
}

function estimateH(deciles: Array<{ fractionalRate: number }>, baseline: number, threshold: number): number | null {
  for (let d = 0; d < deciles.length; d++) {
    if (Math.abs(deciles[d].fractionalRate - baseline) <= threshold) {
      let stays = true;
      for (let d2 = d + 1; d2 < deciles.length; d2++) {
        if (Math.abs(deciles[d2].fractionalRate - baseline) > threshold) {
          stays = false;
          break;
        }
      }
      if (stays || d === deciles.length - 1) {
        return deciles[d].rankRange[0] - 1;
      }
    }
  }
  return null;
}

// --- Main ---

async function main() {
  console.log("=== U-8: Head/padding boundary probe (refined) ===\n");

  // Step 1: Get nonsense baseline
  console.log("Step 1: Fetching nonsense query products for baseline...");
  const nonsenseProducts = ucpSearchAll("zxqv flurbin widget", 350);
  console.log(`  Got ${nonsenseProducts.length} nonsense products`);
  const nonsenseTokens = tokenize("zxqv flurbin widget");
  console.log(`  Nonsense tokens: ${nonsenseTokens.join(", ")}`);
  const nonsenseDeciles = computeDeciles(nonsenseProducts, nonsenseTokens);
  const nonsenseBinaryBaseline = nonsenseDeciles.reduce((s, d) => s + d.binaryRate, 0) / nonsenseDeciles.length;
  const nonsenseFractionalBaseline = nonsenseDeciles.reduce((s, d) => s + d.fractionalRate, 0) / nonsenseDeciles.length;
  console.log(`  Nonsense binary baseline: ${nonsenseBinaryBaseline.toFixed(4)}`);
  console.log(`  Nonsense fractional baseline: ${nonsenseFractionalBaseline.toFixed(4)}`);

  // Step 2: U8-B from existing depth-1000 data
  console.log("\nStep 2: U8-B token-overlap decay from existing data...");
  const extracted = JSON.parse(
    fs.readFileSync("scripts/output/u8b-extracted.json", "utf8"),
  ) as { queries: Array<{ queryId: string; query: string; productCount: number; products: Array<{ rank: number; title: string; tech_specs?: Record<string, unknown> | null }> }> };

  const u8bResults: Array<{
    queryId: string;
    query: string;
    productCount: number;
    deciles: Array<{ decile: number; rankRange: [number, number]; binaryRate: number; fractionalRate: number }>;
    estimatedH_binary: number | null;
    estimatedH_fractional: number | null;
  }> = [];

  for (const q of extracted.queries) {
    const queryTokens = tokenize(q.query);
    const products = q.products.map((p) => ({ title: p.title, metadata: { tech_specs: p.tech_specs } }));
    const deciles = computeDeciles(products, queryTokens);
    const hBinary = estimateH(deciles.map((d) => ({ fractionalRate: d.binaryRate })), nonsenseBinaryBaseline, 0.10);
    const hFractional = estimateH(deciles, nonsenseFractionalBaseline, 0.10);
    u8bResults.push({
      queryId: q.queryId,
      query: q.query,
      productCount: q.productCount,
      deciles: deciles.map((d) => ({ decile: d.decile, rankRange: d.rankRange, binaryRate: d.binaryRate, fractionalRate: d.fractionalRate })),
      estimatedH_binary: hBinary,
      estimatedH_fractional: hFractional,
    });
  }

  console.log("\n  U8-B results (fractional overlap):");
  console.log("  Query | H_binary | H_fractional | Decile rates (fractional)");
  for (const q of u8bResults) {
    const rates = q.deciles.map((d) => d.fractionalRate.toFixed(2)).join(" ");
    console.log(`  ${q.queryId} ${q.query.substring(0, 40).padEnd(40)} | ${String(q.estimatedH_binary).padStart(4)} | ${String(q.estimatedH_fractional).padStart(4)} | ${rates}`);
  }

  // Step 3: U8-A determinism probe
  console.log("\nStep 3: U8-A determinism probe (3 runs each)...");
  const realQuery = "brake pads for 2018 Honda Civic Si";
  const nonsenseQuery = "zxqv flurbin widget";

  const realRuns: string[][] = [];
  const nonsenseRuns: string[][] = [];

  for (let i = 0; i < 3; i++) {
    console.log(`  Run ${i + 1}/3: real query...`);
    const realProducts = ucpSearchAll(realQuery, 300);
    realRuns.push(realProducts.map((p) => p.id));
    console.log(`    Got ${realProducts.length} products`);
    console.log(`  Run ${i + 1}/3: nonsense query...`);
    const nsProducts = ucpSearchAll(nonsenseQuery, 300);
    nonsenseRuns.push(nsProducts.map((p) => p.id));
    console.log(`    Got ${nsProducts.length} products`);
  }

  function analyzeDeterminism(runs: string[][], label: string) {
    const minLen = Math.min(...runs.map((r) => r.length));
    let firstDivergence: number | null = null;
    for (let rank = 0; rank < minLen; rank++) {
      if (!runs.every((r) => r[rank] === runs[0][rank])) {
        firstDivergence = rank + 1;
        break;
      }
    }
    const decileSize = Math.ceil(minLen / 10);
    const agreementByDecile: number[] = [];
    for (let d = 0; d < 10; d++) {
      const start = d * decileSize;
      const end = Math.min(start + decileSize, minLen);
      if (start >= minLen) break;
      let agreements = 0;
      for (let rank = start; rank < end; rank++) {
        if (runs.every((r) => r[rank] === runs[0][rank])) agreements++;
      }
      agreementByDecile.push(agreements / (end - start));
    }
    console.log(`  ${label}: ${minLen} products, first divergence at rank ${firstDivergence ?? "none"}`);
    console.log(`    Agreement by decile: ${agreementByDecile.map((a) => a.toFixed(2)).join(" ")}`);
    return { query: label, runCounts: runs.map((r) => r.length), firstDivergence, agreementByDecile };
  }

  const u8aReal = analyzeDeterminism(realRuns, realQuery);
  const u8aNonsense = analyzeDeterminism(nonsenseRuns, nonsenseQuery);

  // Save
  const results = {
    timestamp: new Date().toISOString(),
    directive: "DIRECTIVE-9 §1 / DIRECTIVE-11 §5",
    u8b: {
      method: "Token-overlap decay (binary + fractional) from existing depth-1000 data",
      nonsenseBaseline: {
        binary: nonsenseBinaryBaseline,
        fractional: nonsenseFractionalBaseline,
        nonsenseProductCount: nonsenseProducts.length,
        nonsenseProductTitles: nonsenseProducts.slice(0, 5).map((p) => p.title),
      },
      perQuery: u8bResults,
    },
    u8a: {
      method: "Determinism probe — same query 3x, compare product-ID sequences",
      realQuery: u8aReal,
      nonsenseQuery: u8aNonsense,
    },
  };

  fs.writeFileSync("scripts/output/u8-results.json", JSON.stringify(results, null, 2));
  console.log("\nResults saved to scripts/output/u8-results.json");
}

main().catch(console.error);
