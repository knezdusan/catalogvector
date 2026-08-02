/**
 * DIRECTIVE-7 §6b — Identical-part audit for the 3 absolutely invisible targets
 *
 * Stage 2 found 3 targets absent from all 18 queries:
 * 1. paragon-pbp370 — "Paragon PBP370 Front Brake Pads"
 * 2. icon-stage-4 — "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD"
 * 3. br-series-coilovers — "BR Series Coilovers for 2016-2021 Honda Civic Non-Si"
 *
 * This script queries the Catalog for each part using natural language
 * queries that should surface them, and checks:
 * - Does TSP appear at any depth?
 * - Do other merchants carrying the same part appear?
 * - If TSP is absent but others are present → structural invisibility confirmed
 */

import { mkdir, writeFile } from "node:fs/promises";
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

// The 3 absolutely invisible targets, each with multiple query phrasings
const AUDIT_TARGETS: Array<{
  id: string;
  targetHandle: string;
  targetTitle: string;
  brand: string;
  sku: string;
  vehicle: string;
  queries: string[];
}> = [
  {
    id: "IV01",
    targetHandle:
      "br-series-coilovers-for-2016-honda-civic-non-si-1-5t-coupe-sedan",
    targetTitle:
      "BR Series Coilovers for 2016-2021 Honda Civic Non-Si Coupe / Sedan",
    brand: "BC Racing",
    sku: "A-154-BR",
    vehicle: "2016-2021 Honda Civic Non-Si",
    queries: [
      "BC Racing BR Series Coilovers Honda Civic 2016-2021",
      "BC Racing coilovers Honda Civic Non-Si A-154-BR",
      "BR Series Coilovers for 2016 Honda Civic",
      "coilovers for 2017 Honda Civic",
      "BC Racing A-154-BR",
    ],
  },
  {
    id: "IV02",
    targetHandle:
      "icon-stage-4-w-billet-uca-suspension-kit-for-2021-2025-ford-f-150-4wd",
    targetTitle: "ICON Stage 4 Lift Kit CDCV for 2021-2024 Ford F-150 4WD",
    brand: "ICON",
    sku: "ICON Stage 4",
    vehicle: "2021-2024 Ford F-150 4WD",
    queries: [
      "ICON Stage 4 lift kit Ford F-150 2021-2024",
      "ICON Stage 4 CDCV F-150 4WD",
      "lift kit for 2023 Ford F-150",
      "ICON suspension kit Ford F-150 4WD",
    ],
  },
  {
    id: "IV03",
    targetHandle: "paragon-pbp370-brake-pads",
    targetTitle: "Paragon PBP370 Front Brake Pads",
    brand: "Paragon",
    sku: "PBP370",
    vehicle: "2017-2020 Honda Civic Si (inferred)",
    queries: [
      "Paragon PBP370 brake pads",
      "Paragon front brake pads Honda Civic Si",
      "brake pads for 2018 Honda Civic Si",
      "Paragon PBP370",
    ],
  },
];

async function main() {
  console.log(
    "\nDIRECTIVE-7 §6b — IDENTICAL-PART AUDIT (3 ABSOLUTELY INVISIBLE TARGETS)",
  );
  console.log("═".repeat(66));
  console.log();

  const token = await getAccessToken();
  const transcript: unknown[] = [];
  const results: Array<{
    targetId: string;
    targetHandle: string;
    targetTitle: string;
    brand: string;
    sku: string;
    queryResults: Array<{
      query: string;
      totalCount: number | null;
      totalScanned: number;
      tspPresent: boolean;
      tspRank: number | null;
      sameBrandOtherMerchants: Array<{
        domain: string;
        rank: number;
        title: string;
      }>;
    }>;
  }> = [];

  for (const target of AUDIT_TARGETS) {
    console.log(
      `\n  ${target.id}: ${target.brand} — ${target.targetTitle.slice(0, 50)}`,
    );
    console.log(`    Handle: ${target.targetHandle}`);
    console.log(`    SKU: ${target.sku}`);

    const queryResults: Array<{
      query: string;
      totalCount: number | null;
      totalScanned: number;
      tspPresent: boolean;
      tspRank: number | null;
      sameBrandOtherMerchants: Array<{
        domain: string;
        rank: number;
        title: string;
      }>;
    }> = [];

    for (const query of target.queries) {
      console.log(`\n    Query: "${query}"`);

      let cursor: string | null = null;
      let pageNum = 0;
      let totalScanned = 0;
      let totalCount: number | null = null;
      let tspPresent = false;
      let tspRank: number | null = null;
      const sameBrandOthers: Array<{
        domain: string;
        rank: number;
        title: string;
      }> = [];

      while (totalScanned < MAX_DEPTH) {
        const page = await issueQueryPage(token, query, cursor);
        pageNum++;
        if (totalCount === null) totalCount = page.totalCount;

        for (let i = 0; i < page.products.length; i++) {
          const rank = totalScanned + i + 1;
          const p = page.products[i];
          const h = handleOf(p);
          const d = sellerDomain(p);

          if (h === target.targetHandle) {
            tspPresent = true;
            tspRank = rank;
          }

          // Check if this is the same brand (not TSP)
          if (!d.includes("twostep")) {
            const titleLower = p.title.toLowerCase();
            const brandLower = target.brand.toLowerCase();
            if (
              titleLower.includes(brandLower) ||
              titleLower.includes(target.sku.toLowerCase())
            ) {
              sameBrandOthers.push({
                domain: d,
                rank,
                title: p.title.slice(0, 60),
              });
            }
          }
        }

        totalScanned += page.products.length;
        transcript.push({
          step: "page",
          targetId: target.id,
          query,
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

      console.log(`      → ${totalScanned} scanned, total_count=${totalCount}`);
      console.log(
        `      TSP present: ${tspPresent ? `YES (rank ${tspRank})` : "NO"}`,
      );
      console.log(
        `      Same-brand other merchants: ${sameBrandOthers.length}`,
      );
      if (sameBrandOthers.length > 0 && !tspPresent) {
        console.log(
          `      *** STRUCTURAL INVISIBILITY: TSP absent, ${sameBrandOthers.length} same-brand listings from other merchants present ***`,
        );
      }

      queryResults.push({
        query,
        totalCount,
        totalScanned,
        tspPresent,
        tspRank,
        sameBrandOtherMerchants: sameBrandOthers.slice(0, 10),
      });
    }

    results.push({
      targetId: target.id,
      targetHandle: target.targetHandle,
      targetTitle: target.targetTitle,
      brand: target.brand,
      sku: target.sku,
      queryResults,
    });
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  console.log(
    "\n\n══════════════════════════════════════════════════════════════════",
  );
  console.log("INVISIBLE TARGET AUDIT SUMMARY");
  console.log(
    "══════════════════════════════════════════════════════════════════",
  );

  for (const r of results) {
    console.log(
      `\n  ${r.targetId}: ${r.brand} — ${r.targetTitle.slice(0, 50)}`,
    );
    console.log(
      "| Query | total_count | TSP? | TSP rank | Same-brand others |",
    );
    console.log("|---|---|---|---|---|");
    for (const qr of r.queryResults) {
      console.log(
        `| ${qr.query.slice(0, 40)} | ${qr.totalCount ?? "—"} | ${qr.tspPresent ? "YES" : "NO"} | ${qr.tspRank ?? "—"} | ${qr.sameBrandOtherMerchants.length} |`,
      );
    }
  }

  // ─── Emit artifact ────────────────────────────────────────────────────
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outJson = join(dir, `invisible-target-audit-${stamp}.json`);
  await writeFile(
    outJson,
    JSON.stringify({ results, transcript }, null, 2),
    "utf8",
  );
  console.log(`\n  Artifacts:`);
  console.log(`    JSON: ${outJson}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
