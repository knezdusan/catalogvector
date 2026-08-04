/**
 * DIRECTIVE-15 §5: Store enumeration from sitemap.
 *
 * /products.json is NOT exhaustive (DIRECTIVE-14 §2 showed 4,005 extra handles
 * for Subimods). The sitemap_products_*.xml files are the authoritative source.
 *
 * This module fetches and parses sitemap product URLs to get the complete
 * product handle set for a store. Enforces I-2 (enumeration completeness).
 */

import { execSync } from "node:child_process";
import { normalizeDomain } from "./invariants";

export type SitemapProduct = {
  handle: string;
  url: string;
  lastmod?: string;
};

export type StoreEnumeration = {
  domain: string;
  sitemapProducts: SitemapProduct[];
  productsJsonCount: number;
  sitemapCount: number;
  overlap: number;
  sitemapOnly: number;
  productsJsonOnly: number;
  exhaustive: boolean;
};

/**
 * Fetch and parse a store's sitemap index to find product sitemap URLs.
 */
function fetchSitemapIndex(domain: string): string[] {
  const url = `https://${domain}/sitemap.xml`;
  const output = execSync(`curl -sL "${url}" 2>/dev/null`, {
    timeout: 30000,
    encoding: "utf8",
  });

  // Parse XML to find sitemap URLs
  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null = regex.exec(output);
  while (match !== null) {
    const loc = match[1].trim();
    if (loc.includes("sitemap_products")) {
      urls.push(loc);
    }
    match = regex.exec(output);
  }

  return urls;
}

/**
 * Fetch and parse a product sitemap to extract product handles.
 */
function fetchProductSitemap(sitemapUrl: string): SitemapProduct[] {
  const output = execSync(`curl -sL "${sitemapUrl}" 2>/dev/null`, {
    timeout: 30000,
    encoding: "utf8",
  });

  const products: SitemapProduct[] = [];

  // Parse URL and lastmod pairs
  const urlRegex =
    /<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g;
  let match: RegExpExecArray | null = urlRegex.exec(output);
  while (match !== null) {
    const url = match[1].trim();
    const lastmod = match[2]?.trim();

    // Extract handle from URL: https://store.com/products/{handle}
    const handleMatch = url.match(/\/products\/([^?#]+)/);
    if (handleMatch) {
      products.push({
        handle: handleMatch[1],
        url,
        lastmod,
      });
    }
    match = urlRegex.exec(output);
  }

  return products;
}

/**
 * Enumerate all products from a store's sitemap.
 * Returns the complete product handle set.
 */
export function enumerateStoreFromSitemap(domain: string): SitemapProduct[] {
  const normalizedDomain = normalizeDomain(domain);
  console.log(`Enumerating ${normalizedDomain} from sitemap...`);

  const sitemapUrls = fetchSitemapIndex(normalizedDomain);
  console.log(`  Found ${sitemapUrls.length} product sitemap(s)`);

  if (sitemapUrls.length === 0) {
    throw new Error(`No product sitemaps found for ${normalizedDomain}`);
  }

  const allProducts: SitemapProduct[] = [];
  const seenHandles = new Set<string>();

  for (const sitemapUrl of sitemapUrls) {
    console.log(`  Fetching ${sitemapUrl}...`);
    const products = fetchProductSitemap(sitemapUrl);
    for (const p of products) {
      if (!seenHandles.has(p.handle)) {
        seenHandles.add(p.handle);
        allProducts.push(p);
      }
    }
    console.log(
      `    ${products.length} products (${allProducts.length} unique total)`,
    );
  }

  console.log(`  Total unique products from sitemap: ${allProducts.length}`);
  return allProducts;
}

/**
 * Fetch product count from /products.json (paginated).
 * This is the non-exhaustive source that DIRECTIVE-14 showed is incomplete.
 */
export function countProductsJson(domain: string): number {
  let count = 0;
  let page = 0;

  while (page < 30) {
    page++;
    const cmd = `curl -sL "https://${normalizeDomain(domain)}/products.json?limit=250&page=${page}" 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 30000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.products || [];
      count += products.length;
      if (products.length < 250) break;
    } catch {
      break;
    }
  }

  return count;
}

/**
 * Three-way comparison: sitemap vs /products.json vs Catalog handles.
 */
export function compareEnumeration(
  domain: string,
  sitemapProducts: SitemapProduct[],
  productsJsonCount: number,
  catalogHandles: Set<string>,
): StoreEnumeration {
  const sitemapHandles = new Set(sitemapProducts.map((p) => p.handle));

  // Sitemap vs /products.json overlap (we only have counts for /products.json)
  // For a proper overlap we'd need the /products.json handles too
  const sitemapInCatalog = [...sitemapHandles].filter((h) =>
    catalogHandles.has(h),
  ).length;
  const sitemapOnlyCount = sitemapHandles.size - sitemapInCatalog;

  return {
    domain: normalizeDomain(domain),
    sitemapProducts,
    productsJsonCount,
    sitemapCount: sitemapHandles.size,
    overlap: sitemapInCatalog,
    sitemapOnly: sitemapOnlyCount,
    productsJsonOnly: 0, // Would need full /products.json handles to compute
    exhaustive: sitemapHandles.size >= productsJsonCount,
  };
}
