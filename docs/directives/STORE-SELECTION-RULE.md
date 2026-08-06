# CatalogVector — Store-Selection Rule (Pre-Registered)

**Committed:** 6 August 2026 (DIRECTIVE-19 §3.5)
**Status:** binding. This rule is committed before any store candidate is inspected. Stores are selected by this rule, not described by it after selection.

---

## 1. The sampling frame is independent of the Catalog API

`TDD.md` C1 documents that the store frontier has historically been seeded partly from the Global Catalog itself. For a study whose headline quantity **is** Catalog absence, a Catalog-seeded frame biases the result downward by construction and reproduces failure mode #4 (selection dressed as measurement) at study scale.

**Permitted frame sources:**
- Public Shopify-detection directories (e.g., BuiltWith, Wappalyzer-derived lists)
- Vertical trade directories cross-checked for Shopify by platform fingerprinting (`/products.json` endpoint, `powered-by` header, `_shopify_y` cookie)
- Vertical-specific merchant listings (forums, subreddits, trade-association member lists)

**Prohibited:**
- `search_catalog` harvesting as a sampling source
- Any list derived from Catalog API queries

A store that appears in a permitted source AND is known to be in the Catalog is not excluded — the point is that the frame is not *built* from the Catalog.

---

## 2. Size bands

Per `RULINGS-ON-BLOCKERS` §2:

| Band | Product count (from sitemap) | Target coverage |
|---|---|---|
| Small | < 5,000 | All verticals |
| Medium | 5,000 – 25,000 | All verticals |
| Large | > 25,000 | All verticals where available |

Where a vertical has no large stores, **record that as a property of the vertical** rather than filling the cell. The absence of a large band is a finding about the vertical's market structure, not a gap in the study.

---

## 3. Frame construction order

1. **Build the full qualified frame per vertical first.** Enumerate all candidate stores from permitted sources, fingerprint each for Shopify, record sitemap product count.
2. **Classify each store into a size band.**
3. **Sample within band by recorded seed.** The seed is `42` (matching D17's random sample seed) and is recorded here before any candidate is inspected.
4. **Do not select stores and then describe the rule.** The rule is committed first; the frame is built second; the sample is drawn third.

---

## 4. Exclusions

If a store is unreachable or its storefront JSON is disabled, record the exclusion with its reason. Exclusions are reported as a table in the study report, not silently dropped.

| Exclusion reason | Recorded as |
|---|---|
| Storefront JSON disabled (`/products.json` returns 403/404) | `EXCLUDED: storefront-json-disabled` |
| Sitemap unavailable | `EXCLUDED: no-sitemap` |
| Store closed / domain expired | `EXCLUDED: store-closed` |
| Not actually Shopify (fingerprint failure) | `EXCLUDED: not-shopify` |
| Product count below small-band threshold (< 100) | `EXCLUDED: too-small` |

---

## 5. The replacement frame's own skew

Tech-detection datasets and trade directories over-represent larger and better-linked stores. Recording that in limitations is necessary but weak, because the study will hold the data needed to test it.

**Pre-registered analysis:** regress per-store absence on:
1. Catalogue size (sitemap product count)
2. Store presence in more than one frame source (binary)

If absence correlates with size and the frame over-represents large stores, the direction and rough magnitude of the bias in the vertical means is known and reportable, not merely conceded. This costs nothing beyond data the study already produces.

---

## 6. Seed

**Seed: `42`** (recorded here, before any candidate is inspected, per DIRECTIVE-19 §3.5)

Used for:
- Random sampling within size bands
- Random product sampling within each selected store (n≈50 per store)
- Staggered notification assignment (§5.4: half early, half late, by seed)

---

## 7. Store count per vertical

- **3–4 verticals** (auto parts baseline + 2–3 others, chosen after §5.1 outreach)
- **16–20 stores total**, 4–5 per vertical
- **Size bands covered per vertical** where available

---

## 8. Vertical selection

Auto parts is the baseline and the sandbox (existing 3-store measurement, validated method). The other verticals are chosen after §5.1 outreach reports, per `RULINGS-ON-BLOCKERS` §6 — buyer input decides C-4, not measurement convenience.

Candidate verticals (to be confirmed after outreach):
- Auto parts (baseline)
- Device accessories (cases, screen protectors, chargers)
- Printer / filter / appliance consumables
- Electronic components
- Outdoor gear
- Other verticals suggested by outreach respondents

---

## 9. Acceptance criterion

A store is accepted into the study if:
1. It is in a permitted frame source (not Catalog-derived)
2. It passes Shopify fingerprinting
3. Its sitemap is accessible and reports a product count
4. Its `/products.json` is accessible (or the 25,000-cap exception is documented)
5. It falls into a size band that needs filling for its vertical

A store is replaced if it fails any of these after being sampled. The replacement is the next store in the same band and vertical, drawn by the same seed.

---

**This rule is pre-registered. It does not change after stores are selected. If a design change is needed, it is made by directive, with the reason and date recorded per `BLUEPRINT` §0.**
