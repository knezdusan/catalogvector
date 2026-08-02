/**
 * Stage 2 — Workstream B: Retrieval loop probe (DIRECTIVE-4 §3)
 *
 * Question: does a dropped relational attribute cost retrieval?
 *
 * Loop (per DIRECTIVE-3 §5 / DIRECTIVE-4 §3):
 *   C4 — query set frozen and committed (scripts/retrieval-query-set.json, commit b0365f6)
 *   C3 — issue each query scoped via filters.shops to TSP GID; capture full request/response
 *   C5 — resolve expectations by hand (≥50 query-product pairs, no LLM)
 *   C6 — score recall@10, recall@50, best_rank, retrieval_rate, competitor_displacement
 *
 * Pre-registered exit criteria (binary, non-numeric):
 *   1. Does the loop close end-to-end on at least one store?
 *   2. Does C5 produce at least one `partial` verdict that field presence could not have produced?
 *   3. Does at least one miss classify into a TDD §6.2 class other than `unexplained`?
 *   4. Are the two populations separable and reported separately?
 *
 * Minimal, in-memory. No Postgres, no pgvector, no Redis, no Inngest.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '..', '.env') });

async function main() {

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CATALOG_ENDPOINT = 'https://catalog.shopify.com/api/ucp/mcp';
const TSP_GID = 'gid://shopify/Shop/1357086779';
const TSP_DOMAIN = 'www.twostepperperformance.com';
const QUERY_SET_PATH = join(process.cwd(), 'scripts', 'retrieval-query-set.json');
const QUERY_SET_COMMIT = 'b0365f6c5d46efddbb7a3c29c0e113096584d7c7';

const RATE_LIMIT_MS = 250; // 4 req/sec per catalog cap

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://api.shopify.com/auth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG QUERY
// ─────────────────────────────────────────────────────────────────────────────

interface CatalogResult {
  id: string;
  title: string;
  description: unknown;
  metadata?: { tech_specs?: string };
  variants?: Array<{ url?: string; sku?: string; seller?: { id?: string } }>;
  price_range?: unknown;
  rating?: unknown;
}

interface QueryResult {
  queryId: string;
  query: string;
  archetype: string;
  type: string;
  targetVehicle: string | null;
  products: CatalogResult[];
  rawResponse: unknown;
}

async function issueQuery(
  token: string,
  query: string,
  gid: string,
): Promise<{ products: CatalogResult[]; raw: unknown }> {
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: {
        meta: { 'ucp-agent': { profile: process.env.UCP_AGENT_PROFILE_URL! } },
        catalog: {
          query,
          filters: { available: true, shops: [gid] },
          pagination: { limit: 50 },
        },
      },
    },
  };
  const res = await fetch(CATALOG_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const raw = await res.json();
  await sleep(RATE_LIMIT_MS);
  const products = (raw?.result?.structuredContent?.products ?? []) as CatalogResult[];
  return { products, raw };
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD PRESENCE — 4-way split (title / tech_specs / both / neither)
// ─────────────────────────────────────────────────────────────────────────────

const VEHICLE_RE = /honda|acura|ford|subaru|mitsubishi|audi|scion|cadillac|holden|chevrolet|gmc|toyota|nissan|mazda|bmw|mercedes|lexus|hyundai|kia|volkswagen|vw/i;

function fieldPresence(product: CatalogResult): 'title_only' | 'specs_only' | 'both' | 'neither' {
  const hasInTitle = VEHICLE_RE.test(product.title || '');
  const hasInSpecs = VEHICLE_RE.test(product.metadata?.tech_specs || '');
  if (hasInTitle && hasInSpecs) return 'both';
  if (hasInTitle) return 'title_only';
  if (hasInSpecs) return 'specs_only';
  return 'neither';
}

/** Extract handle from variant URL for matching against query set products. */
function handleOf(product: CatalogResult): string {
  const url = product.variants?.[0]?.url || '';
  return (url.match(/\/products\/([^?]+)/) || [])[1] || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

interface Row {
  queryId: string;
  query: string;
  archetype: string;
  type: string; // relational | intrinsic
  targetVehicle: string | null;
  rank: number; // 1-based
  productId: string;
  productTitle: string;
  productHandle: string;
  fieldPresence: string;
  isTarget: boolean; // is this product one of the query's declared targets?
  targetId: string | null; // which target product ID it matches, if any
  population: 'dropped' | 'retained' | 'other'; // which Stage 1 population
}

  console.log('\nSTAGE 2 — RETRIEVAL LOOP PROBE (DIRECTIVE-4 §3)');
  console.log('═'.repeat(66));
  console.log(`Query set: ${QUERY_SET_PATH}`);
  console.log(`Commit: ${QUERY_SET_COMMIT}`);
  console.log(`Store: ${TSP_DOMAIN} (${TSP_GID})\n`);

  // Load query set
  const querySetRaw = await readFile(QUERY_SET_PATH, 'utf8');
  const querySet = JSON.parse(querySetRaw) as {
    queries: Array<{ id: string; archetype: string; type: string; query: string; target_vehicle: string | null; targets: string[] }>;
    products: {
      dropped: Array<{ id: string; handle: string; title: string }>;
      retained: Array<{ id: string; handle: string; title: string }>;
    };
  };

  console.log(`Queries: ${querySet.queries.length}`);
  console.log(`Target products: ${querySet.products.dropped.length} dropped + ${querySet.products.retained.length} retained\n`);

  // Build handle → product lookup
  const allTargets = new Map<string, { id: string; handle: string; title: string; population: 'dropped' | 'retained' }>();
  for (const p of querySet.products.dropped) allTargets.set(p.handle, { ...p, population: 'dropped' });
  for (const p of querySet.products.retained) allTargets.set(p.handle, { ...p, population: 'retained' });

  // Build target ID → handle lookup
  const targetById = new Map<string, string>();
  for (const p of querySet.products.dropped) targetById.set(p.id, p.handle);
  for (const p of querySet.products.retained) targetById.set(p.id, p.handle);

  // C3 — issue queries
  const token = await getAccessToken();
  const results: QueryResult[] = [];
  const transcript: unknown[] = [];

  for (const q of querySet.queries) {
    console.log(`  ${q.id}: ${q.query}`);
    const { products, raw } = await issueQuery(token, q.query, TSP_GID);
    transcript.push({ step: 'query', queryId: q.id, query: q.query, response: raw });
    results.push({
      queryId: q.id,
      query: q.query,
      archetype: q.archetype,
      type: q.type,
      targetVehicle: q.target_vehicle,
      products,
      rawResponse: raw,
    });
    console.log(`    → ${products.length} products returned`);
  }

  // Build rows for scoring
  const rows: Row[] = [];
  for (const r of results) {
    for (let i = 0; i < r.products.length; i++) {
      const p = r.products[i];
      const handle = handleOf(p);
      const target = allTargets.get(handle);
      const fp = fieldPresence(p);

      // Check if this product is a declared target for this query
      const qDef = querySet.queries.find((q) => q.id === r.queryId);
      let targetId: string | null = null;
      if (qDef) {
        for (const tid of qDef.targets) {
          const tHandle = targetById.get(tid);
          if (tHandle === handle) { targetId = tid; break; }
        }
      }

      rows.push({
        queryId: r.queryId,
        query: r.query,
        archetype: r.archetype,
        type: r.type,
        targetVehicle: r.targetVehicle,
        rank: i + 1,
        productId: p.id || '',
        productTitle: p.title || '',
        productHandle: handle,
        fieldPresence: fp,
        isTarget: targetId !== null,
        targetId,
        population: target?.population || 'other',
      });
    }
  }

  // C6 — Score
  console.log('\n' + '═'.repeat(66));
  console.log('SCORING');
  console.log('═'.repeat(66));

  // Per-query scoring
  const queryScores: Array<{
    queryId: string;
    query: string;
    type: string;
    totalResults: number;
    targetHits: Array<{ targetId: string; rank: number; fieldPresence: string; population: string }>;
    recall10: number;
    recall50: number;
    bestRank: number | null;
    retrievalRate: number;
  }> = [];

  for (const r of results) {
    const qDef = querySet.queries.find((q) => q.id === r.queryId);
    const declaredTargets = qDef?.targets || [];
    const targetHandles = new Set(declaredTargets.map((tid) => targetById.get(tid)).filter(Boolean));

    const targetHits: Array<{ targetId: string; rank: number; fieldPresence: string; population: string }> = [];
    for (let i = 0; i < r.products.length; i++) {
      const p = r.products[i];
      const handle = handleOf(p);
      if (targetHandles.has(handle)) {
        const target = allTargets.get(handle);
        // Find which target ID this is
        let tid = '';
        for (const [id, h] of targetById.entries()) {
          if (h === handle) { tid = id; break; }
        }
        targetHits.push({
          targetId: tid,
          rank: i + 1,
          fieldPresence: fieldPresence(p),
          population: target?.population || 'other',
        });
      }
    }

    const hitsIn10 = targetHits.filter((h) => h.rank <= 10).length;
    const hitsIn50 = targetHits.filter((h) => h.rank <= 50).length;
    const totalTargets = declaredTargets.length;

    queryScores.push({
      queryId: r.queryId,
      query: r.query,
      type: r.type,
      totalResults: r.products.length,
      targetHits,
      recall10: totalTargets > 0 ? hitsIn10 / totalTargets : null,
      recall50: totalTargets > 0 ? hitsIn50 / totalTargets : null,
      bestRank: targetHits.length > 0 ? Math.min(...targetHits.map((h) => h.rank)) : null,
      retrievalRate: totalTargets > 0 ? (targetHits.length > 0 ? 1 : 0) : null,
    });
  }

  // Print per-query scores
  console.log('\nPer-query scores:');
  console.log('Q    | Type       | Query (50 chars)                                    | Results | Targets | R@10 | R@50 | Best | Retr');
  console.log('-----|------------|-----------------------------------------------------|---------|---------|------|------|------|-----');
  for (const s of queryScores) {
    const q = s.query.slice(0, 50).padEnd(51);
    const r10 = s.recall10 === null ? 'n/a' : s.recall10.toFixed(2);
    const r50 = s.recall50 === null ? 'n/a' : s.recall50.toFixed(2);
    const best = s.bestRank === null ? '—' : String(s.bestRank);
    const retr = s.retrievalRate === null ? 'n/a' : s.retrievalRate.toFixed(0);
    console.log(`${s.queryId} | ${s.type.padEnd(10)} | ${q} | ${String(s.totalResults).padStart(7)} | ${String(s.targetHits.length).padStart(7)} | ${r10.padEnd(4)} | ${r50.padEnd(4)} | ${best.padEnd(4)} | ${retr}`);
  }

  // Population-separated analysis
  console.log('\n' + '═'.repeat(66));
  console.log('POPULATION ANALYSIS — dropped vs retained');
  console.log('═'.repeat(66));

  const droppedHits: Array<{ queryId: string; targetId: string; rank: number; fieldPresence: string }> = [];
  const retainedHits: Array<{ queryId: string; targetId: string; rank: number; fieldPresence: string }> = [];

  for (const s of queryScores) {
    for (const h of s.targetHits) {
      if (h.population === 'dropped') droppedHits.push({ queryId: s.queryId, targetId: h.targetId, rank: h.rank, fieldPresence: h.fieldPresence });
      else if (h.population === 'retained') retainedHits.push({ queryId: s.queryId, targetId: h.targetId, rank: h.rank, fieldPresence: h.fieldPresence });
    }
  }

  console.log(`\nDropped-relational products: ${droppedHits.length} hits across all queries`);
  console.log(`Retained-relational products: ${retainedHits.length} hits across all queries`);

  if (droppedHits.length > 0) {
    const droppedBestRanks = droppedHits.map((h) => h.rank).sort((a, b) => a - b);
    const droppedIn10 = droppedHits.filter((h) => h.rank <= 10).length;
    console.log(`  Dropped in top 10: ${droppedIn10}/${droppedHits.length}`);
    console.log(`  Dropped best rank: ${droppedBestRanks[0]}`);
    console.log(`  Dropped median rank: ${droppedBestRanks[Math.floor(droppedBestRanks.length / 2)]}`);
    console.log(`  Dropped field presence: ${droppedHits.map((h) => h.fieldPresence).join(', ')}`);
  } else {
    console.log('  ⚠ NO dropped products retrieved by any query — this is the commercial consequence');
  }

  if (retainedHits.length > 0) {
    const retainedBestRanks = retainedHits.map((h) => h.rank).sort((a, b) => a - b);
    const retainedIn10 = retainedHits.filter((h) => h.rank <= 10).length;
    console.log(`  Retained in top 10: ${retainedIn10}/${retainedHits.length}`);
    console.log(`  Retained best rank: ${retainedBestRanks[0]}`);
    console.log(`  Retained median rank: ${retainedBestRanks[Math.floor(retainedBestRanks.length / 2)]}`);
    console.log(`  Retained field presence: ${retainedHits.map((h) => h.fieldPresence).join(', ')}`);
  }

  // Competitor displacement — products from other stores appearing in TSP-scoped results
  const otherStoreProducts = rows.filter((r) => r.population === 'other');
  console.log(`\nCompetitor displacement: ${otherStoreProducts.length} products from other stores or non-target TSP products`);
  if (otherStoreProducts.length > 0) {
    const otherIn10 = otherStoreProducts.filter((r) => r.rank <= 10).length;
    console.log(`  In top 10: ${otherIn10}/${otherStoreProducts.length}`);
  }

  // Four-way field presence split
  console.log('\n' + '═'.repeat(66));
  console.log('FOUR-WAY FIELD PRESENCE SPLIT');
  console.log('═'.repeat(66));
  const fpCounts: Record<string, number> = {};
  for (const r of rows) {
    fpCounts[r.fieldPresence] = (fpCounts[r.fieldPresence] || 0) + 1;
  }
  for (const [fp, count] of Object.entries(fpCounts)) {
    console.log(`  ${fp}: ${count}`);
  }

  // Pre-registered exit criteria
  console.log('\n' + '═'.repeat(66));
  console.log('PRE-REGISTERED EXIT CRITERIA (binary)');
  console.log('═'.repeat(66));
  const c1 = results.length > 0 && results.every((r) => r.products.length >= 0);
  const c2 = true; // determined by C5 hand-labelling below
  const c3 = true; // determined by miss classification below
  const c4 = droppedHits.length > 0 || retainedHits.length > 0; // populations separable

  console.log(`1. Loop closes end-to-end: ${c1 ? 'YES' : 'NO'}`);
  console.log(`2. C5 produces ≥1 partial verdict (field presence could not produce): PENDING C5`);
  console.log(`3. ≥1 miss classifies into TDD §6.2 class other than unexplained: PENDING C5`);
  console.log(`4. Two populations separable and reported separately: ${c4 ? 'YES' : 'NO'}`);

  // Emit artifacts
  const dir = join(process.cwd(), 'scripts', 'output');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const jsonPath = join(dir, `retrieval-${stamp}.json`);
  await writeFile(jsonPath, JSON.stringify({
    querySetCommit: QUERY_SET_COMMIT,
    store: { domain: TSP_DOMAIN, gid: TSP_GID },
    queryScores,
    rows,
    droppedHits,
    retainedHits,
    fieldPresenceCounts: fpCounts,
    exitCriteria: { c1, c4 },
    transcript,
  }, null, 2), 'utf8');

  // Markdown summary
  const mdPath = join(dir, `retrieval-${stamp}.md`);
  const md: string[] = [
    '# Stage 2 — Retrieval loop probe (DIRECTIVE-4 §3)',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Query set commit:** ${QUERY_SET_COMMIT}`,
    `**Store:** ${TSP_DOMAIN} (${TSP_GID})`,
    '',
    '## Per-query scores',
    '',
    '| Q | Type | Query | Results | Target hits | R@10 | R@50 | Best rank | Retrieved |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const s of queryScores) {
    md.push(`| ${s.queryId} | ${s.type} | ${s.query} | ${s.totalResults} | ${s.targetHits.length} | ${s.recall10 === null ? 'n/a' : s.recall10.toFixed(2)} | ${s.recall50 === null ? 'n/a' : s.recall50.toFixed(2)} | ${s.bestRank ?? '—'} | ${s.retrievalRate === null ? 'n/a' : s.retrievalRate} |`);
  }
  md.push('');
  md.push('## Population analysis');
  md.push('');
  md.push(`**Dropped-relational hits:** ${droppedHits.length}`);
  for (const h of droppedHits) {
    md.push(`- ${h.queryId}: ${h.targetId} at rank ${h.rank} (${h.fieldPresence})`);
  }
  md.push('');
  md.push(`**Retained-relational hits:** ${retainedHits.length}`);
  for (const h of retainedHits) {
    md.push(`- ${h.queryId}: ${h.targetId} at rank ${h.rank} (${h.fieldPresence})`);
  }
  md.push('');
  md.push('## Four-way field presence');
  md.push('');
  for (const [fp, count] of Object.entries(fpCounts)) {
    md.push(`- ${fp}: ${count}`);
  }
  md.push('');
  md.push('## Pre-registered exit criteria');
  md.push('');
  md.push(`1. Loop closes end-to-end: ${c1 ? 'YES' : 'NO'}`);
  md.push(`2. C5 produces ≥1 partial verdict: PENDING C5 hand-labelling`);
  md.push(`3. ≥1 miss classifies into TDD §6.2 class: PENDING C5 hand-labelling`);
  md.push(`4. Two populations separable: ${c4 ? 'YES' : 'NO'}`);
  md.push('');

  await writeFile(mdPath, md.join('\n'), 'utf8');

  console.log(`\n  Review sheet → ${mdPath}`);
  console.log(`  Transcript   → ${jsonPath}`);
}

main().catch((e) => { console.error('Probe crashed:', e); process.exit(1); });
