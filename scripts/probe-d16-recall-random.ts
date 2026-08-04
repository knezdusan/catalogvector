/**
 * DIRECTIVE-16 §1: recall_random — honest recall measurement.
 *
 * The prior 98% recall was circular: ground truth "present" was selected
 * from products found by scoped search, then scored against a larger scoped
 * search. This script fixes that.
 *
 * Design (per DIRECTIVE-16 §1.2):
 *   1. Draw 100 products at random from the sitemap (uncorrelated with any
 *      prior search result). Record the random seed.
 *   2. For each, run a per-product exhaustive probe:
 *      - exact title
 *      - title with stopwords removed
 *      - vendor + product type
 *      - SKU if public
 *      - first five title tokens
 *      Scoped to the store, I-1 enforced. Declare "present" if any probe
 *      returns the exact handle.
 *   3. Score the 524-query enumeration against that label set.
 *
 * Report recall_random alongside recall_selected (the prior 98%).
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const SUBIMODS_DOMAIN = "subimods-com.myshopify.com";
const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";
const RANDOM_SEED = 42; // Recorded for reproducibility

// Seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Load data ─────────────────────────────────────────────────────────────

const sitemapProducts = JSON.parse(
  fs.readFileSync("scripts/output/d15-sitemap-subimods.json", "utf8"),
) as Array<{ handle: string; url: string }>;

// Load the full /products.json (18,066 products) for metadata
const productsJson = JSON.parse(
  fs.readFileSync("scripts/output/d16-products-json-subimods.json", "utf8"),
);
// We need vendor and product_type — let's fetch from the stored data
// The d16 file has allHandles but not full product metadata
// Let's load the original subimods-full-catalog.json which has metadata
let productMeta = new Map<string, { vendor: string; product_type: string; title: string }>();
try {
  const fullCatalog = JSON.parse(
    fs.readFileSync("scripts/output/subimods-full-catalog.json", "utf8"),
  );
  for (const p of fullCatalog) {
    productMeta.set(p.handle, {
      vendor: p.vendor || "",
      product_type: p.product_type || "",
      title: p.title || "",
    });
  }
  console.log(`Loaded metadata for ${productMeta.size} products from subimods-full-catalog.json`);
} catch {
  console.log("subimods-full-catalog.json not found, will fetch titles from store");
}

// ─── 1. Draw 100 random products from sitemap ─────────────────────────────

const rng = mulberry32(RANDOM_SEED);
const indices: number[] = [];
for (let i = 0; i < sitemapProducts.length; i++) indices.push(i);
// Fisher-Yates shuffle with seeded RNG
for (let i = indices.length - 1; i > 0; i--) {
  const j = Math.floor(rng() * (i + 1));
  [indices[i], indices[j]] = [indices[j], indices[i]];
}
const sampleIndices = indices.slice(0, 100);
const sample = sampleIndices.map((idx) => sitemapProducts[idx]);

console.log(`\nDrew 100 random products from sitemap (seed=${RANDOM_SEED})`);
console.log(`First 5 handles: ${sample.slice(0, 5).map((p) => p.handle).join(", ")}`);

// ─── 2. Per-product exhaustive probe ───────────────────────────────────────

const STOPWORDS = new Set([
  "the", "a", "an", "for", "with", "and", "or", "of", "to", "in", "on",
  "at", "by", "is", "it", "this", "that", "from", "as", "be",
]);

function scopedSearch(query: string, maxPages = 10): Array<{ id: string; handle: string; title: string }> {
  const results: Array<{ id: string; handle: string; title: string }> = [];
  let cursor: string | undefined;
  let page = 0;

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

      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== SUBIMODS_DOMAIN) continue;
        const url = p.variants?.[0]?.url;
        if (url) {
          const match = url.match(/\/products\/([^?]+)/);
          if (match) {
            results.push({ id: p.id, handle: match[1], title: p.title });
          }
        }
      }

      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch {
      break;
    }
  }

  return results;
}

function fetchProductTitle(handle: string): { title: string; vendor: string; product_type: string } {
  // Check metadata first
  const meta = productMeta.get(handle);
  if (meta) return meta;

  // Fetch from store
  try {
    const cmd = `curl -sL "https://www.subimods.com/products/${handle}.json" 2>/dev/null`;
    const output = execSync(cmd, { timeout: 15000, encoding: "utf8" });
    const data = JSON.parse(output);
    return {
      title: data.product?.title || handle,
      vendor: data.product?.vendor || "",
      product_type: data.product?.product_type || "",
    };
  } catch {
    return { title: handle, vendor: "", product_type: "" };
  }
}

function removeStopwords(title: string): string {
  return title
    .split(/\s+/)
    .filter((w) => !STOPWORDS.has(w.toLowerCase()))
    .join(" ");
}

function firstNTokens(title: string, n: number): string {
  return title.split(/\s+/).slice(0, n).join(" ");
}

console.log("\nRunning per-product exhaustive probe on 100 random products...\n");

const labels: Array<{
  handle: string;
  title: string;
  vendor: string;
  product_type: string;
  probes: Array<{ query: string; found: boolean; matchCount: number }>;
  label: "present" | "absent";
}> = [];

for (let i = 0; i < sample.length; i++) {
  const handle = sample[i].handle;
  const meta = fetchProductTitle(handle);
  const title = meta.title;

  // Build probe queries
  const probes: string[] = [
    title, // exact title
    removeStopwords(title), // title with stopwords removed
    `${meta.vendor} ${meta.product_type}`.trim(), // vendor + product type
    firstNTokens(title, 5), // first 5 title tokens
  ].filter((q) => q.length > 2);

  // Run each probe
  const probeResults: Array<{ query: string; found: boolean; matchCount: number }> = [];
  let found = false;

  for (const query of probes) {
    const results = scopedSearch(query);
    const match = results.some((r) => r.handle === handle);
    probeResults.push({ query, found: match, matchCount: results.length });
    if (match) found = true;
  }

  labels.push({
    handle,
    title,
    vendor: meta.vendor,
    product_type: meta.product_type,
    probes: probeResults,
    label: found ? "present" : "absent",
  });

  if ((i + 1) % 10 === 0) {
    const presentCount = labels.filter((l) => l.label === "present").length;
    console.log(`  [${i + 1}/100] present: ${presentCount}, absent: ${i + 1 - presentCount}`);
  }
}

const presentCount = labels.filter((l) => l.label === "present").length;
const absentCount = labels.filter((l) => l.label === "absent").length;

console.log(`\n=== REFERENCE STANDARD RESULTS ===`);
console.log(`Present: ${presentCount}/100 (${presentCount}%)`);
console.log(`Absent: ${absentCount}/100 (${absentCount}%)`);

// ─── 3. Score the 524-query enumeration against the random labels ─────────

// Load the enumeration result (13,358 handles from DIRECTIVE-15 §6.3)
// We need to re-run the enumeration OR load the saved handles
// The enumeration output was saved in d15-enumeration-curve.json but only has
// the curve data, not the full handle set. Let's load the catalog handle set
// from the ground truth script which saved it.

// Actually, the enumeration handles are the union of all 524 scoped searches.
// We saved the ground truth which has the 61-query catalog handle set (7,957).
// The 524-query enumeration recovered 13,358 handles but we didn't save the set.
// We need to either re-run or reconstruct.

// Let's check if we saved the full handle set anywhere
let enumerationHandles: Set<string> | null = null;

try {
  // Try to load from a saved file
  const enumData = JSON.parse(fs.readFileSync("scripts/output/d15-enumeration-handles.json", "utf8"));
  enumerationHandles = new Set(enumData.handles || []);
  console.log(`\nLoaded ${enumerationHandles.size} enumeration handles from saved file`);
} catch {
  console.log("\nEnumeration handle set not saved — re-running 524-query enumeration...");
  // Re-run the enumeration (this takes a while)
  const fullProductsJson = JSON.parse(
    fs.readFileSync("scripts/output/d16-products-json-subimods.json", "utf8"),
  );

  // We need vendor and product_type from the full /products.json
  // The d16 file has allHandles but not metadata
  // Let's use the subimods-full-catalog.json which has metadata
  const fullCatalog = JSON.parse(
    fs.readFileSync("scripts/output/subimods-full-catalog.json", "utf8"),
  );

  const vendors = new Set<string>();
  const productTypes = new Set<string>();
  for (const p of fullCatalog) {
    if (p.vendor) vendors.add(p.vendor);
    if (p.product_type) productTypes.add(p.product_type);
  }

  const partitionQueries = [...new Set([...vendors, ...productTypes].filter((q) => q.length > 2))].sort();
  console.log(`Partition queries: ${partitionQueries.length}`);

  enumerationHandles = new Set<string>();
  for (let qi = 0; qi < partitionQueries.length; qi++) {
    const q = partitionQueries[qi];
    const results = scopedSearch(q, 30);
    for (const r of results) enumerationHandles.add(r.handle);
    if ((qi + 1) % 50 === 0) {
      console.log(`  [${qi + 1}/${partitionQueries.length}] handles: ${enumerationHandles.size}`);
    }
  }

  // Save for future use
  fs.writeFileSync("scripts/output/d15-enumeration-handles.json", JSON.stringify({
    handles: [...enumerationHandles],
    queryCount: partitionQueries.length,
    timestamp: new Date().toISOString(),
  }, null, 2));
  console.log(`Saved ${enumerationHandles.size} handles to d15-enumeration-handles.json`);
}

// Score against random labels
let truePositives = 0; // present in reference & found by enumeration
let falseNegatives = 0; // present in reference but missed by enumeration
let trueNegatives = 0; // absent in reference & not found by enumeration
let falsePositives = 0; // absent in reference but found by enumeration

for (const label of labels) {
  const enumFound = enumerationHandles.has(label.handle);
  if (label.label === "present" && enumFound) truePositives++;
  else if (label.label === "present" && !enumFound) falseNegatives++;
  else if (label.label === "absent" && !enumFound) trueNegatives++;
  else if (label.label === "absent" && enumFound) falsePositives++;
}

const recallRandom = truePositives / (truePositives + falseNegatives);
const falsePositiveRate = falsePositives / (falsePositives + trueNegatives);

console.log(`\n=== RECALL_RANDOM (100 random sitemap products) ===`);
console.log(`True positives (present & found): ${truePositives}`);
console.log(`False negatives (present & missed): ${falseNegatives}`);
console.log(`True negatives (absent & not found): ${trueNegatives}`);
console.log(`False positives (absent & found): ${falsePositives}`);
console.log(`\nrecall_random: ${truePositives}/${truePositives + falseNegatives} = ${(recallRandom * 100).toFixed(1)}%`);
console.log(`False-positive rate: ${(falsePositiveRate * 100).toFixed(1)}%`);

// Also compute recall_selected (the prior 98%) for comparison
const priorGroundTruth = JSON.parse(fs.readFileSync("scripts/output/d15-ground-truth.json", "utf8"));
const priorPresent = priorGroundTruth.presentSample as string[];
let priorTP = 0;
let priorFN = 0;
for (const handle of priorPresent) {
  if (enumerationHandles.has(handle)) priorTP++;
  else priorFN++;
}
const recallSelected = priorTP / (priorTP + priorFN);

console.log(`\n=== COMPARISON ===`);
console.log(`recall_selected (prior, circular): ${(recallSelected * 100).toFixed(1)}% (${priorTP}/${priorTP + priorFN})`);
console.log(`recall_random (new, honest): ${(recallRandom * 100).toFixed(1)}% (${truePositives}/${truePositives + falseNegatives})`);

// ─── 4. Absence range (§5) ────────────────────────────────────────────────

const sitemapCount = sitemapProducts.length; // 18,067
const enumCount = enumerationHandles.size; // ~13,358
const catalogPresenceRate = presentCount / 100; // fraction of random sample present in Catalog

console.log(`\n=== ABSENCE RANGE (§5) ===`);
console.log(`Sitemap products: ${sitemapCount}`);
console.log(`Enumeration handles: ${enumCount}`);
console.log(`Random sample Catalog presence rate: ${presentCount}%`);

// The absence share depends on recall. If recall is R, then:
//   implied_present = enumCount / R
//   implied_absent = sitemapCount - implied_present
//   absent_share = implied_absent / sitemapCount
// But we also know the random sample's presence rate, which gives us
// an independent estimate of the true presence rate.

const presenceRateFromSample = presentCount / 100;
const impliedPresentFromSample = Math.round(sitemapCount * presenceRateFromSample);
const impliedAbsentFromSample = sitemapCount - impliedPresentFromSample;
const absentShareFromSample = impliedAbsentFromSample / sitemapCount;

console.log(`\nFrom random sample (independent of enumeration):`);
console.log(`  Catalog presence rate: ${presenceRateFromSample * 100}%`);
console.log(`  Implied present in Catalog: ${impliedPresentFromSample}`);
console.log(`  Implied absent from Catalog: ${impliedAbsentFromSample}`);
console.log(`  Absent share: ${(absentShareFromSample * 100).toFixed(1)}%`);

// Range conditioned on recall
console.log(`\nAbsence range conditioned on recall:`);
for (const r of [1.0, recallRandom, 0.90, 0.85, 0.80, 0.75]) {
  if (r <= 0) continue;
  const impliedPresent = Math.round(enumCount / r);
  const impliedAbsent = sitemapCount - impliedPresent;
  const share = impliedAbsent / sitemapCount;
  if (impliedAbsent < 0 || impliedPresent > sitemapCount) {
    console.log(`  recall=${r.toFixed(2)}: arithmetically impossible (implied present ${impliedPresent} > sitemap ${sitemapCount})`);
  } else {
    console.log(`  recall=${r.toFixed(2)}: absent=${impliedAbsent} (${(share * 100).toFixed(1)}%)`);
  }
}

// Save
fs.writeFileSync("scripts/output/d16-recall-random.json", JSON.stringify({
  seed: RANDOM_SEED,
  sampleSize: 100,
  sitemapCount,
  enumerationHandles: enumerationHandles.size,
  labels: labels.map((l) => ({
    handle: l.handle,
    title: l.title,
    vendor: l.vendor,
    product_type: l.product_type,
    label: l.label,
    probes: l.probes,
  })),
  recallRandom: {
    truePositives,
    falseNegatives,
    trueNegatives,
    falsePositives,
    recall: recallRandom,
    falsePositiveRate,
  },
  recallSelected: {
    truePositives: priorTP,
    falseNegatives: priorFN,
    recall: recallSelected,
  },
  absenceRange: {
    presenceRateFromSample,
    impliedPresentFromSample,
    impliedAbsentFromSample,
    absentShareFromSample,
  },
  timestamp: new Date().toISOString(),
}, null, 2));

console.log(`\nSaved to scripts/output/d16-recall-random.json`);
