# Platform-Facts Register — Shopify Catalog Documentation vs Observed Behaviour

**Compiled:** 3 August 2026 (DIRECTIVE-8-v2 §4.4)
**Source:** This project's payloads and transcripts, 2 August 2026 – 3 August 2026

Each entry: the documented claim, the observed behaviour, the JSON path or transcript that shows it, and the date established.

---

## 1. UPID clustering — documentation wrong

**Documented claim (TDD §2.4, line 81):** "Results cluster by Universal Product ID (UPID) with offers from multiple merchants."

**Observed behaviour:** The Catalog returns per-merchant rows, not UPID clusters. Each product row has exactly 1 variant with exactly 1 seller. There is no UPID field, no cluster object, and no multi-offer array. The same physical part appears as separate rows with different product IDs, one per merchant.

**Evidence:** `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` — 900 products across 18 queries inspected. 0 products with >1 variant. 0 products with >1 distinct seller. No UPID/cluster/offer fields at product level. Product-level keys: `description`, `id`, `media`, `metadata`, `options`, `price_range`, `rating`, `title`, `variants`.

**Date established:** 2 August 2026 (DIRECTIVE-7 Stage 1)

**Impact:** H5 (offer attachment hypothesis) was killed before it could be tested — the response shape doesn't contain the clusters the hypothesis required.

---

## 2. `tech_specs` population — documentation incomplete

**Documented claim:** Shopify's inference pipeline populates `tech_specs` from merchant data, including vehicle fitment information.

**Observed behaviour:** Shopify's inference drops 60–70% of vehicles the merchant states. On a 4-store sample (18 scored products), corrected mean fitment recall is 0.385 (prefix) / 0.313 (strict). MAP "Multiple Fitments" products have 0 inferred vehicles despite the merchant stating 9–22 vehicles per product in body text. 6 of 10 TSP products have zero inferred vehicles despite having the vehicle in the product title.

**Evidence:** `scripts/output/fitment-2026-08-03T14-47-40-634Z.json` — 18 scored products from 4 stores. `tech_specs` extracted via `extractVehicles()` and compared to merchant source text.

**Date established:** 3 August 2026 (DIRECTIVE-7 Stage 5)

**Impact:** The coverage gap is confirmed on a compliant sample. Products whose `tech_specs` omit a vehicle are unretrievable for that vehicle by any agent using the Catalog.

---

## 3. Agent-profile approval lead time — documentation wrong

**Documented claim:** Agent profile approval is fast (implied: same-day or near-term).

**Observed behaviour:** Agent profile approval took multiple days, well beyond the implied lead time.

**Evidence:** Project log — UCP agent profile `catalogvector` approval timeline.

**Date established:** 2 August 2026 (during DIRECTIVE-3/4 setup)

**Impact:** Project timeline affected. Documentation does not reflect actual approval time.

---

## 4. `tags` schema — documentation wrong

**Documented claim:** Shopify returns `tags` as an array.

**Observed behaviour:** Shopify returns `tags` as a comma-separated string, not an array. The Zod schema expected an array, silently failing 99% of matches for 3 of 4 stores.

**Evidence:** `scripts/probe-fitment-recall.ts` — tags schema fix applied during P-1 hardening. Storefront JSON confirmed: `tags` is a string like `"brake pads, honda civic, 2018"`, not `["brake pads", "honda civic", "2018"]`.

**Date established:** 2 August 2026 (DIRECTIVE-3 Stage 1, P-1 prerequisite)

**Impact:** 3 of 4 stores contributed zero rows to the fitment-recall probe until the schema was fixed. This is a verified platform fact recorded in TDD §2.7.

---

## 5. Scoped no-empty-result fallback — documentation incomplete

**Documented claim:** A scoped query with no matching products returns an empty result set.

**Observed behaviour (U-4):** A scoped query with no matching products returns the shop's general catalogue rather than an empty set. This is the "U-4 fallback."

**Evidence:** `scripts/probe-u4-shop-filter.ts` — 5 tests, 250 products. Scoped no-match queries return shop-general products.

**Date established:** 2 August 2026 (U-4 resolution)

**Impact:** Scoped retrieval data must be interpreted with care — high ranks in scoped runs may be fallback artefacts, not genuine matches.

---

## 6. `filters.shops` as a hard restriction — documentation correct

**Documented claim:** `filters.shops` restricts results to the specified shop(s).

**Observed behaviour (U-4):** `filters.shops` IS a hard restriction. 0 containment violations across 5 tests, including page 2 with real cursor. All products in scoped results belong to the specified shop.

**Evidence:** `scripts/probe-u4-shop-filter.ts` — containment verified.

**Date established:** 2 August 2026 (U-4 resolution)

**Impact:** Confirmed that scoped results are shop-restricted. The fallback (§5 above) returns shop-general products, but they are still from the specified shop.

---

## 7. Pagination behaviour — documentation incomplete

**Documented claim:** The Catalog paginates to a depth of 1000 (TDD §2.4).

**Observed behaviour:** The Catalog exhausts its result set at ~300 products per query (range 256–385 across 23 probes). The depth-1000 cap was never reached in any query. `has_next_page` is false at termination. `total_count` matches actual products returned (zero mismatches across 18 queries).

**Additional observation (U-7):** The Catalog returns ~300 products for ANY query, including complete nonsense ("zxqv flurbin widget" → 303 products). This is an unscoped floor — the tail of every result set is padding rather than matching. The floor is query-dependent (zero product-ID overlap between "brake pads" and nonsense), not a fixed fallback set.

**Evidence:**
- `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` — 18 queries, all exhausted at 273–385 products
- `scripts/output/u7-2026-08-03T16-02-58-140Z.json` — 5 U-7 probes, all exhausted at 256–359 products
- Floor characterisation: zero overlap between "brake pads" (345 products) and "zxqv flurbin widget" (303 products)

**Date established:** 2 August 2026 (DIRECTIVE-7 Stage 2), 3 August 2026 (DIRECTIVE-8-v2 Stage 1, U-7)

**Impact:** "Absent at depth" means absent from both the matching set AND the floor. The ~300 boundary is most likely a relevance threshold, not a hard count cap. The documented 1000-result limit was never tested because no query exceeded 385 products.

---

## 8. Scoped-fallback overlap — documentation incomplete

**Documented claim:** (Not explicitly documented — inferred from U-4)

**Observed behaviour:** Scoped queries return a mix of genuine matches and fallback products. Two semantically unrelated scoped queries against TSP ("brake pads for 2018 Honda Civic Si" and "lift kit for 2023 Ford F-150") have 14.5% Jaccard overlap (66 of 454 products in common). This is low overlap — the scoped retrieval is not pure fallback — but 66 products appearing in both sets indicates partial fallback in the tail.

**Evidence:** `scripts/probe-scoped-fallback.ts` — TSP scoped, two unrelated queries, Jaccard = 0.145.

**Date established:** 3 August 2026 (DIRECTIVE-8-v2 Stage 2, §4.3)

**Impact:** The Stage 2 scoped data is a mix of genuine matching and partial fallback. High ranks in scoped runs are likely genuine matches; the tail includes fallback products. This is not a pure U-4 artefact, but it is not clean data either.

---

## Summary

| # | Fact | Status | Date |
|---|---|---|---|
| 1 | UPID clustering | Documentation wrong — per-merchant rows | 2 Aug 2026 |
| 2 | `tech_specs` population | Documentation incomplete — 60–70% of vehicles dropped | 3 Aug 2026 |
| 3 | Agent-profile approval lead time | Documentation wrong — multi-day, not fast | 2 Aug 2026 |
| 4 | `tags` schema | Documentation wrong — string, not array | 2 Aug 2026 |
| 5 | Scoped no-empty-result fallback | Documentation incomplete — returns shop-general catalogue | 2 Aug 2026 |
| 6 | `filters.shops` hard restriction | Documentation correct | 2 Aug 2026 |
| 7 | Pagination behaviour | Documentation incomplete — exhausts at ~300, not 1000; unscoped floor exists | 2–3 Aug 2026 |
| 8 | Scoped-fallback overlap | Documentation incomplete — partial fallback, 14.5% overlap | 3 Aug 2026 |

**This is the one publishable artefact the project already owns outright.** It depends on no hypothesis, cannot be over-read, is checkable by anyone with an API key, and is exactly what establishes standing with the people who would eventually pay.
