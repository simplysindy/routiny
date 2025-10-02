"use client";

import { useState } from "react";
import { Button, Textarea, Label } from "@/components/ui";
import { DurationSelector } from "@/components/task";
import { useTaskStore } from "@/stores";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function TaskInput() {
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createTask = useTaskStore((state) => state.createTask);
  const user = useAuthStore((state) => state.user);

  const maxLength = 500;
  const minLength = 3;
  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const isUnderLimit =
    value.trim().length < minLength && value.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = value.trim();

    // Validation
    if (!trimmedValue) {
      setError("Please enter a task description");
      return;
    }

    if (trimmedValue.length < minLength) {
      setError(`Task must be at least ${minLength} characters`);
      return;
    }

    if (trimmedValue.length > maxLength) {
      setError(`Task must not exceed ${maxLength} characters`);
      return;
    }

    if (!user?.id) {
      setError("You must be logged in to create tasks");
      return;
    }

    // Validate duration
    if (!Number.isInteger(duration) || duration < 1) {
      setError("Duration must be a positive number");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const task = await createTask(trimmedValue, duration, user.id);

      if (task) {
        setValue("");
        setDuration(1); // Reset to default
        setSuccess(true);

        // Hide success message after 2 seconds
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError("Failed to create task. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create task. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleRetry = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const taskTypeIndicator =
    duration === 1 ? "📝 One-time task" : `🎯 ${duration}-day habit`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Duration Selector */}
      <DurationSelector value={duration} onChange={setDuration} />

      {/* Divider */}
      <div className="border-t border-gray-200" />

      <div className="space-y-2">
        <Label htmlFor="task-input" className="text-base font-semibold">
          What do you want to accomplish?
        </Label>

        <Textarea
          id="task-input"
          value={value}
          onChange={handleChange}
          placeholder="Describe your task in detail..."
          disabled={isLoading}
          rows={3}
          maxLength={maxLength + 50} // Allow typing a bit over to show error
          aria-describedby={error ? "task-error" : undefined}
          aria-invalid={!!error}
          className={cn(
            "min-h-[120px] resize-none text-base",
            error && "border-red-500 focus-visible:ring-red-500",
            success && "border-green-500 focus-visible:ring-green-500"
          )}
        />

        {/* Character Counter and Task Type Indicator */}
        <div className="flex items-center justify-between text-sm">
          <span
            className={cn(
              "transition-colors",
              isOverLimit && "font-medium text-red-600",
              isUnderLimit && "text-gray-500",
              !isOverLimit && !isUnderLimit && charCount > 0 && "text-gray-500"
            )}
          >
            {charCount} / {maxLength} characters
          </span>

          {isUnderLimit ? (
            <span className="text-gray-500">
              {minLength - value.trim().length} more character
              {minLength - value.trim().length !== 1 ? "s" : ""} needed
            </span>
          ) : (
            <span className="font-medium text-gray-600">
              {taskTypeIndicator}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id="task-error"
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            aria-hidden="true"
          />
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <p>Task created successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading || isOverLimit || !value.trim()}
          loading={isLoading}
          className="flex-1 sm:min-w-[200px] sm:flex-none"
          size="lg"
        >
          {isLoading ? "Creating..." : "Create Task"}
        </Button>

        {error && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRetry}
            disabled={isLoading}
            size="lg"
          >
            Retry
          </Button>
        )}
      </div>
    </form>
  );
}
