'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Khám phá', href: '/cho-sinh-vien' },
  { label: 'Yêu thích', href: '/cho-sinh-vien/yeu-thich' },
  { label: 'Tin của tôi', href: '/cho-sinh-vien/tin-cua-toi' },
]

export function MarketplaceTabs({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'inline-flex shrink-0 rounded-xl border border-gray-200 bg-gray-100 p-1',
        className
      )}
      role="tablist"
      aria-label="Điều hướng chợ sinh viên"
    >
      {TABS.map(({ label, href }) => {
        const active =
          href === '/cho-sinh-vien'
            ? pathname === href
            : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm',
              active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
