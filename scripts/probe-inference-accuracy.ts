/**
 * INFERENCE-ACCURACY PROBE — is Shopify's inferred `metadata.tech_specs` correct?
 *
 * WHY THIS EXISTS
 * The U-4 transcript (1 Aug 2026) showed `metadata.tech_specs` populated on ~99% of
 * returned products (199/200), carrying friction coefficients, temperature ranges, part
 * numbers and multi-vehicle fitment lists — all inferred by Shopify's ML from unstructured
 * merchant text. That falsifies the original premise that technical specs are invisible to
 * agents. See TDD §2.5 and the Invalidated Directions register.
 *
 * The surviving question is not presence but CORRECTNESS. Shopify's own documentation flags
 * inferred fields as varying in accuracy. If a brake pad's inferred fitment list names a
 * vehicle the merchant never claimed, an AI agent will sell the wrong part.
 *
 * WHAT THIS PROBE IS
 * A hand-labelling instrument, NOT an automated scorer. It pairs each inferred spec claim
 * with the merchant's own public source text and emits a review sheet for YOU to annotate.
 *
 * WHY IT IS NOT AUTOMATED
 * Using an LLM to judge whether an LLM's extraction is correct begs the question. The
 * calibration set has to be human-labelled or the published accuracy figure is worthless
 * (TDD §5, C5 — the same reason the C5 golden set is hand-labelled). The automated grounding
 * check below is TRIAGE ONLY: it tells you where to look, never what to conclude.
 *
 * KNOWN LIMITATION OF THE GROUNDING HEURISTIC
 * It will over-flag. Legitimate inference paraphrases, converts units (500°C → 932°F),
 * merges variant options into prose, and reads spec tables that survive HTML stripping
 * imperfectly. A flag means "read this one carefully," not "this is a hallucination."
 * Under-flagging is also possible where a number appears in the source for an unrelated
 * reason. Both directions are why a human labels the final verdict.
 *
 * USAGE
 *   npx tsx scripts/probe-inference-accuracy.ts
 *
 * OUTPUT
 *   scripts/output/inference-<timestamp>.md    ← the review sheet you annotate by hand
 *   scripts/output/inference-<timestamp>.json  ← full transcript, reproducibility artifact
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

const CONFIG = {
  profileUrl: process.env.UCP_AGENT_PROFILE_URL!,
  endpoint: 'https://catalog.shopify.com/api/ucp/mcp',

  /** Target store. Both values come from the U-4 run. */
  shopDomain: 'www.twostepperformance.com',
  shopGid: 'gid://shopify/Shop/1357086779',

  /** Query used to pull a sample from the Catalog. Pick something central to the catalogue. */
  sampleQuery: 'brake pads',

  /** How many matched pairs to review. Ten is enough to see whether there is a finding. */
  sampleSize: 10,

  /** Storefront politeness (TDD §5, C7). Catalog token tier is 5 req/s. */
  storefrontDelayMs: 1000,
  catalogDelayMs: 250,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const CatalogProduct = z
  .object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z.object({ plain: z.string().optional() }).passthrough().optional(),
    metadata: z
      .object({
        tech_specs: z.string().optional(),
        top_features: z.string().optional(),
        unique_selling_points: z.array(z.string()).optional(),
        attributes: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
    options: z.array(z.unknown()).optional(),
  })
  .passthrough();

const StorefrontProduct = z
  .object({
    id: z.number(),
    handle: z.string(),
    title: z.string(),
    body_html: z.string().nullable().optional(),
    vendor: z.string().nullable().optional(),
    product_type: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    variants: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

type CatalogProductT = z.infer<typeof CatalogProduct>;
type StorefrontProductT = z.infer<typeof StorefrontProduct>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const transcript: unknown[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

async function fetchCatalogSample(): Promise<CatalogProductT[]> {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: {
        meta: { 'ucp-agent': { profile: CONFIG.profileUrl } },
        catalog: {
          query: CONFIG.sampleQuery,
          filters: { available: true, shops: [CONFIG.shopGid] },
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
  transcript.push({ step: 'catalog-search', request: body, response: raw });
  await sleep(CONFIG.catalogDelayMs);

  const products = raw?.result?.structuredContent?.products ?? [];
  return products.map((p: unknown) => CatalogProduct.parse(p));
}

async function fetchStorefrontCatalogue(): Promise<StorefrontProductT[]> {
  const all: StorefrontProductT[] = [];
  for (let page = 1; page <= 8; page++) {
    const url = `https://${CONFIG.shopDomain}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: {
        // Identify honestly. A documented crawl policy is a methodology asset (TDD §5, C7).
        'user-agent': 'CatalogVector/0.1 (research probe; +https://github.com/knezdusan/catalogvector)',
      },
    });
    if (!res.ok) {
      console.warn(`  storefront page ${page} → HTTP ${res.status}; stopping pagination`);
      break;
    }
    const json = await res.json();
    const batch = (json?.products ?? []).map((p: unknown) => StorefrontProduct.parse(p));
    all.push(...batch);
    transcript.push({ step: `storefront-page-${page}`, url, count: batch.length });
    if (batch.length === 0) break;
    await sleep(CONFIG.storefrontDelayMs);
  }
  return all;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHING — Catalog UPIDs are not merchant product IDs, so match on title
// ─────────────────────────────────────────────────────────────────────────────

const STOP = new Set(['for', 'the', 'and', 'with', 'a', 'of', 'to', 'in', 'w']);

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function bestMatch(cat: CatalogProductT, storefront: StorefrontProductT[]) {
  const ct = tokens(cat.title ?? '');
  let best: { product: StorefrontProductT; score: number } | null = null;
  for (const sp of storefront) {
    const score = jaccard(ct, tokens(sp.title));
    if (!best || score > best.score) best = { product: sp, score };
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUNDING TRIAGE — flags claims worth reading closely. Never decides.
// ─────────────────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

function sourceTextOf(sp: StorefrontProductT): string {
  const parts = [
    sp.title,
    sp.vendor ?? '',
    sp.product_type ?? '',
    (sp.tags ?? []).join(' '),
    stripHtml(sp.body_html ?? ''),
    (sp.variants ?? [])
      .map((v) => [v.title, v.sku, v.option1, v.option2, v.option3].filter(Boolean).join(' '))
      .join(' '),
  ];
  return parts.join('\n').toLowerCase();
}

/** Distinctive tokens: numbers, alphanumeric part codes, capitalised model names. */
function salientTokens(claim: string): string[] {
  const out = new Set<string>();
  for (const m of claim.matchAll(/\b\d[\d.,]*\b/g)) out.add(m[0].replace(/[.,]$/, ''));
  for (const m of claim.matchAll(/\b[A-Z]{2,}[A-Z0-9-]*\b/g)) out.add(m[0]);
  for (const m of claim.matchAll(/\b[A-Za-z]+\d[A-Za-z0-9]*\b/g)) out.add(m[0]);
  return [...out].filter((t) => t.length >= 2).slice(0, 12);
}

interface ClaimCheck {
  claim: string;
  salient: string[];
  found: string[];
  missing: string[];
  /** true when nothing distinctive in the claim appears in the source text */
  flagged: boolean;
}

function checkClaims(techSpecs: string, source: string): ClaimCheck[] {
  return techSpecs
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((claim) => {
      const salient = salientTokens(claim);
      const found = salient.filter((t) => source.includes(t.toLowerCase()));
      const missing = salient.filter((t) => !source.includes(t.toLowerCase()));
      return {
        claim,
        salient,
        found,
        missing,
        flagged: salient.length > 0 && found.length === 0,
      };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nINFERENCE-ACCURACY PROBE');
  console.log('═'.repeat(64));
  console.log(`Store: ${CONFIG.shopDomain}\n`);

  console.log('Fetching Global Catalog sample…');
  const catalogProducts = await fetchCatalogSample();
  console.log(`  ${catalogProducts.length} products`);

  console.log('Fetching merchant storefront catalogue…');
  const storefront = await fetchStorefrontCatalogue();
  console.log(`  ${storefront.length} products`);

  if (storefront.length === 0) {
    console.error(
      '\n✗ /products.json returned nothing. The endpoint may be disabled on this store.\n' +
        '  Either pick a different store or implement the JSON-LD fallback (TDD §5, C2).',
    );
    process.exit(1);
  }

  const withSpecs = catalogProducts.filter((p) => p.metadata?.tech_specs);
  console.log(`\n${withSpecs.length}/${catalogProducts.length} catalog products carry tech_specs`);

  const rows: Array<{
    catalogTitle: string;
    storefrontTitle: string;
    storefrontHandle: string;
    matchScore: number;
    claims: ClaimCheck[];
    sourceLength: number;
  }> = [];

  for (const cat of withSpecs.slice(0, CONFIG.sampleSize)) {
    const match = bestMatch(cat, storefront);
    if (!match || match.score < 0.3) {
      console.warn(`  ⚠ no confident storefront match for "${cat.title}" (best ${match?.score.toFixed(2)})`);
      continue;
    }
    const source = sourceTextOf(match.product);
    rows.push({
      catalogTitle: cat.title ?? '(untitled)',
      storefrontTitle: match.product.title,
      storefrontHandle: match.product.handle,
      matchScore: match.score,
      claims: checkClaims(cat.metadata!.tech_specs!, source),
      sourceLength: source.length,
    });
  }

  const totalClaims = rows.reduce((n, r) => n + r.claims.length, 0);
  const flagged = rows.reduce((n, r) => n + r.claims.filter((c) => c.flagged).length, 0);

  console.log('\n' + '═'.repeat(64));
  console.log(`${rows.length} product pairs · ${totalClaims} inferred claims · ${flagged} flagged for close reading`);
  console.log('═'.repeat(64));
  console.log('\nThe flag count is TRIAGE, not a finding. Open the .md sheet and label each');
  console.log('claim by hand. The verdict column is the deliverable.\n');

  await emit(rows, { totalClaims, flagged });
}

async function emit(rows: any[], stats: Record<string, number>) {
  const dir = join(process.cwd(), 'scripts', 'output');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const md: string[] = [
    `# Inference-accuracy review sheet`,
    ``,
    `**Store:** ${CONFIG.shopDomain} · **Generated:** ${new Date().toISOString()}`,
    `**Pairs:** ${rows.length} · **Claims:** ${stats.totalClaims} · **Auto-flagged:** ${stats.flagged}`,
    ``,
    `## How to label`,
    ``,
    `For each claim, replace \`?\` in the verdict column with one of:`,
    ``,
    `| Code | Meaning |`,
    `|---|---|`,
    `| \`G\` | **Grounded** — traceable to the merchant's source text |`,
    `| \`D\` | **Derived** — not verbatim but legitimately inferable (unit conversion, restatement, variant options folded into prose) |`,
    `| \`C\` | **Contradicted** — the source says something materially different |`,
    `| \`U\` | **Unsourced** — appears nowhere in the source; candidate hallucination |`,
    `| \`X\` | **Unverifiable** — cannot be judged from public data alone |`,
    ``,
    `The headline metric is **(C + U) / total**, computed separately for fitment and`,
    `parametric claims — those are the ones where an error sells the wrong part.`,
    ``,
    `\`⚑\` marks claims where no distinctive token appeared in the source. It over-flags on`,
    `paraphrase and unit conversion, and can miss errors where a number coincidentally`,
    `appears. Read every claim, not only the flagged ones.`,
    ``,
    `---`,
    ``,
  ];

  for (const [i, r] of rows.entries()) {
    md.push(`## ${i + 1}. ${r.catalogTitle}`);
    md.push(``);
    md.push(`- **Catalog title:** ${r.catalogTitle}`);
    md.push(`- **Merchant title:** ${r.storefrontTitle}`);
    md.push(`- **Source:** https://${CONFIG.shopDomain}/products/${r.storefrontHandle}`);
    md.push(`- **Title match confidence:** ${r.matchScore.toFixed(2)} ${r.matchScore < 0.5 ? '⚠ verify this pairing before labelling' : ''}`);
    md.push(`- **Source text length:** ${r.sourceLength} chars`);
    md.push(``);
    md.push(`| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |`);
    md.push(`|---|---|---|---|---|`);
    for (const c of r.claims) {
      const esc = (s: string) => s.replace(/\|/g, '\\|');
      md.push(
        `| ? | ${c.flagged ? '⚑' : ''} | ${esc(c.claim)} | ${esc(c.found.join(', ')) || '—'} | ${esc(c.missing.join(', ')) || '—'} |`,
      );
    }
    md.push(``);
  }

  md.push(`---`);
  md.push(``);
  md.push(`## Tally (fill in after labelling)`);
  md.push(``);
  md.push(`| Code | Count | Share |`);
  md.push(`|---|---|---|`);
  for (const code of ['G', 'D', 'C', 'U', 'X']) md.push(`| ${code} | | |`);
  md.push(``);
  md.push(`**Error rate (C+U)/total:** ____`);
  md.push(``);
  md.push(`**Decision:** if the error rate on fitment and parametric claims is negligible,`);
  md.push(`Shopify's inference is reliable, there is no accuracy finding, and the project`);
  md.push(`stops or re-aims. If it is material, that is the paper.`);

  const mdPath = join(dir, `inference-${stamp}.md`);
  const jsonPath = join(dir, `inference-${stamp}.json`);
  await writeFile(mdPath, md.join('\n'), 'utf8');
  await writeFile(jsonPath, JSON.stringify({ config: CONFIG, rows, stats, transcript }, null, 2), 'utf8');

  console.log(`  Review sheet → ${mdPath}`);
  console.log(`  Transcript   → ${jsonPath}\n`);
}

main().catch((err) => {
  console.error('\nProbe crashed:', err);
  process.exit(1);
});
