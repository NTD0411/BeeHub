"use server";

import { serverGet, serverPut } from "@/lib/admin/server-api";
import type { VerificationStatus } from "@/lib/admin/types";

export async function getPendingProviders({
  page = 1,
  pageSize = 20,
  status = "pending",
}: {
  page?: number;
  pageSize?: number;
  status?: VerificationStatus;
}) {
  try {
    const data = await serverGet<any>("/admin/providers/pending");
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: {
          page: 1,
          pageSize: data.data?.length ?? 0,
          total: data.data?.length ?? 0,
          totalPages: 1,
        },
      };
    }
    throw new Error(data.message || "Failed to fetch pending providers");
  } catch (error) {
    console.error("Get pending providers error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function getProviderDocuments(providerId: string) {
  try {
    const data = await serverGet<any>(`/admin/providers/${providerId}/documents`);
    if (data.success) return { data: data.data ?? [], error: null };
    throw new Error(data.message || "Failed to fetch provider documents");
  } catch (error) {
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function updateVerificationStatus(
  providerId: string,
  status: VerificationStatus,
  notes: string,
  _adminId: string
) {
  try {
    const action = status === "approved" ? "approve" : "reject";
    const data = await serverPut<any>(`/admin/providers/${providerId}/verify`, {
      action,
      notes,
    });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to update verification status");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
