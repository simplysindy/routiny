import { supabase } from "../lib/clients";
import type { Task } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "../types/database";

export class TaskService {
  /**
   * Create a new task
   * Note: AI breakdown will be added in Story 1.4
   */
  static async createTask(
    title: string,
    userId: string
  ): Promise<{ data: Task | null; error: PostgrestError | Error | null }> {
    try {
      const insertPayload: Database["public"]["Tables"]["tasks"]["Insert"] = {
        user_id: userId,
        title,
        ai_breakdown: [], // Will be populated by AI in Story 1.4
        status: "pending",
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(insertPayload)
        .select()
        .single();

      return { data: data as Task | null, error };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error("Failed to create task"),
      };
    }
  }

  /**
   * Fetch user's recent tasks
   * @param userId - User ID
   * @param limit - Number of tasks to fetch (default: 5)
   */
  static async fetchTasks(
    userId: string,
    limit: number = 5
  ): Promise<{ data: Task[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data: data as Task[] | null, error };
  }

  /**
   * Fetch a single task by ID
   */
  static async getTaskById(
    taskId: string
  ): Promise<{ data: Task | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    return { data: data as Task | null, error };
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    status: Task["status"]
  ): Promise<{ data: Task | null; error: PostgrestError | null }> {
    const updateData: Database["public"]["Tables"]["tasks"]["Update"] = {
      status,
    };

    // Set completed_at when task is completed
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single();

    return { data: data as Task | null, error };
  }

  /**
   * Delete a task
   */
  static async deleteTask(
    taskId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    return { error };
  }
}

// Repository functions for direct use
export const taskRepository = {
  create: (title: string, userId: string) =>
    TaskService.createTask(title, userId),
  findByUserId: (userId: string, limit?: number) =>
    TaskService.fetchTasks(userId, limit),
  findById: (taskId: string) => TaskService.getTaskById(taskId),
  updateStatus: (taskId: string, status: Task["status"]) =>
    TaskService.updateTaskStatus(taskId, status),
  delete: (taskId: string) => TaskService.deleteTask(taskId),
};
