import { cn } from "@/lib/admin/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
