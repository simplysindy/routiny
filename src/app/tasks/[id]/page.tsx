import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { config as appConfig } from "@/lib/config";
import type { Database } from "@/types/database";
import type { BreakdownStep, MultiDayBreakdown, Task } from "@/types";
import TaskDetailWrapper from "./TaskDetailWrapper";
interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

function normalizeTask(
  task: Database["public"]["Tables"]["tasks"]["Row"]
): Task {
  const taskType = task.task_type === "multi-day" ? "multi-day" : "single-day";

  const rawBreakdown = task.ai_breakdown;

  let aiBreakdown: Task["ai_breakdown"];
  if (taskType === "single-day") {
    aiBreakdown = Array.isArray(rawBreakdown)
      ? (rawBreakdown as string[] | BreakdownStep[])
      : ([] as BreakdownStep[]);
  } else {
    aiBreakdown =
      rawBreakdown && !Array.isArray(rawBreakdown)
        ? (rawBreakdown as MultiDayBreakdown)
        : ({} as MultiDayBreakdown);
  }

  return {
    id: task.id,
    user_id: task.user_id,
    title: task.title,
    duration_days: task.duration_days ?? 1,
    task_type: taskType,
    current_day: task.current_day ?? 1,
    ai_breakdown: aiBreakdown,
    status: task.status as Task["status"],
    completed_at: task.completed_at,
    created_at: task.created_at,
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  // Create Supabase client for server component
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          const mutableCookies = cookieStore as unknown as {
            set: (cookie: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }) => void;
          };

          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookies.set({ name, value, options });
          });
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to auth if not authenticated
  if (!session?.user) {
    redirect(`/auth?redirectTo=/tasks/${params.id}`);
  }

  // Fetch task data with ownership validation
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single();

  // Handle errors
  if (error || !task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-md">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Task Not Found
          </h1>
          <p className="mb-4 text-gray-600">
            The task you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to view it.
          </p>
          <Link
            href="/tasks/create"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Go to Tasks
          </Link>
        </div>
      </div>
    );
  }

  // Render client wrapper with task data
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        <TaskDetailWrapper task={normalizeTask(task)} />
      </div>
    </div>
  );
}
