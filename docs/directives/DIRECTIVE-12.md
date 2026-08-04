# CatalogVector — Directive #12

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-11 §8 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-11, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What this cycle did well, and the one thing it produced by accident

Three things were done properly. **U8-B's failure was reported as a methodological finding rather than a null** — the observation that token overlap cannot locate a boundary when the floor shares the query's vocabulary is a real result and it is correctly reasoned. **The platform audit used real methods** — `products.json` responses, `powered-by` headers, `_shopify_y` cookies, `robots.txt` signatures — rather than guessing, and it correctly overturned its own prior figure from 28.6% to 57.1%. **H6 was rejected cleanly** on its pre-registered threshold with no attempt to rescue it.

And the cycle produced one result nobody scored, in H6 §4.4 finding 2: **products absent from the Catalog API are present on `shop.app`.** That is the most important sentence in the report and §4 below is built on it.

---

## 1. U8-A measured the wrong quantity — recompute it (free, decisive)

U8-A reports "~40% agreement by decile," defined as *"~40% of positions have the same product across all 3 runs."* That is **positional** agreement. It cannot distinguish two entirely different worlds:

| | Run 1 tail | Run 2 tail | Positional agreement | Set overlap | Meaning |
|---|---|---|---|---|---|
| **World A** | {a, b, c, d, e} | {a, q, r, d, s} | ~40% | ~40% | Tail drawn fresh each time — **padding is real** |
| **World B** | {a, b, c, d, e} | {c, a, e, b, d} | ~40% | **100%** | Same products, shuffled — **no padding; a stable candidate set with noisy ordering** |

The report concluded padding. **Set overlap was never computed.** The three runs are already on disk.

**Task:** for each of the 3 runs of both queries, compute the Jaccard overlap of the full product-ID **sets**, and the set overlap restricted to ranks 13–300. Report set overlap alongside positional agreement at every decile.

**Why this decides more than any other pending item:**

- **World A** → "absent at depth" is weak. Absence from a partly random draw proves little, and the invisibility findings shrink accordingly.
- **World B** → "absent at depth" is **strong**. Absence from a stable, exhaustive, relevance-ordered 300-product set — for a query built from your own product title — is close to a binary defect.

Two pieces of existing evidence already point at World B. The nonsense query's tail returns refrigerator filters and iPhone cases; the real query's tail returns auto parts. And U8-B found real-query tails carry 0.40–0.98 fractional token overlap at every decile, which is not what a random draw looks like.

**Also fix two smaller defects in U8-A:** run 3 of the nonsense query terminated at 200 products rather than 300, so its agreement figures are computed across unequal lengths and understate agreement — re-run it. And U8-A covered one real query; extend to four before "H ≈ 12" is quoted anywhere.

---

## 2. The real-query tail and the nonsense floor may be different mechanisms

U-7 established that a nonsense query returns ~300 unrelated products, and the project has since treated every response tail as padding of that kind. The evidence in this cycle says otherwise:

| | Nonsense query | Real query |
|---|---|---|
| Deterministic prefix | 6 ranks | 12 ranks |
| Post-prefix positional agreement | ~5–10% | ~40% |
| Tail contents | Refrigerator filters, iPhone cases, AirPods | Auto parts |
| Fractional token overlap in tail | 0.00 | 0.40–0.98 |

Those are not the same phenomenon. A real query's tail plausibly contains **genuine low-relevance matches**, not padding — in which case the ~300 boundary is the relevance THRESHOLD that DIRECTIVE-8-v2 §1 registered as one of three possible U-7 outcomes, and it was never resolved.

**Task:** hand-inspect 20 products drawn from ranks 200–300 of a real query. Are they plausible answers to that query, or unrelated? Report verbatim titles with the rank of each. This is a twenty-minute read and it resolves how every existing presence figure may be described.

---

## 3. H6's buried finding — check the seller, not the product

H6 records that all 20 products were found on `shop.app`, including 5 Subimods products that return zero on their own Catalog queries. But the method searched **product titles** and recorded whether *a matching product* was found.

**A Fluidampr damper appearing on `shop.app` from some other merchant says nothing about Subimods.** This is the same failure the platform audit corrected two sections earlier: identifying the product rather than checking the seller.

**Task:** for each of the 5 Subimods products, determine whether **Subimods' own listing** is on `shop.app` — seller name and merchant domain on the result, not just a title match.

- **Subimods' own listings present on shop.app, absent from the Catalog API** → two Shopify surfaces disagree about the same merchant. That is a platform inconsistency, it is novel, and it is the sharpest thing in the project.
- **Only other merchants' listings present** → H6's finding 2 dissolves and Subimods' absence is consistent across both surfaces.

---

## 4. U-9 — is the Catalog API the index that feeds the assistants? (blocking everything)

`BLUEPRINT.md` §2.2 asserts the Global Catalog *"is the same retrieval surface the consumer AI assistants query."* Eleven directives of measurement inherit that assumption. U-6 was meant to test it and tested rank correlation instead. Three observations now put the assumption itself in doubt:

1. `shop.app` returns products the Catalog API does not (H6 §4.4 finding 2).
2. ChatGPT's B3 card cited a `shop.app` URL, not a merchant Catalog entry.
3. OpenAI's documentation names "Shopify Catalog" as the integration — but *Shopify Catalog* is a product name, and this project probes the UCP `search_catalog` endpoint. Those may not share an index or a ranking. Shopify's public documentation has already been wrong about its own Catalog in eight recorded places.

**If the UCP endpoint is not the index behind the assistants, every Catalog-side measurement in this project is a measurement of the wrong system** — and that is worth knowing now rather than after a merchant asks.

### PRE-REGISTERED DECISION RULE — U-9, fixed 4 August 2026, before any run

> **Design.** Assemble two disjoint sets of 10 products each, using measurements already in hand:
> **Set A** — present in the Catalog API's deterministic top-12 for a query.
> **Set B** — absent from the Catalog API at depth for that same query, but present on `shop.app` under their own merchant's listing (per §3).
> Then issue the corresponding buying-intent query to ChatGPT and record which set the carded products come from.
>
> **SAME INDEX** — carded products come from Set A in ≥8 of 10 pairings and from Set B in ≤2. The UCP endpoint tracks the assistant's index; the project's instrument is validated and eleven directives of measurement stand.
>
> **DIFFERENT INDEX** — Set B products appear in cards in ≥4 of 10 pairings. The UCP endpoint is **not** the assistant's retrieval surface. Every Catalog-side presence figure describes a system the buyer never touches, `BLUEPRINT.md` §2.2 requires amendment by directive, and the instrument must be rebuilt against whatever surface does feed the cards.
>
> **INCONCLUSIVE** — fewer than 6 pairings produce any card, or Set B cannot be assembled at 10 products.

If Set B cannot be assembled, say so and stop — that itself is evidence the two surfaces agree.

---

## 5. The authenticated pass is unscored, not closed

The founder note reports 18 queries across three assistants via a US VPS, concluding *"neither returned the Shopify store results… the results pointed mostly toward specific product pages on the sites/URLs in USA — not toward the Shopify stores from our scan set."*

**That is the Block D error again.** The scan set is ten auto-parts stores. The question the directive asked is whether **Shopify merchants** appear, not whether *those ten* appear. And "a specific product page on a merchant site in the USA" is exactly what `bc.springrates.com/products/…` and `www.quince.com/home/linen-duvet-cover` look like — both of which the platform audit confirmed as Shopify merchants in the *anonymous* pass.

So the note's headline and §1's audit are not in conflict; the note is describing the same result with the sellers unaudited.

**Task, founder-owned, and it needs no re-running:** from the 18 transcripts already captured, list every merchant domain that appeared, then hand them to Devin for the same platform audit that §1 performed — `products.json`, `powered-by` header, `_shopify_y` cookie. Also report, per assistant: how many queries produced a card, how many produced prose only, and which surface each observation came from.

Until that exists, §2 cannot be scored and no claim about authentication's effect is licensed in either direction — including "it made no difference."

---

## 6. `surface_trigger_rate` — one confound to remove before it becomes a hypothesis

The report gives "Help me find" at 53.8% and "Shop for" at 27.3% and flags it as counterintuitive. It may be entirely a vertical effect wearing a phrasing costume: if "Shop for" was used disproportionately in outdoor gear (0% trigger rate), the phrasing difference is the vertical difference.

**Task:** report the phrasing × vertical crosstab from the 24 queries already run. If the phrasings are unbalanced across verticals, say so and report the phrasing effect within vertical only. Zero cost.

The vertical signal — 0% across 4 outdoor-gear queries against 66.7% in auto — is the stronger result and it survives this correction either way. It stays descriptive; no hypothesis is registered until n per vertical is at least 10.

---

## 7. Claim boundary

**Updated — what can now be said:**

> ChatGPT renders product cards for roughly 40% of shopping queries in a 24-query probe, ranging from 0% in outdoor gear to 67% in auto parts. Where cards render, 4 of 7 contained at least one Shopify merchant, verified by platform fingerprinting. The Shopify Catalog API returns a deterministic ordering for the first ~12 ranks of a query and a partially unstable ordering thereafter, to an exhaustion point near 300.

**What still cannot be said:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> "Products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."
> That `shop.app` presence predicts ChatGPT card appearance — H6 rejected.
> Anything about ranks 13–300 being padding, until §1 reports set overlap.
> Anything about authentication's effect, until §5 is scored.
> **That the Catalog API measures the surface consumer assistants query — until U-9 reports.**

---

## 8. Order of execution

1. **§1 set-overlap recomputation** and **§6 crosstab** — both free, both on existing data → report
2. **§2 tail inspection** and **§3 shop.app seller check** → report
3. **§4 U-9** → report
4. **§5 authenticated-pass scoring** — founder lists merchant domains, Devin audits platforms

Stop and report between stages.

**Not authorised:** the exposé, any PUB-* work, any merchant-facing document, any outreach.
