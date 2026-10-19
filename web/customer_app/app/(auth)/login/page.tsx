"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Truck, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { storeUser, type User } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(form);
      if (!res.success || !res.data) {
        setError((res as { message?: string }).message || "Sai email hoặc mật khẩu");
        return;
      }
      const { accessToken, user } = res.data as { accessToken: string; user: User };
      if (user.role !== "customer") {
        setError("Tài khoản này không phải khách hàng. Vui lòng dùng app nhà vận chuyển.");
        return;
      }
      storeUser(user, accessToken);
      toast("Đăng nhập thành công!", "success");
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl animate-mesh-1" style={{ background: "var(--glow-primary)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl animate-mesh-2" style={{ background: "var(--glow-secondary)" }} />
      </div>
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
          >
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>UniMove</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Chuyển trọ thông minh cho sinh viên</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border p-8 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>Đăng nhập</h2>

          {error && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Email</label>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                startAdornment={<Mail size={15} />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu</label>
              <Input
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                startAdornment={<Lock size={15} />}
                endAdornment={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="cursor-pointer">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" size="xl" className="w-full mt-2" loading={loading} variant="gradient">
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <span className="underline">Điều khoản dịch vụ</span> của UniMove
        </p>
      </motion.div>
    </div>
  );
}
