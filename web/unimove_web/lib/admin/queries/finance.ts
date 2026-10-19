"use server";

import { serverGet, serverPut } from "@/lib/admin/server-api";
import { normalizeMeta } from "@/lib/admin/normalize-meta";

export async function getProviderEarnings({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  try {
    const data = await serverGet<any>("/admin/provider-earnings", {
      page,
      pageSize,
      status: status && status !== "all" ? status : undefined,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch provider earnings");
  } catch (error) {
    console.error("Get provider earnings error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: normalizeMeta(null, { page, pageSize }),
    };
  }
}

export async function getWithdrawals({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  try {
    const data = await serverGet<any>("/admin/withdrawals", {
      page,
      pageSize,
      status: status && status !== "all" ? status : undefined,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch withdrawals");
  } catch (error) {
    console.error("Get withdrawals error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: normalizeMeta(null, { page, pageSize }),
    };
  }
}

export async function approveWithdrawal(id: string, transactionReference?: string) {
  try {
    const data = await serverPut<any>(`/admin/withdrawals/${id}/approve`, {
      transaction_reference: transactionReference || undefined,
    });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to approve withdrawal");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function rejectWithdrawal(id: string, rejectionReason: string) {
  try {
    const data = await serverPut<any>(`/admin/withdrawals/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to reject withdrawal");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
