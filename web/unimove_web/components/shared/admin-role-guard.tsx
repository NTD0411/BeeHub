"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, getStoredUser } from "@/lib/auth";

export function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let adminUser: { role?: string } | null = null;
    try {
      const rawAdminUser = localStorage.getItem("admin_user");
      adminUser = rawAdminUser ? JSON.parse(rawAdminUser) as { role?: string } : null;
    } catch {
      adminUser = null;
    }

    const user = adminUser?.role === "admin" ? adminUser : getStoredUser();
    const hasToken = Boolean(
      localStorage.getItem("admin_token") || getStoredToken()
    );

    if (!hasToken || user?.role !== "admin") {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Đang kiểm tra quyền quản trị">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600" />
      </div>
    );
  }
  return children;
}
