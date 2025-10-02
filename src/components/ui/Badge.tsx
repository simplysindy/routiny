import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "pending"
    | "progress"
    | "completed"
    | "blue"
    | "purple";
  children: ReactNode;
}

export const Badge: FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
