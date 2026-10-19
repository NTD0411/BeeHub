'use client'

import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketplaceStore, CONDITION_LABELS } from '@/lib/stores/useMarketplaceStore'

/* ── Types ──────────────────────────────────────────────────── */

export interface ProductCardData {
  id:            string
  title:         string
  price:         number
  isNegotiable?: boolean
  condition?:    string
  location?:     string
  imageUrl?:     string
  postedAt?:     string
  isUrgent?:     boolean
  created_at?:   string
  seller_name?:  string
}

const PRIMARY = '#1E40AF'

function formatPrice(price: number) {
  if (price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ'
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'vừa xong'
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ`
  return `${Math.floor(h / 24)} ngày`
}

/* ── Save button ────────────────────────────────────────────── */

function SaveButton({ id, className }: { id: string; className?: string }) {
  const isSaved    = useMarketplaceStore((s) => s.isSaved(id))
  const toggleSave = useMarketplaceStore((s) => s.toggleSave)

  return (
    <button
      type="button"
      aria-label={isSaved ? 'Bỏ lưu' : 'Lưu tin'}
      aria-pressed={isSaved}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleSave(id)
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110 active:scale-90 ${className ?? ''}`}
    >
      <Heart
        size={14}
        strokeWidth={2}
        className={isSaved ? 'fill-red-500 stroke-red-500' : 'stroke-gray-500'}
      />
    </button>
  )
}

/* ── Grid variant (redesigned) ──────────────────────────────── */

function GridCard({ data, href = '#' }: { data: ProductCardData; href?: string }) {
  const sellerInitial = data.seller_name?.[0]?.toUpperCase() ?? '?'
  const sellerName = data.seller_name ?? 'Sinh viên'
  const conditionLabel = data.condition
    ? (CONDITION_LABELS[data.condition as keyof typeof CONDITION_LABELS] ?? data.condition)
    : null

  const conditionStyle = (() => {
    switch (data.condition) {
      case 'moi':
        return 'bg-[#0047FF] text-white'
      case 'nhu-moi':
        return 'bg-emerald-500 text-white'
      case 'con-tot':
        return 'bg-amber-500 text-white'
      case 'da-dung-nhieu':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500/80 text-white'
    }
  })()

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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

        {conditionLabel && (
          <span
            className={cn(
              'absolute bottom-2.5 left-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              conditionStyle
            )}
          >
            {conditionLabel}
          </span>
        )}

        {data.isUrgent && !conditionLabel && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            Gấp
          </span>
        )}

        <SaveButton id={data.id} className="absolute right-2.5 top-2.5" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="line-clamp-2 text-sm font-bold text-gray-900 leading-snug">{data.title}</p>

        <p className="text-base font-extrabold text-[#0047FF]">
          {formatPrice(data.price)}
          {data.isNegotiable && <span className="ml-1 text-xs font-normal text-gray-400">• TL</span>}
        </p>

        {data.location && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{data.location}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-50 pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0047FF] text-[10px] font-bold text-white">
              {sellerInitial}
            </div>
            <span className="truncate text-xs font-medium text-gray-700">{sellerName}</span>
          </div>
          {(data.created_at || data.postedAt) && (
            <span className="shrink-0 text-[11px] text-gray-400">
              {data.created_at ? `${timeAgoShort(data.created_at)} trước` : data.postedAt}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Horizontal variant ─────────────────────────────────────── */

function HorizontalCard({ data, href = '#' }: { data: ProductCardData; href?: string }) {
  return (
    <Link
      href={href}
      className="group flex gap-3 overflow-hidden rounded-xl bg-white border border-gray-100 p-3 transition-all hover:shadow-md active:scale-[0.99]"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl select-none">📦</div>
        )}
        {data.isUrgent && (
          <span className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-center text-[9px] font-semibold text-white py-0.5">
            Gấp
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <p className="line-clamp-2 text-sm font-medium text-gray-900 leading-snug">{data.title}</p>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: PRIMARY }}>
              {formatPrice(data.price)}
              {data.isNegotiable && <span className="ml-1 text-xs font-normal text-gray-400">TL</span>}
            </p>
            {data.location && (
              <p className="text-xs text-gray-400 line-clamp-1">{data.location}</p>
            )}
          </div>
          <SaveButton id={data.id} className="-mb-0.5 -mr-0.5" />
        </div>
      </div>
    </Link>
  )
}

/* ── Export ─────────────────────────────────────────────────── */

export function ProductCard({
  data,
  variant = 'grid',
  href,
  className,
}: {
  data:       ProductCardData
  variant?:   'grid' | 'horizontal'
  href?:      string
  className?: string
}) {
  return (
    <div className={className}>
      {variant === 'grid'
        ? <GridCard       data={data} href={href} />
        : <HorizontalCard data={data} href={href} />
      }
    </div>
  )
}