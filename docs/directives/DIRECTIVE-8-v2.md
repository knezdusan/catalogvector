# CatalogVector — Directive #8 (v2)

**Issued:** 2 August 2026
**Replaces:** the DIRECTIVE-8 draft in full. That draft was never transmitted to Devin; this is the version of record.
**Supersedes:** DIRECTIVE-7 §9 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-7, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What changed from the draft

An external audit was reviewed. Three of its points changed this directive:

1. **The documented pagination limit is 1,000.** The draft's U-7 rule set the CORPUS threshold at "≥900" — which sits directly on the documented hard cap and would therefore have been unable to distinguish a large corpus from the cap itself. The rule is restructured in §1 with three outcomes rather than two.
2. **A third outcome exists between CAP and CORPUS: a relevance THRESHOLD.** It is probably the most likely result and it is commercially the most interesting of the three. The draft did not contain it.
3. **The draft over-framed U-7.** It presented one fifteen-minute test as deciding the project. U-7 decides the meaning of "absent at depth." It does not decide whether a business exists. §6 sets out what actually decides that, in advance.

One claim in the audit is **factually wrong and must not propagate:** *"Gate A remains undefined."* Gate A was defined in DIRECTIVE-4 §8 and ruled on by the founder — compound G3/G1, clock from first outbound contact, 8–10 week window, floor of two paid diagnostics at ≥€500 or one paid pilot at ≥€2,500. What is true is that **the clock has never started** because no contact has been made. Undefined and unstarted are different problems with different fixes.

---

## 1. U-7 — what the ~300 boundary is (blocking)

### 1.1 Evidence already in hand, before any probe

Exhaustion counts range 273–385 at a page size of 50. A hard count cap at 300 would produce 300, 300, 300. These endings are ragged and their final pages are partial:

| Observed | Full pages | Final page |
|---|---|---|
| 273 | 5 | 23 |
| 318 | 6 | 18 |
| 385 | 7 | 35 |

**The data already leans away from a hard count cap.** It cannot yet separate a genuine corpus from a relevance boundary. That is what the probes are for.

### 1.2 Treat the documented 1,000 limit as a hypothesis, not a fact

The 1,000-result pagination limit comes from Shopify's documentation. In this project, Shopify's documentation has been wrong about its own Catalog three times: UPID clustering (killed H5 in Stage 1), `tech_specs` population, and agent-profile approval lead time. Every one was corrected by opening a payload.

**Establish the pagination ceiling empirically.** Do not cite the docs for it. If a query genuinely exceeds 1,000, paginate until `has_next_page` is false and report the exact terminating count and whether the final page was partial.

### 1.3 Probes

| Probe | Query | Purpose |
|---|---|---|
| U7-A | `brake pads` | Generic, in-vertical |
| U7-B | `running shoes` | Generic, out-of-vertical — tests category independence |
| U7-C | `Paragon PBP370` | Maximally narrow — establishes the floor |
| U7-D | `zxqv flurbin widget` | Nonsense — tests for an unscoped floor, as U-4 found for scoped |
| U7-E | Progressive broadening on `paragon-pbp370` | `brake pads for 2018 Honda Civic Si` → `brake pads Honda Civic` → `Honda Civic brake pads Paragon` → `Paragon brake pads`. Record set size and target rank at each step |

Record for every probe: `total_count`, exhaustion count, page count, final-page size, `has_next_page` at termination, and distinct seller count.

U7-E is the sharpest of the five. It holds the product constant and varies only query specificity, so it shows whether the target crosses into the set at some breadth — and at what rank when it does.

### PRE-REGISTERED DECISION RULE — U-7, fixed 2 August 2026, before any run

> **CAP** — U7-A and U7-B both terminate within 250–400 with a *full* final page. The boundary is a response ceiling; "absent at depth" means rank beyond it; the Stage 2 and Stage 3 invisibility findings are re-classified as deep ranking and their merchant-facing implication is withdrawn.
>
> **THRESHOLD** — U7-A and U7-B terminate at materially different counts from each other and from the relational queries, with partial final pages, and U7-E shows the target entering the set as the query broadens. The boundary is a relevance score cutoff. "Absent" then means **scored below the retrieval bar** — no amount of pagination reaches the product. This is neither pure ranking nor pure absence and it must be described as what it is.
>
> **CORPUS** — U7-A and U7-B terminate at or near the empirically established pagination ceiling with `has_next_page` false and full final pages, while relational queries terminate at ~300 with partial pages. The ~300 is genuine matching-set sizing and absence from it is meaningful.
>
> **INCONCLUSIVE** — any other pattern, or U7-D returns a populated set, in which case an unscoped floor exists and the tail of every result set is padding rather than matching. That must be characterised before any presence figure in the project is interpreted.

**THRESHOLD is a live commercial outcome, not a consolation prize.** "Your product scores below the bar the retrieval system uses, and here is a competitor's listing of the same part that clears it" is diagnosable, checkable and merchant-actionable. Report it plainly if that is what the data shows.

---

## 2. Verdict corrections (unchanged from the draft)

**2.1 — H2 is INCONCLUSIVE, not "not supported."** The rule (DIRECTIVE-4 §5) needs the quartile contrast in ≥2 verticals for support and <0.10 in ≥3 for rejection. Stage 5 covered one vertical, used thin/rich buckets rather than length quartiles, and skipped the mandatory first-occurrence-offset control.

**2.2 — H4-R is UNRUN, not rejected.** DIRECTIVE-6 §3 specified a paired-query design at TSP — title-absent and title-present products from the same store and category tested inside the same query. Stage 4 ran a different store, unpaired, both arms at the floor. That is not the registered experiment, so no verdict attaches, including the floor-effect reading. Devin never received DIRECTIVE-6 (see §3); this is a delivery failure, not an execution failure. Record the Intec Racing run as an **exploratory store-level observation**, which is where its real value lies.

**2.3 — The Stage 5 causal claim is struck.** *"A product whose `tech_specs` omits a vehicle cannot be retrieved by an agent searching for that vehicle"* is contradicted twice by this project's own data: H3 measured dropped-relational products at `presence@50` = 0.429, and Stage 5 reports 6 of 10 TSP products with zero inferred vehicles while Stage 1 reports TSP holding rank 1 in 5 of 14 relational queries.

**2.4 — "The coverage gap is the root cause; the three mechanisms are surface symptoms"** is struck as unsupported. H4 points the other way. On current evidence the coverage gap and the retrieval mechanisms are parallel and largely independent.

**2.5 — COVERAGE GAP CONFIRMED is accepted.** 18 scored across 4 stores meets DIRECTIVE-4 §1.2, set blind. Raw 0.285, corrected prefix 0.385, strict 0.313 — all far below 0.80, and the hand corrections moved the number *toward* the threshold, against the finding. First pre-registered rule to fire on a compliant sample.

**Caveat recorded alongside it:** 12 of 19 products hand-corrected by the same agent that built the extractor, on the sample being measured, no held-out set. The verdict survives that; per-store figures (MAP at 0.04, n=4) do not and must not be quoted.

---

## 3. The delivery pipeline (do this first)

Devin's Stage 1 log records *"No DIRECTIVE-6 file exists."* It reconstructed H4-R from secondary references, which fully explains the design substitution in §2.2. This is the second directive lost in transit; DIRECTIVE-3 Addendum A was the first.

**Required:** every directive is committed to `docs/directives/DIRECTIVE-N.md` and pushed before work begins on it, and every report's §1 opens by listing the directive files read, with commit hashes. **A directive that cannot be cited by hash was not received.** Commit DIRECTIVE-6 and this directive now.

---

## 4. Zero-cost work on data already on disk

No API calls. ~5,400 rows across 18 exhaustive queries.

**4.1 — Page-boundary audit.** For every one of the 18 queries, report page count, final-page size, terminating `total_count`, and terminating `has_next_page`. This is §1.1's evidence at full n and it may resolve U-7's CAP branch before a single probe runs.

**4.2 — Domain concentration.** Distinct seller domains across all rows; top-20 domains by appearance count; their share of all slots and of top-10 positions; the four intrinsic queries reported separately.

This answers a question nobody has asked — **who actually occupies the Global Catalog for real buyer queries in this vertical** — and it is publishable on its own, independent of U-7's outcome and of any merchant's defect.

**4.3 — Test the scoped-fallback assertion.** Stage 2 finding 5 asserts the Stage 2 scoped ranks were U-4 fallback. U-4 established fallback fires on *total* miss, and a scoped query against a store that stocks matching brake pads is not a total miss. Issue two semantically unrelated scoped queries against TSP and report the Jaccard overlap of their result sets. High overlap indicates store-general fallback; low indicates genuine matching at a lower relevance bar. This determines whether the Stage 2 scoped dataset is an artefact or a valid low-bar measurement.

**4.4 — The platform-facts register.** Compile every case where this project established, from payloads, that Shopify's public Catalog documentation is wrong or incomplete — UPID clustering, `tech_specs` population, agent-profile approval, the `tags` string-not-array schema, the scoped no-empty-result fallback, `filters.shops` as a hard restriction, and the pagination behaviour once §1 resolves. Each entry: the documented claim, the observed behaviour, the JSON path or transcript that shows it, and the date.

**This is the one publishable artefact the project already owns outright.** It depends on no hypothesis, cannot be over-read, is checkable by anyone with an API key, and is exactly what establishes standing with the people who would eventually pay. Produce it as a document; publication is a separate decision.

---

## 5. Store-level visibility

The most concerning of the three mechanisms, n=1, and the cheapest to strengthen. If it holds it is a larger claim than anything per-product — an entire store absent is an owner-level conversation.

**5.1 — Diagnose Intec Racing.** Apply Stage 3 Sub-study A's design (brand + SKU queries) to Intec's products.
- **Findable by brand/SKU, absent by natural language** → the IV02 mechanism at store scale.
- **Not findable at all** → an enrollment or catalogue-linking defect. Trivially diagnosable, immediately actionable, and the most sellable single defect this project could find.

**5.2 — Store-level visibility scan, 10 stores.** Five natural-language relational queries derived from each store's own inventory, plus five brand+SKU queries. Report `store_presence_rate` per store per condition. **No hypothesis, no threshold** — descriptive, reported as a distribution.

---

## 6. The stop/continue gate — pre-committed now, before the data

The founder's question is whether this is a wishful-thinking loop. The answer should not depend on how the next report feels. It is fixed here.

Two tests define the outcome space. **U-7** decides what "absent" means. **U-6** decides whether the Catalog is the outcome surface or a proxy for it.

| | **U-6: rank predicts assistant output** | **U-6: it does not** |
|---|---|---|
| **U-7 = CORPUS or THRESHOLD** | **Strongest case.** Invisibility is real and maps to what buyers see. A diagnostic is defensible. Start the demand probe immediately; Gate A's clock starts at first contact | **Redirect.** The Catalog finding is real but is not the buyer outcome. The assistant layer becomes the measurement surface and the Catalog work becomes infrastructure. Continue, with the commercial claim rewritten around what assistants actually surface |
| **U-7 = CAP** | **Narrow.** The invisibility line is dead; what survives is the title effect and the coverage gap, with much reduced claims. One more cycle to establish whether the title effect replicates under the registered H4-R design — and if it does not, stop | **STOP.** The measurement surface is a proxy and the invisibility claim is deep ranking. Publish §4.4 and the negative result, take the artefact and the credential, and close the programme. This was recorded in advance as a successful outcome (`BLUEPRINT.md` §5) |

**No new mechanism, hypothesis, or metric may be introduced before U-7 and U-6 both report.** Generating a fourth mechanism at n=1 while these two remain unrun is what the loop looks like from inside it.

---

## 7. The claim boundary

Adopted as the project's operative language until further evidence. **What can be said now:**

> On a four-store sample in performance auto parts, Shopify's inference omits roughly 60–70% of the vehicles the merchant states. On the two stores measured, products whose titles omit the vehicle are markedly less likely to appear for natural-language fitment queries, while the same products remain findable by brand and SKU. A small number of products with apparently adequate titles are absent while competitors selling the same brand are present.

**What cannot be said, and what no document, message, or conversation may imply:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."

The distance between those two statements is the distance between a research programme and a service. Nothing in this directive closes it.

---

## 8. Order of execution — sequential, no parallel science

1. **§3 pipeline fix** → then **§4.1 page-boundary audit** (zero cost, may pre-resolve U-7) → then **§1 U-7 probes** → report
2. **§4.2 domain concentration, §4.3 fallback test, §4.4 platform-facts register** → report
3. **§5 store-level diagnosis and scan** → report
4. **DIRECTIVE-6 §3 H4-R, as registered, at TSP** → report

**Founder-owned, outstanding four cycles, blocking on nothing and blocking §6:**
- **U-6** — the same relational queries put to ChatGPT, Copilot and Gemini; record which merchants and products each names; compare against unscoped rank. One afternoon, no code. Half of §6's decision table.
- **The C5 blind relabel** — 20 pairs including all 14 `partial`s. The sheet and scorer are built and committed. One hour.

**Not authorised:** any merchant-facing document, any outreach, any language asserting a measured effect on a real store. §7's boundary applies to every artefact produced under this directive.
