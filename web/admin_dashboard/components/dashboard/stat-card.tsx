import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
  className,
}: StatCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  if (loading) {
    return (
      <div
        className={cn("rounded-2xl p-5 shadow-sm", className)}
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl animate-pulse" style={{ backgroundColor: "var(--border)" }} />
          <div className="w-16 h-5 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
        </div>
        <div className="w-24 h-8 rounded animate-pulse mb-1" style={{ backgroundColor: "var(--border)" }} />
        <div className="w-32 h-4 rounded animate-pulse" style={{ backgroundColor: "var(--border)" }} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg ?? "var(--primary-tint)" }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: iconColor ?? "var(--primary)" }}
          />
        </div>
        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive
                ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
                : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        {title}
        {deltaLabel && <span> · {deltaLabel}</span>}
      </div>
    </div>
  );
}
