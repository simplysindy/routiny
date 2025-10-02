import { RateLimiterMemory } from "rate-limiter-flexible";
import { config } from "@/lib/config";

// Rate limiter for OpenRouter API calls
// Configuration pulled from centralized config
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
