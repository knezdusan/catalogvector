# CatalogVector — Project Blueprint

| | |
|---|---|
| **Document** | Blueprint (governing, non-technical) |
| **Companion** | `TDD.md` (governing, technical) |
| **Version** | 1.0.0 |
| **Date** | 4 August 2026 |
| **Owner** | Dušan Knežević (solo) |
| **Status** | Phase 0 not started. Infrastructure I-1–I-4 done, I-1–I-6 runtime invariants implemented (22 tests). **Measurement instrument operational**: partition-based enumeration with recall_random = 88.8% (against union presence, n=100, seed=42). **Absence measured across 3 stores**: Subimods 20.0% (95% CI 13.3–28.9%), TSP 13.0% (7.8–21.0%), MAP 17.0% (10.9–25.5%). **H9 REJECTED** — absence is random loss, not predictable from publicly visible product attributes. The "reliable diagnostic" pitch is not supported. What survives: the measurement method, the platform-facts register (13 entries), and the finding that 13–20% of a store's catalogue is absent from the Catalog. Fitment-recall probe (0.385, n=18, 4 stores) stands but is secondary. No pipeline code written. |
| **Internal name** | `CatalogVector` (repo `github.com/knezdusan/catalogvector`, sessions, internal docs) |
| **Public name** | `CatalogVector` — leading candidate, satisfies §2.3 constraints (no "scanner"/"readiness"). **Phase 0 confirms** against the four vertical-selection criteria before publication. |

---

## 0. How to use these two documents

`BLUEPRINT.md` answers *what and why*. `TDD.md` answers *how*.

Together they are the **single source of truth for session handoffs**. Any new session should be able to read both and resume without re-deriving context. Therefore:

- **Every strategy shift, feature addition, feature status change, or critical decision is written into these documents in the same session it is made.** Not later.
- Feature status only moves forward on evidence (see §6 status definitions).
- §3 (Invalidated Directions) is load-bearing. It exists so no future session resurrects an idea that has already been killed with data. Do not delete it.
- Verified external facts live in `TDD.md` §2 with dates attached, because this platform moves fast and stale facts have already cost this project one full strategy cycle.

---

## 1. Mission statement

> Establish, with published evidence, whether AI shopping agents can actually retrieve technically-specified products from Shopify merchants — and become the person who can fix it when they can't.

The output is not a product. The output is **demonstrated, public, verifiable competence** in a domain that is roughly seven months old, plus the inbound that competence generates.

---

## 2. Executive summary

### 2.1 The situation

Shopify syndicates merchant catalogues to AI shopping surfaces (ChatGPT, Copilot, Gemini, Google AI Mode) via the Universal Commerce Protocol. Merchants are enrolled by default. The protocol layer is fully abstracted by Shopify — merchants never touch it. What remains under merchant control is **product data quality**, and the industry consensus is that most catalogues are not fit for machine retrieval.

That consensus is the problem: it is already a crowded consensus. Shopify ships a free official checker. Three published benchmarks exist. The App Store's SEO category has ~990 apps, eleven of which on page one alone exceed a 500-review/4.5-star saturation threshold, and the incumbents have already shipped AEO/GEO features.

### 2.2 The opening

Every existing player — Shopify's own tool, all three benchmarks, every App Store entrant — measures **the same proxy**: page-level structured data. Schema present or absent. `llms.txt` present or absent. Field populated or empty.

Nobody measures the **outcome**: given a realistic buyer query, does the agent actually retrieve the product?

Shopify made that measurable in Spring '26 by opening the Global Catalog MCP to any developer without merchant permission. It is the same retrieval surface the consumer AI assistants query. It can be interrogated directly.

Two facts make the vertical framing necessary rather than decorative:

1. The Global Catalog's structured attribute filter vocabulary supports exactly three names — `Color`, `Size`, `Target gender`. Every relational or technical specification (fitment, voltage, thread pitch, tolerance, standards conformance) has no filter slot and must survive as free text through a semantic retrieval layer, or it does not participate in the match at all.
2. Shopify's own catalogue pipeline uses multimodal LLMs to infer and merge product attributes *across listings of the same product*. Where a spec appears structured in somebody's listing, Shopify already fills the gap and remediation adds nothing. The gap survives only where the spec exists nowhere in structured form and the taxonomy has no slot for it — i.e. exactly in technically-specified verticals.

**Empirical update (1 Aug 2026):** U-4 confirmed that `metadata.tech_specs` is populated on ~99% of tested products — Shopify's ML infers specs from unstructured text automatically. An inference-accuracy probe (n=59 claims, 1 store) found 1.7% error rate — a well-functioning extraction pipeline, not a hallucination problem. **But** the same probe revealed that Shopify's inference **drops vehicles from fitment lists** — the merchant's source says a pad fits a Mégane RS and the Catalog's inferred `tech_specs` omits it. A fitment-recall probe (pre-registered threshold 0.80) found corrected mean recall of 0.70 (n=12, 1-2 stores) — **PROVISIONAL coverage gap, below threshold but not yet declared.** The inferred-set audit passed: products scoring zero were checked by reading raw `tech_specs` strings, which are genuinely devoid of vehicle names (parametric specs only). But the extractor needs hardening, matching needs handle/SKU, stratification didn't happen, and the sample is 1-2 stores. Re-run required before declaration. Specs being *visible* is not the same as products being *retrievable*. `tech_specs` is an unstructured blob, it isn't filterable, coverage is demonstrably lossy, and whether it actually drives retrieval is precisely what C6 measures and what nobody has published. The original position — *nobody measures retrieval outcome, everyone measures page-level schema proxies* — is untouched by any of this. (See §3 for the inference-accuracy reframe, also invalidated.)

**Empirical update (4 Aug 2026, DIRECTIVE-9 through DIRECTIVE-17):** Nine directives of measurement produced three findings that survived and one that did not.

1. **The Catalog does feed the assistants.** U-6-R (12 queries × 3 assistants) confirmed Shopify merchants appear in ChatGPT product cards. The exposé premise ("the Catalog is a phantom") is dead — falsified by direct observation, not argument. Verdict: SURFACE-DEPENDENT — carousels render unpredictably, Shopify merchants appear but not consistently. The Catalog API and the assistant surface share an index (U-9, SAME INDEX), but the assistant applies its own ranking and presentation layer on top.

2. **13–20% of a store's catalogue is absent from the Catalog.** A partition-based enumeration method (692 queries for Subimods, built from the store's own vendor/product-type partition) recovers 88.8% of products confirmed present by an independent reference standard (n=100, seed=42, union of reference standard and enumeration). Measured across three stores: Subimods 20.0% absent (95% CI 13.3–28.9%), TSP 13.0% (7.8–21.0%), MAP 17.0% (10.9–25.5%). This is the first time anyone has computed per-store Catalog absence.

3. **Absence is random, not predictable.** H9 tested whether publicly visible product attributes (image count, variant count, price, published_at age, vendor, product type, tag count, body length) predict which products are absent. After correcting for class imbalance, no attribute provided any lift over the base rate. Absence is random loss, not a systematic defect diagnosable from product data. **The original pitch — "reliable diagnostic for invisible products" — is not supported by the evidence.**

The fitment-recall probe (0.385 corrected, n=18, 4 stores) stands as a secondary finding: Shopify's inference drops vehicles from fitment lists. But the retrieval consequence of that omission was never cleanly established (H3 inconclusive, H4 supported but under relaxed matching). The measurement infrastructure — runtime invariants (I-1–I-6, 22 tests), partition-based enumeration, sitemap ground truth, platform-facts register (13 entries) — is the durable asset. It is the first thing in seventeen directives that has not died.

**Position: outcome measurement, in one technical vertical.** Both halves are required. Outcome measurement in a consumer vertical is a solved problem Shopify's own ML handles. Proxy measurement in a technical vertical is the fourth entrant in a genre that already has a quarterly institutional incumbent.

### 2.3 Naming

The internal name is `CatalogVector`. The published artifact must not use "scanner" or "readiness":

- "Agent readiness" is the term Shopify's own free tool occupies.
- "Readiness score" is the term all three benchmarks occupy.
- Using either invites the buyer question *"why pay you when Shopify tells me my score for free?"* — which is unanswerable, because the honest answer is that our number measures something different, and a name that collides destroys that distinction before it can be made.

`CatalogVector` satisfies the constraints (contains neither "scanner" nor "readiness") and reflects the core operation (vector retrieval over catalogs). It is the **leading candidate** for the public name. **Phase 0 confirms** the public name once the vertical is known, per the original gate — the name must read naturally in the vertical's practitioner language. If a vertical-specific framing reads better, the public name may diverge from the internal name at that point.

---

## 3. Invalidated directions — DO NOT RESURRECT

Recorded with the evidence that killed them. Each was seriously considered and each is dead.

| Direction | Killed | Why |
|---|---|---|
| **Generic agent-readiness app on the Shopify App Store** | 27 Jul 2026 | (a) Merchants never touch UCP/MCP — protocol coverage is not a merchant-side problem, deleting half the audit scope. (b) What remains files under SEO: ~990 apps, 11 on page one over the saturation threshold, incumbents already shipped AEO/GEO to install bases in the thousands. (c) The exact app already exists — "Visibl", solo dev, launched 13 May 2026, $9/mo, zero reviews. |
| **Public app as a product business** | 27 Jul 2026 | Distribution, not code, is the binding constraint. Free-audit-as-distribution is table stakes, not leverage — every competitor offers it. Commodity price ceiling is $0–$9/mo (Shopify's own tool is free; AgentReady $5/mo; Agentic Readiness Report free). |
| **Generic "readiness" benchmark across all Shopify** | 28 Jul 2026 | Already executed three times: Shero (1,000 stores, avg 42/100, **full dataset published**), CommerceShop (485 stores, 90 industries, avg 31.4/100), Digital Commerce 360 × ReFiBuy (Top 1000 retailers, avg 41.9/100, **quarterly**). Competing here means being the fourth entrant against an institutional incumbent. |
| **Asserted scoring methodology** | 28 Jul 2026 | A self-defined score with self-assigned weights is an opinion with a chart. It cannot be checked, so a competent reader in the vertical dismisses it. Superseded by measured retrieval outcome. |
| **Closed-source / proprietary engine as moat** (Blueprint v1, external audit rec. 7.4) | 28 Jul 2026 | For a solo operator with no brand, code is not a moat — authority is. Shero publishes their raw dataset deliberately and it strengthens them. Closing the source deletes the CV artifact, which is the only guaranteed return in the plan. Rejected. |
| **Sales partner with commission/equity before revenue** (Blueprint v1) | 28 Jul 2026 | The named partner is a placeholder. Structuring 15–20% of gross and a path to 50/50 around a person who does not exist, against a pipeline of zero, is unpriceable. Deferred until after Gate A, minimum. |
| **Cold outreach to enterprise CEOs as primary GTM** (Blueprint v1 §3, external audit rec. 7.2) | 28 Jul 2026 | Weakest available capability, no case studies, no brand, unfavourable geography. The audit that recommended it also conceded there is no validated close rate. Publication-led inbound replaces it. |
| **Live before/after demo on a sales call** (Blueprint v1 §3 Step 5) | 28 Jul 2026 | Technically impossible as specified. Catalog products are auto-enrolled with rate limiting and caching; only inventory and price are real-time, other fields refresh on a delay. Metafield injection cannot be re-queried within a call. Replaced by pre-built A/B dev-store pair (§7). |
| **"AI agents can't see your technical specs" (original premise)** | 1 Aug 2026 | **Empirically falsified by U-4 transcript data.** The Global Catalog returns `metadata.tech_specs` on ~99% of tested products (199/200), with friction coefficients, temperature ranges, part numbers, and multi-vehicle fitment lists — all inferred by Shopify's ML pipeline from unstructured merchant text. Walking into a merchant meeting claiming "Shopify's AI is blind to your specs" would be disproven by the merchant inspecting their own payload. |
| **"Shopify's AI is hallucinating wrong specs" (inference-accuracy reframe)** | 1 Aug 2026 | **Nullified by inference-accuracy probe (n=59 claims, 10 products, 1 store).** Error rate (C+U)/total = 1.7% (1 misclassified attribute value out of 59 claims). Fitment errors: 0/9. Contradictions: 0/59. This is a well-functioning extraction pipeline, not a hallucination problem. The reframe was proposed too fast when `tech_specs` turned up populated. **The real finding is coverage, not accuracy:** Shopify's inference drops vehicles from fitment lists (merchant says pad fits Mégane RS, Catalog omits it). Specs being *visible* is not the same as products being *retrievable* — which is the original §2.2 thesis, untouched. Inference accuracy retained as a secondary metric in TDD §6. |
| **"The Catalog is a phantom — consumer AI assistants don't use it" (exposé pivot)** | 3 Aug 2026 | **Falsified by U-6-R (DIRECTIVE-10/11).** Two product cards in ChatGPT cited Shopify merchants: B3 linked to `shop.app/products/…`, C2 linked to `bc.springrates.com/products/…` (a store from this project's own scan set). OpenAI's help centre confirms Shopify Catalog integration. The exposé premise is dead on this project's own data. Verdict: SURFACE-DEPENDENT — carousels render unpredictably, Shopify merchants appear but not consistently. |
| **"shop.app presence proxies Catalog presence" (H6)** | 3 Aug 2026 | **REJECTED on pre-registered threshold (DIRECTIVE-11/12).** shop.app presence did not agree with ChatGPT card appearance on ≥16 of 20 (threshold for support). Products absent from the Catalog API are present on shop.app from *other merchants* — checking the seller, not just the product, dissolved the finding. shop.app and the Catalog API index different subsets of a merchant's catalogue; neither is a proxy for the other. |
| **"Syndication is decided per product, predictable from public attributes" (H7)** | 4 Aug 2026 | **WITHDRAWN (DIRECTIVE-14).** H7 was built on a shop.app observation misread as a Catalog finding. The Subimods OEM-in/aftermarket-out split was a shop.app phenomenon, not a Catalog one — all five aftermarket products were present in the Catalog API under Subimods' seller name. The hypothesis was withdrawn by the advisor, not killed by data. |
| **"The Catalog serves products you no longer sell" (H8)** | 4 Aug 2026 | **REJECTED (DIRECTIVE-14).** 401 candidate handles fetched directly from store domains; all 401 returned `200` with `available: true`. Zero 404s. The test involves no pagination and no matching — a direct URL either resolves or it does not. The "extra" Catalog handles are explained by `/products.json` being incomplete, not by stale entries. |
| **"Absence from the Catalog is systematically predictable from product attributes" (H9)** | 4 Aug 2026 | **REJECTED (DIRECTIVE-17).** 300 random products per store (Subimods, TSP) sampled, per-product exhaustive probes run, then models trained on 8 public attributes (image count, variant count, price, published_at age, vendor, product type, tag count, body length). After correcting for class imbalance, held-out accuracy (Subimods 76.7%, TSP 90.7%) was no better than predicting the majority class. No attribute provided any lift over the base rate. Absence is random loss, not a systematic defect. **This kills the original pitch: a reliable diagnostic that identifies which products are invisible and why cannot be built from public product attributes.** |
| **"Half your catalogue is invisible to AI shopping agents" (standing claim)** | 4 Aug 2026 | **Restated, not killed.** The measured absence rate is 13–20% across three stores, not "half." The claim as originally framed overstates the finding. The absence is real and measured; the diagnostic value is not. |

---

## 4. What this is NOT — hard non-goals for Phases 0–1

Say so plainly if the project drifts toward any of these.

- No App Store listing. No billing integration. No multi-tenancy.
- No merchant OAuth or app install unless Phase 1 provably requires it (it does not, as of the §2.2 finding).
- No generic readiness scanner competing in the SEO app category.
- No SaaS scaffolding built "for later." Phase 3 architecture does not influence Phase 1 architecture.
- No sales partner, no commission structure, no equity discussion before Gate A.
- Nothing about Shopify or Hydrogen on the CV until the dataset and code are public.
- No claim, anywhere, that this work guarantees AI rankings. Rankings are controlled by Shopify, OpenAI and Google.

---

## 5. Phased structure and gates

The order is **publish → serve → productize**. The artifact is the deliverable, not a milestone toward a product. Each stage must justify the next on evidence, not on the plan. **Phase 1 is the only guaranteed return. Everything after it is an option, not a forecast.**

### Phase 0 — Vertical selection *(days, not weeks)*
Pick one vertical against four criteria: specs are relational not descriptive; enough public Shopify stores for real N; buyer has five-figure budget; incumbent SEO apps demonstrably do not solve it.
**Deliverable:** one vertical with evidence per criterion and the case against runners-up.

### Phase 1 — Measurement instrument and publication *(3 weeks)* ← **the artifact**
Build the retrieval measurement pipeline, run it over N public stores in the chosen vertical, publish four things: dataset, methodology, open-source code under his name, and analysis written for people in that vertical.
**Timebox is fixed.** If it does not fit, cut the scan scope — never the publication quality. *(The three-week timebox is withdrawn per §5.1 / DIRECTIVE-3 §6, 2 Aug 2026; milestones are now evidence-gated. The header text is retained for history.)*

**Acid test, carried from Directive #2:** if the scoring reduces to a loop over fields, the concept has collapsed back into the dead one and the project stops. Current assessment: it does not — the expected-match resolver (`TDD.md` C5) is a genuine retrieval and arbitration problem. This must be re-checked at first working prototype, not assumed. **Post-H9 note (4 Aug 2026):** the acid test held — the concept did not collapse into field presence. What collapsed instead was the commercial premise: H9 rejection means absence is not predictable from fields, so the "expected-match resolver" frame may need to shift from "which products are invisible and why" to "what fraction is absent, and how does it vary." The measurement method survives; the diagnostic pitch does not.

### 🚧 Gate A — before any Phase 2 work
**Threshold, agreed 28 July 2026, not movable:**

> Within **four weeks of publication** — **3 or more distinct inbound conversations** from named parties (brand, agency, or platform), of which **at least 1** involves someone with budget authority discussing their own catalogue.

**If unmet: stop.** The artifact and the credential are kept. **This is recorded now, in advance, as a successful outcome — not a failure.**

### Phase 2 — Service engagements *(only if Gate A passes)*
Paid remediation for individual brands, $15k–$80k range. This is contract work in the existing stack, so it serves the primary goal (income) rather than competing with it.

### 🚧 Gate B
Productization reopens only after **2–3 engagements reveal the same repeatable work** — informed by paying customers, not by a market thesis.

### Phase 3 — Productize
Not now. Not designed now.

### 5.1 Timebox withdrawal, evidence-gated milestones, and Gate A replacement *(updated per DIRECTIVE-4 §8, 2 Aug 2026; revised 6 Aug 2026 per DIRECTIVE-19 §5.5)*

**The three-week timebox is withdrawn.** The Phase 1 header above reads "*(3 weeks)*" for historical continuity; that calendar constraint no longer binds. DIRECTIVE-3 supersedes the Phase 0 / Phase 1 sequencing in this §5 and the three-week milestone plan in `TDD.md` §9.

**Milestones are now evidence-gated, not calendar-gated.** A stage advances when its pre-registered threshold is met on a hardened instrument at adequate n — not when a week elapses. If a measurement is inconclusive at current n, the response is a better run, not a deadline-driven declaration.

**Gate A — replaced per DIRECTIVE-4 §8 (2 Aug 2026).** The suspended "3+ distinct inbound conversations within four weeks of publication" threshold (agreed 28 July 2026) is replaced by a compound gate:

**Clock starts at first outbound contact of the demand probe**, not at publication. Publication is evidence-gated and unbounded; a gate anchored to it can never arm.

**Window: 8–10 weeks from first outbound contact.**

**G1 — the gate.** One paid pilot remediation at **≥ €2,500** (e.g. 100 SKUs).

The pilot route tests willingness to pay for the **fix**, which is where the business is, rather than for the diagnosis. **Free catalogue access, however enthusiastic, prices at zero and does not clear G1.** The €500 diagnostic tier was removed per DIRECTIVE-19 §5.5 (6 August 2026) — `OUTREACH-EMAILS.md` and the handoff both record it as removed, and `BLUEPRINT` §0 requires decisions written into the governing docs in the session they are made.

**G3 — early read, does not gate.** 3 of 25 contacted merchants confirm the problem is already known to them *and* name an internal owner. **G3 is unreachable at 5 contacts** (at 20% reply rate, P(≥3 replies) ≈ 5.8%) and **becomes live at 25 contacts** (P(≥3) ≈ 76%). The contact volume is scaled to 25 per DIRECTIVE-19 §5.1.

**Why compound.** G3 passing while G1 fails means the problem is real and the offer is wrong — a different instruction from "no demand." A single gate hides that.

**If G1 is unmet at the window's close: stop.** The artifact and the credential are kept. Recorded now, in advance, as a successful outcome.

---

## 6. Feature inventory

**Status definitions**

| Status | Meaning |
|---|---|
| `PENDING` | Specified, not started. |
| `BLOCKED` | Cannot start; blocking dependency named. |
| `PARTIAL` | Started; acceptance criteria not all met. |
| `IMPLEMENTED` | Acceptance criteria met and tests green. |
| `VERIFIED` | Implemented **and** confirmed against live Shopify behaviour. |

Nothing reaches `VERIFIED` on documentation reading alone. Several platform behaviours in `TDD.md` §2 are documented but unconfirmed at runtime; anything depending on them stays `IMPLEMENTED` at most until observed.

### Phase 0

| ID | Feature | Status | Notes |
|---|---|---|---|
| P0-1 | Vertical candidate longlist | `PENDING` | |
| P0-2 | Criterion evidence gathering (4 criteria) | `PENDING` | |
| P0-3 | Vertical decision + runner-up rationale | `BLOCKED` | on P0-2 |
| P0-4 | Public naming decision | `BLOCKED` | on P0-3 |

### Phase 1 — infrastructure

| ID | Feature | Status | Notes |
|---|---|---|---|
| I-1 | Shopify Partner account | `DONE` | Created (partners.shopify.com/5088237) |
| I-2 | Development store | `DONE` | Created (admin.shopify.com/store/catalogvector) |
| I-3 | Shopify AI Toolkit + Dev MCP | `DONE` | Adapted for Devin Desktop (Shopify plugins don't support Devin, but the three underlying components are tool-agnostic): (1) `shopify-dev-mcp` MCP server in `.devin/config.json` + `.mcp.json` (docs + GraphQL validation, no auth); (2) 4 Shopify AI Toolkit skills installed via `npx skills add` (`ucp`, `shopify-dev`, `shopify-storefront-graphql`, `shopify-use-shopify-cli`); (3) `@shopify/ucp-cli` v0.6.3 global, profile `catalogvector`. All verified operational. |
| I-4 | UCP agent profile + API key | `DONE` | **Lead-time risk resolved — zero lead time.** Spring '26 removed approval. Agent profile JSON hosted at `public/ucp-agent-profile.json` (catalog-only capabilities). API key generated instantly in Dev Dashboard → Catalogs. Auth helper in `src/lib/scanner/ucp-auth.ts` (Token tier, bearer token, runtime fetch). TDD §2.4 corrected. |
| I-5 | Postgres + pgvector instance | `PENDING` | Existing pattern from VectorMatch |
| I-6 | Redis (distributed rate limiting) | `PENDING` | Reuse of existing hard-global-cap pattern |
| I-7 | Self-hosted Inngest | `PENDING` | Existing pattern |
| I-8 | Repo, CI, licence (open source from commit 1) | `PARTIAL` | Repo created (`github.com/knezdusan/catalogvector`), CI baseline (GitHub Actions: biome/tsc/build/test), folder structure scaffolded, agent tooling configured. **MIT licence added** (resolves the open-source requirement; was the legal blocker — an unlicensed public repo is copyrighted/closed by default). |

### Phase 1 — pipeline

| ID | Feature | Status | Notes |
|---|---|---|---|
| C1 | Store frontier / sampling | `PARTIAL` | 3 stores enumerated via sitemap (Subimods 18,066, TSP 2,608, MAP 102,176). Sitemap parser deduplicates across `sitemap_products_*.xml` files. `/products.json` confirmed not exhaustive (fetch bug, not platform cap — register entry 11). |
| C2 | Storefront ingestion adapter | `PARTIAL` | `/products.json` pagination instrumented with I-1/I-2 invariants. Sitemap enumeration implemented (`scripts/enumerate-sitemap.ts`). Storefront product fetch with Zod validation. **`tags` schema bug fixed** (comma-separated string, not array — register entry 5). |
| C3 | Global Catalog MCP client | `PARTIAL` | Auth + profile wired, request shape implemented, verified via smoke test. UCP CLI operational. `search_catalog` with `filters.shops` scoping verified (U-4). Pagination with cursor + I-1 overlap detection. `total_count` confirmed as response budget, not match count (register entry 13). |
| C4 | Buyer query synthesis | `PARTIAL` | Partition-based enumeration method: vendor × product-type partition → scoped keyword queries. 692 queries for Subimods, 524 for TSP, 1,440 for MAP. Not the original C4 archetype design, but a working query-generation method that achieves 88.8% recall. |
| C5 | Expected-match resolver | `PENDING` | **The hard component.** pgvector + arbitration. Where the concept lives or dies. **H9 rejection casts doubt on whether this component has commercial value** — if absence is not predictable, the "expected match" may not be the right frame. |
| C6 | Retrieval scoring | `PARTIAL` | Presence/absence per product measured via partition enumeration + reference standard. recall_random = 88.8% (n=100, seed=42). Absence rate computed for 3 stores with 95% CI. Not the original recall@k/rank design — pivoted to enumeration-based absence measurement. |
| C7 | Distributed rate limiter | `PENDING` | Politeness is a published-methodology asset, not overhead. Probes used UCP CLI's built-in rate limiting; Redis-based C7 not yet implemented. |
| C8 | Orchestration (Inngest workflows) | `PENDING` | |
| C9 | Dataset export + publication pipeline | `PENDING` | |

### Phase 1 — publication

| ID | Feature | Status | Notes |
|---|---|---|---|
| PUB-1 | Dataset (aggregate + anonymised worked examples) | `PENDING` | Named per-store results **not** published — released privately on request, which is the lead-capture mechanism |
| PUB-2 | Methodology write-up | `PENDING` | Must state limitations explicitly, incl. metafield blind spot |
| PUB-3 | Open-source code | `PENDING` | Under his name |
| PUB-4 | Analysis for practitioners in the vertical | `PENDING` | |

### Parallel track (separate, cheap, sequenced after Phase 1)

| ID | Feature | Status | Notes |
|---|---|---|---|
| H-1 | One Hydrogen storefront, public on GitHub | `PENDING` | Two weekends, hard cap. Proves *storefront* competence, which the dataset does not, and which is what most Shopify job listings want. **Sequenced after the dataset** — both compete for the same two weekends and the dataset is the credential |

---

## 7. Technical implementation overview *(non-technical summary; detail in `TDD.md`)*

**Reused wholesale from VectorMatch** — this is why the build is three weeks and not three months. Pointing an existing engine at a new corpus is a change of data, not a change of skill.

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Next.js 16.3 (App Router, Cache Components, React Compiler) + React 19.2 + TypeScript (strict, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`) | Existing stack; 16.3 Cache Components enables Instant Navigations; React Compiler auto-memoizes |
| Lint/format | Biome 2 (replaces ESLint + Prettier) | Single tool, faster, agent-friendly |
| Styling | Tailwind CSS v4 | Existing stack; no component library yet (decide at first real UI) |
| Database | PostgreSQL + `pgvector` | Existing stack; retrieval is the core operation |
| ORM | Drizzle | Existing stack |
| Background work | Self-hosted Inngest | Long-running catalogue crawls without timeouts |
| Rate limiting | Redis, hard global cap across parallel workers | Already built; here it is also an ethics artifact |
| Validation | Zod on every external payload (incl. env at boot) | Third-party data is hostile by default |
| LLM routing | OpenRouter, multi-model, cost as first-class constraint | Existing pattern |
| Hosting | Hetzner via Coolify + Docker Compose | Existing infrastructure |
| Tests | Vitest (unit/boundary), Playwright + `@next/playwright` `instant()` helper (e2e, staged) | Existing stack; test-first per boundary; `instant()` guards Instant Navigation regressions |
| Agent tooling | `next-devtools-mcp` (MCP at `/_next/mcp`), `agent-browser` 0.27 (React DevTools introspection), `next-dev-loop` skill, `.devin/` project config, `AGENTS.md` pointing at bundled docs | Next.js 16.3 first-party agent features; keeps agents on version-matched docs and gives runtime visibility |
| CI | GitHub Actions (biome check, tsc, build, vitest) | Make tasks easy to verify (Devin best practice) |

**Two external surfaces, both requiring no merchant permission:**

1. **Storefront JSON** — public catalogue data on the merchant's own domain, no key. Blind spot: metafields are not exposed, so this shows the merchant's unstructured surface only.
2. **Global Catalog MCP** — `POST https://catalog.shopify.com/api/ucp/mcp`, JSON-RPC, requiring only a hosted UCP agent profile. This is the actual agent retrieval surface.

The measurement is the comparison between them: what the merchant has, versus what the agent can find.

---

## 8. Competitive landscape *(verified 28 July 2026; market layers added 3 Aug 2026 per DIRECTIVE-10 §4; re-verify before publication)*

**Three layers, recorded by directive (DIRECTIVE-10 §4, 3 Aug 2026):**

| Layer | Who occupies it | Price | CatalogVector's position |
|---|---|---|---|
| **Outcome monitoring** — does an assistant name you | 15+ platforms in 2026 (Profound, Scrunch, Promptwatch, Otterly, Alhena and others), some tracking ChatGPT Shopping carousels at SKU level | $29–$489/mo | **Crowded. Do not build here.** |
| **Causal diagnosis** — why you are not surfaced, and what to fix | Nobody productised. Practitioner estimates: $5,000–$15,000 per consulting engagement | $5–15k, manual | **This is the position** — priced, demanded, no product |
| **Supply-side Catalog mechanics** — what Shopify's inference did with your data, and whether you are retrievable | **Nobody.** Optimisation tools work on inputs a merchant can see (GMC feed, schema, copy, reviews). None measures what the Catalog actually returns | — | **Only this project has instrumentation here** |

**The synthesis:** monitoring tools measure the outcome and cannot explain it. This project measures the supply side and, until U-6-R, could not connect it to an outcome. Neither half is sufficient. Together they are a diagnosis. **Caveat (4 Aug 2026, post-H9):** the "causal diagnosis" position assumed absence was predictable from product attributes. H9 rejection means the diagnostic cannot identify *which* products are absent or *why* — only that absence exists at 13–20%. The commercial value of the diagnosis layer is reduced but not eliminated: the measurement itself (what fraction is absent, how it varies across stores) is still novel and unpublished.

| Player | What they measure | Threat level |
|---|---|---|
| **Shopify** — `commerce-readiness.shopify.io` | 31 checks, five categories, any URL, free, no login, impact-effort matrix | **High to generic scanning.** Low to outcome measurement. Sets the price of proxy scoring at zero |
| **Shopify Catalog ML pipeline** | Multimodal LLM attribute inference and cross-listing merging | **High to remediation value in consumer verticals.** Neutralised only in verticals where specs exist nowhere structured |
| **Shero Commerce** | 1,000 stores, page-level schema, avg 42/100, dataset published | **High to generic benchmarking.** Also the model to imitate on publishing openness |
| **CommerceShop** | 485 stores, 90 industries, 9 schema signals, avg 31.4/100 | Medium |
| **DC360 × ReFiBuy** | Top 1000 retailers, quarterly, avg 41.9/100 | **High — institutional and recurring** |
| **App Store SEO incumbents** | Avada, BOOSTER, Tapita, SearchPie et al., all shipping AEO/GEO | High to app products; irrelevant to a published paper |
| **AI-visibility monitoring** (Profound, Scrunch, Promptwatch, Otterly, Alhena, 15+ others) | Assistant output tracking, some at SKU level for ChatGPT Shopping carousels | **High to outcome monitoring.** Crowded, funded, $29–$489/mo. Do not compete here |
| **Supply-side Catalog mechanics** | — | **Unoccupied.** This is the position |

---

## 9. Risks

| Risk | Severity | How it is held |
|---|---|---|
| **Focus / income displacement** | **High** | Job search is the income plan; this runs underneath it. Any revenue table covering months 3–6 is drift and is to be named as such |
| **Enthusiasm outrunning evidence** (self-identified) | **High** | Gates are numeric and written in advance. Movement of a gate is itself the alarm |
| **Concept collapses to a checklist** | Medium | Acid test at first prototype (§5). If C5 reduces to field presence, stop |
| **Shopify absorbs the capability** | Medium | The skills transfer regardless of channel. Build for that, not for the channel |
| **Agent profile trust tier limits N** | Medium | Register I-4 immediately; scan scope is the flexible variable, publication quality is not |
| **Crawling at scale — ToS, rate limits** | Medium | Hard global cap, transparent user agent, contact address, opt-out honoured, crawl policy published in methodology |
| **Reputational — grading potential clients** | Medium | Named per-store results are never published. Aggregate public, specifics private on request |
| **Liability on technical specs** | Medium | Phase 2 contracts: data-structuring services only, explicit no-ranking-guarantee, limitation of liability. Manual verification for safety-relevant specs |
| **Methodology attacked on publication** | Medium | Outcome measurement is checkable by anyone with an agent profile. Publish the code and the queries. This is the reason to be open, not a reason to be closed |
| **Original pitch not supported by evidence** | **High** | H9 rejection (DIRECTIVE-17) means absence is random, not predictable from product attributes. The "reliable diagnostic for invisible products" pitch is dead. What survives: the measurement method (partition-based enumeration, 88.8% recall), the absence finding (13–20% across 3 stores), and the platform-facts register (13 entries). The publication must be framed around what was found, not what was promised. |

---

## 10. Expected outcome

**Guaranteed on completion of Phase 1** — a public dataset, methodology, open-source repository and written analysis; demonstrated competence in Shopify Admin/Storefront APIs, UCP, catalogue data modelling, LLM normalization at scale and published technical judgment; the CV honesty boundary cleared the day it goes public. No App Store rank, marketing budget or customer required for any of it.

**Optional, gated, not forecast** — inbound conversations (Gate A), then paid engagements (Phase 2), then possibly a product (Gate B, Phase 3).

**Explicitly not expected** — revenue inside three months. First paid engagement, if the thing works at all, lands month three or four.

---

## 11. Operating constraints

- Income comes first. If a contract lands, this track pauses; not the reverse.
- Nothing about Shopify or Hydrogen on the CV until dataset and code are public.
- Job title stays full-stack Next.js/TypeScript engineer who also ships commerce and AI. Not "Shopify Developer."
- The build must be genuinely his — heavy agentic tooling is fine, every architectural decision must be defensible in an interview.
- Test-first, with testable boundaries identified before implementation.
- Concrete specifics over strategy prose.

---

## 12. Change log

| Date | Version | Change |
|---|---|---|
| 2026-07-28 | 0.1.0 | Initial. Supersedes external "Vertical Catalog Intelligence" blueprint v1 and incorporates the Inkling audit's verified findings while rejecting its IP, GTM and partnership recommendations (§3). |
| 2026-07-31 | 0.2.0 | **Naming:** internal name `ShopifyAiScanner` → `CatalogVector`; repo `github.com/knezdusan/catalogvector` created. `CatalogVector` is the leading public-name candidate (satisfies §2.3 constraints); Phase 0 confirms per original gate. **Scaffold:** Next.js 16.3 preview project scaffolded with Cache Components, React Compiler, Biome 2 (replacing ESLint/Prettier), Tailwind v4, TypeScript strict+`verbatimModuleSyntax`+`noUncheckedIndexedAccess`. Folder structure replicated from §7/TDD §3 (route groups `(public)`/`admin`, `db`, `inngest`, `lib/scanner` C1–C7 stubs, `scripts/` probes). **Agent tooling (Next.js 16.3 first-party):** `next-devtools-mcp` via `/_next/mcp`, `agent-browser` 0.27 with React DevTools introspection, `next-dev-loop` skill, `.devin/` project config, `AGENTS.md` with Cache Components decision tree. **Foundation:** Zod env validation, Vitest + Playwright (`@next/playwright` `instant()` helper staged), `next.config.ts` hardened (security headers, `poweredByHeader: false`, `reactStrictMode: true`), GitHub Actions CI. I-8 status → `PARTIAL`. No pipeline code written; all C1–C9 remain `PENDING`/`BLOCKED`. |
| 2026-07-31 | 0.2.1 | **Licence:** MIT `LICENSE` added at repo root (copyright Dušan Knežević, 2026). An unlicensed public repo is copyrighted/closed by default — this resolves the open-source requirement and makes the repo a real portfolio piece. **Launch Day checklist:** added to TDD §11, led by the `robots: noindex` removal reminder (`src/app/layout.tsx` sets `robots: { index: false, follow: false }` for the placeholder; must flip before publication or the report is invisible to search). |
| 2026-08-01 | 0.3.0 | **Infrastructure:** I-1 (Partner account) and I-2 (dev store) created. **I-4 RESOLVED — lead-time risk eliminated:** Shopify Spring '26 removed the agent-profile approval requirement. The TDD's §2.4 auth model was wrong (conflated capability negotiation with authentication). Corrected: (1) agent profile = JSON file you host, no registration, included as `meta.ucp-agent.profile`; (2) auth = API key from Dev Dashboard → Catalogs (instant), exchanged for bearer token at runtime, sent as `Authorization: Bearer`. Token tier = highest rate limits. Profile created at `public/ucp-agent-profile.json` (catalog-only: search + lookup + global extension). Auth helper in `src/lib/scanner/ucp-auth.ts`. C3 stub updated with real request shape. Env updated with `SHOPIFY_CLIENT_ID`/`SHOPIFY_CLIENT_SECRET`. TDD §2.4 rewritten, U-1 marked RESOLVED. **Manual step remaining:** user must generate the API key in Dev Dashboard and add credentials to `.env.local`. |
| 2026-08-01 | 0.3.1 | **I-3 DONE — Shopify AI Toolkit adapted for Devin Desktop.** Shopify's plugin path supports Claude Code, Codex, Cursor, VS Code, Hermes — not Devin. Adapted the three underlying tool-agnostic components: (1) `shopify-dev-mcp` MCP server (stdio, docs + GraphQL validation, no auth) added to `.devin/config.json` + `.mcp.json`; (2) 4 Shopify AI Toolkit skills installed via `npx skills add` to `.agents/skills/` (`ucp`, `shopify-dev`, `shopify-storefront-graphql`, `shopify-use-shopify-cli` — 4 of 21 total, selected for Phase 1 relevance); (3) `@shopify/ucp-cli` v0.6.3 global, profile `catalogvector`. All verified operational: Dev MCP exposes 5 tools, UCP CLI returns real catalog results. AGENTS.md updated with Shopify tooling section. TDD §2.2 rewritten with Devin-adapted installation details and full skill inventory. |
| 2026-08-01 | 0.4.0 | **U-3, U-4 resolved; inference-accuracy reframe proposed and nullified; fitment-recall probe: PROVISIONAL coverage gap.** U-4 control experiment (5 tests, 250 products): (1) U-3 RESOLVED: shop GIDs resolvable via `search_catalog` + `variants[].seller.id`. (2) U-4 RESOLVED: `filters.shops` is a HARD RESTRICTION (0 containment violations, including page 2 with real cursor). `metadata.tech_specs` populated on ~99% of products. **Inference-accuracy reframe proposed** ("is Shopify's AI hallucinating wrong specs?") and **nullified** by probe (n=59 claims, 1.7% error, 0/9 fitment errors, 0/59 contradictions — well-functioning pipeline). **The real finding is coverage, not accuracy:** Shopify's inference drops vehicles from fitment lists. **Fitment-recall probe** (pre-registered threshold 0.80): raw mean recall 0.490 (n=12, 1 store). After stated-set audit: corrected mean recall **0.70** (n=12) / **0.64** (n=17 sensitivity). **Inferred-set audit passed:** all 6 products with zero inferred fitment checked by reading raw `tech_specs` — genuinely devoid of vehicle names, parametric specs only. Zeros are real platform failures. **Below 0.80 threshold but NOT DECLARED — PROVISIONAL.** Extractor needs hardening, matching needs handle/SKU (2/4 stores contributed zero rows), stratification didn't happen, sample is 1-2 stores. Pre-registration deviations: n=17 pulls from `all` after numbers visible (report n=12/0.70 as headline); MAPerformance title collapse ("Multiple Fitments" instead of vehicle names) is a coverage finding in its own right. §1, §2.2 reverted to v0.3.1 framing. §3 updated with both invalidated directions. TDD §6 `fitment_recall` is the primary metric. |
| 2026-08-02 | 0.4.1 | **DIRECTIVE-3 §6 executed — timebox withdrawn, milestones evidence-gated.** §5.1 added (per directive authorization, not self-initiated): the three-week timebox is withdrawn; milestones are now evidence-gated, not calendar-gated; Gate A's inbound-conversation threshold is suspended pending redefinition by directive — no replacement invented. §5 Phase 1 header annotated to point at §5.1. TDD §9 marked SUPERSEDED. §3 inference-accuracy entry (line 89, added in 0.4.0) verified present — not re-added. No pre-registered thresholds touched. DIRECTIVE-3 prerequisites (P-1, P-2, P-3) and Workstreams A/B not yet started. |
| 2026-08-02 | 0.5.0 | **DIRECTIVE-4 §11 executed — Gate A replaced, Stage 1 verdict withdrawn.** §5.1 updated: suspended Gate A replaced with compound gate (G1: two paid diagnostics ≥€500 or one pilot ≥€2,500; G3: 3/25 merchants confirm problem + name owner, non-gating early read). Clock starts at first outbound contact of demand probe, 8–10 week window. Stage 1 "COVERAGE GAP CONFIRMED" verdict withdrawn per §1.1 — sample non-compliant with registration (12 products from 1 store, not 20 across 3–4). Auto parts must be re-sampled. TDD §6 metric definitions marked directive-fixed, H2 truncation hypothesis pre-registered, tags schema finding recorded, dual scoring rules (prefix/strict) added. No pre-registered thresholds touched. §1, §2.2, §3 not touched. |
| 2026-08-02 | 0.5.1 | **DIRECTIVE-5 §7 — Stage 2 conclusion withdrawn, H3/H4 pre-registered, U-6 registered.** Stage 2 (Workstream B) ran with `filters.shops` scoping, removing all competitors — the experiment measured within-store findability, not commercial consequence. Stage 2 conclusion "fitment_recall has no commercial consequence" withdrawn as unsupported (DIRECTIVE-5 §0). TDD §2.7 — U-6 (does Global Catalog rank predict assistant output?) registered OPEN. TDD §6.1.3 — H3 unscoped competitive retrieval pre-registered. TDD §6.1.4 — H4 title-coverage hypothesis pre-registered. TDD §6.2 — exclusion rule: should_match removal requires should_not_match label. Version headers fixed to 0.5.0. §1, §2.2, §3, thresholds not touched. |
| 2026-08-02 | 0.5.2 | **DIRECTIVE-5 §3/§4/§6 Stage 2.5 executed — H4 SUPPORTED (best commercial news yet), H3 inconclusive, P-5 12/12 correct.** H4 (title-coverage): title-absent presence@50 = 0.125 vs title-present 0.833, difference 0.708 ≥ 0.40. Title dominates retrieval. Products without vehicles in their titles are structurally invisible to relational queries. The "Multiple Fitments" title pattern at MAPerformance is a store-wide title defect making their brake pad inventory unretrievable. **This is a merchant-caused failure with a merchant-side fix — independent of Shopify's inference pipeline.** Caveat: matched controls not same-category (no title-present MAP brake pad controls exist). H3 (unscoped competitive retrieval): difference 0.127 — inconclusive. Competitor displacement data produced. P-5 (addition-side audit): 12/12 inferred vehicles correct across 4 Kryptonite part numbers. Reports: `docs/reports/stage2-5-followback.md`, `docs/reports/p5-addition-audit.md`. §1, §2.2, §3, thresholds not touched. |
| 2026-08-02 | 0.6.0 | **DIRECTIVE-7 Stage 1 — pooled 0.500 withdrawn, H5 not testable, TDD §2.4 line 81 corrected.** DIRECTIVE-6 §2 (pooled 0.500 as "most important number") and §5.1 (merchant-facing artefact) both withdrawn. The 0.500 pooled figure is ~3× better than chance (S ≈ 300, baseline P(top 50) ≈ 0.167), not a defect signal. §3 clustering determination: response returns per-merchant rows, not UPID clusters — 900 products inspected, 0 with >1 variant or >1 seller, no UPID fields. H5 (offer attachment) NOT TESTABLE. TDD §2.4 line 81 ("Results cluster by UPID") corrected — response is per-merchant rows. §4 re-scoring: presence definition confirmed exact (handle identity), denominator recorded, presence@3/@10/@50 computed with denominator, competitor displacement scored, no fallback artefacts. No merchant-facing artefact produced. No outreach authorised. Report: `docs/reports/directive7-stage1-followback.md`. §1, §2.2, §3, thresholds not touched. |
| 2026-08-02 | 0.6.1 | **DIRECTIVE-7 Stage 2 — §5 depth-1000 re-run. 6 of 16 absent at depth, 3 absolutely invisible.** Frozen 18-query set re-issued unscoped, paginated to exhaustion (~300 results/query, depth-1000 cap never reached). 6 of 16 relational targets absent from entire result set. 3 targets absolutely invisible (absent from all 18 queries): paragon-pbp370 (no vehicle in title), icon-stage-4 and br-series-coilovers (vehicles in title). All 3 enrolled in Catalog (appear in scoped run) but absent unscoped — scoped retrieval was U-4 fallback. 2 of 3 absolutely invisible have adequate titles — invisibility not explained by title absence alone. §6 identical-part audit authorized. No merchant-facing artefact. Report: `docs/reports/directive7-stage2-followback.md`. §1, §2.2, §3, thresholds not touched. |
| 2026-08-02 | 0.6.2 | **DIRECTIVE-7 Stage 3 — §6 identical-part audit. Structural invisibility confirmed. 3/3 invisible targets are findable by brand/SKU but invisible by natural-language query.** Sub-study A (12 parts, brand+SKU): 12/12 TSP present. Sub-study B (3 invisible targets, multiple phrasings): all 3 findable by brand (rank 1–203) but absent from natural-language relational queries. Other merchants selling same brand ARE present. IV01 (BC Racing) `title_uninformative`, IV02 (ICON Stage 4) `unexplained` (title adequate, competitors present, TSP excluded), IV03 (Paragon) `title_uninformative`. IV02 is most concerning — title has brand+product+vehicle but still excluded from result set. Invisibility is query-dependent, not absolute. No merchant-facing artefact. Report: `docs/reports/directive7-stage3-followback.md`. §1, §2.2, §3, thresholds not touched. |
| 2026-08-02 | 0.6.3 | **DIRECTIVE-7 Stage 4 — H4-R replication REJECTED (floor effect). Store-level invisibility identified as third mechanism.** H4-R on Intec Racing: title-absent 0.021, title-present 0.000, difference -0.021 ≤ 0.15 → REJECTED. Both populations near zero — only 1 Intec product in 400 slots (below chance). Test confounded by store-level invisibility. H4 NOT disconfirmed — remains auto-parts finding (TSP+MAP). Three mechanisms of invisibility: (1) title-level (H4), (2) relevance-matching (IV02), (3) store-level (H4-R). Report: `docs/reports/directive7-stage4-followback.md`. §1, §2.2, §3, thresholds not touched. |
| 2026-08-03 | 0.7.0 | **DIRECTIVE-7 Stage 5 — COVERAGE GAP CONFIRMED on first compliant sample. DIRECTIVE-7 COMPLETE.** Fitment-recall re-run across 4 stores (TSP, MAP, Subimods, Springrates). 18 scored from 4 stores (meets DIRECTIVE-4 §1.2: 15+ / 3+). Corrected mean recall: prefix=0.385, strict=0.313 — both far below 0.80. First pre-registered rule to fire on a compliant sample. MAP "Multiple Fitments" products have 0 inferred vehicles. 12/19 extractor errors corrected. H2 not supported. §3 coverage gap now confirmed on compliant sample — original thesis validated. Report: `docs/reports/directive7-stage5-followback.md`. §1, §2.2, thresholds not touched. |
| 2026-08-03 | 0.8.0 | **DIRECTIVE-8-v2 §2 verdict corrections + §3 pipeline fix.** DIRECTIVE-6 (reconstructed) and DIRECTIVE-8-v2 committed at `d7879a0` and pushed. Verdict corrections: H2 INCONCLUSIVE (not "not supported"); H4-R UNRUN (not rejected — Intec run was not the registered design); Stage 5 causal claim struck (contradicted by H3 0.429 and TSP rank-1 with 0 inferred); root-cause claim struck (coverage gap and retrieval mechanisms are parallel, not causal); COVERAGE GAP accepted with caveat (per-store figures must not be quoted). §1, §2.2, §3, thresholds not touched. |
| 2026-08-03 | 0.8.1-0.8.4 | **DIRECTIVE-8-v2 COMPLETE — all 4 stages executed.** Stage 1: U-7 INCONCLUSIVE (unscoped floor exists, floor characterised as query-dependent, invisible targets NOT in floor). Page-boundary audit: 17/18 partial final pages, all exhausted naturally. Stage 2: 702 domains, top 20 hold 35% slots / 48% top-10. Scoped-fallback Jaccard 0.145 (low, genuine matching with partial fallback). Platform-facts register: 8 entries. Stage 3: Subimods completely invisible (0/10), Intec NOT invisible (8/10, Stage 4 floor was title-level not store-level). Three mechanisms corrected. Stage 4: H4-R INCONCLUSIVE — registered design cannot be executed at TSP (5.9% title-absent, no category with ≥6 of both populations). Relaxed matching uninterpretable (category mismatch). H4 not replicated. Reports: `docs/reports/directive8-stage{1,2,3,4}-followback.md`, `docs/reports/platform-facts-register.md`. |
| 2026-08-03 | 0.9.0 | **DIRECTIVE-9 — U-8 head/padding boundary, register corrections, Subimods strengthened.** U8-A (determinism): ~12-rank deterministic prefix for real queries, ~6 for nonsense. U8-B (token overlap): could not locate a boundary — real-query tails carry 0.40–0.98 fractional token overlap at every decile. Register entries 2 and 3 corrected (entry 2 restated to not claim retrieval consequence; entry 3 replaced U-1 finding). Subimods 0/10 strengthened: zero slots across ~8,600 slots, verbatim title queries fail. **Later compromised:** U8-A had a pagination bug (DIRECTIVE-14), World B restated (DIRECTIVE-16). |
| 2026-08-03 | 0.9.1 | **DIRECTIVE-10 — exposé pivot halted, U-6-R registered, market position recorded.** U-6 audit's "Catalog is a phantom" conclusion falsified by OpenAI's own help centre docs. U-6-R (12 queries × 3 assistants, buying-intent phrasing) pre-registered with four outcomes. Market position: causal diagnosis layer ($5–15k/engagement, no product) is the position. OAI-SearchBot robots.txt check registered. No PUB-* work on exposé premise. |
| 2026-08-03 | 0.9.2 | **DIRECTIVE-11 — U-6-R verdict SURFACE-DEPENDENT, H6 REJECTED, surface_trigger_rate identified.** Carousels render 7/12 queries. Shopify share corrected 28.6%→57.1% (Block D scored against wrong set; 4/7 cards unaudited). H6 (shop.app as proxy) REJECTED on pre-registered threshold. surface_trigger_rate (5/12 queries produced no card) identified as novel finding no monitoring platform measures. Authenticated pass required. Google AI tested on wrong surface (gemini.google.com, not AI Mode). |
| 2026-08-04 | 0.9.3 | **DIRECTIVE-12 — World B confirmed (later compromised), tail inspection, U-9 SAME INDEX, H6 finding 2 dissolved.** Tail Jaccard 0.90–1.00 across 4 real queries (World B — stable set, not random draw). Tail inspection: ranks 200–300 of real query are all brake pads for a Civic Si (genuine matches, not padding). H6 finding 2 dissolved — checking seller identity showed other merchants' listings, not Subimods'. U-9: Catalog API is the same index as assistants (Set A products appear in cards, Set B does not). Authenticated pass scored: 19 Shopify merchants across 3 assistants. §3 distinct products vs listings: 16 distinct from 300 (later found to be a dedup artefact — DIRECTIVE-14). |
| 2026-08-04 | 0.9.4 | **DIRECTIVE-13 — H7 registered (per-product syndication), partial syndication observed.** Subimods OEM parts in / aftermarket out on shop.app — discrimination inside one merchant's catalogue. H7: syndication decided per product, predictable from public attributes. §2.2 standing limitations added (partial competitive field, Google AI from Serbia, shop.app ≠ Catalog API). §3 distinct products vs listings question raised. |
| 2026-08-04 | 0.9.5 | **DIRECTIVE-14 — H7 WITHDRAWN, ID contradiction resolved, H8 REJECTED, register entry 10.** H7 withdrawn: shop.app finding misread as Catalog finding — all 5 aftermarket products present in Catalog API under Subimods' seller name. §1 ID contradiction: per-merchant rows confirmed (248 distinct IDs from 300, 0 shared across sellers) — register entry 1 correct, 16-distinct was dedup artefact. H8 (stale Catalog entries) REJECTED: 401 direct URL fetches, 0 404s. Register entry 10: no per-store Catalog enumeration endpoint exists (54% false-negative rate). |
| 2026-08-04 | 0.9.6 | **DIRECTIVE-15-v2 — evidence triage, runtime invariants I-1–I-6, sitemap enumeration, partition-based enumeration.** Evidence triage table: sound / compromised / never-established. Runtime invariants implemented (I-1: page overlap, I-2: sitemap count, I-3: seller.domain, I-4: surface provenance, I-5: domain normalisation, I-6: false-negative reporting). I-1 caught page overlap (1.6–8.1%) on first run — a previously unknown Catalog API property. Sitemap enumeration: Subimods 18,067, MAP 102,176. Partition-based enumeration: 524 queries, 98% recall (later found circular — DIRECTIVE-16). Register entries 11, 12. |
| 2026-08-04 | 0.9.7 | **DIRECTIVE-16 — 98% recall found circular, honest recall measured, /products.json fetch bug found, World B restated.** 98% recall was circular (ground truth selected by scoped search, scored against scoped search). recall_random = 97.4% (100 random from sitemap, per-product exhaustive probe). /products.json fetch bug: Subimods 5,250→18,066, MAP 7,750→25,000 (capped at 100 pages by Shopify). I-1 relaxed (20% ceiling, 15% abort). World B restated: head deterministic (Jaccard 0.97–1.00, top 50), tail not (0% positional agreement, Jaccard 0.48). Real-query tail = genuine products. Absence range: Subimods 23.0–27.5%. |
| 2026-08-04 | 1.0.0 | **DIRECTIVE-17 COMPLETE — absence measured across 3 stores, H9 REJECTED, original pitch not supported.** §1: false positive class eliminated (Catalog search cannot produce false positives by definition). Partition rebuilt from full 18,066-product metadata (692 queries, 265 vendors, 428 product types). recall_random = 88.8% against union presence (n=100, seed=42). Absence: Subimods 20.0% (95% CI 13.3–28.9%), TSP 13.0% (7.8–21.0%), MAP 17.0% (10.9–25.5%). §2: total_count = response budget (361–387 across 5 queries), not match count — register entry 13. §3: 3 absolutely invisible + 6 absent-at-depth targets confirmed genuinely absent. Subimods 0/10 restated: 9/12 were present from other sellers (syndication, not visibility failure). §5: H9 REJECTED — 300 random products per store, 8 public attributes, held-out accuracy (Subimods 76.7%, TSP 90.7%) = majority-class baseline. Absence is random loss, not predictable. **Original pitch ("reliable diagnostic for invisible products") not supported.** What survives: measurement method, platform-facts register (13 entries), absence finding (13–20%). Reports: `docs/reports/directive17-stage{1,2,3}-report.md`. §3 updated with 6 new invalidated directions. §6 feature status updated (C1–C4, C6 → PARTIAL). |
