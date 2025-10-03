// TypeScript Type Definitions exports
// All shared TypeScript types will be exported from here

export interface User {
  id: string; // UUID from Supabase auth
  email: string;
  streak_count: number;
  total_tasks_completed: number;
  preferences: UserPreferences;
  created_at: string;
  last_active: string;
}

export interface UserPreferences {
  coach_personality: "encouraging" | "neutral" | "playful";
  notification_enabled: boolean;
  theme: "light" | "dark" | "auto";
}

// Step/Task with completion tracking for ai_breakdown
export interface BreakdownStep {
  text: string;
  completed: boolean;
}

export interface MultiDayBreakdown {
  [key: string]: string[] | BreakdownStep[]; // Support backward compatibility
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  duration_days: number;
  task_type: "single-day" | "multi-day";
  current_day: number;
  ai_breakdown: string[] | BreakdownStep[] | MultiDayBreakdown; // Updated to support all formats
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  created_at: string;
}

// API request/response types for step completion
export interface CompleteStepRequest {
  stepIndex: number;
  day?: number;
}

export interface CompleteStepResponse {
  data: Task;
}

// TODO: TaskStep interface for future normalized database design
// Currently unused - step completion is tracked in ai_breakdown JSONB field using BreakdownStep.
// This interface is reserved for future migration to a separate task_steps table for better
// analytics, history tracking, and querying capabilities. See Story 1.7 Dev Notes.
export interface TaskStep {
  id: string;
  task_id: string;
  step_text: string;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
}
