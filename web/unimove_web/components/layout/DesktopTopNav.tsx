'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, LogOut, Settings, Search, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStoredUser, clearAuth, type AuthUser } from '@/lib/auth'
import { conversationsApi } from '@/lib/api'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useBookingFlowStore } from '@/lib/stores/useBookingFlowStore'

const NAV_LINKS = [
  { href: '/trang-chu',       label: 'Trang chủ' },
  { href: '/dat-chuyen',      label: 'Dịch vụ'   },
  { href: '/reference-prices', label: 'Bảng giá' },
  { href: '/nha-xe',          label: 'Nhà xe'    },
  { href: '/cho-sinh-vien',   label: 'Chợ SV'    },
  { href: '/hoat-dong',       label: 'Hoạt động' },
] as const

export function DesktopTopNav() {
  const pathname    = usePathname()
  const router      = useRouter()
  const [chatUnread, setChatUnread] = useState(0)

  const [user, setUser]           = useState<AuthUser | null>(null)
  const [open, setOpen]           = useState(false)
  const [pos, setPos]             = useState({ top: 0, right: 0 })
  const [searchQ, setSearchQ]     = useState('')
  const avatarRef                 = useRef<HTMLButtonElement>(null)
  const dropdownRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname])

  // Poll chat unread mỗi 30s
  useEffect(() => {
    const fetchChatUnread = async () => {
      if (!user) {
        setChatUnread(0)
        return
      }
      try {
        const res = await conversationsApi.list()
        if (res.success && Array.isArray(res.data)) {
          const total = (res.data as { unread_count?: number }[]).reduce(
            (sum, c) => sum + (c.unread_count ?? 0),
            0
          )
          setChatUnread(total)
        }
      } catch { /* ignore */ }
    }
    fetchChatUnread()
    const timer = setInterval(fetchChatUnread, 30_000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        avatarRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  const toggleDropdown = useCallback(() => {
    if (!open && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen((v) => !v)
  }, [open])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setOpen(false)
    router.replace('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      useBookingFlowStore.getState().setBookingMode('quote')
      router.push(`/dat-chuyen/dia-diem?q=${encodeURIComponent(searchQ.trim())}`)
    } else {
      router.push('/dat-chuyen')
    }
  }

  const initials = user?.full_name?.[0]?.toUpperCase() ?? 'P'
  const isActive = (href: string) =>
    href === '/trang-chu' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <header className="sticky top-0 z-50 hidden w-full shrink-0 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md lg:block">
        <div className="mx-auto flex h-[68px] max-w-[var(--width-container)] items-center gap-6 px-8">

          <Link href={user ? '/trang-chu' : '/'} className="flex shrink-0 items-center no-underline" aria-label="UniMove">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-[#FFC107]">Uni</span>
              <span className="text-[#0047FF]">Move</span>
            </span>
          </Link>

          {user && (
            <nav aria-label="Điều hướng chính" className="flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-colors no-underline',
                      active ? 'text-[#0047FF] font-semibold' : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#0047FF]" />
                    )}
                  </Link>
                )
              })}
            </nav>
          )}

          {user && (
            <form onSubmit={handleSearch} className="mx-auto hidden max-w-md flex-1 xl:flex">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Bạn muốn chuyển đến đâu?"
                  className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#0047FF] focus:bg-white focus:ring-2 focus:ring-[#0047FF]/15"
                />
              </div>
            </form>
          )}

          <div className="ml-auto flex items-center gap-2.5">
            {user ? (
              <>
                <Link
                  href="/tin-nhan"
                  aria-label={chatUnread > 0 ? `${chatUnread} tin nhắn chưa đọc` : 'Tin nhắn'}
                  aria-current={isActive('/tin-nhan') ? 'page' : undefined}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100',
                    isActive('/tin-nhan') && 'bg-blue-50 text-[#0047FF]'
                  )}
                >
                  <MessageCircle className="h-5 w-5 text-gray-600" strokeWidth={1.75} />
                  {chatUnread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {chatUnread > 99 ? '99+' : chatUnread}
                    </span>
                  )}
                </Link>

                <NotificationBell
                  buttonClassName="h-10 w-10"
                  iconClassName="h-5 w-5 text-gray-600"
                  iconSize={20}
                />

                <button
                  ref={avatarRef}
                  onClick={toggleDropdown}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full border px-2 pr-3 transition-colors focus:outline-none',
                    open ? 'border-[#0047FF] bg-blue-50/50' : 'border-gray-200 hover:border-[#0047FF]/40'
                  )}
                  aria-label="Menu tài khoản"
                  aria-expanded={open}
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#0047FF] text-xs font-bold text-white">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Tài khoản</span>
                </button>

                <Link
                  href="/dat-chuyen"
                  className="rounded-full bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-[#e6ad00] no-underline"
                >
                  Đặt ngay
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/dang-nhap" className="text-sm font-semibold text-[#0047FF] hover:underline no-underline">
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#0047FF] px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(0,71,255,0.25)] transition-all hover:brightness-110 no-underline"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            width: 224,
            zIndex: 99999,
          }}
          className="rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
        >
          <div className="border-b border-gray-50 px-4 py-2.5">
            <p className="truncate text-sm font-bold text-gray-900">{user?.full_name}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>

          <Link
            href="/tai-khoan"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 no-underline"
          >
            <Settings size={15} className="text-gray-400" />
            Tài khoản
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={15} className="text-red-400" />
            Đăng xuất
          </button>
        </div>
      )}
    </>
  )
}
