"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, ChevronRight, LogOut, Camera, Shield, Lock,
  Star, DollarSign, FileText, HelpCircle, Moon, Sun, Truck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { providerProfileApi } from "@/lib/api";
import { getStoredUser, clearAuth, type ProviderUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function ProviderProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    providerProfileApi.getMe()
      .then((res) => { if (res.success && res.data) setProfile(res.data as ProviderUser); })
      .finally(() => setLoading(false));
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    setIsDark(dark);
    localStorage.setItem("unimove-provider-theme", dark ? "dark" : "light");
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const menuItems = [
    { icon: User, label: "Chỉnh sửa hồ sơ", href: "/profile/edit" },
    { icon: FileText, label: "Giấy tờ xác minh", href: "/documents" },
    { icon: Lock, label: "Đổi mật khẩu", href: "/profile/change-password" },
    { icon: Star, label: "Đánh giá của tôi", href: "/profile/reviews" },
    { icon: DollarSign, label: "Cài đặt thanh toán", href: "/profile/payment-settings" },
    { icon: HelpCircle, label: "Trợ giúp", href: "/profile/help" },
  ];

  const verificationStatus = profile?.is_verified
    ? { label: "Đã xác minh ✓", color: "var(--success)", bg: "var(--success-tint)" }
    : { label: "Chưa xác minh", color: "var(--warning)", bg: "var(--warning-tint)" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-8"
        style={{ background: "linear-gradient(160deg, #14532d 0%, #16a34a 60%, #22c55e 100%)" }}>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-white">Hồ sơ</h1>
          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            {isDark ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-white" />}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white/30"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {profile?.full_name?.[0] ?? "P"}
              </div>
            )}
            <Link href="/profile/edit">
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                <Camera size={14} style={{ color: "var(--success)" }} />
              </div>
            </Link>
          </div>
          <div className="flex-1">
            {loading ? (
              <>
                <Skeleton className="h-6 w-32 mb-2" style={{ background: "rgba(255,255,255,0.2)" }} />
                <Skeleton className="h-4 w-48" style={{ background: "rgba(255,255,255,0.2)" }} />
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-white">{profile?.full_name}</p>
                {profile?.business_name && (
                  <p className="text-green-100 text-sm flex items-center gap-1.5">
                    <Truck size={13} /> {profile.business_name}
                  </p>
                )}
                <p className="text-green-100 text-sm">{profile?.email}</p>
              </>
            )}
          </div>
        </div>

        {/* Verification badge */}
        <div className="mt-4">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
            {profile?.vehicle_type ?? "Nhà vận chuyển"}
          </span>
          <span className="ml-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: verificationStatus.bg, color: verificationStatus.color }}>
            {verificationStatus.label}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 -mt-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>0</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Chuyến</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
              {profile?.rating?.toFixed(1) ?? "—"}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Đánh giá</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>0</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Khách hàng</p>
          </Card>
        </div>

        {/* Menu */}
        <Card>
          {menuItems.map(({ icon: Icon, label, href }, i) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 px-4 py-4 transition-colors hover:opacity-80"
                style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                  <Icon size={18} style={{ color: "var(--muted)" }} />
                </div>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--text)" }}>{label}</span>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </div>
            </Link>
          ))}
        </Card>

        <Button variant="destructive" size="lg" className="w-full gap-2" onClick={handleLogout}>
          <LogOut size={18} /> Đăng xuất
        </Button>

        <p className="text-center text-xs pb-2" style={{ color: "var(--muted)" }}>
          UniMove Provider v1.0.0
        </p>
      </div>
    </div>
  );
}
