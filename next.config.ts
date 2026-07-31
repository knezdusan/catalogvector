import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS in production
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control framing (Phase 1 has no embedded app, so deny by default)
  { key: "X-Frame-Options", value: "DENY" },
  // Cross-site request forgery protection for top-level navigations
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict powerful browser features (no camera/mic/geolocation needed)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Content Security Policy — locked down for a read-only Phase 1 app.
  // Allow inline styles (Tailwind/Next inject some) and Next.js runtime assets.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Cache Components — the unified PPR + 'use cache' model (Next.js 16).
  // Enables Instant Navigations: Stream with <Suspense>, Cache with 'use cache',
  // or Block with `export const instant = false`. See AGENTS.md decision tree.
  cacheComponents: true,

  // React Compiler — automatic memoization (stable in Next.js 16).
  reactCompiler: true,

  // Keep the managed AGENTS.md block pointing agents at bundled docs.
  agentRules: true,

  // Security hardening
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
