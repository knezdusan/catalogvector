/**
 * Find TSP title-absent and title-present products for H4-R.
 * Scrape TSP's catalog via scoped queries, classify by title vehicle presence.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const TSP_GID = "gid://shopify/Shop/1357086779";
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

const VEHICLE_RE =
  /honda|acura|ford|subaru|mitsubishi|audi|scion|cadillac|holden|chevrolet|gmc|toyota|nissan|mazda|bmw|mercedes|lexus|hyundai|kia|volkswagen|vw|civic|accord|integra|mustang|camaro|wrx|sti|brz|frs|gt86|supra|corvette|f-150|f150|f250|f350|sierra|silverado|ridgeline|tacoma|tundra|frontier|sentra|altima|maxima|370z|350z|civic type r|civic si|civic type|fk8|fl5|fk7|fe1|fc1|fk2/i;

const VEHICLE_YEAR_RE = /\b(19|20)\d{2}\b/;

interface TspProduct {
  id: string;
  title: string;
  handle: string;
  tech_specs: string;
  hasVehicleInTitle: boolean;
  hasYearInTitle: boolean;
  hasVehicleInSpecs: boolean;
  category: string;
}

function classifyCategory(title: string, handle: string): string {
  const t = (title + " " + handle).toLowerCase();
  if (t.includes("brake pad")) return "brake pads";
  if (t.includes("brake kit")) return "brake kit";
  if (t.includes("brake line") || t.includes("brake hose"))
    return "brake lines";
  if (t.includes("brake rotor") || t.includes("rotor")) return "rotors";
  if (t.includes("coilover")) return "coilovers";
  if (
    t.includes("lowering spring") ||
    t.includes("sportline") ||
    t.includes("spring kit")
  )
    return "lowering springs";
  if (t.includes("lift kit") || t.includes("lift")) return "lift kit";
  if (t.includes("exhaust")) return "exhaust";
  if (t.includes("downpipe")) return "downpipe";
  if (t.includes("intake") || t.includes("intercooler")) return "intake";
  if (t.includes("camber") || t.includes("control arm")) return "control arms";
  if (t.includes("strut") || t.includes("sway")) return "suspension";
  if (t.includes("shifter") || t.includes("shift knob")) return "shifter";
  if (t.includes("tune") || t.includes("accessport")) return "tune";
  if (t.includes("spark plug")) return "spark plugs";
  if (t.includes("wheel") || t.includes("rim")) return "wheels";
  return "other";
}

async function scrapeTsp(token: string): Promise<TspProduct[]> {
  let cursor: string | null = null;
  const products: TspProduct[] = [];
  let hasNextPage = true;
  let pages = 0;

  // Use a broad query to get TSP's full catalog
  const queries = [
    "auto parts",
    "performance parts",
    "brake",
    "suspension",
    "exhaust",
    "intake",
  ];

  for (const query of queries) {
    cursor = null;
    hasNextPage = true;
    pages = 0;

    while (hasNextPage && pages < 20) {
      const pagination: { limit: number; cursor?: string } = {
        limit: PAGE_SIZE,
      };
      if (cursor) pagination.cursor = cursor;

      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: {
            meta: {
              "ucp-agent": { profile: process.env.UCP_AGENT_PROFILE_URL! },
            },
            catalog: {
              query,
              filters: { available: true, shops: [TSP_GID] },
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
      const pageProducts = (sc?.products ?? []) as Array<{
        id: string;
        title: string;
        variants?: Array<{ url?: string }>;
        metadata?: { tech_specs?: string };
      }>;
      hasNextPage = sc?.pagination?.has_next_page ?? false;
      cursor = sc?.pagination?.cursor ?? null;
      pages++;

      for (const p of pageProducts) {
        const url = p.variants?.[0]?.url ?? "";
        const handle = (url.match(/\/products\/([^?]+)/) || [])[1] ?? "";
        const techSpecs = p.metadata?.tech_specs ?? "";

        // Skip if already have this product
        if (products.some((x) => x.id === p.id)) continue;

        const hasVehicleInTitle = VEHICLE_RE.test(p.title);
        const hasYearInTitle = VEHICLE_YEAR_RE.test(p.title);
        const hasVehicleInSpecs = VEHICLE_RE.test(techSpecs);
        const category = classifyCategory(p.title, handle);

        products.push({
          id: p.id,
          title: p.title,
          handle,
          tech_specs: techSpecs,
          hasVehicleInTitle,
          hasYearInTitle,
          hasVehicleInSpecs,
          category,
        });
      }
    }
  }

  return products;
}

async function main() {
  console.log("\nH4-R PRODUCT DISCOVERY — TSP");
  console.log("═".repeat(66));
  console.log(`Store: TSP (${TSP_GID})`);
  console.log();

  const token = await getAccessToken();
  const products = await scrapeTsp(token);

  console.log(`Total TSP products found: ${products.length}`);

  // Classify
  const titleAbsent = products.filter(
    (p) => !p.hasVehicleInTitle && !p.hasYearInTitle && p.hasVehicleInSpecs,
  );
  const titlePresent = products.filter(
    (p) => p.hasVehicleInTitle || p.hasYearInTitle,
  );

  console.log(
    `Title-absent (no vehicle/year in title, vehicle in specs): ${titleAbsent.length}`,
  );
  console.log(
    `Title-present (vehicle or year in title): ${titlePresent.length}`,
  );
  console.log();

  // Group by category
  const taByCategory = new Map<string, TspProduct[]>();
  for (const p of titleAbsent) {
    if (!taByCategory.has(p.category)) taByCategory.set(p.category, []);
    taByCategory.get(p.category)!.push(p);
  }

  const tpByCategory = new Map<string, TspProduct[]>();
  for (const p of titlePresent) {
    if (!tpByCategory.has(p.category)) tpByCategory.set(p.category, []);
    tpByCategory.get(p.category)!.push(p);
  }

  console.log("=== TITLE-ABSENT BY CATEGORY ===");
  for (const [cat, ps] of [...taByCategory.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`  ${cat}: ${ps.length}`);
    for (const p of ps.slice(0, 3)) {
      console.log(`    ${p.title.substring(0, 70)}`);
      console.log(`      handle: ${p.handle}`);
      console.log(`      specs: ${p.tech_specs.substring(0, 100)}`);
    }
  }

  console.log("\n=== TITLE-PRESENT BY CATEGORY ===");
  for (const [cat, ps] of [...tpByCategory.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)) {
    console.log(`  ${cat}: ${ps.length}`);
    for (const p of ps.slice(0, 2)) {
      console.log(`    ${p.title.substring(0, 70)}`);
    }
  }

  // Find categories with both title-absent AND title-present
  console.log("\n=== CATEGORIES WITH BOTH POPULATIONS ===");
  const pairedCategories: string[] = [];
  for (const [cat, taPs] of taByCategory) {
    const tpPs = tpByCategory.get(cat) ?? [];
    if (taPs.length > 0 && tpPs.length > 0) {
      pairedCategories.push(cat);
      console.log(
        `  ${cat}: ${taPs.length} title-absent, ${tpPs.length} title-present`,
      );
    }
  }

  // For each paired category, show potential pairs
  for (const cat of pairedCategories) {
    const taPs = taByCategory.get(cat)!;
    const tpPs = tpByCategory.get(cat)!;
    console.log(`\n=== PAIRS IN CATEGORY: ${cat} ===`);
    console.log(`  Title-absent:`);
    for (const p of taPs) {
      console.log(`    [TA] ${p.title.substring(0, 70)}`);
      console.log(`         handle: ${p.handle}`);
      console.log(`         specs: ${p.tech_specs.substring(0, 120)}`);
    }
    console.log(`  Title-present (first 5):`);
    for (const p of tpPs.slice(0, 5)) {
      console.log(`    [TP] ${p.title.substring(0, 70)}`);
      console.log(`         handle: ${p.handle}`);
    }
  }

  // Save
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(dir, `h4r-tsp-discovery-${stamp}.json`);
  await writeFile(
    outPath,
    JSON.stringify(
      {
        totalProducts: products.length,
        titleAbsent: titleAbsent.length,
        titlePresent: titlePresent.length,
        titleAbsentProducts: titleAbsent,
        titlePresentProducts: titlePresent,
        pairedCategories,
      },
      null,
      2,
    ),
  );
  console.log(`\n  Saved → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
