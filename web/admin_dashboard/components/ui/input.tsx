import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon/element */
  startAdornment?: React.ReactNode;
  /** Optional trailing icon/element */
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, style, ...props }, ref) => {
    if (startAdornment || endAdornment) {
      return (
        <div className="relative flex items-center w-full">
          {startAdornment && (
            <span className="absolute left-3 flex items-center pointer-events-none text-[var(--muted)]">
              {startAdornment}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-xl border text-sm shadow-sm transition-colors",
              "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]",
              "placeholder:text-[var(--muted)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              startAdornment ? "pl-10" : "pl-3",
              endAdornment ? "pr-10" : "pr-3",
              "py-2",
              className,
            )}
            style={style}
            {...props}
          />
          {endAdornment && (
            <span className="absolute right-3 flex items-center pointer-events-none text-[var(--muted)]">
              {endAdornment}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors",
          "bg-[var(--surface)] text-[var(--text)] border-[var(--border)]",
          "placeholder:text-[var(--muted)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        style={style}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
