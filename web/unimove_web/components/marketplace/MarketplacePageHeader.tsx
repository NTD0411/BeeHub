'use client'

import { MarketplaceTabs } from '@/components/marketplace/MarketplaceTabs'

interface MarketplacePageHeaderProps {
  subtitle: string
}

export function MarketplacePageHeader({ subtitle }: MarketplacePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Chợ sinh viên
        </h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      <MarketplaceTabs />
    </div>
  )
}
