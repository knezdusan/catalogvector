# CatalogVector — Directive #6

**Issued:** 2 August 2026
**Status:** RECONSTRUCTED from secondary sources — original file was lost in transit and never committed. This reconstruction is built from references in DIRECTIVE-7 §0, §4, §7, §9.4; DIRECTIVE-8-v2 §2.2, §3, §8.4; TDD §6.1.8; and BLUEPRINT.md changelog entry 0.6.0. It is committed here to satisfy the pipeline requirement (DIRECTIVE-8-v2 §3): every directive must be citable by commit hash.
**Supersedes:** DIRECTIVE-5 §0 (Stage 2 conclusion withdrawal) and the Stage 2.5 framing.
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-5, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. Why this directive exists

Stage 2.5 (DIRECTIVE-5 §3/§4/§6) produced two findings: H4 SUPPORTED (title dominates retrieval, difference 0.708) and H3 inconclusive (difference 0.127). The pooled `presence@50` of 0.500 across the 16 targets was the headline number from the unscoped run. This directive frames that number and authorises the next steps.

---

## 1. The retrieval-level framing

The pooled `presence@50` of 0.500 — 8 of 16 targets appearing in the global top 50 for their relational queries — is the most important number this project has produced. It measures commercial visibility: whether a product appears in the result set a buyer sees when searching for the vehicle it fits.

This number is the retrieval-level counterpart to the inference-level coverage gap (fitment recall 0.385). Together they describe the full pipeline: Shopify's inference drops vehicles (coverage gap), and the Catalog's retrieval system returns products that have the vehicle in their title (title effect). The pooled 0.500 is the joint output of both mechanisms.

---

## 2. The pooled 0.500 as the project's headline

> **NOTE (DIRECTIVE-7 §0):** This section was withdrawn by DIRECTIVE-7. The 0.500 figure conflates two experimental arms (treatment and control), has no baseline (S ≈ 300, so 0.500 is 3× better than chance, not a defect), and measures ranking, not invisibility. The withdrawal is recorded here for the record.

The pooled `presence@50` of 0.500 is elevated to the project's headline finding. It is the number that connects the inference pipeline (coverage gap) to the retrieval pipeline (title effect) and produces a single, comprehensible figure: half of the products in this sample are invisible to a buyer searching for the vehicle they fit.

This is the number that a merchant-facing artefact should be built around.

---

## 3. H4-R — the paired-query title test at TSP

**Design.** The H4 finding (DIRECTIVE-5 §4, TDD §6.1.4) showed that title-absent products have `presence@50` 0.708 below title-present products. H4 was run on TSP+MAP with relaxed matching (not same-store-AND-same-category). H4-R is the replication: the same paired-query design, run at TSP, with title-absent and title-present products from the same store and category tested inside the same query.

**Paired-query design.** For each relational query, both the title-absent product and its matched title-present control are scored. The pair is the unit of analysis, not the individual product. This controls for query-level variance: a query that returns few results will depress both products equally, and the difference between them is the title effect.

**Pre-registered decision rule (from H4, unchanged):**

> **H4-R supported:** title-absent `presence@50` ≥ 0.40 below title-present.
>
> **H4-R rejected:** difference ≤ 0.15.
>
> **H4-R inconclusive:** anything between, or < 6 title-absent products, or < 6 matched pairs.

**If H4-R replicates H4, the project has its first generalisable result.** The title effect is not specific to the original sample; it holds on a second store with a different inventory. If it does not replicate, H4 is an auto-parts finding (TSP+MAP), not a platform finding.

---

## 4. What is not affected

The following stand unchanged:

- **H1, H2, and the 0.80 fitment rule** — unchanged, unfired.
- **P-5** — 12/12 accepted, with the KRUCA19 counter-evidence recorded.
- **The C5 blind relabel** — still outstanding, still one hour.
- **U-6** — the assistant check. Still registered, still unrun.

---

## 5. The merchant-facing artefact

> **NOTE (DIRECTIVE-7 §0):** §5.1 was withdrawn by DIRECTIVE-7. No merchant-facing artefact is produced. The withdrawal is recorded here for the record.

### 5.1 — Per-store artefact

A merchant-facing artefact is authorised, built around the pooled 0.500 figure and the H4 title-coverage finding. The artefact shows a store owner which of their products are invisible to natural-language queries and why — title absence, inference drop, or competitive burial.

---

## 6. Order of execution

1. **H4-R** (§3) — the paired-query title test at TSP → report
2. **The merchant-facing artefact** (§5.1) — built after H4-R reports

Stop and report between stages. Do not chain.

---

## 7. What was lost and reconstructed

This file does not exist in its original form. It was transmitted to Devin but never received — the Stage 1 log records "No DIRECTIVE-6 file exists." The content above is reconstructed from:

- DIRECTIVE-7 §0: "DIRECTIVE-6 §2 elevated a pooled presence@50 of 0.500 to 'the most important number this project has produced' and DIRECTIVE-6 §5.1 instructed a merchant-facing artefact to be built on it."
- DIRECTIVE-7 §4: "DIRECTIVE-6 §2 (the retrieval-level framing) and DIRECTIVE-6 §5.1 (the per-store artefact) — both withdrawn."
- DIRECTIVE-7 §7: "H4-R (DIRECTIVE-6 §3) — the paired-query title test. Still the right design, still pre-registered, still unrun."
- DIRECTIVE-7 §9.4: "DIRECTIVE-6 §3 H4-R → report"
- DIRECTIVE-8-v2 §2.2: "DIRECTIVE-6 §3 specified a paired-query design at TSP — title-absent and title-present products from the same store and category tested inside the same query."
- DIRECTIVE-8-v2 §3: "Devin's Stage 1 log records 'No DIRECTIVE-6 file exists.' It reconstructed H4-R from secondary references."
- DIRECTIVE-8-v2 §8.4: "DIRECTIVE-6 §3 H4-R, as registered, at TSP → report"
- TDD §6.1.8: "H4-R — title-coverage replication on a second store (DIRECTIVE-6 §3)"
- BLUEPRINT.md 0.6.0: "DIRECTIVE-6 §2 (pooled 0.500 as 'most important number') and §5.1 (merchant-facing artefact) both withdrawn."

Sections that may have existed but are not reconstructable from references are not included. The reconstruction is conservative: it includes only what can be verified from secondary sources.
