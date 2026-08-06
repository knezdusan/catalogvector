# CatalogVector — Directive #15 (v2)

**Issued:** 4 August 2026
**Replaces:** the DIRECTIVE-15 draft in full. That draft was never transmitted to Devin; this is the version of record.
**Supersedes:** DIRECTIVE-14 §7 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-14, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. Two corrections before anything else — H5 and H8 are not revived

An external interpretation of DIRECTIVE-14 concluded that H5 and H8 were "killed by instrument error" and are "officially back on the table." **Both are wrong, and acting on either would resurrect a dead premise — the exact failure `BLUEPRINT.md` §3 exists to prevent.**

**H5 (offer attachment / UPID clustering) is deader than before, not revived.** It was killed twice, independently:

1. DIRECTIVE-7 Stage 1 — 900 products inspected, 0 with more than one variant, 0 with more than one distinct seller, no UPID or cluster field at any JSON path.
2. DIRECTIVE-14 §1 — a **fresh fetch with correct pagination**, 300 rows, 248 distinct product IDs, 0 with more than one variant, 0 with more than one distinct seller, **0 product IDs shared across sellers**.

The second confirmation was run *because* of the pagination bug and *with the bug fixed*. The corrected instrument reproduced the finding that killed H5. There is no shared product identity in the Catalog, so there is no "AI Buy Box" to win, and no service can be built on one.

**H8 (stale Catalog entries) was not killed by handle-matching error.** The test was: fetch 401 candidate handles directly. Result: 401 returned `200` with `available: true`. Zero 404s. That test involves no pagination and no matching — a direct URL either resolves or it does not. A broader or better-derived candidate set would have surfaced *more live products*, not more dead ones. **H8's rejection is strengthened by the `/products.json` finding, not weakened by it**: the "extra" Catalog handles are explained by the store listing being incomplete, which is precisely the alternative H8 was designed to rule out.

**Neither is re-registered. Neither is tested again.** If either returns in a future plan, this section is the reason it does not.

---

## 1. What a broken instrument does and does not license

A corrupted measurement produces **uncertainty in both directions**. It does not produce evidence that the platform is chaotic, that the market is open, or that the opportunity is larger than believed. "Our tools were broken" and "the ecosystem is flawed" are different statements, and only the first is supported.

The honest position after DIRECTIVE-14 is: **the project knows less than it thought it knew, symmetrically.** Some things that looked dead may not be. Some things that looked alive may not be. Nothing about the size of the opportunity has been established in either direction, and no re-run may be framed as expected to confirm anything.

---

## 2. Evidence triage — what is sound, compromised, or never established

Every future report cites this table. Do not re-run what is sound; do not quote what is compromised.

### Sound — no dependency on the corrupted pagination or on `/products.json` as a denominator

| Finding | Why it holds |
|---|---|
| Register entry 1 — per-merchant rows, distinct IDs, one seller each | DIRECTIVE-14 §1, fresh fetch, correct pagination |
| H8 rejected — the Catalog does not serve dead products | 401 direct URL fetches, no pagination, no matching |
| `surface_trigger_rate` variation — 0% outdoor gear, 67% auto | Browser observation, no API pagination. Small n |
| U-6-R product cards and the platform audit | Browser capture plus HTTP fingerprinting |
| Register entries 1, 4, 5, 6 — UPID, `tags` schema, scoped fallback, `filters.shops` | Direct payload inspection |
| No per-store Catalog enumeration endpoint (entry 10) | Measured 54% false-negative rate |

### Compromised — must be re-derived before being quoted

| Finding | Cause |
|---|---|
| World B — set overlap 0.90–1.00 | U8-A pagination bug |
| Tail inspection — ranks 200–300 are genuine matches | Same corrupted file |
| ~300 is a relevance threshold rather than a response cap | Rests on the tail inspection |
| "Absent at depth is a strong claim" | Rests on the above |
| "16 distinct products per query" | Already withdrawn |
| Title-coverage scan, store-visibility sampling, H7's design | Used `/products.json` as an exhaustive denominator |
| U-7's boundary analysis, the depth-1000 run, 6 absent / 3 absolutely-invisible targets | Pagination of the depth-1000 script never verified |

### Sound with a caveat

| Finding | Caveat |
|---|---|
| Fitment coverage gap 0.385, compliant sample | Per-product recall is unaffected by a short denominator, but the **sample may be unrepresentative** if `/products.json` is systematically incomplete. Re-check representativeness against the sitemap; do not re-run the recall computation |

---

## 3. The runtime invariant set — the answer to "how do we not find this three directives later"

Every historical failure in this project was detectable **at runtime, by a one-line assertion**, at the moment it happened. Not by review, not by a later directive. The U8-A bug would have thrown on page 2: the same IDs as page 1.

Implement these as assertions inside a shared probe library. **A probe that cannot satisfy its invariants aborts and reports; it does not return partial data.**

| # | Invariant | The failure it would have caught |
|---|---|---|
| **I-1** | Consecutive pages must share zero product IDs, and the cursor must change between requests | The U8-A pagination bug — would have thrown on page 2 |
| **I-2** | Any store enumeration must equal the sitemap product count, or abort with the delta | `/products.json` being short by 40–75% |
| **I-3** | Every presence or absence claim must carry a `seller.domain`; a claim without one is rejected | H6's product-match-vs-seller-match error, and U-9's repeat of it |
| **I-4** | Every result row records which API or surface produced it, and cross-surface comparison is refused | H7 — a `shop.app` finding read as a Catalog finding |
| **I-5** | Domain comparison is normalised (`www.`, case, trailing dot) and the compared domain must exist in the known-store list | The `twosteppeRformance` one-character false negative |
| **I-6** | Any membership or matching method reports its false-negative rate against committed ground truth **before** any result derived from it is quoted | The 54% false-negative membership test — this one already worked; generalise it |

**I-6 is the model, and it is worth naming why.** The one time a directive required a method to be validated before use, the process worked exactly as intended: Devin validated the membership test, measured 54% false negatives, and stopped rather than proceeding. That is not luck. It is what happens when validation is a gate rather than a review step. Every method now gets that gate.

**Provenance requirement:** every number in every future report carries its source file, the script's commit hash, and which invariants passed. **A number without provenance is not reportable.**

---

## 4. Re-validation — do this first

Report before interpreting anything.

1. **Exhaustion.** Paginate one real query and one nonsense query with verified-correct `--set` syntax until `has_next_page` is false. Report the terminating count, final page size, and distinct-ID count at every page boundary. **State the exact CLI invocation.**
2. **World B.** Re-run the three-run determinism probe with correct pagination. Report set Jaccard *and* positional agreement, plus distinct-ID count per run.
3. **Tail inspection.** Re-draw 20 products from the true ranks 200–300 of a real query and 20 from a nonsense query. Hand-read the titles.
4. **Depth-1000.** Confirm whether the DIRECTIVE-7 Stage 2 script paginated correctly. If not, the six absent and three absolutely-invisible targets are withdrawn pending a re-run.

---

## 5. Store enumeration — `/products.json` is not exhaustive

Subimods: 5,250 in `/products.json` plus **4,005 further handles returning `200` with `available: true`**. MAP: 7,750 plus 6,085. A handle returning 200 from the store's own domain **is** that store's handle; the listing is incomplete.

**Task:** enumerate all three stores from `/sitemap.xml` → `/sitemap_products_*.xml`. Report a three-way comparison — sitemap products, `/products.json` products, Catalog handles — with overlaps, and state which source is exhaustive. Add to the register as entry 11 with the measured shortfall.

This becomes invariant I-2 and the ground truth for everything downstream.

---

## 6. The measurement layer — and why it is the product

**6.1 — Fixtures.** A committed test suite over recorded API responses covering pagination, seller extraction, handle extraction from variant URLs, and enumeration completeness. Every future probe imports from this layer. **No probe issues raw CLI calls again.**

**6.2 — Ground truth.** 50 products hand-confirmed present in a store's Catalog and 50 hand-confirmed absent, committed as fixtures. Enforces I-6.

**6.3 — Solve enumeration.** The search is relevance-ranked, but the query space can be partitioned. The sitemap gives every product; each product gives a vendor, a product type, and tags. Issue scoped queries across that full partition — thousands, not forty — union the results, and score against 6.2 after each expansion. **Report the false-negative curve.**

**If that curve flattens above 90% recall, this project has a capability nobody else has.** Every diagnostic it has attempted — which products are missing, who holds the slots, what the assortment gap is — requires enumeration first, and no competitor can answer any of them without solving it.

**The moat is a capability, not a finding.** Fifteen directives of findings have died. The enumeration problem has not.

**No commercial claim attaches to this.** If the curve does not flatten, the honest report says so and the options narrow accordingly.

---

## 7. Claim boundary

**Added to what cannot be said:**

> That H5 or H8 are revived — both were confirmed dead by corrected instruments.
> That a broken instrument implies an open market, a flawed ecosystem, or a larger opportunity.
> Anything in §2's compromised list, until re-derived.
> That `/products.json` enumerates a store's catalogue.

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle" · any US claim about Google AI · that `shop.app` presence proxies Catalog presence · that syndication is decided per product.

---

## 8. Order of execution

1. **§3 invariants I-1 through I-6** implemented as a shared library with fixtures, plus **§5 sitemap enumeration** → report
2. **§4 re-validation**, all four items, run through the new library, exact CLI invocations stated → report
3. **§6.2 ground truth**, then **§6.3 enumeration with the false-negative curve** → report

Stop and report between stages. §3 comes first deliberately: the re-validation in §4 must run through the instrumented library, or it is one more unverified probe.

**Not authorised:** any new hypothesis, the revival of H5 or H8, the exposé, any PUB-* work, any merchant-facing document, any outreach.
