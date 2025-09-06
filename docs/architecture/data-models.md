# Data Models

## User

**Purpose:** Represents authenticated users with streak and preference data

**Key Attributes:**

- id: string (UUID) - Supabase auth user ID
- email: string - Authentication identifier
- streak_count: number - Current consecutive days
- total_tasks_completed: number - Lifetime task completion count
- preferences: object - UI and notification settings
- created_at: timestamp - Account creation
- last_active: timestamp - Recent activity for streak calculation

### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  streak_count: number;
  total_tasks_completed: number;
  preferences: UserPreferences;
  created_at: string;
  last_active: string;
}

interface UserPreferences {
  coach_personality: "encouraging" | "neutral" | "playful";
  notification_enabled: boolean;
  theme: "light" | "dark" | "auto";
}
```

### Relationships

- Has many Tasks (one-to-many)
- Has many TaskSteps through Tasks

## Task

**Purpose:** User-created tasks that get broken down into micro-steps by AI

**Key Attributes:**

- id: string (UUID) - Unique identifier
- user_id: string - Foreign key to User
- title: string - Original task description
- ai_breakdown: string[] - AI-generated micro-steps
- status: enum - pending, in_progress, completed
- completed_at: timestamp - Completion time for streak calculation
- created_at: timestamp - Task creation time

### TypeScript Interface

```typescript
interface Task {
  id: string;
  user_id: string;
  title: string;
  ai_breakdown: string[];
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  created_at: string;
}
```

### Relationships

- Belongs to User (many-to-one)
- Has many TaskSteps (one-to-many)

## TaskStep

**Purpose:** Individual micro-steps within a task with completion tracking

**Key Attributes:**

- id: string (UUID) - Unique identifier
- task_id: string - Foreign key to Task
- step_text: string - AI-generated step description
- order_index: number - Step sequence (0-based)
- completed: boolean - Completion status
- completed_at: timestamp - When step was marked complete

### TypeScript Interface

```typescript
interface TaskStep {
  id: string;
  task_id: string;
  step_text: string;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
}
```

### Relationships

- Belongs to Task (many-to-one)
- Belongs to User through Task
