/**
 * U-4 CONTROL EXPERIMENT — is `catalog.filters.shops` a hard restriction or a soft bias?
 *
 * WHY THIS EXISTS
 * CatalogVector's entire measurement design assumes that scoping a Global Catalog query
 * to a shop GID restricts the result set to that shop's offers. If `filters.shops` is
 * instead a ranking hint — a soft bias that merely re-weights a global result set — then
 * every recall@k number we publish measures something other than what we claim, and the
 * methodology is invalid. See TDD §2.7 (U-4) and §5 (C6).
 *
 * This probe is designed to FAIL LOUDLY rather than to reassure.
 *
 * THE CRITICAL DESIGN POINT
 * Global Catalog results cluster by Universal Product ID (UPID), and a single clustered
 * product may carry offers from several merchants (TDD §2.4). So "did a foreign seller
 * appear in the response?" is the WRONG containment test — foreign offers can legitimately
 * ride along inside a correctly-scoped product cluster.
 *
 * The right test is:
 *   Does EVERY returned product carry at least one offer from a shop in the scoped set?
 *
 * A single product with zero scoped-shop offers is a hard falsification: the API returned
 * something the filter should have excluded.
 *
 * NEGATIVE CONTROL (T3) is the sharpest instrument here. A scoped query for a category the
 * target shop demonstrably does not sell should return NOTHING under a hard restriction.
 * If it returns products, the filter is a bias and the design is dead.
 *
 * USAGE
 *   npx tsx scripts/probe-u4-shop-filter.ts
 *
 * OUTPUT
 *   Console verdict + full request/response transcript written to
 *   scripts/output/u4-<timestamp>.json (reproducibility is a schema requirement — TDD §4).
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
// CONFIGURATION — fill these in before running
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  /** Public HTTPS URL of the hosted agent profile. Must serve Content-Type: application/json (TDD §2.4). */
  profileUrl: process.env.UCP_AGENT_PROFILE_URL!,

  /**
   * A search query that will surface the target shop's product, used to resolve
   * its shop GID via search_catalog. This doubles as the U-3 probe.
   * Two Step Performance — auto parts shop, sells brake pads.
   */
  targetSearchQuery: 'Paragon PBP370 brake pads',
  targetShopDomain: 'two-step-performance.myshopify.com',

  /**
   * A DIFFERENT shop, for the multi-shop containment test (T4).
   * Same vertical is fine; it just needs to be a distinct seller.
   * Movcan — e-bike shop, also sells brake pads.
   */
  secondSearchQuery: 'Movcan brake pads',
  secondShopDomain: 'wh0d6e-sd.myshopify.com',

  /** A generic query the target shop plausibly has inventory for. */
  genericQuery: 'brake pads',

  /**
   * NEGATIVE CONTROL: a category the target shop demonstrably does NOT sell.
   * Choose something maximally distant from the shop's catalogue — if the target sells
   * auto parts, use something like 'wedding dress' or 'espresso machine'.
   * The whole experiment turns on this being genuinely absent from the shop.
   */
  negativeControlQuery: 'wedding dress',

  /** Token tier is 5 req/s (TDD §2.7, U-2). 250ms keeps us at half that. */
  requestDelayMs: 250,

  endpoint: 'https://catalog.shopify.com/api/ucp/mcp',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE SHAPES
// Deliberately permissive: this is a probe, and an unexpected shape is itself a finding.
// We validate the fields the experiment depends on and passthrough the rest.
// ─────────────────────────────────────────────────────────────────────────────

const Seller = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    domain: z.string().optional(),
  })
  .passthrough()
  .optional();

const Variant = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    seller: Seller,
  })
  .passthrough();

const Product = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    // Global Catalog puts seller info on variants, not on a top-level offers array.
    variants: z.array(Variant).optional(),
    seller: Seller,
  })
  .passthrough();

const StructuredContent = z
  .object({
    products: z.array(Product).optional(),
    results: z.array(Product).optional(),
    total_count: z.number().optional(),
    messages: z.array(z.unknown()).optional(),
    pagination: z.object({ has_next_page: z.boolean().optional() }).passthrough().optional(),
  })
  .passthrough();

const McpResponse = z
  .object({
    result: z
      .object({
        structuredContent: StructuredContent.optional(),
        isError: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    error: z.unknown().optional(),
  })
  .passthrough();

type ProductT = z.infer<typeof Product>;

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT
// ─────────────────────────────────────────────────────────────────────────────

const transcript: Array<{
  test: string;
  request: unknown;
  response: unknown;
  httpStatus: number;
  at: string;
}> = [];

let rpcId = 1;

async function callTool(test: string, toolName: string, catalogArgs: Record<string, unknown>) {
  const body = {
    jsonrpc: '2.0',
    id: rpcId++,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: {
        meta: { 'ucp-agent': { profile: CONFIG.profileUrl } },
        catalog: catalogArgs,
      },
    },
  };

  const token = await getAccessToken();

  const res = await fetch(CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.json();
  transcript.push({ test, request: body, response: raw, httpStatus: res.status, at: new Date().toISOString() });

  const parsed = McpResponse.safeParse(raw);
  if (!parsed.success) {
    console.warn(`  ⚠ response failed schema validation (recorded in transcript): ${parsed.error.message}`);
    return { products: [] as ProductT[], rawOk: false, content: undefined };
  }
  if (parsed.data.error) {
    console.warn(`  ⚠ JSON-RPC error: ${JSON.stringify(parsed.data.error)}`);
    return { products: [] as ProductT[], rawOk: false, content: undefined };
  }

  const content = parsed.data.result?.structuredContent;
  const products = content?.products ?? content?.results ?? [];

  await sleep(CONFIG.requestDelayMs);
  return { products, rawOk: true, content };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINMENT LOGIC — the heart of the experiment
// ─────────────────────────────────────────────────────────────────────────────

/** Every seller id associated with a clustered product, across all its variants. */
function sellerIdsOf(product: ProductT): string[] {
  const ids = new Set<string>();
  if (product.seller?.id) ids.add(product.seller.id);
  for (const variant of product.variants ?? []) {
    if (variant.seller?.id) ids.add(variant.seller.id);
  }
  return [...ids];
}

interface ContainmentResult {
  total: number;
  /** Products with NO offer from any scoped shop. Any of these falsifies a hard restriction. */
  violations: Array<{ title?: string; id?: string; sellers: string[] }>;
  /** Products where we could not read any seller id — cannot judge; reported separately. */
  indeterminate: number;
}

function checkContainment(products: ProductT[], scopedGids: string[]): ContainmentResult {
  const scoped = new Set(scopedGids);
  const violations: ContainmentResult['violations'] = [];
  let indeterminate = 0;

  for (const p of products) {
    const sellers = sellerIdsOf(p);
    if (sellers.length === 0) {
      indeterminate++;
      continue;
    }
    if (!sellers.some((s) => scoped.has(s))) {
      violations.push({ title: p.title, id: p.id, sellers });
    }
  }

  return { total: products.length, violations, indeterminate };
}

// ─────────────────────────────────────────────────────────────────────────────
// U-3 — resolve a shop GID by searching for a product unique to that shop.
// lookup_catalog requires GIDs (ids), not URLs, so we search by a query that
// will surface the target shop's product and extract the shop GID from variants.
// ─────────────────────────────────────────────────────────────────────────────

async function resolveShopGid(test: string, searchQuery: string, expectedDomain: string): Promise<string | null> {
  const { products } = await callTool(test, 'search_catalog', {
    query: searchQuery,
    pagination: { limit: 20 },
  });
  for (const p of products) {
    for (const v of p.variants ?? []) {
      if (v.seller?.domain === expectedDomain || v.seller?.id) {
        return v.seller?.id ?? null;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nU-4 CONTROL EXPERIMENT — filters.shops semantics');
  console.log('═'.repeat(64));

  const findings: Record<string, unknown> = {};
  const verdicts: string[] = [];

  // ── T0 / U-3: resolve shop GIDs ───────────────────────────────────────────
  console.log('\nT0  Resolving shop GIDs from public product URLs (also answers U-3)');
  const targetGid = await resolveShopGid('T0-target', CONFIG.targetSearchQuery, CONFIG.targetShopDomain);
  const secondGid = await resolveShopGid('T0-second', CONFIG.secondSearchQuery, CONFIG.secondShopDomain);

  console.log(`    target shop GID: ${targetGid ?? 'NOT RESOLVED'}`);
  console.log(`    second shop GID: ${secondGid ?? 'NOT RESOLVED'}`);
  findings.u3 = { targetGid, secondGid, resolved: Boolean(targetGid) };

  if (!targetGid) {
    console.error(
      '\n✗ U-3 FAILED: could not resolve a shop GID from a public product URL.\n' +
        '  U-4 cannot run without it, and C1→C3 has no handoff path.\n' +
        '  Inspect the lookup_catalog response in the transcript before proceeding.',
    );
    await persist(findings, ['U-3 UNRESOLVED — U-4 not run']);
    process.exit(1);
  }

  // ── T1: scoped generic query — containment under a query with real matches ──
  console.log(`\nT1  Scoped generic query ("${CONFIG.genericQuery}") — containment check`);
  const t1 = await callTool('T1-scoped-generic', 'search_catalog', {
    query: CONFIG.genericQuery,
    filters: { available: true, shops: [targetGid] },
    pagination: { limit: 50 },
  });
  const t1c = checkContainment(t1.products, [targetGid]);
  console.log(`    ${t1c.total} products, ${t1c.violations.length} containment violations, ${t1c.indeterminate} indeterminate`);
  if (t1c.violations.length > 0) {
    console.log('    ✗ violating products:', t1c.violations.slice(0, 5));
  }
  findings.t1 = t1c;

  // ── T2: unscoped baseline — proves the filter changes anything at all ──────
  console.log(`\nT2  Unscoped baseline ("${CONFIG.genericQuery}") — does the filter do anything?`);
  const t2 = await callTool('T2-unscoped-generic', 'search_catalog', {
    query: CONFIG.genericQuery,
    filters: { available: true },
    pagination: { limit: 50 },
  });
  const t2Sellers = new Set(t2.products.flatMap(sellerIdsOf));
  const t2TargetHits = t2.products.filter((p) => sellerIdsOf(p).includes(targetGid)).length;
  console.log(`    ${t2.products.length} products from ${t2Sellers.size} distinct sellers; ${t2TargetHits} from target shop`);
  findings.t2 = { total: t2.products.length, distinctSellers: t2Sellers.size, targetHits: t2TargetHits };

  if (t2Sellers.size <= 1 && t1c.total > 0) {
    verdicts.push('INCONCLUSIVE: unscoped query also returned a single seller — the query is too narrow to discriminate.');
  }

  // ── T3: NEGATIVE CONTROL — the decisive test ──────────────────────────────
  console.log(`\nT3  NEGATIVE CONTROL ("${CONFIG.negativeControlQuery}" scoped to a shop that does not sell it)`);
  console.log('    Hard restriction ⇒ zero results. Soft bias ⇒ foreign products appear.');
  const t3 = await callTool('T3-negative-control', 'search_catalog', {
    query: CONFIG.negativeControlQuery,
    filters: { available: true, shops: [targetGid] },
    pagination: { limit: 50 },
  });
  const t3c = checkContainment(t3.products, [targetGid]);
  console.log(`    ${t3c.total} products returned, ${t3c.violations.length} from outside the scoped shop`);
  findings.t3 = t3c;

  // ── T4: multi-shop scope ──────────────────────────────────────────────────
  if (secondGid) {
    console.log('\nT4  Two-shop scope — containment across a set');
    const t4 = await callTool('T4-multi-shop', 'search_catalog', {
      query: CONFIG.genericQuery,
      filters: { available: true, shops: [targetGid, secondGid] },
      pagination: { limit: 50 },
    });
    const t4c = checkContainment(t4.products, [targetGid, secondGid]);
    console.log(`    ${t4c.total} products, ${t4c.violations.length} containment violations`);
    findings.t4 = t4c;
  } else {
    console.log('\nT4  SKIPPED — second shop GID unresolved');
  }

  // ── T5: pagination depth — does containment survive past page one? ─────────
  console.log('\nT5  Pagination depth — containment on page 2');
  const t1Cursor = t1.content?.pagination?.cursor;
  if (t1Cursor) {
    console.log(`    Using cursor from T1: ${t1Cursor.slice(0, 40)}…`);
    const t5 = await callTool('T5-deep-page', 'search_catalog', {
      query: CONFIG.genericQuery,
      filters: { available: true, shops: [targetGid] },
      pagination: { limit: 50, cursor: t1Cursor },
    });
    const t5c = checkContainment(t5.products, [targetGid]);
    console.log(`    ${t5c.total} products, ${t5c.violations.length} containment violations`);
    findings.t5 = t5c;
  } else {
    console.log('    SKIPPED — T1 did not return a pagination cursor (no next page)');
    findings.t5 = { total: 0, violations: [], indeterminate: 0, skipped: true };
  }

  // ── VERDICT ───────────────────────────────────────────────────────────────
  const allViolations =
    t1c.violations.length +
    t3c.violations.length +
    ((findings.t4 as ContainmentResult | undefined)?.violations.length ?? 0) +
    ((findings.t5 as ContainmentResult | undefined)?.violations.length ?? 0);

  // The negative control's purpose is to detect filter LEAKAGE — products from
  // OUTSIDE the scoped shop. The right check is containment violations, not total
  // count. A hard restriction with query-fallback (shop filter holds, but the
  // query is ignored when it has no matches in the shop) returns the shop's
  // general catalog — 0 violations, but total > 0. That's still a hard restriction.
  const negativeControlLeaked = t3c.violations.length > 0;
  const negativeControlReturnedIrrelevant = t3c.total > 0 && t3c.violations.length === 0;

  console.log(`\n${'═'.repeat(64)}`);
  console.log('VERDICT');
  console.log('═'.repeat(64));

  if (negativeControlLeaked) {
    verdicts.push(
      'SOFT BIAS (methodology invalid as designed). The negative control returned products ' +
        'from OUTSIDE the scoped shop for a category it does not sell. filters.shops re-weights ' +
        'rather than restricts, so store-scoped recall cannot be measured this way. ' +
        'STOP and redesign C6 before building further.',
    );
  } else if (allViolations > 0) {
    verdicts.push(
      `PARTIAL / LEAKY (${allViolations} containment violations). The negative control held, but some ` +
        'returned products carry no offer from the scoped shop. Investigate whether these are UPID ' +
        'clustering artifacts (tolerable, document it) or genuine filter leakage (not tolerable).',
    );
  } else if (t1c.total === 0 && t2.products.length === 0) {
    verdicts.push('INCONCLUSIVE: no results in either scoped or unscoped queries. Check the query terms and catalog enrolment.');
  } else if (negativeControlReturnedIrrelevant) {
    verdicts.push(
      'HARD RESTRICTION with query fallback (design holds, with caveat). The shop filter is hard — ' +
        'every returned product carries at least one seller from the scoped set (0 violations across all tests). ' +
        'BUT the negative control returned the shop\'s general catalog for a query it doesn\'t match, meaning ' +
        'the query is a soft ranking signal within the shop, not a hard filter. When the query has no matches ' +
        'in the scoped shop, the API returns the shop\'s general catalog instead of an empty set. ' +
        'IMPLICATION FOR C6: recall@k must account for query relevance, not just product presence. A query ' +
        'that returns 50 products from a shop is not necessarily 50 relevant products — verify relevance ' +
        'before counting hits. Store-scoped retrieval measurement is valid; proceed to U-5 and Phase 0.',
    );
  } else {
    verdicts.push(
      'HARD RESTRICTION (design holds). Negative control returned nothing, and every returned product ' +
        'carries at least one offer from the scoped shop set. Store-scoped retrieval measurement is valid. ' +
        'Proceed to U-5 and Phase 0.',
    );
  }

  for (const v of verdicts) console.log(`\n  ${v}`);
  if (t1c.indeterminate > 0 || t3c.indeterminate > 0) {
    console.log(
      `\n  NOTE: ${t1c.indeterminate + t3c.indeterminate} products had no readable seller id. ` +
        'If this count is high, the containment test is weak — inspect the transcript and fix the parser ' +
        'before trusting the verdict.',
    );
  }

  await persist(findings, verdicts);
}

async function persist(findings: Record<string, unknown>, verdicts: string[]) {
  const dir = join(process.cwd(), 'scripts', 'output');
  await mkdir(dir, { recursive: true });
  const path = join(dir, `u4-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(
    path,
    JSON.stringify({ config: { ...CONFIG }, findings, verdicts, transcript }, null, 2),
    'utf8',
  );
  console.log(`\n  Full transcript → ${path}\n`);
}

main().catch((err) => {
  console.error('\nProbe crashed:', err);
  process.exit(1);
});
