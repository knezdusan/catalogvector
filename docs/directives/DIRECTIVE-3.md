# CatalogVector — Directive #3

**Issued:** 2 August 2026
**Supersedes:** the Phase 0 / Phase 1 sequencing in `docs/BLUEPRINT.md` §5 and the three-week milestone plan in `docs/TDD.md` §9.
**Still binding:** everything else in both documents — the invalidated-directions register, pre-registration discipline, the verification standard, and the component architecture C1–C9.

---

## 0. Read this section before doing anything

This directive changes what the project is for. Three things changed on 2 August:

1. **The inferred-set audit passed.** The zero-fitment products were real platform behaviour, not extractor failure. That closed the existence question.
2. **The founder's external constraint was lifted.** The project no longer needs to produce a portfolio artifact on a deadline. It is now aiming at a durable business position.
3. **A larger pattern became visible in data already collected** (§2). The project's scope widens accordingly.

Do not read (2) as permission to move faster or declare sooner. The opposite: without a deadline, there is no longer any excuse for promoting a diagnostic to a headline before its threshold is met. Two premises in this project have already died from exactly that.

---

## 1. What is now settled — treat as established, do not re-litigate

| Fact | Evidence |
|---|---|
| `filters.shops` is a hard restriction, including at pagination depth | U-4, T1–T5, zero containment violations |
| Shop GIDs resolve from public domains via `search_catalog` + domain match | U-3 |
| There is no empty result set; a no-match scoped query returns the shop's general catalogue | U-4 T3, T1∩T3 = 0 |
| `metadata.tech_specs` is populated on ~99% of products | 199/200 across U-4 |
| Shopify's inference is **accurate** — ~1.7% error at n=59, 0/9 fitment errors | inference-accuracy probe, hand-labelled |
| Shopify's inference **drops vehicle fitment entirely** on some products, even when the title names the vehicle | inferred-set audit, 6/6 strings read by eye |

Two framings are dead and must not return: *"specs are invisible to agents"* (falsified) and *"Shopify's inference hallucinates specs"* (falsified). Both are in the invalidated-directions register. If a plan you are drafting depends on either, stop and report instead.

---

## 2. The reframe this directive acts on

Read what the pipeline extracted versus what it dropped across the six audited products:

| Extracted | Dropped |
|---|---|
| Caliper material, piston design, friction coefficient, temperature range | Which vehicles it fits |
| Hose pressure rating, fluid compatibility | Which vehicles it fits |
| Spring rate, damping, ride height | Which vehicles it fits |
| Pipe diameter, material, weight, outlet configuration | Which vehicles it fits |

Everything retained is an **intrinsic** attribute — a property of the object itself. The single thing dropped is the **relational** attribute — what the object works with.

**Working hypothesis:** Shopify's inference pipeline systematically preserves intrinsic attributes and drops relational ones. Vehicle fitment is one instance, not the phenomenon.

This matters because the Global Catalog's structured filter vocabulary is `Color`, `Size`, `Target gender` — so relational attributes have **no filter slot and no reliable presence in inferred text**. For any product whose value proposition is compatibility, that is a structural retrieval gap.

This hypothesis is derived from data already in hand. It is not a new premise invented to replace a disappointing number, and the distinction matters: it is falsifiable by the test in §4, and the test is specified before the run.

---

## 3. Prerequisites — instrument hardening (do first, report separately)

Both workstreams below are invalid on the current instrument. Fix these before running anything.

### P-1. Product matching → handle or SKU, never title tokens
Title Jaccard mispaired a Power Stop Z16 with a Z23, and caused MAPerformance and Springrates to contribute zero rows. Implement in this order and record which tier matched each pair:
1. Exact normalised title
2. Variant SKU appearing in the Catalog title or description
3. Storefront handle token overlap
4. Reject — do not fall back to fuzzy title matching

A pair matched at tier 3 or below is flagged for human confirmation in the review sheet.

### P-2. Relational-attribute extractor, hardened on **both** sides
The current extractor fails on prose fragments ("honda decided to"), possessives ("honda s 2.0l"), and slash-merged lists. Required fixes:
- Reject a captured model token if the following token is a verb or auxiliary
- Strip possessive `s` when preceded by a make and followed by a spec token
- Split on `,`, `/`, `&`, and `+` before model capture
- Apply **identical** logic to the merchant side and the Shopify side

That last point is the one that nearly cost this project its finding. An extractor tuned only on the stated set produces a one-directional audit.

### P-3. Side finding to resolve
MAPerformance and Springrates Catalog titles read "Multiple Fitments" where storefront titles name specific vehicles. Determine whether this is a canonical-title collapse by Shopify. If it is, it is a second coverage mechanism and belongs in the findings, not the bug list.

**Report P-1 to P-3 before starting §4.** If the hardened extractor changes the existing auto-parts numbers, report the new numbers and the direction of change.

---

## 4. Workstream A — Generalization probe

**Question:** is relational-attribute drop platform-wide, or specific to auto-parts fitment?

**Design.** Four verticals, each with a clean, closed-vocabulary relational attribute:

| Vertical | Relational attribute | Intrinsic control |
|---|---|---|
| Auto parts | vehicle (make + model) | material, dimensions |
| Device accessories (cases, screen protectors, chargers) | device model | material, colour, dimensions |
| Printer / filter / appliance consumables | machine model | capacity, dimensions |
| Electronic components | cross-reference / equivalent part number | package, voltage, current |

For each vertical: **3+ stores, 15+ scored products**, stratified thin (<500 chars source) vs rich (>3000 chars). Stratification is not optional this time — it was designed into the last probe and never ran, which is why that probe cannot answer whether inference degrades on sparse input.

**Metrics, per product:**
- `relational_recall` = |inferred ∩ stated relational entities| / |stated|
- `intrinsic_recall` = same, over the vertical's intrinsic control attributes
- `relational_zero_rate` = share of products where the merchant states a relational attribute and inference returns **none**

The intrinsic control is essential. Without it you cannot distinguish "inference drops relational data" from "inference is lossy in general."

### PRE-REGISTERED DECISION RULE — fixed 2 Aug 2026, before any run

> **H1 confirmed (platform-level):** `relational_zero_rate` ≥ 0.20 in **at least 3 of 4** verticals, AND mean `intrinsic_recall` exceeds mean `relational_recall` by ≥ 0.25 in those verticals.
>
> **H1 rejected (vertical-specific):** the pattern holds in auto parts only. Report it as an auto-parts finding and do not generalise.
>
> **H1 inconclusive:** fewer than 3 verticals reach 15 scored products, or the intrinsic control is unmeasurable. Report as inconclusive. Do **not** substitute a different metric.

Do not adjust these thresholds after seeing results. If you believe a threshold is wrong, say so in the report and leave it unchanged.

---

## 5. Workstream B — The retrieval loop that has never run

This is the project's original position and the only thing that translates a mechanism into a commercial claim. A merchant does not care that `tech_specs` is an incomplete extraction. They care whether *"brake pads for a 2018 Civic Si"* surfaces their product or a competitor's.

**Scope: minimal and in-memory.** Do **not** provision Postgres, pgvector, Redis or Inngest for this. n is small enough to hold in memory, and standing up infrastructure before the measurement is proven is scaffolding-for-later, which remains a hard non-goal.

**Loop:**
1. **C4 — freeze the query set.** From real inventory in one vertical, generate queries across ≥3 archetypes, at least one of which is explicitly relational ("brake pads for a 2018 Civic Si"). **Freeze and commit the query set before issuing a single Catalog call.** A query set that can be regenerated after seeing results makes the study unfalsifiable.
2. **C3 — issue** each query scoped via `filters.shops`, capture full request and response.
3. **C5 — resolve expectations by hand.** ≥50 query-product pairs, hand-labelled `should_match` / `partial` / `should_not_match` with a written rationale per pair. No LLM adjudication at this stage: the ground truth for the first calibration set must be human, or the published agreement figure is worthless.
4. **C6 — score:** `recall@10`, `recall@50`, `best_rank`, `retrieval_rate`, `competitor_displacement`.

**The prediction to test:** products where inference dropped the relational attribute should show materially worse retrieval on relational queries than on intrinsic ones, within the same store. Report those two populations separately. If dropped-relational products retrieve *fine*, the mechanism has no commercial consequence and that is a major finding in its own right — report it plainly rather than looking for a metric that rescues the story.

Remember: there is no empty result set. Every returned product must be relevance-judged; absence of a match never appears as an empty response.

---

## 6. Governing documents — permission boundary

**You may update without asking:** §2 verified platform facts (with dates), §2.7 unknowns, feature status tables, §6 metric definitions, §8 test strategy, changelogs, version numbers.

**You may not change:** BLUEPRINT §1 (mission), §2.2 (the opening / premise), §3 (invalidated directions), §5 (phases and gates), or any pre-registered threshold. These change by directive only.

§1 and §2.2 have now been rewritten and reverted twice. That churn is the information-flow loss this directive exists to stop.

**Add to the invalidated register:** the inference-accuracy reframe, with its evidence (1.7% error, n=59, 0/9 fitment errors) — so no future session rebuilds on it.

**Record in §5 or a new §5.1:** the three-week timebox is withdrawn. Milestones are now evidence-gated, not calendar-gated. Gate A's inbound-conversation threshold is suspended pending redefinition by directive; do not invent a replacement.

---

## 7. Hard non-goals — unchanged

No App Store listing. No billing. No multi-tenancy. No merchant OAuth. No SaaS scaffolding built for later. No public UI work — `/`, `/methodology`, `/dataset` stay empty route stubs, and `robots: noindex` stays on. No infrastructure provisioning (Postgres, pgvector, Redis, Inngest) until a measurement proven at small n requires scale.

U-5 remains a background calibration task. Seed it if the Admin API token exists; do not block on it.

---

## 8. Required report format

Return the follow-back report in exactly these sections. Brevity is fine; omission is not.

**1. Executed / Not executed** — what ran, what didn't, and why not. List anything you chose not to do.

**2. Raw numbers, before any correction** — the instrument's unmodified output.

**3. Corrections applied** — each one, and **the direction it moved the result**. State explicitly whether corrections were applied to both the merchant side and the Shopify side.

**4. Verification performed** — what you checked by eye, and what you did not check. If a number rests on a small set of decisive cases, name those cases and confirm each was inspected individually.

**5. Deviations from pre-registration** — sample size, stratification, store count, thresholds. Every deviation, including ones that seem harmless, with the direction each moves the headline.

**6. Verdict against the pre-registered rule only** — confirmed, rejected, or inconclusive. Do not offer a verdict the rule does not license, do not recommend scaling a sample to find a signal absent at current n, and do not propose a new metric or framing. If you think the framing is wrong, say so in §8 and stop there.

**7. Artifacts** — file paths for every review sheet, transcript, and script.

**8. Surprises, blockers, and disagreement** — anything unexpected in the data, anything that blocked you, and anything in this directive you think is mistaken. This section is where judgment belongs; keep it out of §6.

**Attach:** review sheets and transcripts as files. Do not summarise a number without the artifact behind it.

---

## 9. Order of execution

1. §3 prerequisites (P-1, P-2, P-3) → **report before proceeding**
2. §4 Workstream A → report
3. §5 Workstream B → report

Stop and report between stages rather than chaining them. A prerequisite that silently changes the auto-parts numbers changes what Workstream A means, and that has to be visible before Workstream A runs.
