# CatalogVector — Directive #11

**Issued:** 3 August 2026
**Supersedes:** DIRECTIVE-10 §7 (order of execution).
**Still binding:** everything else in DIRECTIVE-3 through DIRECTIVE-10, `BLUEPRINT.md`, and `TDD.md`.

---

## 0. What U-6-R settled

**The exposé premise is dead, on this project's own data.** Two product cards in ChatGPT cited Shopify merchants: B3 linked to `shop.app/products/…` — Shopify's own consumer app — and C2 linked to `bc.springrates.com/products/…`, a store from this project's own Stage 3 scan set. Shopify Catalog products reach ChatGPT's product cards. The claim that consumer assistants do not use the Global Catalog is falsified by direct observation, not by argument.

Devin also did two things worth naming. It caught its own false positive on the Springrates `Disallow: /` regex match rather than reporting a blanket block that wasn't there. And it recorded a contradiction with the U-6 report in its first minute of work — the Akebono product card on query A1 — instead of proceeding as if the prior finding were settled.

**Verdict SURFACE-DEPENDENT is accepted.** Carousels render (7 of 12), Shopify merchants appear but unpredictably. Per DIRECTIVE-10 §2 this was pre-registered as the strongest commercial outcome available, and it is the outcome that arrived.

---

## 1. The Shopify share is wrong, and it is a floor, not a measurement

The report scores Shopify merchant presence at 2 of 7 cards (28.6%). Two separate errors sit under that number, both in the same direction.

### 1.1 Block D was scored against the wrong set

The report records D2's carousel — Quince, Brooklinen, CB2, Casaluna — as containing "0 Shopify stores **from scan set**." The pre-registered rule says *Shopify merchants*, not *stores in our ten-store auto-parts scan set*. Those ten stores sell brake pads; none of them was ever going to appear in a bed-linen carousel.

Checked independently:

| D2 carousel slot | Platform |
|---|---|
| Quince | **Shopify Plus** |
| Brooklinen | **Shopify Plus** |
| CB2 | Not Shopify (Crate & Barrel enterprise) |
| Casaluna | Not Shopify (Target private label) |

**Two of four slots in the non-auto carousel are Shopify Plus merchants — 50%.** Scored as zero.

### 1.2 Four of seven cards were never audited for platform

Only two merchants were identified as Shopify, and both because they were already recognisable — `shop.app` is unmistakable and Springrates was in the scan set. The merchants behind A1 (Akebono), A3 (Motorcraft), B2 (BC Racing) and C3 (Eibach) were never checked. **A merchant is not non-Shopify because nobody looked.**

This is the same failure class as the domain-string bug in DIRECTIVE-7: recognising only what you already have on a list.

### 1.3 What the verdict actually is

The verdict does not change. CATALOG PREDICTIVE required carousels in ≥8 of 12; 7 of 12 fails that on the first criterion regardless of the Shopify share. VERTICAL-BOUND required Block D to show Shopify merchants **while A–C did not**, and A–C did. **SURFACE-DEPENDENT stands.**

But the headline number must be restated: **at least 3 of 7 cards contained an identified Shopify merchant, with 4 cards unaudited. 28.6% is a floor and not a measurement.**

**Task:** determine the platform of every merchant in all 7 cards and all carousel slots, and restate the figure. Method: `/products/<handle>.json` response, `Shopify` response headers, or cart URL pattern. Report the corrected share with the audited denominator.

---

## 2. Three confounds to close before this number is used for anything

**2.1 — Every session was unauthenticated.** ChatGPT, Copilot and Gemini were all logged out. OpenAI's documentation states that a product appears in the carousel when it is judged relevant to intent, considering the query **and context such as Memory and Custom Instructions**. A logged-out session has none of that, may run a different model tier, and may sit behind different feature flags. Region matters too — this project's own Catalog probes are pinned to `address_country: 'US'`, and the browser's egress location was never recorded.

**Required:** a short authenticated pass. This is the part that must be **founder-owned**, because Devin cannot hold credentials. Twelve queries, logged in, US session, same phrasing. If the card rate and Shopify share hold, the automated run is validated and Devin can carry the instrument from there.

**2.2 — Copilot returned 0 of 12, blocked by sign-in.** One third of the design is missing and no verdict covers it. Fold into the authenticated pass.

**2.3 — Gemini was tested on the wrong surface, and this repeats U-6's original error one layer down.** The report concludes from 4 observations that "Gemini doesn't produce product cards at all." Google's shopping surface is **AI Mode in Google Search**, routed through the Google & YouTube sales channel — not the `gemini.google.com` chat app. Testing the chat app and concluding the shopping surface doesn't exist is the same mistake U-6 made with ChatGPT.

**Required:** re-run Block A1, B3, C2 and D2 in **Google AI Mode**, and state explicitly which surface each observation came from. Until then, no claim about Google is licensed in either direction.

---

## 3. `surface_trigger_rate` — the finding nobody has named

Seven of twelve queries produced a product card. **Five produced prose with no card at all.**

Every AI-visibility monitoring platform on the market measures whether a brand appears *given that the shopping surface rendered*. None measures whether the surface renders in the first place. That question sits upstream of all of them, and it is measurable with the instrument already built.

It also changes the diagnosis a merchant receives. If the carousel does not fire for a query class, then no amount of catalogue work, feed hygiene, schema or GEO content changes anything — the surface is not there to be won. That tells a merchant which query classes are worth investing in and which are not, which is a different and more useful answer than a share-of-voice score.

**Task, descriptive, no threshold:** for the 12 queries already run plus 12 more spanning at least three verticals, record whether a product card or carousel rendered, how many slots, and the query's surface characteristics — intent phrasing, category, specificity, price mention. Report `surface_trigger_rate` per vertical and per phrasing type.

**No hypothesis is registered yet.** This cycle establishes whether the rate varies enough to be worth a hypothesis. If it is near-constant, say so and the idea dies here.

---

## 4. H6 — `shop.app` as an observable intermediary

B3's card cited `shop.app/products/…`. If Catalog-syndicated products surface to ChatGPT through shop.app URLs, then **shop.app presence is a public, deterministic, cheaply scrapable proxy for Catalog-to-assistant reach** — measurable without querying an assistant at all.

That matters commercially. Every monitoring platform on the market works by sending thousands of prompts to assistants: expensive, non-deterministic, rate-limited, and impossible to run per-SKU at scale. A deterministic public surface that predicts assistant reach would be a fundamentally cheaper instrument.

### PRE-REGISTERED DECISION RULE — H6, fixed 3 August 2026, before any run

> **Design.** Take 20 products spanning the visibility range already measured — including the three absolutely invisible targets, Subimods products, and products that appeared in ChatGPT cards. For each, search `shop.app` for the product and record presence and position. Compare against unscoped Catalog presence and against ChatGPT card appearance where known.
>
> **H6 supported:** shop.app presence agrees with ChatGPT card appearance on ≥16 of 20, and disagrees with unscoped Catalog presence on ≥5 — i.e. it tracks the outcome better than the Catalog API does.
>
> **H6 rejected:** agreement with ChatGPT card appearance ≤12 of 20.
>
> **H6 inconclusive:** anything between, or fewer than 15 products resolvable on shop.app.

If supported, shop.app becomes the primary instrument and the Catalog API becomes the explanatory layer beneath it — which is the architecture the market map in DIRECTIVE-10 §4 already implies.

---

## 5. Pipeline — third loss, and this one has consequences

Devin's log records *"DIRECTIVE-9 doesn't exist as a file — same pattern as DIRECTIVE-6."* That is the third directive lost in transit, after Addendum A and DIRECTIVE-6.

This one matters more than the others, because DIRECTIVE-9 contained **U-8** (the head/padding boundary, which governs how every existing presence figure may be stated) and the **two platform-facts register corrections** that must be made before that document is shown to anyone.

**Required, first:** report whether U-8 and the DIRECTIVE-9 §3 register corrections were ever executed. If not, they run before anything else in this directive. Commit DIRECTIVE-9, DIRECTIVE-10 and DIRECTIVE-11 to `docs/directives/` now.

---

## 6. Claim boundary — updated

**Removed from the forbidden list**, now falsified by this project's own observation:

> ~~"Consumer AI assistants do not use Shopify's Global Catalog."~~ — contradicted by the shop.app and Springrates cards.

**What can now be said:**

> ChatGPT renders product cards for some shopping queries and not others — 7 of 12 in a 12-query probe across four query blocks. Shopify-catalogue-syndicated products do appear in those cards, including via `shop.app`. Appearance is inconsistent, and no store in a ten-store auto-parts sample blocks OpenAI's retrieval crawler.

**What still cannot be said:**

> "Half your catalogue is invisible to AI shopping agents."
> "We have a reliable diagnostic that identifies which products are structurally invisible and why, and we can fix it."
> "Products whose `tech_specs` omit a vehicle cannot be retrieved for that vehicle."
> Any claim about Google or Copilot behaviour, in either direction, until §2.2 and §2.3 are closed.

---

## 7. On outreach

Still not authorised — but the conditions that would authorise a **listening** probe are now specific and close. They are: §1's corrected Shopify share, §2's three confounds closed, and U-8 resolved so that existing figures can be stated correctly.

A listening probe asserts nothing. It asks a merchant whether they have checked what ChatGPT shows for their products and how they would check. That question requires none of this project's numbers to be right. It is the only variable never measured in eleven directives, and Gate A's clock has still never started.

---

## 8. Order of execution

1. **§5 pipeline check** — U-8 and register-correction status; commit the three missing directives → report
2. **§1 platform audit of all card merchants** (zero cost) + **§3 `surface_trigger_rate`** → report
3. **§4 H6 shop.app probe** → report
4. **§2 authenticated pass** — founder-owned: ChatGPT logged in, Copilot, and Google AI Mode

**Not authorised:** the exposé, any PUB-* work premised on Catalog falsification, any merchant-facing document, any outreach.
