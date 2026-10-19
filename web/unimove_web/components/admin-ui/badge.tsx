import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/admin/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/20",
        success: "bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20 dark:bg-[#16A34A]/20 dark:text-[#4ADE80]",
        warning: "bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20 dark:bg-[#D97706]/20 dark:text-[#FCD34D]",
        danger: "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/20 dark:bg-[#DC2626]/20 dark:text-[#F87171]",
        info: "bg-[#DBEAFE] text-[#2563EB] border border-[#2563EB]/20 dark:bg-[#2563EB]/20 dark:text-[#93C5FD]",
        outline: "bg-transparent text-[var(--text)] border border-[var(--border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
