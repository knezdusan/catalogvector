/**
 * DIRECTIVE-7 Stage 4 — H4-R replication on a second store (Intec Racing)
 *
 * H4 (original, TSP+MAP): title-absent presence@50 = 0.125, title-present =
 * 0.833, difference 0.708 — SUPPORTED.
 *
 * H4-R: replicate on Intec Racing (www.intecracing.com).
 * - 6 title-absent EBC brake pad/rotor kits (title = "EBC S2 Brake Pad and
 *   Rotor Kit" etc., no vehicle in title, vehicle in tags)
 * - 6 title-present controls from Intec (vehicle in title)
 * - Relational queries for the stated vehicles
 * - Score presence@50 unscoped
 *
 * Pre-registered decision rule (from H4, unchanged):
 * - H4-R supported: title-absent presence@50 ≥ 0.40 below title-present
 * - H4-R rejected: difference ≤ 0.15
 * - H4-R inconclusive: anything between, or < 6 title-absent products,
 *   or < 6 matched pairs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const PAGE_SIZE = 50;

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
  variants?: Array<Record<string, unknown>>;
}

async function issueQuery(
  token: string,
  query: string,
): Promise<{
  products: CatalogProduct[];
  raw: unknown;
  totalCount: number | null;
}> {
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
          pagination: { limit: PAGE_SIZE },
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
  const totalCount = sc?.pagination?.total_count ?? null;
  return { products, raw, totalCount };
}

function handleOf(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/\/products\/([^?]+)/) || [])[1] || "";
}

function sellerDomain(p: CatalogProduct): string {
  const url = (p.variants?.[0]?.url as string) || "";
  return (url.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
}

// Title-absent EBC kits from Intec Racing (all fit 2017-2021 Honda Civic
// Type R / 2024 Acura Integra Type S)
const TITLE_ABSENT: Array<{
  id: string;
  handle: string;
  title: string;
  sku: string;
  vehicle: string;
}> = [
  {
    id: "H4R-A01",
    handle: "ebc-s2-brake-pad-and-rotor-kit-9",
    title: "EBC S2 Brake Pad and Rotor Kit",
    sku: "EBCS2KR3488",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-A02",
    handle: "ebc-s4-brake-pad-and-rotor-kit-71",
    title: "EBC S4 Brake Pad and Rotor Kit",
    sku: "EBCS4KR1636",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-A03",
    handle: "ebc-s5-brake-pad-and-rotor-kit-4",
    title: "EBC S5 Brake Pad and Rotor Kit",
    sku: "EBCS5KR1895",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-A04",
    handle: "ebc-s9-brake-pad-and-rotor-kit-10",
    title: "EBC S9 Brake Pad and Rotor Kit",
    sku: "EBCS9KR1816",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-A05",
    handle: "ebc-s12-brake-pad-and-rotor-kit-88",
    title: "EBC S12 Brake Pad and Rotor Kit",
    sku: "EBCS12KR1710",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-A06",
    handle: "ebc-s13-brake-pad-and-rotor-kit-30",
    title: "EBC S13 Brake Pad and Rotor Kit",
    sku: "EBCS13KR1970",
    vehicle: "2017-2021 Honda Civic Type R",
  },
];

// Title-present controls from Intec Racing (vehicle in title)
const TITLE_PRESENT: Array<{
  id: string;
  handle: string;
  title: string;
  vehicle: string;
}> = [
  {
    id: "H4R-C01",
    handle: "whiteline-2016-honda-civic-forward-trailing-arm-bushing",
    title: "Whiteline 2016+ Honda Civic Forward Trailing Arm Bushing",
    vehicle: "2016+ Honda Civic",
  },
  {
    id: "H4R-C02",
    handle: "whiteline-2016-honda-civic-rear-lower-control-arm-",
    title: "Whiteline 2016+ Honda Civic Rear Lower Control Arm",
    vehicle: "2016+ Honda Civic",
  },
  {
    id: "H4R-C03",
    handle: "10000000000600",
    title:
      "N1-X Evolution Extreme Catback Exhaust 2017-2021 Honda Civic Type-R",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-C04",
    handle: "10000000000616",
    title: "GT Frontpipe 2017+ Honda Civic Type-R FK8",
    vehicle: "2017+ Honda Civic Type R",
  },
  {
    id: "H4R-C05",
    handle: "10000000000617",
    title: "GT Frontpipe 2017+ Honda Civic 1.5L Turbo Engine Sport Si",
    vehicle: "2017+ Honda Civic Si",
  },
  {
    id: "H4R-C06",
    handle: "hks-2023-honda-civic-type-r-fl5-s-type-oil-cooler-",
    title: "HKS 2023+ Honda Civic Type R FL5 S Type Oil Cooler Kit",
    vehicle: "2023+ Honda Civic Type R",
  },
];

// Relational queries for the vehicles
const QUERIES: Array<{ id: string; query: string; vehicle: string }> = [
  {
    id: "H4R-Q01",
    query: "brake pads for 2018 Honda Civic Type R",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-Q02",
    query: "brake kit for 2020 Honda Civic Type R",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-Q03",
    query: "brake pads for 2024 Acura Integra Type S",
    vehicle: "2024 Acura Integra Type S",
  },
  {
    id: "H4R-Q04",
    query: "brake rotors for 2019 Honda Civic Type R",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-Q05",
    query: "suspension parts for 2017 Honda Civic",
    vehicle: "2016+ Honda Civic",
  },
  {
    id: "H4R-Q06",
    query: "exhaust for 2018 Honda Civic Type R",
    vehicle: "2017-2021 Honda Civic Type R",
  },
  {
    id: "H4R-Q07",
    query: "frontpipe for 2018 Honda Civic Type R",
    vehicle: "2017+ Honda Civic Type R",
  },
  {
    id: "H4R-Q08",
    query: "oil cooler for 2024 Honda Civic Type R",
    vehicle: "2023+ Honda Civic Type R",
  },
];

async function main() {
  console.log("\nDIRECTIVE-7 Stage 4 — H4-R REPLICATION (Intec Racing)");
  console.log("═".repeat(66));
  console.log("Store: Intec Racing (www.intecracing.com)");
  console.log(`Title-absent products: ${TITLE_ABSENT.length}`);
  console.log(`Title-present controls: ${TITLE_PRESENT.length}`);
  console.log(`Queries: ${QUERIES.length}`);
  console.log(`Scoping: UNSCOPED (no filters.shops)`);
  console.log();

  const token = await getAccessToken();
  const transcript: unknown[] = [];

  // Build target handle sets
  const absentHandles = new Set(TITLE_ABSENT.map((p) => p.handle));
  const presentHandles = new Set(TITLE_PRESENT.map((p) => p.handle));

  const results: Array<{
    queryId: string;
    query: string;
    totalCount: number | null;
    absentPresent: number;
    absentTotal: number;
    presentPresent: number;
    presentTotal: number;
    absentRanks: Array<{ handle: string; rank: number }>;
    presentRanks: Array<{ handle: string; rank: number }>;
  }> = [];

  for (const q of QUERIES) {
    console.log(`  ${q.id}: ${q.query}`);
    const { products, raw, totalCount } = await issueQuery(token, q.query);

    let absentPresent = 0;
    let presentPresent = 0;
    const absentRanks: Array<{ handle: string; rank: number }> = [];
    const presentRanks: Array<{ handle: string; rank: number }> = [];

    for (let i = 0; i < products.length; i++) {
      const h = handleOf(products[i]);
      const rank = i + 1;
      if (absentHandles.has(h)) {
        absentPresent++;
        absentRanks.push({ handle: h, rank });
      }
      if (presentHandles.has(h)) {
        presentPresent++;
        presentRanks.push({ handle: h, rank });
      }
    }

    // Check if any absent/present targets are from Intec
    const intecProducts = products.filter((p) =>
      sellerDomain(p).includes("intecracing"),
    );

    console.log(`    → ${products.length} products, total_count=${totalCount}`);
    console.log(
      `    Absent targets found: ${absentPresent}/${TITLE_ABSENT.length}`,
    );
    console.log(
      `    Present controls found: ${presentPresent}/${TITLE_PRESENT.length}`,
    );
    console.log(`    Intec products in top 50: ${intecProducts.length}`);

    transcript.push({
      queryId: q.id,
      query: q.query,
      totalCount,
      productCount: products.length,
      absentPresent,
      presentPresent,
      absentRanks,
      presentRanks,
      intecProductCount: intecProducts.length,
      response: raw,
    });

    results.push({
      queryId: q.id,
      query: q.query,
      totalCount,
      absentPresent,
      absentTotal: TITLE_ABSENT.length,
      presentPresent,
      presentTotal: TITLE_PRESENT.length,
      absentRanks,
      presentRanks,
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(
    "\n\n══════════════════════════════════════════════════════════════════",
  );
  console.log("H4-R SUMMARY — Intec Racing");
  console.log(
    "══════════════════════════════════════════════════════════════════",
  );

  // Per query
  console.log("\n  Per-query:");
  console.log("| Q | Query | Absent found | Present found | total_count |");
  console.log("|---|---|---|---|---|");
  for (const r of results) {
    console.log(
      `| ${r.queryId} | ${r.query.slice(0, 35)} | ${r.absentPresent}/${r.absentTotal} | ${r.presentPresent}/${r.presentTotal} | ${r.totalCount ?? "—"} |`,
    );
  }

  // Aggregate
  const totalAbsentPairs = TITLE_ABSENT.length * QUERIES.length;
  const totalPresentPairs = TITLE_PRESENT.length * QUERIES.length;
  const absentHits = results.reduce((sum, r) => sum + r.absentPresent, 0);
  const presentHits = results.reduce((sum, r) => sum + r.presentPresent, 0);

  const absentRate = absentHits / totalAbsentPairs;
  const presentRate = presentHits / totalPresentPairs;
  const difference = presentRate - absentRate;

  console.log(
    `\n  Title-absent presence@50: ${absentHits}/${totalAbsentPairs} = ${absentRate.toFixed(3)}`,
  );
  console.log(
    `  Title-present presence@50: ${presentHits}/${totalPresentPairs} = ${presentRate.toFixed(3)}`,
  );
  console.log(`  Difference: ${difference.toFixed(3)}`);
  console.log();

  // Verdict
  console.log("  VERDICT (pre-registered rule):");
  if (difference >= 0.4) {
    console.log(
      `    H4-R SUPPORTED — difference ${difference.toFixed(3)} ≥ 0.40`,
    );
    console.log(
      "    H4 replicates on a second store. Title dominates retrieval.",
    );
  } else if (difference <= 0.15) {
    console.log(
      `    H4-R REJECTED — difference ${difference.toFixed(3)} ≤ 0.15`,
    );
    console.log(
      "    H4 does not replicate. Title does not dominate retrieval on this store.",
    );
  } else {
    console.log(
      `    H4-R INCONCLUSIVE — difference ${difference.toFixed(3)} between 0.15 and 0.40`,
    );
  }

  // Per-target detail
  console.log("\n  Per-target detail:");
  console.log("| ID | Type | Handle | Found in queries | Ranks |");
  console.log("|---|---|---|---|---|");
  for (const t of TITLE_ABSENT) {
    const found = results
      .filter((r) => r.absentRanks.some((a) => a.handle === t.handle))
      .map((r) => {
        const rank = r.absentRanks.find((a) => a.handle === t.handle)?.rank;
        return `${r.queryId}@${rank}`;
      });
    console.log(
      `| ${t.id} | absent | ${t.handle.slice(0, 30)} | ${found.length} | ${found.join(", ") || "—"} |`,
    );
  }
  for (const t of TITLE_PRESENT) {
    const found = results
      .filter((r) => r.presentRanks.some((a) => a.handle === t.handle))
      .map((r) => {
        const rank = r.presentRanks.find((a) => a.handle === t.handle)?.rank;
        return `${r.queryId}@${rank}`;
      });
    console.log(
      `| ${t.id} | present | ${t.handle.slice(0, 30)} | ${found.length} | ${found.join(", ") || "—"} |`,
    );
  }

  // ─── Emit artifact ────────────────────────────────────────────────────
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outJson = join(dir, `h4r-intec-${stamp}.json`);
  await writeFile(
    outJson,
    JSON.stringify(
      {
        store: "Intec Racing",
        titleAbsent: TITLE_ABSENT,
        titlePresent: TITLE_PRESENT,
        queries: QUERIES,
        results,
        summary: {
          totalAbsentPairs,
          totalPresentPairs,
          absentHits,
          presentHits,
          absentRate,
          presentRate,
          difference,
        },
        transcript,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\n  Artifacts:`);
  console.log(`    JSON: ${outJson}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
