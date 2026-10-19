import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--primary-tint)" }}
        >
          <Icon
            className="w-8 h-8"
            style={{ color: "var(--primary)" }}
          />
        </div>
      )}
      <h3
        className="text-base font-semibold mb-1"
        style={{ color: "var(--text)" }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
