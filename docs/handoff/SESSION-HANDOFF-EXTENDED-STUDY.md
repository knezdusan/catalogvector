# CatalogVector — Session Handoff: Extended Verification, Publication & Syndication

**Issued:** 4 August 2026
**From:** the advisory session that ran DIRECTIVE-3 through DIRECTIVE-18
**To:** the dedicated session that will run the extended study, the whitepaper, and the syndication campaign
**Read first:** `docs/BLUEPRINT.md` and `docs/TDD.md` in `github.com/knezdusan/catalogvector`. Devin has maintained both rigorously; they carry the verified platform facts, the metric definitions, the pre-registered thresholds, and the changelog of every strategy shift. Also read `docs/reports/platform-facts-register.md` — thirteen entries, and the one artefact this project owns outright.

---

## 0. The one thing to internalise before anything else

The founder is a solo full-stack developer in Belgrade, not a team. He has spent roughly three months on this. He is technically capable of executing anything you specify, he has pushed back correctly on the advisory session more often than the advisory session pushed back on him, and he is right to be sceptical of confident conclusions.

**The previous session's single largest failure was not a wrong answer. It was closing viable paths on first contact with disappointing data.** Eighteen cycles, nine dead hypotheses, and an option inventory that grew every cycle and was never once executed. Read §7 before you write your first directive.

---

## 1. Orchestration

**You are the strategic and technical advisor.** You do not write code. Devin executes everything — it has full filesystem access, MCP servers, agent skills, browser automation via Playwright, and the Shopify UCP CLI with a working `catalogvector` profile.

**The cycle is:** the founder brings a Devin report plus artefacts → **you open the artefacts yourself** → you reason forward, generating options alongside verdicts → you emit the next directive with tasks, reasoning, missing context, pre-registered thresholds, and the required report format.

**Two duties, equal weight.** Duty A: falsification — check claims against raw artefacts, never against summaries. Duty B: option generation — every invalidation produces branches, and §7 defines what that must actually mean.

**Directive delivery discipline.** Three directives were lost in transit last session (Addendum A, #6, #9), and one caused a substituted experimental design that produced a false verdict. **Every directive is committed to `docs/directives/DIRECTIVE-N.md` and pushed before work begins, and every report's §1 opens by listing the directive files it read with commit hashes.** A directive that cannot be cited by hash was not received.

---

## 2. The mandate

**Task 1 — Extended verification, designed as a study.** Not a confirmation sweep. See §3.

**Task 2 — Industry-grade whitepaper.** Outline exists at `EVIDENCE-SHEET-AND-PROTOCOL.md` and `WHITEPAPER-OUTLINE.md`. Gated by §6.

**Task 3 — Syndication campaign.** Put the paper in front of the target audience. Repo is public; the register and the code back every claim.

**Task 4 — Outreach.** Five emails drafted in `OUTREACH-EMAILS.md`. Gate A's clock starts at first contact. Two merchants, three brands — the brand hypothesis is the untested one.

**The session ends at publication and send.** Feedback triage and the Gate A verdict are a short follow-up session weeks later, reading results against a rule that already exists. A mandate containing "conclude on success or failure" has no natural end and will drift.

**Explicitly not a task:** boosting the founder's profile or CV. That is a byproduct of publishing good work, and a methods paper optimised for personal visibility stops being citable. It is the one goal that gets worse when aimed at directly.

---

## 3. Task 1 — this is a study, not a verification sweep

A confirmation run asks "is 13–20% right?" and returns a number. **The same cost, designed differently, asks a question with a thesis attached.**

**The design question:** does catalogue absence vary by vertical, and does it track `surface_trigger_rate`?

You already have 0% card-firing in outdoor gear against 67% in auto parts, from a 24-query probe. If absence *also* varies by vertical and the two correlate, that is a new finding, it is the C-4 vertical-selection decision that was never made, and it gives the paper a thesis rather than a statistic.

**Scope:** 15–20 stores across 3–4 verticals. Auto parts is the sandbox and the baseline; the others are the contrast. Per store: sitemap enumeration, full metadata, rebuilt partition of 500–700 scoped queries, plus a reference standard of ~500 queries for a random sample. Roughly 1,200 queries and a supervised run each.

**Two things the extended run must fix, both of which are current weaknesses:**

- **Attribution needs real n.** Products present in the Catalog under *other* sellers' names sits at n=12, one store. That is the weakest evidence attached to the most commercially interesting claim, and it is the finding a brand buyer would respond to. Measure `attribution_loss_rate` across every store in the study.
- **Recall degrades with catalogue size** — 97.7% at 2,608 products, 88.8% at 18,067, **56.6% at 102,176.** Large catalogues are where the money is and where the instrument is worst. Either sitemap-derived partitioning fixes it, or the paper says plainly that the method works on small catalogues and degrades on large ones.

**Every store runs through the invariant library.** No probe issues raw CLI calls. Every number carries source file, commit hash, and which invariants passed.

---

## 4. Settled facts — do not re-litigate

| Fact | Evidence |
|---|---|
| `filters.shops` is a hard restriction, including at depth | U-4, zero containment violations |
| A scoped no-match query returns the shop's general catalogue, never empty | U-4 |
| The Catalog returns **per-merchant rows**, not UPID clusters — one variant, one seller, no shared product identity | 900 products + a corrected-pagination re-check, 300 rows / 248 distinct IDs |
| `total_count` is a **response budget**, not a match count — 7 unrelated queries returned 361–387 | Register entry 13 |
| The first ~50 ranks are deterministic; beyond that positional agreement is 0%, set Jaccard ~0.48 | Three-run probe, corrected pagination |
| **Rank-based absence testing is invalid on this API** | Follows from the two above |
| `/products.json` is exhaustive below 25,000 products; Shopify caps at 100 pages × 250, HTTP 400 beyond | Instrumented re-fetch, three stores |
| No endpoint enumerates a store's Catalog presence; `lookup_catalog` takes opaque IDs that don't map to store IDs | Register entry 10, 54% false-negative rate measured |
| Cursor pagination overlaps 1.6–8.1% between pages | Register entry 12 |
| Shopify's inference omits ~60–70% of stated vehicle fitments | Compliant 4-store sample, 0.385 corrected recall |
| Absence rates: 13.0% / 20.0% / 17.0% across three auto-parts stores, all upper bounds, n=100 each | Union presence, Wilson intervals |
| ChatGPT renders product cards for ~42% of buying-intent queries; 0% outdoor gear to 67% auto | 24-query probe |
| Shopify Catalog products **do** reach ChatGPT cards — confirmed via `shop.app` and a named merchant domain | U-6-R |
| ~1.88% run-to-run variance in recovered handles from API non-determinism | Same query set, two runs |

---

## 5. Nine dead hypotheses — none is resurrected without new evidence of a different kind

Each died with a pre-registered rule. **Six of the nine died on instrument error, not on data.** Only H9 died cleanly on evidence.

| | Hypothesis | Killed by |
|---|---|---|
| H1 | intrinsic vs relational attribute drop | superseded, never generalised |
| H2 | truncation by source length | inconclusive, one vertical, control never run |
| H4 | title coverage predicts retrieval | category confound — 8 of 8 treatment queries were brake pads, 0 of 6 controls were |
| H4-R | H4 replicated at TSP | design unexecutable; TSP is 94% title-present |
| H5 | offer attachment / "AI buy box" | no shared product identity exists — confirmed twice, second time with corrected pagination |
| H6 | `shop.app` predicts card appearance | shop.app returns everything; 2/20 agreement |
| H7 | per-product syndication eligibility | built on a shop.app finding misread as a Catalog finding — an advisor error |
| H8 | Catalog serves stale products | 401 direct fetches, 401 live products, zero 404s |
| H9 | absence predictable from public attributes | rejected on lift; no attribute beats base rate |

**H5 and H8 in particular.** An external advisor previously argued both were "back on the table" after the pagination bug surfaced. They are not. H5's killing evidence was *reproduced by the corrected instrument*, and H8's test involved no pagination at all. Reopening either would resurrect a dead premise, which `BLUEPRINT.md` §3 exists to prevent.

**Also closed:** the pitch *"we identify which of your products are structurally invisible, why, and fix it."* H9 killed it on data.

---

## 6. The gate — it scopes claims, it never closes the session

This is the amendment the founder cared about most, and the phrasing matters.

**A gate governs what you may claim. It never governs whether you continue.**

Before Task 2, register a rule of this shape and write it down before the data exists:

> **Findings hold across verticals** → the paper carries a general claim, and syndication targets the broad Shopify audience.
> **Findings vary materially by vertical** → the paper's thesis becomes the variation itself, which is a *better* result, and syndication targets the verticals where the number is largest.
> **Findings collapse** → the paper becomes a negative-result methods paper. Publication proceeds. Outreach does not.

**Note what is absent: there is no branch that produces nothing.** That property is the reason this extension is worth four to six weeks, and any gate you write must preserve it. If you find yourself drafting a rule whose failure branch is "stop," you have written the wrong rule.

---

## 7. The branch rule, with the teeth it lacked

Last session's branch rule required that every invalidation produce ≥3 options, at least one orthogonal, each with its cheapest killing test and its worth if true. **It was satisfied every single time and executed zero times.** Options accumulated in inventories across eighteen cycles while the next hypothesis took the stage.

**The mechanical fix, and it is not optional:**

1. When a gate fires or a finding weakens, produce the branch set as before.
2. **At least one branch becomes a numbered stage in the very next directive**, with a task, an owner, and a report requirement. Not an inventory line. A stage.
3. **No directive may register a new hypothesis while an un-executed branch from a previous cycle is outstanding.** The branch runs first or it is formally closed with a stated reason.
4. Every directive's opening section lists the outstanding branch inventory. **An inventory unchanged across two consecutive cycles means Duty B has stopped**, and the directive must say so out loud.

Branches never executed last session, in case any are still live: monitoring versus one-shot audit (needs a same-day noise floor first — 1.88% variance would otherwise manufacture the finding) · competitive displacement as a product · surface-render rate by query class · enumeration as a licensed data capability · adjacent surfaces, Shop / Google & YouTube / Meta · a different commercial vertical.

---

## 8. Failure modes this session actually hit

Not theorised. Each of these happened, and the cost is stated.

1. **Instrument error mistaken for evidence, six times.** Pagination corruption, product-versus-seller confusion, cross-surface conflation, a one-character domain mismatch, a handle-matching artefact, a truncated fetch. The pattern was visible by roughly cycle eight and named at fifteen. **Costliest failure in the session.**
2. **Advisor errors caught by the agent, three cycles running.** Devin caught the H9 threshold, the shop.app conflation, and its own unlicensed −0.333 verdict. Read Devin's §8 sections closely; they are frequently better than the summaries above them.
3. **Summaries contradicted by their own report bodies**, at least four times. "Exhaustion confirmed" from a run that stopped at 50. "Tail inspection CONFIRMED" for an arm that never ran. Always read §2 and §4 against §6.
4. **Selection dressed as measurement.** A ground truth that labelled products "present" if keyword search found them, then scored keyword search against it. A population table that excluded exactly the misses.
5. **Zero external contact for eighteen cycles.** Every directive ended with "not authorised: any outreach" while its body argued demand was the only unmeasured variable. That contradiction guaranteed the outcome.
6. **Numbers quoted without denominators or intervals.** A presence rate without its baseline is uninterpretable, and one such figure was elevated to "the most important number this project has produced" before anyone opened the transcript.

---

## 9. Claim boundary — in force, and it applies to the paper

**What can be said:**

> Across three public Shopify auto-parts catalogues, 13–20% of products were not detected in the Global Catalog by either of two independent methods (per-store 95% CIs: 7.8–21.0%, 13.3–28.9%, 10.9–25.5%; all upper bounds, n=100 per store). At one store, 9 of 12 tested products were present under other sellers' names and none under the store's own — a lower bound. ChatGPT renders product cards for ~42% of buying-intent queries, 0% in outdoor gear to 67% in auto parts. Shopify's inference omits ~60–70% of merchant-stated vehicle fitments on a compliant four-store sample.

**What cannot be said, under any framing:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> That absence is random — only that it is unpredictable from the public attributes tested, at this power.
> That absence costs sales — **no revenue link has been established.**
> That consumer assistants do not use Shopify's Global Catalog — falsified by direct observation.
> That the enumeration is a general capability — 97.7% at 2,608 products, 56.6% at 102,176.
> Any US claim about Google AI behaviour.
> Any prevalence claim beyond the stores measured.

Use **"not detected in the catalogue surface we measured"** rather than "absent." The method has recall limits and the phrasing must carry them.

---

## 10. Open items

- Attribution measurement per brand — **required before brand outreach can be sent** (`OUTREACH-EMAILS.md` B1–B3)
- Same-day noise floor before any longitudinal or monitoring claim
- MAP sitemap-derived partition; does recall clear 85%
- Does the merchant admin already expose syndication status — **answered for free by Question 1 of the call script**, no separate probe needed
- Gate A: two paid diagnostics at ≥€500 each or one paid pilot at ≥€2,500, 8–10 weeks from first contact. **The €500 tier was subsequently removed** — a one-off €500 is consulting curiosity, not demand

---

## 11. What is actually being defended here

Not a product. A measurement nobody else can currently produce, an instrument that took fifteen cycles to make trustworthy, and a register of thirteen documented cases where a major platform's documentation contradicts its own behaviour.

**The durable asset is the citation position** — becoming the reference for *how do you measure Shopify Catalog membership*. That outlives the traffic, the venture, and probably the API.

Which argues for precision over polish. Resist any pressure to turn the paper into a marketing artefact; over-designing it destroys the one property that makes it worth citing. And publish §5 — the nine rejected hypotheses, including the advisor's own threshold error — because almost nobody in this category publishes what they tested and killed, and that section is what makes the document citable rather than skimmable.
