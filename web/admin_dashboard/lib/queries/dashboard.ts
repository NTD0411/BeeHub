"use server";

import { serverGet } from "@/lib/server-api";
import { normalizeMeta } from "@/lib/normalize-meta";
import type { DashboardStats, RevenueDataPoint } from "@/lib/types";

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await serverGet<any>("/admin/dashboard");
    if (data.success && data.data) return data.data as DashboardStats;
    throw new Error(data.message || "Failed to fetch dashboard stats");
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return {
      gmv_yesterday: 0,
      orders_yesterday: 0,
      active_users: 0,
      pending_verifications: 0,
      open_disputes: 0,
      platform_commission: 0,
    };
  }
}

export async function getRevenueByMonth(months = 12): Promise<RevenueDataPoint[]> {
  try {
    const data = await serverGet<any>("/admin/analytics/revenue", { months });
    if (data.success && data.data) {
      return data.data.map((item: any) => ({
        date: item.month,
        revenue: item.revenue,
        orders: 0,
      }));
    }
    return [];
  } catch (error) {
    console.error("Revenue by month error:", error);
    return [];
  }
}

export async function getOrderStatusDistribution(): Promise<
  { status: string; count: number }[]
> {
  try {
    const data = await serverGet<any>("/admin/dashboard/order-status-distribution");
    if (data.success && data.data) return data.data;
    return [];
  } catch (error) {
    console.error("Order status distribution error:", error);
    return [];
  }
}

export async function getLatestOrders(page = 1, pageSize = 10) {
  try {
    const data = await serverGet<any>("/admin/dashboard/latest-orders", {
      page,
      pageSize,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch latest orders");
  } catch (error) {
    console.error("Latest orders error:", error);
    return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } };
  }
}
