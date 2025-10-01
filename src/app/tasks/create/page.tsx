'use client';

import { useEffect } from 'react';
import { TaskInput, TaskList } from '@/components/task';
import { useTaskStore } from '@/stores';
import { useAuthStore } from '@/stores';

export default function CreateTaskPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const loading = useTaskStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id, 5);
    }
  }, [user?.id, fetchTasks]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create a Task
          </h1>
          <p className="text-base text-gray-600">
            Describe what you need to accomplish, and we&apos;ll help you break it down.
          </p>
        </div>

        {/* Task Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-8">
          <TaskInput />
        </div>

        {/* Recent Tasks Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Tasks
          </h2>
          {loading && tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
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
