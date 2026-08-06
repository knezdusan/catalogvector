# CatalogVector — Directive #14

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-13 §6 (order of execution) and DIRECTIVE-13 §1 (H7 as specified).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-13, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. The H7 error was mine

DIRECTIVE-12 §3 asked whether **Subimods' own listing is on `shop.app`**. That was the question, and Devin answered it correctly: it is not, except for OEM parts and Motul oils.

DIRECTIVE-13 §1 then built H7 on that result as though it were a statement about the **Catalog API**. It was not. I conflated the two surfaces one directive after Devin had correctly separated them, and I did it in the same document that told Devin to check the seller rather than the product.

Devin caught it, tested the five products directly against the Catalog, found all five present under Subimods' seller name, and reported it as the headline of its own round rather than burying it. That is the correct behaviour and it is the second consecutive cycle in which the agent has caught an error before the advisor did.

**H7 as specified is withdrawn.** What survives of the observation is relocated in §3.

---

## 1. BLOCKING — two of this project's findings contradict each other

**Platform-facts register entry 1**, established DIRECTIVE-7 Stage 1 and used to kill H5:

> *"The same physical part appears as separate rows with different product IDs, one per merchant."* Evidence: 900 products inspected, 0 with more than one distinct seller.

**DIRECTIVE-13 §3**, "counted distinct product IDs vs total listings":

| Query | Listings | Distinct product IDs | Ratio |
|---|---|---|---|
| brake pads 2018 Civic Si | 300 | 16 | 18.8× |
| cold air intake FL5 | 300 | 16 | 18.8× |
| BC Racing coilovers Acura TL | 300 | 14 | 21.4× |
| downpipe FK8 | 300 | 13 | 23.1× |

If every merchant's listing carries its own product ID, 300 listings are 300 distinct IDs. **These cannot both be true**, and the consequences run in opposite directions:

- **If 16 distinct IDs is correct** — the Catalog carries a **shared product identity across merchants**. Register entry 1 is wrong, **H5 (offer attachment) was killed on a false premise**, and "is your listing attached to the canonical product, and where does it sit among the offers" becomes testable again. That was the sharpest commercial hypothesis this project ever registered.
- **If entry 1 is correct** — §3 deduplicated on something other than product ID, the ~19× duplication is an artefact, and the 16-distinct-products reframe in §4 evaporates.

**Task, first, before anything else:** for one query's 300 rows, print `product.id` and `variants[].seller.domain` side by side, and report the exact JSON path each was read from. Then state which of the two findings is wrong and correct it in the register with the evidence.

Nothing in §2, §3 or §4 is interpreted until this resolves.

---

## 2. The membership test was run in the unreliable direction

H7's membership test asked *"is this store product in the Catalog?"* — which requires enumerating a shop's Catalog presence. The Catalog's search is relevance-ranked with no enumeration endpoint, which is why the false-negative rate came out at 54%. That is a correct and well-evidenced negative result, and the decision to stop rather than proceed was right.

**The opposite direction has no such problem.** Asking *"is this Catalog entry still a live product on the merchant's storefront?"* is a direct fetch of a known URL. It returns 200 or 404. There is no ranking, no relevance, no false negatives.

And the data already suggests something is there: the scoped union returned **6,707 unique Subimods handles against 5,250 products in the public `/products.json`** — the Catalog appears to hold more than the live store does. The matching was unreliable in both directions so that gap is not yet a finding, but it is directly testable.

### PRE-REGISTERED DECISION RULE — H8, fixed 4 August 2026, before any run

> **H8:** the Shopify Catalog serves products that are no longer purchasable on the merchant's storefront.
>
> **Design.** Take every Catalog handle recovered for **3 stores** that does not appear in that store's current `/products.json`. For each, fetch `https://<domain>/products/<handle>.json` directly. Classify: **200 with `available: true`** (handle matching was wrong — not a finding) · **200 with all variants `available: false`** (present but out of stock) · **404 or removed** (stale Catalog entry).
>
> **H8 supported:** ≥5% of a store's recovered Catalog handles return 404, in ≥2 of 3 stores.
>
> **H8 rejected:** <1% return 404 in ≥2 of 3 stores.
>
> **H8 inconclusive:** anything between, or fewer than 2 stores yield ≥200 testable handles.

**Why this is worth more than H7 was.** It is the mirror image and a stronger commercial claim: not "your products are missing" but **"agents are recommending products you no longer sell."** That is a live harm — a lost sale plus a bad buyer experience attributed to the merchant. It is binary, per-SKU, verifiable by the merchant in one click, and it requires no ranking claim, no `fitment_recall`, and no retrieval theory. It is also consistent with a platform fact already recorded: only inventory and price are real-time; other fields carry refresh delay.

**Report the out-of-stock class separately.** A product that exists but is unpurchasable is a different and weaker claim than one that has been deleted, and collapsing them would overstate the finding.

---

## 3. H7 relocated — to the surface it was actually observed on

The original observation is intact and was never disproved: **`shop.app` indexes Subimods' OEM parts and Motul oils but not their aftermarket performance products, while the Catalog API indexes all of them.** That is still a discrimination inside one merchant's catalogue. It is simply a `shop.app` phenomenon, not a Catalog one.

Two reasons that is worth pursuing rather than discarding:

- **`shop.app` is consumer-facing, and ChatGPT cited a `shop.app` URL** in the B3 card. It may be closer to what a buyer actually sees than the Catalog API is.
- **`shop.app` may be enumerable per seller**, which the Catalog API is not. If a merchant has a browsable store page on `shop.app`, membership becomes a direct check rather than a search problem — and the 54% false-negative failure does not recur.

**Task, exploratory, no hypothesis registered:** determine whether `shop.app` exposes a per-seller listing surface. If it does, enumerate Subimods' `shop.app` presence and compare against `/products.json`. Report the method and its false-positive and false-negative behaviour **before** reporting any counts.

If `shop.app` is not enumerable per seller, say so and stop. Do not substitute a search-based approximation — that is exactly what produced the 54% failure.

---

## 4. Sixteen distinct products, if §1 confirms it

Conditional on §1 resolving in favour of shared product IDs.

Sixteen distinct products for *"brake pads for a 2018 Honda Civic Si"* across all of Shopify would reframe the project's commercial question entirely. Competition would sit at the **product** level, not the merchant level. A merchant stocking one of the sixteen competes with up to thirty others for that product's offers. A merchant stocking a seventeenth product is invisible regardless of data quality, title hygiene, or `tech_specs` coverage.

That makes the diagnosis an **assortment** question rather than a data-hygiene one: *"none of your brake-pad SKUs are among the sixteen products agents surface for your highest-value query."* That is a merchandising decision with real money attached, it is checkable, and no monitoring tool on the market can produce it because none of them can see the Catalog.

**No task is authorised on this yet.** It is recorded so it is not lost, and it becomes live only if §1 confirms shared product identity.

---

## 5. Claim boundary

**Added to what cannot be said:**

> That syndication is decided per product — H7 was withdrawn; the observation behind it was a `shop.app` finding misread as a Catalog finding.
> That the ~300 set contains ~15 distinct products — until §1 resolves the ID contradiction.
> That the Catalog holds more products than a store's live catalogue — until H8 reports.

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle" · any US claim about Google AI · that `shop.app` presence proxies Catalog presence.

---

## 6. What DIRECTIVE-13 got right, recorded

The membership-test failure is a genuine platform finding and belongs in the register: **there is no way to enumerate a shop's Catalog presence.** Search is relevance-ranked, `lookup_catalog` takes opaque Catalog IDs that do not correspond to store product IDs, and no conversion endpoint exists. Any third party attempting per-store Catalog auditing hits the same wall — which is both a limitation on this project and a barrier to entry protecting it.

Add as register entry 10, with the 54% false-negative measurement as evidence.

---

## 7. Order of execution

1. **§1 ID contradiction** — one query, 300 rows, IDs and seller domains printed → report before anything else
2. **§2 H8** — stale Catalog entries, 3 stores → report
3. **§3 shop.app enumerability** — method and its error behaviour reported before any counts → report
4. §6 register entry 10; changelogs and version bump

Stop and report between stages.

**Not authorised:** the exposé, any PUB-* work, any merchant-facing document, any outreach.
