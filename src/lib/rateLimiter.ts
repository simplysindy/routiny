import { RateLimiterMemory } from "rate-limiter-flexible";
import { config } from "@/lib/config";

/**
 * Rate limiter for OpenRouter API calls
 * Configuration pulled from centralized config
 *
 * IMPORTANT - PRODUCTION DEPLOYMENT WARNING:
 * This uses in-memory rate limiting (RateLimiterMemory) which is suitable for:
 * - Single-instance deployments
 * - Development environments
 * - Low-traffic production without auto-scaling
 *
 * LIMITATION: In serverless/multi-instance environments (e.g., Vercel with auto-scaling),
 * each instance maintains its own memory state. This means:
 * - Rate limits are NOT shared across instances
 * - Users could bypass limits by triggering requests to different instances
 * - Cost protection and abuse prevention may be ineffective
 *
 * RECOMMENDED SOLUTION for production with auto-scaling:
 * Migrate to distributed rate limiting using Redis (Upstash recommended for serverless):
 * - Replace RateLimiterMemory with RateLimiterRedis
 * - Use Upstash Redis REST API for serverless compatibility
 * - Ensure rate limits are enforced consistently across all instances
 *
 * See: https://github.com/animir/node-rate-limiter-flexible/wiki/Redis
 */
export const taskBreakdownRateLimiter = new RateLimiterMemory({
  points: config.rateLimit.taskBreakdown.points,
  duration: config.rateLimit.taskBreakdown.durationSeconds,
});

/**
 * Check if a user has exceeded the rate limit
 * @param userId User ID to check
 * @returns Object with { allowed: boolean, retryAfter?: number }
 */
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  retryAfter?: number;
}> {
  try {
    await taskBreakdownRateLimiter.consume(userId);
    return { allowed: true };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rateLimitError = error as any;
    const retryAfter = Math.ceil((rateLimitError.msBeforeNext || 0) / 1000);
    return { allowed: false, retryAfter };
  }
}
