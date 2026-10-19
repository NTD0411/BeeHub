"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import React from "react";
import Link from "next/link";
import { ArrowLeft, User, Phone, Building, Save, Truck, Car, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const VEHICLES = [
  ["motorbike", "Xe máy"],
  ["pickup", "Bán tải"],
  ["van", "Xe van"],
  ["truck_1t", "Xe tải 1T"],
  ["truck_2t", "Xe tải 2T"],
  ["truck_5t", "Xe tải 5T+"],
];

function ProviderEditPage() {
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
    const u = getStoredUser();
    if (u)
      setForm({
        full_name: u.full_name,
        phone: u.phone ?? "",
        business_name: u.business_name ?? "",
        vehicle_type: u.vehicle_type ?? "van",
        vehicle_plate: (u as { vehicle_plate?: string }).vehicle_plate ?? "",
        address: (u as { address?: string }).address ?? "",
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authApi.updateMe({
        full_name: form.full_name,
        phone: form.phone || undefined,
        business_name: form.business_name || undefined,
        vehicle_type: form.vehicle_type,
        vehicle_plate: form.vehicle_plate || undefined,
        address: form.address || undefined,
      });
      if (!r.success) {
        toast((r as { message?: string }).message || "Thất bại", "error");
        return;
      }
      const u = getStoredUser();
      if (u) localStorage.setItem("unimove_user", JSON.stringify({ ...u, ...form }));
      toast("Cập nhật thành công!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* Back + title inside card */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/profile"
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text)" }}
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                Chỉnh sửa hồ sơ
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                Cập nhật thông tin cá nhân của bạn để duy trì tài khoản chính xác.
              </p>
            </div>
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
                  <span
                    className="absolute left-3 pointer-events-none z-10"
                    style={{ color: "var(--muted)" }}
                  >
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
                    {VEHICLES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <span
                    className="absolute right-3 pointer-events-none"
                    style={{ color: "var(--muted)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 4l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
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

export default function EditProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getStoredUser()?.role ?? null;
    if (r === "customer") {
      router.replace("/tai-khoan/chinh-sua");
      return;
    }
    setRole(r);
  }, [router]);

  if (!role || role === "customer") return null;
  return <ProviderEditPage />;
}
