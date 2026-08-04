/**
 * DIRECTIVE-12 §5: Platform audit of every merchant domain from authenticated pass.
 *
 * Method (same as §1):
 * - Check products.json endpoint (returns JSON → Shopify)
 * - Check headers for powered-by: Shopify
 * - Check for _shopify_y cookie
 * - Check robots.txt for platform signatures
 * - Check for other platform signatures (Squarespace, WordPress, Magento, etc.)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";

interface DomainCheck {
  domain: string;
  platform: string;
  method: string;
  evidence: string;
}

function checkDomain(domain: string): DomainCheck {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const protocols = ["https://www.", "https://"];

  for (const proto of protocols) {
    const url = `${proto}${cleanDomain}`;

    // Check products.json
    try {
      const productsJson = execSync(`curl -sL --max-time 10 "${url}/products.json" 2>/dev/null`, {
        timeout: 15000,
        encoding: "utf8",
      });
      if (productsJson.startsWith('{"products"')) {
        return { domain: cleanDomain, platform: "Shopify", method: "products.json", evidence: `${url}/products.json returns JSON with products array` };
      }
    } catch (e) { /* continue */ }

    // Check headers
    try {
      const headers = execSync(`curl -sI --max-time 10 "${url}" 2>/dev/null`, {
        timeout: 15000,
        encoding: "utf8",
      });
      const lowerHeaders = headers.toLowerCase();

      if (lowerHeaders.includes("powered-by: shopify") || lowerHeaders.includes("x-shopify")) {
        return { domain: cleanDomain, platform: "Shopify", method: "headers", evidence: "powered-by: shopify or x-shopify header" };
      }
      if (lowerHeaders.includes("x-shopid") || lowerHeaders.includes("x-shopify-stage")) {
        return { domain: cleanDomain, platform: "Shopify", method: "headers", evidence: "x-shopid or x-shopify-stage header" };
      }

      // Check for _shopify_y cookie
      if (lowerHeaders.includes("_shopify_y") || lowerHeaders.includes("shopify")) {
        return { domain: cleanDomain, platform: "Shopify", method: "cookies", evidence: "_shopify_y cookie set" };
      }

      // Other platforms
      if (lowerHeaders.includes("x-squarespace") || lowerHeaders.includes("squarespace")) {
        return { domain: cleanDomain, platform: "Squarespace", method: "headers", evidence: "Squarespace header" };
      }
      if (lowerHeaders.includes("x-woocommerce") || lowerHeaders.includes("woocommerce")) {
        return { domain: cleanDomain, platform: "WooCommerce", method: "headers", evidence: "WooCommerce header" };
      }
      if (lowerHeaders.includes("x-magento") || lowerHeaders.includes("magento")) {
        return { domain: cleanDomain, platform: "Magento", method: "headers", evidence: "Magento header" };
      }
      if (lowerHeaders.includes("x-wix") || lowerHeaders.includes("wix")) {
        return { domain: cleanDomain, platform: "Wix", method: "headers", evidence: "Wix header" };
      }
    } catch (e) { /* continue */ }

    // Check robots.txt
    try {
      const robots = execSync(`curl -sL --max-time 10 "${url}/robots.txt" 2>/dev/null`, {
        timeout: 15000,
        encoding: "utf8",
      });
      if (robots.includes("# Squarespace Robots Txt")) {
        return { domain: cleanDomain, platform: "Squarespace", method: "robots.txt", evidence: "# Squarespace Robots Txt" };
      }
      if (robots.includes("woocommerce") || robots.includes("/wp-content/")) {
        return { domain: cleanDomain, platform: "WordPress/WooCommerce", method: "robots.txt", evidence: "woocommerce or wp-content in robots.txt" };
      }
      if (robots.includes("magento") || robots.includes("/pub/media/")) {
        return { domain: cleanDomain, platform: "Magento", method: "robots.txt", evidence: "magento or /pub/media/ in robots.txt" };
      }
    } catch (e) { /* continue */ }

    // Check for Shopify cdn
    try {
      const html = execSync(`curl -sL --max-time 10 "${url}" 2>/dev/null | head -c 50000`, {
        timeout: 15000,
        encoding: "utf8",
      });
      if (html.includes("cdn.shopify.com") || html.includes("Shopify.theme") || html.includes("shopify-section")) {
        return { domain: cleanDomain, platform: "Shopify", method: "HTML", evidence: "cdn.shopify.com or Shopify.theme in HTML" };
      }
      if (html.includes("squarespace")) {
        return { domain: cleanDomain, platform: "Squarespace", method: "HTML", evidence: "squarespace in HTML" };
      }
      if (html.includes("woocommerce") || html.includes("wp-content")) {
        return { domain: cleanDomain, platform: "WordPress/WooCommerce", method: "HTML", evidence: "woocommerce or wp-content in HTML" };
      }
      if (html.includes("magento")) {
        return { domain: cleanDomain, platform: "Magento", method: "HTML", evidence: "magento in HTML" };
      }
    } catch (e) { /* continue */ }

    break; // Only try first protocol that responds
  }

  return { domain: cleanDomain, platform: "Unknown/Other", method: "no indicators found", evidence: "No platform-specific indicators detected" };
}

// All merchant domains from authenticated pass
const domains = [
  "carparts.com",
  "prlmotorsports.com",
  "civicx.com",
  "carid.com",
  "sbxperformance.com",
  "shop.app",
  "procivic.com",
  "hpsperformanceproducts.com",
  "redline360.com",
  "evasivemotorsports.com",
  "twostepperformance.com",
  "turbokits.com",
  "youtube.com",
  "springrates.com",
  "kamispeed.com",
  "ebay.com",
  "nextgentuning.com",
  "fitmentindustries.com",
  "maperformance.com",
  "hybrid-racing.com",
  "bcracing-na.com",
  "goodhousekeeping.com",
  "sleepfoundation.org",
  "target.com",
  "shipt.com",
  "amazon.com",
  "urbanoutfitters.com",
  "kohls.com",
  "soulesthetic.com",
  "linoto.com",
  "nymag.com",
  "parachutehome.com",
  "coyuchi.com",
  "wayside-performance.co.uk",
  "nforcd.com",
  "hks-power.co.jp",
  "autobarn.net",
  "gsportbygesi.com",
  "hardmotion.com",
  "dickssportinggoods.com",
  "bigagnes.com",
  "rei.com",
  "outdoorgearlab.com",
  "cascadedesigns.com",
  "walmart.com",
  "sportsmans.com",
  "cleverhiker.com",
  "sixmoondesigns.com",
  "sectionhiker.com",
];

console.log(`=== Platform audit of ${domains.length} merchant domains ===\n`);

const results: DomainCheck[] = [];
for (let i = 0; i < domains.length; i++) {
  const d = domains[i];
  process.stdout.write(`[${i + 1}/${domains.length}] ${d}... `);
  const result = checkDomain(d);
  results.push(result);
  console.log(result.platform);
}

// Summary
const platformCounts: Record<string, number> = {};
for (const r of results) {
  platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
}

console.log("\n=== Summary ===");
for (const [platform, count] of Object.entries(platformCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${platform}: ${count}`);
}

// Shopify domains
const shopifyDomains = results.filter((r) => r.platform === "Shopify").map((r) => r.domain);
console.log(`\nShopify domains (${shopifyDomains.length}):`);
for (const d of shopifyDomains) console.log(`  ${d}`);

// Save
const output = {
  timestamp: new Date().toISOString(),
  directive: "DIRECTIVE-12 §5",
  method: "Platform audit via curl: products.json, headers, cookies, robots.txt, HTML",
  totalDomains: domains.length,
  results,
  summary: platformCounts,
  shopifyDomains,
  shopifyCount: shopifyDomains.length,
};

fs.writeFileSync("scripts/output/authenticated-pass-platform-audit.json", JSON.stringify(output, null, 2));
console.log("\nResults saved to scripts/output/authenticated-pass-platform-audit.json");
