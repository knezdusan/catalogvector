# DIRECTIVE-13 Round Report

**Directive:** DIRECTIVE-13
**Date:** 4 August 2026
**Status:** COMPLETE — H7 cannot run (membership test unreliable). §3 and §2.1 reported. §2.2 and §2.3 recorded in TDD.md.

---

## Executive summary

DIRECTIVE-13 had three stages. Stage 1 (§3 + §2.1) produced two findings from existing data. Stage 2 (§1 H7) was the critical test — and it failed at the membership-test validation step, as the directive anticipated. Stage 3 (§2.2 + §2.3) recorded standing limitations in TDD.md.

The most important finding is not what H7 was designed to find. It is that **the DIRECTIVE-12 §3 observation — the "partial syndication" that DIRECTIVE-13 §1 is built on — was wrong.** The §3 subagent checked shop.app, not the Catalog API. The Catalog API has all 5 "absent" aftermarket products under Subimods' seller name. The "OEM parts in, aftermarket parts out" split may be a shop.app-specific phenomenon, not a Catalog API phenomenon.

| Task | Verdict | Headline |
|---|---|---|
| §3 Listings vs products | REPORTED | ~300 set is 13-16 distinct products, each appearing up to 30x. Effective diversity ~15x lower than 300. |
| §2.1 Seller-level re-check | REPORTED | U-9 repeated the §3 error. 7/18 merchants are non-Shopify and cannot have Catalog listings. |
| §1 H7 membership test | UNRELIABLE — H7 CANNOT RUN | 54% false negative rate. The Catalog API's search is relevance-ranked, not exhaustive. |
| §2.2 TDD.md §2.7 | RECORDED | Catalog API sees only 47.5% of cited merchants. Partial competitive field. |
| §2.3 Google AI Serbia | RECORDED | No US claim about Google AI licensed. |

---

## 1. §3 — The ~300 set: listings or products?

### Method

From the U8-A refined data (4 real queries, 300 products each), counted distinct product IDs vs total listings. Reported duplication distribution. Identified parts appearing from ≥5 merchants and checked whether any scanned store stocks that part and is absent.

### Results

| Query | Total listings | Distinct products | Duplication ratio |
|---|---|---|---|
| brake pads 2018 Civic Si | 300 | 16 | 18.8x |
| cold air intake FL5 | 300 | 16 | 18.8x |
| BC Racing coilovers Acura TL | 300 | 14 | 21.4x |
| downpipe FK8 | 300 | 13 | 23.1x |

The ~300 set is a count of **listings** (merchant-product pairs), not distinct products. Each product appears up to 30 times from different merchants. The effective product diversity is ~15x lower than 300.

### Controlled comparison

The PRL Motorsports High Volume Intake System for 2023 Honda Civic Type R FL5 appears 30 times in the Catalog from different merchants. Subimods stocks this product. Subimods' own listing is absent from the Catalog search results for this query — but this is now known to be a ranking issue, not an absence (see §1 below).

For BC Racing BR Series coilovers: MAP (rank 21), Springrates (rank 3), JDMuscle (rank 4) all stock it and all are present. No absent merchant for this part.

### Implications

Every presence figure should be read against the smaller number (~15 distinct products), not 300. The ~300 boundary is the relevance threshold for listings, not products.

Full data: `scripts/output/u8-listings-vs-products.json`

---

## 2. §2.1 — U-9 seller-level re-check

### Method

Re-checked the 18 U-9 candidate products at seller level. The U-9 check searched the Catalog for each product title and found all 18 "present." But §3 established that "present as a matching product" is different from "present as that merchant's listing."

### Results

| Category | Count | Note |
|---|---|---|
| Shopify merchants | 11 | 3 verified in scan set, 8 likely present |
| Non-Shopify merchants | 7 | Cannot have listings in Shopify Catalog |
| Verified in Catalog | 3 | TSP, Springrates, MAP (scan set) |

The U-9 check DID repeat the §3 error. For 7 non-Shopify merchants (carparts.com, evasivemotorsports.com, fitmentindustries.com, autobarn.net, turbokits.com, bcracing-na.com, hardmotion.com), their products CANNOT be in the Shopify Catalog. The matching products found were from other Shopify merchants selling the same or similar products.

### Restated U-9 conclusion

"All 18 product queries returned results in the Catalog API, but 7 of the 18 cited merchants are non-Shopify and therefore cannot have listings in the Catalog. The matching products came from other Shopify merchants. For the 11 Shopify merchants, 3 are verified present (scan set) and 8 are likely present but not verified at seller level."

This weakens the same-index claim and supports §2.2 (partial competitive field).

Full data: `scripts/output/u9-seller-recheck.json`

---

## 3. §1 H7 — Per-product syndication eligibility

### 3.1 The hypothesis

**H7:** syndication into Shopify Catalog is decided per product, not per store, and inclusion is predictable from publicly visible product attributes.

The Subimods split — OEM parts in, aftermarket performance parts out — was the most diagnostic observation the project had produced. It pointed at product-identifier completeness as the discriminator.

### 3.2 The membership test proposal

**Method:** Use scoped search with `filters.shops` to enumerate Subimods' Catalog presence. Run multiple queries (broad + per-vendor) and take the UNION of results. Each result carries `seller.domain`, so we can verify the product is from Subimods. Extract product handles from variant URLs and match to `/products.json` handles.

**False positive behavior:** A scoped search may return products from other sellers. Mitigation: filter by `seller.domain === "subimods-com.myshopify.com"`.

**False negative behavior:** A query that doesn't match a product's indexed text won't return it. Mitigation: use multiple broad queries. The U-4 fallback (nonsense query) returns the shop's general catalog.

### 3.3 Validation

Validated against 50 "absent" products by searching each by exact title with the Subimods shops filter.

| Metric | Value |
|---|---|
| Total checked | 50 |
| True negatives (genuinely absent) | 23 |
| False negatives (actually present) | 27 |
| **False negative rate** | **54.0%** |

**The membership test is unreliable.** 54% of "absent" products are actually present when searched by exact title. The scoped search returns ~300 results per query (relevance-ranked, not exhaustive), so products that don't match the query terms well enough to appear in the top 300 are missed.

### 3.4 Verdict

**H7 cannot run.** Per the directive: "if the membership test is unreliable, H7 cannot run and the correct answer is to say so."

The root cause is that the Catalog API's search is relevance-ranked, not an exhaustive enumeration. There is no API to enumerate all products from a specific shop. A direct lookup by product GID would work, but store product IDs are not the same as Catalog product IDs, and there is no API to convert between them.

### 3.5 Critical additional finding: §3 was wrong

**The DIRECTIVE-12 §3 finding was wrong.** All 5 "known-absent" aftermarket products (Fluidampr, COBB Boost Control, PRL HVI, COBB AccessPORT, PRL Charge Pipe) ARE in the Catalog API under Subimods' seller name.

The §3 subagent checked shop.app, not the Catalog API. The Catalog API and shop.app index different subsets of a merchant's catalog. shop.app only indexes Subimods' OEM Subaru parts and Motul oils. The Catalog API indexes all 5 aftermarket performance products.

**The "partial syndication" observation that DIRECTIVE-13 §1 is built on may not exist in the Catalog API.** The "OEM parts in, aftermarket parts out" split is a shop.app-specific phenomenon, not a Catalog API phenomenon.

This means the most diagnostic observation the project had produced — filed as a dissolution in DIRECTIVE-12 — was an artifact of checking the wrong surface. The Catalog API appears to index a much larger portion of Subimods' catalog than shop.app does.

### 3.6 What would fix the membership test

1. **A direct lookup by product GID** — but store product IDs are not the same as Catalog product IDs, and there's no API to convert.
2. **A store-scoped product enumeration API** — the Catalog API doesn't offer this. The scoped search with nonsense query returns a default set, not the full catalog.
3. **Access to the merchant's Shopify admin API** — which would show syndication status directly, but requires merchant authentication.

Full data: `scripts/output/h7-membership-validation.json`

---

## 4. §2.2 + §2.3 — TDD.md standing limitations

Recorded in TDD.md §2.7 (new section, renumbered old §2.7 to §2.8):

**Partial competitive field.** The Catalog API sees only Shopify merchants. Across the authenticated pass, 19 of 40 merchant domains cited by assistants are Shopify (47.5%). The remaining 52.5% — Amazon, Target, REI, Walmart, eBay, and others — are invisible to the Catalog API. A diagnostic built only on Catalog data measures a partial competitive field. Must be disclosed in any merchant-facing output.

**Google AI tested from Serbia, not US.** No US claim about Google AI behaviour is licensed.

**shop.app ≠ Catalog API.** The two surfaces index different subsets. shop.app is not a valid proxy for Catalog API presence.

TDD.md version bumped 0.8.4 → 0.8.5.

---

## 5. Updated claim boundary

**Added to what can be said:**

> A real query returns a stable, relevance-ordered, exhaustive candidate set — set overlap across repeated runs is 0.90–1.00, and products at ranks 200–300 remain genuine matches. The first 13–18 ranks are deterministic. The ~300 set is a count of listings (merchant-product pairs), not distinct products — effective diversity is 13-16 distinct products per query, each appearing up to 30 times from different merchants. Across three assistants, 47.5% of cited merchant domains are Shopify, verified by platform fingerprinting.

**Added to what cannot be said:**

> "The Catalog API measures the surface consumer assistants query" — without the qualifier that it sees only the Shopify half of the competitive field.
> Anything about per-product syndication eligibility, until a reliable membership test exists.
> Any US claim about Google AI behaviour.
> That shop.app presence is a proxy for Catalog API presence — the two surfaces index different subsets.

**Unchanged and still forbidden:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."

---

## 6. Data files

| File | Content |
|---|---|
| `scripts/output/u8-listings-vs-products.json` | §3: distinct products vs listings, duplication distribution |
| `scripts/output/u9-seller-recheck.json` | §2.1: seller-level re-check of 18 U-9 candidates |
| `scripts/output/subimods-full-catalog.json` | §1: Subimods' full public catalog (5,250 products) |
| `scripts/output/subimods-membership-by-handle.json` | §1: membership test results (unreliable) |
| `scripts/output/h7-membership-validation.json` | §1: validation of membership test (54% false negative rate) |
