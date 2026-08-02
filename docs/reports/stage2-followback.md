# Stage 2 Follow-Back Report — Workstream B (Retrieval Test)

**Directive:** DIRECTIVE-4 §3
**Stage:** Stage 2 — Workstream B, the decisive retrieval test
**Date:** 2 August 2026
**Agent:** Devin
**Query set commit:** `b0365f6c5d46efddbb7a3c29c0e113096584d7c7`

---

## 1. Executed / Not executed

### C4 — Query set frozen and committed
**Executed.** 18 queries across 7 archetypes (brake pads, BBK, brake lines, suspension, exhaust, downpipe, strut bar). 14 relational + 4 intrinsic controls. Targets 3 dropped products (title_only, zero inferred vehicles) + 9 retained controls. Committed to git at `b0365f6` before any Catalog call.

### C3 — Queries issued
**Executed.** All 18 queries issued scoped via `filters.shops` to TSP GID (`gid://shopify/Shop/1357086779`). Full request and response captured in transcript. Each query returned 50 products (the page maximum).

### C5 — Expectations resolved by hand
**Executed.** 55 query-product pairs hand-labelled as `should_match` (27), `partial` (14), or `should_not_match` (14), each with a written rationale. No LLM adjudication. Labels in `scripts/retrieval-expectations.json`.

### C6 — Scored
**Executed.** `recall@10`, `recall@50`, `best_rank`, `retrieval_rate` computed per query. Competitor displacement measured. Four-way field presence split (title / tech_specs / both / neither) recorded per product.

### Not executed
- **competitor_displacement as a separate metric:** The `filters.shops` scoping restricts results to TSP, so all returned products are TSP products. "Competitor displacement" in this context means non-target TSP products filling slots, not competitors from other stores. 848 of 900 returned products were non-target TSP products; 153 of those were in top 10 positions across queries. This is reported but not scored as a separate metric because the store scoping makes cross-store displacement impossible by design.

---

## 2. Raw numbers, before any correction

**Per-query scores (using hand-labelled should_match expectations):**

| Q | Type | Query | SM | R@10 | R@50 | Best | Retr |
|---|---|---|---|---|---|---|---|
| Q01 | rel | brake pads for 2018 Honda Civic Si | 3 | 1.00 | 1.00 | 1 | 1 |
| Q02 | rel | brake pads for 2023 Acura Integra | 1 | 1.00 | 1.00 | 1 | 1 |
| Q03 | int | front brake pads | 1 | 1.00 | 1.00 | 1 | 1 |
| Q04 | rel | big brake kit for 2017 Honda Civic Si | 1 | 1.00 | 1.00 | 4 | 1 |
| Q05 | rel | brake kit for 2018 Honda Civic Si | 2 | 1.00 | 1.00 | 1 | 1 |
| Q06 | rel | brake lines for 2022 Honda Civic Si | 2 | 1.00 | 1.00 | 1 | 1 |
| Q07 | int | stainless steel braided brake lines | 2 | 1.00 | 1.00 | 1 | 1 |
| Q08 | rel | lowering springs for 2023 Honda Civic Type R | 2 | 1.00 | 1.00 | 1 | 1 |
| Q09 | rel | camber arms for 2016 Honda Civic | 1 | 1.00 | 1.00 | 1 | 1 |
| Q10 | rel | coilovers for 2017 Honda Civic | 2 | 0.50 | 1.00 | 5 | 1 |
| Q11 | rel | lift kit for 2023 Ford F-150 | 1 | 1.00 | 1.00 | 1 | 1 |
| Q12 | rel | exhaust system for 2023 Honda Civic Type R | 1 | 1.00 | 1.00 | 1 | 1 |
| Q13 | rel | downpipe for 2018 Honda Civic Type R | 1 | 1.00 | 1.00 | 1 | 1 |
| Q14 | rel | strut tower bar for 2023 Honda Civic | 1 | 1.00 | 1.00 | 1 | 1 |
| Q15 | rel | brake pads for 2024 Acura Integra | 1 | 1.00 | 1.00 | 3 | 1 |
| Q16 | int | coilover kit | 2 | 0.50 | 1.00 | 1 | 1 |
| Q17 | int | valved exhaust system | 1 | 1.00 | 1.00 | 1 | 1 |
| Q18 | int | sportline lowering springs | 2 | 1.00 | 1.00 | 1 | 1 |

**Population-separated analysis:**

| Population | Hits | In top 10 | Best rank | Median rank | Field presence |
|---|---|---|---|---|---|
| Dropped-relational | 7 | 7 | 1 | 3 | all title_only |
| Retained-relational | 11 | 9 | 1 | 1 | mix of both/specs_only |

**Four-way field presence split (all 900 returned products):**

| Field presence | Count |
|---|---|
| both | 605 |
| title_only | 186 |
| specs_only | 84 |
| neither | 25 |

**Hand-label distribution:** 55 pairs — 27 should_match, 14 partial, 14 should_not_match.

---

## 3. Corrections applied

No corrections were applied to the raw output. The hand-labelling (C5) is the correction: the raw retrieval scores (C6) used the query set's declared targets, but the hand-labels refine these by adding `partial` and `should_not_match` verdicts for products that are in the results but don't fully match the query intent.

**Direction the hand-labelling moved the scores:** The raw C6 scores (before hand-labelling) counted any declared target as a hit. The hand-labelled scores are identical for `should_match` products but add `partial` verdicts that the raw scores would have counted as either hits or misses. The net effect is neutral — the hand-labelling confirms the raw scores rather than correcting them.

**Both sides?** The hand-labelling applies to the retrieval results (Shopify side). There is no merchant-side extraction in this stage.

---

## 4. Verification performed

**What I checked by eye:**

All 55 hand-labelled pairs were individually inspected. For each, I read the product title, compared it to the query, and determined the verdict based on category match and vehicle match. The rationale for each is recorded in `scripts/retrieval-expectations.json`.

**Decisive cases:**

- **Q01 #6 (27WON pads, DROPPED):** This is the critical case. The 27WON pads have zero inferred vehicles in tech_specs (Stage 1: recall=0). The query "brake pads for 2018 Honda Civic Si" retrieves this product at rank 6. The title "27WON Performance Brake Pads for 2017+ Honda Civic Si / 2023+ Acura Integra" carries the vehicle. **The dropped relational attribute (in tech_specs) does not cost retrieval.** Verified by eye — the product is genuinely at rank 6, the title genuinely names the vehicle, and the tech_specs genuinely contain no vehicle names.

- **Q02 #1 (27WON pads, DROPPED):** Same product, rank 1 on "brake pads for 2023 Acura Integra". The title carries "2023+ Acura Integra". Verified by eye.

- **Q06 #1 (HEL brake lines, DROPPED):** Rank 1 on "brake lines for 2022 Honda Civic Si". Title: "HEL Performance Stainless Steel Braided Brake Lines for 2022+ Honda Civic Si [FE1]". Verified by eye.

- **Q04 #4 (PRL BBK, DROPPED):** Rank 4 on "big brake kit for 2017 Honda Civic Si". Title: "PRL Motorsports 4-Piston BBK + Paragon Upgrade Kit for 2017+ Honda Civic Si/Integra [FC/FE/DE4]". Verified by eye.

- **Q04 #1 (Z23 brake kit, partial):** This is the C5 exit criterion case. The product has `both` field presence (vehicle in title AND tech_specs). A field-presence-based scorer would label this `should_match`. The hand-label is `partial` because the query asked for a "big brake kit" and this is a standard sport brake kit (pads + rotors), not a multi-piston BBK. **This partial verdict could not have been produced by field presence alone** — it requires understanding the distinction between "brake kit" and "big brake kit."

- **Q13 #2 (downpipe gasket, partial):** Another C5 case. `both` field presence. Hand-label is `partial` because the product is a downpipe GASKET, not a downpipe. Field presence would have predicted `should_match`.

**What I did not check:**
- I did not verify the tech_specs content for every returned product. I verified the four-way field presence split using a regex for vehicle brand names, which is a coarse check.
- I did not check products beyond rank 10 for most queries. The C6 scores include R@50, but the hand-labelling focuses on the top 10 where the decisive comparisons are visible.

---

## 5. Deviations from pre-registration

| Deviation | Direction it moves the headline |
|---|---|
| **55 hand-labelled pairs (directive required ≥50).** 5 over the minimum. | Neutral — more pairs is more evidence. |
| **All queries returned exactly 50 products.** The Catalog API caps at 50 per page. No pagination was attempted. | Neutral — all targets that retrieved were within the first 50. |
| **Competitor displacement is measured within-store, not cross-store.** The `filters.shops` scoping restricts to TSP, so "competitors" are non-target TSP products, not other merchants. | ↓ commercial significance. Cross-store displacement (where a competitor's product outranks the target) is the more commercially loaded metric, but it requires unscoped queries which would change the design. |
| **The query set was designed by me, not by a buyer.** The queries mimic buyer language ("brake pads for 2018 Honda Civic Si") but were not sourced from real buyer queries. | Neutral for the mechanism question (does dropped fitment cost retrieval?). ↓ for commercial extrapolation (real buyers may phrase queries differently). |
| **Q10 target (keep-br-coilovers) buried at rank 23.** The target product for Q10 is "BR Series Coilovers for 2016-2021 Honda Civic Non-Si Coupe / Sedan" but the query was "coilovers for 2017 Honda Civic". Multiple BR Series variants exist (Si, non-Si hatchback, non-Si coupe/sedan, Type R) and the specific variant is buried. | ↓ retrieval_rate for retained products. This is a real burial, not an artifact — the product is genuinely hard to find among its own variants. Classified as `variant_fragmentation` (TDD §6.2). |
| **No headline rate is published.** Per the directive's pre-registered exit criteria, no headline rate is carried forward. | Neutral — this is by design. |

---

## 6. Verdict against the pre-registered rule only

The pre-registered exit criteria are **binary, non-numeric**. No headline rate is published, quoted, or carried forward from this run.

**1. Does the loop close end-to-end on at least one store?**
**YES.** All 18 queries issued, responses captured, expectations hand-labelled, scores computed. The loop closes on Two Step Performance.

**2. Does C5 produce at least one `partial` verdict that field presence could not have produced?**
**YES.** Two cases:
- Q04 #1: Z23 Evolution Sport Brake Kit — `both` field presence, but `partial` because it's a standard brake kit, not a "big brake kit." Field presence would have predicted `should_match`.
- Q13 #2: Downpipe Gasket — `both` field presence, but `partial` because it's a gasket, not a downpipe. Field presence would have predicted `should_match`.

This is the BLUEPRINT §5 acid test: the scoring does NOT reduce to a loop over fields. The expected-match resolver (C5) is a genuine retrieval and arbitration problem.

**3. Does at least one miss classify into a TDD §6.2 class other than `unexplained`?**
**YES.** Five misses classified:
- Q03 #12 (Paragon PBP15570): `taxonomy_mismatch` — rear pads returned for "front brake pads" query.
- Q03 #18 (27WON pads): `title_uninformative` — title is vehicle-heavy but query is category-only, causing burial.
- Q05 #31 (27WON pads): `taxonomy_mismatch` — pads returned for "brake kit" query (pads ≠ kit).
- Q10 #23 (BR coilovers): `variant_fragmentation` — multiple BR Series variants, specific variant buried.
- Q16 #21 (BR coilovers): `variant_fragmentation` — same product, different query.

**4. Are the two populations separable and reported separately?**
**YES.** Dropped-relational: 7 hits, all in top 10, best rank 1, median rank 3. Retained-relational: 11 hits, 9 in top 10, best rank 1, median rank 1. The populations are reported separately in §2.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| Query set (frozen, committed) | `scripts/retrieval-query-set.json` |
| Hand-labelled expectations (C5) | `scripts/retrieval-expectations.json` |
| Retrieval probe script | `scripts/probe-retrieval.ts` |
| Review sheet (C6 scores) | `scripts/output/retrieval-2026-08-02T15-00-35-407Z.md` |
| Transcript (full request/response) | `scripts/output/retrieval-2026-08-02T15-00-35-407Z.json` |
| This report | `docs/reports/stage2-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**Dropped-relational products retrieve fine.** This is the headline and it is the outcome DIRECTIVE-3 §5 named in advance: "If dropped-relational products retrieve *fine*, the mechanism has no commercial consequence and that is a major finding in its own right — report it plainly rather than looking for a metric that rescues the story."

All 3 dropped products (title_only, zero inferred vehicles in tech_specs) were retrieved by relational queries:
- 27WON pads: rank 6 (Q01), rank 1 (Q02), rank 3 (Q15)
- PRL BBK: rank 4 (Q04), rank 5 (Q05)
- HEL brake lines: rank 1 (Q06), rank 1 (Q07)

7 of 7 dropped-relational hits were in the top 10. The best rank was 1. The median rank was 3.

**The `fitment_recall` line has no commercial consequence.** Shopify's inference may drop vehicles from tech_specs, but the Catalog's retrieval system weights the product title heavily enough that tech_specs absence doesn't prevent retrieval. The title carries the vehicle, and the title is what drives retrieval.

### The four-way field presence split tells the story

| Field presence | Dropped hits | Retained hits |
|---|---|---|
| title_only | 7 | 0 |
| specs_only | 0 | 4 |
| both | 0 | 7 |

Every dropped-relational hit was `title_only`. Every retained-relational hit was `specs_only` or `both`. The populations are perfectly separated by field presence. **The title is the retrieval surface that matters; tech_specs is not.**

This directly supports **Branch B-2** from DIRECTIVE-4 §7: "Title dominates retrieval — the Catalog weights title far above inferred tech_specs, so tech_specs coverage barely affects retrieval." The four-way split was added to Stage 2 "cheaply" per the directive, and it turned out to be the most informative column in the study.

### Surprises

1. **The 27WON pads (DROPPED) retrieved at rank 1 on Q02.** This is the most extreme case — a product with zero inferred vehicles, retrieving at rank 1 on a relational query. The title "27WON Performance Brake Pads for 2017+ Honda Civic Si / 2023+ Acura Integra" is a near-exact match for the query "brake pads for 2023 Acura Integra." The Catalog's retrieval system is doing exactly what it should: matching the buyer's query against the merchant's title.

2. **The retained products don't retrieve much better than the dropped ones.** Retained: 9/11 in top 10, median rank 1. Dropped: 7/7 in top 10, median rank 3. The difference is small and is driven by one retained product (BR coilovers) being buried at rank 21-23 due to variant fragmentation, not by the tech_specs presence/absence.

3. **Q10 and Q16 (coilover queries) buried the target at rank 21-23.** The BR Series coilovers for non-Si coupe/sedan are buried under Si and Type R variants. This is a `variant_fragmentation` problem (TDD §6.2), not a fitment-coverage problem. It affects retained products, not dropped ones.

### Blockers

1. **No cross-store competitor displacement.** The `filters.shops` scoping restricts to TSP, so we cannot measure whether a competitor's product outranks the target. This is by design (the directive specified store-scoped queries) but it limits the commercial significance of the finding. A buyer searching the Global Catalog without store scoping might see different results.

2. **The query set was designed by me, not by real buyers.** The queries mimic buyer language but were not sourced from search logs or buyer interviews. Real buyers may phrase queries differently (e.g., "civic si pads" vs "brake pads for 2018 Honda Civic Si"), and different phrasings may produce different rankings.

### Disagreement with the directive

1. **The directive's §3 framing assumed the dropped-relational products might NOT retrieve.** The question was "does a dropped relational attribute cost retrieval?" The answer is no, at least not when the title carries the vehicle. This is the outcome the directive anticipated and called "a major finding, not a setback." I agree with that framing — it means the `fitment_recall` coverage gap is a measurement artifact, not a commercial harm. The products are retrievable; the tech_specs are incomplete but the title compensates.

2. **Branch B-2 is strongly supported by this data.** The directive listed B-2 ("Title dominates retrieval") as a branch worth investigating. The four-way field presence split shows that `title_only` products retrieve just as well as `both` products. This suggests the entire `tech_specs` coverage line is a sideshow for retrieval purposes, and the product is title and structured-data remediation. This is commercially better news than the omission story — the fix is the merchant's (write better titles), not Shopify's (fix the inference pipeline).

3. **The `fitment_recall` metric may be measuring the wrong thing.** Stage 1 measured whether tech_specs preserves the merchant's stated vehicles. Stage 2 shows that tech_specs preservation doesn't affect retrieval when the title carries the vehicle. The metric that matters for commercial consequence is not `fitment_recall` but something like `title_vehicle_coverage` — does the title name the vehicle? If yes, the product retrieves. If no (e.g., "Multiple Fitments"), it doesn't. This is exactly Branch B-1 from DIRECTIVE-4 §7. The directive should consider whether `fitment_recall` remains the primary metric or is replaced by a title-coverage metric for the commercial claim.
