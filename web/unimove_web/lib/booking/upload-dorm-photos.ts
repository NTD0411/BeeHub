import { marketplaceApi } from "@/lib/api";
import type { DormPhotoItem } from "@/lib/stores/useBookingFlowStore";

/** Upload ảnh mô tả trọ — cùng endpoint storage như app mobile (API-073). */
export async function uploadDormPhotos(items: DormPhotoItem[]): Promise<{ urls: string[]; failed: boolean }> {
  const urls: string[] = [];
  let failed = false;

  for (const item of items) {
    if (item.uploadedUrl) {
      urls.push(item.uploadedUrl);
      continue;
    }
    try {
      const res = await marketplaceApi.uploadImages([item.file]);
      const url = res.data?.[0];
      if (url) urls.push(url);
      else failed = true;
    } catch {
      failed = true;
    }
  }

  return { urls, failed };
}
