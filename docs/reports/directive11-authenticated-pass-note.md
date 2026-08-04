# DIRECTIVE-11 §2 — Authenticated Pass: Founder Note

**Date:** 4 August 2026
**Source:** Founder (founder-owned task, executed manually)
**Location:** US via VPS (founder is located in Serbia)

---

## What was run

18 queries total across all three picked LLMs (ChatGPT, Copilot, Google AI Mode), via VPS with US geolocation. The 6 prescribed queries from §2.3 plus additional probes:

| ID | Query | Why |
|---|---|---|
| A1 | Help me find brake pads for a 2018 Honda Civic Si | Prescribed by §2.3. Replicates original U-6. Card produced anonymously (Akebono, non-Shopify). |
| B3 | Help me find a cold air intake for a 2023 Honda Civic Type R FL5 | Prescribed by §2.3. CRITICAL — card cited shop.app (PRL Motorsports). Direct Catalog syndication evidence. |
| C2 | Shop for BC Racing BR Series coilovers for a 2009 Acura TL | Prescribed by §2.3. CRITICAL — card cited bc.springrates.com (scanned store from DIRECTIVE-8). |
| D2 | Shop for a linen bed sheet set | Prescribed by §2.3. CRITICAL — full 4-card carousel with Shopify Plus merchants (Quince, Brooklinen). |
| B1 | Help me find a downpipe for a 2018 Honda Civic Type R FK8 | Did NOT produce a card anonymously. Tests whether authentication changes the trigger rate. |
| G1 | Help me find a 2-person backpacking tent | 0% trigger rate in outdoor gear. Tests whether the vertical effect is an anonymous artefact. |

(12 additional queries not individually listed here — 18 total.)

## Key finding

**Neither returned the Shopify store results.**

All three LLMs returned various response types (conversational, cards, carousels) across the 18 queries, but the results pointed mostly toward specific product pages on the sites/URLs in USA — not toward the Shopify stores from our scan set.

## Implications

- The authenticated pass did NOT surface the scanned Shopify stores (Springrates, MAPerformance, PRL Motorsports, etc.) in a way that differs from the anonymous pass.
- The product-page-level citations (specific URLs on merchant sites) suggest the LLMs are linking to product pages directly, not to store homepages or shop.app listings.
- This is consistent with the §1 finding that ChatGPT cards cite specific product URLs (e.g., `bc.springrates.com/products/...`, `www.quince.com/home/linen-duvet-cover?...`) rather than store-level URLs.

## Status

§2 is now closed. The authenticated pass did not change the picture from the anonymous pass. Waiting for next directive.
