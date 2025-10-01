import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card: FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground rounded-lg border shadow-sm",
        "transition-shadow duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
