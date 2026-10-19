import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full resize-y rounded-xl border px-3.5 py-3 text-sm shadow-sm transition-colors",
        "placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundColor: "var(--surface)",
        color: "var(--text)",
        borderColor: "var(--border)",
      }}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
