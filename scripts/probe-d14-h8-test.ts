/**
 * DIRECTIVE-14 §2 H8: Fetch catalog-only handles directly to classify
 * 200+available | 200+unavailable | 404
 *
 * Sample 200 from each store (TSP has only 1, so test all).
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface StoreResult {
  store: string;
  domain: string;
  totalCatalogOnly: number;
  tested: number;
  status200Available: number;
  status200Unavailable: number;
  status404: number;
  statusOther: number;
  results: Array<{
    handle: string;
    status: number;
    classification: string;
    title?: string;
  }>;
}

function fetchProduct(domain: string, handle: string): { status: number; available: boolean | null; title: string | null } {
  const url = `https://${domain}/products/${handle}.json`;
  try {
    const output = execSync(`curl -sL -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null`, {
      timeout: 15000,
      encoding: "utf8",
    });
    const status = parseInt(output.trim(), 10);

    if (status === 200) {
      // Fetch the full product to check availability
      try {
        const productOutput = execSync(`curl -sL "${url}" 2>/dev/null`, {
          timeout: 15000,
          encoding: "utf8",
        });
        const data = JSON.parse(productOutput);
        const product = data.product;
        const variants = product?.variants || [];
        const allUnavailable = variants.length > 0 && variants.every((v: any) => v.available === false);
        return {
          status: 200,
          available: !allUnavailable,
          title: product?.title || null,
        };
      } catch {
        return { status: 200, available: null, title: null };
      }
    }

    return { status, available: null, title: null };
  } catch {
    return { status: 0, available: null, title: null };
  }
}

const stores = [
  {
    name: "subimods",
    domain: "www.subimods.com",
    file: "scripts/output/d14-h8-subimods-catalog-only.json",
  },
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    file: "scripts/output/d14-h8-tsp-catalog-only.json",
  },
  {
    name: "map",
    domain: "www.maperformance.com",
    file: "scripts/output/d14-h8-map-catalog-only.json",
  },
];

const allResults: StoreResult[] = [];

for (const store of stores) {
  console.log(`\n=== ${store.name.toUpperCase()} ===`);

  const catalogOnly = JSON.parse(fs.readFileSync(store.file, "utf8")) as Array<{
    handle: string;
    title: string;
  }>;

  console.log(`Total catalog-only handles: ${catalogOnly.length}`);

  // Sample up to 200
  const sample = catalogOnly.slice(0, 200);
  console.log(`Testing ${sample.length} handles...`);

  const result: StoreResult = {
    store: store.name,
    domain: store.domain,
    totalCatalogOnly: catalogOnly.length,
    tested: sample.length,
    status200Available: 0,
    status200Unavailable: 0,
    status404: 0,
    statusOther: 0,
    results: [],
  };

  for (let i = 0; i < sample.length; i++) {
    const { handle, title } = sample[i];
    const { status, available, title: fetchedTitle } = fetchProduct(store.domain, handle);

    let classification = "other";
    if (status === 200 && available === true) {
      classification = "200-available";
      result.status200Available++;
    } else if (status === 200 && available === false) {
      classification = "200-unavailable";
      result.status200Unavailable++;
    } else if (status === 200 && available === null) {
      classification = "200-unknown";
      result.statusOther++;
    } else if (status === 404) {
      classification = "404";
      result.status404++;
    } else {
      classification = `status-${status}`;
      result.statusOther++;
    }

    result.results.push({ handle, status, classification, title: fetchedTitle || title });

    if ((i + 1) % 20 === 0) {
      console.log(`  [${i + 1}/${sample.length}] 200+avail: ${result.status200Available}, 200+unavail: ${result.status200Unavailable}, 404: ${result.status404}, other: ${result.statusOther}`);
    }
  }

  console.log(`\nResults for ${store.name}:`);
  console.log(`  200+available: ${result.status200Available} (${(result.status200Available / result.tested * 100).toFixed(1)}%)`);
  console.log(`  200+unavailable: ${result.status200Unavailable} (${(result.status200Unavailable / result.tested * 100).toFixed(1)}%)`);
  console.log(`  404: ${result.status404} (${(result.status404 / result.tested * 100).toFixed(1)}%)`);
  console.log(`  other: ${result.statusOther} (${(result.statusOther / result.tested * 100).toFixed(1)}%)`);

  allResults.push(result);
}

// Summary
console.log("\n=== H8 SUMMARY ===");
console.log("Store | Total catalog-only | Tested | 200+avail | 200+unavail | 404 | Other");
for (const r of allResults) {
  console.log(`${r.store} | ${r.totalCatalogOnly} | ${r.tested} | ${r.status200Available} | ${r.status200Unavailable} | ${r.status404} | ${r.statusOther}`);
}

// Apply decision rule
console.log("\n=== DECISION RULE ===");
let storesWithGte5pct404 = 0;
for (const r of allResults) {
  if (r.tested === 0) continue;
  const pct404 = r.status404 / r.tested;
  console.log(`${r.store}: ${pct404.toFixed(1)}% 404 (threshold: 5%)`);
  if (pct404 >= 0.05) storesWithGte5pct404++;
}

if (storesWithGte5pct404 >= 2) {
  console.log("\nVERDICT: H8 SUPPORTED — ≥5% of catalog-only handles return 404 in ≥2 of 3 stores");
} else {
  let storesWithLt1pct404 = 0;
  for (const r of allResults) {
    if (r.tested === 0) continue;
    const pct404 = r.status404 / r.tested;
    if (pct404 < 0.01) storesWithLt1pct404++;
  }
  if (storesWithLt1pct404 >= 2) {
    console.log("\nVERDICT: H8 REJECTED — <1% return 404 in ≥2 of 3 stores");
  } else {
    console.log("\nVERDICT: H8 INCONCLUSIVE — between 1% and 5%, or fewer than 2 stores yield ≥200 testable handles");
  }
}

// Save
fs.writeFileSync("scripts/output/d14-h8-results.json", JSON.stringify(allResults, null, 2));
console.log("\nSaved to scripts/output/d14-h8-results.json");
