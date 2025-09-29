import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../../services/userService";
import { mockSupabaseClient } from "../setup";
import type { User } from "../../types";

describe("UserService", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    streak_count: 5,
    total_tasks_completed: 10,
    preferences: {
      coach_personality: "encouraging",
      notification_enabled: true,
      theme: "light",
    },
    created_at: "2024-01-01T00:00:00Z",
    last_active: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserProfile", () => {
    it("should fetch user profile successfully", async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await UserService.getUserProfile("1");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(result.data).toEqual(mockUser);
      expect(result.error).toBe(null);
    });

    it("should handle fetch error", async () => {
      const error = new Error("User not found");
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error,
      });

      const result = await UserService.getUserProfile("1");

      expect(result.data).toBe(null);
      expect(result.error).toBe(error);
    });
  });

  describe("updateUserProfile", () => {
    it("should update user profile successfully", async () => {
      const updates = { streak_count: 10 };
      const updatedUser = { ...mockUser, ...updates };

      mockSupabaseClient.from().select().single.mockResolvedValue({
        data: updatedUser,
        error: null,
      });

      const result = await UserService.updateUserProfile("1", updates);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(result.data).toEqual(updatedUser);
      expect(result.error).toBe(null);
    });
  });

  describe("updateUserPreferences", () => {
    it("should update user preferences successfully", async () => {
      const newPreferences = { theme: "dark" as const };
      const expectedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          ...newPreferences,
        },
      };

      // Mock getUserProfile call
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockUser,
        error: null,
      });

      // Mock updateUserProfile call
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: expectedUser,
        error: null,
      });

      const result = await UserService.updateUserPreferences(
        "1",
        newPreferences
      );

      expect(result.data?.preferences.theme).toBe("dark");
      expect(result.error).toBe(null);
    });

    it("should handle user not found", async () => {
      const error = new Error("User not found");
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error,
      });

      const result = await UserService.updateUserPreferences("1", {
        theme: "dark",
      });

      expect(result.data).toBe(null);
      expect(result.error).toBe(error);
    });
  });

  describe("updateLastActive", () => {
    it("should update last active successfully", async () => {
      mockSupabaseClient.from().eq.mockResolvedValue({ error: null });

      const result = await UserService.updateLastActive("1");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(result.error).toBe(null);
    });
  });

  describe("deleteUserProfile", () => {
    it("should delete user profile successfully", async () => {
      mockSupabaseClient.from().delete().eq.mockResolvedValue({ error: null });

      const result = await UserService.deleteUserProfile("1");

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      expect(result.error).toBe(null);
    });
  });
});
