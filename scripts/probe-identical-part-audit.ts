/**
 * DIRECTIVE-7 §6 — Identical-part audit
 *
 * For a single store (TSP), take ≥10 parts it stocks that at least 2 other
 * Shopify merchants also stock. For each: which merchants appear, at what
 * rank, whether the target appears at any depth, and the cause per TDD §6.2.
 * The product is held constant across merchants, so demand, price band and
 * category density are equalised by construction.
 *
 * Method:
 * 1. Query the Catalog unscoped for each part's SKU or brand+model
 * 2. Paginate to exhaustion
 * 3. For each result, check if it's from TSP or another merchant
 * 4. Record which merchants appear and at what rank
 * 5. Classify per TDD §6.2
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const PAGE_SIZE = 50;
const MAX_DEPTH = 1000;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.shopify.com/auth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CatalogProduct {
  id: string;
  title: string;
  description?: unknown;
  metadata?: { tech_specs?: string };
  variants?: Array<Record<string, unknown>>;
}

async function issueQueryPage(
  token: string,
  query: string,
  cursor: string | null,
): Promise<{
  products: CatalogProduct[];
  raw: unknown;
  hasNextPage: boolean;
  totalCount: number | null;
  cursor: string | null;
}> {
  const pagination: { limit: number; cursor?: string } = { limit: PAGE_SIZE };
  if (cursor) pagination.cursor = cursor;

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: process.env.UCP_AGENT_PROFILE_URL! } },
        catalog: {
          query,
          filters: { available: true },
          pagination,
        },
      },
    },
  };
  const res = await fetch(CATALOG_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.json();
  await sleep(RATE_LIMIT_MS);
  const sc = raw?.result?.structuredContent;
  const products = (sc?.products ?? []) as CatalogProduct[];
  const hasNextPage = sc?.pagination?.has_next_page ?? false;
  const totalCount = sc?.pagination?.total_count ?? null;
  const nextCursor = sc?.pagination?.cursor ?? null;
  return { products, raw, hasNextPage, totalCount, cursor: nextCursor };
}

function handleOf(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/\/products\/([^?]+)/) || [])[1] || "";
}

function sellerDomain(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
}

function isTSP(p: CatalogProduct): boolean {
  return sellerDomain(p).includes("twostep");
}

// TSP parts identified from storefront JSON (products.json)
// Each has a SKU that other merchants may also carry
const AUDIT_PARTS: Array<{
  id: string;
  vendor: string;
  title: string;
  tspHandle: string;
  sku: string;
  query: string;
}> = [
  {
    id: "AP01",
    vendor: "Eibach",
    title: "Eibach Pro-Kit Lowering Springs for 2022+ Honda Civic Si",
    tspHandle:
      "eibach-pro-kit-performance-lowering-springs-for-2022-honda-civic-si",
    sku: "EIBE10-40-048-01-22",
    query: "Eibach Pro-Kit lowering springs Honda Civic Si E10-40-048",
  },
  {
    id: "AP02",
    vendor: "Eibach",
    title: "Eibach Pro-Kit for 23+ Honda Civic Type R",
    tspHandle: "eibach-pro-kit-for-23-honda-civic-type-r-26-honda-prelude",
    sku: "EIBE10-40-043-03-22",
    query: "Eibach Pro-Kit Honda Civic Type R FL5 E10-40-043",
  },
  {
    id: "AP03",
    vendor: "Eibach",
    title: "Eibach Pro-Kit Lowering Springs for 2019+ Acura RDX A-Spec",
    tspHandle: "eibach-pro-kit-lowering-springs-for-2019-acura-rdx-a-spec",
    sku: "EIBE10-201-004-01-22",
    query: "Eibach Pro-Kit Acura RDX A-Spec E10-201-004",
  },
  {
    id: "AP04",
    vendor: "EBC",
    title: "EBC USR Series Slotted Rear Rotors for 2012-2015 Honda Civic",
    tspHandle: "ebc-usr-series-slotted-rear-rotors-for-2012-2015-honda-civic",
    sku: "ebcUSR7345",
    query: "EBC USR slotted rear rotors Honda Civic USR7345",
  },
  {
    id: "AP05",
    vendor: "EBC",
    title: "EBC USR Series Slotted Front Rotors for 2012-2015 Honda Civic",
    tspHandle: "ebc-usr-series-slotted-front-rotors-for-2012-2015-honda-civic",
    sku: "ebcUSR1473",
    query: "EBC USR slotted front rotors Honda Civic USR1473",
  },
  {
    id: "AP06",
    vendor: "Whiteline",
    title: "Whiteline Front Lower Inner Rear Bushing Caster & Anti Lift",
    tspHandle: "whiteline-front-lower-inner-rear-bushing-caster-anti-lift",
    sku: "WHLKCA467",
    query: "Whiteline KCA467 caster anti lift bushing",
  },
  {
    id: "AP07",
    vendor: "Invidia",
    title: "Invidia N1 Catback Exhaust for 2012-2015 Honda Civic Si",
    tspHandle:
      "invidia-n1-catback-exhaust-with-burnt-titanium-tip-for-2012-2015-honda-civic-si",
    sku: "invHS12HC4GTT",
    query: "Invidia N1 catback exhaust Honda Civic Si HS12HC4GTT",
  },
  {
    id: "AP08",
    vendor: "CSF",
    title: "CSF 2023+ Honda Civic FL5 Type R / 2024+ Acura Integra DE5",
    tspHandle: "csf-2023-honda-civic-fl5-type-r-2024-acura-integra-de5-type-s",
    sku: "csf7221",
    query: "CSF radiator Honda Civic Type R FL5 csf7221",
  },
  {
    id: "AP09",
    vendor: "RV6",
    title: "RV6 Performance Bellmouth Downpipe HFC Kit for 12-15 Honda Civic",
    tspHandle:
      "rv6-performance-bellmouth-downpipe-hfc-kit-for-12-15-honda-civic-si",
    sku: "BM_CIVIC_HFC-1215",
    query: "RV6 bellmouth downpipe HFC Honda Civic Si 2012-2015",
  },
  {
    id: "AP10",
    vendor: "RV6",
    title: "RV6 Double Resonated Midpipe for 2013-2017 Accord 3.5L V6",
    tspHandle: "rv6-double-resonated-midpipe-for-2013-2017-accord-3-5l-v6",
    sku: "MP-9G-ARDV6",
    query: "RV6 double resonated midpipe Accord 3.5L V6 2013-2017",
  },
  {
    id: "AP11",
    vendor: "Honda",
    title: "Honda Genuine Injector Set for 16-21 Honda Civic 1.5T",
    tspHandle: "honda-genuine-injector-set-for-16-21-honda-civic-1-5t",
    sku: "HG-HC10-15T-FIK",
    query: "Honda Genuine injector set Civic 1.5T 2016-2021",
  },
  {
    id: "AP12",
    vendor: "Honda",
    title: "Honda Genuine Ignition Coil Plug (4-Pack) for 2022+ Honda Civic",
    tspHandle: "honda-genuine-ignition-coil-plug-4-pack-for-2022-honda-civic",
    sku: "HG-HC11-ICP",
    query: "Honda Genuine ignition coil plug 4-pack Honda Civic 2022",
  },
];

async function main() {
  console.log("\nDIRECTIVE-7 §6 — IDENTICAL-PART AUDIT");
  console.log("═".repeat(66));
  console.log(`Store: Two Step Performance (www.twostepperformance.com)`);
  console.log(
    `Parts: ${AUDIT_PARTS.length} candidates from widely-distributed brands`,
  );
  console.log(`Scoping: UNSCOPED (no filters.shops)`);
  console.log(`Pagination: ${PAGE_SIZE}/page, max depth ${MAX_DEPTH}`);
  console.log();

  const token = await getAccessToken();
  const transcript: unknown[] = [];
  const results: Array<{
    partId: string;
    vendor: string;
    title: string;
    tspHandle: string;
    sku: string;
    query: string;
    totalCount: number | null;
    totalScanned: number;
    pages: number;
    tspPresent: boolean;
    tspRank: number | null;
    tspHandle: string | null;
    otherMerchants: Array<{
      domain: string;
      rank: number;
      title: string;
      isTsp: boolean;
    }>;
    distinctMerchantCount: number;
    missClass: string;
  }> = [];

  for (const part of AUDIT_PARTS) {
    console.log(`\n  ${part.id}: ${part.vendor} — ${part.title.slice(0, 50)}`);
    console.log(`    Query: "${part.query}"`);
    console.log(`    TSP handle: ${part.tspHandle}`);

    // Paginate to exhaustion
    let cursor: string | null = null;
    let pageNum = 0;
    let totalScanned = 0;
    let totalCount: number | null = null;
    const allProducts: Array<{ product: CatalogProduct; rank: number }> = [];

    while (totalScanned < MAX_DEPTH) {
      const page = await issueQueryPage(token, part.query, cursor);
      pageNum++;
      if (totalCount === null) totalCount = page.totalCount;

      for (let i = 0; i < page.products.length; i++) {
        const rank = totalScanned + i + 1;
        allProducts.push({ product: page.products[i], rank });
      }

      totalScanned += page.products.length;
      transcript.push({
        step: "page",
        partId: part.id,
        page: pageNum,
        offset: totalScanned,
        productCount: page.products.length,
        hasNextPage: page.hasNextPage,
        totalCount: page.totalCount,
        response: page.raw,
      });

      if (!page.hasNextPage || page.products.length === 0) break;
      cursor = page.cursor;
      if (!cursor) break;
    }

    // Find TSP and other merchants
    let tspPresent = false;
    let tspRank: number | null = null;
    let tspFoundHandle: string | null = null;
    const otherMerchants: Array<{
      domain: string;
      rank: number;
      title: string;
      isTsp: boolean;
    }> = [];

    for (const { product, rank } of allProducts) {
      const h = handleOf(product);
      const d = sellerDomain(product);
      const isTspProduct = isTSP(product);

      if (isTspProduct) {
        if (!tspPresent) {
          tspPresent = true;
          tspRank = rank;
          tspFoundHandle = h;
        }
        otherMerchants.push({
          domain: d,
          rank,
          title: product.title.slice(0, 60),
          isTsp: true,
        });
      } else {
        otherMerchants.push({
          domain: d,
          rank,
          title: product.title.slice(0, 60),
          isTsp: false,
        });
      }
    }

    const distinctMerchants = new Set(otherMerchants.map((m) => m.domain)).size;

    // Classify per TDD §6.2
    let missClass: string;
    if (tspPresent) {
      missClass = "present";
    } else if (otherMerchants.length > 0) {
      // TSP absent but other merchants present — structural invisibility candidate
      missClass = "structural_invisibility";
    } else {
      missClass = "not_enrolled";
    }

    console.log(
      `    → ${totalScanned} products scanned (${pageNum} pages), total_count=${totalCount}`,
    );
    console.log(
      `    TSP present: ${tspPresent ? `YES (rank ${tspRank})` : "NO"}`,
    );
    console.log(`    Other merchants: ${distinctMerchants} distinct domains`);
    if (otherMerchants.length > 0 && !tspPresent) {
      console.log(
        `    *** STRUCTURAL INVISIBILITY: TSP absent, ${distinctMerchants} other merchants present ***`,
      );
    }

    results.push({
      partId: part.id,
      vendor: part.vendor,
      title: part.title,
      tspHandle: part.tspHandle,
      sku: part.sku,
      query: part.query,
      totalCount,
      totalScanned,
      pages: pageNum,
      tspPresent,
      tspRank,
      tspFoundHandle,
      otherMerchants: otherMerchants.slice(0, 20),
      distinctMerchantCount: distinctMerchants,
      missClass,
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(
    "\n\n══════════════════════════════════════════════════════════════════",
  );
  console.log("IDENTICAL-PART AUDIT SUMMARY");
  console.log(
    "══════════════════════════════════════════════════════════════════",
  );

  const present = results.filter((r) => r.tspPresent).length;
  const invisible = results.filter(
    (r) => r.missClass === "structural_invisibility",
  ).length;
  const notEnrolled = results.filter(
    (r) => r.missClass === "not_enrolled",
  ).length;

  console.log(`\n  Total parts audited: ${results.length}`);
  console.log(`  TSP present: ${present}/${results.length}`);
  console.log(
    `  TSP absent, others present (structural invisibility): ${invisible}/${results.length}`,
  );
  console.log(
    `  TSP absent, no one present (not enrolled): ${notEnrolled}/${results.length}`,
  );

  console.log("\n  Per-part detail:");
  console.log(
    "| ID | Vendor | Title | TSP? | TSP rank | Other merchants | total_count | Classification |",
  );
  console.log("|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    console.log(
      `| ${r.partId} | ${r.vendor} | ${r.title.slice(0, 40)} | ${r.tspPresent ? "YES" : "NO"} | ${r.tspRank ?? "—"} | ${r.distinctMerchantCount} | ${r.totalCount ?? "—"} | ${r.missClass} |`,
    );
  }

  // The controlled comparison: for each part where TSP is absent but others present
  console.log(
    "\n  Structural invisibility cases (TSP absent, others present):",
  );
  for (const r of results.filter(
    (r) => r.missClass === "structural_invisibility",
  )) {
    console.log(`\n    ${r.partId}: ${r.vendor} — ${r.title.slice(0, 50)}`);
    console.log(`    TSP handle: ${r.tspHandle}`);
    console.log(`    Query: "${r.query}"`);
    console.log(
      `    Total results: ${r.totalScanned} (total_count=${r.totalCount})`,
    );
    console.log(`    Other merchants in results:`);
    const others = r.otherMerchants.filter((m) => !m.isTsp).slice(0, 10);
    for (const m of others) {
      console.log(`      rank ${m.rank}: ${m.domain} — ${m.title}`);
    }
  }

  // ─── Emit artifact ────────────────────────────────────────────────────
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const output = {
    directive: "DIRECTIVE-7 §6",
    timestamp: new Date().toISOString(),
    store: "Two Step Performance",
    parts: AUDIT_PARTS,
    results,
    summary: {
      total: results.length,
      present,
      structuralInvisibility: invisible,
      notEnrolled,
    },
  };

  const outJson = join(dir, `identical-part-audit-${stamp}.json`);
  await writeFile(
    outJson,
    JSON.stringify({ ...output, transcript }, null, 2),
    "utf8",
  );
  console.log(`\n  Artifacts:`);
  console.log(`    JSON: ${outJson}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
