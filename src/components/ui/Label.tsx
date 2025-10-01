import { FC, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label: FC<LabelProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};
