"use client";

export const dynamic = "force-dynamic";


import React, { useState, useEffect, useCallback, useTransition } from "react";
import { AlertTriangle, RefreshCw, X, ZoomIn, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

import {
  getDisputes,
  getDisputeById,
  resolveDispute,
} from "@/lib/admin/queries/disputes";
import type { Dispute, Refund, DisputeStatus, DisputeType } from "@/lib/admin/types";
import { formatVND, formatDateTime } from "@/lib/admin/formatters";
import { getAdminUserId } from "@/lib/admin/client-auth";
import { cn } from "@/lib/admin/utils";

import { PageHeader } from "@/components/admin-dashboard/page-header";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { Button } from "@/components/admin-ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/admin-ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/admin-ui/select";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  payment: "Thanh toán",
  service_quality: "Chất lượng dịch vụ",
  damage: "Hư hỏng hàng hóa",
  cancellation: "Hủy đơn",
  other: "Khác",
};

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  low: { label: "Thấp", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  normal: { label: "Bình thường", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "Cao", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Khẩn cấp", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_LABELS[priority] ?? { label: priority, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Types for dispute detail
// ---------------------------------------------------------------------------

interface DisputeMessage {
  id: string;
  /** backend returns 'message', frontend type used 'content' — support both */
  message?: string;
  content?: string;
  created_at: string;
  attachments?: string[] | null;
  sender?: { id?: string; full_name: string; role: string; avatar_url?: string | null };
}

/** Raw shape returned by backend GET /admin/disputes/:id — field names differ from Dispute type */
interface DisputeRawDetail {
  id: string;
  order_id: string;
  raised_by: string;
  raised_by_role: string;
  against_user_id: string | null;
  dispute_type: DisputeType;
  subject: string;
  description: string;
  evidence_images: string[] | null;
  status: DisputeStatus;
  priority: string;
  resolution: string | null;
  resolution_type: string | null;
  refund_amount: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  /** Backend joins order as "orders" */
  orders?: { order_number: string; total_price: number; status: string } | null;
  /** Backend joins raiser as "raised_by_profile" */
  raised_by_profile?: { full_name: string; email: string; phone?: string; role: string } | null;
  /** Backend joins against as "against_user_profile" */
  against_user_profile?: { full_name: string; email: string; role: string } | null;
  dispute_messages?: DisputeMessage[];
}

// ---------------------------------------------------------------------------
// Image Lightbox
// ---------------------------------------------------------------------------

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={onClose}
      >
        <X size={18} className="text-white" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {idx + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`Bằng chứng ${idx + 1}`}
          className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight size={22} className="text-white" />
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={cn(
                "w-12 h-12 rounded-md overflow-hidden border-2 transition-all",
                i === idx ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-75"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispute Detail Dialog
// ---------------------------------------------------------------------------

interface DisputeDetailDialogProps {
  disputeId: string | null;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}

function DisputeDetailDialog({ disputeId, open, onClose, onResolved }: DisputeDetailDialogProps) {
  const [detail, setDetail] = useState<DisputeRawDetail | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [resolution, setResolution] = useState("");
  const [resolutionType, setResolutionType] = useState("no_action");
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, startSubmit] = useTransition();

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!open || !disputeId) return;
    setLoading(true);
    setResolution("");
    setResolutionType("no_action");
    setRefundAmount("");
    setLightboxOpen(false);
    getDisputeById(disputeId).then(({ dispute, messages: msgs }) => {
      setDetail(dispute as unknown as DisputeRawDetail | null);
      setMessages((msgs ?? []) as DisputeMessage[]);
      setLoading(false);
    });
  }, [open, disputeId]);

  const needsRefund = resolutionType === "refund" || resolutionType === "partial_refund";

  const handleResolve = () => {
    if (!disputeId || !resolution.trim()) return;
    startSubmit(async () => {
      const adminId = getAdminUserId();
      const refund = needsRefund && refundAmount ? parseFloat(refundAmount) : null;
      const { error } = await resolveDispute(disputeId, adminId, resolution, resolutionType, refund);
      if (!error) {
        onResolved();
        onClose();
      }
    });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const evidenceImages = detail?.evidence_images ?? [];
  // Raiser name: try raised_by_profile first (admin API), fallback to raiser (typed)
  const raiserName = (detail as any)?.raised_by_profile?.full_name ?? (detail as any)?.raiser?.full_name ?? "—";
  // Order number: try orders (admin API join name), fallback to order
  const orderNumber = (detail as any)?.orders?.order_number ?? (detail as any)?.order?.order_number ?? detail?.order_id ?? "—";

  return (
    <>
      {lightboxOpen && evidenceImages.length > 0 && (
        <ImageLightbox
          images={evidenceImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Chi tiết khiếu nại</DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--muted)" }} />
            </div>
          )}

          {!loading && detail && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-5 min-h-0">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: "var(--muted)" }}>Mã đơn: </span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    #{orderNumber}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Loại: </span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    {DISPUTE_TYPE_LABELS[detail.dispute_type]}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Người khiếu nại: </span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    {raiserName} ({detail.raised_by_role === "customer" ? "Khách hàng" : "Tài xế"})
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Trạng thái: </span>
                  <StatusBadge type="dispute" status={detail.status} />
                </div>
              </div>

              {/* Subject & Description */}
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{detail.subject}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{detail.description}</p>
              </div>

              {/* Evidence Images */}
              {evidenceImages.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                    Ảnh bằng chứng ({evidenceImages.length})
                  </p>
                  <div className={cn(
                    "grid gap-2",
                    evidenceImages.length === 1 ? "grid-cols-1" :
                    evidenceImages.length === 2 ? "grid-cols-2" :
                    evidenceImages.length === 3 ? "grid-cols-3" :
                    "grid-cols-4"
                  )}>
                    {evidenceImages.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openLightbox(i)}
                        className="relative group aspect-square rounded-lg overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ borderColor: "var(--border)" }}
                        aria-label={`Xem ảnh bằng chứng ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Bằng chứng ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty("display", "flex");
                          }}
                        />
                        {/* Error fallback */}
                        <span className="hidden absolute inset-0 items-center justify-center text-gray-400" style={{ backgroundColor: "var(--surface)" }}>
                          <ImageOff size={20} />
                        </span>
                        {/* Hover overlay */}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn size={20} className="text-white drop-shadow" />
                        </span>
                        {/* Index badge */}
                        <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] leading-none px-1.5 py-0.5 rounded">
                          {i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--muted)" }}>
                    Nhấn vào ảnh để xem phóng to
                  </p>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <ImageOff size={15} className="shrink-0" />
                  <span>Không có ảnh bằng chứng đính kèm</span>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                    Tin nhắn ({messages.length})
                  </p>
                  <div
                    className="rounded-xl border p-3 space-y-3 max-h-48 overflow-y-auto"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  >
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
                            {msg.sender?.full_name ?? "—"}
                          </span>
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            · {formatDateTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          {msg.message ?? msg.content}
                        </p>
                        {/* Message attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {msg.attachments.map((att, ai) => (
                              <a
                                key={ai}
                                href={att}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-14 h-14 rounded overflow-hidden border"
                                style={{ borderColor: "var(--border)" }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={att} alt="" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form — only for open/investigating disputes */}
              {(detail.status === "open" || detail.status === "investigating") && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Giải quyết khiếu nại</p>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                      Loại giải quyết
                    </label>
                    <Select value={resolutionType} onValueChange={setResolutionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_action">Không xử phạt</SelectItem>
                        <SelectItem value="refund">Hoàn tiền toàn bộ</SelectItem>
                        <SelectItem value="partial_refund">Hoàn tiền một phần</SelectItem>
                        <SelectItem value="provider_penalty">Phạt tài xế</SelectItem>
                        <SelectItem value="customer_penalty">Phạt khách hàng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {needsRefund && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                        Số tiền hoàn (VND)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="Nhập số tiền hoàn..."
                        className="w-full h-10 px-3 text-sm rounded-xl border outline-none transition-colors"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                      Nội dung giải quyết
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                      placeholder="Mô tả quyết định giải quyết..."
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none transition-colors"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="shrink-0 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Đóng</Button>
            </DialogClose>
            {detail && (detail.status === "open" || detail.status === "investigating") && (
              <Button
                size="sm"
                disabled={!resolution.trim() || submitting}
                onClick={handleResolve}
              >
                {submitting ? "Đang xử lý..." : "Giải quyết"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Disputes Tab
// ---------------------------------------------------------------------------

type DisputeRow = {
  id: string;
  dispute_type: DisputeType;
  subject: string;
  status: DisputeStatus;
  priority: string;
  created_at: string;
  order?: { id: string; order_number: string } | null;
  raiser?: { id: string; full_name: string; role: string } | null;
};

function DisputesTab() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState<DisputeStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getDisputes({
      page,
      pageSize: 20,
      status: status === "all" ? undefined : status,
    });
    setDisputes(result.data as unknown as DisputeRow[]);
    setMeta(result.meta);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (val: string) => {
    setStatus(val as DisputeStatus | "all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="open">Đang mở</SelectItem>
            <SelectItem value="investigating">Đang điều tra</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm ml-auto" style={{ color: "var(--muted)" }}>
          {meta.total} khiếu nại
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : disputes.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Không có khiếu nại"
            description="Chưa có khiếu nại nào phù hợp bộ lọc."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#Mã đơn", "Người khiếu nại", "Loại", "Tiêu đề", "Ưu tiên", "Trạng thái", "Ngày tạo", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr
                      key={d.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-[var(--primary-tint)]/30"
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                        #{d.order?.order_number ?? d.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: "var(--text)" }}>{d.raiser?.full_name ?? "—"}</div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          {d.raiser?.role === "customer" ? "Khách hàng" : d.raiser?.role === "provider" ? "Tài xế" : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                        {DISPUTE_TYPE_LABELS[d.dispute_type]}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="line-clamp-2" style={{ color: "var(--text)" }}>{d.subject}</span>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={d.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="dispute" status={d.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {formatDateTime(d.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedId(d.id); setDialogOpen(true); }}
                        >
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <DisputeDetailDialog
        disputeId={selectedId}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onResolved={load}
      />
    </div>
  );
}

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Khiếu nại"
        description="Quản lý khiếu nại từ khách hàng và nhà vận chuyển"
      />

      <DisputesTab />
    </div>
  );
}
