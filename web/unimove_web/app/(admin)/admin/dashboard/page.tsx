import Link from "next/link";
import {
  DollarSign,
  Package,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import {
  getAdminDashboardStats,
  getRevenueByMonth,
} from "@/lib/admin/queries/dashboard";
import { formatVND } from "@/lib/admin/formatters";
import { StatCard } from "@/components/admin-dashboard/stat-card";
import { PageHeader } from "@/components/admin-dashboard/page-header";

import { RevenueChart } from "./revenue-chart";
import { OrdersChart } from "./orders-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, revenueRaw] = await Promise.all([
    getAdminDashboardStats(),
    getRevenueByMonth(12),
  ]);

  const revenueData = revenueRaw.map((item: { date: string; revenue: number; orders?: number }) => ({
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
          iconBg="rgba(79, 70, 229, 0.10)"
          iconColor="#4F46E5"
        />
        <StatCard
          title="Đơn hàng hôm qua"
          value={(stats?.orders_yesterday ?? 0).toLocaleString("vi-VN")}
          icon={Package}
          iconBg="rgba(245, 158, 11, 0.10)"
          iconColor="#D97706"
        />
        <StatCard
          title="Người dùng đang hoạt động"
          value={(stats?.active_users ?? 0).toLocaleString("vi-VN")}
          icon={Users}
          iconBg="rgba(16, 185, 129, 0.10)"
          iconColor="#059669"
        />
        <Link href="/admin/verifications" className="block">
          <StatCard
            title="Chờ xác minh"
            value={(stats?.pending_verifications ?? 0).toLocaleString("vi-VN")}
            icon={ShieldCheck}
            iconBg="rgba(239, 68, 68, 0.10)"
            iconColor="#DC2626"
            className="cursor-pointer"
          />
        </Link>
      </div>

      {/* Column charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                Số đơn theo tháng
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                12 tháng gần nhất
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--primary)" }}
            >
              Quản lý đơn
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <OrdersChart data={revenueData} />
        </div>
      </div>
    </div>
  );
}
