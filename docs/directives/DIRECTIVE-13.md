# CatalogVector — Directive #13

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-12 §8 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-12, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What DIRECTIVE-12 settled, and the sentence it filed under the wrong heading

Four results are accepted as reported.

**World B is confirmed** — tail Jaccard 0.90–1.00 across four real queries, with raw product IDs saved. The recomputation was done properly and it overturned the prior interpretation. **§2's tail inspection does the load-bearing work**: the nonsense query also shows a stable set (Jaccard 0.79), so stability alone proves nothing — what distinguishes them is that ranks 200–300 of a real query are all brake pads for a Civic Si while the nonsense tail is bathroom fittings and keychains. Together these establish that a real query returns a stable, relevance-ordered, exhaustive set, and that **"absent at depth" is now a strong claim**.

**The phrasing effect dissolves** exactly as predicted, with the direction reversing in 3 of 6 verticals. The vertical signal survives.

**The authenticated pass is scored** and confirms the Block D error: 19 Shopify merchants appeared across the three assistants, including Springrates, PRL Motorsports, Redline360, MAPerformance and Parachute Home. Authentication did not change the picture, on n=6 queries per assistant.

**H6's finding 2 was correctly dissolved.** Checking seller identity rather than title match was the right method and it produced the right answer.

And in doing so it produced this, filed as a dissolution:

> *"Subimods has a partial shop.app presence — only OEM Subaru parts and Motul oils are indexed. The 5 aftermarket performance products do not appear under Subimods' seller name."*

That is not an absence. **That is a discrimination inside a single merchant's catalogue**, and it is the most diagnostic observation this project has produced. §2 is built on it.

---

## 1. H7 — per-product syndication eligibility

### 1.1 Why this changes the cause taxonomy

DIRECTIVE-10 §4 laid out five candidate causes for a store's absence, of which four are worthless commercially. Partial syndication eliminates them:

| Cause | Compatible with partial syndication? |
|---|---|
| Deliberate opt-out | **No** — opting out removes the whole store |
| Products set Unlisted store-wide | **No** — same reason |
| Mid-propagation after opt-out | **No** — propagation is store-wide |
| Store failed eligibility | **No** — the store is clearly eligible; part of it syndicates |
| **Enrolled, eligible, and a subset still not syndicated** | **Yes — and this is the only cell worth money** |

Partial syndication is the single observation that rules out every boring explanation at once. It has been sitting in the data for one cycle labelled as a null result.

### 1.2 The hypothesis

**H7:** syndication into Shopify Catalog is decided **per product**, not per store, and inclusion is predictable from publicly visible product attributes.

The Subimods split — OEM parts in, aftermarket performance parts out — points at product-identifier completeness as the most likely discriminator. OEM parts carry manufacturer part numbers and frequently barcodes; aftermarket performance parts frequently carry neither. Feed-based commerce systems routinely gate on exactly that.

**It may also be category assignment, image count, variant structure, vendor recognition, price band, publication age, or something not yet considered.** The hypothesis is that *some* public attribute set separates the two populations. Which attribute is a finding, not an assumption — do not go looking only for identifiers.

### 1.3 Design

Pick **3 stores** with confirmed partial presence, starting with Subimods. For each:

1. **Enumerate the full public catalogue** from `/products.json`, paginated to exhaustion. Record every public attribute: `vendor`, `product_type`, `tags`, `variants[].sku`, variant count, image count, `published_at`, price range, `options`, body length.
2. **Determine Catalog membership per product.** This needs care — U-4 established that a scoped no-match query returns the shop's general catalogue, so a naive scoped query cannot be used as a membership test. Propose a method in §1 of the report and state its false-positive and false-negative behaviour before running it. Candidate approaches: exact-handle match on scoped queries built from each product's own title; union of scoped results across many queries treated as the syndicated set; or `lookup_catalog` if product GIDs are resolvable. **Whichever method is used, validate it against 20 products confirmed present and 20 confirmed absent by hand.**
3. **Compare the two populations** on every recorded attribute. Report effect sizes, not just significance.

### PRE-REGISTERED DECISION RULE — H7, fixed 4 August 2026, before any run

> **H7 supported:** in ≥2 of 3 stores, the absent population is ≥10% of the catalogue, **and** at least one public attribute separates present from absent with ≥0.75 accuracy on a held-out half of the products.
>
> **H7 rejected:** the absent population is <3% of the catalogue in ≥2 of 3 stores, **or** no attribute exceeds 0.60 accuracy in any store.
>
> **H7 inconclusive:** anything between, or fewer than 2 stores yield a validated membership test.

**Hold out half the products before looking at any attribute.** The classifier is fitted on one half and scored on the other. Fitting and scoring on the same products is what produced the five-round extractor tuning problem in Stage 1, and this directive will not repeat it.

### 1.4 Why this is the commercial position, if it holds

It is an **inclusion** question, not a ranking question. It needs none of the retrieval claims, none of `fitment_recall`, none of H1 or H2. The answer is binary and per-SKU. The cause is a public attribute the merchant controls. The fix is data hygiene they can verify themselves.

That is precisely the "causal diagnosis" layer identified in DIRECTIVE-10 §4 — the one currently sold by hand at $5,000–15,000 with no product behind it.

**No claim is authorised until H7 reports.** If the absent population turns out to be 1% of a catalogue, there is no product here and the report should say so plainly.

---

## 2. U-9's residual ambiguity, and a number the report glossed

**2.1 — Set B assembly may have repeated the error §3 just corrected.** §4 reports that all 18 LLM-cited products are "present in the Catalog API." Present as *the same product*, or as *that merchant's listing*? §3 established two paragraphs earlier that these are different questions and that the distinction reversed H6's conclusion. Re-check the 18 at seller level and restate.

**2.2 — More than half the merchants the assistants surfaced are not on Shopify.** §5's own audit: 19 Shopify, 4 WooCommerce, 17 unknown or other, out of 40. The conclusion *"the Catalog API measures the surface consumer assistants query"* is true only for the Shopify slice. For 52.5% of the competitive field, the Catalog cannot see the competitor at all.

This matters commercially and it must be recorded: **a diagnostic built only on Catalog data measures a partial competitive field.** A merchant told "here is who takes your slot" would be shown roughly half the winners. State this in `TDD.md` §2.7 as a standing limitation.

**2.3 — Google AI was tested from Serbia, not the US.** Disclosed honestly in the report. The DIRECTIVE-11 §2.3 confound is therefore partially open, and no US claim about Google is licensed. This is not urgent; record it and move on.

---

## 3. The ~300 set — listings or products? (zero cost)

§2's tail inspection notes that Hawk Street 5.0 appears 7 times, Improved Coated 5 times, Cobalt Racing 3 times — the same product from different merchants.

If the ~300 boundary is a count of **listings** rather than distinct products, the effective product diversity is much lower than 300, and every presence figure should be read against the smaller number.

It also sharpens the invisibility claim in one specific way: if seven merchants list the identical part and an eighth who stocks it does not appear, that is a controlled comparison with the product held constant — which is what DIRECTIVE-7 §6's identical-part audit was reaching for and never cleanly got.

**Task, from data already on disk:** for the four real queries, count distinct products versus total listings in the ~300, and report the duplication distribution. Then identify any part appearing from ≥5 merchants and check whether any of the ten scanned stores stocks that part and is absent.

---

## 4. What stays paused

No new mechanism, metric or vertical until H7 reports. Specifically still paused: H4-R, the IV02 expansion, Workstream A's remaining verticals, extractor work, and `surface_trigger_rate` promotion to a hypothesis (n per vertical is still 4).

---

## 5. Claim boundary

**Added to what can be said:**

> A real query returns a stable, relevance-ordered, exhaustive candidate set — set overlap across repeated runs is 0.90–1.00, and products at ranks 200–300 remain genuine matches. The first 13–18 ranks are deterministic. Across three assistants, 47.5% of cited merchant domains are Shopify, verified by platform fingerprinting.

**Added to what cannot be said:**

> "The Catalog API measures the surface consumer assistants query" — without the qualifier that it sees only the Shopify half of the competitive field.
> Anything about per-product syndication eligibility, until H7 reports.
> Any US claim about Google AI behaviour.

**Unchanged and still forbidden:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."

---

## 6. Order of execution

1. **§3 distinct-products count** and **§2.1 seller-level re-check** — both free, both on existing data → report
2. **§1 H7**, membership method validated first and reported before the classifier runs → report
3. §2.2 recorded in `TDD.md` §2.7; changelogs and version bump

Stop and report between stages. **Report the membership-test validation before fitting anything** — if the membership test is unreliable, H7 cannot run and the correct answer is to say so.

**Not authorised:** the exposé, any PUB-* work, any merchant-facing document, any outreach.
