# CatalogVector — Directive #10

**Issued:** 3 August 2026
**Supersedes:** the "Final Directives for Autonomous Agents" in the U-6 audit report of 3 August 2026, in full.
**Supersedes:** DIRECTIVE-9 §8 (order of execution). DIRECTIVE-9 §1 (U-8) and §3 (register corrections) remain live and unchanged.
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-9, `BLUEPRINT.md`, and `TDD.md`.

---

## 1. The exposé pivot is halted, and the falsification claim is itself falsified

The U-6 audit report concludes that *"consumer AI assistants do not currently use Shopify's Global Catalog or UCP to surface specific product recommendations"* and that Catalog optimisation is *"a closed internal loop"* yielding *"zero ROI in ChatGPT, Copilot, or Gemini."*

**OpenAI's own help centre states the opposite.** Its shopping documentation says that for merchants on Shopify, product data is already integrated into ChatGPT through Shopify Catalog, that this helps products appear in relevant conversations, and that no additional work is required from the merchant. Independent 2026 coverage describes three pipelines feeding ChatGPT's shopping results, of which Shopify Catalog syndication is one, active since March 2026.

Publishing an exposé asserting the Catalog is a phantom would be refuted within a day by anyone who reads OpenAI's help page — and it would destroy the platform-facts register, which is the only credential this project owns outright. **No PUB-* work proceeds on that premise.**

### 1.1 What U-6 actually established

The observation is real and useful. The interpretation is not licensed, for four reasons:

**(a) It tested the wrong surface.** ChatGPT's shopping results render as a **product carousel** — cards with images, prices and merchant links — triggered when the model detects buying intent. What U-6 captured was a conversational answer with inline citations to Tire Rack and RockAuto. Those are two different rendering paths fed by different pipelines. Catalog syndication feeds the carousel. The test measured the citation surface and concluded the carousel doesn't exist.

**(b) The prompt suppressed the surface it was trying to measure.** *"Can you recommend 3 to 5 specific products, and tell me exactly which online stores I should buy them from"* asks for research and store names. It reads as advisory, not transactional. OpenAI's documentation gives buying-intent phrasing ("Help me find…", "Shop for…") as the carousel trigger.

**(c) n = 1 query.** One query, three assistants. The project has spent nine directives refusing to accept n=1 findings from Devin. The same standard applies to founder-run tests.

**(d) It chose the single worst query in the vertical.** Brake pads for a mass-market Honda is the most aggregator-dominated query class in aftermarket auto parts — Tire Rack, RockAuto and AutoZone have twenty years of authority there. A negative result on that query is close to guaranteed and tells you almost nothing about the platform.

### 1.2 What the correct reading is

> For one high-competition auto-parts query, in advisory prompt mode, none of three assistants surfaced Shopify-catalogue-derived product results.

That is a genuine constraint on auto-parts claims. It is not a falsification of the Catalog's role, and it does not license halting B2B permanently.

---

## 2. U-6-R — re-run on the correct surface, with a vertical control (founder-owned)

**12 queries × 3 assistants = 36 observations.** Buying-intent phrasing only. Do not ask which stores to buy from — that phrasing is what produced the citation answer.

| Block | Queries | Purpose |
|---|---|---|
| A — aggregator-dominated auto | 3, incl. the original Civic Si brake pads | Replicates the existing result |
| B — enthusiast/niche auto | 3, brand + specific platform (e.g. a Type R downpipe, a WRX intake) | Tests whether niche queries behave differently |
| C — long-tail auto | 3, specific part numbers or uncommon vehicles | Tests the low-competition end |
| **D — non-auto control** | 3, in a category with weak aggregator dominance | **The most important block. If carousels full of Shopify stores render here and not for auto, the problem is the vertical, not the platform** |

**Record per observation:** did a product carousel or product cards render at all (binary) · which merchants are named · how many are Shopify stores · whether any product matches the unscoped Catalog top-20 for the equivalent query · whether an Instant Checkout or Buy control appears.

### PRE-REGISTERED DECISION RULE — U-6-R, fixed 3 August 2026, before any run

> **CATALOG PREDICTIVE** — carousels render in ≥8 of 12 queries and Shopify merchants appear in ≥50% of them, with visible correspondence to Catalog ordering. The instrument is validated against the outcome; the measurement programme resumes.
>
> **SURFACE-DEPENDENT** — carousels render, but Shopify merchants appear rarely or unpredictably. **This is the most likely outcome and it is the strongest commercial result available, not a negative.** It means a measurable gap exists between what the Catalog contains and what assistants surface — a gap Shopify's own messaging tells merchants does not exist, and which nobody currently measures on both sides. See §4.
>
> **VERTICAL-BOUND** — Block D produces carousels with Shopify merchants while Blocks A–C do not. The constraint is performance auto parts, not the platform. C-4's vertical lock reopens immediately and the instrument transfers intact.
>
> **CATALOG ABSENT** — no carousel renders on buying-intent prompts in any block and no Shopify merchant appears anywhere. The original U-6 conclusion is supported and the pivot returns to the table with evidence behind it.

Do not adjust these thresholds after seeing results. If a threshold looks wrong, say so and leave it unchanged.

---

## 3. OAI-SearchBot check — publicly checkable, free, and it may explain Subimods

OpenAI's crawler is a documented second pipeline into ChatGPT's shopping results, and 2026 practitioner coverage reports that many stores inadvertently block `OAI-SearchBot` through blanket disallow rules or WAF and CDN configurations — Cloudflare and Akamai bot rules being the common cause. Shopify also changed default scraping restrictions in 2026.

**Task, zero cost, no API:** fetch `robots.txt` for all ten stores in the Stage 3 scan plus Subimods. Record the directives for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Google-Extended`, and `GPTBot`. Cross-reference against each store's measured Catalog presence rate.

This matters for three reasons. It is **publicly verifiable by anyone**, so it cannot be disputed. It is **invisible to the merchant**, so it is the rare defect they genuinely do not know about. And it has a **one-line fix** with a real mechanism behind it.

If Subimods blocks retrieval crawlers, that is a candidate cause with an artefact behind it. It would not by itself explain absence from the Catalog API — the feed and crawl pipelines are separate — and the report must say so rather than collapsing the two.

---

## 4. The market position — recorded now, by directive

External research places the current landscape as follows, and this changes what CatalogVector is for.

| Layer | Who occupies it | Price | CatalogVector's position |
|---|---|---|---|
| **Outcome monitoring** — does an assistant name you | 15+ platforms in 2026 (Profound, Scrunch, Promptwatch, Otterly, Alhena and others), some tracking ChatGPT Shopping carousels at SKU level | $29–$489/mo | **Crowded. Do not build here.** Any plan to build assistant-output monitoring is competing with funded incumbents on their strongest ground |
| **Causal diagnosis** — why you are not surfaced, and what to fix | Nobody productised. Practitioner estimates put translation of visibility data into fixes at **$5,000–$15,000 per consulting engagement** | $5–15k, manual | **This is the position.** It is priced, it is demanded, and it has no product |
| **Supply-side Catalog mechanics** — what Shopify's inference did with your data, and whether you are retrievable | **Nobody.** The optimisation tools work on inputs a merchant can see: GMC feed health, product schema, copy, reviews. None measures what the Catalog actually returns | — | **Only this project has instrumentation here**, and the platform-facts register documents why: the public documentation is wrong or incomplete in eight places, so this layer can only be reached empirically |

**The synthesis, and it is what makes the whole programme cohere:** monitoring tools measure the outcome and cannot explain it. This project measures the supply side and, until U-6, could not connect it to an outcome. Neither half is sufficient. Together they are a diagnosis, and the diagnosis is what is already being sold by hand at five figures.

`BLUEPRINT.md` §1 and §2.2 are **not** modified by this directive. This is recorded as a positioning note in §4 pending U-6-R.

---

## 5. What is paused

No new mechanism, hypothesis, metric or vertical may be introduced until U-6-R reports. Specifically paused: H4-R replication, the IV02 expansion, Workstream A's remaining verticals, and any further extractor work.

**Still live and unchanged:** DIRECTIVE-9 §1 (U-8, the head/padding boundary — it governs how every existing number is stated) and DIRECTIVE-9 §3 (the two register corrections, which must be fixed before the register is shown to anyone).

**Still live:** DIRECTIVE-9 §4's six Subimods kill tests, with §4.1 corrected — counting Subimods slots across the 18 Honda/Acura/Ford queries proves nothing, because Subimods is a Subaru specialist. Use Subaru queries derived from their own inventory, and test verbatim untruncated titles.

---

## 6. Claim boundary — unchanged, with one addition

**Added to what cannot be said:**

> "Consumer AI assistants do not use Shopify's Global Catalog."
> "Optimising Shopify Catalog data yields zero ROI in ChatGPT, Copilot or Gemini."

Both are contradicted by OpenAI's published documentation and by Shopify's reported AI-channel order growth. Neither may appear in any publication, message or conversation.

---

## 7. Order of execution

1. **§3 OAI-SearchBot check** (zero cost) + **DIRECTIVE-9 §1 U-8** + **DIRECTIVE-9 §3 register corrections** → report
2. **DIRECTIVE-9 §4 Subimods kill tests**, as corrected → report
3. **§2 U-6-R** — founder-owned, and it gates everything after it

**Not authorised:** the exposé, any PUB-* work premised on Catalog falsification, any merchant-facing document, and any outreach.
