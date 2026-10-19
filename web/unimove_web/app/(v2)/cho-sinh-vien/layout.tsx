'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Khám phá', href: '/cho-sinh-vien' },
  { label: 'Yêu thích', href: '/cho-sinh-vien/yeu-thich' },
  { label: 'Tin của tôi', href: '/cho-sinh-vien/tin-cua-toi' },
]

export default function ChoSinhVienLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isExplore = pathname === '/cho-sinh-vien'
  const isChat = pathname.includes('/chat')
  const isMyMarketplace =
    pathname.startsWith('/cho-sinh-vien/tin-cua-toi') ||
    pathname.startsWith('/cho-sinh-vien/yeu-thich')
  const isFixedViewport = isExplore || isChat

  return (
    <div
      className={cn(
        'flex flex-col bg-[#F8FAFC]',
        isFixedViewport ? 'min-h-0 flex-1' : 'min-h-full'
      )}
    >
      {!isExplore && !isChat && !isMyMarketplace && (
        <div className="border-b border-gray-100 bg-white">
          <nav
            className="mx-auto flex max-w-7xl gap-1 px-4 py-2 lg:px-8"
            role="tablist"
            aria-label="Điều hướng chợ sinh viên"
          >
            {TABS.map(({ label, href }) => {
              const isActive =
                href === '/cho-sinh-vien' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#0047FF] text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
      {isFixedViewport ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </div>
  )
}
