"use client";

import {
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatVND, formatPercent, formatRating } from "@/lib/formatters";
import type { RevenueDataPoint } from "@/lib/types";
import { AnalyticsChartsClient } from "./analytics-charts-client";

interface GMVStats {
  thisGMV: number;
  lastGMV: number;
  growth: number;
}

interface OrderStats {
  total_orders: number;
  completed_count: number;
  cancelled_count: number;
  total_revenue: number;
  average_order_value: number;
  completion_rate: number;
}

interface TopProvider {
  id: string;
  business_name: string;
  rating: number;
  total_reviews: number;
  total_orders: number;
  profiles?: { full_name: string } | { full_name: string }[];
}

interface CommissionData {
  month: string;
  commission: number;
}

interface AnalyticsPageClientProps {
  gmv: GMVStats;
  orderStats: OrderStats | null;
  topProviders: TopProvider[];
  commissionData: CommissionData[];
  revenueData: RevenueDataPoint[];
}

export function AnalyticsPageClient({
  gmv,
  orderStats,
  topProviders,
  commissionData,
  revenueData,
}: AnalyticsPageClientProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân tích & Báo cáo"
        description="Theo dõi hiệu suất kinh doanh và xu hướng tăng trưởng"
      />

      {/* GMV + Order stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="GMV tháng này"
          value={formatVND(gmv.thisGMV)}
          delta={gmv.growth}
          deltaLabel="so với tháng trước"
          icon={DollarSign}
          iconBg="var(--primary-tint)"
          iconColor="var(--primary)"
        />
        <StatCard
          title="GMV tháng trước"
          value={formatVND(gmv.lastGMV)}
          icon={TrendingUp}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          title="Tổng đơn (tháng này)"
          value={(orderStats?.total_orders ?? 0).toLocaleString("vi-VN")}
          icon={Package}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
        <StatCard
          title="Tỷ lệ hoàn thành"
          value={formatPercent(orderStats?.completion_rate ?? 0)}
          icon={CheckCircle}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Đơn hoàn thành"
          value={(orderStats?.completed_count ?? 0).toLocaleString("vi-VN")}
          icon={CheckCircle}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
        />
        <StatCard
          title="Đơn đã hủy"
          value={(orderStats?.cancelled_count ?? 0).toLocaleString("vi-VN")}
          icon={XCircle}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
        />
        <StatCard
          title="Doanh thu (tháng này)"
          value={formatVND(orderStats?.total_revenue ?? 0)}
          icon={DollarSign}
          iconBg="var(--primary-tint)"
          iconColor="var(--primary)"
        />
        <StatCard
          title="Giá trị đơn TB"
          value={formatVND(orderStats?.average_order_value ?? 0)}
          icon={Package}
          iconBg="#E0E7FF"
          iconColor="#4F46E5"
        />
      </div>

      {/* Charts */}
      <AnalyticsChartsClient
        revenueData={revenueData}
        commissionData={commissionData}
      />

      {/* Top providers */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Top nhà vận chuyển
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Xếp hạng theo số đơn hoàn thành
          </p>
        </div>

        {topProviders.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Chưa có dữ liệu nhà vận chuyển"
            description="Dữ liệu sẽ hiển thị khi có nhà vận chuyển được xác minh."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#", "Doanh nghiệp", "Chủ sở hữu", "Đánh giá", "Tổng đơn"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "var(--muted)" }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {topProviders.map((provider, idx) => {
                  const owner = Array.isArray(provider.profiles)
                    ? provider.profiles[0]?.full_name
                    : provider.profiles?.full_name;
                  return (
                    <tr
                      key={provider.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--muted)" }}>
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                        {provider.business_name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                        {owner ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span style={{ color: "var(--text)" }}>
                            {formatRating(provider.rating)}
                          </span>
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            ({provider.total_reviews})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                        {provider.total_orders.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
