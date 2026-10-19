'use client'

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useUIStore, type ToastType } from '@/lib/stores/useUIStore'
import { cn } from '@/lib/utils'

const TOAST_CONFIG: Record<ToastType, {
  Icon:      React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconClass: string
  barClass:  string
}> = {
  success: { Icon: CheckCircle,   iconClass: 'text-success', barClass: 'bg-success' },
  error:   { Icon: XCircle,       iconClass: 'text-error',   barClass: 'bg-error' },
  warning: { Icon: AlertTriangle, iconClass: 'text-warning', barClass: 'bg-warning' },
  info:    { Icon: Info,          iconClass: 'text-primary', barClass: 'bg-primary' },
}

export function ToastRenderer() {
  const toasts        = useUIStore((s) => s.toasts)
  const dismissToast  = useUIStore((s) => s.dismissToast)

  if (!toasts.length) return null

  return (
    <div
      role="region"
      aria-label="Thông báo"
      aria-live="polite"
      className="fixed bottom-[calc(var(--height-bottomnav)+env(safe-area-inset-bottom)+12px)] left-1/2 z-toast flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      {toasts.map((toast) => {
        const { Icon, iconClass, barClass } = TOAST_CONFIG[toast.type]

        return (
          <div
            key={toast.id}
            role="alert"
            className="relative flex items-start gap-3 overflow-hidden rounded-xl bg-surface px-4 py-3 shadow-lg animate-slide-up"
          >
            {/* Left accent bar */}
            <div className={cn('absolute left-0 top-0 h-full w-1', barClass)} aria-hidden="true" />

            {/* Icon */}
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} strokeWidth={2} />

            {/* Message */}
            <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-surface-2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
