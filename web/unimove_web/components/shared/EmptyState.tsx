import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  icon = 'Inbox',
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>
  )[icon]

  const iconSizeClass    = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-9 w-9' }[size]
  const wrapSizeClass    = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-20 w-20' }[size]
  const titleSizeClass   = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size]
  const descSizeClass    = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size]
  const paddingClass     = { sm: 'py-8 px-4', md: 'py-16 px-6', lg: 'py-24 px-8' }[size]

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 text-center', paddingClass, className)}
      role="status"
      aria-label={title}
    >
      {/* Icon circle */}
      <div className={cn('flex items-center justify-center rounded-full bg-surface-2', wrapSizeClass)}>
        {IconComponent ? (
          <IconComponent className={cn('text-muted-foreground', iconSizeClass)} strokeWidth={1.5} />
        ) : (
          <span className="text-2xl" role="img">{icon}</span>
        )}
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className={cn('font-semibold text-foreground', titleSizeClass)}>{title}</p>
        {description && (
          <p className={cn('text-muted-foreground', descSizeClass)}>{description}</p>
        )}
      </div>

      {/* CTA */}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex items-center rounded-button bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-95"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 inline-flex items-center rounded-button bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-95"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
