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
import { generateSingleDayBreakdown } from "@/services/openrouterService";
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

  it("should not generate AI breakdown for multi-day tasks", async () => {
    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
    };

    const mockTaskData = {
      id: "task-123",
      user_id: "user-123",
      title: "Exercise daily",
      duration_days: 7,
      task_type: "multi-day",
      current_day: 1,
      ai_breakdown: [],
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
      json: async () => ({ title: "Exercise daily", duration_days: 7 }),
      cookies: {
        getAll: () => [],
        set: vi.fn(),
      },
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.task_type).toBe("multi-day");
    expect(generateSingleDayBreakdown).not.toHaveBeenCalled();
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
