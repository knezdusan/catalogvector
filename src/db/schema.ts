/**
 * Drizzle + Postgres + pgvector schema.
 *
 * Sketch from TDD.md §4. Column sets will move; the shape will not.
 * Status: PENDING — install `drizzle-orm`, `pg`, `pgvector` and migrate from this sketch.
 *
 * Reproducibility is a schema requirement, not a nicety: `requestBody`, `results`,
 * `model` and `rationale` are stored because the publication's defensibility rests
 * on a third party being able to re-run and disagree (TDD.md §4).
 *
 * TODO(I-5): install deps and materialize the tables below exactly as specified.
 */

// Types fixed now — the contracts the rest of the system programs against.
export type StoreCandidate = {
  domain: string;
  shopGid?: string; // U-3: may be null until resolved
  vertical: string;
  productsJsonAvailable: "yes" | "disabled" | "unknown";
  catalogEnrolled?: string; // observed, not assumed
  productCount?: number;
};

export type RawVariant = {
  id: number;
  title: string;
  sku: string | null;
  price: string;
  available?: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export type Product = {
  id: string;
  storeId: string;
  handle: string;
  title: string;
  bodyHtml: string | null;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  variants: RawVariant[];
  jsonLd: unknown;
  rawHash: string;
};

export type Query = {
  id: string;
  storeId: string;
  text: string;
  intent?: string;
  derivedFrom?: string;
  archetype: string; // PENDING — PHASE 0
  model: string;
};

export type Expectation = {
  id: string;
  queryId: string;
  productId: string;
  verdict: "should_match" | "partial" | "should_not_match";
  rationale: string; // human-auditable — required for publication
  method: "vector" | "arbitration" | "human";
  confidence: number;
};

export type Score = {
  id: string;
  queryId: string;
  recallAt10?: number;
  bestRank?: number | null; // null = not retrieved at any depth
  missClass?: string; // see TDD.md §6.2
};

// Table definitions are deferred until drizzle-orm is installed (I-5).
// See TDD.md §4 for the full `pgTable` sketch — replicate it verbatim when wiring.
