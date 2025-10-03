import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import type { BreakdownStep, MultiDayBreakdown } from "@/types";

// Mock Supabase
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

// Mock config
vi.mock("@/lib/config", () => ({
  config: {
    supabase: {
      url: "https://test.supabase.co",
      anonKey: "test-key",
    },
  },
}));

describe("POST /api/tasks/[id]/complete-step", () => {
  let mockSupabase: {
    auth: { getSession: ReturnType<typeof vi.fn> };
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockSession: {
    user: {
      id: string;
      email: string;
    };
  };

  beforeEach(async () => {
    mockSession = {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    };

    const { createServerClient } = await import("@supabase/ssr");
    mockSupabase = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: mockSession } }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    };

    createServerClient.mockReturnValue(mockSupabase);
  });

  it("should mark single-day step as complete", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean room",
      task_type: "single-day",
      ai_breakdown: [
        { text: "Step 1", completed: false },
        { text: "Step 2", completed: false },
      ] as BreakdownStep[],
      status: "pending",
      duration_days: 1,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      ai_breakdown: [
        { text: "Step 1", completed: true },
        { text: "Step 2", completed: false },
      ] as BreakdownStep[],
      status: "in_progress",
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: task, error: null }) // Fetch task
      .mockResolvedValueOnce({ data: updatedTask, error: null }); // Update task

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.ai_breakdown[0].completed).toBe(true);
    expect(data.data.status).toBe("in_progress");
  });

  it("should mark multi-day step as complete", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Learn Guitar",
      task_type: "multi-day",
      ai_breakdown: {
        day_1: [
          { text: "Task 1", completed: false },
          { text: "Task 2", completed: false },
        ],
        day_2: [{ text: "Task 3", completed: false }],
      } as MultiDayBreakdown,
      status: "pending",
      duration_days: 2,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      ai_breakdown: {
        day_1: [
          { text: "Task 1", completed: true },
          { text: "Task 2", completed: false },
        ],
        day_2: [{ text: "Task 3", completed: false }],
      } as MultiDayBreakdown,
      status: "in_progress",
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: task, error: null })
      .mockResolvedValueOnce({ data: updatedTask, error: null });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0, day: 1 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(
      (data.data.ai_breakdown as MultiDayBreakdown).day_1[0].completed
    ).toBe(true);
    expect(data.data.status).toBe("in_progress");
  });

  it("should update status to completed when all steps done", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean room",
      task_type: "single-day",
      ai_breakdown: [
        { text: "Step 1", completed: true },
        { text: "Step 2", completed: false },
      ] as BreakdownStep[],
      status: "in_progress",
      duration_days: 1,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      ai_breakdown: [
        { text: "Step 1", completed: true },
        { text: "Step 2", completed: true },
      ] as BreakdownStep[],
      status: "completed",
      completed_at: new Date().toISOString(),
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: task, error: null })
      .mockResolvedValueOnce({ data: updatedTask, error: null });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 1 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.status).toBe("completed");
    expect(data.data.completed_at).toBeTruthy();
  });

  it("should handle backward compatibility with string[] format", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean room",
      task_type: "single-day",
      ai_breakdown: ["Step 1", "Step 2"],
      status: "pending",
      duration_days: 1,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      ai_breakdown: [
        { text: "Step 1", completed: true },
        { text: "Step 2", completed: false },
      ] as BreakdownStep[],
      status: "in_progress",
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: task, error: null })
      .mockResolvedValueOnce({ data: updatedTask, error: null });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.ai_breakdown[0]).toEqual({
      text: "Step 1",
      completed: true,
    });
  });

  it("should return 401 for unauthenticated requests", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(401);
  });

  it("should return 404 for task not owned by user", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(404);
  });

  it("should validate stepIndex bounds", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean room",
      task_type: "single-day",
      ai_breakdown: [{ text: "Step 1", completed: false }] as BreakdownStep[],
      status: "pending",
      duration_days: 1,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    mockSupabase.single.mockResolvedValue({ data: task, error: null });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 999 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(400);
  });

  it("should validate invalid stepIndex type", async () => {
    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: "invalid" }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(400);
  });

  it("should validate invalid day parameter", async () => {
    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0, day: -1 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(400);
  });

  it("should handle database update errors", async () => {
    const task = {
      id: "task-123",
      user_id: "user-123",
      title: "Clean room",
      task_type: "single-day",
      ai_breakdown: [{ text: "Step 1", completed: false }] as BreakdownStep[],
      status: "pending",
      duration_days: 1,
      current_day: 1,
      completed_at: null,
      created_at: new Date().toISOString(),
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: task, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

    const request = new NextRequest(
      "http://localhost/api/tasks/task-123/complete-step",
      {
        method: "POST",
        body: JSON.stringify({ stepIndex: 0 }),
      }
    );

    const response = await POST(request, { params: { id: "task-123" } });
    expect(response.status).toBe(500);
  });
});
