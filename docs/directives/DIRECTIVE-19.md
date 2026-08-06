# DIRECTIVE-19 — Instrument Preparation, Register Correction, and Study Pre-Registration

**Issued:** 6 August 2026
**From:** the extended-study advisory session
**To:** Devin (execution) and the founder (founder-owned items, marked)
**Supersedes:** nothing. Extends DIRECTIVE-18.
**Governing inputs:** `SESSION-HANDOFF-EXTENDED-STUDY.md`, `RULINGS-ON-BLOCKERS.md`, `BLUEPRINT.md` v1.0.0, `TDD.md`, `docs/reports/platform-facts-register.md`, `WHITEPAPER-OUTLINE.md`, `OUTREACH-EMAILS.md`

**Delivery discipline.** This file is committed to `docs/directives/DIRECTIVE-19.md` and pushed before any work begins. The round report's §1 opens by listing every directive file read with its commit hash. A directive that cannot be cited by hash was not received.

**No store work in this directive.** Stage 1 is instrument preparation and pre-registration only. The study itself is DIRECTIVE-20 and its design is frozen here, before any of its data exists.

---

## §1 — Outstanding branch inventory (required opener, handoff §7.4)

| Branch | Origin | Disposition |
|---|---|---|
| Monitoring vs one-shot audit | DIRECTIVE-18 §4 | **STAGED** — §3.4 below (same-day noise floor), longitudinal arm carried by the study's own duration |
| Enumeration as a licensed data capability | DIRECTIVE-15 | **STAGED** — §5.2 below, one email to 2–3 monitoring platforms |
| Competitive displacement | DIRECTIVE-6 | **FORMALLY CLOSED — unmeasurable on the current instrument.** See §2.1 |
| Surface-render rate by query class | DIRECTIVE-11 | **STAGED** — §4.4 below, folded into the study at ≥10 queries per vertical |
| A different commercial vertical | DIRECTIVE-4 (C-4) | **STAGED** — §4 below, and informed by §5.1 outreach per `RULINGS` §6 |
| Adjacent surfaces (Shop, Google & YouTube, Meta) | DIRECTIVE-15 | **CLOSED FOR SCOPE.** Reason: multiplies scope across four surfaces while the primary surface's measurement is still being made defensible. Recorded as closed-not-invalidated; a later session reopens without re-deriving the case |

Inventory changed this cycle. Duty B has not stopped.

---

## §2 — Two corrections to `RULINGS-ON-BLOCKERS.md`

Both are the advisor correcting the advisor. Neither changes a Devin task.

### 2.1 Competitive displacement is not "already staged"

`RULINGS` §5 disposes of it as *"already staged. It is `attribution_loss_rate`."* That is wrong. Competitive displacement, as defined since DIRECTIVE-6, is a **ranking** metric: who occupies the slot when your product does not appear. `attribution_loss_rate` is a **membership** metric: your product is in the Catalog under another seller's name. They answer different questions.

Rank-based measurement was retired in DIRECTIVE-17 (tail positional agreement 0%, Jaccard 0.48). Competitive displacement as defined therefore has no trustworthy instrument and **is formally closed as unmeasurable, not staged**. Recording it as staged would leave it permanently open and never run — which is the exact bookkeeping failure §7 exists to prevent.

### 2.2 The registered "vary materially" threshold is internally inconsistent

`RULINGS` §4 proposes: *highest and lowest vertical means differ by ≥10 percentage points, with non-overlapping intervals at the vertical level.* These two conditions are not equivalent and the second is stricter.

At the ruled design — 4–5 stores per vertical, n≈50 per store, absence ≈17%, observed between-store SD ≈3.5pp — the standard error of a vertical mean is approximately:

- within-store component: SE ≈ 5.3pp per store, ÷√5 ≈ 2.4pp
- between-store component: 3.5 ÷ √5 ≈ 1.6pp
- combined ≈ 2.9pp, so a 95% interval of roughly **±5.7pp**

Two vertical intervals become non-overlapping at a difference above **~11.4pp**. So "≥10pp" can be satisfied while "non-overlapping" fails, and the rule would fire ambiguously — the same class of defect as the H9 threshold that a null classifier could clear.

**Registered instead (§4.3).** Non-overlapping 95% intervals at the vertical level is the criterion. The ≥10pp point difference is retained as a readability check only and carries no decision weight.

**Minimum detectable effect, stated in advance:** this design detects a between-vertical difference of roughly 11–12pp and cannot detect 5pp. Note that the observed *within*-vertical spread in auto parts alone is 7pp (13.0–20.0%). **A between-vertical difference smaller than the within-vertical spread is not detectable and must not be claimed.** If the study lands there, the honest result is that store-to-store variation exceeds vertical variation — which is handoff §6's "findings hold" branch and is a legitimate result, not a failure.

---

## §3 — Stage 1: Devin. No store work, no study data.

### 3.1 Register corrections — first, before anything else

Per `RULINGS` §1. The register is the artefact intended to be checkable by strangers and it currently contradicts itself.

1. **Entry 7.** Rewrite the Observed-behaviour and Impact paragraphs to the settled CAP position: `total_count` is a response budget (361–387 across seven semantically unrelated queries), the ~300 boundary is a budget cap, not a relevance boundary. **Mark the prior reading as superseded, with the date and the directive that superseded it — do not silently edit.** A register that shows its own corrections is more credible than one that appears to have always been right.
2. **Entry 9.** The current entry publishes "deterministic prefix ~12 ranks," a figure produced by the **corrupted U8-A run**. Replace with the DIRECTIVE-16 measurement: head 0–50 at 100% positional agreement, tail 0% positional agreement, set Jaccard ≈0.48. State the correction and its cause (the comma-joined `--set` cursor bug). Record that World B was **re-validated**, not withdrawn.
3. **Entry 10.** Restate: no per-store enumeration endpoint exists; naive search carries a measured 54% false-negative rate; partition-based enumeration reaches 88–98% recall depending on catalogue size. **The barrier is effort and calibration, not impossibility.**
4. **Standing instruction, added to the register header.** Every entry carries the directive that established it and the directive that last revised it. The entry 7 / entry 13 contradiction existed because nothing forced a re-read when a later finding superseded an earlier one.

Also reconcile in the same pass: `TDD.md` §6.1.14 reports Subimods enumerated handles as 13,257; DIRECTIVE-15 reported 13,358. One is wrong. Report which and why.

### 3.2 The attribution matcher — build and validate before any use (I-6)

`attribution_loss_rate` currently has no instrument. Register entry 1 establishes there is no shared product identity in the Catalog, so "the same product under another seller" must be reconstructed.

**Design constraint, not negotiable:** key on **brand + manufacturer part number** where a part number is extractable from title, SKU, or body text. Where no part number is extractable, **reject the product from the denominator — do not fall back to title similarity.** Title fallback is the layer that killed H6 and confounded H4.

**Validation before any result is quoted:**
- Commit a hand-confirmed ground-truth set: ≥40 pairs known to be the same part across different sellers, and ≥40 near-miss pairs (adjacent part numbers, same brand different SKU, superseded numbers).
- Report **coverage** (share of products with an extractable part number) and **false-positive rate** separately. Do not combine them into an accuracy figure.
- Target: FPR ≤2%. Coverage is not a target — it is a measurement, and it is itself a finding about the vertical. A 40% coverage / 2% FPR matcher is fit for use. A 95% coverage matcher with an unmeasured error rate is not.

`attribution_loss_rate` also requires an absence determination on the merchant's own seller, so it inherits the recall problem and **is reported conditioned on that store's measured recall**, same as absence.

### 3.3 Partition construction at large catalogue size — the feasibility question the study depends on

Handoff §3 states the choice plainly: either sitemap-derived partitioning fixes MAP-class recall (56.6% at 102,176 products) or the paper says the method degrades on large catalogues. Before committing to either, resolve a constraint neither document has costed.

The partition needs `vendor` and `product_type` per product. `/products.json` supplies these free below 25,000 products. Above the cap, the remainder requires per-product page fetches at C7's ≤1 req/s/domain — **102,176 products is roughly 28 hours of fetching for one store.** With one large store per vertical, that is over a week of continuous fetching and it, not the Catalog API, is the study's binding time constraint.

**The observation that may dissolve it:** vendor and product type are low-cardinality relative to catalogue size. Subimods yielded 265 vendors and 428 product types from 18,066 products. A partition built from a random sample of products very likely captures nearly all cells.

**Task.** MAP is the ideal test bed because 25,000 products of free metadata are available to validate a sample against.

1. From MAP's 25,000-product `/products.json` metadata, build the reference partition (all vendor × product-type cells present).
2. Draw random subsamples at 500 / 1,000 / 2,000 / 5,000 / 10,000 products (seeds recorded) and rebuild the partition from each.
3. Plot the **rarefaction curve**: distinct cells recovered vs products sampled. Report the sample size at which fewer than 1 new cell appears per 500 additional products.
4. Report, per subsample size, the share of the full 25,000-product population that falls into a recovered cell.
5. **The acceptance criterion is not cell coverage.** Cell coverage is necessary and not sufficient. What decides the design is whether the *missing* cells correlate with absence — if rare vendors are likelier to be absent from the Catalog, a subsample partition drops exactly the products that would have raised the absence rate, and the estimate is biased downward rather than merely noisy. This is §3.5's selection error one level down, and it is directly checkable at **Subimods**, where the full partition (265 vendors × 428 types over 18,066 products) and any subsample partition both exist alongside measured per-product presence.

   **Task:** at Subimods, build subsample partitions at the same sizes, and for each report the absence rate among products in *recovered* cells against products in *dropped* cells. Report the difference with an interval.
6. State the resulting cost: products to fetch, hours at ≤1 req/s, per large store.

**Acceptance:** a subsample size qualifies when it recovers cells covering ≥95% of the population **and** the absence rate in dropped cells is not materially higher than in recovered cells — no significant difference at the n available, with the difference and its interval reported either way. If cell coverage clears but the absence difference does not, subsampling is rejected and the large band is reconsidered in DIRECTIVE-20 on honest cost. Report both numbers regardless of which way they fall.

Do not run the corrected MAP enumeration in this directive. This stage sizes the work; it does not do it.

### 3.4 Same-day noise floor — two stores

Required before any longitudinal or monitoring claim, and required regardless because a study running 4–6 weeks cannot separate drift from noise without it.

- Two stores, one small (TSP) and one medium (Subimods).
- Full partition enumeration run **three times on the same day**, same partition, same seeds, through the invariant library.
- Report: handle-set Jaccard between runs, absolute handle counts, and the implied per-run variance in absence rate.
- Prior expectation from DIRECTIVE-12: ~1.88% run-to-run variance in recovered handles. Confirm or correct it.

**Registered rule:** in the study's re-measurement arm (first stores re-run in the final week), only movement **exceeding the measured same-day floor** counts as change. Movement below it is reported as noise and no longitudinal claim is made.

### 3.5 The store-selection rule — pre-registered and committed before any store is chosen

Committed to `docs/directives/STORE-SELECTION-RULE.md`, with the seed, before a single candidate is inspected.

**Hard constraint the rulings do not state, and it is the study's largest selection risk.** `TDD.md` C1 documents that the store frontier has historically been seeded partly from the Global Catalog itself, and notes this "systematically excludes stores that are absent from it." For a study whose headline quantity **is** Catalog absence, a Catalog-seeded frame biases the result downward by construction and reproduces failure mode #4 (selection dressed as measurement) at study scale.

**Therefore: the sampling frame must be independent of the Catalog API.** Permitted sources — public Shopify-detection directories, vertical trade directories cross-checked for Shopify by platform fingerprinting (`/products.json`, `powered-by` header, `_shopify_y` cookie), and vertical-specific merchant listings. **Catalog `search_catalog` harvesting is prohibited as a sampling source** for this study. If a store is unreachable or its storefront JSON is disabled, record the exclusion with its reason; exclusions are reported as a table, not silently dropped.

**Size bands, per `RULINGS` §2:** small <5,000 products · medium 5,000–25,000 · large >25,000. Aim for coverage of all three in every vertical. Where a vertical has no large stores, **record that as a property of the vertical** rather than filling the cell.

**Frame construction order:** build the full qualified frame per vertical first, then sample within band by recorded seed. Do not select stores and then describe the rule.

**The replacement frame carries its own skew, and it is measured rather than declared.** Tech-detection datasets and trade directories over-represent larger and better-linked stores. Recording that in limitations is necessary but weak, because the study will hold the data needed to test it. Pre-registered analysis: regress per-store absence on catalogue size and on the store's presence in more than one frame source. If absence correlates with size and the frame over-represents large stores, the direction and rough magnitude of the bias in the vertical means are known and reportable, not merely conceded. Costs nothing beyond data the study already produces.

---

## §4 — The study, pre-registered now (executed under DIRECTIVE-20)

Frozen before its data exists.

### 4.1 H10 — the registered hypothesis

> **Catalogue absence from the Shopify Global Catalog varies materially by vertical.**

Null: absence rates are drawn from a common distribution across verticals, and store-to-store variation exceeds vertical variation.

### 4.2 Design

- **3–4 verticals.** Auto parts is the baseline and the sandbox. The others are chosen after §5.1 outreach reports, per `RULINGS` §6 — buyer input decides C-4, not measurement convenience.
- **16–20 stores**, 4–5 per vertical, size bands covered per §3.5.
- **n≈50 products per store**, drawn at random from the sitemap, seed recorded.
- **Union presence:** enumeration ∪ per-product reference standard. Presence established by either detector; absence requires both to miss. Every absence figure is an **upper bound** and is stated as one.
- **Bounded range per store**, per `RULINGS` §2: the share absent at recall = 1.0 and at the store's measured recall. Where the bounds are far apart, the store's measurement is weak and the paper says so inline.
- Every store runs through the invariant library. No probe issues raw CLI calls. Every number carries source file, commit hash, and which invariants passed.

**One design question to resolve in the DIRECTIVE-19 report, not now.** At n=50, recall and absence are estimated from the same 50 products, and both are noisy; the resulting bounded range may be dominated by recall uncertainty. The alternative is **two calibration stores per vertical at n=100** establishing the recall-vs-catalogue-size curve, with the remaining stores at n=50 scored against that curve. That buys store count and a defensible recall model for less total work, at the cost of introducing a modelled recall assumption. Devin: report the projected interval width under both allocations, using the noise floor from §3.4. The choice is made in DIRECTIVE-20 on that arithmetic.

### 4.3 Decision rule — registered, not adjustable

- **VARIES:** the highest and lowest vertical mean absence rates have **non-overlapping 95% intervals** at the vertical level.
- **HOLDS:** intervals overlap, and the between-vertical spread does not exceed the within-vertical (store-to-store) spread.
- **INCONCLUSIVE:** intervals overlap but the between-vertical spread exceeds the within-vertical spread. This is reported as inconclusive at this n, with the n required to resolve it stated.

**Mapping to the handoff §6 claim gate.** §4.3's three statistical outcomes and §6's claim branches are one taxonomy, not two, and they are mapped here so they cannot drift apart in week five:

| §4.3 outcome | §6 claim branch | What the paper's thesis becomes |
|---|---|---|
| VARIES | Findings vary materially by vertical | The variation itself; syndication targets the largest vertical |
| HOLDS | Findings hold across verticals | A general claim; syndication targets the broad Shopify audience |
| INCONCLUSIVE | **Cannot distinguish at this power** — the fourth branch, added 6 August | The method plus the range. Per-vertical point estimates reported descriptively with intervals and the stated MDE, and no vertical contrast claimed either way |

**The fourth branch is registered because it is the likeliest outcome, not as a courtesy.** The design detects ~11–12pp; the within-vertical spread already measured inside auto parts alone is 7pp (13.0 / 17.0 / 20.0). A real vertical effect the size of variation already observed within one vertical would be invisible to this study. That has to be written down now rather than discovered late, and the paper remains publishable and citable under it — the contribution is the method and the measured range, which is what §11 of the handoff calls the durable asset in the first place.

Per handoff §6, no branch produces nothing. Publication proceeds under all four.

### 4.4 `surface_trigger_rate` — re-measured, not inherited

Per `RULINGS` §4, it is removed from the handoff's settled-facts table. The 0% outdoor-gear figure rests on 0 of 4 queries, with a 95% interval running to roughly 60%.

Re-measure at **≥10 buying-intent queries per vertical**, ChatGPT, query text frozen and committed before the first session. Report per-vertical rate with intervals and the per-query transcript.

**The absence × `surface_trigger_rate` correlation is not to be attempted.** Three or four points is not a correlation and no coefficient is licensed. Both tables are presented and co-variation is described in words, or the analysis moves to query-class level where n reaches the teens. Either is honest; a coefficient on n=4 is not.

---

## §5 — Founder-owned, immediate, not gated by Stage 1

### 5.1 Outreach starts now

Per `RULINGS` §6, conceded without qualification: the sequencing was reversed and the conversations have not happened. Gate A's clock has not started. Merchant and platform emails go this week against stores already measured. Brand emails release when §3.2's matcher clears its FPR target — days, not weeks.

**Three fixes required before sending. See §6 of the accompanying analysis for the arithmetic.**

1. **The pre-registered read is unreachable at n=5.** At a generous 20% cold-email reply rate, P(≥3 substantive replies) ≈ 5.8% and P(≤1 reply) ≈ 74%. At a realistic 10%, they are 0.9% and 92%. Every outcome except a paid customer routes to "recraft," which is a failure branch wearing a continue-branch label. **Scale to 25 contacts** — the volume `BLUEPRINT` §5.1's G3 already assumes and DIRECTIVE-4's R-6 originally specified. Send 5 now, reach 25 within three weeks as the study measures more stores. The pre-registered read applies at n=25, not n=5.
2. **BRAND 3 cannot be sent as written.** Its entire premise is "0% across four queries in [their category]" — a 0/4 figure with an interval to ~60%, sent to a brand in that category as the reason to talk. That is failure mode #6 aimed at an external recipient. Either hold B3 until §4.4 re-measures at ≥10 queries, or rewrite it on the attribution angle.
3. **Disclose publication intent.** MERCHANT 1 and 2 offer a free list and do not mention that the store's absence rate is destined for a published paper. Add one line. A disclosed intention reads as competence; an undisclosed one discovered later is the only thing in this plan that could cost the citation position.

### 5.2 The platform email — the licensed-capability branch, executed

One email to 2–3 AEO/GEO monitoring platforms (Profound, Scrunch, Otterly or equivalent): *the capability to enumerate Shopify Catalog membership per store exists, you cannot currently do it, is that interesting?* Their answer is a demand signal on a different buyer at near-zero cost. Goes with the merchant batch. Same pre-registered read, tracked separately — a platform buyer and a merchant buyer are not the same finding.

### 5.3 Naming — RULED, 6 August 2026

**Stores are named in the paper, and each is notified with its own data before publication.**

Rationale of record: every input is public (sitemap, `/products.json`, the Catalog API), a named store can verify and dispute — which is a feature of a methods paper, not a risk — anonymised per-store rates are uncheckable and therefore not citable, and `TDD` §5 C9 was written for a mass scan of non-consenting stores rather than a 16–20 store study. `BLUEPRINT` §3 already records Shero publishing their raw dataset as having strengthened them.

**Three binding conditions.**

1. **Absence is framed as a measurement, never as a defect in the store.** "20% of this store's catalogue was not detected in the surface we measured" is a fact about the platform and the method. No published sentence may render it as a store's failure, and H9's rejection means no cause may be attributed to the merchant in any case.
2. **No per-store figure appears anywhere as a bare point estimate.** Every published row carries its 95% interval, its bounded range at recall 1.0 and at measured recall, and its measurement date, inline. A named business attached to a naked "20%" will be quoted without its interval, and this project's own history is a list of numbers that travelled without their denominators.
3. **`OUTREACH-EMAILS` merchant templates gain the disclosure line** — the number is headed for a published paper — before a single one is sent. Undisclosed publication discovered later is the only thing in this plan that could cost the citation position outright.

`TDD` §5 C9 and §8 are amended accordingly in the same pass as §3.1's register work, with the reason and date recorded per `BLUEPRINT` §0.

### 5.4 The notification creates an intervention — pre-register it now

Notifying each store with its own data before publication hands them the ability to act on it. Some will. That means the published measurement and the store's state at publication can diverge, which is a hazard, and it is also the closest thing to a remediation signal this project has ever had access to.

**Hazard, handled:** every published per-store figure carries its measurement date, and the paper states plainly that stores were notified before publication and may have changed since. No figure is silently refreshed.

**Opportunity, pre-registered:** the study's re-measurement arm (§3.4 — first stores re-run in the final week) already exists and costs nothing extra. Registering it now as a natural experiment:

- Notification dates are recorded per store.
- Stagger notification: half the study stores notified on completion of their measurement, half two weeks later, assignment by recorded seed. Both are notified well before publication, so no store is disadvantaged.
- At re-measurement, compare movement in early-notified stores against late-notified stores over the same window, **against the same-day noise floor from §3.4.** Movement below the floor is noise and no claim is made.

**No threshold is registered and no hypothesis.** This is descriptive, and it is deliberately so — n is small, notification is not randomised across a population, and merchants who act are self-selected. What it can produce is a first observation on whether absence is *responsive* to a merchant knowing about it, which bears directly on the "measurement without remediation" verdict from the eighth and ninth external evaluations. If nothing moves, that is equally worth recording.

### 5.5 Governing-doc reconciliation

**`BLUEPRINT` §5.1 still carries the €500 Gate A tier**, which `OUTREACH-EMAILS` and the handoff both record as removed. `BLUEPRINT` §0 requires decisions written into the governing docs in the session they are made. Update G1 to the pilot route only, and reconcile G3's "3 of 25 merchants" against §5.1's contact volume — G3 is unreachable at five contacts and becomes live at twenty-five.

---

## §6 — Claim boundary

Unchanged from handoff §9 and in force for every artefact this cycle, with two additions:

- **`surface_trigger_rate` variation is not currently a settled fact** and may not be quoted — internally, in outreach, or in draft — until §4.4 re-measures it.
- **No per-vertical claim of any kind** until the study reports under §4.3. The study is designed to answer this question; asserting the answer before it runs is what §8's failure modes are made of.
- **The store frame's own skew is disclosed in every artefact carrying a vertical mean.** An independent frame is not an unbiased frame; §3.5's regression states the direction and magnitude, and the limitation stands whatever it returns.

Use "not detected in the catalogue surface we measured" rather than "absent," everywhere.

---

## §7 — Report format

`DIRECTIVE-3` §8, all eight sections, unchanged.

**§1 opens with the directive files read and their commit hashes.** A directive that cannot be cited by hash was not received.

**§8 is read closely.** Three cycles running, the agent has caught an advisor error before the advisor did — the H9 threshold, the shop.app conflation, and the unlicensed −0.333 verdict. §2.2 of this directive is an advisor error caught by the advisor for once; the standing invitation is unchanged and it is not rhetorical.

**Explicitly requested in §8:** whether any task in §3 was executed in a form other than as specified, and why. The substituted experimental design in DIRECTIVE-6 arrived because the directive never reached the agent; substitutions that arrive for other reasons are more dangerous, not less.
