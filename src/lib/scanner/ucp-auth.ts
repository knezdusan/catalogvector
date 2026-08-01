/**
 * UCP authentication — fetches bearer tokens from Shopify's token endpoint.
 *
 * The Token tier (API key from Dev Dashboard → bearer token) gives the highest
 * rate limits for Global Catalog access. Tokens expire after 60 minutes, so
 * fetch at runtime on each scan run rather than caching long-term.
 *
 * Dev Dashboard → Catalogs → Get an API key → client_id + client_secret.
 * Scope: read_global_api_catalog_search. (TDD §2.4, updated 31 Jul 2026)
 *
 * Status: ready once SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET are set in .env.local.
 */
import { env } from "@/lib/env";

const TOKEN_ENDPOINT = "https://api.shopify.com/auth/access_token";

export type UcpToken = {
  accessToken: string;
  scopes: string[];
  expiresAt: Date;
};

/**
 * Fetch a fresh bearer token using client credentials.
 * Call this at the start of each scan run; do not cache across runs.
 */
export async function getUcpAccessToken(): Promise<UcpToken> {
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new Error(
      "SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET must be set. " +
        "Get them from the Dev Dashboard → Catalogs → Get an API key.",
    );
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`UCP token fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string };

  // The JWT payload carries scopes and expiry.
  const parts = data.access_token.split(".");
  if (parts.length < 2) {
    throw new Error("UCP token response is not a valid JWT");
  }
  const decoded = JSON.parse(
    Buffer.from(parts[1] as string, "base64").toString("utf-8"),
  ) as { scopes: string[]; exp: number };

  return {
    accessToken: data.access_token,
    scopes: decoded.scopes,
    expiresAt: new Date(decoded.exp * 1000),
  };
}
