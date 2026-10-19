"use client";

import { useEffect, useState } from "react";
import { storeAdminAuth } from "@/lib/admin-auth";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const raw = params.get("session");

      if (!raw) {
        setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        return;
      }

      const { token, user } = JSON.parse(decodeURIComponent(raw)) as {
        token: string;
        user: Record<string, unknown>;
      };

      if (!token || !user || user.role !== "admin") {
        setError("Tài khoản không có quyền admin.");
        return;
      }

      storeAdminAuth(token, user);
      window.location.href = "/dashboard";
    } catch {
      setError("Không thể xử lý phiên đăng nhập. Vui lòng thử lại.");
    }
  }, []);

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <p className="text-sm text-center" style={{ color: "var(--error, #ef4444)" }}>
          {error}
        </p>
        <a href="/login" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
          Quay lại đăng nhập
        </a>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <span
        className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin"
        style={{ color: "var(--primary)" }}
      />
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Đang chuyển đến Admin Dashboard...
      </p>
    </div>
  );
}
