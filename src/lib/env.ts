/**
 * Typed, validated environment variables.
 *
 * Validates at boot so a missing or malformed key fails fast instead of
 * surfacing as a silent bug mid-scan. Never commit secrets — `.env*` is
 * gitignored except `.env.example`. (BLUEPRINT §9: no secrets in repo.)
 *
 * Phase 1 keys are optional here because infra (I-5 Postgres, I-6 Redis, I-7
 * Inngest, I-4 UCP agent profile) is not yet provisioned. As each lands, flip its
 * key to required. Server-only — never import this from a Client Component.
 */
import { z } from "zod";

const envSchema = z.object({
  // Node/Next
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // I-5: Postgres + pgvector — required once db is wired
  DATABASE_URL: z.string().url().optional(),

  // I-6: Redis (C7 rate limiter) — required once C7 is wired
  REDIS_URL: z.string().url().optional(),

  // I-7: Inngest (self-hosted) — required once C8 is wired
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // I-4: UCP agent profile (TDD §2.4) — required for C3. Lead-time risk, do first.
  UCP_AGENT_PROFILE_URL: z.string().url().optional(),

  // LLM routing (TDD §7: OpenRouter, cost as first-class constraint)
  OPENROUTER_API_KEY: z.string().optional(),

  // Embedding model config (TDD §4: 1536-dim vectors)
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
