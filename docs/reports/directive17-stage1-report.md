# DIRECTIVE-17 Stage 1 Report — Partition Rebuild + Union Presence + total_count Probe

**Directive:** DIRECTIVE-17 §1 + §2
**Date:** 4 August 2026
**Stage:** 1 of 4
**Status:** COMPLETE

---

## Executive summary

Three corrections land in this stage:

1. **The "false positive" class is eliminated.** The enumeration cannot produce false positives — a handle it returns for a seller IS in the Catalog. The 4 prior "false positives" were reference-standard false negatives. Presence is now established by **either** detector (union presence): 80/100, not 77/100. Absence requires **both** to miss: 20/100.

2. **The partition was rebuilt from full metadata.** The old 524-query partition came from 5,250 products (29% of the catalogue). The new 692-query partition comes from all 18,066 products. 82 vendors and 86 product types that were never queried are now in the partition. The enumeration recovered 13,257 handles (was 13,107).

3. **`total_count` is a response budget.** Seven unrelated queries all return 361–387. Register entry 13 added. The CAP reading of U-7 is settled.

| Metric | Prior (DIRECTIVE-16) | Corrected (DIRECTIVE-17) |
|---|---|---|
| Partition queries | 524 (from 5,250 products) | 692 (from 18,066 products) |
| Enumeration handles | 13,107 | 13,257 |
| Presence definition | Reference standard only (77) | Union of both detectors (80) |
| Absence rate | 23.0% (ref standard) / 25.5% (at recall=0.974) | **20.0%** (union, upper bound) |
| 95% CI | not reported | **[13.3%, 28.9%]** |
| Recall (against union) | 97.4% (against ref standard) | **88.8%** (against union) |
| `total_count` | assumed to be match count | **response budget (~360–390)** |

---

## 1. §1.3 — Partition rebuild

### The problem

The prior 524-query partition was built from the old 5,250-product `/products.json` fetch — 29% of the true 18,066 products. Vendors and product types that appear only in the missing 12,816 products were never queried.

### The fix

Fetched full `/products.json` with metadata (73 pages, 18,098 products — 32 more than the prior 18,066, likely new products added between fetches). Rebuilt the partition:

| | Old (5,250 products) | New (18,098 products) | Delta |
|---|---|---|---|
| Vendors | 183 | 265 | +82 |
| Product types | 342 | 428 | +86 |
| Total queries | 524 | 692 | +168 |

82 vendors and 86 product types were missing from the old partition. These are vendors and product types that appear only in products beyond page 21 of `/products.json` — the products our fetch bug was truncating.

### Enumeration re-run

| | Old (524 queries) | New (692 queries) |
|---|---|---|
| Handles recovered | 13,107 | 13,257 |
| Delta | — | +150 |

The additional 168 queries recovered only 150 new handles. The marginal return per query is diminishing — the partition is approaching saturation.

### Handle count reconciliation

| Source | Count | Explanation |
|---|---|---|
| DIRECTIVE-15 Stage 3 | 13,358 | Original run, 524 queries from 5,250 metadata |
| DIRECTIVE-16 re-run | 13,107 | Re-run of same 524 queries (API non-determinism: tail differs between runs) |
| DIRECTIVE-17 | 13,257 | 692 queries from 18,098 metadata |

The 13,358 → 13,107 difference (251 handles) is the API's non-determinism — the tail is not deterministic (World B, DIRECTIVE-16 §3.3), so different runs recover slightly different handles. The 13,107 → 13,257 difference (150 handles) is the additional 168 queries from the full metadata.

---

## 2. §1.2 — Union presence recomputation

### The false positive class cannot exist

The enumeration is a union of scoped Catalog searches, seller-filtered under I-3. **A handle it returns for that seller is in the Catalog.** It cannot fabricate one. The 4 products the reference standard labelled "absent" but the enumeration found (DIRECTIVE-16 Stage 3) are **reference-standard false negatives**, not enumeration false positives.

### Corrected scoring

Presence is established by **either** detector. Absence requires **both** to miss.

| | Present | Absent |
|---|---|---|
| Reference standard alone | 77 | 23 |
| Enumeration alone | 74 | 26 |
| **Union of both** | **80** | **20** |

| Outcome | Count |
|---|---|
| Both present | 71 |
| Ref only present | 6 |
| Enum only present | 3 |
| Both absent | 20 |

- Reference-standard sensitivity: ≤ 77/80 = 96.3%
- Enumeration recall (against union): 71/80 = **88.8%**
- **Absence rate: 20/100 = 20.0%**, 95% CI **[13.3%, 28.9%]** (Wilson score, n=100)
- **20.0% is an upper bound** — both detectors are imperfect, so some of the remaining 20 are likely present too

### Why recall dropped from 97.4% to 88.8%

The prior 97.4% was measured against reference-standard presence (77 products). The corrected 88.8% is measured against union presence (80 products). The 3 enum-only products are now in the "present" set but the enumeration didn't find the 6 ref-only products, so the denominator grew while the numerator didn't. This is the honest number — the prior figure was inflated by the reference standard's false negatives being counted as absent.

---

## 3. §2 — `total_count` is a response budget

### Probe

Seven semantically unrelated queries:

| Query | `total_count` |
|---|---|
| brake pads for 2018 Honda Civic Si | 362 |
| zxqv flurbin widget (nonsense) | 361 |
| organic coffee beans | 361 |
| yoga mat | 373 |
| dog leash | 387 |
| mechanical keyboard | 385 |
| garden hose | 381 |

Range: 361–387. A nonsense query and a real query return nearly identical values (361 vs 362). Five unrelated real queries all return 361–387.

### Verdict

`total_count` is a **response budget**, not a match count. The Catalog API returns approximately the same number of results regardless of query semantics. For queries with more than ~360 genuine matches, the result set is truncated by budget, not exhausted by relevance.

### Register entry 13

Added to `platform-facts-register.md`. The CAP reading of U-7 (register entry 7) is settled — the ~300 exhaustion boundary is a budget cap, not a relevance boundary.

### Consequence

Rank-based absence testing is retired (DIRECTIVE-17 §3). A product "absent at depth 1000" was never absent from the Catalog — it was just not in the top ~360 results for that query. The enumeration asks membership directly and does not depend on rank stability or budget caps.

---

## 4. Absence range for Subimods (corrected)

| Source | Absent share | Notes |
|---|---|---|
| Random sample (union presence) | **20.0%** | 95% CI [13.3%, 28.9%], n=100, upper bound |
| Enumeration at recall=1.00 | 26.6% | (18,067 − 13,257) / 18,067 |
| Enumeration at recall=0.888 | 17.5% | (18,067 − 13,257/0.888) / 18,067 |

The random sample estimate (20.0%) is independent of enumeration recall and is the most reliable figure. The enumeration estimates bracket it: 26.6% at recall=1.0 (upper bound) and 17.5% at recall=0.888 (lower bound).

**Reported as: at most 20.0% (95% CI 13.3–28.9%), one store, upper bound.**

---

## 5. Data files

| File | Content |
|---|---|
| `scripts/output/d17-subimods-full-metadata.json` | 18,098 products with vendor, product_type, title |
| `scripts/output/d17-enumeration-handles.json` | 13,257 handles from 692-query enumeration |
| `scripts/output/d17-recall-recomputed.json` | Union presence scoring, CIs, absence range |
| `scripts/probe-d17-partition-rebuild.ts` | Partition rebuild + enumeration + scoring script |

---

## 6. Next stage

Stage 2: §3 re-derivations — the three absolutely-invisible targets, the six absent targets, and Subimods' 0/10 store-level invisibility, all re-derived through the enumeration rather than rank-based retrieval.
