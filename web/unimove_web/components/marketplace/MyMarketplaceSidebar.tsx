'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Tag, ShoppingBag, EyeOff, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketplaceStore, type MyListingsSubtab } from '@/lib/stores/useMarketplaceStore'

const SIDEBAR_ITEMS: {
  key: MyListingsSubtab
  label: string
  icon: React.ElementType
}[] = [
  { key: 'dang-ban', label: 'Đang bán', icon: Tag },
  { key: 'da-ban', label: 'Đã bán', icon: ShoppingBag },
  { key: 'da-an', label: 'Đã ẩn', icon: EyeOff },
]

interface MyMarketplaceSidebarProps {
  activeSubtab?: MyListingsSubtab | null
  counts?: Record<MyListingsSubtab, number>
  onSubtabChange?: (tab: MyListingsSubtab) => void
  /** Khi true, click menu sẽ chuyển sang trang Tin của tôi */
  navigateOnSelect?: boolean
}

export function MyMarketplaceSidebar({
  activeSubtab = null,
  counts = { 'dang-ban': 0, 'da-ban': 0, 'da-an': 0 },
  onSubtabChange,
  navigateOnSelect = false,
}: MyMarketplaceSidebarProps) {
  const router = useRouter()
  const setSubtab = useMarketplaceStore((s) => s.setMyListingsSubtab)

  const handleSelect = (key: MyListingsSubtab) => {
    setSubtab(key)
    onSubtabChange?.(key)
    if (navigateOnSelect) {
      router.push('/cho-sinh-vien/tin-cua-toi')
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:min-h-[480px]">
      <div>
        <h2 className="text-sm font-bold text-gray-900">Chợ của tôi</h2>
        <p className="text-[11px] text-gray-400">Quản lý tin đăng</p>
      </div>

      <nav className="mt-5 space-y-1">
        {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = activeSubtab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#FACC15] text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {counts[key] > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-black/10 text-gray-900' : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          )
        })}

        <Link
          href="/tai-khoan/chinh-sua"
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 no-underline transition-colors hover:bg-gray-50"
        >
          <Settings size={16} className="shrink-0" />
          Cài đặt
        </Link>
      </nav>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <Link
          href="/cho-sinh-vien/dang-tin"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white py-3 text-sm font-bold text-gray-900 no-underline transition hover:bg-gray-50"
        >
          <Plus size={16} />
          Đăng tin mới
        </Link>
      </div>
    </div>
  )
}

export function MobileSubtabPills({
  active,
  onChange,
  counts,
}: {
  active: MyListingsSubtab
  onChange: (t: MyListingsSubtab) => void
  counts: Record<MyListingsSubtab, number>
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
      {SIDEBAR_ITEMS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
            active === key
              ? 'bg-[#FACC15] text-gray-900'
              : 'border border-gray-200 bg-white text-gray-600'
          )}
        >
          {label}
          {counts[key] > 0 ? ` (${counts[key]})` : ''}
        </button>
      ))}
    </div>
  )
}

export function MarketplaceSidebarMobilePostButton() {
  return (
    <Link
      href="/cho-sinh-vien/dang-tin"
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white py-2.5 text-sm font-bold text-gray-900 no-underline lg:hidden"
    >
      <Plus size={16} />
      Đăng tin mới
    </Link>
  )
}
