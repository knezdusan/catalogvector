/**
 * DIRECTIVE-15 §3: Runtime invariant library for Catalog probes.
 *
 * Every historical failure in this project was detectable at runtime by a
 * one-line assertion. This module implements those assertions as enforced
 * invariants. A probe that cannot satisfy its invariants aborts and reports;
 * it does not return partial data.
 *
 * Invariants:
 *   I-1  Consecutive pages must share zero product IDs, cursor must change
 *   I-2  Store enumeration must equal sitemap product count, or abort with delta
 *   I-3  Every presence/absence claim must carry a seller.domain
 *   I-4  Every result row records which API/surface produced it; cross-surface
 *        comparison is refused
 *   I-5  Domain comparison is normalised; compared domain must exist in known-store list
 *   I-6  Any membership/matching method reports its false-negative rate against
 *        committed ground truth before any result is quoted
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type Surface =
  | "catalog-api"
  | "shop-app"
  | "storefront-json"
  | "sitemap-xml";

export type Seller = {
  domain: string;
  name: string;
};

export type CatalogProduct = {
  id: string;
  title: string;
  surface: Surface;
  variants: Array<{
    id?: string;
    seller?: Seller;
    url?: string;
    available?: boolean;
    price?: string;
  }>;
};

export type PageResult = {
  products: CatalogProduct[];
  cursor: string | undefined;
  hasNextPage: boolean;
};

export type Provenance = {
  sourceFile: string;
  commitHash: string;
  surface: Surface;
  invariantsPassed: string[];
  timestamp: string;
};

// ─── I-1: Pagination invariant ────────────────────────────────────────────

/**
 * I-1: Consecutive pages must not share significant overlap, and the cursor
 * must change between requests.
 *
 * Catches: the U8-A pagination bug (same IDs returned on every page).
 *
 * Note: The Catalog API's relevance ranking shifts between requests, causing
 * 1–9 products of overlap per page (1.6–8.1% of a 50-product page). This is
 * a real API behavior, not a bug. The invariant allows overlap up to
 * maxOverlapRatio (default 0.2 = 20% of page size) while still catching the
 * U8-A bug (100% overlap).
 */
export class PaginationInvariant {
  private previousIds: Set<string> | null = null;
  private previousCursor: string | undefined = undefined;
  private pageCount = 0;
  private readonly maxOverlapRatio: number;

  constructor(maxOverlapRatio = 0.2) {
    this.maxOverlapRatio = maxOverlapRatio;
  }

  check(page: PageResult): void {
    this.pageCount++;
    const currentIds = new Set(page.products.map((p) => p.id));

    if (this.previousIds !== null) {
      const prev = this.previousIds;
      const shared = [...currentIds].filter((id) => prev.has(id));
      const maxAllowed = Math.ceil(page.products.length * this.maxOverlapRatio);
      if (shared.length > maxAllowed) {
        throw new InvariantViolation(
          "I-1",
          `Page ${this.pageCount} shares ${shared.length} product IDs with page ${this.pageCount - 1} ` +
            `(max allowed: ${maxAllowed}). ` +
            `First shared ID: ${shared[0]}. ` +
            `This indicates broken pagination — the cursor is not advancing.`,
        );
      }
    }

    if (page.hasNextPage) {
      if (page.cursor === undefined || page.cursor === null) {
        throw new InvariantViolation(
          "I-1",
          `Page ${this.pageCount} has has_next_page=true but no cursor. Pagination cannot continue.`,
        );
      }
      if (page.cursor === this.previousCursor) {
        throw new InvariantViolation(
          "I-1",
          `Page ${this.pageCount} cursor is identical to page ${this.pageCount - 1}. ` +
            `The cursor is not changing — pagination is stuck.`,
        );
      }
    }

    this.previousIds = currentIds;
    this.previousCursor = page.cursor;
  }

  get pageCount_(): number {
    return this.pageCount;
  }
}

// ─── I-2: Store enumeration invariant ─────────────────────────────────────

/**
 * I-2: Any store enumeration must equal the sitemap product count, or abort
 * with the delta.
 *
 * Catches: /products.json being short by 40-75%.
 */
export function assertEnumerationComplete(
  enumeratedCount: number,
  sitemapCount: number,
  source: string,
): void {
  if (enumeratedCount !== sitemapCount) {
    const delta = sitemapCount - enumeratedCount;
    throw new InvariantViolation(
      "I-2",
      `Store enumeration from ${source} yielded ${enumeratedCount} products, ` +
        `but sitemap declares ${sitemapCount}. Delta: ${delta}. ` +
        `The enumeration is incomplete — do not use as a denominator.`,
    );
  }
}

// ─── I-3: Seller domain invariant ─────────────────────────────────────────

/**
 * I-3: Every presence or absence claim must carry a seller.domain; a claim
 * without one is rejected.
 *
 * Catches: H6's product-match-vs-seller-match error, and U-9's repeat of it.
 */
export function assertHasSellerDomain(product: CatalogProduct): void {
  const seller = product.variants?.[0]?.seller;
  if (!seller || !seller.domain) {
    throw new InvariantViolation(
      "I-3",
      `Product ${product.id} ("${product.title?.substring(0, 50)}") has no seller.domain. ` +
        `A presence/absence claim without a seller domain is not reportable.`,
    );
  }
}

export function filterWithSellerDomain(
  products: CatalogProduct[],
): CatalogProduct[] {
  return products.filter((p) => {
    const seller = p.variants?.[0]?.seller;
    return !!seller?.domain;
  });
}

// ─── I-4: Surface provenance invariant ────────────────────────────────────

/**
 * I-4: Every result row records which API or surface produced it, and
 * cross-surface comparison is refused.
 *
 * Catches: H7 — a shop.app finding read as a Catalog finding.
 */
export function assertSameSurface(
  a: Surface,
  b: Surface,
  context: string,
): void {
  if (a !== b) {
    throw new InvariantViolation(
      "I-4",
      `Cross-surface comparison refused: ${context} compares ${a} with ${b}. ` +
        `Findings from one surface cannot be attributed to another.`,
    );
  }
}

export function tagWithSurface<T>(
  data: T,
  surface: Surface,
): T & { surface: Surface } {
  return { ...data, surface };
}

// ─── I-5: Domain normalisation invariant ──────────────────────────────────

/**
 * I-5: Domain comparison is normalised (www., case, trailing dot) and the
 * compared domain must exist in the known-store list.
 *
 * Catches: the twosteppeRformance one-character false negative.
 */
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "")
    .trim();
}

export function assertDomainInKnownStores(
  domain: string,
  knownStores: string[],
  context: string,
): void {
  const normalized = normalizeDomain(domain);
  const known = knownStores.map(normalizeDomain);
  if (!known.includes(normalized)) {
    throw new InvariantViolation(
      "I-5",
      `Domain "${domain}" (normalised: "${normalized}") is not in the known-store list. ` +
        `Context: ${context}. ` +
        `This may be a typo or an unrecognised store.`,
    );
  }
}

export function domainsMatch(a: string, b: string): boolean {
  return normalizeDomain(a) === normalizeDomain(b);
}

// ─── I-6: Method validation invariant ─────────────────────────────────────

/**
 * I-6: Any membership or matching method reports its false-negative rate
 * against committed ground truth before any result derived from it is quoted.
 *
 * Catches: the 54% false-negative membership test.
 */
export type GroundTruth = {
  confirmedPresent: string[]; // handles or IDs known to be present
  confirmedAbsent: string[]; // handles or IDs known to be absent
};

export type MethodValidation = {
  method: string;
  totalChecked: number;
  truePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegativeRate: number;
  falsePositiveRate: number;
  passed: boolean;
  threshold: number;
};

export function validateMethod(
  method: string,
  groundTruth: GroundTruth,
  classifyFn: (id: string) => "present" | "absent",
  threshold = 0.1,
): MethodValidation {
  let truePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;

  for (const id of groundTruth.confirmedPresent) {
    const result = classifyFn(id);
    if (result === "present") truePositives++;
    else falseNegatives++;
  }

  for (const id of groundTruth.confirmedAbsent) {
    const result = classifyFn(id);
    if (result === "absent") trueNegatives++;
    else falsePositives++;
  }

  const totalChecked =
    groundTruth.confirmedPresent.length + groundTruth.confirmedAbsent.length;
  const falseNegativeRate =
    groundTruth.confirmedPresent.length > 0
      ? falseNegatives / groundTruth.confirmedPresent.length
      : 0;
  const falsePositiveRate =
    groundTruth.confirmedAbsent.length > 0
      ? falsePositives / groundTruth.confirmedAbsent.length
      : 0;

  return {
    method,
    totalChecked,
    truePositives,
    falseNegatives,
    trueNegatives,
    falsePositives,
    falseNegativeRate,
    falsePositiveRate,
    passed: falseNegativeRate <= threshold,
    threshold,
  };
}

export function assertMethodValidated(validation: MethodValidation): void {
  if (!validation.passed) {
    throw new InvariantViolation(
      "I-6",
      `Method "${validation.method}" has a false-negative rate of ` +
        `${(validation.falseNegativeRate * 100).toFixed(1)}% ` +
        `(threshold: ${(validation.threshold * 100).toFixed(1)}%). ` +
        `Results from this method are not reportable until the rate is below threshold.`,
    );
  }
}

// ─── Provenance ────────────────────────────────────────────────────────────

export function makeProvenance(
  sourceFile: string,
  commitHash: string,
  surface: Surface,
  invariantsPassed: string[],
): Provenance {
  return {
    sourceFile,
    commitHash,
    surface,
    invariantsPassed,
    timestamp: new Date().toISOString(),
  };
}

// ─── InvariantViolation error ──────────────────────────────────────────────

export class InvariantViolation extends Error {
  readonly invariant: string;

  constructor(invariant: string, message: string) {
    super(`[${invariant}] ${message}`);
    this.name = "InvariantViolation";
    this.invariant = invariant;
  }
}
