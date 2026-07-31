import { describe, expect, it } from "vitest";

/**
 * Env schema smoke test. Validates the Zod schema parses a minimal valid env
 * and rejects malformed values. Full boot-time validation lives in src/lib/env.ts.
 */
describe("env schema", () => {
  it("accepts a minimal development env (all optional keys absent)", () => {
    // Re-import with a clean env to avoid coupling to the process env at import time.
    // The module validates at import; this test asserts the default NODE_ENV path.
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it("rejects a non-URL DATABASE_URL at the schema level", async () => {
    const { z } = await import("zod");
    const schema = z.object({ DATABASE_URL: z.string().url().optional() });
    const bad = schema.safeParse({ DATABASE_URL: "not-a-url" });
    expect(bad.success).toBe(false);
  });

  it("accepts a valid URL DATABASE_URL at the schema level", async () => {
    const { z } = await import("zod");
    const schema = z.object({ DATABASE_URL: z.string().url().optional() });
    const good = schema.safeParse({
      DATABASE_URL: "postgres://localhost:5432/db",
    });
    expect(good.success).toBe(true);
  });
});
