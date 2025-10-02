// TypeScript types for OpenRouter API

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
  stream?: boolean;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChoice {
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: string;
  index: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
  model: string;
  created: number;
}

export interface TaskBreakdownResponse {
  steps: string[];
}
