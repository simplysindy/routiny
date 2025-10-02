import { create } from "zustand";
import { taskRepository } from "../services/taskService";
import type { Task } from "../types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface TaskActions {
  createTask: (
    title: string,
    durationDays: number,
    userId: string
  ) => Promise<Task | null>;
  fetchTasks: (userId: string, limit?: number) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addTask: (task: Task) => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  createTask: async (title: string, durationDays: number, userId: string) => {
    set({ loading: true, error: null });

    try {
      // Call API endpoint to leverage OpenRouter for AI breakdown
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          duration_days: durationDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create task");
      }

      const { data } = await response.json();

      if (data) {
        // Optimistic update: add new task to the beginning of the list
        set((state) => ({
          tasks: [data, ...state.tasks],
          loading: false,
          error: null,
        }));
        return data;
      }

      set({ loading: false });
      return null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create task";
      set({ loading: false, error: errorMessage });
      return null;
    }
  },

  fetchTasks: async (userId: string, limit = 5) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await taskRepository.findByUserId(userId, limit);

      if (error) {
        set({
          loading: false,
          error: error.message || "Failed to fetch tasks",
        });
        return;
      }

      set({
        tasks: data || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      set({ loading: false, error: errorMessage });
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  addTask: (task: Task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
  },
}));
