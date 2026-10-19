"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Star, Share2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/Container";
import { providersApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProviderReviewSummary } from "@/components/booking/ProviderReviewsSection";
import {
  ProviderIntroBlock,
  ProviderVehicleBlock,
  ProviderPackagesBlock,
  ProviderReviewsBlock,
  type ProviderIntroData,
  type ServicePackageItem,
} from "@/components/booking/ProviderIntroSection";

const NAVY = "#0F1E3D";

interface ProviderDetail {
  id: string;
  name: string;
  business_name?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string;
  vehicle_plate?: string | null;
  service_area?: string[];
  rating: number;
  total_reviews: number;
  completed_trips?: number;
  is_verified?: boolean;
  packages?: ServicePackageItem[];
  reviews_summary?: ProviderIntroData["reviews_summary"];
  reviews?: ProviderIntroData["reviews"];
}

function vehicleLabel(v?: string) {
  const map: Record<string, string> = {
    small_truck: "Xe tải nhỏ",
    medium_truck: "Xe tải 1 tấn",
    large_truck: "Xe tải lớn",
    van: "Xe van",
  };
  return (v && map[v]) || v || "Xe tải";
}

export default function NhaXeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") || "/don-hang";

  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await providersApi.getById(id, { reviews_limit: 20 });
      if (res.success && res.data) setProvider(res.data as ProviderDetail);
    } catch {
      setProvider(null);
    }
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const name = provider?.business_name || provider?.name || provider?.full_name || "Nhà xe";
  const avatar = provider?.avatar_url;
  const rating = provider?.reviews_summary?.average_rating ?? provider?.rating ?? 0;
  const reviewCount = provider?.reviews_summary?.total_reviews ?? provider?.total_reviews ?? 0;
  const trips = provider?.completed_trips ?? 0;
  const vehicle = vehicleLabel(provider?.vehicle_type);
  const responseRate = Math.round(provider?.reviews_summary?.response_rate ?? 0);

  const introData: ProviderIntroData | null = provider
    ? {
        ...provider,
        name: provider.name || name,
        completed_trips: trips,
        rating,
        total_reviews: reviewCount,
        reviews: provider.reviews,
      }
    : null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF1F6] pb-10">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <Container className="py-3 flex items-center gap-3">
          <Link
            href={returnTo}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft size={18} style={{ color: NAVY }} />
          </Link>
          <span className="text-sm text-gray-500 hidden sm:inline">Hồ sơ nhà xe</span>
          <h1 className="text-base font-bold truncate flex-1 lg:text-lg" style={{ color: NAVY }}>
            {loading ? "Đang tải..." : name}
          </h1>
        </Container>
      </div>

      {loading ? (
        <Container className="py-6 space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </Container>
      ) : !provider ? (
        <Container className="py-16 text-center text-gray-500">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p>Không tìm thấy hồ sơ nhà xe</p>
          <Link href={returnTo} className="text-[#2563EB] text-sm font-semibold mt-3 inline-block">
            Quay lại
          </Link>
        </Container>
      ) : (
        <>
          <div className="relative">
            <div className="h-48 sm:h-56 lg:h-60 relative overflow-hidden">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px]" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E3D] via-[#1a3270] to-[#2563EB]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E3D]/95 via-[#0F1E3D]/80 to-[#2563EB]/60" />
            </div>

            <Container className="relative -mt-28 sm:-mt-32 pb-2">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  {provider.is_verified && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-950 mb-3">
                      <BadgeCheck size={14} /> Đã xác minh
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{name}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                      <span className="text-white/70">({reviewCount} đánh giá)</span>
                    </span>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <span>{trips > 0 ? `${trips} chuyến thành công` : "Nhà xe đối tác"}</span>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <span>{vehicle}</span>
                    {responseRate > 0 && (
                      <>
                        <span className="text-white/40 hidden sm:inline">·</span>
                        <span>{responseRate}% phản hồi</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-3 shrink-0">
                  <div className="hidden sm:block bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 min-w-[200px]">
                    <ProviderReviewSummary
                      averageRating={rating}
                      totalCount={reviewCount}
                      summary={provider.reviews_summary}
                      variant="hero"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur",
                      "border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                    )}
                  >
                    <Share2 size={16} />
                    <span className="hidden sm:inline">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </Container>
          </div>

          <Container className="pt-6 space-y-5">
            {introData && (
              <>
                <ProviderIntroBlock provider={introData} />
                <ProviderVehicleBlock provider={introData} />
                <ProviderPackagesBlock packages={introData.packages ?? []} />
                <ProviderReviewsBlock provider={introData} vehicle={vehicle} trips={trips} />
              </>
            )}
          </Container>
        </>
      )}
    </div>
  );
}
