# CatalogVector — Rulings on Session Blockers 1–8

**Issued:** 5 August 2026
**From:** the prior advisory session (DIRECTIVE-3 through DIRECTIVE-18)
**To:** the dedicated session drafting DIRECTIVE-19
**Status:** binding. Commit to `docs/directives/` and cite by hash in the DIRECTIVE-19 report.

---

## 0. Assessment of the blockers

Six of the eight are correct. Three are errors in the handoff or in my prior directives and are conceded without qualification. Two require rulings, given below. One is a strategic choice that was being made by default and shouldn't be.

**Correct and conceded:** §2 (register self-contradiction), §3 (size confounds the study), §4 (`attribution_loss_rate` has no instrument), §5 (underpowered, correlation not computable as framed), §7 (outreach sequencing reproduces failure mode #5).

Refusing to work from the handoff's summary of `OUTREACH-EMAILS.md` is exactly right and is the behaviour the whole session depends on.

---

## 1. Register corrections — Stage 1, ahead of any store work. Confirmed.

All three defects are real and the register is the one artefact intended to be checkable by strangers.

**Entry 7 vs Entry 13.** Entry 7 says the ~300 boundary "is most likely a relevance threshold, not a hard count cap." Entry 13 says the CAP reading is settled and names entry 7 while doing so. Entry 7 was written before the `total_count` probe and never revisited. **Rewrite entry 7 to the settled position** — seven semantically unrelated queries returning 361–387 — and mark it as superseded on the date, rather than silently editing it. A register that shows its own corrections is more credible than one that appears to have always been right.

**Entry 9 is worse than stale.** It carries "deterministic prefix ~12 ranks" — and that number came from the **corrupted U8-A run**. The corrected run gave a deterministic head of 0–50 at 100% positional agreement, with the tail at 0% and Jaccard 0.48. Entry 9 is currently publishing a figure produced by the broken instrument. Replace it, state the correction and its cause, and record that World B was re-validated rather than withdrawn.

**Entry 10 is falsifiable by our own §3.** "Any third party attempting per-store Catalog auditing hits the same wall" is contradicted by 97.7% recall at TSP. Restate as: no per-store enumeration endpoint exists, naive search carries a measured 54% false-negative rate, and partition-based enumeration reaches 88–98% depending on catalogue size. **The barrier is effort and calibration, not impossibility** — which is the honest claim and still a real lead-time advantage.

**Add a standing instruction to the register itself:** every entry carries the directive that established it and the directive that last revised it. The contradiction above existed because nothing forced a re-read when a later finding superseded an earlier one.

---

## 2. Size confounding — correct, and the mitigations are adopted

This is the sharpest of the eight and I missed it. Recall runs 97.7% → 88.8% → 56.6% across the size gradient, and §4 of the handoff lists three absence rates side by side as though they were comparable. They are not: TSP's 13.0% is a tight upper bound and MAP's 17.0% is a loose one.

**All three proposed mitigations are adopted:** matched size bands across verticals in the sampling frame, a **pre-registered store-selection rule** committed before any store is chosen, and every absence figure reported conditioned on that store's measured recall.

**One addition.** Report absence as a **bounded range per store**, not a point: the share absent at recall = 1.0 (upper bound) and at the store's measured recall (lower bound). That makes non-comparability visible in the number itself rather than in a footnote a reader skips. Where the two bounds are far apart, the store's measurement is weak and the paper should say so inline.

**Suggested bands, to be pre-registered:** small (<5,000 products), medium (5,000–25,000), large (>25,000). Aim for coverage of all three in every vertical. Where a vertical has no large stores, record that as a property of the vertical rather than filling the cell.

---

## 3. `attribution_loss_rate` has no instrument — correct, and this is my omission

I promoted attribution to "the strongest surviving asset" without noting it has no validated matcher. Register entry 1 establishes there is no shared product identity, so "the same product under another seller" must be reconstructed by matching — the exact fuzzy layer that killed H6 and confounded H4.

**Building and validating the matcher is a Stage 1 task**, before any store work, per I-6.

**One constructive constraint that should improve it materially.** Do not build a title matcher. In auto parts and most technical verticals, **manufacturer part numbers are distinctive and extractable** — `PBP370`, `KRUCA12`, `DP31210C`, `FRP3067H`. Key the matcher on brand + part number where a part number is extractable, and **reject rather than fall back to title similarity** where it isn't. A matcher with 40% coverage and a 2% false-positive rate is worth far more than one with 95% coverage and an unmeasured error rate. Report coverage and false-positive rate separately; the coverage figure is itself a finding about the vertical.

**Also required:** the metric needs an absence determination on the merchant's own seller, which inherits the recall problem. `attribution_loss_rate` must therefore be reported conditioned on that store's recall, same as §2.

---

## 4. Power and the correlation — correct on both counts

**The unit of analysis for a vertical claim is the store, not the product.** More stores at smaller n is right. I'd move to **n≈50 per store across 16–20 stores** rather than n=100 across 12. Per-store intervals widen to roughly ±10pp, but the per-vertical estimate averages 4–5 stores, which is what the study's question actually needs.

**The correlation is not computable as framed and should not be attempted.** Three or four points is not a correlation. Adopt the proposal: move to query-class level to get n into the teens, or present co-variation descriptively with no coefficient. Either is honest; a coefficient on n=4 is not.

**Conceded, and it is a direct instance of the failure this handoff warned against.** I placed `surface_trigger_rate` variation in "settled facts, do not re-litigate" while outdoor gear's 0% rests on 0 of 4 queries with an interval running to roughly 60%. Listing a thin number as settled is the same error as elevating a presence rate without its denominator. **Remove it from §4 of the handoff and re-measure it in the study**, with at least 10 queries per vertical.

**§6's "vary materially" needs a number before data exists.** Propose one in DIRECTIVE-19 and register it. A defensible starting point: the highest-vertical and lowest-vertical mean absence rates differ by ≥10 percentage points, with non-overlapping intervals at the vertical level.

---

## 5. RULING on §7.3 — the branch rule blocks DIRECTIVE-19, and that is the rule working

The reading is correct: six branches outstanding, the study executes two, four remain, and no new hypothesis may be registered while any is open. The rule biting on its first application is a good sign, not an obstacle.

**Disposition of the four:**

**Competitive displacement — already staged.** It is `attribution_loss_rate`. Not outstanding.

**Monitoring vs one-shot audit — STAGE IT, and it costs nothing.** The same-day noise floor is required regardless; a four-to-six week study cannot separate drift from noise without test-retest. And **the study's own duration supplies the longitudinal window for free**: the first stores measured are re-measured in the final week. That is a 4–6 week time series at the cost of two extra enumeration runs, and it is the monitoring branch's cheapest possible test. Run the same-day floor on two stores first; only movement above it counts.

**Enumeration as a licensed data capability — STAGE IT, as a sixth outreach email.** This is not a measurement task and it should not become one. It is one email to two or three AEO/GEO monitoring platforms: *"I can enumerate Shopify Catalog membership per store. You can't. Is that interesting?"* Their answer is a demand signal on a different buyer at near-zero cost, and it belongs in §6 alongside the merchant and brand emails.

**Adjacent surfaces (Shop, Google & YouTube, Meta) — FORMALLY CLOSED for this session**, with the reason recorded: it multiplies scope across four surfaces while the primary surface's measurement is still being made defensible. **It is the natural follow-on, not a competitor for this session's time.** Record it in the register as closed-for-scope rather than invalidated, so a later session can reopen it without re-deriving the case.

With that, no branch is outstanding and DIRECTIVE-19 may register the study's hypothesis.

---

## 6. RULING on §7 — the outreach criticism is correct and the sequencing is reversed

**Conceded without qualification.** DIRECTIVE-18 §5 authorised five conversations "this week," and the handoff then placed all outreach after a four-to-six week study. That is the identical contradiction I named as failure mode #5, restated with better manners, and it took the incoming session one reading to catch.

**The conversations have not happened.** Gate A's clock has not started. It starts at the first outbound contact.

**Ruling: the conversations run now, in parallel with the study, and do not wait on it.** They assert nothing, they need none of the study's numbers to be right, and every day they are deferred is a day the only untested variable stays untested. The current three-store range is sufficient for a listening conversation precisely because it makes no causal or fix claim.

**And the incoming session's inversion is better than my design.** What merchants and brands say absence means to them should **feed vertical selection**, not the reverse. That makes C-4 — the commercial vertical lock that was deferred since DIRECTIVE-4 and never made — a decision informed by buyer input rather than by whichever vertical produces the cleanest measurement. Adopt it.

**Practical sequencing:** merchant emails go this week against stores already measured. Brand emails wait on §3's matcher, which is Stage 1 anyway, so the delay is days not weeks. The platform email goes with the merchant batch.

Gate A's window is 8–10 weeks from first contact, now running concurrent with the study rather than after it.

---

## 7. The moat-versus-citation trade — decide it, and here is the split I'd take

Correct that this should be a deliberate choice rather than a side effect of the repo being public.

**My ruling, which the founder may overturn:** publish the method. Given the Category C verdict and a 3–9 month lead time on a surface that could be superseded by one Shopify release, the citation position is worth more than the lead time, and it survives the API changing.

**But the split is not all-or-nothing, and the distinction is real.** What compounds is not the recipe — it is the calibration corpus:

- **Publish:** the partition-based enumeration method, the invariant library, the ground-truth construction procedure, the reference-standard design, seeds, and the register. Everything needed to reproduce the result.
- **Retain:** the validated ground-truth fixtures across 16–20 stores, the per-vertical query libraries, and the accumulated recall calibration by catalogue size.

Anyone can reimplement a recipe in a week. Recreating validated ground truth across twenty stores in four verticals is weeks of labour, and it is the thing that makes a second measurement fast and a first measurement slow. Publishing the method while retaining the corpus is honest — the paper is fully reproducible — and it keeps the only asset that actually accumulates.

---

## 8. What DIRECTIVE-19 should contain

**Stage 1 — no store work:** register corrections (§1) · the matcher with measured coverage and false-positive rate against committed ground truth (§3) · the pre-registered store-selection rule and size bands (§2) · the same-day noise floor on two stores (§5) · the registered number for "vary materially" (§4).

**Founder-owned, starting immediately and not gated by Stage 1:** merchant and platform outreach (§6).

**Stage 2:** the study, with brand outreach released as soon as the matcher clears.

Report format unchanged — DIRECTIVE-3 §8, all eight sections, directive files cited by commit hash in §1.
