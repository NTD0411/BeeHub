import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-[var(--primary)] text-white",
      secondary: "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]",
      success: "bg-[var(--success-tint)] text-[var(--success)]",
      warning: "bg-[var(--warning-tint)] text-[var(--warning)]",
      destructive: "bg-[var(--error-tint)] text-[var(--error)]",
      outline: "border border-[var(--border)] text-[var(--text)]",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
