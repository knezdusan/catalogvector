# DIRECTIVE-17 Stage 3 Report — Three Stores with Per-Store CIs

**Directive:** DIRECTIVE-17 §4
**Date:** 4 August 2026
**Stage:** 3 of 4
**Status:** COMPLETE

---

## Executive summary

Three stores enumerated with per-store confidence intervals. The absence rate varies across stores — this is the finding.

| Store | Sitemap | Enum handles | Absence rate | 95% CI | Recall |
|---|---|---|---|---|---|
| Subimods | 18,067 | 13,257 | **20.0%** | [13.3%, 28.9%] | 88.8% |
| TSP | 2,608 | 2,329 | **13.0%** | [7.8%, 21.0%] | 97.7% |
| MAP | 102,176 | 43,840 | **17.0%** | [10.9%, 25.5%] | 56.6% |

**The absence rate is not constant across stores.** Subimods sits at 20%, TSP at 13%, MAP at 17%. The variation between stores is the finding — it suggests absence is not a uniform platform-wide rate but varies by store, which is consistent with H9 (absence is systematic, not random).

**No pooled figure. No prevalence claim.** Each store is reported separately with its own CI. The CIs overlap, so we cannot say the stores differ with statistical confidence at n=100. But the point estimates vary, and the direction matters for H9.

**MAP's recall is low (56.6%)** because its partition was built from 25,000 of 102,176 products (24.5%). The 35 ref-only products are products the reference standard found but the enumeration missed — their vendors/product types are not in the 25,000-product partition. This is the same partial-partition problem Subimods had, but worse. MAP's absence rate (17.0%) is still a valid upper bound because it uses union presence.

---

## 1. TSP

### Partition

| | Value |
|---|---|
| /products.json | 2,614 (complete) |
| Vendors | 161 |
| Product types | 139 |
| Partition queries | 299 |

TSP's `/products.json` is complete (2,614 vs 2,608 sitemap — 6 new products added between fetches). The partition is built from the full catalogue.

### Results

| | Count |
|---|---|
| Enumeration handles | 2,329 |
| Union present | 87/100 |
| Both present | 85 |
| Ref only | 1 |
| Enum only | 1 |
| Both absent | 13 |
| **Absence rate** | **13.0%** |
| **95% CI** | **[7.8%, 21.0%]** |
| Recall (against union) | 97.7% |

TSP has the lowest absence rate and the highest recall. The enumeration recovered 2,329 of 2,608 sitemap products (89.3%). The recall against union presence is 97.7% — the enumeration found 85 of 87 union-present products.

### Interpretation

TSP is the useful control. 13% absence is lower than Subimods (20%) and MAP (17%). If TSP's absence rate is near zero while Subimods sits at 20%, the variation between stores is the finding. TSP is not at zero — 13% is still substantial — but it is meaningfully lower.

---

## 2. MAP

### Partition

| | Value |
|---|---|
| /products.json | 25,000 (capped at 100 pages) |
| Sitemap | 102,176 |
| Coverage | 24.5% |
| Vendors | 307 |
| Product types | 77 |
| Partition queries | 384 |

MAP's `/products.json` is capped at 25,000 of 102,176 products. The partition is built from 24.5% of the catalogue — the same partial-partition problem as Subimods' original 29%, but for a different reason (platform cap, not fetch bug).

MAP has only 77 product types despite 102,176 products — suggesting many products share the same product type. The 307 vendors are a larger set than Subimods (265) or TSP (161).

### Results

| | Count |
|---|---|
| Enumeration handles | 43,840 |
| Union present | 83/100 |
| Both present | 47 |
| Ref only | 35 |
| Enum only | 1 |
| Both absent | 17 |
| **Absence rate** | **17.0%** |
| **95% CI** | **[10.9%, 25.5%]** |
| Recall (against union) | 56.6% |

### The low recall problem

MAP's recall is 56.6% — the enumeration found only 47 of 83 union-present products. The 35 ref-only products are products the reference standard found by title search but the enumeration missed. This is because their vendors or product types are not in the 25,000-product partition — they appear only in the 77,176 products beyond the `/products.json` cap.

**MAP's absence rate (17.0%) is still a valid upper bound** because it uses union presence (ref standard OR enumeration). The low recall means the enumeration is incomplete, but the absence rate is based on both detectors missing a product, not just the enumeration.

### What MAP needs

To improve MAP's recall, the partition needs to be built from sitemap-derived metadata. The sitemap has handles and URLs but no vendor or product_type. Getting metadata for all 102,176 products would require fetching each product page — 102,176 HTTP requests. This is feasible but slow (at 250ms per request, ~7 hours). Not authorised in this directive.

---

## 3. Three-store comparison

| Store | Sitemap | Enum handles | Enum coverage | Absence rate | 95% CI | Recall |
|---|---|---|---|---|---|---|
| Subimods | 18,067 | 13,257 | 73.4% | 20.0% | [13.3%, 28.9%] | 88.8% |
| TSP | 2,608 | 2,329 | 89.3% | 13.0% | [7.8%, 21.0%] | 97.7% |
| MAP | 102,176 | 43,840 | 42.9% | 17.0% | [10.9%, 25.5%] | 56.6% |

### Key observations

1. **Absence varies by store.** Subimods 20%, MAP 17%, TSP 13%. The CIs overlap, so the difference is not statistically significant at n=100, but the point estimates vary by 7 percentage points.

2. **TSP has the best recall and lowest absence.** This is consistent with TSP being the highest-visibility store in the ten-store scan — it syndicates more of its catalogue and the enumeration recovers more of it.

3. **MAP's recall is low due to the 25,000 cap.** The partition is built from 24.5% of the catalogue. Improving MAP's partition would likely raise recall and lower the absence rate.

4. **All three stores have substantial absence.** Even TSP, the best performer, has 13% absence. No store is close to 0%.

5. **No pooled figure. No prevalence claim.** Per DIRECTIVE-16 §5 and DIRECTIVE-17 §4: each store is reported separately. The variation between stores is the finding, not a pooled average.

---

## 4. Data files

| File | Content |
|---|---|
| `scripts/output/d17-tsp-enumeration.json` | TSP enumeration + scoring |
| `scripts/output/d17-map-enumeration.json` | MAP enumeration + scoring |
| `scripts/probe-d17-tsp-map.ts` | TSP + MAP enumeration script |

---

## 5. Next stage

Stage 4: §5 H9 — is absence systematic or random? Using union-presence labels on a random sitemap sample of ≥300 products per store, across ≥2 stores, compare present and absent populations on publicly visible product attributes. Hold out half before inspecting any attribute.
