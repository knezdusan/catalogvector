/**
 * Inngest endpoint — serves Inngest functions for background orchestration.
 *
 * Mounted at /api/inngest. Inngest self-hosted (BLUEPRINT.md §7, TDD.md §3, C8).
 * Status: PENDING — wired once `inngest` package is installed and
 *         `@/inngest/client` + `@/inngest/functions` are implemented.
 *
 * TODO(C8): replace this placeholder with:
 *   import { serve } from "inngest/next";
 *   import { inngest } from "@/inngest/client";
 *   import { scanStore } from "@/inngest/functions";
 *   export const { GET, POST, PUT } = serve({ client: inngest, functions: [scanStore] });
 */
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    message: "Inngest endpoint placeholder — not wired (C8 PENDING).",
  });
}
export const POST = GET;
export const PUT = GET;
