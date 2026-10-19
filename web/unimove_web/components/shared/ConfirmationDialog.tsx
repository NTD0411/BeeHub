'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmationDialogProps {
  isOpen:          boolean
  onClose:         () => void
  onConfirm:       () => void
  title:           string
  description?:    string
  confirmLabel?:   string
  cancelLabel?:    string
  variant?:        DialogVariant
  isLoading?:      boolean
}

const VARIANT_MAP: Record<DialogVariant, {
  Icon:        React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconClass:   string
  bgClass:     string
  btnClass:    string
}> = {
  danger: {
    Icon:      AlertTriangle,
    iconClass: 'text-error',
    bgClass:   'bg-error/10',
    btnClass:  'bg-error hover:bg-error/90 text-white',
  },
  warning: {
    Icon:      AlertTriangle,
    iconClass: 'text-warning',
    bgClass:   'bg-warning/10',
    btnClass:  'bg-warning hover:bg-warning/90 text-white',
  },
  info: {
    Icon:      Info,
    iconClass: 'text-primary',
    bgClass:   'bg-primary/10',
    btnClass:  'bg-primary hover:bg-primary-dark text-white',
  },
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel  = 'Huỷ',
  variant      = 'danger',
  isLoading    = false,
}: ConfirmationDialogProps) {
  const { Icon, iconClass, bgClass, btnClass } = VARIANT_MAP[variant]

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <Dialog.Portal>

        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-modal bg-black/50 data-[state=open]:animate-fade-in" />

        {/* Panel */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-modal w-[calc(100%-2rem)] max-w-sm',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-2xl bg-surface p-6 shadow-xl',
            'data-[state=open]:animate-scale-in',
            'focus:outline-none',
          )}
          aria-describedby={description ? 'cd-desc' : undefined}
          onPointerDownOutside={(e) => isLoading && e.preventDefault()}
          onEscapeKeyDown={(e)      => isLoading && e.preventDefault()}
        >
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', bgClass)}>
              <Icon className={cn('h-7 w-7', iconClass)} strokeWidth={1.5} />
            </div>
          </div>

          {/* Text */}
          <div className="mb-6 text-center">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description id="cd-desc" className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-button border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-button py-2.5 text-sm font-semibold transition-colors disabled:opacity-70',
                btnClass
              )}
            >
              {isLoading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              )}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>

      </Dialog.Portal>
    </Dialog.Root>
  )
}
