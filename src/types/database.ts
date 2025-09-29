export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          streak_count: number
          total_tasks_completed: number
          preferences: {
            coach_personality: "encouraging" | "neutral" | "playful"
            notification_enabled: boolean
            theme: "light" | "dark" | "auto"
          }
          created_at: string
          last_active: string
        }
        Insert: {
          id: string
          email: string
          streak_count?: number
          total_tasks_completed?: number
          preferences?: {
            coach_personality?: "encouraging" | "neutral" | "playful"
            notification_enabled?: boolean
            theme?: "light" | "dark" | "auto"
          }
          created_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          email?: string
          streak_count?: number
          total_tasks_completed?: number
          preferences?: {
            coach_personality?: "encouraging" | "neutral" | "playful"
            notification_enabled?: boolean
            theme?: "light" | "dark" | "auto"
          }
          created_at?: string
          last_active?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          ai_breakdown: string[]
          status: "pending" | "in_progress" | "completed"
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          ai_breakdown?: string[]
          status?: "pending" | "in_progress" | "completed"
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          ai_breakdown?: string[]
          status?: "pending" | "in_progress" | "completed"
          completed_at?: string | null
          created_at?: string
        }
      }
      task_steps: {
        Row: {
          id: string
          task_id: string
          step_text: string
          order_index: number
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          step_text: string
          order_index: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          step_text?: string
          order_index?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}