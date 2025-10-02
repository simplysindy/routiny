import { config } from "@/lib/config";
import { getLangfuse } from "@/lib/langfuse";
import type {
  OpenRouterRequest,
  OpenRouterResponse,
  TaskBreakdownResponse,
} from "@/types/openrouter";

// OpenRouter API configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// System prompt for single-day task breakdown
const SYSTEM_PROMPT = `You are a task breakdown assistant. Your job is to break down user tasks into actionable micro-steps.

Guidelines:
- Use imperative, specific language (e.g., "Open email client", "Gather cleaning supplies")
- First step should eliminate friction by setting up the environment or gathering materials
- Adjust step count based on task complexity (simple: 3-5, medium: 5-7, complex: 7-10)
- Each step should take 2-15 minutes to complete
- Steps should build logically and sequentially

Examples:
Task: "Send email to boss about project update"
Steps: ["Open email client", "Click compose new email", "Type boss's email address", "Write subject line: Project Update", "Write 3-sentence summary of progress", "Proofread email", "Click send"]

Task: "Clean my room"
Steps: ["Gather trash bag and cleaning supplies", "Pick up all items from floor", "Put clothes in hamper or closet", "Wipe down desk surface", "Vacuum or sweep floor", "Make bed"]

Return your response as a JSON object with a "steps" array containing the breakdown.`;

/**
 * Generate fallback breakdown when OpenRouter API fails
 */
export function generateFallbackBreakdown(title: string): string[] {
  return [
    "Gather any materials or tools you'll need",
    `Start working on: ${title}`,
    "Complete the main task",
    "Review your work",
    "Mark the task as complete",
  ];
}

/**
 * Call OpenRouter API with timeout handling
 */
async function callOpenRouterAPI(
  request: OpenRouterRequest
): Promise<OpenRouterResponse> {
  const apiKey = config.openRouter.apiKey;
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.openRouter.timeoutMs
  );

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenRouter API request timed out");
    }

    throw error;
  }
}

/**
 * Generate single-day task breakdown using OpenRouter API
 */
export async function generateSingleDayBreakdown(
  taskTitle: string,
  userId: string,
  maxRetries = config.openRouter.maxRetries
): Promise<string[]> {
  const langfuse = getLangfuse();
  let lastError: Error | null = null;

  // Create Langfuse trace if enabled
  const trace = langfuse?.trace({
    name: "task-breakdown",
    userId: userId,
    metadata: { taskTitle, taskType: "single-day" },
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const request: OpenRouterRequest = {
        model: config.openRouter.model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Now break down this task: "${taskTitle}"\nReturn JSON: {"steps": ["step1", "step2", ...]}`,
          },
        ],
        temperature: config.openRouter.temperature,
        response_format: { type: "json_object" },
        stream: false,
      };

      // Create generation span in trace
      const generation = trace?.generation({
        name: "openrouter-single-day",
        model: config.openRouter.model,
        input: { prompt: request.messages, taskTitle },
        metadata: { provider: "openrouter", attempt: attempt + 1 },
      });

      const response = await callOpenRouterAPI(request);

      // Parse the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenRouter API");
      }

      const parsed: TaskBreakdownResponse = JSON.parse(content);

      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error("Invalid response format from OpenRouter API");
      }

      // Validate steps array
      if (parsed.steps.length === 0) {
        throw new Error("OpenRouter returned empty steps array");
      }

      // Log successful generation to Langfuse
      generation?.end({
        output: parsed,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      });

      return parsed.steps;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log error to Langfuse
      trace?.generation({
        name: "openrouter-single-day-error",
        model: config.openRouter.model,
        input: { taskTitle },
        output: null,
        level: "ERROR",
        statusMessage: lastError.message,
        metadata: { attempt: attempt + 1 },
      });

      // Don't retry on validation errors or timeouts
      if (
        lastError.message.includes("Invalid response format") ||
        lastError.message.includes("timed out")
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  // If all retries failed, log error and return fallback
  console.error(
    `OpenRouter generation failed after ${maxRetries + 1} attempts:`,
    lastError
  );

  const fallback = generateFallbackBreakdown(taskTitle);

  // Log fallback usage
  trace?.event({
    name: "fallback-breakdown-used",
    metadata: { reason: lastError?.message, fallback },
  });

  return fallback;
}
