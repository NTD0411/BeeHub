'use client'

import Link from 'next/link'
import { MessageSquare, Package, ShoppingBag, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/lib/stores/useNotificationStore'

/* ── Type config ────────────────────────────────────────────── */

const TYPE_CONFIG: Record<NotificationType, {
  Icon:      React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconClass: string
  bgClass:   string
}> = {
  'tin-nhan':  { Icon: MessageSquare, iconClass: 'text-primary', bgClass: 'bg-primary/10' },
  'don-hang':  { Icon: Package,       iconClass: 'text-warning', bgClass: 'bg-warning/10' },
  'san-pham':  { Icon: ShoppingBag,   iconClass: 'text-success', bgClass: 'bg-success/10' },
  'he-thong':  { Icon: Bell,          iconClass: 'text-muted-foreground', bgClass: 'bg-surface-2' },
}

/* ── Types ──────────────────────────────────────────────────── */

export interface NotificationCardData {
  id:        string
  type:      NotificationType
  title:     string
  body:      string
  isRead:    boolean
  createdAt: string
  href?:     string
}

interface NotificationCardProps {
  data:         NotificationCardData
  onRead?:      (id: string) => void
  className?:   string
}

/* ── Card ───────────────────────────────────────────────────── */

export function NotificationCard({ data, onRead, className }: NotificationCardProps) {
  const { Icon, iconClass, bgClass } = TYPE_CONFIG[data.type]

  const inner = (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 transition-colors',
        !data.isRead && 'bg-primary/[0.04]',
        'hover:bg-surface-2 active:bg-surface-2',
        className
      )}
      onClick={() => !data.isRead && onRead?.(data.id)}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', bgClass)}>
        <Icon className={cn('h-5 w-5', iconClass)} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-snug', data.isRead ? 'font-medium text-foreground' : 'font-semibold text-foreground')}>
            {data.title}
          </p>
          {!data.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{data.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">{data.createdAt}</p>
      </div>
    </div>
  )

  return data.href ? (
    <Link href={data.href} className="block">
      {inner}
    </Link>
  ) : inner
}
