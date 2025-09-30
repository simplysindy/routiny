import { supabase } from "../lib/clients";
import type { User, UserPreferences } from "../types";
import type { PostgrestError } from "@supabase/supabase-js";

export class UserService {
  // Auth methods
  static async signInWithEmail(email: string, redirectTo?: string) {
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          redirectTo || `${window.location.origin}/auth/callback`,
      },
    });
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async getSession() {
    return await supabase.auth.getSession();
  }

  static onAuthStateChange(
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // User profile methods
  static async getUserProfile(
    userId: string
  ): Promise<{ data: User | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  }

  static async updateUserProfile(
    userId: string,
    updates: Partial<Omit<User, "id" | "created_at">>
  ): Promise<{ data: User | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("users")
      .update(updates as never)
      .eq("id", userId)
      .select()
      .single();

    return { data: data as User | null, error };
  }

  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<{ data: User | null; error: PostgrestError | Error | null }> {
    const { data: currentUser, error: fetchError } =
      await this.getUserProfile(userId);

    if (fetchError || !currentUser) {
      return { data: null, error: fetchError || new Error("User not found") };
    }

    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences,
    };

    return this.updateUserProfile(userId, { preferences: updatedPreferences });
  }

  static async updateLastActive(
    userId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() } as never)
      .eq("id", userId);

    return { error };
  }

  static async incrementTasksCompleted(
    userId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase.rpc("increment_tasks_completed", {
      user_id: userId,
    } as never);

    return { error };
  }

  static async updateStreakCount(
    userId: string,
    streakCount: number
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase
      .from("users")
      .update({ streak_count: streakCount } as never)
      .eq("id", userId);

    return { error };
  }

  static async deleteUserProfile(
    userId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase.from("users").delete().eq("id", userId);

    return { error };
  }
}

// Repository functions for direct use
export const userRepository = {
  // Auth
  signIn: (email: string, redirectTo?: string) =>
    UserService.signInWithEmail(email, redirectTo),
  signOut: () => UserService.signOut(),
  getSession: () => UserService.getSession(),
  onAuthStateChange: (
    callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
  ) => UserService.onAuthStateChange(callback),
  // User profile
  findById: (userId: string) => UserService.getUserProfile(userId),
  update: (userId: string, updates: Partial<Omit<User, "id" | "created_at">>) =>
    UserService.updateUserProfile(userId, updates),
  updatePreferences: (userId: string, preferences: Partial<UserPreferences>) =>
    UserService.updateUserPreferences(userId, preferences),
  updateLastActive: (userId: string) => UserService.updateLastActive(userId),
  delete: (userId: string) => UserService.deleteUserProfile(userId),
};
