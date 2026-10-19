'use client'

import Link from 'next/link'
import { ShoppingBag, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────────── */

export type ConversationType = 'mua-ban' | 'chuyen-do'

export interface MessageCardData {
  id:               string
  conversationType: ConversationType
  otherPartyName:   string
  otherPartyAvatar?: string
  lastMessage:      string
  lastMessageAt:    string
  unreadCount?:     number
  relatedTitle?:    string
  isOnline?:        boolean
}

interface MessageCardProps {
  data:       MessageCardData
  href?:      string
  className?: string
}

/* ── Type indicator icon ────────────────────────────────────── */

const TYPE_CONFIG: Record<ConversationType, {
  Icon:      React.ComponentType<{ className?: string; strokeWidth?: number }>
  className: string
  label:     string
}> = {
  'mua-ban':   { Icon: ShoppingBag, className: 'bg-success/10 text-success', label: 'Mua bán' },
  'chuyen-do': { Icon: Truck,       className: 'bg-primary/10 text-primary', label: 'Chuyển đồ' },
}

/* ── Avatar ─────────────────────────────────────────────────── */

function Avatar({ name, imageUrl, isOnline }: { name: string; imageUrl?: string; isOnline?: boolean }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative shrink-0">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-primary">{initials}</span>
        )}
      </div>
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-success"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

/* ── Card ───────────────────────────────────────────────────── */

export function MessageCard({ data, href, className }: MessageCardProps) {
  const { Icon, className: typeClass, label: typeLabel } = TYPE_CONFIG[data.conversationType]
  const hasUnread = (data.unreadCount ?? 0) > 0
  const target    = href ?? `/tin-nhan/${data.id}`

  return (
    <Link
      href={target}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 active:bg-surface-2',
        hasUnread && 'bg-primary/[0.03]',
        className
      )}
    >
      {/* Avatar */}
      <Avatar name={data.otherPartyName} imageUrl={data.otherPartyAvatar} isOnline={data.isOnline} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('truncate text-sm', hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>
            {data.otherPartyName}
          </p>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="whitespace-nowrap text-xs text-muted-foreground">{data.lastMessageAt}</span>
            {hasUnread && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {data.unreadCount! > 99 ? '99+' : data.unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Type tag + related title */}
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', typeClass)}>
            <Icon className="h-2.5 w-2.5" strokeWidth={2} />
            {typeLabel}
          </span>
          {data.relatedTitle && (
            <span className="truncate text-xs text-muted-foreground">{data.relatedTitle}</span>
          )}
        </div>

        {/* Last message */}
        <p className={cn('mt-0.5 truncate text-xs', hasUnread ? 'text-foreground' : 'text-muted-foreground')}>
          {data.lastMessage}
        </p>
      </div>
    </Link>
  )
}
