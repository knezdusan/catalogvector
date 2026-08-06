# CatalogVector — Directive #17

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-16 §7 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-16, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What DIRECTIVE-16 established

Three things landed and they are the best-executed work in the project's history.

**The fetch bug was real and entry 11 was corrected before it shipped.** Subimods 5,250 → 18,066 with natural termination on a 66-product page; MAP 7,750 → 25,000 terminating on HTTP 400 at page 101, which is a genuine Shopify cap worth registering. The register's newest entry was withdrawn and restated rather than defended.

**The real-query tail was inspected for the first time**, and it is genuine — ranks 100 through 220 are Brembo, EBC, Hawk, PowerStop, DBA and Endless brake pads for a Civic Si. That arm had been marked CONFIRMED twice without ever running.

**World B was restated correctly and the consequence was drawn honestly:** head deterministic at 100%, tail at 0% positional agreement with Jaccard 0.48. Devin then wrote down, unprompted, that this invalidates single-run "absent at depth" categorisation. §3 below acts on that.

Two things now need correcting, and one of them moves the headline number.

---

## 1. The "false positive" class cannot exist — and the absence rate is lower than reported

### 1.1 The inconsistency

Stage 3 reports the enumeration's false-positive rate at 17.4% — 4 products the reference standard labelled **absent** but the enumeration **found**.

The enumeration is a union of scoped Catalog searches, seller-filtered under I-3. **A handle it returns for that seller is in the Catalog.** It cannot fabricate one. So those 4 are not enumeration false positives; they are **reference-standard false negatives**.

Stage 3 half-recognises this — *"this could mean the reference standard is slightly less sensitive"* — then proceeds to use the reference standard's 23% figure as the "independent estimate likely closer to the truth," while its own table shows 4 of those 23 being found. Those two statements cannot both stand.

### 1.2 The corrected number

Presence is established by **either** detector. Absence requires **both** to miss.

| | Present | Absent |
|---|---|---|
| Reference standard alone | 77 | 23 |
| **Union of both detectors** | **81** | **19** |

- Reference-standard sensitivity: **≤ 77/81 = 95.1%**
- **Absence rate: 19.0%**, 95% CI **11.3% – 26.7%** at n=100
- And **19% is an upper bound** — both detectors are imperfect, so some of the remaining 19 are likely present too

The reported "23.0–27.5%, roughly a quarter" becomes **"at most 19%, with a confidence interval wide enough to include 11%."**

**Task:** recompute the absence range using union presence, report the confidence interval on every figure, and restate §5 of the Stage 3 report. Also reconcile the recovered-handle count — DIRECTIVE-15 reports 13,358, DIRECTIVE-16 §5 uses 13,107, and the difference is unexplained.

### 1.3 The partition was built from 29% of the catalogue

Stage 1 §3 notes this and does not act on it: the 183 vendors and 342 product types were extracted from the old **5,250-product** fetch — 29% of the true 18,066. Vendors and product types that appear only in the missing 12,816 products were never in the partition.

**Task:** rebuild the partition from the full 18,066-product metadata, re-run the enumeration, and re-score against the same random sample and seed. Report the new recovered count, the new `recall_random`, and the new absence range. Recall may rise and absence may fall further.

---

## 2. `total_count` is a response budget, not a match count

| Query | `total_count` |
|---|---|
| brake pads for 2018 Honda Civic Si | 362 |
| zxqv flurbin widget | 361 |

Two semantically unrelated queries, 0.3% apart. That is not what a count of matching products looks like. It is a response budget.

The consequence matters: for a query with more than ~360 genuine matches — which "brake pads for a 2018 Honda Civic Si" across all of Shopify almost certainly has — **the result set is truncated by budget, not exhausted by relevance.** The tail inspection showing genuine brake pads at rank 200–220 is consistent with this: the budget is filled with the best available matches, and for a real query there are enough to fill it.

**Task, cheap and decisive:** issue five more wildly different queries — one per unrelated vertical — and report `total_count` for each. If they all cluster near 360, record it as register entry 13 and the CAP reading of U-7 is settled.

---

## 3. Rank-based absence testing is retired

Devin's own Stage 2 §4 implication is correct and stronger than stated. With tail positional agreement at 0% and Jaccard 0.48, **a single-run "absent at depth" observation is close to worthless** — roughly half the tail differs between runs, so a product can be absent in one run and present in the next by chance.

Combined with §2, ranked retrieval measures **rank within a truncated budget**, not membership. It was never the right instrument for absence.

**The enumeration is.** It asks membership directly, it does not depend on rank stability, and it now has a measured recall against a random sample.

**Task:** re-derive the following through the enumeration rather than re-running them with more pagination:

- The three "absolutely invisible" targets (DIRECTIVE-7 Stage 2)
- The six "absent at depth" targets
- **Subimods' 0/10 store-level invisibility** — the finding that survived longest and was measured by ranked retrieval on five products

**These are re-derivations, not new tests.** Report for each: present or absent under enumeration, and whether that agrees with the earlier rank-based verdict. Where they disagree, the enumeration result stands and the earlier one is withdrawn.

---

## 4. Three stores, or the number means nothing

Everything above concerns one store. Run the corrected enumeration on **TSP and MAP** as well.

TSP is the useful control: 2,608 products, `/products.json` complete, and previously the highest-visibility store in the ten-store scan. If TSP's absence rate is near zero while Subimods sits at 19%, the variation between stores is the finding. If both sit near 19%, it is a platform-wide rate and a different, larger claim.

**MAP requires care** — its `/products.json` is capped at 25,000 of 102,176 sitemap products, so the partition must be built from sitemap-derived metadata rather than `/products.json`, or it inherits the same 29%-partition problem §1.3 describes.

Report each store separately with its own confidence interval. **No pooled figure and no prevalence claim.**

---

## 5. H9 — the question that decides whether any of this is commercial

The instrument gate set in DIRECTIVE-15 §3 is now cleared: there is a validated measurement layer, and recall is measured against an unbiased sample. **One hypothesis is authorised.**

An absence rate of 19% is only worth a merchant's money if the absent products **matter**. If they are the dead long tail — discontinued, zero-demand, unpublished-in-practice — the finding is a curiosity. If absence is **systematic** and predictable from a fixable attribute, the merchant has a defect they can act on and you have a diagnosis to sell.

### PRE-REGISTERED DECISION RULE — H9, fixed 4 August 2026, before any run

> **H9:** absence from the Catalog is systematic, not random, with respect to publicly visible product attributes.
>
> **Design.** Using union-presence labels on a random sitemap sample of ≥300 products per store, across ≥2 stores, compare present and absent populations on: image count, variant count, price, `published_at` age, vendor, product type, tag count, body length, and whether the product appears in any store collection. **Hold out half before inspecting any attribute.**
>
> **H9 supported:** at least one attribute separates present from absent with ≥0.75 accuracy on the held-out half, in ≥2 stores.
>
> **H9 rejected:** no attribute exceeds 0.60 accuracy in any store.
>
> **H9 inconclusive:** anything between, or fewer than 2 stores reach 300 labelled products.

**If H9 is rejected, absence is random loss** — real, measurable, and not diagnosable. That is still a publishable platform finding and it is not a service. Report it plainly if that is the answer.

---

## 6. Claim boundary

**Corrected:**

> The Subimods absence rate is **at most 19%** (95% CI 11.3–26.7%, n=100, union presence), not 23–27.5%. It is an upper bound and it is one store.

**Added to what cannot be said:**

> That the enumeration has a 17.4% false-positive rate — that class cannot exist.
> That `total_count` reports the number of matching products.
> Anything derived from single-run rank-based absence, including the three absolutely-invisible targets, the six absent targets, and Subimods' 0/10, until §3 re-derives them.
> Any absence figure without its confidence interval and its store.

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · "products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle" · any US claim about Google AI · that `shop.app` presence proxies Catalog presence · that syndication is decided per product · that H5 or H8 are revived.

---

## 7. Order of execution

1. **§1.3 partition rebuild** on full metadata, **§1.2 union recomputation** with CIs, **§2** `total_count` probe → report
2. **§3 re-derivations** through the enumeration → report
3. **§4 TSP and MAP** enumeration with per-store CIs → report
4. **§5 H9**, half held out before any attribute is inspected → report

Stop and report between stages.

**Not authorised:** any hypothesis other than H9, the revival of H5 or H8, the exposé, any PUB-* work, any merchant-facing document, any outreach.
