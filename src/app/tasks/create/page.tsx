"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskInput, TaskList } from "@/components/task";
import { useTaskStore } from "@/stores";
import { useAuthStore } from "@/stores";

export default function CreateTaskPage() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const loading = useTaskStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/auth?redirectTo=/tasks/create");
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id, 5);
    }
  }, [user?.id, fetchTasks]);

  // Show loading state while checking auth
  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Create a Task
          </h1>
          <p className="text-base text-gray-600">
            Describe what you need to accomplish, and we&apos;ll help you break
            it down.
          </p>
        </div>

        {/* Task Input Section */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <TaskInput />
        </div>

        {/* Recent Tasks Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Recent Tasks
          </h2>
          {loading && tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>Loading tasks...</p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              emptyMessage="No tasks yet. Create your first one above!"
            />
          )}
        </div>
      </div>
    </div>
  );
}
