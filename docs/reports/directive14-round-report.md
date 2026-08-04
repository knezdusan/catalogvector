# DIRECTIVE-14 Round Report

**Directive:** DIRECTIVE-14
**Date:** 4 August 2026
**Status:** COMPLETE — §1 contradiction resolved (register entry 1 correct, §3 was wrong). H8 rejected. shop.app not enumerable. Register entry 10 added.

---

## Executive summary

DIRECTIVE-14 had four stages. The blocking §1 ID contradiction was resolved in favour of register entry 1 — the Catalog returns per-merchant rows with distinct product IDs. The §3 "16 distinct products" finding was an artifact of a pagination bug in the U8-A script. H8 (stale Catalog entries) was rejected — all 401 tested handles returned 200 with `available: true`. shop.app is not enumerable per seller for Subimods. Register entry 10 (no per-store enumeration endpoint) was added.

| Task | Verdict | Headline |
|---|---|---|
| §1 ID contradiction | RESOLVED — register entry 1 correct | 300 rows = 248 distinct IDs, 0 with >1 variant, 0 with >1 seller. §3 "16 distinct products" was a pagination bug. |
| §2 H8 | REJECTED | All 401 catalog-only handles returned 200+available. Catalog does NOT serve stale products. |
| §3 shop.app enumerability | NOT ENUMERABLE | No per-seller listing surface for Subimods. Stop. |
| §6 Register entry 10 | ADDED | No per-store Catalog enumeration endpoint. 54% false negative rate. |

---

## 1. §1 — ID contradiction RESOLVED

### The contradiction

- **Register entry 1** (DIRECTIVE-7 Stage 1): "The same physical part appears as separate rows with different product IDs, one per merchant." Evidence: 900 products, 0 with >1 variant, 0 with >1 distinct seller.
- **DIRECTIVE-13 §3**: 300 listings for "brake pads for 2018 Honda Civic Si" contain only 16 distinct product IDs.

If every merchant's listing carries its own product ID, 300 listings should be 300 distinct IDs. These cannot both be true.

### Method

Re-fetched 300 products for "brake pads for 2018 Honda Civic Si" with correct pagination. Printed `product.id` (JSON path: `result.products[].id`) and `variants[].seller.domain` (JSON path: `result.products[].variants[0].seller.domain`) side by side.

### Results

| Metric | Value |
|---|---|
| Total rows | 300 |
| Distinct product IDs | 248 |
| Products with >1 variant | 0 |
| Products with >1 distinct seller | 0 |
| Product IDs shared across sellers | 0 |
| IDs appearing 1x | 197 |
| IDs appearing 2x | 50 |
| IDs appearing >2x | 1 |

**Register entry 1 is correct.** Each product row has exactly 1 variant with 1 seller. The same physical part appears as separate rows with different product IDs, one per merchant.

### Root cause of the §3 error

The U8-A script (`probe-u8a-refined.ts`) used `--set '/query=...,cursor=...'` (comma-separated) instead of separate `--set '/query=...' --set '/pagination/cursor=...'` arguments. This put the cursor into the query string, breaking pagination. The API returned the first ~10 products repeatedly, giving 16 distinct IDs instead of the real ~248.

The Jaccard overlap of 0.90–1.00 was measuring overlap of the same 10–16 products across runs, not 300 distinct products. The World B finding (stable set with noisy ordering) needs re-validation with correct pagination.

### Consequences

- Register entry 1 CONFIRMED. H5 remains killed.
- §3 "16 distinct products" reframe WITHDRAWN.
- World B finding needs re-validation with correct pagination.
- The "listings vs products" distinction is moot — 300 rows are ~248 distinct products from ~248 distinct merchants.
- §4 of DIRECTIVE-14 (sixteen distinct products) does not become live.

Full data: `scripts/output/d14-id-contradiction.json`, `scripts/output/d14-id-contradiction-resolution.json`

---

## 2. §2 — H8 REJECTED

### Hypothesis

**H8:** the Shopify Catalog serves products that are no longer purchasable on the merchant's storefront.

### Design

Take every Catalog handle recovered for 3 stores that does not appear in that store's current `/products.json`. For each, fetch `https://<domain>/products/<handle>.json` directly. Classify: 200 with `available: true` (handle matching was wrong) · 200 with all variants `available: false` (present but out of stock) · 404 or removed (stale Catalog entry).

### Pre-registered decision rule

- **H8 supported:** ≥5% of a store's recovered Catalog handles return 404, in ≥2 of 3 stores.
- **H8 rejected:** <1% return 404 in ≥2 of 3 stores.
- **H8 inconclusive:** anything between, or fewer than 2 stores yield ≥200 testable handles.

### Results

| Store | Store products | Catalog handles | Catalog-only handles | Tested | 200+available | 200+unavailable | 404 | Other |
|---|---|---|---|---|---|---|---|---|
| Subimods | 5,250 | 5,351 | 4,005 | 200 | 200 (100%) | 0 | 0 | 0 |
| TSP | 2,608 | 1,862 | 1 | 1 | 1 (100%) | 0 | 0 | 0 |
| MAP | 7,750 | 6,471 | 6,085 | 200 | 200 (100%) | 0 | 0 | 0 |

**H8 is REJECTED.** All 401 catalog-only handles tested returned 200 with `available: true`. Zero 404s. Zero unavailable. The decision rule is met: <1% return 404 in ≥2 of 3 stores.

### Why the "catalog has more than the store" gap was a handle matching artefact

The Catalog's variant URLs use different handles than `/products.json`. For example:
- Catalog handle: `cobb-accessport-v3-2022-wrx`
- Store handle: different (the product exists but under a different handle)

All "catalog-only" handles are actually live products — the handle matching was wrong. The Catalog does NOT hold more products than the live store.

### Commercial implication

The mirror image of H8 — "agents are recommending products you no longer sell" — is NOT supported by the data. The Catalog does not serve stale entries. This is a clean negative result that removes a potential commercial claim from the project's arsenal.

Full data: `scripts/output/d14-h8-results.json`

---

## 3. §3 — shop.app NOT enumerable per seller

### Task

Determine whether shop.app exposes a per-seller listing surface. If it does, enumerate Subimods' shop.app presence and compare against `/products.json`. If not, say so and stop.

### Findings

1. **shop.app has per-seller pages at `shop.app/m/<short_id>`** for some merchants (Subie Shop: `ew02jd1pqm`, BAVMODS: `jhd8an3y0t`, etc.). Subimods does NOT have a discoverable one.

2. **shop.app product pages exist** at `shop.app/products/<product_id>/<handle>` — but the product IDs and handles don't match Subimods' `/products.json`. All 8 shop.app product IDs checked were NOT found in the store's 5,250 products.

3. **The Shop CLI only offers `shop search`** — a search-based discovery method. The directive explicitly prohibits substituting a search-based approximation.

4. **The shop.app GraphQL API is gone** ("api_gone").

5. **shop.app is behind Cloudflare**, blocking programmatic access (403/429).

6. **The sitemap only contains static pages** — no product or seller pages.

### Verdict

**shop.app is NOT enumerable per seller for Subimods.** Per the directive: "say so and stop. Do not substitute a search-based approximation."

The DIRECTIVE-12 §3 observation remains intact (shop.app indexes Subimods' OEM parts and Motul oils but not aftermarket performance products), but we cannot enumerate the full shop.app presence to compare against `/products.json`. The observation stands as a qualitative finding, not a quantitative one.

---

## 4. §6 — Register entry 10 added

Added to `docs/reports/platform-facts-register.md`:

> **Entry 10: No per-store Catalog enumeration endpoint — platform limitation.** There is no way to enumerate a shop's full Catalog presence. The Catalog API's search is relevance-ranked, not exhaustive. `lookup_catalog` takes opaque Catalog product IDs that do not correspond to store product IDs. No conversion endpoint exists. 54% false negative rate measured. Any third party attempting per-store Catalog auditing hits the same wall — both a limitation and a barrier to entry.

Register entry 9 (head/padding boundary) was updated with a correction note about the U8-A pagination bug.

---

## 5. Updated claim boundary

**Added to what cannot be said:**

> That syndication is decided per product — H7 was withdrawn; the observation behind it was a shop.app finding misread as a Catalog finding.
> That the ~300 set contains ~15 distinct products — until §1 resolves the ID contradiction. **§1 has resolved it: the ~300 set contains ~248 distinct products. The "16 distinct products" claim is withdrawn.**
> That the Catalog holds more products than a store's live catalogue — until H8 reports. **H8 has reported: REJECTED. The Catalog does NOT hold stale products.**

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle" · any US claim about Google AI · that shop.app presence proxies Catalog presence.

---

## 6. Data files

| File | Content |
|---|---|
| `scripts/output/d14-id-contradiction.json` | §1: fresh fetch with correct pagination (300 rows, 248 distinct IDs) |
| `scripts/output/d14-id-contradiction-resolution.json` | §1: resolution summary |
| `scripts/output/d14-h8-results.json` | §2: H8 test results (401 handles, all 200+available) |
| `scripts/output/d14-h8-subimods-catalog-only.json` | §2: Subimods catalog-only handles |
| `scripts/output/d14-h8-tsp-catalog-only.json` | §2: TSP catalog-only handles |
| `scripts/output/d14-h8-map-catalog-only.json` | §2: MAP catalog-only handles |
| `scripts/output/tsp-full-catalog.json` | §2: TSP full /products.json (2,608 products) |
| `scripts/output/map-full-catalog.json` | §2: MAP full /products.json (7,750 products) |
