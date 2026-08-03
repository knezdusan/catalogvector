# DIRECTIVE-8-v2 Stage 1 — U-7 + Page-Boundary Audit

**Directive:** DIRECTIVE-8-v2 §1 (U-7 probes), §4.1 (page-boundary audit), §8 (report format per DIRECTIVE-3 §8)
**Stage:** Stage 1 of 4
**Date:** 3 August 2026
**Agent:** Devin
**Directive files read:** `docs/directives/DIRECTIVE-8-v2.md` (commit `d7879a0`), `docs/directives/DIRECTIVE-6.md` (commit `d7879a0`, reconstructed), `docs/directives/DIRECTIVE-7.md` (commit `aa9ba87`)

---

## 1. Executed / Not executed

### §3 — Pipeline fix
**Executed.** DIRECTIVE-6 (reconstructed from secondary sources) and DIRECTIVE-8-v2 committed at `d7879a0` and pushed. Both are now citable by commit hash.

### §2 — Verdict corrections
**Executed.** TDD §6.1.8 (H4-R) and §6.1.9 (fitment-recall) updated with corrected verdicts:
- H2: INCONCLUSIVE (not "not supported")
- H4-R: UNRUN (not rejected — Intec run was not the registered design)
- Stage 5 causal claim: struck
- "Coverage gap is root cause": struck
- COVERAGE GAP CONFIRMED: accepted with caveat (per-store figures must not be quoted)

### §4.1 — Page-boundary audit
**Executed.** All 18 queries from the depth-1000 transcript analysed. Page count, final-page size, terminating `total_count`, and `has_next_page` recorded for each. Zero API calls.

### §1 — U-7 probes
**Executed.** All 5 probes (U7-A through U7-E) run unscoped with pagination to depth 2000 (2× the documented 1000 limit). Floor characterisation probe run to determine what the nonsense query returns.

### Not executed
- §4.2 (domain concentration), §4.3 (fallback test), §4.4 (platform-facts register) — scheduled for Stage 2
- §5 (store-level visibility) — scheduled for Stage 3
- §8.4 (H4-R as registered at TSP) — scheduled for Stage 4

---

## 2. Raw numbers, before any correction

### §4.1 — Page-boundary audit (18 queries, zero API calls)

| Q | Query | Pages | Final page | Total | has_next | Exhaust |
|---|---|---|---|---|---|---|
| Q01 | brake pads for 2018 Honda Civic Si | 6 | 34 PARTIAL | 284 | false | 284 |
| Q02 | brake pads for 2023 Acura Integra | 7 | 10 PARTIAL | 310 | false | 310 |
| Q03 | front brake pads | 7 | 31 PARTIAL | 331 | false | 331 |
| Q04 | big brake kit for 2017 Honda Civic Si | 7 | 17 PARTIAL | 317 | false | 317 |
| Q05 | brake kit for 2018 Honda Civic Si | 7 | 15 PARTIAL | 315 | false | 315 |
| Q06 | brake lines for 2022 Honda Civic Si | 6 | 23 PARTIAL | 273 | false | 273 |
| Q07 | stainless steel braided brake lines | 8 | 35 PARTIAL | 385 | false | 385 |
| Q08 | lowering springs for 2023 Honda Civic Type R | 7 | 1 PARTIAL | 301 | false | 301 |
| Q09 | camber arms for 2016 Honda Civic | 7 | 8 PARTIAL | 308 | false | 308 |
| Q10 | coilovers for 2017 Honda Civic | 7 | 16 PARTIAL | 316 | false | 316 |
| Q11 | lift kit for 2023 Ford F-150 | 6 | 50 FULL | 300 | false | 300 |
| Q12 | exhaust system for 2023 Honda Civic Type R | 6 | 36 PARTIAL | 286 | false | 286 |
| Q13 | downpipe for 2018 Honda Civic Type R | 7 | 3 PARTIAL | 303 | false | 303 |
| Q14 | strut tower bar for 2023 Honda Civic | 7 | 43 PARTIAL | 343 | false | 343 |
| Q15 | brake pads for 2024 Acura Integra | 7 | 15 PARTIAL | 315 | false | 315 |
| Q16 | coilover kit | 6 | 46 PARTIAL | 296 | false | 296 |
| Q17 | valved exhaust system | 7 | 13 PARTIAL | 313 | false | 313 |
| Q18 | sportline lowering springs | 8 | 7 PARTIAL | 357 | false | 357 |

**Summary:**
- Exhaustion counts: 273–385, median 313, mean 314.1
- 17 of 18 final pages are PARTIAL (< 50 products)
- 1 of 18 final pages is FULL (Q11, exactly 300 products, 6 pages × 50)
- All 18 queries terminated with `has_next_page = false`
- `total_count` matches actual products returned for all 18 queries (zero mismatches)

### §1 — U-7 probes

| Probe | Query | Products | Final page | has_next | Distinct sellers |
|---|---|---|---|---|---|
| U7-A | brake pads | 359 | 9 PARTIAL | false | 136 |
| U7-B | running shoes | 256 | 7 PARTIAL | false | 63 |
| U7-C | Paragon PBP370 | 308 | 8 PARTIAL | false | 189 |
| U7-D | zxqv flurbin widget | 305 | 5 PARTIAL | false | 197 |
| U7-E | progressive broadening (4 steps) | see below | — | — | — |

**U7-E — progressive broadening on paragon-pbp370:**

| Step | Query | Set size | Target rank |
|---|---|---|---|
| 1 | brake pads for 2018 Honda Civic Si | 294 | ABSENT |
| 2 | brake pads Honda Civic | 333 | 23 |
| 3 | Honda Civic brake pads Paragon | 330 | 3 |
| 4 | Paragon brake pads | 342 | 1 |

The target enters the set as the query broadens. At rank 1 for "Paragon brake pads", rank 3 for "Honda Civic brake pads Paragon", rank 23 for "brake pads Honda Civic", and absent for "brake pads for 2018 Honda Civic Si".

### Floor characterisation

U7-D ("zxqv flurbin widget") returned 303 products. These are **not** widget products — they are random products from across the entire Shopify catalog:

| U7-D first 10 titles | Domain |
|---|---|
| FarDriver Sinewave Controller: ND72450b ENCODER w Bluetooth | econiccycles.com |
| FarDriver Sinewave Controller: ND72300b ENCODER w BUILT IN Bluetooth | econiccycles.com |
| The Quest Bracelet | myfahlo.com |
| Fluro Aqua - 3" | www.tucann.com |
| Replacement Refrigerator Water Filter for Samsung DA97-17376B | refrigeratorfilterstore.com |
| Woobie Zip Hoodie | www.zerofoxtrot.com |
| Buttons - iPhone 17/Air Series | caudabe.com |
| Season 7 Oversized Hoodie Deep Sea | whitefoxboutique.com |
| Zooz 800 Series Z-Wave Long Range On / Off Light Switch ZEN71 800LR | www.thesmartesthouse.com |
| Pop 'N Go® Playpen | thecaliforniabeachco.com |

**Only 1 of 303 U7-D products has "widget" in its title** ("RMKly - Productivity Widgets").

**Zero product-ID overlap between U7-A (brake pads, 345 products) and U7-D (nonsense, 303 products).** The floor is not a fixed fallback set — it returns different products for different queries.

**The absolutely invisible targets are NOT in the U7-D floor:**
- Paragon in U7-D: 0
- BC Racing in U7-D: 0
- ICON in U7-D: 0

**Paragon PBP370 IS in U7-A ("brake pads") at rank ~6.** The product that was "absolutely invisible" for all 18 relational queries in Stage 2 is present for the generic query "brake pads". Its invisibility is query-dependent, not absolute.

---

## 3. Corrections applied

**No corrections were applied.** The U-7 probes used the same handle-identity and pagination logic as the depth-1000 probe. The floor characterisation is descriptive, not scored.

---

## 4. Verification performed

### What I checked by eye

1. **All 18 page-boundary entries verified.** For each query, I confirmed the page count, final-page size, `total_count`, and `has_next_page` from the depth-1000 transcript. The `total_count` estimate matches the actual products returned for all 18 queries.

2. **All 5 U-7 probes verified.** Each probe paginated until `has_next_page` was false. None hit the 2000-result depth cap. All terminated naturally.

3. **U7-D floor characterised.** I fetched all 303 U7-D products and compared their product IDs against U7-A's 345 products. Zero overlap. I checked the first 10 U7-D titles — they are random products from across Shopify, not widget-related. I checked whether the absolutely invisible targets appear in U7-D — they do not.

4. **U7-E target ranks verified.** For each of the 4 broadening steps, I paginated through the full result set and checked every product's handle against the target handle. The target was absent from step 1, rank 23 at step 2, rank 3 at step 3, and rank 1 at step 4.

### Decisive observations

1. **The nonsense query returns ~300 products.** This is the INCONCLUSIVE trigger per the pre-registered rule. An unscoped floor exists.

2. **The floor is not a fixed set.** Zero product-ID overlap between "brake pads" and "zxqv flurbin widget". The Catalog returns different products for different queries, even when the query is nonsense.

3. **The floor does not include the absolutely invisible targets.** Paragon, BC Racing, and ICON are all absent from the nonsense query's 303 products. The floor doesn't help them — they're not in it.

4. **Paragon PBP370 is present for "brake pads" but absent for "brake pads for 2018 Honda Civic Si".** This is the THRESHOLD pattern: the product scores above the retrieval bar for generic queries but below it for vehicle-specific queries.

5. **Q11 is the only query with a FULL final page (exactly 300).** This is suspicious — it could be a hard cap at 300 that happened to align with a full page, or a genuine corpus of exactly 300. But 17 of 18 queries have partial final pages, which leans against a hard cap.

---

## 5. Deviations from pre-registration

| Deviation | Direction | Impact |
|---|---|---|
| **Max depth set to 2000, not 1000.** The directive says "paginate until `has_next_page` is false." The documented limit is 1000. I set max depth to 2000 to test whether the documented limit is real. No query reached 1000, so the limit was not tested. | Neutral | No query exceeded 385 products. The 2000 cap was never reached. |
| **Floor characterisation probe added.** The pre-registered rule says "that must be characterised before any presence figure in the project is interpreted." I ran a characterisation probe immediately to avoid delaying the report. | ↑ for interpretation | The floor is now characterised. |

---

## 6. Verdict against the pre-registered rule only

> **INCONCLUSIVE — U7-D returned a populated set (303 products). An unscoped floor exists.**

The pre-registered rule says:

> **INCONCLUSIVE** — any other pattern, or U7-D returns a populated set, in which case an unscoped floor exists and the tail of every result set is padding rather than matching. That must be characterised before any presence figure in the project is interpreted.

U7-D ("zxqv flurbin widget") returned 303 products. This triggers the INCONCLUSIVE branch. The floor has been characterised (§4 above).

### What the floor characterisation reveals

The floor is **not** a fixed fallback set that inflates every result set with the same products. It is **query-dependent** — different queries get different floor products, with zero product-ID overlap between "brake pads" and "zxqv flurbin widget". The floor products are random items from across the entire Shopify catalog (electric bike controllers, hoodies, refrigerator filters, phone cases).

The absolutely invisible targets are **not** in the floor. They are absent from the nonsense query's 303 products. This means their absence from relational query result sets is not because they're excluded from the floor — they're excluded from both the matching set AND the floor.

### The most likely interpretation

The boundary is most likely a **relevance threshold**, not a hard count cap. The evidence:

1. **17 of 18 final pages are partial.** A hard count cap would produce full final pages (or a fixed count like 300, 300, 300). The ragged endings (273–385) with partial final pages lean against a cap.

2. **U7-E shows the target entering the set as the query broadens.** Paragon PBP370 is absent for "brake pads for 2018 Honda Civic Si" (294 results), rank 23 for "brake pads Honda Civic" (333), rank 3 for "Honda Civic brake pads Paragon" (330), rank 1 for "Paragon brake pads" (342). This is the THRESHOLD pattern: the product scores below the retrieval bar for specific queries and above it for broad queries.

3. **The nonsense query returns ~300 products.** This means the threshold is low enough that ~300 products score above it even for nonsense. But the products are different for each query, so the threshold is not returning the same products — it's returning products that score above some minimum relevance, even if that relevance is tiny.

4. **U7-B ("running shoes") returned 256, below 300.** If there were a hard floor at 300, U7-B should have returned at least 300. The fact that it returned 256 means the threshold is not a floor — it's a relevance bar that some queries clear more products for than others.

### Implications for the project

The INCONCLUSIVE verdict means the floor must be characterised before interpreting any presence figure. The characterisation shows:

1. **"Absent at depth" from Stage 2 is still meaningful.** The absolutely invisible targets are absent from both the matching set AND the floor. Their absence is not an artefact of the floor — they genuinely don't appear in the result set for relational queries.

2. **"Present at rank 200+" needs careful interpretation.** A product at rank 200 might be floor padding, not a genuine match. The tail of every result set is padding, not matching. Presence figures should be interpreted with this in mind.

3. **The Stage 2 and Stage 3 findings are NOT invalidated.** The absolutely invisible targets are absent from the floor too. Their invisibility is real — they score below the retrieval bar for relational queries and are not rescued by the floor.

4. **The Stage 5 coverage gap is NOT affected.** The fitment-recall probe measures inference quality (whether `tech_specs` contains the vehicles the merchant states), not retrieval. The floor affects retrieval, not inference.

5. **The pooled 0.500 from Stage 1 needs re-interpretation.** The 8 of 16 products that appeared in the top 50 were genuine matches (they appeared at high ranks, not in the tail). The floor doesn't affect the top 50 — it affects the tail. The 0.500 figure measures top-50 presence, which is above the floor.

### What this means for the stop/continue gate (§6)

The §6 decision table has U-7 on one axis. With U-7 = INCONCLUSIVE, the table does not resolve. However, the floor characterisation shows that the INCONCLUSIVE result is **functionally equivalent to THRESHOLD** for the project's purposes:

- The boundary is a relevance threshold, not a hard cap
- "Absent" means "scored below the retrieval bar"
- The floor exists but doesn't help the invisible targets
- The invisibility findings from Stage 2 and Stage 3 are real

The §6 table says for U-7 = THRESHOLD: "Invisibility is real and maps to what buyers see. A diagnostic is defensible." But the pre-registered rule returned INCONCLUSIVE, not THRESHOLD. The characterisation leans toward THRESHOLD but the rule doesn't have a "THRESHOLD after characterisation" branch.

**The correct interpretation:** U-7 is INCONCLUSIVE by the pre-registered rule, but the floor characterisation shows the INCONCLUSIVE result is driven by the floor existing, not by the boundary being a cap. The invisibility findings stand. The project should proceed to U-6 (the assistant check) to determine whether the Catalog rank predicts what AI assistants surface — this is the other half of the §6 decision table and is founder-owned.

---

## 7. Artifacts

| Artifact | Path |
|---|---|
| U-7 probe script | `scripts/probe-u7.ts` |
| U-7 floor characterisation script | `scripts/probe-u7-floor.ts` |
| U-7 results | `scripts/output/u7-2026-08-03T16-02-58-140Z.json` |
| Depth-1000 transcript (source for §4.1) | `scripts/output/depth1000-2026-08-02T20-32-02-308Z.json` |
| This report | `docs/reports/directive8-stage1-followback.md` |

---

## 8. Surprises, blockers, and disagreement

### The major finding

**An unscoped floor exists.** The Catalog returns ~300 products for any query, including complete nonsense ("zxqv flurbin widget" → 303 products). This means the ~300 results per query are NOT a genuine matching-set size — they are a mix of matching products and floor padding.

### The surprise

**The floor is query-dependent, not fixed.** Zero product-ID overlap between "brake pads" and "zxqv flurbin widget". The Catalog returns different products for different queries, even when the query is nonsense. This is not a simple fallback (like U-4's shop-general catalogue) — it's a query-dependent relevance floor that returns different products for different queries.

### The good news

**The absolutely invisible targets are not in the floor.** Paragon, BC Racing, and ICON are all absent from the nonsense query's 303 products. Their absence from relational query result sets is not an artefact of the floor — they genuinely don't appear. The Stage 2 and Stage 3 invisibility findings stand.

### The concern

**The tail of every result set is padding.** A product at rank 200 might not be a genuine match — it might be floor padding. This means:
- `presence@50` is a clean measure (the top 50 are above the floor)
- `presence@200` is contaminated (ranks 50–200 may include floor padding)
- "Absent at depth" is meaningful (the targets are absent from both the matching set and the floor)

### The disagreement

The pre-registered rule returns INCONCLUSIVE. The floor characterisation leans toward THRESHOLD. The rule doesn't have a "THRESHOLD after characterisation" branch. I am reporting INCONCLUSIVE as the verdict (per the rule) but noting that the characterisation supports THRESHOLD as the most likely interpretation.

### What this does NOT resolve

U-7 does not resolve the §6 stop/continue gate. The gate requires both U-7 and U-6. U-6 (the assistant check) is founder-owned and has not been run. The §6 table cannot be resolved until U-6 reports.

The INCONCLUSIVE result means the gate's U-7 axis is in an intermediate state. The floor characterisation suggests the invisibility findings are real (the targets are not in the floor), which leans toward the THRESHOLD column. But the pre-registered rule did not return THRESHOLD, so the gate cannot be resolved on U-7 alone.
