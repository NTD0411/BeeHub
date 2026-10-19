'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Armchair,
  Smartphone,
  BookOpen,
  Shirt,
  ChefHat,
  Package,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  MyListingGridCard,
  type ListingCardData,
  type ListingStatus,
} from '@/components/cards/ListingCard'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { MarketplacePageShell } from '@/components/marketplace/MarketplacePageShell'
import { MarketplacePageHeader } from '@/components/marketplace/MarketplacePageHeader'
import { MarketplaceEmptyState } from '@/components/marketplace/MarketplaceEmptyState'
import { MarketplacePromoCards } from '@/components/marketplace/MarketplacePromoCards'
import { MobileSubtabPills } from '@/components/marketplace/MyMarketplaceSidebar'
import {
  useMarketplaceStore,
  CATEGORY_LABELS,
  type MyListingsSubtab,
  type ListingCategory,
} from '@/lib/stores/useMarketplaceStore'
import { CATEGORY_FROM_API } from '@/lib/marketplace/categories'
import { useUIStore } from '@/lib/stores/useUIStore'
import { marketplaceApi } from '@/lib/api'
import type { AsyncState } from '@/lib/types/states'

const FILTER_CATEGORIES: ListingCategory[] = [
  'noi-that',
  'dien-tu',
  'sach-tai-lieu',
  'quan-ao',
  'do-bep',
  'khac',
]

const CATEGORY_CHIP_ICONS: Record<ListingCategory, React.ElementType> = {
  'noi-that': Armchair,
  'dien-tu': Smartphone,
  'sach-tai-lieu': BookOpen,
  'quan-ao': Shirt,
  'do-bep': ChefHat,
  khac: Package,
}

interface ApiListing {
  id: string
  title: string
  price?: number
  status: string
  condition?: string
  category?: string
  images?: string[]
  view_count?: number
  interest_count?: number
  created_at?: string
  expires_at?: string
}

function apiStatusToListingStatus(s: string): ListingStatus {
  if (s === 'sold' || s === 'completed') return 'da-ban'
  if (s === 'hidden') return 'da-an'
  if (s === 'expired') return 'het-han'
  return 'dang-ban'
}

function toListing(l: ApiListing): ListingCardData & { category?: ListingCategory } {
  const cat = l.category ? CATEGORY_FROM_API[l.category] : undefined
  return {
    id: l.id,
    title: l.title,
    price: l.price ?? 0,
    status: apiStatusToListingStatus(l.status),
    condition: l.condition as ListingCardData['condition'],
    imageUrl: l.images?.[0],
    views: l.view_count,
    saves: l.interest_count,
    postedAt: l.created_at,
    expiresAt: l.expires_at,
    category: cat,
  }
}

function CategoryChips({
  selected,
  onChange,
}: {
  selected: ListingCategory | null
  onChange: (c: ListingCategory | null) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
          selected === null
            ? 'bg-gray-900 text-white'
            : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        )}
      >
        Tất cả
      </button>
      {FILTER_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_CHIP_ICONS[cat]
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              selected === cat
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            )}
          >
            <Icon size={12} />
            {CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}

function SkeletonGridCard() {
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

const EMPTY_CONFIG: Record<
  MyListingsSubtab,
  { title: string; desc: string; cta?: { label: string; href: string } }
> = {
  'dang-ban': {
    title: 'Chưa có tin đang bán',
    desc: 'Đăng tin ngay để bán đồ dùng sinh viên của bạn!',
    cta: { label: 'Đăng tin ngay', href: '/cho-sinh-vien/dang-tin' },
  },
  'da-ban': {
    title: 'Chưa có tin đã bán',
    desc: 'Các tin bạn đánh dấu đã bán sẽ hiện ở đây.',
  },
  'da-an': {
    title: 'Chưa có tin đã ẩn',
    desc: 'Các tin bạn ẩn khỏi chợ sẽ hiện ở đây.',
  },
}

export default function TinCuaToiPage() {
  const subtab = useMarketplaceStore((s) => s.myListingsSubtab)
  const setSubtab = useMarketplaceStore((s) => s.setMyListingsSubtab)
  const showSuccess = useUIStore((s) => s.showSuccess)
  const showError = useUIStore((s) => s.showError)

  const [state, setState] = useState<AsyncState<(ListingCardData & { category?: ListingCategory })[]>>({
    status: 'loading',
  })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<ListingCategory | null>(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const res = await marketplaceApi.myListings()
      if (res.success) {
        const raw: ApiListing[] = Array.isArray(res.data)
          ? (res.data as ApiListing[])
          : ((res.data as { listings?: ApiListing[] })?.listings ?? [])
        setState({ status: 'success', data: raw.map(toListing) })
      } else {
        setState({ status: 'error', error: 'Không tải được tin của bạn.' })
      }
    } catch {
      setState({ status: 'error', error: 'Lỗi kết nối. Vui lòng thử lại.' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    if (state.status !== 'success') {
      return { 'dang-ban': 0, 'da-ban': 0, 'da-an': 0 }
    }
    return {
      'dang-ban': state.data.filter(
        (l) => l.status === 'dang-ban' || l.status === 'het-han'
      ).length,
      'da-ban': state.data.filter((l) => l.status === 'da-ban').length,
      'da-an': state.data.filter((l) => l.status === 'da-an').length,
    }
  }, [state])

  const filtered = useMemo(() => {
    if (state.status !== 'success') return []
    return state.data.filter((l) => {
      let matchTab = true
      if (subtab === 'dang-ban') matchTab = l.status === 'dang-ban' || l.status === 'het-han'
      if (subtab === 'da-ban') matchTab = l.status === 'da-ban'
      if (subtab === 'da-an') matchTab = l.status === 'da-an'
      const matchCat = !categoryFilter || l.category === categoryFilter
      return matchTab && matchCat
    })
  }, [state, subtab, categoryFilter])

  const handleMarkSold = async (id: string) => {
    try {
      await marketplaceApi.updateStatus(id, 'sold')
      showSuccess('Đã đánh dấu đã bán')
      load()
    } catch {
      showError('Không thể cập nhật trạng thái')
    }
  }

  const handleHide = async (id: string) => {
    try {
      await marketplaceApi.updateStatus(id, 'hidden')
      showSuccess('Đã ẩn tin')
      load()
    } catch {
      showError('Không thể ẩn tin')
    }
  }

  const handleUnhide = async (id: string) => {
    try {
      await marketplaceApi.updateStatus(id, 'active')
      showSuccess('Đã hiện tin lại')
      load()
    } catch {
      showError('Không thể hiện tin')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await marketplaceApi.updateStatus(deleteId, 'hidden')
      showSuccess('Đã xoá tin')
      setDeleteId(null)
      load()
    } catch {
      showError('Không thể xoá tin')
    } finally {
      setIsDeleting(false)
    }
  }

  const emptyCfg = EMPTY_CONFIG[subtab]

  return (
    <MarketplacePageShell
      sidebarActiveSubtab={subtab}
      sidebarCounts={counts}
      onSubtabChange={setSubtab}
    >
      <MarketplacePageHeader subtitle="Quản lý tin đăng, theo dõi khách quan tâm và chốt giao dịch." />

      <MobileSubtabPills active={subtab} onChange={setSubtab} counts={counts} />

      <div className="mt-5">
        <CategoryChips selected={categoryFilter} onChange={setCategoryFilter} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          {subtab === 'dang-ban' && 'Tin đang bán'}
          {subtab === 'da-ban' && 'Tin đã bán'}
          {subtab === 'da-an' && 'Tin đã ẩn'}
        </h2>
        {state.status === 'success' && (
          <span className="text-xs text-gray-400">{filtered.length} tin</span>
        )}
      </div>

      {state.status === 'loading' && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonGridCard key={i} />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <ErrorState
          type="network"
          message={state.error as string}
          onRetry={load}
          className="mt-8"
        />
      )}

      {state.status === 'success' && filtered.length === 0 && (
        <MarketplaceEmptyState
          icon={
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#EEF2FF]">
              <Store size={32} className="text-[#0047FF]" />
            </div>
          }
          title={emptyCfg.title}
          description={emptyCfg.desc}
          cta={emptyCfg.cta}
        />
      )}

      {state.status === 'success' && filtered.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <MyListingGridCard
              key={l.id}
              data={l}
              onMarkSold={handleMarkSold}
              onHide={handleHide}
              onUnhide={handleUnhide}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <MarketplacePromoCards />

      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xoá tin này?"
        description="Tin sẽ bị xoá vĩnh viễn và không thể khôi phục lại."
        confirmLabel="Xoá tin"
        cancelLabel="Huỷ"
        variant="danger"
        isLoading={isDeleting}
      />
    </MarketplacePageShell>
  )
}
