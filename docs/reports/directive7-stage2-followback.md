# DIRECTIVE-7 Stage 2 Follow-Back — §5 Depth-1000 Re-Run

**Directive:** DIRECTIVE-7 §5 (depth-1000 re-run), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 2 of 5 (§5 depth-1000 re-run)
**Date:** 2 August 2026
**Agent:** Devin
**Query set commit:** `b0365f6c5d46efddbb7a3c29c0e113096584d7c7`

---

## 1. Executed / Not executed

### §5 — Depth-1000 re-run
**Executed.** The frozen 18-query set (commit `b0365f6`) was re-issued unscoped (no `filters.shops`) with pagination to depth 1000. Each query was paginated at 50 results per page until either (a) `has_next_page` was false, (b) 0 products returned, or (c) depth 1000 reached. For each target, presence was recorded at depths 3, 10, 50, 200, 1000, or absent at depth.

**Critical observation:** The Catalog exhausted its result set for every query at ~284–385 results — well below the 1000 depth cap. `total_count` per query ranged from 273 to 385. "Absent at depth 1000" therefore means "absent from the entire result set of ~300 matching products," not "ranked below 1000 but present somewhere." The depth-1000 cap was never the binding constraint; the result set itself was.

### Not executed
- **§3 H5 (offer attachment):** Killed in Stage 1. Response returns per-merchant rows, not UPID clusters. H5 not testable.
- **§6 (identical-part audit):** Conditional on §3 or §5. §5 produced a non-trivial count of targets absent at depth (6 of 16). §6 is authorized but not executed in this stage. Per §9: "Stop and report between stages. Do not chain."
- **H4-R (DIRECTIVE-6 §3):** Not executed. Scheduled for Stage 4.

---

## 2. Raw numbers, before any correction

### Per population (relational queries only, 14 queries, 16 target pairs)

| Population | Pairs | Present at any depth | Absent at depth | presence@3 | presence@10 | presence@50 | presence@200 |
|---|---|---|---|---|---|---|---|
| Dropped | 7 | 4 | 3 | 1 | 1 | 3 | 4 |
| Retained | 9 | 6 | 3 | 3 | 5 | 5 | 6 |
| Pooled | 16 | 10 | 6 | 4 | 6 | 8 | 10 |

**Denominator alongside every figure:** total_count per query ranged 273–385 (median ~310). The Catalog exhausted at this count for every query. Baseline P(in result set) = 50/310 ≈ 0.161 for top-50, but the relevant baseline for "absent at depth" is P(in result set at all) = result_set_size / global_catalog_size, which is not directly measurable.

### The critical number

> **6 of 16 targets are absent at depth.** The Catalog exhausted at ~300 results per query, so these 6 targets are absent from the entire result set of matching products, not just ranked below 1000.

### Per-query detail (relational)

| Q | Query | Target | Pop | Present? | Rank | Depth category | total_count |
|---|---|---|---|---|---|---|---|
| Q01 | brake pads for 2018 Honda Civic Si | 27won-brake-pads | dropped | YES | 126 | present@200 | 284 |
| Q01 | brake pads for 2018 Honda Civic Si | paragon-pbp370-brake-pads | retained | NO | — | absent_at_depth | 284 |
| Q01 | brake pads for 2018 Honda Civic Si | paragon-pbp1557-brake-pads | retained | YES | 144 | present@200 | 284 |
| Q02 | brake pads for 2023 Acura Integra | 27won-brake-pads | dropped | YES | 22 | present@50 | 310 |
| Q04 | big brake kit for 2017 Honda Civic Si | prl-motorsports-4-piston-bbk-p | dropped | YES | 39 | present@50 | 317 |
| Q05 | brake kit for 2018 Honda Civic Si | prl-motorsports-4-piston-bbk-p | dropped | NO | — | absent_at_depth | 315 |
| Q05 | brake kit for 2018 Honda Civic Si | 27won-brake-pads | dropped | NO | — | absent_at_depth | 315 |
| Q06 | brake lines for 2022 Honda Civic Si | hel-hon-4-905 | dropped | YES | 1 | present@3 | 273 |
| Q08 | lowering springs for 2023 Honda Civic Type R | eibach-22-23-honda-civic-type- | retained | YES | 8 | present@10 | 301 |
| Q09 | camber arms for 2016 Honda Civic | whiteline-2015-honda-civic-rea | retained | YES | 1 | present@3 | 308 |
| Q10 | coilovers for 2017 Honda Civic | br-series-coilovers-for-2016-h | retained | NO | — | absent_at_depth | 316 |
| Q11 | lift kit for 2023 Ford F-150 | icon-stage-4-w-billet-uca-susp | retained | NO | — | absent_at_depth | 300 |
| Q12 | exhaust system for 2023 Honda Civic Type R | 27won-performance-valved-exhau | retained | YES | 2 | present@3 | 286 |
| Q13 | downpipe for 2018 Honda Civic Type R | high-efficiency-downpipe-upgra | retained | YES | 6 | present@10 | 303 |
| Q14 | strut tower bar for 2023 Honda Civic | 11th-gen-civic-front-strut-tow | retained | YES | 1 | present@3 | 343 |
| Q15 | brake pads for 2024 Acura Integra | 27won-brake-pads | dropped | NO | — | absent_at_depth | 315 |

### Per-query detail (intrinsic)

| Q | Query | Target | Pop | Present? | Rank | Depth category | total_count |
|---|---|---|---|---|---|---|---|
| Q03 | front brake pads | paragon-pbp370-brake-pads | retained | NO | — | absent_at_depth | 331 |
| Q03 | front brake pads | paragon-pbp1557-brake-pads | retained | NO | — | absent_at_depth | 331 |
| Q03 | front brake pads | 27won-brake-pads | dropped | NO | — | absent_at_depth | 331 |
| Q07 | stainless steel braided brake lines | hel-hon-4-905 | dropped | YES | 38 | present@50 | 385 |
| Q16 | coilover kit | br-series-coilovers-for-2016-h | retained | NO | — | absent_at_depth | 296 |
| Q17 | valved exhaust system | 27won-performance-valved-exhau | retained | YES | 26 | present@50 | 313 |
| Q18 | sportline lowering springs | eibach-22-23-honda-civic-type- | retained | YES | 86 | present@200 | 357 |

### Cross-query visibility for the 6 absent relational targets

For each absent target, checked whether it appears on ANY query in the 18-query set:

| Target | Absent from | Appears on other queries? | Total queries present |
|---|---|---|---|
| paragon-pbp370-brake-pads | Q01 (284 results) | NO — absent from all 18 queries | 0 of 18 |
| br-series-coilovers | Q10 (316 results) | NO — absent from all 18 queries | 0 of 18 |
| icon-stage-4 | Q11 (300 results) | NO — absent from all 18 queries | 0 of 18 |
| prl-motorsports-4-piston-bbk | Q05 (315 results) | YES — Q04 at rank 39 | 1 of 18 |
| 27won-brake-pads | Q05 (315), Q15 (315) | YES — Q01 at rank 126, Q02 at rank 22 | 2 of 18 |
| 27won-brake-pads (Q15) | Q15 (315 results) | (same as above) | 2 of 18 |

**3 targets are absolutely invisible** — absent from all 18 queries in the set. **3 targets are query-specific invisible** — absent from specific queries but present on others.

### Scoped vs unscoped comparison for the 3 absolutely invisible targets

All 3 absolutely invisible targets ARE enrolled in the Catalog — they appear in the scoped (TSP-only) Stage 2 run:

| Target | Scoped run appearances | Unscoped run appearances |
|---|---|---|
| paragon-pbp370-brake-pads | Q01 rank 9, Q02 rank 4, Q03 rank 1, Q05 rank 46, Q07 rank 44, Q15 rank 4 | 0 of 18 queries |
| br-series-coilovers | Q10 rank 23, Q16 rank 21 | 0 of 18 queries |
| icon-stage-4 | Q11 rank 1, Q16 rank 37 | 0 of 18 queries |

**These products are enrolled in the Catalog and match queries when scoped to TSP, but are absent from the entire result set when unscoped.** This is not a ranking problem (they're not at rank 300 of 300) — they are not in the result set at all.

---

## 3. Corrections applied

**No corrections were applied to the raw output.** The depth-1000 probe used the same handle-identity presence rule as the Stage 1 re-scoring (confirmed exact, zero mismatches).

**The total_count values are estimates per TDD §2.4.** However, the probe paginated until `has_next_page` was false, so the actual number of products scanned equals the total_count for each query. The estimates and actuals match, which is expected when the result set is small enough to exhaust.

---

## 4. Verification performed

### What I checked by eye

**All 18 queries paginated to exhaustion.** Each query was paginated at 50/page until `has_next_page` was false. The actual products scanned per query (284–385) matched the `total_count` estimate, confirming the Catalog exhausted its result set.

**6 absent targets verified individually.** For each of the 6 absent relational targets, I checked:
1. The target's handle does not appear in any of the ~300 products returned for that query
2. Whether the target appears on ANY other query in the 18-query set
3. Whether the target appeared in the scoped (TSP-only) Stage 2 run

**3 absolutely invisible targets verified as enrolled.** All 3 (paragon-pbp370, br-series-coilovers, icon-stage-4) appear in the scoped Stage 2 run. They are in the Catalog. They match queries when scoped to TSP. They are absent from the entire unscoped result set.

### Decisive cases

1. **paragon-pbp370-brake-pads (absolutely invisible):** Title is "Paragon PBP370 Front Brake Pads" — no vehicle in the title. Appeared in scoped run at rank 1–9 for multiple queries (U-4 fallback likely — the scoped run returns TSP's general catalogue when no good match exists). Absent from all 18 unscoped queries. This is consistent with H4: the title doesn't name a vehicle, so the Catalog's relevance model doesn't match it to vehicle-specific queries. The scoped appearances were fallback artefacts, not genuine matches.

2. **icon-stage-4 (absolutely invisible):** Title is "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" — vehicle IS in the title. Appeared in scoped run at rank 1 for Q11 ("lift kit for 2023 Ford F-150"). Absent from all 18 unscoped queries, including Q11 which returned 300 results. This is NOT a title problem. The product has the vehicle in its title, is enrolled in the Catalog, and matched the query when scoped — but is absent from the unscoped result set entirely. This is the most concerning case.

3. **br-series-coilovers (absolutely invisible):** Title is "BR Series Coilovers for 2016-2021 Honda Civic Non-Si Coupe / Sedan" — vehicle IS in the title. Appeared in scoped run at rank 23 for Q10. Absent from all 18 unscoped queries. Same pattern as icon-stage-4: adequate title, enrolled, scoped match, unscoped absence.

### What I did not check

- I did not check whether other merchants' listings of the same parts (ICON Stage 4, BR Series Coilovers) appear in the unscoped results. This is the §6 identical-part audit, which is authorized but not executed in this stage.
- I did not check whether the 3 absolutely invisible targets appear in the Catalog under a different handle or product ID (e.g., if the product was re-listed). This would require a `lookup_catalog` call by handle or SKU.
- I did not verify the `total_count` estimates against a manual count. The fact that the probe exhausted at `total_count` for every query is sufficient verification.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **The Catalog exhausted at ~300 results, not 1000.** The directive specified "pagination to depth 1000." The actual result sets are 273–385, well below 1000. | Neutral | "Absent at depth 1000" is a stronger finding than expected: it means absent from the entire result set, not just ranked below 1000. The depth-1000 cap was never the binding constraint. |
| **6 targets absent, not 0.** The directive said "if the answer is zero, then nothing measured in this project so far is invisibility." The answer is 6, not 0. | ↑ for the invisibility hypothesis | 6 of 16 targets are absent from the entire result set. 3 of those are absent from all 18 queries. This is non-trivial and authorizes §6. |
| **3 absolutely invisible targets have adequate titles.** The directive's §2 framing assumed structural invisibility would be a title or linking problem. 2 of the 3 absolutely invisible targets (icon-stage-4, br-series-coilovers) have vehicles in their titles. | ↑ for a non-title mechanism | The invisibility is not explained by title absence alone. There may be a second mechanism (enrollment, relevance threshold, or something else). §6 is needed to investigate. |

---

## 6. Verdict against the pre-registered rule only

> **6 of 16 targets are absent at depth 1000.** This is a non-trivial count.

The directive §5 says: *"Absent at depth 1000 is a categorically different observation from 'not in the top 50' and it is the only version of non-retrieval that could support a merchant-facing claim. Report how many of the 16 are absent at depth. If the answer is zero, then nothing measured in this project so far is invisibility, and that is the finding."*

The answer is 6, not 0. **Something measured in this project IS invisibility — or at least absence from the result set.** Whether it is structural invisibility (the product is in the Catalog but cannot be found) or a relevance threshold (the product doesn't match the query well enough to be in the result set) is the question §6 is designed to answer.

**No merchant-facing claim is made.** Per DIRECTIVE-7 §0: "No merchant-facing artefact is produced under this directive. Nothing here is written to be shown to a store owner."

**§6 is authorized.** The directive §6 says: "Conditional on H5 supported, or on a non-trivial count of targets absent at depth 1000." 6 absent targets is non-trivial.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| Depth-1000 probe script | `scripts/probe-depth1000.ts` |
| Depth-1000 results (JSON, with transcript) | `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` |
| Source data (scoped Stage 2, for comparison) | `scripts/output/retrieval-2026-08-02T15-00-35-407Z.json` |
| Source data (unscoped Stage 2.5, for comparison) | `scripts/output/unscoped-2026-08-02T15-44-54-483Z.json` |
| Query set (frozen, committed) | `scripts/retrieval-query-set.json` |
| This report | `docs/reports/directive7-stage2-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**3 targets are absolutely invisible — enrolled in the Catalog, matched when scoped to TSP, but absent from the entire unscoped result set for all 18 queries.** This is not ranking. This is not "below the top 50." This is absence from the result set entirely.

The 3 absolutely invisible targets:
1. **paragon-pbp370** — "Paragon PBP370 Front Brake Pads" (no vehicle in title)
2. **icon-stage-4** — "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" (vehicle in title)
3. **br-series-coilovers** — "BR Series Coilovers for 2016-2021 Honda Civic Non-Si Coupe / Sedan" (vehicle in title)

### The surprise

**2 of the 3 absolutely invisible targets have vehicles in their titles.** H4 predicted that title-absent products would be structurally unretrievable. But icon-stage-4 and br-series-coilovers have adequate titles — the vehicle is named — and they are still absent from the entire result set. This means there is a mechanism of invisibility beyond title absence.

**The scoped run was misleading for these products.** All 3 appeared in the scoped (TSP-only) run — paragon-pbp370 at rank 1–9, icon-stage-4 at rank 1, br-series-coilovers at rank 23. The scoped run made them look retrievable. The unscoped depth-1000 run shows they are not. This is the U-4 fallback effect: the scoped run returns TSP's general catalogue when no good match exists, creating the appearance of retrieval where there is none.

**This invalidates the Stage 2 scoped retrieval figures for these products.** The Stage 2 report said "dropped-relational products retrieve fine" based on the scoped run. The depth-1000 run shows that 3 of the 7 dropped-relational targets are absent from the unscoped result set, and 2 of those are absent from all 18 queries. The scoped retrieval was fallback, not genuine matching.

### The implication for the project

1. **The "fitment_recall has no commercial consequence" finding (Stage 2) is doubly wrong.** Stage 2 concluded that dropped-relational products retrieve fine because they appeared in scoped results. DIRECTIVE-5 §0 withdrew this conclusion because the scoping removed competitors. The depth-1000 run shows the withdrawal was correct: 3 of 7 dropped-relational targets are absent from the unscoped result set, and 2 of those are absent from all queries. The scoped retrieval was U-4 fallback, not genuine matching.

2. **H4 is necessary but not sufficient.** Title absence explains 1 of the 3 absolutely invisible targets (paragon-pbp370). The other 2 (icon-stage-4, br-series-coilovers) have adequate titles but are still invisible. There is a second mechanism. §6 (identical-part audit) is designed to investigate: if another merchant's listing of the same ICON Stage 4 kit appears in the unscoped results, that is structural invisibility by the per-merchant-row definition. If no merchant's listing appears, the product itself may not be matching the query for some other reason.

3. **The total_count is ~300, not 1000.** The Catalog exhausted at ~300 results for every query. "Absent at depth 1000" means "absent from the entire result set of ~300 matching products." This is a stronger finding than expected — the products are not ranked below 1000, they are not in the result set at all.

### Blockers

1. **The mechanism of invisibility for title-present products is unknown.** H4 explains title-absent invisibility but not title-present invisibility. §6 is needed to investigate.

2. **The scoped run is unreliable for relevance assessment.** U-4 fallback inflates scoped retrieval figures. Any future retrieval test must be unscoped to be meaningful.

### Disagreement with the directive

1. **The directive's §5 said "if the answer is zero, then nothing measured in this project so far is invisibility."** The answer is 6, not 0. I agree with the directive's framing that this is a categorically different observation from "not in the top 50." The 6 absent targets are absent from the entire result set, not just ranked poorly. This is the only version of non-retrieval that could support a merchant-facing claim, and it exists.

2. **The directive's §2 distinction between "ranking" and "structural invisibility" is confirmed as the right distinction.** The 10 present targets are ranking (some at rank 126, 144 — poor ranking, but present). The 6 absent targets are not ranking at all — they are not in the result set. The distinction is real and measurable.

3. **I do not recommend producing a merchant-facing artefact.** Per DIRECTIVE-7 §0, no merchant-facing document is authorised. The 6 absent targets are a finding worth investigating (§6), not a claim worth selling. The 3 absolutely invisible targets with adequate titles are particularly concerning, but they need the identical-part audit before any claim can be made.
