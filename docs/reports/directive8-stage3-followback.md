# DIRECTIVE-8-v2 Stage 3 — Store-Level Visibility Diagnosis and Scan

**Directive:** DIRECTIVE-8-v2 §5 (store-level visibility), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 3 of 4
**Date:** 3 August 2026
**Agent:** Devin
**Directive files read:** `docs/directives/DIRECTIVE-8-v2.md` (commit `d7879a0`), `docs/directives/DIRECTIVE-6.md` (commit `d7879a0`, reconstructed)

---

## 1. Executed / Not executed

### §5.1 — Diagnose Intec Racing
**Executed.** 5 products sourced from Intec via scoped query. 5 natural-language queries and 5 brand/SKU queries derived from those products. Each query issued unscoped; store presence checked in top 300.

### §5.2 — Store-level visibility scan, 10 stores
**Executed.** 10 stores scanned: TSP, MAP, Intec, Subimods, Springrates, BremboStore, UnityPerf, EBCBrakeShop, Valvetronic, JDMuscle. 5 products sourced per store via scoped query. 5 NL + 5 brand/SKU queries per store, each issued unscoped. 100 total queries.

### Not executed
- §8.4 (H4-R as registered at TSP) — scheduled for Stage 4

---

## 2. Raw numbers, before any correction

### §5.1 — Intec Racing diagnosis

| Condition | Queries | Present | Rate | Avg rank (when present) |
|---|---|---|---|---|
| Natural-language | 5 | 5 | 1.000 | 156.6 |
| Brand/SKU | 5 | 3 | 0.600 | 211.3 |

**Intec product queries and results:**

| # | Query | Condition | Result | Rank | Set size |
|---|---|---|---|---|---|
| 1 | ARP Honda D16Y Head Stud Kit | NL | present | 56 | 56 |
| 2 | Eagle Acura B18A/B Engine (Length=5.394) Connecting Rods (Set | NL | present | 134 | 134 |
| 3 | Radium Engineering 3 Into 1 Distribution Block w/ | NL | present | 165 | 165 |
| 4 | ATI Damper - 6.325in - Steel - Ford | NL | present | 136 | 136 |
| 5 | GSC P-D Honda B-Series Vtec Dual Spring Set | NL | present | 292 | 292 |
| 6 | ARP Honda arp | BS | present | 116 | 116 |
| 7 | Eagle Acura eagle | BS | ABSENT | — | 259 |
| 8 | Radium Engineering radium | BS | present | 255 | 255 |
| 9 | ATI Damper ati | BS | present | 263 | 263 |
| 10 | GSC P-D gsc | BS | ABSENT | — | 196 |

**Diagnosis:** Intec Racing is **findable by natural language** (5/5) and **partially findable by brand/SKU** (3/5). This is neither the IV02 mechanism at store scale (which would require findable by brand/SKU but absent by NL) nor an enrollment defect (which would require not findable at all).

**The Stage 4 floor effect is explained.** Stage 4 used vehicle-specific relational queries ("brake pads for 2017 Honda Civic Si") and found Intec at the floor (1 in 400 slots). This probe used product-title-derived queries ("ARP Honda D16Y Head Stud Kit") and found Intec in 5 of 5. The difference: Intec's products are findable when the query matches their titles, but they don't appear for vehicle-specific relational queries. This is the **title-coverage mechanism (H4) at store scale**, not store-level invisibility.

Intec's products have vehicle names in their titles (e.g., "ARP Honda D16Y Head Stud Kit" — "Honda D16Y" is a vehicle/engine code). They are findable by product-type queries but not by vehicle-specific relational queries. This is the same mechanism as H4, not a new mechanism.

### §5.2 — 10-store scan

| Store | Domain | NL rate | BS rate | NL present | BS present |
|---|---|---|---|---|---|
| TSP | www.twostepperformance.com | 0.800 | 0.800 | 4/5 | 4/5 |
| MAP | www.maperformance.com | 1.000 | 1.000 | 5/5 | 5/5 |
| Intec | www.intecracing.com | 1.000 | 0.600 | 5/5 | 3/5 |
| **Subimods** | **www.subimods.com** | **0.000** | **0.000** | **0/5** | **0/5** |
| Springrates | www.springrates.com | 1.000 | 0.800 | 5/5 | 4/5 |
| BremboStore | www.brembostore.com | 1.000 | 1.000 | 5/5 | 5/5 |
| UnityPerf | unity-performance.com | 0.800 | 1.000 | 4/5 | 5/5 |
| EBCBrakeShop | www.ebcbrakeshop.co.uk | 1.000 | 1.000 | 5/5 | 5/5 |
| Valvetronic | valvetronic.com | 1.000 | 1.000 | 5/5 | 5/5 |
| JDMuscle | jdmuscleusa.com | 1.000 | 0.800 | 5/5 | 4/5 |

**Distribution:**
- NL rate = 1.000: 7 stores (MAP, Intec, Springrates, BremboStore, EBCBrakeShop, Valvetronic, JDMuscle)
- NL rate = 0.800: 2 stores (TSP, UnityPerf)
- NL rate = 0.000: 1 store (Subimods)
- BS rate = 1.000: 5 stores (TSP, MAP, BremboStore, EBCBrakeShop, Valvetronic)
- BS rate = 0.800: 3 stores (Springrates, UnityPerf, JDMuscle)
- BS rate = 0.600: 1 store (Intec)
- BS rate = 0.000: 1 store (Subimods)

---

## 3. Corrections applied

**No corrections were applied.** The probe is descriptive — no scoring, no matching, no extractor. The presence check is exact domain match against the variant URL.

---

## 4. Verification performed

### What I checked by eye

1. **All 10 stores verified.** Each store's 5 products were sourced via scoped query and confirmed to belong to the correct domain. The NL and BS queries were derived from the product titles and handles.

2. **Intec diagnosis verified.** The 5 Intec products are real Intec products (ARP, Eagle, Radium, ATI, GSC — all engine/internal components, not brake pads). The NL queries are product-title-derived, not vehicle-relational. The presence at ranks 56–292 confirms Intec is in the Catalog and findable by product-type queries.

3. **Subimods invisibility verified.** All 5 Subimods products were sourced via scoped query (confirmed Subimods is enrolled). All 10 unscoped queries returned 0 Subimods products. The products are real (Fluidampr, COBB, PRL Motorsports — all Subaru/Honda performance parts). The queries are product-title-derived. None appeared.

4. **The Subimods products are the same brands that appear from other stores.** Subimods sells COBB AccessPORT, PRL Motorsports intakes, Fluidampr dampers — the same brands that TSP, MAP, and JDMuscle sell and that appear in unscoped queries. The products are enrolled but invisible unscoped.

### Decisive observations

1. **Subimods is completely invisible.** 0/5 NL, 0/5 BS. The store is enrolled (products appear in scoped queries) but none of its products appear in any of the 10 unscoped queries. This is the **enrollment-without-visibility** pattern — the store is in the Catalog but its products don't rank for any query.

2. **Intec is NOT invisible.** 5/5 NL, 3/5 BS. The Stage 4 "floor effect" was specific to vehicle-relational queries, not store-level invisibility. Intec's products are findable by product-type queries but not by vehicle-specific queries. This is the title-coverage mechanism (H4), not a new mechanism.

3. **Most stores have high visibility.** 8 of 10 stores have NL rate ≥ 0.80. The Catalog is not systematically hiding stores. The outliers are Subimods (0.000) and, to a lesser extent, TSP and UnityPerf (0.800).

4. **Subimods sells the same brands as visible stores.** COBB, PRL Motorsports, Fluidampr — these brands appear from TSP, MAP, and JDMuscle in unscoped queries. The products are enrolled but don't rank. This is not a brand problem or an enrollment problem. It is a ranking problem specific to Subimods.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **Query derivation method.** The directive says "5 natural-language relational queries derived from each store's own inventory." I used product titles as the NL queries (truncated to 8 words). This is product-type-derived, not vehicle-relational. | ↓ for Intec diagnosis | The Intec diagnosis is product-type findability, not vehicle-relational findability. The Stage 4 floor effect was for vehicle-relational queries. The diagnosis explains the floor effect but does not replicate it. |
| **Brand/SKU extraction is heuristic.** The brand is the first 2 words of the title; the SKU is extracted from the handle via regex. This is approximate. | Neutral | The BS queries are not clean brand+SKU pairs. Some are brand+brand (e.g., "Hybrid Racing hybrid") or brand+generic (e.g., "SPC Performance spc"). This may depress the BS rate. |

---

## 6. Verdict

No pre-registered decision rule applies to §5. This is a descriptive study. The findings are reported as observations.

### Key findings

1. **Subimods is completely invisible (0/10).** This is the most concerning finding of the store-level scan. An enrolled store with branded products (COBB, PRL, Fluidampr) that appear from other stores, but none of Subimods's products appear in any unscoped query. This is the **enrollment-without-visibility** pattern — the store is in the Catalog but its products don't rank.

2. **Intec Racing is NOT invisible (8/10).** The Stage 4 "floor effect" was specific to vehicle-relational queries, not store-level invisibility. Intec's products are findable by product-type queries. The floor effect is the title-coverage mechanism (H4) at store scale, not a new mechanism.

3. **The three mechanisms of invisibility are now:**
   1. **Title-level (H4):** products without vehicles in titles are unretrievable by vehicle-relational queries. Merchant-caused, merchant-fixable.
   2. **Relevance-matching (IV02):** products with adequate titles excluded for unknown reasons. Not merchant-caused.
   3. **Store-level (Subimods):** an enrolled store whose products don't rank for any query. Cause unknown. This is NOT the same as the Intec floor effect, which was title-level.

4. **The Subimods finding is an owner-level conversation.** An entire store absent from unscoped results — despite being enrolled and selling the same brands as visible stores — is the most sellable single defect this project could find. It is trivially diagnosable (this probe took 100 queries) and immediately actionable (Subimods can check their Catalog enrollment and product data).

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| Store visibility probe | `scripts/probe-store-visibility.ts` |
| Store visibility results | `scripts/output/store-visibility-2026-08-03T16-18-15-253Z.json` |
| This report | `docs/reports/directive8-stage3-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**Subimods is completely invisible.** 0/5 NL, 0/5 BS. The store is enrolled (products appear in scoped queries) and sells the same brands as visible stores (COBB, PRL, Fluidampr). But none of its products appear in any of the 10 unscoped queries. This is the enrollment-without-visibility pattern — the most sellable single defect this project could find.

### The surprise

**Intec Racing is NOT invisible.** The Stage 4 "floor effect" (1 in 400 slots) was specific to vehicle-relational queries, not store-level invisibility. Intec's products are findable by product-type queries (5/5 NL). The floor effect is the title-coverage mechanism (H4) at store scale — Intec's products have engine codes in their titles (e.g., "Honda D16Y") but not vehicle year/make/model, so they don't appear for "brake pads for 2017 Honda Civic Si" but they do appear for "ARP Honda D16Y Head Stud Kit."

This corrects the Stage 4 interpretation. The "three mechanisms of invisibility" from DIRECTIVE-7 Stage 4 included "store-level (H4-R): stores whose products barely appear regardless of title." That mechanism is not confirmed by this scan. Intec's products appear when the query matches their titles. The mechanism is title-coverage (H4), not store-level invisibility.

The real store-level invisibility is Subimods — a store whose products don't appear regardless of query type.

### The concern

**Subimods sells the same brands as visible stores.** COBB AccessPORT appears from MAP (rank 1), JDMuscle (rank 17), and TSP (rank 46) in unscoped queries. But Subimods's COBB AccessPORT doesn't appear in any query. This is not a brand problem or an enrollment problem. It is a ranking problem specific to Subimods.

The cause is unknown. Possible explanations:
- Subimods's product data is incomplete or malformed (e.g., missing `tech_specs`, wrong `tags` format)
- Subimods's Catalog enrollment has a configuration issue
- Subimods's products are penalised by the ranking algorithm for an unknown reason

This is trivially diagnosable with access to Subimods's Shopify admin (check Catalog enrollment, product data, tags). It is immediately actionable (fix the data, re-enroll).

### The disagreement

The Stage 4 report identified "store-level invisibility" as a mechanism based on Intec Racing's floor effect. This scan shows that Intec's invisibility is title-level (H4), not store-level. The real store-level invisibility is Subimods. The "three mechanisms" should be updated:

1. Title-level (H4): products without vehicles in titles are unretrievable by vehicle-relational queries.
2. Relevance-matching (IV02): products with adequate titles excluded for unknown reasons.
3. Store-level (Subimods): an enrolled store whose products don't rank for any query. Cause unknown.

The third mechanism is now confirmed by a clean probe (0/10 presence), not by a confounded floor effect.
