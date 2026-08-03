# CatalogVector — Directive #9

**Issued:** 3 August 2026
**Supersedes:** DIRECTIVE-8-v2 §8 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-8-v2, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What DIRECTIVE-8-v2 produced

The pipeline fix worked — all four reports cite directive files by commit hash. Three things in this cycle were done well enough to name:

- **U7-D found the floor.** A nonsense query returns ~305 products with zero overlap against `brake pads`. This is a real, novel, checkable platform behaviour and nobody has published it.
- **Stage 4 refused its own result.** It ran the relaxed design, got a clean −0.333, and then argued in §4, §5 and §6 that the number was an artefact of product-type mismatch rather than title coverage — and rendered INCONCLUSIVE. That is the correct handling of an unlicensed verdict and it is the first time in this project an agent has caught one before the advisor did.
- **Stage 3 corrected DIRECTIVE-7's own mechanism table.** The Intec "store-level invisibility" was title-level all along; the real store-level case is Subimods. Overturning a prior cycle's finding on cleaner data is the behaviour the whole method exists to produce.

And one thing needs to happen before anything else is interpreted, which §1 sets out.

---

## 1. U-8 — where does the head end and the padding begin? (blocking)

### 1.1 Why this is now the gating question

U7-D establishes that a Catalog response is **not a match set**. It is:

```
response (~300)  =  HEAD (genuine matches, size H — unknown)  +  PADDING (~300 − H)
```

DIRECTIVE-8-v2 §1's U-7 rule stated that if U7-D returned a populated set, *"the tail of every result set is padding rather than matching. That must be characterised before any presence figure in the project is interpreted."* Stage 1 characterised that the floor **exists** and is query-dependent. It did not establish **where the floor begins inside a matching query's response**. That is what the rule required, and until it exists the following are unsafe:

| Finding | Status under an unknown H |
|---|---|
| IV02: "competitors at rank 66–169 present, TSP absent" | **Unsafe.** Those competitors may be padding. The controlled comparison collapses if they are |
| Domain concentration: top 20 hold 34.7% of slots | **Contaminated.** Slot counts include padding |
| Domain concentration: top 20 hold 48.3% of top-10 | **Safe.** Top-10 is head by construction |
| EBC Brake Shop: 191 slots, 0 top-10, avg rank 270 | **Not a finding.** "Volume without visibility" may be entirely padding |
| Every `presence@50` figure in the project | **Part-padding** if H < 50. `presence@3` and `@10` are safer |
| Stage 1's claim that the invisible targets "are NOT in the floor" | **Uninformative.** Padding appears to be a sparse draw; absence from it is expected by chance |

**One finding the floor makes stronger, not weaker:** Subimods at 0/10. Those queries were derived from Subimods' own product titles, so they should land in the head if anything does — and Intec scored 5/5 by the identical method. See §4.

### 1.2 Design — two probes, one of them free

**U8-A — determinism (live, ~3 minutes).** Issue the same query three times in succession: `brake pads for 2018 Honda Civic Si`. Compare the product-ID sequences rank by rank. Record the first rank at which the three sequences diverge, and the pairwise agreement rate by decile. Repeat for `zxqv flurbin widget` as the pure-floor control.

A deterministic ranked segment followed by a non-deterministic segment locates the boundary directly.

**U8-B — token-overlap decay (zero cost, existing transcripts).** For each of the 18 depth-1000 queries, and for each returned product, record whether the product title or `tech_specs` contains any content token from the query (stopwords excluded). Compute the rate by rank decile. The nonsense query's response gives the baseline — it should be flat and low at every depth.

`H` per query = the rank beyond which the token-overlap rate falls within 0.10 of the nonsense baseline and stays there.

**Report both, per query, with the two estimates of H side by side.** If they disagree, report both and say so; do not average them.

### PRE-REGISTERED DECISION RULE — U-8, fixed 3 August 2026, before any run

> **MEASURABLE HEAD** — U8-A shows a deterministic prefix and U8-B shows overlap decaying to the nonsense baseline at a definable rank, with the two estimates of H within a factor of 2 for ≥12 of 18 queries. Every presence figure in the project is re-derived against `presence@H`, and "absent" is restated as **below the relevance bar for that query phrasing** — which is the THRESHOLD outcome of U-7 and is a real, describable platform behaviour.
>
> **SHALLOW HEAD** — H < 20 for ≥12 of 18 queries. The project's `presence@50` figures are majority-padding and must all be recomputed at `@H`. The IV02 comparison is withdrawn. Domain concentration is recomputed head-only.
>
> **NO BOUNDARY** — token overlap never approaches the nonsense baseline within the response, and U8-A shows determinism throughout. The ~300 is genuinely all matching for real queries and the floor appears only when nothing matches. The Stage 2/3 invisibility findings stand as originally framed.
>
> **INCONCLUSIVE** — the two estimates disagree by more than a factor of 2 on ≥7 of 18 queries, or U8-A shows no stable prefix at all.

No presence figure is quoted, published, or shown to anyone until U-8 reports.

---

## 2. Re-derivations, gated on U-8

Once H is known, recompute and report side by side with the originals:

1. `presence@H` for the 16 H3 targets, both populations.
2. The IV02 comparison — are the competitors at ranks 66–169 inside H or outside it? This determines whether the project's single cleanest controlled comparison survives.
3. Domain concentration, head-only: distinct domains, top-20 share, and whether the EBC "volume without visibility" pattern persists when padding is removed.
4. The three absolutely invisible targets: absent from head, or absent from head-plus-padding? State which, since only the first is a finding.

**No new hypothesis, metric or mechanism may be introduced in this cycle.** DIRECTIVE-8-v2 §6's freeze remains in force until U-6 reports.

---

## 3. The platform-facts register — two errors to fix before it goes anywhere

The register is the right artefact and it is close to publishable. Two entries would not survive a hostile reader, and it is the one document intended to be checkable by strangers.

**3.1 — Entry 2 restates a claim this project struck.** It reads: *"Products whose `tech_specs` omit a vehicle are unretrievable for that vehicle by any agent using the Catalog."* DIRECTIVE-8-v2 §2.3 struck exactly this sentence as falsified by the project's own data — H3 measured dropped-relational products at `presence@50` = 0.429, and 6 of 10 TSP products have zero inferred vehicles while TSP holds rank 1 in 5 of 14 relational queries.

Replace the impact line with what is actually established: *"On a four-store sample, corrected mean fitment recall is 0.385. The retrieval consequence of this omission is not established; measured retrieval differences between products with and without inferred vehicles have been small."*

**3.2 — Entry 3 contradicts the project's own resolved finding and has no artefact.** It claims agent-profile approval *"took multiple days."* U-1 was resolved on 1 August with the opposite conclusion: Spring '26 removed the approval requirement entirely — the profile is a hosted JSON file, auth is an API key exchanged for a bearer token, **zero lead time**. The register's evidence line is "Project log," which is not an artefact.

Either produce the artefact showing a multi-day approval, or **strike entry 3 and replace it with the U-1 finding**, which is a genuine documentation correction in its own right and is properly evidenced.

**3.3 — Entry 7 gets the U-8 result** once §1 reports, including the head/padding split. It is currently the register's most valuable entry and it is incomplete without it.

**3.4 — Keep entry 6.** Recording a case where the documentation is *correct* is what makes the other seven credible. Do not trim it for tidiness.

---

## 4. Subimods — the finding the floor strengthens

0 of 5 natural-language and 0 of 5 brand/SKU, on queries derived from Subimods' own product titles, from an enrolled store selling brands (COBB, PRL, Fluidampr) that appear from three other stores in the same dataset. Intec scored 5/5 by the identical method.

**Three checks, all cheap, before this is called anything:**

**4.1 — Zero cost.** Count Subimods slots across the 5,653-row depth-1000 dataset and the 100-query store scan. If the answer is zero across ~8,600 slots, state that number — it is far stronger than 0/10.

**4.2 — Verbatim title query.** Issue the exact, untruncated product title of three Subimods products as queries. If a store's own verbatim product title does not return that product, that is close to a binary defect and it is the sharpest version of this finding.

**4.3 — Rule out the boring explanations.** Confirm from Subimods' public storefront JSON that the five products are currently active, in stock, and published. A delisted or out-of-stock product could plausibly appear in a cached scoped response and legitimately not appear unscoped. If any of the five fails this check, replace it and re-run.

**If 4.1–4.3 hold, this is the project's strongest single result** — a specific, named, checkable, merchant-actionable defect requiring no threshold, no extractor, and no hand-labelling. It is also the only finding so far whose interpretation does not depend on H.

**It remains n=1 store.** No claim about prevalence is authorised. The next question is how many stores in a larger scan show the pattern, and that is not this cycle.

---

## 5. H4-R — locate a store where it can actually run

Stage 4's diagnosis is correct: TSP is 94.1% title-present with its title-absent products concentrated in universal-fitment categories where controls cannot exist; MAP is uniformly title-absent in brake pads. Neither supports the registered design.

Stage 4 concludes *"no such store has been identified in this project."* That is true and it is also solvable with data already collected — the per-store title-coverage scan specified in DIRECTIVE-6 §5.2 was never run.

**Task:** compute `title_vehicle_coverage` per store and **per category** across all ten stores scanned in Stage 3, from public storefront JSON. No Catalog calls. Report the distribution, and report the extractor's false-positive and false-negative rate against 20 hand-checked titles.

A store in the 40–70% band, with both populations present in one category, is where H4-R runs. If no such store exists among the ten, widen the scan rather than relaxing the pairing — and if none exists at all, that is itself the finding: **title practice is store-uniform, which means H4 can never be tested within a store and the hypothesis is structurally untestable as registered.** Report that plainly if it is the answer.

---

## 6. U-6 — this is the gate, and it has now been outstanding five cycles

DIRECTIVE-8-v2 §6 fixed the stop/continue decision on two axes. U-7 has reported. **U-6 has not, and it is the only remaining input.**

The task is unchanged and takes one afternoon with no code: put the same relational queries to ChatGPT, Copilot and Gemini as a shopper would, record which merchants and products each names, and compare against the unscoped rank ordering. Twelve queries is enough.

Every cycle has generated more work that Devin can do while the single item only the founder can do stays unrun. That pattern is the loop mechanism, more than any individual hypothesis has been. Until U-6 reports, the project cannot answer whether it is measuring an outcome or a proxy — and the proxy question is the one its entire position rests on.

The C5 blind relabel remains outstanding on the same terms: 20 pairs, all 14 `partial`s, sheet and scorer built and committed, one hour.

---

## 7. Claim boundary — updated

**What can be said, as of this cycle:**

> The Shopify Global Catalog returns approximately 300 products for any query, including queries that match nothing — so a response is not a match set. On a four-store sample in performance auto parts, Shopify's inference omits roughly 60–70% of the vehicles merchants state. Across 18 exhaustive queries, 702 distinct seller domains appear, and the top 20 hold 48% of top-10 positions. One enrolled store in a ten-store scan returned zero presence across all ten of its own queries.

**What cannot be said, and what no document, message or conversation may imply:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> "Products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."

---

## 8. Order of execution

1. **§1 U-8** — U8-B first (zero cost), then U8-A → report
2. **§2 re-derivations** + **§3 register corrections** → report
3. **§4 Subimods verification** + **§5 title-coverage scan** → report

Stop and report between stages.

**Founder-owned, blocking the §6 gate:** U-6, and the C5 blind relabel.

**Not authorised:** any merchant-facing document, any outreach, any language asserting a measured effect on a real store. §7 applies to every artefact produced under this directive, including the platform-facts register if it is published.
