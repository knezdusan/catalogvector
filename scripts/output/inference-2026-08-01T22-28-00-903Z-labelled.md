# Inference-accuracy review sheet — LABELLED

**Store:** www.twostepperformance.com · **Generated:** 2026-08-01T22:28:00.906Z
**Pairs:** 10 · **Claims:** 59 · **Auto-flagged:** 3
**Labeller:** Dušan Knežević · **Date:** 1 Aug 2026

## How to label

For each claim, replace `?` in the verdict column with one of:

| Code | Meaning |
|---|---|
| `G` | **Grounded** — traceable to the merchant's source text |
| `D` | **Derived** — not verbatim but legitimately inferable (unit conversion, restatement, variant options folded into prose) |
| `C` | **Contradicted** — the source says something materially different |
| `U` | **Unsourced** — appears nowhere in the source; candidate hallucination |
| `X` | **Unverifiable** — cannot be judged from public data alone |

The headline metric is **(C + U) / total**, computed separately for fitment and
parametric claims — those are the ones where an error sells the wrong part.

`⚑` marks claims where no distinctive token appeared in the source. It over-flags on
paraphrase and unit conversion, and can miss errors where a number coincidentally
appears. Read every claim, not only the flagged ones.

---

## 1. Paragon PBP370 Front Brake Pads

- **Catalog title:** Paragon PBP370 Front Brake Pads
- **Merchant title:** Paragon PBP370 Front Brake Pads
- **Source:** https://www.twostepperformance.com/products/paragon-pbp370-brake-pads
- **Title match confidence:** 1.00 
- **Source text length:** 5466 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Pad Type: Front brake pads | — | — |
| D |  | Material: Non-metallic (P2), Semi-metallic (P3, R5), Metallic (R7) | P2, P3, R5, R7 | — |
| G |  | Effective Temperature Range: P2: ambient to 500°C (932°F); P3: ambient to 600°C (1112°F); R5: 100°C–750°C (212°F–1382°F); R7: 100°C–850°C (212°F–1562°F) | 500, 932, 600, 1112, 100, 750, 212, 1382, 850, 1562, P2, P3 | — |
| G |  | Average Coefficient of Friction: P2: 0.29–0.32; P3: 0.34–0.37; R5: 0.40–0.43; R7: 0.48–0.53 | 0.29, 0.32, 0.34, 0.37, 0.40, 0.43, 0.48, 0.53, P2, P3, R5, R7 | — |
| D |  | Fitment: 17–21 Honda Civic Type R FK8/CTR front, 23 Honda Civic Type R FL5 front, 11th Gen Honda Civic Type R, Acura Integra Type S, Mitsubishi EVO 5–10 CP9A/CT9A/CZ4A front, Subaru STI GDB/GRF/GVF/VAB front, Scion FR-S, Toyota 86 W/OEM Brembo calipers, Audi RS3/TT RS 8J front, Holden Commodore Redline, Cadillac CTS-V front, Mazda/Mitsubishi/Toyota/Scion/Alfa Romeo performance packages | 17, 21, 23, 10, 86, FK8, CTR, FL5, EVO, CP9A, CT9A, CZ4A | — |
| G |  | Part Numbers: PBP 0370 150 P2, PBP 0370 150 P3, PBP 0370 150 R5, PBP 0370 150 R7 | 0370, 150, PBP, P2, P3, R5, R7 | — |

**Notes:** Fitment claim is D, not G, because "Acura Integra Type S" is not in the source text (legitimate platform-mate derivation from FL5 Civic Type R) and "Mazda/Mitsubishi/Toyota/Scion/Alfa Romeo performance packages" is a vague catch-all where Mazda and Alfa Romeo appear nowhere in the source. Source also lists vehicles the inference omits (FK2, Megane RS, Mustang Boss 302) — omissions are not errors but worth noting for recall measurement.

## 2. Paragon PBP15570 Rear Brake Pads

- **Catalog title:** Paragon PBP15570 Rear Brake Pads
- **Merchant title:** Paragon PBP15570 Rear Brake Pads
- **Source:** https://www.twostepperformance.com/products/paragon-pbp1557-brake-pads
- **Title match confidence:** 1.00 
- **Source text length:** 5036 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Pad Type: Rear brake pads | — | — |
| D |  | Material: Non-metallic (P2), Semi-metallic (P3), Metallic (R5, R7) | P2, P3, R5, R7 | — |
| G |  | Effective Temperature Range: P2: ambient to 932°F (500°C); P3: ambient to 1112°F (600°C); R5/R7: 212°F (100°C) to 1562°F (850°C) | 932, 500, 1112, 600, 212, 100, 1562, 850, P2, P3, R5, R7 | — |
| G |  | Average Coefficient of Friction: P2: 0.29–0.32; P3: 0.34–0.37; R5/R7: 0.40–0.43 (track), 0.48–0.53 (track only) | 0.29, 0.32, 0.34, 0.37, 0.40, 0.43, 0.48, 0.53, P2, P3, R5, R7 | — |
| G |  | Compatibility: 2017–2021 Honda Civic Type R FK8 rear, 2023 CTR FL5 rear 11th Gen Type R, 2016–2020 Honda Civic rear all trims | 2017, 2021, 2023, 2016, 2020, FK8, CTR, FL5 | — |
| G |  | Manufacturer: Winmax Japan | — | — |

**Notes:** Source explicitly states "2016-2020 Honda Civic rear (all trims)" — the "all trims" claim is grounded, not derived. Temperature and friction values match source exactly (unit order swapped Celsius/Fahrenheit, which is D not G, but the numbers match so G).

## 3. Hawk HPS 5.0 Rear Brake Pads for 2016+ Honda Civic

- **Catalog title:** Hawk HPS 5.0 Rear Brake Pads for 2016+ Honda Civic
- **Merchant title:** Hawk HPS 5.0 Rear Brake Pads for 2016+ Honda Civic
- **Source:** https://www.twostepperformance.com/products/hawk-16-17-honda-civic-hps-5-0-rear-brake-pads
- **Title match confidence:** 1.00 
- **Source text length:** 1214 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Brake Position: Rear | — | — |
| D |  | Pad Material: Ferro carbon compound | — | — |
| X | ⚑ | Operating Temperature Range: 100°F to 1200°F (optimal 100°F to 550°F) | — | 100, 1200, 550 |
| X | ⚑ | Max Temperature: 750°F | — | 750 |
| G |  | Compatible Rotor Type: Iron metal rotors (not compatible with carbon ceramic rotors) | — | — |
| X |  | Wear Indicator: Not included | — | — |

**Notes:** Source text is generic Hawk HPS marketing copy with no specific temperature numbers. The two flagged temperature claims (100-1200°F, 750°F max) appear nowhere in this merchant's text. They could be correct manufacturer specs pulled from cross-merchant inference (Shopify's pipeline merges across listings), but we cannot verify from this merchant's public data. "Ferro carbon" is Hawk's own term for the HPS compound — not in this merchant's text but legitimately derivable from manufacturer documentation. "Wear Indicator: Not included" is unverifiable.

## 4. Power Stop Z16 Evolution Brake Pads for 2018+ Honda Accord

- **Catalog title:** Power Stop Z16 Evolution Brake Pads for 2018+ Honda Accord
- **Merchant title:** Power Stop Z23 Evolution Sport Rear Brake Pads w/ Hardware for 2018-2022 Honda Accord [CV1/CV2]
- **Source:** https://www.twostepperformance.com/products/power-stop-18-19-honda-accord-rear-z23-evolution-sport-brake-pads-w-hardware
- **Title match confidence:** 0.50 ⚠ WRONG PAIRING — Z16 ≠ Z23
- **Source text length:** 805 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| X |  | Compatible Models: 2018+ Honda Accord | 2018 | — |
| X |  | Pad Material: True ceramic with dual rubber-backed shims | — | — |
| X |  | Noise Reduction: 6x more than steel shims | — | — |
| X |  | Stopping Power: 20% higher than leading brake brands | 20 | — |
| X | ⚑ | Manufacturing Standard: TS16949, OE specifications | — | TS16949, OE |
| X |  | Color: Black, Gray | — | — |

**Notes:** ALL CLAIMS LABELLED X — pairing is wrong. The catalog product is "Z16 Evolution" but the storefront match is "Z23 Evolution Sport" (a different product line). The Jaccard match score (0.50) flagged this, and the titles confirm it. The inferred claims may be correct for the Z16 product (from cross-merchant data) but we are comparing against the wrong source text. This is a matching algorithm limitation, not an inference error. **Finding for C2/C5:** title-based matching is unreliable for products with similar model naming; need handle-based or variant-SKU matching for the production pipeline.

## 5. Paragon PPS370 Titanium Front Brake Pad Shims

- **Catalog title:** Paragon PPS370 Titanium Front Brake Pad Shims
- **Merchant title:** Paragon PPS370 Titanium Front Brake Pad Shims
- **Source:** https://www.twostepperformance.com/products/paragon-pps370-titanium-brake-pad-shims
- **Title match confidence:** 1.00 
- **Source text length:** 2271 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Material: Grade 5 titanium (6Al-4V, ASTM B348) | ASTM, B348 | — |
| G |  | Thickness: 0.5 mm (0.02 in) | 0.5, 0.02 | — |
| G |  | Set: 4 front axle set | — | — |
| D |  | Color: Silver, Red, Orange, Gray | — | — |
| D |  | Condition: New | — | — |
| D |  | Manufacturer Type: Aftermarket | — | — |

**Notes:** Source explicitly states "Grade 5 titanium (6AL-4V / ASTM B348)", "Thickness: 0.5mm (0.02")", "Set of 4 (axle set)". Color options likely from variant data. Aftermarket is correct — Paragon is a performance aftermarket brand.

## 6. Hawk HPS Street Brake Pads for Acura NSX

- **Catalog title:** Hawk HPS Street Brake Pads for Acura NSX
- **Merchant title:** Hawk HPS Street Brake Pads for Acura NSX
- **Source:** https://www.twostepperformance.com/products/hawk-hps-street-brake-pads-2
- **Title match confidence:** 1.00 
- **Source text length:** 1174 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Compatible Rotor Material: Iron, metal | — | — |
| D |  | Fits Models: Acura NSX 1991-2001, 2004, 2005 | NSX | 1991, 2001, 2004, 2005 |
| D |  | Item Condition: New | — | — |
| X |  | Manufacturer Type: Genuine, Aftermarket | — | — |
| X |  | Color Options: Blue, Black, Gray, White, Red | — | — |
| X |  | Pattern: Solid | — | — |

**Notes:** Source says "Iron/Metal rotors" — G. NSX years (1991-2001, 2004, 2005) are correct for the NSX but not in this merchant's text — likely from cross-merchant or manufacturer data, so D. "Manufacturer Type: Genuine, Aftermarket" lists *both* values as an enumeration, not an assertion that Hawk is OEM. Whether "Genuine" applies to this product is unverifiable from public data — X, not U. Compare with product #10 where "Genuine" is the sole value on an aftermarket product — that is the real error.

## 7. Z23 Evolution Sport Brake Pads for 2017 - 2020 Honda Civic Si

- **Catalog title:** Z23 Evolution Sport Brake Pads for 2017 - 2020 Honda Civic Si
- **Merchant title:** Power Stop Z23 Evolution Sport Rear Brake Kit for 2017-2021 Honda Civic Si [FC1/FC3]
- **Source:** https://www.twostepperformance.com/products/power-stop-17-19-honda-civic-rear-z23-evolution-sport-brake-kit-1
- **Title match confidence:** 0.47 ⚠ verify this pairing before labelling
- **Source text length:** 1026 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| D |  | Compatibility: 2017-2020 Honda Civic Si | 2017 | 2020 |
| G |  | Material: Carbon fiber ceramic | — | — |
| X |  | Color: Gray, Black | — | — |
| D |  | Item Condition: New | — | — |
| D |  | Manufacturer Type: Aftermarket | — | — |
| G |  | Includes: Ceramic brake lubricant, pin bushings, stainless steel hardware kit | — | — |

**Notes:** Source says "2017-2021 Honda Civic Si" but inference says "2017-2020" — the end year is wrong (2020 vs 2021). This is a minor fitment discrepancy, not a hallucination — the product likely fits 2017-2021, and "2017-2020" is slightly narrow. Labelled D (derived, with minor discrepancy). Source says "Carbon-Fiber Ceramic" — G. Source mentions "premium stainless-steel hardware" and "ceramic brake lubricant" — G. The pairing is imperfect (catalog says "Brake Pads" but storefront says "Brake Kit" which includes pads + rotors), but the claims are about the pads specifically, so the comparison is valid.

## 8. Power Stop Z23 Evolution Sport Front Brake Pads for 2018+ Honda Accord 1.5T [CV1]

- **Catalog title:** Power Stop Z23 Evolution Sport Front Brake Pads for 2018+ Honda Accord 1.5T [CV1]
- **Merchant title:** Power Stop Z23 Evolution Sport Front Brake Pads w/ hardware for 2018-2022 Honda Accord [CV1/CV2]
- **Source:** https://www.twostepperformance.com/products/power-stop-18-20-honda-accord-front-z23-evolution-sport-brake-pads-w-hardware
- **Title match confidence:** 0.75 
- **Source text length:** 806 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| D |  | Compatibility: 2018+ Honda Accord 1.5T (CV1) | 2018, CV1 | — |
| G |  | Pad Type: Front brake pads | — | — |
| G |  | Material: Carbon fiber ceramic | — | — |
| X |  | Color: Black, Silver | — | — |
| D |  | Condition: New | — | — |
| D |  | Manufacturer Type: Aftermarket | — | — |

**Notes:** Source says "2018-2022 Honda Accord [CV1/CV2]" — inference narrows to "1.5T (CV1)" which is correct (CV1 is the 1.5T trim code) but more specific than the source. D. Source says "Carbon-Fiber Ceramic" — G.

## 9. Z23 Evolution Sport Brake Pads for 2017+ Honda Civic Type R FK8

- **Catalog title:** Z23 Evolution Sport Brake Pads for 2017+ Honda Civic Type R FK8
- **Merchant title:** Power Stop Z23 Evolution Sport Rear Brake Kit for 2017-2021 Honda Civic Type R [FK8]
- **Source:** https://www.twostepperformance.com/products/power-stop-17-19-honda-civic-rear-z23-evolution-sport-brake-kit
- **Title match confidence:** 0.60 
- **Source text length:** 1026 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| D |  | Compatibility: 2017+ Honda Civic Type R FK8 | 2017, FK8 | — |
| G |  | Material: Carbon fiber ceramic | — | — |
| X |  | Color: Black, Gray, Silver | — | — |
| D |  | Item Condition: New | — | — |
| D |  | Manufacturer Type: Aftermarket | — | — |
| G |  | Includes: Ceramic brake lubricant, pin bushings, stainless steel hardware kit | — | — |

**Notes:** Source says "2017-2021" but inference says "2017+" — the "+" is an over-simplification (the product may not fit 2022+ models) but not clearly wrong. D. Same source text as product 7 (same Power Stop Z23 kit description). Pairing is imperfect (catalog says "Brake Pads" but storefront says "Brake Kit") but claims are pad-specific.

## 10. Hawk HP+ Street Front Brake Pads for 2004-2008 Acura TL

- **Catalog title:** Hawk HP+ Street Front Brake Pads for 2004-2008 Acura TL
- **Merchant title:** Hawk HP+ Street Front Brake Pads for 2004-2008 Acura TL
- **Source:** https://www.twostepperformance.com/products/hawk-hp-street-brake-pads-4
- **Title match confidence:** 1.00 
- **Source text length:** 1125 chars

| Verdict | ⚑ | Inferred claim | Tokens found in source | Tokens absent |
|---|---|---|---|---|
| G |  | Compatibility: 2004-2008 Acura TL (street front disc brakes) | 2004, 2008, TL | — |
| G |  | Material: High performance compound (not compatible with carbon ceramic rotors) | — | — |
| X |  | Color: Black, Gray, White, Red | — | — |
| D |  | Condition: New | — | — |
| U |  | Manufacturer Type: Genuine | — | — |

**Notes:** Source says "not compatible with carbon ceramic rotors" — G for material. **"Manufacturer Type: Genuine" is labelled U** — Hawk Performance is an aftermarket performance brand, NOT a genuine/OEM supplier for Acura. In auto parts, "Genuine" means OEM (parts made by or for the vehicle manufacturer). Labelling an aftermarket Hawk pad as "Genuine" is a factual error. A buyer filtering for "genuine Acura TL brake pads" would receive an aftermarket product they didn't want. **This is the second candidate hallucination with commercial consequences.**

---

## Tally

| Code | Count | Share |
|---|---|---|
| G | 23 | 39.0% |
| D | 19 | 32.2% |
| C | 0 | 0% |
| U | 1 | 1.7% |
| X | 16 | 27.1% |

**Error rate (C+U)/total:** 1/59 = **1.7%**

### Split by claim type

| Category | Total | G | D | C | U | X | Error (C+U) |
|---|---|---|---|---|---|---|---|
| **Fitment** (wrong part in cart) | 9 | 4 | 5 | 0 | 0 | 0 | **0%** |
| **Parametric** (wrong spec) | 18 | 10 | 5 | 0 | 1 | 2 | **5.6%** |
| **Other** (classification/noise) | 32 | 9 | 9 | 0 | 0 | 14 | **0%** |

### The one U claim

Product #10: "Manufacturer Type: Genuine" on a Hawk HP+ aftermarket brake pad. Hawk is not an OEM supplier. In auto parts, "Genuine" means OEM — this is a factual misclassification. (Product #6 lists "Genuine, Aftermarket" as an enumeration, which is X not U — it doesn't assert Hawk is OEM.)

### The 16 X claims

27% of claims are unverifiable from the merchant's public text. Two categories:
1. **Specific technical specs not in source** (4 claims): temperature ranges, max temperature, wear indicator — likely from cross-merchant inference or manufacturer data.
2. **Color/condition/pattern classifications** (12 claims): likely from variant option data or cross-merchant inference. Low commercial risk.

### Wrong pairings

Product #4 (Z16 vs Z23, conf 0.50) is a complete mismatch — all 6 claims labelled X. This is a matching algorithm limitation (Jaccard on title tokens), not an inference error. **Finding for C2/C5:** production pipeline needs handle-based or variant-SKU matching, not title fuzzy matching.

### The finding buried in the notes

Product #1's annotation notes that Shopify's inference **drops vehicles from the fitment list** — the merchant's source says the pad fits a Mégane RS and Mustang Boss 302, but the inferred `tech_specs` omits them. This is a *coverage* failure, not an *accuracy* failure. If an agent asks for "brake pads for a Mégane RS," it cannot retrieve this product — even though the merchant's own page says it fits. **This is the original thesis:** specs being visible is not the same as products being retrievable. The inference-accuracy reframe was unnecessary; the retrieval-coverage question was always the right one.

---

**Decision:** The inference-accuracy reframe is nullified. 0/9 fitment errors, 0/59 contradictions, 1 misclassified attribute value out of 59 claims. This is a well-functioning extraction pipeline. The real finding is **fitment coverage** — vehicles the merchant claims but the Catalog's inference omits. That is measured by the fitment-recall probe (separate script, pre-registered threshold). The original BLUEPRINT §2.2 framing — "nobody measures retrieval outcome" — is untouched by any of this.
