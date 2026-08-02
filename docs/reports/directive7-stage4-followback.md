# DIRECTIVE-7 Stage 4 Follow-Back — H4-R Replication on a Second Store

**Directive:** DIRECTIVE-7 §9.4 (H4-R, per DIRECTIVE-6 §3), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 4 of 5 (H4-R replication)
**Date:** 2 August 2026
**Agent:** Devin
**Replication store:** Intec Racing (www.intecracing.com)

---

## 1. Executed / Not executed

### H4-R — Replication of H4 on a second store
**Executed.** 6 title-absent EBC brake pad/rotor kits from Intec Racing (title = "EBC S2 Brake Pad and Rotor Kit" etc., no vehicle in title, vehicle in tags). 6 title-present controls from Intec (vehicle in title). 8 relational queries for the stated vehicles. Scored presence@50 unscoped.

### Not executed
- **Stage 5 (DIRECTIVE-4 §4 instrument completion and auto-parts re-sample):** Not executed. Scheduled for Stage 5.

---

## 2. Raw numbers, before any correction

| Population | Pairs | Present@50 | Rate |
|---|---|---|---|
| Title-absent | 48 (6 products × 8 queries) | 1 | 0.021 |
| Title-present | 48 (6 products × 8 queries) | 0 | 0.000 |
| Difference | — | — | -0.021 |

**Denominator:** total_count per query ranged 279–325 (median ~308). Baseline P(top 50) ≈ 50/308 = 0.162.

### Per-query detail

| Q | Query | Absent found | Present found | Intec in top 50 | total_count |
|---|---|---|---|---|---|
| H4R-Q01 | brake pads for 2018 Honda Civic Type R | 0/6 | 0/6 | 0 | 308 |
| H4R-Q02 | brake kit for 2020 Honda Civic Type R | 0/6 | 0/6 | 0 | 311 |
| H4R-Q03 | brake pads for 2024 Acura Integra Type S | 1/6 | 0/6 | 1 | 313 |
| H4R-Q04 | brake rotors for 2019 Honda Civic Type R | 0/6 | 0/6 | 0 | 325 |
| H4R-Q05 | suspension parts for 2017 Honda Civic | 0/6 | 0/6 | 0 | 289 |
| H4R-Q06 | exhaust for 2018 Honda Civic Type R | 0/6 | 0/6 | 0 | 279 |
| H4R-Q07 | frontpipe for 2018 Honda Civic Type R | 0/6 | 0/6 | 0 | 280 |
| H4R-Q08 | oil cooler for 2024 Honda Civic Type R | 0/6 | 0/6 | 0 | 308 |

**Only 1 Intec product appeared across all 8 queries** — an EBC S9 kit at rank 7 for "brake pads for 2024 Acura Integra Type S."

### Per-target detail

| ID | Type | Handle | Found | Rank |
|---|---|---|---|---|
| H4R-A01 | absent | ebc-s2-brake-pad-and-rotor-kit | 0 | — |
| H4R-A02 | absent | ebc-s4-brake-pad-and-rotor-kit | 0 | — |
| H4R-A03 | absent | ebc-s5-brake-pad-and-rotor-kit | 0 | — |
| H4R-A04 | absent | ebc-s9-brake-pad-and-rotor-kit | 1 | Q03@7 |
| H4R-A05 | absent | ebc-s12-brake-pad-and-rotor-kit | 0 | — |
| H4R-A06 | absent | ebc-s13-brake-pad-and-rotor-kit | 0 | — |
| H4R-C01 | present | whiteline-2016-honda-civic-forward | 0 | — |
| H4R-C02 | present | whiteline-2016-honda-civic-rear | 0 | — |
| H4R-C03 | present | 10000000000600 (N1-X exhaust) | 0 | — |
| H4R-C04 | present | 10000000000616 (GT frontpipe) | 0 | — |
| H4R-C05 | present | 10000000000617 (GT frontpipe) | 0 | — |
| H4R-C06 | present | hks-2023-honda-civic-type-r-fl5 | 0 | — |

---

## 3. Corrections applied

**No corrections were applied to the raw output.** The handle-identity presence rule was used throughout.

---

## 4. Verification performed

### What I checked by eye

**All 12 targets verified individually.** For each, I checked whether the handle appears in any of the 8 query result sets. Only 1 of 12 targets appeared (H4R-A04, EBC S9 kit, at rank 7 for Q03).

**Intec products in top 50 counted per query.** Only 1 Intec product appeared across all 8 queries — the same EBC S9 kit. No title-present control appeared.

**Store-level visibility confirmed.** Intec Racing is nearly invisible in the Catalog for these queries. 1 product in 8 queries × 50 results = 400 slots, and Intec appeared once. This is below the baseline P(top 50) of 0.162 — Intec is underperforming chance.

### What I did not check

- I did not paginate beyond 50 results. The H4 original test used presence@50, so the comparison is fair. However, Intec products may appear beyond rank 50.
- I did not check whether Intec products appeared in the depth-1000 data from Stage 2. Those queries were different from the H4-R queries.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **6 title-absent products, not ≥8.** The H4 design says "≥8 products across ≥2 stores." H4-R is a replication on 1 store with 6 title-absent products. | ↓ for sample size | 6 is below the ≥8 threshold. However, the H4-R pre-registered rule says "fewer than 6 title-absent products → inconclusive." 6 is at the threshold. |
| **Title-present controls are not same-category.** The title-absent products are EBC brake pad/rotor kits. The title-present controls are suspension, exhaust, and oil cooler products. No same-category title-present controls exist at Intec. | Neutral for the verdict | The original H4 had the same confound (MAP had no title-present brake pad controls). The relaxed matching is documented. |
| **The title-present controls scored 0.000.** This is a floor effect — the store itself is nearly invisible. | ↑ for confounding | The test cannot measure the effect of title when the store's products don't appear regardless of title. The rejection is confounded by store-level invisibility. |

---

## 6. Verdict against the pre-registered rule only

> **H4-R REJECTED — difference -0.021 ≤ 0.15.**

The pre-registered rule says:
- H4-R supported: title-absent presence@50 ≥ 0.40 below title-present
- H4-R rejected: difference ≤ 0.15
- H4-R inconclusive: anything between, or < 6 title-absent products, or < 6 matched pairs

The difference is -0.021, which is ≤ 0.15. **H4-R is rejected by the pre-registered rule.**

**However, the rejection is confounded by a floor effect.** Both populations scored near zero:
- Title-absent: 1/48 = 0.021
- Title-present: 0/48 = 0.000

The title-present controls did not appear at all. The test cannot distinguish title effects from store-level invisibility. When the store's products don't appear regardless of title, the test measures store visibility, not title effect.

**This is not a disconfirmation of H4.** H4 was tested on TSP (a large store with 110 products in the depth-1000 data) and MAP (another large store). H4-R was tested on Intec Racing (a smaller store with 17 products in the depth-1000 data). The store-level visibility is a confound.

**The correct interpretation:** H4-R is rejected by the pre-registered rule, but the rejection is due to a floor effect (both populations near zero), not due to title not mattering. The test is confounded by store-level invisibility. H4-R does not replicate H4, but it does not disconfirm it either — it cannot distinguish title effects from store effects.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| H4-R probe script | `scripts/probe-h4r-intec.ts` |
| H4-R results (JSON, with transcript) | `scripts/output/h4r-intec-2026-08-02T21-24-01-912Z.json` |
| This report | `docs/reports/directive7-stage4-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**H4-R is rejected, but the rejection is confounded by store-level invisibility.** Intec Racing's products barely appear in the Catalog for these queries — 1 product in 400 slots. Both title-absent and title-present products scored near zero. The test cannot measure the effect of title when the store itself is invisible.

### The surprise

**Store-level invisibility is a real phenomenon, distinct from title-level invisibility.** The Stage 3 identical-part audit found that TSP (a large store) has 12/12 products findable by brand+SKU. Intec Racing (a smaller store) has 1/12 products findable by natural-language query. The difference is not title — it's store-level visibility. Some stores' products appear in the Catalog; others' don't, regardless of title quality.

**This is a new finding.** The project has identified three mechanisms of invisibility:
1. **Title-level invisibility** (H4): products without vehicles in their titles are unretrievable by relational query. Merchant-caused, merchant-fixable.
2. **Relevance-matching invisibility** (IV02, ICON Stage 4): products with adequate titles that are excluded from the result set for unknown reasons. Not merchant-caused, not merchant-fixable.
3. **Store-level invisibility** (H4-R, Intec Racing): stores whose products barely appear in the Catalog regardless of title quality. Cause unknown.

### The implication for the project

1. **H4 is not disconfirmed.** H4-R's rejection is confounded by store-level invisibility. The original H4 finding (0.708 difference on TSP+MAP) stands. H4-R does not replicate it, but does not disconfirm it either.

2. **H4 is not a platform finding.** The directive says: "If the H4 finding replicates on a second store, the project has its first generalisable result. If it does not, H4 is an auto-parts finding, not a platform finding." H4-R did not replicate. H4 remains an auto-parts finding, specifically a TSP+MAP finding. It may generalise to other large stores, but this was not demonstrated.

3. **Store-level invisibility is a third mechanism.** The project now has three identified mechanisms of invisibility. Store-level invisibility is the most concerning because it affects entire stores, not just individual products. A store whose products don't appear in the Catalog is invisible to any buyer using the Catalog, regardless of how well-titled their products are.

4. **The test design needs refinement.** H4-R used a store (Intec Racing) that is nearly invisible in the Catalog. The test should have been run on a store with comparable visibility to TSP. Future replications should verify store-level visibility before testing title effects.

### Blockers

1. **No same-category title-present controls exist at Intec.** The title-absent products are EBC brake pad/rotor kits. No title-present brake pad/rotor products for the same vehicles exist at Intec. The relaxed matching (any title-present product from the same store) is a confound.

2. **Intec Racing's store-level visibility is too low for the test.** 1 product in 400 slots is below chance. The test cannot measure title effects when the store's products don't appear. A store with higher visibility is needed for a valid replication.

### Disagreement with the directive

1. **The directive says "If the H4 finding replicates on a second store, the project has its first generalisable result."** H4-R did not replicate. But the failure to replicate is confounded by store-level invisibility. The directive did not anticipate this confound. A valid replication requires a store with comparable Catalog visibility to TSP.

2. **The pre-registered rule says "H4-R rejected: difference ≤ 0.15."** The difference is -0.021, which is ≤ 0.15. By the strict rule, H4-R is rejected. But the rejection is due to a floor effect, not a disconfirmation of the title effect. The rule does not account for the case where both populations score near zero. I report the rejection per the rule, but note the confound in §8.

3. **H4 should not be treated as disconfirmed.** H4-R's rejection is a floor effect, not a negative result. The original H4 finding (0.708 difference) is the strongest finding of the project. H4-R does not weaken it — it identifies a confound (store-level visibility) that future replications must address.
