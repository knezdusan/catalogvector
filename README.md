# CatalogVector

> Outcome measurement of AI shopping-agent retrieval for technically-specified Shopify catalogs.

CatalogVector is a **measurement instrument**, not a product. For N public Shopify stores in one technical vertical, it determines whether the Shopify Global Catalog (the same retrieval surface consumer AI assistants query) actually retrieves a store's products for realistic buyer queries — and publishes the result as a dataset, methodology, open-source code, and analysis.

This is Phase 1: **read-only against public surfaces**. No OAuth, no embedded app, no billing, no multi-tenancy, no write path to any merchant's store.

## Governing documents

These two files are the single source of truth. **Read both before any feature work.**

- [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md) — *what and why* (mission, positioning, phased structure, gates, non-goals)
- [`docs/TDD.md`](docs/TDD.md) — *how* (architecture, data model, component specs, test strategy, milestone sequence)

Every strategy shift, feature addition, feature status change, or critical decision is written into these documents in the same session it is made.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Next.js 16.3 (App Router, Cache Components, React Compiler) + React 19.2 + TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Lint/format | Biome 2 |
| Database | PostgreSQL + `pgvector` (Drizzle ORM) |
| Background work | Self-hosted Inngest |
| Rate limiting | Redis, hard global cap |
| Validation | Zod on every external payload |
| LLM routing | OpenRouter, multi-model, cost as first-class constraint |
| Tests | Vitest (unit/boundary), Playwright (e2e, `@next/playwright` `instant()` helper) |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack, Cache Components, React Compiler) |
| `npm run build` | Production build |
| `npm run lint` | `biome check` |
| `npm run lint:fix` | `biome check --write` |
| `npm run format` | `biome format --write` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | `vitest run` |
| `npm run test:e2e` | `playwright test` |
| `npm run verify` | lint + typecheck + build (the CI gate) |

## Project structure

```
src/
├── app/
│   ├── (public)/          # Public website (placeholders for now)
│   ├── admin/             # Local command center (no auth)
│   └── api/inngest/       # Inngest endpoint for background jobs
├── db/                    # Drizzle ORM + pgvector schema
├── inngest/               # Inngest client + orchestration functions
└── lib/
    ├── env.ts             # Typed, validated environment variables
    └── scanner/           # The measurement engine (C1–C7)
scripts/                   # Throwaway probes (not part of the app)
docs/                      # Governing documents
```

## License

Open source (licence to be finalized per BLUEPRINT PUB-3). Phase 1 is built to be published under the author's name.
