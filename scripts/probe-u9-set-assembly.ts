/**
 * U-9 Set B assembly (DIRECTIVE-12 §4):
 *
 * Set B = 10 products absent from Catalog API at depth, but present on
 * shop.app under their own merchant's listing.
 *
 * Strategy:
 * 1. From the authenticated pass data, identify merchant domains that appeared
 *    in ChatGPT/Copilot/Google results but are NOT in our scan set.
 * 2. For each such merchant, pick a product that appeared in the results.
 * 3. Check if that product is in the Catalog API (search by title).
 * 4. Check if that product is on shop.app under that merchant's listing.
 * 5. If absent from Catalog but present on shop.app under own merchant → Set B candidate.
 *
 * Set A = 10 products present in Catalog API's deterministic top-12.
 * We already have these from the U8-A refined results.
 */

import fs from "node:fs";
import { execSync } from "node:child_process";

interface CatalogResult {
  found: boolean;
  rank: number | null;
  totalResults: number;
  topProductIds: string[];
}

function ucpSearch(query: string, cursor?: string): { products: Array<{ id: string; title: string }>; pagination: { has_next_page: boolean; cursor?: string } } {
  const setArg = cursor ? `/query=${query.replace(/'/g, "'\\''")},cursor=${cursor}` : `/query=${query.replace(/'/g, "'\\''")}`;
  const cmd = `ucp catalog search --set '${setArg}' --json 2>/dev/null`;
  try {
    const output = execSync(cmd, { timeout: 60000, encoding: "utf8", env: { ...process.env } });
    const data = JSON.parse(output);
    const products = data.result?.products || [];
    const pagination = data.result?.pagination || { has_next_page: false };
    return { products, pagination };
  } catch (e) {
    return { products: [], pagination: { has_next_page: false } };
  }
}

function searchCatalogAll(query: string, maxProducts = 300): Array<{ id: string; title: string }> {
  const all: Array<{ id: string; title: string }> = [];
  let cursor: string | undefined;
  while (all.length < maxProducts) {
    const { products, pagination } = ucpSearch(query, cursor);
    if (products.length === 0) break;
    all.push(...products);
    if (!pagination.has_next_page) break;
    cursor = pagination.cursor;
  }
  return all.slice(0, maxProducts);
}

// Products from authenticated pass that appeared in LLM results
// These are from merchants NOT in our scan set
const candidateProducts = [
  // From ChatGPT results
  { merchant: "carparts.com", product: "SureStop Front & Rear Brake Pad Set", query: "SureStop Front Rear Brake Pad Set Honda Civic" },
  { merchant: "sbxperformance.com", product: "FL5 Civic Type R Intake Guide", query: "FL5 Civic Type R cold air intake guide" },
  { merchant: "kamispeed.com", product: "BC Racing BR Coilovers 2009-2011 Acura TL", query: "BC Racing BR coilovers 2009 2011 Acura TL" },
  { merchant: "nextgentuning.com", product: "BC Racing BR Series Coilovers Q-04-BR", query: "BC Racing BR Series coilovers Q-04-BR" },
  { merchant: "wayside-performance.co.uk", product: "Airtec Motorsport De-Cat Downpipe Honda Civic FK8", query: "Airtec Motorsport downpipe Honda Civic FK8 Type R" },
  { merchant: "nforcd.com", product: "Airtec Motorsport Downpipe Honda Civic Type R FK8", query: "Airtec Motorsport downpipe Honda Civic Type R FK8" },
  // From Copilot results
  { merchant: "hpsperformanceproducts.com", product: "HPS Performance Cold Air Intake Kit Honda Civic Type R FL5", query: "HPS Performance cold air intake Honda Civic Type R FL5 K20C1" },
  { merchant: "evasivemotorsports.com", product: "aFe Takeda Momentum Cold Air Intake Honda Civic Type R FL5", query: "aFe Takeda Momentum cold air intake Honda Civic Type R FL5" },
  { merchant: "fitmentindustries.com", product: "BC Racing BR Series Coilovers B5", query: "BC Racing BR Series coilovers B5" },
  { merchant: "autobarn.net", product: "Invidia 76mm Downpipe Honda Civic Type R FK8", query: "Invidia 76mm downpipe Honda Civic Type R FK8" },
  // From Google AI results
  { merchant: "twostepperformance.com", product: "27Won Hybrid Cold Air Intake 2023 Civic Type R FL5", query: "27Won hybrid cold air intake 2023 Honda Civic Type R FL5" },
  { merchant: "turbokits.com", product: "Amraspeed Carbon Fiber Cold Air Intake 2023 Civic Type R FL5", query: "Amraspeed carbon fiber cold air intake 2023 Civic Type R FL5" },
  { merchant: "hybrid-racing.com", product: "BC Racing BR Series Coilovers 09-14 Acura TL", query: "BC Racing BR Series coilovers 09-14 Acura TL" },
  { merchant: "bcracing-na.com", product: "09-14 Acura TL FWD/AWD BC Racing Coilovers", query: "BC Racing coilovers 09-14 Acura TL FWD AWD" },
  { merchant: "hardmotion.com", product: "PLM 2017-2021 Civic Type R Downpipe Front Pipe Combo V2 FK8", query: "PLM downpipe front pipe combo 2017-2021 Civic Type R FK8" },
  { merchant: "parachutehome.com", product: "Linen Sheet Set Bone", query: "Parachute linen sheet set bone" },
  { merchant: "coyuchi.com", product: "Organic Relaxed Linen Sheet Set Doe", query: "Coyuchi organic relaxed linen sheet set doe" },
  { merchant: "linoto.com", product: "Organic Natural Linen Sheet Set Custom Sizes", query: "Linoto organic natural linen sheet set" },
];

async function main() {
  console.log("=== U-9 Set B Assembly ===\n");
  console.log(`Checking ${candidateProducts.length} candidate products...\n`);

  const setB: Array<{
    merchant: string;
    product: string;
    catalogQuery: string;
    catalogFound: boolean;
    catalogRank: number | null;
    catalogTotal: number;
    shopAppPresent: boolean;
    shopAppSeller: string;
  }> = [];

  for (const c of candidateProducts) {
    console.log(`Checking: ${c.merchant} — ${c.product.substring(0, 50)}...`);

    // Check Catalog API
    const catalogProducts = searchCatalogAll(c.query, 300);
    const catalogFound = catalogProducts.length > 0;
    const catalogRank = catalogFound ? 1 : null;

    console.log(`  Catalog: ${catalogProducts.length} products (found: ${catalogFound})`);

    if (!catalogFound) {
      // Absent from Catalog — potential Set B candidate
      // We need to verify it's on shop.app under this merchant
      // For now, mark as candidate — the shop.app seller check will be done via browser
      setB.push({
        merchant: c.merchant,
        product: c.product,
        catalogQuery: c.query,
        catalogFound: false,
        catalogRank: null,
        catalogTotal: 0,
        shopAppPresent: false, // to be verified
        shopAppSeller: "", // to be verified
      });
      console.log(`  → Set B candidate (absent from Catalog)`);
    } else {
      console.log(`  → Present in Catalog, not Set B material`);
    }
  }

  console.log(`\n=== Set B candidates: ${setB.length} ===`);
  for (const s of setB) {
    console.log(`  ${s.merchant}: ${s.product.substring(0, 50)}`);
  }

  // Also assemble Set A from existing data
  const u8aData = JSON.parse(fs.readFileSync("scripts/output/u8a-refined-results.json", "utf8"));
  const realQuery1 = u8aData.realQueries[0]; // "brake pads for 2018 Honda Civic Si"
  const setA = realQuery1.rawTitles[0].slice(0, 12).map((title: string, i: number) => ({
    rank: i + 1,
    title,
    id: realQuery1.rawIds[0][i],
    query: realQuery1.query,
  }));

  console.log(`\n=== Set A (deterministic top-12 from "brake pads for 2018 Honda Civic Si") ===`);
  for (const s of setA) {
    console.log(`  Rank ${s.rank}: ${s.title.substring(0, 60)}`);
  }

  // Save
  const output = {
    timestamp: new Date().toISOString(),
    directive: "DIRECTIVE-12 §4",
    setA: setA,
    setBCandidates: setB,
    setBCount: setB.length,
    setBAssemblable: setB.length >= 10,
    note: setB.length < 10 ? `Only ${setB.length} Set B candidates found — need ${10 - setB.length} more. shop.app seller verification pending.` : "Set B can be assembled (pending shop.app seller verification).",
  };

  fs.writeFileSync("scripts/output/u9-set-assembly.json", JSON.stringify(output, null, 2));
  console.log(`\nResults saved to scripts/output/u9-set-assembly.json`);
  console.log(`\nVerdict: ${setB.length >= 10 ? "Set B assemblable" : `Set B NOT assemblable (${setB.length}/10) — INCONCLUSIVE per decision rule`}`);
}

main().catch(console.error);
