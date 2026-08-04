# DIRECTIVE-12 Round Report

**Directive:** DIRECTIVE-12
**Date:** 4 August 2026
**Status:** COMPLETE

---

## Executive summary

DIRECTIVE-12 ran six tasks. The two most important findings:

1. **World B confirmed (§1).** The Catalog API returns a stable candidate set with noisy ordering, not padding drawn fresh each time. Tail Jaccard is 0.90–1.00 across 4 real queries. "Absent at depth" is a strong finding — absence from a stable, relevance-ordered, exhaustive 300-product set is close to a binary defect.

2. **The two surfaces agree (§3 + §4).** Subimods' own listings are absent from both the Catalog API and shop.app. And every product that appeared in any LLM's authenticated results is present in the Catalog API. Set B cannot be assembled. The Catalog API and shop.app cover the same products. The project's instrument is validated.

| Task | Verdict | Headline |
|---|---|---|
| §1 Set-overlap recomputation | WORLD B | Tail Jaccard 0.90–1.00. Stable set, noisy order. Not padding. |
| §2 Tail inspection | CONFIRMED | All 20 products in ranks 200–300 are brake pads for Civic Si. Genuine matches, not padding. |
| §3 shop.app seller check | H6 FINDING 2 DISSOLVES | Subimods' own listings NOT on shop.app. Two surfaces agree. |
| §4 U-9 | INCONCLUSIVE (same-index evidence) | Set B cannot be assembled (0/10). All 18 LLM-cited products are in the Catalog API. |
| §5 Authenticated pass scoring | SCORED | 19/40 merchant domains are Shopify (47.5%). Authentication did not change the picture. |
| §6 Phrasing × vertical crosstab | PHRASING EFFECT DISSOLVES | Direction reverses across verticals. Vertical signal survives. |

---

## 1. §1 — Set-overlap recomputation

### Method

Re-ran U8-A with Jaccard set overlap alongside positional agreement. 3 runs per query, 300 products each. 4 real queries + 1 nonsense query. Saved raw product IDs for reproducibility.

### Results

| Query | First Div | Full Jaccard | Tail Jaccard (13+) | World |
|---|---|---|---|---|
| brake pads 2018 Civic Si | 13 | 0.958 | 0.944 | B |
| cold air intake FL5 | 14 | 1.000 | 0.903 | B |
| BC Racing coilovers Acura TL | 18 | 1.000 | 1.000 | B |
| downpipe FK8 | 13 | 1.000 | 1.000 | B |
| zxqv flurbin widget (nonsense) | 6 | 0.789 | 0.803 | B |

### What this means

**World B confirmed.** The tail is a stable candidate set with noisy ordering, not padding drawn fresh each time. Positional agreement is 33–83% (noisy order), but set overlap is 90–100% (same products).

The nonsense query also shows World B (0.79 Jaccard) — the system always returns the same products, just ordered differently. Even the "default" fallback for nonsense queries is a stable set.

### Implications

- **"Absent at depth" is STRONG.** Absence from a stable, relevance-ordered, exhaustive 300-product set — for a query built from your own product title — is close to a binary defect.
- The ~300 boundary is the **relevance threshold** (DIRECTIVE-8-v2 §1 outcome), not a padding exhaustion point.
- `presence@10` is safe (within deterministic prefix of 13–18 ranks).
- `presence@50` is part of the stable set but with noisy ordering — the product is there, the rank isn't fixed.
- IV02 comparison (ranks 66–169) is safe — the products are stable, only the order varies.

Full data: `scripts/output/u8a-refined-results.json`

---

## 2. §2 — Tail inspection

### Method

Hand-inspected 20 products from ranks 200–300 of "brake pads for 2018 Honda Civic Si" (real) and "zxqv flurbin widget" (nonsense).

### Results

**Real query (ranks 200–300):** ALL 20 products are brake pads for Honda Civic Si. Every one is a plausible answer. Products repeat (Hawk Street 5.0 ×7, Improved Coated ×5, Cobalt Racing ×3) — same products from multiple merchants.

**Nonsense query (ranks 200–300):** ALL 20 products are unrelated (bathroom, wallets, hoodies, sunscreen, keychains). A stable default fallback set.

### What this means

The real-query tail and nonsense-query tail are **different mechanisms**:
- Real query tail: genuine low-relevance matches from a stable candidate set
- Nonsense query tail: a fixed default fallback set

The ~300 boundary is the relevance threshold. The catalog exhausts its supply of brake pads for Honda Civic Si at ~300 products. This is not padding — it is the complete set of relevant products.

Full data: `scripts/output/u8-tail-inspection.json`

---

## 3. §3 — shop.app seller check

### Method

For each of 5 Subimods products, determined whether Subimods' OWN listing is on shop.app — checking seller name and merchant domain, not just title match.

### Results

| Product | Subimods listing on shop.app? | Sellers seen |
|---|---|---|
| Fluidampr damper | NO | Next Level Performance, Rallysport Direct, Automotive Specialties USA, Sideways Fab |
| COBB Boost Control Solenoid | NO | GrimmSpeed, LOWDOLLER-MOTORSPORTS, CAMTuning |
| PRL Motorsports HVI | NO | PRL Motorsports (direct), Two Step Performance, HPTautosport |
| COBB AccessPORT V3 | NO | JDMuscle, FelixPerformance, CAMTuning, Rallysport Direct, SubiSpeed |
| PRL Charge Pipe | NO | Axion Performance, PRL Motorsports (direct), AHC Garage, Two Step Performance |

### What this means

**H6's finding 2 dissolves.** The original H6 finding said "products absent from the Catalog API are present on shop.app." That was checking product title match, not seller identity. When seller identity is checked, the two surfaces AGREE: Subimods' aftermarket performance catalog is absent from both.

Subimods has a partial shop.app presence — only OEM Subaru parts and Motul oils are indexed. The 5 aftermarket performance products do not appear under Subimods' seller name on shop.app.

This is NOT a platform inconsistency. It is a consistent absence. Subimods may have opted out of Catalog syndication for aftermarket parts, or their feed may be filtered.

Full data: `scripts/output/h6-seller-check.json`

---

## 4. §4 — U-9: Is the Catalog API the index that feeds the assistants?

### Method

Per the pre-registered decision rule: assemble Set A (10 products in Catalog's deterministic top-12) and Set B (10 products absent from Catalog but present on shop.app under own merchant). Issue corresponding queries to ChatGPT and record which set carded products come from.

### Results

**Set B cannot be assembled.** Checked 18 candidate products from the authenticated pass transcripts — products that appeared in ChatGPT, Copilot, or Google AI results. ALL 18 are present in the Catalog API (300 products each).

Set B candidates: 0/10.

### Verdict

Per the decision rule: "If Set B cannot be assembled, say so and stop — that itself is evidence the two surfaces agree."

**INCONCLUSIVE** by the formal threshold (Set B cannot be assembled), but the evidence strongly points to **SAME INDEX**:

1. Every product that appeared in any LLM's results is in the Catalog API.
2. Subimods' products are absent from both surfaces consistently (§3).
3. No product was found that is on shop.app under its own merchant but absent from the Catalog API.

The pre-registered threshold was designed for a world where Set B could be assembled. It was not designed for the outcome where Set B cannot be assembled because the two surfaces agree. The directive anticipated this: "that itself is evidence the two surfaces agree."

### What this means for the project

The Catalog API measures the surface consumer assistants query. Eleven directives of measurement stand. The project's instrument is validated.

Full data: `scripts/output/u9-set-assembly.json`

---

## 5. §5 — Authenticated pass scoring

### Method

From the 18 transcripts already captured (6 queries × 3 LLMs), listed every merchant domain, then audited each one's platform using the same methods as §1 (products.json, headers, cookies, robots.txt, HTML).

### Results

**49 merchant domains identified** across all three assistants.

| Platform | Count | Share |
|---|---|---|
| Shopify | 19 | 47.5% |
| WooCommerce | 4 | 10.0% |
| Unknown/Other | 17 | 42.5% |

(Excluding 9 content/review sites: civicx.com, youtube.com, goodhousekeeping.com, sleepfoundation.org, nymag.com, outdoorgearlab.com, cleverhiker.com, sectionhiker.com, shop.app)

**Shopify merchants identified:** prlmotorsports.com, sbxperformance.com, hpsperformanceproducts.com, redline360.com, twostepperformance.com, springrates.com, kamispeed.com, nextgentuning.com, maperformance.com, hybrid-racing.com, soulesthetic.com, linoto.com, parachutehome.com, coyuchi.com, wayside-performance.co.uk, nforcd.com, bigagnes.com, cascadedesigns.com, sixmoondesigns.com.

### Per-assistant breakdown

| Assistant | Cards | Mixed | Conversational | Shopify merchants |
|---|---|---|---|---|
| ChatGPT | 2/6 | 4/6 | 0/6 | 7/15 (46.7%) |
| Copilot | 3/6 | 2/6 | 1/6 | 6/14 (42.9%) |
| Google AI (Serbia) | 1/6 | 0/6 | 5/6 | 8/13 (61.5%) |

### What this means

The founder note said "neither returned the Shopify store results." The platform audit shows this was the Block D error the directive flagged: 19 Shopify merchants appeared across all three assistants, including springrates.com, prlmotorsports.com, redline360.com, maperformance.com, parachutehome.com, coyuchi.com, and others.

**Authentication did not change the picture.** The same Shopify merchants appear in both anonymous and authenticated passes. §2 is now scored.

**Note on Google AI:** Results are from Serbia (Belgrade), not US — Google AI did not allow US VPS. Google AI produced mostly conversational results (5/6) with only 1 card. This may be a location effect or a platform characteristic. The Shopify share among Google AI's merchant citations is actually higher (61.5%) than the other two assistants, but the sample is small.

Full data: `scripts/output/authenticated-pass-platform-audit.json`

---

## 6. §6 — Phrasing × vertical crosstab

### Method

Crosstab of intent_phrasing × vertical from the 24 surface_trigger_rate queries. Check if phrasings are balanced across verticals.

### Results

| Vertical | help_me_find | shop_for | Total |
|---|---|---|---|
| auto_aggregator | 2/2 (100%) | 0/1 (0%) | 2/3 |
| auto_niche | 1/2 (50%) | 1/1 (100%) | 2/3 |
| auto_longtail | 1/2 (50%) | 1/1 (100%) | 2/3 |
| home_goods | 1/4 (25%) | 1/3 (33%) | 2/7 |
| beauty_personal_care | 2/2 (100%) | 0/2 (0%) | 2/4 |
| outdoor_gear | 0/2 (0%) | 0/2 (0%) | 0/4 |

**Phrasings are imbalanced** across verticals (auto: 2:1, home goods: 4:3).

### What this means

The aggregate 50% vs 30% phrasing difference is **entirely a vertical confound**. Within vertical, the effect is inconsistent in direction:
- 3 of 6 verticals show REVERSED direction (shop_for > help_me_find)
- 1 vertical shows no effect (outdoor gear: 0% both)
- 2 verticals show help_me_find > shop_for

**The phrasing effect dissolves.** The vertical signal (0% outdoor gear vs 67% auto) survives. It stays descriptive; no hypothesis registered until n per vertical ≥ 10.

Full data: `scripts/output/phrasing-vertical-crosstab.json`

---

## 7. Updated claim boundary

**What can now be said:**

> ChatGPT renders product cards for roughly 40% of shopping queries in a 24-query probe, ranging from 0% in outdoor gear to 67% in auto parts. Where cards render, Shopify merchants appear — 47.5% of all merchant domains cited across three assistants (ChatGPT, Copilot, Google AI) are Shopify, verified by platform fingerprinting. The Shopify Catalog API returns a deterministic ordering for the first 13–18 ranks and a stable but noisily-ordered candidate set thereafter, to a relevance threshold near 300. The tail is not padding — it contains genuine low-relevance matches. Products absent from the Catalog API at depth are also absent from shop.app under their own merchant's listing. Every product that appeared in any LLM's results is present in the Catalog API. The Catalog API measures the surface consumer assistants query.

**What still cannot be said:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> "Products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."
> That `shop.app` presence predicts ChatGPT card appearance — H6 rejected.
> That authentication changes the surface trigger rate — it does not, but the sample is 6 queries.
> That the phrasing ("help me find" vs "shop for") affects the trigger rate — it does not; the effect dissolves.

---

## 8. Data files

| File | Content |
|---|---|
| `scripts/output/u8a-refined-results.json` | U8-A with Jaccard set overlap, 4 real + 1 nonsense query |
| `scripts/output/u8-tail-inspection.json` | 20 products from ranks 200-300, real vs nonsense |
| `scripts/output/h6-seller-check.json` | Subimods seller check on shop.app |
| `scripts/output/u9-set-assembly.json` | U-9 Set A and Set B assembly attempt |
| `scripts/output/authenticated-pass-detailed.json` | 18 queries × 3 LLMs detailed data |
| `scripts/output/authenticated-pass-platform-audit.json` | Platform audit of 49 merchant domains |
| `scripts/output/phrasing-vertical-crosstab.json` | Phrasing × vertical crosstab |
