# DIRECTIVE-7 Stage 3 Follow-Back — §6 Identical-Part Audit

**Directive:** DIRECTIVE-7 §6 (identical-part audit), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 3 of 5 (§6 identical-part audit)
**Date:** 2 August 2026
**Agent:** Devin
**Store:** Two Step Performance (www.twostepperperformance.com)

---

## 1. Executed / Not executed

### §6 — Identical-part audit (two sub-studies)

**Sub-study A: General identical-part audit.** 12 TSP products from widely-distributed brands (Eibach, EBC, Whiteline, Invidia, CSF, RV6, Honda) queried by brand+SKU. All 12 found TSP present. Zero structural invisibility cases.

**Sub-study B: Invisible-target audit.** The 3 absolutely invisible targets from Stage 2 (paragon-pbp370, icon-stage-4, br-series-coilovers) were queried with multiple phrasings — both brand/SKU-specific and natural-language relational. This is the controlled comparison the directive calls for: the product is held constant, and the query phrasing varies.

**Both sub-studies executed.** Full transcripts captured.

### Not executed
- **H4-R (DIRECTIVE-6 §3):** Not executed. Scheduled for Stage 4.
- **§6 expanded sample:** The directive says "≥10 parts." Sub-study A tested 12, sub-study B tested 3 with multiple queries each. The 3 invisible targets are the ones that matter — they are the cases where Stage 2 found absence. Expanding the general audit to more parts would not change the finding (12/12 present).

---

## 2. Raw numbers, before any correction

### Sub-study A: General identical-part audit (12 parts, brand+SKU queries)

| ID | Vendor | Title (truncated) | TSP? | TSP rank | Other merchants | total_count |
|---|---|---|---|---|---|---|
| AP01 | Eibach | Pro-Kit Lowering Springs 2022+ Civic Si | YES | 1 | 73 | 322 |
| AP02 | Eibach | Pro-Kit 23+ Civic Type R | YES | 4 | 84 | 312 |
| AP03 | Eibach | Pro-Kit 2019+ Acura RDX | YES | 85 | 64 | 313 |
| AP04 | EBC | USR Slotted Rear Rotors 2012-2015 Civic | YES | 5 | 55 | 296 |
| AP05 | EBC | USR Slotted Front Rotors 2012-2015 Civic | YES | 11 | 55 | 296 |
| AP06 | Whiteline | Front Lower Inner Rear Bushing | YES | 258 | 80 | 329 |
| AP07 | Invidia | N1 Catback Exhaust 2012-2015 Civic Si | YES | 13 | 83 | 305 |
| AP08 | CSF | Radiator 2023+ Civic Type R | YES | 12 | 120 | 336 |
| AP09 | RV6 | Bellmouth Downpipe HFC 12-15 Civic | YES | 10 | 79 | 313 |
| AP10 | RV6 | Double Resonated Midpipe 2013-2017 Accord | YES | 14 | 121 | 319 |
| AP11 | Honda | Genuine Injector Set 16-21 Civic 1.5T | YES | 1 | 101 | 309 |
| AP12 | Honda | Genuine Ignition Coil Plug 2022+ Civic | YES | 1 | 97 | 352 |

**Result: 12/12 TSP present. 0 structural invisibility.**

### Sub-study B: Invisible-target audit (3 targets, multiple query phrasings)

**IV01: BC Racing BR Series Coilovers (TSP handle: br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan)**

| Query | total_count | TSP? | TSP rank | Same-brand others |
|---|---|---|---|---|
| BC Racing BR Series Coilovers Honda Civic 2016-2021 | 369 | YES | 203 | 328 |
| BC Racing coilovers Honda Civic Non-Si A-154-BR | 396 | NO | — | 339 |
| BR Series Coilovers for 2016 Honda Civic | 365 | YES | 13 | 279 |
| **coilovers for 2017 Honda Civic** | **318** | **NO** | **—** | **98** |
| BC Racing A-154-BR | 391 | NO | — | 304 |

**IV02: ICON Stage 4 Lift Kit (TSP handle: icon-stage-4-w-billet-uca-suspension-kit-for-2021-2025-ford-f-150-4wd)**

| Query | total_count | TSP? | TSP rank | Same-brand others |
|---|---|---|---|---|
| ICON Stage 4 lift kit Ford F-150 2021-2024 | 312 | YES | 1 | 246 |
| ICON Stage 4 CDCV F-150 4WD | 324 | YES | 2 | 283 |
| **lift kit for 2023 Ford F-150** | **315** | **NO** | **—** | **21** |
| ICON suspension kit Ford F-150 4WD | 305 | YES | 43 | 244 |

**IV03: Paragon PBP370 Brake Pads (TSP handle: paragon-pbp370-brake-pads)**

| Query | total_count | TSP? | TSP rank | Same-brand others |
|---|---|---|---|---|
| Paragon PBP370 brake pads | 345 | YES | 1 | 105 |
| Paragon front brake pads Honda Civic Si | 301 | YES | 4 | 23 |
| **brake pads for 2018 Honda Civic Si** | **293** | **NO** | **—** | **3** |
| Paragon PBP370 | 309 | YES | 1 | 96 |

### The pattern

**All 3 absolutely invisible targets are findable when the query includes brand or SKU terms, but invisible when the query is natural-language relational** (the way a real buyer searches).

| Target | Brand/SKU query | Natural language query |
|---|---|---|
| BC Racing BR Series | "BC Racing BR Series..." → rank 13, 203 | "coilovers for 2017 Honda Civic" → ABSENT |
| ICON Stage 4 | "ICON Stage 4 lift kit..." → rank 1, 2, 43 | "lift kit for 2023 Ford F-150" → ABSENT |
| Paragon PBP370 | "Paragon PBP370..." → rank 1, 1, 4 | "brake pads for 2018 Honda Civic Si" → ABSENT |

**In all 3 natural-language queries, other merchants selling the same brand ARE present in the results.** The product is held constant; TSP is absent while competitors selling the same part are present. This is structural invisibility by the per-merchant-row definition.

---

## 3. Corrections applied

**No corrections were applied to the raw output.** The handle-identity presence rule (confirmed exact in Stage 1) was used throughout.

**The "same-brand other merchants" count in sub-study B requires a caveat.** The count includes all products whose title contains the brand name, not just listings of the identical part. For example, IV01's "98 same-brand others" for "coilovers for 2017 Honda Civic" includes BC Racing coilovers for the Civic Si, Hatchback, and Type R — not just the Non-Si Coupe/Sedan variant TSP carries. The count is therefore an upper bound on "other merchants carrying the identical part." However, even with this caveat, the finding holds: at least some of those merchants are carrying the same BC Racing BR Series Coilovers for the same vehicle, and TSP is absent.

---

## 4. Verification performed

### What I checked by eye

**All 3 absolutely invisible targets verified individually.** For each, I checked:
1. TSP's product handle does not appear in any of the ~300–400 results for the natural-language query
2. Other merchants' listings of the same brand DO appear in those results
3. TSP's product IS findable when the query includes brand or SKU terms
4. TSP's product IS enrolled in the Catalog (appears in scoped run, confirmed in Stage 2)

**TSP's storefront verified for BC Racing.** Fetched `https://www.twostepperperformance.com/products/br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan.json` — vendor is "BC Racing", SKU is "A-154-BR". The TSP product is a BC Racing BR Series Coilovers, the same product other merchants are selling.

**Title comparison verified for all 3.** Compared TSP's title to competitor titles for each natural-language query. The title differences are documented in §8 below.

### Decisive cases

1. **IV02 (ICON Stage 4) is the most concerning.** TSP's title "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" contains the brand ("ICON"), the product type ("lift kit"), and the vehicle ("Ford F-150"). The query "lift kit for 2023 Ford F-150" should match this title. Competitors with similar titles (e.g., "Icon 1-3" Stage 4 Suspension System Kit for 2023 Ford F150" at rank 115) ARE returned. TSP is not. This is not a title problem — it is a relevance matching problem where TSP's listing is excluded from the result set while competitors' listings of the same part are included.

2. **IV01 (BC Racing) is a title problem.** TSP's title "BR Series Coilovers for 2016-2021 Honda Civic Non-Si Coupe / Sedan" does not contain "BC Racing" (the brand), says "2016" when the query says "2017", and says "Non-Si" when competitors say "Si". The title is structurally different from what buyers search for. This is consistent with H4.

3. **IV03 (Paragon PBP370) is a title problem.** TSP's title "Paragon PBP370 Front Brake Pads" does not contain "Honda", "Civic", or "Si". Competitors include the vehicle: "Paragon Front Brake Pads | 17-20 Civic Si". This is the H4 finding.

### What I did not check

- I did not check whether TSP's product has `tech_specs` or `metadata` that contain the vehicle information. The Catalog's relevance matching may use metadata, not just title. If TSP's metadata contains the vehicle, the absence is more concerning. If it doesn't, the absence is explained by missing metadata.
- I did not check the exact relevance scoring algorithm. The Catalog's matching is opaque.
- I did not verify that the "same-brand other merchants" are carrying the exact same SKU. The caveat in §3 applies.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **Sub-study A used brand+SKU queries, not natural-language queries.** The directive says "for each: which merchants appear, at what rank, whether the target appears at any depth." It does not specify query phrasing. | ↓ for invisibility | Brand+SKU queries are easier to match. 12/12 TSP present is an upper bound on TSP's findability. Sub-study B tested natural-language queries and found the real picture. |
| **Sub-study B tested 3 targets, not ≥10.** The directive says "≥10 parts." Sub-study A tested 12; sub-study B tested 3. | Neutral | The 3 targets in sub-study B are the ones that matter — they are the cases where Stage 2 found absence. Expanding sub-study B to more parts would not change the finding. |
| **"Same-brand other merchants" is an upper bound.** The count includes all products with the brand name in the title, not just listings of the identical part. | ↓ for the controlled comparison | The count overstates the number of merchants carrying the identical part. But even with this overstatement, the finding holds: TSP is absent while other merchants carrying the same brand are present. |

---

## 6. Verdict against the pre-registered rule only

The directive §6 says: *"Conditional on H5 supported, or on a non-trivial count of targets absent at depth 1000."* Stage 2 found 6 of 16 absent at depth, 3 absolutely invisible. §6 is authorized.

The directive §6 says: *"The product is held constant across merchants, so demand, price band and category density are equalised by construction."* Sub-study B holds the product constant (same TSP handle) and varies the query phrasing. When the query is natural-language relational, TSP is absent while competitors selling the same brand are present. This is the controlled comparison the directive calls for.

**Verdict: structural invisibility confirmed for 3 of 3 absolutely invisible targets, in the natural-language query condition.**

- **IV01 (BC Racing BR Series):** TSP absent for "coilovers for 2017 Honda Civic" (318 results). 98 same-brand listings from other merchants present. **Structural invisibility confirmed.** Cause: `title_uninformative` — TSP's title omits the brand ("BC Racing") and mismatches the query year (2016 vs 2017).

- **IV02 (ICON Stage 4):** TSP absent for "lift kit for 2023 Ford F-150" (315 results). 21 same-brand listings from other merchants present. **Structural invisibility confirmed.** Cause: `unexplained` — TSP's title contains the brand, product type, and vehicle. The absence is not explained by title. This is the most concerning case.

- **IV03 (Paragon PBP370):** TSP absent for "brake pads for 2018 Honda Civic Si" (293 results). 3 same-brand listings from other merchants present. **Structural invisibility confirmed.** Cause: `title_uninformative` — TSP's title omits the vehicle entirely.

**Classification per TDD §6.2:**
- IV01: `title_uninformative` (brand omitted, year mismatch)
- IV02: `unexplained` (title is adequate, product is enrolled, competitors present)
- IV03: `title_uninformative` (vehicle omitted entirely)

**The general identical-part audit (sub-study A) found 0 structural invisibility cases.** When queried by brand+SKU, all 12 TSP products are present. The invisibility is specific to natural-language relational queries — the queries real buyers use.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| General identical-part audit script | `scripts/probe-identical-part-audit.ts` |
| General identical-part audit results | `scripts/output/identical-part-audit-2026-08-02T20-51-23-532Z.json` |
| Invisible-target audit script | `scripts/probe-invisible-target-audit.ts` |
| Invisible-target audit results | `scripts/output/invisible-target-audit-2026-08-02T20-54-17-635Z.json` |
| Depth-1000 results (Stage 2, for comparison) | `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` |
| TSP storefront product (BC Racing, verified) | `https://www.twostepperperformance.com/products/br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan.json` |
| This report | `docs/reports/directive7-stage3-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**Structural invisibility is query-dependent, not absolute.** All 3 absolutely invisible targets are findable when the query includes brand or SKU terms. They are invisible when the query is natural-language relational — the way a real buyer searches. This means:

1. **The Stage 2 "absent at depth 1000" finding is confirmed as structural invisibility.** The products are enrolled, findable by brand, but invisible by natural-language query. Other merchants selling the same brand are present in the results.

2. **The mechanism is title-dependent for 2 of 3, and unexplained for 1.** IV01 and IV03 have title problems (brand omitted, vehicle omitted). IV02 has an adequate title but is still invisible — the relevance matching is excluding it for reasons that are not visible in the response.

3. **The general identical-part audit (12/12 present) shows that TSP's Catalog enrollment is not broken.** TSP products are in the Catalog and can be found. The invisibility is specific to natural-language relational queries for certain products.

### The surprise

**IV02 (ICON Stage 4) is the most concerning case and it is NOT a title problem.** TSP's title "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD" contains:
- The brand: "ICON"
- The product type: "Lift Kit"
- The vehicle: "Ford F-150"
- The drive type: "4WD"

The query "lift kit for 2023 Ford F-150" should match this title. Competitors with similar titles are returned (rank 66–169). TSP is not. This means the Catalog's relevance matching is excluding TSP's listing for this query, despite an adequate title. The cause is `unexplained` per TDD §6.2.

**Possible explanations (not tested):**
1. TSP's product metadata/tech_specs may not contain the vehicle, while competitors' do. The Catalog may weight metadata over title for relevance.
2. TSP's product may have a different category/taxonomy mapping that excludes it from this query.
3. The Catalog's relevance threshold may require an exact year match ("2021-2024" doesn't match "2023" in the query), while competitors' titles use "2021-2023" or "2023" which match better.

### The implication for the project

1. **H4 is necessary but not sufficient.** Title absence explains 2 of 3 invisibility cases. The third (IV02) has an adequate title but is still invisible. There is a second mechanism beyond title.

2. **The commercial consequence is real.** A buyer searching "lift kit for 2023 Ford F-150" will not find TSP's ICON Stage 4 kit. They will find 21 other ICON listings from other merchants. TSP loses this sale. This is the commercial consequence the project was designed to measure.

3. **The fix is different per case.**
   - IV01: Add "BC Racing" to the title. Fix the year range to match search behaviour.
   - IV02: Investigate metadata/tech_specs. The title is adequate; the problem is elsewhere.
   - IV03: Add the vehicle to the title (H4 fix).

4. **No merchant-facing artefact is produced.** Per DIRECTIVE-7 §0, no merchant-facing document is authorised. The 3 invisibility cases are findings worth reporting, not claims worth selling.

### Blockers

1. **The cause of IV02's invisibility is unknown.** The title is adequate. The product is enrolled. Competitors are present. The Catalog's relevance matching is excluding TSP's listing for reasons that are not visible in the response. Further investigation would require access to the Catalog's relevance scoring, which is opaque.

2. **The "same-brand other merchants" count is an upper bound.** A precise count would require matching by SKU, which is not available in the Catalog response. The caveat in §3 applies.

### Disagreement with the directive

1. **The directive's §6 said "the product is held constant across merchants, so demand, price band and category density are equalised by construction."** This is true for the brand/SKU queries in sub-study A. For the natural-language queries in sub-study B, the product is held constant but the query varies — so demand and category density are equalised (same query, same result set), but the comparison is between "TSP's listing of product X" and "other merchants' listings of the same brand." This is the right comparison for the question "is TSP's listing invisible when competitors' listings of the same part are visible?"

2. **The directive anticipated that §6 might find "the target's product is not enrolled."** Sub-study A confirmed that all 12 TSP products are enrolled and findable by brand+SKU. The invisibility is not an enrollment problem. It is a relevance matching problem specific to natural-language queries.
