# DIRECTIVE-11 §2 — Authenticated Pass Protocol

**Purpose:** Validate the anonymous U-6-R results on ChatGPT (authenticated), test Copilot (was blocked), and test Google AI Mode (was tested on wrong surface). Founder-owned, founder-executed.

**Queries:** 6 (reduced from 12 for manual execution). Selected for maximum conclusiveness.

---

## 1. Query selection rationale

The 6 queries are selected to answer four questions simultaneously:

| # | Question | Queries that answer it |
|---|---|---|
| Q1 | Do the anonymous ChatGPT results hold when authenticated? | A1, B3, C2, D2 (all produced cards anonymously) |
| Q2 | Does authentication change the trigger rate? | B1, G1 (both produced NO cards anonymously) |
| Q3 | What does Copilot do? | All 6 (was 0/12, completely untested) |
| Q4 | What does Google AI Mode do? | All 6 (was tested on wrong surface — gemini.google.com chat app) |

### The 6 queries

| ID | Query | Why this one |
|---|---|---|
| **A1** | Help me find brake pads for a 2018 Honda Civic Si | Prescribed by §2.3. Replicates original U-6 query. Card produced anonymously (Akebono, non-Shopify). Auto/aggregator vertical. |
| **B3** | Help me find a cold air intake for a 2023 Honda Civic Type R FL5 | Prescribed by §2.3. **CRITICAL** — card cited `shop.app` (PRL Motorsports). Direct Catalog syndication evidence. Auto/niche vertical. |
| **C2** | Shop for BC Racing BR Series coilovers for a 2009 Acura TL | Prescribed by §2.3. **CRITICAL** — card cited `bc.springrates.com` (Springrates, a scanned store from DIRECTIVE-8 Stage 3). Auto/long-tail vertical. |
| **D2** | Shop for a linen bed sheet set | Prescribed by §2.3. **CRITICAL** — full 4-card carousel with Shopify Plus merchants (Quince, Brooklinen). Home goods vertical. |
| **B1** | Help me find a downpipe for a 2018 Honda Civic Type R FK8 | Did NOT produce a card anonymously. Same vertical as B3. Tests whether authentication changes the trigger rate. |
| **G1** | Help me find a 2-person backpacking tent | 0% trigger rate in outdoor gear (4/4 queries produced no cards anonymously). Tests whether the vertical effect is an anonymous artefact. |

### What each outcome would mean

| Outcome | Interpretation |
|---|---|
| A1/B3/C2/D2 cards hold on ChatGPT authenticated | Anonymous run validated. Devin can carry the instrument. |
| B1 or G1 produces a card when authenticated | Anonymous run underestimated the trigger rate. Authentication matters. |
| B1 and G1 still produce no cards | Trigger rate is robust to authentication. The gap is real. |
| Copilot produces cards | Copilot has a product card surface. Cross-platform comparison possible. |
| Copilot produces no cards | Copilot lacks the surface or uses a different trigger. |
| Google AI Mode produces cards | Google has a shopping surface in AI Mode. The gemini.google.com test was wrong surface. |
| Google AI Mode produces no cards | Google AI Mode may not have product cards, or uses different triggers. |

---

## 2. Exact prompts

**Use these verbatim. Do not rephrase. Do not add context. Copy-paste each query exactly as written.**

### Query A1
```
Help me find brake pads for a 2018 Honda Civic Si
```

### Query B3
```
Help me find a cold air intake for a 2023 Honda Civic Type R FL5
```

### Query C2
```
Shop for BC Racing BR Series coilovers for a 2009 Acura TL
```

### Query D2
```
Shop for a linen bed sheet set
```

### Query B1
```
Help me find a downpipe for a 2018 Honda Civic Type R FK8
```

### Query G1
```
Help me find a 2-person backpacking tent
```

---

## 3. Assistant access instructions

### 3.1 ChatGPT (authenticated)

1. Go to https://chatgpt.com
2. **Log in** with your account (Plus/Pro if you have it — note which tier in the output)
3. Ensure you are on a **US session** (if you use a VPN, connect to a US server; if you are in the US, no action needed)
4. Start a **new chat** for each query (do not continue in the same thread)
5. Paste the query into the chat box and press Enter
6. Wait for the full response to render (~15-20 seconds)
7. Record observations (see §4 below)

**Important:** Note your account tier (Free, Plus, Pro) and whether you have any Custom Instructions or Memory enabled. If you do, note that in the session metadata.

### 3.2 Microsoft Copilot (authenticated)

1. Go to https://copilot.microsoft.com
2. **Log in** with your Microsoft/Google/Apple account
3. Start a **new chat** for each query
4. Paste the query and press Enter
5. Wait for the full response (~15-20 seconds)
6. Record observations

**Important:** Note which model mode you are in (if there's a toggle between "Creative"/"Balanced"/"Precise" or similar, note which one). If Copilot offers a "Shopping" or "Search" mode, note that too.

### 3.3 Google AI Mode

**Do NOT use gemini.google.com.** That is the chat app, not the shopping surface.

1. Go to **https://www.google.com/ai** (or go to google.com and look for the "AI Mode" button/tab)
2. You should see an AI Mode search interface (not the regular Google Search, not Gemini chat)
3. Paste the query into the search box and submit
4. Wait for the AI response to fully render (~10-15 seconds)
5. Record observations

**Important:** If AI Mode is not available at that URL, try:
- Going to google.com, entering the query, and looking for an "AI Mode" or "AI Overview" button
- Going to google.com and pressing `Tab + Enter` in the search box (Chrome shortcut for AI Mode)
- If neither works, note that AI Mode was not accessible and record what you see on the regular Google Search results page instead (look for AI Overview with product listings)

---

## 4. What to record per query

For each of the 6 queries × 3 assistants = 18 observations, record the following:

### 4.1 Session metadata (once per assistant, at the top)

```
Assistant: [ChatGPT | Copilot | Google AI Mode]
Date: [YYYY-MM-DD]
Account tier: [Free | Plus | Pro | N/A]
Logged in: [Yes | No]
Region/VPN: [e.g., US, no VPN]
Custom Instructions enabled: [Yes | No | N/A]
Memory enabled: [Yes | No | N/A]
Model mode (if applicable): [e.g., Balanced | Creative | N/A]
Surface URL: [e.g., chatgpt.com, copilot.microsoft.com, google.com/ai]
```

### 4.2 Per-query observations

For each query, fill in this template:

```
Query ID: [A1 | B3 | C2 | D2 | B1 | G1]
Query text: [the exact query]

1. Surface type: [product_card | product_carousel | conversational | ai_overview_with_products | ai_overview_no_products | search_results | other]
   - "product_card": one or more product cards with images, prices, and "Select product"/"Buy" buttons
   - "product_carousel": a horizontal scrolling row of product cards
   - "conversational": text response with product names mentioned but no cards/images
   - "ai_overview_with_products": Google AI Overview that includes product images/listings
   - "ai_overview_no_products": Google AI Overview with text only
   - "search_results": standard search results page with links
   - "other": describe in notes

2. Card rendered: [Yes | No]
   (Did any product card, carousel, or visual product listing appear?)

3. Number of cards/slots: [0 | 1 | 2 | 3 | 4 | 5+]
   (How many distinct product cards or slots appeared?)

4. Product names on cards:
   - [Product 1 name]
   - [Product 2 name]
   - [etc.]

5. Merchant names mentioned (anywhere in the response, not just cards):
   - [Merchant 1]
   - [Merchant 2]
   - [etc.]

6. Any merchant URL/link visible on a card?
   - [URL 1 — e.g., https://shop.app/products/...]
   - [URL 2 — e.g., https://bc.springrates.com/products/...]
   - [etc., or "None visible"]

7. Any "Buy" / "Add to cart" / "Instant Checkout" button visible?
   [Yes — describe | No]

8. Any citation links in the text?
   - [Source 1 — e.g., Sleep Foundation, Reddit, manufacturer.com]
   - [Source 2]
   - [etc., or "None"]

9. Notes:
   [Any other observations — e.g., "card appeared then disappeared", "different product than anonymous run", "model said it can't shop", etc.]
```

### 4.3 Structured JSON output (preferred)

If you prefer to fill in a JSON file, use this template. Save as `scripts/output/authenticated-pass-results.json`:

```json
{
  "schemaVersion": "authenticated-pass-v1",
  "date": "YYYY-MM-DD",
  "directive": "DIRECTIVE-11 §2",
  "sessions": [
    {
      "assistant": "ChatGPT",
      "surfaceUrl": "chatgpt.com",
      "accountTier": "Plus | Pro | Free",
      "loggedIn": true,
      "region": "US",
      "customInstructions": false,
      "memoryEnabled": false,
      "modelMode": "N/A"
    },
    {
      "assistant": "Copilot",
      "surfaceUrl": "copilot.microsoft.com",
      "accountTier": "N/A",
      "loggedIn": true,
      "region": "US",
      "customInstructions": false,
      "memoryEnabled": false,
      "modelMode": "Balanced | Creative | Precise"
    },
    {
      "assistant": "Google AI Mode",
      "surfaceUrl": "google.com/ai",
      "accountTier": "N/A",
      "loggedIn": true,
      "region": "US",
      "customInstructions": false,
      "memoryEnabled": false,
      "modelMode": "N/A"
    }
  ],
  "observations": [
    {
      "assistant": "ChatGPT",
      "queryId": "A1",
      "query": "Help me find brake pads for a 2018 Honda Civic Si",
      "surfaceType": "product_card",
      "cardRendered": true,
      "cardCount": 1,
      "productNames": ["Akebono ProACT Ceramic Brake Pads"],
      "merchantNames": ["Akebono", "Go-Parts"],
      "cardUrls": [],
      "buyButtonVisible": false,
      "citationLinks": ["Go-Parts"],
      "notes": "Same product as anonymous run."
    },
    {
      "assistant": "ChatGPT",
      "queryId": "B3",
      "query": "Help me find a cold air intake for a 2023 Honda Civic Type R FL5",
      "surfaceType": "product_card",
      "cardRendered": true,
      "cardCount": 1,
      "productNames": ["PRL Motorsports High Volume Intake System"],
      "merchantNames": ["PRL Motorsports", "27WON", "MAPerformance"],
      "cardUrls": ["https://shop.app/products/..."],
      "buyButtonVisible": false,
      "citationLinks": ["shop.app", "27WON", "MAPerformance"],
      "notes": "shop.app citation still present."
    }
    // ... continue for all 18 observations (6 queries × 3 assistants)
  ]
}
```

---

## 5. Execution checklist

Run the queries in this order to minimize context bleed:

### Round 1: ChatGPT (authenticated)
- [ ] Log in to chatgpt.com, note account tier
- [ ] New chat → A1 → record
- [ ] New chat → B3 → record
- [ ] New chat → C2 → record
- [ ] New chat → D2 → record
- [ ] New chat → B1 → record
- [ ] New chat → G1 → record

### Round 2: Copilot (authenticated)
- [ ] Log in to copilot.microsoft.com, note model mode
- [ ] New chat → A1 → record
- [ ] New chat → B3 → record
- [ ] New chat → C2 → record
- [ ] New chat → D2 → record
- [ ] New chat → B1 → record
- [ ] New chat → G1 → record

### Round 3: Google AI Mode
- [ ] Go to google.com/ai, confirm AI Mode interface
- [ ] New search → A1 → record
- [ ] New search → B3 → record
- [ ] New search → C2 → record
- [ ] New search → D2 → record
- [ ] New search → B1 → record
- [ ] New search → G1 → record

### After all 18 observations:
- [ ] Fill in `scripts/output/authenticated-pass-results.json`
- [ ] Commit and push, or share the file with Devin for analysis

---

## 6. What to look for (quick reference)

### Product card indicators
- "Select product" button
- Product image with product name
- Price displayed (or "Price not available")
- Merchant name or URL on the card
- "Buy" or "Add to cart" button

### Carousel indicators
- Multiple product cards in a row
- Scrollable horizontal layout
- Each card has image + name + price

### Conversational (no card) indicators
- Text response only
- Product names mentioned in text but no images/cards
- Inline citation links to review sites or stores
- Comparison tables (text-based, not visual product cards)

### Google AI Mode specific
- Look for "AI Overview" at the top of results
- Look for product image carousels within the AI Overview
- Look for "Shopping" or product ads integrated into the AI response
- The key question: does Google AI Mode render visual product cards like ChatGPT, or does it only show text + links?

---

## 7. Anonymous results for comparison

These are the anonymous ChatGPT results from U-6-R. Compare your authenticated results against these:

| Query | Anonymous card? | Anonymous product | Anonymous Shopify? |
|---|---|---|---|
| A1 | Yes | Akebono ProACT Ceramic Brake Pads | No |
| B3 | Yes | PRL Motorsports HVI | Yes (shop.app) |
| C2 | Yes | BC Racing BR Series (A-75-BR) | Yes (bc.springrates.com) |
| D2 | Yes | 4-card carousel (Quince, Brooklinen, CB2, Casaluna) | Yes (Quince, Brooklinen = Shopify Plus) |
| B1 | No | — | — |
| G1 | No | — | — |

**The key validation question:** Do A1, B3, C2, D2 still produce cards with the same products and Shopify merchants when you are logged in?

**The key discovery question:** Do B1 or G1 produce cards when you are logged in, when they didn't anonymously?
