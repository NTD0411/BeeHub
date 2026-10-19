"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, adminApi } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import type { VerificationStatus } from "@/lib/types";
import { VerificationsClient } from "./verifications-client";

export default function VerificationsPage() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') ?? "pending") as VerificationStatus;
  const page = Number(searchParams.get('page') ?? 1);

  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
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
    loadProviders();
  }, [tab, page]);

  async function loadProviders() {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPendingProviders();
      if (response.success) {
        setData(response.data ?? []);
        setMeta({
          page: 1,
          pageSize: response.data?.length ?? 0,
          total: response.data?.length ?? 0,
          totalPages: 1,
        });
      } else {
        throw new Error(response.message || 'Failed to load providers');
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
      />
    </div>
  );
}
