import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSingleDayBreakdown,
  generateFallbackBreakdown,
  generateMultiDayBreakdown,
  generateMultiDayFallbackBreakdown,
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
    vi.spyOn(console, "error").mockImplementation(() => {});
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
        "user-123",
        0
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
      expect(breakdown).toContain("Start working on: Test task");
    });

    it("should handle API error with fallback", async () => {
      global.fetch = vi
        .fn()
        .mockImplementation(() => Promise.reject(new Error("API Error")));

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123",
        0
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123",
        0
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateSingleDayBreakdown(
        "Test task",
        "user-123",
        0
      );

      // Should return fallback breakdown due to empty steps array
      expect(breakdown).toBeInstanceOf(Array);
      expect(breakdown).toHaveLength(5);
    });

    it("should retry on transient failures", async () => {
      vi.useFakeTimers();
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

      const breakdownPromise = generateSingleDayBreakdown(
        "Test task",
        "user-123"
      );

      await vi.runAllTimersAsync();
      const breakdown = await breakdownPromise;

      expect(callCount).toBe(2); // First call fails, second succeeds
      expect(breakdown).toHaveLength(3);
      vi.useRealTimers();
    });
  });

  describe("generateMultiDayFallbackBreakdown", () => {
    it("should generate fallback breakdown for 7 days", () => {
      const breakdown = generateMultiDayFallbackBreakdown(
        "Build running habit",
        7
      );

      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
      expect(breakdown.day_1).toBeInstanceOf(Array);
      expect(breakdown.day_1).toContain("Prepare for: Build running habit");
      expect(breakdown.day_7).toBeInstanceOf(Array);
    });

    it("should generate fallback breakdown for 30 days", () => {
      const breakdown = generateMultiDayFallbackBreakdown(
        "Meditation practice",
        30
      );

      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(30);
      expect(breakdown.day_1).toBeInstanceOf(Array);
      expect(breakdown.day_30).toBeInstanceOf(Array);
    });

    it("should generate 3 tasks per day in fallback", () => {
      const breakdown = generateMultiDayFallbackBreakdown("Test habit", 7);

      Object.keys(breakdown).forEach((dayKey) => {
        expect(breakdown[dayKey]).toHaveLength(3);
      });
    });
  });

  describe("generateMultiDayBreakdown", () => {
    it("should generate multi-day breakdown with valid API response", async () => {
      const mockResponse = {
        id: "gen-123",
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: JSON.stringify({
                day_1: [
                  "Put running shoes by the door",
                  "Put on running shoes",
                  "Step outside",
                ],
                day_2: ["Put on running shoes", "Walk for 5 minutes"],
                day_3: ["Jog for 2 minutes", "Cool down"],
                day_4: ["Jog for 5 minutes", "Stretch"],
                day_5: ["Jog for 7 minutes", "Cool down"],
                day_6: ["Jog for 10 minutes", "Stretch"],
                day_7: ["Jog for 12 minutes", "Reflect on progress"],
              }),
            },
            finish_reason: "stop",
            index: 0,
          },
        ],
        usage: {
          prompt_tokens: 250,
          completion_tokens: 150,
          total_tokens: 400,
        },
        model: "moonshotai/kimi-k2-0905",
        created: Date.now(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateMultiDayBreakdown(
        "Build running habit",
        7,
        "user-123"
      );

      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
      expect(breakdown.day_1).toBeInstanceOf(Array);
      expect(breakdown.day_1[0]).toBe("Put running shoes by the door");
      expect(breakdown.day_7).toBeInstanceOf(Array);
    });

    it("should handle 30-day breakdown", async () => {
      const mockBreakdown: Record<string, string[]> = {};
      for (let i = 1; i <= 30; i++) {
        mockBreakdown[`day_${i}`] = [
          `Task 1 for day ${i}`,
          `Task 2 for day ${i}`,
        ];
      }

      const mockResponse = {
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: JSON.stringify(mockBreakdown),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 500,
          total_tokens: 1000,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateMultiDayBreakdown(
        "Meditation practice",
        30,
        "user-123"
      );

      expect(Object.keys(breakdown)).toHaveLength(30);
      expect(breakdown.day_1).toBeInstanceOf(Array);
      expect(breakdown.day_30).toBeInstanceOf(Array);
    });

    it("should handle API timeout with fallback", async () => {
      const mockAbortController = {
        signal: {},
        abort: vi.fn(),
      };

      global.AbortController = vi
        .fn()
        .mockImplementation(
          () => mockAbortController
        ) as unknown as typeof AbortController;

      global.fetch = vi.fn().mockImplementation(() => {
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        return Promise.reject(error);
      });

      const breakdown = await generateMultiDayBreakdown(
        "Test habit",
        7,
        "user-123",
        0
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
      expect(breakdown.day_1).toContain("Prepare for: Test habit");
    });

    it("should handle API error with fallback", async () => {
      global.fetch = vi
        .fn()
        .mockImplementation(() => Promise.reject(new Error("API Error")));

      const breakdown = await generateMultiDayBreakdown(
        "Test habit",
        7,
        "user-123",
        0
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateMultiDayBreakdown(
        "Test habit",
        7,
        "user-123",
        0
      );

      // Should return fallback breakdown
      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
    });

    it("should handle empty day breakdown with fallback", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: "assistant" as const,
              content: JSON.stringify({ day_1: [] }), // Empty tasks for day 1
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const breakdown = await generateMultiDayBreakdown(
        "Test habit",
        7,
        "user-123",
        0
      );

      // Should return fallback due to validation error
      expect(breakdown).toBeInstanceOf(Object);
      expect(Object.keys(breakdown)).toHaveLength(7);
      expect(breakdown.day_1).toHaveLength(3); // Fallback has 3 tasks per day
    });

    it("should retry on transient failures", async () => {
      vi.useFakeTimers();
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
                    day_1: ["Task 1", "Task 2"],
                    day_2: ["Task 3", "Task 4"],
                    day_3: ["Task 5", "Task 6"],
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

      const breakdownPromise = generateMultiDayBreakdown(
        "Test habit",
        3,
        "user-123"
      );

      await vi.runAllTimersAsync();
      const breakdown = await breakdownPromise;

      expect(callCount).toBe(2); // First call fails, second succeeds
      expect(Object.keys(breakdown)).toHaveLength(3);
      vi.useRealTimers();
    });
  });
});
