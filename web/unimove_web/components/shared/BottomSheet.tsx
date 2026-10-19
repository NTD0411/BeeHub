'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen:       boolean
  onClose:      () => void
  title?:       string
  description?: string
  children:     React.ReactNode
  className?:   string
  /** Render without internal scroll — caller manages overflow */
  noScroll?:    boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  noScroll = false,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>

        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-modal bg-black/50 data-[state=open]:animate-fade-in" />

        {/* Sheet panel */}
        <Dialog.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-modal flex flex-col',
            'max-h-[90dvh] overflow-hidden',
            'rounded-t-sheet bg-surface shadow-xl',
            'data-[state=open]:animate-slide-up',
            'focus:outline-none',
            className
          )}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-describedby={description ? 'bs-desc' : undefined}
        >
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pb-1 pt-3" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex shrink-0 items-center justify-between px-5 py-3">
              <Dialog.Title className="text-base font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Đóng"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </Dialog.Close>
            </div>
          )}

          {description && (
            <Dialog.Description id="bs-desc" className="sr-only">
              {description}
            </Dialog.Description>
          )}

          {/* Content */}
          <div className={cn('flex-1', noScroll ? 'overflow-hidden' : 'overflow-y-auto')}>
            {children}
          </div>
        </Dialog.Content>

      </Dialog.Portal>
    </Dialog.Root>
  )
}
