import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock("@/services/openrouterService", () => ({
  generateSingleDayBreakdown: vi.fn(),
  generateMultiDayBreakdown: vi.fn(),
  generateMultiDayFallbackBreakdown: vi.fn(),
}));

vi.mock("@/lib/rateLimiter", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/langfuse", () => ({
  getLangfuse: () => null,
}));

vi.mock("@/lib/config", () => ({
  config: {
    supabase: {
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    },
    openRouter: {
      apiKey: "test-api-key",
    },
  },
  validateOpenRouterConfig: vi.fn(), // Mock the validation function
}));

import { createServerClient } from "@supabase/ssr";
import {
  generateSingleDayBreakdown,
  generateMultiDayBreakdown,
  generateMultiDayFallbackBreakdown,
} from "@/services/openrouterService";
import { checkRateLimit } from "@/lib/rateLimiter";

describe("POST /api/tasks - AI Breakdown Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create single-day task with AI breakdown", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean my room",
      duration_days: 1,
      task_type: "single-day",
      current_day: 1,
      ai_breakdown: [
        "Gather cleaning supplies",
        "Pick up items from floor",
        "Wipe surfaces",
        "Vacuum floor",
        "Make bed",
      ],
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockTaskData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    vi.mocked(generateSingleDayBreakdown).mockResolvedValue([
      "Gather cleaning supplies",
      "Pick up items from floor",
      "Wipe surfaces",
      "Vacuum floor",
      "Make bed",
    ]);

    const mockRequest = {
      json: async () => ({ title: "Clean my room", duration_days: 1 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.ai_breakdown).toBeInstanceOf(Array);
    expect(data.data.ai_breakdown.length).toBeGreaterThan(0);
    expect(data.data.task_type).toBe("single-day");
    expect(generateSingleDayBreakdown).toHaveBeenCalledWith(
      "Clean my room",
      "user-123"
    );
  });

  it("should handle rate limiting", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfter: 3600,
    });

    const mockRequest = {
      json: async () => ({ title: "Test task", duration_days: 1 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Rate limit exceeded");
    expect(data.retryAfter).toBe(3600);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("should use fallback breakdown on OpenRouter failure", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    // Mock OpenRouter failure - it will use fallback internally
    vi.mocked(generateSingleDayBreakdown).mockResolvedValue([
      "Gather any materials or tools you'll need",
      "Start working on: Test task",
      "Complete the main task",
      "Review your work",
      "Mark the task as complete",
    ]);

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Test task",
      duration_days: 1,
      task_type: "single-day",
      current_day: 1,
      ai_breakdown: [
        "Gather any materials or tools you'll need",
        "Start working on: Test task",
        "Complete the main task",
        "Review your work",
        "Mark the task as complete",
      ],
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockTaskData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    const mockRequest = {
      json: async () => ({ title: "Test task", duration_days: 1 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.ai_breakdown).toBeInstanceOf(Array);
    expect(data.data.ai_breakdown[1]).toContain("Start working on:");
  });

  it("should create multi-day task with AI breakdown", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    const mockMultiDayBreakdown = {
      day_1: ["Put on running shoes", "Walk for 2 minutes"],
      day_2: ["Put on running shoes", "Jog for 1 minute"],
      day_3: ["Jog for 2 minutes", "Cool down"],
      day_4: ["Jog for 5 minutes", "Stretch"],
      day_5: ["Jog for 7 minutes", "Cool down"],
      day_6: ["Jog for 10 minutes", "Stretch"],
      day_7: ["Jog for 12 minutes", "Reflect on progress"],
    };

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Build running habit",
      duration_days: 7,
      task_type: "multi-day",
      current_day: 1,
      ai_breakdown: mockMultiDayBreakdown,
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockTaskData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    vi.mocked(generateMultiDayBreakdown).mockResolvedValue(
      mockMultiDayBreakdown
    );

    const mockRequest = {
      json: async () => ({ title: "Build running habit", duration_days: 7 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.task_type).toBe("multi-day");
    expect(data.data.ai_breakdown).toBeInstanceOf(Object);
    expect(Object.keys(data.data.ai_breakdown)).toHaveLength(7);
    expect(generateSingleDayBreakdown).not.toHaveBeenCalled();
    expect(generateMultiDayBreakdown).toHaveBeenCalledWith(
      "Build running habit",
      7,
      "user-123"
    );
  });

  it("should use fallback for multi-day on OpenRouter failure", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    const mockFallbackBreakdown = {
      day_1: [
        "Prepare for: Test habit",
        "Practice day 1 of 7",
        "Reflect on progress",
      ],
      day_2: [
        "Prepare for: Test habit",
        "Practice day 2 of 7",
        "Reflect on progress",
      ],
      day_3: [
        "Prepare for: Test habit",
        "Practice day 3 of 7",
        "Reflect on progress",
      ],
      day_4: [
        "Prepare for: Test habit",
        "Practice day 4 of 7",
        "Reflect on progress",
      ],
      day_5: [
        "Prepare for: Test habit",
        "Practice day 5 of 7",
        "Reflect on progress",
      ],
      day_6: [
        "Prepare for: Test habit",
        "Practice day 6 of 7",
        "Reflect on progress",
      ],
      day_7: [
        "Prepare for: Test habit",
        "Practice day 7 of 7",
        "Reflect on progress",
      ],
    };

    // Mock OpenRouter failure
    vi.mocked(generateMultiDayBreakdown).mockRejectedValue(
      new Error("API Error")
    );

    vi.mocked(generateMultiDayFallbackBreakdown).mockReturnValue(
      mockFallbackBreakdown
    );

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Test habit",
      duration_days: 7,
      task_type: "multi-day",
      current_day: 1,
      ai_breakdown: mockFallbackBreakdown,
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockTaskData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    const mockRequest = {
      json: async () => ({ title: "Test habit", duration_days: 7 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.task_type).toBe("multi-day");
    expect(data.data.ai_breakdown).toBeInstanceOf(Object);
    expect(Object.keys(data.data.ai_breakdown)).toHaveLength(7);
    expect(generateMultiDayFallbackBreakdown).toHaveBeenCalledWith(
      "Test habit",
      7
    );
  });

  it("should handle 30-day multi-day breakdown", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    const mock30DayBreakdown: Record<string, string[]> = {};
    for (let i = 1; i <= 30; i++) {
      mock30DayBreakdown[`day_${i}`] = [
        `Task 1 for day ${i}`,
        `Task 2 for day ${i}`,
      ];
    }

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Meditation practice",
      duration_days: 30,
      task_type: "multi-day",
      current_day: 1,
      ai_breakdown: mock30DayBreakdown,
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const mockSingle = vi
      .fn()
      .mockResolvedValue({ data: mockTaskData, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: mockFrom,
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });

    vi.mocked(generateMultiDayBreakdown).mockResolvedValue(mock30DayBreakdown);

    const mockRequest = {
      json: async () => ({
        title: "Meditation practice",
        duration_days: 30,
      }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.task_type).toBe("multi-day");
    expect(Object.keys(data.data.ai_breakdown)).toHaveLength(30);
    expect(generateMultiDayBreakdown).toHaveBeenCalledWith(
      "Meditation practice",
      30,
      "user-123"
    );
  });

  it("should require authentication", async () => {
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      },
    };

    vi.mocked(createServerClient).mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );

    const mockRequest = {
      json: async () => ({ title: "Test task", duration_days: 1 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
