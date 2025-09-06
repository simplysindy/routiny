// Environment variable configuration with validation
// Never access process.env directly - use these config objects instead

interface Config {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  openRouter: {
    apiKey: string;
  };
  upstash: {
    redisUrl: string;
    redisToken: string;
  };
  langfuse: {
    secretKey: string;
    publicKey: string;
    host: string;
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

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key];
}

export const config: Config = {
  supabase: {
    url: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  },
  openRouter: {
    apiKey: getEnvVar("OPENROUTER_API_KEY"),
  },
  upstash: {
    redisUrl: getEnvVar("UPSTASH_REDIS_REST_URL"),
    redisToken: getEnvVar("UPSTASH_REDIS_REST_TOKEN"),
  },
  langfuse: {
    secretKey: getEnvVar("LANGFUSE_SECRET_KEY"),
    publicKey: getEnvVar("LANGFUSE_PUBLIC_KEY"),
    host: getEnvVar("LANGFUSE_HOST"),
  },
  app: {
    url: getEnvVar("NEXT_PUBLIC_APP_URL"),
    env: getEnvVar("NODE_ENV"),
  },
  analytics: {
    vercelAnalyticsId: getOptionalEnvVar("NEXT_PUBLIC_VERCEL_ANALYTICS_ID"),
    sentryDsn: getOptionalEnvVar("SENTRY_DSN"),
    sentryOrg: getOptionalEnvVar("SENTRY_ORG"),
    sentryProject: getOptionalEnvVar("SENTRY_PROJECT"),
  },
};

// Validation helper to check if all required environment variables are set
export function validateConfig(): boolean {
  try {
    // Test accessing all required config values
    const requiredValues = [
      config.supabase.url,
      config.supabase.anonKey,
      config.supabase.serviceRoleKey,
      config.openRouter.apiKey,
      config.upstash.redisUrl,
      config.upstash.redisToken,
      config.langfuse.secretKey,
      config.langfuse.publicKey,
      config.langfuse.host,
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
