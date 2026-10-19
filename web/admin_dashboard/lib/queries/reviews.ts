"use server";

import { serverGet, serverPut } from "@/lib/server-api";
import { normalizeMeta } from "@/lib/normalize-meta";

export async function getReviews({
  page = 1,
  pageSize = 20,
  flagged,
  hidden,
}: {
  page?: number;
  pageSize?: number;
  flagged?: boolean;
  hidden?: boolean;
}) {
  try {
    const data = await serverGet<any>("/admin/reviews", {
      page,
      pageSize,
      flagged: flagged === undefined ? "all" : String(flagged),
      hidden: hidden === undefined ? "all" : String(hidden),
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch reviews");
  } catch (error) {
    console.error("Get reviews error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function hideReview(reviewId: string, reason: string, _adminId: string) {
  try {
    const data = await serverPut<any>(`/admin/reviews/${reviewId}/hide`, { reason });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to hide review");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function unhideReview(reviewId: string, _adminId: string) {
  try {
    const data = await serverPut<any>(`/admin/reviews/${reviewId}/unhide`);
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to unhide review");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function flagReview(reviewId: string, reason: string) {
  try {
    const data = await serverPut<any>(`/admin/reviews/${reviewId}/flag`, { reason });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to flag review");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
