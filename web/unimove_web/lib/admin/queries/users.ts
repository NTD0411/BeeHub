"use server";

import { serverGet, serverPatch } from "@/lib/admin/server-api";
import { normalizeMeta } from "@/lib/admin/normalize-meta";
import type { UserRole, UserStatus } from "@/lib/admin/types";

export async function getUsers({
  role,
  search,
  status,
  page = 1,
  pageSize = 10,
}: {
  role?: UserRole;
  search?: string;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}) {
  try {
    const data = await serverGet<any>("/admin/users", {
      role,
      search,
      status,
      page,
      pageSize,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch users");
  } catch (error) {
    console.error("Get users error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function updateUserStatus(id: string, status: UserStatus) {
  try {
    const data = await serverPatch<any>(`/admin/users/${id}/status`, { status });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to update user status");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
