'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
  sticky?: boolean
}

export function PageHeader({
  title,
  onBack,
  rightAction,
  className,
  sticky = true,
}: PageHeaderProps) {
  const router = useRouter()
  const handleBack = onBack ?? (() => router.back())

  return (
    <header
      className={cn(
        'flex items-center gap-2 px-2',
        'h-[var(--height-header)]',
        sticky && 'sticky top-0 z-sticky',
        'border-b border-border bg-surface/90 backdrop-blur-md',
        className
      )}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Quay lại"
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-surface-2 active:bg-surface-2"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      </button>

      <h1 className="flex-1 truncate text-base font-semibold text-foreground">
        {title}
      </h1>

      {rightAction && <div className="shrink-0 pr-2">{rightAction}</div>}
    </header>
  )
}
