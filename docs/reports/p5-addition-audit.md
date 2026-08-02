# P-5 — Addition-side audit (DIRECTIVE-4 §6 / DIRECTIVE-5 §6)

**Date:** 2 August 2026
**Auditor:** Devin (automated comparison against manufacturer's published application lists)

## Method

For each of the 4 Kryptonite part numbers, compare the vehicles Shopify's inference added to `tech_specs` (that the merchant never stated in title/tags/body) against Kryptonite's own published application list, sourced from kryptoniteproducts.com and verified against lowriders.ca and suspensionsuperstore.com.

Each added vehicle is marked: **correct** / **incorrect** / **undetermined**.

---

## KRUCA12 — Upper Control Arm Kit (2007-2018)

**Kryptonite's published fits:**
- 2007-2018 Chevrolet Silverado 1500
- 2007-2018 GMC Sierra 1500
- 2007-2020 Cadillac Escalade
- 2007-2013 Chevrolet Avalanche
- 2007-2019 Chevrolet Suburban 1500
- 2007-2019 Chevrolet Tahoe
- 2007-2019 GMC Yukon 1500

**Shopify inferred (added to tech_specs):**

| Inferred vehicle | On manufacturer list? | Verdict |
|---|---|---|
| chevrolet silverado | Yes (Silverado 1500) | **correct** |
| gmc sierra | Yes (Sierra 1500) | **correct** |
| chevrolet tahoe | Yes (2007-2019 Tahoe) | **correct** |
| chevrolet suburban | Yes (2007-2019 Suburban 1500) | **correct** |
| gmc yukon | Yes (2007-2019 Yukon 1500) | **correct** |
| chevrolet avalanche | Yes (2007-2013 Avalanche) | **correct** |
| cadillac escalade | Yes (2007-2020 Escalade) | **correct** |

**Result: 7/7 correct.** Every vehicle Shopify inferred is on Kryptonite's published application list. No incorrect additions.

**Missing from inference (on manufacturer list but not inferred):** None at the (make, model) level — all 7 make+model pairs are captured. (Year ranges and trim levels like "1500" are not captured by the extractor, but those are not the claim being audited.)

---

## KRUCA19 — Upper Control Arm Kit (2019+)

**Kryptonite's published fits:**
- 2019+ Chevrolet Silverado 1500
- 2019+ GMC Sierra 1500
- 2021+ Chevy 1500 SUV's (Tahoe, Suburban, Yukon)
- 2021+ GMC 1500 SUVs

**Shopify inferred (added to tech_specs):**

| Inferred vehicle | On manufacturer list? | Verdict |
|---|---|---|
| chevrolet silverado | Yes (Silverado 1500) | **correct** |
| gmc sierra | Yes (Sierra 1500) | **correct** |

**Result: 2/2 correct.** Both inferred vehicles are on the list.

**Missing from inference:** Tahoe, Suburban, Yukon, Escalade (the SUV variants). These are on the manufacturer's list but not inferred. This is an **omission** (false negative), not an addition error. The omission is consistent with the coverage gap finding — Shopify's inference doesn't capture the full fitment list.

---

## KRSE11 — Shock Extension Kit (2011-2026)

**Kryptonite's published fits:**
- 2011-2026 Chevrolet Silverado 2500 HD
- 2011-2026 Chevrolet Silverado 3500 HD
- 2011-2026 GMC Sierra 2500 HD
- 2011-2026 GMC Sierra 3500 HD

**Shopify inferred (added to tech_specs):**

| Inferred vehicle | On manufacturer list? | Verdict |
|---|---|---|
| chevrolet silverado | Yes (Silverado 2500 HD / 3500 HD) | **correct** |
| gmc sierra | Yes (Sierra 2500 HD / 3500 HD) | **correct** |

**Result: 2/2 correct.** Both inferred vehicles are on the list.

**Missing from inference:** The HD designation (2500/3500) is not captured, but at the (make, model) level, Silverado and Sierra are both present. No incorrect additions.

---

## KRFD17STAGE2FOX — Stage 2 Leveling Kit with Fox Shocks

**Kryptonite's published fits:**
- 2017-2025 Ford F-250 Super Duty
- 2017-2025 Ford F-350 Super Duty

**Shopify inferred (added to tech_specs):**

| Inferred vehicle | On manufacturer list? | Verdict |
|---|---|---|
| ford super duty | Yes (F-250/F-350 Super Duty) | **correct** |

**Result: 1/1 correct.** The inferred "Ford Super Duty" is on the list. The inference uses the platform name ("Super Duty") rather than the model designation ("F-250/F-350"), but the vehicle is correctly identified.

---

## Summary

| Part number | Inferred vehicles | Correct | Incorrect | Undetermined |
|---|---|---|---|---|
| KRUCA12 | 7 | 7 | 0 | 0 |
| KRUCA19 | 2 | 2 | 0 | 0 |
| KRSE11 | 2 | 2 | 0 | 0 |
| KRFD17STAGE2FOX | 1 | 1 | 0 | 0 |
| **Total** | **12** | **12** | **0** | **0** |

**All 12 inferred vehicles are correct.** Zero incorrect additions. Shopify's cross-merchant merge is supplying accurate relational data where the merchant's own page is thin.

## Interpretation

This is **TDD §2.5 consequence 1 observed in fitment for the first time**: Shopify's inference is *supplying* relational data where the merchant's own page is thin. The MAPerformance Kryptonite product pages have 111-169 character descriptions with no vehicle names, but Shopify's tech_specs correctly identify the vehicles from cross-merchant data (likely from other merchants selling the same Kryptonite products with richer descriptions).

**This shrinks the addressable surface** to merchants whose fitment data is rich AND exclusive — i.e., merchants who state vehicles the inference cannot supply from other sources. For merchants selling widely-distributed brands (like Kryptonite), the inference fills the gap. For merchants selling exclusive or custom products, it cannot.

**On the dead premise:** This is not a resurrection of "Shopify's inference hallucinates specs." That was nullified at n=59 on rich-source products. The population here is the opposite: 111-169 character descriptions where inference fills a vacuum from cross-merchant data. Different population, different mechanism, checked by hand. The inference-accuracy reframe stays dead. This audit confirms the addition side is accurate, not that inference is unreliable in general.

**Limitation:** This audit covers 4 part numbers from one brand (Kryptonite) on one store (MAPerformance). The 12/12 correct result is encouraging but not generalizable. A broader audit would be needed to claim the addition side is always correct.
