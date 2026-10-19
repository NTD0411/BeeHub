# UniMove Admin Dashboard — Tài liệu bàn giao API

> Dành cho dev lắp API vào UI đã có sẵn.  
> UI đã hoàn chỉnh, responsive, dark mode. Dev chỉ cần **điền data thật** vào các hàm trong `lib/queries/`.

---

## 1. Cấu hình môi trường

File: `web/admin_dashboard/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://byqwsmdgyojzgyhbladx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # tuỳ chọn, bypass RLS
```

Supabase client:
- **Browser** (client component): `lib/supabase/client.ts` → `createClient()`
- **Server** (server component / server action): `lib/supabase/server.ts` → `createClient()`

---

## 2. Sơ đồ trang — Query function tương ứng

### 2.1 Dashboard (`/dashboard`)

**File UI:** `app/(dashboard)/dashboard/page.tsx`

| Component | Query function | Bảng DB |
|---|---|---|
| 4 Stat cards | `getAdminDashboardStats()` | RPC `get_admin_dashboard_stats()` hoặc `payments`, `orders`, `profiles` |
| Biểu đồ doanh thu | `getRevenueByMonth(12)` | `payments` WHERE `status='completed'` GROUP BY month |
| Donut trạng thái đơn | `getOrderStatusDistribution()` | `orders` GROUP BY `status` |
| Bảng đơn mới nhất | `getLatestOrders(page, pageSize)` | `orders` JOIN `profiles` |

**Kiểu trả về `getAdminDashboardStats()`:**
```ts
{
  gmv_yesterday: number        // Tổng doanh thu hôm qua (VND)
  orders_yesterday: number     // Số đơn hôm qua
  active_users: number         // Users status='active'
  pending_verifications: number
  open_disputes: number
  platform_commission: number
}
```

---

### 2.2 Người dùng (`/users`)

**File UI:** `app/(dashboard)/users/page.tsx`  
**File query:** `lib/queries/users.ts`

```ts
// Lấy danh sách users
getUsers({ role, search, status, page, pageSize })
// → { data: Profile[], meta: PaginationMeta }

// Ban / Unban
updateUserStatus(id: string, status: UserStatus)
// status: 'active' | 'suspended' | 'inactive' | 'pending_verification'
```

**Cột hiển thị:**
- **Khách hàng:** `full_name`, `email`, `phone`, `university`, `total_orders`, `total_spent`, `status`, `created_at`
- **Nhà vận chuyển:** `full_name`, `business_name`, `email`, `vehicle_type`, `rating`, `total_orders`, `total_earnings`, `verification_status`, `status`

---

### 2.3 Xác minh (`/verifications`)

**File UI:** `app/(dashboard)/verifications/page.tsx`  
**File query:** `lib/queries/verifications.ts`

```ts
// Danh sách provider theo trạng thái xác minh
getPendingProviders({ page, pageSize, status })
// status: 'pending' | 'approved' | 'rejected'

// Xem giấy tờ của 1 provider
getProviderDocuments(providerId: string)
// → ProviderDocument[] (document_type, document_url, document_number, expiry_date)

// Duyệt / Từ chối
updateVerificationStatus(providerId, status, notes, adminId)
// Cập nhật: profiles.verification_status, is_verified, verified_at, verified_by, verification_notes
```

**Loại giấy tờ (`document_type`):**
| Giá trị DB | Hiển thị |
|---|---|
| `license` | Bằng lái xe |
| `id_card` | CMND / CCCD |
| `vehicle_registration` | Đăng ký xe |
| `insurance` | Bảo hiểm |

---

### 2.4 Đơn hàng (`/orders` và `/orders/[id]`)

**File UI:** `app/(dashboard)/orders/page.tsx`, `app/(dashboard)/orders/[id]/page.tsx`  
**File query:** `lib/queries/orders.ts`

```ts
// Danh sách đơn
getOrders({ page, pageSize, status, search })
// search theo order_number

// Chi tiết 1 đơn
getOrderById(id)
// → { order, history: OrderStatusHistory[], payments: Payment[] }

// Hủy đơn (admin)
forceCancelOrder(orderId, adminId, reason)
// Cập nhật: status='cancelled', cancelled_by, cancelled_at, cancellation_reason
```

**Enum `order_status` → nhãn tiếng Việt:**
| DB value | Hiển thị | Màu badge |
|---|---|---|
| `pending` | Chờ xử lý | Vàng |
| `matched` | Đã ghép | Xanh dương |
| `accepted` | Đã nhận | Indigo |
| `picking_up` | Đang đến lấy | Tím |
| `picked_up` | Đã lấy hàng | Cyan |
| `in_progress` | Đang vận chuyển | Xanh lá |
| `completed` | Hoàn thành | Xanh lá đậm |
| `cancelled` | Đã hủy | Đỏ |
| `disputed` | Tranh chấp | Cam |

---

### 2.5 Khiếu nại & Hoàn tiền (`/disputes`)

**File UI:** `app/(dashboard)/disputes/page.tsx`  
**File query:** `lib/queries/disputes.ts`

```ts
// Tab Khiếu nại
getDisputes({ page, pageSize, status })
// status: 'open' | 'investigating' | 'resolved' | 'closed'

getDisputeById(id)
// → { dispute, messages: DisputeMessage[] }

resolveDispute(disputeId, adminId, resolution, resolutionType, refundAmount)
// resolutionType: 'refund' | 'partial_refund' | 'no_action' | 'provider_penalty' | 'customer_penalty'

// Tab Hoàn tiền
getRefunds({ page, pageSize, status })
// status theo payment_status enum

approveRefund(refundId, adminId)
// Cập nhật: status='completed', approved_by, processed_at
```

---

### 2.6 Đánh giá (`/reviews`)

**File UI:** `app/(dashboard)/reviews/page.tsx`  
**File query:** `lib/queries/reviews.ts`

```ts
getReviews({ page, pageSize, flagged?, hidden? })

hideReview(reviewId, reason, adminId)
// Cập nhật: is_hidden=true, hidden_reason, is_published=false, moderated_by, moderated_at

unhideReview(reviewId, adminId)

flagReview(reviewId, reason)
// Cập nhật: is_flagged=true, flagged_reason
```

---

### 2.7 Thống kê (`/analytics`)

**File UI:** `app/(dashboard)/analytics/page.tsx`  
**File query:** `lib/queries/analytics.ts`

```ts
getGMVStats()
// → { thisGMV, lastGMV, growth }

getOrderStatistics(startDate?, endDate?)
// RPC get_order_statistics() → { total_orders, completed_count, cancelled_count, total_revenue, average_order_value, completion_rate }

getTopProviders(limit = 10)
// RPC get_top_providers() → [{ provider_id, business_name, rating, total_reviews, total_orders }]

getPlatformCommissionByMonth(months = 6)
// → [{ month: 'YYYY-MM', commission: number }]

getRevenueByMonth(12)  // từ lib/queries/dashboard.ts
```

---

### 2.8 Thông báo (`/notifications`)

**File UI:** `app/(dashboard)/notifications/page.tsx`  
**File query:** `lib/queries/notifications.ts`

```ts
getAnnouncements({ page, pageSize })
// → announcements[]

createAnnouncement({ title, body, targetAudience, targetCities?, priority, scheduledAt?, createdBy })
// targetAudience: 'all' | 'customers' | 'providers'
// priority: 'low' | 'normal' | 'high' | 'urgent'
// Nếu scheduledAt = null → is_published=true ngay lập tức

publishAnnouncement(id)
// Cập nhật: is_published=true, published_at=now()
```

---

### 2.9 Nhật ký hoạt động (`/activity-logs`)

**File UI:** `app/(dashboard)/activity-logs/page.tsx`  
**File query:** `lib/queries/activity-logs.ts`

```ts
// Tab Đơn hàng — lịch sử thay đổi status
getOrderStatusHistory({ page, pageSize })
// Bảng: order_status_history JOIN orders JOIN profiles(changed_by)

// Tab Xác minh — lịch sử duyệt provider
getVerificationHistory({ page, pageSize })
// Bảng: profiles WHERE role='provider' AND verified_at IS NOT NULL

// Tab Hoàn tiền — lịch sử duyệt refund
getRefundHistory({ page, pageSize })
// Bảng: refunds WHERE processed_at IS NOT NULL
```

---

### 2.10 Cài đặt (`/settings`)

**File UI:** `app/(dashboard)/settings/page.tsx` + 4 section files  
**Sub-sections:**

| File | Chức năng |
|---|---|
| `profile-section.tsx` | Hiển thị / sửa tên admin, đổi password |
| `theme-section.tsx` | Light / Dark / System mode |
| `platform-settings-section.tsx` | Đọc/ghi bảng `platform_settings` (key-value JSONB) |
| `danger-zone-section.tsx` | Đăng xuất |

**Bảng `platform_settings` — các key đã dùng:**
| key | Mô tả | Ví dụ value |
|---|---|---|
| `platform_name` | Tên nền tảng | `"UniMove"` |
| `commission_rate` | % hoa hồng | `15` |
| `support_email` | Email hỗ trợ | `"support@unimove.com"` |

---

## 3. Cấu trúc thư mục

```
web/admin_dashboard/
├── app/
│   ├── (auth)/login/page.tsx          # Trang đăng nhập
│   └── (dashboard)/
│       ├── layout.tsx                  # Layout chung
│       ├── dashboard/page.tsx
│       ├── users/page.tsx
│       ├── verifications/page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── disputes/page.tsx
│       ├── reviews/page.tsx
│       ├── analytics/page.tsx
│       ├── notifications/page.tsx
│       ├── activity-logs/page.tsx
│       └── settings/
│           ├── page.tsx
│           ├── profile-section.tsx
│           ├── theme-section.tsx
│           ├── platform-settings-section.tsx
│           └── danger-zone-section.tsx
├── components/
│   ├── ui/                             # Button, Input, Dialog, Badge, Table...
│   ├── dashboard/                      # Sidebar, Header, StatCard, Charts...
│   └── providers/theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   └── server.ts                   # Server Supabase client (SSR)
│   ├── queries/                        # ← ĐIỀN DATA VÀO ĐÂY
│   │   ├── dashboard.ts
│   │   ├── users.ts
│   │   ├── verifications.ts
│   │   ├── orders.ts
│   │   ├── disputes.ts
│   │   ├── reviews.ts
│   │   ├── analytics.ts
│   │   ├── notifications.ts
│   │   └── activity-logs.ts
│   ├── stores/sidebar-store.ts         # Zustand: sidebar state
│   ├── types.ts                        # TypeScript types từ schema thật
│   └── formatters.ts                   # formatVND, formatDateTime...
└── proxy.ts                            # Auth guard (Next.js 16 middleware)
```

---

## 4. TypeScript types chính

```ts
// lib/types.ts — các type quan trọng

type OrderStatus = 'pending' | 'matched' | 'accepted' | 'picking_up' | 'picked_up'
                 | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

type UserStatus  = 'active' | 'inactive' | 'suspended' | 'pending_verification'
type UserRole    = 'customer' | 'provider' | 'admin'
type VerificationStatus = 'pending' | 'approved' | 'rejected'
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed'
                   | 'refunded' | 'partially_refunded' | 'cancelled'
type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed'
```

---

## 5. Helper functions sẵn có

```ts
// lib/formatters.ts
formatVND(amount)          // 450000 → "450.000đ"
formatOrderNumber(str)     // "UNI-20240101-0001" → "#UNI-20240101-0001"
formatDate(date)           // → "01/06/2025"
formatDateTime(date)       // → "01/06/2025, 14:30"
formatRelativeTime(date)   // → "5 phút trước"
formatRating(value)        // → "4.5"
formatPercent(value)       // → "87.3%"
```

---

## 6. Cách lắp API — ví dụ thực tế

### Ví dụ: thêm filter ngày cho danh sách đơn hàng

**Mở file:** `lib/queries/orders.ts`

```ts
// Thêm dateFrom, dateTo vào params
export async function getOrders({
  page = 1, pageSize = 20, status, search,
  dateFrom, dateTo,          // ← THÊM
}: { ... dateFrom?: string; dateTo?: string }) {
  let query = supabase.from('orders').select(...)

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo)   query = query.lte('created_at', dateTo)
  ...
}
```

### Ví dụ: lấy admin ID để ghi `resolved_by`

```ts
// Trong server component / server action
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const adminId = user?.id  // UUID admin hiện tại
```

---

## 7. Lưu ý quan trọng

| # | Lưu ý |
|---|---|
| 1 | Tất cả bảng đã có **RLS** — đăng nhập đúng admin là truy vấn được |
| 2 | Đơn hàng format: `order_number` dạng `UNI-20240101-0001`, hiển thị thêm `#` ở đầu |
| 3 | Tiền tệ: toàn bộ VND, dùng `formatVND()` |
| 4 | Join Supabase trả về object hoặc array tuỳ alias FK — cast `as unknown as Type[]` nếu cần |
| 5 | Các bảng đã bị DROP (không dùng): `wallets`, `wallet_transactions`, `geofences`, `feedback`, `abuse_reports` |
| 6 | RPC functions sẵn có: `get_admin_dashboard_stats()`, `get_order_statistics()`, `get_top_providers()` |
| 7 | Query files có `"use server"` directive — chỉ gọi từ server component hoặc useEffect trong client component |
