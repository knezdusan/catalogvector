# DIRECTIVE-7 Stage 1 Follow-Back — §4 Re-Scoring + §3 Clustering Determination

**Directive:** DIRECTIVE-7 §3 (clustering), §4 (re-scoring), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 1 of 5 (§4 re-scoring + §3 clustering determination — no new API calls)
**Date:** 2 August 2026
**Agent:** Devin
**Source artefact:** `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json`

---

## 1. Executed / Not executed

### §3 — Clustering determination
**Executed.** Inspected `unscoped-2026-08-02T15-44-54-483Z.json` to determine whether the Catalog response clusters by UPID with multi-merchant offers, or returns per-merchant rows. All 900 products across 18 queries examined. Exact JSON paths inspected in §4 below.

### §4.1 — Presence definition locked and re-scored
**Executed.** The original probe's presence definition was identified, locked, and re-scored with an exact identity rule. Original and re-scored figures compared. Zero mismatches.

### §4.2 — Denominator recorded per query
**Executed.** Distinct seller domains in top 50 and `total_count` estimate recorded for all 18 queries.

### §4.3 — presence@10, presence@3, rank distribution computed
**Executed.** Computed per population (dropped/retained) and pooled, at depths 3, 10, 50. Full rank distribution recorded.

### §4.4 — competitor_displacement scored
**Executed.** Rank-1 domain, distinct domains in top 10, and TSP/MAP presence in top 50 recorded per query.

### §4.5 — Fallback re-examined
**Executed.** Checked for U-4-equivalent floor behaviour unscoped. No fallback artefacts identified.

### Not executed
- **§5 (depth-1000 re-run):** Not executed in this stage. Scheduled for Stage 2.
- **§3 H5 (offer attachment test):** The clustering determination (§3) found that H5 as written does not apply. This is reported in §6 below. The H5 design cannot be executed because the response shape does not contain UPID clusters.
- **§6 (identical-part audit):** Conditional on §3 or §5. Not executed.
- **H4-R (DIRECTIVE-6 §3):** Not executed. Scheduled for Stage 4.

---

## 2. Raw numbers, before any correction

### §3 — Clustering determination

**Source:** `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json`

**JSON paths inspected:**
- `transcript[*].response.result.structuredContent.products[*]` — the product array
- `transcript[*].response.result.structuredContent.products[*].id` — product identifier
- `transcript[*].response.result.structuredContent.products[*].variants[*]` — variant array
- `transcript[*].response.result.structuredContent.products[*].variants[*].seller` — seller object
- `transcript[*].response.result.structuredContent.products[*].variants[*].seller.id` — seller GID
- `transcript[*].response.result.structuredContent.ucp` — UCP metadata
- `transcript[*].response.result.structuredContent.messages` — messages array
- `transcript[*].response.result.structuredContent.pagination` — pagination object

**Findings:**

| Metric | Value |
|---|---|
| Total products across 18 queries | 900 |
| Products with >1 variant | 0 |
| Products with >1 distinct seller | 0 |
| UPID/cluster/offer fields at product level | NONE |
| Product-level keys | `description`, `id`, `media`, `metadata`, `options`, `price_range`, `rating`, `title`, `variants` |
| Titles appearing from multiple sellers (as separate rows) | 34 |

**The response returns per-merchant rows, not UPID clusters.** Each product row has exactly 1 variant with exactly 1 seller. The same physical part (e.g., "Porterfield Brake Pads for 2018 HONDA CIVIC Sedan Si") appears as separate product rows with different product IDs, one per merchant:

- Row 1: `gid://shopify/p/4uFOVa84oJOXwS4pcChtnA`, seller = Fortune Hunterz Motorsports
- Row 2: `gid://shopify/p/2csFz4HGqmyiUXyJhvIPKS`, seller = Piston Twistin LLC

**TDD §2.4 line 81** states: *"Results cluster by Universal Product ID (UPID) with offers from multiple merchants."* **This is not what the response shape shows.** The response returns one row per merchant listing, each with its own product ID and a single variant/seller. There is no UPID field, no cluster object, and no multi-offer array.

**Implication for H5:** H5 as written does not apply. The hypothesis was: "the cluster ranked, and the target merchant's offer was not attached to it." There are no clusters. Each merchant's listing is a separate row that ranks independently. "Offer attachment" is not a measurable event in this response shape.

### §4.1 — Presence definition

**Original probe's presence definition:** `handleOf(p) === targetHandle` — extract the storefront handle from `p.variants[0].url` (regex `/products/([^?]+)`), match against the target's declared handle.

**This is an exact identity rule.** The handle is unique per product per store. It is not title matching (Stage 1 established that title matching mispairs). It is not UPID matching (no UPID field exists). It is handle matching.

**Re-scored with the same rule:** Zero mismatches across all 16 targets × 14 relational queries = 224 pairs. The original and re-scored figures are identical.

### §4.2 — Denominator per query

| Q | Query | Type | Distinct domains (top 50) | total_count (estimate) | has_next_page |
|---|---|---|---|---|---|
| Q01 | brake pads for 2018 Honda Civic Si | rel | 28 | 291 | true |
| Q02 | brake pads for 2023 Acura Integra | rel | 24 | 312 | true |
| Q03 | front brake pads | int | 24 | 352 | true |
| Q04 | big brake kit for 2017 Honda Civic Si | rel | 22 | 315 | true |
| Q05 | brake kit for 2018 Honda Civic Si | rel | 37 | 320 | true |
| Q06 | brake lines for 2022 Honda Civic Si | rel | 33 | 281 | true |
| Q07 | stainless steel braided brake lines | int | 23 | 353 | true |
| Q08 | lowering springs for 2023 Honda Civic Type R | rel | 36 | 334 | true |
| Q09 | camber arms for 2016 Honda Civic | rel | 29 | 310 | true |
| Q10 | coilovers for 2017 Honda Civic | rel | 22 | 322 | true |
| Q11 | lift kit for 2023 Ford F-150 | rel | 24 | 327 | true |
| Q12 | exhaust system for 2023 Honda Civic Type R | rel | 34 | 294 | true |
| Q13 | downpipe for 2018 Honda Civic Type R | rel | 29 | 318 | true |
| Q14 | strut tower bar for 2023 Honda Civic | rel | 31 | 341 | true |
| Q15 | brake pads for 2024 Acura Integra | rel | 25 | 317 | true |
| Q16 | coilover kit | int | 35 | 322 | true |
| Q17 | valved exhaust system | int | 6 | 317 | true |
| Q18 | sportline lowering springs | int | 17 | 358 | true |

**`total_count` range:** 281–358 (median ~318). Per TDD §2.4, this is an estimate and is never used for exact arithmetic. It establishes the order of magnitude of S (competing listings): **~300 per query**, not ~100, not ~3000.

**Baseline P(top 50) at S=300:** 50/300 = 0.167. A product appearing in the top 50 is ~3× better than chance, not 30×.

### §4.3 — presence@3, presence@10, presence@50, rank distribution

**Per population (relational queries only, 14 queries):**

| Population | Pairs | presence@3 | presence@10 | presence@50 |
|---|---|---|---|---|
| Dropped | 7 | 1/7 = 0.143 | 1/7 = 0.143 | 3/7 = 0.429 |
| Retained | 9 | 3/9 = 0.333 | 5/9 = 0.556 | 5/9 = 0.556 |
| Pooled | 16 | 4/16 = 0.250 | 6/16 = 0.375 | 8/16 = 0.500 |

**Denominator alongside every figure:** S ≈ 300 per query (see §4.2). Baseline P(top 50) ≈ 0.167. Baseline P(top 10) ≈ 0.033. Baseline P(top 3) ≈ 0.010.

| Population | presence@50 | vs baseline 0.167 | presence@10 | vs baseline 0.033 |
|---|---|---|---|---|
| Dropped | 0.429 | 2.6× | 0.143 | 4.3× |
| Retained | 0.556 | 3.3× | 0.556 | 16.8× |
| Pooled | 0.500 | 3.0× | 0.375 | 11.4× |

**Rank distribution (relational, 8 present targets):**
Ranks: [1, 1, 1, 2, 6, 8, 22, 41]. Median 6, min 1, max 41.

**Per-query detail (relational only):**

| Q | Query | Target | Pop | Present? | Rank |
|---|---|---|---|---|---|
| Q01 | brake pads for 2018 Honda Civic Si | 27won-brake-pads | dropped | NO | — |
| Q01 | brake pads for 2018 Honda Civic Si | paragon-pbp370-brake-pads | retained | NO | — |
| Q01 | brake pads for 2018 Honda Civic Si | paragon-pbp1557-brake-pads | retained | NO | — |
| Q02 | brake pads for 2023 Acura Integra | 27won-brake-pads | dropped | YES | 22 |
| Q04 | big brake kit for 2017 Honda Civic Si | prl-motorsports-4-piston-bbk-p | dropped | YES | 41 |
| Q05 | brake kit for 2018 Honda Civic Si | prl-motorsports-4-piston-bbk-p | dropped | NO | — |
| Q05 | brake kit for 2018 Honda Civic Si | 27won-brake-pads | dropped | NO | — |
| Q06 | brake lines for 2022 Honda Civic Si | hel-hon-4-905 | dropped | YES | 1 |
| Q08 | lowering springs for 2023 Honda Civic Type R | eibach-22-23-honda-civic-type- | retained | YES | 8 |
| Q09 | camber arms for 2016 Honda Civic | whiteline-2015-honda-civic-rea | retained | YES | 1 |
| Q10 | coilovers for 2017 Honda Civic | br-series-coilovers-for-2016-h | retained | NO | — |
| Q11 | lift kit for 2023 Ford F-150 | icon-stage-4-w-billet-uca-susp | retained | NO | — |
| Q12 | exhaust system for 2023 Honda Civic Type R | 27won-performance-valved-exhau | retained | YES | 2 |
| Q13 | downpipe for 2018 Honda Civic Type R | high-efficiency-downpipe-upgra | retained | YES | 6 |
| Q14 | strut tower bar for 2023 Honda Civic | 11th-gen-civic-front-strut-tow | retained | YES | 1 |
| Q15 | brake pads for 2024 Acura Integra | 27won-brake-pads | dropped | NO | — |

### §4.4 — competitor_displacement

| Q | Type | Rank-1 domain | Distinct domains (top 10) | TSP in top 50? | MAP in top 50? |
|---|---|---|---|---|---|
| Q01 | rel | fortunehunterzmotorsports.com | 8 | YES | YES |
| Q02 | rel | unity-performance.com | 2 | YES | NO |
| Q03 | int | www.brembostore.com | 7 | NO | NO |
| Q04 | rel | www.twostepperformance.com | 4 | YES | YES |
| Q05 | rel | www.twostepperformance.com | 7 | YES | YES |
| Q06 | rel | www.twostepperformance.com | 8 | YES | YES |
| Q07 | int | www.prolinebraidedlines.com | 8 | YES | NO |
| Q08 | rel | www.aeroflowdynamics.com | 7 | YES | YES |
| Q09 | rel | www.twostepperformance.com | 9 | YES | YES |
| Q10 | rel | shop.redline360.com | 5 | NO | YES |
| Q11 | rel | offroadtradingco.com | 6 | NO | NO |
| Q12 | rel | www.maperformance.com | 5 | YES | YES |
| Q13 | rel | extremeonlinestore.com | 9 | YES | YES |
| Q14 | rel | www.twostepperformance.com | 7 | YES | YES |
| Q15 | rel | www.standardautopart.com | 6 | NO | NO |
| Q16 | int | wrxdaily.com | 9 | NO | YES |
| Q17 | int | valvetronic.com | 1 | YES | NO |
| Q18 | int | tsportline.com | 6 | NO | NO |

**TSP holds rank 1 in 5 of 14 relational queries** (Q04, Q05, Q06, Q09, Q14). TSP appears in the top 50 of 11 of 14 relational queries. MAP holds rank 1 in 1 of 14 (Q12). The target store is not dominant in its own categories — competitors hold the majority of top-10 slots in most queries.

### §4.5 — Fallback re-examination

**U-4 established:** scoped no-match query returns the shop's general catalogue rather than an empty set.

**Unscoped equivalent:** does the Catalog return generic results when no genuine match exists?

**Method:** for each of the 18 queries, checked whether the top 10 products are relevant to the query (query's main noun appears in the title) and whether `total_count` is implausibly high relative to relevance.

**Result:** no queries flagged as possible fallback. All 18 queries returned 50 products with `has_next_page: true`, indicating genuine matches beyond the first page. The `total_count` estimates (281–358) are consistent with genuine match counts for these query phrasings in the auto parts vertical.

**None of the 8 "present" results are fallback artefacts.** All 8 present targets appear in queries where the top 10 is relevant to the query, and the target's title matches the query intent.

---

## 3. Corrections applied

**No corrections were applied to the raw output.** The re-scoring (§4.1) confirmed that the original probe's presence definition (handle identity) was already exact. Zero mismatches between original and re-scored.

**One correction was applied to the §4.4 analysis:** the original probe-unscoped.ts used exact string comparison (`d === "www.twostepperperformance.com"`) for TSP/MAP detection. This comparison was fragile — the actual domain in the URL data is `www.twostepperformance.com` (26 chars, "twostep" + "performance"), while the comparison string had a different character count. The re-scoring script uses substring matching (`d.includes("twostep")`) which is robust to this. This correction changed the TSP-in-top-50 column from "NO" (incorrect) to "YES" (correct) for 11 queries where TSP products were present but missed by the exact comparison.

**Direction of correction:** The correction increased TSP's measured presence in the top 50. It does not affect the presence@50 figures for the 16 targets (which use handle matching, not domain matching). It affects only the competitor_displacement table (§4.4), making TSP appear more competitive than the original probe reported.

**Both sides?** The correction applies to the Shopify side (Catalog response parsing). There is no merchant-side extraction in this stage.

---

## 4. Verification performed

### What I checked by eye

**§3 clustering — checked every product.** All 900 products across 18 queries were inspected programmatically. For each product, I checked:
- `product.variants.length` — always 1
- Distinct seller IDs across variants — always 1
- Product-level keys for UPID/cluster/offer fields — none found
- The `ucp` field at `structuredContent.ucp` — contains only version and capability metadata, no cluster information

**Decisive cases inspected individually:**

1. **"Porterfield Brake Pads for 2018 HONDA CIVIC Sedan Si" (Q01)** — appears as 2 separate product rows with different product IDs and different sellers (Fortune Hunterz Motorsports, Piston Twistin LLC). Each row has 1 variant, 1 seller. This is a per-merchant row, not a UPID cluster with 2 offers.

2. **"EBC S2 Brake Pad and Rotor Kit" (Q01)** — appears as 3 separate product rows with 3 different sellers (Drift HQ, ATOAMOTOS, RAV Performance). Again, per-merchant rows.

3. **"EBC S9 Brake Pad and Rotor Kit" (Q02)** — appears as 5 separate product rows with 5 different sellers. Per-merchant rows.

**§4.1 presence definition — checked all 224 pairs.** The original probe's `handleOf()` function extracts the handle from the variant URL using regex `/products/([^?]+)`. This is an exact identity rule. Re-scoring with the same rule produced zero mismatches.

**§4.2 denominator — checked `pagination.total_count` for all 18 queries.** The values (281–358) are estimates per TDD §2.4. They are consistent with each other and with the order of magnitude expected for auto parts queries.

**§4.5 fallback — checked relevance of top 10 for all 18 queries.** Used a simple heuristic (query's main noun in title). No queries showed evidence of fallback behaviour.

### What I did not check

- I did not verify the `total_count` estimates against actual result counts at depth. The depth-1000 re-run (Stage 2, §5) will test this.
- I did not check whether the 8 absent targets appear beyond rank 50. The depth-1000 re-run (Stage 2, §5) will test this.
- I did not verify the seller domain extraction for all 900 products. I verified it for the decisive cases in §3 and for the TSP/MAP detection in §4.4.

---

## 5. Deviations from pre-registration

| Deviation | Direction it moves the headline | Impact |
|---|---|---|
| **TDD §2.4 line 81 is incorrect.** It states "Results cluster by Universal Product ID (UPID) with offers from multiple merchants." The response returns per-merchant rows, not UPID clusters. | ↓ for H5 | H5 as written does not apply. The hypothesis cannot be tested because the response shape does not contain the constructs it references. |
| **The 0.500 pooled figure is re-reported here with its denominator.** The directive §1.1 says pooling two experimental arms is invalid. The pooled figure is reported for completeness only and is not carried forward as a claim. | Neutral | The pooled figure was already withdrawn by DIRECTIVE-7 §1. This report confirms the withdrawal with the denominator data. |
| **`total_count` is an estimate.** Per TDD §2.4, it is never used for exact arithmetic. The baseline calculations in §4.3 use it only to establish the order of magnitude of S. | Neutral | The order of magnitude (~300) is robust to estimation error. Even if `total_count` is off by 50%, S is still ~150–450, not ~100 or ~3000. |

---

## 6. Verdict against the pre-registered rule only

### §3 — Clustering determination

> **The response returns per-merchant rows, not UPID clusters.** H5 as written does not apply. The report says so rather than adapting the hypothesis.

**H5 is not testable in this response shape.** The hypothesis was: "the cluster ranked, and the target merchant's offer was not attached to it." There are no clusters and no offer attachment. Each merchant's listing is a separate row that ranks independently. "Offer attachment rate" cannot be computed because there is no cluster to attach to.

**TDD §2.4 line 81 requires correction.** The statement "Results cluster by Universal Product ID (UPID) with offers from multiple merchants" is not supported by the response shape. The response returns one row per merchant listing, each with its own product ID and a single variant/seller.

### §4 — Re-scoring

**No verdict is attached to §4.** Per DIRECTIVE-7 §4: "No verdict is attached to any of this. It is instrumentation."

The re-scoring confirms:
1. The presence definition is exact (handle identity, zero mismatches)
2. The denominator is ~300 per query (baseline P(top 50) ≈ 0.167)
3. The pooled 0.500 is ~3× better than chance, not a defect signal
4. No fallback artefacts were found
5. TSP holds rank 1 in 5/14 relational queries, appears in top 50 of 11/14

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| Source data (unscoped transcript) | `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` |
| Re-scoring script | `scripts/probe-directive7-rescore.ts` |
| Re-scoring output (JSON) | `scripts/output/directive7-rescore-2026-08-02T17-16-11-076Z.json` |
| Query set (frozen, committed) | `scripts/retrieval-query-set.json` |
| This report | `docs/reports/directive7-stage1-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**TDD §2.4 line 81 is wrong.** The response does not cluster by UPID. This is the single most consequential finding of this stage because it kills H5 — the hypothesis DIRECTIVE-7 §3 offered as "the actual finding" — and it kills it cheaply, by opening the JSON, before any new API calls were made.

The line was written from documentation, not from observation. The actual response shape is per-merchant rows. The same part appears as separate product rows with different product IDs, one per merchant. There is no UPID field, no cluster object, and no multi-offer array.

**This is the fifth time in the project's history that a summary has been over-read.** DIRECTIVE-7 §1.4 notes that the 0.500 figure was elevated without opening the transcript. TDD §2.4 line 81 was written without opening the response. Both errors have the same shape: a summary was trusted over the raw artefact.

### What this means for the project

1. **H5 is dead.** The "offer attachment" mechanism does not exist in this response shape. There is no cluster to be attached to or detached from. Each merchant's listing ranks independently.

2. **"Structural invisibility" (DIRECTIVE-7 §2) must be redefined.** The directive defined structural invisibility as "the product does not appear at any depth, for any query naming its exact vehicle and category, while other merchants' listings of the identical part do appear." Without UPID clusters, "the identical part" means "a different merchant's listing of the same physical part, appearing as a separate row." This is still testable — but it is a ranking comparison between per-merchant rows, not an offer-attachment audit.

3. **The depth-1000 re-run (§5) is now the critical test.** If the 8 absent targets are absent at depth 1000, that is structural invisibility by the per-merchant-row definition. If they appear at some depth < 1000, that is ranking, not invisibility. The §5 re-run does not require UPID clusters — it simply checks whether the target's handle appears at any rank up to 1000.

4. **The pooled 0.500 is ~3× better than chance, not a defect.** With S ≈ 300, baseline P(top 50) ≈ 0.167. Observed 0.500 is 3× better than chance. This is a competitive showing, not a failure. DIRECTIVE-7 §1.2 is confirmed: the 0.500 figure cannot carry a claim, and the denominator data shows why.

### Surprises

1. **34 titles appear from multiple sellers as separate rows.** This is not a surprise in itself (per-merchant rows are expected), but the volume is notable. In Q01 alone, "EBC S2 Brake Pad and Rotor Kit" appears from 3 sellers and "Porterfield Brake Pads for 2018 HONDA CIVIC Sedan Si" from 2. The Catalog is returning multiple listings of the same part from different merchants, each ranking independently. This is the shape that H5 was trying to interpret as "offer attachment," but it is simply separate rows.

2. **TSP holds rank 1 in 5/14 relational queries.** This is a stronger competitive position than the Stage 2.5 report suggested. The original probe's domain comparison bug made TSP appear absent from the top 50 in several queries where it was actually present. The corrected §4.4 table shows TSP in the top 50 of 11/14 relational queries.

3. **Q17 (valved exhaust system) has only 6 distinct domains in the top 50.** This is the lowest domain diversity of any query. The top result (valvetronic.com) appears to dominate this query. This may be because "valved exhaust system" is a niche query with few merchants, or because the Catalog's relevance matching favours one merchant for this phrasing.

### Blockers

1. **H5 cannot be executed.** The response shape does not contain UPID clusters. The hypothesis is not testable as written. This is a blocker for the §3 stage, but it is a cheaply resolved one — the clustering determination took 5 minutes of JSON inspection, not a full experimental run.

2. **TDD §2.4 line 81 needs correction.** The line is load-bearing — it was the basis for H5's design. Correcting it requires a governing-doc update, which is in progress.

### Disagreement with the directive

1. **DIRECTIVE-7 §3 framed H5 as "the actual finding" and "may be the finding that matters."** The clustering determination shows H5 is not testable. The directive anticipated this: "First, and before any of the above: determine from `unscoped-2026-08-02T15-44-54-483Z.json` whether the response actually clusters by UPID... If it does not cluster, H5 as written does not apply and the report says so rather than adapting the hypothesis." I agree with the directive's instruction to report rather than adapt. H5 is dead. The report says so.

2. **DIRECTIVE-7 §1.2's baseline analysis is confirmed by the denominator data.** The directive's table predicted that at S=100, 0.500 is "at chance," and at S=500, 0.500 is "5× better than chance." The actual S is ~300, placing 0.500 at ~3× better than chance. This is in the range the directive described as "a strong competitive showing, not a failure." I agree with this framing.

3. **The directive's §2 distinction between "ranking" and "structural invisibility" is the right distinction.** The depth-1000 re-run (§5) is the correct test for distinguishing them. If the 8 absent targets are absent at depth 1000, that is structural invisibility. If they appear at some depth, that is ranking. I have no disagreement with the directive's framing here.
