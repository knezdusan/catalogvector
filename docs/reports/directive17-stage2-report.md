# DIRECTIVE-17 Stage 2 Report — §3 Re-derivations Through Enumeration

**Directive:** DIRECTIVE-17 §3
**Date:** 4 August 2026
**Stage:** 2 of 4
**Status:** COMPLETE

---

## Executive summary

All three rank-based absence findings are re-derived through the enumeration. The results split into two categories:

1. **The 3 "absolutely invisible" targets and the 3 unique "absent at depth" targets AGREE** — all are absent from the Subimods-scoped enumeration. The rank-based verdict was correct: these products are not in the Catalog as Subimods products.

2. **Subimods' "0/10 store-level invisibility" is more nuanced than originally thought.** 9 of 12 targets were found by unscoped rank-based search (they ARE in the Catalog) but NONE are in the Subimods-scoped enumeration. This means these 9 products are in the Catalog **from other sellers**, not from Subimods. The original finding ("0/10 Subimods products visible in unscoped search") was measuring the wrong thing — it was interpreted as "Subimods products are invisible" but the correct interpretation is "these products are in the Catalog but not syndicated by Subimods."

| Finding | Rank-based verdict | Enumeration verdict | Status |
|---|---|---|---|
| 3 absolutely invisible | absent | absent | **AGREES** — genuinely absent from Catalog |
| 3 unique absent-at-depth | absent | absent | **AGREES** — genuinely absent from Catalog as Subimods products |
| Subimods 0/10 | "invisible" | 0/12 in scoped enum, 9/12 in unscoped | **RESTATED** — products are in Catalog from other sellers, not syndicated by Subimods |

---

## 1. The 3 "absolutely invisible" targets

| Target | Handle | Rank-based | Enumeration | Agreement |
|---|---|---|---|---|
| IV01 | br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan | invisible | ABSENT | AGREES |
| IV02 | icon-stage-4-w-billet-uca-suspension-kit-for-2021-2025-ford-f-150-4wd | invisible | ABSENT | AGREES |
| IV03 | paragon-pbp370-brake-pads | invisible | ABSENT | AGREES |

All 3 were declared "absolutely invisible" because they were not found in unscoped search at any depth. The enumeration confirms: they are not in the Catalog as Subimods products. The rank-based verdict was correct.

**Note:** "Absent from Subimods-scoped enumeration" means these products are not in the Catalog with Subimods as the seller. They may or may not be in the Catalog from other sellers — the scoped enumeration cannot detect that. The unscoped rank-based search also did not find them, which suggests they are genuinely absent from the Catalog entirely (not just from Subimods).

---

## 2. The 10 "absent at depth" targets

The 10 absent-at-depth entries contain 3 unique products (some appear in multiple queries):

| Handle | Appearances | Population | Enumeration | Agreement |
|---|---|---|---|---|
| paragon-pbp370-brake-pads | 2 (Q01, Q03) | retained | ABSENT | AGREES |
| paragon-pbp1557-brake-pads | 1 (Q03) | retained | ABSENT | AGREES |
| 27won-brake-pads | 3 (Q03, Q05, Q15) | dropped | ABSENT | AGREES |
| prl-motorsports-4-piston-bbk-paragon-upgrade-kit... | 1 (Q05) | dropped | ABSENT | AGREES |
| br-series-coilovers-for-2016-honda-civic-non-si... | 2 (Q10, Q16) | retained | ABSENT | AGREES |
| icon-stage-4-w-billet-uca-suspension-kit-for-2021... | 1 (Q11) | retained | ABSENT | AGREES |

All 6 unique products are absent from the Subimods-scoped enumeration. The rank-based verdict was correct for all of them.

---

## 3. Subimods' 0/10 store-level invisibility — RESTATED

### The original finding

The original finding (DIRECTIVE-7 Stage 2) was that 0 of 10 Subimods products appeared in unscoped (all-store) search results for vehicle-specific queries. This was interpreted as "Subimods products are invisible to AI shopping agents."

### The re-derivation

The depth-1000 query set contains 12 unique Subimods targets. Against the Subimods-scoped enumeration:

| Metric | Count |
|---|---|
| Total unique targets | 12 |
| Found in unscoped rank-based search | 9/12 |
| Absent from unscoped rank-based search | 3/12 |
| **Present in Subimods-scoped enumeration** | **0/12** |
| Absent from Subimods-scoped enumeration | 12/12 |

### The correct interpretation

**All 12 products are absent from the Subimods-scoped enumeration.** This means none of them are in the Catalog with Subimods as the seller.

But 9 of 12 were found by unscoped rank-based search — meaning they ARE in the Catalog, just from other sellers. The 3 that were not found in unscoped search (the "absolutely invisible" targets) are genuinely absent from the Catalog entirely.

**The original "0/10 store-level invisibility" finding was measuring the wrong thing.** It was interpreted as "Subimods products are invisible in the Catalog" but the correct interpretation is:

1. **9 of 12 products are in the Catalog from other sellers** — they are visible to AI shopping agents, just not attributed to Subimods. This is a syndication failure, not a visibility failure.
2. **3 of 12 products are genuinely absent from the Catalog** — not even other sellers have them.

### What this means for the project

The finding that survived longest — "Subimods' 0/10 store-level invisibility" — is restated as:

> **Subimods does not syndicate any of 12 tested products to the Catalog. 9 of 12 are in the Catalog from other sellers (visible to AI agents but not attributed to Subimods). 3 of 12 are genuinely absent from the Catalog entirely.**

This is consistent with register entry 10 (no per-store enumeration endpoint) and the absence rate finding (20% of Subimods' catalogue is absent from the Catalog). The 0/12 scoped-enumeration rate is higher than the 20% population rate because these 12 products were specifically selected as targets for a rank-based visibility test — they were not a random sample.

### The syndication question

The 9 products that are in the Catalog from other sellers raise a new question: **why does Subimods not syndicate products that other sellers do?** This is the H9 question (is absence systematic?) in miniature. If Subimods' non-syndication is predictable from a product attribute, that is a diagnosis. If it is random, it is not.

---

## 4. Data files

| File | Content |
|---|---|
| `scripts/output/d17-rederivations.json` | All re-derivation results |
| `scripts/probe-d17-rederivations.ts` | Re-derivation script |

---

## 5. Next stage

Stage 3: §4 — run the corrected enumeration on TSP and MAP with per-store confidence intervals. MAP requires sitemap-derived metadata (its `/products.json` is capped at 25,000 of 102,176).
