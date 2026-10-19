import Link from "next/link";
import {
  DollarSign,
  Package,
  Users,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

import {
  getAdminDashboardStats,
  getRevenueByMonth,
  getOrderStatusDistribution,
  getLatestOrders,
} from "@/lib/queries/dashboard";
import { formatVND } from "@/lib/formatters";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";

import { RevenueChart } from "./revenue-chart";
import { OrderDonutChart } from "./order-donut-chart";
import { OrdersTableClient } from "./orders-table-client";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────────────────────────
   Dashboard Page - Server Component (fetches data server-side with auth cookie)
───────────────────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  // All data fetched server-side — token read from cookie automatically
  const [stats, revenueRaw, orderDistribution, latestOrders] = await Promise.all([
    getAdminDashboardStats(),
    getRevenueByMonth(12),
    getOrderStatusDistribution(),
    getLatestOrders(1, 10),
  ]);

  const revenueData = revenueRaw.map((item: any) => ({
    date: item.date,
    revenue: item.revenue,
    orders: item.orders ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi hiệu suất nền tảng UniMove"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu hôm qua"
          value={formatVND(stats?.gmv_yesterday ?? 0)}
          icon={DollarSign}
          iconBg="var(--primary-tint)"
          iconColor="var(--primary)"
        />
        <StatCard
          title="Đơn hàng hôm qua"
          value={(stats?.orders_yesterday ?? 0).toLocaleString("vi-VN")}
          icon={Package}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          title="Người dùng đang hoạt động"
          value={(stats?.active_users ?? 0).toLocaleString("vi-VN")}
          icon={Users}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <Link href="/verifications" className="block">
          <StatCard
            title="Chờ xác minh"
            value={(stats?.pending_verifications ?? 0).toLocaleString("vi-VN")}
            icon={ShieldCheck}
            iconBg="#FEE2E2"
            iconColor="#DC2626"
            className="cursor-pointer"
          />
        </Link>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  Doanh thu theo tháng
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  12 tháng gần nhất
                </p>
              </div>
            </div>
            <RevenueChart data={revenueData} />
          </div>
        </div>
        <div className="xl:col-span-1">
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Phân bổ trạng thái đơn hàng
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Tất cả thời gian
              </p>
            </div>
            <OrderDonutChart data={orderDistribution} />
          </div>
        </div>
      </div>

      {/* Latest Orders */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
              Đơn hàng mới nhất
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {latestOrders.meta.total} đơn hàng
            </p>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {latestOrders.data.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có đơn hàng nào"
            description="Các đơn hàng mới sẽ xuất hiện tại đây."
          />
        ) : (
          <OrdersTableClient initialData={latestOrders} />
        )}
      </div>
    </div>
  );
}
