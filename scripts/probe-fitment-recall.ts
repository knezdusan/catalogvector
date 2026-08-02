/**
 * FITMENT-RECALL PROBE — does Shopify's inference DROP vehicles the merchant states?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PRE-REGISTERED DECISION RULE — written before the probe was run, 1 Aug 2026
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   METRIC:  fitment_recall = |inferred ∩ stated| / |stated|
 *            computed per product, then averaged over products with a non-empty
 *            stated set. Unit of comparison is (make, model). See LIMITATIONS.
 *
 *   SAMPLE:  ~20 products across 3–4 stores, stratified by source-text richness
 *            (thin < 500 chars, rich > 3000 chars).
 *
 *   IF mean fitment_recall < 0.80
 *      → Real coverage gap. Products are unretrievable for vehicles the merchant
 *        actually serves. This is the finding; proceed to Phase 0 and measure the
 *        retrieval consequences of omission.
 *
 *   IF mean fitment_recall >= 0.80
 *      → Shopify's inference is doing the job. The catalogue-visibility problem
 *        largely does not exist in this vertical. STOP, write up what was found,
 *        take the artifact. Per BLUEPRINT §5 Gate A, this is a SUCCESSFUL OUTCOME,
 *        recorded in advance as such — not a failure.
 *
 *   This threshold is fixed. Do not adjust it after seeing the result. Two premises
 *   have already weakened (spec-invisibility, then inference-accuracy); a third
 *   framing invented after the numbers arrive would not be research.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS PROBE EXISTS
 *
 * The inference-accuracy probe (1 Aug, n=59 claims) found ~1.7% error and 0/9
 * fitment errors — Shopify's extraction is ACCURATE. But a hand annotation noted
 * in passing that the inference OMITTED vehicles present in the merchant's source
 * (FK2, Mégane RS, Mustang Boss 302 on the Paragon PBP370).
 *
 * Omission is not an accuracy failure; it is a COVERAGE failure, and it is worse
 * commercially. If the merchant says the pad fits a Mégane RS and the Catalog's
 * inferred fitment omits it, an agent asked for "brake pads for a Mégane RS"
 * cannot retrieve a product the merchant actually stocks. That is a lost sale on
 * existing inventory, and it is the ORIGINAL thesis (retrieval outcome), not a
 * third reframe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DESIGN: DETERMINISTIC EXTRACTION, HUMAN CONFIRMATION
 *
 * Fitment sets are extracted by a closed-vocabulary pattern matcher, NOT an LLM.
 * An LLM judging an LLM's extraction begs the question (same reason the C5 golden
 * set is hand-labelled). The extractor is crude and auditable: you can read it,
 * predict what it will do, and check it. It emits a review sheet so you confirm
 * the extracted sets before trusting the recall number.
 *
 * LIMITATIONS (carry these into PUB-2)
 *  - Unit is (make, model), NOT (year, make, model, trim). Year-range normalisation
 *    ("17–21" vs "2017-2021" vs "11th Gen") is its own subproblem; including it here
 *    would make the metric measure the extractor rather than the platform.
 *  - Model capture is positional (tokens following a known make) and will over- and
 *    under-capture. That is what the human confirmation step is for.
 *  - Only the merchant's PUBLIC surface is ground truth. Metafield-stored fitment is
 *    invisible to /products.json (TDD §2.3) and may understate the stated set —
 *    which biases recall UPWARD, i.e. against finding a gap. Conservative direction.
 *
 * USAGE
 *   npx tsx scripts/probe-fitment-recall.ts
 *
 * OUTPUT
 *   scripts/output/fitment-<timestamp>.md    ← review sheet + verdict
 *   scripts/output/fitment-<timestamp>.json  ← reproducibility artifact
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Load .env — this is a throwaway probe, not app code. Auth is inlined
// rather than imported from src/ (scripts/ is the laboratory, not the factory).
config({ path: resolve(import.meta.dirname, '..', '.env') });

const TOKEN_ENDPOINT = 'https://api.shopify.com/auth/access_token';

/** Fetch a fresh bearer token (Token tier, 60-min expiry). */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set in .env');
  }
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const DECISION_THRESHOLD = 0.8; // PRE-REGISTERED. Do not change after seeing results.

const CONFIG = {
  profileUrl: process.env.UCP_AGENT_PROFILE_URL!,
  endpoint: 'https://catalog.shopify.com/api/ucp/mcp',

  /** 4 stores. GIDs resolved via search_catalog + variants[].seller.id (U-3 method). */
  stores: [
    { domain: 'www.twostepperformance.com', gid: 'gid://shopify/Shop/1357086779' },
    { domain: 'www.maperformance.com', gid: 'gid://shopify/Shop/8906136' },
    { domain: 'www.subimods.com', gid: 'gid://shopify/Shop/58735984815' },
    { domain: 'www.springrates.com', gid: 'gid://shopify/Shop/2183' },
  ],

  /** Queries used to pull each store's Catalog sample. Broad, fitment-bearing. */
  queries: ['brake pads', 'suspension', 'exhaust'],

  /** Stratification thresholds on merchant source-text length. */
  thinMaxChars: 500,
  richMinChars: 3000,

  /** Target products per bucket, across all stores combined. */
  perBucket: 10,

  storefrontDelayMs: 1000,
  catalogDelayMs: 250,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE VOCABULARY — closed, auditable. Extend deliberately, never silently.
// ─────────────────────────────────────────────────────────────────────────────

const MAKES = [
  'acura', 'alfa romeo', 'audi', 'bmw', 'buick', 'cadillac', 'chevrolet', 'chevy',
  'chrysler', 'dodge', 'ferrari', 'fiat', 'ford', 'genesis', 'gmc', 'holden',
  'honda', 'hyundai', 'infiniti', 'jaguar', 'jeep', 'kia', 'land rover', 'lexus',
  'lincoln', 'lotus', 'maserati', 'mazda', 'mclaren', 'mercedes', 'mercedes-benz',
  'mini', 'mitsubishi', 'nissan', 'opel', 'peugeot', 'polestar', 'pontiac',
  'porsche', 'ram', 'renault', 'saab', 'scion', 'seat', 'skoda', 'subaru',
  'suzuki', 'tesla', 'toyota', 'vauxhall', 'volkswagen', 'volvo', 'vw',
] as const;

/** Canonical aliases so "chevy"/"chevrolet" and "vw"/"volkswagen" do not double-count. */
const MAKE_ALIAS: Record<string, string> = {
  chevy: 'chevrolet',
  vw: 'volkswagen',
  'mercedes-benz': 'mercedes',
};

/** Tokens that must never be captured as a model name. */
const MODEL_STOP = new Set([
  'front', 'rear', 'left', 'right', 'and', 'or', 'the', 'for', 'with', 'w', 'all',
  'models', 'model', 'performance', 'packages', 'package', 'series', 'type',
  'brake', 'pads', 'pad', 'rotors', 'rotor', 'kit', 'set', 'oem', 'fitment', 'fits',
]);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const CatalogProduct = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    metadata: z
      .object({ tech_specs: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const StorefrontProduct = z
  .object({
    id: z.number(),
    handle: z.string(),
    title: z.string(),
    body_html: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    variants: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

type CatalogProductT = z.infer<typeof CatalogProduct>;
type StorefrontProductT = z.infer<typeof StorefrontProduct>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const transcript: unknown[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// FITMENT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

export interface Vehicle {
  make: string;
  model: string;
  /** the raw span it was extracted from, so a human can audit the call */
  context: string;
}

const key = (v: Vehicle) => `${v.make}|${v.model}`;

/**
 * Scan text for `<make> <model tokens…>` patterns.
 * Captures up to three following tokens, stopping at stopwords, punctuation or
 * another make. Deliberately simple: predictable beats clever when a human has to
 * verify the output.
 */
export function extractVehicles(text: string): Vehicle[] {
  const flat = text
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9\-/+.\s]/g, ' ')
    .replace(/\s+/g, ' ');

  const found = new Map<string, Vehicle>();

  for (const make of MAKES) {
    let idx = 0;
    while ((idx = flat.indexOf(make, idx)) !== -1) {
      const before = flat[idx - 1];
      const after = flat[idx + make.length];
      // must be a whole-word match
      if ((before && /[a-z0-9]/.test(before)) || (after && /[a-z0-9]/.test(after))) {
        idx += make.length;
        continue;
      }

      const tail = flat.slice(idx + make.length, idx + make.length + 60);
      const tokens = tail.trim().split(' ');
      const modelParts: string[] = [];

      for (const t of tokens.slice(0, 3)) {
        const clean = t.replace(/^[-/]+|[-/.]+$/g, '');
        if (!clean) break;
        if (MODEL_STOP.has(clean)) break;
        if ((MAKES as readonly string[]).includes(clean)) break;
        if (/^\d{2,4}(-\d{2,4})?$/.test(clean)) break; // a year, not a model
        modelParts.push(clean);
        // one strong token is usually enough: civic, impreza, m3
        if (modelParts.length >= 2) break;
      }

      if (modelParts.length > 0) {
        const canonicalMake = MAKE_ALIAS[make] ?? make;
        const v: Vehicle = {
          make: canonicalMake,
          model: modelParts.join(' '),
          context: flat.slice(Math.max(0, idx - 20), idx + make.length + 40).trim(),
        };
        found.set(key(v), v);
      }

      idx += make.length;
    }
  }

  return [...found.values()];
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCatalog(gid: string, query: string): Promise<CatalogProductT[]> {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: {
        meta: { 'ucp-agent': { profile: CONFIG.profileUrl } },
        catalog: {
          query,
          filters: { available: true, shops: [gid] },
          pagination: { limit: 50 },
        },
      },
    },
  };
  const token = await getAccessToken();
  const res = await fetch(CONFIG.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const raw = await res.json();
  transcript.push({ step: 'catalog', gid, query, response: raw });
  await sleep(CONFIG.catalogDelayMs);
  return (raw?.result?.structuredContent?.products ?? []).map((p: unknown) => CatalogProduct.parse(p));
}

async function fetchStorefront(domain: string): Promise<StorefrontProductT[]> {
  const all: StorefrontProductT[] = [];
  for (let page = 1; page <= 8; page++) {
    const url = `https://${domain}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'user-agent': 'CatalogVector/0.1 (research probe; +https://github.com/knezdusan/catalogvector)',
      },
    });
    if (!res.ok) {
      console.warn(`  ${domain} page ${page} → HTTP ${res.status}; stopping`);
      break;
    }
    const json = await res.json();
    const batch = (json?.products ?? []).map((p: unknown) => StorefrontProduct.parse(p));
    all.push(...batch);
    if (batch.length === 0) break;
    await sleep(CONFIG.storefrontDelayMs);
  }
  transcript.push({ step: 'storefront', domain, count: all.length });
  return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHING — handle/SKU first, title only as a last resort
// (the inference-accuracy probe mispaired a Z16 with a Z23 on title Jaccard)
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchProduct(cat: CatalogProductT, storefront: StorefrontProductT[]) {
  const ct = norm(cat.title ?? '');
  if (!ct) return null;

  // 1. exact normalised title
  const exact = storefront.find((sp) => norm(sp.title) === ct);
  if (exact) return { product: exact, confidence: 1, method: 'exact-title' as const };

  // 2. SKU appearing in the catalog title
  for (const sp of storefront) {
    for (const v of sp.variants ?? []) {
      const sku = typeof v.sku === 'string' ? norm(v.sku) : '';
      if (sku.length >= 5 && ct.includes(sku)) {
        return { product: sp, confidence: 0.95, method: 'sku' as const };
      }
    }
  }

  // 3. containment either way — still risky, flagged for human check
  const contained = storefront.find((sp) => {
    const st = norm(sp.title);
    return st.length > 10 && (st.includes(ct) || ct.includes(st));
  });
  if (contained) return { product: contained, confidence: 0.6, method: 'containment' as const };

  return null;
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

function sourceTextOf(sp: StorefrontProductT) {
  return [
    sp.title,
    (sp.tags ?? []).join(' '),
    stripHtml(sp.body_html ?? ''),
    (sp.variants ?? []).map((v) => [v.title, v.sku].filter(Boolean).join(' ')).join(' '),
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

interface Row {
  store: string;
  bucket: 'thin' | 'rich';
  catalogTitle: string;
  handle: string;
  matchMethod: string;
  matchConfidence: number;
  sourceChars: number;
  stated: Vehicle[];
  inferred: Vehicle[];
  omitted: Vehicle[];
  added: Vehicle[];
  recall: number | null;
}

async function main() {
  console.log('\nFITMENT-RECALL PROBE');
  console.log('═'.repeat(66));
  console.log(`Pre-registered threshold: mean recall >= ${DECISION_THRESHOLD} → STOP (success)`);
  console.log(`                          mean recall <  ${DECISION_THRESHOLD} → coverage gap, proceed\n`);

  const rows: Row[] = [];

  for (const store of CONFIG.stores) {
    console.log(`\n${store.domain}`);
    const storefront = await fetchStorefront(store.domain);
    console.log(`  storefront: ${storefront.length} products`);
    if (storefront.length === 0) {
      console.warn('  ⚠ no public catalogue — skipping (implement JSON-LD fallback per C2)');
      continue;
    }

    const catalogProducts: CatalogProductT[] = [];
    for (const q of CONFIG.queries) {
      catalogProducts.push(...(await fetchCatalog(store.gid, q)));
    }
    const seen = new Set<string>();
    const unique = catalogProducts.filter((p) => {
      const k = p.id ?? p.title ?? '';
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log(`  catalog: ${unique.length} unique products`);

    for (const cat of unique) {
      const specs = cat.metadata?.tech_specs;
      if (!specs) continue;

      const m = matchProduct(cat, storefront);
      if (!m) continue;

      const source = sourceTextOf(m.product);
      const sourceChars = source.length;

      const bucket: 'thin' | 'rich' | null =
        sourceChars <= CONFIG.thinMaxChars ? 'thin' : sourceChars >= CONFIG.richMinChars ? 'rich' : null;
      if (!bucket) continue; // mid-range products are excluded to keep the contrast clean

      const stated = extractVehicles(source);
      const inferred = extractVehicles(specs);

      const statedKeys = new Set(stated.map(key));
      const inferredKeys = new Set(inferred.map(key));
      const omitted = stated.filter((v) => !inferredKeys.has(key(v)));
      const added = inferred.filter((v) => !statedKeys.has(key(v)));

      rows.push({
        store: store.domain,
        bucket,
        catalogTitle: cat.title ?? '(untitled)',
        handle: m.product.handle,
        matchMethod: m.method,
        matchConfidence: m.confidence,
        sourceChars,
        stated,
        inferred,
        omitted,
        added,
        recall: stated.length === 0 ? null : (stated.length - omitted.length) / stated.length,
      });
    }
  }

  // balance the buckets
  const thin = rows.filter((r) => r.bucket === 'thin').slice(0, CONFIG.perBucket);
  const rich = rows.filter((r) => r.bucket === 'rich').slice(0, CONFIG.perBucket);
  const sample = [...thin, ...rich];

  const scored = sample.filter((r) => r.recall !== null);
  const noFitment = sample.length - scored.length;
  const meanRecall = scored.length ? scored.reduce((s, r) => s + (r.recall ?? 0), 0) / scored.length : null;

  const meanFor = (b: 'thin' | 'rich') => {
    const xs = scored.filter((r) => r.bucket === b);
    return xs.length ? xs.reduce((s, r) => s + (r.recall ?? 0), 0) / xs.length : null;
  };

  console.log('\n' + '═'.repeat(66));
  console.log(`Sample: ${sample.length} products (${thin.length} thin, ${rich.length} rich)`);
  console.log(`Scored: ${scored.length}   No stated fitment: ${noFitment}`);
  console.log(`Mean fitment recall: ${meanRecall === null ? 'n/a' : meanRecall.toFixed(3)}`);
  console.log(`  thin: ${meanFor('thin')?.toFixed(3) ?? 'n/a'}   rich: ${meanFor('rich')?.toFixed(3) ?? 'n/a'}`);
  console.log('═'.repeat(66));

  let verdict: string;
  if (meanRecall === null) {
    verdict =
      'INCONCLUSIVE — no products with a stated fitment set. Either the extractor is failing ' +
      '(check the review sheet) or fitment lives in metafields invisible to /products.json. ' +
      'Do not interpret this as either outcome of the decision rule.';
  } else if (scored.length < 8) {
    verdict = `UNDERPOWERED — only ${scored.length} scored products. Add stores before applying the decision rule.`;
  } else if (meanRecall < DECISION_THRESHOLD) {
    verdict =
      `COVERAGE GAP CONFIRMED (${meanRecall.toFixed(3)} < ${DECISION_THRESHOLD}). Shopify's inference drops ` +
      'vehicles the merchant states, so products are unretrievable for vehicles the merchant serves. ' +
      'This is the finding. Proceed to Phase 0 and measure the retrieval consequences of omission.';
  } else {
    verdict =
      `NO COVERAGE GAP (${meanRecall.toFixed(3)} >= ${DECISION_THRESHOLD}). Shopify's inference preserves the ` +
      "merchant's stated fitment. The catalogue-visibility problem largely does not exist in this vertical. " +
      'STOP per the pre-registered rule. Write up the negative result, publish it, take the artifact — ' +
      'BLUEPRINT §5 records this in advance as a successful outcome.';
  }

  console.log(`\n${verdict}\n`);
  console.log('VERIFY THE EXTRACTED SETS in the review sheet before trusting this number.\n');

  await emit(rows, sample, { meanRecall, thinMean: meanFor('thin'), richMean: meanFor('rich'), noFitment }, verdict);
}

async function emit(
  all: Row[],
  sample: Row[],
  stats: Record<string, number | null>,
  verdict: string,
) {
  const dir = join(process.cwd(), 'scripts', 'output');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const md: string[] = [
    '# Fitment-recall review sheet',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Pre-registered threshold:** mean recall < ${DECISION_THRESHOLD} → coverage gap · >= ${DECISION_THRESHOLD} → stop`,
    '',
    '## Verdict',
    '',
    `> ${verdict}`,
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Mean fitment recall | ${stats.meanRecall === null ? 'n/a' : (stats.meanRecall as number).toFixed(3)} |`,
    `| Thin-source mean | ${stats.thinMean === null ? 'n/a' : (stats.thinMean as number).toFixed(3)} |`,
    `| Rich-source mean | ${stats.richMean === null ? 'n/a' : (stats.richMean as number).toFixed(3)} |`,
    `| Products with no stated fitment | ${stats.noFitment} |`,
    '',
    '## Before trusting the number',
    '',
    'The extractor is a closed-vocabulary pattern matcher, not an LLM. It over- and',
    'under-captures. Check each product below:',
    '',
    '1. Does the **stated** set match what the merchant page actually claims?',
    '2. Does the **inferred** set match `tech_specs`?',
    '3. Is the **match method** trustworthy? `containment` pairings need eyes on them.',
    '',
    'Correct any set by hand and recompute. An uncorrected extractor error is not a',
    'platform finding.',
    '',
    '---',
    '',
  ];

  for (const [i, r] of sample.entries()) {
    md.push(`## ${i + 1}. ${r.catalogTitle}`);
    md.push('');
    md.push(`- **Store:** ${r.store} · **Bucket:** ${r.bucket} (${r.sourceChars} chars)`);
    md.push(`- **Source:** https://${r.store}/products/${r.handle}`);
    md.push(`- **Match:** ${r.matchMethod} (${r.matchConfidence})${r.matchConfidence < 0.9 ? ' ⚠ verify' : ''}`);
    md.push(`- **Recall:** ${r.recall === null ? 'n/a — no stated fitment' : r.recall.toFixed(2)}`);
    md.push('');
    md.push(`**Stated (${r.stated.length}):** ${r.stated.map((v) => `${v.make} ${v.model}`).join(', ') || '—'}`);
    md.push('');
    md.push(`**Inferred (${r.inferred.length}):** ${r.inferred.map((v) => `${v.make} ${v.model}`).join(', ') || '—'}`);
    md.push('');
    if (r.omitted.length) {
      md.push(`**⚠ OMITTED — stated but not inferred (${r.omitted.length}):** ${r.omitted.map((v) => `${v.make} ${v.model}`).join(', ')}`);
      md.push('');
      md.push('These are the vehicles an agent cannot use to find this product.');
      md.push('');
    }
    if (r.added.length) {
      md.push(`**+ ADDED — inferred but not stated (${r.added.length}):** ${r.added.map((v) => `${v.make} ${v.model}`).join(', ')}`);
      md.push('');
      md.push('Either cross-merchant enrichment (Shopify helping) or hallucination. Check one or two by hand.');
      md.push('');
    }
    md.push('**Correction (fill in if the extractor was wrong):** ');
    md.push('');
  }

  const mdPath = join(dir, `fitment-${stamp}.md`);
  const jsonPath = join(dir, `fitment-${stamp}.json`);
  await writeFile(mdPath, md.join('\n'), 'utf8');
  await writeFile(
    jsonPath,
    JSON.stringify({ config: CONFIG, threshold: DECISION_THRESHOLD, stats, verdict, sample, all, transcript }, null, 2),
    'utf8',
  );

  console.log(`  Review sheet → ${mdPath}`);
  console.log(`  Transcript   → ${jsonPath}\n`);
}

main().catch((err) => {
  console.error('\nProbe crashed:', err);
  process.exit(1);
});
