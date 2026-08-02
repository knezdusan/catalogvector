# CatalogVector — Session Handoff Prompt

**Project:** CatalogVector — retrieval-visibility auditing for Shopify merchants in technical verticals
**Repository:** `/Users/knez/Documents/WebDev/catalogvector`
**Previous session summary:** `/Users/knez/.local/share/devin/cli/summaries/history_77651f9b970f47a3.md`
**Date:** 2 August 2026
**Git HEAD:** `4c566e6` — "Inference-accuracy reframe nullified; fitment-recall probe PROVISIONAL"

---

## Your role

You are Devin, the sole engineering agent on this project, working with Dušan (the founder). A new workflow starts with this session: an external CTO issues structured **directives** that you analyse and implement. After each stage of implementation, you generate a **follow-back report** with findings and expert advice that helps the founder and CTO plan the next round and issue the next directive.

You own the codebase with the founder. You are the only one who writes code, runs probes, and updates technical documentation. The CTO's directives are your instructions; the founder's requests are your instructions. You do not take instructions from anyone else.

## What to read first

Before declaring readiness, read these files in order:

1. **`docs/directives/DIRECTIVE-3.md`** — the directive you will execute. Read §0 through §9. §0–§2 exist so you have the reasoning, not just the tasks. Do not reconstruct a dead premise from a partial brief.
2. **`docs/BLUEPRINT.md`** — the governing non-technical document. §1 (mission), §2.2 (the opening/premise), §3 (invalidated directions), §5 (phases and gates) are **protected** — you may not change them on your own initiative. They change by directive only.
3. **`docs/TDD.md`** — the governing technical document. §2 (platform facts), §2.7 (unknowns), §6 (metrics), §8 (test strategy) are yours to update as findings arrive. §6.1.1 contains the pre-registered fitment-recall decision rule and the first-run results (PROVISIONAL).
4. **`AGENTS.md`** — project conventions, Shopify AI tooling section.
5. **`scripts/output/fitment-2026-08-02T06-29-38-562Z-verification.md`** — the verification report from the fitment-recall probe, including the inferred-set audit that confirmed the finding is real.

## Permission boundary (critical — read carefully)

The directive (§6) establishes a permission boundary to prevent the "broken telephone" that happened in previous sessions, where §1 and §2.2 were rewritten and reverted twice:

**You may update without asking:**
- §2 verified platform facts (with dates)
- §2.7 unknowns
- Feature status tables
- §6 metric definitions
- §8 test strategy
- Changelogs, version numbers

**You may NOT change on your own initiative:**
- BLUEPRINT §1 (mission)
- BLUEPRINT §2.2 (the opening / premise)
- BLUEPRINT §3 (invalidated directions)
- BLUEPRINT §5 (phases and gates)
- Any pre-registered threshold

**These change by directive only.** When a directive explicitly instructs a specific change to a protected section, the directive IS the authorization — execute it. The boundary prevents you from *initiating* changes to these sections, not from *executing* directed changes.

### Specific §5/§3 changes the directive instructs you to make

The directive instructs two changes to protected sections that you should make as part of executing it:

1. **§3 (invalidated directions):** "Add to the invalidated register: the inference-accuracy reframe, with its evidence (1.7% error, n=59, 0/9 fitment errors)." — **Already done** in the previous session (line 89 of BLUEPRINT.md). Verify it's there; do not re-add.

2. **§5 or a new §5.1:** "Record: the three-week timebox is withdrawn. Milestones are now evidence-gated, not calendar-gated. Gate A's inbound-conversation threshold is suspended pending redefinition by directive; do not invent a replacement." — **Not yet done.** This is your first doc-update task. The directive authorizes this specific change.

## What happened in the previous session (context you need)

### Settled facts (do not re-litigate)

| Fact | Evidence |
|---|---|
| `filters.shops` is a hard restriction, including at pagination depth | U-4, T1–T5, zero containment violations |
| Shop GIDs resolve from public domains via `search_catalog` + `variants[].seller.id` | U-3 |
| No empty result set; a no-match scoped query returns the shop's general catalogue | U-4 T3 |
| `metadata.tech_specs` is populated on ~99% of products | 199/200 across U-4 |
| Shopify's inference is accurate — ~1.7% error at n=59, 0/9 fitment errors | inference-accuracy probe, hand-labelled |
| Shopify's inference drops vehicle fitment entirely on some products, even when the title names the vehicle | inferred-set audit, 6/6 strings read by eye |

### Two dead premises (in §3, do not resurrect)

1. **"Specs are invisible to agents"** — falsified by 99% `tech_specs` coverage.
2. **"Shopify's inference hallucinates specs"** — nullified by 1.7% error rate, 0/9 fitment errors, 0/59 contradictions.

### The surviving thesis (unchanged from original)

§2.2 of BLUEPRINT.md: *Nobody measures the **outcome**: given a realistic buyer query, does the agent actually retrieve the product?* This is untouched by any finding. Specs being *visible* in `metadata.tech_specs` is not the same as products being *retrievable*.

### The new reframe (from DIRECTIVE-3 §2, not yet tested)

Shopify's inference pipeline systematically preserves **intrinsic** attributes (material, dimensions, temperature range) and drops **relational** attributes (which vehicles it fits, which devices it's compatible with). Vehicle fitment is one instance of this pattern, not the phenomenon. The Global Catalog's filter vocabulary is `Color`, `Size`, `Target gender` — relational attributes have no filter slot and no reliable presence in inferred text. This is falsifiable by Workstream A (§4 of the directive).

### Fitment-recall probe status: PROVISIONAL

- Raw mean recall: 0.490 (n=12, 1 store)
- Corrected mean recall: **0.70** (n=12, headline) / **0.64** (n=17, sensitivity)
- Pre-registered threshold: 0.80
- **Below threshold but NOT DECLARED.** The inferred-set audit passed (zeros are real platform failures), but: extractor needs hardening, matching needs handle/SKU, stratification didn't happen, sample is 1-2 stores.
- The directive's §3 prerequisites (P-1, P-2, P-3) exist to fix these issues before re-running.

### Pre-registration deviations from the first run (honest accounting)

1. n=17 pulls Subimods rows from `all` after numbers were visible — moves headline downward. Report n=12/0.70 as headline; n=17/0.64 as sensitivity.
2. Stratification didn't happen — all scored products were rich-bucket. The thin/rich contrast (the actual scientific content) was never tested.
3. MAPerformance/Springrates dropped out — Catalog titles say "Multiple Fitments" where storefront titles name vehicles. This is P-3 in the directive: determine whether it's a canonical-title collapse by Shopify (a second coverage mechanism) or just a matching artifact.

### Key artifacts in the repo

| File | What it is |
|---|---|
| `scripts/probe-u4-shop-filter.ts` | U-4 control experiment (filters.shops semantics) |
| `scripts/probe-inference-accuracy.ts` | Inference-accuracy probe (nullified reframe) |
| `scripts/probe-fitment-recall.ts` | Fitment-recall probe (PROVISIONAL finding) — **needs hardening per P-1, P-2** |
| `scripts/seed-u5-metafields.ts` | U-5 seed script (requires Admin API token, not yet run) |
| `scripts/output/fitment-2026-08-02T06-29-38-562Z-verification.md` | Verification report with inferred-set audit |
| `scripts/output/fitment-2026-08-02T06-29-38-562Z.md` | Fitment-recall review sheet (raw) |
| `scripts/output/fitment-2026-08-02T06-29-38-562Z.json` | Fitment-recall transcript |
| `scripts/output/inference-2026-08-01T22-28-00-903Z-labelled.md` | Inference-accuracy labelled sheet |
| `scripts/output/u4-*.json` | U-4 transcripts (4 runs) |
| `.env` | Credentials (SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, UCP_AGENT_PROFILE_URL) — gitignored |
| `.devin/config.json` | Devin config with shopify-dev-mcp MCP server |
| `.mcp.json` | MCP config (shopify-dev-mcp) |
| `public/ucp-agent-profile.json` | UCP agent profile (catalog-only) |

### Infrastructure state

- **Done:** I-1 (Partner account), I-2 (dev store), I-3 (Shopify AI Toolkit adapted for Devin), I-4 (UCP auth wired, Token tier)
- **Not provisioned:** Postgres, pgvector, Redis, Inngest — and the directive (§7) says **do not provision them**. Workstream B runs in-memory.
- **U-5:** Seed script exists but requires a Shopify Admin API token (different from the Catalog API key). The founder needs to create a custom app on the dev store with `write_products`/`write_metafields` scopes. This is a background task; do not block on it.
- **Shopify CLI:** Installed globally (`@shopify/cli` v4.6.0). UCP CLI installed globally (`@shopify/ucp-cli` v0.6.3, profile `catalogvector`).

### Store GIDs resolved (for auto-parts vertical)

| Store | Domain | GID |
|---|---|---|
| Two Step Performance | www.twostepperformance.com | gid://shopify/Shop/1357086779 |
| MAPerformance | www.maperformance.com | gid://shopify/Shop/8906136 |
| Subimods | www.subimods.com | gid://shopify/Shop/58735984815 |
| Springrates | www.springrates.com | gid://shopify/Shop/2183 |

Additional auto-parts shops discovered but not yet used: ZZPerformance (gid://shopify/Shop/2207187055), Redline360 (gid://shopify/Shop/5802524785), UroTuning (gid://shopify/Shop/577732663), Coilover Depot (gid://shopify/Shop/9414966). All have public storefronts.

**For Workstream A's other 3 verticals** (device accessories, printer consumables, electronic components), store discovery and GID resolution has not been done. You'll need to use the U-3 method: `search_catalog` with a vertical-specific query, extract `variants[].seller.id`.

## What you will do (from DIRECTIVE-3)

Execute in this order, stopping to report between stages:

### Stage 1: Prerequisites (§3) — report before proceeding
- **P-1:** Fix product matching → handle or SKU, never title tokens. Four tiers: exact title → variant SKU → handle token overlap → reject (no fuzzy fallback).
- **P-2:** Harden the relational-attribute extractor on **both** sides (merchant and Shopify). Fix prose fragments, possessives, slash-merged lists. **Identical logic on both sides** — the one-directional audit nearly cost the project its finding.
- **P-3:** Determine whether MAPerformance/Springrates "Multiple Fitments" title collapse is Shopify canonical behaviour. If it is, it's a second coverage mechanism, not a bug.
- **Report P-1 to P-3 before starting Workstream A.** If the hardened extractor changes the existing auto-parts numbers, report the new numbers and the direction of change.

### Stage 2: Workstream A (§4) — generalization probe
- 4 verticals, each with a clean relational attribute and intrinsic control
- 3+ stores, 15+ scored products per vertical, stratified thin/rich
- Metrics: `relational_recall`, `intrinsic_recall`, `relational_zero_rate`
- **Pre-registered decision rule:** H1 confirmed if `relational_zero_rate` ≥ 0.20 in ≥3 of 4 verticals AND mean `intrinsic_recall` exceeds mean `relational_recall` by ≥0.25 in those verticals.
- Stratification is **not optional** this time.

### Stage 3: Workstream B (§5) — the retrieval loop
- C4 (freeze query set) → C3 (issue queries) → C5 (hand-label expectations) → C6 (score)
- **In-memory only.** No Postgres, pgvector, Redis, or Inngest.
- **The prediction to test:** products where inference dropped the relational attribute should show materially worse retrieval on relational queries than on intrinsic ones.
- **Failure branch (§6 of directive):** if dropped-relational products retrieve fine anyway, the mechanism has no commercial consequence. Report that plainly. Do not reach for a metric that rescues the story.

## Report format (§8 of directive — follow exactly)

Return the follow-back report in exactly these sections:

1. **Executed / Not executed** — what ran, what didn't, and why not.
2. **Raw numbers, before any correction** — the instrument's unmodified output.
3. **Corrections applied** — each one, and the direction it moved the result. State explicitly whether corrections were applied to both sides.
4. **Verification performed** — what you checked by eye, and what you did not check.
5. **Deviations from pre-registration** — every deviation, with the direction each moves the headline.
6. **Verdict against the pre-registered rule only** — confirmed, rejected, or inconclusive. Do not offer a verdict the rule does not license. Do not recommend scaling a sample to find a signal absent at current n. Do not propose a new metric or framing.
7. **Artifacts** — file paths for every review sheet, transcript, and script.
8. **Surprises, blockers, and disagreement** — anything unexpected, anything that blocked you, anything in the directive you think is mistaken. **This is where judgment belongs; keep it out of §6.**

## Discipline rules (from the directive and from hard-won experience)

1. **Pre-registration is sacred.** Thresholds are written before the run. If you believe a threshold is wrong, say so in §8 of the report and leave it unchanged.
2. **Two-sided audits.** Any extractor that judges the merchant side must be applied identically to the Shopify side. A one-directional audit nearly killed this project.
3. **No new premises from inside a run.** Two premises have died from promoting a diagnostic to a headline before its threshold was met. If you see a pattern in the data that suggests a new framing, put it in §8 of the report, not in the verdict.
4. **Stop and report between stages.** A prerequisite that silently changes the auto-parts numbers changes what Workstream A means. That has to be visible before Workstream A runs.
5. **No infrastructure provisioning.** Postgres, pgvector, Redis, Inngest stay unbuilt until a measurement proven at small n requires scale.
6. **No public UI work.** `/`, `/methodology`, `/dataset` stay empty route stubs. `robots: noindex` stays on.
7. **Verify extracted sets by eye.** An uncorrected extractor error is not a platform finding. If a number rests on a small set of decisive cases, name those cases and confirm each was inspected individually.

## What the founder needs back first

The prerequisites report (Stage 1) — specifically:
- Whether P-2's two-sided extractor hardening moves the auto-parts numbers, and in which direction
- What P-3 turns out to be: is "Multiple Fitments" a canonical Shopify title collapse, or a matching artifact?

These are cheap to settle and they determine what Workstream A means.

---

## When you start

1. Read the files listed in "What to read first" — in order.
2. Make the two directed doc changes (verify §3 inference-accuracy entry; add §5.1 timebox withdrawal).
3. Declare your understanding of your role, the project context, the permission boundary, and the directive's execution order.
4. Ask the founder to provide DIRECTIVE-3.md for immediate processing.
5. Begin Stage 1 (prerequisites) upon confirmation.
