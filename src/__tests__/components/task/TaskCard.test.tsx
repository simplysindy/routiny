import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard, TaskList } from "@/components/task/TaskCard";
import type { Task } from "@/types";

describe("TaskCard", () => {
  const mockTask: Task = {
    id: "task-1",
    user_id: "user-1",
    title: "Clean my room",
    ai_breakdown: [],
    duration_days: 1,
    task_type: "single-day",
    current_day: 1,
    status: "pending",
    completed_at: null,
    created_at: new Date().toISOString(),
  };

  it("should render task title", () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText("Clean my room")).toBeInTheDocument();
  });

  it("should render status badge for pending task", () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should render status badge for in_progress task", () => {
    const task = { ...mockTask, status: "in_progress" as const };
    render(<TaskCard task={task} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("should render status badge for completed task", () => {
    const task = { ...mockTask, status: "completed" as const };
    render(<TaskCard task={task} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("should render relative timestamp", () => {
    render(<TaskCard task={mockTask} />);
    // Should show "less than a minute ago" or similar
    expect(screen.getByText(/ago|Recently/i)).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);

    const card = screen.getByRole("article");
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Enter key is pressed", () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);

    const card = screen.getByRole("article");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClick when Space key is pressed", () => {
    const handleClick = vi.fn();
    render(<TaskCard task={mockTask} onClick={handleClick} />);

    const card = screen.getByRole("article");
    fireEvent.keyDown(card, { key: " " });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be keyboard accessible", () => {
    render(<TaskCard task={mockTask} />);
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("tabIndex", "0");
  });
});

describe("TaskList", () => {
  const mockTasks: Task[] = [
    {
      id: "task-1",
      user_id: "user-1",
      title: "Clean my room",
      ai_breakdown: [],
      duration_days: 1,
      task_type: "single-day",
      current_day: 1,
      status: "pending",
      completed_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "task-2",
      user_id: "user-1",
      title: "Do homework",
      ai_breakdown: [],
      duration_days: 7,
      task_type: "multi-day",
      current_day: 1,
      status: "in_progress",
      completed_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  it("should render multiple tasks", () => {
    render(<TaskList tasks={mockTasks} />);
    expect(screen.getByText("Clean my room")).toBeInTheDocument();
    expect(screen.getByText("Do homework")).toBeInTheDocument();
  });

  it("should render empty state when no tasks", () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("should render custom empty message", () => {
    render(<TaskList tasks={[]} emptyMessage="Custom empty message" />);
    expect(screen.getByText("Custom empty message")).toBeInTheDocument();
  });

  it("should call onTaskClick when task is clicked", () => {
    const handleTaskClick = vi.fn();
    render(<TaskList tasks={mockTasks} onTaskClick={handleTaskClick} />);

    const firstTask = screen
      .getByText("Clean my room")
      .closest('[role="article"]');
    fireEvent.click(firstTask!);

    expect(handleTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("should render tasks in grid layout", () => {
    const { container } = render(<TaskList tasks={mockTasks} />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");
  });
});
