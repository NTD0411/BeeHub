'use client'

import type { ReactNode } from 'react'
import {
  MyMarketplaceSidebar,
  MarketplaceSidebarMobilePostButton,
} from '@/components/marketplace/MyMarketplaceSidebar'
import type { MyListingsSubtab } from '@/lib/stores/useMarketplaceStore'

interface MarketplacePageShellProps {
  children: ReactNode
  sidebarActiveSubtab?: MyListingsSubtab | null
  sidebarCounts?: Record<MyListingsSubtab, number>
  onSubtabChange?: (tab: MyListingsSubtab) => void
  navigateSidebarOnSelect?: boolean
}

export function MarketplacePageShell({
  children,
  sidebarActiveSubtab = null,
  sidebarCounts,
  onSubtabChange,
  navigateSidebarOnSelect = false,
}: MarketplacePageShellProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-8">
      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-[calc(var(--z-index-topnav,50px)+72px)]">
            <MyMarketplaceSidebar
              activeSubtab={sidebarActiveSubtab}
              counts={sidebarCounts}
              onSubtabChange={onSubtabChange}
              navigateOnSelect={navigateSidebarOnSelect}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <MarketplaceSidebarMobilePostButton />
          {children}
        </main>
      </div>
    </div>
  )
}
