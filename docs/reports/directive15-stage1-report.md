# DIRECTIVE-15 Stage 1 Report — Invariants + Sitemap Enumeration

**Directive:** DIRECTIVE-15-v2
**Date:** 4 August 2026
**Stage:** 1 of 3 (§3 invariants + §5 sitemap)
**Status:** COMPLETE

---

## Executive summary

Stage 1 delivers two things: (1) a shared probe library with six runtime invariants (I-1 through I-6) that would have caught every historical instrument failure in this project, and (2) sitemap-based store enumeration proving `/products.json` is not exhaustive — Subimods is missing 70.9% of its products, MAP 92.4%.

The sitemap finding is the single largest correction in the project's history. Every prior directive that used `/products.json` as a denominator was working with an incomplete set.

| Deliverable | Status | Headline |
|---|---|---|
| §3 I-1 through I-6 | DONE | 19 tests, all passing. Shared library at `src/lib/scanner/invariants.ts` |
| §5 Sitemap enumeration | DONE | Subimods: 18,067 sitemap vs 5,250 `/products.json` (70.9% missing). MAP: 102,176 vs 7,750 (92.4%). TSP: 2,608 vs 2,608 (0%) |
| Register entry 11 | ADDED | `/products.json` is not exhaustive; sitemap is ground truth |

---

## 1. §3 — Runtime invariant library

### Implementation

Six invariants implemented as a shared library at `src/lib/scanner/invariants.ts` (331 lines), with 19 tests at `src/lib/scanner/invariants.test.ts`.

| # | Invariant | What it catches | Implementation |
|---|---|---|---|
| **I-1** | Consecutive pages must share zero product IDs, cursor must change | U8-A pagination bug (would have thrown on page 2) | `PaginationInvariant` class with `check(page)` method |
| **I-2** | Store enumeration must equal sitemap product count, or abort with delta | `/products.json` being short by 40–75% | `assertEnumerationComplete(enumerated, sitemap, source)` |
| **I-3** | Every presence/absence claim must carry a `seller.domain` | H6's product-match-vs-seller-match error | `assertHasSellerDomain(product)` |
| **I-4** | Every result row records which surface produced it; cross-surface comparison refused | H7 — shop.app finding read as Catalog finding | `assertSameSurface(a, b, context)` |
| **I-5** | Domain comparison normalised (www., case, trailing dot); domain must exist in known-store list | `twosteppeRformance` one-character false negative | `normalizeDomain()`, `domainsMatch()`, `assertDomainInKnownStores()` |
| **I-6** | Membership/matching method reports false-negative rate against ground truth before results quoted | 54% false-negative membership test | `validateMethod()`, `assertMethodValidated()` |

### Supporting modules

- `src/lib/scanner/catalog-search.ts` — Catalog search client with I-1 enforcement. Correct pagination (separate `--set` args). No probe issues raw CLI calls.
- `src/lib/scanner/sitemap-enum.ts` — Sitemap enumeration module. Fetches `/sitemap.xml` → `/sitemap_products_*.xml`, parses product handles.

### Test results

```
✓ src/lib/scanner/invariants.test.ts (19 tests) 5ms
  ✓ I-1: passes when consecutive pages have distinct IDs and changing cursors
  ✓ I-1: throws when page 2 has the same IDs as page 1 (U8-A bug)
  ✓ I-1: throws when cursor does not change between pages
  ✓ I-1: throws when hasNextPage=true but cursor is undefined
  ✓ I-2: passes when counts match
  ✓ I-2: throws when enumeration is short
  ✓ I-3: passes when seller.domain is present
  ✓ I-3: throws when seller is missing
  ✓ I-3: throws when variants array is empty
  ✓ I-4: passes when surfaces match
  ✓ I-4: throws when surfaces differ (H7 error)
  ✓ I-5: normalises www., case, and trailing dot
  ✓ I-5: domainsMatch handles case and www. differences
  ✓ I-5: assertDomainInKnownStores passes for known stores
  ✓ I-5: assertDomainInKnownStores throws for unknown stores
  ✓ I-6: passes a perfect method (0% false negatives)
  ✓ I-6: fails a 54% false-negative method (the H7 failure)
  ✓ I-6: assertMethodValidated throws for failing methods
  ✓ I-6: assertMethodValidated passes for good methods
```

### Provenance requirement

Every number in future reports carries its source file, the script's commit hash, and which invariants passed. A number without provenance is not reportable. Implemented via `makeProvenance()` in the invariants module.

---

## 2. §5 — Sitemap enumeration

### Method

Fetch each store's `/sitemap.xml`, extract `sitemap_products_*.xml` URLs, fetch each product sitemap, parse product handles from `<loc>` tags. Compare against `/products.json` and Catalog handles.

### Results

| Store | Sitemap | `/products.json` | Shortfall | `% missing` | Exhaustive source |
|---|---|---|---|---|---|
| Subimods | 18,067 | 5,250 | 12,817 | 70.9% | sitemap |
| TSP | 2,608 | 2,608 | 0 | 0% | sitemap (= `/products.json`) |
| MAP | 102,176 | 7,750 | 94,426 | 92.4% | sitemap |

### Three-way comparison (sitemap vs `/products.json` vs Catalog handles)

| Store | Sitemap | `/products.json` | Catalog (partial) | All three | Sitemap ∩ `/products.json` | Sitemap ∩ Catalog | `/products.json` ∩ Catalog |
|---|---|---|---|---|---|---|---|
| Subimods | 18,067 | 5,250 | 1,673 | 435 | 5,244 | 1,673 | 435 |
| TSP | 2,608 | 2,608 | 1,134 | 1,133 | 2,605 | 1,134 | 1,133 |
| MAP | 102,176 | 7,750 | 1,688 | 49 | 7,750 | 1,688 | 49 |

Key observations:
- **Sitemap ⊇ `/products.json`** for all 3 stores. Only 6 Subimods and 3 TSP handles in `/products.json` are not in the sitemap (likely deleted products still cached).
- **Catalog handles ⊂ Sitemap** for all 3 stores. Zero catalog-only handles — every Catalog handle exists in the sitemap.
- **The Catalog partial union is tiny** (1,673 / 18,067 = 9.3% for Subimods). This is the enumeration problem §6.3 will attack.

### What this corrects

Every prior directive that used `/products.json` as a denominator was working with an incomplete set:

- **Title-coverage scan** — the sample was drawn from 5,250 products, not 18,067
- **Store-visibility sampling** — same issue
- **H7's design** — the "absent" set was defined relative to `/products.json`, not the sitemap
- **H8's candidate set** — the "catalog-only" handles were real products that `/products.json` doesn't list (not a handle-matching artefact as initially thought)

H8's rejection still holds — all handles returned 200+available — but the explanation is now simpler: the store has more products than `/products.json` exposes, and the Catalog surfaces some of those extra products.

### Register entry 11

Added to `docs/reports/platform-facts-register.md`:

> `/products.json` is not exhaustive — sitemap is the ground truth. Subimods: 70.9% missing. MAP: 92.4% missing. TSP: 0% missing. This becomes invariant I-2 and the ground truth for everything downstream.

---

## 3. Data files

| File | Content |
|---|---|
| `src/lib/scanner/invariants.ts` | I-1 through I-6 invariant library (331 lines) |
| `src/lib/scanner/invariants.test.ts` | 19 tests, all passing |
| `src/lib/scanner/catalog-search.ts` | Catalog search client with I-1 enforcement |
| `src/lib/scanner/sitemap-enum.ts` | Sitemap enumeration module |
| `scripts/output/d15-sitemap-enumeration.json` | Three-way comparison summary |
| `scripts/output/d15-sitemap-subimods.json` | Subimods sitemap products (18,067) |
| `scripts/output/d15-sitemap-tsp.json` | TSP sitemap products (2,608) |
| `scripts/output/d15-sitemap-map.json` | MAP sitemap products (102,176) |
| `scripts/probe-d15-sitemap-enum.ts` | Sitemap enumeration script |

---

## 4. Next stage

Stage 2: §4 re-validation (exhaustion, World B, tail inspection, depth-1000) run through the new instrumented library. Stop and report between stages.
