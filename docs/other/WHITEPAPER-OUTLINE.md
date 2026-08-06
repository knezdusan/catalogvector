# CatalogVector — Final Whitepaper Outline

**Date:** 4 August 2026
**Target length:** 5,000–7,000 words plus appendices
**Publish:** regardless of Gate A's outcome. It is the asset, not the consolation.

---

## What this document is for

Not lead generation. Not a product narrative. A citable measurement paper in a category that currently has almost none — the AI-visibility field is thick with vendor blog posts and thin with method sections, pre-registration, or published negative results.

**The differentiator is not the absence rate. It is that nine hypotheses were pre-registered and rejected, and the paper says so with dates.** Nobody in this space publishes what they tested and killed. That is what makes it worth citing rather than skimming.

**Voice:** first person singular, plain, no hedging and no hype. Where a number is uncertain, give the interval. Where a method failed, name it.

---

## Working titles

1. **Measuring What AI Shopping Assistants Can Actually See: Catalogue Membership in Shopify's Global Catalog** — descriptive, citable, dull in the right way
2. **13 Things Shopify's Catalog Documentation Gets Wrong** — higher reach, lower citation value; better as the companion post
3. **Nine Rejected Hypotheses About AI Commerce Visibility** — the most honest and the most distinctive

Recommend **1** as the paper and **2** as the launch post pointing at it.

---

## §1 — Abstract (250 words)

The question, the method, the three findings, the four limitations, the link to code and data. Someone must be able to decide from this alone whether to read on and whether to cite.

State the absence range with intervals and store count in the abstract itself. Do not save it.

---

## §2 — Why this measurement doesn't exist (600 words)

The framing section, and the reason the paper is publishable at all.

- Shopify syndicates merchant products into a Global Catalog that AI shopping surfaces query; OpenAI's documentation states Shopify merchant data is already integrated into ChatGPT through it, with no merchant action required.
- **There is no endpoint that enumerates which of a store's products are actually in it.** Search is relevance-ranked, `lookup_catalog` takes opaque IDs that don't map to store product IDs, and no conversion endpoint exists.
- Naive keyword search misses roughly half — the measured 54% false-negative rate.
- Existing AI-visibility tools measure *share of voice given the surface rendered*. None measures membership, and none can, without solving the above.

Ends with the paper's actual contribution: a method that gets to 88–98% recall depending on catalogue size, validated against an independent reference standard.

---

## §3 — Method (1,200 words)

The section that makes it reproducible, and the one most competitors won't bother to copy properly.

**3.1 Store enumeration.** Sitemap as ground truth. `/products.json` is exhaustive below 25,000 products; Shopify caps it at 100 pages × 250 and returns HTTP 400 beyond. Include the arithmetic that exposed the earlier truncated fetch — counts landing on exact multiples of 250 — because it's a reusable diagnostic for anyone doing this.

**3.2 Partition enumeration.** Vendors and product types from full store metadata become scoped Catalog queries. 692 queries for an 18,000-product store. Union the results, seller-filtered.

**3.3 Ground truth and recall.** Random sitemap sample with a recorded seed. Per-product reference standard using five independent probe strategies. **Presence is established by either detector; absence requires both to miss.** Explain why a false-positive class cannot exist here — a handle returned for a seller is in the Catalog.

**3.4 Runtime invariants.** The six assertions, each with the failure it prevents. Pagination page-disjointness, enumeration completeness, seller identity on every claim, surface provenance, normalised domain comparison, mandatory false-negative reporting before results are quoted.

**This subsection is the most transferable content in the paper.** Anyone instrumenting a commerce API needs it, and it is the part that gets cited by people working on adjacent surfaces.

**3.5 Recall by catalogue size.** 97.7% at 2,608 products, 88.8% at 18,067, 56.6% at 102,176. Publish the degradation. It is the method's weakest property and disclosing it is what makes the rest believable.

---

## §4 — Results (1,500 words)

**4.1 Catalogue membership.** Three stores, per-store rates and Wilson intervals, all upper bounds, n=100 each. No pooled figure. State plainly that the intervals overlap and the between-store differences are not significant at this n.

**4.2 Seller attribution.** At one store, 9 of 12 tested products present in the Catalog under other sellers' names and none under the store's own. A lower bound — the detection method has false negatives. **Explain why this is not visible from any admin:** a merchant sees their own state, never their resellers' or competitors' presence for the same part.

**4.3 Surface rendering.** ChatGPT renders a product card for ~42% of buying-intent queries across 24 probes, 0% in outdoor gear to 67% in auto parts. Where cards render, Shopify merchants appear in a majority, verified by platform fingerprinting. Note that this sits upstream of every share-of-voice metric on the market.

**4.4 `total_count` is a response budget.** Seven semantically unrelated queries return 361–387 — a nonsense query and a real one within 0.3% of each other. The API returns approximately the same volume regardless of query semantics, so for queries with more than ~360 genuine matches the result set is truncated by budget, not exhausted by relevance.

**4.5 Result-set stability.** The first ~50 ranks are deterministic across repeated identical requests; beyond that positional agreement collapses to zero with set Jaccard around 0.48. **Rank-based absence testing is therefore invalid on this API** — a product can be absent in one run and present in the next.

4.4 and 4.5 together are the most useful findings for other researchers, and the ones most likely to be cited.

---

## §5 — Nine rejected hypotheses (1,200 words)

**The section that makes this a paper.** One short subsection each: what was hypothesised, the pre-registration date, the decision rule as written, the result, and the verdict.

H1 intrinsic/relational drop · H2 truncation · H4 title coverage · H4-R replication · H5 offer attachment · H6 shop.app as proxy · H7 per-product syndication · H8 stale entries · H9 absence predictable from public attributes.

**Then the part almost nobody publishes: how they died.** Six of the nine died on instrument error rather than on data — pagination corruption, product-versus-seller confusion, cross-surface conflation, a one-character domain mismatch, a handle-matching artefact, a truncated fetch. Only H9 died cleanly on evidence.

State that plainly. It is the paper's most honest paragraph, it is the strongest argument for §3.4, and it is the passage that will get quoted.

**Include the H9 threshold error against yourself:** the pre-registered rule required ≥0.75 accuracy on a held-out half, while base rates of presence were 76.7% and 92.0% — a null classifier clears it. Report that the rule was discarded and H9 rejected on lift instead.

---

## §6 — Limitations (700 words)

Not a disclaimer. The credibility engine, and the section experienced readers check first.

- Three stores, one vertical, n=100 per store. No prevalence claim.
- **Absence is not diagnosable from public attributes** at detectable effect sizes — and the rejection is underpowered, roughly 35 and 12 absent products in the held-out halves. It rules out a strong predictor, not a modest one.
- Public attributes are not where syndication is configured. Sales-channel publication state and per-product overrides live in the merchant admin and were not tested.
- **The Catalog contains only Shopify merchants.** Across three assistants, 47.5% of cited merchant domains were Shopify; Amazon, eBay, RockAuto and Tire Rack are structurally invisible to this instrument. In auto parts, aggregators dominate assistant answers.
- Recall degrades with catalogue size.
- **No revenue link has been established.** Absence has not been shown to cost sales.
- ~1.88% run-to-run variance from API non-determinism. Any longitudinal claim needs a same-day noise floor first.

---

## §7 — Appendix A: The platform-facts register (800 words)

Thirteen entries. Each: the documented claim, the observed behaviour, the JSON path or transcript, the date established.

Keep entry 6, where the documentation is **correct**. Retaining a null result is what makes the other twelve credible, and the temptation to trim it is exactly why most vendor research isn't trusted.

Include the two entries this project's own failures produced — no per-store enumeration endpoint, and cursor pagination overlap of 1.6–8.1%.

**Cite it as `<repo>/docs/reports/platform-facts-register.md` with a commit hash**, so a reader can check it against a fixed version.

---

## §8 — Reproducibility (400 words)

Repo link, commit hash, licence. Random seeds. The invariant library and its tests. Ground-truth fixtures. Which figures come from which script.

State honestly what a reader cannot reproduce: live API responses change, and the Catalog's ranking is non-deterministic past rank ~50.

---

## §9 — What this does and does not license (400 words)

The claim boundary, published. Unusual, and worth doing.

**Supported:** the three findings with their intervals and store counts.

**Not supported:** that half a catalogue is invisible · that absence is diagnosable or fixable from public data · that absence costs sales · that these rates generalise beyond three auto-parts stores · any claim about Google or Copilot behaviour from a US session.

Close on the honest position: **the measurement exists, the mechanism does not, and whether the number is worth money to anyone is unresolved.**

---

## Publication mechanics

**Sequence:** repo public with the register and invariant library → whitepaper as a PDF and a plain HTML page (not a PDF only — PDFs don't get cited from the web) → launch post using working title 2 pointing at the paper.

**Where:** your own domain first. Then Hacker News, r/shopify, r/ecommerce, the Shopify Partners community. For citation value, arXiv cs.IR is available and costs nothing.

**Do not:** gate it behind an email form, add a CTA, or write a "book a call" button. Gating a research paper converts it into marketing and it loses the only property that makes it valuable.

**Timing:** publish in parallel with the outreach, not after. The paper is your strongest credential in those five conversations — a link to a methods paper is what separates you from every cold emailer in that inbox.
