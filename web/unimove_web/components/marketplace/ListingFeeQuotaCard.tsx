"use client";

import { Info, Sparkles } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useListingFeeQuota } from "./useListingFeeQuota";

export function ListingFeeQuotaCard({
  price,
  isGiveaway = false,
}: {
  price: number;
  isGiveaway?: boolean;
}) {
  const { quota, loading, preview, isFreePost } = useListingFeeQuota(isGiveaway ? 0 : price);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!quota) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-[#2563EB]" />
        <h3 className="text-sm font-bold text-gray-900">Phí đăng tin</h3>
      </div>

      <div className="mb-3 rounded-xl bg-[#EFF6FF] px-3.5 py-3 text-sm text-[#1E40AF]">
        <span className="font-semibold">{quota.free_listings_remaining}</span>
        <span>
          {" "}
          / {quota.free_listings_total} tin miễn phí còn lại
        </span>
        <p className="mt-1 text-xs text-[#2563EB]/80">
          Đã đăng {quota.listings_created_count} tin · từ tin thứ 3 trở đi tính phí
        </p>
      </div>

      {isGiveaway ? (
        <p className="text-sm font-semibold text-emerald-700">Đồ cho tặng — luôn miễn phí đăng tin</p>
      ) : preview ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Phí tin này</span>
            <span className={`font-bold ${isFreePost ? "text-emerald-700" : "text-gray-900"}`}>
              {isFreePost ? "Miễn phí" : formatVND(preview.amount)}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-gray-500">{preview.message}</p>
          {!isFreePost && (
            <p className="flex items-start gap-1.5 text-xs text-amber-800">
              <Info size={14} className="mt-0.5 shrink-0" />
              Thanh toán qua PayOS sau khi đăng để tin hiển thị trên chợ
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">{quota.rate_label}</p>
      )}
    </div>
  );
}
