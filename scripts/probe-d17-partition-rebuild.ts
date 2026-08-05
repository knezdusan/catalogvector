/**
 * DIRECTIVE-17 §1.3: Rebuild partition from full 18,066-product metadata.
 *
 * The prior partition was built from 5,250 products (29% of the true 18,066).
 * Vendors and product types in the missing 12,816 were never queried.
 *
 * This script:
 *   1. Fetches full /products.json with metadata (vendor, product_type, title)
 *   2. Rebuilds the partition from all 18,066 products
 *   3. Re-runs the enumeration with the new partition
 *   4. Re-scores against the same 100-product random sample (seed=42)
 *   5. Computes union presence (ref standard OR enumeration)
 *   6. Reports absence rate with confidence intervals
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const SUBIMODS_DOMAIN = "subimods-com.myshopify.com";
const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";
const RANDOM_SEED = 42;

// ─── 1. Fetch full /products.json with metadata ───────────────────────────

console.log("=== §1.3 FETCHING FULL /products.json WITH METADATA ===\n");

const allProducts: Array<{
  id: number;
  handle: string;
  title: string;
  vendor: string;
  product_type: string;
}> = [];

let page = 0;
while (page < 100) {
  page++;
  const tmpFile = `/tmp/d17-subimods-page-${page}.json`;
  const cmd = `curl -sL -w "%{http_code}" -o "${tmpFile}" "https://www.subimods.com/products.json?limit=250&page=${page}" 2>/dev/null`;
  const statusOut = execSync(cmd, { timeout: 45000, encoding: "utf8" }).trim();
  const status = parseInt(statusOut, 10);

  if (status !== 200) {
    console.log(`Page ${page}: HTTP ${status} — STOP`);
    break;
  }

  const body = fs.readFileSync(tmpFile, "utf8");
  const data = JSON.parse(body);
  const products = (data.products || []) as Array<{
    id: number;
    handle: string;
    title: string;
    vendor: string;
    product_type: string;
  }>;

  if (products.length === 0) {
    console.log(`Page ${page}: 0 products — TERMINAL`);
    break;
  }

  for (const p of products) {
    allProducts.push({
      id: p.id,
      handle: p.handle,
      title: p.title || "",
      vendor: p.vendor || "",
      product_type: p.product_type || "",
    });
  }

  if (products.length < 250) {
    console.log(`Page ${page}: ${products.length} products — TERMINAL (partial)`);
    break;
  }

  if (page % 10 === 0) console.log(`Page ${page}: ${products.length} products (total: ${allProducts.length})`);
}

console.log(`\nTotal products with metadata: ${allProducts.length}`);

// Save full metadata
fs.writeFileSync(
  "scripts/output/d17-subimods-full-metadata.json",
  JSON.stringify(allProducts, null, 2),
);

// ─── 2. Rebuild partition ──────────────────────────────────────────────────

console.log("\n=== §1.3 REBUILDING PARTITION ===\n");

const vendors = new Set<string>();
const productTypes = new Set<string>();
for (const p of allProducts) {
  if (p.vendor) vendors.add(p.vendor);
  if (p.product_type) productTypes.add(p.product_type);
}

const oldVendorCount = 183; // from prior run
const oldProductTypeCount = 342; // from prior run

const partitionQueries = [...new Set([...vendors, ...productTypes].filter((q) => q.length > 2))].sort();

console.log(`Vendors: ${vendors.size} (was ${oldVendorCount})`);
console.log(`Product types: ${productTypes.size} (was ${oldProductTypeCount})`);
console.log(`Total partition queries: ${partitionQueries.length} (was 524)`);

// ─── 3. Re-run enumeration ─────────────────────────────────────────────────

console.log("\n=== §1.3 RE-RUNNING ENUMERATION ===\n");

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

      const currentIds = new Set<string>(products.map((p: any) => p.id as string));

      // I-1 relaxed: allow up to 20% overlap, abort at 15%... but for enumeration
      // we just stop the query, don't abort the whole run
      if (prevIds !== null) {
        const prev = prevIds;
        const shared = [...currentIds].filter((id) => prev.has(id));
        const maxAllowed = Math.ceil(products.length * 0.2);
        if (shared.length > maxAllowed) break;
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

const enumHandles = new Set<string>();
for (let i = 0; i < partitionQueries.length; i++) {
  const q = partitionQueries[i];
  const handles = scopedSearchHandles(q);
  for (const h of handles) enumHandles.add(h);
  if ((i + 1) % 50 === 0) {
    console.log(`  [${i + 1}/${partitionQueries.length}] handles: ${enumHandles.size}`);
  }
}

console.log(`\nEnumeration handles: ${enumHandles.size}`);
console.log(`Prior enumeration handles: 13,107 (from d15-enumeration-handles.json)`);
console.log(`DIRECTIVE-15 reported: 13,358`);

// Save
fs.writeFileSync(
  "scripts/output/d17-enumeration-handles.json",
  JSON.stringify({ handles: [...enumHandles], queryCount: partitionQueries.length }, null, 2),
);

// ─── 4. Re-score against same random sample ────────────────────────────────

console.log("\n=== §1.2 RE-SCORING WITH UNION PRESENCE ===\n");

// Load the random sample labels from DIRECTIVE-16
const recallData = JSON.parse(fs.readFileSync("scripts/output/d16-recall-random.json", "utf8"));
const labels = recallData.labels as Array<{
  handle: string;
  title: string;
  vendor: string;
  product_type: string;
  label: "present" | "absent";
  probes: Array<{ query: string; found: boolean; matchCount: number }>;
}>;

console.log(`Random sample: ${labels.length} products (seed=${RANDOM_SEED})`);

// Union presence: present if EITHER the reference standard OR the enumeration found it
let refPresent = 0;
let enumPresent = 0;
let unionPresent = 0;
let bothPresent = 0;
let bothAbsent = 0;
let refOnlyPresent = 0;
let enumOnlyPresent = 0;

for (const l of labels) {
  const refFound = l.label === "present";
  const enumFound = enumHandles.has(l.handle);

  if (refFound) refPresent++;
  if (enumFound) enumPresent++;
  if (refFound || enumFound) unionPresent++;
  if (refFound && enumFound) bothPresent++;
  if (!refFound && !enumFound) bothAbsent++;
  if (refFound && !enumFound) refOnlyPresent++;
  if (!refFound && enumFound) enumOnlyPresent++;
}

console.log(`\nReference standard present: ${refPresent}`);
console.log(`Enumeration present: ${enumPresent}`);
console.log(`Union present: ${unionPresent}`);
console.log(`Both present: ${bothPresent}`);
console.log(`Ref only: ${refOnlyPresent}`);
console.log(`Enum only: ${enumOnlyPresent}`);
console.log(`Both absent: ${bothAbsent}`);

// Recall against union presence
const recallRandom = bothPresent / unionPresent;
const falseNegatives = refOnlyPresent; // ref found but enum didn't
// Note: enumOnlyPresent are NOT enumeration false positives — they are
// reference-standard false negatives. The enumeration found them in the Catalog.

console.log(`\n=== RECALL (against union presence) ===`);
console.log(`True positives (both found): ${bothPresent}`);
console.log(`False negatives (ref found, enum missed): ${falseNegatives}`);
console.log(`recall_random: ${bothPresent}/${unionPresent} = ${(recallRandom * 100).toFixed(1)}%`);

// ─── 5. Absence rate with confidence intervals ─────────────────────────────

const n = labels.length;
const absentCount = bothAbsent;
const presenceRate = unionPresent / n;
const absenceRate = absentCount / n;

// Wilson score 95% CI
function wilsonCI(k: number, n: number, z = 1.96): { lower: number; upper: number } {
  const p = k / n;
  const denominator = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denominator;
  const spread = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return { lower: center - spread, upper: center + spread };
}

const ci = wilsonCI(absentCount, n);

console.log(`\n=== ABSENCE RATE (union presence) ===`);
console.log(`Absent (both missed): ${absentCount}/${n} = ${(absenceRate * 100).toFixed(1)}%`);
console.log(`95% CI (Wilson): [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`);
console.log(`This is an UPPER BOUND — both detectors are imperfect`);

// Sitemap-level absence range
const sitemapCount = 18067;
console.log(`\n=== SITEMAP-LEVEL ABSENCE RANGE ===`);
console.log(`Sitemap: ${sitemapCount}`);
console.log(`Enumeration handles: ${enumHandles.size}`);

// From random sample (independent of enumeration recall):
const impliedPresentFromSample = Math.round(sitemapCount * presenceRate);
const impliedAbsentFromSample = sitemapCount - impliedPresentFromSample;
console.log(`\nFrom random sample (union presence rate: ${(presenceRate * 100).toFixed(1)}%):`);
console.log(`  Implied present: ${impliedPresentFromSample}`);
console.log(`  Implied absent: ${impliedAbsentFromSample}`);
console.log(`  Absent share: ${(impliedAbsentFromSample / sitemapCount * 100).toFixed(1)}%`);
console.log(`  95% CI: [${Math.round(sitemapCount * ci.lower)}, ${Math.round(sitemapCount * ci.upper)}]`);
console.log(`  95% CI share: [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`);

// Save
fs.writeFileSync("scripts/output/d17-recall-recomputed.json", JSON.stringify({
  seed: RANDOM_SEED,
  sampleSize: n,
  sitemapCount,
  enumerationHandles: enumHandles.size,
  partitionQueries: partitionQueries.length,
  partition: {
    vendors: vendors.size,
    productTypes: productTypes.size,
    totalQueries: partitionQueries.length,
    oldVendors: oldVendorCount,
    oldProductTypes: oldProductTypeCount,
    oldQueries: 524,
  },
  scoring: {
    refPresent,
    enumPresent,
    unionPresent,
    bothPresent,
    bothAbsent,
    refOnlyPresent,
    enumOnlyPresent,
    recallRandom,
    absenceRate,
    ci: { lower: ci.lower, upper: ci.upper },
  },
  absenceRange: {
    presenceRate,
    impliedPresentFromSample,
    impliedAbsentFromSample,
    absentShare: impliedAbsentFromSample / sitemapCount,
    ciLower: ci.lower,
    ciUpper: ci.upper,
  },
  timestamp: new Date().toISOString(),
}, null, 2));

console.log(`\nSaved to scripts/output/d17-recall-recomputed.json`);
