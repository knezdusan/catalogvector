# CatalogVector — Technical Design Document

| | |
|---|---|
| **Document** | TDD (governing, technical) |
| **Companion** | `BLUEPRINT.md` (governing, non-technical) |
| **Version** | 0.3.1 |
| **Date** | 1 August 2026 |
| **Status** | Design + scaffold + I-3, I-4 resolved. Project scaffolded (Next.js 16.3, folder structure, agent tooling, CI, MIT licence). UCP agent profile + auth helper wired. Shopify AI Toolkit adapted for Devin. No pipeline code written. Phase 0 not started. |

---

## 1. Scope

**In scope (Phase 1):** a measurement instrument that, for N public Shopify stores in one technical vertical, determines whether the Global Catalog retrieves the store's products for realistic buyer queries — and publishes the result.

**Out of scope:** everything in `BLUEPRINT.md` §4. In particular: no OAuth, no embedded app, no billing, no multi-tenancy, no write path to any merchant's store. Phase 1 is **read-only against public surfaces**.

**Design rule.** Phase 3 does not influence Phase 1. If a decision is only justified by "we'll need it when this becomes a product," it is out.

---

## 2. Verified platform facts

Everything here was confirmed against primary sources on the date shown. **Re-verify anything older than ~30 days before relying on it** — one full strategy cycle has already been lost to stale facts.

### 2.1 App framework *(27 Jul 2026)*
Remix and React Router merged at v7. The current official template is **React Router**, package `@shopify/shopify-app-react-router`, scaffolded with:

```bash
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
```

The Remix template is maintained for critical security issues only. The React Router template uses **Polaris Web Components**, not Polaris React.

*Relevance to Phase 1: none — Phase 1 builds no Shopify app.* Recorded because Phase 2 will, and because it is a common source of outdated AI-generated code.

### 2.2 Agent tooling *(28 Jul 2026; updated 1 Aug 2026)*

**Shopify agent tooling** — adapted for Devin Desktop (Shopify's plugin path supports Claude Code, Codex, Cursor, VS Code, Hermes — not Devin. The three underlying components are tool-agnostic and all work with Devin's extensibility model):

1. **Dev MCP server** (`@shopify/dev-mcp@latest`, stdio) — Shopify developer docs + GraphQL schema validation. No auth, no dev app. Configured in `.devin/config.json` and `.mcp.json` as a stdio MCP server (same pattern as `next-devtools-mcp`). Tools: `learn_shopify_api`, `search_docs_chunks`, `validate_graphql_codeblocks`, `validate_component_codeblocks`, `validate_theme`. Verified operational 1 Aug 2026.

2. **Shopify AI Toolkit skills** (via `npx skills add Shopify/shopify-ai-toolkit --skill <name>`) — installed to `.agents/skills/`, symlinked for Devin for Terminal. Four skills selected for Phase 1 relevance (out of 21 total):
   - `ucp` — UCP/Global Catalog operations, natural language → UCP CLI command mapping
   - `shopify-dev` — general Shopify development guidance
   - `shopify-storefront-graphql` — Storefront API (relevant for storefront JSON understanding, C2)
   - `shopify-use-shopify-cli` — Shopify CLI usage

   Skills not installed (not relevant to Phase 1 read-only catalog analysis): `shopify-admin`, `shopify-app-store-review`, `shopify-custom-data`, `shopify-customer`, `shopify-functions`, `shopify-hydrogen`, `shopify-liquid`, `shopify-onboarding-dev`, `shopify-onboarding-merchant`, `shopify-partner`, `shopify-payments-apps`, `shopify-polaris-*` (4 skills), `shopify-pos-ui`, `shopify-shopifyql`. Add as needed if scope expands.

3. **UCP CLI** (`@shopify/ucp-cli` v0.6.3, global npm install) — terminal access to Global Catalog search/lookup/get_product. Local profile initialized as `catalogvector` (`~/.ucp/profiles/catalogvector`). Auth via `SHOPIFY_CLIENT_ID`/`SHOPIFY_CLIENT_SECRET` env vars. Verified: `ucp catalog search --set '/query=SOT-223 voltage regulator'` returns 10 of 354 results with seller domains, variant GIDs, and buy-now URLs.

**Next.js 16.3 first-party agent tooling** *(31 Jul 2026)* — scaffolded into the project:
- **Bundled docs via `AGENTS.md`** — `next dev` auto-manages a block pointing agents at `node_modules/next/dist/docs/` (version-matched). Project rules added on top: stack, commands, `@/*` alias, Cache Components decision tree, governing-docs-first rule.
- **`next-devtools-mcp`** — MCP server at `/_next/mcp` exposes the running dev server's routes, server logs, and compilation issues (`get_errors`, `get_compilation_issues`, `compile_route`). Configured in `.devin/config.json` and `.mcp.json`.
- **`agent-browser` 0.27** — CLI exposing DOM, console, network, Web Vitals, and React DevTools introspection (`react tree`, `react inspect`, `react suspense --only-dynamic`). Installed globally.
- **`next-dev-loop` skill** — drives the edit-verify loop (browser + MCP). Installed to `.agents/skills/next-dev-loop`, symlinked for Devin for Terminal.
- **`.devin/` project config** — `config.json` (permissions, MCP servers, `read_config_from` for Cursor/Windsurf/Claude) + `config.local.json` (gitignored personal overrides).
- **Devin Desktop** — the hosting AI coding agent; `.devin/` is its project-level extensibility directory.

### 2.3 Public storefront JSON *(28 Jul 2026)*
- `GET https://<domain>/products.json?limit=250&page=N` — no key, no login. 250 items/page.
- Product pages embed JSON-LD.
- **A meaningful minority of stores disable it.** Fallback: parse `/collections/all` HTML and product-page JSON-LD.
- **Blind spot: metafields are NOT exposed in this JSON.** Structured specs a merchant *has* stored properly are invisible here. This is a methodology limitation and must be stated in PUB-2, not hidden.
- Rate limiting exists; observed 429/430 responses under load.

### 2.4 Global Catalog MCP *(28 Jul 2026; auth model corrected 31 Jul 2026)* — the primary measurement surface
- Endpoint: `POST https://catalog.shopify.com/api/ucp/mcp`, JSON-RPC 2.0.
- **Two separate concerns, previously conflated:**
  - **Capability negotiation (profile):** a UCP agent profile JSON hosted at a public HTTPS URL, referenced as `meta.ucp-agent.profile` on every request. Shopify fetches it to negotiate which UCP capabilities your agent supports. No registration or approval — just host the file and include the URL. Our profile is at `public/ucp-agent-profile.json` in the repo, declaring `dev.ucp.shopping.catalog.search`, `dev.ucp.shopping.catalog.lookup`, and `dev.shopify.catalog.global` only (Phase 1 is read-only).
  - **Authentication (rate-limit tier):** three tiers — Token (API key → bearer token, highest limits), Signed (HTTP Message Signatures, no API key), Anonymous (no auth, lowest limits). All three get Catalog access. **We use the Token tier**: API key from Dev Dashboard → Catalogs → Get an API key (instant, no approval — Spring '26 removed the approval requirement). Exchange `client_id` / `client_secret` for a bearer token at `https://api.shopify.com/auth/access_token` (scope: `read_global_api_catalog_search`, expires after 60 min, fetch at runtime). Include as `Authorization: Bearer <token>` header.
- No merchant OAuth. No merchant permission required.
- **Profile hosting gotcha (verified 1 Aug 2026):** Shopify's profile validator requires `Content-Type: application/json`. GitHub raw serves files as `text/plain` with `X-Content-Type-Options: nosniff`, which Shopify rejects with `profile_malformed: Invalid content type`. Use jsDelivr CDN (`https://cdn.jsdelivr.net/gh/...`) which serves the correct content type, or host on your own domain. This is documented in `.env.example`.
- Tools: `search_catalog`, `lookup_catalog`, `get_product`.
- `catalog.query` — free text. `catalog.context.intent` — free-text buyer intent.
- **`catalog.filters.shops`** — array of shop GIDs, **up to 1000 per request**. This is what makes store-scoped measurement possible.
- **`catalog.filters.attributes` supports only `Color`, `Size`, `Target gender`.** Unsupported names are silently ignored and returned in `messages`. **This is the single most important fact in the document** — it is why a technical vertical is the wedge.
- Pagination: `limit` default 10, **max 50**; depth capped at **1000 results** (`has_next_page` false beyond, regardless of matches). `total_count` is an **estimate** — never use it for exact arithmetic.
- Results cluster by Universal Product ID (UPID) with offers from multiple merchants.
- `get_product` returns option values with `available` / `exists` flags → variant modelling quality is directly measurable.
- `categories` returned in both `google_product_category` and `merchant` taxonomies → taxonomy divergence is directly measurable.

### 2.5 Shopify's own catalogue enrichment *(28 Jul 2026)*
Shopify Engineering describes a multimodal-LLM pipeline that infers product metadata, **merges complementary attributes across listings of the same product** (including technical specs), normalizes variants, aggregates content, and produces a canonical record used by downstream systems.

**Two consequences that shape the whole design:**
1. Where a spec appears structured in *any* merchant's listing, Shopify already propagates it. Measuring or remediating there is worthless.
2. The gap survives only where a spec exists nowhere structured **and** the taxonomy has no attribute slot. That intersection is the entire addressable surface — and §2.4's three-attribute filter vocabulary defines its boundary.

### 2.6 Catalog freshness *(28 Jul 2026)*
Published products are auto-enrolled with manual opt-out. Rate limiting and caching apply. **Only inventory and price are real-time; other fields refresh on a delay.**

**Consequence:** no synchronous write→re-query loop. Any before/after demonstration must be a **pre-built A/B pair of dev stores**, seeded days in advance. Attempting it live fails in front of the buyer.

### 2.7 Facts requiring runtime confirmation (not yet verified)
| # | Unknown | Blocks | How to resolve |
|---|---|---|---|
| U-1 | ~~Does agent-profile registration involve human review? What is the lead time?~~ **RESOLVED 31 Jul 2026:** No human review. Spring '26 Edition removed the approval requirement. API key is generated instantly in Dev Dashboard → Catalogs → Get an API key. Agent profile is just a JSON file you host — no registration step. **Zero lead time.** | ~~I-4, C3~~ | Done — see §2.4 |
| U-2 | Actual requests/minute by trust tier | N, runtime, cost | **PARTIALLY RESOLVED 1 Aug 2026:** Token tier rate limit observed in JWT payload: `limits: {catalog: {max: 5, period: 1}}` — 5 requests/second. Scope: `read_global_api_catalog_search write_global_api_app_events`. Sufficient for Phase 1 with C7's ≤1 req/sec/domain storefront cap (the Global Catalog cap is separate). Full picture emerges at scale. |
| U-3 | Can a shop GID be resolved from a public domain without OAuth? | C1 → C3 handoff | Probe `lookup_catalog` with a product URL; the response `seller.id` may be the resolution path |
| U-4 | Is `filters.shops` semantics a hard restriction or a soft bias? | C6 scoring validity | Control experiment: query for a product known present in a scoped shop |
| U-5 | Do Catalog results reflect merchant metafields at all? | C5/C6 interpretation, all Phase 2 value claims | Seed a dev store with structured metafields, wait out §2.6 delay, compare |

**U-4 and U-5 are the two that can invalidate the methodology.** They are scheduled in Week 1, not Week 3.

---

## 3. Architecture

```
                    ┌──────────────────────────────────────┐
                    │  Inngest (self-hosted) — orchestration│
                    └───────────────┬──────────────────────┘
                                    │ durable steps, retries, fan-out
   ┌────────────────────────────────┼────────────────────────────────┐
   │                                │                                │
┌──▼───┐  ┌──────┐   ┌──────┐   ┌───▼──┐   ┌──────┐   ┌──────┐  ┌────▼───┐
│  C1  │─▶│  C2  │──▶│  C4  │──▶│  C3  │──▶│  C5  │──▶│  C6  │─▶│   C9   │
│frontr│  │ingest│   │query │   │global│   │expect│   │score │  │publish │
└──────┘  └──┬───┘   │synth │   │catalg│   │match │   └──────┘  └────────┘
             │       └──────┘   └───┬──┘   └──┬───┘
             │                      │         │
             ▼                      ▼         ▼
       ┌───────────────────────────────────────────┐
       │  Postgres + pgvector   │   Redis (C7)      │
       │  products, embeddings  │   global rate cap │
       └───────────────────────────────────────────┘
```

**Dataflow.** C1 qualifies stores → C2 ingests each store's public catalogue → C4 synthesises realistic buyer queries from that catalogue → C3 issues those queries to the Global Catalog scoped to the store → C5 decides which of the store's own products *should* have matched → C6 compares C5's expectation to C3's result and scores → C9 aggregates and publishes.

**C5 is the load-bearing component.** C6 is arithmetic. C3 is an HTTP client. If C5 collapses into field-presence checks, the project has collapsed (`BLUEPRINT.md` §5 acid test).

---

## 4. Data model

Drizzle, Postgres, `pgvector`. Sketch — column sets will move; the shape will not.

```ts
// db/schema.ts
import { pgTable, uuid, text, integer, real, jsonb, timestamp, vector, index, unique } from 'drizzle-orm/pg-core';

export const stores = pgTable('stores', {
  id:          uuid('id').primaryKey().defaultRandom(),
  domain:      text('domain').notNull().unique(),
  shopGid:     text('shop_gid'),                    // U-3: may be null until resolved
  vertical:    text('vertical').notNull(),
  productsJsonAvailable: text('products_json_available').notNull(), // 'yes'|'disabled'|'unknown'
  catalogEnrolled: text('catalog_enrolled'),        // observed, not assumed
  productCount: integer('product_count'),
  ingestedAt:  timestamp('ingested_at', { withTimezone: true }),
});

export const products = pgTable('products', {
  id:          uuid('id').primaryKey().defaultRandom(),
  storeId:     uuid('store_id').notNull().references(() => stores.id),
  handle:      text('handle').notNull(),
  title:       text('title').notNull(),
  bodyHtml:    text('body_html'),
  vendor:      text('vendor'),
  productType: text('product_type'),
  tags:        jsonb('tags').$type<string[]>(),
  variants:    jsonb('variants').$type<RawVariant[]>(),
  jsonLd:      jsonb('json_ld'),
  rawHash:     text('raw_hash').notNull(),          // change detection, avoids re-embedding
}, (t) => ({ uq: unique().on(t.storeId, t.handle) }));

// Specs extracted from unstructured text. Vertical vocabulary: PENDING — PHASE 0.
export const productSpecs = pgTable('product_specs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  productId:   uuid('product_id').notNull().references(() => products.id),
  key:         text('key').notNull(),        // normalized, e.g. 'package'
  rawKey:      text('raw_key'),              // as found, e.g. 'Pkg.'
  value:       text('value').notNull(),      // normalized, e.g. 'SOT-223'
  rawValue:    text('raw_value'),
  unit:        text('unit'),
  source:      text('source').notNull(),     // 'title'|'body_html'|'json_ld'|'variant_option'|'table'
  confidence:  real('confidence').notNull(),
  model:       text('model').notNull(),      // provenance — required for reproducibility
});

export const productEmbeddings = pgTable('product_embeddings', {
  productId:   uuid('product_id').primaryKey().references(() => products.id),
  embedding:   vector('embedding', { dimensions: 1536 }).notNull(),
  builtFrom:   text('built_from').notNull(), // which text composition produced it
}, (t) => ({ idx: index('emb_hnsw').using('hnsw', t.embedding.op('vector_cosine_ops')) }));

export const queries = pgTable('queries', {
  id:          uuid('id').primaryKey().defaultRandom(),
  storeId:     uuid('store_id').notNull().references(() => stores.id),
  text:        text('text').notNull(),
  intent:      text('intent'),               // → catalog.context.intent
  derivedFrom: uuid('derived_from').references(() => products.id),
  archetype:   text('archetype').notNull(),  // PENDING — PHASE 0
  model:       text('model').notNull(),
});

export const catalogRuns = pgTable('catalog_runs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  queryId:     uuid('query_id').notNull().references(() => queries.id),
  requestBody: jsonb('request_body').notNull(),   // full request, for reproducibility
  results:     jsonb('results').notNull(),        // full response, unmodified
  messages:    jsonb('messages'),                 // ignored-filter warnings etc.
  latencyMs:   integer('latency_ms'),
  ranAt:       timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
});

export const expectations = pgTable('expectations', {
  id:          uuid('id').primaryKey().defaultRandom(),
  queryId:     uuid('query_id').notNull().references(() => queries.id),
  productId:   uuid('product_id').notNull().references(() => products.id),
  verdict:     text('verdict').notNull(),    // 'should_match'|'partial'|'should_not_match'
  rationale:   text('rationale').notNull(),  // human-auditable — required for publication
  method:      text('method').notNull(),     // 'vector'|'arbitration'|'human'
  confidence:  real('confidence').notNull(),
});

export const scores = pgTable('scores', {
  id:          uuid('id').primaryKey().defaultRandom(),
  queryId:     uuid('query_id').notNull().references(() => queries.id),
  recallAt10:  real('recall_at_10'),
  bestRank:    integer('best_rank'),         // null = not retrieved at any depth
  missClass:   text('miss_class'),           // see §6.2
});
```

**Reproducibility is a schema requirement, not a nicety.** `requestBody`, `results`, `model` and `rationale` are stored because the publication's defensibility rests on a third party being able to re-run and disagree.

---

## 5. Component specifications

Each component states: purpose, interface, notes, **testable boundary**, and status.

### C1 — Store frontier
**Purpose.** Produce N qualified stores in the chosen vertical.
**Interface.** `discoverStores(vertical): Promise<StoreCandidate[]>`
**Notes.** Candidate sources: Global Catalog `search_catalog` with vertical queries, harvesting distinct `seller.domain` values (self-bootstrapping — the measurement surface is also the sampling frame); public Shopify-detection directories; vertical trade directories cross-checked for Shopify. Qualification: reachable, `/products.json` open or fallback-parseable, product count above a floor, genuinely in-vertical (LLM classification, sampled and hand-checked).
**Sampling bias must be documented.** A frontier seeded from the Global Catalog systematically excludes stores that are absent from it — which is itself a finding, not a defect, but only if stated.
**Testable boundary.** Pure function over fixture responses; qualification rules unit-tested against hand-labelled examples.
**Status.** `PENDING`

### C2 — Storefront ingestion adapter
**Purpose.** Normalize one store's public catalogue into `products`.
**Interface.** `ingestStore(domain): Promise<IngestResult>`
**Notes.** Primary `/products.json` paginated at 250. Fallback for disabled endpoints: `/collections/all` + per-product JSON-LD. Zod-validate every payload before persistence — third-party data is hostile. `rawHash` gates re-embedding. Every response passes through C7. Honour `robots.txt`; identify with a real user agent and contact URL.

```ts
const RawVariant = z.object({
  id: z.number(), title: z.string(), sku: z.string().nullable(),
  price: z.string(), available: z.boolean().optional(),
  option1: z.string().nullable(), option2: z.string().nullable(), option3: z.string().nullable(),
});
const ProductsJsonResponse = z.object({
  products: z.array(z.object({
    id: z.number(), handle: z.string(), title: z.string(),
    body_html: z.string().nullable(), vendor: z.string().nullable(),
    product_type: z.string().nullable(), tags: z.array(z.string()),
    variants: z.array(RawVariant),
  })),
});
```
**Testable boundary.** Adapter is pure over recorded fixtures. Fixture set must include: normal store, disabled endpoint, HTML spec table, PDF-linked specs, single-variant-per-product anti-pattern, non-English store.
**Status.** `PENDING`

### C3 — Global Catalog MCP client
**Purpose.** Issue UCP catalog calls and persist raw responses.
**Interface.** `searchCatalog(params): Promise<CatalogSearchResult>`

```ts
export async function searchCatalog(input: {
  query: string; intent?: string; shopGids?: string[];
  cursor?: string; limit?: number; // ≤ 50
}) {
  const body = {
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: {
      name: 'search_catalog',
      arguments: {
        meta: { 'ucp-agent': { profile: env.UCP_AGENT_PROFILE_URL } },
        catalog: {
          query: input.query,
          ...(input.intent && { context: { address_country: 'US', intent: input.intent } }),
          filters: {
            available: true,
            ...(input.shopGids?.length && { shops: input.shopGids }), // ≤ 1000
          },
          pagination: { limit: Math.min(input.limit ?? 50, 50), ...(input.cursor && { cursor: input.cursor }) },
        },
      },
    },
  };
  await rateLimiter.acquire('shopify:catalog');           // C7
  const res = await fetch('https://catalog.shopify.com/api/ucp/mcp', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = CatalogSearchResponse.parse(await res.json()); // Zod
  // messages[] carries silently-ignored filters — never discard, it is evidence
  return json.result.structuredContent;
}
```
**Notes.** Persist `requestBody` and `results` verbatim to `catalog_runs`. Never trust `total_count`. Paginate to the 1000-result cap only where the scoring design requires depth.
**Testable boundary.** Contract tests against recorded responses; one live smoke test in CI, skipped without credentials.
**Status.** `PENDING` — I-4 resolved (auth + profile wired, request shape implemented, verified via smoke test).

### C4 — Buyer query synthesis
**Purpose.** Generate queries a real buyer in this vertical would type.
**Interface.** `synthesiseQueries(store, products): Promise<Query[]>`
**Notes.** Queries derive from the store's *actual* inventory, so a failure to retrieve is unambiguous — the product exists and is in scope. Each query is tagged with an archetype so results can be sliced by query difficulty.

> **`PENDING — PHASE 0`:** the archetype taxonomy and vocabulary. For electronic components the archetypes would be parametric ("3.3V LDO 500mA SOT-223"), part-number, and cross-reference; for auto parts, fitment ("brake pads 2018 Tacoma"), OEM-number, and dimension. **These are illustrations, not the design.** Phase 0 supplies the real set.

**Contract fixed now regardless of vertical:** ≥3 archetypes; each query traceable to ≥1 source product; queries generated once and frozen before any C3 call, so the query set cannot be tuned to flatter the result. **Freezing the query set before measurement is the difference between a paper and marketing.**
**Testable boundary.** Given fixed products + fixed seed, output is deterministic and schema-valid. Archetype coverage asserted.
**Status.** `PENDING`

### C5 — Expected-match resolver ⭐
**Purpose.** For a query, decide which of the store's own products genuinely satisfy it. This is ground truth, and it is the reason this project is not a checklist.
**Interface.** `resolveExpectations(query, storeProducts): Promise<Expectation[]>`
**Three stages, mirroring the VectorMatch funnel:**

1. **Cheap prefilter** — spec-key overlap and lexical signals narrow the candidate set. Reduces LLM spend by an order of magnitude.
2. **Vector retrieval** — pgvector HNSW cosine over a composed text representation, top-k candidates.
3. **Arbitration** — an LLM adjudicates only the ambiguous band, with a *rationale string that is persisted and published*.

```sql
SELECT p.id, p.title, 1 - (e.embedding <=> $1) AS similarity
FROM product_embeddings e
JOIN products p ON p.id = e.product_id
WHERE p.store_id = $2
ORDER BY e.embedding <=> $1
LIMIT 40;
```

**Why this cannot reduce to a field loop.** The query says `SOT-223`; the title says `MIC5219-3.3YM5`; the package appears only in a `<table>` in `body_html`; a competing SKU is `SOT-23-5` — visually adjacent, functionally wrong. Deciding *should_match* requires extraction, normalization to a domain vocabulary, semantic candidate retrieval, and adjudication of near-misses. Field presence answers none of it.

**Calibration is mandatory.** A stratified sample (target ≥200 pairs) is hand-labelled by the author and inter-rater agreement against the automated verdict is **published as a headline number**. If agreement is poor, the score is not publishable — that is the honest failure mode and it must be discoverable in Week 2, not Week 3.
**Testable boundary.** Golden set of hand-labelled pairs; regression-tested precision/recall. Arbitration prompt versioned; snapshot-tested for schema, not for prose.
**Status.** `PENDING` — and it is the acid test.

### C6 — Retrieval scoring
**Purpose.** Compare expectation to observation.
**Interface.** `score(expectations, catalogRun): Score`
**Notes.** Pure function. No I/O, no LLM. Metrics in §6.
**Testable boundary.** Trivially unit-testable; this is where property tests earn their place (e.g. an empty result set always scores zero recall and null rank).
**Status.** `PENDING`

### C7 — Distributed rate limiter
**Purpose.** Hard global cap across parallel Inngest workers, per external surface.
**Interface.** `rateLimiter.acquire(bucket): Promise<void>`
**Notes.** Redis token bucket, existing VectorMatch pattern. Separate buckets for `shopify:catalog` and per-storefront-domain. Storefront default: conservative, ≤1 req/sec/domain, exponential backoff on 429/430. **This is published as part of the methodology** — a documented crawl policy converts a risk into a credibility asset.
**Testable boundary.** Concurrency test — M workers, N tokens, assert the global cap is never exceeded.
**Status.** `PENDING`

### C8 — Orchestration
**Purpose.** Durable, resumable, fan-out workflows.
**Notes.** One Inngest function per store, fanned out from a run trigger; steps are individually retryable so a single store failure never loses a run. Idempotency keyed on `(runId, storeId, stage)`.

```ts
export const scanStore = inngest.createFunction(
  { id: 'scan-store', concurrency: { limit: 4 }, retries: 3 },
  { event: 'scan/store.requested' },
  async ({ event, step }) => {
    const ingest  = await step.run('ingest',   () => ingestStore(event.data.domain));
    await          step.run('embed',           () => embedProducts(ingest.storeId));
    const queries = await step.run('queries',  () => synthesiseQueries(ingest.storeId));
    const runs    = await step.run('catalog',  () => runCatalogQueries(queries));
    const expect  = await step.run('expect',   () => resolveExpectations(queries));
    return step.run('score', () => scoreAll(expect, runs));
  },
);
```
**Status.** `PENDING`

### C9 — Publication pipeline
**Purpose.** Turn the database into the four published artifacts.
**Notes.** Aggregate statistics by store (anonymised), by query archetype, by miss class. **Named per-store results are not published** — they are generated on request, which is the lead-capture mechanism. Export as CSV + JSON alongside the repo. Include the frozen query set and the arbitration prompt version so the work is re-runnable by a third party.
**Testable boundary.** Snapshot tests on export shape; assertion that no store name appears in the public export.
**Status.** `PENDING`

---

## 6. Measurement methodology

### 6.1 Metrics
| Metric | Definition | Why |
|---|---|---|
| `recall@10` | Fraction of `should_match` products present in the first 10 results | 10 approximates what an assistant surfaces |
| `recall@50` | Same at the page maximum | Separates "invisible" from "buried" |
| `best_rank` | Best position of any `should_match` product; null if absent | Ordinal, robust |
| `retrieval_rate` | Queries with ≥1 `should_match` retrieved, over all queries | The headline number |
| `competitor_displacement` | Whether other merchants' products fill the slots | Converts a technical finding into a commercial one |

### 6.2 Miss classification
When an expected product is not retrieved, classify why — **this is the part with commercial value**, because it is the fix list:

`spec_unstructured` · `taxonomy_mismatch` · `variant_fragmentation` · `title_uninformative` · `identifier_missing` · `not_enrolled` · `unexplained`

`unexplained` is reported honestly and not minimised. A methodology with no residual is a methodology that is hiding something.

### 6.3 Stated limitations (must appear in PUB-2)
1. Metafields are invisible to public storefront JSON, so merchant-side structured data may be understated (§2.3).
2. The frontier is seeded partly from the Global Catalog itself, biasing toward enrolled stores (C1).
3. Retrieval reflects Shopify's ranking at a point in time; catalogue fields refresh on a delay (§2.6).
4. Expectations are LLM-derived with human calibration; the agreement rate is published (C5).
5. Results are US-context (`address_country: 'US'`) unless stated otherwise.

---

## 7. Cost model

OpenRouter, cost as a first-class constraint. Per store: extraction dominates, arbitration is bounded by the prefilter, embeddings are one-off per `rawHash`. Cheap model for extraction and query synthesis; a stronger model only in the arbitration band; escalation logged so the cost/accuracy tradeoff is publishable. Hard per-run budget ceiling enforced in code, not by attention.

> Deliberately not stating dollar figures: model pricing moves faster than this document. Instrument spend per stage and record actuals in the change log.

---

## 8. Test strategy

Test-first per boundary. Order below is also the implementation order.

| Boundary | Type | Gate |
|---|---|---|
| C2 adapter | Unit over fixtures | All fixture types parse or fail explicitly |
| C7 limiter | Concurrency | Global cap never exceeded under M workers |
| C3 client | Contract over recorded responses | Zod-valid; `messages` retained |
| C6 scoring | Unit + property | Pure, deterministic |
| C4 synthesis | Deterministic under seed | Archetype coverage met |
| C5 resolver | Golden set, precision/recall | **Human agreement published** |
| C8 workflows | Integration, mocked externals | Idempotent, resumable |
| C9 export | Snapshot | No store names in public export |

No Playwright in Phase 1 — there is no UI. It re-enters if a public results page is built.

**Scaffold staged *(31 Jul 2026)*:** Vitest is installed and configured (`vitest.config.ts`, `@/*` alias, node environment, coverage over `src/lib/scanner` + `src/db`). Playwright is installed and configured (`playwright.config.ts`, `tests/e2e/`) with the `@next/playwright` `instant()` helper available for asserting Instant Navigation regressions on Cache Components routes — staged behind `test.skip` until the public results page exists. A smoke env-schema test is green.

---

## 9. Milestone sequence — three weeks

**Week 0 (immediate, before Phase 0 completes)** — I-4 agent profile registered (U-1 lead time), I-3 toolkit installed, I-1/I-2 Partner account and dev store, repo initialised open-source.

**Week 1 — de-risk before building.** Resolve **U-4 and U-5 first**; both can invalidate the methodology and both are cheap to test. Then C7, C2, C3 with tests. Exit: one store ingested end-to-end and one live Global Catalog query returning parsed results.

**Week 2 — the hard part.** C4, C5, C6. Calibration sample hand-labelled mid-week. **Exit gate: if human/automated agreement on the golden set is poor, or if C5 has collapsed into field presence, stop and report.** This is the acid test and it fires here, not at publication.

**Week 3 — scale and publish.** C1 to full N, C8 fan-out, full run, C9 export, write PUB-1..4. Scope of N is the flexible variable; publication quality is not.

**Definition of publishable v1:** dataset export with stated limitations; methodology including frozen query set, prompt versions and calibration agreement; public repo that a third party can clone and re-run against their own agent profile; written analysis addressed to practitioners in the vertical.

---

## 10. Blocking open questions

| # | Question | Owner | Resolve by |
|---|---|---|---|
| Q-1 | Which vertical? | Phase 0 | Before Week 1 |
| Q-2 | U-1 agent profile lead time | Runtime | Week 0 |
| Q-3 | U-3 shop GID resolution from domain | Runtime | Week 1 |
| Q-4 | U-4 `filters.shops` semantics | Runtime | **Week 1, first** |
| Q-5 | U-5 do metafields affect Catalog results? | Dev store experiment | **Week 1, first** |
| Q-6 | N — feasible store count under trust-tier limits | Follows Q-2/U-2 | Week 2 |
| Q-7 | Public name | Phase 0 | Before publication |

---

## 11. Launch Day checklist

Actions that must happen on or before the day the report goes public. Each is a footgun if forgotten — the site ships broken or invisible.

- [ ] **Remove `robots: noindex` from `src/app/layout.tsx`.** The metadata currently sets `robots: { index: false, follow: false }` so the placeholder site is not crawled. **If this is not flipped before launch, Google will never index the report and no one will find it.** Set to `{ index: true, follow: true }` (or remove the `robots` key entirely) when PUB-1..4 are published.
- [ ] Confirm the public route group `(public)/` serves the real report pages, not placeholders.
- [ ] Verify the dataset export contains no store names (C9 invariant, TDD §5 C9).
- [ ] Confirm the frozen query set and arbitration prompt version are committed and referenced in PUB-2.
- [ ] Run `npm run verify` green on `main`.

---

## 12. Change log

| Date | Version | Change |
|---|---|---|
| 2026-07-28 | 0.1.0 | Initial design. Architecture fixed; vertical-dependent vocabulary (C4 archetypes, C5 spec taxonomy) deferred to Phase 0 as explicit contracts rather than invented content. |
| 2026-07-31 | 0.2.0 | **Naming:** `ShopifyAiScanner` → `CatalogVector` (repo `github.com/knezdusan/catalogvector`). **Scaffold:** Next.js 16.3 preview (`cacheComponents: true`, `reactCompiler: true`, `agentRules: true`), React 19.2, TypeScript strict + `verbatimModuleSyntax` + `noUncheckedIndexedAccess` (target ES2022), Biome 2 (replaces ESLint/Prettier), Tailwind v4. Folder structure replicated from §3: `src/app/{(public),admin,api/inngest}`, `src/db/{schema,index}`, `src/inngest/{client,functions}`, `src/lib/scanner/c1–c7` stubs with TDD interface signatures, `scripts/` probes (excluded from tsconfig). **§2.2 agent tooling:** added Next.js 16.3 first-party stack (`next-devtools-mcp`, `agent-browser` 0.27, `next-dev-loop` skill, `.devin/` config, `AGENTS.md`). **§8 tests:** Vitest + Playwright (`@next/playwright` `instant()` helper) staged. **Foundation:** Zod env validation (`src/lib/env.ts`, `.env.example`), `next.config.ts` hardened (CSP, HSTS, `poweredByHeader: false`, `reactStrictMode: true`), GitHub Actions CI. All C1–C9 remain `PENDING`/`BLOCKED` — stubs only, no implementation. |
| 2026-07-31 | 0.2.1 | **Licence:** MIT `LICENSE` added at repo root (copyright Dušan Knežević, 2026) — repo is now genuinely open source. **§11 Launch Day checklist:** added, led by the `robots: noindex` removal reminder (`src/app/layout.tsx` currently sets `robots: { index: false, follow: false }` for the placeholder; must flip to `index: true` before publication or the report is invisible to search). |
| 2026-08-01 | 0.3.0 | **I-4 RESOLVED — U-1 closed, lead-time risk eliminated.** §2.4 auth model corrected: the original design conflated capability negotiation (agent profile) with authentication (rate-limit tier). Spring '26 removed the approval requirement — API key is generated instantly in Dev Dashboard → Catalogs. Two separate concerns now documented: (1) agent profile = JSON at `public/ucp-agent-profile.json` (catalog-only: `dev.ucp.shopping.catalog.search` + `dev.ucp.shopping.catalog.lookup` + `dev.shopify.catalog.global`), included as `meta.ucp-agent.profile`; (2) auth = Token tier, `SHOPIFY_CLIENT_ID`/`SHOPIFY_CLIENT_SECRET` → bearer token at `https://api.shopify.com/auth/access_token` (scope `read_global_api_catalog_search`, 60-min expiry, runtime fetch), sent as `Authorization: Bearer`. **Code:** `src/lib/scanner/ucp-auth.ts` (token fetch), C3 stub updated with real JSON-RPC request shape + Authorization header. **Env:** `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `UCP_AGENT_PROFILE_URL` added. **Manual step remaining:** user generates API key in Dev Dashboard and adds credentials to `.env.local`. |
| 2026-08-01 | 0.3.1 | **I-3 DONE — Shopify AI Toolkit adapted for Devin Desktop.** Shopify's plugin path supports Claude Code, Codex, Cursor, VS Code, Hermes — not Devin. §2.2 rewritten with the Devin-adapted approach: (1) `shopify-dev-mcp` MCP server (stdio, docs + GraphQL validation, no auth) added to `.devin/config.json` + `.mcp.json` — verified 5 tools operational (`learn_shopify_api`, `search_docs_chunks`, `validate_graphql_codeblocks`, `validate_component_codeblocks`, `validate_theme`); (2) 4 Shopify AI Toolkit skills installed via `npx skills add` to `.agents/skills/` (`ucp`, `shopify-dev`, `shopify-storefront-graphql`, `shopify-use-shopify-cli` — 4 of 21 total, selected for Phase 1 read-only catalog relevance; other 17 listed in §2.2 for future reference); (3) `@shopify/ucp-cli` v0.6.3 global, profile `catalogvector` initialized, verified with live catalog search. AGENTS.md updated with Shopify tooling section. |
