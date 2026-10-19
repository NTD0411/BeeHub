"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Star,
  Clock, CheckCircle, XCircle, Truck, ChevronRight, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, formatVND, formatDate } from "@/lib/utils";

interface CancelEstimate {
  cancellable: boolean;
  status: string;
  deposit_amount: number;
  fee_percent: number;
  fee_amount: number;
  refund_amount: number;
}

const CANCEL_REASONS = [
  "Tôi muốn thay đổi địa chỉ",
  "Không còn cần dịch vụ",
  "Tìm được nhà xe khác",
  "Nhà xe chưa đến đúng giờ",
  "Lý do cá nhân",
  "Khác",
];

interface OrderDetail {
  id: string;
  status: string;
  service_type: string;
  pickup_address: string;
  dropoff_address: string;
  description?: string;
  floor_number?: number;
  num_helpers?: number;
  special_notes?: string;
  estimated_price?: number;
  final_price?: number;
  deposit_amount?: number;
  created_at: string;
  updated_at?: string;
  provider?: {
    id: string;
    full_name: string;
    phone: string;
    rating: number;
    avatar_url?: string;
    vehicle_type?: string;
  };
  status_history?: Array<{
    status: string;
    created_at: string;
    notes?: string;
  }>;
}

const STATUS_STEPS = [
  { key: "pending", label: "Chờ xác nhận", icon: Clock },
  { key: "accepted", label: "Đã chấp nhận", icon: CheckCircle },
  { key: "picking_up", label: "Đang đến đón", icon: Truck },
  { key: "in_progress", label: "Đang vận chuyển", icon: Truck },
  { key: "completed", label: "Hoàn thành", icon: CheckCircle },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancel flow state
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=policy, 2=reason
  const [estimate, setEstimate] = useState<CancelEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersApi.getOrder(id)
      .then((res) => {
        if (res.success && res.data) setOrder(res.data as OrderDetail);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const openCancelFlow = async () => {
    setLoadingEstimate(true);
    setCancelStep(1);
    try {
      const res = await ordersApi.getCancelEstimate(id);
      if (res.success && res.data) setEstimate(res.data as CancelEstimate);
    } catch { /* estimate optional */ }
    setLoadingEstimate(false);
  };

  const confirmCancel = async () => {
    const reason = selectedReason === "Khác" ? customReason.trim() : selectedReason;
    if (!reason) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(id, reason);
      setCancelStep(0);
      router.push("/orders");
    } catch { /* toast not available here — silent fail */ }
    finally { setCancelling(false); }
  };

  const closeCancelModal = () => {
    setCancelStep(0);
    setSelectedReason("");
    setCustomReason("");
    setEstimate(null);
  };

  const statusColor = order ? getOrderStatusColor(order.status) : "var(--muted)";
  const isCancelled = order?.status === "cancelled";
  const isCompleted = order?.status === "completed";
  const isActive = order && !isCancelled && !isCompleted;
  const canCancel = order?.status === "pending" || order?.status === "accepted";

  const currentStepIdx = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Chi tiết đơn hàng</h1>
            {order && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>#{order.id.slice(0, 8).toUpperCase()}</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : !order ? (
        <div className="text-center py-16 px-4">
          <XCircle size={52} className="mx-auto mb-4 opacity-30" style={{ color: "var(--error)" }} />
          <p className="font-semibold" style={{ color: "var(--text)" }}>Không tìm thấy đơn hàng</p>
          <Link href="/orders"><Button variant="outline" className="mt-4">Quay lại</Button></Link>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Status Card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Badge style={{ backgroundColor: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44`, fontSize: "13px", padding: "4px 12px" }}>
                {getOrderStatusLabel(order.status)}
              </Badge>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(order.created_at)}</span>
            </div>

            {/* Progress bar (non-cancelled) */}
            {!isCancelled && (
              <div className="relative flex items-center justify-between mt-2">
                {STATUS_STEPS.slice(0, 5).map((step, i) => {
                  const done = i <= currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      {i > 0 && (
                        <div
                          className="absolute top-4 h-0.5 z-0"
                          style={{
                            left: `${(i - 0.5) * 20}%`,
                            width: "20%",
                            backgroundColor: done ? "var(--primary)" : "var(--border)",
                          }}
                        />
                      )}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center z-10 relative"
                        style={{ backgroundColor: done ? "var(--primary)" : "var(--surface)", border: `2px solid ${done ? "var(--primary)" : "var(--border)"}` }}
                      >
                        <Icon size={14} style={{ color: done ? "white" : "var(--muted)" }} />
                      </div>
                      <span className="text-[9px] text-center mt-1 leading-tight" style={{ color: done ? "var(--primary)" : "var(--muted)" }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Route */}
          <Card className="p-5">
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Lộ trình</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ backgroundColor: "var(--primary-tint)" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>ĐIỂM ĐÓN</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{order.pickup_address}</p>
                </div>
              </div>
              <div className="ml-4 w-0.5 h-6" style={{ backgroundColor: "var(--border)" }} />
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ backgroundColor: "var(--success-tint)" }}>
                  <MapPin size={16} style={{ color: "var(--success)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>ĐIỂM ĐẾN</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{order.dropoff_address}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Order info */}
          <Card className="p-5">
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Thông tin đơn hàng</h3>
            <div className="space-y-3">
              {order.description && (
                <InfoRow label="Mô tả đồ đạc" value={order.description} />
              )}
              {order.floor_number !== undefined && (
                <InfoRow label="Tầng" value={`Tầng ${order.floor_number}`} />
              )}
              {order.num_helpers && (
                <InfoRow label="Số người khuân" value={`${order.num_helpers} người`} />
              )}
              <InfoRow label="Loại dịch vụ" value={order.service_type || "Tiêu chuẩn"} />
              {order.special_notes && (
                <InfoRow label="Ghi chú" value={order.special_notes} />
              )}
            </div>
          </Card>

          {/* Price */}
          {(order.estimated_price || order.final_price) && (
            <Card className="p-5">
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Thanh toán</h3>
              <div className="space-y-2">
                {order.estimated_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Giá ước tính</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{formatVND(order.estimated_price)}</span>
                  </div>
                )}
                {order.deposit_amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Đặt cọc</span>
                    <span className="text-sm font-medium text-green-500">{formatVND(order.deposit_amount)}</span>
                  </div>
                )}
                {order.final_price && (
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Tổng cộng</span>
                    <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{formatVND(order.final_price)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Provider */}
          {order.provider && (
            <Card className="p-5">
              <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>Nhà vận chuyển</h3>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
                >
                  {order.provider.full_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold" style={{ color: "var(--text)" }}>{order.provider.full_name}</p>
                  {order.provider.vehicle_type && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{order.provider.vehicle_type}</p>
                  )}
                  {order.provider.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={s <= Math.round(order.provider!.rating) ? "#f59e0b" : "transparent"}
                          style={{ color: "#f59e0b" }}
                        />
                      ))}
                      <span className="text-xs ml-1" style={{ color: "var(--muted)" }}>{order.provider.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${order.provider.phone}`}>
                  <Button variant="outline" className="w-full gap-2">
                    <Phone size={16} /> Gọi điện
                  </Button>
                </a>
                <Link href={`/chat/${order.id}`}>
                  <Button variant="gradient" className="w-full gap-2">
                    <MessageCircle size={16} /> Nhắn tin
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Review CTA */}
          {isCompleted && (
            <Link href={`/orders/${order.id}/review`}>
              <Card className="p-4 flex items-center justify-between" style={{ backgroundColor: "var(--primary-tint)", borderColor: "var(--primary)" + "44" }}>
                <div className="flex items-center gap-3">
                  <Star size={20} style={{ color: "var(--primary)" }} fill="var(--primary)" />
                  <span className="font-semibold text-sm" style={{ color: "var(--primary)" }}>Đánh giá chuyến đi</span>
                </div>
                <ChevronRight size={18} style={{ color: "var(--primary)" }} />
              </Card>
            </Link>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={openCancelFlow}
              className="w-full py-3 rounded-2xl text-sm font-semibold border transition-colors"
              style={{ color: "var(--error)", borderColor: "var(--error)" + "44", backgroundColor: "var(--error-tint, #FEF2F2)" }}
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      )}

      {/* ── Cancel Modal Step 1: Policy + Estimate ── */}
      {cancelStep === 1 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Hủy đơn hàng?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Xem lại chính sách hoàn tiền trước khi xác nhận</p>
              </div>
            </div>

            {loadingEstimate ? (
              <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ) : estimate ? (
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Tiền cọc đã đặt</span>
                  <span className="font-semibold text-gray-900">{formatVND(estimate.deposit_amount)}</span>
                </div>
                {estimate.fee_percent > 0 && (
                  <div className="px-4 py-3 flex justify-between text-sm border-t border-gray-50">
                    <span className="text-red-500">Phí hủy ({estimate.fee_percent}%)</span>
                    <span className="font-semibold text-red-500">- {formatVND(estimate.fee_amount)}</span>
                  </div>
                )}
                <div className="px-4 py-3 flex justify-between text-sm border-t border-gray-100 bg-green-50">
                  <span className="font-bold text-gray-900">Hoàn lại</span>
                  <span className="font-bold text-green-600">{formatVND(estimate.refund_amount)}</span>
                </div>
                {estimate.deposit_amount > 0 && (
                  <p className="px-4 pb-3 text-xs text-gray-400">
                    Hoàn tiền trong 3–5 ngày làm việc sau khi admin duyệt.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Không thể tải thông tin hoàn tiền.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={closeCancelModal}>Quay lại</Button>
              <button
                onClick={() => setCancelStep(2)}
                className="py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Tiếp tục hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal Step 2: Reason ── */}
      {cancelStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Lý do hủy đơn</h3>
            <div className="space-y-2">
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors"
                  style={{
                    borderColor: selectedReason === r ? "var(--error)" : "var(--border)",
                    backgroundColor: selectedReason === r ? "#FEF2F2" : "white",
                    color: selectedReason === r ? "var(--error)" : "var(--text)",
                    fontWeight: selectedReason === r ? 600 : 400,
                  }}
                >
                  <span className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: selectedReason === r ? "var(--error)" : "#D1D5DB" }}>
                    {selectedReason === r && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  </span>
                  {r}
                </button>
              ))}
              {selectedReason === "Khác" && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do của bạn..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="outline" onClick={() => setCancelStep(1)}>Quay lại</Button>
              <button
                onClick={confirmCancel}
                disabled={!selectedReason || (selectedReason === "Khác" && !customReason.trim()) || cancelling}
                className="py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}
