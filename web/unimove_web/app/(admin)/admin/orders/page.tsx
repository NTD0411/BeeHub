"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, adminApi } from "@/lib/admin/api";
import { normalizeMeta } from "@/lib/admin/normalize-meta";
import { usePolling } from "@/lib/admin/use-polling";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import { OrdersClient, ORDER_STATUS_TABS, type OrderStatusTab } from "./orders-client";

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 8_000;

function parseOrderTab(value: string | null): OrderStatusTab {
  const tab = value ?? "pending";
  return ORDER_STATUS_TABS.some((t) => t.value === tab) ? (tab as OrderStatusTab) : "pending";
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const tab = parseOrderTab(searchParams.get("tab"));
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page") ?? 1);

  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [adminId, setAdminId] = useState("");

  const loadOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await adminApi.getOrders({
          page,
          pageSize: PAGE_SIZE,
          statusGroup: tab,
          search: search || undefined,
        });
        if (response.success) {
          setData(Array.isArray(response.data) ? response.data : []);
          setMeta(normalizeMeta(response.meta, { page, pageSize: PAGE_SIZE }));
          setLastUpdatedAt(new Date());
        } else {
          throw new Error(response.message || "Failed to load orders");
        }
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!silent) setLoading(false);
        else setIsRefreshing(false);
      }
    },
    [page, search, tab]
  );

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) apiClient.setToken(token);

    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminId(user.id);
      } catch {
        // ignore
      }
    }

    loadOrders();
  }, [loadOrders]);

  usePolling(() => loadOrders({ silent: true }), POLL_INTERVAL_MS, !loading && !error);

  if (error && data.length === 0) {
    return (
      <div
        className="rounded-xl p-4 text-sm"
        style={{ backgroundColor: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)" }}
      >
        Lỗi tải dữ liệu: {error.message}
      </div>
    );
  }

  if (loading && data.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex gap-3">
          <div className="h-10 w-48 rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          <div className="h-10 w-64 rounded-xl" style={{ backgroundColor: "var(--border)" }} />
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="h-12" style={{ backgroundColor: "var(--surface)" }} />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-16 border-t"
              style={{ borderColor: "var(--border)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Quản lý Đơn hàng"
        description="Xem và quản lý tất cả đơn hàng trên hệ thống"
      />
      <OrdersClient
        orders={data as any[]}
        meta={meta}
        activeTab={tab}
        currentSearch={search ?? ""}
        adminId={adminId}
        isRefreshing={isRefreshing}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={() => loadOrders({ silent: true })}
      />
    </div>
  );
}
