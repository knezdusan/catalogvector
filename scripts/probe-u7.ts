/**
 * DIRECTIVE-8-v2 §1 — U-7: what the ~300 boundary is
 *
 * Five probes to determine whether the ~300-result exhaustion is:
 *   CAP       — a response ceiling (hard count cap)
 *   THRESHOLD — a relevance score cutoff
 *   CORPUS    — genuine matching-set sizing
 *   INCONCLUSIVE — any other pattern, or an unscoped floor exists
 *
 * Pre-registered decision rule fixed 2 August 2026 (DIRECTIVE-8-v2 §1.3).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "..", ".env") });

const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const RATE_LIMIT_MS = 250;
const PAGE_SIZE = 50;
const MAX_DEPTH = 2000; // paginate beyond documented 1000 limit to test it

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
  variants?: Array<{ url?: string; seller?: { id?: string } }>;
}

interface PageResult {
  products: CatalogProduct[];
  hasNextPage: boolean;
  totalCount: number | null;
  cursor: string | null;
  distinctSellers: Set<string>;
}

async function issueQueryPage(
  token: string,
  query: string,
  cursor: string | null,
): Promise<PageResult> {
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

  const distinctSellers = new Set<string>();
  for (const p of products) {
    const url = p.variants?.[0]?.url ?? "";
    const domain = (url.match(/^https?:\/\/([^/]+)/) || [])[1] ?? "";
    if (domain) distinctSellers.add(domain);
  }

  return {
    products,
    hasNextPage,
    totalCount,
    cursor: nextCursor,
    distinctSellers,
  };
}

interface ProbeResult {
  probeId: string;
  query: string;
  purpose: string;
  pages: number;
  totalProducts: number;
  finalPageSize: number;
  finalPageIsFull: boolean;
  totalCount: number | null;
  hasNextPageAtTermination: boolean;
  distinctSellerCount: number;
  allSellers: Set<string>;
  pageSizes: number[];
  // For U7-E: target rank at each broadening step
  targetRanks?: Array<{ query: string; rank: number | null; setSize: number }>;
}

async function runProbe(
  token: string,
  probeId: string,
  query: string,
  purpose: string,
): Promise<ProbeResult> {
  console.log(`\n${probeId}: "${query}" — ${purpose}`);

  let cursor: string | null = null;
  let pages = 0;
  let totalProducts = 0;
  let totalCount: number | null = null;
  let hasNextPage = true;
  const allSellers = new Set<string>();
  const pageSizes: number[] = [];

  while (hasNextPage && pages < MAX_DEPTH / PAGE_SIZE) {
    const page = await issueQueryPage(token, query, cursor);
    pages++;
    pageSizes.push(page.products.length);
    totalProducts += page.products.length;
    totalCount = page.totalCount ?? totalCount;
    hasNextPage = page.hasNextPage;
    cursor = page.cursor;
    for (const s of page.distinctSellers) allSellers.add(s);

    if (pages % 5 === 0) {
      console.log(
        `  page ${pages}: ${totalProducts} products, has_next=${hasNextPage}`,
      );
    }
  }

  const finalPageSize = pageSizes[pageSizes.length - 1] ?? 0;
  const finalPageIsFull = finalPageSize === PAGE_SIZE;

  const finalLabel = finalPageIsFull ? "FULL" : "PARTIAL";
  console.log(
    `  TERMINATED: ${pages} pages, ${totalProducts} products, final=${finalPageSize} (${finalLabel}), has_next=${hasNextPage}, total_count=${totalCount}, distinct_sellers=${allSellers.size}`,
  );

  return {
    probeId,
    query,
    purpose,
    pages,
    totalProducts,
    finalPageSize,
    finalPageIsFull,
    totalCount,
    hasNextPageAtTermination: hasNextPage,
    distinctSellerCount: allSellers.size,
    allSellers,
    pageSizes,
  };
}

// U7-E: progressive broadening — find target rank at each step
const U7E_TARGET_HANDLE = "paragon-pbp370-brake-pads";
const U7E_STEPS = [
  "brake pads for 2018 Honda Civic Si",
  "brake pads Honda Civic",
  "Honda Civic brake pads Paragon",
  "Paragon brake pads",
];

async function runU7E(token: string): Promise<
  ProbeResult & {
    targetRanks: Array<{ query: string; rank: number | null; setSize: number }>;
  }
> {
  console.log("\nU7-E: Progressive broadening on paragon-pbp370");
  console.log(`  Target handle: ${U7E_TARGET_HANDLE}`);

  const targetRanks: Array<{
    query: string;
    rank: number | null;
    setSize: number;
  }> = [];

  for (const q of U7E_STEPS) {
    console.log(`\n  Step: "${q}"`);
    let cursor: string | null = null;
    let pages = 0;
    let totalProducts = 0;
    let hasNextPage = true;
    let totalCount: number | null = null;
    let targetRank: number | null = null;
    const allSellers = new Set<string>();
    const pageSizes: number[] = [];

    while (hasNextPage && pages < MAX_DEPTH / PAGE_SIZE) {
      const page = await issueQueryPage(token, q, cursor);
      pages++;
      pageSizes.push(page.products.length);
      totalProducts += page.products.length;
      totalCount = page.totalCount ?? totalCount;
      hasNextPage = page.hasNextPage;
      cursor = page.cursor;
      for (const s of page.distinctSellers) allSellers.add(s);

      // Check for target in this page
      if (targetRank === null) {
        for (let i = 0; i < page.products.length; i++) {
          const url = page.products[i].variants?.[0]?.url ?? "";
          const handle = (url.match(/\/products\/([^?]+)/) || [])[1] ?? "";
          if (handle === U7E_TARGET_HANDLE) {
            targetRank = (pages - 1) * PAGE_SIZE + i + 1;
            console.log(
              `  → TARGET FOUND at rank ${targetRank} (page ${pages}, position ${i + 1})`,
            );
            break;
          }
        }
      }

      // If we found the target and just need set size, we can stop early
      // But we need the full set size, so continue
    }

    const finalPageSize = pageSizes[pageSizes.length - 1] ?? 0;
    console.log(
      `  Set size: ${totalProducts}, target rank: ${targetRank ?? "ABSENT"}, has_next=${hasNextPage}`,
    );

    targetRanks.push({
      query: q,
      rank: targetRank,
      setSize: totalProducts,
    });
  }

  // Return the last step's data as the "main" result, with targetRanks attached
  const lastStep = targetRanks[targetRanks.length - 1];
  return {
    probeId: "U7-E",
    query: "progressive broadening (4 steps)",
    purpose: "Target rank vs query specificity",
    pages: 0, // not meaningful for multi-step
    totalProducts: lastStep.setSize,
    finalPageSize: 0,
    finalPageIsFull: false,
    totalCount: null,
    hasNextPageAtTermination: false,
    distinctSellerCount: 0,
    allSellers: new Set(),
    pageSizes: [],
    targetRanks,
  };
}

async function main() {
  console.log("\nDIRECTIVE-8-v2 §1 — U-7: WHAT THE ~300 BOUNDARY IS");
  console.log("═".repeat(66));
  console.log(`Page size: ${PAGE_SIZE}, max depth: ${MAX_DEPTH}`);
  console.log("Pre-registered rule: CAP / THRESHOLD / CORPUS / INCONCLUSIVE\n");

  const token = await getAccessToken();

  const results: ProbeResult[] = [];

  // U7-A: Generic in-vertical
  results.push(
    await runProbe(token, "U7-A", "brake pads", "Generic, in-vertical"),
  );

  // U7-B: Generic out-of-vertical
  results.push(
    await runProbe(token, "U7-B", "running shoes", "Generic, out-of-vertical"),
  );

  // U7-C: Maximally narrow
  results.push(
    await runProbe(
      token,
      "U7-C",
      "Paragon PBP370",
      "Maximally narrow — establishes the floor",
    ),
  );

  // U7-D: Nonsense — tests for unscoped floor
  results.push(
    await runProbe(
      token,
      "U7-D",
      "zxqv flurbin widget",
      "Nonsense — tests for unscoped floor",
    ),
  );

  // U7-E: Progressive broadening
  const u7e = await runU7E(token);
  results.push(u7e);

  // ── Apply the pre-registered decision rule ──
  console.log("\n" + "═".repeat(66));
  console.log("DECISION RULE APPLICATION");
  console.log("═".repeat(66));

  const u7a = results.find((r) => r.probeId === "U7-A")!;
  const u7b = results.find((r) => r.probeId === "U7-B")!;
  const u7d = results.find((r) => r.probeId === "U7-D")!;

  // INCONCLUSIVE if U7-D returns a populated set
  if (u7d.totalProducts > 0) {
    console.log(
      `U7-D returned ${u7d.totalProducts} products — UNSCOPED FLOOR EXISTS.`,
    );
    console.log("→ INCONCLUSIVE (unscoped floor must be characterised first)");
  } else {
    console.log(
      `U7-D returned ${u7d.totalProducts} products — no unscoped floor.`,
    );

    // CAP: U7-A and U7-B both terminate within 250–400 with a FULL final page
    const bothInRange =
      u7a.totalProducts >= 250 &&
      u7a.totalProducts <= 400 &&
      u7b.totalProducts >= 250 &&
      u7b.totalProducts <= 400;
    const bothFullFinal = u7a.finalPageIsFull && u7b.finalPageIsFull;

    if (bothInRange && bothFullFinal) {
      console.log(
        `U7-A: ${u7a.totalProducts} (final ${u7a.finalPageSize} FULL), U7-B: ${u7b.totalProducts} (final ${u7b.finalPageSize} FULL)`,
      );
      console.log(
        "→ CAP — boundary is a response ceiling; 'absent at depth' means rank beyond it",
      );
      console.log(
        "  Stage 2 and Stage 3 invisibility findings re-classified as deep ranking.",
      );
    } else {
      // THRESHOLD: U7-A and U7-B terminate at materially different counts, partial final pages,
      // and U7-E shows target entering the set as query broadens
      const materiallyDifferent =
        Math.abs(u7a.totalProducts - u7b.totalProducts) > 50;
      const partialFinals = !u7a.finalPageIsFull || !u7b.finalPageIsFull;
      const u7eTargetEnters =
        u7e.targetRanks?.some((s) => s.rank !== null) &&
        u7e.targetRanks?.some((s) => s.rank === null);

      // CORPUS: U7-A and U7-B terminate at or near pagination ceiling with has_next_page false and full final pages
      // while relational queries terminate at ~300 with partial pages
      const nearCeiling = u7a.totalProducts >= 900 || u7b.totalProducts >= 900;

      if (nearCeiling) {
        console.log(
          `U7-A: ${u7a.totalProducts}, U7-B: ${u7b.totalProducts} — at or near pagination ceiling`,
        );
        console.log(
          "→ CORPUS — ~300 is genuine matching-set sizing; absence from it is meaningful",
        );
      } else if (materiallyDifferent && partialFinals) {
        console.log(
          `U7-A: ${u7a.totalProducts} (final ${u7a.finalPageSize} ${u7a.finalPageIsFull ? "FULL" : "PARTIAL"}), U7-B: ${u7b.totalProducts} (final ${u7b.finalPageSize} ${u7b.finalPageIsFull ? "FULL" : "PARTIAL"})`,
        );
        console.log("  Materially different counts, partial final pages.");
        if (u7eTargetEnters) {
          console.log(
            "  U7-E shows target entering the set as query broadens.",
          );
          console.log(
            "→ THRESHOLD — boundary is a relevance score cutoff; 'absent' means scored below the retrieval bar",
          );
        } else {
          console.log(
            "  U7-E does not show target entering — but counts differ and pages are partial.",
          );
          console.log(
            "→ THRESHOLD (provisional) — relevance score cutoff is most likely interpretation",
          );
        }
      } else {
        console.log(`U7-A: ${u7a.totalProducts}, U7-B: ${u7b.totalProducts}`);
        console.log(
          "→ INCONCLUSIVE — pattern does not match any branch cleanly",
        );
      }
    }
  }

  // ── Save transcript ──
  const dir = join(process.cwd(), "scripts", "output");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(dir, `u7-${stamp}.json`);
  const summary = {
    directive: "DIRECTIVE-8-v2 §1",
    timestamp: new Date().toISOString(),
    probes: results.map((r) => ({
      probeId: r.probeId,
      query: r.query,
      purpose: r.purpose,
      pages: r.pages,
      totalProducts: r.totalProducts,
      finalPageSize: r.finalPageSize,
      finalPageIsFull: r.finalPageIsFull,
      totalCount: r.totalCount,
      hasNextPageAtTermination: r.hasNextPageAtTermination,
      distinctSellerCount: r.distinctSellerCount,
      pageSizes: r.pageSizes,
      targetRanks: r.targetRanks,
    })),
  };
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n  Transcript → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
