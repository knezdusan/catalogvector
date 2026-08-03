# DIRECTIVE-11 Round Report

**Directive:** DIRECTIVE-11
**Date:** 3 August 2026
**Status:** COMPLETE (§2 authenticated pass postponed to next round per founder)

---

## Executive summary

DIRECTIVE-11 ran five tasks in order: pipeline check (§5), platform audit (§1), surface_trigger_rate (§3), H6 shop.app probe (§4), and authenticated pass (§2 — postponed). Four of five tasks completed; the fifth is founder-owned and postponed.

**Key results:**

| Task | Verdict | Headline |
|---|---|---|
| §5 U-8 (head/padding) | INCONCLUSIVE | Deterministic prefix of 12 ranks (real query), 6 ranks (nonsense). Token-overlap method cannot locate boundary. |
| §5 Register corrections | COMPLETE | Entry 2 restated (retrieval consequence not established). Entry 3 replaced (approval removed Spring '26, zero lead time). Entry 9 added (U-8 result). |
| §1 Platform audit | COMPLETE | Corrected Shopify share: 4/7 cards (57.1%), up from 2/7 (28.6%). D2's Quince and Brooklinen are Shopify Plus. |
| §3 surface_trigger_rate | COMPLETE | 10/24 (41.7%) overall. Varies from 0% (outdoor gear) to 66.7% (auto). Enough variation for a future hypothesis. |
| §4 H6 shop.app | REJECTED | shop.app finds 100% of products. Not a useful proxy for ChatGPT card appearance. |
| §2 Authenticated pass | POSTPONED | Founder-owned. Postponed to next round. |

---

## 1. §5 — Pipeline check and U-8

### 1.1 Missing directives

DIRECTIVE-6, DIRECTIVE-9, and DIRECTIVE-11 were committed to `docs/directives/`. DIRECTIVE-6 was previously a reconstruction from secondary sources; the original has replaced it. DIRECTIVE-9 was lost in transit (third pipeline loss). All three are now citable by commit hash.

### 1.2 U-8 status

U-8 was never executed. The register corrections (DIRECTIVE-9 §3) were never applied. Both were run in this cycle.

### 1.3 U-8 results

**U8-A (determinism):** The same query issued 3 times via UCP CLI.

| Query | Deterministic prefix | Post-prefix agreement |
|---|---|---|
| "brake pads for 2018 Honda Civic Si" (real) | 12 ranks | ~40% |
| "zxqv flurbin widget" (nonsense) | 6 ranks | ~5% |

The real query has a deterministic head of 12 ranks followed by a partially stochastic tail. The nonsense query has a shorter head (6 ranks) and a nearly fully stochastic tail.

**U8-B (token-overlap decay):** For each of 18 depth-1000 queries, the fraction of query tokens found in each product's title/tech_specs was computed by decile.

- Nonsense baseline: 0.0 (no tokens match)
- Real queries: fractional overlap stays at 0.40–0.98 throughout all deciles — never approaches the 0.0 baseline
- H = null for all 18 queries

**Why U8-B fails:** Auto parts query tokens ("brake", "honda", "civic") are too common in the auto parts catalog. Even padding products contain these tokens. The token-overlap method cannot locate the boundary in domain-specific catalogs where the floor shares the query's vocabulary. This is a methodological finding, not just a null result.

**Verdict: INCONCLUSIVE.** The two estimates cannot be compared — U8-B gives null for all 18 queries. U8-A gives H ≈ 12 for the one query tested.

**Practical implications:**
- `presence@10` is the safest metric (within the deterministic prefix)
- `presence@50` is part-padding (ranks 13-50 are partially stochastic)
- IV02 comparison (ranks 66-169) is unsafe — in the padding zone
- Domain concentration at top-10 is safe; top-20+ is contaminated
- Subimods at 0/10 is stronger — those queries should land in the head if anything does

Full report: `docs/reports/directive11-u8-report.md`

### 1.4 Register corrections

**Entry 2 (tech_specs population):** Struck "Products whose `tech_specs` omit a vehicle are unretrievable for that vehicle by any agent using the Catalog." Replaced with: "On a four-store sample, corrected mean fitment recall is 0.385. The retrieval consequence of this omission is not established; measured retrieval differences between products with and without inferred vehicles have been small."

**Entry 3 (agent-profile approval):** Struck "multi-day approval" claim (no artefact, contradicted by U-1). Replaced with U-1 finding: Spring '26 removed the approval requirement entirely. The profile is a hosted JSON file, auth is an API key exchanged for a bearer token, zero lead time.

**Entry 9 (head/padding boundary):** Added U-8 result — INCONCLUSIVE, deterministic prefix ~12 ranks, token-overlap method cannot locate boundary.

---

## 2. §1 — Platform audit of all card merchants

### 2.1 What was wrong

The U-6-R report scored Shopify merchant presence at 2/7 cards (28.6%). Two errors:

1. **D2 was scored against the wrong set.** The report recorded D2's carousel (Quince, Brooklinen, CB2, Casaluna) as "0 Shopify stores from scan set." The pre-registered rule says *Shopify merchants*, not *stores in our ten-store auto-parts scan set*. Quince and Brooklinen are both Shopify Plus.

2. **Four of seven cards were never audited for platform.** Only shop.app (obvious) and Springrates (in scan set) were identified. Redline360 (B2), PRL Motorsports (B3), MAPerformance (B3), and Coilovers.ca (C2) were never checked.

### 2.2 Corrected results

| Card | Product | Merchant | Platform | Method |
|---|---|---|---|---|
| A1 | Akebono ProACT | Akebono | Not Shopify | products.json 404 |
| A1 | — | Go-Parts | Not Shopify | 403, Cloudflare, no Shopify cookies |
| A3 | Motorcraft FL-500S | Motorcraft | Not Shopify | Ford OEM brand |
| B2 | BC Racing BR Series | BC Racing | Not Shopify | products.json 404 |
| B2 | — | Redline360 | **Shopify** | products.json returns JSON |
| B3 | PRL Motorsports HVI | PRL Motorsports | **Shopify** | products.json + powered-by: Shopify header |
| B3 | — | 27WON | Not Shopify (Squarespace) | robots.txt: "# Squarespace Robots Txt" |
| B3 | — | MAPerformance | **Shopify** | In scan set, confirmed |
| C2 | BC Racing via Springrates | Springrates | **Shopify** | In scan set, confirmed |
| C2 | — | Coilovers.ca | **Shopify** | products.json returns JSON |
| C3 | Eibach Sportline | Eibach | Not Shopify (Laravel) | Laravel session cookies |
| C3 | — | ProCivic | Not Shopify (Zen Cart) | zenid cookie, Apache |
| C3 | — | Phearable | Not Shopify | nginx, no Shopify indicators |
| D2 | Quince linen sheets | Quince | **Shopify Plus** (headless) | Web search confirms; Next.js frontend on CloudFront/S3 |
| D2 | Brooklinen linen sheets | Brooklinen | **Shopify Plus** | cdn.shopify.com preconnect, _shopify_y cookies, Shopify case study |
| D2 | CB2 linen sheets | CB2 | Not Shopify | Akamai enterprise |
| D2 | Casaluna linen sheets | Target | Not Shopify | Target enterprise |

### 2.3 Corrected Shopify share

**4 of 7 cards (57.1%) contained at least one identified Shopify merchant**, up from 2/7 (28.6%).

Cards with Shopify merchants: B2 (Redline360), B3 (PRL Motorsports, MAPerformance), C2 (Springrates, Coilovers.ca), D2 (Quince, Brooklinen).

**Verdict unchanged: SURFACE-DEPENDENT.** CATALOG PREDICTIVE required carousels in ≥8/12 (7/12 fails). The corrected Shopify share (57.1%) would meet the ≥50% threshold, but the carousel rate threshold is still failed.

Full audit: `scripts/output/u6r-platform-audit.json`

---

## 3. §3 — surface_trigger_rate

### 3.1 Method

24 queries total: 12 original U-6-R queries + 12 new queries across 3 verticals (home goods, beauty/personal care, outdoor gear). All run on ChatGPT (anonymous, no login). Record whether product card/carousel rendered, slot count, and query characteristics.

### 3.2 Results

**Overall trigger rate: 10/24 (41.7%)**

| Vertical | Queries | Cards | Rate |
|---|---|---|---|
| Auto (aggregator-dominated) | 3 | 2 | 66.7% |
| Auto (enthusiast/niche) | 3 | 2 | 66.7% |
| Auto (long-tail) | 3 | 2 | 66.7% |
| Home goods | 7 | 2 | 28.6% |
| Beauty/personal care | 4 | 2 | 50.0% |
| Outdoor gear | 4 | 0 | 0.0% |

| Intent phrasing | Queries | Cards | Rate |
|---|---|---|---|
| "Help me find…" | 13 | 7 | 53.8% |
| "Shop for…" | 11 | 3 | 27.3% |

### 3.3 Key findings

1. **The rate varies enough to warrant a hypothesis.** 0% (outdoor gear) to 66.7% (auto). Per the directive: "No hypothesis is registered yet. This cycle establishes whether the rate varies enough to be worth a hypothesis. If it is near-constant, say so and the idea dies here." The idea does not die here.

2. **Outdoor gear produced zero product cards** across 4 queries. Every query returned conversational text with inline citations to review sites (GearLab, REI, CleverHiker). This is the strongest vertical signal in the data.

3. **"Help me find" triggers cards at nearly 2x the rate of "Shop for"** (53.8% vs 27.3%). This is counterintuitive — "shop for" reads as more transactional — and may be an artefact of the small sample.

4. **The surface trigger is upstream of all AI-visibility monitoring.** If the carousel doesn't fire for a query class, no amount of catalog work, feed hygiene, or schema changes anything. This changes the diagnosis a merchant receives.

Full data: `scripts/output/surface-trigger-rate.json`

---

## 4. §4 — H6 shop.app probe

### 4.1 Design

20 products spanning the visibility range: 5 absolutely invisible (Subimods), 15 present in Catalog, 2 appeared in ChatGPT cards. Search shop.app for each product title, record presence and position. Compare against Catalog presence and ChatGPT card appearance.

### 4.2 Results

**All 20 products found on shop.app.** Every search returned 23-30 results. The #1 result was typically an exact or near-exact match.

| Metric | Value |
|---|---|
| Products resolvable on shop.app | 20/20 |
| Agreement with ChatGPT card appearance | 2/20 |
| Disagreement with ChatGPT card appearance | 18/20 |
| Disagreement with Catalog presence | 5/20 (Subimods products) |

### 4.3 Verdict: REJECTED

Agreement with ChatGPT card appearance is 2/20 (≤12 threshold for rejection). shop.app finds 100% of products — it cannot discriminate between products that appear in ChatGPT cards and those that don't.

### 4.4 Key findings

1. **shop.app is a product search engine, not a Catalog-syndication filter.** It finds everything. The hypothesis that it could serve as a "deterministic, cheaply scrapable proxy for Catalog-to-assistant reach" is falsified.

2. **Subimods products (absent from Catalog API) ARE on shop.app.** The 5 Subimods products that returned 0/10 on their own Catalog queries all returned 30 results on shop.app. The two systems have different coverage — shop.app is MORE inclusive than the Catalog.

3. **shop.app presence is necessary but not sufficient for ChatGPT card appearance.** Every product is on shop.app, but only some appear in cards. The gap between shop.app presence and ChatGPT card appearance must be explained by something else (ranking, relevance, merchant authority, query-to-product matching).

4. **The Catalog API remains the more discriminating instrument.** It returns 0 results for Subimods products while shop.app returns 30. The Catalog's ~300-product response with a deterministic head of ~12 is a tighter filter than shop.app's "find everything" search.

Full data: `scripts/output/h6-results.json`

---

## 5. §2 — Authenticated pass (POSTPONED)

The authenticated pass requires founder credentials for ChatGPT (logged in, US session), Copilot (sign-in required), and Google AI Mode. Per the directive: "This is the part that must be founder-owned, because Devin cannot hold credentials."

**Status: POSTPONED to next round per founder decision.** All other tasks in this round are complete. The authenticated pass will be the focus of the next session.

What remains:
- 12 queries on ChatGPT, logged in, US session, same phrasing as U-6-R
- 12 queries on Copilot (was 0/12, blocked by sign-in)
- 4 queries (A1, B3, C2, D2) on Google AI Mode (not gemini.google.com chat app)

---

## 6. Claim boundary — current state

**What can now be said (updated per DIRECTIVE-11 §6):**

> ChatGPT renders product cards for some shopping queries and not others — 7 of 12 in the original U-6-R probe, 10 of 24 in the expanded surface_trigger_rate probe. Shopify-catalogue-syndicated products do appear in those cards, including via `shop.app`. 4 of 7 cards in the original probe contained at least one identified Shopify merchant (57.1%). Appearance is inconsistent, and no store in a ten-store auto-parts sample blocks OpenAI's retrieval crawler. The surface trigger rate varies from 0% (outdoor gear) to 66.7% (auto parts) across verticals.

**What still cannot be said:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> "Products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."
> Any claim about Google or Copilot behaviour, in either direction, until §2.2 and §2.3 are closed.
> That shop.app presence predicts ChatGPT card appearance (H6 rejected).

---

## 7. Data files

| File | Content |
|---|---|
| `scripts/output/u8-results.json` | U8-A determinism + U8-B token-overlap results |
| `scripts/output/u8b-extracted.json` | Extracted depth-1000 products per query |
| `scripts/output/u6r-platform-audit.json` | Platform audit of all 7 ChatGPT card merchants |
| `scripts/output/surface-trigger-rate.json` | 24-query surface trigger rate observations |
| `scripts/output/h6-results.json` | H6 shop.app probe results |
| `scripts/output/h6-product-set.json` | 20 products selected for H6 probe |
| `docs/reports/directive11-u8-report.md` | Full U-8 report |
| `docs/reports/platform-facts-register.md` | Corrected register (entries 2, 3, 9) |
