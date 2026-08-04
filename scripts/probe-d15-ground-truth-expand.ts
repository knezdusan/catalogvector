/**
 * DIRECTIVE-15 §6.2: Ground truth — expand absent sample.
 *
 * The first run showed 62% of "absent" products were actually present
 * (found by title search). We need to sample more to get 50 confirmed absent.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const SUBIMODS_DOMAIN = "subimods-com.myshopify.com";
const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";

// Load existing ground truth
const existing = JSON.parse(fs.readFileSync("scripts/output/d15-ground-truth.json", "utf8"));

// Load sitemap
const sitemapProducts = JSON.parse(
  fs.readFileSync("scripts/output/d15-sitemap-subimods.json", "utf8"),
) as Array<{ handle: string; url: string }>;

// Load the catalog handle set from the existing ground truth
// We need to re-run the scoped search to get the handle set
// Actually, let's just use the existing data — the catalogHandlesCount was 7957
// and we know which handles are in the catalog from the present/absent split

// Rebuild the catalog handle set from the existing data
// The present sample has 50 handles that are in both sitemap and catalog
// The absent sample has handles in sitemap but not in the 61-query union

// We need the full catalog handle set. Let's re-run the 61 queries.
// Actually, let's save time and just sample from the absent set more aggressively.

const catalogHandles = new Set<string>();
// Rebuild from the queries
const queries = [
  "subaru", "wrx", "sti", "brz", "impreza", "forester", "outback", "legacy",
  "crosstrek", "brake", "intake", "exhaust", "coilovers", "downpipe", "intercooler",
  "clutch", "flywheel", "wheels", "tires", "suspension", "engine", "turbo", "boost",
  "oil", "filter", "spark", "radiator", "charge pipe", "sway bar", "springs", "strut",
  "control arm", "rotors", "shifter", "fuel", "header", "catback", "muffler",
  "perrin", "cobb", "bc racing", "eibach", "whiteline", "k&n", "motul", "ngk",
  "brembo", "hawk", "goodridge", "grimmspeed", "nameless", "invidia", "borla",
  "honda", "civic", "acura", "integra", "accord", "toyota", "supra", "gr86",
];

console.log("Rebuilding catalog handle set...");
for (const q of queries) {
  const setArgs = [
    `/query=${q.replace(/'/g, "'\\''")}`,
    `/filters/shops=["${SUBIMODS_SHOP_GID}"]`,
    "/pagination/limit=50",
  ];
  let cursor: string | undefined;
  let page = 0;
  while (page < 30) {
    page++;
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);
    const cmd = `ucp catalog search --format json ${setArgs.filter((a) => !a.includes("cursor") || cursor).map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
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
          if (match) catalogHandles.add(match[1]);
        }
      }
      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
      // Remove the cursor arg for next iteration
      setArgs.pop();
    } catch {
      break;
    }
  }
}
console.log(`Catalog handles: ${catalogHandles.size}`);

// Get absent handles
const sitemapHandles = new Set(sitemapProducts.map((p) => p.handle));
const absentHandles = [...sitemapHandles].filter((h) => !catalogHandles.has(h));
console.log(`Absent handles: ${absentHandles.length}`);

// Sample 200 from the absent set (skip the first 50 already tested)
const absentSample = absentHandles.slice(50, 250);

console.log(`\nVerifying ${absentSample.length} absent candidates by title search...`);
const confirmedAbsent: Array<{ handle: string; title: string }> = [];
const foundInCatalog: Array<{ handle: string; title: string }> = [];

for (let i = 0; i < absentSample.length; i++) {
  const handle = absentSample[i];
  try {
    // Fetch product page to get title
    const cmd = `curl -sL "https://www.subimods.com/products/${handle}.json" 2>/dev/null`;
    const output = execSync(cmd, { timeout: 15000, encoding: "utf8" });
    const data = JSON.parse(output);
    const title = data.product?.title || handle;

    // Search catalog for this title (scoped to Subimods)
    const searchCmd = `ucp catalog search --set '/query=${title.replace(/'/g, "'\\''")}' --set '/filters/shops=["${SUBIMODS_SHOP_GID}"]' --set '/pagination/limit=10' --format json 2>/dev/null`;
    const searchOutput = execSync(searchCmd, { timeout: 30000, encoding: "utf8" });
    const searchData = JSON.parse(searchOutput);
    const products = searchData.result?.products || [];
    const found = products.some((p: any) => {
      const url = p.variants?.[0]?.url;
      if (!url) return false;
      const match = url.match(/\/products\/([^?]+)/);
      return match && match[1] === handle;
    });

    if (found) {
      foundInCatalog.push({ handle, title });
    } else {
      confirmedAbsent.push({ handle, title });
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  [${i + 1}/${absentSample.length}] confirmed absent: ${confirmedAbsent.length}, found: ${foundInCatalog.length}`);
    }

    // Stop once we have 50 confirmed absent
    if (confirmedAbsent.length >= 50) {
      console.log(`  Reached 50 confirmed absent, stopping.`);
      break;
    }
  } catch {
    // Skip errors
  }
}

console.log(`\n=== EXPANDED ABSENT SAMPLE ===`);
console.log(`Confirmed absent: ${confirmedAbsent.length}`);
console.log(`Found in catalog (false positives): ${foundInCatalog.length}`);
console.log(`False positive rate: ${(foundInCatalog.length / (confirmedAbsent.length + foundInCatalog.length) * 100).toFixed(1)}%`);

// Merge with existing ground truth
const allAbsent = [...existing.absentSample, ...confirmedAbsent].slice(0, 50);
const allPresent = existing.presentSample;

const groundTruth = {
  store: "subimods",
  domain: "www.subimods.com",
  sitemapCount: sitemapProducts.length,
  catalogHandlesCount: catalogHandles.size,
  presentSample: allPresent,
  absentSample: allAbsent,
  absentFalsePositives: [...existing.absentFalsePositives, ...foundInCatalog],
  falsePositiveRate: foundInCatalog.length / (confirmedAbsent.length + foundInCatalog.length),
  timestamp: new Date().toISOString(),
};

fs.writeFileSync("scripts/output/d15-ground-truth.json", JSON.stringify(groundTruth, null, 2));
console.log(`\nSaved to scripts/output/d15-ground-truth.json`);
console.log(`Present: ${allPresent.length}, Absent: ${allAbsent.length}`);
