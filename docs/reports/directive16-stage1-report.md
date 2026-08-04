# DIRECTIVE-16 Stage 1 Report — /products.json Re-fetch + Sitemap Verification

**Directive:** DIRECTIVE-16 §2
**Date:** 4 August 2026
**Stage:** 1 of 3
**Status:** COMPLETE

---

## Executive summary

**Register entry 11 as stated is withdrawn.** The "`/products.json` is not exhaustive" claim was describing our own fetch bug, not Shopify's behaviour. The prior fetch loop broke early on page boundaries for Subimods (page 21) and MAP (page 31). A fully instrumented re-fetch with retry, HTTP status logging, and page-size assertions shows:

- **Subimods:** 18,066 products (was 5,250). Terminated naturally on page 73 with 66 products. Sitemap = 18,067. **Shortfall: 1 product (0.006%).**
- **TSP:** 2,608 products (unchanged). Terminated naturally on page 11 with 108 products. Sitemap = 2,608. **Shortfall: 0.**
- **MAP:** 25,000 products (was 7,750). HTTP 400 at page 101 — Shopify caps at 100 pages × 250. Sitemap = 102,176. **Shortfall: 77,176 (75.5%) — genuine platform cap.**

The sitemap counts are verified: zero duplicate URLs, zero duplicate handles, zero non-product URLs across all three stores.

Register entry 11 is restated (see §3 below).

---

## 1. Method

### /products.json re-fetch

- Fetch `https://{domain}/products.json?limit=250&page={n}` for each store
- Write response to a temp file (avoids shell buffer overflow on large pages)
- Assert every non-terminal page returns exactly 250 products
- Log HTTP status, product count, retry count, and response size for every page
- Retry on failure with exponential backoff (1s, 4s, 9s)
- Report terminating page size and whether it terminated on a page boundary

### Sitemap verification

- Load the sitemap product JSON from DIRECTIVE-15 Stage 1
- Count total URLs, unique URLs, unique handles, duplicate URLs, duplicate handles, non-product URLs

---

## 2. Results

### 2.1 Subimods

| Metric | Old fetch | New fetch |
|---|---|---|
| Total products | 5,250 | **18,066** |
| Total pages | 21 | 73 |
| Terminating page size | 250 (boundary) | 66 (partial) |
| HTTP status at termination | unknown | 200 |
| Error | none recorded | none |

**The old fetch stopped at page 21 (5,250 = 21 × 250) — an exact page boundary.** The new fetch continued to page 73, where it terminated naturally with 66 products (a partial page). Every page from 1–72 returned exactly 250 products with HTTP 200.

**Subimods' `/products.json` is exhaustive.** 18,066 products vs 18,067 sitemap products — the 1-product difference is likely a product deleted between the sitemap fetch and the `/products.json` fetch.

### 2.2 TSP

| Metric | Old fetch | New fetch |
|---|---|---|
| Total products | 2,608 | 2,608 |
| Total pages | 10.432 | 11 |
| Terminating page size | unknown | 108 (partial) |
| HTTP status at termination | unknown | 200 |
| Error | none | none |

**TSP was already correct.** The old fetch reached the natural termination point. The new fetch confirms it: 11 pages, terminating with 108 products on page 11.

### 2.3 MAP

| Metric | Old fetch | New fetch |
|---|---|---|
| Total products | 7,750 | **25,000** |
| Total pages | 31 | 101 |
| Terminating page size | 250 (boundary) | 250 (boundary) |
| HTTP status at termination | unknown | **400** |
| Error | none recorded | HTTP 400 at page 101 |

**The old fetch stopped at page 31 (7,750 = 31 × 250) — an exact page boundary.** The new fetch continued to page 100 (25,000 products), then received HTTP 400 at page 101.

**MAP's `/products.json` is capped by Shopify at 25,000 products** (100 pages × 250). This is a genuine platform cap, not a fetch bug. MAP's sitemap has 102,176 products, so 77,176 (75.5%) are not accessible via `/products.json`.

### 2.4 Sitemap verification

| Store | Total URLs | Unique URLs | Unique handles | Duplicate URLs | Duplicate handles | Non-product URLs |
|---|---|---|---|---|---|---|
| Subimods | 18,067 | 18,067 | 18,067 | 0 | 0 | 0 |
| TSP | 2,608 | 2,608 | 2,608 | 0 | 0 | 0 |
| MAP | 102,176 | 102,176 | 102,176 | 0 | 0 | 0 |

**All sitemap counts are clean.** No duplicates, no non-product URLs. The sitemap parser deduplicates correctly across `sitemap_products_*.xml` files. MAP's 102,176 count is verified.

---

## 3. Register entry 11 — restated

**Old entry 11 (WITHDRAWN):**
> `/products.json` is not exhaustive — sitemap is the ground truth. Subimods: 70.9% missing. MAP: 92.4% missing. TSP: 0% missing. This becomes invariant I-2 and the ground truth for everything downstream.

**New entry 11 (REPLACEMENT):**
> `/products.json` is exhaustive for stores with fewer than 25,000 products. Shopify caps the endpoint at 100 pages × 250 = 25,000 products (HTTP 400 beyond page 100). Stores with more products have a genuine shortfall: MAP has 102,176 sitemap products but only 25,000 accessible via `/products.json` (75.5% missing). The prior claim of 70.9% shortfall for Subimods was a fetch bug — the corrected count is 18,066 vs 18,067 sitemap (0.006%). Sitemap remains the ground truth for stores above the 25,000 cap; `/products.json` is equivalent for stores below it.

**Downstream consequences:**

1. **Subimods enumeration (DIRECTIVE-15 §6.3):** The 524-query enumeration recovered 13,358 handles from a sitemap of 18,067. But `/products.json` has 18,066 products — the partition queries were built from the old 5,250-product fetch. Re-running with the full 18,066-product metadata (183 vendors + 342 product types) may change the partition set and the recall figure.

2. **I-2 invariant:** The invariant that asserts enumeration equals sitemap count needs to account for the 25,000 cap. For stores below the cap, `/products.json` equals sitemap. For stores above, sitemap is the only ground truth.

3. **Prior directives using `/products.json` as denominator:** The Subimods denominator was 5,250 instead of 18,066. The MAP denominator was 7,750 instead of 25,000. Every ratio computed from those denominators is wrong. The TSP denominator was correct.

---

## 4. Data files

| File | Content |
|---|---|
| `scripts/output/d16-products-json-refetch.json` | All three stores' re-fetch results with page logs |
| `scripts/output/d16-products-json-subimods.json` | Subimods: 18,066 products, 73 pages |
| `scripts/output/d16-products-json-tsp.json` | TSP: 2,608 products, 11 pages |
| `scripts/output/d16-products-json-map.json` | MAP: 25,000 products, 101 pages (capped) |
| `scripts/probe-d16-products-json-refetch.ts` | Re-fetch script with full instrumentation |

---

## 5. What this corrects

| Claim | Status |
|---|---|
| "Subimods: 70.9% missing from `/products.json`" | **WRONG** — was 0.006%, our fetch bug |
| "MAP: 92.4% missing from `/products.json`" | **PARTLY WRONG** — was 75.5%, partly our fetch bug (stopped at 7,750), partly genuine platform cap (25,000 limit) |
| "TSP: 0% missing" | **CORRECT** — unchanged |
| "`/products.json` is not exhaustive" | **RESTATABLE** — only for stores > 25,000 products |
| "Sitemap is the ground truth" | **STILL TRUE** for stores above the cap; equivalent to `/products.json` for stores below it |

---

## 6. Next stage

Stage 2: §4 I-1 relaxation with logging + register entry 12, then §3 re-run of exhaustion, real-query tail, and tail-range World B.
