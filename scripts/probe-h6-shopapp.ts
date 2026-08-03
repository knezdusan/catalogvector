/**
 * H6: shop.app as an observable intermediary
 *
 * Pre-registered decision rule (DIRECTIVE-11 §4, fixed 3 August 2026):
 *   H6 supported — shop.app presence agrees with ChatGPT card appearance on ≥16 of 20,
 *                  and disagrees with unscoped Catalog presence on ≥5.
 *   H6 rejected  — agreement with ChatGPT card appearance ≤12 of 20.
 *   H6 inconclusive — anything between, or fewer than 15 products resolvable on shop.app.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface Product {
  store: string;
  domain: string;
  title: string;
  handle?: string;
  id?: string;
  visibility: string;
  nlRank: number | null;
  bsRank: number | null;
  chatgptCard: boolean;
  chatgptCardQuery?: string;
  selectionReason: string;
}

function searchShopApp(query: string): { found: boolean; position: number | null; totalResults: number; topResults: string[] } {
  // shop.app search via web — use curl to search shop.app
  // shop.app has a search endpoint
  const cmd = `curl -sL --max-time 15 "https://shop.app/search?q=${encodeURIComponent(query)}" 2>/dev/null`;
  try {
    const html = execSync(cmd, { timeout: 20000, encoding: "utf8" });
    // Check if the page contains product results
    // shop.app search results are rendered client-side, so we need to check the HTML for product data
    // Look for product titles in the HTML
    const productMatches = html.match(/"title":"([^"]{10,100})"/g) || [];
    const titles = productMatches.map((m) => m.match(/"title":"([^"]+)"/)?.[1] || "").filter(Boolean);

    // Also check for product cards in the HTML
    const hasProducts = html.includes("product") && (html.includes("price") || html.includes("Price"));

    return {
      found: titles.length > 0,
      position: titles.length > 0 ? 1 : null,
      totalResults: titles.length,
      topResults: titles.slice(0, 5),
    };
  } catch (e) {
    return { found: false, position: null, totalResults: 0, topResults: [] };
  }
}

function searchShopAppAPI(query: string): { found: boolean; position: number | null; totalResults: number; topResults: string[] } {
  // Try shop.app's search API endpoint
  const cmd = `curl -sL --max-time 15 "https://shop.app/api/v1/search?q=${encodeURIComponent(query)}" -H "Accept: application/json" 2>/dev/null`;
  try {
    const output = execSync(cmd, { timeout: 20000, encoding: "utf8" });
    if (output.startsWith("{") || output.startsWith("[")) {
      const data = JSON.parse(output);
      const products = data.products || data.results || data.items || [];
      return {
        found: products.length > 0,
        position: products.length > 0 ? 1 : null,
        totalResults: products.length,
        topResults: products.slice(0, 5).map((p: { title?: string; name?: string }) => p.title || p.name || ""),
      };
    }
  } catch (e) {
    // Fall through to HTML search
  }
  return searchShopApp(query);
}

// Main
const products: Product[] = JSON.parse(fs.readFileSync("scripts/output/h6-product-set.json", "utf8"));

console.log("=== H6: shop.app as observable intermediary ===\n");
console.log(`Testing ${products.length} products\n`);

const results: Array<{
  product: Product;
  shopApp: { found: boolean; position: number | null; totalResults: number; topResults: string[] };
  catalogPresent: boolean;
  chatgptCard: boolean;
  agreement: "agree" | "disagree" | "n/a";
}> = [];

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  console.log(`[${i + 1}/${products.length}] ${p.store}: ${p.title.substring(0, 50)}...`);

  // Search shop.app using the product title
  const shopAppResult = searchShopAppAPI(p.title);
  console.log(`  shop.app: found=${shopAppResult.found}, results=${shopAppResult.totalResults}`);

  // Catalog presence (from our existing data)
  const catalogPresent = p.visibility === "present" || p.visibility === "partial";

  // ChatGPT card appearance
  const chatgptCard = p.chatgptCard;

  // Agreement: does shop.app presence agree with ChatGPT card appearance?
  let agreement: "agree" | "disagree" | "n/a" = "n/a";
  if (shopAppResult.found && chatgptCard) agreement = "agree";
  else if (!shopAppResult.found && !chatgptCard) agreement = "agree";
  else if (shopAppResult.found !== chatgptCard) agreement = "disagree";

  results.push({
    product: p,
    shopApp: shopAppResult,
    catalogPresent,
    chatgptCard,
    agreement,
  });

  console.log(`  Catalog: ${catalogPresent ? "present" : "absent"} | ChatGPT card: ${chatgptCard} | Agreement: ${agreement}`);
}

// Summary
const chatgptAgreements = results.filter((r) => r.agreement === "agree").length;
const chatgptDisagreements = results.filter((r) => r.agreement === "disagree").length;
const catalogDisagreements = results.filter((r) => r.shopApp.found !== r.catalogPresent).length;
const resolvable = results.filter((r) => r.shopApp.found).length;

console.log("\n=== Summary ===");
console.log(`Products resolvable on shop.app: ${resolvable}/20`);
console.log(`Agreement with ChatGPT card appearance: ${chatgptAgreements}/20`);
console.log(`Disagreement with ChatGPT card appearance: ${chatgptDisagreements}/20`);
console.log(`Disagreement with Catalog presence: ${catalogDisagreements}/20`);

// Decision rule
let verdict = "";
if (resolvable < 15) {
  verdict = "INCONCLUSIVE (fewer than 15 products resolvable on shop.app)";
} else if (chatgptAgreements >= 16 && catalogDisagreements >= 5) {
  verdict = "SUPPORTED (agrees with ChatGPT ≥16/20, disagrees with Catalog ≥5/20)";
} else if (chatgptAgreements <= 12) {
  verdict = "REJECTED (agreement with ChatGPT ≤12/20)";
} else {
  verdict = `INCONCLUSIVE (agrees with ChatGPT ${chatgptAgreements}/20, between 12 and 16 threshold)`;
}
console.log(`\nVerdict: ${verdict}`);

// Save
const output = {
  timestamp: new Date().toISOString(),
  directive: "DIRECTIVE-11 §4",
  method: "Search shop.app for each product title, record presence and position",
  productCount: products.length,
  results: results.map((r) => ({
    store: r.product.store,
    title: r.product.title,
    handle: r.product.handle,
    visibility: r.product.visibility,
    nlRank: r.product.nlRank,
    bsRank: r.product.bsRank,
    chatgptCard: r.product.chatgptCard,
    chatgptCardQuery: r.product.chatgptCardQuery,
    shopAppFound: r.shopApp.found,
    shopAppTotalResults: r.shopApp.totalResults,
    shopAppTopResults: r.shopApp.topResults,
    catalogPresent: r.catalogPresent,
    agreement: r.agreement,
  })),
  summary: {
    resolvable,
    chatgptAgreements,
    chatgptDisagreements,
    catalogDisagreements,
    verdict,
  },
};

fs.writeFileSync("scripts/output/h6-results.json", JSON.stringify(output, null, 2));
console.log("\nResults saved to scripts/output/h6-results.json");
