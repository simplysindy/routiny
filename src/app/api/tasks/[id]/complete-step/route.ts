import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { config as appConfig } from '@/lib/config';
import type { Database } from '@/types/database';
import type { BreakdownStep, MultiDayBreakdown } from '@/types';

/**
 * Helper: Update breakdown with completion flag
 */
function updateBreakdownCompletion(
  breakdown: string[] | BreakdownStep[] | MultiDayBreakdown,
  stepIndex: number,
  day: number | undefined,
  taskType: 'single-day' | 'multi-day'
): BreakdownStep[] | MultiDayBreakdown {
  if (taskType === 'single-day') {
    const steps = Array.isArray(breakdown) ? breakdown : [];

    // Handle backward compatibility: migrate string[] to object[] if needed
    const normalizedSteps: BreakdownStep[] = steps.map((step) =>
      typeof step === 'string' ? { text: step, completed: false } : (step as BreakdownStep)
    );

    if (stepIndex >= 0 && stepIndex < normalizedSteps.length) {
      normalizedSteps[stepIndex] = {
        ...normalizedSteps[stepIndex],
        completed: true,
      };
    }

    return normalizedSteps;
  } else {
    // Multi-day
    const multiBreakdown = { ...breakdown } as MultiDayBreakdown;
    const dayKey = `day_${day || 1}`;

    if (multiBreakdown[dayKey]) {
      const dayTasks = Array.isArray(multiBreakdown[dayKey])
        ? multiBreakdown[dayKey]
        : [];

      const normalizedTasks: BreakdownStep[] = dayTasks.map((task) =>
        typeof task === 'string' ? { text: task, completed: false } : (task as BreakdownStep)
      );

      if (stepIndex >= 0 && stepIndex < normalizedTasks.length) {
        normalizedTasks[stepIndex] = {
          ...normalizedTasks[stepIndex],
          completed: true,
        };
      }

      multiBreakdown[dayKey] = normalizedTasks;
    }

    return multiBreakdown;
  }
}

/**
 * Helper: Check if all steps/tasks are complete
 */
function checkAllComplete(
  breakdown: BreakdownStep[] | MultiDayBreakdown,
  taskType: 'single-day' | 'multi-day'
): boolean {
  if (taskType === 'single-day') {
    const steps = Array.isArray(breakdown) ? breakdown : [];
    return (
      steps.length > 0 &&
      steps.every(
        (step) => typeof step === 'object' && 'completed' in step && step.completed === true
      )
    );
  } else {
    // Multi-day: check all days
    const multiBreakdown = breakdown as MultiDayBreakdown;
    const dayKeys = Object.keys(multiBreakdown).filter((key) =>
      key.startsWith('day_')
    );

    if (dayKeys.length === 0) {
      return false;
    }

    return dayKeys.every((dayKey) => {
      const dayTasks = multiBreakdown[dayKey];
      return (
        Array.isArray(dayTasks) &&
        dayTasks.length > 0 &&
        dayTasks.every(
          (task) => typeof task === 'object' && 'completed' in task && task.completed === true
        )
      );
    });
  }
}

/**
 * POST /api/tasks/[id]/complete-step - Mark a task step as complete
 * Story 1.7: Day-by-Day Task Display and Navigation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { stepIndex, day } = await request.json();

    // Validate input
    if (typeof stepIndex !== 'number' || stepIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid stepIndex' },
        { status: 400 }
      );
    }

    if (day !== undefined && (typeof day !== 'number' || day < 1)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    // Fetch task and validate ownership
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !task) {
      // Return 404 instead of 403 to avoid enumeration attacks
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Validate stepIndex bounds
    const breakdown = task.ai_breakdown;
    if (task.task_type === 'single-day') {
      const steps = Array.isArray(breakdown) ? breakdown : [];
      if (stepIndex >= steps.length) {
        return NextResponse.json(
          { error: 'Invalid stepIndex' },
          { status: 400 }
        );
      }
    } else {
      const dayKey = `day_${day || 1}`;
      const multiBreakdown = breakdown as MultiDayBreakdown;
      const dayTasks = multiBreakdown[dayKey];

      if (!dayTasks || !Array.isArray(dayTasks) || stepIndex >= dayTasks.length) {
        return NextResponse.json(
          { error: 'Invalid stepIndex or day' },
          { status: 400 }
        );
      }
    }

    // Update ai_breakdown with completion flag
    const updatedBreakdown = updateBreakdownCompletion(
      task.ai_breakdown,
      stepIndex,
      day,
      task.task_type
    );

    // Calculate new status
    const allComplete = checkAllComplete(updatedBreakdown, task.task_type);
    const hasAnyComplete =
      task.task_type === 'single-day'
        ? Array.isArray(updatedBreakdown) &&
          updatedBreakdown.some(
            (step) => typeof step === 'object' && 'completed' in step && step.completed === true
          )
        : Object.values(updatedBreakdown as MultiDayBreakdown).some(
            (dayTasks) =>
              Array.isArray(dayTasks) &&
              dayTasks.some(
                (task) =>
                  typeof task === 'object' && 'completed' in task && task.completed === true
              )
          );

    const newStatus = allComplete
      ? 'completed'
      : hasAnyComplete
        ? 'in_progress'
        : 'pending';

    // Update task in database
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        ai_breakdown: updatedBreakdown,
        status: newStatus,
        completed_at: allComplete ? new Date().toISOString() : null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedTask }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in POST /api/tasks/[id]/complete-step:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
