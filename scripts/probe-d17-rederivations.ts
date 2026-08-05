/**
 * DIRECTIVE-17 §3: Re-derive rank-based absence through the enumeration.
 *
 * The following were declared absent or invisible by rank-based retrieval:
 * - 3 "absolutely invisible" targets (invisible-target-audit)
 * - 10 "absent at depth" targets (depth1000)
 * - Subimods' 0/10 store-level invisibility
 *
 * These are re-derivations, not new tests. The enumeration result stands
 * where it disagrees with the earlier rank-based verdict.
 */

import fs from "node:fs";

// Load the enumeration handles (Subimods)
const enumData = JSON.parse(fs.readFileSync("scripts/output/d17-enumeration-handles.json", "utf8"));
const enumHandles = new Set(enumData.handles as string[]);

console.log(`Enumeration handles (Subimods): ${enumHandles.size}`);

// ─── 1. The 3 "absolutely invisible" targets ───────────────────────────────

console.log("\n=== §3.1 THREE ABSOLUTELY INVISIBLE TARGETS ===\n");

const invisibleAudit = JSON.parse(
  fs.readFileSync("scripts/output/invisible-target-audit-2026-08-02T20-54-17-635Z.json", "utf8"),
);

for (const r of invisibleAudit.results) {
  const handle = r.targetHandle;
  const inEnum = enumHandles.has(handle);
  console.log(`${r.targetId}: ${handle}`);
  console.log(`  Title: ${r.targetTitle}`);
  console.log(`  Brand: ${r.brand}, SKU: ${r.sku}`);
  console.log(`  Rank-based verdict: ABSOLUTELY INVISIBLE`);
  console.log(`  Enumeration verdict: ${inEnum ? "PRESENT" : "ABSENT"}`);
  console.log(`  ${inEnum ? "→ DISAGREES — rank-based verdict WITHDRAWN, product IS in Catalog" : "→ AGREES — product is absent from Catalog"}`);
  console.log();
}

// ─── 2. The 10 "absent at depth" targets ───────────────────────────────────

console.log("=== §3.2 TEN ABSENT-AT-DEPTH TARGETS ===\n");

const depth1000 = JSON.parse(
  fs.readFileSync("scripts/output/depth1000-2026-08-02T20-32-02-308Z.json", "utf8"),
);

const absentTargets: Array<{
  queryId: string;
  targetId: string;
  handle: string;
  population: string;
  rankBasedVerdict: string;
  enumVerdict: string;
  agrees: boolean;
}> = [];

for (const r of depth1000.results) {
  for (const t of r.targets) {
    if (t.depthCategory === "absent_at_depth") {
      const inEnum = enumHandles.has(t.handle);
      const agrees = !inEnum; // agrees if both say absent
      absentTargets.push({
        queryId: r.queryId,
        targetId: t.targetId,
        handle: t.handle,
        population: t.population,
        rankBasedVerdict: "absent_at_depth_1000",
        enumVerdict: inEnum ? "PRESENT" : "ABSENT",
        agrees,
      });
      console.log(`${r.queryId} ${t.targetId}: ${t.handle}`);
      console.log(`  Population: ${t.population}`);
      console.log(`  Rank-based verdict: ABSENT AT DEPTH 1000`);
      console.log(`  Enumeration verdict: ${inEnum ? "PRESENT" : "ABSENT"}`);
      console.log(`  ${inEnum ? "→ DISAGREES — rank-based verdict WITHDRAWN, product IS in Catalog" : "→ AGREES — product is absent from Catalog"}`);
      console.log();
    }
  }
}

// ─── 3. Subimods' 0/10 store-level invisibility ────────────────────────────

console.log("=== §3.3 SUBIMODS 0/10 STORE-LEVEL INVISIBILITY ===\n");

// The original finding was that 0 of 10 Subimods products appeared in
// unscoped (all-store) search results. This was measured by ranked retrieval.
// We need to find the 10 products and check them against the enumeration.

// The 10 products were from the query set's Subimods targets
// Let's find them in the depth1000 data
const subimodsTargets = new Map<string, { handle: string; population: string; depthCategory: string; present: boolean; rank: number | null }>();
for (const r of depth1000.results) {
  for (const t of r.targets) {
    // All targets in this query set are Subimods products (the query set was
    // built from Subimods' /products.json)
    if (!subimodsTargets.has(t.handle)) {
      subimodsTargets.set(t.handle, {
        handle: t.handle,
        population: t.population,
        depthCategory: t.depthCategory,
        present: t.present,
        rank: t.rank,
      });
    }
  }
}

console.log(`Total unique Subimods targets in depth-1000 query set: ${subimodsTargets.size}`);

// The "0/10 store-level invisibility" finding was about unscoped search —
// 0 of 10 Subimods products appeared in unscoped results.
// The depth-1000 run was unscoped, so "present" means found in unscoped search.
// Let's check how many were found at all
const found = [...subimodsTargets.values()].filter((t) => t.present);
const notFound = [...subimodsTargets.values()].filter((t) => !t.present);

console.log(`Found in unscoped depth-1000 search: ${found.length}/${subimodsTargets.size}`);
console.log(`Not found: ${notFound.length}/${subimodsTargets.size}`);

// Now check against enumeration (scoped to Subimods)
let enumFound = 0;
let enumNotFound = 0;
const enumResults: Array<{ handle: string; rankBased: string; enumVerdict: string }> = [];

for (const t of subimodsTargets.values()) {
  const inEnum = enumHandles.has(t.handle);
  if (inEnum) enumFound++;
  else enumNotFound++;
  enumResults.push({
    handle: t.handle,
    rankBased: t.present ? `present@${t.depthCategory}` : "absent_at_depth",
    enumVerdict: inEnum ? "PRESENT" : "ABSENT",
  });
}

console.log(`\nEnumeration verdict (scoped to Subimods):`);
console.log(`  Present in enumeration: ${enumFound}/${subimodsTargets.size}`);
console.log(`  Absent from enumeration: ${enumNotFound}/${subimodsTargets.size}`);

// The 0/10 finding: how many of the 10 "absent at depth" targets are in the enumeration?
const absentAtDepth = [...subimodsTargets.values()].filter((t) => !t.present);
let absentInEnum = 0;
let absentNotInEnum = 0;
for (const t of absentAtDepth) {
  if (enumHandles.has(t.handle)) absentInEnum++;
  else absentNotInEnum++;
}

console.log(`\nOf ${absentAtDepth.length} products "absent at depth" (rank-based):`);
console.log(`  Present in enumeration: ${absentInEnum}`);
console.log(`  Absent from enumeration: ${absentNotInEnum}`);

if (absentInEnum > 0) {
  console.log(`\n→ The "0/10 store-level invisibility" finding is WITHDRAWN for ${absentInEnum} products.`);
  console.log(`  These products ARE in the Catalog (found by scoped enumeration) but were NOT found by unscoped ranked retrieval.`);
  console.log(`  This is consistent with §2: ranked retrieval is truncated by budget, not by absence.`);
}

// List all targets with both verdicts
console.log(`\nFull comparison:`);
console.log(`Handle | Rank-based | Enumeration | Agreement`);
for (const r of enumResults) {
  const agrees = (r.rankBased.includes("present") && r.enumVerdict === "PRESENT") ||
    (r.rankBased.includes("absent") && r.enumVerdict === "ABSENT");
  console.log(`  ${r.handle.substring(0, 50)} | ${r.rankBased} | ${r.enumVerdict} | ${agrees ? "AGREE" : "DISAGREE"}`);
}

// Save
fs.writeFileSync("scripts/output/d17-rederivations.json", JSON.stringify({
  absolutelyInvisible: invisibleAudit.results.map((r: any) => ({
    targetId: r.targetId,
    handle: r.targetHandle,
    title: r.targetTitle,
    rankBasedVerdict: "absolutely_invisible",
    enumVerdict: enumHandles.has(r.targetHandle) ? "PRESENT" : "ABSENT",
    agrees: !enumHandles.has(r.targetHandle),
  })),
  absentAtDepth: absentTargets,
  subimodsInvisibility: {
    totalTargets: subimodsTargets.size,
    rankBasedFound: found.length,
    rankBasedAbsent: notFound.length,
    enumPresent: enumFound,
    enumAbsent: enumNotFound,
    absentAtDepthInEnum: absentInEnum,
    absentAtDepthNotInEnum: absentNotInEnum,
    perTarget: enumResults,
  },
  timestamp: new Date().toISOString(),
}, null, 2));

console.log(`\nSaved to scripts/output/d17-rederivations.json`);
