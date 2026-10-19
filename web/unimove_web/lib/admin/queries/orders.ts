"use server";

import { serverGet, serverPut } from "@/lib/admin/server-api";
import { normalizeMeta } from "@/lib/admin/normalize-meta";
import type { OrderStatus } from "@/lib/admin/types";

export async function getOrders({
  page = 1,
  pageSize = 20,
  status,
  search,
  dateFrom,
  dateTo,
}: {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const data = await serverGet<any>("/admin/orders", {
      page,
      pageSize,
      status,
      search,
      dateFrom,
      dateTo,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch orders");
  } catch (error) {
    console.error("Get orders error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function getOrderById(id: string) {
  try {
    const data = await serverGet<any>(`/admin/orders/${id}`);
    if (data.success && data.data) {
      return {
        order: data.data,
        history: data.data.order_status_history ?? [],
        payments: data.data.payments ?? [],
        error: null,
      };
    }
    throw new Error(data.message || "Failed to fetch order");
  } catch (error) {
    return {
      order: null,
      history: [],
      payments: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export async function forceCancelOrder(orderId: string, _adminId: string, reason: string) {
  try {
    const data = await serverPut<any>(`/admin/orders/${orderId}/cancel`, { reason });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to cancel order");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
