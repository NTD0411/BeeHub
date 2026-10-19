"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { getLatestOrders } from "@/lib/admin/queries/dashboard";
import { usePolling } from "@/lib/admin/use-polling";
import { formatVND, formatDateTime, formatOrderNumber } from "@/lib/admin/formatters";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { Skeleton } from "@/components/admin-ui/skeleton";
import { getProviderDisplayName } from "@/lib/admin/normalize-order-relations";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/admin-ui/avatar";

/* ── Type helpers ────────────────────────────────────────────────────────── */

type LatestOrderResult = Awaited<ReturnType<typeof getLatestOrders>>;
type OrderRow = LatestOrderResult["data"][number];

/* ── Row skeleton ────────────────────────────────────────────────────────── */

function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

interface OrdersTableClientProps {
  initialData: LatestOrderResult;
}

const POLL_INTERVAL_MS = 8_000;

export function OrdersTableClient({ initialData }: OrdersTableClientProps) {
  const router = useRouter();
  const [data, setData] = useState<LatestOrderResult>(initialData);
  const [isPending, startTransition] = useTransition();

  const refreshCurrentPage = useCallback(async () => {
    const result = await getLatestOrders(data.meta.page, data.meta.pageSize);
    setData(result);
  }, [data.meta.page, data.meta.pageSize]);

  usePolling(() => {
    if (isPending) return;
    void refreshCurrentPage();
  }, POLL_INTERVAL_MS);

  function handlePageChange(page: number) {
    startTransition(async () => {
      const result = await getLatestOrders(page, 10);
      setData(result);
    });
  }

  function handleRowClick(orderId: string) {
    router.push(`/admin/orders/${orderId}`);
  }

  const rows: OrderRow[] = data.data;

  return (
    <div>
      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[
                "STT",
                "#Mã đơn",
                "Khách hàng",
                "Nhà vận chuyển",
                "Tuyến đường",
                "Số tiền",
                "Trạng thái",
                "Ngày tạo",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "var(--muted)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isPending
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              : rows.length === 0
              ? null
              : rows.map((order, idx) => {
                  // Supabase may return joined rows as an array (one-to-many FK alias)
                  // or as a single object — normalise both shapes safely.
                  type JoinedProfile = {
                    id: string;
                    full_name: string;
                    avatar_url: string | null;
                    business_name?: string | null;
                    profiles?: unknown;
                  };

                  function normaliseJoin(
                    raw: unknown
                  ): JoinedProfile | null {
                    if (!raw) return null;
                    if (Array.isArray(raw)) return (raw[0] as JoinedProfile) ?? null;
                    return raw as JoinedProfile;
                  }

                  const customer = normaliseJoin(order.customer);
                  const providerRaw = normaliseJoin(order.provider);
                  const providerProfile = providerRaw?.profiles
                    ? normaliseJoin(providerRaw.profiles)
                    : providerRaw;

                  const customerName = customer?.full_name ?? "—";
                  const customerAvatar = customer?.avatar_url ?? null;

                  const providerName =
                    providerRaw
                      ? (providerRaw.business_name ?? providerProfile?.full_name ?? "—")
                      : "—";
                  const providerAvatar = providerProfile?.avatar_url ?? null;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          "var(--primary-tint)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      {/* STT */}
                      <td
                        className="px-4 py-3 text-center text-xs font-medium w-12"
                        style={{ color: "var(--muted)" }}
                      >
                        {(data.meta.page - 1) * data.meta.pageSize + idx + 1}
                      </td>

                      {/* Mã đơn */}
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: "var(--primary)" }}
                      >
                        {formatOrderNumber(order.order_number)}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            {customerAvatar && (
                              <AvatarImage
                                src={customerAvatar}
                                alt={customerName}
                              />
                            )}
                            <AvatarFallback>
                              {customerName && customerName !== "—" ? customerName.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className="whitespace-nowrap max-w-[140px] truncate"
                            style={{ color: "var(--text)" }}
                            title={customerName}
                          >
                            {customerName}
                          </span>
                        </div>
                      </td>

                      {/* Nhà vận chuyển */}
                      <td className="px-4 py-3">
                        {order.provider ? (
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              {providerAvatar && (
                                <AvatarImage
                                  src={providerAvatar}
                                  alt={String(providerName)}
                                />
                              )}
                              <AvatarFallback>
                                {String(providerName) && String(providerName) !== "—" ? String(providerName).charAt(0).toUpperCase() : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className="whitespace-nowrap max-w-[140px] truncate"
                              style={{ color: "var(--text)" }}
                              title={String(providerName)}
                            >
                              {providerName}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>Chưa ghép</span>
                        )}
                      </td>

                      {/* Tuyến đường */}
                      <td
                        className="px-4 py-3 whitespace-nowrap text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        <span style={{ color: "var(--text)" }}>{order.pickup_city}</span>
                        {" → "}
                        <span style={{ color: "var(--text)" }}>{order.delivery_city}</span>
                      </td>

                      {/* Số tiền */}
                      <td
                        className="px-4 py-3 font-medium whitespace-nowrap"
                        style={{ color: "var(--text)" }}
                      >
                        {formatVND(order.total_price)}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3">
                        <StatusBadge type="order" status={order.status} />
                      </td>

                      {/* Ngày tạo */}
                      <td
                        className="px-4 py-3 whitespace-nowrap text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {formatDateTime(order.created_at)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Empty state when no rows after a page change */}
      {!isPending && rows.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="Không có đơn hàng nào"
          description="Không tìm thấy đơn hàng cho trang này."
        />
      )}

      {/* Pagination */}
      {!isPending && data.meta.total > 0 && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            pageSize={data.meta.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
