'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  X,
  Armchair,
  Smartphone,
  BookOpen,
  Shirt,
  ChefHat,
  Package,
  LayoutGrid,
  Heart,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCard, type ProductCardData } from '@/components/cards/ProductCard'
import { ErrorState } from '@/components/shared/ErrorState'
import {
  useMarketplaceStore,
  CATEGORY_LABELS,
  type ListingCategory,
} from '@/lib/stores/useMarketplaceStore'
import { marketplaceApi } from '@/lib/api'
import type { AsyncState } from '@/lib/types/states'

interface ApiListing {
  id: string
  title: string
  price?: number
  category: string
  condition?: string
  city?: string
  status: string
  images?: string[]
  created_at: string
  is_urgent?: boolean
  seller?: { full_name?: string }
}

function toListing(l: ApiListing): ProductCardData {
  return {
    id: l.id,
    title: l.title,
    price: l.price ?? 0,
    isNegotiable: false,
    condition: l.condition,
    location: l.city,
    imageUrl: l.images?.[0],
    isUrgent: l.is_urgent,
    created_at: l.created_at,
    seller_name: l.seller?.full_name,
  }
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ListingCategory[]

const CATEGORY_ICONS: Record<ListingCategory, React.ElementType> = {
  'noi-that': Armchair,
  'dien-tu': Smartphone,
  'sach-tai-lieu': BookOpen,
  'quan-ao': Shirt,
  'do-bep': ChefHat,
  khac: Package,
}

const PAGE_SIZE = 12

function HeroBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0047FF] via-[#0039CC] to-[#1e3a8a] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10',
        className
      )}
    >
      <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
        Platform dành cho sinh viên
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
        Chợ sinh viên
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
        Hệ sinh thái mua bán, thanh lý đồ dùng nội thất, điện tử dành riêng cho cộng đồng sinh
        viên với giá ưu đãi.
      </p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-gray-100" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-2/5 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

function CategorySidebar({
  selected,
  onChange,
}: {
  selected: ListingCategory | null
  onChange: (c: ListingCategory | null) => void
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Categories</h2>
        <p className="mt-0.5 text-xs text-gray-400">Filter by type</p>
        <nav className="mt-4 space-y-1">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
              selected === null
                ? 'bg-[#0047FF] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <LayoutGrid size={16} className="shrink-0" />
            Tất cả
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat]
            const active = selected === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange(cat)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  active ? 'bg-[#0047FF] text-white' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon size={16} className="shrink-0" />
                {CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-1 border-t border-gray-100 pt-4">
        <Link
          href="/cho-sinh-vien/yeu-thich"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900"
        >
          <Heart size={16} />
          Yêu thích
        </Link>
        <Link
          href="/cho-sinh-vien/tin-cua-toi"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900"
        >
          <Package size={16} />
          Tin của tôi
        </Link>
        <Link
          href="/cho-sinh-vien/dang-tin"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-[#0047FF] hover:bg-white"
        >
          <Plus size={16} />
          Đăng tin
        </Link>
      </div>
    </div>
  )
}

function MobileCategoryChips({
  selected,
  onChange,
}: {
  selected: ListingCategory | null
  onChange: (c: ListingCategory | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold',
          selected === null ? 'bg-[#0047FF] text-white' : 'bg-white text-gray-600 border border-gray-200'
        )}
      >
        Tất cả
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold',
            selected === cat ? 'bg-[#0047FF] text-white' : 'bg-white text-gray-600 border border-gray-200'
          )}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  )
}

export default function KhamPhaPage() {
  const searchQuery = useMarketplaceStore((s) => s.searchQuery)
  const selectedCategory = useMarketplaceStore((s) => s.selectedCategory)
  const sortBy = useMarketplaceStore((s) => s.sortBy)
  const setSearch = useMarketplaceStore((s) => s.setSearch)
  const setCategory = useMarketplaceStore((s) => s.setCategory)
  const setSort = useMarketplaceStore((s) => s.setSort)

  const [state, setState] = useState<AsyncState<ProductCardData[]>>({ status: 'loading' })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const load = useCallback(async (query: string, category: ListingCategory | null) => {
    setState({ status: 'loading' })
    setVisibleCount(PAGE_SIZE)
    try {
      const res = await marketplaceApi.list({
        search: query || undefined,
        category: category || undefined,
      })
      if (res.success) {
        const raw: ApiListing[] = Array.isArray(res.data)
          ? (res.data as ApiListing[])
          : ((res.data as { listings?: ApiListing[] })?.listings ?? [])
        setState({ status: 'success', data: raw.map(toListing) })
      } else {
        setState({ status: 'error', error: 'Không tải được danh sách sản phẩm.' })
      }
    } catch {
      setState({ status: 'error', error: 'Lỗi kết nối. Vui lòng thử lại.' })
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(searchQuery, selectedCategory), 350)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, load])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  const sorted: ProductCardData[] =
    state.status === 'success'
      ? [...state.data].sort((a, b) => {
          if (sortBy === 'gia-tang') return a.price - b.price
          if (sortBy === 'gia-giam') return b.price - a.price
          return 0
        })
      : []

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  const commitSearch = () => setSearch(localSearch.trim())

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 lg:min-h-0 lg:px-8 lg:py-6">
      {/* Banner — kích thước cố định, không co theo sản phẩm */}
      <HeroBanner className="mb-6 shrink-0" />

      {/*
        Desktop: chiếm phần còn lại của viewport (AppShell main).
        Banner + sidebar đứng yên; chỉ vùng kết quả bên phải cuộn.
      */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-56 shrink-0 self-start lg:block">
          <CategorySidebar selected={selectedCategory} onChange={setCategory} />
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 space-y-3">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  placeholder="Tìm đồ dùng sinh viên..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commitSearch()}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-8 text-sm focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('')
                      setSearch('')
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600"
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>
            </div>
            <MobileCategoryChips selected={selectedCategory} onChange={setCategory} />
          </div>

          <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                {searchQuery || selectedCategory ? 'Kết quả tìm kiếm' : 'Tất cả sản phẩm'}
              </h2>
              {state.status === 'success' && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {sorted.length.toLocaleString('vi-VN')} kết quả
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setSort('moi-nhat')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    sortBy === 'moi-nhat' ? 'bg-blue-50 text-[#0047FF]' : 'text-gray-500'
                  )}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => setSort('gia-tang')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    sortBy === 'gia-tang' ? 'bg-blue-50 text-[#0047FF]' : 'text-gray-500'
                  )}
                >
                  Giá thấp nhất
                </button>
              </div>
            </div>
          </div>

          {/* Vùng kết quả — chiều cao cố định trên desktop, cuộn nội bộ */}
          <div className="mt-5 min-h-[28rem] flex-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            {state.status === 'loading' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {state.status === 'error' && (
              <ErrorState
                type="network"
                message={state.error as string}
                onRetry={() => load(searchQuery, selectedCategory)}
                className="py-8"
              />
            )}

            {state.status === 'success' && sorted.length === 0 && (
              <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center lg:min-h-full">
                <p className="text-4xl">🔍</p>
                <p className="mt-3 font-bold text-gray-900">Không tìm thấy sản phẩm</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
                  {searchQuery
                    ? `Không có kết quả cho "${searchQuery}"`
                    : 'Thử chọn danh mục khác hoặc đăng tin đầu tiên!'}
                </p>
                <Link
                  href="/cho-sinh-vien/dang-tin"
                  className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-gray-900"
                >
                  Đăng tin bán đồ
                </Link>
              </div>
            )}

            {state.status === 'success' && sorted.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visible.map((l) => (
                    <ProductCard
                      key={l.id}
                      data={l}
                      variant="grid"
                      href={`/cho-sinh-vien/${l.id}`}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center pb-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                      className="rounded-full border-2 border-gray-200 bg-white px-8 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0047FF] hover:text-[#0047FF]"
                    >
                      Xem thêm sản phẩm
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
