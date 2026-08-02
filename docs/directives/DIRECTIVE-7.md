# CatalogVector — Directive #7

**Issued:** 2 August 2026
**Supersedes:** DIRECTIVE-6 §2 (the retrieval-level framing) and DIRECTIVE-6 §5.1 (the per-store artefact).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-6, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. Why this directive exists

DIRECTIVE-6 §2 elevated a pooled `presence@50` of 0.500 to *"the most important number this project has produced"* and DIRECTIVE-6 §5.1 instructed a merchant-facing artefact to be built on it. **Both are withdrawn.** The reasoning behind them is set out below so the error is on the record and not repeated.

No merchant-facing artefact is produced under this directive. Nothing here is written to be shown to a store owner. This directive establishes only whether a defensible claim exists.

---

## 1. Why the 0.500 figure cannot carry a claim

### 1.1 The 16 products are two experimental arms, not a sample

Seven were selected because Stage 1 found **zero** inferred vehicles in their `tech_specs` — the treatment arm of a hypothesis about relational-attribute drop. Nine were selected as matched retained controls. They were chosen to differ on a variable hypothesised to affect retrieval.

Pooling them and reporting the result as a store-level rate is reporting a trial's treatment and placebo arms together as a population prevalence. This is not a sample-size problem and no amount of additional n from the same selection rule fixes it. **The 0.500 figure does not generalise to a catalogue and never could.**

### 1.2 `presence@50` unscoped has no baseline, so its sign is unknown

Unscoped, the Catalog returns 50 results drawn from the entire global corpus. If S listings genuinely match a query, a listing has a baseline chance of roughly 50/S of appearing.

| Competing listings S | Baseline P(top 50) | Observed 0.500 is |
|---|---|---|
| 60 | 0.833 | worse than chance |
| 100 | 0.500 | at chance |
| 500 | 0.100 | 5× better than chance |
| 3,000 | 0.017 | 30× better than chance |

For 0.500 to indicate a defect, fewer than ~100 listings would have to match "brake pads for a 2018 Honda Civic Si" across all of Shopify. That is implausible by orders of magnitude.

**On the plausible range of S, 8 of 16 products from one store reaching the global top 50 is a strong competitive showing, not a failure.** The claim may be inverted. Nobody knows, because no query in Stage 2.5 recorded a denominator.

### 1.3 Being outside a global top 50 is ranking, not invisibility

If 2,000 merchants list a part, 1,950 of them are outside the top 50 by arithmetic necessity. That is a competitive position. Every store owner already knows competitive positions exist, which is exactly why "half your products are invisible" would not survive first contact with a $10M operator — the correct response is *"so is everyone else's, what's your point."*

The founder's prior — that a defect this obvious would already have been found and closed by Shopify or a competitor — is correct, and this is its explanation. Nobody closed it because it is not a gap.

### 1.4 The transcript was never opened

The advisory session elevated Devin's summary figures to a headline without reading `unscoped-2026-08-02T15-44-54-483Z.json`. The project's own method (session handoff §9) is that every real finding came from opening the raw artefact rather than trusting a summary, and this is the fourth time in the project's history that a summary has been over-read. That this instance was the advisor's own is the reason it is written into a directive rather than mentioned in passing.

---

## 2. The distinction that decides whether there is a business

**Ranking** — the product appears, at rank 63, behind competitors selling the same thing. Not a defect. Not diagnosable. Not sellable.

**Structural invisibility** — the product does not appear at any depth, for any query naming its exact vehicle and category, *while other merchants' listings of the identical part do appear*. That is a defect, it has a cause, it is fixable, and it survives inspection.

Every measurement in this project so far has measured the first while claiming the second. Stage 3 tests whether the second exists.

---

## 3. H5 — offer attachment, and why it may be the actual finding

`TDD.md` §2.4: *results cluster by Universal Product ID (UPID) with offers from multiple merchants.*

If results are UPID clusters carrying multiple merchant offers, then "the target product did not appear" is ambiguous between two entirely different events:

- **(a)** the UPID cluster did not rank — ordinary ranking, no finding
- **(b)** the cluster ranked, and the target merchant's offer was not attached to it — a catalogue-linking failure

**(b) is structural, merchant-diagnosable, independent of ranking, and unpublished.** "Your competitor's listing of EBC DP31210C is offer 1 on the cluster that ranks 4th, and your listing of the same part is not attached to that cluster" is an audit finding that a store owner cannot dismiss as SEO.

**This is untested and may not exist.** It is registered here as a hypothesis with a cheap killing test, not as a finding.

### PRE-REGISTERED DECISION RULE — H5, fixed 2 August 2026, before any run

> **Design.** Take **≥20 part numbers** stocked by at least two Shopify merchants, spanning ≥3 brands, identified from the four ingested stores. For each: issue an unscoped Catalog query for the part number and for its vehicle+category, resolve the UPID cluster, and enumerate the merchant offers attached to it. Separately confirm from public storefront JSON which of those merchants actually stock the part.
>
> **`offer_attachment_rate`** = (merchants attached to the cluster) / (merchants confirmed stocking the part).
>
> **H5 supported:** `offer_attachment_rate` ≤ 0.70 across ≥20 part numbers, with ≥5 confirmed cases where merchant A is attached and merchant B, stocking the identical part, is not.
>
> **H5 rejected:** `offer_attachment_rate` ≥ 0.90.
>
> **H5 inconclusive:** anything between, or fewer than 20 part numbers resolved, or clustering cannot be resolved from the response shape.

**First, and before any of the above:** determine from `unscoped-2026-08-02T15-44-54-483Z.json` whether the response actually clusters by UPID with multi-merchant offers, or returns per-merchant rows. Report the answer with the exact JSON path. If it does not cluster, H5 as written does not apply and the report says so rather than adapting the hypothesis.

---

## 4. Re-score the existing unscoped data — no new API calls

All of this is on disk. None of it produces a claim; it establishes what was measured.

**4.1 — Lock the presence definition and state it.** For each of the 16 targets, on what basis was "present" decided — variant GID, storefront handle, UPID, or title similarity? Re-score with an exact identity rule and report both the original and re-scored figures. If the original used title matching, say so; Stage 1 established that title matching mispairs.

**4.2 — Record the denominator per query.** Distinct seller domains in the top 50, and the reported `total_count` estimate. `total_count` is an estimate and is never used for exact arithmetic (`TDD.md` §2.4) — it is recorded here only to establish the order of magnitude of S.

**4.3 — Compute `presence@10` and `presence@3`**, and the full rank distribution, per population and pooled. Report alongside the denominator, never alone.

**4.4 — Score `competitor_displacement`** per `TDD.md` §6.1: rank-1 domain per query, distinct domains in the top 10, whether the target's store appears at any rank.

**4.5 — Re-examine the fallback.** `U-4` established that a scoped no-match query returns the shop's general catalogue rather than an empty set. Determine whether any equivalent floor behaviour exists unscoped, and whether any of the 16 "present" results are fallback artefacts rather than relevance matches.

**No verdict is attached to any of this.** It is instrumentation.

---

## 5. Depth, not page one

Stage 2.5 pulled a single page of 50. The Catalog paginates to a depth of 1000 (`TDD.md` §2.4).

**Re-issue the same frozen query set** (commit `b0365f6`, unscoped, unchanged) with pagination to depth 1000. For each target record: present at 3, 10, 50, 200, 1000, or absent at depth.

**"Absent at depth 1000" is a categorically different observation from "not in the top 50"** and it is the only version of non-retrieval that could support a merchant-facing claim. Report how many of the 16 are absent at depth. If the answer is zero, then nothing measured in this project so far is invisibility, and that is the finding.

---

## 6. Only if §3 or §5 produces something — the identical-part audit

Conditional on H5 supported, or on a non-trivial count of targets absent at depth 1000.

For a single store, take ≥10 parts it stocks that at least two other Shopify merchants also stock. For each: which merchants appear, at what rank, whether the target appears at any depth, and the cause per `TDD.md` §6.2. **The product is held constant across merchants**, so demand, price band and category density are equalised by construction.

That is a controlled comparison and it is the only artefact specified in this directive that could survive a hostile reading. It is still not produced for outreach — it is produced so its face validity can be tested by someone who knows auto parts.

---

## 7. What is not affected

The following stand unchanged and none of them depended on the withdrawn framing:

- **H4-R** (DIRECTIVE-6 §3) — the paired-query title test. Still the right design, still pre-registered, still unrun.
- **H1, H2, and the 0.80 fitment rule** — unchanged, unfired.
- **P-5** — 12/12 accepted, with the KRUCA19 counter-evidence recorded.
- **The C5 blind relabel** — still outstanding, still one hour, and now more important: it is the calibration for the expectation set the 16 targets were scored against.
- **U-6** — the assistant check. Given §1, this is now the sharper question: whether Catalog rank predicts what an assistant surfaces at all determines whether any Catalog-derived number is an outcome or a proxy.

---

## 8. Report format

DIRECTIVE-3 §8, all eight sections.

**Added for this cycle:** §2 states the denominator alongside every presence figure. A presence rate reported without its denominator is an incomplete number and will be treated as not reported.

§6 contains only the verdict the rule licenses. §4 must name the exact JSON paths inspected — the point of this cycle is that summary numbers are not accepted as evidence, including from the advisor.

---

## 9. Order of execution

1. **§4 re-scoring and §3 clustering determination** (no new API calls) → report
2. **§5 depth-1000 re-run** and **§3 H5** → report
3. **§6 identical-part audit** — only if §3 or §5 warrants it → report
4. **DIRECTIVE-6 §3 H4-R** → report
5. **DIRECTIVE-4 §4 instrument completion and auto-parts re-sample** → report

Stop and report between stages. Do not chain.

**Not authorised under this directive:** any merchant-facing document, any outreach, any language asserting a measured effect on a real store.
