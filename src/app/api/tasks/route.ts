import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { config as appConfig, validateOpenRouterConfig } from "@/lib/config";
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
      // Validate OpenRouter configuration
      try {
        validateOpenRouterConfig();
      } catch (error) {
        console.error("OpenRouter configuration error:", error);
        return NextResponse.json(
          {
            error: "Configuration error",
            message:
              error instanceof Error
                ? error.message
                : "AI breakdown feature is not configured",
          },
          { status: 503 }
        );
      }

      // Check rate limit
      const rateLimit = await checkRateLimit(session.user.id);

      if (!rateLimit.allowed) {
        // Log rate limit denial to Langfuse
        const langfuse = getLangfuse();
        langfuse?.event({
          name: "rate-limit-denied",
          metadata: {
            userId: session.user.id,
            allowed: false,
            retryAfter: rateLimit.retryAfter,
            taskTitle: title.trim(),
          },
        });

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
        console.log("Calling OpenRouter for task:", title.trim());
        aiBreakdown = await generateSingleDayBreakdown(
          title.trim(),
          session.user.id
        );
        console.log("OpenRouter returned breakdown:", aiBreakdown);
      } catch (error) {
        console.error("Error generating AI breakdown:", error);
        // Continue with empty breakdown - fallback is handled in service
      }
    }

    // Create task with AI breakdown using server Supabase client
    console.log(
      "Creating task in database with breakdown:",
      aiBreakdown.length,
      "steps"
    );

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: session.user.id,
        title: title.trim(),
        duration_days,
        task_type: taskType,
        current_day: 1,
        ai_breakdown: aiBreakdown,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task in database:", error);
      return NextResponse.json(
        { error: "Failed to create task", details: error.message },
        { status: 500 }
      );
    }

    console.log("Task created successfully:", data?.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/tasks:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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

    // Fetch tasks using server Supabase client
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

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
