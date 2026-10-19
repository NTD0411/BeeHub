"use server";

import { serverGet, serverPut } from "@/lib/server-api";
import type { DisputeStatus } from "@/lib/types";

export async function getDisputes({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: DisputeStatus;
}) {
  try {
    const data = await serverGet<any>("/admin/disputes", { page, pageSize, status });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: data.meta ?? { page, pageSize, total: 0, totalPages: 0 },
      };
    }
    throw new Error(data.message || "Failed to fetch disputes");
  } catch (error) {
    console.error("Get disputes error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function getDisputeById(id: string) {
  try {
    const data = await serverGet<any>(`/admin/disputes/${id}`);
    if (data.success && data.data) {
      return {
        dispute: data.data,
        messages: data.data.dispute_messages ?? [],
        error: null,
      };
    }
    throw new Error(data.message || "Failed to fetch dispute");
  } catch (error) {
    return { dispute: null, messages: [], error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function resolveDispute(
  disputeId: string,
  _adminId: string,
  resolution: string,
  resolutionType: string,
  refundAmount: number | null
) {
  try {
    const data = await serverPut<any>(`/admin/disputes/${disputeId}/resolve`, {
      resolution,
      resolution_type: resolutionType,
      refund_amount: refundAmount ?? undefined,
    });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to resolve dispute");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function getRefunds({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  try {
    const data = await serverGet<any>("/admin/refunds", { page, pageSize, status });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: data.meta ?? { page, pageSize, total: 0, totalPages: 0 },
      };
    }
    throw new Error(data.message || "Failed to fetch refunds");
  } catch (error) {
    console.error("Get refunds error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function approveRefund(refundId: string, _adminId: string) {
  try {
    const data = await serverPut<any>(`/admin/refunds/${refundId}/approve`);
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to approve refund");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
