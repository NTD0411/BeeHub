"use client";

import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-xl transition-shadow duration-300",
        hover && "hover:shadow-lg hover:shadow-[var(--primary)]/10",
        className
      )}
      style={{
        backgroundColor: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
