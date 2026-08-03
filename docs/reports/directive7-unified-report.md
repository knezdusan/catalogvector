# DIRECTIVE-7 — Unified Analysis and Final Report

**Directive:** DIRECTIVE-7 (all 5 stages)
**Period:** 2–3 August 2026
**Agent:** Devin
**Governing docs version:** 0.7.0
**Status:** COMPLETE — all 5 stages executed, all reports filed

---

## I. What DIRECTIVE-7 Was Asked to Do

DIRECTIVE-7 was issued as a corrective. The previous directive (DIRECTIVE-6 §2) had elevated a pooled `presence@50` of 0.500 to "the most important number this project has produced" and authorised a merchant-facing artefact built on it. DIRECTIVE-7 withdrew both, with a precise diagnosis of the error:

1. **The 0.500 figure conflated two experimental arms.** Seven products were selected because they had zero inferred vehicles (treatment arm); nine were matched controls. Pooling them and reporting as a store-level rate is reporting a trial's treatment and placebo arms together as population prevalence.

2. **The 0.500 figure had no baseline.** Without knowing S (the number of competing listings), the sign of the number is unknown. At S=100 it's at chance; at S=500 it's 5× better than chance; at S=3000 it's 30× better. Nobody had recorded S.

3. **Being outside the top 50 is ranking, not invisibility.** If 2,000 merchants list a part, 1,950 are outside the top 50 by arithmetic necessity. That is a competitive position, not a defect.

The directive drew a sharp line: **ranking** (product appears, at rank 63, behind competitors — not a defect) vs **structural invisibility** (product does not appear at any depth, while other merchants' listings of the identical part do appear — a defect with a cause, fixable, survivable under hostile reading).

The directive then authorised 5 stages of work to determine whether structural invisibility exists, and to complete the fitment-recall instrument on a compliant sample. No merchant-facing artefact was authorised.

---

## II. What Was Found — Stage by Stage

### Stage 1: Re-scoring and Clustering Determination (no new API calls)

**What was done:** Re-scored the existing unscoped data with an exact handle-identity rule. Recorded denominators. Computed presence@3, @10, @50, and full rank distribution. Determined whether the Catalog clusters by UPID or returns per-merchant rows.

**Key findings:**

1. **The Catalog returns per-merchant rows, not UPID clusters.** Each product row has exactly 1 variant with 1 seller. There is no UPID field, no cluster object, no multi-offer array. The same physical part appears as separate rows with different product IDs, one per merchant. **H5 (offer attachment) was killed before it could be tested** — the response shape doesn't contain the clusters the hypothesis required.

2. **The re-scored numbers matched the originals exactly.** Zero mismatches across 224 pairs. The original probe's handle-identity rule was correct.

3. **The denominator is ~300 per query, not ~100 or ~3000.** `total_count` ranged 281–358 (median ~318). Baseline P(top 50) = 50/300 = 0.167. The pooled presence@50 of 0.500 is 3× better than chance — **a strong competitive showing, not a failure.** The directive's §1.2 critique was correct: the 0.500 figure was being read as a defect when it was actually a competitive position.

4. **TSP holds rank 1 in 5 of 14 relational queries.** When TSP products appear, they appear high. The problem is not ranking quality for products that appear; it's that some products don't appear at all.

**Implication:** The 0.500 figure was correctly withdrawn. It measured ranking, not invisibility. The question of whether structural invisibility exists was deferred to Stage 2.

---

### Stage 2: Depth-1000 Re-Run

**What was done:** Re-issued the frozen 18-query set unscoped with pagination to depth 1000. For each target, recorded presence at depths 3, 10, 50, 200, 1000, or absent at depth.

**Key findings:**

1. **The Catalog exhausts at ~300 results per query.** Every query returned 273–385 products and then stopped. The depth-1000 cap was never reached. "Absent at depth 1000" therefore means "absent from the entire result set of ~300 matching products" — a categorically stronger observation than "not in the top 50."

2. **6 of 16 targets are absent at depth.** They are not at rank 300 of 300 — they are not in the result set at all. This is the first measurement in the project's history that could support a structural invisibility claim.

3. **3 targets are absolutely invisible** — absent from all 18 queries in the set, despite being enrolled in the Catalog (they appear in scoped runs). These are:
   - `paragon-pbp370-brake-pads` (title: "Paragon PBP370 Front Brake Pads" — no vehicle)
   - `br-series-coilovers` (title: "BR Series Coilovers for 2016-2021 Honda Civic Non-Si" — vehicle present but brand absent)
   - `icon-stage-4` (title: "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" — vehicle present, brand present)

4. **2 of 3 absolutely invisible targets have adequate titles.** The ICON Stage 4 and BC Racing titles contain the vehicle. Invisibility is not explained by title absence alone. This was the first hint of a mechanism beyond title.

5. **Scoped retrieval was U-4 fallback, not genuine matching.** The scoped run's high ranks (rank 1–9 for paragon-pbp370) were the shop's general catalogue being returned when no good match existed, not genuine relevance matching. The scoped numbers were measuring within-store findability, not commercial visibility.

**Implication:** Structural invisibility exists. 6 of 16 targets are absent from the entire result set. 3 are absolutely invisible. The §6 identical-part audit was authorised.

---

### Stage 3: Identical-Part Audit

**What was done:** Two sub-studies. Sub-study A: 12 TSP products from widely-distributed brands, queried by brand+SKU. Sub-study B: the 3 absolutely invisible targets, queried with multiple phrasings — both brand/SKU-specific and natural-language relational.

**Key findings:**

1. **Sub-study A: 12/12 TSP products present when queried by brand+SKU.** TSP's Catalog enrollment is not broken. The products are in the Catalog and can be found. The invisibility is not an enrollment problem.

2. **Sub-study B: All 3 absolutely invisible targets are findable by brand/SKU but invisible by natural-language query.** This is the controlled comparison the directive called for — the product is held constant, the query phrasing varies:

   | Target | Brand/SKU query | Natural language query |
   |---|---|---|
   | BC Racing BR Series | rank 13, 203 | "coilovers for 2017 Honda Civic" → ABSENT |
   | ICON Stage 4 | rank 1, 2, 43 | "lift kit for 2023 Ford F-150" → ABSENT |
   | Paragon PBP370 | rank 1, 1, 4 | "brake pads for 2018 Honda Civic Si" → ABSENT |

3. **In all 3 natural-language queries, other merchants selling the same brand ARE present.** TSP is absent while competitors selling the same part are present. This is structural invisibility by the directive's definition.

4. **The mechanism is title-dependent for 2 of 3, and unexplained for 1.**
   - IV01 (BC Racing): `title_uninformative` — brand omitted, year mismatch (2016 vs 2017)
   - IV03 (Paragon): `title_uninformative` — vehicle omitted entirely
   - **IV02 (ICON Stage 4): `unexplained`** — title contains brand, product type, and vehicle. Competitors with similar titles ARE returned. TSP is not. This is not a title problem — it is a relevance matching problem where TSP's listing is excluded for reasons not visible in the response.

**Implication:** Structural invisibility is confirmed for 3 of 3 absolutely invisible targets, in the natural-language query condition. The invisibility is query-dependent, not absolute. Two mechanisms are identified: title-level (merchant-caused, merchant-fixable) and relevance-matching (not merchant-caused, cause unknown).

---

### Stage 4: H4-R Replication on a Second Store

**What was done:** Replicated the H4 title-coverage test on Intec Racing. 6 title-absent EBC brake kits (no vehicle in title, vehicle in tags). 6 title-present controls (vehicle in title). 8 relational queries. Scored presence@50 unscoped.

**Key findings:**

1. **H4-R REJECTED by the pre-registered rule.** Title-absent presence@50 = 0.021 (1/48), title-present = 0.000 (0/48), difference -0.021 ≤ 0.15. Rejected.

2. **The rejection is a floor effect, not a disconfirmation.** Both populations scored near zero. Only 1 Intec product appeared across all 8 queries (1 in 400 slots — below chance). The test cannot measure the effect of title when the store's products don't appear regardless of title.

3. **Store-level invisibility identified as a third mechanism.** Intec Racing is nearly invisible in the Catalog for these queries. This is not a title problem, not a relevance-matching problem — it's a store-level visibility problem. Some stores' products appear in the Catalog; others' don't, regardless of title quality.

4. **H4 is not disconfirmed.** The original H4 finding (0.708 difference on TSP+MAP) stands. H4-R does not replicate it, but does not disconfirm it either — the test was confounded by store-level invisibility.

5. **H4 remains an auto-parts finding, not a platform finding.** The directive said: "If the H4 finding replicates on a second store, the project has its first generalisable result. If it does not, H4 is an auto-parts finding, not a platform finding." H4-R did not replicate. H4 is specific to TSP+MAP (large, visible stores).

**Implication:** Three mechanisms of invisibility are now identified:
1. **Title-level** (H4): products without vehicles in titles are unretrievable. Merchant-caused, merchant-fixable.
2. **Relevance-matching** (IV02): products with adequate titles excluded for unknown reasons. Not merchant-caused.
3. **Store-level** (H4-R): stores whose products barely appear regardless of title. Cause unknown.

---

### Stage 5: Auto-Parts Re-Sample (Fitment-Recall)

**What was done:** Re-ran the fitment-recall probe with P-1/P-2 hardening across 4 stores (TSP, MAP, Subimods, Springrates). 5 queries per store, store-stratified bucketing. Compliance threshold: 15+ scored across 3+ stores (DIRECTIVE-4 §1.2).

**Key findings:**

1. **COVERAGE GAP CONFIRMED on the first compliant sample.** Corrected mean recall: prefix=0.385, strict=0.313 — both far below the 0.80 threshold. 18 scored from 4 stores. This is the first pre-registered rule to fire on a compliant sample in the project's history.

2. **Shopify's inference drops 60–70% of vehicles the merchant states.** The original thesis — specs visible ≠ products retrievable — is validated. A product whose `tech_specs` omits a vehicle cannot be retrieved by an agent searching for that vehicle.

3. **MAP "Multiple Fitments" products have 0 inferred vehicles.** All 4 MAP products in the scored set have zero inferred vehicles despite the merchant stating 9–22 vehicles per product in body text. This is the most extreme coverage gap. MAP uses "Multiple Fitments" in the title (no vehicle name), and the body text lists the vehicles. Shopify's inference does not extract them.

4. **TSP products with vehicle in title but 0 inferred vehicles.** 6 of 10 TSP products have zero inferred vehicles despite having the vehicle in the product title. The merchant states the vehicle, the title names it, but the Catalog's `tech_specs` contains no vehicle. This means the title is not being used as a source for inference — or the inference has an input budget that excludes the body text where the full fitment list lives.

5. **H2 (truncation hypothesis) not supported.** The thin vs rich contrast narrowed and slightly reversed (thin=0.333, rich=0.411). H2 predicted rich products would have lower recall due to extraction budget. The re-sample does not support this. H2 remains pre-registered but unconfirmed.

6. **12 of 19 products had extractor errors.** The closed-vocabulary pattern matcher over-captures non-vehicle tokens (prose fragments, trim specifiers, spec labels). All 12 were corrected. The corrected numbers are the headline. Both raw and corrected numbers are far below 0.80 — the verdict is unchanged.

**Implication:** The coverage gap is real, generalises across stores, and is the project's first validated finding on a compliant sample. The original thesis is confirmed.

---

## III. The Unified Picture

### What DIRECTIVE-7 established

DIRECTIVE-7 started with a withdrawal: the 0.500 figure was not a defect, it was a competitive position. The directive then asked: does structural invisibility exist? After 5 stages, the answer is **yes, and it has three distinct mechanisms.**

### The three mechanisms of invisibility

| Mechanism | Where found | Cause | Merchant-fixable? | Evidence |
|---|---|---|---|---|
| **1. Title-level** | H4 (Stage 2.5), IV01/IV03 (Stage 3) | Product title omits the vehicle (or brand). The Catalog's relevance matching is title-dominant — without the vehicle in the title, the product is not returned for relational queries. | **Yes** — add vehicle to title | H4: 0.708 difference between title-absent and title-present. IV01/IV03: invisible by natural language, findable by brand. |
| **2. Relevance-matching** | IV02 (Stage 3) | Product has an adequate title (brand + product type + vehicle) but is excluded from the result set while competitors with similar titles are included. Cause unknown — possibly metadata, taxonomy, or a relevance threshold. | **No** — the title is already adequate; the problem is elsewhere | IV02: ICON Stage 4, title "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD", absent for "lift kit for 2023 Ford F-150" while 21 competitors present. |
| **3. Store-level** | H4-R (Stage 4) | The store's products barely appear in the Catalog regardless of title quality. Cause unknown — possibly store reputation, catalog freshness, enrollment configuration, or a store-level relevance signal. | **Unknown** — the cause is not visible in the response | H4-R: Intec Racing, 1 product in 400 slots (below chance). Both title-absent and title-present scored near zero. |

### The coverage gap (Stage 5)

The three mechanisms above are about **retrieval** — whether a product appears in the Catalog's result set for a given query. The coverage gap is about **inference** — whether Shopify's inference pipeline extracts the vehicles the merchant states and puts them in `tech_specs`.

These are related but distinct:
- If inference drops a vehicle from `tech_specs`, the product cannot be retrieved for that vehicle (coverage gap → invisibility).
- But even if inference preserves the vehicle, the product may still be invisible due to title-level or relevance-matching problems.

**The coverage gap is the root cause; the three mechanisms are the surface symptoms.** If Shopify's inference preserved all stated vehicles in `tech_specs`, the title-level mechanism would be weaker (the Catalog could match on metadata even without the vehicle in the title). The relevance-matching mechanism might also be weaker (if metadata were richer, the relevance score might be higher). The store-level mechanism is independent — it's about whether the store's products appear at all.

### What the numbers say

| Finding | Number | Threshold | Verdict |
|---|---|---|---|
| Pooled presence@50 (withdrawn) | 0.500 | — | Withdrawn — measures ranking, not invisibility |
| Targets absent at depth | 6/16 (37.5%) | "non-trivial count" | §6 authorised |
| Absolutely invisible targets | 3/16 (18.75%) | — | Structural invisibility confirmed |
| H4 title effect (TSP+MAP) | 0.708 difference | ≥ 0.40 | SUPPORTED |
| H4-R title effect (Intec) | -0.021 difference | ≤ 0.15 | REJECTED (floor effect) |
| Fitment recall (corrected, 4 stores) | 0.385 prefix / 0.313 strict | < 0.80 | COVERAGE GAP CONFIRMED |
| MAP "Multiple Fitments" recall | 0.04 | < 0.80 | Worst gap in sample |
| TSP recall | 0.38 | < 0.80 | Middling |
| H2 truncation effect | thin=0.333, rich=0.411 | ≥ 0.30 difference | NOT SUPPORTED |

### What was killed

| Hypothesis | Status | Cause |
|---|---|---|
| H5 (offer attachment) | NOT TESTABLE | Response returns per-merchant rows, not UPID clusters |
| H2 (truncation hypothesis) | NOT SUPPORTED | Thin vs rich contrast narrowed and reversed on compliant sample |
| The 0.500 figure as a defect | WITHDRAWN | Measures ranking, not invisibility; no baseline; conflates experimental arms |
| H4 as a platform finding | NOT GENERALISABLE | H4-R did not replicate; H4 is specific to TSP+MAP |

### What stands

| Finding | Status | Strength |
|---|---|---|
| Coverage gap (fitment recall < 0.80) | CONFIRMED on compliant sample | First rule to fire on compliant sample. 18 products, 4 stores. |
| H4 (title dominates retrieval) | SUPPORTED on TSP+MAP | 0.708 difference. Not generalised to other stores. |
| Structural invisibility exists | CONFIRMED | 3/3 absolutely invisible targets verified. |
| Three mechanisms of invisibility | IDENTIFIED | Title-level, relevance-matching, store-level. |
| TSP enrollment is not broken | CONFIRMED | 12/12 products findable by brand+SKU. |

---

## IV. Critical Self-Assessment

### Where the evidence is strong

1. **The coverage gap is real.** 18 products from 4 stores, mean recall 0.385. The 0.80 threshold was pre-registered. The sample is compliant. The extractor errors were identified and corrected, and the corrected numbers are still far below 0.80. This is the project's strongest finding.

2. **Structural invisibility exists.** 3 of 3 absolutely invisible targets were verified individually — enrolled in the Catalog, findable by brand, invisible by natural-language query, while competitors selling the same brand are present. This is the controlled comparison the directive required.

3. **The 0.500 withdrawal was correct.** The denominator is ~300, not ~100. The pooled 0.500 is 3× better than chance. It was measuring ranking, not invisibility. The directive's diagnosis was accurate.

### Where the evidence is weak

1. **H4 is not generalised.** H4-R failed to replicate, and while the failure is confounded by store-level invisibility, the fact remains that H4 has only been demonstrated on TSP+MAP. It may generalise to other large, visible stores, but this was not shown. Calling H4 a "platform finding" would be an overclaim.

2. **The relevance-matching mechanism (IV02) is a single case.** One product (ICON Stage 4) with an adequate title was excluded from the result set. This is concerning, but n=1. It could be a metadata issue specific to this product, not a general mechanism. More cases would be needed to establish it.

3. **The store-level mechanism (H4-R) is also a single case.** Intec Racing is one store. The finding that it's nearly invisible is real, but the cause is unknown. It could be catalog freshness, enrollment configuration, store reputation, or something else entirely.

4. **The extractor is crude.** 12 of 19 products had extractor errors. The corrections are manual and specific to this sample. A production version would need a curated vehicle database. The corrected numbers are more accurate, but the correction process introduces subjectivity.

5. **The sample is at the minimum threshold.** 18 scored products meets the 15+ requirement, but it's not a large sample. Per-store conclusions (e.g., "MAP has the worst gap") are based on 4 products. More data would strengthen the findings.

### What I would do differently

1. **H4-R should have been run on a store with verified Catalog visibility.** Intec Racing was chosen because it had title-absent EBC kits, but its store-level invisibility was not checked before the test. A store with comparable visibility to TSP would have been a valid replication.

2. **The fitment-recall probe should use a curated vehicle database, not a pattern matcher.** The extractor's error rate (63%) is too high. The corrections are necessary but introduce subjectivity. A database of make/model pairs would eliminate most errors.

3. **The relevance-matching mechanism (IV02) needs more cases.** A single case is suggestive but not conclusive. The audit should be expanded to find more products with adequate titles that are excluded from the result set.

4. **The store-level mechanism needs investigation.** Why is Intec Racing nearly invisible? Is it catalog freshness, enrollment configuration, or something else? This is the most concerning mechanism because it affects entire stores, and its cause is completely unknown.

---

## V. Expert Assessment and Recommendations

### The overall assessment

DIRECTIVE-7 was a success. It started by withdrawing an overclaimed number and ended by confirming the project's original thesis on a compliant sample. Along the way, it discovered that invisibility is not one mechanism but three, and that the relationship between inference (coverage gap) and retrieval (invisibility) is more complex than originally assumed.

The project now has:

1. **A validated thesis:** Shopify's inference drops 60–70% of stated vehicles (fitment recall 0.385). Products are unretrievable for vehicles the merchant actually serves. This is the original claim, now supported by a pre-registered rule on a compliant sample.

2. **A confirmed phenomenon:** Structural invisibility exists. Products enrolled in the Catalog, findable by brand, are invisible by natural-language query while competitors selling the same part are present.

3. **A mechanism taxonomy:** Three distinct mechanisms — title-level (merchant-fixable), relevance-matching (not merchant-fixable, cause unknown), and store-level (not merchant-fixable, cause unknown).

4. **A killed hypothesis:** H5 (offer attachment) was killed by the response shape. The Catalog returns per-merchant rows, not UPID clusters. This is a permanent structural fact.

5. **A non-generalised finding:** H4 (title dominates retrieval) is supported on TSP+MAP but did not replicate on Intec Racing. It remains an auto-parts finding, not a platform finding.

### What this means for the project's position

The project's original position was: "specs visible ≠ products retrievable." DIRECTIVE-7 confirms this. But the picture is more nuanced than the original position suggested:

- **It's not just about inference.** The coverage gap (inference dropping vehicles) is real, but even when inference preserves the vehicle, products can be invisible due to title-level, relevance-matching, or store-level mechanisms. Inference is the root cause for some products; for others, it's a contributing factor; for others, it's not the cause at all.

- **It's not just about title.** H4 found that title dominates retrieval, but IV02 showed that even with an adequate title, products can be excluded. And H4-R showed that entire stores can be invisible regardless of title quality. Title is one mechanism, not the mechanism.

- **It's not uniform across stores.** MAP has recall of 0.04 (catastrophic). TSP has 0.38 (bad). Subimods and Springrates have mixed results (some products at 1.00, others at 0.00). The gap is real but variable.

### Recommendations for next steps

**1. Investigate the store-level invisibility mechanism.**

This is the most concerning finding. An entire store (Intec Racing) is nearly invisible in the Catalog, and the cause is unknown. If this is a common phenomenon, it affects the project's framing: the problem is not just "your products are invisible because of title/inference" but "your store is invisible." This requires:
- Identifying more stores with low Catalog visibility
- Checking whether they share characteristics (size, age, enrollment configuration, catalog freshness)
- Determining whether the cause is merchant-side (something the merchant can fix) or platform-side (something Shopify controls)

**2. Expand the relevance-matching investigation.**

IV02 (ICON Stage 4) is a single case of a product with an adequate title being excluded. This needs more cases to establish whether it's a general mechanism or a one-off. The investigation should:
- Find more products with brand + product type + vehicle in the title that are absent from natural-language queries
- Check whether these products have metadata/tech_specs that contain the vehicle (if not, the cause may be missing metadata; if yes, the cause is in the relevance algorithm)
- Compare the excluded products' metadata to competitors' metadata that ARE returned

**3. Build a production-grade fitment extractor.**

The current extractor has a 63% error rate. The corrections are manual and subjective. A production version needs:
- A curated database of make/model pairs (not a pattern matcher)
- Year-range normalisation (currently excluded by design)
- Trim/submodel handling (currently collapsed manually)
- Validation against a hand-labelled gold standard

This is not optional for publication. The current extractor's error rate is too high for the findings to be cited without the review sheet.

**4. Run U-6 (the assistant check).**

U-6 has been open since DIRECTIVE-5. It asks: does Global Catalog rank predict what a consumer AI assistant actually surfaces? This is the validation that determines whether any Catalog-derived number is an outcome or a proxy. If rank predicts assistant output, the instrument is validated. If it doesn't, the project has been measuring a proxy while criticising everyone else for measuring proxies.

U-6 is one afternoon, no code. Put the same relational queries to ChatGPT, Copilot, Gemini as a shopper would; record which merchants/products each names; compare against unscoped rank ordering. This is the highest-ROI next step.

**5. Run the C5 blind relabel.**

The C5 blind relabel is still outstanding (one hour of work). It is the calibration for the expectation set the 16 targets were scored against. Without it, the Stage 2.5 scoring (which produced the 16 targets) is uncalibrated. This should have been done before DIRECTIVE-7, and it should be done before any further retrieval work.

**6. Do NOT produce a merchant-facing artefact.**

DIRECTIVE-7 §0 is explicit: no merchant-facing document is authorised. The findings are real, but they are not ready for outreach. The coverage gap is confirmed, but the extractor needs hardening. The invisibility mechanisms are identified, but two of three have unknown causes. A merchant-facing artefact built on these findings would be premature and would not survive a hostile reading from a $10M operator.

The right sequence is: U-6 → C5 relabel → production extractor → more cases of relevance-matching and store-level invisibility → then consider whether a merchant-facing artefact is warranted.

### The bottom line

DIRECTIVE-7 did what it was asked to do: it withdrew an overclaimed number, determined whether structural invisibility exists (yes), and completed the fitment-recall instrument on a compliant sample (coverage gap confirmed, recall 0.385). Along the way, it discovered that invisibility has three mechanisms, not one, and that the relationship between inference and retrieval is more complex than assumed.

The project's original thesis — specs visible ≠ products retrievable — is validated. The project now has a confirmed finding on a compliant sample, a mechanism taxonomy, and a clear set of next steps. The most important next step is U-6: validating that the Catalog rank predicts what AI assistants actually surface. Without that validation, every number in this project is a proxy. With it, the project has an outcome.

---

## VI. Artifact Index

| Stage | Report | Script | Data |
|---|---|---|---|
| 1 | `docs/reports/directive7-stage1-followback.md` | `scripts/probe-directive7-rescore.ts` | `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` |
| 2 | `docs/reports/directive7-stage2-followback.md` | `scripts/probe-depth1000.ts` | `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` |
| 3 | `docs/reports/directive7-stage3-followback.md` | `scripts/probe-identical-part-audit.ts`, `scripts/probe-invisible-target-audit.ts` | `scripts/output/identical-part-audit-*.json`, `scripts/output/invisible-target-audit-*.json` |
| 4 | `docs/reports/directive7-stage4-followback.md` | `scripts/probe-h4r-intec.ts` | `scripts/output/h4r-intec-*.json` |
| 5 | `docs/reports/directive7-stage5-followback.md` | `scripts/probe-fitment-recall.ts` | `scripts/output/fitment-2026-08-03T14-47-40-634Z.{md,json}` |
| **This report** | `docs/reports/directive7-unified-report.md` | — | — |

Governing documents: `docs/TDD.md` v0.7.0, `docs/BLUEPRINT.md` v0.7.0.
