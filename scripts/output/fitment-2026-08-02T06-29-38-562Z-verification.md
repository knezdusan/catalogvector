# Fitment-recall probe — VERIFICATION

**Date:** 2 Aug 2026  
**Verifier:** Dušan Knežević  
**Probe:** `scripts/probe-fitment-recall.ts`  
**Raw result:** mean recall = 0.490 (n=12, all from www.twostepperformance.com)  
**Pre-registered threshold:** < 0.80 → coverage gap confirmed

## Sample limitation

**Only 1 of 4 stores contributed to the scored sample.** Two Step Performance contributed 12 products; Subimods contributed 5 rows to `all` but 0 to the sample (the rich bucket was capped at 10, all filled by Two Step). MAPerformance and Springrates contributed 0 rows — their catalog titles use "Multiple Fitments" while storefront titles have specific vehicles, so the title-matching algorithm failed. This is the same C2/C5 finding from the inference-accuracy probe: title-based matching is inadequate, production needs handle or variant-SKU matching.

**The verdict is based on 1 store, not 4.** This is a stated limitation. The Subimods products in `all` (excluded from sample by the cap) show the same pattern — see below.

## Extractor errors found

The closed-vocabulary pattern matcher has three failure modes:

1. **Prose fragments as models:** "honda decided to", "honda tends to", "honda changed up", "subaru parts specialists", "toyota enthusiasts seeking" — these are sentences where a make name appears, not fitment claims.
2. **Possessives:** "honda s 2.0l" = "Honda's 2.0L" — not a model called "s 2.0l".
3. **Slash-merged names:** "honda civic accord" from "Honda Civic, Accord" (two models), "mazda mitsubishi/toyota/scion/alfa romeo" from a slash-separated list.

These errors inflate the stated set (more vehicles counted than real) and deflate recall. The probe's own warning — "verify the extracted sets before trusting this number" — was correct.

## Product-by-product correction

### Products with genuinely empty inferred sets (REAL coverage gaps)

| # | Product | Stated (corrected) | Inferred | Corrected recall |
|---|---|---|---|---|
| 5 | 27WON Brake Pads (Civic Si / Integra) | acura integra, honda civic si | (empty) | **0.00** |
| 6 | PRL BBK + Paragon Kit (Civic Si/Integra) | acura integra, audi rs3, audi tt rs, cadillac cts-v, holden commodore, honda civic si, honda civic, mitsubishi evo, scion fr-s, subaru sti, subaru brz (~11) | (empty) | **0.00** |
| 7 | HEL Brake Lines (Civic Si FE1) | honda civic si | (empty) | **0.00** |
| Sub-1 | BC Racing Coilovers 1992-2001 Impreza WRX | subaru impreza wrx | (empty) | **0.00** |
| Sub-4 | Tomei Expreme Ti Exhaust (BRZ/FRS/86) | scion frs, subaru brz, toyota 86 | (empty) | **0.00** |

These are the strongest findings. The merchant's source text explicitly states fitment for these vehicles, and Shopify's inference produced **zero** fitment entries in `metadata.tech_specs`. An agent searching for "brake pads for Honda Civic Si" or "coilovers for Impreza WRX" cannot retrieve these products.

### Products with partial inferred sets (REAL omissions)

| # | Product | Omitted (corrected) | Corrected recall |
|---|---|---|---|
| 3 | Paragon PBP370 Brake Pads | subaru brz (source says BRZ/FR-S/86, inference has sti only) | **~0.89** (8/9) |
| 10 | Downpipe FK8/FL5/DE5 | acura rdx 2.0t, acura tlx 2.0t | **~0.50** (2/4) |
| Sub-5 | XForce Cat Back (BRZ/GR86) | toyota gr86 | **~0.50** (1/2) |

### Products with full recall after correction (extractor errors only)

| # | Product | Raw recall | Corrected recall | Error |
|---|---|---|---|---|
| 1 | Eibach Sportline Kit | 1.00 | 1.00 | — |
| 2 | Whiteline Camber Arms | 0.00 | **1.00** | "pair" captured as model |
| 4 | Paragon PBP15570 Rear Pads | 1.00 | 1.00 | — |
| 8 | ICON Lift Kit F-150 | 1.00 | 1.00 | — |
| 9 | 27WON Exhaust FL5 | 0.50 | **1.00** | "honda decided to" captured as model |
| 11 | Downpipe 1.5T | 0.60 | **1.00** | "honda civic accord" = two models; "honda s 1.5l" = possessive |
| 12 | TSP Hibiki Exhaust | 1.00 | 1.00 | — |
| Sub-2 | BC Racing 2022-2026 WRX | 0.50 | **1.00** | "vb" is chassis code, not model |
| Sub-3 | BC Racing 2002-2007 Impreza | 1.00 | 1.00 | — |

## Corrected numbers

**Two Step Performance only (n=12, as scored):**
- Corrected mean recall: (1.00 + 1.00 + 0.89 + 1.00 + 0.00 + 0.00 + 0.00 + 1.00 + 1.00 + 0.50 + 1.00 + 1.00) / 12 = **0.70**
- Still below 0.80 threshold. **Verdict holds.**

**Including Subimods products from `all` (n=17):**
- Corrected mean recall: (above 12 + 0.00 + 1.00 + 1.00 + 0.00 + 0.50) / 17 = **0.64**
- Still below 0.80 threshold. **Verdict holds.**

## The finding

**Shopify's inference layer drops vehicles from fitment lists.** In 5 of 17 verified products (29%), the merchant's source text explicitly states fitment for specific vehicles, and the Catalog's `metadata.tech_specs` contains **zero** fitment entries. In 3 more products (18%), the inference drops some but not all vehicles.

This is not an accuracy error (the inference doesn't say "fits a Mégane RS" when it doesn't — that was the invalidated reframe). This is a **coverage failure**: the inference says nothing when it should say something. The product is invisible to an agent searching for that vehicle.

**This is the original thesis.** Specs being *visible* (in `metadata.tech_specs`) is not the same as products being *retrievable*. The fitment data is there in the merchant's text, Shopify's ML extracts it for some products but not others, and the ones it misses are unretrievable for the affected vehicles.

## Inferred-set audit (2 Aug 2026 — the check that decides everything)

The initial verification only audited the **stated** set (merchant side). All corrections removed spurious entries from `stated`, which raised recall. The **inferred** set got no equivalent audit. The entire finding lives there: 5 of 17 products score zero because the extractor found no vehicles in `tech_specs`. If the extractor failed to parse fitment from the Shopify side — the same way it failed on prose fragments, possessives, and slash-merged names on the merchant side — those zeros are instrument failures recorded as platform failures.

**Check:** printed the raw `tech_specs` strings for all 6 products with empty inferred sets. Read them with human eyes.

**Result: the finding is real.** All six `tech_specs` strings are genuinely devoid of vehicle fitment. They contain parametric specs (dimensions, materials, temperatures, pressures) with zero vehicle names. No make token (Honda, Acura, Subaru, Toyota, Scion) appears anywhere in any of the strings. The extractor correctly returned zero because there is zero vehicle content to find.

The six strings, in full:

1. **27WON Brake Pads (Civic Si / Integra):** "Pad Construction: Hybrid ceramic-metallic compound / μ₀ Range: 0.4–0.5 / Effective Operating Temperature: Up to 600°C / Color: Black, Orange, White, Gray / Item Condition: New / Manufacturer Type: Aftermarket" — no vehicle.
2. **PRL BBK Kit (Civic Si/Integra):** "Caliper Material: Forged 6061 T6 aluminum... / Piston Design: 44mm primary... / Bracket Material: CNC machined 4140... / Pad Compatibility: FMSI D1001, F50, Type R, STI / Rotor Fitment: OEM 312mm x 25mm / Weight per Side: Approx. 8.8 lbs... / Finish: Hard anodized caliper body" — no vehicle. ("Rotor Fitment" is a dimension, not a vehicle.)
3. **HEL Brake Lines (Civic Si FE1):** "Hose Size: AN3... / Internal Diameter: 3 mm... / Core Material: PTFE... / Minimum Temperature: -70°C... / Operating Pressure: 4206 psi... / Fluid Compatibility: Petrol..." — no vehicle. Generic hose spec sheet.
4. **Civic Hatchback Exhaust:** "Material: T304 stainless steel... / Exhaust Piping Diameter: 2.5 inch... / Resonator Types: Single, absorption... / Finish: Polished high gloss... / Warranty: Limited lifetime" — no vehicle. Title says "CIVIC HATCHBACK" but specs don't.
5. **BC Racing Coilovers (Impreza WRX):** "Damping Adjustment: 1-way, 30 levels / Ride Height Adjustable: Yes / Front Spring Rate: 6 kg/mm... / Rear Spring Rate: 4 kg/mm... / Suspension Design: Front true coilover, rear true coilover" — no vehicle. Title says "1992-2001 Impreza WRX (GC6/GC8)" but specs don't.
6. **Tomei Exhaust (BRZ/FRS/86):** "Material: Titanium / Main Pipe Diameter: 80.5 mm... / Wall Thickness: 1.0 mm / Weight: 6.9 kg... / Installation: Direct bolt-on, OEM bumper fitment" — no vehicle. ("fitment" here means installation method, not vehicle compatibility.)

**Conclusion:** Shopify's inference extracts parametric specs (dimensions, materials, temperatures) but drops vehicle fitment for these products. The vehicle information is in the merchant's title and description text; the ML pipeline chose to extract material properties and omitted the vehicle application entirely. This is not an extractor failure — it is a platform coverage failure.

## Pre-registration deviations (honest accounting)

**1. The n=17 number is not the pre-registered sample.** The five Subimods rows were excluded by the bucket cap (rich bucket filled by Two Step Performance), then pulled back in from `all` after the numbers were visible. This deviation moves the headline from 0.70 to 0.64 — downward, toward the finding. Whether or not it was motivated, it moves in the direction a motivated analyst would move it, and pre-registration exists so that question can't be raised. **Headline: n=12 / 0.70. Sensitivity: n=17 / 0.64.**

**2. Stratification didn't happen.** The design was thin-source (< 500 chars) versus rich-source (> 3000 chars), testing whether inference degrades on sparse input. Every scored product came from the rich bucket. No thin-bucket result is reported. This isn't a limitation to footnote — the designed experiment wasn't run. The thin/rich contrast is the actual scientific content, and it's missing.

**3. MAPerformance and Springrates dropped out** because their Catalog titles read "Multiple Fitments" where storefront titles name specific vehicles. This is filed as a matching bug, but it's also a coverage finding in its own right: Shopify's canonical title is *collapsing* fitment into a generic phrase. If an agent searches for "brake pads for Mitsubishi Evo X" and the catalog title says "Multiple Fitments," the title doesn't help retrieval. This deserves investigation, not just an infrastructure fix.

## Status: PROVISIONAL

The inferred-set audit passed — the zeros are real platform failures, not instrument failures. But:

- The extractor still needs hardening (both sides) before the number is publishable.
- The matching needs handle/SKU, not title tokens.
- The sample is 1-2 stores, not 4.
- Stratification didn't happen.

**Verdict: PROVISIONAL — coverage gap observed, inferred-set audit passed, but declaration pending hardened re-run with proper stratification across 4+ stores.** The direction is clear and unlikely to reverse. But 0.70 against a 0.80 threshold on a noisy instrument with n=12 from one store is not a comfortable enough margin to declare without the re-run.
