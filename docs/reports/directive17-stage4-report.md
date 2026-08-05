# DIRECTIVE-17 Stage 4 Report — H9: Absence is Random Loss

**Directive:** DIRECTIVE-17 §5
**Date:** 4 August 2026
**Stage:** 4 of 4 (final)
**Status:** COMPLETE

---

## Executive summary

**H9 is REJECTED.** Absence from the Catalog is not predictable from publicly visible product attributes. It is random loss.

The pre-registered decision rule (≥0.75 accuracy on held-out half, in ≥2 stores) appeared to be met — but the rule was flawed. The base rate of presence is 76.7% (Subimods) and 92.0% (TSP). Raw accuracy ≥0.75 is trivially achievable by predicting the majority class. When we correct for class imbalance, no attribute provides any lift over the base rate:

| Store | Base rate | Best held-out accuracy | Lift |
|---|---|---|---|
| Subimods | 76.7% | 76.7% | **0.0pp** |
| TSP | 92.0% | 90.7% | **-1.3pp** |

Zero separation. The attributes are not distinguishing present from absent — they are predicting "present" for nearly everything, which is correct ~77–92% of the time but provides no diagnostic value.

**This is a publishable platform finding. It is not a service.** Absence is real (13–20% across stores), measurable, and not diagnosable from product attributes. You cannot sell a fix for random loss.

---

## 1. The pre-registered rule and its flaw

### The rule (fixed 4 August 2026, before any run)

> **H9 supported:** at least one attribute separates present from absent with ≥0.75 accuracy on the held-out half, in ≥2 stores.
>
> **H9 rejected:** no attribute exceeds 0.60 accuracy in any store.
>
> **H9 inconclusive:** anything between, or fewer than 2 stores reach 300 labelled products.

### The flaw

The rule used raw accuracy as the separation metric. But the base rate of presence is 76.7% (Subimods) and 92.0% (TSP). When ≥76% of products are present, predicting "present" for everything achieves ≥76% accuracy — meeting the 0.75 threshold without any separation.

The rule should have used **lift over base rate** (or precision/recall on the absent class, or F1) as the metric. Raw accuracy on imbalanced data is confounded by the majority class.

### What the raw numbers showed

| Store | Attribute | Train accuracy | Held-out accuracy | Meets 0.75? |
|---|---|---|---|---|
| Subimods | imageCount | 78.0% | 76.7% | YES |
| Subimods | variantCount | 78.0% | 76.7% | YES |
| Subimods | price | 78.0% | 76.0% | YES |
| Subimods | publishedAgeDays | 78.7% | 75.3% | YES |
| Subimods | tagCount | 78.0% | 76.7% | YES |
| Subimods | bodyLength | 78.0% | 76.0% | YES |
| TSP | imageCount | 94.0% | 90.7% | YES |
| TSP | variantCount | 94.0% | 90.7% | YES |
| TSP | price | 94.0% | 90.7% | YES |
| TSP | publishedAgeDays | 94.7% | 90.7% | YES |
| TSP | tagCount | 93.3% | 90.7% | YES |
| TSP | bodyLength | 94.0% | 90.7% | YES |
| TSP | vendor | 83.3% | 75.3% | YES |

13 attributes met the 0.75 threshold. But all are at or below the base rate.

---

## 2. The corrected analysis

### Lift over base rate

| Store | Attribute | Held-out accuracy | Base rate | Lift | Separates? |
|---|---|---|---|---|---|
| Subimods | imageCount | 76.7% | 76.7% | 0.0pp | NO |
| Subimods | variantCount | 76.7% | 76.7% | 0.0pp | NO |
| Subimods | price | 76.0% | 76.7% | -0.7pp | NO |
| Subimods | publishedAgeDays | 75.3% | 76.7% | -1.3pp | NO |
| Subimods | tagCount | 76.7% | 76.7% | 0.0pp | NO |
| Subimods | bodyLength | 76.0% | 76.7% | -0.7pp | NO |
| Subimods | vendor | 68.0% | 76.7% | -8.7pp | NO |
| Subimods | productType | 70.7% | 76.7% | -6.0pp | NO |
| TSP | imageCount | 90.7% | 92.0% | -1.3pp | NO |
| TSP | variantCount | 90.7% | 92.0% | -1.3pp | NO |
| TSP | price | 90.7% | 92.0% | -1.3pp | NO |
| TSP | publishedAgeDays | 90.7% | 92.0% | -1.3pp | NO |
| TSP | tagCount | 90.7% | 92.0% | -1.3pp | NO |
| TSP | bodyLength | 90.7% | 92.0% | -1.3pp | NO |
| TSP | vendor | 75.3% | 92.0% | -16.7pp | NO |
| TSP | productType | 69.3% | 92.0% | -22.7pp | NO |

**No attribute in either store provides any lift over the base rate.** The best lift is 0.0pp (Subimods: imageCount, variantCount, tagCount). Most attributes are below the base rate — they are worse than predicting the majority class.

### Vendor and productType overfitting

Vendor and productType show higher training accuracy (82–86.7%) but lower held-out accuracy (68–70.7%), which is below the base rate. These attributes memorize which vendors/product types are absent in the training half, but this doesn't generalize. They are overfitting.

### The thresholds found

The numeric separation found thresholds like:
- imageCount ≥ 0.5 (i.e., has at least 1 image)
- variantCount ≥ 0.5 (i.e., has at least 1 variant)
- bodyLength ≥ 460 characters
- publishedAgeDays ≥ 17 days

These thresholds classify nearly all products as "present" — which is correct ~77–92% of the time because most products ARE present. The thresholds are not finding a signal; they are finding the majority class boundary.

---

## 3. What this means

### Absence is random loss

Absence from the Catalog is **not predictable** from publicly visible product attributes. The attributes tested — image count, variant count, price, published_at age, vendor, product type, tag count, body length — provide zero separation between present and absent products.

This means a merchant cannot look at a product's attributes and predict whether it will be absent from the Catalog. The absence is random with respect to these attributes.

### What might still be systematic (but was not tested)

The attributes tested are all publicly visible on the storefront. Absence might be systematic with respect to **private** attributes that we cannot observe:
- Shopify admin settings (syndication toggle, sales channel configuration)
- Product status (draft vs active, published scope)
- App installations (whether the merchant has the Catalog app installed)
- Backend sync state (whether the product was successfully pushed to the Catalog)

These are not testable from public data. H9 was specifically about "publicly visible product attributes" and that is what was rejected.

### The commercial implication

**This is not a service.** The original pitch — "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" — is not supported by the evidence. Absence is not diagnosable from product attributes. You cannot sell a fix for random loss.

What you CAN sell (or publish):
- **The measurement itself:** "X% of your catalogue is absent from the Shopify Catalog" — this is real, measurable, and valuable to know.
- **The enumeration method:** a reliable way to measure absence per store.
- **The platform finding:** absence is random loss, not systematic — a publishable contribution to the understanding of the Shopify Catalog.

---

## 4. H9 verdict

| | Pre-registered rule | Corrected (class-imbalance) |
|---|---|---|
| Metric | Raw accuracy ≥0.75 | Lift over base rate > 0 |
| Subimods | MET (6 attributes) | NOT MET (0 attributes with lift > 0) |
| TSP | MET (7 attributes) | NOT MET (0 attributes with lift > 0) |
| Verdict | SUPPORTED | **REJECTED** |

**H9 is REJECTED.** The pre-registered rule was flawed (raw accuracy on imbalanced data), but the corrected analysis is unambiguous: no attribute separates present from absent beyond the base rate in either store.

Per the pre-registered rule: "If H9 is rejected, absence is random loss — real, measurable, and not diagnosable. That is still a publishable platform finding and it is not a service. Report it plainly if that is the answer."

**That is the answer.**

---

## 5. Data files

| File | Content |
|---|---|
| `scripts/output/d17-h9-subimods.json` | Subimods H9 results (300 products, 8 attributes) |
| `scripts/output/d17-h9-tsp.json` | TSP H9 results (300 products, 8 attributes) |
| `scripts/output/d17-h9-honest-verdict.json` | Corrected verdict with class-imbalance analysis |
| `scripts/probe-d17-h9.ts` | H9 test script |
| `scripts/probe-d17-h9-analysis.ts` | Class-imbalance correction script |

---

## 6. DIRECTIVE-17 complete

All four stages complete:

| Stage | Deliverable | Status |
|---|---|---|
| 1 | §1 partition rebuild + union presence + §2 total_count probe | COMPLETE — absence 20.0% (upper bound), recall 88.8%, register entry 13 |
| 2 | §3 re-derivations through enumeration | COMPLETE — 3 invisible + 6 absent AGREE, Subimods 0/10 RESTATED as syndication failure |
| 3 | §4 TSP and MAP enumeration | COMPLETE — TSP 13.0%, MAP 17.0%, Subimods 20.0%, per-store CIs |
| 4 | §5 H9 | COMPLETE — **REJECTED**, absence is random loss |

### What DIRECTIVE-17 established

1. **Absence is real and measurable.** 13–20% of a store's catalogue is absent from the Catalog (TSP 13%, MAP 17%, Subimods 20%), with per-store confidence intervals. The enumeration method reliably measures this.

2. **Absence is random loss.** It is not predictable from publicly visible product attributes. No attribute provides any lift over the base rate. The original pitch ("reliable diagnostic that identifies which products are structurally invisible and why") is not supported.

3. **`total_count` is a response budget.** Register entry 13. Rank-based absence testing is retired.

4. **Subimods' 0/10 is a syndication failure, not a visibility failure.** 9 of 12 products are in the Catalog from other sellers. Subimods doesn't syndicate them.

5. **The partition must be built from complete metadata.** The original 29% partition missed 82 vendors and 86 product types. The corrected partition recovered 150 more handles.

### What this licenses

> "For three automotive parts stores on Shopify, 13–20% of each store's catalogue (as enumerated by sitemap) is absent from the Shopify Catalog. This is measured against a 300-product random sample per store with a per-product exhaustive reference standard and a partition-query enumeration. The absence is not predictable from publicly visible product attributes (image count, variant count, price, published_at age, vendor, product type, tag count, body length) — it appears to be random loss with respect to these attributes. This is a platform finding, not a diagnostic service."

### What this does NOT license

- Any claim that absence is systematic or diagnosable
- Any claim that the "reliable diagnostic" pitch is supported
- Any pooled figure across stores
- Any prevalence claim beyond these three stores
- Any claim about private/admin attributes (not tested)
