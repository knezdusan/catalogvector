# CatalogVector — Directive #5

**Issued:** 2 August 2026
**Supersedes:** DIRECTIVE-4 §13 (order of execution). Stage 2.5 below runs before Stage 3.
**Still binding:** everything else in DIRECTIVE-3, DIRECTIVE-4, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. Why there is a Stage 2.5

Stage 2 was executed cleanly and its §5 and §8 disclosed the problem with its own design before I did. That disclosure is the reason this directive exists.

**The design error is the directive's, not Devin's.** DIRECTIVE-3 §5 specified `filters.shops` scoping and DIRECTIVE-4 §3 repeated it. Scoping to one shop removes every competitor from the result set — and competition is the only mechanism by which a missing attribute can cost a merchant a sale. Stage 2 therefore measured whether a product can be found *inside its own store*. That was never the commercial question.

**Consequence:** the Stage 2 conclusion — *"the `fitment_recall` line has no commercial consequence"* — is **withdrawn as unsupported**, not as false. It may well be true. The experiment run cannot establish it either way.

Two further reasons the scoped result cannot carry that weight:

- `recall@50` = 1.00 on 18 of 18 queries. Inside a single shop with no empty result set (U-4), the top 50 is a large slice of a small filtered pool. Presence-at-50 is close to uninformative there.
- Four of the eighteen queries are near-verbatim title substrings — "valved exhaust system", "sportline lowering springs", "stainless steel braided brake lines", "coilover kit". Those test string matching, not retrieval.

Stage 2.5 removes one parameter and re-runs. It is roughly half a day.

---

## 1. Corrections to Stage 2's accounting

**1.1 — The population comparison excludes the misses, asymmetrically.** The review sheet records 9 dropped-relational hits and 14 retained. Report §2 reports 7 and 11.

| | Review sheet | Report §2 | Out-of-top-10 removed |
|---|---|---|---|
| Dropped | 9 hits, 7 in top 10 (0.778), median 4 | 7 hits, 7 in top 10 (1.000), median 3 | 2 of 2 |
| Retained | 14 hits, 11 in top 10 (0.786), median 1 | 11 hits, 9 in top 10 (0.818), median 1 | 1 of 3 |

The hand-labelling removed **100% of the dropped population's out-of-top-10 results and 33% of the retained population's**, which is what produces "7 of 7 dropped in top 10" against "9 of 11 retained" — the dropped population appearing to outperform the retained one. Report §3 describes the net effect of hand-labelling as "neutral." It is not neutral; it is the difference between the headline and its opposite. Restate it with both sets of numbers side by side.

**1.2 — One exclusion is internally inconsistent.** Q03 #18 (27WON pads, rank 18) is classified in §6 as `title_uninformative`. The `TDD.md` §6.2 miss classes apply to products that **were** expected to match and were not retrieved well. A product cannot be both a classified miss and excluded from the `should_match` population. Restore it: dropped becomes 7 of 8 in top 10.

**1.3 — New rule, binding from now on.** A retrieved target may be removed from the `should_match` population **only** by an explicit `should_not_match` label. It may never be removed on the basis of a §6.2 miss class, because a miss class presupposes it should have matched.

**1.4 — What the corrected numbers actually say.** Dropped 7/8 (or 7/9) in top 10; retained 9/11 (or 11/14). At these counts there is **no detectable difference between the populations**. The honest statement is "no difference detectable at n≈8 versus n≈11 under shop scoping," not "dropped products retrieve fine."

---

## 2. C5 must be calibrated by a human — this one is the founder's task

`DIRECTIVE-3` §5: *"No LLM adjudication at this stage: the ground truth for the first calibration set must be human, or the published agreement figure is worthless."* `TDD.md` §5 C5: hand-labelled **by the author**, with inter-rater agreement published as a headline number.

All 55 pairs were labelled by Devin. Devin is the LLM. Report §1 states "No LLM adjudication," which reads as Devin interpreting "hand-labelled" as "not automated by a script" — an understandable reading of ambiguous wording, and the ambiguity is the directive's. But the acid-test pass in §6 criterion 2 currently rests on labels the model produced about its own retrieval output. That is the one number in this project that cannot be self-produced.

**Task, ~1 hour, owned by Dušan, not Devin:** take 20 of the 55 pairs, sampled to include all 14 `partial` labels, relabel them blind to Devin's verdicts, then compute agreement. Publish the figure. If agreement on the `partial` band is poor, criterion 2 has not been passed and the acid test is still open.

**Devin's task:** produce the blind labelling sheet — query, product title, product position, no verdict column filled — and a scoring script that computes agreement once the founder's column is filled.

---

## 3. Stage 2.5 — Unscoped competitive retrieval (do this first)

**The question Stage 2 could not ask:** when a buyer's query goes to the whole Global Catalog, does this merchant's product appear at all — and who occupies the slots when it doesn't?

This is `BLUEPRINT.md` §2.2. It has never been run.

**Design.** Re-issue the **same frozen query set** (`scripts/retrieval-query-set.json`, commit `b0365f6`) with `filters.shops` removed. The query set is not regenerated and not extended — pre-registration is preserved precisely because only one parameter changes. Keep `address_country: 'US'` per `TDD.md` §6.3 limitation 5.

**Capture per query:**
- Full ranked result list to depth 50, with seller domain per result.
- `unscoped_presence@50` — does the declared target appear at all.
- `unscoped_best_rank`.
- **`competitor_displacement`** — the seller domains occupying the top 10, and for each, whether the product is a near-equivalent of the target. This metric has been defined since day one and has never been produced. It is the deliverable of this stage regardless of how H3 resolves.

**Report the four intrinsic queries separately.** They contain no vehicle and cannot test the relational question; they are a control for whether the target is findable at all unscoped.

### PRE-REGISTERED DECISION RULE — H3, fixed 2 August 2026, before any run

> **H3 confirmed (the coverage gap has commercial consequence):** `unscoped_presence@50` for the dropped-relational population is lower than for the retained-relational population by **≥ 0.30 absolute**, across relational queries.
>
> **H3 rejected (no consequence):** the difference is **≤ 0.10**.
>
> **H3 inconclusive:** anything between, or fewer than 6 (target, relational query) pairs in either population, or fewer than 3 distinct targets appearing at all in either population.

Inconclusive is a likely and acceptable outcome at this n. The run is worth doing anyway because `competitor_displacement` is produced either way, and that table stands on its own.

**Do not adjust these thresholds after seeing results.** If you think a threshold is wrong, say so in §8 and leave it unchanged.

---

## 4. Stage 2.5b — The title-coverage test

Report §8.3 is the most valuable paragraph in the Stage 2 submission: the metric that predicts retrieval may be `title_vehicle_coverage`, not `fitment_recall`. Test it directly, and test it where it is most extreme.

P-3 established that MAPerformance's "Multiple Fitments" titles are **merchant-authored** and faithfully preserved by Shopify. Under title dominance, those products are unretrievable by any relational query — a merchant-caused failure with a merchant-side fix.

**Design.** Assemble **≥8 products across ≥2 stores** whose Catalog title names **no** vehicle, but whose merchant data (tags, body, or `tech_specs`) states one. The Ferodo FRP3067H is the seed case. Determine the vehicles each fits, then issue relational queries for those vehicles both **unscoped** and **shop-scoped**.

Pair each with a matched control from the same store and category whose title **does** name the vehicle.

### PRE-REGISTERED DECISION RULE — H4, fixed 2 August 2026, before any run

> **H4 supported (title dominates retrieval):** title-absent products show `presence@50` at least **0.40 below** matched title-present products, on the unscoped run.
>
> **H4 rejected:** the difference is within **0.15**.
>
> **H4 inconclusive:** anything between, or fewer than 8 title-absent products assembled, or fewer than 6 matched pairs.

**If H4 is supported it is the best commercial news this project has produced,** and it must not be reported apologetically. A platform defect is a complaint Shopify can close next quarter. A merchant-authored title defect is diagnosable, fixable, verifiable by the merchant, and independent of Shopify's inference pipeline entirely.

---

## 5. U-6 — a load-bearing premise that was never verified

`BLUEPRINT.md` §2.2 asserts the Global Catalog *"is the same retrieval surface the consumer AI assistants query."* Every measurement in this project inherits that claim, and it appears nowhere in `TDD.md` §2.7's unknowns.

**Register it as U-6:** *Does Global Catalog rank predict what a consumer AI assistant actually surfaces?*

**This one is the founder's, not Devin's, and it costs an afternoon with no code:** put the same relational queries to ChatGPT, Copilot and Gemini as a shopper would, and record which merchants and products each names. Compare against the unscoped rank ordering from §3.

- **If rank predicts assistant output**, the instrument is validated against the outcome — and that validation is itself publishable and unoccupied.
- **If it does not**, the Global Catalog is a proxy, and this project has been measuring a proxy while its entire position rests on criticising everyone else for measuring proxies. Better to find that now than in the methodology section.

Add U-6 to `TDD.md` §2.7 marked `OPEN`, with the note that it blocks the publication framing, not the measurement.

---

## 6. Still standing from DIRECTIVE-4, unchanged

- **P-5 — the addition-side audit.** Four Kryptonite part numbers against the manufacturer's published application list, ~30 minutes. Unrun. Both outcomes are load-bearing (DIRECTIVE-4 §6).
- **Stage 3 — instrument completion and the auto-parts re-sample** (DIRECTIVE-4 §4). Runs after Stage 2.5 reports. Every element unchanged, including P-4.1 disjoint development and measurement stores, P-4.2 bare-model resolution, P-4.3 continuous length covariate, P-4.4 loud schema failures.
- **H2 — the truncation hypothesis** (DIRECTIVE-4 §5), with the first-occurrence-offset control. Unchanged.
- **H1 and the 0.80 fitment rule.** Unchanged, and still not fired.

---

## 7. Governing documents

**Confirm state before doing anything else.** Report `git log --oneline -8`, `git status`, `git diff HEAD origin/main --stat`, and the current version header of both `docs/TDD.md` and `docs/BLUEPRINT.md`. If DIRECTIVE-4 §11's updates are committed and pushed, say so and give the commit hash. If they are not, apply them now — that directive was the authorization.

**Then add, per this directive:**
- `TDD.md` §2.7 — U-6 as above, `OPEN`.
- `TDD.md` §6.1.1 — the Stage 2 conclusion withdrawn as unsupported, with the scoping reason stated in one sentence.
- `TDD.md` §6 — H3 and H4 with their decision rules and registration date; `competitor_displacement` marked as produced by Stage 2.5.
- `TDD.md` §6.2 — the §1.3 rule: exclusion from `should_match` requires a `should_not_match` label, never a miss class.
- Changelogs and version bumps on both.

**Not to be touched:** `BLUEPRINT.md` §1, §2.2, §3, and every pre-registered threshold value.

---

## 8. Report format

DIRECTIVE-3 §8, all eight sections, artifacts attached. Three additions carried forward:

- **§2 must state population counts before and after any hand-label exclusion**, with the direction each exclusion moves the comparison. Stage 2's §2 gave only the post-exclusion figures.
- **§2 must state the scored-set composition by store**, not only the match rate.
- **§5 must state a direction for every deviation**, including ones that look neutral.

§6 remains verdict-against-the-rule-only. §8 remains where judgment goes — and Stage 2's §8 blockers named the scoping problem before the advisor did, which is the standard.

---

## 9. Order of execution

1. **Stage 2.5 — unscoped competitive retrieval (§3) and the title-coverage test (§4)** → report
2. **P-5 — addition-side audit (§6)** → may be folded into the same report
3. **Stage 3 — instrument completion and auto-parts re-sample** → report
4. **Workstream A — three remaining verticals** → report

Stop and report between stages. Do not chain.

**Founder-owned, running in parallel, blocking on none of the above:** the C5 blind relabel (§2, 1 hour) · the U-6 assistant check (§5, one afternoon) · the demand probe, 25 contacts, still at zero.
