export const dynamic = "force-dynamic";

import {
  getGMVStats,
  getOrderStatistics,
  getTopProviders,
  getPlatformCommissionByMonth,
} from "@/lib/admin/queries/analytics";
import { getRevenueByMonth } from "@/lib/admin/queries/dashboard";
import { AnalyticsPageClient } from "./page-client";

export default async function AnalyticsPage() {
  const [gmv, orderStats, topProviders, commissionData, revenueRaw] =
    await Promise.all([
      getGMVStats(),
      getOrderStatistics(),
      getTopProviders(10),
      getPlatformCommissionByMonth(6),
      getRevenueByMonth(12),
    ]);

  const revenueData = revenueRaw.map((item) => ({
    date: item.date,
    revenue: item.revenue,
    orders: item.orders ?? 0,
  }));

  return (
    <AnalyticsPageClient
      gmv={gmv}
      orderStats={orderStats}
      topProviders={topProviders}
      commissionData={commissionData}
      revenueData={revenueData}
    />
  );
}
