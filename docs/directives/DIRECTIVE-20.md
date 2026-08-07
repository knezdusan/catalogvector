# DIRECTIVE-20 — Metric Discipline, Instrument Remediation, and Study Start (Small + Medium Bands)

**Issued:** 7 August 2026
**From:** the extended-study advisory session
**To:** Devin (execution) and the founder (founder-owned items, marked)
**Follows:** DIRECTIVE-19, report at `docs/reports/directive19-report.md`
**Governing inputs:** as DIRECTIVE-19, plus the D19 round report

**Delivery discipline unchanged.** Committed and pushed before work begins; §1 of the round report opens with directive files and commit hashes.

**Headline:** DIRECTIVE-19 executed nine of nine tasks and three of them do not clear. Two produce numbers that must not propagate, one produces a validation that cannot fail. None of this blocks the study in the small and medium bands, and the study starts in this directive.

---

## §1 — Outstanding branch inventory

| Branch | Disposition |
|---|---|
| Monitoring vs one-shot audit | **STAGED and executing** — noise floor delivered (§3.4 D19). Metric corrected in §2.3 below: the monitoring quantity is the enumerated handle set, not the sampled absence rate |
| Enumeration as a licensed data capability | **STAGED, founder-owned** — platform email, §6.2 |
| Surface-render rate by query class | **STAGED** — §5.4 of the study, ≥10 queries per vertical |
| A different commercial vertical | **STAGED** — §5 of this directive, bands S and M |
| Competitive displacement | CLOSED — unmeasurable on the current instrument (D19 §2.1) |
| Adjacent surfaces | CLOSED for scope, not invalidated |

Inventory unchanged in membership from DIRECTIVE-19, but three branches moved from staged to executing. Duty B has not stopped.

---

## §2 — Metric discipline. Read before anything else.

Three numbers in the D19 report are correct as computed and wrong as labelled. The remediation is bookkeeping, not re-measurement, and it must land before any of them reaches an email, a draft, or the paper.

### 2.1 The noise-floor "absence rate" is not absence

The D19 noise-floor table reports Subimods "absence" at 26.92–27.06% and TSP at 7.98–10.66%. These are `1 − enumerated/sitemap` — **the complement of enumeration coverage**, which folds true absence together with enumeration failure. The D17 absence rate is `1 − union presence` on a random sample, where the reference standard catches what enumeration misses. They are different quantities and they are not different-precision estimates of one quantity.

The arithmetic confirms it. Subimods: D17 absence 20.0% at enumeration recall 88.8% predicts an enumerated fraction of 0.80 × 0.888 = 71.0%, i.e. a coverage complement of 29.0%. Observed: 27.0%. The noise-floor number is what the *enumeration* misses, and it lands almost exactly where the recall figure says it should.

**Report §8 surprise 5 is withdrawn.** "The D17 figure is not wrong; it is less precise" is the dangerous form of this error, because it invites the full-enumeration number to replace the sampled one. Carried to MAP, where recall is 56.6%, this metric yields a coverage complement of 57.1% — which would resurrect "half your catalogue is invisible," a claim BLUEPRINT §3 closed permanently on 4 August.

**Actions.**
1. Rename the column in the noise-floor script, its output JSON and the report to `enumeration_coverage_complement`. The identifier `absence` is reserved for the union-presence estimate and for the bound in §2.2. One name, one denominator, everywhere.
2. Add an assertion to the invariant library: **any quantity named `absence` must carry its denominator definition and its detector set in the same record.** This is I-3's logic applied to metrics rather than sellers, and it is the failure I-3 exists to catch, one level up. Register as **I-7** and add to `TDD.md` §6.4.

### 2.2 The same data contains a genuinely better bound, and it revises TSP downward

Devin's instinct in surprise 5 was right and the mechanism was wrong. The correct version is worth more than the mistaken one.

Enumeration produces no false positives — a handle returned for a seller is in the Catalog (register entry 1, D17 §1). Therefore enumerated products are a subset of present products, and:

> **absence ≤ 1 − |enumerated ∩ sitemap| / |sitemap|**

is a hard upper bound that carries no sampling error at all. For each store, the reportable figure is the **tighter of the enumeration bound and the sampled union upper bound.**

Applied to what D19 already collected:

| Store | Enumeration bound | D17 sampled estimate | Tighter bound |
|---|---|---|---|
| TSP | **≤ 8.0%** | 13.0% [7.8–21.0] | **enumeration, ≤8.0%** |
| Subimods | ≤ 26.9% | **20.0% [13.3–28.9]** | **sampled, 20.0%** |
| MAP | ≤ 57.1% (useless) | **17.0% [10.9–25.5]** | **sampled, 17.0%** |

**TSP's absence is at most 8.0%, and the D17 point estimate of 13.0% is above its own hard ceiling.** The published range is therefore not 13–20%. This is free precision from data already on disk, and it is exactly the kind of result that makes a method paper citable.

**Actions.**
1. **Verify the intersection, do not assume it.** Compute `|enumerated ∩ sitemap|`, not `|enumerated|`. Register entry 11 records Catalog handles that are not in `/products.json`; if enumerated handles exist outside the sitemap, the raw count overstates the bound. Report the intersection size, the enumerated-not-in-sitemap count, and what those handles are.
2. Recompute the bound for all three stores and report both bounds per store, with which one binds.
3. **Founder, before any email goes out:** `OUTREACH-EMAILS` MERCHANT 2 currently states "13–20% of a catalogue wasn't detected." That range is superseded. Hold the merchant batch until §2.2's recomputation lands — this is hours, not days — and restate with the corrected per-store bounds.

### 2.3 The noise floor does not apply to the study's absence metric

The floor was measured on full-enumeration handle counts. The study's absence metric is a union estimate on n≈50 per store, whose sampling noise is roughly ±10pp — over a hundred times the measured API noise at Subimods. **A floor of 0.06pp says nothing about whether a re-sampled absence rate has moved.**

**Consequence, and it improves the monitoring branch rather than damaging it.** Longitudinal monitoring tracks the **enumerated handle set** — count and Jaccard against the prior run — not the re-sampled absence rate. Only the former has a floor small enough for change to be detectable, and it is also the quantity a monitoring product would actually sell. Registered accordingly for the §5.6 re-measurement arm.

---

## §3 — Instrument remediation. Three items did not clear.

### 3.1 The MAP rarefaction curve is very probably an ordered slice, not a random subsample — re-run it

DIRECTIVE-19 §3.3 specified random subsamples with recorded seeds. The report's deviation note discloses a change of sizes and does not state the sampling method. The curve itself is diagnostic:

- Product types: 25, **36, 36, 36**, 62, 74, 76, 76, 76, 76
- Vendors: 36, 89, 99, 108, **205**, 281, 307, 307, 307, 307

Three identical type counts across a doubling of sample size (5,000 → 10,000 products), followed by a 72% jump at 12,500, is not the shape of a random rarefaction curve. It is the shape of taking the first *N* rows of a file whose ordering correlates with vendor and type — which `/products.json` ordering does.

This matters because the conclusion built on it is the study's large-band feasibility verdict. **A random 5,000-product draw from 25,000 will recover far more cells than a sequential first-5,000**, so the "saturation at 70%" reading and the 35× query extrapolation may both be artefacts of the draw.

**Actions.**
1. Re-run at 500 / 1,000 / 2,000 / 5,000 / 10,000 as specified, with **`Math.random` replaced by a seeded PRNG and the seeds printed in the output JSON.** Report the sampling method explicitly whichever way it went the first time.
2. **Strike the log-log extrapolation to 102,176 products.** Beyond the curve problem, `/products.json`'s 25,000 are the first 100 pages, not a random sample of the 102,176 — a rarefaction extrapolation assumes random draw from the population and this violates it. The "~13,469 queries" and "~100% estimated recall" figures are withdrawn and may not be quoted.
3. Note for calibration: even if 13,469 queries were needed, at 5 req/s that is roughly four to five hours of API time. **The binding constraint was never the queries — it is metadata acquisition.** Do not report query count as the barrier.

### 3.2 The Subimods selection-error check was not run, and the substitute found something better

The registered test — build subsample partitions and compare absence in recovered versus dropped cells — was replaced with a full-partition per-cell analysis. Those answer different questions: the registered one asks what subsampling loses, the substitute asks where absence sits given everything. The registered test is still outstanding and is re-issued with §3.1's re-run.

**But the substitute produced the most useful finding in the report, and it is under-exploited.** 91.0% of absent products sit in cells that recovered *something*; only 9.0% are in zero-recovery cells. The partition reaches the right cells. The loss is *inside* cells — and the top offenders (KYB Struts 123 absent, Yokohama Tires 121) are large cells against a ~360-product response budget (register entry 13).

**That is a fixable instrument defect, not a platform property, and fixing it is worth more than any other engineering work available.**

**Actions.**
1. **Sub-partition oversized cells.** For any cell whose recovered handle count approaches the response budget, split it on a third key — price band, leading title token, or tag — and re-issue. Cells needing this are few (Subimods: 2,449 cells, mean 7.4 products, heavy tail), so the added query cost is small.
2. Measure the recall gain at Subimods against the existing n=100 seed-42 reference standard. Report recall before and after, and the added query count.
3. If recall improves materially, the same fix applies at MAP and may matter more there than metadata coverage does.

### 3.3 Handle-token partitioning — the alternative that needs no metadata fetch

The large-band constraint is metadata acquisition: 102,176 products at ≤1 req/s is roughly 28 hours per store. But the sitemap already yields every product **handle** for free, and handles carry brand and product words.

**Test at Subimods, where both a handle-only partition and the full metadata partition exist.** Build a partition from handle-token frequency alone — no `/products.json` beyond the sitemap — and score its recall against the same seed-42 reference standard. Report recall and query count against the metadata partition's 88.8% and 692.

If handle-token partitioning reaches within a few points of metadata partitioning, the large band costs sitemap fetches only and the size-band design is affordable everywhere. If it does not, that is a clean negative result and the band decision falls to §5.2.

### 3.4 The matcher's 0.0% FPR is not a validation — it cannot fail as constructed

The report states false positives are "structurally impossible" and then reports FPR measured against near-miss pairs that differ by part number, using a matcher that keys on part number. **A test that cannot fail has not tested anything.** This is I-6 satisfied in letter and void in substance.

Compounding it: **substring matching was added after the ground truth was designed**, to lift the pair yield from 21 to 60. Substring matching is the single change most likely to generate false positives — `AA044` is a substring of `13575AA044` — and the FPR was not re-derived against anything built to probe it.

**The matcher is not cleared for use, and brand outreach stays gated until it is.**

**Actions — build an adversarial near-miss set, ≥60 pairs, covering:**
1. **Same part number, different brand.** Confirm the matcher requires brand agreement. The directive specified brand + part number; the report describes exact part-number matching and does not state that brand is enforced. Answer that explicitly.
2. **Substring collisions.** Pairs where one part number is a substring of another, and pairs where a short part number appears incidentally inside an unrelated string.
3. **Low-entropy part numbers.** Numbers under six characters, pure-numeric numbers, and any pattern the extractor accepts that has high collision probability across brands.
4. **Supersession pairs** — same physical part under an old and a new number. These are false negatives; report them separately, do not fold them into FPR.

Re-derive FPR against this set. **Target unchanged at ≤2%.** If substring matching cannot clear it, drop substring matching and accept the lower pair yield — 21 validated pairs beat 60 unvalidated ones.

**And one generalisation to withdraw.** Report §8 surprise 1 states that in auto parts, part numbers live in SKUs rather than titles. That is measured at *one store*. A Shopify SKU is frequently a merchant's internal code, not a manufacturer part number, and Subimods' SKUs happening to be MPNs is a property of Subimods until shown otherwise. **Measure SKU-as-MPN at two further stores before the claim appears anywhere**, and record the disabled-`/products.json` consequence the report correctly identified: stores without it cannot be scored for attribution loss, which belongs in §3.5's exclusion table and in limitations.

### 3.5 TSP noise-floor run 3 is a suspected failed run reported as data

| Run | Handles | Duration |
|---|---|---|
| 1 | 2,400 | 67.2 min |
| 2 | 2,391 | 71.0 min |
| 3 | **2,330** | **38.8 min** |

Run 3 finished in 55% of the time and returned 70 fewer handles. Runs 1 and 2 differ by 9 handles (0.38%) — consistent with Subimods' 0.08% across its three runs. **A run that does substantially less work in substantially less time is a candidate instrument failure, not variance**, and it drives essentially the whole TSP floor: without it the handle SD falls from 31.1 to about 6.4.

This matters twice over. An inflated floor makes real change undetectable at small stores, which is where the monitoring branch would be sold. And report §8 surprise 4 — "noise floor scales inversely with catalogue size" — rests on run 3.

**Actions.**
1. Retrieve run 3's logs: query count completed, invariant events, HTTP status distribution, any aborted or short-circuited queries. Determine whether all 299 queries ran to exhaustion.
2. If run 3 was short, **discard it, run two replacements, and report the floor on three clean runs.**
3. If run 3 was complete and simply faster, say so with the evidence, and surprise 4 stands.
4. Hold surprise 4 until this resolves. It is currently an n=2 comparison of stores resting on one suspect run.

### 3.6 Provenance

Report §1 lists §3.4's commit as "pending" and §7 lists `d19-noise-floor.json` as "(pending completion)", while §2 reports its numbers in full. Per `TDD.md` §6.4, a number without provenance is not reportable. Commit the noise-floor outputs and restate the hashes.

---

## §4 — What DIRECTIVE-19 got right, recorded so it is not re-litigated

- Register entries 7, 9 and 10 corrected with supersession dates rather than silent edits; standing provenance instruction added. The register is publishable.
- The Subimods handle-count discrepancy traced end to end (13,358 → 13,107 → 13,257) and correctly resolved as supersession rather than error.
- The store-selection rule committed before any store was inspected, with the frame independent of the Catalog.
- Outreach, TDD C9 and BLUEPRINT §5.1 amended as directed; governing docs versioned.
- The within-cell absence finding (§3.2 above), which is the most valuable result in the cycle even though it arrived as a substitution.

---

## §5 — The study starts now, in the small and medium bands

**The large band is decoupled.** Bands S (<5,000) and M (5,000–25,000) run on an instrument with 97.7% and 88.8% recall and are not waiting on §3.1–§3.3. Holding the whole study for MAP-class feasibility would spend another full cycle on instrument work with no external contact, which is failure mode #5 wearing an engineering costume.

### 5.1 Scope of this stage

Per the pre-registration in DIRECTIVE-19 §4, unchanged: H10, decision rule §4.3 with its four claim branches, n≈50 per store, union presence, bounded range per store, every store through the invariant library.

- **3 verticals** to start, auto parts as baseline. The other two are chosen on §6.1 outreach input per `RULINGS` §6 — if that input has not arrived by the time the frame is built, choose on the four Phase 0 criteria and record that the C-4 decision was made without buyer input.
- **4 stores per vertical**, two in band S and two in band M.
- Per-store absence reported as **both** bounds from §2.2, with the binding one named.

### 5.2 The large band, decided on evidence

Band L enters the study only if §3.2's sub-partitioning or §3.3's handle-token partitioning brings a MAP-class store above **80% recall** against a seed-42 reference standard. Registered now. If neither clears it, the paper states that the method covers catalogues below 25,000 products and degrades above, with the measured recall curve as the evidence — an honest boundary, and a better paper than a silent one.

### 5.3 Frame skew, as registered

Build the full qualified frame per vertical first, then sample within band by recorded seed. Pre-registered regression of per-store absence on catalogue size and on multi-source frame presence, per DIRECTIVE-19 §3.5.

### 5.4 `surface_trigger_rate`

Re-measured at ≥10 buying-intent queries per vertical, query text frozen and committed before the first session. No correlation coefficient against absence, per DIRECTIVE-19 §4.4.

### 5.5 Attribution

`attribution_loss_rate` is measured **only after §3.4 clears**, and only at stores with `/products.json` enabled. Excluded stores are listed with the reason.

### 5.6 Re-measurement arm

First stores measured are re-run in the final week. Movement is scored on the **enumerated handle set** — count and Jaccard — against that store's own same-day floor, per §2.3. Notification dates recorded and staggered by seed, per DIRECTIVE-19 §5.4. Descriptive, no threshold.

---

## §6 — Founder-owned, ungated

### 6.1 Outreach

Proceeds. One hold and one addition:

- **Hold the merchant batch until §2.2's recomputation lands** — hours, not days. The "13–20%" figure in MERCHANT 2 is superseded and TSP's number moves materially. Sending a number that changes next week is worse than sending three days later.
- Scale to 25 contacts within three weeks, read applied at 25, per DIRECTIVE-19 §5.1.
- Platform email (§6.2) goes with the merchant batch.

### 6.2 The platform email

Unchanged from DIRECTIVE-19 §5.2. One line stronger now: the same-day noise floor is measured (0.06pp at medium catalogue size), which is precisely the number a monitoring platform needs to know whether change is detectable at all. That is a capability claim nobody else can make and it costs nothing to state.

---

## §7 — Claim boundary

Unchanged, with three additions in force immediately:

- **"13–20% absence" is superseded** and may not be quoted until §2.2 recomputes it.
- **The MAP extrapolation figures** — ~13,469 queries, ~100% projected recall — are withdrawn.
- **`enumeration_coverage_complement` is never called absence**, in any artefact, internal or external.

---

## §8 — Report format and one note on §8 itself

`DIRECTIVE-3` §8, all eight sections, unchanged.

The D19 report's §8 recorded no advisor errors — the first cycle in four. That may simply be true. But the three items filed under "disagreement with the directive" are all justifications for deviations already taken, not challenges to the directive's reasoning, and the section has drifted from adversarial review toward deviation accounting. They are different functions and the second cannot substitute for the first.

Two of this cycle's deviations were correct calls that produced better information than the registered task would have. Two were not, and both were reported as improvements. **The distinction to draw in §8 is not whether a substitution was reasonable but whether it still answers the registered question** — §3.2's did not, and said it did.

The standing invitation is unchanged and it is not rhetorical: §2.1, §3.1 and §3.5 of this directive are corrections of work the advisor specified and signed off. If any of them is wrong, say so.
