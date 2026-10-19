'use client'

import { useState, useEffect, useMemo } from 'react'
import { Heart } from 'lucide-react'
import { ProductCard, type ProductCardData } from '@/components/cards/ProductCard'
import { ErrorState } from '@/components/shared/ErrorState'
import { MarketplacePageShell } from '@/components/marketplace/MarketplacePageShell'
import { MarketplacePageHeader } from '@/components/marketplace/MarketplacePageHeader'
import { MarketplaceEmptyState } from '@/components/marketplace/MarketplaceEmptyState'
import { MarketplacePromoCards } from '@/components/marketplace/MarketplacePromoCards'
import { useMarketplaceStore } from '@/lib/stores/useMarketplaceStore'
import { marketplaceApi } from '@/lib/api'
import type { AsyncState } from '@/lib/types/states'
import type { MyListingsSubtab } from '@/lib/stores/useMarketplaceStore'

interface ApiListing {
  id: string
  title: string
  price?: number
  condition?: string
  city?: string
  status: string
  images?: string[]
  is_urgent?: boolean
  created_at?: string
  seller?: { full_name?: string }
}

function toListing(l: ApiListing): ProductCardData {
  return {
    id: l.id,
    title: l.title,
    price: l.price ?? 0,
    condition: l.condition,
    location: l.city,
    imageUrl: l.images?.[0],
    isUrgent: l.is_urgent,
    created_at: l.created_at,
    seller_name: l.seller?.full_name,
  }
}

function apiStatusToSubtab(s: string): MyListingsSubtab | null {
  if (s === 'sold' || s === 'completed') return 'da-ban'
  if (s === 'hidden') return 'da-an'
  if (s === 'expired') return 'dang-ban'
  if (s === 'active' || s === 'reserved') return 'dang-ban'
  return 'dang-ban'
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

export default function YeuThichPage() {
  const savedIds = useMarketplaceStore((s) => s.savedListingIds)
  const [state, setState] = useState<AsyncState<ProductCardData[]>>({ status: 'loading' })
  const [sidebarCounts, setSidebarCounts] = useState<Record<MyListingsSubtab, number>>({
    'dang-ban': 0,
    'da-ban': 0,
    'da-an': 0,
  })

  useEffect(() => {
    async function load() {
      setState({ status: 'loading' })
      try {
        const [interestsRes, myRes] = await Promise.all([
          marketplaceApi.myInterests(),
          marketplaceApi.myListings(),
        ])

        if (interestsRes.success) {
          const raw: ApiListing[] = Array.isArray(interestsRes.data)
            ? (interestsRes.data as ApiListing[])
            : ((interestsRes.data as { listings?: ApiListing[] })?.listings ?? [])
          setState({ status: 'success', data: raw.map(toListing) })
        } else {
          setState({ status: 'error', error: 'Không tải được danh sách yêu thích.' })
        }

        if (myRes.success) {
          const mine: ApiListing[] = Array.isArray(myRes.data)
            ? (myRes.data as ApiListing[])
            : ((myRes.data as { listings?: ApiListing[] })?.listings ?? [])
          const counts = { 'dang-ban': 0, 'da-ban': 0, 'da-an': 0 }
          for (const l of mine) {
            const tab = apiStatusToSubtab(l.status)
            if (tab) counts[tab]++
          }
          setSidebarCounts(counts)
        }
      } catch {
        setState({ status: 'error', error: 'Lỗi kết nối.' })
      }
    }
    void load()
  }, [savedIds.length])

  const itemCount = useMemo(
    () => (state.status === 'success' ? state.data.length : 0),
    [state]
  )

  return (
    <MarketplacePageShell
      sidebarActiveSubtab={null}
      sidebarCounts={sidebarCounts}
      navigateSidebarOnSelect
    >
      <MarketplacePageHeader subtitle="Sản phẩm bạn đã lưu yêu thích" />

      {state.status === 'loading' && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <ErrorState
          type="network"
          message={state.error as string}
          onRetry={() => setState({ status: 'loading' })}
          className="mt-8"
        />
      )}

      {state.status === 'success' && itemCount === 0 && (
        <MarketplaceEmptyState
          icon={
            <div
              className="flex h-full w-full items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' }}
            >
              <Heart size={40} className="text-red-400" strokeWidth={1.75} />
            </div>
          }
          title="Chưa có sản phẩm yêu thích"
          description="Nhấn vào biểu tượng ♡ trên sản phẩm để lưu lại những món bạn thích"
          cta={{ label: 'Khám phá ngay', href: '/cho-sinh-vien' }}
        />
      )}

      {state.status === 'success' && itemCount > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-base font-bold text-gray-900">Đã lưu</p>
            <span className="text-xs text-gray-400">{itemCount} sản phẩm</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {state.data.map((l) => (
              <ProductCard key={l.id} data={l} variant="grid" href={`/cho-sinh-vien/${l.id}`} />
            ))}
          </div>
        </>
      )}

      <MarketplacePromoCards />
    </MarketplacePageShell>
  )
}
