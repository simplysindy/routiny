'use client';

import { FC, useState } from 'react';
import { cn } from '@/lib/utils';
import { Task, BreakdownStep } from '@/types';
import ProgressBar from '@/components/ui/ProgressBar';

interface SingleDayTaskDisplayProps {
  task: Task;
  onStepComplete?: (stepIndex: number) => Promise<void>;
  className?: string;
}

const SingleDayTaskDisplay: FC<SingleDayTaskDisplayProps> = ({
  task,
  onStepComplete,
  className,
}) => {
  const [loadingSteps, setLoadingSteps] = useState<Set<number>>(new Set());

  // Normalize ai_breakdown to BreakdownStep[] format (backward compatibility)
  const normalizeSteps = (): BreakdownStep[] => {
    if (!Array.isArray(task.ai_breakdown)) {
      return [];
    }

    return task.ai_breakdown.map((step) =>
      typeof step === 'string' ? { text: step, completed: false } : step
    );
  };

  const steps = normalizeSteps();
  const completedCount = steps.filter((s) => s.completed).length;

  const handleCheckboxChange = async (stepIndex: number) => {
    if (steps[stepIndex].completed || loadingSteps.has(stepIndex)) {
      return; // Prevent unchecking or double-clicking
    }

    if (onStepComplete) {
      setLoadingSteps((prev) => new Set(prev).add(stepIndex));
      try {
        await onStepComplete(stepIndex);
      } finally {
        setLoadingSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepIndex);
          return next;
        });
      }
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Task Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{task.title}</h1>
        <p className="text-sm text-gray-500">Single-day task</p>
      </div>

      {/* Progress Indicator */}
      <ProgressBar
        completed={completedCount}
        total={steps.length}
        label="Overall Progress"
      />

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ease-in-out',
              step.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="checkbox"
              checked={step.completed}
              onChange={() => handleCheckboxChange(index)}
              disabled={step.completed || loadingSteps.has(index)}
              className={cn(
                'mt-0.5 h-5 w-5 rounded border-gray-300 text-green-600',
                'focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                'transition-all duration-200 cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
              aria-label={`Step ${index + 1}: ${step.text}`}
            />
            <label
              className={cn(
                'flex-1 text-sm md:text-base cursor-pointer select-none transition-all duration-200',
                step.completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              )}
              onClick={() => !step.completed && handleCheckboxChange(index)}
            >
              {step.text}
            </label>
            {loadingSteps.has(index) && (
              <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full" />
            )}
          </div>
        ))}
      </div>

      {/* Celebration Message */}
      {completedCount === steps.length && steps.length > 0 && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center animate-pulse">
          <p className="text-green-800 font-semibold">
            🎉 Congratulations! You&apos;ve completed all steps!
          </p>
        </div>
      )}
    </div>
  );
};

export default SingleDayTaskDisplay;
