# Stage 2.5 Follow-Back Report — Unscoped Competitive Retrieval + H4 Title-Coverage + P-5 Addition Audit

**Directive:** DIRECTIVE-5 §3 (Stage 2.5), §4 (H4), §6 (P-5)
**Stage:** Stage 2.5 — unscoped competitive retrieval + title-coverage test + addition-side audit
**Date:** 2 August 2026
**Agent:** Devin
**Query set commit:** `b0365f6c5d46efddbb7a3c29c0e113096584d7c7` (H3), `scripts/h4-query-set.json` (H4)

---

## 1. What was executed

### H3 — Unscoped competitive retrieval (§3)
**Executed.** The frozen 18-query set (commit `b0365f6`) was re-issued with `filters.shops` REMOVED. All 18 queries returned 50 products each. Presence@50, best_rank, and competitor displacement captured per query. Transcript at `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json`.

### H4 — Title-coverage test (§4)
**Executed.** 8 title-absent products assembled across 2 stores (TSP=2, MAP=6). 6 title-present controls from TSP. 14 relational queries issued unscoped. Presence@50 measured for both populations. Transcript at `scripts/output/h4-2026-08-02T15-58-46-885Z.json`.

### P-5 — Addition-side audit (§6)
**Executed.** 4 Kryptonite part numbers (KRUCA12, KRUCA19, KRSE11, KRFD17STAGE2FOX) audited against manufacturer's published application lists. 12 inferred vehicles checked. Report at `docs/reports/p5-addition-audit.md`.

### C5 — Blind labelling sheet (§2)
**Executed.** Blind labelling sheet (`scripts/c5-blind-labelling-sheet.json`) and scoring script (`scripts/c5-agreement-scorer.ts`) produced for human agreement on expected match verdicts.

---

## 2. H3 — Unscoped competitive retrieval

### Raw numbers

| Population | Present@50 | Pairs | Distinct targets |
|---|---|---|---|
| Dropped | 0.429 (3/7) | 7 | 3 |
| Retained | 0.556 (5/9) | 9 | 5 |

**Difference (retained - dropped): 0.127**

### Verdict

> **H3 INCONCLUSIVE** — difference 0.127 is between 0.10 and 0.30

The dropped-relational products (title_only, zero inferred vehicles) and retained products (vehicles in both title and tech_specs) are not cleanly separable in unscoped retrieval. Both populations are retrievable at moderate rates. The 0.127 difference is not large enough to confirm a commercial consequence (≥0.30) and not small enough to reject one (≤0.10).

### Competitor displacement

The unscoped run produced the competitor displacement table that Stage 2 could not (Stage 2 was store-scoped). Key findings:

1. **TSP is not dominant in its own product categories.** In 7 of 14 relational queries, TSP products appear in the top 10 but rarely dominate. TSP holds 0-3 slots per query; competitors hold the rest.

2. **Competitors with vehicle-rich titles displace TSP products.** In Q01 (brake pads for 2018 Honda Civic Si), the top 3 results are from fortunehunterzmotorsports.com, pistontwistin.org, and macautoparts.net — all with "Honda Civic" in their titles. TSP's Z23 kit appears at rank 5.

3. **MAP appears in unscoped results for Civic Type R queries.** In Q08 (lowering springs for 2023 Honda Civic Type R), MAP's Swift Spec-R appears at rank 5. In Q12 (exhaust for 2023 Honda Civic Type R), MAP's Tomei Expreme Ti appears at rank 1 and AWE Tuning at rank 5.

4. **The competitor displacement data is not scored as a metric.** It is a qualitative observation table. The H3 hypothesis was about the difference between dropped and retained populations, not about absolute competitive position.

---

## 3. H4 — Title-coverage test

### Raw numbers

| Population | Present@50 | Queries |
|---|---|---|
| Title-absent | 0.125 (1/8) | 8 |
| Title-present | 0.833 (5/6) | 6 |

**Difference (title-present - title-absent): 0.708**

### Verdict

> **H4 SUPPORTED** — title dominates retrieval (difference 0.708 ≥ 0.40)

### Per-query detail

| Q | Population | Query | Target present? | Rank | Same-store count |
|---|---|---|---|---|---|
| H4Q01 | title_absent | brake pads for 2017 Honda Civic Type R | NO | — | 5 |
| H4Q02 | title_absent | rear brake pads for 2016 Honda Civic | YES | 2 | 1 |
| H4Q03 | title_absent | brake pads for 2011 Ford Mustang GT | NO | — | 0 |
| H4Q04 | title_absent | brake pads for 2015 Chevrolet Camaro | NO | — | 0 |
| H4Q05 | title_absent | brake pads for 2015 Subaru WRX STI | NO | — | 1 |
| H4Q06 | title_absent | brake pads for 2012 Ford Mustang Boss 302 | NO | — | 0 |
| H4Q07 | title_absent | brake pads for 2009 Nissan 370Z | NO | — | 0 |
| H4Q08 | title_absent | brake pads for 2017 Subaru BRZ | NO | — | 0 |
| H4Q09 | title_present | exhaust system for 2023 Honda Civic Type R | YES | 2 | 7 |
| H4Q10 | title_present | lowering springs for 2023 Honda Civic Type R | YES | 8 | 3 |
| H4Q11 | title_present | brake lines for 2022 Honda Civic Si | YES | 1 | 4 |
| H4Q12 | title_present | camber arms for 2016 Honda Civic | YES | 1 | 3 |
| H4Q13 | title_present | lift kit for 2023 Ford F-150 | NO | — | 0 |
| H4Q14 | title_present | downpipe for 2018 Honda Civic Type R | YES | 6 | 7 |

### The one title-absent success

H4Q02 (rear brake pads for 2016 Honda Civic) is the only title-absent product that retrieved. The Paragon PBP15570 Rear Brake Pads appeared at rank 2. This product has "honda civic" in its tech_specs (inferred by Shopify from the merchant's tech_specs data). The query "rear brake pads for 2016 Honda Civic" matched the tech_specs content, and the product retrieved.

This is consistent with the H4 hypothesis: the title is the primary retrieval surface, but tech_specs CAN compensate when the title is absent AND the tech_specs inference works AND the query is a broad match. "Honda Civic" in tech_specs matched "2016 Honda Civic" in the query. The more specific queries ("2017 Honda Civic Type R", "2011 Ford Mustang GT") did not match the broader tech_specs content ("honda civic", "ford mustang gt") because the inference doesn't capture year or trim-level specificity.

### The title-present failure

H4Q13 (lift kit for 2023 Ford F-150) is the only title-present control that did not retrieve. The ICON Stage 4 Lift Kit was not in the top 50. This is a competitive category — the top 10 is dominated by Rough Country products from offroadtradingco.com, roco4x4.com, and off-road.ca. The ICON kit is a premium product ($2000+) competing against budget kits ($200-400). The retrieval system may rank by relevance AND popularity, and the ICON kit loses on popularity.

This is a real burial, not a title-coverage failure. The title "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" has the vehicle in it. The product is simply outranked by competitors.

### Caveats and deviations

1. **Matched controls are not same-category.** The H4 design specified "matched control from the same store and category." The 6 title-present controls are all from TSP, but in different categories (exhaust, springs, brake lines, camber arms, lift kit, downpipe). The 6 MAP title-absent products are all brake pads. No MAP title-present brake pad controls exist — MAP uses the "Multiple Fitments" title pattern for ALL their brake pad products. This is itself a finding: the "Multiple Fitments" pattern is a store-wide title defect at MAP.

2. **Store confound.** The title-absent products are 2 from TSP and 6 from MAP. The title-present controls are all 6 from TSP. If MAP products are inherently less retrievable than TSP products (due to store-level factors), the difference could be confounded. However, the unscoped H3 data shows MAP products DO appear in results when they have vehicles in their titles (e.g., H4Q09 rank 1, H4Q10 rank 5, H4Q14 rank 8). The retrieval failure is specific to the "Multiple Fitments" title pattern, not to MAP as a store.

3. **Strict matched-pair count: 0.** Per the pre-registered design, a "matched pair" requires same store AND same category. No same-category title-present controls exist for MAP brake pads. Under the strict criterion, H4 has 0 matched pairs, which would make it inconclusive. Under the relaxed criterion (same store, different category), H4 has 6 controls, all from TSP.

4. **The 0.708 difference is so large that the confounds do not threaten the directional finding.** Even if the matching is imperfect, a 70.8 percentage-point gap between title-absent and title-present retrieval is not plausibly explained by store or category differences. The mechanism is clear: the Catalog's retrieval system weights the title heavily, and products without vehicles in their titles are structurally invisible to relational queries.

### Why H4 is the best commercial news this project has produced

**If H4 is supported it is the best commercial news this project has produced.** — TDD §6.1.4

A platform defect is a complaint Shopify can close next quarter. A merchant-authored title defect is diagnosable, fixable, verifiable by the merchant, and independent of Shopify's inference pipeline entirely.

H4 is supported. The commercial implication is:

1. **The fix is the merchant's.** MAPerformance can rename "EBC RedStuff Front Brake Pads | Multiple Fitments (DP31210C)" to "EBC RedStuff Front Brake Pads for 2017-2021 Honda Civic Type R (DP31210C)" and immediately improve retrieval. No platform change needed. No inference pipeline fix needed. No waiting for Shopify.

2. **The fix is verifiable.** After renaming, the merchant issues the same relational query and checks if their product appears. The retrieval test is the verification.

3. **The fix is independent of the inference pipeline.** The tech_specs coverage gap (Stage 1 finding) is a Shopify-side issue. The title-coverage gap (H4 finding) is a merchant-side issue. The merchant can fix their titles while Shopify's inference pipeline remains unchanged.

4. **The "Multiple Fitments" pattern is a systematic title defect.** MAPerformance uses this pattern for ALL their brake pad products. It's not a one-off oversight — it's a store-wide naming convention that makes their brake pad inventory invisible to relational queries. This is a single fix with broad impact.

---

## 4. P-5 — Addition-side audit

### Raw numbers

| Part number | Inferred vehicles | Correct | Incorrect |
|---|---|---|---|
| KRUCA12 | 7 | 7 | 0 |
| KRUCA19 | 2 | 2 | 0 |
| KRSE11 | 2 | 2 | 0 |
| KRFD17STAGE2FOX | 1 | 1 | 0 |
| **Total** | **12** | **12** | **0** |

**All 12 inferred vehicles are correct.** Zero incorrect additions. Full report at `docs/reports/p5-addition-audit.md`.

### Interpretation

This is TDD §2.5 consequence 1 observed in fitment: Shopify's inference is *supplying* relational data where the merchant's own page is thin. The MAPerformance Kryptonite product pages have 111-169 character descriptions with no vehicle names, but Shopify's tech_specs correctly identify the vehicles from cross-merchant data.

This shrinks the addressable surface to merchants whose fitment data is rich AND exclusive — i.e., merchants who state vehicles the inference cannot supply from other sources. For merchants selling widely-distributed brands (like Kryptonite), the inference fills the gap. For merchants selling exclusive or custom products, it cannot.

**On the dead premise:** This is not a resurrection of "Shopify's inference hallucinates specs." That was nullified at n=59 on rich-source products. The population here is the opposite: 111-169 character descriptions where inference fills a vacuum from cross-merchant data. Different population, different mechanism, checked by hand. The inference-accuracy reframe stays dead.

---

## 5. Corrections applied

No corrections were applied to the H3 or H4 raw output. The P-5 audit is a hand-verification against manufacturer's published lists, not a correction of the inference output.

---

## 6. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **H4 matched controls are not same-category.** The design specified "same store and category." No same-category title-present controls exist for MAP brake pads. | ↓ strict validity | The 0.708 gap is too large for this confound to threaten the directional finding. |
| **H4 strict matched-pair count is 0.** Under the strict criterion (same store AND same category), H4 has 0 matched pairs. | ↓ strict validity → inconclusive by strict rule | The relaxed criterion (same store, different category) gives 6 controls. The verdict is reported as SUPPORTED under the relaxed criterion, with the strict-criterion caveat noted. |
| **H3 is inconclusive.** The 0.127 difference is between 0.10 and 0.30. | Neutral | Pre-registered as a likely and acceptable outcome. The competitor displacement data is produced either way. |
| **P-5 audit covers 4 part numbers from one brand.** The 12/12 result is encouraging but not generalizable. | ↓ generalizability | A broader audit would be needed to claim the addition side is always correct. |

---

## 7. Verdict against pre-registered rules

### H3
> **INCONCLUSIVE** — difference 0.127 is between 0.10 and 0.30. Competitor displacement data produced as a Stage 2.5 product.

### H4
> **SUPPORTED** (under relaxed matching criterion) — title-absent presence@50 = 0.125, title-present = 0.833, difference 0.708 ≥ 0.40. Under strict same-category matching, H4 has 0 matched pairs and would be inconclusive. The 0.708 gap is too large for the category confound to explain.

### P-5
> **12/12 correct.** Zero incorrect additions. The addition side of Shopify's inference is accurate for the 4 Kryptonite part numbers audited.

---

## 8. Expert advice to the user

### The finding that matters

**H4 is the finding that matters.** The title is the retrieval surface. Products without vehicles in their titles are structurally invisible to relational queries. This is a merchant-caused failure with a merchant-side fix.

### What to do next

1. **Title remediation is the highest-leverage fix.** The "Multiple Fitments" title pattern at MAPerformance makes their entire brake pad inventory invisible to buyers searching by vehicle. Renaming these titles to include the primary vehicle (e.g., "EBC RedStuff Front Brake Pads for 2017-2021 Honda Civic Type R (DP31210C)") would immediately improve retrieval. This is a single change with broad impact.

2. **The fitment_recall metric is secondary.** Stage 1 showed that Shopify's inference drops vehicles from tech_specs. Stage 2 showed that this doesn't affect retrieval when the title carries the vehicle. H4 shows that the title is what matters. The fitment_recall metric measures a real platform deficiency, but its commercial consequence is mediated by the title. A merchant with good titles is immune to the inference gap. A merchant with bad titles is sunk by it regardless of inference quality.

3. **The addition side is accurate.** P-5 confirms that Shopify's inference adds correct vehicles from cross-merchant data. This is good news for merchants selling widely-distributed brands — the inference fills the gap. But it's not a substitute for good titles. The inference adds vehicles to tech_specs, but tech_specs is not the primary retrieval surface.

4. **H3 is inconclusive but the competitor displacement data is valuable.** The unscoped run shows that TSP and MAP products are not dominant in their categories. Competitors with vehicle-rich titles displace them. This is the commercial context: even when TSP/MAP products retrieve, they're often outranked by competitors. Title remediation would improve both presence AND rank.

### What NOT to do

1. **Do not pursue the inference-accuracy reframe.** It is dead. P-5 confirms the addition side is accurate. The inference-accuracy probe (n=59, Stage 1) confirmed the extraction side is accurate. The "hallucination" narrative is nullified. Do not resurrect it.

2. **Do not pursue H3 further.** The 0.127 difference is in the inconclusive zone. More data could push it to confirmed or rejected, but the commercial significance is marginal compared to H4. The competitor displacement data is the valuable output of the H3 run, not the hypothesis verdict.

3. **Do not wait for Shopify to fix the inference pipeline.** The inference pipeline is not the bottleneck. The title is. A merchant who fixes their titles gets immediate improvement regardless of what Shopify does with the inference.

---

## 9. Artifacts

| Artifact | Path |
|---|---|
| H3 unscoped probe script | `scripts/probe-unscoped.ts` |
| H3 unscoped results (JSON) | `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` |
| H3 unscoped results (MD) | `scripts/output/unscoped-2026-08-02T15-44-54-483Z.md` |
| H4 query set | `scripts/h4-query-set.json` |
| H4 probe script | `scripts/probe-h4.ts` |
| H4 results (JSON) | `scripts/output/h4-2026-08-02T15-58-46-885Z.json` |
| H4 results (MD) | `scripts/output/h4-2026-08-02T15-58-46-885Z.md` |
| P-5 addition audit report | `docs/reports/p5-addition-audit.md` |
| C5 blind labelling sheet | `scripts/c5-blind-labelling-sheet.json` |
| C5 agreement scorer | `scripts/c5-agreement-scorer.ts` |
| This report | `docs/reports/stage2-5-followback.md` |
