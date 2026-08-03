# DIRECTIVE-8-v2 Stage 2 — Domain Concentration + Scoped-Fallback Test + Platform-Facts Register

**Directive:** DIRECTIVE-8-v2 §4.2 (domain concentration), §4.3 (scoped-fallback test), §4.4 (platform-facts register), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 2 of 4
**Date:** 3 August 2026
**Agent:** Devin
**Directive files read:** `docs/directives/DIRECTIVE-8-v2.md` (commit `d7879a0`)

---

## 1. Executed / Not executed

### §4.2 — Domain concentration
**Executed.** All 5,653 product slots across 18 exhaustive queries analysed. Distinct seller domains, top-20 domains by appearance count, their share of all slots and top-10 positions, and the four intrinsic queries reported separately. Zero API calls (data from depth-1000 transcript).

### §4.3 — Scoped-fallback test
**Executed.** Two semantically unrelated scoped queries ("brake pads for 2018 Honda Civic Si" and "lift kit for 2023 Ford F-150") issued against TSP. Jaccard overlap of result sets computed.

### §4.4 — Platform-facts register
**Executed.** Compiled every case where this project established, from payloads, that Shopify's public Catalog documentation is wrong or incomplete. 8 entries, each with documented claim, observed behaviour, evidence, and date.

### Not executed
- §5 (store-level visibility) — scheduled for Stage 3
- §8.4 (H4-R as registered at TSP) — scheduled for Stage 4

---

## 2. Raw numbers, before any correction

### §4.2 — Domain concentration

| Metric | All 18 queries | Relational (14) | Intrinsic (4) |
|---|---|---|---|
| Total product slots | 5,653 | 4,378 | 1,275 |
| Distinct seller domains | 702 | 554 | 275 |

**Top 20 domains by appearance count (all 18 queries):**

| Rank | Domain | Slots | % of slots | Top-10 | % of top-10 | Avg rank |
|---|---|---|---|---|---|---|
| 1 | www.brembostore.com | 204 | 3.6% | 4 | 2.2% | 170.4 |
| 2 | www.ebcbrakeshop.co.uk | 191 | 3.4% | 0 | 0.0% | 270.1 |
| 3 | unity-performance.com | 165 | 2.9% | 16 | 8.9% | 129.6 |
| 4 | shop.redline360.com | 143 | 2.5% | 9 | 5.0% | 146.8 |
| 5 | www.cimotorsports.com | 123 | 2.2% | 5 | 2.8% | 152.7 |
| 6 | www.twostepperformance.com | 110 | 1.9% | 17 | 9.4% | 113.0 |
| 7 | www.maperformance.com | 108 | 1.9% | 11 | 6.1% | 116.4 |
| 8 | jdmuscleusa.com | 103 | 1.8% | 0 | 0.0% | 171.3 |
| 9 | www.prolinebraidedlines.com | 90 | 1.6% | 3 | 1.7% | 140.0 |
| 10 | www.standardautopart.com | 89 | 1.6% | 5 | 2.8% | 140.1 |
| 11 | www.springrates.com | 80 | 1.4% | 0 | 0.0% | 166.2 |
| 12 | lgcracing.com | 76 | 1.3% | 1 | 0.6% | 172.1 |
| 13 | speedzone-web.com | 75 | 1.3% | 1 | 0.6% | 161.7 |
| 14 | vexms.com | 67 | 1.2% | 0 | 0.0% | 180.4 |
| 15 | valvetronic.com | 63 | 1.1% | 10 | 5.6% | 56.6 |
| 16 | store.motormia.co | 61 | 1.1% | 0 | 0.0% | 140.9 |
| 17 | www.urotuning.com | 58 | 1.0% | 2 | 1.1% | 157.6 |
| 18 | www.raptorracing.ca | 54 | 1.0% | 3 | 1.7% | 173.7 |
| 19 | www.cspracing.com | 52 | 0.9% | 0 | 0.0% | 157.2 |
| 20 | www.dream-automotive.com | 52 | 0.9% | 0 | 0.0% | 154.0 |

**Concentration summary:**
- Top 20 share of all slots: 1,964 / 5,653 = **34.7%**
- Top 20 share of top-10 positions: 87 / 180 = **48.3%**
- TSP: 110 slots (1.9%), 17 top-10 (9.4%), avg rank 113.0
- MAP: 108 slots (1.9%), 11 top-10 (6.1%), avg rank 116.4

**Key observations:**
1. **No single store dominates.** The largest share is 3.6% (Brembo Store). The top 20 combined hold 34.7% of slots — significant concentration but not monopoly.
2. **Top-10 concentration is higher.** The top 20 hold 48.3% of top-10 positions — nearly half. The top 10 positions are more concentrated than the overall slots.
3. **TSP and MAP are top-10 performers.** TSP has 17 top-10 appearances (9.4% of all top-10 slots) and MAP has 11 (6.1%). Both are in the top 7 by top-10 count. When they appear, they appear high.
4. **Some large-volume stores have zero top-10 appearances.** EBC Brake Shop (191 slots, 0 top-10), JDMuscle (103 slots, 0 top-10), Springrates (80 slots, 0 top-10). These stores have volume but not visibility at the top.
5. **Valvetronic has the best avg rank (56.6).** With 63 slots and 10 top-10 appearances, Valvetronic appears high when it appears.

### §4.3 — Scoped-fallback test

| Metric | Value |
|---|---|
| Query 1 | "brake pads for 2018 Honda Civic Si" |
| Query 2 | "lift kit for 2023 Ford F-150" |
| Set 1 size | 244 products |
| Set 2 size | 276 products |
| Intersection | 66 products |
| Union | 454 products |
| **Jaccard overlap** | **0.145 (14.5%)** |

**Verdict: LOW OVERLAP — genuine matching at a lower relevance bar, with partial fallback.**

The 14.5% Jaccard overlap is below the 0.20 threshold for "moderate overlap." The scoped queries return mostly different products for different queries — the first results in each set are relevant (brake pads for query 1, lift kits for query 2). But 66 products appear in both sets, including clearly irrelevant products (e.g., "paragon-pbp1557-brake-pads" in the "lift kit for 2023 Ford F-150" results).

**This means the Stage 2 scoped data is a mix of genuine matching and partial fallback.** It is not a pure U-4 artefact (which would show >50% overlap), but it is not clean data either. The high ranks in scoped runs are likely genuine matches; the tail includes fallback products.

### §4.4 — Platform-facts register

8 entries compiled. See `docs/reports/platform-facts-register.md` for the full register.

| # | Fact | Status |
|---|---|---|
| 1 | UPID clustering | Documentation wrong — per-merchant rows |
| 2 | `tech_specs` population | Documentation incomplete — 60–70% of vehicles dropped |
| 3 | Agent-profile approval lead time | Documentation wrong — multi-day, not fast |
| 4 | `tags` schema | Documentation wrong — string, not array |
| 5 | Scoped no-empty-result fallback | Documentation incomplete — returns shop-general catalogue |
| 6 | `filters.shops` hard restriction | Documentation correct |
| 7 | Pagination behaviour | Documentation incomplete — exhausts at ~300, not 1000; unscoped floor exists |
| 8 | Scoped-fallback overlap | Documentation incomplete — partial fallback, 14.5% overlap |

---

## 3. Corrections applied

**No corrections were applied.** The domain concentration analysis is computed from the raw depth-1000 transcript. The scoped-fallback test is computed from live API responses. The platform-facts register is compiled from existing findings.

---

## 4. Verification performed

### What I checked by eye

1. **Domain concentration verified.** All 5,653 product slots from the depth-1000 transcript were processed. Each product's domain was extracted from the variant URL. The top-20 table was checked against the raw data.

2. **Scoped-fallback test verified.** Both scoped queries returned products (244 and 276). The intersection was computed by product handle. The first 5 products in each set were checked for relevance — set 1 starts with brake pads, set 2 starts with lift kits and intakes.

3. **Platform-facts register cross-referenced.** Each entry was checked against the source artefact (transcript, probe output, or report) to confirm the evidence supports the claim.

---

## 5. Deviations from pre-registration

None. All three sub-studies were executed as specified in the directive.

---

## 6. Verdict

No pre-registered decision rule applies to §4.2, §4.3, or §4.4. These are descriptive studies, not hypothesis tests. The findings are reported as observations.

### Key findings

1. **The Global Catalog for performance auto parts is moderately concentrated.** 702 distinct domains across 5,653 slots. The top 20 hold 34.7% of all slots and 48.3% of top-10 positions. No single store dominates. This is publishable on its own — it answers "who actually occupies the Global Catalog for real buyer queries in this vertical."

2. **TSP and MAP are top-10 performers.** TSP holds 9.4% of top-10 positions, MAP holds 6.1%. Both are in the top 7 by top-10 count. When their products appear, they appear high. The problem is not ranking quality for products that appear — it's that some products don't appear at all.

3. **Scoped retrieval is a mix of genuine matching and partial fallback.** 14.5% Jaccard overlap between two unrelated scoped queries. The Stage 2 scoped data is not a pure U-4 artefact, but the tail includes fallback products. High ranks in scoped runs are likely genuine; low ranks may be fallback.

4. **8 platform facts where Shopify's documentation is wrong or incomplete.** The platform-facts register is the one publishable artefact the project already owns outright. It depends on no hypothesis, cannot be over-read, is checkable by anyone with an API key.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| Domain concentration data | Computed from `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` |
| Scoped-fallback probe | `scripts/probe-scoped-fallback.ts` |
| Platform-facts register | `docs/reports/platform-facts-register.md` |
| This report | `docs/reports/directive8-stage2-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The surprise

**EBC Brake Shop has 191 slots but 0 top-10 appearances.** It's the second-largest domain by volume (3.4% of all slots) but never appears in the top 10. Its average rank is 270.1 — deep in the tail. This is a store with high volume but low visibility. It's the inverse of TSP (110 slots, 17 top-10, avg rank 113.0).

This suggests that volume (number of products in the Catalog) is not the same as visibility (top-10 presence). Some stores have volume but not visibility; others have both.

### The implication

The domain concentration data is publishable on its own. It answers a question nobody has asked: who actually occupies the Global Catalog for real buyer queries in this vertical? The answer is: 702 stores, with the top 20 holding 35% of slots and 48% of top-10 positions. TSP and MAP are among the top performers by top-10 count. This is independent of U-7's outcome and of any merchant's defect.

### The blocker

The scoped-fallback test shows 14.5% overlap — low but not zero. This means the Stage 2 scoped data is neither entirely an artefact nor entirely clean. The high ranks are likely genuine; the tail is mixed. This complicates the interpretation of the Stage 2 scoped data but does not invalidate it.
