"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Phone, Building, Save, Truck, Car, MapPin, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { providerProfileApi } from "@/lib/api";
import { getStoredUser, storeUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

const VEHICLE_TYPES = [
  { value: "motorbike", label: "Xe máy" },
  { value: "pickup", label: "Bán tải" },
  { value: "van", label: "Xe van" },
  { value: "truck_1t", label: "Xe tải 1 tấn" },
  { value: "truck_2t", label: "Xe tải 2 tấn" },
  { value: "truck_5t", label: "Xe tải 5 tấn+" },
];

export default function EditProviderProfilePage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    business_name: "",
    vehicle_type: "van",
    vehicle_plate: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setForm({
        full_name: user.full_name ?? "",
        phone: user.phone ?? "",
        business_name: (user as { business_name?: string }).business_name ?? "",
        vehicle_type: (user as { vehicle_type?: string }).vehicle_type ?? "van",
        vehicle_plate: (user as { vehicle_plate?: string }).vehicle_plate ?? "",
        address: (user as { address?: string }).address ?? "",
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await providerProfileApi.updateMe({ ...form });
      if (!res.success) {
        toast((res as { message?: string }).message || "Cập nhật thất bại", "error");
        return;
      }
      const stored = getStoredUser();
      if (stored) {
        const updated = { ...stored, ...form };
        const token = localStorage.getItem("provider_token");
        if (token) storeUser(updated as typeof stored, token);
      }
      toast("Cập nhật thành công!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 rounded-xl"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            Chỉnh sửa hồ sơ
          </h1>
        </div>
      </div>

      {/* Card */}
      <div className="px-4 py-5">
        <div
          className="rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              Chỉnh sửa hồ sơ
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Cập nhật thông tin cá nhân của bạn để duy trì tài khoản chính xác.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Họ tên + SĐT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Họ và tên
                </label>
                <Input
                  required
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  startAdornment={<User size={15} />}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Số điện thoại
                </label>
                <Input
                  type="tel"
                  placeholder="+84905xxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  startAdornment={<Phone size={15} />}
                />
              </div>
            </div>

            {/* Row 2: Tên DN + Loại PT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Tên doanh nghiệp
                </label>
                <Input
                  placeholder="Nhà xe Văn A"
                  value={form.business_name}
                  onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                  startAdornment={<Building size={15} />}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Loại phương tiện
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 pointer-events-none z-10" style={{ color: "var(--muted)" }}>
                    <Truck size={15} />
                  </span>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))}
                    className="w-full h-11 rounded-xl border pl-10 pr-8 text-sm appearance-none"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 pointer-events-none" style={{ color: "var(--muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Biển số xe (half width) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Biển số xe
                </label>
                <Input
                  placeholder="VD: 29A-123.45"
                  value={form.vehicle_plate}
                  onChange={(e) => setForm((p) => ({ ...p, vehicle_plate: e.target.value }))}
                  startAdornment={<Car size={15} />}
                />
              </div>
            </div>

            {/* Row 4: Địa chỉ full width */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Địa chỉ
              </label>
              <Input
                placeholder="Nhập địa chỉ thường trú"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                startAdornment={<MapPin size={15} />}
              />
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* Submit */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <Button
                type="submit"
                loading={loading}
                className="gap-2 px-10"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  color: "white",
                  height: "48px",
                  borderRadius: "14px",
                  fontSize: "15px",
                  fontWeight: 600,
                  minWidth: "200px",
                }}
              >
                <Save size={18} />
                Lưu thay đổi
              </Button>
              <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                Thông tin của bạn được bảo mật theo tiêu chuẩn EcoDrive.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
