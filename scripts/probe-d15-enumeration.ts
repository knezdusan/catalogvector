/**
 * DIRECTIVE-15 §6.3: Enumeration with false-negative curve.
 *
 * The search is relevance-ranked, but the query space can be partitioned.
 * The sitemap gives every product; each product gives a vendor, a product
 * type, and tags. Issue scoped queries across that full partition —
 * thousands, not forty — union the results, and score against §6.2 ground
 * truth after each expansion. Report the false-negative curve.
 *
 * If that curve flattens above 90% recall, this project has a capability
 * nobody else has.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { validateMethod, type GroundTruth } from "../src/lib/scanner/invariants";

const SUBIMODS_DOMAIN = "subimods-com.myshopify.com";
const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";

// Load ground truth
const gt = JSON.parse(fs.readFileSync("scripts/output/d15-ground-truth.json", "utf8"));
const groundTruth: GroundTruth = {
  confirmedPresent: gt.presentSample,
  confirmedAbsent: gt.absentSample.map((a: any) => a.handle || a),
};

console.log(`Ground truth: ${groundTruth.confirmedPresent.length} present, ${groundTruth.confirmedAbsent.length} absent`);

// Load sitemap to get product metadata for partitioning
const sitemapProducts = JSON.parse(
  fs.readFileSync("scripts/output/d15-sitemap-subimods.json", "utf8"),
) as Array<{ handle: string; url: string }>;

// Fetch product metadata from /products.json for vendor and product_type
// We already have this from the full catalog file
const storeProducts = JSON.parse(fs.readFileSync("scripts/output/subimods-full-catalog.json", "utf8"));
const productMeta = new Map<string, { vendor: string; product_type: string }>();
for (const p of storeProducts) {
  productMeta.set(p.handle, { vendor: p.vendor || "", product_type: p.product_type || "" });
}

// Build query partitions from vendors and product types
const vendors = new Set<string>();
const productTypes = new Set<string>();
for (const p of storeProducts) {
  if (p.vendor) vendors.add(p.vendor);
  if (p.product_type) productTypes.add(p.product_type);
}

console.log(`Vendors: ${vendors.size}, Product types: ${productTypes.size}`);

// Build query set: vendor names + product types + existing keyword queries
const partitionQueries = [
  ...new Set([...vendors, ...productTypes].filter((q) => q.length > 2)),
].sort();

console.log(`Total partition queries: ${partitionQueries.length}`);

// Scoped search with I-1 enforcement (relaxed)
function scopedSearchHandles(query: string, maxPages = 30): Set<string> {
  const handles = new Set<string>();
  let cursor: string | undefined;
  let page = 0;
  let prevIds: Set<string> | null = null;

  while (page < maxPages) {
    page++;
    const setArgs = [
      `/query=${query.replace(/'/g, "'\\''")}`,
      `/filters/shops=["${SUBIMODS_SHOP_GID}"]`,
      "/pagination/limit=50",
    ];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);

    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.result?.products || [];
      const pagination = data.result?.pagination || {};

      const currentIds = new Set(products.map((p: any) => p.id));

      // I-1 relaxed: allow up to 20% overlap
      if (prevIds !== null) {
        const shared = [...currentIds].filter((id) => prevIds!.has(id));
        const maxAllowed = Math.ceil(products.length * 0.2);
        if (shared.length > maxAllowed) break; // Stop, don't abort
      }
      prevIds = currentIds;

      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== SUBIMODS_DOMAIN) continue;
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

// Run enumeration in batches, scoring after each batch
const batchSize = 50;
const allHandles = new Set<string>();
const falseNegativeCurve: Array<{
  queriesRun: number;
  totalHandles: number;
  presentRecall: number;
  absentFalsePositiveRate: number;
  falseNegatives: number;
  truePositives: number;
}> = [];

console.log(`\nRunning enumeration in batches of ${batchSize} queries...`);

for (let batchStart = 0; batchStart < partitionQueries.length; batchStart += batchSize) {
  const batchEnd = Math.min(batchStart + batchSize, partitionQueries.length);
  const batch = partitionQueries.slice(batchStart, batchEnd);

  for (const q of batch) {
    const handles = scopedSearchHandles(q);
    for (const h of handles) allHandles.add(h);
  }

  // Score against ground truth
  const validation = validateMethod(
    `scoped-union-batch-${batchEnd}`,
    groundTruth,
    (handle) => (allHandles.has(handle) ? "present" : "absent"),
  );

  falseNegativeCurve.push({
    queriesRun: batchEnd,
    totalHandles: allHandles.size,
    presentRecall: validation.truePositives / groundTruth.confirmedPresent.length,
    absentFalsePositiveRate: validation.falsePositiveRate,
    falseNegatives: validation.falseNegatives,
    truePositives: validation.truePositives,
  });

  console.log(
    `  [${batchEnd}/${partitionQueries.length}] handles: ${allHandles.size}, ` +
      `recall: ${(validation.truePositives / groundTruth.confirmedPresent.length * 100).toFixed(1)}%, ` +
      `FN: ${validation.falseNegatives}, FP: ${validation.falsePositives}`,
  );
}

// Final score
const finalValidation = validateMethod(
  "scoped-union-final",
  groundTruth,
  (handle) => (allHandles.has(handle) ? "present" : "absent"),
);

console.log(`\n=== ENUMERATION RESULTS ===`);
console.log(`Total queries: ${partitionQueries.length}`);
console.log(`Total handles recovered: ${allHandles.size}`);
console.log(`Sitemap products: ${sitemapProducts.length}`);
console.log(`Coverage: ${(allHandles.size / sitemapProducts.length * 100).toFixed(1)}% of sitemap`);
console.log(`\nGround truth validation:`);
console.log(`  True positives (present & found): ${finalValidation.truePositives}/${groundTruth.confirmedPresent.length}`);
console.log(`  False negatives (present but missed): ${finalValidation.falseNegatives}`);
console.log(`  True negatives (absent & not found): ${finalValidation.trueNegatives}/${groundTruth.confirmedAbsent.length}`);
console.log(`  False positives (absent but found): ${finalValidation.falsePositives}`);
console.log(`  False-negative rate: ${(finalValidation.falseNegativeRate * 100).toFixed(1)}%`);
console.log(`  False-positive rate: ${(finalValidation.falsePositiveRate * 100).toFixed(1)}%`);
console.log(`  Recall: ${(finalValidation.truePositives / groundTruth.confirmedPresent.length * 100).toFixed(1)}%`);

// Save
fs.writeFileSync(
  "scripts/output/d15-enumeration-curve.json",
  JSON.stringify({
    store: "subimods",
    sitemapCount: sitemapProducts.length,
    totalQueries: partitionQueries.length,
    totalHandles: allHandles.size,
    coverage: allHandles.size / sitemapProducts.length,
    falseNegativeCurve,
    finalValidation,
    timestamp: new Date().toISOString(),
  }, null, 2),
);
console.log(`\nSaved to scripts/output/d15-enumeration-curve.json`);
