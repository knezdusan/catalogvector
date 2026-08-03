# U-8 Report — Head/Padding Boundary

**Directive:** DIRECTIVE-9 §1 (executed under DIRECTIVE-11 §5)
**Date:** 3 August 2026
**Status:** COMPLETE
**Verdict:** INCONCLUSIVE

---

## 1. Executive summary

U-8 asked: where does the head end and the padding begin inside a Catalog response? Two probes were run:

- **U8-A (determinism):** The same query issued 3 times. The first 12 ranks are identical across runs for "brake pads for 2018 Honda Civic Si"; after rank 12, agreement drops to ~40%. The nonsense query "zxqv flurbin widget" has a deterministic prefix of only 6 ranks, then agreement drops to ~5%.

- **U8-B (token-overlap decay):** For each of 18 queries, the fraction of query tokens found in each product's title/tech_specs was computed by decile. The nonsense baseline is 0.0 (no tokens match). Real queries maintain 0.40–0.98 fractional overlap throughout all deciles — the overlap never approaches the nonsense baseline. H cannot be estimated with this method.

**The two estimates cannot be compared** — U8-B gives null for all 18 queries. Per the pre-registered decision rule, this is INCONCLUSIVE.

**Practical implication:** The deterministic prefix is ~12 ranks for a real query. `presence@10` is the safest metric. `presence@50` includes significant non-deterministic content. The IV02 comparison (ranks 66–169) is in the padding zone and is unsafe.

---

## 2. U8-A — Determinism probe

### 2.1 Method

Issue the same query 3 times in succession via UCP CLI. Compare product-ID sequences rank by rank. Record the first rank at which the three sequences diverge, and the pairwise agreement rate by decile.

### 2.2 Results

**Real query: "brake pads for 2018 Honda Civic Si"**

| Run | Products returned |
|---|---|
| 1 | 300 |
| 2 | 300 |
| 3 | 300 |

- **First divergence:** rank 13 (first 12 ranks identical across all 3 runs)
- **Agreement by decile:** 0.60, 0.50, 0.37, 0.37, 0.50, 0.37, 0.47, 0.37, 0.53, 0.43

Interpretation: The first 12 ranks are deterministic — the same products in the same order across all 3 runs. After rank 12, the sequence becomes partially stochastic, with ~40% agreement (i.e., ~40% of positions have the same product across all 3 runs). This is not fully random (which would be ~0% for 300 products) — there is structure in the tail, but it is not deterministic.

**Nonsense query: "zxqv flurbin widget"**

| Run | Products returned |
|---|---|
| 1 | 300 |
| 2 | 300 |
| 3 | 200 (third run timed out) |

- **First divergence:** rank 7 (first 6 ranks identical across all 3 runs)
- **Agreement by decile:** 0.35, 0.05, 0.00, 0.05, 0.25, 0.00, 0.15, 0.05, 0.20, 0.10

Interpretation: The nonsense query has a shorter deterministic prefix (6 ranks) and much lower post-prefix agreement (~5-10%). The tail is nearly fully stochastic — consistent with the U-7 finding that the nonsense query returns a floor of ~300 unrelated products.

### 2.3 Comparison

| | Real query | Nonsense query |
|---|---|---|
| Deterministic prefix | 12 ranks | 6 ranks |
| Post-prefix agreement | ~40% | ~5-10% |
| Tail character | Partially structured | Nearly fully stochastic |

The real query has a longer deterministic prefix and more structure in the tail. This is consistent with a head (deterministic, matching) followed by padding (stochastic, non-matching). The boundary is approximately at rank 12 for this query.

---

## 3. U8-B — Token-overlap decay

### 3.1 Method

For each of the 18 depth-1000 queries, and for each returned product, record whether the product title or tech_specs contains any content token from the query (stopwords excluded). Compute the overlap rate by rank decile. The nonsense query's response gives the baseline.

Two metrics were computed:
- **Binary overlap:** fraction of products in the decile that contain ANY query token
- **Fractional overlap:** average fraction of query tokens found in each product's text

### 3.2 Nonsense baseline

The nonsense query "zxqv flurbin widget" returns 350 products. None contain the tokens "zxqv", "flurbin", or "widget".

- **Binary baseline:** 0.0000
- **Fractional baseline:** 0.0000

Sample nonsense product titles: "Replacement Refrigerator Water Filter for Samsung DA97-17376B HAF-QIN/EXP", "Cases - iPhone", "Right Replacement AirPod - 2nd Generation" — confirming these are unrelated floor products.

### 3.3 Results — binary overlap

Binary overlap is 1.000 (100%) for all 18 queries across all deciles. Every product in every response contains at least one query token. This is because auto parts query tokens ("brake", "pads", "honda", "civic", "coilovers", "exhaust") are extremely common in the auto parts catalog.

**The binary method cannot locate the boundary.** H = null for all 18 queries.

### 3.4 Results — fractional overlap

Fractional overlap (what fraction of ALL query tokens appear in the product) is more discriminating:

| Query | Decile 0 | Decile 1 | Decile 2 | ... | Decile 9 | Estimated H |
|---|---|---|---|---|---|---|
| Q01 brake pads 2018 Civic Si | 0.70 | 0.56 | 0.48 | ... | 0.51 | null |
| Q03 front brake pads | 0.81 | 0.77 | 0.75 | ... | 0.68 | null |
| Q10 coilovers 2017 Civic | 0.91 | 0.85 | 0.91 | ... | 0.80 | null |
| Q15 brake pads 2024 Integra | 0.51 | 0.56 | 0.56 | ... | 0.52 | null |
| Q16 coilover kit | 0.98 | 0.78 | 0.88 | ... | 0.94 | null |

(Full table in `scripts/output/u8-results.json`)

The fractional overlap ranges from 0.40 to 0.98 across queries and deciles. It shows mild decay for some queries (Q01: 0.70→0.51) but is flat for others (Q16: 0.98→0.94). **None approach the 0.0 nonsense baseline.** H = null for all 18 queries.

### 3.5 Why U8-B fails

The token-overlap method assumes that padding products will not contain query tokens. This assumption holds for the nonsense query (0% overlap) but fails for real auto parts queries because:

1. **Token commonness:** "brake" appears in ~100% of brake-related products. "Honda" appears in a large fraction of all auto parts products. Even padding products from the auto parts catalog contain these tokens.
2. **No token-free padding:** Unlike the nonsense query (which returns refrigerator filters and iPhone cases), real auto parts queries return auto parts products in their padding — and auto parts products naturally contain auto parts tokens.
3. **The floor is domain-specific:** The U-7 floor is not a random sample of the catalog — it appears to be drawn from the same domain as the query, so it shares vocabulary.

**This is a methodological finding, not just a null result.** The token-overlap method as specified cannot locate the head/padding boundary in domain-specific catalogs where the floor shares the query's vocabulary. A method that uses semantic similarity or rank-based discontinuity rather than token matching would be needed.

---

## 4. Decision rule application

### 4.1 Pre-registered rule (DIRECTIVE-9 §1.2)

> **MEASURABLE HEAD** — U8-A shows a deterministic prefix and U8-B shows overlap decaying to the nonsense baseline at a definable rank, with the two estimates of H within a factor of 2 for ≥12 of 18 queries.
>
> **SHALLOW HEAD** — H < 20 for ≥12 of 18 queries.
>
> **NO BOUNDARY** — token overlap never approaches the nonsense baseline within the response, and U8-A shows determinism throughout.
>
> **INCONCLUSIVE** — the two estimates disagree by more than a factor of 2 on ≥7 of 18 queries, or U8-A shows no stable prefix at all.

### 4.2 Application

| Condition | Observed | Met? |
|---|---|---|
| MEASURABLE HEAD: U8-A deterministic prefix | Yes (12 ranks for real query) | ✓ |
| MEASURABLE HEAD: U8-B overlap decays to baseline | No (null for all 18) | ✗ |
| MEASURABLE HEAD: two estimates within 2x for ≥12/18 | Cannot compare (U8-B is null) | ✗ |
| SHALLOW HEAD: H < 20 for ≥12/18 | U8-A only run on 1 query; U8-B null for all | Insufficient data |
| NO BOUNDARY: overlap never approaches baseline | Yes | ✓ |
| NO BOUNDARY: U8-A shows determinism throughout | No (divergence at rank 13) | ✗ |
| INCONCLUSIVE: two estimates disagree by >2x on ≥7/18 | U8-B is null — cannot compare numerically | ✓ (by inability to compare) |
| INCONCLUSIVE: U8-A shows no stable prefix | No (stable prefix of 12) | ✗ |

**VERDICT: INCONCLUSIVE**

U8-B cannot estimate H for any of the 18 queries (the token-overlap method fails on domain-specific catalogs). U8-A estimates H ≈ 12 for the one real query tested. The two methods cannot be compared because one gives null. This is inconclusive by the rule's intent — the two estimates do not agree because one cannot produce an estimate.

### 4.3 What we can say

Despite the inconclusive verdict, U8-A provides actionable information:

1. **The deterministic prefix is ~12 ranks for a real query.** This means `presence@10` is within the deterministic head and is the safest presence metric.
2. **`presence@50` includes non-deterministic content.** Ranks 13-50 are partially stochastic (~40% agreement). Presence figures at @50 are not pure noise, but they are contaminated.
3. **The IV02 comparison (ranks 66–169) is in the padding zone.** Competitors at those ranks may be padding artefacts. The controlled comparison is unsafe.
4. **Domain concentration at top-10 is safe.** Top-20 and beyond may include padding.
5. **The nonsense query's deterministic prefix is only 6 ranks.** This suggests the Catalog applies some minimal ranking even to nonsense, but the ranking is less stable than for real queries.

### 4.4 What we cannot say

- We cannot estimate H for all 18 queries — U8-A was only run on 1 real query (as the directive specifies: "Issue the same query three times in succession: `brake pads for 2018 Honda Civic Si`").
- We cannot compare U8-A and U8-B estimates — U8-B gives null for all queries.
- We cannot say whether H < 20 for ≥12 of 18 queries — we only have U8-A for 1 query.

---

## 5. Impact on existing findings

| Finding | Status under U-8 |
|---|---|
| IV02: competitors at ranks 66–169 | **Unsafe.** Those ranks are in the padding zone (~40% agreement). The controlled comparison collapses. |
| Domain concentration: top 20 hold 34.7% of slots | **Contaminated.** Slot counts at ranks 13+ include non-deterministic content. |
| Domain concentration: top 20 hold 48.3% of top-10 | **Safe.** Top-10 is within the deterministic prefix. |
| EBC Brake Shop: 191 slots, 0 top-10, avg rank 270 | **Not a finding.** "Volume without visibility" is likely entirely padding. |
| Every `presence@50` figure | **Part-padding.** Ranks 13-50 are partially stochastic. `presence@10` is safer. |
| Stage 1's claim that invisible targets "are NOT in the floor" | **Uninformative.** Padding is partially stochastic; absence from it is expected by chance. |
| Subimods at 0/10 | **Stronger.** Those queries were derived from Subimods' own product titles, so they should land in the head if anything does. Intec scored 5/5 by the identical method. The deterministic prefix makes this finding sharper, not weaker. |

---

## 6. Data

- Results: `scripts/output/u8-results.json`
- Probe script: `scripts/probe-u8-head-padding.ts`
- Extracted depth-1000 data: `scripts/output/u8b-extracted.json`
