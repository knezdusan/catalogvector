# Platform-Facts Register — Shopify Catalog Documentation vs Observed Behaviour

**Compiled:** 3 August 2026 (DIRECTIVE-8-v2 §4.4)
**Last revised:** 6 August 2026 (DIRECTIVE-19 §3.1)
**Source:** This project's payloads and transcripts, 2 August 2026 – 6 August 2026

Each entry: the documented claim, the observed behaviour, the JSON path or transcript that shows it, and the date established.

**Standing instruction (added 6 August 2026, DIRECTIVE-19 §3.1):** Every entry carries the directive that established it and the directive that last revised it. When a later finding supersedes an earlier one, the earlier entry is rewritten to the settled position and the supersession is marked with its date and directive — not silently edited. A register that shows its own corrections is more credible than one that appears to have always been right. The entry 7 / entry 13 contradiction existed because nothing forced a re-read when a later finding superseded an earlier one.

---

## 1. UPID clustering — documentation wrong

**Documented claim (TDD §2.4, line 81):** "Results cluster by Universal Product ID (UPID) with offers from multiple merchants."

**Observed behaviour:** The Catalog returns per-merchant rows, not UPID clusters. Each product row has exactly 1 variant with exactly 1 seller. There is no UPID field, no cluster object, and no multi-offer array. The same physical part appears as separate rows with different product IDs, one per merchant.

**Evidence:** `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` — 900 products across 18 queries inspected. 0 products with >1 variant. 0 products with >1 distinct seller. No UPID/cluster/offer fields at product level. Product-level keys: `description`, `id`, `media`, `metadata`, `options`, `price_range`, `rating`, `title`, `variants`.

**Date established:** 2 August 2026 (DIRECTIVE-7 Stage 1)
**Last revised:** 4 August 2026 (DIRECTIVE-14 §1 — reconfirmed with corrected pagination)

**Impact:** H5 (offer attachment hypothesis) was killed before it could be tested — the response shape doesn't contain the clusters the hypothesis required.

---

## 2. `tech_specs` population — documentation incomplete

**Documented claim:** Shopify's inference pipeline populates `tech_specs` from merchant data, including vehicle fitment information.

**Observed behaviour:** Shopify's inference drops 60–70% of vehicles the merchant states. On a 4-store sample (18 scored products), corrected mean fitment recall is 0.385 (prefix) / 0.313 (strict). MAP "Multiple Fitments" products have 0 inferred vehicles despite the merchant stating 9–22 vehicles per product in body text. 6 of 10 TSP products have zero inferred vehicles despite having the vehicle in the product title.

**Evidence:** `scripts/output/fitment-2026-08-03T14-47-40-634Z.json` — 18 scored products from 4 stores. `tech_specs` extracted via `extractVehicles()` and compared to merchant source text.

**Date established:** 3 August 2026 (DIRECTIVE-7 Stage 5)
**Last revised:** 4 August 2026 (DIRECTIVE-7 Stage 5 reconfirmed on compliant 4-store sample)

**Impact:** On a four-store sample, corrected mean fitment recall is 0.385. The retrieval consequence of this omission is not established; measured retrieval differences between products with and without inferred vehicles have been small.

---

## 3. Agent-profile approval — documentation corrected (Spring '26 removal)

**Documented claim (original):** Agent profile approval is required and has a lead time.

**Observed behaviour (U-1 resolution, 1 August 2026):** Spring '26 removed the approval requirement entirely. The profile is a hosted JSON file, auth is an API key exchanged for a bearer token, **zero lead time**. The original register entry claiming "multi-day approval" was based on a project-log note that predates the U-1 resolution and has no artefact.

**Evidence:** U-1 resolution (1 August 2026) — UCP CLI `catalogvector` profile is a hosted JSON file; `SHOPIFY_CLIENT_ID`/`SHOPIFY_CLIENT_SECRET` exchange for bearer token via `ucp auth token`. No approval step encountered.

**Date established:** 1 August 2026 (U-1 resolution). Register entry corrected 3 August 2026 (DIRECTIVE-9 §3.2, executed under DIRECTIVE-11 §5).
**Last revised:** 3 August 2026 (DIRECTIVE-9 §3.2 / DIRECTIVE-11 §5)

**Impact:** The original "multi-day approval" claim is struck. The genuine documentation correction is that approval is no longer required at all — a stronger finding than "approval is slow."

---

## 4. `tags` schema — documentation wrong

**Documented claim:** Shopify returns `tags` as an array.

**Observed behaviour:** Shopify returns `tags` as a comma-separated string, not an array. The Zod schema expected an array, silently failing 99% of matches for 3 of 4 stores.

**Evidence:** `scripts/probe-fitment-recall.ts` — tags schema fix applied during P-1 hardening. Storefront JSON confirmed: `tags` is a string like `"brake pads, honda civic, 2018"`, not `["brake pads", "honda civic", "2018"]`.

**Date established:** 2 August 2026 (DIRECTIVE-3 Stage 1, P-1 prerequisite)
**Last revised:** — (not revised since establishment)

**Impact:** 3 of 4 stores contributed zero rows to the fitment-recall probe until the schema was fixed. This is a verified platform fact recorded in TDD §2.7.

---

## 5. Scoped no-empty-result fallback — documentation incomplete

**Documented claim:** A scoped query with no matching products returns an empty result set.

**Observed behaviour (U-4):** A scoped query with no matching products returns the shop's general catalogue rather than an empty set. This is the "U-4 fallback."

**Evidence:** `scripts/probe-u4-shop-filter.ts` — 5 tests, 250 products. Scoped no-match queries return shop-general products.

**Date established:** 2 August 2026 (U-4 resolution)
**Last revised:** — (not revised since establishment)

**Impact:** Scoped retrieval data must be interpreted with care — high ranks in scoped runs may be fallback artefacts, not genuine matches.

---

## 6. `filters.shops` as a hard restriction — documentation correct

**Documented claim:** `filters.shops` restricts results to the specified shop(s).

**Observed behaviour (U-4):** `filters.shops` IS a hard restriction. 0 containment violations across 5 tests, including page 2 with real cursor. All products in scoped results belong to the specified shop.

**Evidence:** `scripts/probe-u4-shop-filter.ts` — containment verified.

**Date established:** 2 August 2026 (U-4 resolution)
**Last revised:** — (not revised since establishment)

**Impact:** Confirmed that scoped results are shop-restricted. The fallback (§5 above) returns shop-general products, but they are still from the specified shop.

---

## 7. Pagination behaviour — documentation incomplete (revised 6 Aug 2026)

**Documented claim:** The Catalog paginates to a depth of 1000 (TDD §2.4).

**Observed behaviour (settled position, 4 Aug 2026):** The Catalog returns approximately 300 products per query regardless of query semantics. Seven semantically unrelated queries — including a nonsense query ("zxqv flurbin widget") and real queries ("brake pads for 2018 Honda Civic Si", "organic coffee beans", "yoga mat", "dog leash", "mechanical keyboard", "garden hose") — all returned `total_count` values in a narrow range of 361–387. The ~300 exhaustion boundary is a **response budget cap, not a relevance boundary**. `has_next_page` is false at termination. The depth-1000 cap documented by Shopify was never reached because no query exceeds the ~300-product budget.

**Additional observation (U-7, still valid):** The Catalog returns ~300 products for ANY query, including complete nonsense. This is an unscoped floor — the tail of every result set is padding rather than matching. The floor is query-dependent (zero product-ID overlap between "brake pads" and nonsense), not a fixed fallback set.

**Prior reading (SUPERSEDED):** The original entry stated "the ~300 boundary is most likely a relevance threshold, not a hard count cap." This reading was superseded by the `total_count` probe (register entry 13, DIRECTIVE-17 §2), which showed that `total_count` is a response budget (361–387 across seven unrelated queries) rather than a count of matching products. The budget cap, not relevance exhaustion, explains the ~300 boundary. **Superseded 4 August 2026 (DIRECTIVE-17 §2, register entry 13). Revision recorded 6 August 2026 (DIRECTIVE-19 §3.1).**

**Evidence:**
- `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` — 18 queries, all exhausted at 273–385 products
- `scripts/output/u7-2026-08-03T16-02-58-140Z.json` — 5 U-7 probes, all exhausted at 256–359 products
- `scripts/output/d16-exhaustion.json` — `total_count` probe, first two queries (DIRECTIVE-16)
- DIRECTIVE-17 §2 probe output — remaining five queries (361–387 range)
- Floor characterisation: zero overlap between "brake pads" (345 products) and "zxqv flurbin widget" (303 products)

**Date established:** 2 August 2026 (DIRECTIVE-7 Stage 2), 3 August 2026 (DIRECTIVE-8-v2 Stage 1, U-7)
**Last revised:** 6 August 2026 (DIRECTIVE-19 §3.1 — prior reading marked superseded per DIRECTIVE-17 §2 / register entry 13)

**Impact:** "Absent at depth" means absent from the entire budget-limited result set. The ~300 boundary is a budget cap, not a relevance threshold. Rank-based absence testing is retired (DIRECTIVE-17 §3) because the budget fills with the best available matches regardless of query semantics, making rank positions unstable past ~50. See register entry 13 for the `total_count` probe that settled this.

---

## 8. Scoped-fallback overlap — documentation incomplete

**Documented claim:** (Not explicitly documented — inferred from U-4)

**Observed behaviour:** Scoped queries return a mix of genuine matches and fallback products. Two semantically unrelated scoped queries against TSP ("brake pads for 2018 Honda Civic Si" and "lift kit for 2023 Ford F-150") have 14.5% Jaccard overlap (66 of 454 products in common). This is low overlap — the scoped retrieval is not pure fallback — but 66 products appearing in both sets indicates partial fallback in the tail.

**Evidence:** `scripts/probe-scoped-fallback.ts` — TSP scoped, two unrelated queries, Jaccard = 0.145.

**Date established:** 3 August 2026 (DIRECTIVE-8-v2 Stage 2, §4.3)
**Last revised:** — (not revised since establishment)

**Impact:** The Stage 2 scoped data is a mix of genuine matching and partial fallback. High ranks in scoped runs are likely genuine matches; the tail includes fallback products. This is not a pure U-4 artefact, but it is not clean data either.

---

## 9. Head/padding boundary — revised 6 Aug 2026 (corrected from corrupted U8-A data)

**Documented claim:** The Catalog returns a match set for a query.

**Observed behaviour (settled position, DIRECTIVE-16):** The Catalog response is a deterministic head followed by a non-deterministic tail. **Head (ranks 0–50): 100% positional agreement** across repeated identical requests — the same products in the same order. **Tail (ranks 50+): 0% positional agreement** — the same products may appear but in different order, and the set membership shifts. **Set Jaccard ≈ 0.48** in the tail — roughly half the products overlap between runs, but positions are unstable.

**Prior reading (SUPERSEDED):** The original entry published "deterministic prefix ~12 ranks" for real queries and "~6 ranks" for nonsense queries. These figures came from the **corrupted U8-A run** (DIRECTIVE-9 §1). The corruption was caused by a comma-joined `--set '/query=...,cursor=...'` cursor bug that put the cursor into the query string, breaking pagination. The API returned the first ~10 products repeatedly, giving 16 distinct product IDs instead of the real ~248. The Jaccard overlap of 0.90–1.00 was measuring overlap of the same 10–16 products across runs, not 300 distinct products. **The "~12 rank deterministic prefix" figure is struck.** The corrected measurement (DIRECTIVE-16) shows the deterministic head extends to ~50 ranks, not ~12.

**World B was re-validated, not withdrawn.** DIRECTIVE-16 §3.3 re-ran the World B probe with correct pagination and confirmed: the head (top 50) is a stable set with stable ordering (Jaccard 0.97–1.00), and the tail is a stable set with unstable ordering (0% positional agreement, Jaccard 0.48). The "16 distinct products" finding from DIRECTIVE-13 §3 was a dedup artefact of the corrupted run and is withdrawn; the World B finding itself stands.

**Evidence:**
- `scripts/output/d16-world-b-tail.json` — DIRECTIVE-16 §3.3, corrected World B measurement
- `scripts/output/d16-real-query-tail.json` — DIRECTIVE-16, real-query tail characterisation
- `scripts/output/u8-results.json` — original U8-A/U8-B data (partially corrupted, retained for provenance)
- `scripts/output/d14-id-contradiction.json` — fresh fetch with correct pagination (300 rows, 248 distinct IDs)

**Date established:** 3 August 2026 (DIRECTIVE-9 §1, executed under DIRECTIVE-11 §5). Corrected 4 August 2026 (DIRECTIVE-14 §1 — corruption identified). **Revised 6 August 2026 (DIRECTIVE-19 §3.1 — replaced corrupted figures with DIRECTIVE-16 measurements, World B re-validation recorded).**
**Last revised:** 6 August 2026 (DIRECTIVE-19 §3.1)

**Impact:** `presence@50` is the safest metric — it sits within the deterministic head. Ranks beyond 50 are non-deterministic in both ordering and partial membership. Rank-based absence testing is retired (DIRECTIVE-17 §3, register entry 13). The IV02 comparison (competitors at ranks 66–169) is unsafe — those ranks are in the non-deterministic tail. Domain concentration at top-50 is safe; beyond that is contaminated.

---

## 10. No per-store Catalog enumeration endpoint — platform limitation (revised 6 Aug 2026)

**Documented claim:** (Not documented — discovered by this project)

**Observed behaviour:** No per-store Catalog enumeration endpoint exists. The Catalog API's `search_catalog` is relevance-ranked, not exhaustive. A scoped search with `filters.shops` returns ~300 results per query (the top results matching the query, not all products from that shop). `lookup_catalog` takes opaque Catalog product IDs (format `gid://shopify/p/{base64}`) that do not correspond to store product IDs (numeric, from `/products.json`). No conversion endpoint exists. Naive keyword search carries a measured **54% false-negative rate** — 27 of 50 sampled "absent" products were actually present when searched by exact title.

**However, partition-based enumeration works around this.** By building scoped queries from the store's own vendor × product-type partition, 88–98% recall is achievable depending on catalogue size (97.7% at 2,608 products, 88.8% at 18,066, 56.6% at 102,176). **The barrier is effort and calibration, not impossibility.** The method requires building a partition from store metadata, issuing hundreds of scoped queries, and validating against an independent reference standard — work that takes hours per store but is fully reproducible.

**Evidence:** `scripts/output/h7-membership-validation.json` — 50 "absent" products checked by exact title search, 54% false negative rate. `scripts/output/d17-enumeration-handles.json` — 13,257 handles from 692-query partition enumeration (Subimods, 88.8% recall). `scripts/output/d17-tsp-enumeration.json` — TSP enumeration (97.7% recall).

**Date established:** 4 August 2026 (DIRECTIVE-13 §1, recorded as register entry 10 per DIRECTIVE-14 §6)
**Last revised:** 6 August 2026 (DIRECTIVE-19 §3.1 — restated to include partition-based enumeration as a working method, per RULINGS §1)

**Impact:** The barrier to per-store Catalog auditing is effort and calibration, not a platform impossibility. This is both a limitation on naive approaches and a real lead-time advantage for this project's partition-based method. The reverse direction (checking if a Catalog handle is still live on the storefront) does not have this problem — it is a direct fetch of a known URL (H8).

---

## 11. `/products.json` exhaustiveness — restated (was: "not exhaustive")

**Documented claim:** (Not documented — discovered by this project)

**Observed behaviour (CORRECTED):** `/products.json` is exhaustive for stores with fewer than 25,000 products. Shopify caps the endpoint at 100 pages × 250 = 25,000 products (HTTP 400 beyond page 100). The prior claim of massive shortfalls for Subimods (70.9%) and MAP (92.4%) was caused by a fetch bug in this project's earlier scripts — the fetch loop broke early on page boundaries (Subimods stopped at page 21, MAP at page 31).

A fully instrumented re-fetch (DIRECTIVE-16 §2) with retry, HTTP status logging, and page-size assertions shows:

| Store | Sitemap | Old `/products.json` | New `/products.json` | Real shortfall | Cause |
|---|---|---|---|---|---|
| Subimods | 18,067 | 5,250 | 18,066 | 1 (0.006%) | Old fetch truncated at page 21 |
| TSP | 2,608 | 2,608 | 2,608 | 0 (0%) | Was already correct |
| MAP | 102,176 | 7,750 | 25,000 | 77,176 (75.5%) | Old fetch truncated at page 31; platform caps at 25,000 |

Subimods terminated naturally on page 73 with 66 products (partial page). TSP terminated naturally on page 11 with 108 products. MAP received HTTP 400 at page 101 — a genuine platform cap at 25,000 products.

**Evidence:** `scripts/output/d16-products-json-refetch.json` — all three stores re-fetched with full page logs. `scripts/output/d16-products-json-{store}.json` — per-store results with all handles.

**Date established:** 4 August 2026 (DIRECTIVE-15 §5, restated DIRECTIVE-16 §2)
**Last revised:** — (not revised since D16 restatement)

**Impact:** Sitemap remains the ground truth for stores above the 25,000 cap (MAP). For stores below the cap (Subimods, TSP), `/products.json` is equivalent to the sitemap. The prior claim that "every prior directive using `/products.json` as a denominator was working with an incomplete set" is correct for MAP (denominator was 7,750 instead of 25,000) but wrong for Subimods (denominator was 5,250 instead of 18,066 — the full set was always available, our fetch was broken). I-2 invariant must account for the 25,000 cap.

---

## 12. Catalog API cursor pagination overlap — platform behaviour

**Documented claim:** (Not documented — discovered by this project)

**Observed behaviour:** The Catalog API's cursor-based pagination has inter-page overlap because the relevance ranking shifts between requests. The cursor encodes an offset (`eyJvZmZzZXQiOjUz...` = `{"offset":53,...}`), but the products at that offset can overlap with the previous page by 1–9 products per 50-product page.

Per-query overlap rates (DIRECTIVE-15 §4.4, depth-1000 transcript):

| Query | Scanned | Distinct | Duplicates | Dupe % |
|---|---|---|---|---|
| Q01 | 284 | 271 | 13 | 4.6% |
| Q02 | 310 | 303 | 7 | 2.3% |
| Q03 | 331 | 320 | 11 | 3.3% |
| Q04 | 317 | 300 | 17 | 5.4% |
| Q05 | 315 | 310 | 5 | 1.6% |
| Q06 | 273 | 262 | 11 | 4.0% |
| Q07 | 385 | 354 | 31 | 8.1% |
| Q08 | 301 | 293 | 8 | 2.7% |
| Q09 | 308 | 295 | 13 | 4.2% |
| Q10 | 316 | 311 | 5 | 1.6% |
| Q11 | 300 | 292 | 8 | 2.7% |
| Q12 | 286 | 268 | 18 | 6.3% |
| Q13 | 303 | 297 | 6 | 2.0% |
| Q14 | 343 | 329 | 14 | 4.1% |
| Q15 | 315 | 303 | 12 | 3.8% |
| Q16 | 296 | 290 | 6 | 2.0% |
| Q17 | 313 | 303 | 10 | 3.2% |
| Q18 | 357 | 345 | 12 | 3.4% |
| **Total** | **5,653** | **5,446** | **207** | **3.7%** |

Range: 1.6–8.1%. Mean: 3.7%. This is not the U8-A bug (which returned 100% identical pages) — it is a small overlap at page boundaries due to unstable relevance ranking.

**Evidence:** `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` — transcript with 123 page entries, duplicate IDs counted across all 18 queries.

**Date established:** 4 August 2026 (DIRECTIVE-15 §4.4, recorded as register entry 12 per DIRECTIVE-16 §4)
**Last revised:** — (not revised since establishment)

**Impact:** I-1 invariant relaxed to allow overlap up to 15% (abort threshold) with a 20% ceiling. Every overlap event is logged so the distribution keeps being measured. A second relaxation requires a directive. The U8-A signature (100% overlap) sits far above both thresholds.

---

## 13. `total_count` is a response budget, not a match count

**Documented claim:** (Not documented — discovered by this project)

**Observed behaviour:** The Catalog API's `pagination.total_count` field returns approximately the same value (~360–390) regardless of query semantics. Seven semantically unrelated queries all return values in a narrow range:

| Query | `total_count` |
|---|---|
| brake pads for 2018 Honda Civic Si | 362 |
| zxqv flurbin widget (nonsense) | 361 |
| organic coffee beans | 361 |
| yoga mat | 373 |
| dog leash | 387 |
| mechanical keyboard | 385 |
| garden hose | 381 |

Range: 361–387. A nonsense query and a real query return nearly identical values (361 vs 362). This is not what a count of matching products looks like — it is a response budget.

**Evidence:** `scripts/output/d16-exhaustion.json` (first two queries), §2 probe output (remaining five queries, DIRECTIVE-17 §2).

**Date established:** 4 August 2026 (DIRECTIVE-17 §2)
**Last revised:** — (not revised since establishment; this entry superseded entry 7's prior reading)

**Impact:** For queries with more than ~360 genuine matches, the result set is truncated by budget, not exhausted by relevance. The tail inspection showing genuine brake pads at rank 200–220 is consistent with this: the budget is filled with the best available matches. The CAP reading of U-7 (register entry 7) is settled — the ~300 exhaustion boundary is a budget cap, not a relevance boundary. Rank-based absence testing is retired (DIRECTIVE-17 §3).

---

## Summary

| # | Fact | Status | Established | Last revised |
|---|---|---|---|---|
| 1 | UPID clustering | Documentation wrong — per-merchant rows. Confirmed 4 Aug 2026: 300 rows = 248 distinct IDs, 0 with >1 variant, 0 with >1 seller | 2 Aug 2026 (D7) | 4 Aug 2026 (D14) |
| 2 | `tech_specs` population | Documentation incomplete — 60–70% of vehicles dropped; retrieval consequence not established | 3 Aug 2026 (D7) | 4 Aug 2026 (D7 S5) |
| 3 | Agent-profile approval | Documentation corrected — approval removed Spring '26, zero lead time | 1 Aug 2026 (U-1) | 3 Aug 2026 (D9/D11) |
| 4 | `tags` schema | Documentation wrong — string, not array | 2 Aug 2026 (D3) | — |
| 5 | Scoped no-empty-result fallback | Documentation incomplete — returns shop-general catalogue | 2 Aug 2026 (U-4) | — |
| 6 | `filters.shops` hard restriction | Documentation correct | 2 Aug 2026 (U-4) | — |
| 7 | Pagination behaviour | **REVISED 6 Aug 2026** — ~300 boundary is a budget cap, not a relevance threshold (superseded by entry 13). Prior reading marked superseded | 2 Aug 2026 (D7) | 6 Aug 2026 (D19) |
| 8 | Scoped-fallback overlap | Documentation incomplete — partial fallback, 14.5% overlap | 3 Aug 2026 (D8) | — |
| 9 | Head/padding boundary | **REVISED 6 Aug 2026** — head 0–50 at 100% positional agreement, tail 0% positional agreement, set Jaccard ≈0.48. Prior "~12 rank" figure from corrupted U8-A run struck. World B re-validated, not withdrawn | 3 Aug 2026 (D9) | 6 Aug 2026 (D19) |
| 10 | No per-store enumeration | **REVISED 6 Aug 2026** — no endpoint exists; naive search 54% FNR; partition-based enumeration reaches 88–98% recall. Barrier is effort and calibration, not impossibility | 4 Aug 2026 (D13) | 6 Aug 2026 (D19) |
| 11 | `/products.json` exhaustiveness | **RESTATED** — exhaustive for stores < 25,000 products. Platform caps at 25,000 (HTTP 400 at page 101). Prior shortfall was our fetch bug | 4 Aug 2026 (D15) | 4 Aug 2026 (D16) |
| 12 | Cursor pagination overlap | Platform behaviour — 1.6–8.1% overlap per page, mean 3.7%. Not the U8-A bug (100%). I-1 relaxed to 15% abort / 20% ceiling | 4 Aug 2026 (D15) | — |
| 13 | `total_count` is a response budget | ~360–390 across 7 unrelated queries. Not a match count. Rank-based absence retired. Supersedes entry 7's prior reading | 4 Aug 2026 (D17) | — |

**This is the one publishable artefact the project already owns outright.** It depends on no hypothesis, cannot be over-read, is checkable by anyone with an API key, and is exactly what establishes standing with the people who would eventually pay.
