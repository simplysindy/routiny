import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MultiDayTaskDisplay from "@/components/task/MultiDayTaskDisplay";
import type { Task, MultiDayBreakdown } from "@/types";

describe("MultiDayTaskDisplay", () => {
  const mockTask: Task = {
    id: "task-1",
    user_id: "user-1",
    title: "Learn Guitar",
    ai_breakdown: {
      day_1: [
        { text: "Learn basic chords", completed: false },
        { text: "Practice finger placement", completed: false },
      ],
      day_2: [
        { text: "Practice chord transitions", completed: false },
        { text: "Learn simple song", completed: false },
      ],
      day_3: [
        { text: "Practice scales", completed: false },
        { text: "Play along with song", completed: false },
      ],
    } as MultiDayBreakdown,
    duration_days: 3,
    task_type: "multi-day",
    current_day: 1,
    status: "pending",
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  it("should render task title", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Learn Guitar")).toBeInTheDocument();
  });

  it("should render task duration and current day", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("3-day habit • Day 1 of 3")).toBeInTheDocument();
  });

  it("should render day indicator in navigation", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Day 1 of 3")).toBeInTheDocument();
  });

  it("should highlight current day", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("(Current)")).toBeInTheDocument();
  });

  it("should render current day tasks by default", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Learn basic chords")).toBeInTheDocument();
    expect(screen.getByText("Practice finger placement")).toBeInTheDocument();
    // Day 2 tasks should not be visible
    expect(
      screen.queryByText("Practice chord transitions")
    ).not.toBeInTheDocument();
  });

  it("should display per-day progress indicator", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("0% - 0/2 completed")).toBeInTheDocument();
  });

  it("should display overall progress indicator", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Overall Progress")).toBeInTheDocument();
  });

  it("should navigate to next day when next button clicked", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);

    const nextButton = screen.getByText("Next →");
    fireEvent.click(nextButton);

    expect(screen.getByText("Day 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Practice chord transitions")).toBeInTheDocument();
  });

  it("should navigate to previous day when prev button clicked", () => {
    const task = { ...mockTask, current_day: 2 };
    render(<MultiDayTaskDisplay task={task} />);

    const prevButton = screen.getByText("← Previous");
    fireEvent.click(prevButton);

    expect(screen.getByText("Day 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Learn basic chords")).toBeInTheDocument();
  });

  it("should disable previous button on day 1", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);
    const prevButton = screen.getByText("← Previous");
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last day", () => {
    const task = { ...mockTask, current_day: 3 };
    render(<MultiDayTaskDisplay task={task} />);

    // Navigate to day 3
    const nextButton = screen.getByText("Next →");
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it("should toggle view all days", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);

    const toggleButton = screen.getByText("View All Days");
    fireEvent.click(toggleButton);

    // All days should now be visible
    expect(screen.getByText("Learn basic chords")).toBeInTheDocument();
    expect(screen.getByText("Practice chord transitions")).toBeInTheDocument();
    expect(screen.getByText("Practice scales")).toBeInTheDocument();
  });

  it("should change toggle button text when viewing all days", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);

    const toggleButton = screen.getByText("View All Days");
    fireEvent.click(toggleButton);

    expect(screen.getByText("View Current Day")).toBeInTheDocument();
  });

  it("should hide day navigation when viewing all days", () => {
    render(<MultiDayTaskDisplay task={mockTask} />);

    const toggleButton = screen.getByText("View All Days");
    fireEvent.click(toggleButton);

    // Navigation buttons should not be visible
    expect(screen.queryByText("← Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next →")).not.toBeInTheDocument();
  });

  it("should call onStepComplete with correct day and stepIndex", async () => {
    const handleStepComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <MultiDayTaskDisplay
        task={mockTask}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(handleStepComplete).toHaveBeenCalledWith(0, 1);
    });
  });

  it("should handle backward compatibility with string[] format", () => {
    const legacyTask: Task = {
      ...mockTask,
      ai_breakdown: {
        day_1: ["Task 1", "Task 2"],
        day_2: ["Task 3", "Task 4"],
      },
    };
    render(<MultiDayTaskDisplay task={legacyTask} />);
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("should show visual distinction for completed tasks", () => {
    const taskWithCompleted: Task = {
      ...mockTask,
      ai_breakdown: {
        day_1: [
          { text: "Learn basic chords", completed: true },
          { text: "Practice finger placement", completed: false },
        ],
        day_2: [
          { text: "Practice chord transitions", completed: false },
          { text: "Learn simple song", completed: false },
        ],
        day_3: [
          { text: "Practice scales", completed: false },
          { text: "Play along with song", completed: false },
        ],
      } as MultiDayBreakdown,
    };
    render(<MultiDayTaskDisplay task={taskWithCompleted} />);

    const completedLabel = screen.getByText("Learn basic chords");
    expect(completedLabel.className).toContain("line-through");
    expect(completedLabel.className).toContain("text-gray-500");
  });

  it("should show celebration message when all days completed", () => {
    const completedTask: Task = {
      ...mockTask,
      ai_breakdown: {
        day_1: [
          { text: "Learn basic chords", completed: true },
          { text: "Practice finger placement", completed: true },
        ],
        day_2: [
          { text: "Practice chord transitions", completed: true },
          { text: "Learn simple song", completed: true },
        ],
        day_3: [
          { text: "Practice scales", completed: true },
          { text: "Play along with song", completed: true },
        ],
      } as MultiDayBreakdown,
    };
    render(<MultiDayTaskDisplay task={completedTask} />);
    expect(
      screen.getByText(/Amazing! You've completed all 3 days!/i)
    ).toBeInTheDocument();
  });

  it("should not allow unchecking completed tasks", async () => {
    const handleStepComplete = vi.fn().mockResolvedValue(undefined);
    const taskWithCompleted: Task = {
      ...mockTask,
      ai_breakdown: {
        ...mockTask.ai_breakdown,
        day_1: [
          { text: "Learn basic chords", completed: true },
          { text: "Practice finger placement", completed: false },
        ],
      } as MultiDayBreakdown,
    };
    render(
      <MultiDayTaskDisplay
        task={taskWithCompleted}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // Try to uncheck completed task

    await waitFor(() => {
      expect(handleStepComplete).not.toHaveBeenCalled();
    });
  });

  it("should show loading spinner when task is being completed", async () => {
    const handleStepComplete = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(
      <MultiDayTaskDisplay
        task={mockTask}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should calculate overall progress correctly", () => {
    const taskWithProgress: Task = {
      ...mockTask,
      ai_breakdown: {
        day_1: [
          { text: "Learn basic chords", completed: true },
          { text: "Practice finger placement", completed: true },
        ],
        day_2: [
          { text: "Practice chord transitions", completed: true },
          { text: "Learn simple song", completed: false },
        ],
        day_3: [
          { text: "Practice scales", completed: false },
          { text: "Play along with song", completed: false },
        ],
      } as MultiDayBreakdown,
    };
    render(<MultiDayTaskDisplay task={taskWithProgress} />);
    // 3 out of 6 tasks completed = 50%
    expect(screen.getByText("50% - 3/6 completed")).toBeInTheDocument();
  });
});
