# CatalogVector — Directive #6

**Issued:** 2 August 2026
**Supersedes:** DIRECTIVE-5 §9 (order of execution).
**Still binding:** everything else in DIRECTIVE-3, DIRECTIVE-4, DIRECTIVE-5, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What this directive is for

Stage 2.5 executed three tests and disclosed its own deviations completely — §3 caveats 1–3 and §6 name the H4 matching failure before any reviewer could. That disclosure is why the corrections below are possible.

Two things need fixing, and they run in opposite directions:

1. **H4's verdict is not licensed by its rule and is corrected to INCONCLUSIVE.** The registered design has zero matched pairs. A clean version is cheap and is specified in §3.
2. **H3's absolute level was reported as a failed hypothesis and is the most important number this project has produced.** It is promoted to the headline in §2.

---

## 1. H4 — verdict corrected, and the drafting error was mine

### 1.1 The verdict

DIRECTIVE-5 §4 required *"a matched control from the same store and category"* and set inconclusive at *"fewer than 6 matched pairs."* Report §6 states the strict matched-pair count is **0**.

> **H4 is INCONCLUSIVE by pre-registration.** The SUPPORTED verdict in §7 is withdrawn.

Relaxing a matching criterion after the strict version returns zero pairs, then reporting the relaxed result as the verdict, is a threshold moving without its value changing. That is the loophole this project identified two directives ago and it has now fired twice — first on prefix matching in Stage 1, now here. DIRECTIVE-3 §8.6 is unambiguous: do not offer a verdict the rule does not license. Report the relaxed number in §2, never in §6.

### 1.2 My error, recorded so it is not repeated

DIRECTIVE-5 §4 contained the sentence *"If H4 is supported it is the best commercial news this project has produced."* That sentence sat inside a pre-registration and attached a valuation to one of the three possible outcomes. Report §3 quotes it back as a section heading.

I wrote it to prevent a good result being reported apologetically. Its actual effect was to put a thumb on the scale of a blind test. **No future directive attaches a valuation, positive or negative, to any outcome of a pre-registered rule.** Commercial interpretation belongs in the analysis section after the verdict, never in the registration.

### 1.3 The confound is larger than the report states

The report names a category confound and argues the 0.708 gap is too large for it to matter. Check the composition:

| Population | Categories | Brake-pad queries |
|---|---|---|
| Title-absent | brake pads (8 of 8) | 8 |
| Title-present | brake lines, camber arms, downpipe, exhaust, lift kit, springs | **0** |

H4 as run is **brake pads versus everything else**, not title-absent versus title-present. Brake pads are the most commoditised, most-listed category in aftermarket auto parts; a query like "brake pads for a 2011 Mustang GT" competes against a vastly denser field than "camber arms for a 2016 Honda Civic". Competitive density is a complete alternative explanation for the entire 0.708 gap.

The report's own data supports that alternative. H4Q13 — the single title-present failure — is explained in §3 as *"a competitive category... the ICON kit loses on popularity."* That is the density explanation, applied to the one case that falls on the other side of the hypothesis. The same mechanism cannot explain away a control failure and be excluded from the treatment failures.

Also: five of the eight title-absent queries returned **zero products from the target's own store**. When no product from the store appears at all, the failure is not localised to the tested product's title.

None of this says H4 is wrong. The mechanism is plausible and the effect may be exactly as large as reported. It says the run cannot distinguish title from category, and a run that can is half a day away.

---

## 2. H3 — the level is the finding, not the difference

Report §7 gives H3 as inconclusive and §8 advises *"do not pursue H3 further."* Both are correct about the hypothesis and both miss what the run measured.

| | presence@50 | Not retrieved |
|---|---|---|
| Dropped-relational | 0.429 (3/7) | **57%** |
| Retained-relational | 0.556 (5/9) | **44%** |
| **Pooled** | **0.500 (8/16)** | **50%** |

**Roughly half of a merchant's products do not appear anywhere in the Global Catalog's top 50 for a query naming their exact vehicle and their exact category.**

That is `BLUEPRINT.md` §2.2. It is the unoccupied position — retrieval outcome, measured rather than proxied — and this is the first time in the project's history it has been measured. It is a larger, more publishable, and more sellable number than `fitment_recall` 0.675 ever was, and it does not depend on H1, H2, the intrinsic/relational reframe, or `fitment_recall` at all. Those become the explanatory layer beneath it, which is exactly what constraint C-3 requires.

Reading it as a failed hypothesis is failure mode 3 from the session handoff — confirmation misread as failure. The hypothesis was about a *difference between two populations*. The *level* was never the hypothesis and was never in doubt of being interesting.

**Required now, from data already on disk — no new API calls:**

- **`presence@10` and `presence@3`** per population and pooled. An assistant surfaces three to ten products, not fifty. `presence@50` is the generous bound; the commercially relevant figures are the tighter ones and they are already in `unscoped-2026-08-02T15-44-54-483Z.json`.
- **`best_rank` distribution** unscoped, per population.
- **`competitor_displacement` scored as a metric**, per `TDD.md` §6.1 — it is a defined metric, not a qualitative table. For each query: distinct seller domains in the top 10, the domain holding rank 1, whether the target's store appears at all, and the count of distinct sellers in the top 50 (which is also the density covariate §3 needs).
- **State the sample honestly:** 16 pairs, two stores, one vertical, targets declared by the query set's author. This is a first measurement, not a benchmark.

**No threshold is attached to these.** They are reporting, not a new hypothesis.

---

## 3. H4-R — the paired-query re-run

The clean design removes category and density as variables entirely by testing both populations **inside the same query**.

**Design.** Identify queries where a title-absent product **and** a title-present product from **the same store, same category** both genuinely fit. Two Step Performance supports this today: the Paragon PBP370 and PBP15570 have no vehicle in their titles, while the 27WON Performance pads and the Z23 kit name vehicles in theirs, and their stated fitment sets overlap on Honda Civic.

For each such query, both products face identical competitive conditions — same competitors, same density, same ranking pass. Title presence is the only variable.

**Requirements:**
- **≥6 queries**, each with at least one title-absent and one title-present target from the same store and category.
- Both targets' fitment for the queried vehicle confirmed against the merchant's own page before the query is written.
- Query set committed to git before any Catalog call; commit hash in the report.
- Record **distinct seller domains in the top 50** per query as the density covariate.
- Report per-query, not only pooled — a within-query win/loss table is the primary output.

### PRE-REGISTERED DECISION RULE — H4-R, fixed 2 August 2026, before any run

> **H4-R supported:** across ≥6 paired queries, the title-present target is present@50 while the title-absent target is not, in **≥5 of the pairs**, with no more than 1 pair running the other way.
>
> **H4-R rejected:** the within-pair outcome differs in **≤1 of the pairs**.
>
> **H4-R inconclusive:** anything between, or fewer than 6 valid pairs assembled.

If fewer than 6 pairs exist at TSP, extend to a third store rather than relaxing the pairing. **Do not relax the pairing criterion under any circumstance.** If the pairs cannot be assembled, the verdict is inconclusive and the report says so.

---

## 4. P-5 — accepted, with one finding the report passed over

12 of 12 correct against manufacturer application lists is a real result, sourced legibly enough to be re-checked. The addition side is accurate on this sample. Recorded.

**But KRUCA19 contradicts the thin-source story.** It is a 131-character source product where inference supplied Silverado and Sierra and **dropped Tahoe, Suburban, Yukon** — all on Kryptonite's published list. That is relational drop on a *thin* source, at a recall of roughly 0.3–0.4.

Two consequences:

- It is direct counter-evidence to Stage 1's "thin-source mean = 1.000" surprise, which rested on n=2.
- It weakens **H2** (the truncation hypothesis, DIRECTIVE-4 §5) as a complete explanation: if drop occurs at 131 characters, an input-budget ceiling cannot be the whole mechanism. H2's thresholds are **unchanged** and it is still tested as registered in Stage 3. This is recorded as evidence against it, arriving before the test, which is the correct time to record it.

**Note on method.** DIRECTIVE-4 §6 said "check by hand." The audit header describes itself as "automated comparison." Combined with C5's labelling, every hand-check in this project has now been delegated to the model. P-5's sources are cited and re-checkable so the objection is weak here — but the pattern is named, and §6 below is where it stops.

---

## 5. Stage 3 — first deliverable, then instrument completion

**5.1 — Produce two store-level retrieval reports.** Every component now exists. For Two Step Performance and MAPerformance, produce a document containing: which of their products did not appear for queries that should have surfaced them; who occupied the slots instead, by domain; the cause per `TDD.md` §6.2 class; and the method, so the merchant can re-run it themselves.

This is not a publication and not a sales asset. It is the artefact that makes the demand probe concrete — a specific, checkable finding about the recipient's own catalogue, which is the entire hook. **Named per-store results remain unpublished** (`BLUEPRINT.md` §6 PUB-1); these go to the store in question and nowhere else.

**5.2 — Title-coverage scan, no Catalog calls needed.** Compute `title_vehicle_coverage` — the share of products whose title names a vehicle — across the full product lists of all four stores already ingested (~575 products). This runs on public storefront JSON alone, which means it scales to thousands of stores at near-zero cost and is checkable by anyone. Report per store, and report the extraction's false-positive and false-negative rate against 20 hand-checked titles.

**5.3 — Instrument completion and the auto-parts re-sample**, per DIRECTIVE-4 §4, unchanged: P-4.1 disjoint development and measurement stores with the extractor hash frozen, P-4.2 bare-model resolution, P-4.3 continuous length covariate, P-4.4 loud schema failures. Then H2 and the 0.80 fitment rule, both still unfired.

---

## 6. Founder-owned, blocking on nothing

These three have been outstanding across multiple cycles and none depends on Devin.

1. **The C5 blind relabel.** The sheet and scorer are built and committed. 20 pairs including all 14 `partial`s, ~1 hour. Until this is done the acid test has not been passed by anything other than the model grading its own work.
2. **U-6 — the assistant check.** Put the same relational queries to ChatGPT, Copilot and Gemini and record which merchants they name. One afternoon, no code. Given §2's result, this is now sharper than it was: if half of a store's products are absent from the Catalog's top 50, the question of whether Catalog rank predicts assistant output determines whether that 50% is a finding or an artifact of the wrong surface.
3. **The demand probe.** 25 contacts, per-recipient findings, measurement framing. §5.1 gives it the hook it was missing. Gate A's clock starts at first outbound contact and has not started.

---

## 7. Governing documents

Confirmed at v0.5.2, committed and pushed; the version-header/changelog mismatch that made the updates look absent is resolved. Note in the next report that `next build` was skipped in the verify gate and `scripts/output` was added to the Biome ignore list — both defensible, neither disclosed in a report section.

**Apply:**
- `TDD.md` §6.1.4 — H4's verdict corrected to INCONCLUSIVE with the zero-matched-pairs reason and the category composition table from §1.3. The 0.708 figure is retained as a directional observation, explicitly not a verdict.
- `TDD.md` §6 — add H4-R with its decision rule and registration date.
- `TDD.md` §6.1 — `competitor_displacement` marked as produced and scored, per §2.
- `TDD.md` §6.1.2 — record the KRUCA19 counter-evidence against H2. Thresholds unchanged.
- `TDD.md` §6.1.x — record the unscoped level as the first retrieval-outcome measurement, with the sample stated as 16 pairs / 2 stores / 1 vertical.
- Changelogs and version bump on both.

**Not to be touched:** `BLUEPRINT.md` §1, §2.2, §3, and every pre-registered threshold value.

---

## 8. Report format

DIRECTIVE-3 §8, all eight sections. Carried forward: population counts before and after any exclusion with direction; scored-set composition by store; a direction for every deviation including the neutral-looking ones.

**Added:** §6 contains the verdict the rule licenses and nothing else. Where a rule's preconditions are unmet, the verdict is **inconclusive** — a relaxed criterion may be reported in §2 and argued in §8, never rendered as a verdict in §6.

---

## 9. Order of execution

1. **§2 re-analysis of existing unscoped data** (no API calls) + **§3 H4-R** → report
2. **§5.1 two store-level retrieval reports** + **§5.2 title-coverage scan** → report
3. **§5.3 instrument completion and auto-parts re-sample** → report
4. **Workstream A** — three remaining verticals → report

Stop and report between stages. Do not chain.
