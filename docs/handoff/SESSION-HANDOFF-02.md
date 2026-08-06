# CatalogVector — Session Handoff

**Generated:** 4 August 2026, end of DIRECTIVE-17 session
**Governing docs version:** BLUEPRINT.md v1.0.0, TDD.md v1.0.0 (both committed and pushed at `6547572`)
**Next session starts from:** clean state, awaiting next directive from the user

---

## 0. The workflow you are inheriting

This project runs on a **directive-driven orchestration** between the user (advisor) and the Devin agent. The cycle is:

1. **User issues a directive** (`docs/directives/DIRECTIVE-N.md`). Directives are binding instructions — they contain pre-registered decision rules, task specifications, and claim boundaries that cannot be deviated from without explicit authorization.
2. **Devin executes the directive** — runs probes, writes scripts, collects data, produces reports in `docs/reports/`.
3. **Devin updates the governing documents** — `docs/BLUEPRINT.md` (what & why) and `docs/TDD.md` (how) are the single source of truth. Every strategy shift, finding, or invalidated direction is written into them **in the same session it is made**.
4. **Devin provides expert analysis and advice** — based on the findings, Devin offers strategic guidance, flags risks, suggests next directions, and identifies contradictions or concerns.
5. **User reviews, commits, pushes**, then issues the next directive.

**Critical rules of the orchestration:**
- Never resurrect a direction killed in BLUEPRINT §3 (Invalidated Directions). That section is load-bearing.
- Never move a pre-registered threshold after seeing results. If a threshold looks wrong, say so and leave it unchanged.
- Every number in every report carries provenance (source file, commit hash, which invariants passed).
- A probe that cannot satisfy its runtime invariants (I-1–I-6) aborts and reports; it does not return partial data.
- Feature status in BLUEPRINT §6 only moves forward on evidence.
- The user does formatting passes and may delete files post-completion (e.g., `directive17-stage4-report.md` was deleted after D17). This is expected; findings are preserved in the governing docs.

---

## 1. Project mission and current state

**Mission:** Establish, with published evidence, whether AI shopping agents can actually retrieve technically-specified products from Shopify merchants — and become the person who can fix it when they can't.

**The pitch was:** "reliable diagnostic for invisible products." **The evidence says:** absence is real (13–20% of a store's catalogue) but random — not predictable from product attributes. The diagnostic pitch is dead. What survives is the measurement method, the platform-facts register, and the absence finding itself.

### What was built (DIRECTIVE-1 through DIRECTIVE-17)

| Asset | Status | Location |
|---|---|---|
| Next.js 16.3 scaffold, Biome 2, Vitest, Playwright | Done | Repo root |
| UCP CLI + agent profile + API key auth | Done | `~/.ucp/profiles/catalogvector`, `.env.local` |
| Shopify AI Toolkit (4 skills, Dev MCP) | Done | `.agents/skills/`, `.devin/config.json` |
| Runtime invariants I-1–I-6 (22 tests) | Done | `src/lib/scanner/invariants.ts` |
| Sitemap enumeration | Done | `scripts/enumerate-sitemap.ts` |
| Partition-based enumeration method | Done | `scripts/probe-d16-*.ts`, `scripts/probe-d17-*.ts` |
| Platform-facts register (13 entries) | Done | `docs/reports/platform-facts-register.md` |
| Governing documents (BLUEPRINT v1.0.0, TDD v1.0.0) | Done | `docs/BLUEPRINT.md`, `docs/TDD.md` |
| Pipeline code (C5, C7, C8, C9) | Not started | — |
| Phase 0 (vertical selection) | Not started | — |
| Publication (PUB-1 through PUB-4) | Not started | — |

### What was measured

| Finding | Value | Status |
|---|---|---|
| Fitment recall (corrected, 4 stores) | 0.385 (prefix), 0.313 (strict) | Confirmed on compliant sample (n=18) |
| Absence rate — Subimods | 20.0% (95% CI 13.3–28.9%) | Measured (n=100, seed=42) |
| Absence rate — TSP | 13.0% (95% CI 7.8–21.0%) | Measured |
| Absence rate — MAP | 17.0% (95% CI 10.9–25.5%) | Measured (recall 56.6%, capped) |
| Enumeration recall (random) | 88.8% against union presence | Validated |
| H4 (title dominates retrieval) | 0.708 gap | Supported (relaxed matching, not replicated) |
| H9 (absence predictable) | Rejected — accuracy = majority-class baseline | Rejected |

### What was killed (BLUEPRINT §3, 16 entries total)

The 8 most recent (D9–D17 era):
1. **Exposé pivot** ("Catalog is a phantom") — falsified by U-6-R (Shopify merchants appear in ChatGPT cards)
2. **H6** (shop.app as proxy) — rejected on pre-registered threshold
3. **H7** (per-product syndication predictable) — withdrawn (shop.app finding misread as Catalog finding)
4. **H8** (stale Catalog entries) — rejected (0/401 404s)
5. **H9** (absence predictable from attributes) — rejected (no lift over base rate)
6. **"Half your catalogue is invisible"** — restated to 13–20%, not half
7. **Original premise** ("AI can't see your specs") — falsified by U-4 (tech_specs on ~99%)
8. **Inference-accuracy reframe** ("AI hallucinates specs") — nullified (1.7% error rate)

---

## 2. The platform-facts register

The register (`docs/reports/platform-facts-register.md`) is the project's most valuable asset — 13 entries documenting where Shopify's public documentation is wrong or incomplete about its own Catalog. It is the only artifact intended to be checkable by strangers. Current entries:

| # | Fact | Source |
|---|---|---|
| 1 | Per-merchant rows, distinct IDs, one seller each (no UPID clustering) | D7 §3, reconfirmed D14 §1 |
| 2 | Fitment recall 0.385 (corrected) — inference drops vehicles | D7 Stage 5 |
| 3 | Agent profile = hosted JSON, zero lead time (Spring '26) | U-1 resolved |
| 4 | `tags` returned as comma-separated string, not array | D4 §11 |
| 5 | Scoped fallback: no-match query returns shop's general catalogue | D8 Stage 2 |
| 6 | `filters.shops` is a hard restriction (0 containment violations) | U-4 resolved |
| 7 | Pagination exhausts at ~300, not 1000 | D7 Stage 2 |
| 8 | (Original entry 8 — see register file) | D8 Stage 2 |
| 9 | (Original entry 9 — see register file) | D8 Stage 2 |
| 10 | No per-store Catalog enumeration endpoint (54% false-negative rate) | D14 §6 |
| 11 | `/products.json` is exhaustive (fetch bug was ours, not Shopify's cap) | D16 §2 (corrected from D15) |
| 12 | Cursor pagination overlaps 1.6–8.1% between pages (ranking shifts) | D15 §0, I-1 invariant |
| 13 | `total_count` is a response budget (361–387 regardless of query), not a match count | D17 §2 |

**The register must be re-verified before publication.** Entries 2 and 3 were corrected by DIRECTIVE-9 §3. Entry 11 was corrected from "not exhaustive" to "exhaustive (our fetch was broken)" by DIRECTIVE-16 §2.

---

## 3. The runtime invariants (TDD §6.4)

Implemented in `src/lib/scanner/invariants.ts` with 22 passing tests. Every probe imports from this layer.

| # | Invariant | What it catches |
|---|---|---|
| I-1 | Page overlap < 20% (15% abort), cursor must change, log every overlap | U8-A pagination bug |
| I-2 | Store enumeration = sitemap count, or abort with delta | `/products.json` shortfall |
| I-3 | Every presence/absence claim carries `seller.domain` | Product-match-vs-seller-match |
| I-4 | Every row records which surface produced it; cross-surface comparison refused | shop.app vs Catalog conflation |
| I-5 | Domain comparison normalised; compared domain must exist in known-store list | One-character false negatives |
| I-6 | Membership/matching method reports false-negative rate before results are quoted | 54% false-negative membership test |

**I-1 is relaxed** from 0% to 20% (DIRECTIVE-16 §4) because the API genuinely overlaps pages 1.6–8.1%. A second relaxation requires a directive.

---

## 4. Key scripts and their outputs

| Script | Purpose | Output |
|---|---|---|
| `scripts/enumerate-sitemap.ts` | Parse sitemap XML, deduplicate product URLs | Sitemap product counts per store |
| `scripts/probe-d16-*.ts` | D16 probes: /products.json re-fetch, recall_random, I-1 relaxation, World B, tail inspection | `scripts/output/d16-*.json` |
| `scripts/probe-d17-h9.ts` | H9 hypothesis test: 300 random products/store, per-product exhaustive probe | `scripts/output/d17-h9-*.json` |
| `scripts/probe-d17-h9-analysis.ts` | H9 attribute analysis: train/test on 8 public attributes | `scripts/output/d17-h9-analysis-*.json` |
| `scripts/probe-d17-*.ts` | D17 enumeration, absence measurement, total_count probe | `scripts/output/d17-*.json` |
| `src/lib/scanner/invariants.ts` | Runtime invariants I-1–I-6 | 22 tests in `src/lib/scanner/invariants.test.ts` |

**All scripts are in `scripts/` (excluded from tsconfig).** They are one-off probes, not pipeline code. Fallow warnings about duplicated code and unreachable files in these scripts are expected and not actionable.

---

## 5. Open questions and unresolved threads

### Immediately actionable
- **U-5** (do metafields affect Catalog results?) — still OPEN. Seed a dev store with structured metafields, wait out the freshness delay, compare. Blocks C5/C6 interpretation and all Phase 2 value claims.
- **H2** (truncation hypothesis — is fitment loss a function of source-text length?) — INCONCLUSIVE. Needs the quartile contrast in ≥2 verticals. The mandatory first-occurrence-offset control was never run.
- **H4-R** (title-coverage replication) — INCONCLUSIVE. The registered design cannot be executed at TSP (5.9% title-absent, no category with ≥6 of both populations). H4 remains an auto-parts finding (TSP+MAP, 0.708 gap), not a platform finding.

### Recorded but not urgent
- **Google AI** was tested from Serbia, not US. No US claim about Google AI is licensed.
- **surface_trigger_rate** (5/12 queries produced no card) — identified as a novel finding no monitoring platform measures. n per vertical is still 4; promotion to a hypothesis is paused.
- **Copilot** returned 0/12 in U-6-R (blocked by sign-in). One third of the design is missing.

### Strategic questions for the user
1. **What is the publication framing now that the diagnostic pitch is dead?** The measurement method and absence finding are real and novel. But "we can tell you which products are invisible and why" is not supported. The framing must shift to "we measured what nobody else can measure, and here is what we found."
2. **Does the project continue to Phase 0 / publication, or does the H9 rejection change the calculus?** The guaranteed return (dataset, methodology, open-source code, demonstrated competence) is untouched. The optional return (paid diagnostics) is weakened but not eliminated — the absence measurement itself is still valuable to a merchant.
3. **Is a new directive needed to reframe the publication, or does the user want to pause and reassess?**

---

## 6. What the next session should do

1. **Read `docs/BLUEPRINT.md` and `docs/TDD.md` in full.** They are the single source of truth. Both are at v1.0.0, current through DIRECTIVE-17.
2. **Read `docs/reports/platform-facts-register.md`** — the 13-entry register is the project's credential.
3. **Await the next directive from the user.** Do not self-initiate work. The user issues directives; Devin executes, updates governing docs, and provides analysis.
4. **When a directive arrives:** read it carefully, check what it supersedes vs. what remains binding, execute the tasks in order, produce reports in `docs/reports/`, update BLUEPRINT.md and TDD.md in the same session, then provide expert analysis and advice.

### Conventions for updating governing documents
- **BLUEPRINT.md §12 (Change log):** add one entry per directive (or per stage within a directive). Format: `| Date | Version | **DIRECTIVE-N — summary.** Details. |`
- **TDD.md §12 (Change log):** same pattern, more granular (one entry per stage or sub-finding).
- **BLUEPRINT §3 (Invalidated Directions):** add any killed direction with the evidence that killed it.
- **BLUEPRINT §6 (Feature inventory):** update C1–C9 status from `PENDING` to `PARTIAL` or `DONE` only on evidence.
- **TDD §2 (Platform facts):** update verified facts with dates. Add to §2.7 (standing limitations) for new limitations. Add to §2.8 (unknowns) for new open questions, mark RESOLVED when closed.
- **TDD §6 (Measurement methodology):** add new hypothesis sections (§6.1.N) with pre-registered decision rules and results. Update §6.3 (stated limitations) and §6.4 (runtime invariants) as needed.
- **Version numbers:** increment both documents together. Major version for project-level shifts (e.g., 1.0.0 for D17's H9 rejection), minor for directive completions.
- **After updating:** the user will review, commit, and push. Do not commit unless asked.

### Conventions for reports
- Report files go in `docs/reports/` with naming pattern `directiveN-stageM-report.md` or `directiveN-round-report.md`.
- Every number carries provenance: source file, script commit hash, which invariants passed.
- State pre-registration deviations honestly. Report both raw and corrected numbers when corrections are applied.
- The user may delete report files after completion (e.g., `directive17-stage4-report.md`). This is expected; the findings are preserved in the governing docs.

---

## 7. File map

```
docs/
├── BLUEPRINT.md                    # Governing: what & why (v1.0.0)
├── TDD.md                          # Governing: how (v1.0.0)
├── SESSION-HANDOFF.md              # This file
├── directives/
│   ├── DIRECTIVE-1.md through DIRECTIVE-17.md  # All directives (binding instructions)
│   └── DIRECTIVE-15-v2.md          # v2 replaces the D15 draft
├── reports/
│   ├── platform-facts-register.md  # 13-entry register (the credential)
│   ├── directiveN-*.md             # Per-directive reports
│   └── (directive17-stage4-report.md was deleted by user post-completion)
└── ...

src/lib/scanner/
├── invariants.ts                   # I-1–I-6 runtime assertions
├── invariants.test.ts              # 22 passing tests
├── ucp-auth.ts                     # Token-tier auth helper
└── c1-c9 stubs                     # Pipeline stubs (PENDING)

scripts/
├── enumerate-sitemap.ts            # Sitemap parser
├── probe-d16-*.ts                  # D16 probes
├── probe-d17-*.ts                  # D17 probes
└── output/                         # JSON outputs (gitignored or committed per directive)
```

---

## 8. The three stores

| Store | Domain | Sitemap products | /products.json | Enumerated handles | Absence |
|---|---|---|---|---|---|
| Subimods | subimods.com | 18,066 | 18,066 (was 5,250 — fetch bug) | 13,257 | 20.0% |
| Two Step Performance (TSP) | twostepprformance.com | 2,608 | 2,608 | — | 13.0% |
| MAPerformance (MAP) | maperformance.com | 102,176 | 25,000 (Shopify 100-page cap) | 25,000 | 17.0% |

**Shop GIDs** (resolved via U-3):
- Subimods: `gid://shopify/Shop/<id>` (in scripts/output)
- TSP: `gid://shopify/Shop/1357086779`
- MAP: `gid://shopify/Shop/<id>` (in scripts/output)

---

## 9. Final notes for the next agent

- **You are inheriting a project that just had its original pitch falsified.** This is not a crisis — it is the scientific method working. The measurement infrastructure is the durable asset. The H9 rejection is an honest finding that narrows the commercial opportunity but does not eliminate it.
- **The user values intellectual honesty above all else.** Report what you find, not what you wish you found. The project's §3 (Invalidated Directions) has 16 entries because ideas were killed with data, not rescued with spin. Continue that tradition.
- **The user catches errors.** DIRECTIVE-14 §0 records the advisor catching his own error (H7 built on a misread surface). DIRECTIVE-15-v2 §0 records the advisor preventing external misinterpretation from reviving dead hypotheses. The user is rigorous. Match that rigor.
- **Do not self-initiate.** Wait for the directive. Execute it. Update the docs. Provide analysis. That is the cycle.
- **Fallow warnings on one-off probe scripts are expected.** Duplicated code and unreachable files in `scripts/` are not actionable — they are exploratory probes, not production code.

---

*End of handoff. The next session starts clean. Read the governing docs, read the register, await the next directive.*
