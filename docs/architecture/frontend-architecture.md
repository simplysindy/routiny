# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── components/
│   ├── ui/              # Headless UI + custom base components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── task/            # Task-related components
│   │   ├── TaskInput.tsx
│   │   ├── TaskCard.tsx
│   │   ├── StepList.tsx
│   │   └── StepItem.tsx
│   ├── coach/           # Coach character components
│   │   ├── CoachAvatar.tsx
│   │   └── CoachMessage.tsx
│   └── layout/          # Layout components
│       ├── Header.tsx
│       ├── Navigation.tsx
│       └── PWAPrompt.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── useOffline.ts
└── stores/              # Zustand state stores
    ├── authStore.ts
    ├── taskStore.ts
    └── uiStore.ts
```

### Component Template

```typescript
import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  children?: ReactNode;
  className?: string;
  // Add specific props here
}

const Component: FC<ComponentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("default-styles", className)} {...props}>
      {children}
    </div>
  );
};

export default Component;
```

## State Management Architecture

### State Structure

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

// Task Store
interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  createTask: (title: string) => Promise<Task>;
  completeStep: (taskId: string, stepIndex: number) => Promise<void>;
  fetchTasks: () => Promise<void>;
}

// UI Store
interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "auto";
  coachVisible: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
  showCoach: (show: boolean) => void;
}
```

### State Management Patterns

- Single store per domain (auth, tasks, UI)
- Async actions return promises for error handling
- Optimistic updates for better UX
- Persistence via Supabase real-time subscriptions
- Local state for UI-only concerns

## Routing Architecture

### Route Organization

```
app/
├── page.tsx                 # Home/dashboard (/)
├── auth/
│   └── page.tsx            # Magic link auth (/auth)
├── tasks/
│   ├── page.tsx            # Task list (/tasks)
│   ├── create/
│   │   └── page.tsx        # Task creation (/tasks/create)
│   └── [id]/
│       └── page.tsx        # Task detail (/tasks/[id])
├── streaks/
│   └── page.tsx            # Streak dashboard (/streaks)
├── settings/
│   └── page.tsx            # User settings (/settings)
├── layout.tsx              # Root layout with providers
└── loading.tsx             # Global loading UI
```

### Protected Route Pattern

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <div>Protected content</div>
  );
}
```

## Frontend Services Layer

### API Client Setup

```typescript
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

// Supabase client singleton
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// HTTP client for API routes
export const api = {
  async post<T>(url: string, data: any): Promise<T> {
    const response = await fetch(`/api${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async get<T>(url: string): Promise<T> {
    const response = await fetch(`/api${url}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
```

### Service Example

```typescript
import { api, supabase } from "@/lib/clients";
import { Task, CreateTaskRequest } from "@/types";

export const taskService = {
  // Create task via API route (includes AI processing)
  async createTask(title: string): Promise<Task> {
    return api.post<Task>("/tasks", { title });
  },

  // Fetch tasks directly from Supabase
  async fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        task_steps (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Complete step via API route (includes streak logic)
  async completeStep(taskId: string, stepId: string): Promise<void> {
    return api.post(`/tasks/${taskId}/steps/${stepId}/complete`, {});
  },
};
```
