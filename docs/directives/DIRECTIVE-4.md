# CatalogVector — Directive #4

**Issued:** 2 August 2026
**Supersedes:** DIRECTIVE-3 §9 (order of execution). Incorporates DIRECTIVE-3 Addendum A in full — the addendum was drafted before the Stage 1 report was read and is folded in here rather than issued separately.
**Still binding:** everything else in DIRECTIVE-3, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What changed, and why the order is different

Stage 1 was executed well. P-1, P-2 and P-3 were all done, the `tags` schema bug was found and fixed, and §5 and §8 of the report disclosed the deviations honestly, including two the directive never asked about. That standard of reporting is the reason the analysis below was possible at all.

Three things emerged from recomputing the review sheet that change what happens next:

1. **Every scored product in the run is from one store.** Twelve products scored; all twelve are Two Step Performance. The eight MAPerformance products all fell out for having no stated fitment. The four-store match table in §2 is a *matching* result, not a *sampling* result.
2. **The three zero-recall products are the three longest source texts in the sample** — 9,671, 6,515 and 5,618 characters. The next longest scores 1.00. Under a null of no length effect that ordering has probability ≈ 1/220. This is a new mechanism hypothesis and it is registered in §6.
3. **On the thin-source MAPerformance products, inference *adds* fitment the merchant never stated** — 5 of 8. Nobody has checked whether the added vehicles are correct.

The reordering below follows from (2) and (3): the mechanism is not yet understood well enough for a four-vertical generalization probe to be interpretable, and its commercial consequence has still never been measured.

---

## 1. Rulings in force (founder-approved, 2 August)

These are settled. Do not re-derive them.

**1.1 — The 0.80 rule did not fire on Stage 1, in either direction.** The `fitment_recall` 0.80 rule was registered against a design of 20 products across 3–4 stores, stratified. Stage 1 scored 12 products from one store. A stop rule does not fire on a sample non-compliant with its own registration. **The §6 verdict of the Stage 1 report — "COVERAGE GAP CONFIRMED" — is withdrawn.** This is not a criticism of Devin, which applied the rule as written and did not have this ruling. The rule fires on the first compliant sample.

This is a deferral, not a dissolution. When it fires and lands ≥0.80, the auto-parts fitment claim goes to `BLUEPRINT.md` §3, Workstream A is not run as a rescue mission, and §2.2 survives untouched. Record both halves together so the deferral cannot be re-invoked later.

**1.2 — Auto parts has no valid H1 arm and must be re-sampled** to the same standard as the other three verticals: 3+ stores, 15+ scored products. `relational_zero_rate` is only comparable across verticals if every vertical was collected under identical rules.

**1.3 — The two thresholds are one measurement.** For the population where the merchant states a relational attribute, `mean_recall ≤ 1 − zero_rate`. So mean `relational_recall` ≥ 0.80 and `relational_zero_rate` ≥ 0.20 cannot both hold. **In any vertical where mean relational recall ≥ 0.80, that vertical is excluded from H1's confirming set and H1 then requires 3 of the 3 remaining verticals.** Write into `TDD.md` §6.1.1.

*(Observed on Stage 1's non-compliant sample: mean 0.675, zero rate 0.25, bound 0.75 — consistent, and inside the only admissible window the bound permits at n=12.)*

**1.4 — The classifier is committed before the data.** For each vertical, the attribute classifier is committed to git **before the first payload from that vertical is fetched**. As a **data file** (JSON or YAML), not code, so the diff is legible: attribute names per vertical, relational/intrinsic assignment, plus an explicit `unclassified` bucket. Any attribute encountered that is not on the list goes to `unclassified` and is reported — never silently assigned mid-run. A vertical whose classifier commit post-dates its first fetch is reported **inconclusive** regardless of its numbers.

**1.5 — Frozen definitions.** `relational_zero_rate` is per-product. The **stated** set includes the product **title**. DIRECTIVE-3 §4's three metric definitions are copied verbatim into `TDD.md` §6 and marked **directive-fixed** — removed from the freely-editable surface granted by DIRECTIVE-3 §6.

**1.6 — Reporting additions (no threshold moves).** Report the full per-vertical recall distribution and the zero/partial/full split alongside every verdict. Report the drop-out count and its stratum next to every recall figure.

**1.7 — Scale-up** means infrastructure (I-5/I-6/I-7) and N-store scaling. It does not gate Workstreams A or B at the store counts named here.

---

## 2. Corrections to Stage 1's own accounting

Two items in the report's §5 deviations table need their direction changed. Both were reported; only the direction was wrong.

**2.1 — The 8 no-stated-fitment products are not "neutral."** They were excluded from the recall denominator. Five of the eight have a *non-empty* inferred set; three have an empty one. Had their stated sets been extracted, five would likely have scored high and three would have scored zero. **The exclusion therefore biases the headline downward — in favour of the finding.** Report it that way.

**2.2 — "~0.70 → 0.675" is not a like-for-like delta.** The source-text definition changed between the runs (`tags` now parse and are included) and the sample composition changed entirely. The two numbers are not comparable and should not be presented as a small movement. State them as separate measurements on different instruments.

**2.3 — Prefix matching, resolved.** Devin was right to flag it and right to escalate rather than decide. Ruling:

- Prefix matching is **retained and made symmetric**: a match holds when either side's key is a prefix of the other. Currently it is asymmetric — "subaru sti"/"subaru sti gdb" matched, but "audi rs3 8p"/"audi rs3" did not, and product 11 counts `audi rs3` as both an omission and an addition, which is an instrument artifact visible in the sheet.
- **Report both scoring rules every time:** `relational_recall_prefix` (symmetric, headline) and `relational_recall_strict` (exact key, sensitivity). The methodology's stated bias runs toward the null (`TDD.md` §6.1.1 limitation 3), so the generous rule is the headline and the strict rule is the sensitivity.
- On Stage 1's sample the defensible range is roughly **0.58 – 0.68**. The number is unstable across scoring rules; its ordering against 0.80 is not. **Report the range, not a point estimate.**
- Note for the record: whether "honda civic" and "honda civic fc" are the same vehicle *for retrieval purposes* is not a string question. Workstream B answers it. Until then the string rule is a stand-in and is labelled as one.

---

## 3. Stage 2 — Workstream B, the decisive retrieval test (do this first)

This is now the next thing that happens, ahead of Workstream A. It satisfies C-1 and it is one to two days of work.

**Why first.** Stage 1 produced a matched natural experiment inside one store. Three products have zero inferred vehicles while their **titles name the vehicle** (#13 27WON pads, #14 PRL BBK, #15 HEL brake lines). Six comparable products in the same store and category retain their fitment (#12, #16, #17, #18, #19, and partially #11, #20). Same merchant, same buyer vocabulary, same category. That is a control group that will not exist again after re-sampling.

**The question:** does a dropped relational attribute cost retrieval?

**Loop, per DIRECTIVE-3 §5 — minimal, in-memory, no Postgres, no pgvector, no Redis, no Inngest:**

1. **C4 — freeze the query set.** Generate from Two Step Performance's real inventory, ≥3 archetypes, at least one explicitly relational ("brake pads for a 2018 Honda Civic Si"). Include queries targeting each of the three dropped products *and* each of the retained controls. **Commit the query set before issuing a single Catalog call.** Commit hash goes in the report.
2. **C3 — issue** each query scoped via `filters.shops` to the TSP GID. Capture full request and response.
3. **C5 — resolve expectations by hand.** ≥50 query-product pairs labelled `should_match` / `partial` / `should_not_match`, with a written rationale per pair. **No LLM adjudication.**
4. **C6 — score** `recall@10`, `recall@50`, `best_rank`, `retrieval_rate`, `competitor_displacement`.

**Report the dropped-relational and retained-relational populations separately.** That comparison is the entire point.

**Additionally, and cheaply:** for each query, record whether the target vehicle appears in the product **title**, in **tech_specs**, in **both**, or in **neither**. This four-way split tells you which surface actually drives retrieval, and it costs one extra column.

**Pre-registered exit criteria — binary, non-numeric. No headline rate is published, quoted, or carried forward from this run.**

1. Does the loop close end-to-end on at least one store?
2. Does C5 produce at least one `partial` verdict that field presence could not have produced? *(This is the `BLUEPRINT.md` §5 acid test. It fires here.)*
3. Does at least one miss classify into a `TDD.md` §6.2 class other than `unexplained`?
4. Are the two populations separable and reported separately?

**If the dropped-relational products retrieve fine, say so plainly.** DIRECTIVE-3 §5 named that outcome in advance and it remains the honest report. It would mean the `fitment_recall` line has no commercial consequence, and that is a major finding, not a setback.

---

## 4. Stage 3 — Instrument completion and the auto-parts re-sample

Runs after Stage 2 reports. Fixes the four things that made Stage 1 non-compliant.

**P-4.1 — Development set and measurement set must be disjoint.** Stage 1's extractor was tuned across five rounds while the headline moved 0.213 → 0.417 → 0.538 → 0.623 → 0.585 → 0.675, with the stopping rule being "the review sheet looks clean." Every individual fix was defensible and the net movement ran *against* the finding, so this is not an integrity problem. It is a generalization problem: there is no held-out set, so nothing in the number is known to survive contact with data it wasn't tuned on. From now on: **harden on one store, then run frozen on the others.** The extractor is committed and its hash recorded before the measurement run. Any change to the extractor after that point invalidates the run and requires a fresh one.

**P-4.2 — Bare model names must resolve.** The extractor requires make+model adjacency, so "Silverado" alone in a tag or title is invisible while "Chevrolet Silverado" is caught. This is the most likely reason all eight MAPerformance products returned an empty stated set. Add a model → make lookup for the vertical's closed vocabulary. Verify against the eight Kryptonite products specifically and report how many enter the scored set as a result.

**P-4.3 — Replace bucket sampling with a continuous covariate.** The thin/rich buckets discarded 543 of 571 matched products and still delivered n=2 in the thin arm. Sample across the full length range instead, and record per product:
- source-text length in characters
- for each stated relational entity, the **character offset of its first occurrence** in the source text
- whether the entity appears in the title, tags, body, or variant fields

The pre-registered thin/rich contrast remains computable by binning the continuous variable post hoc, so nothing registered is lost.

**P-4.4 — No silent schema failures.** The `tags` bug hid behind a `catch` that returned null and suppressed ~99% of matches across three of four stores. Every Zod parse failure is logged and counted, and the failure count per store appears in every report. A zero-match store is a loud error, never an empty row.

**Then re-run auto parts to §4 standard: 3+ stores, 15+ scored products, extractor frozen.** This produces auto parts' H1 arm and is the first sample on which the 0.80 rule can fire.

---

## 5. H2 — the truncation hypothesis, pre-registered before any test

Registered now, from a pattern found in Stage 1's data. **It cannot be confirmed on Stage 1's data** — it was generated there. It is tested on P-4.4's fresh sample.

**Observation.** Among the twelve scored products, the three with zero inferred vehicles are exactly the three longest source texts (9,671 / 6,515 / 5,618 chars). The fourth-longest (5,377) scores 1.00. Probability of that ordering under no length effect ≈ 1/220. The two thin products (500, 369 chars) both score 1.00.

**H2:** relational-attribute loss is a function of **source-text length and in-document position**, not of attribute type. Shopify's extraction has an effective input budget; fitment blocks sit late in technical product pages and fall outside it. Intrinsic specs survive because they sit early, not because they are intrinsic.

**Why it matters more than it looks.** H2 is a direct alternative explanation for H1 and it is **confounded with H1 in Workstream A as currently designed.** If intrinsic attributes appear earlier in the document than relational ones — which is the normal layout of a technical product page — then a four-vertical probe would "confirm" H1 while measuring position.

**Pre-registered decision rule — fixed 2 August 2026, before any test run:**

> **H2 supported** if, within a single store and controlling for stated-set size, `relational_zero_rate` in the top length quartile exceeds the bottom quartile by ≥ 0.30, in ≥2 verticals.
>
> **H2 rejected** if that difference is < 0.10 in ≥3 verticals.
>
> **H2 inconclusive** otherwise, or if fewer than 2 verticals reach 20 scored products spanning both quartiles.

**Mandatory control regardless of H2's verdict:** report mean first-occurrence offset for relational vs intrinsic entities in every vertical. If relational entities systematically appear later in the document, H1's verdict is reported **with that confound named in the same sentence**, in the report and in any publication.

**If H2 holds, it is commercially better news than H1.** "Your fitment table is past the extraction budget — move it up and structure it" is a specific, cheap, verifiable remediation a merchant can act on. "The platform drops relational attributes" is a complaint about Shopify.

---

## 6. P-5 — Audit the addition side (this is the unchecked direction)

Five of eight MAPerformance products have vehicles in `tech_specs` that the merchant never stated: Silverado, Sierra, Tahoe, Suburban, Yukon, Avalanche, Escalade, Ford Super Duty. Stage 1 §4 verified the *extraction* was faithful. Nobody verified the *vehicles* are correct.

**Task, ~30 minutes:** take the four Kryptonite part numbers (KRUCA12, KRUCA19, KRSE11, KRFD17STAGE2FOX) and check the added vehicles against Kryptonite's own published application list. Report each part number, each added vehicle, and correct/incorrect/undetermined per vehicle.

**Both outcomes are load-bearing:**
- **Correct** → Shopify's cross-merchant merge is *supplying* relational data where the merchant's own page is thin. That is `TDD.md` §2.5 consequence 1 observed in fitment for the first time, and it shrinks the addressable surface to merchants whose fitment data is rich and exclusive. Say so plainly.
- **Incorrect** → Shopify is telling buyers a part fits a vehicle it does not. That is a returns-and-liability finding with a different buyer, and it is unpublished.

**On the dead premise.** This is not a resurrection of "Shopify's inference hallucinates specs" (`BLUEPRINT.md` §3). That was nullified at n=59 on **one store with ~5,000-character spec-table descriptions** — rich source, high-quality input. The population here is the opposite: 111–169 character descriptions where inference is filling a vacuum from cross-merchant data. That population was never sampled. Different population, different mechanism, and it is being checked by hand rather than assumed. If it comes back clean, it stays dead and this note is the record of why it was reopened.

---

## 7. P-3 is resolved and it invalidates a hypothesis — branch set required

"Multiple Fitments" is the merchant's own title, faithfully preserved by Shopify. The speculated second coverage mechanism does not exist. Devin resolved this correctly, by fetching the storefront JSON and comparing rather than reasoning from the catalog side.

Per the branch rule, three successors — at least one orthogonal:

| Branch | Claim | Cheapest killing test | Worth if true |
|---|---|---|---|
| **B-1 Merchant-authored retrieval self-harm** | A measurable share of technical-vertical products carry titles naming no vehicle ("Multiple Fitments", bare part numbers) and are structurally unretrievable by relational query regardless of Shopify | Count title-vehicle-naming rate across the four stores already ingested; cross with Stage 2's retrieval results | The fix is the merchant's, not Shopify's — which makes it **sellable**. A platform complaint is not a service line; a fixable merchant defect is |
| **B-2 Title dominates retrieval** | The Catalog weights title far above inferred `tech_specs`, so `tech_specs` coverage barely affects retrieval | The four-way split already added to Stage 2 §3 — free | If true, the whole `tech_specs` coverage line is a sideshow and the product is title and structured-data remediation. Cheap to deliver, checkable by the merchant |
| **B-3 (orthogonal) The addition side** | Inference *supplies* relational attributes to thin-source products, sometimes wrongly | P-5 above, ~30 minutes | A completely different buyer (returns, warranty, liability), a different claim, and unoccupied. Pays off precisely when the omission story shrinks |

B-2 is orthogonal to the omission thesis in the sense that matters: if it holds, H1's verdict stops being commercially relevant in either direction.

---

## 8. Gate A replacement (C-2) — founder-owned, in force from issue

Replaces the suspended threshold in `BLUEPRINT.md` §5.1. **Compound: G3 is an early non-gating read, G1 is the gate.**

**Clock starts at first outbound contact of the demand probe**, not at publication. Publication is evidence-gated and unbounded; a gate anchored to it can never arm.

**Window: 8–10 weeks from first outbound contact.**

**G1 — the gate. Either route clears:**
- Two paid diagnostics at **≥ €500 each**, or
- One paid pilot remediation at **≥ €2,500** (e.g. 100 SKUs)

€500 sits where a manager can approve without procurement — low enough to be a real decision, high enough that nobody pays it to be polite. The pilot route matters because it tests willingness to pay for the **fix**, which is where the business is, rather than for the diagnosis. **Free catalogue access, however enthusiastic, prices at zero and does not clear G1.**

**G3 — early read, does not gate.** 3 of 25 contacted merchants confirm the problem is already known to them *and* name an internal owner.

**Why compound.** G3 passing while G1 fails means the problem is real and the offer is wrong — a different instruction from "no demand." A single gate hides that.

**If G1 is unmet at the window's close: stop.** The artifact and the credential are kept. Recorded now, in advance, as a successful outcome.

---

## 9. C-3 and C-4 — restated so they are in the operative document

**C-3.** H1 confirmation does not become the public headline. If H1 holds, it is the explanatory layer beneath retrieval-outcome numbers. If it holds only in auto parts, the claim is scoped accordingly. `BLUEPRINT.md` §2.2 stays the spine.

**C-4.** The commercial vertical lock is a deliberate decision taken after Workstream A, on buyer budget, store density, and willingness to pay — **not** on whichever vertical produced the cleanest H1 signal. The scientific vertical and the commercial vertical need not be the same.

---

## 10. Workstream A — gated, and re-scoped when it runs

The three remaining verticals (device accessories, printer/filter/appliance consumables, electronic components) run **after Stage 2 reports and Stage 3's auto-parts re-sample is complete.**

When it runs, it runs under §1.4 (classifier committed before first fetch), §1.5 (frozen definitions), §1.6 (distribution reporting), §4 (continuous covariate, disjoint dev/measurement sets, loud schema failures) and §5 (positional control). H1's thresholds are unchanged.

---

## 11. Governing document updates

Per the DIRECTIVE-3 §6 permission boundary. **The directive is the authorization; Devin executes these and does not originate them.**

- `TDD.md` §6.1.1 — add §1.3 (the recall/zero-rate bound and the exclusion consequence), §1.1 (the 0.80 rule's sample-design precondition and the withdrawal of Stage 1's verdict), §2.3 (dual scoring rules).
- `TDD.md` §6 — copy DIRECTIVE-3 §4's three metric definitions verbatim, marked **directive-fixed**. Add H2 (§5) as a pre-registered hypothesis with its decision rule and its registration date.
- `TDD.md` §2.7 — record the `tags` schema finding as a verified platform fact with date: Shopify's `/products.json` and `/products/<handle>.json` return `tags` as a comma-separated string.
- `TDD.md` §6.1.1 — record the P-3 resolution: "Multiple Fitments" is merchant-authored, not a canonical-title collapse.
- `BLUEPRINT.md` §5.1 — replace the suspended Gate A with §8 above.
- Changelogs and version bump on both.

**Not to be touched:** `BLUEPRINT.md` §1, §2.2, §3, and every pre-registered threshold value.

---

## 12. Report format

Unchanged — DIRECTIVE-3 §8, all eight sections, artifacts attached. Two additions:

- **§2 must state the scored-set composition by store**, not only the match rate by store. A four-store match table above a one-store scored set is misleading even when every number in it is true.
- **§5 must state the direction each deviation moves the headline**, including deviations that look neutral. An exclusion is never neutral; it has a direction, and naming it is the point of the section.

§6 remains verdict-against-the-rule-only. §8 remains where judgment goes, and Stage 1's §8 is the model — the prefix-matching escalation was the right call and should have been made exactly where it was made.

---

## 13. Order of execution

1. **Stage 2 — Workstream B** (§3) → report
2. **Stage 3 — P-4 instrument completion, P-5 addition audit, auto-parts re-sample** (§4, §6) → report
3. **Workstream A** — three remaining verticals (§10) → report

Stop and report between stages. Do not chain.

**Running in parallel, owned by the founder, not by Devin:** the demand probe (25 contacts, per-recipient findings only, measurement framing not diagnosis). It blocks on nothing here.
