"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Truck, Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { storeUser, type User as UserType } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      if (!res.success || !res.data) {
        setError((res as { message?: string }).message || "Đăng ký thất bại");
        return;
      }
      const { accessToken, user } = res.data as { accessToken: string; user: UserType };
      storeUser(user, accessToken);
      toast("Đăng ký thành công! Chào mừng đến với UniMove.", "success");
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
          >
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Tạo tài khoản</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Bắt đầu hành trình với UniMove</p>
        </div>

        <div className="rounded-3xl border p-8 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          {error && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Họ và tên</label>
              <Input
                name="full_name"
                required
                placeholder="Nguyễn Văn A"
                value={form.full_name}
                onChange={handleChange}
                startAdornment={<User size={15} />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Email</label>
              <Input
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                startAdornment={<Mail size={15} />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Số điện thoại <span style={{ color: "var(--muted)" }}>(tuỳ chọn)</span>
              </label>
              <Input
                name="phone"
                type="tel"
                placeholder="0901234567"
                value={form.phone}
                onChange={handleChange}
                startAdornment={<Phone size={15} />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu</label>
              <Input
                name="password"
                type={showPw ? "text" : "password"}
                required
                placeholder="Ít nhất 6 ký tự"
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Xác nhận mật khẩu</label>
              <Input
                name="confirmPassword"
                type="password"
                required
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                startAdornment={<Lock size={15} />}
              />
            </div>

            <Button type="submit" size="xl" className="w-full mt-2" loading={loading} variant="gradient">
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
