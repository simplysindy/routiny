import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SingleDayTaskDisplay from "@/components/task/SingleDayTaskDisplay";
import type { Task, BreakdownStep } from "@/types";

describe("SingleDayTaskDisplay", () => {
  const mockTask: Task = {
    id: "task-1",
    user_id: "user-1",
    title: "Clean my room",
    ai_breakdown: [
      { text: "Pick up clothes", completed: false },
      { text: "Vacuum floor", completed: false },
      { text: "Organize desk", completed: false },
    ] as BreakdownStep[],
    duration_days: 1,
    task_type: "single-day",
    current_day: 1,
    status: "pending",
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  it("should render task title", () => {
    render(<SingleDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Clean my room")).toBeInTheDocument();
  });

  it("should render task type label", () => {
    render(<SingleDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Single-day task")).toBeInTheDocument();
  });

  it("should render all steps with checkboxes", () => {
    render(<SingleDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("Pick up clothes")).toBeInTheDocument();
    expect(screen.getByText("Vacuum floor")).toBeInTheDocument();
    expect(screen.getByText("Organize desk")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("should display progress indicator", () => {
    render(<SingleDayTaskDisplay task={mockTask} />);
    expect(screen.getByText("0% - 0/3 completed")).toBeInTheDocument();
  });

  it("should display correct progress when some steps completed", () => {
    const taskWithProgress: Task = {
      ...mockTask,
      ai_breakdown: [
        { text: "Pick up clothes", completed: true },
        { text: "Vacuum floor", completed: false },
        { text: "Organize desk", completed: false },
      ] as BreakdownStep[],
    };
    render(<SingleDayTaskDisplay task={taskWithProgress} />);
    expect(screen.getByText("33% - 1/3 completed")).toBeInTheDocument();
  });

  it("should handle backward compatibility with string[] format", () => {
    const legacyTask: Task = {
      ...mockTask,
      ai_breakdown: ["Step 1", "Step 2", "Step 3"],
    };
    render(<SingleDayTaskDisplay task={legacyTask} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("should call onStepComplete when checkbox is clicked", async () => {
    const handleStepComplete = vi
      .fn<(stepIndex: number) => Promise<void>>()
      .mockResolvedValue(undefined);
    render(
      <SingleDayTaskDisplay
        task={mockTask}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(handleStepComplete).toHaveBeenCalledWith(0);
    });
  });

  it("should not allow unchecking completed steps", async () => {
    const handleStepComplete = vi
      .fn<(stepIndex: number) => Promise<void>>()
      .mockResolvedValue(undefined);
    const taskWithCompleted: Task = {
      ...mockTask,
      ai_breakdown: [
        { text: "Pick up clothes", completed: true },
        { text: "Vacuum floor", completed: false },
        { text: "Organize desk", completed: false },
      ] as BreakdownStep[],
    };
    render(
      <SingleDayTaskDisplay
        task={taskWithCompleted}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // Try to uncheck completed step

    await waitFor(() => {
      expect(handleStepComplete).not.toHaveBeenCalled();
    });
  });

  it("should show visual distinction for completed steps", () => {
    const taskWithCompleted: Task = {
      ...mockTask,
      ai_breakdown: [
        { text: "Pick up clothes", completed: true },
        { text: "Vacuum floor", completed: false },
        { text: "Organize desk", completed: false },
      ] as BreakdownStep[],
    };
    render(<SingleDayTaskDisplay task={taskWithCompleted} />);

    const completedLabel = screen.getByText("Pick up clothes");
    expect(completedLabel.className).toContain("line-through");
    expect(completedLabel.className).toContain("text-gray-500");
  });

  it("should show celebration message when all steps completed", () => {
    const completedTask: Task = {
      ...mockTask,
      ai_breakdown: [
        { text: "Pick up clothes", completed: true },
        { text: "Vacuum floor", completed: true },
        { text: "Organize desk", completed: true },
      ] as BreakdownStep[],
    };
    render(<SingleDayTaskDisplay task={completedTask} />);
    expect(
      screen.getByText(/Congratulations! You've completed all steps!/i)
    ).toBeInTheDocument();
  });

  it("should not show celebration message when not all steps completed", () => {
    render(<SingleDayTaskDisplay task={mockTask} />);
    expect(screen.queryByText(/Congratulations/i)).not.toBeInTheDocument();
  });

  it("should show loading spinner when step is being completed", async () => {
    const handleStepComplete = vi.fn<(stepIndex: number) => Promise<void>>(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );
    render(
      <SingleDayTaskDisplay
        task={mockTask}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Loading spinner should appear
    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should disable checkbox while loading", async () => {
    const handleStepComplete = vi.fn<(stepIndex: number) => Promise<void>>(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );
    render(
      <SingleDayTaskDisplay
        task={mockTask}
        onStepComplete={handleStepComplete}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(checkboxes[0]).toBeDisabled();
    });
  });

  it("should handle empty ai_breakdown gracefully", () => {
    const emptyTask: Task = {
      ...mockTask,
      ai_breakdown: [],
    };
    render(<SingleDayTaskDisplay task={emptyTask} />);
    expect(screen.getByText("Clean my room")).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
