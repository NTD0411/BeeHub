"use client";

import * as React from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type ToastVariant = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms (0 = persistent). Default: 4000 */
  duration?: number;
}

/* ── Zustand store ───────────────────────────────────────────────────────── */

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    return id;
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/* ── Helper hook ──────────────────────────────────────────────────────────── */

export function useToast() {
  const { add, remove, clear } = useToastStore();

  const toast = React.useCallback(
    (options: Omit<ToastItem, "id">) => add(options),
    [add],
  );

  const dismiss = React.useCallback((id: string) => remove(id), [remove]);

  return { toast, dismiss, clear };
}

/* ── Variant config ──────────────────────────────────────────────────────── */

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ReactNode;
    className: string;
    style: React.CSSProperties;
  }
> = {
  default: {
    icon: <Info className="h-4 w-4 shrink-0" />,
    className: "border",
    style: {
      backgroundColor: "var(--card)",
      borderColor: "var(--border)",
      color: "var(--text)",
    },
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />,
    className: "border border-[#16A34A]/30 bg-[#DCFCE7] dark:bg-[#16A34A]/15",
    style: { color: "#15803D" },
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />,
    className: "border border-[#DC2626]/30 bg-[#FEE2E2] dark:bg-[#DC2626]/15",
    style: { color: "#B91C1C" },
  },
};

/* ── Single Toast item ────────────────────────────────────────────────────── */

function ToastItemComponent({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const { variant = "default", duration = 4000 } = toast;
  const config = variantConfig[variant];

  React.useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => remove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, remove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex w-full items-start gap-3 rounded-xl p-4 shadow-lg",
        "animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
        config.className,
      )}
      style={config.style}
    >
      {config.icon}

      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="text-xs opacity-80 leading-snug">{toast.description}</p>
        )}
      </div>

      <button
        onClick={() => remove(toast.id)}
        className={cn(
          "shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity",
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
        )}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Toaster (viewport) ───────────────────────────────────────────────────── */

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItemComponent toast={t} />
        </div>
      ))}
    </div>
  );
}

/* ── Named re-export for the styled div primitive ────────────────────────── */

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  onDismiss?: () => void;
}

/**
 * Standalone styled Toast div — use `<Toaster />` + `useToast()` for the
 * managed stack, or use this as a one-off styled element.
 */
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", onDismiss, children, style, ...props }, ref) => {
    const config = variantConfig[variant];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex w-full items-start gap-3 rounded-xl p-4 shadow-lg",
          config.className,
          className,
        )}
        style={{ ...config.style, ...style }}
        {...props}
      >
        {config.icon}
        <div className="flex-1 min-w-0">{children}</div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);
Toast.displayName = "Toast";

export { Toast };
