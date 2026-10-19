"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Mail, Lock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Sai email hoặc mật khẩu");
        setLoading(false);
        return;
      }

      if (data.data.user.role !== "admin") {
        setError("Bạn không có quyền admin");
        setLoading(false);
        return;
      }

      const token = data.data.accessToken;
      const user = data.data.user;

      // Save to localStorage for client-side API calls
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_user", JSON.stringify(user));

      // Save to cookie for server-side proxy/middleware
      document.cookie = `admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;

      // Hard redirect so server re-reads the cookie
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("timeout")
          ? "Kết nối quá hạn. Vui lòng kiểm tra backend đang chạy."
          : "Không thể kết nối đến server."
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 shadow-lg"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-2xl"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Truck size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              UniMove Admin
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Đăng nhập vào trang quản trị
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@unimove.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startAdornment={<Mail size={15} style={{ color: "var(--muted)" }} />}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startAdornment={<Lock size={15} style={{ color: "var(--muted)" }} />}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          UniMove Admin Dashboard · Chỉ dành cho quản trị viên
        </p>
      </div>
    </div>
  );
}
