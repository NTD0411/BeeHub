"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/admin/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none cursor-pointer",
  ],
  {
    variants: {
      variant: {
        default: [
          "text-white shadow-sm",
          "focus-visible:ring-[var(--primary)]",
        ],
        outline: [
          "border bg-transparent shadow-sm",
          "focus-visible:ring-[var(--primary)]",
        ],
        ghost: [
          "bg-transparent",
          "focus-visible:ring-[var(--primary)]",
        ],
        destructive: [
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
          "focus-visible:ring-red-500",
        ],
        secondary: [
          "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200 active:bg-slate-300",
          "dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
          "focus-visible:ring-slate-400",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variantStyles: React.CSSProperties =
      variant === "default" || variant === undefined
        ? {
            backgroundColor: "var(--primary)",
            // hover handled via JS since Tailwind can't use CSS vars in bg-[]
          }
        : variant === "outline"
          ? {
              borderColor: "var(--border)",
              color: "var(--text)",
            }
          : variant === "ghost"
            ? {
                color: "var(--text)",
              }
            : {};

    return (
      <Comp
        ref={ref}
        data-variant={variant ?? "default"}
        className={cn(buttonVariants({ variant, size }), className)}
        style={{ ...variantStyles, ...style }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!variant || variant === "default") {
            el.style.backgroundColor = "var(--primary-light)";
          } else if (variant === "outline") {
            el.style.backgroundColor = "var(--primary-tint)";
          } else if (variant === "ghost") {
            el.style.backgroundColor = "var(--primary-tint)";
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!variant || variant === "default") {
            el.style.backgroundColor = "var(--primary)";
          } else if (variant === "outline") {
            el.style.backgroundColor = "transparent";
          } else if (variant === "ghost") {
            el.style.backgroundColor = "transparent";
          }
          props.onMouseLeave?.(e);
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
