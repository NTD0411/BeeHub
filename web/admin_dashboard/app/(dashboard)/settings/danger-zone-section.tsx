"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DangerZoneSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    setError(null);
    startTransition(async () => {
      try {
        // Clear JWT token and admin user from localStorage
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        
        // Clear cookies
        document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        
        // Redirect to login
        router.push("/login");
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to sign out');
      }
    });
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid #FCA5A5",
      }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" style={{ color: "#DC2626" }} />
        <h2 className="text-base font-semibold" style={{ color: "#DC2626" }}>
          Vùng nguy hiểm
        </h2>
      </div>

      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Đăng xuất
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Thoát khỏi phiên làm việc hiện tại. Bạn sẽ được chuyển về trang đăng nhập.
          </p>
          {error && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap",
            "border-2 transition-colors shrink-0",
            "hover:bg-red-50 dark:hover:bg-red-900/20",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
          style={{ borderColor: "#DC2626", color: "#DC2626" }}
        >
          <LogOut className="w-4 h-4" />
          {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </div>
  );
}
