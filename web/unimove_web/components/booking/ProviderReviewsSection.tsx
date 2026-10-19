"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProviderReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  customer_name?: string;
  created_at?: string;
  tags?: string[];
}

export interface ReviewsSummary {
  total_reviews: number;
  average_rating: number;
  rating_5_count?: number;
  rating_4_count?: number;
  rating_3_count?: number;
  rating_2_count?: number;
  rating_1_count?: number;
  avg_service_quality?: number;
  avg_punctuality?: number;
  avg_professionalism?: number;
  avg_value_for_money?: number;
  response_rate?: number;
}

function starDistribution(summary: ReviewsSummary | null, avg: number, total: number): Record<number, number> {
  if (summary && summary.total_reviews > 0) {
    return {
      5: summary.rating_5_count ?? 0,
      4: summary.rating_4_count ?? 0,
      3: summary.rating_3_count ?? 0,
      2: summary.rating_2_count ?? 0,
      1: summary.rating_1_count ?? 0,
    };
  }
  if (total <= 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const five = Math.round(total * (avg >= 4.7 ? 0.78 : avg >= 4.3 ? 0.62 : 0.45));
  const four = Math.round(total * 0.16);
  const three = Math.round(total * 0.05);
  let rest = total - five - four - three;
  const two = rest > 1 ? 1 : 0;
  rest -= two;
  return { 5: five, 4: four, 3: three, 2: two, 1: rest > 0 ? rest : 0 };
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

export function ProviderReviewSummary({
  averageRating,
  totalCount,
  summary,
  variant = "default",
}: {
  averageRating: number;
  totalCount: number;
  summary?: ReviewsSummary | null;
  variant?: "default" | "hero";
}) {
  const dist = starDistribution(summary ?? null, averageRating, totalCount);
  const maxBar = Math.max(...Object.values(dist), 1);
  const isHero = variant === "hero";

  return (
    <div className="flex gap-6 items-start">
      <div className="text-center shrink-0">
        <p
          className={cn(
            "text-5xl font-light leading-none",
            isHero ? "text-white" : "text-gray-900",
          )}
        >
          {averageRating.toFixed(1)}
        </p>
        <StarRow rating={averageRating} size={16} />
        <p className={cn("text-xs mt-1", isHero ? "text-white/75" : "text-gray-500")}>
          {totalCount} đánh giá
        </p>
      </div>
      <div className="flex-1 space-y-1.5 pt-1">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center gap-2">
            <span className={cn("text-xs w-3", isHero ? "text-white/70" : "text-gray-500")}>
              {star}
            </span>
            <div
              className={cn(
                "flex-1 h-1.5 rounded-full overflow-hidden",
                isHero ? "bg-white/20" : "bg-gray-100",
              )}
            >
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${((dist[star] ?? 0) / maxBar) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProviderReviewCard({ review }: { review: ProviderReviewItem }) {
  const initial = (review.customer_name ?? "K")[0]?.toUpperCase();
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-sm shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-gray-900">{review.customer_name ?? "Khách hàng"}</span>
            <StarRow rating={review.rating} size={12} />
            {date && <span className="text-xs text-gray-400">{date}</span>}
          </div>
          {review.title && <p className="font-medium text-sm text-gray-800 mt-1">{review.title}</p>}
          {review.comment && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
          )}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {review.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProviderReviewsSection({
  reviews,
  summary,
  averageRating,
  totalCount,
  compact,
}: {
  reviews: ProviderReviewItem[];
  summary?: ReviewsSummary | null;
  averageRating: number;
  totalCount: number;
  compact?: boolean;
}) {
  const shown = compact ? reviews.slice(0, 3) : reviews;

  return (
    <div>
      <ProviderReviewSummary averageRating={averageRating} totalCount={totalCount} summary={summary} />
      <div className={cn("mt-5", compact && reviews.length > 3 && "mb-2")}>
        {shown.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có đánh giá</p>
        ) : (
          shown.map((r) => <ProviderReviewCard key={r.id} review={r} />)
        )}
      </div>
    </div>
  );
}
