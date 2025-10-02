// Environment variable configuration with validation
// Never access process.env directly - use these config objects instead

interface Config {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  openRouter: {
    apiKey?: string;
    model: string;
    temperature: number;
    timeoutMs: number;
    maxRetries: number;
  };
  upstash: {
    redisUrl?: string;
    redisToken?: string;
  };
  langfuse: {
    secretKey?: string;
    publicKey?: string;
    host?: string;
  };
  rateLimit: {
    taskBreakdown: {
      points: number;
      durationSeconds: number;
    };
  };
  app: {
    url: string;
    env: string;
  };
  analytics: {
    vercelAnalyticsId?: string;
    sentryDsn?: string;
    sentryOrg?: string;
    sentryProject?: string;
  };
}

// Direct environment variable access for Next.js build-time replacement
// Next.js only inlines NEXT_PUBLIC_ vars when accessed directly as process.env.VARIABLE_NAME
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const NEXT_PUBLIC_VERCEL_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;

// Server-only variables (safe to use dynamic access)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_HOST = process.env.LANGFUSE_HOST;
const NODE_ENV = process.env.NODE_ENV;
const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: Config = {
  supabase: {
    url: requireEnv(NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv(
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ),
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  openRouter: {
    apiKey: OPENROUTER_API_KEY,
    model: "moonshotai/kimi-k2-0905", // Kimi K2 model
    temperature: 0.7, // Moderate creativity for task breakdown
    timeoutMs: 10000, // 10 second timeout
    maxRetries: 2, // Maximum retry attempts for API failures
  },
  upstash: {
    redisUrl: UPSTASH_REDIS_REST_URL,
    redisToken: UPSTASH_REDIS_REST_TOKEN,
  },
  langfuse: {
    secretKey: LANGFUSE_SECRET_KEY,
    publicKey: LANGFUSE_PUBLIC_KEY,
    host: LANGFUSE_HOST,
  },
  rateLimit: {
    taskBreakdown: {
      points: 10, // 10 requests
      durationSeconds: 3600, // per 1 hour
    },
  },
  app: {
    url: requireEnv(NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL"),
    env: requireEnv(NODE_ENV, "NODE_ENV"),
  },
  analytics: {
    vercelAnalyticsId: NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
    sentryDsn: SENTRY_DSN,
    sentryOrg: SENTRY_ORG,
    sentryProject: SENTRY_PROJECT,
  },
};

// Validation helper to check if all required environment variables are set
export function validateConfig(): boolean {
  try {
    // Test accessing only essential config values for basic app functionality
    const requiredValues = [
      config.supabase.url,
      config.supabase.anonKey,
      config.app.url,
      config.app.env,
    ];

    // Check all values are defined
    const isValid = requiredValues.every(
      (value) => value !== undefined && value !== null
    );

    return isValid;
  } catch (error) {
    console.error("Configuration validation failed:", error);
    return false;
  }
}
