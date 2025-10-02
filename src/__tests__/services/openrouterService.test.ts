import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSingleDayBreakdown,
  generateFallbackBreakdown,
} from "@/services/openrouterService";

// Mock the config module
vi.mock("@/lib/config", () => ({
  config: {
    openRouter: {
      apiKey: "test-api-key",
      model: "moonshotai/kimi-k2-0905",
      temperature: 0.7,
      timeoutMs: 10000,
      maxRetries: 2,
    },
  },
}));

// Mock langfuse
vi.mock("@/lib/langfuse", () => ({
  getLangfuse: () => null,
}));

describe("openrouterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFallbackBreakdown", () => {
    it("should generate fallback breakdown with task title", () => {
      const breakdown = generateFallbackBreakdown("Clean my room");

      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown.length).toBeGreaterThan(0);
      expect(breakdown).toContain("Start working on: Clean my room");
      expect(breakdown[0]).toContain("Gather any materials");
    });

    it("should return 5 steps for fallback", () => {
      const breakdown = generateFallbackBreakdown("Test task");
      expect(breakdown).toHaveLength(5);
    });
  });

  describe("generateSingleDayBreakdown", () => {
    it("should generate breakdown with valid API response", async () => {
      const mockResponse = {
        id: "gen-123",
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: JSON.stringify({
                steps: [
                  "Open email client",
                  "Click compose",
                  "Write email",
                  "Send email",
                ],
              }),
            },
            finish_reason: "stop",
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        model: "moonshotai/kimi-k2-0905",
        created: Date.now(),
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateSingleDayBreakdown(
        "Send email to boss",
        "user-123"
      );

      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(4);
      expect(breakdown[0]).toBe("Open email client");
    });

    it("should handle API timeout with fallback", async () => {
      // Mock AbortController to trigger timeout
      const mockAbortController = {
        signal: {},
        abort: vi.fn(),
      };

      global.AbortController = vi
        .fn()
        .mockImplementation(
          () => mockAbortController
        ) as unknown as typeof AbortController;

      // Simulate timeout error
      global.fetch = vi.fn().mockImplementation(() => {
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        return Promise.reject(error);
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
      expect(breakdown).toContain("Start working on: Test task");
    });

    it("should handle API error with fallback", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("API Error"));

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
    });

    it("should handle invalid JSON response with fallback", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: "Invalid JSON",
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
    });

    it("should handle empty response with fallback", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: JSON.stringify({ steps: [] }),
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      // Should return fallback breakdown due to empty steps array
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
    });

    it("should retry on transient failures", async () => {
      let callCount = 0;

      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Transient error"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  role: "assistant" as const,
                  content: JSON.stringify({
                    steps: ["Step 1", "Step 2", "Step 3"],
                  }),
                },
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          }),
        });
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      expect(callCount).toBe(2); // First call fails, second succeeds
      expect(breakdown).toHaveLength(3);
    });
  });
});
