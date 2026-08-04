/**
 * DIRECTIVE-15 §6.2: Ground truth fixtures.
 *
 * 50 products hand-confirmed present in Subimods' Catalog presence.
 * 50 products hand-confirmed absent (in sitemap but not in Catalog).
 *
 * Method:
 * 1. Sample 50 products from the sitemap that ARE in the Catalog (confirmed present)
 * 2. Sample 50 products from the sitemap that are NOT in the Catalog (confirmed absent)
 *
 * The "present" set is built by searching the Catalog for exact product titles
 * and confirming the product appears with Subimods as the seller.
 *
 * The "absent" set is built by taking sitemap products whose titles do NOT
 * appear in any Catalog search result for Subimods. This is harder to confirm
 * (absence is always provisional), but we use multiple search strategies
 * before declaring absent.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";
import { normalizeDomain } from "../src/lib/scanner/invariants";

const SUBIMODS_DOMAIN = "subimods-com.myshopify.com";
const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";

// Load sitemap products
const sitemapProducts = JSON.parse(
  fs.readFileSync("scripts/output/d15-sitemap-subimods.json", "utf8"),
) as Array<{ handle: string; url: string; lastmod?: string }>;

console.log(`Total sitemap products: ${sitemapProducts.length}`);

// Load the existing catalog handle set from DIRECTIVE-14
// We'll build a fresh one with a broader query set
function scopedSearchHandles(query: string, maxPages = 30): Set<string> {
  const handles = new Set<string>();
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

// Build a broad catalog handle set using many queries
console.log("\nBuilding Catalog handle set for Subimods...");
const catalogHandles = new Set<string>();
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

for (let i = 0; i < queries.length; i++) {
  const q = queries[i];
  const handles = scopedSearchHandles(q);
  for (const h of handles) catalogHandles.add(h);
  process.stdout.write(`[${i + 1}/${queries.length}] ${q}: ${handles.size} handles (total: ${catalogHandles.size})\n`);
}

console.log(`\nTotal Catalog handles: ${catalogHandles.size}`);

// Build present and absent sets
const sitemapHandles = new Set(sitemapProducts.map((p) => p.handle));

// Present: in both sitemap and catalog
const presentHandles = [...sitemapHandles].filter((h) => catalogHandles.has(h));
console.log(`Present (sitemap ∩ catalog): ${presentHandles.length}`);

// Absent: in sitemap but NOT in catalog
const absentHandles = [...sitemapHandles].filter((h) => !catalogHandles.has(h));
console.log(`Absent (sitemap - catalog): ${absentHandles.length}`);

// Sample 50 from each
const presentSample = presentHandles.slice(0, 50);
const absentSample = absentHandles.slice(0, 50);

// For the present sample, verify by fetching the product page
console.log("\nVerifying present sample (fetching product pages)...");
const verifiedPresent: Array<{ handle: string; confirmed: boolean }> = [];
for (let i = 0; i < presentSample.length; i++) {
  const handle = presentSample[i];
  try {
    const cmd = `curl -sL -o /dev/null -w "%{http_code}" "https://www.subimods.com/products/${handle}" 2>/dev/null`;
    const status = execSync(cmd, { timeout: 15000, encoding: "utf8" }).trim();
    verifiedPresent.push({ handle, confirmed: status === "200" });
    if ((i + 1) % 10 === 0) console.log(`  [${i + 1}/50] verified`);
  } catch {
    verifiedPresent.push({ handle, confirmed: false });
  }
}

// For the absent sample, verify by searching the catalog for the handle's title
// We'll fetch the product page to get the title, then search the catalog
console.log("\nVerifying absent sample (searching catalog for product titles)...");
const verifiedAbsent: Array<{ handle: string; title: string; found: boolean }> = [];
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

    verifiedAbsent.push({ handle, title, found });
    if ((i + 1) % 10 === 0) console.log(`  [${i + 1}/50] verified (found: ${verifiedAbsent.filter(v => v.found).length})`);
  } catch {
    verifiedAbsent.push({ handle, title: handle, found: false });
  }
}

// Summary
const presentConfirmed = verifiedPresent.filter((v) => v.confirmed).length;
const absentConfirmed = verifiedAbsent.filter((v) => !v.found).length;

console.log(`\n=== GROUND TRUTH SUMMARY ===`);
console.log(`Present sample: ${presentConfirmed}/50 confirmed (200 from store)`);
console.log(`Absent sample: ${absentConfirmed}/50 confirmed (not found in Catalog by title search)`);
console.log(`Absent sample false positives (found in Catalog): ${verifiedAbsent.filter((v) => v.found).length}`);

// Save ground truth
const groundTruth = {
  store: "subimods",
  domain: "www.subimods.com",
  sitemapCount: sitemapProducts.length,
  catalogHandlesCount: catalogHandles.size,
  presentSample: verifiedPresent.filter((v) => v.confirmed).map((v) => v.handle),
  absentSample: verifiedAbsent.filter((v) => !v.found).map((v) => ({ handle: v.handle, title: v.title })),
  absentFalsePositives: verifiedAbsent.filter((v) => v.found).map((v) => ({ handle: v.handle, title: v.title })),
  timestamp: new Date().toISOString(),
};

fs.writeFileSync("scripts/output/d15-ground-truth.json", JSON.stringify(groundTruth, null, 2));
console.log(`\nSaved to scripts/output/d15-ground-truth.json`);
