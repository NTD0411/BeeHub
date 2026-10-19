"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, adminApi } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import type { VerificationStatus } from "@/lib/admin/types";
import { VerificationsClient, normalizeProvider } from "./verifications-client";
import { usePolling } from "@/lib/admin/use-polling";

export default function VerificationsPage() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') ?? "pending") as VerificationStatus;
  const page = Number(searchParams.get('page') ?? 1);

  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [adminId, setAdminId] = useState("");

  const loadProviders = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      setError(null);
      try {
        const response = await adminApi.getPendingProviders({ status: tab });
        if (response.success) {
          const list = Array.isArray(response.data)
            ? response.data.map((item) => normalizeProvider(item as Record<string, unknown>))
            : [];
          setData(list);
          setMeta({
            page: 1,
            pageSize: list.length,
            total: list.length,
            totalPages: 1,
          });
          setLastUpdatedAt(new Date());
        } else {
          throw new Error(response.message || "Failed to load providers");
        }
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        if (!silent) setLoading(false);
        else setIsRefreshing(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) apiClient.setToken(token);

    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminId(user.id);
    }

    loadProviders();
  }, [loadProviders, tab, page]);

  usePolling(() => loadProviders({ silent: true }), 8_000, !loading && !error);

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
      <div className="animate-pulse space-y-3">
        {/* Tab skeleton */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 w-28 rounded-lg"
              style={{ backgroundColor: "var(--border)" }}
            />
          ))}
        </div>
        {/* Table skeleton */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="h-12" style={{ backgroundColor: "var(--surface)" }} />
          {[1, 2, 3, 4, 5].map((i) => (
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
        title="Xác minh Nhà vận chuyển"
        description="Duyệt hoặc từ chối hồ sơ đăng ký nhà vận chuyển"
      />
      <VerificationsClient
        providers={data}
        meta={meta}
        activeTab={tab}
        adminId={adminId}
        isRefreshing={isRefreshing}
        lastUpdatedAt={lastUpdatedAt}
        onRefresh={() => loadProviders({ silent: true })}
      />
    </div>
  );
}
