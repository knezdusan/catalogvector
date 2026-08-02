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
  // P-2 hardening: common auto-parts prose words that are not model names
  'parts', 'specialists', 'enthusiasts', 'decided', 'tends', 'changed', 'seeking',
  'offers', 'provides', 'features', 'includes', 'designed', 'engineered', 'looking',
  'wanting', 'great', 'best', 'quality', 'product', 'products', 'upgrade', 'upgrades',
  'vehicle', 'vehicles', 'car', 'cars', 'auto', 'automotive', 'race', 'racing',
  'track', 'street', 'driving', 'driver', 'drivers', 'application', 'applications',
  // Second-round hardening: colors (inferred side false positives)
  'silver', 'gray', 'grey', 'black', 'brown', 'bronze', 'white', 'red', 'blue',
  'green', 'yellow', 'orange', 'purple', 'gold', 'pink', 'tan', 'beige', 'clear',
  // Fluids/chemicals (from compatibility lists, not vehicles)
  'e85', 'e10', 'e5', 'methanol', 'diesel', 'nitrous', 'coolant', 'water', 'air',
  'oil', 'hydraulic', 'co2', 'gasoline', 'petrol', 'ethanol', 'fuel',
  // Common prose words that follow make names in marketing text
  'ok', 'mean', 'deep', 'aggressive', 'paste', 'design', 'assembled', 'modulation',
  'priced', 'similarly', 'accident', 'engine', 'intended', 'fails', 'part', 'off',
  'wa', 'centers', 'spirited', 'weekend', 'pedal', 'feel', 'thermal', 'stability',
  'corrosion', 'protection', 'banjo', 'bolts', 'security', 'pins', 'bolts', 'high',
  'durability', 'reliability', 'fade', 'reduce', 'body', 'international', 'pair',
  // Auxiliary verbs that can be captured as second model token
  'was', 'is', 'are', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  // Brake compound/brand names (from comparison tables, not vehicles)
  'ferodo', 'dsuno', 'ds3000', 'pagid', 'rst3', 'rs44', 'rs19', 'rs29', 'hawk',
  'pfc', 'endless', 'mxrs', 'mx72', 'project', 'mu', 'cobalt', 'cc', 'rg',
  'competitions', 'sport', 'satin', 'gunmetal', 'competition', 'p2', 'p3', 'r7',
  'stainless', 'hardware', 'gaskets', 'standoffs', 'heat', 'shield', 'backspace',
  'turbo', 'intake', 'sri', 'air', 'effect', 'orange',
  // Third-round: "brakes" (singular "brake" already in list)
  'brakes', 'brakelines',
  // Fourth-round: prose words captured as model tokens
  'releases', 'new', 'soon', 'flow', 'backfill', 'krse11',
]);

/**
 * P-2 hardening: verbs and auxiliaries that indicate prose, not a model name.
 * Per DIRECTIVE-3 §3 P-2: "Reject a captured model token if the following token
 * is a verb or auxiliary."
 */
const VERB_AUX = new Set([
  // auxiliaries
  'to', 'be', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
  'must', 'shall',
  // common verbs in auto-parts prose
  'decided', 'decides', 'tend', 'tends', 'changed', 'changes', 'change', 'seeking',
  'seek', 'seeks', 'offer', 'offers', 'offered', 'provide', 'provides', 'provided',
  'feature', 'features', 'featured', 'include', 'includes', 'included', 'designed',
  'design', 'designs', 'engineered', 'engineer', 'engineers', 'made', 'make', 'makes',
  'built', 'build', 'builds', 'manufactured', 'manufacture', 'manufactures',
  'produced', 'produce', 'produces', 'looking', 'look', 'looks', 'wanting', 'want',
  'wants', 'need', 'needs', 'specialize', 'specializes', 'specialist', 'specialists',
  'enthusiast', 'enthusiasts',
  // verb particles
  'up', 'out', 'down', 'away', 'back',
]);

/** P-2 hardening: spec token pattern (starts with digit, likely a spec not a model). */
const SPEC_TOKEN = /^\d+[a-z.]*/;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const CatalogProduct = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z
      .union([z.string(), z.object({ plain: z.string().optional() }).passthrough()])
      .optional(),
    metadata: z
      .object({ tech_specs: z.string().optional() })
      .passthrough()
      .optional(),
    variants: z
      .array(
        z
          .object({
            url: z.string().optional(),
            sku: z.string().optional(),
            seller: z.object({ id: z.string().optional() }).passthrough().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const StorefrontProduct = z
  .object({
    id: z.number(),
    handle: z.string(),
    title: z.string(),
    body_html: z.string().nullable().optional(),
    // Shopify returns tags as a comma-separated string, not an array
    tags: z.union([z.string(), z.array(z.string())]).optional(),
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
 * Check if a stated vehicle matches an inferred vehicle.
 * A stated vehicle matches if the inferred vehicle's key starts with the stated
 * vehicle's key (the inferred side may be more specific — e.g. "honda civic fc"
 * matches "honda civic"). This prevents false omissions when Shopify adds chassis
 * codes the merchant didn't state.
 */
function vehicleMatches(stated: Vehicle, inferred: Vehicle[]): boolean {
  const statedKey = key(stated);
  return inferred.some((v) => {
    const infKey = key(v);
    // Exact match, or inferred is a specialization of stated
    return infKey === statedKey || infKey.startsWith(statedKey + ' ');
  });
}

/**
 * Check if an inferred vehicle was stated by the merchant.
 * An inferred vehicle matches if any stated vehicle's key is a prefix of the
 * inferred vehicle's key (the stated side may be less specific).
 */
function wasStated(inf: Vehicle, stated: Vehicle[]): boolean {
  const infKey = key(inf);
  return stated.some((v) => {
    const stKey = key(v);
    return infKey === stKey || infKey.startsWith(stKey + ' ');
  });
}

/**
 * Scan text for `<make> <model tokens…>` patterns.
 *
 * P-2 HARDENING (DIRECTIVE-3 §3, 2 Aug 2026):
 *   1. Split on `,`, `/`, `&`, `+` before model capture — prevents "honda civic accord"
 *      from "Honda Civic, Accord" (slash-merged lists).
 *   2. Reject a captured model token if the following token is a verb or auxiliary —
 *      prevents "honda decided to", "honda tends to".
 *   3. Strip possessive `s` when preceded by a make and followed by a spec token —
 *      prevents "honda s 2.0l" = "Honda's 2.0L".
 *
 * Identical logic applied to both sides (merchant source text and Shopify tech_specs).
 * Deliberately simple: predictable beats clever when a human has to verify the output.
 */
export function extractVehicles(text: string): Vehicle[] {
  // Normalize: lowercase, replace dashes, keep delimiters , / & + as segment boundaries
  const flat = text
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9\-/+.,&\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // P-2 fix 1: split on delimiters before model capture
  const segments = flat.split(/[,/&+]/).map((s) => s.trim()).filter(Boolean);

  const found = new Map<string, Vehicle>();
  const makeSet = new Set(MAKES as readonly string[]);

  /**
   * Capture model tokens from a token list starting at `startIdx`.
   * Stops at: stopwords, other makes, year patterns, part numbers, end of token list.
   * Returns the model parts and the index of the first unconsumed token.
   */
  function captureModel(
    tokens: string[],
    startIdx: number,
  ): { parts: string[]; nextIdx: number } {
    const modelParts: string[] = [];
    let i = startIdx;
    for (; i < tokens.length && i < startIdx + 3; i++) {
      const clean = tokens[i].replace(/^[-/.]+|[-/.]+$/g, '');
      if (!clean) continue;
      if (MODEL_STOP.has(clean)) break;
      if (makeSet.has(clean)) break;
      if (/^\d{2,4}(-\d{2,4})?$/.test(clean)) break; // a year, not a model
      // Part-number rejection: tokens with digit.digit patterns (like "pbp.0370")
      // or tokens that start with digits and have 3+ consecutive digits (like "0370")
      // but NOT model names like "f-150" (starts with a letter)
      if (/\d\.\d/.test(clean)) break;
      if (/^\d/.test(clean) && /\d{3,}/.test(clean)) break;
      // Chassis-code rejection: 2-3 letters + 1-2 digits (e.g. "fc", "fk8", "de4", "fl5")
      // These are chassis codes, not model names. Only reject as a SECOND token —
      // a first token like "evo" or "cts" is a legitimate model name.
      if (modelParts.length >= 1 && /^[a-z]{2,3}\d{1,2}$/.test(clean)) break;
      // Part-number rejection: 4+ letters followed by digits (e.g. "krse11", "krs664")
      // These are part numbers, not model names.
      if (/^[a-z]{4,}\d{1,}$/.test(clean)) break;
      modelParts.push(clean);
      if (modelParts.length >= 2) {
        i++;
        break;
      }
    }
    return { parts: modelParts, nextIdx: i };
  }

  /** P-2 fix 2: reject if the token after the captured model is a verb/auxiliary. */
  function isProseAfterModel(tokens: string[], nextIdx: number): boolean {
    // Scan forward past any trailing punctuation tokens to find the next real token
    for (let i = nextIdx; i < tokens.length && i < nextIdx + 2; i++) {
      const t = tokens[i].replace(/^[-/.]+|[-/.]+$/g, '');
      if (!t) continue;
      return VERB_AUX.has(t);
    }
    return false;
  }

  /** P-2 fix 3: check for possessive 's' — make + "s" + spec_token → skip. */
  function isPossessiveS(tokens: string[], startIdx: number): boolean {
    const first = tokens[startIdx]?.replace(/^[-/.]+|[-/.]+$/g, '');
    if (first !== 's') return false;
    const second = tokens[startIdx + 1]?.replace(/^[-/.]+|[-/.]+$/g, '');
    return second ? SPEC_TOKEN.test(second) : false;
  }

  for (const seg of segments) {
    const tokens = seg.split(' ').filter(Boolean);

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].replace(/^[-/.]+|[-/.]+$/g, '');

      // Check if this token is a make (whole-word)
      if (!makeSet.has(t)) continue;

      const canonicalMake = MAKE_ALIAS[t] ?? t;

      const modelStart = i + 1;

      // P-2 fix 3: possessive 's' check
      if (isPossessiveS(tokens, modelStart)) {
        // "honda s 2.0l" = "Honda's 2.0L" — skip, no model here
        continue;
      }

      const { parts, nextIdx } = captureModel(tokens, modelStart);

      if (parts.length === 0) continue;

      // P-2 fix 2: reject if next token after model is a verb/auxiliary
      if (isProseAfterModel(tokens, nextIdx)) continue;

      const v: Vehicle = {
        make: canonicalMake,
        model: parts.join(' '),
        context: seg,
      };
      found.set(key(v), v);
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

/**
 * P-1: Fetch a single storefront product by handle.
 * The catalog variant URL contains the storefront handle — this is the strongest
 * possible match. Returns null if the product is not found (disabled JSON, etc.).
 */
async function fetchStorefrontProduct(
  domain: string,
  handle: string,
): Promise<StorefrontProductT | null> {
  const url = `https://${domain}/products/${handle}.json`;
  const res = await fetch(url, {
    headers: {
      'user-agent': 'CatalogVector/0.1 (research probe; +https://github.com/knezdusan/catalogvector)',
    },
  });
  await sleep(CONFIG.storefrontDelayMs);
  if (!res.ok) {
    transcript.push({ step: 'storefront-product', domain, handle, status: res.status });
    return null;
  }
  const json = await res.json();
  transcript.push({ step: 'storefront-product', domain, handle, status: 200 });
  try {
    return StorefrontProduct.parse(json.product);
  } catch {
    return null;
  }
}

/** P-1: Extract the storefront handle from a catalog variant URL. */
function extractHandleFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/products\/([^?]+)/);
  return m ? m[1] : null;
}

/** Extract plain-text description from a catalog product (handles both string and object forms). */
function catalogDescription(cat: CatalogProductT): string {
  const d = cat.description;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object' && 'plain' in d) return d.plain ?? '';
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHING — P-1: handle/SKU, never title tokens
// (DIRECTIVE-3 §3 P-1: 4 tiers — exact title → variant SKU → handle token overlap → reject)
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Tokenize a handle for token-overlap matching (tier 3). Filters generic tokens. */
const GENERIC_TOKENS = new Set([
  'for', 'the', 'and', 'with', 'all', 'new', 'used', 'set', 'kit', 'pair',
  'front', 'rear', 'left', 'right', 'side', 'each', 'type', 'series',
]);

/** Check if a token looks like a chassis code (2-3 letters + 1-2 digits, e.g. FK8, FE1, DE4). */
function isChassisCode(t: string): boolean {
  return /^[a-z]{2,3}\d{1,2}$/.test(t);
}

function handleTokens(handle: string): Set<string> {
  return new Set(
    norm(handle)
      .split(' ')
      .filter((t) => t.length >= 3 && !GENERIC_TOKENS.has(t) && !/^\d+$/.test(t) && !isChassisCode(t)),
  );
}

interface MatchResult {
  product: StorefrontProductT;
  tier: 1 | 2 | 3;
  method: string;
  confidence: number;
  /** Tier 3 matches are flagged for human confirmation. */
  needsConfirmation: boolean;
}

/**
 * P-1: Match a catalog product to a storefront product.
 * Tiers (per DIRECTIVE-3 §3 P-1):
 *   1. Exact normalised title
 *   2. Variant SKU appearing in the Catalog title or description
 *   3. Storefront handle token overlap (flagged for human confirmation)
 *   4. Reject — no fuzzy title fallback
 *
 * Note: handle-from-variant-URL is handled separately in main() via
 * fetchStorefrontProduct(), which is the strongest possible match (tier 0).
 * This function handles the fallback cases where no variant URL is available.
 */
function matchProduct(cat: CatalogProductT, storefront: StorefrontProductT[]): MatchResult | null {
  const ct = norm(cat.title ?? '');
  if (!ct) return null;

  // Tier 1: exact normalised title
  const exact = storefront.find((sp) => norm(sp.title) === ct);
  if (exact) return { product: exact, tier: 1, method: 'exact-title', confidence: 1.0, needsConfirmation: false };

  // Tier 2: variant SKU appearing in the catalog title or description
  const catText = norm(`${cat.title ?? ''} ${catalogDescription(cat)}`);
  for (const sp of storefront) {
    for (const v of sp.variants ?? []) {
      const sku = typeof v.sku === 'string' ? norm(v.sku) : '';
      if (sku.length >= 5 && catText.includes(sku)) {
        return { product: sp, tier: 2, method: 'sku', confidence: 0.9, needsConfirmation: false };
      }
    }
  }

  // Tier 3: storefront handle token overlap (flagged for human confirmation)
  // Filter generic tokens and chassis codes from the catalog title
  const catTokenSet = new Set(
    ct
      .split(' ')
      .filter((t) => t.length >= 3 && !GENERIC_TOKENS.has(t) && !/^\d+$/.test(t) && !isChassisCode(t)),
  );
  let bestOverlap = 0;
  let bestMatch: StorefrontProductT | null = null;
  for (const sp of storefront) {
    const ht = handleTokens(sp.handle);
    if (ht.size < 2) continue; // need at least 2 significant tokens
    let overlap = 0;
    for (const t of ht) if (catTokenSet.has(t)) overlap++;
    const score = overlap / Math.max(catTokenSet.size, ht.size);
    if (score > bestOverlap) {
      bestOverlap = score;
      bestMatch = sp;
    }
  }
  // Require ≥65% token overlap to match at tier 3 (raised to prevent mispairs)
  if (bestMatch && bestOverlap >= 0.65) {
    return { product: bestMatch, tier: 3, method: 'handle-tokens', confidence: 0.7, needsConfirmation: true };
  }

  // Tier 4: reject
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
  const tags = sp.tags;
  const tagsStr = Array.isArray(tags) ? tags.join(' ') : typeof tags === 'string' ? tags : '';
  return [
    sp.title,
    tagsStr,
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
  matchTier: number; // 0 = handle-from-URL, 1 = exact title, 2 = SKU, 3 = handle tokens
  matchMethod: string;
  matchConfidence: number;
  needsConfirmation: boolean;
  sourceChars: number;
  stated: Vehicle[];
  inferred: Vehicle[];
  omitted: Vehicle[];
  added: Vehicle[];
  recall: number | null;
}

async function main() {
  console.log('\nFITMENT-RECALL PROBE (P-1/P-2 hardened)');
  console.log('═'.repeat(66));
  console.log(`Pre-registered threshold: mean recall >= ${DECISION_THRESHOLD} → STOP (success)`);
  console.log(`                          mean recall <  ${DECISION_THRESHOLD} → coverage gap, proceed\n`);

  const rows: Row[] = [];

  for (const store of CONFIG.stores) {
    console.log(`\n${store.domain}`);

    // Fetch storefront product list as fallback for catalog products without variant URLs
    const storefront = await fetchStorefront(store.domain);
    console.log(`  storefront list: ${storefront.length} products`);
    // Note: we don't skip on 0 — handle-based matching may still work

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

    let matched = 0;
    let rejected = 0;

    for (const cat of unique) {
      const specs = cat.metadata?.tech_specs;
      if (!specs) continue;

      // P-1: Try handle-from-variant-URL first (strongest match — "tier 0")
      const handle = extractHandleFromUrl(cat.variants?.[0]?.url);
      let sp: StorefrontProductT | null = null;
      let tier = 0;
      let method = 'handle-url';
      let confidence = 1.0;
      let needsConfirmation = false;

      if (handle) {
        // Check if it's in the already-fetched storefront list first (avoids extra fetch)
        sp = storefront.find((p) => p.handle === handle) ?? null;
        if (!sp) {
          // Not in the list — fetch directly by handle
          sp = await fetchStorefrontProduct(store.domain, handle);
        }
      }

      // Fallback: 4-tier matching against the storefront list
      if (!sp) {
        const m = matchProduct(cat, storefront);
        if (m) {
          sp = m.product;
          tier = m.tier;
          method = m.method;
          confidence = m.confidence;
          needsConfirmation = m.needsConfirmation;
        }
      }

      if (!sp) {
        rejected++;
        continue;
      }
      matched++;

      const source = sourceTextOf(sp);
      const sourceChars = source.length;

      const bucket: 'thin' | 'rich' | null =
        sourceChars <= CONFIG.thinMaxChars ? 'thin' : sourceChars >= CONFIG.richMinChars ? 'rich' : null;
      if (!bucket) continue; // mid-range products are excluded to keep the contrast clean

      const stated = extractVehicles(source);
      const inferred = extractVehicles(specs);

      // P-2 hardening: prefix matching — "honda civic" (stated) matches "honda civic fc" (inferred)
      const omitted = stated.filter((v) => !vehicleMatches(v, inferred));
      const added = inferred.filter((v) => !wasStated(v, stated));

      rows.push({
        store: store.domain,
        bucket,
        catalogTitle: cat.title ?? '(untitled)',
        handle: sp.handle,
        matchTier: tier,
        matchMethod: method,
        matchConfidence: confidence,
        needsConfirmation,
        sourceChars,
        stated,
        inferred,
        omitted,
        added,
        recall: stated.length === 0 ? null : (stated.length - omitted.length) / stated.length,
      });
    }

    console.log(`  matched: ${matched}, rejected: ${rejected}`);
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
    '3. Is the **match tier** trustworthy? Tier 0 (handle-url) and tier 1 (exact-title)',
    '   are reliable. Tier 2 (SKU) is strong. **Tier 3 (handle-tokens) needs eyes on it.**',
    '',
    'P-2 hardening: the extractor now splits on `,` `/` `&` `+`, rejects models followed',
    'by verbs/auxiliaries, and strips possessive `s`. Verify both sides — the same logic',
    'is applied to merchant source text and Shopify tech_specs.',
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
    md.push(`- **Match:** tier ${r.matchTier} — ${r.matchMethod} (${r.matchConfidence})${r.needsConfirmation ? ' ⚠ VERIFY — tier 3 match' : ''}`);
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
