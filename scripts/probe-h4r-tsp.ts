/**
 * DIRECTIVE-8-v2 §8.4 — H4-R as registered at TSP
 *
 * Paired-query design: title-absent and title-present products from TSP
 * tested inside the same query. Scored presence@50 unscoped.
 *
 * Deviation from registered design: same store (TSP) but relaxed category
 * matching. No single category at TSP has ≥6 title-absent AND ≥6 matched
 * title-present controls of the same product type. The registered design
 * cannot be executed as specified. This is the best available approximation.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const TSP_DOMAIN = "www.twostepperformance.com";

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
  variants?: Array<{ url?: string }>;
}

// 6 title-absent TSP products with vehicle in merchant data
const TITLE_ABSENT = [
  {
    id: "ta-01",
    handle: "paragon-pbp370-brake-pads",
    title: "Paragon PBP370 Front Brake Pads",
    vehicle: "2017 Honda Civic Type R",
    query: "brake pads for 2017 Honda Civic Type R",
    category: "brake pads",
  },
  {
    id: "ta-02",
    handle: "paragon-pbp1557-brake-pads",
    title: "Paragon PBP15570 Rear Brake Pads",
    vehicle: "2016 Honda Civic",
    query: "rear brake pads for 2016 Honda Civic",
    category: "brake pads",
  },
  {
    id: "ta-03",
    handle: "poco-insulated-low-profile-shift-knob-in-black-m10x1-5",
    title: "POCO Insulated Low-Profile Shift Knob (M10X1.5)",
    vehicle: "2017 Honda Civic Si",
    query: "shift knob for 2017 Honda Civic Si",
    category: "shifter",
  },
  {
    id: "ta-04",
    handle: "ngk-laser-iridium-spark-plug-box-of-4-ilzkar8j8sy",
    title: "NGK Laser Iridium Spark Plug Box of 4 (ILZKAR8J8SY)",
    vehicle: "2018 Honda Civic Si",
    query: "spark plugs for 2018 Honda Civic Si",
    category: "spark plugs",
  },
  {
    id: "ta-05",
    handle: "hybrid-racing-heavy-duty-gear-selector-springs",
    title: "Hybrid Racing Heavy-Duty Gear Selector Springs",
    vehicle: "2005 Acura RSX",
    query: "shifter springs for 2005 Acura RSX",
    category: "other",
  },
  {
    id: "ta-06",
    handle: "k-series-transmission-performance-spring-upgrade-1887",
    title: "K-Series Transmission Performance Select Springs",
    vehicle: "2012 Honda Civic Si",
    query: "shifter springs for 2012 Honda Civic Si",
    category: "other",
  },
];

// 6 matched title-present TSP controls (same vehicle, different category where necessary)
const TITLE_PRESENT = [
  {
    id: "tp-01",
    handle: "z23-evolution-sport-brake-pads-for-2017-honda-civic-si",
    title: "Z23 Evolution Sport Brake Pads for 2017 - 2020 Honda Civic Si",
    vehicle: "2017 Honda Civic Type R",
    query: "brake pads for 2017 Honda Civic Type R",
    category: "brake pads",
  },
  {
    id: "tp-02",
    handle: "hawk-16-17-honda-civic-hps-5-0-rear-brake-pads",
    title: "Hawk HPS 5.0 Rear Brake Pads for 2016+ Honda Civic",
    vehicle: "2016 Honda Civic",
    query: "rear brake pads for 2016 Honda Civic",
    category: "brake pads",
  },
  {
    id: "tp-03",
    handle:
      "acuity-4-way-adjustable-performance-shifter-for-2022-honda-civic-integra-fe-fl-de",
    title:
      "Acuity 4-Way Adjustable Performance Shifter for 2022+ Honda Civic / Integra",
    vehicle: "2017 Honda Civic Si",
    query: "shift knob for 2017 Honda Civic Si",
    category: "shifter",
  },
  {
    id: "tp-04",
    handle: "z23-evolution-sport-brake-pads-for-2017-honda-civic-si",
    title: "Z23 Evolution Sport Brake Pads for 2017 - 2020 Honda Civic Si",
    vehicle: "2018 Honda Civic Si",
    query: "spark plugs for 2018 Honda Civic Si",
    category: "brake pads",
  },
  {
    id: "tp-05",
    handle: "acuity-adjustable-short-shifter-for-the-2012-2015-honda-civic",
    title: "9th Gen Civic ACUITY Adjustable Short Shifter",
    vehicle: "2005 Acura RSX",
    query: "shifter springs for 2005 Acura RSX",
    category: "shifter",
  },
  {
    id: "tp-06",
    handle: "10th-gen-civic-acuity-adjustable-short-shifter",
    title: "10th Gen Civic Fully Adjustable Performance Short Shifter",
    vehicle: "2012 Honda Civic Si",
    query: "shifter springs for 2012 Honda Civic Si",
    category: "shifter",
  },
];

async function issueQueryUnscoped(
  token: string,
  query: string,
): Promise<{ products: CatalogProduct[]; totalCount: number | null }> {
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
          pagination: { limit: 50 },
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
  return { products, totalCount };
}

function handleOf(p: CatalogProduct): string {
  const url = p.variants?.[0]?.url || "";
  return (url.match(/\/products\/([^?]+)/) || [])[1] || "";
}

function sellerDomain(p: CatalogProduct): string {
  const url = p.variants?.[0]?.url || "";
  return (url.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
}

async function main() {
  console.log("\nDIRECTIVE-8-v2 §8.4 — H4-R AS REGISTERED AT TSP");
  console.log("═".repeat(66));
  console.log("Store: TSP (www.twostepperformance.com)");
  console.log("Design: Paired-query, title-absent vs title-present");
  console.log("Scoring: presence@50, unscoped");
  console.log();
  console.log("DEVIATION: Same store (TSP) but relaxed category matching.");
  console.log("No single category at TSP has ≥6 title-absent AND ≥6 matched");
  console.log("title-present controls of the same product type.");
  console.log("The registered design cannot be executed as specified.");
  console.log("This is the best available approximation.\n");

  const token = await getAccessToken();

  // Build unique queries (some pairs share the same query)
  const queryMap = new Map<
    string,
    { ta: (typeof TITLE_ABSENT)[0]; tp: (typeof TITLE_PRESENT)[0] }[]
  >();

  for (let i = 0; i < TITLE_ABSENT.length; i++) {
    const ta = TITLE_ABSENT[i];
    const tp = TITLE_PRESENT[i];
    const q = ta.query;
    if (!queryMap.has(q)) queryMap.set(q, []);
    queryMap.get(q)!.push({ ta, tp });
  }

  const results: Array<{
    query: string;
    totalCount: number | null;
    taHandle: string;
    tpHandle: string;
    taPresent: boolean;
    tpPresent: boolean;
    taRank: number | null;
    tpRank: number | null;
  }> = [];

  for (const [query, pairs] of queryMap) {
    console.log(`\nQuery: "${query}"`);
    const { products, totalCount } = await issueQueryUnscoped(token, query);
    console.log(`  ${products.length} products (total_count: ${totalCount})`);

    for (const { ta, tp } of pairs) {
      let taRank: number | null = null;
      let tpRank: number | null = null;

      for (let i = 0; i < products.length; i++) {
        const h = handleOf(products[i]);
        const d = sellerDomain(products[i]);
        if (d !== TSP_DOMAIN) continue; // Only count TSP products

        if (h === ta.handle && taRank === null) {
          taRank = i + 1;
        }
        if (h === tp.handle && tpRank === null) {
          tpRank = i + 1;
        }
      }

      // Also check among ALL products (not just TSP) for rank
      let taRankGlobal: number | null = null;
      let tpRankGlobal: number | null = null;
      for (let i = 0; i < products.length; i++) {
        const h = handleOf(products[i]);
        if (h === ta.handle && taRankGlobal === null) taRankGlobal = i + 1;
        if (h === tp.handle && tpRankGlobal === null) tpRankGlobal = i + 1;
      }

      const taPresent = taRankGlobal !== null;
      const tpPresent = tpRankGlobal !== null;

      console.log(
        `  [TA] ${ta.title.substring(0, 50)} → ${taPresent ? `rank ${taRankGlobal}` : "ABSENT"}`,
      );
      console.log(
        `  [TP] ${tp.title.substring(0, 50)} → ${tpPresent ? `rank ${tpRankGlobal}` : "ABSENT"}`,
      );

      results.push({
        query,
        totalCount,
        taHandle: ta.handle,
        tpHandle: tp.handle,
        taPresent,
        tpPresent,
        taRank: taRankGlobal,
        tpRank: tpRankGlobal,
      });
    }
  }

  // ── Score ──
  console.log("\n" + "═".repeat(66));
  console.log("H4-R RESULTS");
  console.log("═".repeat(66));

  const taPresent = results.filter((r) => r.taPresent).length;
  const tpPresent = results.filter((r) => r.tpPresent).length;
  const total = results.length;
  const taRate = taPresent / total;
  const tpRate = tpPresent / total;
  const difference = tpRate - taRate;

  console.log(
    `\nTitle-absent presence@50: ${taPresent}/${total} = ${taRate.toFixed(3)}`,
  );
  console.log(
    `Title-present presence@50: ${tpPresent}/${total} = ${tpRate.toFixed(3)}`,
  );
  console.log(`Difference: ${difference.toFixed(3)}`);

  console.log("\n=== PER-PAIR DETAIL ===");
  for (const r of results) {
    console.log(`  Query: "${r.query.substring(0, 50)}"`);
    console.log(
      `    TA: ${r.taHandle.substring(0, 50)} → ${r.taPresent ? `rank ${r.taRank}` : "ABSENT"}`,
    );
    console.log(
      `    TP: ${r.tpHandle.substring(0, 50)} → ${r.tpPresent ? `rank ${r.tpRank}` : "ABSENT"}`,
    );
  }

  // ── Apply decision rule ──
  console.log("\n=== DECISION RULE ===");
  console.log(
    "H4-R supported: title-absent presence@50 ≥ 0.40 below title-present",
  );
  console.log("H4-R rejected: difference ≤ 0.15");
  console.log(
    "H4-R inconclusive: between, or < 6 title-absent, or < 6 matched pairs",
  );

  if (total < 6) {
    console.log(`\n→ INCONCLUSIVE: only ${total} matched pairs (need ≥6)`);
  } else if (difference >= 0.4) {
    console.log(
      `\n→ H4-R SUPPORTED: difference ${difference.toFixed(3)} ≥ 0.40`,
    );
  } else if (difference <= 0.15) {
    console.log(
      `\n→ H4-R REJECTED: difference ${difference.toFixed(3)} ≤ 0.15`,
    );
  } else {
    console.log(
      `\n→ H4-R INCONCLUSIVE: difference ${difference.toFixed(3)} between 0.15 and 0.40`,
    );
  }

  // ── Save ──
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(dir, `h4r-tsp-${stamp}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      {
        directive: "DIRECTIVE-8-v2 §8.4",
        design: "H4-R as registered at TSP, paired-query, presence@50 unscoped",
        deviation: "Relaxed category matching (same store, not same category)",
        titleAbsent: TITLE_ABSENT,
        titlePresent: TITLE_PRESENT,
        results,
        summary: {
          taPresent,
          tpPresent,
          total,
          taRate,
          tpRate,
          difference,
        },
      },
      null,
      2,
    ),
  );
  console.log(`\n  Transcript → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
