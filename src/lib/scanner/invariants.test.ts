import { describe, expect, it } from "vitest";
import {
  assertDomainInKnownStores,
  assertEnumerationComplete,
  assertHasSellerDomain,
  assertMethodValidated,
  assertSameSurface,
  type CatalogProduct,
  domainsMatch,
  type GroundTruth,
  InvariantViolation,
  normalizeDomain,
  PaginationInvariant,
  validateMethod,
} from "./invariants";

// ─── I-1: Pagination invariant ────────────────────────────────────────────

describe("I-1: PaginationInvariant", () => {
  it("passes when consecutive pages have distinct IDs and changing cursors", () => {
    const inv = new PaginationInvariant();
    inv.check({
      products: [{ id: "a", title: "A", surface: "catalog-api", variants: [] }],
      cursor: "c1",
      hasNextPage: true,
    });
    inv.check({
      products: [{ id: "b", title: "B", surface: "catalog-api", variants: [] }],
      cursor: "c2",
      hasNextPage: true,
    });
    inv.check({
      products: [{ id: "c", title: "C", surface: "catalog-api", variants: [] }],
      cursor: undefined,
      hasNextPage: false,
    });
    expect(inv.pageCount_).toBe(3);
  });

  it("throws when page 2 has the same IDs as page 1 (U8-A bug)", () => {
    const inv = new PaginationInvariant();
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `id${i}`,
      title: `P${i}`,
      surface: "catalog-api" as const,
      variants: [],
    }));
    inv.check({ products, cursor: "c1", hasNextPage: true });
    // Same 10 IDs on page 2 = 100% overlap, far above 20% threshold
    expect(() =>
      inv.check({ products, cursor: "c2", hasNextPage: true }),
    ).toThrow(InvariantViolation);
  });

  it("allows small overlap (API ranking shift) but catches large overlap", () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      id: `id${i}`,
      title: `P${i}`,
      surface: "catalog-api" as const,
      variants: [],
    }));

    // Test 1: 1 shared ID out of 10 = 10% overlap, below 20% threshold
    const inv1 = new PaginationInvariant(0.2);
    inv1.check({ products: page1, cursor: "c1", hasNextPage: true });
    const page2ok = [
      {
        id: "id0",
        title: "Shared",
        surface: "catalog-api" as const,
        variants: [],
      },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `new${i}`,
        title: `N${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
    ];
    expect(() =>
      inv1.check({ products: page2ok, cursor: "c2", hasNextPage: true }),
    ).not.toThrow();

    // Test 2: 3 shared IDs out of 10 = 30% overlap, above 20% threshold (fresh invariant)
    const inv2 = new PaginationInvariant(0.2);
    inv2.check({ products: page1, cursor: "c1", hasNextPage: true });
    const page2bad = [
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `id${i}`,
        title: `S${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        id: `new2${i}`,
        title: `N2${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
    ];
    expect(() =>
      inv2.check({ products: page2bad, cursor: "c3", hasNextPage: true }),
    ).toThrow(InvariantViolation);
  });

  it("logs every overlap event and exposes stats", () => {
    const inv = new PaginationInvariant(0.2, 0.15);
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      id: `id${i}`,
      title: `P${i}`,
      surface: "catalog-api" as const,
      variants: [],
    }));
    inv.check({ products: page1, cursor: "c1", hasNextPage: true });

    // 1 shared = 10% overlap, logged but allowed
    const page2 = [
      { id: "id0", title: "S", surface: "catalog-api" as const, variants: [] },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `n${i}`,
        title: `N${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
    ];
    inv.check({ products: page2, cursor: "c2", hasNextPage: true });

    const log = inv.getOverlapLog();
    expect(log).toHaveLength(1);
    expect(log[0].overlapCount).toBe(1);
    expect(log[0].overlapRatio).toBeCloseTo(0.1);

    const stats = inv.getOverlapStats();
    expect(stats.count).toBe(1);
    expect(stats.max).toBeCloseTo(0.1);
  });

  it("aborts at 15% overlap (DIRECTIVE-16 §4 abort threshold)", () => {
    const inv = new PaginationInvariant(0.2, 0.15);
    const page1 = Array.from({ length: 20 }, (_, i) => ({
      id: `id${i}`,
      title: `P${i}`,
      surface: "catalog-api" as const,
      variants: [],
    }));
    inv.check({ products: page1, cursor: "c1", hasNextPage: true });

    // 4 shared out of 20 = 20% overlap, above 15% abort threshold
    const page2 = [
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `id${i}`,
        title: `S${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `new${i}`,
        title: `N${i}`,
        surface: "catalog-api" as const,
        variants: [],
      })),
    ];
    expect(() =>
      inv.check({ products: page2, cursor: "c2", hasNextPage: true }),
    ).toThrow(InvariantViolation);
  });

  it("throws when cursor does not change between pages", () => {
    const inv = new PaginationInvariant();
    inv.check({
      products: [{ id: "a", title: "A", surface: "catalog-api", variants: [] }],
      cursor: "same",
      hasNextPage: true,
    });
    expect(() =>
      inv.check({
        products: [
          { id: "b", title: "B", surface: "catalog-api", variants: [] },
        ],
        cursor: "same",
        hasNextPage: true,
      }),
    ).toThrow(InvariantViolation);
  });

  it("throws when hasNextPage=true but cursor is undefined", () => {
    const inv = new PaginationInvariant();
    expect(() =>
      inv.check({
        products: [
          { id: "a", title: "A", surface: "catalog-api", variants: [] },
        ],
        cursor: undefined,
        hasNextPage: true,
      }),
    ).toThrow(InvariantViolation);
  });
});

// ─── I-2: Enumeration completeness ────────────────────────────────────────

describe("I-2: assertEnumerationComplete", () => {
  it("passes when counts match", () => {
    expect(() =>
      assertEnumerationComplete(100, 100, "/products.json"),
    ).not.toThrow();
  });

  it("throws when enumeration is short", () => {
    expect(() =>
      assertEnumerationComplete(5250, 9255, "/products.json"),
    ).toThrow(InvariantViolation);
  });
});

// ─── I-3: Seller domain ───────────────────────────────────────────────────

describe("I-3: assertHasSellerDomain", () => {
  it("passes when seller.domain is present", () => {
    const p: CatalogProduct = {
      id: "x",
      title: "X",
      surface: "catalog-api",
      variants: [{ seller: { domain: "store.myshopify.com", name: "Store" } }],
    };
    expect(() => assertHasSellerDomain(p)).not.toThrow();
  });

  it("throws when seller is missing", () => {
    const p: CatalogProduct = {
      id: "x",
      title: "X",
      surface: "catalog-api",
      variants: [{}],
    };
    expect(() => assertHasSellerDomain(p)).toThrow(InvariantViolation);
  });

  it("throws when variants array is empty", () => {
    const p: CatalogProduct = {
      id: "x",
      title: "X",
      surface: "catalog-api",
      variants: [],
    };
    expect(() => assertHasSellerDomain(p)).toThrow(InvariantViolation);
  });
});

// ─── I-4: Surface provenance ──────────────────────────────────────────────

describe("I-4: assertSameSurface", () => {
  it("passes when surfaces match", () => {
    expect(() =>
      assertSameSurface("catalog-api", "catalog-api", "test"),
    ).not.toThrow();
  });

  it("throws when surfaces differ (H7 error)", () => {
    expect(() =>
      assertSameSurface(
        "shop-app",
        "catalog-api",
        "comparing shop.app finding to Catalog",
      ),
    ).toThrow(InvariantViolation);
  });
});

// ─── I-5: Domain normalisation ────────────────────────────────────────────

describe("I-5: domain normalisation", () => {
  it("normalises www., case, and trailing dot", () => {
    expect(normalizeDomain("www.Example.com.")).toBe("example.com");
    expect(normalizeDomain("WWW.Store.com")).toBe("store.com");
    expect(normalizeDomain("store.com.")).toBe("store.com");
  });

  it("domainsMatch handles case and www. differences", () => {
    expect(
      domainsMatch("www.twostepperformance.com", "TWOSTEPPERFORMANCE.com"),
    ).toBe(true);
    expect(
      domainsMatch("twostepperformance.com", "twostepperformance.com"),
    ).toBe(true);
    // A real typo (different characters, not just case) is caught
    expect(
      domainsMatch("twosteppeformance.com", "twostepperformance.com"),
    ).toBe(false); // missing 'r'
  });

  it("assertDomainInKnownStores passes for known stores", () => {
    expect(() =>
      assertDomainInKnownStores(
        "www.subimods.com",
        ["subimods.com", "twostepperformance.com"],
        "test",
      ),
    ).not.toThrow();
  });

  it("assertDomainInKnownStores throws for unknown stores", () => {
    expect(() =>
      assertDomainInKnownStores("unknown-store.com", ["subimods.com"], "test"),
    ).toThrow(InvariantViolation);
  });
});

// ─── I-6: Method validation ───────────────────────────────────────────────

describe("I-6: validateMethod", () => {
  const groundTruth: GroundTruth = {
    confirmedPresent: ["p1", "p2", "p3", "p4", "p5"],
    confirmedAbsent: ["a1", "a2", "a3", "a4", "a5"],
  };

  it("passes a perfect method (0% false negatives)", () => {
    const v = validateMethod("perfect", groundTruth, (id) =>
      id.startsWith("p") ? "present" : "absent",
    );
    expect(v.falseNegativeRate).toBe(0);
    expect(v.passed).toBe(true);
  });

  it("fails a 54% false-negative method (the H7 failure)", () => {
    // 3 of 5 present items classified as absent = 60% FN
    const v = validateMethod("bad", groundTruth, (id) => {
      if (id === "p1" || id === "p2") return "present";
      if (id.startsWith("p")) return "absent"; // false negative
      return "absent";
    });
    expect(v.falseNegativeRate).toBe(0.6);
    expect(v.passed).toBe(false);
  });

  it("assertMethodValidated throws for failing methods", () => {
    const v = validateMethod("bad", groundTruth, () => "absent");
    expect(() => assertMethodValidated(v)).toThrow(InvariantViolation);
  });

  it("assertMethodValidated passes for good methods", () => {
    const v = validateMethod("good", groundTruth, (id) =>
      id.startsWith("p") ? "present" : "absent",
    );
    expect(() => assertMethodValidated(v)).not.toThrow();
  });
});
