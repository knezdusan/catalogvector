/**
 * C7 — Distributed rate limiter.
 *
 * Hard global cap across parallel Inngest workers, per external surface. Redis
 * token bucket, existing VectorMatch pattern. Separate buckets for
 * `shopify:catalog` and per-storefront-domain. Storefront default: conservative,
 * ≤1 req/sec/domain, exponential backoff on 429/430. **This is published as part
 * of the methodology** — a documented crawl policy converts a risk into a
 * credibility asset. (TDD.md §5 C7, BLUEPRINT.md §9)
 *
 * Interface: rateLimiter.acquire(bucket): Promise<void>
 * Testable boundary: concurrency test — M workers, N tokens, assert the global
 *   cap is never exceeded.
 * Status: PENDING — depends on I-6 (Redis).
 */
export type RateLimiter = {
  acquire(bucket: string): Promise<void>;
};

export const rateLimiter: RateLimiter = {
  async acquire(_bucket: string): Promise<void> {
    // TODO(C7): implement Redis token bucket per TDD.md §5 C7. Blocked on I-6.
    throw new Error(
      "C7 rateLimiter.acquire not implemented (PENDING — I-6 Redis)",
    );
  },
};
