'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

export function MarketplacePromoCards() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="flex h-full items-center justify-center text-3xl">💡</div>
          </div>
          <div className="min-w-0">
            <span className="inline-block rounded-md bg-[#FACC15] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-900">
              Mẹo nhỏ
            </span>
            <p className="mt-2 text-sm font-bold text-gray-900">Săn đồ hời từ bạn bè?</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Theo dõi tin yêu thích và nhắn tin thương lượng trực tiếp trên UniMove.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/cho-sinh-vien/dang-tin"
        className="group flex items-center gap-4 overflow-hidden rounded-2xl bg-gray-900 p-4 no-underline shadow-sm transition hover:bg-gray-800 sm:p-5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Zap size={22} className="text-[#FACC15]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">Đăng bán ngay</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            Biến đồ cũ thành chi phí vận chuyển — đăng tin miễn phí trên Chợ SV.
          </p>
        </div>
      </Link>
    </div>
  )
}
