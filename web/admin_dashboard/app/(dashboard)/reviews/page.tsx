"use client";

export const dynamic = "force-dynamic";


import React, { useState, useEffect, useCallback, useTransition } from "react";
import { Star, MessageSquare, RefreshCw } from "lucide-react";
import * as Avatar from "@radix-ui/react-avatar";

import {
  getReviews,
  hideReview,
  unhideReview,
  flagReview,
} from "@/lib/queries/reviews";
import type { Review } from "@/lib/types";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Star Rating
// ---------------------------------------------------------------------------

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn("w-3.5 h-3.5", i < rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-300")}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Status Badge
// ---------------------------------------------------------------------------

function ReviewStatusBadge({ review }: { review: ReviewRow }) {
  if (review.is_hidden) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Đã ẩn
      </span>
    );
  }
  if (review.is_flagged) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        Bị báo cáo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      Hiển thị
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reason Dialog (used for hide + flag actions)
// ---------------------------------------------------------------------------

interface ReasonDialogProps {
  open: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
}

function ReasonDialog({ open, title, placeholder, onClose, onSubmit, loading }: ReasonDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none transition-colors"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" onClick={onClose}>Hủy</Button>
          </DialogClose>
          <Button
            size="sm"
            disabled={!reason.trim() || loading}
            onClick={() => onSubmit(reason)}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReviewRow = Pick<
  Review,
  | "id"
  | "rating"
  | "comment"
  | "is_published"
  | "is_flagged"
  | "flagged_reason"
  | "is_hidden"
  | "hidden_reason"
  | "created_at"
> & {
  customer?: { id: string; full_name: string; avatar_url: string | null } | null;
  provider?: { id: string; full_name: string; business_name: string | null; avatar_url: string | null } | null;
  order?: { id: string; order_number: string } | null;
};

// ---------------------------------------------------------------------------
// Reviews Table
// ---------------------------------------------------------------------------

interface ReviewsTableProps {
  reviews: ReviewRow[];
  page: number;
  pageSize: number;
  onRefresh: () => void;
}

function ReviewsTable({ reviews, page, pageSize, onRefresh }: ReviewsTableProps) {
  const [hideTarget, setHideTarget] = useState<string | null>(null);
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [hideLoading, startHide] = useTransition();
  const [flagLoading, startFlag] = useTransition();
  const [unhideLoading, startUnhide] = useTransition();
  const [unhideTarget, setUnhideTarget] = useState<string | null>(null);

  const handleHide = (reason: string) => {
    if (!hideTarget) return;
    const adminId = "admin"; // placeholder
    startHide(async () => {
      await hideReview(hideTarget, reason, adminId);
      setHideTarget(null);
      onRefresh();
    });
  };

  const handleFlag = (reason: string) => {
    if (!flagTarget) return;
    startFlag(async () => {
      await flagReview(flagTarget, reason);
      setFlagTarget(null);
      onRefresh();
    });
  };

  const handleUnhide = (id: string) => {
    const adminId = "admin"; // placeholder
    setUnhideTarget(id);
    startUnhide(async () => {
      await unhideReview(id, adminId);
      setUnhideTarget(null);
      onRefresh();
    });
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Không có đánh giá"
        description="Chưa có đánh giá nào phù hợp bộ lọc."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["STT", "Khách hàng", "Nhà vận chuyển", "#Mã đơn", "Đánh giá", "Nội dung", "Trạng thái", "Ngày tạo", "Hành động"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "var(--muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, idx) => (
              <tr
                key={review.id}
                style={{ borderBottom: "1px solid var(--border)" }}
                className="transition-colors hover:bg-[var(--primary-tint)]/30"
              >
                <td
                  className="px-4 py-3 text-center text-xs font-medium w-12"
                  style={{ color: "var(--muted)" }}
                >
                  {(page - 1) * pageSize + idx + 1}
                </td>
                {/* Customer */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Avatar.Image
                        src={review.customer?.avatar_url ?? undefined}
                        alt={review.customer?.full_name}
                        className="w-full h-full object-cover"
                      />
                      <Avatar.Fallback
                        className="w-full h-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        {(review.customer?.full_name ?? "?")[0].toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span className="font-medium truncate max-w-[120px]" style={{ color: "var(--text)" }}>
                      {review.customer?.full_name ?? "—"}
                    </span>
                  </div>
                </td>

                {/* Provider */}
                <td className="px-4 py-3">
                  <div style={{ color: "var(--text)" }} className="truncate max-w-[120px]">
                    {review.provider?.full_name ?? "—"}
                  </div>
                  {review.provider?.business_name && (
                    <div className="text-xs truncate max-w-[120px]" style={{ color: "var(--muted)" }}>
                      {review.provider.business_name}
                    </div>
                  )}
                </td>

                {/* Order */}
                <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--text)" }}>
                  #{review.order?.order_number ?? "—"}
                </td>

                {/* Rating */}
                <td className="px-4 py-3">
                  <StarRating rating={review.rating} />
                </td>

                {/* Comment */}
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="line-clamp-2 text-xs" style={{ color: "var(--muted)" }}>
                    {review.comment
                      ? review.comment.length > 100
                        ? review.comment.slice(0, 100) + "..."
                        : review.comment
                      : <em>Không có nội dung</em>
                    }
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <ReviewStatusBadge review={review} />
                </td>

                {/* Date */}
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  {formatDateTime(review.created_at)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {review.is_hidden ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unhideLoading && unhideTarget === review.id}
                        onClick={() => handleUnhide(review.id)}
                      >
                        Hiện
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHideTarget(review.id)}
                      >
                        Ẩn
                      </Button>
                    )}
                    {!review.is_flagged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFlagTarget(review.id)}
                        style={{ color: "var(--muted)" }}
                      >
                        Báo cáo
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReasonDialog
        open={hideTarget !== null}
        title="Ẩn đánh giá"
        placeholder="Lý do ẩn đánh giá này..."
        onClose={() => setHideTarget(null)}
        onSubmit={handleHide}
        loading={hideLoading}
      />

      <ReasonDialog
        open={flagTarget !== null}
        title="Báo cáo đánh giá"
        placeholder="Lý do báo cáo đánh giá này..."
        onClose={() => setFlagTarget(null)}
        onSubmit={handleFlag}
        loading={flagLoading}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Reviews Tab (shared between All / Flagged / Hidden)
// ---------------------------------------------------------------------------

interface ReviewsTabViewProps {
  flagged?: boolean;
  hidden?: boolean;
}

function ReviewsTabView({ flagged, hidden }: ReviewsTabViewProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getReviews({ page, pageSize: 10, flagged, hidden });
    setReviews(result.data as unknown as ReviewRow[]);
    setMeta(result.meta);
    setLoading(false);
  }, [page, flagged, hidden]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          {meta.total} đánh giá
        </span>
      </div>

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : (
          <>
            <ReviewsTable reviews={reviews} page={meta.page} pageSize={meta.pageSize} onRefresh={load} />
            {meta.total > 0 && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đánh giá"
        description="Kiểm duyệt đánh giá và phản hồi của người dùng"
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="flagged">Bị báo cáo</TabsTrigger>
          <TabsTrigger value="hidden">Đã ẩn</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ReviewsTabView />
        </TabsContent>

        <TabsContent value="flagged">
          <ReviewsTabView flagged={true} hidden={false} />
        </TabsContent>

        <TabsContent value="hidden">
          <ReviewsTabView hidden={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
