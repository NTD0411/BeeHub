"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Truck, Mail, Lock, User, Phone, Building, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { providerAuthApi } from "@/lib/api";
import { storeUser, type ProviderUser } from "@/lib/auth";

const VEHICLE_TYPES = [
  { value: "motorbike", label: "Xe máy (≤ 100kg)" },
  { value: "pickup", label: "Bán tải" },
  { value: "van", label: "Xe van 5 tạ - 1 tấn" },
  { value: "truck_1t", label: "Xe tải 1 tấn" },
  { value: "truck_2t", label: "Xe tải 2 tấn" },
  { value: "truck_5t", label: "Xe tải 5 tấn+" },
];

export default function ProviderRegisterPage() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    business_name: "", vehicle_type: "van",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await providerAuthApi.register({ ...form });
      if (!res.success || !res.data) { setError((res as { message?: string }).message || "Đăng ký thất bại"); return; }
      const { accessToken, user } = res.data as { accessToken: string; user: ProviderUser };
      storeUser(user, accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Đăng ký làm đối tác</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Tham gia mạng lưới nhà vận chuyển UniMove</p>
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
              <Input required placeholder="Nguyễn Văn A" value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} startAdornment={<User size={15} />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Tên doanh nghiệp / biệt danh</label>
              <Input placeholder="Nhà xe Văn A" value={form.business_name}
                onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))} startAdornment={<Building size={15} />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Email</label>
              <Input type="email" required placeholder="email@example.com" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} startAdornment={<Mail size={15} />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Số điện thoại</label>
              <Input type="tel" required placeholder="0901234567" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} startAdornment={<Phone size={15} />} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Loại phương tiện</label>
              <select value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))}
                className="w-full h-11 rounded-xl border px-3 text-sm"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
                {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu</label>
              <Input type="password" required minLength={6} placeholder="Ít nhất 6 ký tự" value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} startAdornment={<Lock size={15} />} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Đang đăng ký..." : "Đăng ký đối tác"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
