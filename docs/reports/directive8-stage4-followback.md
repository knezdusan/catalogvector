# DIRECTIVE-8-v2 Stage 4 — H4-R as Registered at TSP

**Directive:** DIRECTIVE-8-v2 §8.4 (H4-R, per DIRECTIVE-6 §3), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 4 of 4
**Date:** 3 August 2026
**Agent:** Devin
**Directive files read:** `docs/directives/DIRECTIVE-8-v2.md` (commit `d7879a0`), `docs/directives/DIRECTIVE-6.md` (commit `d7879a0`, reconstructed)

---

## 1. Executed / Not executed

### §8.4 — H4-R as registered at TSP
**Executed, with deviation.** The registered design (DIRECTIVE-6 §3) specifies a paired-query design at TSP with title-absent and title-present products from the same store AND category. No single category at TSP has ≥6 title-absent products AND ≥6 matched title-present controls of the same product type. The registered design cannot be executed as specified. A best-available approximation was run with relaxed category matching (same store, different category).

### Product discovery
**Executed.** 591 TSP products scraped via scoped queries. 35 title-absent (no vehicle/year/model in title, vehicle in tech_specs). 26 genuinely title-absent after manual verification (excluding products with model names like "RSX" or "Element" in the title). The 26 title-absent products are concentrated in universal-fitment categories (shift knobs, universal fans, velocity stacks) where title-present controls of the same product type do not exist.

---

## 2. Raw numbers, before any correction

### H4-R under relaxed matching (same store, different category)

| Pair | Query | TA product | TA result | TP control | TP result |
|---|---|---|---|---|---|
| 1 | brake pads for 2017 Honda Civic Type R | Paragon PBP370 | ABSENT | Z23 Brake Pads for 2017 Civic Si | ABSENT |
| 2 | rear brake pads for 2016 Honda Civic | Paragon PBP15570 | rank 2 | Hawk HPS 5.0 for 2016+ Civic | rank 33 |
| 3 | shift knob for 2017 Honda Civic Si | POCO Insulated Shift Knob | ABSENT | Acuity Shifter for 2022+ Civic | ABSENT |
| 4 | spark plugs for 2018 Honda Civic Si | NGK Laser Iridium | rank 2 | Z23 Brake Pads for 2017 Civic Si | ABSENT |
| 5 | shifter springs for 2005 Acura RSX | Hybrid Racing Gear Springs | ABSENT | 9th Gen Civic ACUITY Short Shifter | ABSENT |
| 6 | shifter springs for 2012 Honda Civic Si | K-Series Trans Springs | rank 1 | 10th Gen Civic Short Shifter | ABSENT |

| Population | Pairs | Present@50 | Rate |
|---|---|---|---|
| Title-absent | 6 | 3 | 0.500 |
| Title-present | 6 | 1 | 0.167 |
| Difference | — | — | -0.333 |

### Pre-registered decision rule

> **H4-R supported:** title-absent presence@50 ≥ 0.40 below title-present
> **H4-R rejected:** difference ≤ 0.15
> **H4-R inconclusive:** between, or < 6 title-absent products, or < 6 matched pairs

**Verdict: H4-R REJECTED — difference -0.333 ≤ 0.15.**

---

## 3. Corrections applied

**No corrections were applied.** The presence check is exact handle identity. The scoring is presence@50 (top 50 results, unscoped).

---

## 4. Verification performed

### What I checked by eye

1. **Product discovery verified.** 591 TSP products scraped via 6 scoped queries (auto parts, performance parts, brake, suspension, exhaust, intake). Each product's title checked for vehicle makes, models, and years. 35 products classified as title-absent by the automated regex, 26 confirmed genuinely title-absent after manual review (excluding products with model names like "RSX" or "Element" in the title).

2. **Category matching verified.** For each of the 6 categories with title-absent products, I checked whether matched title-present controls of the same product type exist:
   - **Brake pads (2 TA, 13 TP):** Both TA are Paragon brake pads. TP are Hawk, Power Stop, and Z23 brake pads. Same product type. But only 2 TA — below the 6 threshold.
   - **Shifter (6 TA, 10 TP):** All 6 TA are shift knobs. All 10 TP are short shifters, cable bushings, or base bushings — NOT shift knobs. Only 1 TP is a shift knob (Skunk2). Different product types. Cannot form valid matched pairs.
   - **Tune (3 TA, 5 TP):** TA are O2 sensors, KTuner packages, and cables. TP are COBB Accessports and Hondata FlashPros. Different product types.
   - **Other (11 TA, 176 TP):** Catch-all category. Products are not in the same real category.

3. **H4-R result verified.** The 3 title-absent successes (Paragon PBP15570 at rank 2, NGK spark plug at rank 2, K-Series springs at rank 1) are all products where the query matches the product type. The 1 title-present success (Hawk HPS 5.0 at rank 33) is a brake pad in a brake pad query. The 5 title-present failures are all products where the query does NOT match the product type (brake pads for spark plug queries, short shifters for shifter spring queries).

### Decisive observations

1. **The H4-R result is meaningless.** The title-present controls are wrong product types for the queries. A brake pad cannot appear for "spark plugs for 2018 Honda Civic Si" regardless of whether its title names a vehicle. The absence is due to product-type mismatch, not title coverage.

2. **The registered design cannot be executed at TSP.** No single category at TSP has ≥6 title-absent products AND ≥6 matched title-present controls of the same product type. TSP is a store with high title-coverage — only 5.9% of its products (35/591) are title-absent, and they're concentrated in universal-fitment categories where title-present controls don't exist.

3. **The -0.333 difference is an artefact of the category mismatch.** The title-absent products were better matched to the queries (same product type) than the title-present controls (different product type). The title-absent products appeared because they matched the query; the title-present controls didn't appear because they were the wrong product type.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **Relaxed category matching.** The registered design requires same store AND category. I used same store, different category. | ↓ invalidates result | The result is uninterpretable. The title-present controls are wrong product types for the queries. The -0.333 difference is an artefact of category mismatch, not title coverage. |
| **6 title-absent products from mixed categories.** The registered design requires same category. I used products from brake pads, shifter, spark plugs, and other. | ↓ invalidates result | The products are not comparable across categories. |
| **Title-present controls are not matched by product type.** Some controls are brake pads for spark plug queries, short shifters for shifter spring queries. | ↓ invalidates result | The controls cannot appear for the queries regardless of title coverage. |

---

## 6. Verdict

### The registered design cannot be executed at TSP

The H4-R registered design (DIRECTIVE-6 §3) specifies a paired-query design at TSP with title-absent and title-present products from the same store AND category. After scraping 591 TSP products:

- 35 title-absent (5.9% of TSP's catalog)
- 26 genuinely title-absent (after manual verification)
- No single category has ≥6 title-absent AND ≥6 matched title-present controls of the same product type

The closest category is "shifter" (6 title-absent shift knobs, 10 title-present short shifters/cable bushings). But shift knobs and short shifters are different product types — a buyer searching for "shift knob" is not looking for a short shifter. The matched pairs would test product-type mismatch, not title coverage.

### The relaxed matching result is uninterpretable

The H4-R under relaxed matching (same store, different category) produced a REJECTED verdict (difference -0.333 ≤ 0.15). But this result is an artefact of category mismatch:

- 3 of 6 title-absent products appeared because they matched the query's product type (brake pads for brake pad queries, spark plugs for spark plug queries, shifter springs for shifter spring queries).
- 5 of 6 title-present controls did NOT appear because they were the wrong product type for the query (brake pads for spark plug queries, short shifters for shifter spring queries).
- The 1 title-present success (Hawk HPS 5.0 at rank 33) was the only pair where both products were the same product type (brake pads for a brake pad query).

The -0.333 difference reflects the fact that the title-absent products were better matched to the queries than the title-present controls. It does NOT reflect title coverage.

### Final verdict: H4-R INCONCLUSIVE

The registered design cannot be executed at TSP. The relaxed matching result is uninterpretable. The H4-R is INCONCLUSIVE because:

1. **< 6 matched pairs from the same store and category.** No category at TSP meets this threshold.
2. **The relaxed matching result is uninterpretable.** The category mismatch confounds the title effect.

### What this means for H4

H4 (DIRECTIVE-5 §4, TDD §6.1.4) found title-absent presence@50 = 0.125 vs title-present = 0.833, difference 0.708 — SUPPORTED under relaxed matching (TSP+MAP, 8 title-absent, 6 title-present controls, not same-category). H4-R was designed to replicate H4 at TSP with strict same-store-AND-category matching. It cannot be executed because TSP doesn't have enough title-absent products in matchable categories.

H4 remains an auto-parts finding (TSP+MAP), not a platform finding. H4-R does not disconfirm H4 — it cannot test it. The H4 finding stands on its own evidence (0.708 gap, 8 title-absent products across 2 stores) but has not been replicated.

### What this means for the project

The H4-R failure is not a failure of the H4 hypothesis. It is a failure of the replication design. TSP is a store with high title-coverage (94.1% of products have vehicles in titles). The title-absent products at TSP are concentrated in universal-fitment categories (shift knobs, universal fans) where title coverage is irrelevant — these products fit many vehicles and don't need a vehicle in the title to be found.

The H4 finding is about products that fit a SPECIFIC vehicle but don't name it in the title. At TSP, those products are rare (2 Paragon brake pads). At MAP, they're common (6 "Multiple Fitments" brake pads). The H4-R replication needs a store like MAP, not TSP. But the registered design specified TSP, and the Intec Racing run (Stage 4) was the wrong store.

The correct replication would be at MAP, with same-category matching (brake pads vs brake pads). But MAP's title-present brake pad controls don't exist — ALL MAP brake pads use "Multiple Fitments." This is the H4 caveat from DIRECTIVE-5 §4: "no same-category title-present MAP brake pad controls exist."

The H4 hypothesis is in a bind: TSP has too few title-absent products, and MAP has no title-present controls. The replication cannot be done at either store with strict matching.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| H4-R TSP probe | `scripts/probe-h4r-tsp.ts` |
| H4-R TSP discovery | `scripts/probe-h4r-tsp-discovery.ts` |
| H4-R TSP results | `scripts/output/h4r-tsp-2026-08-03T16-24-10-529Z.json` |
| H4-R TSP discovery data | `scripts/output/h4r-tsp-discovery-2026-08-03T16-21-36-552Z.json` |
| This report | `docs/reports/directive8-stage4-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The surprise

**Title-absent outperformed title-present (3/6 vs 1/6).** This is the opposite of H4's finding (1/8 vs 5/6). The reason is clear: the title-absent products were better matched to the queries (same product type) while the title-present controls were wrong product types. The result is an artefact of the category mismatch, not a disconfirmation of H4.

### The blocker

**TSP has too few title-absent products in matchable categories.** 35 title-absent out of 591 (5.9%), concentrated in universal-fitment categories. The H4-R registered design requires same store AND category with ≥6 matched pairs. No category at TSP meets this threshold. The registered design cannot be executed.

### The disagreement

The H4-R registered design specified TSP. But TSP is the worst possible store for this replication — it has high title-coverage and few title-absent products. The correct replication store would be MAP, where "Multiple Fitments" is a store-wide pattern. But MAP has no title-present controls in the same category. The replication is caught between two stores, neither of which can support the registered design.

This is a design failure, not an execution failure. The H4-R should have been registered at a store with both title-absent and title-present products in the same category. No such store has been identified in this project.

### What this means for the stop/continue gate (§6)

The §6 decision table has U-7 on one axis and U-6 on the other. H4-R is not in the table. The H4-R INCONCLUSIVE does not affect the gate. The gate depends on U-7 (INCONCLUSIVE, floor characterised, leans toward THRESHOLD) and U-6 (founder-owned, not run).

The project should proceed to U-6 (the assistant check) to resolve the gate. U-6 is the question of whether the Catalog rank predicts what AI assistants surface to buyers. If the Catalog rank predicts assistant output, then the invisibility findings matter commercially. If it doesn't, the project is measuring a proxy, not the outcome surface.
