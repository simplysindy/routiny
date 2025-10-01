import { useMemo } from "react";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  className?: string;
  onClick?: () => void;
}

const statusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusVariants = {
  pending: "pending" as const,
  in_progress: "progress" as const,
  completed: "completed" as const,
};

export function TaskCard({ task, className, onClick }: TaskCardProps) {
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(task.created_at), {
        addSuffix: true,
      });
    } catch {
      return "Recently";
    }
  }, [task.created_at]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer p-4 transition-all duration-200 hover:shadow-md md:p-5",
        "hover:border-primary/50 border-gray-200",
        className
      )}
      onClick={onClick}
      role="article"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col gap-3">
        {/* Header: Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={statusVariants[task.status]} className="text-xs">
            {statusLabels[task.status]}
          </Badge>
          <time dateTime={task.created_at} className="text-xs text-gray-500">
            {timeAgo}
          </time>
        </div>

        {/* Task Title */}
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-gray-900 md:text-base">
          {task.title}
        </h3>
      </div>
    </Card>
  );
}

interface TaskListProps {
  tasks: Task[];
  emptyMessage?: string;
  className?: string;
  onTaskClick?: (task: Task) => void;
}

export function TaskList({
  tasks,
  emptyMessage = "No tasks yet. Create your first one above!",
  className,
  onTaskClick,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div
        className={cn("px-4 py-12 text-center text-gray-500", className)}
        role="status"
      >
        <p className="text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3",
        className
      )}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onTaskClick?.(task)}
        />
      ))}
    </div>
  );
}
