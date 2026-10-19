"use client";

import { cn } from "@/lib/utils";
import { monoFont, sectionLabel } from "@/lib/landing-classes";

interface SectionLabelProps {
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export function SectionLabel({ children, pulse = true, className }: SectionLabelProps) {
  return (
    <div className={cn(sectionLabel, className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-accent",
          pulse && "animate-pulse motion-reduce:animate-none"
        )}
      />
      <span className={cn(monoFont, "text-xs uppercase tracking-[0.15em] text-accent")}>
        {children}
      </span>
    </div>
  );
}
