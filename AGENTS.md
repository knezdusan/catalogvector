<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CatalogVector — project rules

## Read the governing docs first

`docs/BLUEPRINT.md` (what & why) and `docs/TDD.md` (how) are the **single source of truth**. Read both before any feature work. Every strategy shift, feature status change, or critical decision is written into them in the same session it is made. Feature status only moves forward on evidence (BLUEPRINT §6). §3 (Invalidated Directions) is load-bearing — do not resurrect killed ideas.

## Stack & commands

- **Runtime:** Next.js 16.3 (App Router, `cacheComponents: true`, `reactCompiler: true`) + React 19.2 + TypeScript (strict, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`).
- **Lint/format:** Biome 2 — NOT ESLint/prettier. `npm run lint` = `biome check`. `npm run lint:fix` = `biome check --write`.
- **Styling:** Tailwind CSS v4 only (no component library yet — decide when first real UI is scaffolded).
- **Path alias:** `@/*` → `./src/*`.
- **Verify gate:** `npm run verify` = `biome check && tsc --noEmit && next build`. Run before marking a task done.
- **Package manager:** npm (Node 24).

## Cache Components — the decision tree

`cacheComponents` is ON. An `await` on the server is a choice. When the dev overlay or build surfaces a blocking-prerender error, pick one:
- **Stream** — wrap the data access in `<Suspense fallback={...}>` (user sees a loading shell instantly).
- **Cache** — mark the data access with `"use cache"` (user sees a previously cached UI).
- **Block** — `export const instant = false` in the page/layout (server-bound navigation; use only when a loading shell is wrong, e.g. a blog post).
Read the per-error page the `Learn more` link points to before fixing. Default to Stream or Cache; Block is the exception.

## Server vs client boundaries

Default to Server Components. Add `"use client"` only for interactivity (event handlers, `useState`, browser APIs). Never put `export const instant` in a Client Component — it throws. Keep `src/db`, `src/inngest`, and `src/lib/scanner` server-only.

## External data is hostile

Zod-validate every external payload before persistence (TDD §5 C2/C3). Never trust `total_count` from the Global Catalog (it is an estimate). Persist `requestBody` and `results` verbatim — reproducibility is a schema requirement.

## Reproducibility & ethics

- Crawl policy is published as part of the methodology: real user agent, contact URL, `robots.txt` honoured, hard global rate cap via C7. Never crawl without the rate limiter.
- Named per-store results are NEVER published — aggregate only publicly; specifics private on request (lead capture).
- No claim anywhere that this work guarantees AI rankings.

## Agent verification

Use the `next-dev-loop` skill to verify edits at runtime (drive the browser, read console, inspect React tree). The `next-devtools` MCP server (configured in `.devin/config.json` and `.mcp.json`) exposes routes, server logs, and compilation issues from the running dev server. After edits, check `get_errors` / `get_compilation_issues` before declaring done.

## What this is NOT (BLUEPRINT §4)

No App Store listing, no billing, no multi-tenancy, no merchant OAuth, no generic readiness scanner, no SaaS scaffolding "for later", no write path to any merchant's store. Phase 1 is read-only against public surfaces. If a decision is only justified by "we'll need it when this becomes a product," it is out.
