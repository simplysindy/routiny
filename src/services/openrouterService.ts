import { config } from "@/lib/config";
import { getLangfuse } from "@/lib/langfuse";
import type {
  OpenRouterRequest,
  OpenRouterResponse,
  TaskBreakdownResponse,
} from "@/types/openrouter";
import type { MultiDayBreakdown } from "@/types";

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

// System prompt for multi-day habit progression
const MULTI_DAY_SYSTEM_PROMPT = `You are a multi-day habit progression assistant. Your job is to break down user habits into progressive daily task lists that build lasting behavior change.

Guidelines:
- Generate exactly {duration_days} days of tasks
- Use imperative, specific language (e.g., "Put on running shoes", "Run for 5 minutes")
- Each day should build logically upon previous days (simple → complex)
- Days 1-3: Focus on 2-15 minute micro-actions to eliminate friction and build momentum
- Include preparation, execution, and reflection components where appropriate
- Adjust task count per day based on habit complexity (simple: 1-3, medium: 3-5, complex: 5-7)
- Each task should be immediately actionable and specific
- Progressive structure pattern:
  * Days 1-3: Foundation building, friction elimination, minimal commitment
  * Days 4-10: Consistency building, routine establishment, incremental difficulty
  * Days 11-30: Skill development, challenge escalation, habit reinforcement
  * Days 31+: Mastery focus, variation introduction, long-term sustainability

Examples:

Habit: "Build a running habit over 7 days"
{
  "day_1": ["Put running shoes by the door", "Put on running shoes", "Step outside", "Walk for 2 minutes", "Return home"],
  "day_2": ["Put on running shoes", "Walk outside for 3 minutes", "Jog for 1 minute", "Walk for 2 minutes", "Return and stretch"],
  "day_3": ["Put on running shoes", "Jog for 2 minutes", "Walk for 2 minutes", "Jog for 2 minutes", "Cool down walk"],
  "day_4": ["Warm up with arm circles", "Jog for 5 minutes continuously", "Walk for 2 minutes", "Stretch legs"],
  "day_5": ["Warm up for 2 minutes", "Jog for 7 minutes", "Walk for 1 minute", "Stretch and hydrate"],
  "day_6": ["Warm up for 2 minutes", "Jog for 10 minutes", "Cool down walk", "Stretch major muscle groups"],
  "day_7": ["Warm up for 2 minutes", "Jog for 12 minutes", "Cool down walk", "Reflect on week's progress"]
}

Habit: "Develop a meditation practice over 30 days"
{
  "day_1": ["Find a quiet spot in your home", "Sit comfortably", "Set timer for 2 minutes", "Close eyes and focus on breath"],
  "day_2": ["Sit in your meditation spot", "Set timer for 3 minutes", "Focus on breath, notice thoughts without judgment"],
  "day_3": ["Set timer for 5 minutes", "Practice counting breaths (1-10)", "Notice when mind wanders"],
  "day_7": ["Set timer for 10 minutes", "Use body scan technique", "Notice sensations without reaction"],
  "day_30": ["Set timer for 20 minutes", "Practice loving-kindness meditation", "Reflect on 30-day journey"]
}

Return your response as a JSON object with day-structured format: {"day_1": [...], "day_2": [...], ..., "day_{duration_days}": [...]}`;

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
 * Generate fallback multi-day breakdown when OpenRouter API fails
 */
export function generateMultiDayFallbackBreakdown(
  title: string,
  durationDays: number
): MultiDayBreakdown {
  const breakdown: MultiDayBreakdown = {};

  for (let day = 1; day <= durationDays; day++) {
    breakdown[`day_${day}`] = [
      `Prepare for: ${title}`,
      `Practice day ${day} of ${durationDays}`,
      `Reflect on progress`,
    ];
  }

  return breakdown;
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

/**
 * Generate multi-day habit breakdown using OpenRouter API
 */
export async function generateMultiDayBreakdown(
  taskTitle: string,
  durationDays: number,
  userId: string,
  maxRetries = config.openRouter.maxRetries
): Promise<MultiDayBreakdown> {
  const langfuse = getLangfuse();
  let lastError: Error | null = null;

  // Create Langfuse trace if enabled
  const trace = langfuse?.trace({
    name: "multi-day-task-breakdown",
    userId: userId,
    metadata: { taskTitle, taskType: "multi-day", durationDays },
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Replace {duration_days} in system prompt with actual value
      const systemPrompt = MULTI_DAY_SYSTEM_PROMPT.replace(
        /{duration_days}/g,
        String(durationDays)
      );

      const request: OpenRouterRequest = {
        model: config.openRouter.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Now generate a multi-day habit breakdown for: "${taskTitle}" over ${durationDays} days.\nReturn JSON in format: {"day_1": [...], "day_2": [...], ..., "day_${durationDays}": [...]}`,
          },
        ],
        temperature: config.openRouter.temperature,
        response_format: { type: "json_object" },
        stream: false,
      };

      // Create generation span in trace
      const generation = trace?.generation({
        name: "openrouter-multi-day",
        model: config.openRouter.model,
        input: { prompt: request.messages, taskTitle, durationDays },
        metadata: { provider: "openrouter", attempt: attempt + 1 },
      });

      const response = await callOpenRouterAPI(request);

      // Parse the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenRouter API");
      }

      const parsed: MultiDayBreakdown = JSON.parse(content);

      // Validate day-structured response
      const dayKeys = Object.keys(parsed);
      if (dayKeys.length === 0) {
        throw new Error("OpenRouter returned empty multi-day breakdown");
      }

      // Validate each day has tasks
      for (const dayKey of dayKeys) {
        if (!Array.isArray(parsed[dayKey]) || parsed[dayKey].length === 0) {
          throw new Error(
            `Invalid tasks for ${dayKey}: expected non-empty array`
          );
        }
      }

      // Validate we have the expected number of days (allow some flexibility)
      if (dayKeys.length < Math.floor(durationDays * 0.8)) {
        throw new Error(
          `Expected approximately ${durationDays} days, got ${dayKeys.length}`
        );
      }

      // Log successful generation to Langfuse
      generation?.end({
        output: parsed,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
        metadata: {
          daysGenerated: dayKeys.length,
          avgTasksPerDay:
            dayKeys.reduce((sum, key) => sum + parsed[key].length, 0) /
            dayKeys.length,
        },
      });

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log error to Langfuse
      trace?.generation({
        name: "openrouter-multi-day-error",
        model: config.openRouter.model,
        input: { taskTitle, durationDays },
        output: null,
        level: "ERROR",
        statusMessage: lastError.message,
        metadata: { attempt: attempt + 1 },
      });

      // Don't retry on validation errors or timeouts
      if (
        lastError.message.includes("Invalid") ||
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
    `OpenRouter multi-day generation failed after ${maxRetries + 1} attempts:`,
    lastError
  );

  const fallback = generateMultiDayFallbackBreakdown(taskTitle, durationDays);

  // Log fallback usage
  trace?.event({
    name: "multi-day-fallback-breakdown-used",
    metadata: { reason: lastError?.message, fallback },
  });

  return fallback;
}
