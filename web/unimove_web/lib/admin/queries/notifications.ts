"use server";

import { serverGet, serverPost, serverPut } from "@/lib/admin/server-api";
import type { NotificationPriority } from "@/lib/admin/types";

export async function getAnnouncements({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
}) {
  try {
    const data = await serverGet<any>("/admin/announcements", { page, pageSize });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: data.meta ?? { page, pageSize, total: 0, totalPages: 0 },
      };
    }
    throw new Error(data.message || "Failed to fetch announcements");
  } catch (error) {
    console.error("Get announcements error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function createAnnouncement({
  title,
  body,
  targetAudience,
  targetCities,
  priority,
  scheduledAt,
  createdBy: _createdBy,
}: {
  title: string;
  body: string;
  targetAudience: "all" | "customers" | "providers";
  targetCities?: string[];
  priority: NotificationPriority;
  scheduledAt?: string;
  createdBy: string;
}) {
  try {
    const data = await serverPost<any>("/admin/announcements", {
      title,
      body,
      targetAudience,
      targetCities,
      priority,
      scheduledAt,
    });
    if (data.success) return { data: data.data, error: null };
    throw new Error(data.message || "Failed to create announcement");
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function publishAnnouncement(id: string) {
  try {
    const data = await serverPut<any>(`/admin/announcements/${id}/publish`);
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to publish announcement");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function getAdminNotifications(_userId: string, _limit = 5) {
  return { notifications: [], unreadCount: 0 };
}

export async function markNotificationRead(_id: string) {
  return null;
}
