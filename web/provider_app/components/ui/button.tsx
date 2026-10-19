"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  ["inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200",
   "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer"],
  {
    variants: {
      variant: {
        default: "text-white shadow-sm",
        outline: "border bg-transparent shadow-sm",
        ghost: "bg-transparent",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100",
        gradient: "btn-gradient text-white shadow-md",
        success: "text-white shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg", md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base", xl: "h-14 px-8 text-lg rounded-2xl", icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean; loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const vs: React.CSSProperties =
      variant === "default" || !variant ? { backgroundColor: "var(--primary)" } :
      variant === "success" ? { backgroundColor: "var(--success)" } :
      variant === "outline" ? { borderColor: "var(--border)", color: "var(--text)" } :
      variant === "ghost" ? { color: "var(--text)" } : {};
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)}
        style={{ ...vs, ...style }} disabled={loading || props.disabled}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!variant || variant === "default") el.style.backgroundColor = "var(--primary-light)";
          else if (variant === "success") el.style.backgroundColor = "var(--success)";
          else if (variant === "outline" || variant === "ghost") el.style.backgroundColor = "var(--primary-tint)";
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!variant || variant === "default") el.style.backgroundColor = "var(--primary)";
          else if (variant === "success") el.style.backgroundColor = "var(--success)";
          else if (variant === "outline" || variant === "ghost") el.style.backgroundColor = "transparent";
          props.onMouseLeave?.(e);
        }}
        {...props}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
