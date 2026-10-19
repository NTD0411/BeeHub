"use client";

import React from "react";
import { BadgeCheck, Shield, Users } from "lucide-react";
import { formatVND } from "@/lib/utils";
import {
  ProviderReviewSummary,
  ProviderReviewCard,
  type ProviderReviewItem,
  type ReviewsSummary,
} from "./ProviderReviewsSection";
import { AiReviewSummary } from "./AiReviewSummary";

const NAVY = "#0F1E3D";

export interface ServicePackageItem {
  id: string;
  name: string;
  description?: string | null;
  base_price: number;
  price_per_km?: number;
  price_per_floor?: number;
  helper_count?: number;
  includes_packing?: boolean;
  includes_insurance?: boolean;
  max_weight_kg?: number | null;
  estimated_duration_hours?: number | null;
}

export interface ProviderIntroData {
  name: string;
  business_name?: string;
  full_name?: string | null;
  vehicle_type?: string;
  vehicle_plate?: string | null;
  service_area?: string[];
  base_price?: number | null;
  price_per_km?: number | null;
  price_per_floor?: number | null;
  is_verified?: boolean;
  is_available?: boolean;
  completed_trips?: number;
  rating?: number;
  total_reviews?: number;
  packages?: ServicePackageItem[];
  reviews_summary?: ReviewsSummary | null;
  reviews?: ProviderReviewItem[];
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

function SectionCard({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
        <h3 className="font-bold text-base" style={{ color: NAVY }}>
          {title}
        </h3>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function buildIntroText(provider: ProviderIntroData): string {
  const areas = (provider.service_area ?? []).filter(Boolean);
  const vehicle = vehicleLabel(provider.vehicle_type);
  const name = provider.business_name || provider.name;
  const trips = provider.completed_trips ?? 0;

  const parts: string[] = [
    `${name} là đối tác vận chuyển trọ chuyên nghiệp trên UniMove với ${vehicle.toLowerCase()}, cam kết an toàn đồ đạc và tối ưu chi phí cho sinh viên.`,
  ];

  if (trips >= 10) {
    parts.push(`Đã hoàn thành hơn ${trips} chuyến với đánh giá tích cực từ khách hàng.`);
  }

  if (areas.length > 0) {
    parts.push(`Phục vụ khu vực ${areas.join(", ")}.`);
  }

  return parts.join(" ");
}

function buildFeatureTags(provider: ProviderIntroData): string[] {
  const tags: string[] = [];
  const packages = provider.packages ?? [];
  const hasHelpers = packages.some((p) => (p.helper_count ?? 0) > 0);
  const hasPacking = packages.some((p) => p.includes_packing);
  const punctuality = provider.reviews_summary?.avg_punctuality ?? 0;

  tags.push(hasHelpers ? "Hỗ trợ bốc xếp" : "Hỗ trợ vận chuyển");
  if (provider.is_verified) tags.push("Hợp đồng rõ ràng");
  if (hasPacking) tags.push("Đóng gói cẩn thận");
  if (punctuality >= 4.5) tags.push("Đúng giờ 100%");
  else if (tags.length < 3) tags.push("Đúng giờ");

  return tags.slice(0, 3);
}

function VehicleGridItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900 leading-snug">{value}</p>
    </div>
  );
}

export function ProviderIntroBlock({ provider }: { provider: ProviderIntroData }) {
  const tags = buildFeatureTags(provider);

  return (
    <SectionCard title="Giới thiệu">
      <p className="text-sm text-gray-600 leading-relaxed">{buildIntroText(provider)}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100"
          >
            {tag}
          </span>
        ))}
      </div>
      {provider.is_verified && (
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
          <BadgeCheck size={14} /> Đã xác minh bởi UniMove
        </div>
      )}
    </SectionCard>
  );
}

export function ProviderVehicleBlock({ provider }: { provider: ProviderIntroData }) {
  const areas = (provider.service_area ?? []).filter(Boolean);

  return (
    <SectionCard title="Phương tiện">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <VehicleGridItem label="Loại xe" value={vehicleLabel(provider.vehicle_type)} />
        <VehicleGridItem label="Biển số" value={provider.vehicle_plate || "—"} />
        <VehicleGridItem
          label="Khu vực hoạt động"
          value={areas.length > 0 ? areas.join(", ") : "Đà Nẵng & lân cận"}
        />
        {provider.base_price != null && provider.base_price > 0 && (
          <VehicleGridItem label="Giá mở cửa" value={formatVND(provider.base_price)} />
        )}
        {provider.price_per_km != null && provider.price_per_km > 0 && (
          <VehicleGridItem label="Giá theo km" value={`${formatVND(provider.price_per_km)}/km`} />
        )}
        {provider.price_per_floor != null && provider.price_per_floor > 0 && (
          <VehicleGridItem label="Phí tầng / hẻm" value={`${formatVND(provider.price_per_floor)}/tầng`} />
        )}
      </div>
    </SectionCard>
  );
}

export function ProviderPackagesBlock({ packages }: { packages: ServicePackageItem[] }) {
  if (packages.length === 0) return null;

  return (
    <SectionCard title="Gói dịch vụ">
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-gray-900">{pkg.name}</p>
                {pkg.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pkg.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(pkg.helper_count ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      <Users size={10} /> {pkg.helper_count} người phụ
                    </span>
                  )}
                  {pkg.includes_packing && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      Đóng gói
                    </span>
                  )}
                  {pkg.includes_insurance && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                      <Shield size={10} /> Bảo hiểm
                    </span>
                  )}
                </div>
              </div>
              <p className="font-extrabold text-sm text-[#2563EB] shrink-0">{formatVND(pkg.base_price)}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function ProviderReviewsBlock({
  provider,
  vehicle,
  trips,
}: {
  provider: ProviderIntroData;
  vehicle: string;
  trips: number;
}) {
  const rating = provider.reviews_summary?.average_rating ?? provider.rating ?? 0;
  const reviewCount = provider.reviews_summary?.total_reviews ?? provider.total_reviews ?? 0;
  const reviews = provider.reviews ?? [];

  return (
    <SectionCard title="Đánh giá từ khách hàng">
      <p className="text-xs text-gray-500 mb-4">
        {vehicle}
        {trips > 0 ? ` · ${trips} chuyến hoàn thành` : ""}
      </p>
      <ProviderReviewSummary
        averageRating={rating}
        totalCount={reviewCount}
        summary={provider.reviews_summary}
      />
      <div className="mt-6 pt-4 border-t border-gray-100">
        {/* AI-generated summary — only renders when Gemini returns something */}
        <AiReviewSummary reviews={reviews} minReviews={1} />

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có đánh giá</p>
        ) : (
          reviews.map((r) => <ProviderReviewCard key={r.id} review={r} />)
        )}
      </div>
    </SectionCard>
  );
}

/** @deprecated Use individual blocks in profile layout */
export function ProviderIntroSection({ provider }: { provider: ProviderIntroData }) {
  const trips = provider.completed_trips ?? 0;
  const vehicle = vehicleLabel(provider.vehicle_type);

  return (
    <div className="space-y-4">
      <ProviderIntroBlock provider={provider} />
      <ProviderVehicleBlock provider={provider} />
      <ProviderPackagesBlock packages={provider.packages ?? []} />
      <ProviderReviewsBlock provider={provider} vehicle={vehicle} trips={trips} />
    </div>
  );
}
