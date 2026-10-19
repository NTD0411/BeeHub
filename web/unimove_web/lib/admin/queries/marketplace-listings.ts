"use server";

import { serverGet, serverPut, serverPost, serverDelete } from "@/lib/admin/server-api";
import { normalizeMeta } from "@/lib/admin/normalize-meta";

export async function getMarketplaceListings({
  page = 1,
  pageSize = 20,
  status = "all",
  keyword,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
}) {
  try {
    const data = await serverGet<any>("/admin/marketplace/listings", {
      page,
      pageSize,
      status,
      keyword: keyword?.trim() || undefined,
    });
    if (data.success) {
      return {
        data: data.data ?? [],
        error: null,
        meta: normalizeMeta(data.meta, { page, pageSize }),
      };
    }
    throw new Error(data.message || "Failed to fetch listings");
  } catch (error) {
    console.error("Get marketplace listings error:", error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
      meta: { page, pageSize, total: 0, totalPages: 0 },
    };
  }
}

export async function updateMarketplaceListingStatus(
  listingId: string,
  status: string,
  reason?: string,
) {
  try {
    const data = await serverPut<any>(
      `/admin/marketplace/listings/${listingId}/status`,
      { status, reason },
    );
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to update listing");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function approveMarketplaceListingFee(
  listingId: string,
  reason?: string,
) {
  try {
    const data = await serverPost<any>(
      `/admin/marketplace/listings/${listingId}/approve-fee`,
      { reason },
    );
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to approve listing fee");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function deleteMarketplaceListing(
  listingId: string,
  reason?: string,
) {
  try {
    const data = await serverDelete<any>(
      `/admin/marketplace/listings/${listingId}`,
      { reason },
    );
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to delete listing");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
