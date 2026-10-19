'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface MarketplaceEmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  cta?: { label: string; href: string }
}

export function MarketplaceEmptyState({
  icon,
  title,
  description,
  cta,
}: MarketplaceEmptyStateProps) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(250,204,21,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(0,71,255,0.06) 0%, transparent 50%)',
        }}
      />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl">
          {icon}
        </div>
        <p className="text-lg font-extrabold text-gray-900">{title}</p>
        <p className="mx-auto mt-2 max-w-sm px-4 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-gray-800"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  )
}
