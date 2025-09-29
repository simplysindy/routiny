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

export interface Task {
  id: string;
  user_id: string;
  title: string;
  ai_breakdown: string[];
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  created_at: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_text: string;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
}
