/**
 * DIRECTIVE-19 §3.3: Partition rarefaction — two checks.
 *
 * 1. MAP 25K metadata rarefaction curve:
 *    MAP has 102,176 sitemap products but /products.json caps at 25,000.
 *    The partition is built from the 25K metadata. Does recall degrade
 *    because the 25K cap truncates the partition metadata?
 *    Method: simulate by building partitions from increasing fractions
 *    of the 25K metadata and measuring the partition query count curve.
 *    Then estimate: if we had all 102K metadata, how many more partition
 *    queries would we get, and what recall would that yield?
 *
 * 2. Subimods selection-error check:
 *    Is absence concentrated in cells (vendor × product_type) that were
 *    dropped vs recovered? The D17 enumeration used 692 queries from 18,066
 *    metadata. Check if absent products cluster in vendor×product_type cells
 *    that were NOT covered by the partition.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

type Product = {
  id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
};

// ─── MAP rarefaction ──────────────────────────────────────────────────────

async function fetchMapMetadata(): Promise<Product[]> {
  console.log("Fetching MAP /products.json (capped at 25,000)...");
  const all: Product[] = [];
  let page = 1;
  let emptyPages = 0;

  while (page <= 100 && emptyPages < 3) {
    const url = `https://maperformance.com/products.json?limit=250&page=${page}`;
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "CatalogVector/1.0 (research project)" },
      });
      if (!resp.ok) {
        console.log(`  Page ${page}: HTTP ${resp.status}`);
        break;
      }
      const data = (await resp.json()) as { products: Product[] };
      if (data.products.length === 0) {
        emptyPages++;
      } else {
        emptyPages = 0;
        all.push(...data.products);
      }
    } catch {
      emptyPages++;
    }
    if (page % 20 === 0) console.log(`  Page ${page}: ${all.length} products`);
    page++;
    execSync("sleep 1.1");
  }

  console.log(`  Fetched ${all.length} products from MAP\n`);
  return all;
}

function buildPartition(products: Product[]): {
  queries: number;
  vendors: Set<string>;
  productTypes: Set<string>;
  cells: Set<string>;
} {
  const vendors = new Set<string>();
  const productTypes = new Set<string>();
  const cells = new Set<string>();

  for (const p of products) {
    const vendor = (p.vendor || "").trim();
    const ptype = (p.product_type || "").trim();
    if (vendor) vendors.add(vendor);
    if (ptype) productTypes.add(ptype);
    if (vendor && ptype) cells.add(`${vendor}|${ptype}`);
  }

  // Partition queries = one per vendor + one per product_type
  // (matching the D17 partition strategy)
  const queries = vendors.size + productTypes.size;

  return { queries, vendors, productTypes, cells };
}

function rarefactionCurve(
  products: Product[],
  fractions: number[],
): Array<{ fraction: number; productCount: number; queries: number; vendors: number; productTypes: number; cells: number }> {
  const results: Array<{ fraction: number; productCount: number; queries: number; vendors: number; productTypes: number; cells: number }> = [];

  for (const fraction of fractions) {
    const count = Math.floor(products.length * fraction);
    const subset = products.slice(0, count);
    const partition = buildPartition(subset);
    results.push({
      fraction,
      productCount: count,
      queries: partition.queries,
      vendors: partition.vendors.size,
      productTypes: partition.productTypes.size,
      cells: partition.cells.size,
    });
  }

  return results;
}

// ─── Subimods selection-error check ───────────────────────────────────────

function checkSubimodsSelectionError(): {
  totalProducts: number;
  enumHandles: number;
  absentHandles: string[];
  coveredCells: Set<string>;
  uncoveredCells: Set<string>;
  absentInCovered: number;
  absentInUncovered: number;
  absentNoCell: number;
} {
  // Load Subimods full metadata
  const metadataPath = path.join(__dirname, "output/d17-subimods-full-metadata.json");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as Product[];

  // Load enumeration handles
  const enumPath = path.join(__dirname, "output/d17-enumeration-handles.json");
  const enumData = JSON.parse(fs.readFileSync(enumPath, "utf8")) as { handles: string[] };
  const enumHandles = new Set(enumData.handles);

  // Build the partition cells from the full metadata
  const partition = buildPartition(metadata);
  const coveredCells = partition.cells;

  // Find absent products (in metadata but not in enumeration)
  const absentProducts = metadata.filter((p) => !enumHandles.has(p.handle));
  const absentHandles = absentProducts.map((p) => p.handle);

  // Check which cells the absent products belong to
  let absentInCovered = 0;
  let absentInUncovered = 0;
  let absentNoCell = 0;

  for (const p of absentProducts) {
    const vendor = (p.vendor || "").trim();
    const ptype = (p.product_type || "").trim();
    if (!vendor || !ptype) {
      absentNoCell++;
      continue;
    }
    const cell = `${vendor}|${ptype}`;
    if (coveredCells.has(cell)) {
      absentInCovered++;
    } else {
      absentInUncovered++;
    }
  }

  // Also find uncovered cells (cells in metadata but not in partition)
  // The partition covers all cells in the metadata by construction,
  // so "uncovered" means cells that exist but whose products were not
  // recovered by the enumeration
  const allCells = new Set<string>();
  for (const p of metadata) {
    const vendor = (p.vendor || "").trim();
    const ptype = (p.product_type || "").trim();
    if (vendor && ptype) allCells.add(`${vendor}|${ptype}`);
  }

  // Cells with absent products
  const cellsWithAbsent = new Set<string>();
  for (const p of absentProducts) {
    const vendor = (p.vendor || "").trim();
    const ptype = (p.product_type || "").trim();
    if (vendor && ptype) cellsWithAbsent.add(`${vendor}|${ptype}`);
  }

  // Cells with recovered products
  const cellsWithRecovered = new Set<string>();
  for (const p of metadata) {
    if (enumHandles.has(p.handle)) {
      const vendor = (p.vendor || "").trim();
      const ptype = (p.product_type || "").trim();
      if (vendor && ptype) cellsWithRecovered.add(`${vendor}|${ptype}`);
    }
  }

  return {
    totalProducts: metadata.length,
    enumHandles: enumHandles.size,
    absentHandles,
    coveredCells,
    uncoveredCells: new Set([...allCells].filter((c) => !cellsWithRecovered.has(c))),
    absentInCovered,
    absentInUncovered,
    absentNoCell,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== DIRECTIVE-19 §3.3: Partition Rarefaction ===\n");

  // Part 1: MAP rarefaction
  console.log("Part 1: MAP 25K metadata rarefaction curve\n");
  const mapProducts = await fetchMapMetadata();

  if (mapProducts.length === 0) {
    console.log("ERROR: No MAP products fetched. Skipping rarefaction.");
  } else {
    // Build the partition from the full 25K
    const fullPartition = buildPartition(mapProducts);
    console.log(`Full 25K partition: ${fullPartition.queries} queries, ${fullPartition.vendors.size} vendors, ${fullPartition.productTypes.size} product types, ${fullPartition.cells.size} cells`);

    // Rarefaction: build partitions from increasing fractions
    const fractions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const curve = rarefactionCurve(mapProducts, fractions);

    console.log(`\nRarefaction curve:`);
    console.log(`  Fraction | Products | Queries | Vendors | Types | Cells`);
    console.log(`  ---------|----------|---------|---------|-------|------`);
    for (const point of curve) {
      console.log(`  ${point.fraction.toFixed(2)}     | ${point.productCount.toString().padStart(8)} | ${point.queries.toString().padStart(7)} | ${point.vendors.toString().padStart(7)} | ${point.productTypes.toString().padStart(5)} | ${point.cells.toString().padStart(5)}`);
    }

    // Extrapolate: if we had all 102K products, how many partition queries?
    // The 25K → 102K scaling is 4.09x. But vendor/product_type counts
    // saturate (diminishing returns). Estimate using the rarefaction curve.
    const lastPoint = curve[curve.length - 1];
    const scalingFactor = 102176 / mapProducts.length;
    // Linear extrapolation of cells (upper bound)
    const extrapolatedCellsLinear = Math.floor(lastPoint.cells * scalingFactor);
    // Logarithmic extrapolation (more realistic — diminishing returns)
    // Using the curve, fit log(cells) vs log(products)
    const logProducts = curve.map((p) => Math.log(p.productCount));
    const logCells = curve.map((p) => Math.log(p.cells));
    const n = curve.length;
    const sumX = logProducts.reduce((a, b) => a + b, 0);
    const sumY = logCells.reduce((a, b) => a + b, 0);
    const sumXY = logProducts.reduce((acc, x, i) => acc + x * logCells[i], 0);
    const sumX2 = logProducts.reduce((acc, x) => acc + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const extrapolatedCellsLog = Math.floor(Math.exp(intercept + slope * Math.log(102176)));
    const extrapolatedQueriesLog = Math.floor(Math.exp(intercept + slope * Math.log(102176)) * 1.5); // rough estimate

    console.log(`\nExtrapolation to 102,176 products (full MAP sitemap):`);
    console.log(`  Scaling factor: ${scalingFactor.toFixed(2)}x`);
    console.log(`  Linear extrapolation: ${extrapolatedCellsLinear} cells (upper bound)`);
    console.log(`  Log-log extrapolation: ${extrapolatedCellsLog} cells, ~${extrapolatedQueriesLog} queries`);
    console.log(`  Current (25K): ${fullPartition.cells.size} cells, ${fullPartition.queries} queries`);
    console.log(`  Estimated additional queries from full metadata: ${extrapolatedQueriesLog - fullPartition.queries}`);

    // Estimate recall improvement
    // Current: 384 queries → 43,840 handles → 56.6% recall
    // If we had ~${extrapolatedQueriesLog} queries, recall would improve proportionally
    // (assuming linear recall per query, which is approximate)
    const currentRecall = 0.566;
    const estimatedRecall = Math.min(1.0, currentRecall * (extrapolatedQueriesLog / 384));
    console.log(`  Estimated recall with full metadata: ${(estimatedRecall * 100).toFixed(1)}% (vs current ${(currentRecall * 100).toFixed(1)}%)`);
    console.log(`  NOTE: This is an extrapolation, not a measurement. The actual recall`);
    console.log(`  improvement requires running the additional queries.`);

    // Save MAP rarefaction results
    const mapOutput = {
      timestamp: new Date().toISOString(),
      store: "maperformance.com",
      sitemapCount: 102176,
      productsJsonCount: mapProducts.length,
      currentEnumHandles: 43840,
      currentRecall: 0.566,
      fullPartition: {
        queries: fullPartition.queries,
        vendors: fullPartition.vendors.size,
        productTypes: fullPartition.productTypes.size,
        cells: fullPartition.cells.size,
      },
      rarefactionCurve: curve,
      extrapolation: {
        scalingFactor,
        linearCells: extrapolatedCellsLinear,
        logLogCells: extrapolatedCellsLog,
        logLogQueries: extrapolatedQueriesLog,
        estimatedRecall,
      },
    };
    const mapPath = path.join(__dirname, "output/d19-map-rarefaction.json");
    fs.writeFileSync(mapPath, JSON.stringify(mapOutput, null, 2));
    console.log(`\n  Saved to ${mapPath}`);
  }

  // Part 2: Subimods selection-error check
  console.log("\n\nPart 2: Subimods selection-error check\n");
  const subimodsCheck = checkSubimodsSelectionError();

  console.log(`Total products:       ${subimodsCheck.totalProducts}`);
  console.log(`Enumerated handles:   ${subimodsCheck.enumHandles}`);
  console.log(`Absent handles:       ${subimodsCheck.absentHandles.length}`);
  console.log(`\nAbsent product cell membership:`);
  console.log(`  In covered cells:   ${subimodsCheck.absentInCovered} (${((subimodsCheck.absentInCovered / subimodsCheck.absentHandles.length) * 100).toFixed(1)}%)`);
  console.log(`  In uncovered cells: ${subimodsCheck.absentInUncovered} (${((subimodsCheck.absentInUncovered / subimodsCheck.absentHandles.length) * 100).toFixed(1)}%)`);
  console.log(`  No cell (missing vendor or product_type): ${subimodsCheck.absentNoCell} (${((subimodsCheck.absentNoCell / subimodsCheck.absentHandles.length) * 100).toFixed(1)}%)`);

  // The key question: are absent products concentrated in cells that were
  // covered but whose queries didn't recover them, or in cells that were
  // never queried?
  // Since the partition is built from the full metadata, ALL cells are "covered"
  // by construction. The question is whether the enumeration queries actually
  // recovered products from those cells.
  console.log(`\nCell-level analysis:`);
  console.log(`  Total cells in metadata:        ${subimodsCheck.coveredCells.size}`);
  console.log(`  Cells with recovered products:  ${subimodsCheck.coveredCells.size - subimodsCheck.uncoveredCells.size}`);
  console.log(`  Cells with NO recovered products: ${subimodsCheck.uncoveredCells.size}`);

  // Count absent products per cell (top 10)
  const metadataPath = path.join(__dirname, "output/d17-subimods-full-metadata.json");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as Product[];
  const enumPath = path.join(__dirname, "output/d17-enumeration-handles.json");
  const enumData = JSON.parse(fs.readFileSync(enumPath, "utf8")) as { handles: string[] };
  const enumHandles = new Set(enumData.handles);

  const absentByCell = new Map<string, number>();
  const recoveredByCell = new Map<string, number>();
  for (const p of metadata) {
    const vendor = (p.vendor || "").trim();
    const ptype = (p.product_type || "").trim();
    if (!vendor || !ptype) continue;
    const cell = `${vendor}|${ptype}`;
    if (enumHandles.has(p.handle)) {
      recoveredByCell.set(cell, (recoveredByCell.get(cell) || 0) + 1);
    } else {
      absentByCell.set(cell, (absentByCell.get(cell) || 0) + 1);
    }
  }

  // Sort cells by absent count (descending)
  const sortedAbsent = Array.from(absentByCell.entries()).sort((a, b) => b[1] - a[1]);
  console.log(`\nTop 10 cells by absent product count:`);
  console.log(`  Cell (vendor|product_type) | Absent | Recovered | Total | Recovery rate`);
  for (const [cell, absent] of sortedAbsent.slice(0, 10)) {
    const recovered = recoveredByCell.get(cell) || 0;
    const total = absent + recovered;
    const rate = total > 0 ? (recovered / total) * 100 : 0;
    console.log(`  ${cell.substring(0, 50).padEnd(50)} | ${absent.toString().padStart(6)} | ${recovered.toString().padStart(9)} | ${total.toString().padStart(5)} | ${rate.toFixed(1)}%`);
  }

  // Overall: what share of absent products are in cells with 0 recovery?
  const zeroRecoveryCells = new Set<string>();
  for (const [cell] of absentByCell) {
    if ((recoveredByCell.get(cell) || 0) === 0) {
      zeroRecoveryCells.add(cell);
    }
  }
  const absentInZeroRecovery = Array.from(absentByCell.entries())
    .filter(([cell]) => zeroRecoveryCells.has(cell))
    .reduce((sum, [, count]) => sum + count, 0);

  console.log(`\nSelection error summary:`);
  console.log(`  Absent products in cells with 0 recovery: ${absentInZeroRecovery} (${((absentInZeroRecovery / subimodsCheck.absentHandles.length) * 100).toFixed(1)}% of absent)`);
  console.log(`  Absent products in cells with some recovery: ${subimodsCheck.absentHandles.length - absentInZeroRecovery - subimodsCheck.absentNoCell} (${(((subimodsCheck.absentHandles.length - absentInZeroRecovery - subimodsCheck.absentNoCell) / subimodsCheck.absentHandles.length) * 100).toFixed(1)}% of absent)`);
  console.log(`  Absent products with no cell: ${subimodsCheck.absentNoCell} (${((subimodsCheck.absentNoCell / subimodsCheck.absentHandles.length) * 100).toFixed(1)}% of absent)`);

  // Save Subimods results
  const subimodsOutput = {
    timestamp: new Date().toISOString(),
    store: "subimods.com",
    totalProducts: subimodsCheck.totalProducts,
    enumHandles: subimodsCheck.enumHandles,
    absentHandles: subimodsCheck.absentHandles.length,
    selectionError: {
      absentInCoveredCells: subimodsCheck.absentInCovered,
      absentInUncoveredCells: subimodsCheck.absentInUncovered,
      absentNoCell: subimodsCheck.absentNoCell,
      absentInZeroRecoveryCells: absentInZeroRecovery,
      zeroRecoveryCells: zeroRecoveryCells.size,
      totalCells: subimodsCheck.coveredCells.size,
    },
    topAbsentCells: sortedAbsent.slice(0, 20).map(([cell, absent]) => ({
      cell,
      absent,
      recovered: recoveredByCell.get(cell) || 0,
      total: absent + (recoveredByCell.get(cell) || 0),
      recoveryRate: (absent + (recoveredByCell.get(cell) || 0)) > 0
        ? ((recoveredByCell.get(cell) || 0) / (absent + (recoveredByCell.get(cell) || 0)))
        : 0,
    })),
  };
  const subimodsPath = path.join(__dirname, "output/d19-subimods-selection-error.json");
  fs.writeFileSync(subimodsPath, JSON.stringify(subimodsOutput, null, 2));
  console.log(`\n  Saved to ${subimodsPath}`);
}

main().catch(console.error);
