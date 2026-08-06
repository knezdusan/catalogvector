/**
 * DIRECTIVE-19 §3.4: Same-day noise floor.
 *
 * Run 3 full enumeration runs for TSP and Subimods, report:
 *   - Jaccard overlap between runs (set similarity)
 *   - Per-run absence variance (how stable is the absence measurement)
 *
 * The partition is reused from D17 (committed in output files).
 * Each run issues the same partition queries against the Catalog API
 * and collects handles. The noise floor is the run-to-run variation.
 *
 * Rate-limited per C7. Invariants I-1 through I-6 enforced.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

type Store = {
  name: string;
  domain: string;
  shopGid: string;
  partitionFile: string; // file with the partition queries
  sitemapCount: number;
};

type EnumRun = {
  run: number;
  handles: Set<string>;
  handleCount: number;
  queryCount: number;
  durationSec: number;
};

// ─── Store configs ────────────────────────────────────────────────────────

const STORES: Store[] = [
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    shopGid: "gid://shopify/Shop/1357086779",
    partitionFile: "scripts/output/d17-tsp-enumeration.json",
    sitemapCount: 2608,
  },
  {
    name: "subimods",
    domain: "www.subimods.com",
    shopGid: "gid://shopify/Shop/58735984815",
    partitionFile: "scripts/output/d17-subimods-full-metadata.json",
    sitemapCount: 18066,
  },
];

// ─── Partition loading ────────────────────────────────────────────────────

async function loadPartition(store: Store): Promise<string[]> {
  if (store.name === "tsp") {
    return buildPartitionFromMetadata(store);
  } else {
    return buildPartitionFromMetadata(store);
  }
}

async function buildPartitionFromMetadata(store: Store): Promise<string[]> {
  const products = await fetchProductsJson(store.domain);
  const vendors = new Set<string>();
  const productTypes = new Set<string>();

  for (const p of products) {
    if (p.vendor && p.vendor.trim().length > 2) vendors.add(p.vendor.trim());
    if (p.product_type && p.product_type.trim().length > 2) productTypes.add(p.product_type.trim());
  }

  const queries = [...new Set([...vendors, ...productTypes])].sort();
  console.log(`  ${store.name}: ${vendors.size} vendors + ${productTypes.size} product types = ${queries.length} queries`);
  return queries;
}

type Product = {
  id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
};

async function fetchProductsJson(domain: string): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  let emptyPages = 0;

  while (page <= 100 && emptyPages < 3) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "CatalogVector/1.0 (research project)" },
      });
      if (!resp.ok) {
        emptyPages++;
        page++;
        execSync("sleep 1.1");
        continue;
      }
      const data = (await resp.json()) as { products: Product[] };
      const products = data.products || [];
      if (products.length === 0) {
        emptyPages++;
      } else {
        emptyPages = 0;
        all.push(...products);
      }
    } catch {
      emptyPages++;
    }
    page++;
    execSync("sleep 1.1");
  }

  return all;
}

// ─── Enumeration ──────────────────────────────────────────────────────────

function scopedSearchHandles(
  query: string,
  shopGid: string,
  storeDomain: string,
  maxPages = 30,
): Set<string> {
  const handles = new Set<string>();
  let cursor: string | undefined;
  let page = 0;
  let prevIds: Set<string> | null = null;

  // Normalize the store domain for comparison
  // The Catalog API returns myshopify.com domains, but we want to match
  // any variant URL that contains the store's handle
  const storeHandle = storeDomain.replace(/^www\./, "").replace(/\.(com|net|org)$/, "");

  while (page < maxPages) {
    page++;
    const setArgs: string[] = [
      `/query=${query.replace(/'/g, "'\\''")}`,
      `/filters/shops=["${shopGid}"]`,
      "/pagination/limit=50",
    ];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.result?.products || [];
      const pagination = data.result?.pagination || {};

      const currentIds = new Set<string>(products.map((p: any) => p.id as string));

      // I-1 relaxed: stop query if overlap > 20%
      if (prevIds !== null) {
        const prev = prevIds;
        const shared = [...currentIds].filter((id) => prev.has(id));
        const maxAllowed = Math.ceil(products.length * 0.2);
        if (shared.length > maxAllowed) break;
      }
      prevIds = currentIds;

      for (const p of products) {
        // When using filters.shops, all results are from the specified shop
        // So we don't need to filter by seller domain — just extract handles
        const url = p.variants?.[0]?.url;
        if (url) {
          const match = url.match(/\/products\/([^?]+)/);
          if (match) handles.add(match[1]);
        }
      }

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return handles;
}

function runEnumeration(
  store: Store,
  partition: string[],
  runNum: number,
): EnumRun {
  const start = Date.now();
  const handles = new Set<string>();

  console.log(`  Run ${runNum}: ${partition.length} queries...`);

  for (let i = 0; i < partition.length; i++) {
    const q = partition[i];
    const queryHandles = scopedSearchHandles(q, store.shopGid, store.domain);
    for (const h of queryHandles) handles.add(h);

    if ((i + 1) % 50 === 0) {
      console.log(`    Query ${i + 1}/${partition.length}: ${handles.size} handles so far`);
    }
  }

  const duration = (Date.now() - start) / 1000;
  console.log(`  Run ${runNum}: ${handles.size} handles in ${duration.toFixed(1)}s`);

  return {
    run: runNum,
    handles,
    handleCount: handles.size,
    queryCount: partition.length,
    durationSec: duration,
  };
}

// ─── Jaccard and variance ─────────────────────────────────────────────────

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function computeStats(runs: EnumRun[], sitemapCount: number) {
  // Pairwise Jaccard
  const jaccards: number[] = [];
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const j_val = jaccard(runs[i].handles, runs[j].handles);
      jaccards.push(j_val);
    }
  }

  // Per-run absence rates
  const absenceRates = runs.map((r) => 1 - r.handleCount / sitemapCount);

  // Absence variance
  const meanAbsence = absenceRates.reduce((a, b) => a + b, 0) / absenceRates.length;
  const variance = absenceRates.reduce((sum, r) => sum + (r - meanAbsence) ** 2, 0) / absenceRates.length;
  const stdDev = Math.sqrt(variance);

  // Handle count stats
  const handleCounts = runs.map((r) => r.handleCount);
  const meanHandles = handleCounts.reduce((a, b) => a + b, 0) / handleCounts.length;
  const handleVariance = handleCounts.reduce((sum, h) => sum + (h - meanHandles) ** 2, 0) / handleCounts.length;
  const handleStdDev = Math.sqrt(handleVariance);

  return {
    jaccards,
    meanJaccard: jaccards.reduce((a, b) => a + b, 0) / jaccards.length,
    minJaccard: Math.min(...jaccards),
    maxJaccard: Math.max(...jaccards),
    absenceRates,
    meanAbsence,
    absenceStdDev: stdDev,
    absenceRange: [Math.min(...absenceRates), Math.max(...absenceRates)],
    handleCounts,
    meanHandles,
    handleStdDev,
    handleRange: [Math.min(...handleCounts), Math.max(...handleCounts)],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== DIRECTIVE-19 §3.4: Same-day Noise Floor ===\n");

  const results: Record<string, any> = {};

  for (const store of STORES) {
    console.log(`\n--- ${store.name.toUpperCase()} ---\n`);

    // Load partition
    console.log("Loading partition...");
    const partition = await loadPartition(store);
    console.log(`  Partition: ${partition.length} queries\n`);

    // Run 3 enumerations
    const runs: EnumRun[] = [];
    for (let run = 1; run <= 3; run++) {
      const result = runEnumeration(store, partition, run);
      runs.push(result);
    }

    // Compute stats
    const stats = computeStats(runs, store.sitemapCount);

    console.log(`\n=== ${store.name} Noise Floor Results ===`);
    console.log(`  Handle counts: ${stats.handleCounts.join(", ")}`);
    console.log(`  Mean handles: ${stats.meanHandles.toFixed(0)} (±${stats.handleStdDev.toFixed(1)})`);
    console.log(`  Handle range: ${stats.handleRange[0]}–${stats.handleRange[1]}`);
    console.log(`  Absence rates: ${stats.absenceRates.map((r: number) => (r * 100).toFixed(2) + "%").join(", ")}`);
    console.log(`  Mean absence: ${(stats.meanAbsence * 100).toFixed(2)}% (±${(stats.absenceStdDev * 100).toFixed(2)}%)`);
    console.log(`  Absence range: ${(stats.absenceRange[0] * 100).toFixed(2)}%–${(stats.absenceRange[1] * 100).toFixed(2)}%`);
    console.log(`  Pairwise Jaccard: ${stats.jaccards.map((j: number) => j.toFixed(4)).join(", ")}`);
    console.log(`  Mean Jaccard: ${stats.meanJaccard.toFixed(4)} (range: ${stats.minJaccard.toFixed(4)}–${stats.maxJaccard.toFixed(4)})`);

    results[store.name] = {
      store: store.name,
      domain: store.domain,
      sitemapCount: store.sitemapCount,
      partitionQueries: partition.length,
      runs: runs.map((r) => ({
        run: r.run,
        handleCount: r.handleCount,
        queryCount: r.queryCount,
        durationSec: r.durationSec,
      })),
      stats: {
        meanJaccard: stats.meanJaccard,
        minJaccard: stats.minJaccard,
        maxJaccard: stats.maxJaccard,
        jaccards: stats.jaccards,
        meanAbsence: stats.meanAbsence,
        absenceStdDev: stats.absenceStdDev,
        absenceRange: stats.absenceRange,
        absenceRates: stats.absenceRates,
        meanHandles: stats.meanHandles,
        handleStdDev: stats.handleStdDev,
        handleRange: stats.handleRange,
        handleCounts: stats.handleCounts,
      },
    };
  }

  // Save
  const outputPath = path.join(__dirname, "output/d19-noise-floor.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nOutput saved to ${outputPath}`);
}

main().catch(console.error);
