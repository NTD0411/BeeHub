"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ThumbsUp, AlertCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProviderReviewItem } from "./ProviderReviewsSection";

interface AiReviewSummaryProps {
  reviews: ProviderReviewItem[];
  /** Don't call Gemini if fewer than this many reviews exist */
  minReviews?: number;
  className?: string;
}

interface SummaryData {
  summary: string | null;
  highlights: string[];
  concerns: string[];
  verdict: string | null;
}

type Status = "idle" | "loading" | "done" | "empty" | "error";

export function AiReviewSummary({
  reviews,
  minReviews = 1,
  className,
}: AiReviewSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    if (reviews.length < minReviews) {
      setStatus("empty");
      return;
    }

    calledRef.current = true;
    setStatus("loading");

    const payload = reviews.slice(0, 30).map((r) => ({
      rating: r.rating,
      comment: r.comment ?? null,
      tags: r.tags ?? [],
    }));

    fetch("/api/ai/review-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews: payload }),
    })
      .then((res) => res.json())
      .then((res: SummaryData & { error?: string }) => {
        console.log("[AiReviewSummary] response:", res);
        if (res.error || !res.summary) {
          setStatus("empty");
        } else {
          setData(res);
          setStatus("done");
        }
      })
      .catch((err) => {
        console.error("[AiReviewSummary] fetch error:", err);
        setStatus("error");
      });
  }, [reviews, minReviews]);

  if (status === "idle" || status === "empty") return null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF]",
        "border-blue-100 p-5 mb-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
          AI Phân tích đánh giá
        </span>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <LoadingDots />
            <span className="text-sm text-gray-400">Đang phân tích {reviews.length} đánh giá...</span>
          </div>
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-blue-100 rounded-full w-full" />
            <div className="h-3 bg-blue-100 rounded-full w-4/5" />
            <div className="h-3 bg-blue-100 rounded-full w-3/5" />
          </div>
        </div>
      )}

      {/* Done */}
      {status === "done" && data && (
        <div className="space-y-4">
          {/* Summary paragraph */}
          {data.summary && (
            <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Highlights */}
            {data.highlights.length > 0 && (
              <div className="rounded-xl bg-white/70 border border-green-100 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThumbsUp size={13} className="text-green-600 shrink-0" />
                  <span className="text-[11px] font-bold text-green-700 uppercase tracking-wide">
                    Điểm mạnh
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {data.concerns.length > 0 && (
              <div className="rounded-xl bg-white/70 border border-amber-100 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle size={13} className="text-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                    Lưu ý
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.concerns.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Verdict */}
          {data.verdict && (
            <div className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
              <Award size={15} className="text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-indigo-700">{data.verdict}</p>
            </div>
          )}

          {/* Footer */}
          <p className="text-[10px] text-blue-400/70 text-right">
            Phân tích bởi Gemini AI · Dựa trên {reviews.length} đánh giá
          </p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <p className="text-xs text-gray-400 italic">Không thể tải phân tích lúc này.</p>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
