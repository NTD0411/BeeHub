'use client'

import Link from 'next/link'
import { MoreVertical, Pencil, CheckCircle, Eye, EyeOff, Trash2, RefreshCw, Eye as EyeIcon, Clock, Users, MessageCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn, timeAgo } from '@/lib/utils'
import type { ListingCondition } from '@/lib/stores/useMarketplaceStore'
import { CONDITION_LABELS } from '@/lib/stores/useMarketplaceStore'

/* ── Types ──────────────────────────────────────────────────── */

export type ListingStatus = 'dang-ban' | 'da-ban' | 'da-an' | 'het-han'

export interface ListingCardData {
  id:        string
  title:     string
  price:     number
  status:    ListingStatus
  condition?: ListingCondition
  imageUrl?: string
  views?:    number
  saves?:    number
  postedAt?: string
  expiresAt?: string
}

interface ListingCardProps {
  data:          ListingCardData
  onEdit?:       (id: string) => void
  onMarkSold?:   (id: string) => void
  onHide?:       (id: string) => void
  onUnhide?:     (id: string) => void
  onRenew?:      (id: string) => void
  onDelete?:     (id: string) => void
  className?:    string
}

/* ── Status config ──────────────────────────────────────────── */

const STATUS_CONFIG: Record<ListingStatus, { label: string; className: string }> = {
  'dang-ban': { label: 'Đang bán',  className: 'bg-emerald-100 text-emerald-700' },
  'da-ban':   { label: 'Đã bán',    className: 'bg-gray-100 text-gray-600' },
  'da-an':    { label: 'Đã ẩn',     className: 'bg-amber-100 text-amber-700' },
  'het-han':  { label: 'Hết hạn',   className: 'bg-red-100 text-red-600' },
}

function formatPrice(price: number) {
  if (price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(price)
}

/* ── Action menu ────────────────────────────────────────────── */

interface ActionMenuProps {
  data:       ListingCardData
  onEdit?:    (id: string) => void
  onMarkSold?:(id: string) => void
  onHide?:    (id: string) => void
  onUnhide?:  (id: string) => void
  onRenew?:   (id: string) => void
  onDelete?:  (id: string) => void
}

function ActionMenu({ data, onEdit, onMarkSold, onHide, onUnhide, onRenew, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const actions = [
    data.status === 'dang-ban' && onEdit     && { icon: Pencil,      label: 'Chỉnh sửa',        fn: () => onEdit(data.id),     className: '' },
    data.status === 'dang-ban' && onMarkSold && { icon: CheckCircle, label: 'Đánh dấu đã bán',  fn: () => onMarkSold(data.id), className: 'text-success' },
    data.status === 'dang-ban' && onHide     && { icon: EyeOff,      label: 'Ẩn tin',            fn: () => onHide(data.id),     className: '' },
    data.status === 'da-an'   && onUnhide   && { icon: Eye,         label: 'Hiện tin lại',      fn: () => onUnhide(data.id),   className: '' },
    (data.status === 'het-han' || data.status === 'da-an') && onRenew && {
      icon: RefreshCw, label: 'Gia hạn tin', fn: () => onRenew(data.id), className: 'text-primary',
    },
    onDelete && { icon: Trash2, label: 'Xoá tin', fn: () => onDelete(data.id), className: 'text-error' },
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    label: string
    fn: () => void
    className: string
  }>

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Tuỳ chọn"
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-2"
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-dropdown min-w-[160px] overflow-hidden rounded-xl bg-surface shadow-lg border border-border animate-scale-in">
          {actions.map(({ icon: Icon, label, fn, className }) => (
            <button
              key={label}
              type="button"
              onClick={() => { fn(); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2',
                className
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Grid variant (Tin của tôi) ─────────────────────────────── */

export function MyListingGridCard({
  data, onEdit, onMarkSold, onHide, onUnhide, onRenew, onDelete, className,
}: ListingCardProps) {
  const { label: statusLabel, className: statusClass } = STATUS_CONFIG[data.status]

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Link href={`/cho-sinh-vien/${data.id}`} className="block h-full w-full">
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl}
              alt={data.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl select-none">📦</div>
          )}
        </Link>

        <span
          className={cn(
            'absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold',
            statusClass
          )}
        >
          {statusLabel}
        </span>

        <div className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
          <ActionMenu
            data={data}
            onEdit={onEdit}
            onMarkSold={onMarkSold}
            onHide={onHide}
            onUnhide={onUnhide}
            onRenew={onRenew}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/cho-sinh-vien/${data.id}`} className="min-w-0 flex-1 no-underline">
            <p className="line-clamp-2 text-sm font-bold text-gray-900 leading-snug hover:text-[#0047FF]">
              {data.title}
            </p>
          </Link>
          <p className="shrink-0 text-sm font-extrabold text-[#0047FF]">
            {formatPrice(data.price)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {data.views !== undefined && (
            <span className="inline-flex items-center gap-1">
              <EyeIcon size={12} />
              {data.views}
            </span>
          )}
          {data.postedAt && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(data.postedAt)}
            </span>
          )}
          {data.saves !== undefined && data.saves > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              {data.saves} quan tâm
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-50 pt-2.5">
          {data.condition && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {CONDITION_LABELS[data.condition]}
            </span>
          )}
          {(data.status === 'dang-ban' || data.status === 'het-han') && (
            <Link
              href={`/tin-nhan?listingId=${data.id}`}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-800 no-underline transition hover:border-[#0047FF]/30 hover:bg-[#EEF2FF] hover:text-[#0047FF]"
            >
              <MessageCircle size={12} />
              Quản lý
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

/* ── Card ───────────────────────────────────────────────────── */

export function ListingCard({
  data, onEdit, onMarkSold, onHide, onUnhide, onRenew, onDelete, className,
}: ListingCardProps) {
  const { label: statusLabel, className: statusClass } = STATUS_CONFIG[data.status]

  return (
    <div className={cn('flex gap-3 rounded-card bg-surface p-3 shadow-card', className)}>
      {/* Image */}
      <Link href={`/cho-sinh-vien/${data.id}`} className="shrink-0">
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface-2">
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt={data.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">📦</div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/cho-sinh-vien/${data.id}`} className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-foreground leading-snug">{data.title}</p>
          </Link>
          <ActionMenu
            data={data}
            onEdit={onEdit}
            onMarkSold={onMarkSold}
            onHide={onHide}
            onUnhide={onUnhide}
            onRenew={onRenew}
            onDelete={onDelete}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1">
          <p className="text-sm font-bold text-primary">{formatPrice(data.price)}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', statusClass)}>
            {statusLabel}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-xs text-muted-foreground">
          {data.views !== undefined && <span>{data.views} lượt xem</span>}
          {data.saves !== undefined && <span>{data.saves} lượt lưu</span>}
          {data.condition && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px]">
              {CONDITION_LABELS[data.condition]}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
