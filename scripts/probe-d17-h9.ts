/**
 * DIRECTIVE-17 §5: H9 — is absence systematic or random?
 *
 * PRE-REGISTERED DECISION RULE (fixed 4 August 2026, before any run):
 *
 * H9: absence from the Catalog is systematic, not random, with respect to
 * publicly visible product attributes.
 *
 * Design: Using union-presence labels on a random sitemap sample of ≥300
 * products per store, across ≥2 stores, compare present and absent
 * populations on: image count, variant count, price, published_at age,
 * vendor, product type, tag count, body length, and whether the product
 * appears in any store collection. Hold out half before inspecting any
 * attribute.
 *
 * H9 supported: at least one attribute separates present from absent with
 *   ≥0.75 accuracy on the held-out half, in ≥2 stores.
 * H9 rejected: no attribute exceeds 0.60 accuracy in any store.
 * H9 inconclusive: anything between, or fewer than 2 stores reach 300
 *   labelled products.
 *
 * We use Subimods and TSP (both have complete /products.json with metadata).
 * MAP is excluded because its /products.json is capped at 25,000 and we
 * cannot get metadata for the full 102,176 without 102K page fetches.
 *
 * For each store:
 *   1. Draw 300 random products from sitemap (seed=42)
 *   2. Run per-product exhaustive probe (reference standard)
 *   3. Check enumeration presence
 *   4. Union presence: present if either detector found it
 *   5. Fetch product metadata from /products.json (already have it)
 *   6. Split 50/50: training half and held-out half
 *   7. On training half, compute separation accuracy for each attribute
 *   8. On held-out half, validate the best attribute
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

const RANDOM_SEED = 42;
const SAMPLE_SIZE = 300;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STOPWORDS = new Set(["the", "a", "an", "for", "with", "and", "or", "of", "to", "in", "on", "at", "by", "is", "it", "this", "that", "from", "as", "be"]);

interface ProductMeta {
  handle: string;
  title: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: number;
  images: number;
  price_min: number | null;
  price_max: number | null;
  published_at: string | null;
  body_length: number;
  in_collection: boolean;
}

function fetchFullProductsJson(domain: string, maxPages = 500): ProductMeta[] {
  const all: ProductMeta[] = [];
  let page = 0;
  while (page < maxPages) {
    page++;
    const tmpFile = `/tmp/d17-h9-${domain.replace(/\./g, "-")}-page-${page}.json`;
    const cmd = `curl -sL -w "%{http_code}" -o "${tmpFile}" "https://${domain}/products.json?limit=250&page=${page}" 2>/dev/null`;
    const statusOut = execSync(cmd, { timeout: 45000, encoding: "utf8" }).trim();
    const status = parseInt(statusOut, 10);
    if (status !== 200) break;
    const body = fs.readFileSync(tmpFile, "utf8");
    const data = JSON.parse(body);
    const products = (data.products || []) as any[];
    if (products.length === 0) break;
    for (const p of products) {
      all.push({
        handle: p.handle,
        title: p.title || "",
        vendor: p.vendor || "",
        product_type: p.product_type || "",
        tags: p.tags || "",
        variants: p.variants?.length || 0,
        images: p.images?.length || 0,
        price_min: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
        price_max: p.variants?.[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : null,
        published_at: p.published_at || null,
        body_length: (p.body_html || "").length,
        in_collection: false, // Will be set from collections data if available
      });
    }
    if (products.length < 250) break;
    if (page % 20 === 0) console.log(`  Page ${page}: ${products.length} (total: ${all.length})`);
  }
  return all;
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

// ─── Attribute extraction ──────────────────────────────────────────────────

interface Attributes {
  imageCount: number;
  variantCount: number;
  price: number | null;
  publishedAgeDays: number | null;
  vendor: string;
  productType: string;
  tagCount: number;
  bodyLength: number;
}

function extractAttributes(meta: ProductMeta | undefined): Attributes {
  if (!meta) return { imageCount: 0, variantCount: 0, price: null, publishedAgeDays: null, vendor: "", productType: "", tagCount: 0, bodyLength: 0 };
  const publishedAgeDays = meta.published_at ? Math.floor((Date.now() - new Date(meta.published_at).getTime()) / 86400000) : null;
  const tagCount = Array.isArray(meta.tags) ? meta.tags.length : (meta.tags ? String(meta.tags).split(",").length : 0);
  return {
    imageCount: meta.images,
    variantCount: meta.variants,
    price: meta.price_min,
    publishedAgeDays,
    vendor: meta.vendor,
    productType: meta.product_type,
    tagCount,
    bodyLength: meta.body_length,
  };
}

// ─── Separation accuracy ───────────────────────────────────────────────────
// For a given attribute, find a threshold (for numeric) or category set
// (for categorical) that best separates present from absent.
// Accuracy = (correct predictions) / (total)

function numericSeparation(values: Array<{ value: number; present: boolean }>): { threshold: number; accuracy: number } {
  // Try all possible thresholds (midpoints between sorted values)
  const sorted = [...values].sort((a, b) => a.value - b.value);
  let bestAccuracy = 0;
  let bestThreshold = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const threshold = (sorted[i].value + sorted[i + 1].value) / 2;
    // Predict: present if value >= threshold
    let correct = 0;
    for (const v of values) {
      const predicted = v.value >= threshold ? "present" : "absent";
      if ((predicted === "present") === v.present) correct++;
    }
    const accuracy = correct / values.length;
    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
      bestThreshold = threshold;
    }
    // Also try: present if value < threshold
    correct = 0;
    for (const v of values) {
      const predicted = v.value < threshold ? "present" : "absent";
      if ((predicted === "present") === v.present) correct++;
    }
    const accuracy2 = correct / values.length;
    if (accuracy2 > bestAccuracy) {
      bestAccuracy = accuracy2;
      bestThreshold = -threshold; // negative means "present if value < |threshold|"
    }
  }

  return { threshold: bestThreshold, accuracy: bestAccuracy };
}

function categoricalSeparation(values: Array<{ value: string; present: boolean }>): { categories: Set<string>; accuracy: number } {
  // Find the set of categories that, if present, predict "absent"
  const categories = new Map<string, { present: number; absent: number }>();
  for (const v of values) {
    if (!categories.has(v.value)) categories.set(v.value, { present: 0, absent: 0 });
    const c = categories.get(v.value)!;
    if (v.present) c.present++;
    else c.absent++;
  }

  // For each category, compute absence rate
  const categoryAbsenceRate = new Map<string, number>();
  for (const [cat, counts] of categories) {
    categoryAbsenceRate.set(cat, counts.absent / (counts.present + counts.absent));
  }

  // Greedy: include categories with above-median absence rate in "absent" set
  const overallAbsenceRate = values.filter((v) => !v.present).length / values.length;
  const absentCategories = new Set<string>();
  for (const [cat, rate] of categoryAbsenceRate) {
    if (rate > overallAbsenceRate) absentCategories.add(cat);
  }

  // Compute accuracy
  let correct = 0;
  for (const v of values) {
    const predicted = absentCategories.has(v.value) ? "absent" : "present";
    if ((predicted === "absent") === !v.present) correct++;
  }

  return { categories: absentCategories, accuracy: correct / values.length };
}

// ─── Main ─────────────────────────────────────────────────────────────────

interface StoreConfig {
  name: string;
  domain: string;
  shopGid: string;
  sellerDomain: string;
  sitemapFile: string;
  enumHandlesFile: string;
}

const STORES: StoreConfig[] = [
  {
    name: "subimods",
    domain: "www.subimods.com",
    shopGid: "gid://shopify/Shop/58735984815",
    sellerDomain: "subimods-com.myshopify.com",
    sitemapFile: "scripts/output/d15-sitemap-subimods.json",
    enumHandlesFile: "scripts/output/d17-enumeration-handles.json",
  },
  {
    name: "tsp",
    domain: "www.twostepperformance.com",
    shopGid: "gid://shopify/Shop/1357086779",
    sellerDomain: "two-step-performance.myshopify.com",
    sitemapFile: "scripts/output/d15-sitemap-tsp.json",
    enumHandlesFile: "scripts/output/d17-tsp-enumeration.json",
  },
];

const allStoreResults: Array<{
  store: string;
  sampleSize: number;
  presentCount: number;
  absentCount: number;
  attributes: Array<{ name: string; type: string; trainAccuracy: number; heldOutAccuracy: number; detail: string }>;
}> = [];

for (const store of STORES) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`=== ${store.name.toUpperCase()} ===`);
  console.log(`${"=".repeat(70)}\n`);

  // Load sitemap and enumeration handles
  const sitemap = JSON.parse(fs.readFileSync(store.sitemapFile, "utf8"));
  const enumData = JSON.parse(fs.readFileSync(store.enumHandlesFile, "utf8"));
  const enumHandles = new Set(enumData.handles || (enumData.enumHandles ? [] : []));

  // Load /products.json metadata
  console.log("Fetching /products.json with full metadata...");
  const productsMeta = fetchFullProductsJson(store.domain);
  const metaMap = new Map<string, ProductMeta>();
  for (const p of productsMeta) metaMap.set(p.handle, p);
  console.log(`Metadata loaded: ${metaMap.size} products`);

  // Draw 300 random from sitemap
  const rng = mulberry32(RANDOM_SEED + (store.name === "subimods" ? 0 : 1000));
  const indices = Array.from({ length: sitemap.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const sample = indices.slice(0, SAMPLE_SIZE).map((idx) => sitemap[idx]);
  console.log(`Random sample: ${sample.length} products (seed=${RANDOM_SEED + (store.name === "subimods" ? 0 : 1000)})`);

  // Per-product exhaustive probe (with cache)
  const cacheFile = `scripts/output/d17-h9-${store.name}-probe-cache.json`;
  let labelled: Array<{ handle: string; refFound: boolean; enumFound: boolean; unionPresent: boolean; meta: ProductMeta | undefined }> = [];

  // Try to load from cache
  try {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    if (cached.length === SAMPLE_SIZE) {
      console.log(`Loaded ${cached.length} probe results from cache`);
      // Re-attach metadata
      labelled = cached.map((c: any) => ({
        ...c,
        meta: metaMap.get(c.handle),
      }));
    }
  } catch { /* no cache */ }

  if (labelled.length === 0) {
    console.log("Running per-product exhaustive probe...");
    for (let i = 0; i < sample.length; i++) {
      const handle = sample[i].handle;
      const meta = metaMap.get(handle);

    // Reference standard: per-product probe
    let refFound = false;
    if (meta) {
      const title = meta.title;
      const probes = [
        title,
        title.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase())).join(" "),
        `${meta.vendor} ${meta.product_type}`.trim(),
        title.split(/\s+/).slice(0, 5).join(" "),
      ].filter((q) => q.length > 2);

      for (const q of probes) {
        const results = scopedSearch(q, store.shopGid, store.sellerDomain);
        if (results.some((r) => r.handle === handle)) { refFound = true; break; }
      }
    }

    const enumFound = enumHandles.has(handle);
    labelled.push({ handle, refFound, enumFound, unionPresent: refFound || enumFound, meta });

    if ((i + 1) % 50 === 0) {
      const present = labelled.filter((l) => l.unionPresent).length;
      console.log(`  [${i + 1}/${sample.length}] union present: ${present}`);
    }
  } // end probe loop

    // Save cache (without meta — it's large and re-attachable)
    fs.writeFileSync(cacheFile, JSON.stringify(
      labelled.map((l) => ({ handle: l.handle, refFound: l.refFound, enumFound: l.enumFound, unionPresent: l.unionPresent })),
    ));
  } // end if (labelled.length === 0)

  const presentCount = labelled.filter((l) => l.unionPresent).length;
  const absentCount = labelled.filter((l) => !l.unionPresent).length;
  console.log(`\nUnion present: ${presentCount}, absent: ${absentCount}`);

  if (absentCount < 10) {
    console.log(`Too few absent products (${absentCount}) — cannot test H9 for this store`);
    continue;
  }

  // Split 50/50: training and held-out
  const shuffled = [...labelled];
  const splitRng = mulberry32(RANDOM_SEED + 999);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(splitRng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const splitPoint = Math.floor(shuffled.length / 2);
  const training = shuffled.slice(0, splitPoint);
  const heldOut = shuffled.slice(splitPoint);
  console.log(`Training: ${training.length}, Held-out: ${heldOut.length}`);

  // Extract attributes
  const trainAttrs = training.map((l) => ({ ...extractAttributes(l.meta), present: l.unionPresent }));
  const heldOutAttrs = heldOut.map((l) => ({ ...extractAttributes(l.meta), present: l.unionPresent }));

  // Test each attribute
  const attributeResults: Array<{ name: string; type: string; trainAccuracy: number; heldOutAccuracy: number; detail: string }> = [];

  // Numeric attributes
  for (const attr of ["imageCount", "variantCount", "price", "publishedAgeDays", "tagCount", "bodyLength"] as const) {
    const trainValues = trainAttrs.map((a) => ({ value: (a[attr] as number) ?? 0, present: a.present })).filter((v) => v.value !== null || attr === "tagCount");
    const heldOutValues = heldOutAttrs.map((a) => ({ value: (a[attr] as number) ?? 0, present: a.present }));

    if (trainValues.length === 0) continue;

    const trainResult = numericSeparation(trainValues);

    // Apply threshold to held-out
    let heldOutCorrect = 0;
    for (const v of heldOutValues) {
      const predicted = trainResult.threshold >= 0
        ? (v.value >= trainResult.threshold ? "present" : "absent")
        : (v.value < Math.abs(trainResult.threshold) ? "present" : "absent");
      if ((predicted === "present") === v.present) heldOutCorrect++;
    }
    const heldOutAccuracy = heldOutCorrect / heldOutValues.length;

    console.log(`  ${attr}: train=${(trainResult.accuracy * 100).toFixed(1)}%, heldOut=${(heldOutAccuracy * 100).toFixed(1)}%, threshold=${trainResult.threshold.toFixed(2)}`);
    attributeResults.push({ name: attr, type: "numeric", trainAccuracy: trainResult.accuracy, heldOutAccuracy, detail: `threshold=${trainResult.threshold.toFixed(2)}` });
  }

  // Categorical attributes
  for (const attr of ["vendor", "productType"] as const) {
    const trainValues = trainAttrs.map((a) => ({ value: a[attr] as string, present: a.present }));
    const heldOutValues = heldOutAttrs.map((a) => ({ value: a[attr] as string, present: a.present }));

    const trainResult = categoricalSeparation(trainValues);

    // Apply category set to held-out
    let heldOutCorrect = 0;
    for (const v of heldOutValues) {
      const predicted = trainResult.categories.has(v.value) ? "absent" : "present";
      if ((predicted === "absent") === !v.present) heldOutCorrect++;
    }
    const heldOutAccuracy = heldOutCorrect / heldOutValues.length;

    console.log(`  ${attr}: train=${(trainResult.accuracy * 100).toFixed(1)}%, heldOut=${(heldOutAccuracy * 100).toFixed(1)}%, categories=${trainResult.categories.size}`);
    attributeResults.push({ name: attr, type: "categorical", trainAccuracy: trainResult.accuracy, heldOutAccuracy, detail: `${trainResult.categories.size} absent-predicting categories` });
  }

  allStoreResults.push({
    store: store.name,
    sampleSize: sample.length,
    presentCount,
    absentCount,
    attributes: attributeResults,
  });

  // Save
  fs.writeFileSync(`scripts/output/d17-h9-${store.name}.json`, JSON.stringify({
    store: store.name,
    sampleSize: sample.length,
    presentCount,
    absentCount,
    trainingSize: training.length,
    heldOutSize: heldOut.length,
    attributes: attributeResults,
    labels: labelled.map((l) => ({ handle: l.handle, refFound: l.refFound, enumFound: l.enumFound, unionPresent: l.unionPresent })),
    timestamp: new Date().toISOString(),
  }, null, 2));
}

// ─── H9 verdict ────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(70)}`);
console.log("=== H9 VERDICT ===");
console.log(`${"=".repeat(70)}\n`);

console.log("Pre-registered decision rule:");
console.log("  H9 supported: ≥0.75 accuracy on held-out half, in ≥2 stores");
console.log("  H9 rejected: no attribute exceeds 0.60 accuracy in any store");
console.log("  H9 inconclusive: anything between\n");

let storesWithSupport = 0;
let storesWithReject = 0;

for (const r of allStoreResults) {
  console.log(`${r.store}: ${r.presentCount} present, ${r.absentCount} absent (n=${r.sampleSize})`);
  const bestAttr = r.attributes.reduce((best, a) => a.heldOutAccuracy > best.heldOutAccuracy ? a : best, r.attributes[0]);
  console.log(`  Best attribute: ${bestAttr.name} — held-out accuracy: ${(bestAttr.heldOutAccuracy * 100).toFixed(1)}%`);

  if (bestAttr.heldOutAccuracy >= 0.75) storesWithSupport++;
  if (bestAttr.heldOutAccuracy <= 0.60) storesWithReject++;

  for (const a of r.attributes) {
    const marker = a.heldOutAccuracy >= 0.75 ? " ← SUPPORTS" : a.heldOutAccuracy <= 0.60 ? "" : " ← inconclusive";
    console.log(`    ${a.name}: train ${(a.trainAccuracy * 100).toFixed(1)}%, held-out ${(a.heldOutAccuracy * 100).toFixed(1)}%${marker}`);
  }
  console.log();
}

if (storesWithSupport >= 2) {
  console.log("VERDICT: H9 SUPPORTED — at least one attribute separates present from absent with ≥0.75 accuracy in ≥2 stores");
} else if (storesWithReject === allStoreResults.length && allStoreResults.length >= 2) {
  console.log("VERDICT: H9 REJECTED — no attribute exceeds 0.60 accuracy in any store");
} else {
  console.log(`VERDICT: H9 INCONCLUSIVE — ${storesWithSupport} store(s) with ≥0.75, ${storesWithReject} store(s) with ≤0.60`);
}

fs.writeFileSync("scripts/output/d17-h9-verdict.json", JSON.stringify({
  stores: allStoreResults,
  storesWithSupport,
  storesWithReject,
  verdict: storesWithSupport >= 2 ? "supported" : storesWithReject === allStoreResults.length && allStoreResults.length >= 2 ? "rejected" : "inconclusive",
  timestamp: new Date().toISOString(),
}, null, 2));
