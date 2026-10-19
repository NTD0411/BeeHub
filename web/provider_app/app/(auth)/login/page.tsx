"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Truck, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { providerAuthApi } from "@/lib/api";
import { storeUser, type ProviderUser } from "@/lib/auth";

export default function ProviderLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await providerAuthApi.login(form);
      if (!res.success || !res.data) { setError((res as { message?: string }).message || "Đăng nhập thất bại"); return; }
      const { accessToken, user } = res.data as { accessToken: string; user: ProviderUser };
      if (user.role !== "provider") { setError("Tài khoản này không phải nhà vận chuyển."); return; }
      storeUser(user, accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối đến server");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>UniMove Provider</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Dành cho nhà vận chuyển</p>
        </div>

        <div className="rounded-3xl border p-8 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>Đăng nhập</h2>
          {error && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Email</label>
              <Input name="email" type="email" required placeholder="email@example.com" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                startAdornment={<Mail size={15} />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu</label>
              <Input name="password" type={showPw ? "text" : "password"} required placeholder="••••••••" value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                startAdornment={<Lock size={15} />}
                endAdornment={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
                Quên mật khẩu?
              </Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Chưa là đối tác?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
