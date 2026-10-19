import { cn } from '@/lib/utils'
import type { SkeletonType } from '@/lib/types/states'

/* ── Primitive ──────────────────────────────────────────────── */
function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-skeleton rounded-md bg-surface-2', className)} aria-hidden="true" />
}

/* ── Skeleton variants ──────────────────────────────────────── */

function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Sk className="aspect-square w-full rounded-xl" />
          <Sk className="h-3 w-full" />
          <Sk className="h-4 w-2/3" />
          <Sk className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function ProductListHorizontalSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex w-40 shrink-0 flex-col gap-2">
          <Sk className="aspect-square w-40 rounded-xl" />
          <Sk className="h-3 w-full" />
          <Sk className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div>
      <Sk className="aspect-square w-full rounded-none" />
      <div className="space-y-3 px-4 pt-4">
        <Sk className="h-8 w-2/5" />
        <Sk className="h-6 w-3/4" />
        <div className="flex items-center gap-3 py-1">
          <Sk className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-4 w-24" />
            <Sk className="h-3 w-16" />
          </div>
        </div>
        <Sk className="h-4 w-full" />
        <Sk className="h-4 w-5/6" />
        <Sk className="h-4 w-4/6" />
        <Sk className="mt-2 h-16 w-full rounded-xl" />
      </div>
    </div>
  )
}

function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <Sk className="h-3 w-24" />
            <Sk className="h-5 w-24 rounded-full" />
          </div>
          <Sk className="mb-1.5 h-4 w-full" />
          <Sk className="mb-3 h-4 w-4/5" />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="space-y-1.5">
              <Sk className="h-5 w-20" />
              <Sk className="h-3 w-16" />
            </div>
            <Sk className="h-8 w-20 rounded-button" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Sk className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Sk className="h-4 w-28" />
              <Sk className="h-3 w-12" />
            </div>
            <Sk className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col items-center gap-3 py-6">
        <Sk className="h-20 w-20 rounded-full" />
        <Sk className="h-5 w-32" />
        <Sk className="h-4 w-24" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-surface p-4">
          <Sk className="h-9 w-9 rounded-xl" />
          <Sk className="h-4 flex-1" />
          <Sk className="h-4 w-4 rounded" />
        </div>
      ))}
    </div>
  )
}

function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <Sk className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Sk className="h-4 w-3/4" />
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Public component ───────────────────────────────────────── */

interface LoadingStateProps {
  type: SkeletonType
  count?: number
  className?: string
}

export function LoadingState({ type, count, className }: LoadingStateProps) {
  return (
    <div className={className} aria-busy="true" aria-label="Đang tải...">
      {type === 'product-grid'       && <ProductGridSkeleton count={count ?? 6} />}
      {type === 'product-list-h'     && <ProductListHorizontalSkeleton count={count ?? 4} />}
      {type === 'product-detail'     && <ProductDetailSkeleton />}
      {type === 'order-list'         && <OrderListSkeleton count={count ?? 4} />}
      {type === 'order-detail'       && <OrderListSkeleton count={1} />}
      {type === 'message-list'       && <MessageListSkeleton count={count ?? 6} />}
      {type === 'message-chat'       && <MessageListSkeleton count={count ?? 6} />}
      {type === 'profile'            && <ProfileSkeleton />}
      {type === 'notification-list'  && <NotificationListSkeleton count={count ?? 5} />}
      {type === 'listing-form'       && <ProfileSkeleton />}
    </div>
  )
}
