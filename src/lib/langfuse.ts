import { Langfuse } from "langfuse";
import { config } from "@/lib/config";

// Initialize Langfuse client for observability and tracing
// Only initialize if keys are configured
let langfuseClient: Langfuse | null = null;

if (config.langfuse.secretKey && config.langfuse.publicKey) {
  langfuseClient = new Langfuse({
    secretKey: config.langfuse.secretKey,
    publicKey: config.langfuse.publicKey,
    baseUrl: config.langfuse.host || "https://cloud.langfuse.com",
  });
}

/**
 * Get the Langfuse client instance
 * Returns null if not configured
 */
export function getLangfuse(): Langfuse | null {
  return langfuseClient;
}

/**
 * Langfuse instance export for backward compatibility
 */
export const langfuse = langfuseClient;

/**
 * Helper to check if Langfuse is enabled
 */
export function isLangfuseEnabled(): boolean {
  return langfuseClient !== null;
}

/**
 * Flush all pending Langfuse events
 * Call this before process termination in serverless environments
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
  }
}
