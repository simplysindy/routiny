import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { config as appConfig } from "@/lib/config";
import { taskRepository } from "@/services";
import { generateSingleDayBreakdown } from "@/services/openrouterService";
import { checkRateLimit } from "@/lib/rateLimiter";
import { getLangfuse } from "@/lib/langfuse";
import type { Database } from "@/types/database";

/**
 * POST /api/tasks - Create a new task
 * Story 1.5: AI breakdown integration for single-day tasks with OpenRouter
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies
    const supabase = createServerClient<Database>(
      appConfig.supabase.url,
      appConfig.supabase.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { title, duration_days = 1 } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Validate duration_days
    if (
      !Number.isInteger(duration_days) ||
      duration_days < 1 ||
      duration_days > 365
    ) {
      return NextResponse.json(
        {
          error: "Invalid duration",
          message: "Duration must be a positive integer between 1 and 365 days",
        },
        { status: 400 }
      );
    }

    // Calculate task type
    const taskType = duration_days === 1 ? "single-day" : "multi-day";
    let aiBreakdown: string[] = [];

    // Generate AI breakdown for single-day tasks
    if (taskType === "single-day") {
      // Check rate limit
      const rateLimit = await checkRateLimit(session.user.id);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "You've reached the hourly limit for AI breakdowns. Please try again later.",
            retryAfter: rateLimit.retryAfter,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfter || 3600),
            },
          }
        );
      }

      // Log rate limit event to Langfuse
      const langfuse = getLangfuse();
      langfuse?.event({
        name: "rate-limit-check",
        metadata: {
          userId: session.user.id,
          allowed: true,
          taskTitle: title.trim(),
        },
      });

      // Generate AI breakdown
      try {
        aiBreakdown = await generateSingleDayBreakdown(
          title.trim(),
          session.user.id
        );
      } catch (error) {
        console.error("Error generating AI breakdown:", error);
        // Continue with empty breakdown - fallback is handled in service
      }
    }

    // Create task with AI breakdown
    const { data, error } = await taskRepository.create(
      title.trim(),
      duration_days,
      session.user.id,
      aiBreakdown
    );

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks - Fetch user's tasks
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies
    const supabase = createServerClient<Database>(
      appConfig.supabase.url,
      appConfig.supabase.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options });
            });
          },
        },
      }
    );

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    // Fetch tasks
    const { data, error } = await taskRepository.findByUserId(
      session.user.id,
      limit
    );

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in GET /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
