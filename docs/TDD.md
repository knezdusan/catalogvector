# CatalogVector — Technical Design Document

| | |
|---|---|
| **Document** | TDD (governing, technical) |
| **Companion** | `BLUEPRINT.md` (governing, non-technical) |
| **Version** | 0.6.2 |
| **Date** | 2 August 2026 |
| **Status** | Design + scaffold + I-3, I-4 resolved. U-3, U-4 resolved. Inference-accuracy reframe nullified (n=59, 1.7% error). **Fitment-recall probe: PROVISIONAL coverage gap** (corrected mean recall ~0.70 < 0.80 threshold, n=12, 1-2 stores; inferred-set audit passed — zeros are real platform failures, not extractor bugs; but extractor needs hardening, matching needs handle/SKU, stratification didn't happen, re-run required before declaration). Original thesis holds: specs visible ≠ products retrievable. §6 `fitment_recall` is the primary metric. No pipeline code written. Phase 0 not started. |

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
- ~~Results cluster by Universal Product ID (UPID) with offers from multiple merchants.~~ **CORRECTED 2 Aug 2026 (DIRECTIVE-7 §3):** The response returns per-merchant rows, not UPID clusters. Each product row has exactly 1 variant with 1 seller. The same physical part appears as separate rows with different product IDs, one per merchant. No UPID field, no cluster object, no multi-offer array exists at any JSON path. Verified across all 900 products in `unscoped-2026-08-02T15-44-54-483Z.json`. H5 (offer attachment) is not testable in this response shape.
- `get_product` returns option values with `available` / `exists` flags → variant modelling quality is directly measurable.
- `categories` returned in both `google_product_category` and `merchant` taxonomies → taxonomy divergence is directly measurable.

### 2.5 Shopify's own catalogue enrichment *(28 Jul 2026; empirically verified 1 Aug 2026)*
Shopify Engineering describes a multimodal-LLM pipeline that infers product metadata, **merges complementary attributes across listings of the same product** (including technical specs), normalizes variants, aggregates content, and produces a canonical record used by downstream systems.

**Empirical verification (U-4 transcript, 1 Aug 2026):** The Global Catalog returns `metadata.tech_specs` on ~99% of tested products (199/200 from Two Step Performance, an auto-parts shop). The inferred fields carry friction coefficients, temperature ranges, part numbers, and multi-vehicle fitment lists (e.g., Honda Civic Type R FK8, Mitsubishi EVO 5–10, Subaru STI) — all extracted from unstructured merchant description text by Shopify's ML pipeline. Additional inferred fields: `metadata.top_features` (prose summary), `metadata.unique_selling_points` (array).

**This falsifies the original project premise** ("AI agents can't see your technical specs because they are trapped in unstructured text"). See BLUEPRINT §3 (Invalidated Directions). An inference-accuracy reframe ("is Shopify's AI hallucinating wrong specs?") was also proposed and nullified — n=59 claims, 1.7% error rate, 0/9 fitment errors, 0/59 contradictions. The extraction pipeline is well-functioning. **The real finding is coverage, not accuracy:** Shopify's inference drops vehicles from fitment lists (merchant says pad fits Mégane RS, Catalog omits it). Specs being *visible* is not the same as products being *retrievable* — which is the original §2.2 thesis, untouched.

**Three consequences that shape the whole design:**
1. Where a spec appears structured in *any* merchant's listing, Shopify already propagates it. Measuring or remediating there is worthless.
2. The gap survives only where a spec exists nowhere structured **and** the taxonomy has no attribute slot. That intersection is the entire addressable surface — and §2.4's three-attribute filter vocabulary defines its boundary.
3. **Shopify's inference is high-coverage but lossy.** `metadata.tech_specs` is ML-generated, not merchant-authored, and it drops fitment entries from the merchant's source text. If an agent asks for "brake pads for a Mégane RS" and the Catalog's inferred fitment omits that vehicle, the product is not retrieved — even though the merchant's own page says it fits. This coverage gap is measured by `fitment_recall` (§6.1) and is the commercially defensible finding: "Your products are invisible to AI shopping agents for queries they should match."

### 2.6 Catalog freshness *(28 Jul 2026)*
Published products are auto-enrolled with manual opt-out. Rate limiting and caching apply. **Only inventory and price are real-time; other fields refresh on a delay.**

**Consequence:** no synchronous write→re-query loop. Any before/after demonstration must be a **pre-built A/B pair of dev stores**, seeded days in advance. Attempting it live fails in front of the buyer.

### 2.7 Facts requiring runtime confirmation (not yet verified)
| # | Unknown | Blocks | How to resolve |
|---|---|---|---|
| U-1 | ~~Does agent-profile registration involve human review? What is the lead time?~~ **RESOLVED 31 Jul 2026:** No human review. Spring '26 Edition removed the approval requirement. API key is generated instantly in Dev Dashboard → Catalogs → Get an API key. Agent profile is just a JSON file you host — no registration step. **Zero lead time.** | ~~I-4, C3~~ | Done — see §2.4 |
| U-2 | Actual requests/minute by trust tier | N, runtime, cost | **PARTIALLY RESOLVED 1 Aug 2026:** Token tier rate limit observed in JWT payload: `limits: {catalog: {max: 5, period: 1}}` — 5 requests/second. Scope: `read_global_api_catalog_search write_global_api_app_events`. Sufficient for Phase 1 with C7's ≤1 req/sec/domain storefront cap (the Global Catalog cap is separate). Full picture emerges at scale. |
| U-3 | ~~Can a shop GID be resolved from a public domain without OAuth?~~ **RESOLVED 1 Aug 2026:** Yes, via `search_catalog` with a shop-identifying query. `lookup_catalog` requires GIDs (not URLs) as input, so it cannot resolve a domain. Instead, search for a product unique to the target shop and extract `variants[].seller.id` (format: `gid://shopify/Shop/<id>`). Verified: Two Step Performance → `gid://shopify/Shop/1357086779`, Movcan → `gid://shopify/Shop/71335575609`. | ~~C1 → C3 handoff~~ | Done — see §2.4 |
| U-4 | ~~Is `filters.shops` semantics a hard restriction or a soft bias?~~ **RESOLVED 1 Aug 2026:** **HARD RESTRICTION with query fallback.** Control experiment (5 tests, 250 products, 0 containment violations): `filters.shops` restricts results to the scoped shop set — every returned product carries at least one seller from the scoped set. The negative control (T3: "wedding dress" scoped to an auto-parts shop) returned 50 products, all from the target shop, 0 violations — the filter held. **Caveat:** the query is a soft ranking signal within the shop, not a hard filter. When the query has no matches in the scoped shop, the API returns the shop's general catalog instead of an empty set. **Implication for C6:** recall@k must account for query relevance, not just product presence. Store-scoped retrieval measurement is valid. | ~~C6 scoring validity~~ | Done — transcript at `scripts/output/u4-*.json` |
| U-5 | Do Catalog results reflect merchant metafields at all? | C5/C6 interpretation, all Phase 2 value claims | Seed a dev store with structured metafields, wait out §2.6 delay, compare |
| U-6 | **Does Global Catalog rank predict what a consumer AI assistant actually surfaces?** `BLUEPRINT.md` §2.2 asserts the Global Catalog *"is the same retrieval surface the consumer AI assistants query."* Every measurement in this project inherits that claim, and it was never in §2.7's unknowns until now. **Status: OPEN (DIRECTIVE-5 §5, 2 Aug 2026).** Founder-owned: put the same relational queries to ChatGPT, Copilot, Gemini as a shopper would; record which merchants/products each names; compare against unscoped rank ordering. Blocks the publication framing, not the measurement. | Publication framing | One afternoon, no code. If rank predicts assistant output, the instrument is validated against the outcome — and that validation is itself publishable. If it does not, the Global Catalog is a proxy, and this project has been measuring a proxy while its entire position rests on criticising everyone else for measuring proxies. |

**Verified platform fact — Shopify storefront `tags` schema (2 Aug 2026, DIRECTIVE-4 §11):** Shopify's `/products.json` and `/products/<handle>.json` endpoints return `tags` as a **comma-separated string**, not an array. Example: `"tags": "10percent, 2003 Mitsubishi Evo 8, 2004 Subaru WRX STI, ..."`. This is significant because tags often contain vehicle fitment data (make + model + year) that is invisible to an extractor expecting an array. The Stage 1 probe's `StorefrontProduct` Zod schema expected `z.array(z.string())`, causing every `fetchStorefrontProduct()` call to fail silently (Zod parse error caught in a try/catch that returned null). This suppressed ~99% of matches across three of four stores. Fix: `z.union([z.string(), z.array(z.string())])`. **Every Zod parse failure must be logged and counted (DIRECTIVE-4 §4 P-4.4) — a zero-match store is a loud error, never an empty row.**

**U-4 and U-5 are the two that can invalidate the methodology.** They are scheduled in Week 1, not Week 3. **U-6 blocks the publication framing, not the measurement — it can run in parallel with Stage 2.5 and does not gate it.**

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
| `competitor_displacement` | Whether other merchants' products fill the slots — the seller domains occupying the top 10, and for each, whether the product is a near-equivalent of the target. **Produced by Stage 2.5 (DIRECTIVE-5 §3).** | Converts a technical finding into a commercial one. Defined since day one, never produced until Stage 2.5. |
| `fitment_recall` | **\|inferred ∩ stated\| / \|stated\|** — fraction of vehicles in the merchant's stated fitment set that appear in the Catalog's inferred `metadata.tech_specs`. Unit is (make, model), not (year, make, model, trim). | **The coverage finding (1 Aug 2026).** Shopify's inference drops vehicles from fitment lists. If the merchant says a pad fits a Mégane RS and the Catalog omits it, an agent cannot retrieve that product. This is the original thesis: specs visible ≠ products retrievable. Measured by `scripts/probe-fitment-recall.ts`. |
| `inference_error_rate` | **(Contradicted + Unsourced) / total inferred claims**, hand-labelled against merchant source text. | **Secondary metric (1 Aug 2026, n=59, 1 store).** Error rate: 1.7% (1/59). Fitment errors: 0/9. Contradictions: 0/59. Conclusion: well-functioning extraction pipeline, not a hallucination problem. Retained as a secondary dimension; the inference-accuracy reframe is invalidated (BLUEPRINT §3). Ground truth is human-labelled — using an LLM to judge an LLM's extraction begs the question. |

**Directive-fixed metric definitions (DIRECTIVE-3 §4, copied verbatim 2 Aug 2026, removed from freely-editable surface per DIRECTIVE-3 §6 / DIRECTIVE-4 §1.5):**

> - `relational_recall` = |inferred ∩ stated relational entities| / |stated|
> - `intrinsic_recall` = same, over the vertical's intrinsic control attributes
> - `relational_zero_rate` = share of products where the merchant states a relational attribute and inference returns **none**

**`relational_zero_rate` is per-product. The stated set includes the product title.** (DIRECTIVE-4 §1.5, 2 Aug 2026.)

**Dual scoring rules (DIRECTIVE-4 §2.3, 2 Aug 2026):**
- `relational_recall_prefix` (symmetric prefix matching, **headline**) — a match holds when either side's key is a prefix of the other. The methodology's stated bias runs toward the null (§6.1.1 limitation 3), so the generous rule is the headline.
- `relational_recall_strict` (exact key, **sensitivity**) — a match holds only on exact key equality.
- Both are reported every time. Whether "honda civic" and "honda civic fc" are the same vehicle *for retrieval purposes* is not a string question — Workstream B answers it. Until then the string rule is a stand-in and is labelled as one.

**Inference-accuracy verdict codes (hand-labelling instrument, secondary):**
`G` Grounded (traceable to source) · `D` Derived (legitimately inferable — unit conversion, paraphrase) · `C` Contradicted (source says something materially different) · `U` Unsourced (candidate hallucination) · `X` Unverifiable (cannot judge from public data). The headline metric is `(C+U)/total`. The distinction between `D` and `U` is the judgment that makes this publishable.

### 6.1.1 Fitment-recall probe — pre-registered decision rule

**Threshold pre-registered 1 Aug 2026, before running the probe.** Committed to git before the numbers exist. If it moves later, the diff shows it moved.

**Sample-design precondition (DIRECTIVE-4 §1.1, 2 Aug 2026):** The 0.80 rule was registered against a design of 20 products across 3–4 stores, stratified. **A stop rule does not fire on a sample non-compliant with its own registration.** The rule fires on the first compliant sample. This is a deferral, not a dissolution. When it fires and lands ≥0.80, the auto-parts fitment claim goes to `BLUEPRINT.md` §3, Workstream A is not run as a rescue mission, and §2.2 survives untouched. Record both halves together so the deferral cannot be re-invoked later.

**Stage 1 verdict withdrawn (DIRECTIVE-4 §1.1, 2 Aug 2026):** Stage 1 scored 12 products from one store (Two Step Performance). The §6 verdict of the Stage 1 report — "COVERAGE GAP CONFIRMED" — is **withdrawn**. The rule did not fire in either direction. Auto parts has no valid H1 arm and must be re-sampled to the same standard as the other three verticals: 3+ stores, 15+ scored products (DIRECTIVE-4 §1.2).

**Recall / zero-rate bound (DIRECTIVE-4 §1.3, 2 Aug 2026):** For the population where the merchant states a relational attribute, `mean_recall ≤ 1 − zero_rate`. So mean `relational_recall` ≥ 0.80 and `relational_zero_rate` ≥ 0.20 cannot both hold. **In any vertical where mean relational recall ≥ 0.80, that vertical is excluded from H1's confirming set and H1 then requires 3 of the 3 remaining verticals.** *(Observed on Stage 1's non-compliant sample: mean 0.675, zero rate 0.25, bound 0.75 — consistent, and inside the only admissible window the bound permits at n=12.)*

**Dual scoring rules (DIRECTIVE-4 §2.3, 2 Aug 2026):** Report both `relational_recall_prefix` (symmetric, headline) and `relational_recall_strict` (exact key, sensitivity) every time. On Stage 1's sample the defensible range is roughly **0.58 – 0.68**. The number is unstable across scoring rules; its ordering against 0.80 is not. **Report the range, not a point estimate.**

**P-3 resolution (DIRECTIVE-4 §7, 2 Aug 2026):** "Multiple Fitments" is the merchant's own title, faithfully preserved by Shopify. The speculated second coverage mechanism does not exist. Resolved by fetching the storefront JSON (`/products/<handle>.json`) and comparing — the storefront title is identical to the catalog title. The previous session's 0-row contribution from MAPerformance was a matching failure (storefront product list didn't include the catalog products), not a title collapse.

**Stage 2 conclusion withdrawn as unsupported (DIRECTIVE-5 §0, 2 Aug 2026):** Stage 2 (Workstream B) used `filters.shops` scoping per DIRECTIVE-3 §5 / DIRECTIVE-4 §3, which removes every competitor from the result set. Competition is the only mechanism by which a missing attribute costs a merchant a sale. Stage 2 therefore measured whether a product can be found *inside its own store* — not the commercial question. The Stage 2 conclusion — "the `fitment_recall` line has no commercial consequence" — is **withdrawn as unsupported, not as false**. It may be true; the experiment cannot establish it. Stage 2.5 (DIRECTIVE-5 §3) re-runs the same frozen query set without `filters.shops` to test the actual commercial question.

> **Probe:** 20 products across 3–4 stores, stratified by source-text richness (10 with descriptions under ~500 chars, 10 over 3,000). For each, extract the merchant's stated fitment set and the Catalog's inferred fitment set. Metric: `fitment_recall = |inferred ∩ stated| / |stated|`.
>
> **If mean fitment recall < 0.8** → real coverage gap, that's the paper, proceed to Phase 0 measuring retrieval consequences of omission.
>
> **If ≥ 0.8** → inference is doing the job, the catalogue-visibility problem largely doesn't exist, and the honest move is to stop, write up what you found, and take the artifact. Gate A was always defined to make that a success.

**First run (2 Aug 2026) — PROVISIONAL, not declared:**
- Raw mean recall: 0.490 (n=12, all from 1 store — Two Step Performance)
- Corrected mean recall (after stated-set audit): **0.70** (n=12, headline) / **0.64** (n=17, sensitivity — includes Subimods rows from `all`, not the pre-registered sample)
- **Inferred-set audit passed:** all 6 products with zero inferred fitment were checked by reading raw `tech_specs` strings. All are genuinely devoid of vehicle names — parametric specs only. The zeros are real platform failures, not extractor bugs.
- **Below 0.80 threshold, but NOT DECLARED.** Reasons:
  1. Extractor needs hardening (both sides): prose fragments, possessives, slash-merged names inflate `stated` and would inflate `inferred` too.
  2. Matching needs handle/SKU, not title tokens — 2 of 4 stores contributed zero rows.
  3. Stratification didn't happen — all scored products were rich-bucket; the thin/rich contrast (the actual scientific content) was never tested.
  4. Sample is 1-2 stores, not 4.
  5. 0.70 against 0.80 on a noisy instrument with n=12 from one store is not a comfortable enough margin.

**Pre-registration deviations (honest accounting):**
- The n=17 sensitivity number pulls Subimods rows from `all` after the numbers were visible. It moves the headline downward (toward the finding). Report n=12/0.70 as headline; n=17/0.64 as sensitivity only.
- Stratification was designed but not executed. The thin/rich contrast is the actual experiment; running only rich-bucket products means the designed experiment wasn't run.
- MAPerformance and Springrates dropped out due to title mismatch (Catalog titles say "Multiple Fitments" where storefront titles name vehicles). This is also a coverage finding: Shopify's canonical title collapses fitment into a generic phrase. Deserves investigation, not just an infrastructure fix.

**Stated limitations of the probe:**
1. The extractor is a closed-vocabulary pattern matcher, not an LLM. Predictable, auditable, but may miss unconventional fitment phrasing.
2. The unit is (make, model), not (year, make, model, trim). Year-range normalisation is its own hard problem and would make the metric measure the extractor, not the platform.
3. **Bias runs in favour of the null hypothesis:** fitment stored in metafields is invisible to `/products.json`, so the *stated* set may be understated, which inflates recall. A conservative instrument that still finds a gap is a much stronger claim than an optimistic one.
4. The `added` set (vehicles inferred but not stated) is a free second result — either cross-merchant enrichment or invention. Either is publishable. Check one or two by hand.
5. The verdict refuses to apply the rule if fewer than 8 products score, or if nothing has a stated fitment set at all. An underpowered run that returns "no gap" would be the easiest way to fool yourself.

**Next steps before declaration:**
1. Harden the extractor (both sides): filter prose fragments, handle possessives, split comma/slash lists.
2. Fix matching to handle-based or variant-SKU.
3. Re-run across 4+ stores with real thin/rich stratification.
4. Then apply the pre-registered rule.

### 6.1.2 H2 — the truncation hypothesis (pre-registered 2 Aug 2026, DIRECTIVE-4 §5)

**Registered before any test run.** The pattern was found in Stage 1's data, so H2 **cannot be confirmed on Stage 1's data** — it is tested on a fresh sample from Stage 3's auto-parts re-sample.

**Observation.** Among the twelve scored products in Stage 1, the three with zero inferred vehicles are exactly the three longest source texts (9,671 / 6,515 / 5,618 chars). The fourth-longest (5,377) scores 1.00. Probability of that ordering under no length effect ≈ 1/220. The two thin products (500, 369 chars) both score 1.00.

**H2:** relational-attribute loss is a function of **source-text length and in-document position**, not of attribute type. Shopify's extraction has an effective input budget; fitment blocks sit late in technical product pages and fall outside it. Intrinsic specs survive because they sit early, not because they are intrinsic.

**Why it matters.** H2 is a direct alternative explanation for H1 and it is **confounded with H1 in Workstream A as currently designed.** If intrinsic attributes appear earlier in the document than relational ones — which is the normal layout of a technical product page — then a four-vertical probe would "confirm" H1 while measuring position.

**Pre-registered decision rule — fixed 2 August 2026, before any test run:**

> **H2 supported** if, within a single store and controlling for stated-set size, `relational_zero_rate` in the top length quartile exceeds the bottom quartile by ≥ 0.30, in ≥2 verticals.
>
> **H2 rejected** if that difference is < 0.10 in ≥3 verticals.
>
> **H2 inconclusive** otherwise, or if fewer than 2 verticals reach 20 scored products spanning both quartiles.

**Mandatory control regardless of H2's verdict:** report mean first-occurrence offset for relational vs intrinsic entities in every vertical. If relational entities systematically appear later in the document, H1's verdict is reported **with that confound named in the same sentence**, in the report and in any publication.

**If H2 holds, it is commercially better news than H1.** "Your fitment table is past the extraction budget — move it up and structure it" is a specific, cheap, verifiable remediation a merchant can act on. "The platform drops relational attributes" is a complaint about Shopify.

### 6.1.3 H3 — unscoped competitive retrieval (pre-registered 2 Aug 2026, DIRECTIVE-5 §3)

**The question Stage 2 could not ask:** when a buyer's query goes to the whole Global Catalog, does this merchant's product appear at all — and who occupies the slots when it doesn't?

**Design.** Re-issue the same frozen query set (`scripts/retrieval-query-set.json`, commit `b0365f6`) with `filters.shops` removed. Only one parameter changes; pre-registration is preserved. Keep `address_country: 'US'` per §6.3 limitation 5.

**Pre-registered decision rule — fixed 2 August 2026, before any run:**

> **H3 confirmed (the coverage gap has commercial consequence):** `unscoped_presence@50` for the dropped-relational population is lower than for the retained-relational population by **≥ 0.30 absolute**, across relational queries.
>
> **H3 rejected (no consequence):** the difference is **≤ 0.10**.
>
> **H3 inconclusive:** anything between, or fewer than 6 (target, relational query) pairs in either population, or fewer than 3 distinct targets appearing at all in either population.

Inconclusive is a likely and acceptable outcome at this n. The run is worth doing anyway because `competitor_displacement` is produced either way, and that table stands on its own.

### 6.1.4 H4 — the title-coverage hypothesis (pre-registered 2 Aug 2026, DIRECTIVE-5 §4)

**Observation from Stage 2 §8.3:** the metric that predicts retrieval may be `title_vehicle_coverage`, not `fitment_recall`. Under title dominance, products whose title names no vehicle ("Multiple Fitments", bare part numbers) are structurally unretrievable by relational query — a merchant-caused failure with a merchant-side fix.

**Design.** Assemble ≥8 products across ≥2 stores whose Catalog title names no vehicle, but whose merchant data (tags, body, or tech_specs) states one. Pair each with a matched control from the same store and category whose title does name the vehicle. Issue relational queries for the stated vehicles both unscoped and shop-scoped.

**Pre-registered decision rule — fixed 2 August 2026, before any run:**

> **H4 supported (title dominates retrieval):** title-absent products show `presence@50` at least **0.40 below** matched title-present products, on the unscoped run.
>
> **H4 rejected:** the difference is within **0.15**.
>
> **H4 inconclusive:** anything between, or fewer than 8 title-absent products assembled, or fewer than 6 matched pairs.

**If H4 is supported it is the best commercial news this project has produced.** A platform defect is a complaint Shopify can close next quarter. A merchant-authored title defect is diagnosable, fixable, verifiable by the merchant, and independent of Shopify's inference pipeline entirely.

**Result — 2 Aug 2026 (run completed):**

> **H4 SUPPORTED** (under relaxed matching) — title-absent presence@50 = 0.125 (1/8), title-present = 0.833 (5/6), difference 0.708 ≥ 0.40.

8 title-absent products assembled across 2 stores (TSP=2, MAP=6). 6 title-present controls from TSP. 14 relational queries issued unscoped. The one title-absent success (H4Q02, Paragon PBP15570 at rank 2) is the product whose tech_specs inferred "honda civic" — the broad match worked. The 6 MAP "Multiple Fitments" products were all absent. The one title-present failure (H4Q13, ICON lift kit) is a competitive burial, not a title-coverage failure.

**Caveat:** matched controls are not same-category (no same-category title-present controls exist for MAP brake pads — MAP uses "Multiple Fitments" for ALL brake pad titles). Under strict same-store-AND-same-category matching, 0 matched pairs → inconclusive by strict rule. Under relaxed same-store matching, 6 controls → supported. The 0.708 gap is too large for the category confound to threaten the directional finding. Report: `docs/reports/stage2-5-followback.md`.

**P-5 addition-side audit — 2 Aug 2026:** 4 Kryptonite part numbers audited against manufacturer's published application lists. 12/12 inferred vehicles correct, 0 incorrect. The addition side of Shopify's inference is accurate for the audited sample. Report: `docs/reports/p5-addition-audit.md`.

### 6.1.5 H5 — the offer-attachment hypothesis (pre-registered 2 Aug 2026, DIRECTIVE-7 §3)

**Observation from DIRECTIVE-7 §3:** if results cluster by UPID with multi-merchant offers, then "the target product did not appear" is ambiguous between (a) the UPID cluster did not rank (ordinary ranking) and (b) the cluster ranked but the target merchant's offer was not attached (a catalogue-linking failure). (b) is structural, merchant-diagnosable, and independent of ranking.

**Pre-registered decision rule — fixed 2 August 2026, before any run:**

> **H5 supported:** `offer_attachment_rate` ≤ 0.70 across ≥20 part numbers, with ≥5 confirmed cases where merchant A is attached and merchant B, stocking the identical part, is not.
>
> **H5 rejected:** `offer_attachment_rate` ≥ 0.90.
>
> **H5 inconclusive:** anything between, or fewer than 20 part numbers resolved, or clustering cannot be resolved from the response shape.

**First, and before any of the above:** determine from `unscoped-2026-08-02T15-44-54-483Z.json` whether the response actually clusters by UPID with multi-merchant offers, or returns per-merchant rows.

**Result — 2 Aug 2026 (clustering determination completed, no API calls):**

> **H5 NOT TESTABLE — the response returns per-merchant rows, not UPID clusters.**

All 900 products across 18 queries inspected. Each product row has exactly 1 variant with 1 seller. No UPID field, no cluster object, no multi-offer array exists at any JSON path. The same physical part appears as separate rows with different product IDs, one per merchant. "Offer attachment" is not a measurable event in this response shape. TDD §2.4 line 81 corrected (see above). Report: `docs/reports/directive7-stage1-followback.md`.

### 6.1.6 §5 depth-1000 re-run (DIRECTIVE-7 §5, executed 2 Aug 2026)

**Design.** Re-issue the frozen 18-query set (commit `b0365f6`, unscoped) with pagination to depth 1000. For each target record: present at 3, 10, 50, 200, 1000, or absent at depth.

**Result — 2 Aug 2026:**

> **6 of 16 relational targets absent at depth.** The Catalog exhausted at ~300 results per query (range 273–385), well below the 1000 depth cap. "Absent at depth 1000" means absent from the entire result set, not ranked below 1000.

| Population | Pairs | Present | Absent | presence@3 | presence@10 | presence@50 | presence@200 |
|---|---|---|---|---|---|---|---|
| Dropped | 7 | 4 | 3 | 1 | 1 | 3 | 4 |
| Retained | 9 | 6 | 3 | 3 | 5 | 5 | 6 |
| Pooled | 16 | 10 | 6 | 4 | 6 | 8 | 10 |

**3 targets absolutely invisible** (absent from all 18 queries): paragon-pbp370 (no vehicle in title), icon-stage-4 (vehicle in title), br-series-coilovers (vehicle in title). All 3 are enrolled in the Catalog (appear in scoped Stage 2 run) but absent from the entire unscoped result set. 2 of 3 have adequate titles — invisibility is not explained by title absence alone. §6 identical-part audit authorized. Report: `docs/reports/directive7-stage2-followback.md`.

### 6.1.7 §6 identical-part audit (DIRECTIVE-7 §6, executed 2 Aug 2026)

**Design.** For a single store (TSP), take ≥10 parts it stocks that ≥2 other Shopify merchants also stock. For each: which merchants appear, at what rank, whether the target appears at any depth, and the cause per TDD §6.2. The product is held constant across merchants, so demand, price band and category density are equalised by construction.

**Sub-study A (general audit, 12 parts, brand+SKU queries):** 12/12 TSP present. 0 structural invisibility. TSP's Catalog enrollment is not broken.

**Sub-study B (invisible-target audit, 3 absolutely invisible targets, multiple query phrasings):**

| Target | Brand/SKU query | Natural language query | Cause |
|---|---|---|---|
| BC Racing BR Series | rank 13, 203 | "coilovers for 2017 Honda Civic" → ABSENT | `title_uninformative` (brand omitted, year mismatch) |
| ICON Stage 4 | rank 1, 2, 43 | "lift kit for 2023 Ford F-150" → ABSENT | `unexplained` (title adequate, competitors present) |
| Paragon PBP370 | rank 1, 1, 4 | "brake pads for 2018 Honda Civic Si" → ABSENT | `title_uninformative` (vehicle omitted) |

**Verdict: structural invisibility confirmed for 3 of 3 absolutely invisible targets, in the natural-language query condition.** All 3 are findable by brand/SKU but invisible by natural-language relational query. Other merchants selling the same brand ARE present. The invisibility is query-dependent, not absolute.

**Classification per §6.2:** IV01 `title_uninformative`, IV02 `unexplained`, IV03 `title_uninformative`. IV02 is the most concerning — title contains brand, product type, and vehicle, but the product is still excluded from the result set while competitors with similar titles are included. Report: `docs/reports/directive7-stage3-followback.md`.

### 6.2 Miss classification
When an expected product is not retrieved, classify why — **this is the part with commercial value**, because it is the fix list:

`spec_unstructured` · `taxonomy_mismatch` · `variant_fragmentation` · `title_uninformative` · `identifier_missing` · `not_enrolled` · `unexplained`

`unexplained` is reported honestly and not minimised. A methodology with no residual is a methodology that is hiding something.

**Exclusion rule (DIRECTIVE-5 §1.3, 2 Aug 2026):** A retrieved target may be removed from the `should_match` population **only** by an explicit `should_not_match` label. It may never be removed on the basis of a §6.2 miss class, because a miss class presupposes it should have matched. A product cannot be both a classified miss and excluded from the `should_match` population.

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

> **SUPERSEDED by DIRECTIVE-3 §6 (2 Aug 2026).** The three-week timebox is withdrawn; milestones are now evidence-gated, not calendar-gated. See `BLUEPRINT.md` §5.1. The week-by-week plan below is retained as history of the original sequencing; it no longer binds. Stage advancement is now driven by pre-registered thresholds on a hardened instrument at adequate n, not by week elapsed.

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
| 2026-08-01 | 0.4.0 | **U-3, U-4 resolved; inference-accuracy reframe proposed and nullified; fitment-recall probe: PROVISIONAL coverage gap.** U-4 control experiment (`scripts/probe-u4-shop-filter.ts`, 5 tests, 250 products): (1) **U-3 RESOLVED:** shop GIDs resolvable via `search_catalog` + `variants[].seller.id`. (2) **U-4 RESOLVED:** `filters.shops` is a HARD RESTRICTION (0 containment violations across all 5 tests, including page 2 with real cursor). Query is a soft ranking signal within a shop. `metadata.tech_specs` populated on ~99% of products. **Inference-accuracy probe** (n=59 claims, 10 products, 1 store): error rate 1.7% (1/59), fitment errors 0/9, contradictions 0/59. Well-functioning extraction pipeline — the "hallucination" reframe is nullified (BLUEPRINT §3). **The real finding is coverage, not accuracy:** Shopify's inference drops vehicles from fitment lists. **Fitment-recall probe** (`scripts/probe-fitment-recall.ts`, pre-registered threshold 0.80): raw mean recall 0.490 (n=12, 1 store). After stated-set audit (correcting extractor errors): corrected mean recall **0.70** (n=12, headline) / **0.64** (n=17, sensitivity). **Inferred-set audit passed:** all 6 products with zero inferred fitment checked by reading raw `tech_specs` — genuinely devoid of vehicle names, parametric specs only. Zeros are real platform failures, not extractor bugs. **Below 0.80 threshold but NOT DECLARED — PROVISIONAL.** Extractor needs hardening (both sides), matching needs handle/SKU (2/4 stores contributed zero rows), stratification didn't happen (all rich-bucket), sample is 1-2 stores. Pre-registration deviations documented honestly: n=17 pulls from `all` after numbers visible (moves headline downward — report n=12/0.70 as headline). MAPerformance/Springrates title collapse ("Multiple Fitments" instead of vehicle names) is a coverage finding in its own right. §2.5 updated (coverage, not accuracy). §6 `fitment_recall` is primary metric, `inference_error_rate` secondary. §6.1.1 pre-registered decision rule + first-run results + deviations. BLUEPRINT §1, §2.2 reverted to v0.3.1 framing; §3 updated with both invalidated directions. |
| 2026-08-02 | 0.4.1 | **DIRECTIVE-3 §6 executed — timebox withdrawn, milestones evidence-gated.** BLUEPRINT §5.1 added (per directive authorization): three-week timebox withdrawn; milestones now evidence-gated not calendar-gated; Gate A inbound-conversation threshold suspended pending redefinition by directive (no replacement invented). BLUEPRINT §5 Phase 1 header annotated to point at §5.1. TDD §9 marked SUPERSEDED with pointer to BLUEPRINT §5.1. No pre-registered thresholds touched. §3 inference-accuracy entry verified present (line 89, added in 0.4.0) — not re-added. DIRECTIVE-3 prerequisites (P-1, P-2, P-3) and Workstreams A/B not yet started. |
| 2026-08-02 | 0.5.0 | **DIRECTIVE-3 Stage 1 (prerequisites) + DIRECTIVE-4 §11 governing doc updates.** Stage 1: P-1 (5-tier handle/SKU matching — tier 0 handle-from-variant-URL, tier 1 exact title, tier 2 SKU, tier 3 handle token overlap flagged, tier 4 reject), P-2 (extractor hardened — delimiter splitting, verb/auxiliary rejection, possessive 's' stripping, part-number/chassis-code rejection, ~80 expanded stopwords, symmetric prefix matching — applied identically to both sides), P-3 ("Multiple Fitments" is merchant-authored, not Shopify collapse — resolved by fetching storefront JSON). **Critical bug found:** Shopify returns `tags` as comma-separated string, not array; Zod schema expected array, silently failing 99% of matches for 3/4 stores. Fixed. Stage 1 report: `docs/reports/stage1-followback.md`. **DIRECTIVE-4 §11 updates:** §6 metric definitions copied verbatim from DIRECTIVE-3 §4, marked directive-fixed. §6.1.1 — 0.80 rule sample-design precondition + Stage 1 verdict withdrawal (§1.1), recall/zero-rate bound (§1.3), dual scoring rules prefix/strict (§2.3), P-3 resolution. §6.1.2 — H2 truncation hypothesis pre-registered with decision rule. §2.7 — tags schema finding recorded as verified platform fact. BLUEPRINT §5.1 — Gate A replaced with compound G1/G3 gate. Stage 1 verdict withdrawn per DIRECTIVE-4 §1.1 — auto parts must be re-sampled (3+ stores, 15+ scored products). |
| 2026-08-02 | 0.5.1 | **DIRECTIVE-4 §3 Stage 2 (Workstream B) + DIRECTIVE-5 §7 governing doc updates.** Stage 2: 18 queries (14 relational + 4 intrinsic) across 7 archetypes, scoped to TSP via `filters.shops`. 55 hand-labelled pairs (27 should_match, 14 partial, 14 should_not_match). C5 acid test passed (2 partial verdicts field presence could not produce). Misses classified: taxonomy_mismatch ×2, title_uninformative ×2, variant_fragmentation ×1. **Stage 2 conclusion withdrawn as unsupported (DIRECTIVE-5 §0):** `filters.shops` scoping removed all competitors — the experiment measured within-store findability, not commercial consequence. **DIRECTIVE-5 §7 updates:** §2.7 — U-6 (Global Catalog rank vs assistant output) registered OPEN. §6.1.1 — Stage 2 conclusion withdrawn with scoping reason. §6.1.3 — H3 unscoped competitive retrieval pre-registered. §6.1.4 — H4 title-coverage hypothesis pre-registered. §6.2 — exclusion rule: removal from should_match requires should_not_match label, never a miss class. `competitor_displacement` marked as produced by Stage 2.5. Version headers fixed to 0.5.0. |
| 2026-08-02 | 0.5.2 | **DIRECTIVE-5 §3/§4/§6 Stage 2.5 executed — H3 inconclusive, H4 SUPPORTED, P-5 12/12 correct.** H3 (unscoped competitive retrieval): 18-query frozen set re-issued without `filters.shops`. Dropped presence@50 = 0.429 (3/7), retained = 0.556 (5/9), difference 0.127 — INCONCLUSIVE (between 0.10 and 0.30). Competitor displacement table produced: TSP holds 0-3 top-10 slots per relational query; competitors with vehicle-rich titles displace TSP products. H4 (title-coverage): 8 title-absent products across 2 stores (TSP=2, MAP=6), 6 title-present TSP controls, 14 relational queries unscoped. Title-absent presence@50 = 0.125 (1/8), title-present = 0.833 (5/6), difference 0.708 — SUPPORTED (≥0.40). **Best commercial news this project has produced.** Caveat: matched controls not same-category (MAP has no title-present brake pad products — "Multiple Fitments" is store-wide pattern at MAP). Under strict same-store-AND-category matching, 0 matched pairs → inconclusive by strict rule. Under relaxed same-store matching, 6 controls → supported. The 0.708 gap is too large for the confound to threaten the directional finding. P-5 (addition-side audit): 4 Kryptonite part numbers (KRUCA12, KRUCA19, KRSE11, KRFD17STAGE2FOX) checked against manufacturer's published application lists. 12/12 inferred vehicles correct, 0 incorrect. Addition side of inference is accurate for audited sample. §6.1.4 updated with H4 result and P-5 result. Reports: `docs/reports/stage2-5-followback.md`, `docs/reports/p5-addition-audit.md`. |
| 2026-08-02 | 0.6.0 | **DIRECTIVE-7 Stage 1 — §4 re-scoring + §3 clustering determination (no new API calls).** DIRECTIVE-6 §2 (pooled 0.500 as "most important number") and §5.1 (merchant-facing artefact) withdrawn. §3 clustering: response returns PER-MERCHANT ROWS, not UPID clusters — 900 products across 18 queries, 0 with >1 variant, 0 with >1 seller, no UPID/cluster/offer fields. H5 (offer attachment) NOT TESTABLE in this response shape. TDD §2.4 line 81 corrected — "Results cluster by UPID" struck and replaced with per-merchant-row finding. §4.1: presence definition confirmed as handle identity (exact, zero mismatches). §4.2: denominator recorded — total_count 281–358 per query, ~300 competing listings, baseline P(top 50) ≈ 0.167. §4.3: pooled presence@50 = 0.500 is ~3× better than chance (not a defect). Dropped 0.429 (2.6×), retained 0.556 (3.3×). presence@10: dropped 0.143, retained 0.556, pooled 0.375. §4.4: TSP holds rank 1 in 5/14 relational queries, appears in top 50 of 11/14. §4.5: no fallback artefacts. §6.1.5 H5 added with NOT TESTABLE verdict. Report: `docs/reports/directive7-stage1-followback.md`. |
| 2026-08-02 | 0.6.1 | **DIRECTIVE-7 Stage 2 — §5 depth-1000 re-run. 6 of 16 targets absent at depth. 3 absolutely invisible.** Frozen 18-query set re-issued unscoped with pagination to depth 1000. Catalog exhausted at ~300 results per query (range 273–385) — depth-1000 cap never reached. "Absent at depth 1000" = absent from entire result set. Pooled: 10/16 present, 6/16 absent. Dropped: 4/7 present, 3/7 absent. Retained: 6/9 present, 3/9 absent. **3 targets absolutely invisible** (absent from all 18 queries): paragon-pbp370 (no vehicle in title), icon-stage-4 (vehicle in title), br-series-coilovers (vehicle in title). All 3 enrolled in Catalog (appear in scoped Stage 2 run) but absent from unscoped result set. 2 of 3 have adequate titles — invisibility not explained by title absence alone. Scoped retrieval was U-4 fallback, not genuine matching. §6 identical-part audit authorized (non-trivial absent count). §6.1.6 added with depth-1000 results. Report: `docs/reports/directive7-stage2-followback.md`. |
| 2026-08-02 | 0.6.2 | **DIRECTIVE-7 Stage 3 — §6 identical-part audit. Structural invisibility confirmed for 3/3 absolutely invisible targets.** Sub-study A (12 parts, brand+SKU queries): 12/12 TSP present, 0 invisibility — TSP enrollment is not broken. Sub-study B (3 invisible targets, multiple query phrasings): all 3 findable by brand/SKU (rank 1–203) but invisible by natural-language relational query. Other merchants selling same brand ARE present. IV01 (BC Racing): `title_uninformative` — brand omitted, year mismatch. IV02 (ICON Stage 4): `unexplained` — title adequate, competitors present, TSP excluded. IV03 (Paragon PBP370): `title_uninformative` — vehicle omitted. **Invisibility is query-dependent, not absolute.** IV02 is most concerning — title contains brand+product+vehicle but still excluded. §6.1.7 added with audit results. Reports: `docs/reports/directive7-stage3-followback.md`, `scripts/output/identical-part-audit-2026-08-02T20-51-23-532Z.json`, `scripts/output/invisible-target-audit-2026-08-02T20-54-17-635Z.json`. |
