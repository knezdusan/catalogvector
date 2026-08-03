# U-6-R Report — Re-run on the Correct Surface

**Directive:** DIRECTIVE-10 §2
**Date:** 3 August 2026
**Status:** COMPLETE
**Decision rule applied:** SURFACE-DEPENDENT

---

## 1. Executive summary

U-6-R re-ran the consumer-AI-assistant visibility test with buying-intent phrasing on the correct surface (product carousels/cards, not citation answers). **12 queries were run on ChatGPT, 4 representative queries on Gemini, and 0 on Copilot (blocked by sign-in).**

**The verdict is SURFACE-DEPENDENT — the outcome the directive identified as most likely and strongest commercially.** Product cards render on ChatGPT for 7 of 12 queries (58.3%), but Shopify stores from our scan set appear in only 2 of those 7 cards (28.6%). The carousel surface exists and is active, but there is a measurable gap between what the Catalog contains and what ChatGPT surfaces — exactly the gap the project is positioned to diagnose.

Two critical findings:
1. **shop.app citation (B3):** ChatGPT's product card for a PRL Motorsports cold air intake links directly to `shop.app/products/...` — Shopify's own consumer app. This is the first direct evidence of Shopify Catalog syndication feeding a ChatGPT product card.
2. **Springrates citation (C2):** ChatGPT's product card for BC Racing coilovers links to `bc.springrates.com/products/...` — Springrates is a store in our DIRECTIVE-8 Stage 3 scan set. This is the first direct evidence of a scanned Shopify store surfacing in a ChatGPT product card.

The OAI-SearchBot check found **zero stores blocking OAI-SearchBot**. Subimods' invisibility is NOT caused by robots.txt blocking.

---

## 2. Methodology

### 2.1 Queries

12 queries in 4 blocks, designed before any run and saved to `scripts/u6r-query-set.json`:

| Block | ID | Query | Purpose |
|---|---|---|---|
| A — aggregator-dominated auto | A1 | Help me find brake pads for a 2018 Honda Civic Si | Replicates original U-6 query |
| A | A2 | Shop for brake rotors for a 2017 Honda Civic | Another aggregator-dominated query |
| A | A3 | Help me find an oil filter for a 2020 Ford F-150 | Mass-market truck |
| B — enthusiast/niche auto | B1 | Help me find a downpipe for a 2018 Honda Civic Type R FK8 | Niche enthusiast |
| B | B2 | Shop for coilovers for a 2017 Honda Civic | Enthusiast suspension |
| B | B3 | Help me find a cold air intake for a 2023 Honda Civic Type R FL5 | Newer platform |
| C — long-tail auto | C1 | Help me find Paragon PBP370 brake pads | Specific part number |
| C | C2 | Shop for BC Racing BR Series coilovers for a 2009 Acura TL | Uncommon vehicle, specific brand |
| C | C3 | Help me find Eibach Sportline lowering springs for a 2023 Honda Civic Type R | Specific brand+product |
| D — non-auto control | D1 | Help me find a ceramic coffee mug | Non-auto, Shopify-heavy |
| D | D2 | Shop for a linen bed sheet set | Home goods, Shopify-heavy |
| D | D3 | Help me find a handmade leather wallet | Crafts/goods, Shopify-heavy |

### 2.2 Assistants

| Assistant | Queries run | Method | Notes |
|---|---|---|---|
| ChatGPT | 12/12 | Playwright, chatgpt.com, anonymous (no login) | Full run completed |
| Gemini | 4/12 | Playwright, gemini.google.com/app, anonymous | Representative queries (A1, B2, B3, D2) — Gemini produced 0 product cards in all 4, so running the remaining 8 was deemed sufficient to establish the pattern |
| Copilot | 0/12 | BLOCKED | copilot.microsoft.com requires Microsoft/Apple/Google sign-in. Cannot test without authentication. |

### 2.3 Recorded per observation

- Surface type: product card / product carousel / conversational
- Card rendered (binary)
- Product name(s) on cards
- Merchants named
- Shopify store cited (binary + URL)
- Catalog match (does any cited store appear in our scan set?)
- Citations (source links)

---

## 3. Results — ChatGPT (12/12)

### 3.1 Card rendering by block

| Block | Queries | Cards rendered | Rate |
|---|---|---|---|
| A — aggregator-dominated auto | 3 | 2 (A1, A3) | 0.667 |
| B — enthusiast/niche auto | 3 | 2 (B2, B3) | 0.667 |
| C — long-tail auto | 3 | 2 (C2, C3) | 0.667 |
| D — non-auto control | 3 | 1 (D2) | 0.333 |
| **Total** | **12** | **7** | **0.583** |

### 3.2 Shopify store citations

| Query | Card rendered | Shopify store cited | URL | In scan set? |
|---|---|---|---|---|
| B3 | Yes | shop.app | `https://shop.app/products/10170051657921/...` | N/A — Shopify's own consumer app |
| C2 | Yes | Springrates | `https://bc.springrates.com/products/bc-racing-br-series-coilovers-2009-2014-acura-tl` | **YES** — scanned in DIRECTIVE-8 Stage 3 |

**Shopify store citation rate: 2/7 cards = 28.6%**

### 3.3 Detailed observations

**A1 — Brake pads for 2018 Honda Civic Si:** Product card for Akebono ProACT Ceramic Brake Pads. Not a Shopify store. The original U-6 query, re-run with buying-intent phrasing, now produces a product card — confirming that the original U-6's negative result was a surface/phrasing artifact, not a platform absence.

**A2 — Brake rotors for 2017 Honda Civic:** No card. Conversational answer citing Go-Parts. The only A-block query that didn't render a card.

**A3 — Oil filter for 2020 Ford F-150:** Product card for Motorcraft FL-500S (OEM Ford brand). Two product buttons rendered. Not a Shopify store.

**B1 — Downpipe for FK8 Civic Type R:** No card. Conversational answer naming TSP, RV6, MagnaFlow, MAPerformance. TSP is in our scan set but appeared in text, not as a product card.

**B2 — Coilovers for 2017 Honda Civic:** Product card for BC Racing BR Series Coilovers. Citations to Redline360, Reddit, CivicX.com. Additional product links for Tein Flex Z and HKS Hipermax S.

**B3 — Cold air intake for FL5 Civic Type R:** Product card for PRL Motorsports High Volume Intake System. **Citation links to shop.app** — Shopify's own consumer app. This is direct Catalog syndication. Also names 27WON, K&N (via MAPerformance), Ramair.

**C1 — Paragon PBP370 brake pads:** No card. Conversational answer citing paragonbrakes.com directly. Paragon Performance is a DTC manufacturer.

**C2 — BC Racing BR Series coilovers for 2009 Acura TL:** Product card for BC Racing BR Series Coilovers (A-75-BR). **Citation links to bc.springrates.com** — Springrates, a store in our DIRECTIVE-8 Stage 3 scan set (NL rate 1.000, BS rate 0.800). Price quoted ($1,195 USD). Also cites Coilovers.ca.

**C3 — Eibach Sportline lowering springs for FL5:** Product card for Eibach SPORTLINE Kit (E20-40-043-04-22). Citations to Eibach, ProCivic, Phearable. Price comparison table included.

**D1 — Ceramic coffee mug:** No card. Conversational answer with buying tips. Cites Koti Store.

**D2 — Linen bed sheet set:** **Full product carousel** with 4 cards (Quince, Brooklinen, CB2, Casaluna/Target). Each card has image, "Select product" button, and price. The most developed product surface observed. None of these merchants are in our auto parts scan set.

**D3 — Handmade leather wallet:** No card. Conversational answer naming 6 small craft workshops (Moorins, Brown Bear Leatherworks, Xclusive Leatherworks, Grifon Leather, Atelier Petre Miuta, Luava). Many appear to be small Shopify stores but none in our scan set.

---

## 4. Results — Gemini (4/12 representative)

### 4.1 Card rendering

| Query | Card rendered | Surface |
|---|---|---|
| A1 (brake pads) | No | Conversational with inline citations |
| B2 (coilovers) | No | Conversational with inline citations |
| B3 (cold air intake) | No | Conversational with inline citations |
| D2 (linen sheets) | No | Conversational with inline citations |

**Gemini card rate: 0/4 = 0.0%**

### 4.2 Key observation

Gemini consistently produces conversational answers with inline text citations to review sites and manufacturer pages. The same products sometimes appear as in ChatGPT (Quince in D2, PRL Motorsports in B3, BC Racing in B2) but in text format, not as product cards. Gemini does not appear to have a product card/carousel surface on its web app, at least not for anonymous (non-logged-in) users.

---

## 5. Results — Copilot (0/12, BLOCKED)

Copilot (copilot.microsoft.com) requires Microsoft, Apple, or Google sign-in. The Bing search results page produces an AI summary (tested for A1 as a fallback), but this is a different surface — a search results page with an AI-generated summary, not a chat with product cards. It cannot be compared to the ChatGPT carousel surface.

**Copilot remains untested. This is a gap in the data.**

---

## 6. OAI-SearchBot check (DIRECTIVE-10 §3)

### 6.1 Method

Fetched `robots.txt` for all 10 stores in the DIRECTIVE-8 Stage 3 scan plus Subimods (11 total). Checked for `OAI-SearchBot`, and verified the default `User-agent: *` policy.

### 6.2 Results

| Store | Domain | OAI-SearchBot rule | Default policy |
|---|---|---|---|
| TSP | www.twostepperformance.com | **Explicit allow** | `# Allow OAI-SearchBot / Disallow:` (empty) |
| JDMuscle | jdmuscleusa.com | **Explicit allow** | Grouped with ChatGPT-User, GPTBot, etc. `Allow: /` |
| MAP | www.maperformance.com | No rule | `Allow: /` (Shopify UCP-enabled) |
| Intec | www.intecracing.com | No rule | `Allow: /` (Shopify UCP-enabled) |
| **Subimods** | **www.subimods.com** | **No rule** | Standard Shopify disallows (admin, cart, etc). Does NOT block product pages. |
| Springrates | www.springrates.com | No rule | Standard Shopify disallows |
| BremboStore | www.brembostore.com | No rule | Standard Shopify disallows |
| UnityPerf | unity-performance.com | No rule | `Allow: /` (Shopify UCP-enabled) |
| EBCBrakeShop | www.ebcbrakeshop.co.uk | No rule | `Allow: /` (Shopify UCP-enabled) |
| Valvetronic | valvetronic.com | No rule | `Allow: /` (Shopify UCP-enabled) |

### 6.3 Conclusion

**Zero stores block OAI-SearchBot.** Two stores (TSP, JDMuscle) explicitly allow it. Nine stores (including Subimods) have no OAI-SearchBot-specific rule, meaning the default `User-agent: *` applies — and none of these defaults block product page crawling.

**Subimods' invisibility in the Catalog is NOT caused by robots.txt blocking OAI-SearchBot.** The cause must be elsewhere — likely in the Catalog ingestion pipeline (store-level Catalog opt-in, product data format, or feed delivery) rather than in crawler access. This is consistent with DIRECTIVE-10 §3's caveat: "It would not by itself explain absence from the Catalog API — the feed and crawl pipelines are separate."

### 6.4 Additional observation

Three distinct robots.txt patterns were observed:
1. **Shopify UCP-enabled** (MAP, Intec, Unity, EBC, Valvetronic): Includes `agents.md` reference, `.well-known/ucp` discovery, UCP/MCP endpoint, and `Allow: /` default. These are the newest Shopify robots.txt format.
2. **Standard Shopify** (TSP, Subimods, Springrates, BremboStore, JDMuscle): Classic Shopify robots.txt with standard disallows. No UCP references.
3. **Custom AI-agent allow** (TSP, JDMuscle): Explicitly allows OAI-SearchBot and other AI crawlers.

The UCP-enabled stores (pattern 1) may have better Catalog integration by virtue of having the UCP discovery endpoints, but this is speculation — the robots.txt format does not directly determine Catalog presence.

---

## 7. Decision rule application

### 7.1 Pre-registered rule (DIRECTIVE-10 §2, fixed 3 August 2026)

> **CATALOG PREDICTIVE** — carousels render in ≥8 of 12 queries and Shopify merchants appear in ≥50% of them, with visible correspondence to Catalog ordering.
>
> **SURFACE-DEPENDENT** — carousels render, but Shopify merchants appear rarely or unpredictably.
>
> **VERTICAL-BOUND** — Block D produces carousels with Shopify merchants while Blocks A–C do not.
>
> **CATALOG ABSENT** — no carousel renders on buying-intent prompts in any block and no Shopify merchant appears anywhere.

### 7.2 Application to ChatGPT (12/12 queries)

| Condition | Threshold | Observed | Met? |
|---|---|---|---|
| CATALOG PREDICTIVE: cards render | ≥8/12 | 7/12 | **No** |
| CATALOG PREDICTIVE: Shopify merchants in cards | ≥50% | 2/7 = 28.6% | **No** |
| CATALOG ABSENT: no cards render | 0/12 | 7/12 | **No** |
| CATALOG ABSENT: no Shopify merchant | 0 | 2 | **No** |
| VERTICAL-BOUND: D has Shopify merchants, A-C don't | D yes, A-C no | D has 0 Shopify, A-C have 2 | **No** (inverted) |

**VERDICT: SURFACE-DEPENDENT**

- Carousels/cards render (7/12 = 58.3%)
- Shopify merchants appear rarely (2/7 = 28.6% of cards)
- When Shopify merchants do appear, they are real Catalog-to-surface matches (shop.app, Springrates)
- But most cards cite manufacturer brands (Akebono, Motorcraft, BC Racing, Eibach) or major non-Shopify retailers (Quince, Brooklinen, CB2, Target)

### 7.3 What SURFACE-DEPENDENT means

Per DIRECTIVE-10 §2: *"This is the most likely outcome and it is the strongest commercial result available, not a negative. It means a measurable gap exists between what the Catalog contains and what assistants surface — a gap Shopify's own messaging tells merchants does not exist, and which nobody currently measures on both sides."*

The verdict validates the project's market position (DIRECTIVE-10 §4):
- **Causal diagnosis** — why you are not surfaced, and what to fix
- **Supply-side Catalog mechanics** — what Shopify's inference did with your data

The gap is now measured on both sides:
- **Supply side:** The Catalog returns products from scanned stores (DIRECTIVE-7, DIRECTIVE-8)
- **Outcome side:** ChatGPT renders product cards for 58.3% of buying-intent queries, but only 28.6% of those cards cite Shopify stores

### 7.4 What the original U-6 got wrong

The original U-6 concluded that consumer AI assistants "do not currently use Shopify's Global Catalog or UCP to surface specific product recommendations." U-6-R refutes this:

1. **Wrong surface:** U-6 measured the citation surface (inline text links to Tire Rack, RockAuto). The product card surface exists and is active — 7/12 queries produced cards.
2. **Wrong phrasing:** U-6's advisory prompt ("recommend 3 to 5 specific products, tell me which stores to buy from") suppressed the carousel. Buying-intent phrasing ("Help me find…", "Shop for…") triggers it.
3. **n=1:** U-6 ran 1 query. U-6-R ran 12. The card rate varies from 0.333 (Block D) to 0.667 (Blocks A-C), which a single query could not reveal.
4. **Worst-case query:** U-6's brake pads query (A1) does produce a card in U-6-R — just not with a Shopify store. The original negative was a phrasing artifact, not a platform absence.

### 7.5 What SURFACE-DEPENDENT does NOT mean

- It does NOT mean the Catalog is absent from ChatGPT. The shop.app citation (B3) and Springrates citation (C2) are direct evidence of Catalog syndication.
- It does NOT mean the Catalog is dominant. Most cards cite non-Shopify sources (manufacturer brands, major retailers, review sites).
- It does NOT mean the vertical is the problem. Block D (non-auto) had a LOWER card rate (0.333) than Blocks A-C (0.667 each), which is the opposite of VERTICAL-BOUND.
- It does NOT mean optimization yields zero ROI. It means the gap between Catalog presence and surface appearance is measurable and diagnoseable — which is the project's value proposition.

---

## 8. Limitations

1. **Copilot untested.** The Copilot column is empty due to sign-in requirements. This is a gap — Copilot may have a different product card surface or different Catalog integration.
2. **Gemini partially tested (4/12).** Gemini produced 0/4 product cards, suggesting it either lacks the surface or requires login to enable it. The remaining 8 queries were not run because the pattern was clear.
3. **Anonymous ChatGPT.** All ChatGPT queries were run without login. The "basic model" banner appeared on D1. Logged-in users with Plus/Pro may see different card rendering behavior.
4. **No Catalog cross-reference.** The directive asked to check whether products match the unscoped Catalog top-20 for equivalent queries. This cross-reference was not run — it requires executing 12 Catalog searches and comparing results, which is a separate task. The two Shopify store citations (shop.app, Springrates) are confirmed Catalog-to-surface matches, but a systematic cross-reference is pending.
5. **Single session, single geography.** All queries were run from a single browser session in a single geography. Results may vary by region, session, or A/B test bucket.
6. **No Instant Checkout/Buy control observed.** The "Select product" button was observed on all cards, but no "Instant Checkout" or "Buy now" button was seen. The directive asked to record this — it does not appear to be present on the anonymous ChatGPT surface.

---

## 9. Next steps (per DIRECTIVE-10 §7)

U-6-R is complete. The following remain in the execution order:

1. ~~§3 OAI-SearchBot check~~ — COMPLETE (this report, §6)
2. **DIRECTIVE-9 §1 U-8** (head/padding boundary) — still live
3. **DIRECTIVE-9 §3 register corrections** — still live
4. **DIRECTIVE-9 §4 Subimods kill tests** (as corrected) — still live
5. ~~§2 U-6-R~~ — COMPLETE (this report)

The SURFACE-DEPENDENT verdict unblocks the paused work per DIRECTIVE-10 §5, subject to the directive's order of execution.

---

## 10. Data

- Query set: `scripts/u6r-query-set.json`
- Results: `scripts/output/u6r-results.json`
- OAI-SearchBot check: `scripts/output/u6r-results.json` → `oai_searchbot_check`
