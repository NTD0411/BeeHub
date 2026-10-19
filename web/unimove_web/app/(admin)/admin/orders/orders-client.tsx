"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin-ui/dialog";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { formatVND, formatDateTime, formatOrderNumber } from "@/lib/admin/formatters";
import { forceCancelOrder } from "@/lib/admin/queries/orders";
import type { PaginationMeta, Order } from "@/lib/admin/types";
import { ShoppingBag, Search, X, Loader2, AlertTriangle, RefreshCw, Ban } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/admin-ui/tabs";
import { getProviderDisplayName } from "@/lib/admin/normalize-order-relations";
import { cn } from "@/lib/admin/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/admin-ui/tooltip";

// ─── Constants ───────────────────────────────────────────────────────────────

export const ORDER_STATUS_TABS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "shipping", label: "Đang vận chuyển" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Hủy" },
  { value: "disputed", label: "Tranh chấp" },
] as const;

export type OrderStatusTab = (typeof ORDER_STATUS_TABS)[number]["value"];

type OrderStatus = import("@/lib/admin/types").OrderStatus;

const TERMINAL_STATUSES: OrderStatus[] = ["completed", "cancelled"];

const VEHICLE_SIZE_LABELS: Record<string, string> = {
  motorbike: "Xe máy",
  small_truck: "Xe tải nhỏ",
  medium_truck: "Xe tải vừa",
  large_truck: "Xe tải lớn",
};

function isCancellable(status: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

type OrderWithRelations = Order & {
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  provider?: {
    id: string;
    full_name: string;
    business_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
};

// ─── Force Cancel Dialog ─────────────────────────────────────────────────────

function ForceCancelDialog({
  order,
  adminId,
  open,
  onOpenChange,
  onSuccess,
}: {
  order: OrderWithRelations;
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setReason("");
      setError(null);
    }
    onOpenChange(o);
  }

  function handleConfirm() {
    if (!reason.trim()) return;
    startTransition(async () => {
      setError(null);
      const { error: err } = await forceCancelOrder(order.id, adminId, reason.trim());
      if (err) {
        setError(err.message);
      } else {
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideClose={false}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Hủy đơn hàng</DialogTitle>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Đơn {formatOrderNumber(order.order_number)} sẽ bị hủy vĩnh viễn.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Bỏ qua
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              "Xác nhận hủy"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

function FilterBar({
  activeTab,
  currentSearch,
  onTabChange,
  onSearchChange,
  isRefreshing,
  lastUpdatedAt,
  onRefresh,
}: {
  activeTab: OrderStatusTab;
  currentSearch: string;
  onTabChange: (tab: OrderStatusTab) => void;
  onSearchChange: (s: string) => void;
  isRefreshing?: boolean;
  lastUpdatedAt?: Date | null;
  onRefresh?: () => void;
}) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      onSearchChange(searchInput.trim());
    }
  }

  function handleClearSearch() {
    setSearchInput("");
    onSearchChange("");
  }

  return (
    <div className="space-y-4 mb-6">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as OrderStatusTab)}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          {ORDER_STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-[120px]">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--muted)" }}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Tìm mã đơn hàng... (Enter)"
          className="pl-9 pr-9 py-2 rounded-xl text-sm outline-none w-64 transition-colors"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {lastUpdatedAt && (
          <span className="text-xs hidden sm:inline" style={{ color: "var(--muted)" }}>
            Cập nhật{" "}
            {lastUpdatedAt.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
          title="Làm mới danh sách"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Đang cập nhật..." : "Làm mới"}
        </button>
      </div>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

export function OrdersClient({
  orders,
  meta,
  activeTab,
  currentSearch,
  adminId,
  isRefreshing,
  lastUpdatedAt,
  onRefresh,
}: {
  orders: OrderWithRelations[];
  meta: PaginationMeta;
  activeTab: OrderStatusTab;
  currentSearch: string;
  adminId: string;
  isRefreshing?: boolean;
  lastUpdatedAt?: Date | null;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancelTarget, setCancelTarget] = useState<OrderWithRelations | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleTabChange(tab: OrderStatusTab) {
    updateParams({ tab });
  }

  function handleSearchChange(search: string) {
    updateParams({ search });
  }

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  function handleRowClick(orderId: string) {
    router.push(`/admin/orders/${orderId}`);
  }

  return (
    <>
      <TooltipProvider>
      <FilterBar
        activeTab={activeTab}
        currentSearch={currentSearch}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
        isRefreshing={isRefreshing}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={onRefresh}
      />

      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Không có đơn hàng nào"
            description="Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--surface)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {[
                      "STT",
                      "#Mã đơn",
                      "Khách hàng",
                      "Nhà vận chuyển",
                      "Tuyến đường",
                      "Tổng tiền",
                      "Loại xe",
                      "Trạng thái",
                      "Ngày tạo",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "var(--muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="cursor-pointer transition-colors hover:bg-[var(--primary-tint)]/40"
                      style={{
                        borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      {/* STT */}
                      <td
                        className="px-4 py-3 text-center text-xs font-medium w-12"
                        style={{ color: "var(--muted)" }}
                      >
                        {(meta.page - 1) * meta.pageSize + idx + 1}
                      </td>

                      {/* Order number */}
                      <td className="px-4 py-3 w-[140px]">
                        <span
                          className="font-mono font-semibold text-xs"
                          style={{ color: "var(--primary)" }}
                        >
                          {formatOrderNumber(order.order_number)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td
                        className="px-4 py-3 whitespace-nowrap w-[160px] truncate"
                        style={{ color: "var(--text)" }}
                        title={order.customer?.full_name ?? "—"}
                      >
                        {order.customer?.full_name ?? "—"}
                      </td>

                      {/* Provider */}
                      <td
                        className="px-4 py-3 whitespace-nowrap w-[180px] truncate"
                        style={{ color: "var(--text)" }}
                        title={getProviderDisplayName(order.provider) ?? "Chưa có"}
                      >
                        {getProviderDisplayName(order.provider) ?? (
                          <span className="italic" style={{ color: "var(--muted)" }}>
                            Chưa có
                          </span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="px-4 py-3 w-[200px]">
                        <div
                          className="text-xs truncate"
                          style={{ color: "var(--text)" }}
                          title={`${order.pickup_city ?? "—"} → ${order.delivery_city ?? "—"}`}
                        >
                          {order.pickup_city ?? "—"} <span style={{ color: "var(--muted)" }}>→</span>{" "}
                          {order.delivery_city ?? "—"}
                        </div>
                      </td>

                      {/* Total price */}
                      <td
                        className="px-4 py-3 whitespace-nowrap font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {formatVND(order.total_price)}
                      </td>

                      {/* Vehicle size */}
                      <td
                        className="px-4 py-3 whitespace-nowrap text-xs w-[110px] truncate"
                        style={{ color: "var(--muted)" }}
                        title={
                          order.vehicle_size
                            ? (VEHICLE_SIZE_LABELS[order.vehicle_size] ?? order.vehicle_size)
                            : "—"
                        }
                      >
                        {order.vehicle_size
                          ? (VEHICLE_SIZE_LABELS[order.vehicle_size] ?? order.vehicle_size)
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge type="order" status={order.status} />
                      </td>

                      {/* Created at */}
                      <td
                        className="px-4 py-3 whitespace-nowrap text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatDateTime(order.created_at)}
                      </td>

                      {/* Action — stop propagation so row click doesn't fire */}
                      <td
                        className="px-4 py-3 w-[64px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCancellable(order.status) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(order)}
                                className={cn(
                                  "w-9 h-9 inline-flex items-center justify-center rounded-xl",
                                  "bg-red-50 text-red-700 hover:bg-red-100",
                                  "dark:bg-red-900/20 dark:text-red-400"
                                )}
                                aria-label="Hủy đơn"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">Hủy đơn</TooltipContent>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }}>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                pageSize={meta.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Force Cancel Dialog */}
      {cancelTarget && (
        <ForceCancelDialog
          order={cancelTarget}
          adminId={adminId}
          open={!!cancelTarget}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
          onSuccess={onRefresh}
        />
      )}
      </TooltipProvider>
    </>
  );
}
