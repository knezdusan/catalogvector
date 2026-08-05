/**
 * DIRECTIVE-17 §4: Run corrected enumeration on TSP and MAP.
 *
 * TSP: 2,608 products, /products.json complete. Build partition from
 * /products.json metadata.
 *
 * MAP: 102,176 sitemap products, /products.json capped at 25,000.
 * Build partition from /products.json metadata (25,000 is still a large
 * sample — 24.5% of sitemap). Note this inherits a partial-partition
 * problem but less severe than Subimods' was (24.5% vs 29%).
 *
 * For each store:
 *   1. Fetch /products.json with metadata
 *   2. Build partition (vendors + product types)
 *   3. Run scoped enumeration
 *   4. Draw 100-product random sample from sitemap (seed=42)
 *   5. Run per-product exhaustive probe (reference standard)
 *   6. Compute union presence, absence rate with CIs
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const RANDOM_SEED = 42;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STOPWORDS = new Set([
  "the", "a", "an", "for", "with", "and", "or", "of", "to", "in", "on",
  "at", "by", "is", "it", "this", "that", "from", "as", "be",
]);

interface StoreConfig {
  name: string;
  domain: string;
  shopGid: string;
  sellerDomain: string;
  sitemapFile: string;
}

const STORES: StoreConfig[] = [
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    shopGid: "gid://shopify/Shop/1357086779",
    sellerDomain: "two-step-performance.myshopify.com",
    sitemapFile: "scripts/output/d15-sitemap-tsp.json",
  },
  {
    name: "map",
    domain: "www.maperformance.com",
    shopGid: "gid://shopify/Shop/8906136",
    sellerDomain: "modern-automotive-performance.myshopify.com",
    sitemapFile: "scripts/output/d15-sitemap-map.json",
  },
];

function fetchProductsJson(domain: string): Array<{ handle: string; title: string; vendor: string; product_type: string }> {
  const all: Array<{ handle: string; title: string; vendor: string; product_type: string }> = [];
  let page = 0;
  while (page < 500) {
    page++;
    const tmpFile = `/tmp/d17-${domain}-page-${page}.json`;
    const cmd = `curl -sL -w "%{http_code}" -o "${tmpFile}" "https://${domain}/products.json?limit=250&page=${page}" 2>/dev/null`;
    const statusOut = execSync(cmd, { timeout: 45000, encoding: "utf8" }).trim();
    const status = parseInt(statusOut, 10);
    if (status !== 200) {
      console.log(`  Page ${page}: HTTP ${status} — STOP`);
      break;
    }
    const body = fs.readFileSync(tmpFile, "utf8");
    const data = JSON.parse(body);
    const products = (data.products || []) as Array<any>;
    if (products.length === 0) break;
    for (const p of products) {
      all.push({ handle: p.handle, title: p.title || "", vendor: p.vendor || "", product_type: p.product_type || "" });
    }
    if (products.length < 250) {
      console.log(`  Page ${page}: ${products.length} — TERMINAL`);
      break;
    }
    if (page % 20 === 0) console.log(`  Page ${page}: ${products.length} (total: ${all.length})`);
  }
  return all;
}

function scopedSearchHandles(query: string, shopGid: string, sellerDomain: string, maxPages = 30): Set<string> {
  const handles = new Set<string>();
  let cursor: string | undefined;
  let page = 0;
  let prevIds: Set<string> | null = null;
  while (page < maxPages) {
    page++;
    const setArgs = [`/query=${query.replace(/'/g, "'\\''")}`, `/filters/shops=["${shopGid}"]`, "/pagination/limit=50"];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);
    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.result?.products || [];
      const pagination = data.result?.pagination || {};
      const currentIds = new Set<string>(products.map((p: any) => p.id as string));
      if (prevIds !== null) {
        const prev = prevIds;
        const shared = [...currentIds].filter((id) => prev.has(id));
        if (shared.length > Math.ceil(products.length * 0.2)) break;
      }
      prevIds = currentIds;
      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== sellerDomain) continue;
        const url = p.variants?.[0]?.url;
        if (url) {
          const match = url.match(/\/products\/([^?]+)/);
          if (match) handles.add(match[1]);
        }
      }
      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch { break; }
  }
  return handles;
}

function scopedSearch(query: string, shopGid: string, sellerDomain: string, maxPages = 10): Array<{ handle: string }> {
  const results: Array<{ handle: string }> = [];
  let cursor: string | undefined;
  let page = 0;
  while (page < maxPages) {
    page++;
    const setArgs = [`/query=${query.replace(/'/g, "'\\''")}`, `/filters/shops=["${shopGid}"]`, "/pagination/limit=50"];
    if (cursor) setArgs.push(`/pagination/cursor=${cursor}`);
    const cmd = `ucp catalog search --format json ${setArgs.map((a) => `--set '${a}'`).join(" ")} 2>/dev/null`;
    try {
      const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
      const data = JSON.parse(output);
      const products = data.result?.products || [];
      const pagination = data.result?.pagination || {};
      for (const p of products) {
        if (p.variants?.[0]?.seller?.domain !== sellerDomain) continue;
        const url = p.variants?.[0]?.url;
        if (url) { const match = url.match(/\/products\/([^?]+)/); if (match) results.push({ handle: match[1] }); }
      }
      if (!pagination.has_next_page || !pagination.cursor) break;
      cursor = pagination.cursor;
    } catch { break; }
  }
  return results;
}

function fetchProductTitle(domain: string, handle: string, meta: Map<string, any>): { title: string; vendor: string; product_type: string } {
  const m = meta.get(handle);
  if (m) return m;
  try {
    const cmd = `curl -sL "https://${domain}/products/${handle}.json" 2>/dev/null`;
    const output = execSync(cmd, { timeout: 15000, encoding: "utf8" });
    const data = JSON.parse(output);
    return { title: data.product?.title || handle, vendor: data.product?.vendor || "", product_type: data.product?.product_type || "" };
  } catch { return { title: handle, vendor: "", product_type: "" }; }
}

function wilsonCI(k: number, n: number, z = 1.96): { lower: number; upper: number } {
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const spread = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { lower: center - spread, upper: center + spread };
}

// ─── Main ─────────────────────────────────────────────────────────────────

for (const store of STORES) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`=== ${store.name.toUpperCase()} (${store.domain}) ===`);
  console.log(`${"=".repeat(70)}\n`);

  // 1. Fetch /products.json with metadata
  console.log("Fetching /products.json with metadata...");
  const products = fetchProductsJson(store.domain);
  console.log(`Total products: ${products.length}`);

  const meta = new Map<string, any>();
  for (const p of products) meta.set(p.handle, p);

  // 2. Build partition
  const vendors = new Set<string>();
  const productTypes = new Set<string>();
  for (const p of products) {
    if (p.vendor) vendors.add(p.vendor);
    if (p.product_type) productTypes.add(p.product_type);
  }
  const partitionQueries = [...new Set([...vendors, ...productTypes].filter((q) => q.length > 2))].sort();
  console.log(`Partition: ${vendors.size} vendors, ${productTypes.size} product types, ${partitionQueries.length} queries`);

  // 3. Run enumeration
  console.log("\nRunning enumeration...");
  const enumHandles = new Set<string>();
  for (let i = 0; i < partitionQueries.length; i++) {
    const handles = scopedSearchHandles(partitionQueries[i], store.shopGid, store.sellerDomain);
    for (const h of handles) enumHandles.add(h);
    if ((i + 1) % 50 === 0) console.log(`  [${i + 1}/${partitionQueries.length}] handles: ${enumHandles.size}`);
  }
  console.log(`Enumeration handles: ${enumHandles.size}`);

  // 4. Draw 100 random from sitemap
  const sitemap = JSON.parse(fs.readFileSync(store.sitemapFile, "utf8"));
  const rng = mulberry32(RANDOM_SEED);
  const indices = Array.from({ length: sitemap.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const sample = indices.slice(0, 100).map((idx) => sitemap[idx]);

  // 5. Per-product exhaustive probe
  console.log("\nRunning per-product exhaustive probe on 100 random products...");
  const labels: Array<{ handle: string; title: string; label: "present" | "absent" }> = [];
  for (let i = 0; i < sample.length; i++) {
    const handle = sample[i].handle;
    const m = fetchProductTitle(store.domain, handle, meta);
    const title = m.title;
    const probes = [title, title.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase())).join(" "), `${m.vendor} ${m.product_type}`.trim(), title.split(/\s+/).slice(0, 5).join(" ")].filter((q) => q.length > 2);
    let found = false;
    for (const q of probes) {
      const results = scopedSearch(q, store.shopGid, store.sellerDomain);
      if (results.some((r) => r.handle === handle)) { found = true; break; }
    }
    labels.push({ handle, title, label: found ? "present" : "absent" });
    if ((i + 1) % 10 === 0) console.log(`  [${i + 1}/100] present: ${labels.filter((l) => l.label === "present").length}`);
  }

  // 6. Union presence + CIs
  let refPresent = 0, enumPresent = 0, unionPresent = 0, bothPresent = 0, bothAbsent = 0, refOnly = 0, enumOnly = 0;
  for (const l of labels) {
    const refFound = l.label === "present";
    const enumFound = enumHandles.has(l.handle);
    if (refFound) refPresent++;
    if (enumFound) enumPresent++;
    if (refFound || enumFound) unionPresent++;
    if (refFound && enumFound) bothPresent++;
    if (!refFound && !enumFound) bothAbsent++;
    if (refFound && !enumFound) refOnly++;
    if (!refFound && enumFound) enumOnly++;
  }

  const recall = bothPresent / unionPresent;
  const absenceRate = bothAbsent / 100;
  const ci = wilsonCI(bothAbsent, 100);
  const sitemapCount = sitemap.length;

  console.log(`\n=== ${store.name.toUpperCase()} RESULTS ===`);
  console.log(`Sitemap: ${sitemapCount}`);
  console.log(`/products.json: ${products.length}`);
  console.log(`Enumeration handles: ${enumHandles.size}`);
  console.log(`Partition queries: ${partitionQueries.length}`);
  console.log(`\nUnion presence: ${unionPresent}/100`);
  console.log(`Both present: ${bothPresent}`);
  console.log(`Ref only: ${refOnly}`);
  console.log(`Enum only: ${enumOnly}`);
  console.log(`Both absent: ${bothAbsent}`);
  console.log(`Recall (against union): ${(recall * 100).toFixed(1)}%`);
  console.log(`Absence rate: ${(absenceRate * 100).toFixed(1)}% (95% CI [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%])`);
  console.log(`Upper bound — both detectors imperfect`);

  fs.writeFileSync(`scripts/output/d17-${store.name}-enumeration.json`, JSON.stringify({
    store: store.name,
    sitemapCount,
    productsJsonCount: products.length,
    enumHandles: enumHandles.size,
    partitionQueries: partitionQueries.length,
    vendors: vendors.size,
    productTypes: productTypes.size,
    scoring: { refPresent, enumPresent, unionPresent, bothPresent, bothAbsent, refOnly, enumOnly, recall, absenceRate, ci },
    labels,
    timestamp: new Date().toISOString(),
  }, null, 2));
}

console.log("\n=== ALL STORES COMPLETE ===");
