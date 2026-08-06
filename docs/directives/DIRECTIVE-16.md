# CatalogVector — Directive #16

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-15-v2 §8 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-15-v2, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What DIRECTIVE-15 built, and why it matters more than any finding so far

The invariant library exists, it has 20 passing tests, and **within one stage of being built it caught a previously unknown property of the Catalog API** — cursor pagination overlaps 1.6–8.1% between pages because the relevance ranking shifts between requests. Nobody knew that. It was found by an assertion firing, not by three directives of downstream confusion. That is the entire point of §3 working exactly as intended, on its first run.

The partition-based enumeration method is real. Sitemap enumeration is real. The provenance requirement is implemented. This is the first cycle in sixteen where the thing built was infrastructure rather than a hypothesis, and it is the first thing that has not died.

Four things now need correcting before any of it is quoted. Three are over-claims in the reports; one is a measurement design flaw in the headline number.

---

## 1. The 98% recall figure is measured circularly

### 1.1 The problem

Stage 3 §1 constructs ground truth as follows:

1. Build a Catalog handle set using **61 keyword queries**.
2. Label sitemap products **"present"** if they appear in that 61-query set.
3. Sample 50 "present."
4. **Verify "present" by fetching the product page from the store** — must return 200.

**Step 4 does not verify Catalog presence.** It verifies the product exists on the storefront, which is true of every product in the sitemap by definition. So the "50 confirmed present" were never confirmed present in the Catalog at all — they were confirmed present in the *store*.

What the "present" label actually means is: **found by scoped keyword search.** The 524-query enumeration is a larger scoped-search effort against the same store. Scoring it against products selected for being findable by scoped search measures the method against a subset of its own output.

**98% is an upper bound on recall, not an estimate of it.** The single false negative in 50 is optimistic by an unknown margin.

The **absent** side is sounder: 50 products not found by 61 queries *and* not found by exact-title search, having tested 94 candidates to get there. That is a genuine hard-negative control, and the 2% false-positive rate is credible.

### 1.2 The fix

**Sample randomly from the sitemap, not from the found set.** Then establish presence with a reference standard that is deliberately more expensive than the enumeration, so it functions as a gold standard rather than a peer.

**Design:**
- Draw **100 products at random from the sitemap** (uncorrelated with any prior search result). Record the random seed.
- For each, run a **per-product exhaustive probe**: exact title · title with stopwords removed · vendor + product type · SKU if public · first five title tokens. Scoped to the store, I-1 enforced. Declare **present** if any probe returns the exact handle.
- Score the 524-query enumeration against that label set.

**Report `recall_random` alongside `recall_selected` (the current 98%), and headline the random one.** Both are legitimate numbers describing different things; only one describes the method's performance on an unbiased sample.

This is I-6 applied to the enumeration itself. The enumeration is a matching method, and I-6 requires every matching method to report its false-negative rate against ground truth. It has not yet done so against ground truth built independently of it.

---

## 2. Register entry 11 may be describing our fetch, not Shopify's behaviour

Shopify paginates `/products.json` at 250 per page.

| Store | `/products.json` | Pages | Reading |
|---|---|---|---|
| Subimods | 5,250 | **21.000** | Loop stopped **on** a page boundary |
| MAP | 7,750 | **31.000** | Loop stopped **on** a page boundary |
| TSP | 2,608 | 10.432 | Reached a genuine short final page |

**Both stores with a "shortfall" terminated on an exact multiple of 250. The only store with no shortfall is the only one that terminated on a partial page.** That is the signature of a fetch loop breaking early — on a timeout, a rate limit, or an unhandled error — not of Shopify capping the endpoint.

Register entry 11 currently reads as a platform fact: *"`/products.json` is not exhaustive."* It is the register's newest entry and the register is the artefact intended to be checkable by strangers. If it is describing our own bug, it must not ship.

**Task:** re-fetch `/products.json` for all three stores with pagination fully instrumented — assert every page returns exactly 250 until a short page terminates the loop, log every HTTP status and every retry, and report the terminating page size. Then restate entry 11 as whichever it is:

- **Fetch bug** → entry 11 is withdrawn and replaced with a note that our earlier enumeration was truncated. The downstream consequence still holds — prior work used a short denominator — but the platform claim goes.
- **Genuine platform behaviour** → entry 11 stands, now with the terminating page size as evidence.

**Also verify the sitemap counts.** MAP at 102,176 products is 13× its `/products.json` figure. Confirm the parser deduplicates across `sitemap_products_*.xml` files, that it counts product URLs only, and that no URL appears twice. A count that large should be checked before it anchors anything.

---

## 3. Three over-claims in Stage 2

Each is a summary line that its own body contradicts.

**3.1 — Exhaustion is not confirmed.** The summary says *"Real query exhausts at ~300."* The body says the real query returned **50 products** before I-1 aborted on page 2, with `total_count` reported as 387. A run that stopped at 50 cannot confirm an exhaustion point at 300. **Re-run with the relaxed I-1 and paginate to actual termination.** Until then the ~300 boundary remains unverified, and with it U-7 and everything resting on "absent at depth."

**3.2 — The real-query tail was never inspected.** The summary marks tail inspection CONFIRMED. The body: *"Real query: Exhausted at 50 products. Ranks 200–220 are not available."* Only the nonsense arm ran. The nonsense result is clean and useful — those titles are unambiguously padding — but the claim that matters is about the **real-query** tail, and it is still unrun.

**3.3 — World B is confirmed for the head, not the tail.** Jaccard 0.97–1.00 and 94% positional agreement, measured on **the first 50 products**. World B was always a claim about ranks 13–300. Determinism in the top 50 says nothing about the tail. Restate as "the head is deterministic"; the tail claim remains open and depends on 3.1.

All three re-run together once I-1 is relaxed.

---

## 4. The I-1 relaxation is authorised, with its basis recorded

Relaxing a guard after it fires is the same structural move as moving a threshold, and it was decided by the agent whose runs it was blocking. In this case the justification is sound and the discovery is genuine — the API really does overlap pages.

**Authorised by directive, with these conditions:**
- The threshold is set from the **measured** distribution, not chosen round: observed overlap 1.6–8.1%, so a 20% ceiling is roughly 2.5× the maximum observed, and the U8-A signature (100%) sits far above it. Record those numbers in the invariant's source comment.
- I-1 **logs every overlap event with its magnitude**, so the distribution keeps being measured rather than assumed.
- If any run exceeds 15%, it aborts and reports rather than being relaxed further. **A second relaxation requires a directive.**
- Add the page-overlap behaviour to the platform-facts register as entry 12, with the 1.6–8.1% range and the per-query table.

---

## 5. The number this capability exists to produce

Once §1 gives an honest recall figure, the enumeration yields something no one has ever computed: **what fraction of a store's catalogue is absent from the Shopify Catalog.**

Subimods, 18,067 sitemap products, 13,358 recovered:

| True recall | Implied present | Implied absent | Absent share |
|---|---|---|---|
| 1.00 | 13,358 | 4,709 | 26.1% |
| 0.98 | 13,631 | 4,436 | **24.6%** |
| 0.90 | 14,842 | 3,225 | 17.8% |
| 0.85 | 15,715 | 2,352 | 13.0% |
| 0.80 | 16,698 | 1,370 | 7.6% |
| 0.75 | 17,811 | 256 | 1.4% |

Recall below ~0.74 is arithmetically impossible — the implied present set would exceed the sitemap. So **the absence rate for this store is bounded between roughly 0% and 26%**, and the reported 98% recall places it near the top of that range. The entire commercial weight of this number rests on the recall figure §1 corrects.

**Report it as a range with the recall it is conditioned on, never as a point estimate.** And it is one store. No claim about prevalence across stores is authorised until the method runs on at least three.

---

## 6. Claim boundary

**Added to what cannot be said:**

> That the enumeration achieves 98% recall — the ground truth was selected on findability. Use `recall_random` once §1 reports.
> That `/products.json` is not exhaustive — until §2 distinguishes platform behaviour from a truncated fetch.
> That a real query exhausts at ~300 — the confirming run stopped at 50.
> That the real-query tail contains genuine matches — that arm never ran.
> That World B holds in the tail — it was measured on the head.
> Any figure for the share of a catalogue absent from the Catalog, except as a range conditioned on a stated recall, for a single store.

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle" · any US claim about Google AI · that `shop.app` presence proxies Catalog presence · that syndication is decided per product · that H5 or H8 are revived.

---

## 7. Order of execution

1. **§2 `/products.json` re-fetch** and sitemap verification — this determines whether the register's newest entry survives → report
2. **§4 I-1 relaxation** with logging, then **§3** re-run of exhaustion, real-query tail, and tail-range World B → report
3. **§1 `recall_random`** on a 100-product random sitemap sample with the per-product reference standard, then **§5** absence range → report

Stop and report between stages.

**Not authorised:** any new hypothesis, the revival of H5 or H8, the exposé, any PUB-* work, any merchant-facing document, any outreach.
