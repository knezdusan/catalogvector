/**
 * DIRECTIVE-19 §3.2: Fetch Subimods /products.json with SKUs to measure
 * part-number coverage from title + SKU (not title alone).
 *
 * Rate-limited at ≤1 req/sec/domain per C7.
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
  variants: Array<{
    sku: string | null;
    title: string | null;
  }>;
};

async function fetchPage(domain: string, page: number, limit = 250): Promise<Product[]> {
  const url = `https://${domain}/products.json?limit=${limit}&page=${page}`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "CatalogVector/1.0 (research project)" },
    });
    if (!resp.ok) return [];
    const data = await resp.json() as { products: Product[] };
    return data.products || [];
  } catch {
    return [];
  }
}

function sleep(ms: number) {
  execSync(`sleep ${ms / 1000}`);
}

// Part number extraction from SKU
function extractPartNumberFromSku(sku: string | null): string | null {
  if (!sku || sku.trim().length < 4) return null;
  const cleaned = sku.trim().toUpperCase().replace(/\s+/g, "");

  // OEM-style: mixed letters and digits (e.g., 13575AA044, 44022FN000)
  if (/^[A-Z0-9]{5,}$/.test(cleaned) && /[A-Z]/.test(cleaned) && /[0-9]/.test(cleaned)) {
    return cleaned;
  }

  // Brand-style with hyphens (e.g., map-k-5br → MAP-K-5BR)
  if (/^[A-Z0-9]+-[A-Z0-9]+(-[A-Z0-9]+)*$/.test(cleaned) && /[0-9]/.test(cleaned)) {
    return cleaned;
  }

  // Pure numeric SKUs that are 6+ digits (likely internal IDs, not part numbers)
  if (/^\d{6,}$/.test(cleaned)) {
    return null; // reject pure-numeric — likely internal
  }

  return null;
}

// Part number extraction from title (same as main matcher)
function extractPartNumberFromTitle(title: string): string | null {
  const dotPattern = /\b([A-Z]{2,}\.[A-Za-z0-9]+\.[A-Z0-9]+)\b/g;
  let match = dotPattern.exec(title);
  if (match) return match[1].toUpperCase().replace(/\s+/g, "");

  const hyphenPattern = /\b([A-Z0-9]{2,}-[A-Z0-9]{3,})\b/g;
  match = hyphenPattern.exec(title);
  if (match && /[A-Za-z]/.test(match[1]) && /[0-9]/.test(match[1])) {
    return match[1].toUpperCase().replace(/\s+/g, "");
  }

  const tokenPattern = /\b([A-Z]{2,}[0-9]{2,}[A-Z0-9]*)\b/g;
  while ((match = tokenPattern.exec(title)) !== null) {
    if (match[1].length >= 6) return match[1].toUpperCase().replace(/\s+/g, "");
  }

  const pipePattern = /\|\s*([A-Z0-9][A-Z0-9.\-]{4,})\s*$/;
  match = pipePattern.exec(title);
  if (match && /[A-Za-z]/.test(match[1]) && /[0-9]/.test(match[1])) {
    return match[1].toUpperCase().replace(/\s+/g, "");
  }

  return null;
}

async function main() {
  const domain = "subimods.com";
  const allProducts: Product[] = [];
  let page = 1;
  let emptyPages = 0;

  console.log(`Fetching /products.json from ${domain}...`);

  while (page <= 100 && emptyPages < 3) {
    const products = await fetchPage(domain, page);
    if (products.length === 0) {
      emptyPages++;
    } else {
      emptyPages = 0;
      allProducts.push(...products);
    }

    if (page % 10 === 0) {
      console.log(`  Page ${page}: ${allProducts.length} products so far`);
    }

    page++;
    sleep(1100); // ≤1 req/sec
  }

  console.log(`\nFetched ${allProducts.length} products from ${page - 1} pages`);

  // Analyze coverage
  let titleOnly = 0;
  let skuOnly = 0;
  let both = 0;
  let either = 0;
  let neither = 0;

  const withPartNums: Array<{
    handle: string;
    title: string;
    vendor: string | null;
    titlePartNum: string | null;
    skuPartNum: string | null;
    partNumber: string | null;
    source: "title" | "sku" | "both";
  }> = [];

  for (const p of allProducts) {
    const titlePN = extractPartNumberFromTitle(p.title);
    const skuPN = p.variants[0]?.sku
      ? extractPartNumberFromSku(p.variants[0].sku)
      : null;

    if (titlePN && skuPN) {
      both++;
      either++;
      withPartNums.push({
        handle: p.handle,
        title: p.title,
        vendor: p.vendor,
        titlePartNum: titlePN,
        skuPartNum: skuPN,
        partNumber: titlePN, // prefer title
        source: "both",
      });
    } else if (titlePN) {
      titleOnly++;
      either++;
      withPartNums.push({
        handle: p.handle,
        title: p.title,
        vendor: p.vendor,
        titlePartNum: titlePN,
        skuPartNum: null,
        partNumber: titlePN,
        source: "title",
      });
    } else if (skuPN) {
      skuOnly++;
      either++;
      withPartNums.push({
        handle: p.handle,
        title: p.title,
        vendor: p.vendor,
        titlePartNum: null,
        skuPartNum: skuPN,
        partNumber: skuPN,
        source: "sku",
      });
    } else {
      neither++;
    }
  }

  const total = allProducts.length;
  console.log(`\n=== Coverage Analysis (title + SKU) ===`);
  console.log(`  Total products:       ${total}`);
  console.log(`  Part number from title only: ${titleOnly} (${((titleOnly / total) * 100).toFixed(1)}%)`);
  console.log(`  Part number from SKU only:   ${skuOnly} (${((skuOnly / total) * 100).toFixed(1)}%)`);
  console.log(`  Part number from both:       ${both} (${((both / total) * 100).toFixed(1)}%)`);
  console.log(`  Part number from either:     ${either} (${((either / total) * 100).toFixed(1)}%)`);
  console.log(`  No part number extractable:  ${neither} (${((neither / total) * 100).toFixed(1)}%)`);
  console.log(`  Coverage (title+SKU):        ${((either / total) * 100).toFixed(1)}%`);

  // Show examples by source
  console.log(`\n  SKU-source examples:`);
  const skuExamples = withPartNums.filter((x) => x.source === "sku").slice(0, 10);
  for (const ex of skuExamples) {
    const vendor = (ex.vendor || "?").substring(0, 15).padEnd(15);
    const pn = (ex.partNumber || "").padEnd(20);
    console.log(`    ${vendor} | ${pn} | ${ex.title.substring(0, 50)}`);
  }

  // Save results
  const outputPath = path.join(__dirname, "output/d19-attribution-coverage.json");
  const output = {
    timestamp: new Date().toISOString(),
    store: domain,
    totalProducts: total,
    coverage: {
      titleOnly,
      skuOnly,
      both,
      either,
      neither,
      coverageRate: either / total,
    },
    examples: {
      skuSource: skuExamples,
      titleSource: withPartNums.filter((x) => x.source === "title").slice(0, 10),
      bothSource: withPartNums.filter((x) => x.source === "both").slice(0, 10),
    },
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nOutput saved to ${outputPath}`);
}

main().catch(console.error);
