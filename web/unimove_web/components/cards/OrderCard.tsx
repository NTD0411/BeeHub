'use client'

import Link from 'next/link'
import { MapPin, ArrowRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────────── */

export type OrderStatus =
  | 'cho-xac-nhan'
  | 'dang-lay-hang'
  | 'dang-giao'
  | 'hoan-thanh'
  | 'da-huy'

export interface OrderCardData {
  id:         string
  code:       string
  status:     OrderStatus
  pickup:     string
  dropoff:    string
  price:      number
  itemSummary?: string
  createdAt?: string
}

interface OrderCardProps {
  data:         OrderCardData
  onViewDetail?: (id: string) => void
  onCancel?:     (id: string) => void
  onReorder?:    (id: string) => void
  className?:    string
}

/* ── Status config ──────────────────────────────────────────── */

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string; dotClass: string }> = {
  'cho-xac-nhan': { label: 'Chờ xác nhận', className: 'bg-warning/10 text-warning',       dotClass: 'bg-warning' },
  'dang-lay-hang':{ label: 'Đang lấy hàng',className: 'bg-primary/10 text-primary',       dotClass: 'bg-primary' },
  'dang-giao':    { label: 'Đang giao',     className: 'bg-primary/10 text-primary',       dotClass: 'bg-primary animate-pulse' },
  'hoan-thanh':   { label: 'Hoàn thành',   className: 'bg-success/10 text-success',       dotClass: 'bg-success' },
  'da-huy':       { label: 'Đã huỷ',       className: 'bg-muted/60 text-muted-foreground',dotClass: 'bg-muted-foreground' },
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(price)
}

/* ── Card ───────────────────────────────────────────────────── */

export function OrderCard({ data, onViewDetail, onCancel, onReorder, className }: OrderCardProps) {
  const { label: statusLabel, className: statusClass, dotClass } = STATUS_CONFIG[data.status]

  return (
    <div className={cn('overflow-hidden rounded-card bg-surface shadow-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <span className="text-xs text-muted-foreground">{data.code}</span>
        </div>
        <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', statusClass)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      {/* Route */}
      <div className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full border-2 border-primary" />
            </div>
            <p className="line-clamp-1 text-sm text-foreground">{data.pickup}</p>
          </div>

          {/* Connector line */}
          <div className="ml-[9px] h-4 w-px bg-border" aria-hidden="true" />

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-error" strokeWidth={1.75} />
            <p className="line-clamp-1 text-sm text-foreground">{data.dropoff}</p>
          </div>
        </div>

        {data.itemSummary && (
          <p className="mt-2 text-xs text-muted-foreground">{data.itemSummary}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <div>
          <p className="text-base font-bold text-foreground">{formatPrice(data.price)}</p>
          {data.createdAt && (
            <p className="text-xs text-muted-foreground">{data.createdAt}</p>
          )}
        </div>

        <div className="flex gap-2">
          {data.status === 'cho-xac-nhan' && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(data.id)}
              className="rounded-button border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              Huỷ đơn
            </button>
          )}

          {data.status === 'da-huy' && onReorder && (
            <button
              type="button"
              onClick={() => onReorder(data.id)}
              className="rounded-button border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              Đặt lại
            </button>
          )}

          {onViewDetail ? (
            <button
              type="button"
              onClick={() => onViewDetail(data.id)}
              className="flex items-center gap-1 rounded-button bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Chi tiết
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <Link
              href={`/don-hang/${data.id}`}
              className="flex items-center gap-1 rounded-button bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Chi tiết
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
