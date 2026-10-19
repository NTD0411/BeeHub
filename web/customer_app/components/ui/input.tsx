import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center w-full">
          {startAdornment && (
            <span className="absolute left-3 flex items-center pointer-events-none" style={{ color: "var(--muted)" }}>
              {startAdornment}
            </span>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              startAdornment && "pl-10",
              endAdornment && "pr-10",
              error && "border-red-500",
              className
            )}
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--text)",
              borderColor: error ? "var(--error)" : "var(--border)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties}
            {...props}
          />
          {endAdornment && (
            <span className="absolute right-3 flex items-center" style={{ color: "var(--muted)" }}>
              {endAdornment}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
