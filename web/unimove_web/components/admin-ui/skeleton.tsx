import * as React from "react";
import { cn } from "@/lib/admin/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fully round pill shape */
  rounded?: boolean;
}

function Skeleton({ className, rounded = false, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse",
        rounded ? "rounded-full" : "rounded-xl",
        className,
      )}
      style={{
        backgroundColor: "var(--border)",
        opacity: 0.7,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* ── Convenience preset shapes ──────────────────────────────────────────── */

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" };
  return <Skeleton rounded className={sizeMap[size]} />;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-2xl border p-6 flex flex-col gap-4", className)}
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="lg" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard };
