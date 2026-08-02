# CatalogVector — Project Blueprint

| | |
|---|---|
| **Document** | Blueprint (governing, non-technical) |
| **Companion** | `TDD.md` (governing, technical) |
| **Version** | 0.6.2 |
| **Date** | 2 August 2026 |
| **Owner** | Dušan Knežević (solo) |
| **Status** | Phase 0 not started. Infrastructure I-1–I-4 done. U-3, U-4 resolved. Inference-accuracy reframe nullified (1.7% error, n=59). **Fitment-recall probe: PROVISIONAL coverage gap** (corrected mean recall ~0.70 < 0.80, n=12, 1-2 stores; inferred-set audit passed; re-run required before declaration). Original thesis holds: specs visible ≠ products retrievable. No pipeline code written. |
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

**Acid test, carried from Directive #2:** if the scoring reduces to a loop over fields, the concept has collapsed back into the dead one and the project stops. Current assessment: it does not — the expected-match resolver (`TDD.md` C5) is a genuine retrieval and arbitration problem. This must be re-checked at first working prototype, not assumed.

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

### 5.1 Timebox withdrawal, evidence-gated milestones, and Gate A replacement *(updated per DIRECTIVE-4 §8, 2 Aug 2026)*

**The three-week timebox is withdrawn.** The Phase 1 header above reads "*(3 weeks)*" for historical continuity; that calendar constraint no longer binds. DIRECTIVE-3 supersedes the Phase 0 / Phase 1 sequencing in this §5 and the three-week milestone plan in `TDD.md` §9.

**Milestones are now evidence-gated, not calendar-gated.** A stage advances when its pre-registered threshold is met on a hardened instrument at adequate n — not when a week elapses. If a measurement is inconclusive at current n, the response is a better run, not a deadline-driven declaration.

**Gate A — replaced per DIRECTIVE-4 §8 (2 Aug 2026).** The suspended "3+ distinct inbound conversations within four weeks of publication" threshold (agreed 28 July 2026) is replaced by a compound gate:

**Clock starts at first outbound contact of the demand probe**, not at publication. Publication is evidence-gated and unbounded; a gate anchored to it can never arm.

**Window: 8–10 weeks from first outbound contact.**

**G1 — the gate. Either route clears:**
- Two paid diagnostics at **≥ €500 each**, or
- One paid pilot remediation at **≥ €2,500** (e.g. 100 SKUs)

€500 sits where a manager can approve without procurement — low enough to be a real decision, high enough that nobody pays it to be polite. The pilot route matters because it tests willingness to pay for the **fix**, which is where the business is, rather than for the diagnosis. **Free catalogue access, however enthusiastic, prices at zero and does not clear G1.**

**G3 — early read, does not gate.** 3 of 25 contacted merchants confirm the problem is already known to them *and* name an internal owner.

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
| C1 | Store frontier / sampling | `PENDING` | How N stores are discovered and qualified |
| C2 | Storefront ingestion adapter | `PENDING` | `/products.json` + JSON-LD; handles disabled endpoints |
| C3 | Global Catalog MCP client | `PENDING` | I-4 resolved; auth + profile wired, request shape implemented, verified via smoke test |
| C4 | Buyer query synthesis | `PENDING` | Vertical vocabulary `PENDING — PHASE 0` |
| C5 | Expected-match resolver | `PENDING` | **The hard component.** pgvector + arbitration. Where the concept lives or dies |
| C6 | Retrieval scoring | `PENDING` | recall@k, rank, near-miss taxonomy |
| C7 | Distributed rate limiter | `PENDING` | Politeness is a published-methodology asset, not overhead |
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

## 8. Competitive landscape *(verified 28 July 2026 — re-verify before publication)*

| Player | What they measure | Threat level |
|---|---|---|
| **Shopify** — `commerce-readiness.shopify.io` | 31 checks, five categories, any URL, free, no login, impact-effort matrix | **High to generic scanning.** Low to outcome measurement. Sets the price of proxy scoring at zero |
| **Shopify Catalog ML pipeline** | Multimodal LLM attribute inference and cross-listing merging | **High to remediation value in consumer verticals.** Neutralised only in verticals where specs exist nowhere structured |
| **Shero Commerce** | 1,000 stores, page-level schema, avg 42/100, dataset published | **High to generic benchmarking.** Also the model to imitate on publishing openness |
| **CommerceShop** | 485 stores, 90 industries, 9 schema signals, avg 31.4/100 | Medium |
| **DC360 × ReFiBuy** | Top 1000 retailers, quarterly, avg 41.9/100 | **High — institutional and recurring** |
| **App Store SEO incumbents** | Avada, BOOSTER, Tapita, SearchPie et al., all shipping AEO/GEO | High to app products; irrelevant to a published paper |
| **Vertical outcome measurement** | — | **Unoccupied.** This is the position |

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
