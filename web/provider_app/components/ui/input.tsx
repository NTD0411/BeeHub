import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startAdornment, endAdornment, ...props }, ref) => (
    <div className="relative flex items-center w-full">
      {startAdornment && <span className="absolute left-3 pointer-events-none" style={{ color: "var(--muted)" }}>{startAdornment}</span>}
      <input type={type} ref={ref}
        className={cn("flex h-11 w-full rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50",
          startAdornment && "pl-10", endAdornment && "pr-10", className)}
        style={{ backgroundColor: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" } as React.CSSProperties}
        {...props} />
      {endAdornment && <span className="absolute right-3" style={{ color: "var(--muted)" }}>{endAdornment}</span>}
    </div>
  )
);
Input.displayName = "Input";
export { Input };
