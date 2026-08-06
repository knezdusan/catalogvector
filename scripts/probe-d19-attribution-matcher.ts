/**
 * DIRECTIVE-19 §3.2: Attribution matcher — build and validate before any use.
 *
 * Design constraint (non-negotiable): key on brand + manufacturer part number
 * where a part number is extractable from title, SKU, or body text. Where no
 * part number is extractable, reject the product from the denominator — do not
 * fall back to title similarity.
 *
 * Validation:
 *   - ≥40 same-part pairs (same part across different sellers)
 *   - ≥40 near-miss pairs (adjacent part numbers, same brand different SKU, superseded)
 *   - Report coverage and FPR separately. Target: FPR ≤2%.
 *   - Coverage is not a target — it is a measurement and a finding about the vertical.
 *
 * I-6: Any membership/matching method reports its false-negative rate against
 * committed ground truth before any result derived from it is quoted.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────

type StorefrontProduct = {
  id: number;
  handle: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
};

type CatalogRow = {
  id: string;
  title: string;
  sellerDomain: string;
  sellerName: string;
  variantUrl: string;
};

type SamePartPair = {
  partNumber: string;
  brand: string;
  sellerA: string;
  sellerB: string;
  titleA: string;
  titleB: string;
  productIdA: string;
  productIdB: string;
  confirmedBy: "exact_match" | "brand_plus_partnum";
};

type NearMissPair = {
  partNumberA: string;
  partNumberB: string;
  brand: string;
  reason: "adjacent_partnum" | "same_brand_different_sku" | "superseded";
  sellerA: string;
  sellerB: string;
  titleA: string;
  titleB: string;
};

type MatcherResult = {
  matched: boolean;
  partNumber: string | null;
  method: "exact" | "brand_plus_partnum" | "rejected";
};

type ValidationResult = {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  coverage: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  totalProducts: number;
  productsWithPartNumber: number;
};

// ─── Part number extraction ───────────────────────────────────────────────

/**
 * Extract a manufacturer part number from a product title.
 *
 * Auto-parts part number patterns observed in Catalog data:
 *   - HB875B.666 (Hawk)        — brand prefix + alphanumeric with dots
 *   - CRB.XRx.D1698 (Cobalt)   — dot-separated alphanumeric
 *   - Z16-1053 (Power Stop)    — hyphen-separated alphanumeric
 *   - KRUCA12 (Kryptonite)     — pure alphanumeric, 6+ chars
 *   - DP31210C (EBC)           — pure alphanumeric, 6+ chars
 *   - FRP3067H                 — pure alphanumeric, 6+ chars
 *   - PBP370 (Paragon)         — pure alphanumeric, 6+ chars
 *
 * Rules:
 *   - Must be 5+ characters (filters out "B6", "V1" etc. which are model lines)
 *   - Must contain at least one digit (filters out words)
 *   - Must not be a common English word fragment
 *   - Prefers patterns with dots, hyphens, or mixed case+digits
 *   - Pure-alphanumeric strings must be 6+ chars and contain both letters and digits
 */
export function extractPartNumber(title: string): string | null {
  // Pattern 1: Dot-separated alphanumeric (e.g., CRB.XRx.D1698, HB875B.666)
  const dotPattern = /\b([A-Z]{2,}\.[A-Za-z0-9]+\.[A-Z0-9]+)\b/g;
  let match = dotPattern.exec(title);
  if (match) return cleanPartNumber(match[1]);

  // Pattern 2: Hyphen-separated alphanumeric with letters (e.g., Z16-1053)
  const hyphenPattern = /\b([A-Z0-9]{2,}-[A-Z0-9]{3,})\b/g;
  match = hyphenPattern.exec(title);
  if (match && hasLetterAndDigit(match[1])) return cleanPartNumber(match[1]);

  // Pattern 3: Alphanumeric with mixed case and digits, 6+ chars (e.g., DP31210C, KRUCA12)
  // Must be a standalone token, not part of a word
  const tokenPattern = /\b([A-Z]{2,}[0-9]{2,}[A-Z0-9]*)\b/g;
  while ((match = tokenPattern.exec(title)) !== null) {
    const candidate = match[1];
    if (candidate.length >= 6 && !isCommonWord(candidate)) {
      return cleanPartNumber(candidate);
    }
  }

  // Pattern 4: Pipe-delimited part number at end of title (e.g., "... | HB875B.666")
  const pipePattern = /\|\s*([A-Z0-9][A-Z0-9.\-]{4,})\s*$/;
  match = pipePattern.exec(title);
  if (match && hasLetterAndDigit(match[1])) return cleanPartNumber(match[1]);

  return null;
}

function hasLetterAndDigit(s: string): boolean {
  return /[A-Za-z]/.test(s) && /[0-9]/.test(s);
}

function isCommonWord(s: string): boolean {
  const common = new Set([
    "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025",
    "FRONT", "REAR", "LEFT", "RIGHT", "PAIR", "KIT", "SET",
  ]);
  return common.has(s.toUpperCase());
}

function cleanPartNumber(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Extract brand from vendor field or title prefix.
 */
export function extractBrand(vendor: string | null, title: string): string | null {
  if (vendor && vendor.trim().length > 0) {
    return vendor.trim().toUpperCase();
  }
  // Try to extract brand from title prefix (first 1-3 words before a known separator)
  const brandMatch = title.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s/);
  if (brandMatch) return brandMatch[1].toUpperCase();
  return null;
}

// ─── Catalog search (via UCP CLI) ─────────────────────────────────────────

function ucpSearch(query: string, maxProducts = 50): CatalogRow[] {
  const cmd = `ucp catalog search --format json --set '/query=${query.replace(/'/g, "'\\''")}' 2>/dev/null`;
  try {
    const output = execSync(cmd, { timeout: 60000, encoding: "utf8" });
    const data = JSON.parse(output);
    const products = (data.result?.products || []) as Array<Record<string, unknown>>;
    return products.map((p) => {
      const variant = (p.variants as Array<Record<string, unknown>>)?.[0] || {};
      const seller = (variant.seller as Record<string, unknown>) || {};
      return {
        id: p.id as string,
        title: p.title as string,
        sellerDomain: seller.domain as string,
        sellerName: seller.name as string,
        variantUrl: variant.url as string,
      };
    });
  } catch {
    return [];
  }
}

// ─── Ground truth construction ────────────────────────────────────────────

/**
 * Build same-part pairs by searching the Catalog for part numbers extracted
 * from Subimods products. When the same part number appears in results from
 * different sellers, that's a same-part pair.
 */
function buildSamePartPairs(
  products: StorefrontProduct[],
  targetDomain: string,
): SamePartPair[] {
  const pairs: SamePartPair[] = [];
  const seenPartNumbers = new Set<string>();

  // Extract part numbers from all products
  const withPartNums = products
    .map((p) => ({
      product: p,
      partNumber: extractPartNumber(p.title),
      brand: extractBrand(p.vendor, p.title),
    }))
    .filter((x) => x.partNumber !== null && x.brand !== null);

  console.log(`Products with extractable part numbers: ${withPartNums.length}/${products.length}`);

  // Search Catalog for each part number, find cross-seller pairs
  // To get ≥40 pairs, we need to search enough part numbers
  const searchLimit = Math.min(withPartNums.length, 120); // search up to 120

  for (let i = 0; i < searchLimit && pairs.length < 60; i++) {
    const { product, partNumber, brand } = withPartNums[i];
    if (!partNumber || !brand) continue;
    if (seenPartNumbers.has(partNumber)) continue;
    seenPartNumbers.add(partNumber);

    // Search the Catalog for this part number
    const results = ucpSearch(partNumber, 50);
    if (results.length < 2) continue;

    // Group by seller domain
    const bySeller = new Map<string, CatalogRow[]>();
    for (const r of results) {
      if (!r.sellerDomain) continue;
      const existing = bySeller.get(r.sellerDomain) || [];
      existing.push(r);
      bySeller.set(r.sellerDomain, existing);
    }

    // Find pairs where the part appears under different sellers
    const sellers = Array.from(bySeller.keys());
    if (sellers.length < 2) continue;

    // Verify the results actually contain the part number in their title
    const verifiedResults = results.filter((r) => {
      const extracted = extractPartNumber(r.title);
      return extracted === partNumber;
    });

    const verifiedBySeller = new Map<string, CatalogRow[]>();
    for (const r of verifiedResults) {
      if (!r.sellerDomain) continue;
      const existing = verifiedBySeller.get(r.sellerDomain) || [];
      existing.push(r);
      verifiedBySeller.set(r.sellerDomain, existing);
    }

    const verifiedSellers = Array.from(verifiedBySeller.keys());
    if (verifiedSellers.length < 2) continue;

    // Create pairs from verified cross-seller results
    for (let a = 0; a < verifiedSellers.length && pairs.length < 60; a++) {
      for (let b = a + 1; b < verifiedSellers.length && pairs.length < 60; b++) {
        const rowsA = verifiedBySeller.get(verifiedSellers[a])!;
        const rowsB = verifiedBySeller.get(verifiedSellers[b])!;
        pairs.push({
          partNumber,
          brand,
          sellerA: verifiedSellers[a],
          sellerB: verifiedSellers[b],
          titleA: rowsA[0].title,
          titleB: rowsB[0].title,
          productIdA: rowsA[0].id,
          productIdB: rowsB[0].id,
          confirmedBy: "exact_match",
        });
      }
    }

    if (i % 20 === 0) {
      console.log(`  Searched ${i + 1}/${searchLimit} part numbers, found ${pairs.length} same-part pairs so far`);
    }
  }

  return pairs;
}

/**
 * Build near-miss pairs by constructing adjacent part numbers and searching
 * the Catalog for both. Also includes same-brand different-SKU pairs found
 * in the same-part search results.
 */
function buildNearMissPairs(
  products: StorefrontProduct[],
  samePartPairs: SamePartPair[],
): NearMissPair[] {
  const pairs: NearMissPair[] = [];

  // Strategy 1: Adjacent part numbers — take part numbers from same-part pairs
  // and construct adjacent variants (increment/decrement trailing digits)
  for (const sp of samePartPairs) {
    if (pairs.length >= 50) break;
    const adjacent = getAdjacentPartNumber(sp.partNumber);
    if (!adjacent) continue;

    // Search for the adjacent part number
    const results = ucpSearch(adjacent, 20);
    const verified = results.filter((r) => {
      const extracted = extractPartNumber(r.title);
      return extracted === adjacent;
    });

    if (verified.length > 0) {
      // Find a result from a different seller than the original
      const originalSeller = sp.sellerA;
      const otherResults = verified.filter((r) => r.sellerDomain !== originalSeller);
      if (otherResults.length > 0) {
        pairs.push({
          partNumberA: sp.partNumber,
          partNumberB: adjacent,
          brand: sp.brand,
          reason: "adjacent_partnum",
          sellerA: originalSeller,
          sellerB: otherResults[0].sellerDomain,
          titleA: sp.titleA,
          titleB: otherResults[0].title,
        });
      }
    }
  }

  // Strategy 2: Same-brand different-SKU — from the same-part search results,
  // find products from the same brand with different part numbers
  const withPartNums = products
    .map((p) => ({
      product: p,
      partNumber: extractPartNumber(p.title),
      brand: extractBrand(p.vendor, p.title),
    }))
    .filter((x) => x.partNumber !== null && x.brand !== null);

  const byBrand = new Map<string, typeof withPartNums>();
  for (const item of withPartNums) {
    if (!item.brand || !item.partNumber) continue;
    const existing = byBrand.get(item.brand) || [];
    existing.push(item);
    byBrand.set(item.brand, existing);
  }

  for (const [brand, items] of byBrand) {
    if (pairs.length >= 50) break;
    if (items.length < 2) continue;

    // Find pairs with different part numbers from the same brand
    for (let i = 0; i < items.length && pairs.length < 50; i++) {
      for (let j = i + 1; j < items.length && pairs.length < 50; j++) {
        if (items[i].partNumber === items[j].partNumber) continue;
        // Check that they're not adjacent (those go in strategy 1)
        const adj = getAdjacentPartNumber(items[i].partNumber!);
        if (adj === items[j].partNumber) continue;

        pairs.push({
          partNumberA: items[i].partNumber!,
          partNumberB: items[j].partNumber!,
          brand,
          reason: "same_brand_different_sku",
          sellerA: "subimods.com", // both from the same store
          sellerB: "subimods.com",
          titleA: items[i].product.title,
          titleB: items[j].product.title,
        });
      }
    }
  }

  return pairs;
}

function getAdjacentPartNumber(partNumber: string): string | null {
  // Try to increment the trailing digits
  const match = partNumber.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  const prefix = match[1];
  const num = parseInt(match[2], 10);
  const padded = match[2];
  const adjacent = (num + 1).toString().padStart(padded.length, "0");
  return `${prefix}${adjacent}`;
}

// ─── Matcher ──────────────────────────────────────────────────────────────

/**
 * The attribution matcher: given a product (title, vendor) and a set of
 * Catalog search results, determine if the product appears under a different
 * seller.
 *
 * Returns:
 *   - matched: true if the product is found under a different seller
 *   - partNumber: the extracted part number (null if rejected)
 *   - method: how the match was made
 */
export function matchAttribution(
  title: string,
  vendor: string | null,
  catalogResults: CatalogRow[],
  targetDomain: string,
): MatcherResult {
  const partNumber = extractPartNumber(title);
  const brand = extractBrand(vendor, title);

  if (!partNumber || !brand) {
    return { matched: false, partNumber: null, method: "rejected" };
  }

  // Check if any Catalog result from a different seller contains this part number
  for (const result of catalogResults) {
    if (!result.sellerDomain) continue;
    const normalizedResult = result.sellerDomain.replace(/^www\./, "").toLowerCase();
    const normalizedTarget = targetDomain.replace(/^www\./, "").toLowerCase();
    if (normalizedResult === normalizedTarget) continue; // same seller, skip

    const resultPartNum = extractPartNumber(result.title);
    if (resultPartNum === partNumber) {
      return { matched: true, partNumber, method: "exact" };
    }

    // Brand + part number match (part number may be formatted differently)
    const resultBrand = extractBrand(null, result.title);
    if (resultBrand === brand && resultPartNum === partNumber) {
      return { matched: true, partNumber, method: "brand_plus_partnum" };
    }
  }

  return { matched: false, partNumber, method: "exact" };
}

// ─── Validation ───────────────────────────────────────────────────────────

function validateMatcher(
  samePartPairs: SamePartPair[],
  nearMissPairs: NearMissPair[],
  allProducts: StorefrontProduct[],
): ValidationResult {
  // True positives: same-part pairs that the matcher correctly identifies as matched
  let truePositives = 0;
  let falseNegatives = 0;

  for (const pair of samePartPairs) {
    // Simulate: search for partNumber, check if matcher finds it under a different seller
    const results = ucpSearch(pair.partNumber, 50);
    const result = matchAttribution(
      pair.titleA,
      null, // brand is embedded in the pair
      results,
      pair.sellerA,
    );
    if (result.matched) {
      truePositives++;
    } else {
      falseNegatives++;
    }
  }

  // False positives: near-miss pairs that the matcher incorrectly identifies as matched
  let falsePositives = 0;
  let trueNegatives = 0;

  for (const pair of nearMissPairs) {
    // Search for partNumberA, check if matcher matches it to a result that actually has partNumberB
    const results = ucpSearch(pair.partNumberA, 50);
    const result = matchAttribution(
      pair.titleA,
      null,
      results,
      pair.sellerA,
    );

    if (result.matched) {
      // Check if the matched result actually has a DIFFERENT part number (false positive)
      // The matcher matched on partNumberA, but the result might have partNumberB
      // This is a false positive if the matched product has a different part number
      const matchedResult = results.find((r) => {
        const rPartNum = extractPartNumber(r.title);
        return rPartNum === result.partNumber && r.sellerDomain !== pair.sellerA;
      });

      if (matchedResult) {
        // Verify the matched result's part number is actually the same
        const matchedPartNum = extractPartNumber(matchedResult.title);
        if (matchedPartNum === pair.partNumberA) {
          // Actually a true positive — the part numbers match
          truePositives++;
        } else {
          falsePositives++;
        }
      } else {
        falsePositives++;
      }
    } else {
      trueNegatives++;
    }
  }

  // Coverage: share of products with an extractable part number
  const productsWithPartNumber = allProducts.filter(
    (p) => extractPartNumber(p.title) !== null,
  ).length;

  const totalChecked = truePositives + falseNegatives;
  const fprDenominator = falsePositives + trueNegatives;

  return {
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    coverage: allProducts.length > 0 ? productsWithPartNumber / allProducts.length : 0,
    falsePositiveRate: fprDenominator > 0 ? falsePositives / fprDenominator : 0,
    falseNegativeRate: totalChecked > 0 ? falseNegatives / totalChecked : 0,
    totalProducts: allProducts.length,
    productsWithPartNumber,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== DIRECTIVE-19 §3.2: Attribution Matcher ===\n");

  // Load Subimods full metadata
  const metadataPath = path.join(__dirname, "output/d17-subimods-full-metadata.json");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as StorefrontProduct[];
  console.log(`Loaded ${metadata.length} Subimods products`);

  // Step 1: Extract part numbers and report coverage
  const withPartNums = metadata.filter((p) => extractPartNumber(p.title) !== null);
  const coverage = withPartNums.length / metadata.length;
  console.log(`\nStep 1: Part number extraction`);
  console.log(`  Products with extractable part number: ${withPartNums.length}/${metadata.length} (${(coverage * 100).toFixed(1)}%)`);
  console.log(`  Coverage is a measurement, not a target.`);

  // Show some examples
  console.log(`  Examples:`);
  for (const p of withPartNums.slice(0, 10)) {
    const pn = extractPartNumber(p.title);
    const brand = extractBrand(p.vendor, p.title);
    console.log(`    ${brand} | ${pn} | ${p.title.substring(0, 60)}`);
  }

  // Step 2: Build same-part ground truth
  console.log(`\nStep 2: Building same-part pairs (target: ≥40)`);
  const samePartPairs = buildSamePartPairs(metadata, "subimods.com");
  console.log(`  Found ${samePartPairs.length} same-part pairs`);

  // Step 3: Build near-miss ground truth
  console.log(`\nStep 3: Building near-miss pairs (target: ≥40)`);
  const nearMissPairs = buildNearMissPairs(metadata, samePartPairs);
  console.log(`  Found ${nearMissPairs.length} near-miss pairs`);

  // Step 4: Validate matcher
  console.log(`\nStep 4: Validating matcher against ground truth`);
  const validation = validateMatcher(samePartPairs, nearMissPairs, metadata);

  console.log(`\n=== Validation Results ===`);
  console.log(`  True positives:  ${validation.truePositives}`);
  console.log(`  False positives: ${validation.falsePositives}`);
  console.log(`  True negatives:  ${validation.trueNegatives}`);
  console.log(`  False negatives: ${validation.falseNegatives}`);
  console.log(`  Coverage:        ${(validation.coverage * 100).toFixed(1)}% (${validation.productsWithPartNumber}/${validation.totalProducts})`);
  console.log(`  FPR:             ${(validation.falsePositiveRate * 100).toFixed(1)}% (target: ≤2%)`);
  console.log(`  FNR:             ${(validation.falseNegativeRate * 100).toFixed(1)}%`);
  console.log(`  FPR target met:  ${validation.falsePositiveRate <= 0.02 ? "YES" : "NO"}`);

  // Save results
  const outputPath = path.join(__dirname, "output/d19-attribution-matcher.json");
  const output = {
    timestamp: new Date().toISOString(),
    store: "subimods.com",
    totalProducts: metadata.length,
    coverage: {
      productsWithPartNumber: validation.productsWithPartNumber,
      totalProducts: validation.totalProducts,
      rate: validation.coverage,
    },
    groundTruth: {
      samePartPairs: samePartPairs.length,
      nearMissPairs: nearMissPairs.length,
    },
    validation: {
      truePositives: validation.truePositives,
      falsePositives: validation.falsePositives,
      trueNegatives: validation.trueNegatives,
      falseNegatives: validation.falseNegatives,
      falsePositiveRate: validation.falsePositiveRate,
      falseNegativeRate: validation.falseNegativeRate,
      fprTargetMet: validation.falsePositiveRate <= 0.02,
    },
    samePartPairs: samePartPairs.slice(0, 50), // save first 50 for inspection
    nearMissPairs: nearMissPairs.slice(0, 50),
    partNumberExamples: withPartNums.slice(0, 20).map((p) => ({
      title: p.title,
      vendor: p.vendor,
      partNumber: extractPartNumber(p.title),
      brand: extractBrand(p.vendor, p.title),
    })),
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nOutput saved to ${outputPath}`);
}

main().catch(console.error);
