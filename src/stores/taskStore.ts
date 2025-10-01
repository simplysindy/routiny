import { create } from "zustand";
import { taskRepository } from "../services/taskService";
import type { Task } from "../types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface TaskActions {
  createTask: (title: string, userId: string) => Promise<Task | null>;
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

  createTask: async (title: string, userId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await taskRepository.create(title, userId);

      if (error) {
        set({
          loading: false,
          error: error.message || "Failed to create task",
        });
        return null;
      }

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
