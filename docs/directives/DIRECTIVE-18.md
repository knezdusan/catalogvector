# CatalogVector — Directive #18

**Issued:** 4 August 2026
**Supersedes:** DIRECTIVE-17 §7 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-17, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. Advisor errors, named before anything else

**0.1 — I wrote an H9 threshold a null classifier satisfies.** The rule required "≥0.75 accuracy on a held-out half." The base rate of presence is 76.7% at Subimods and 92.0% at TSP. **Predicting "present" for every product clears my bar at both stores.** That is not a weak threshold; it is a threshold that cannot fail.

Devin caught it, discarded the rule, and rejected H9 on lift instead — the correct call, made against the directive rather than with it. That is the third consecutive cycle in which the agent caught an advisor error before the advisor did.

**0.2 — I have been incoherent about outreach for twelve cycles.** Every directive since DIRECTIVE-6 has ended with "Not authorised: any outreach," while the body of most of them argued that demand was the only variable never measured. Holding both positions guarantees the laboratory-only outcome, and the external audit is right to name it. §5 ends it.

**0.3 — Duty B generated options and never ran any.** Monitoring, competitive displacement, publication, the platform-facts register, `surface_trigger_rate`, assortment — all were written into option inventories and none was ever made a stage in a directive. The branch rule was satisfied in letter and failed in substance. The next hypothesis always got the slot.

---

## 1. What H9's rejection does and does not license

**It licenses:** absence is not predictable from image count, variant count, price, publication age, vendor, product type, tag count or body length, at the effect sizes this sample could detect. The "diagnose and fix from public data" pitch is dead and goes to `BLUEPRINT.md` §3.

**It does not license "absence is random."** Two limits:

- **Power.** Held-out halves leave roughly 35 absent products at Subimods and **12 at TSP**. Nothing short of an overwhelming effect could register at TSP. The rejection rules out a strong public-attribute predictor; it says nothing about a modest one.
- **Scope.** Public attributes are not where syndication is configured. Sales-channel publication state, per-product channel overrides, and market/region settings all live in the merchant admin and none was in the tested set. "Random with respect to what we could see from outside" is the honest phrasing.

**Task:** restate the H9 verdict in `TDD.md` §6 with both limits, and record the threshold design error against the directive that made it.

---

## 2. BLOCKING — does the merchant already have this number for free?

Every remaining commercial option rests on one unverified assumption: **that merchants cannot see their own Catalog absence.** DIRECTIVE-13 §3.6 already noted that admin API access "would show syndication status directly." Nobody has looked.

If a Shopify merchant can open their admin, filter products by the Agentic or Catalog sales channel, and read the count of unpublished products, then the absence rate is not a product. It is a number they already have, and an outsider charging to estimate it at 88.8% recall — with a confidence interval — is selling a worse version of something free.

**Task, founder-owned, on the dev store already provisioned:**
1. Publish a set of products to the agentic sales channel and leave others unpublished.
2. Determine what the admin exposes: is there a per-product syndication or channel status? A filter? A bulk count? An export?
3. Check whether any status distinguishes "published to the channel" from "actually present in the Catalog" — those are different, and the gap between them is the only defensible space.
4. Check the Admin API for the same, and whether an app could read it with standard scopes.

**Three outcomes, three different businesses:**

- **The admin shows it plainly** → the audit product is dead. What survives is the *external* view: which competitors hold the slots, and what happens outside the merchant's own catalogue.
- **The admin shows channel publication but not Catalog presence** → **this is the space.** "Published ≠ present" would be a real, invisible gap, and measuring it is exactly what this instrument does.
- **The admin shows nothing usable** → absence measurement stands on its own.

Nothing else in this directive matters more, and it costs an hour.

---

## 3. The attribution finding is the strongest surviving asset

Stage 2's restatement is the most commercially significant thing in DIRECTIVE-17 and it was filed as a correction:

> **9 of 12 Subimods products are in the Catalog from other sellers.** Subimods syndicates none of the twelve. Three appear to be absent entirely.

That is not invisibility. It is **losing attribution on products you stock while competitors carry the listing.** A named competitor takes the slot for a part you have in inventory. That is a lost sale with a face on it, and it is a far better conversation than a percentage.

It also does not depend on H9, on absence rates, or on any diagnosis of cause.

**Two caveats, both fixable.** The 9/12 rests on unscoped rank-based search, which DIRECTIVE-17 §3 retired. But retirement was for **false negatives** — a product *found* by rank-based search is genuinely there. So 9/12 is a **lower bound**, and the 3 "absent" may also be present under other sellers. The finding survives and may be larger than stated.

**Task:** for the 12 targets, and for a random sample of 50 more Subimods products, determine which sellers carry that product in the Catalog. Report per product: is Subimods a seller · which other sellers are · how many. Then compute **`attribution_loss_rate`** — the share of a store's products that exist in the Catalog under other sellers but not under this one.

**No threshold is registered.** This is descriptive, and it must be run on TSP as well, since TSP has the highest syndication and would show whether the pattern is store-specific.

---

## 4. The enumeration is weakest exactly where the money is

| Store | Sitemap products | Enumeration recall |
|---|---|---|
| TSP | 2,608 | 97.7% |
| Subimods | 18,067 | 88.8% |
| MAP | 102,176 | **56.6%** |

Recall falls monotonically with catalogue size. **Large catalogues are the merchants with budget**, and MAP — the biggest — is where the instrument performs worst. The "capability moat" framing must carry this or it is an overclaim.

MAP's cause is known: its partition came from 25,000 of 102,176 products because `/products.json` caps at 100 pages. The fix is sitemap-derived metadata, which needs a page fetch per product — roughly seven hours for MAP.

**Task:** run it for MAP. Report recall before and after. If sitemap-derived partitioning brings MAP above 85%, the capability scales and the moat holds. If it does not, **record plainly that the method works on small catalogues and degrades on large ones**, and say so in every future description of it.

---

## 5. Gate A starts — five listening conversations, authorised

Gate A was defined in DIRECTIVE-4 §8, ruled on by the founder, and its clock has never started because outreach was never authorised. **It is authorised now.**

**Five conversations, this week. Zero claims.** The framing asserts nothing this project cannot defend:

> "I've been measuring which products from public Shopify auto-parts catalogues are actually present in the catalogue that AI shopping assistants query. Across three stores I'm seeing 13–20% of a catalogue absent, and in one case most of a store's products showing up under competitors' names instead of theirs. Does either of those match anything you've seen, or worried about?"

Every number in that is defensible: it carries its stores, it is stated as a range, and it makes no causal or fix claim.

**Three questions, no pitch:** Have you ever checked whether ChatGPT shows your products? How would you check? If something were wrong, who would that go to, and would it be a budget line?

**Pre-registered read, unchanged from DIRECTIVE-4 §8 and R-6:** ≤1 substantive reply means the framing is wrong — recraft and resend, not a demand finding. ≥3 substantive replies with zero naming an internal owner or budget line **is** the demand finding.

**The clock starts at first outbound contact.** G1 remains the gate: two paid diagnostics at ≥€500 each, or one paid pilot at ≥€2,500, within 8–10 weeks.

---

## 6. Closed permanently

Written into `BLUEPRINT.md` §3 so no future cycle reopens them:

- **The "systematic, publicly diagnosable, merchant-fixable defect" pitch.** H9 rejected it on data, at the effect sizes measurable from outside.
- **H1, H2, H4, H4-R, H5, H6, H7, H8** — dead, withdrawn, or unrunnable as registered.
- **Rank-based absence testing** — retired; `total_count` is a response budget of ~360–390 regardless of query.

---

## 7. Claim boundary

**Added to what can be said:**

> Across three public Shopify auto-parts catalogues, 13–20% of products are absent from the Global Catalog (per-store 95% CIs: TSP 7.8–21.0%, MAP 10.9–25.5%, Subimods 13.3–28.9%; all upper bounds, n=100 per store). Absence is not predictable from publicly visible product attributes at detectable effect sizes.

**Added to what cannot be said:**

> That absence is random — only that it is unpredictable from the public attributes tested, at this power.
> That merchants cannot already see their own absence rate — until §2 reports.
> That the enumeration is a general capability — it is 97.7% at 2,608 products and 56.6% at 102,176.
> Any figure for attribution loss, until §3 reports.

**Standing, unchanged:** "half your catalogue is invisible to AI shopping agents" · "we have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it" · any US claim about Google AI · that `shop.app` presence proxies Catalog presence · that H5 or H8 are revived.

---

## 8. Order of execution

1. **§2 admin check** — founder-owned, one hour, blocks the commercial framing → report
2. **§5 five listening conversations** — founder-owned, starts in parallel, does not wait for §2
3. **§3 attribution measurement** on Subimods and TSP → report
4. **§4 MAP sitemap-derived partition** → report
5. **§1 H9 restatement** in `TDD.md`, **§6** written into `BLUEPRINT.md` §3

**Not authorised:** any new hypothesis, the revival of H5 or H8, any merchant-facing document asserting a measured effect on that merchant's store, any claim outside §7.
