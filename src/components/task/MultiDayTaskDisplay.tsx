"use client";

import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { Task, BreakdownStep, MultiDayBreakdown } from "@/types";
import ProgressBar from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

interface MultiDayTaskDisplayProps {
  task: Task;
  onStepComplete?: (stepIndex: number, day: number) => Promise<void>;
  className?: string;
}

const MultiDayTaskDisplay: FC<MultiDayTaskDisplayProps> = ({
  task,
  onStepComplete,
  className,
}) => {
  const [currentDayView, setCurrentDayView] = useState(task.current_day);
  const [viewAllDays, setViewAllDays] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set());

  // Get breakdown as MultiDayBreakdown
  const breakdown = task.ai_breakdown as MultiDayBreakdown;

  // Normalize day tasks to BreakdownStep[] format (backward compatibility)
  const normalizeDayTasks = (dayKey: string): BreakdownStep[] => {
    const dayTasks = breakdown[dayKey];
    if (!Array.isArray(dayTasks)) {
      return [];
    }

    return dayTasks.map((task) =>
      typeof task === "string" ? { text: task, completed: false } : task
    );
  };

  // Get all day keys sorted
  const dayKeys = Object.keys(breakdown)
    .filter((key) => key.startsWith("day_"))
    .sort((a, b) => {
      const dayA = parseInt(a.split("_")[1]);
      const dayB = parseInt(b.split("_")[1]);
      return dayA - dayB;
    });

  const totalDays = task.duration_days;
  const currentDayKey = `day_${currentDayView}`;
  const currentDayTasks = normalizeDayTasks(currentDayKey);
  const completedCount = currentDayTasks.filter((t) => t.completed).length;

  // Calculate overall progress
  const calculateOverallProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    dayKeys.forEach((dayKey) => {
      const tasks = normalizeDayTasks(dayKey);
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t) => t.completed).length;
    });

    return { totalTasks, completedTasks };
  };

  const { totalTasks, completedTasks } = calculateOverallProgress();

  const handleCheckboxChange = async (stepIndex: number, day: number) => {
    const loadingKey = `${day}-${stepIndex}`;
    const dayKey = `day_${day}`;
    const tasks = normalizeDayTasks(dayKey);

    if (tasks[stepIndex]?.completed || loadingSteps.has(loadingKey)) {
      return; // Prevent unchecking or double-clicking
    }

    if (onStepComplete) {
      setLoadingSteps((prev) => new Set(prev).add(loadingKey));
      try {
        await onStepComplete(stepIndex, day);
      } finally {
        setLoadingSteps((prev) => {
          const next = new Set(prev);
          next.delete(loadingKey);
          return next;
        });
      }
    }
  };

  const handlePrevDay = () => {
    if (currentDayView > 1) {
      setCurrentDayView(currentDayView - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDayView < totalDays) {
      setCurrentDayView(currentDayView + 1);
    }
  };

  const renderDayTasks = (day: number) => {
    const dayKey = `day_${day}`;
    const tasks = normalizeDayTasks(dayKey);
    const isCurrentDay = day === task.current_day;

    return (
      <div
        key={dayKey}
        className={cn(
          "rounded-lg border p-4 transition-all duration-300",
          isCurrentDay
            ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
            : "border-gray-200 bg-white"
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Day {day}{" "}
            {isCurrentDay && <span className="text-blue-600">(Current)</span>}
          </h3>
          <span className="text-sm text-gray-500">
            {tasks.filter((t) => t.completed).length}/{tasks.length} completed
          </span>
        </div>

        <div className="space-y-2">
          {tasks.map((task, index) => {
            const loadingKey = `${day}-${index}`;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded border p-3 transition-all duration-200",
                  task.completed
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleCheckboxChange(index, day)}
                  disabled={task.completed || loadingSteps.has(loadingKey)}
                  className={cn(
                    "mt-0.5 h-5 w-5 rounded border-gray-300 text-green-600",
                    "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                    "cursor-pointer transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                  aria-label={`Day ${day}, Task ${index + 1}: ${task.text}`}
                />
                <label
                  className={cn(
                    "flex-1 cursor-pointer text-sm transition-all duration-200 select-none",
                    task.completed
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  )}
                  onClick={() =>
                    !task.completed && handleCheckboxChange(index, day)
                  }
                >
                  {task.text}
                </label>
                {loadingSteps.has(loadingKey) && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Task Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {task.title}
        </h1>
        <p className="text-sm text-gray-500">
          {totalDays}-day habit • Day {task.current_day} of {totalDays}
        </p>
      </div>

      {/* Overall Progress */}
      <ProgressBar
        completed={completedTasks}
        total={totalTasks}
        label="Overall Progress"
      />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewAllDays(!viewAllDays)}
        >
          {viewAllDays ? "View Current Day" : "View All Days"}
        </Button>
      </div>

      {/* Day Navigation (when not viewing all days) */}
      {!viewAllDays && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevDay}
            disabled={currentDayView <= 1}
          >
            ← Previous
          </Button>

          <span className="font-semibold text-gray-900">
            Day {currentDayView} of {totalDays}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            disabled={currentDayView >= totalDays}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Current Day Progress (when not viewing all days) */}
      {!viewAllDays && (
        <ProgressBar
          completed={completedCount}
          total={currentDayTasks.length}
          label={`Day ${currentDayView} Progress`}
        />
      )}

      {/* Tasks Display */}
      <div className="space-y-4">
        {viewAllDays
          ? // Show all days
            dayKeys.map((dayKey) => {
              const day = parseInt(dayKey.split("_")[1]);
              return renderDayTasks(day);
            })
          : // Show current day only
            renderDayTasks(currentDayView)}
      </div>

      {/* Celebration Message */}
      {completedTasks === totalTasks && totalTasks > 0 && (
        <div className="animate-pulse rounded-lg border border-green-300 bg-green-100 p-4 text-center">
          <p className="font-semibold text-green-800">
            🎉 Amazing! You&apos;ve completed all {totalDays} days!
          </p>
        </div>
      )}
    </div>
  );
};

export default MultiDayTaskDisplay;
