/**
 * DIRECTIVE-13 §1 H7: Validate membership test by checking 50 "absent" products directly.
 * For each, search by its exact title with the Subimods shops filter.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const sample = JSON.parse(fs.readFileSync("/tmp/h7-absent-sample.json", "utf8")) as Array<{
  handle: string;
  title: string;
  vendor: string;
  product_type: string;
}>;

const SUBIMODS_SHOP_GID = "gid://shopify/Shop/58735984815";
const SUBIMODS_SELLER_DOMAIN = "subimods-com.myshopify.com";

let falseNegatives = 0;
let trueNegatives = 0;
const results: Array<{
  handle: string;
  title: string;
  found: boolean;
  catalogTitle: string | null;
  catalogHandle: string | null;
}> = [];

for (let i = 0; i < sample.length; i++) {
  const p = sample[i];
  process.stdout.write(`[${i + 1}/50] ${p.handle.substring(0, 40)}... `);

  // Search by exact title
  const query = p.title.replace(/'/g, "'\\''").substring(0, 100);
  const cmd = `ucp catalog search --format json --set '/query=${query}' --set '/filters/shops=["${SUBIMODS_SHOP_GID}"]' 2>/dev/null`;

  try {
    const output = execSync(cmd, { timeout: 30000, encoding: "utf8" });
    const data = JSON.parse(output);
    const products = (data.result?.products || []) as Array<{
      title: string;
      variants?: Array<{ seller?: { domain: string }; url?: string }>;
    }>;

    // Check if any product's variant URL contains this handle
    let found = false;
    let catalogTitle: string | null = null;
    let catalogHandle: string | null = null;

    for (const prod of products) {
      if (prod.variants?.[0]?.seller?.domain !== SUBIMODS_SELLER_DOMAIN) continue;
      const url = prod.variants?.[0]?.url || "";
      const handleMatch = url.match(/\/products\/([^?]+)/);
      const prodHandle = handleMatch ? handleMatch[1] : "";

      // Check if handles match exactly or closely
      if (prodHandle === p.handle || prodHandle.startsWith(p.handle) || p.handle.startsWith(prodHandle)) {
        found = true;
        catalogTitle = prod.title;
        catalogHandle = prodHandle;
        break;
      }
    }

    // If no exact handle match, check if the title matches closely
    if (!found) {
      for (const prod of products) {
        if (prod.variants?.[0]?.seller?.domain !== SUBIMODS_SELLER_DOMAIN) continue;
        if (prod.title.toLowerCase() === p.title.toLowerCase()) {
          found = true;
          catalogTitle = prod.title;
          const url = prod.variants?.[0]?.url || "";
          const handleMatch = url.match(/\/products\/([^?]+)/);
          catalogHandle = handleMatch ? handleMatch[1] : "";
          break;
        }
      }
    }

    if (found) {
      falseNegatives++;
      console.log("FOUND (false negative!) → " + catalogTitle?.substring(0, 50));
    } else {
      trueNegatives++;
      console.log("NOT FOUND (true negative)");
    }

    results.push({ handle: p.handle, title: p.title, found, catalogTitle, catalogHandle });
  } catch {
    trueNegatives++;
    results.push({ handle: p.handle, title: p.title, found: false, catalogTitle: null, catalogHandle: null });
    console.log("ERROR (counted as not found)");
  }
}

console.log(`\n=== VALIDATION RESULTS ===`);
console.log(`Total checked: ${sample.length}`);
console.log(`True negatives (genuinely absent): ${trueNegatives}`);
console.log(`False negatives (actually present): ${falseNegatives}`);
console.log(`False negative rate: ${(falseNegatives / sample.length * 100).toFixed(1)}%`);

fs.writeFileSync("scripts/output/h7-membership-validation.json", JSON.stringify({
  totalChecked: sample.length,
  trueNegatives,
  falseNegatives,
  falseNegativeRate: falseNegatives / sample.length,
  results,
}, null, 2));

console.log("\nSaved to scripts/output/h7-membership-validation.json");
