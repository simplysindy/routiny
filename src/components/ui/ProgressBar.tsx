import { FC } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
  label?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({
  completed,
  total,
  className,
  label,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Color coding: low (0-33%): red, medium (34-66%): yellow, high (67-100%): green
  const getProgressColor = () => {
    if (percentage <= 33) return "bg-red-500";
    if (percentage <= 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressBgColor = () => {
    if (percentage <= 33) return "bg-red-100";
    if (percentage <= 66) return "bg-yellow-100";
    return "bg-green-100";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {label || "Progress"}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {percentage}% - {completed}/{total} completed
        </span>
      </div>
      <div
        className={cn(
          "h-3 w-full overflow-hidden rounded-full",
          getProgressBgColor()
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
