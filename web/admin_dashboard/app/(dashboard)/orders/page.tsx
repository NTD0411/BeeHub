"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, adminApi } from "@/lib/api";
import { normalizeMeta } from "@/lib/normalize-meta";
import { PageHeader } from "@/components/dashboard/page-header";
import type { OrderStatus } from "@/lib/types";
import { OrdersClient } from "./orders-client";

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as OrderStatus | undefined;
  const search = searchParams.get('search');
  const page = Number(searchParams.get('page') ?? 1);

  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState("");

  useEffect(() => {
    // Set up API token from localStorage
    const token = localStorage.getItem('admin_token');
    if (token) {
      apiClient.setToken(token);
    }

    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminId(user.id);
    }

    // Fetch data
    loadOrders();
  }, [status, search, page]);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getOrders({
        page,
        pageSize: PAGE_SIZE,
        status: status || undefined,
        search: search || undefined,
      });
      if (response.success) {
        setData(response.data ?? []);
        setMeta(normalizeMeta(response.meta, { page, pageSize: PAGE_SIZE }));
      } else {
        throw new Error(response.message || 'Failed to load orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div
        className="rounded-xl p-4 text-sm"
        style={{ backgroundColor: "var(--card)", color: "var(--muted)", border: "1px solid var(--border)" }}
      >
        Lỗi tải dữ liệu: {error.message}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {/* Filter bar skeleton */}
        <div className="flex gap-3">
          <div className="h-10 w-48 rounded-xl" style={{ backgroundColor: "var(--border)" }} />
          <div className="h-10 w-64 rounded-xl" style={{ backgroundColor: "var(--border)" }} />
        </div>
        {/* Table skeleton */}
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
        activeStatus={status}
        currentSearch={search ?? ""}
        adminId={adminId}
      />
    </div>
  );
}
