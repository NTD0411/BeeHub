"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, Settings, LogOut, ChevronRight, Camera,
  Lock, Star, Gift, Shield, HelpCircle, Moon, Sun
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { customerApi } from "@/lib/api";
import { getStoredUser, clearAuth, type User as UserType } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserType | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    customerApi.getMe()
      .then((res) => {
        if (res.success && res.data) setProfile(res.data as UserType);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    setIsDark(dark);
    localStorage.setItem("unimove-theme", dark ? "dark" : "light");
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const menuItems = [
    { icon: Lock, label: "Đổi mật khẩu", href: "/profile/change-password" },
    { icon: Star, label: "Đánh giá của tôi", href: "/profile/reviews" },
    { icon: Gift, label: "Điểm thưởng", href: "/profile/loyalty", badge: profile?.loyalty_points ? `${profile.loyalty_points} điểm` : undefined },
    { icon: Shield, label: "Bảo mật", href: "/profile/security" },
    { icon: HelpCircle, label: "Trợ giúp & Hỗ trợ", href: "/profile/help" },
    { icon: Settings, label: "Cài đặt", href: "/profile/settings" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header gradient */}
      <div
        className="px-4 pt-12 pb-8"
        style={{ background: "linear-gradient(160deg, var(--gradient-from) 0%, var(--gradient-to) 100%)" }}
      >
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold text-white">Hồ sơ</h1>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {isDark ? <Sun size={18} className="text-white" /> : <Moon size={18} className="text-white" />}
          </button>
        </div>

        {/* Avatar & info */}
        <div className="flex items-center gap-4 mt-5">
          <div className="relative">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white/30"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                {profile?.full_name?.[0] ?? "U"}
              </div>
            )}
            <Link href="/profile/edit">
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                <Camera size={14} style={{ color: "var(--primary)" }} />
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
                <p className="text-blue-100 text-sm">{profile?.email}</p>
                {profile?.student_id && (
                  <p className="text-blue-100 text-xs mt-1">MSSV: {profile.student_id}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 -mt-3 space-y-4">
        {/* Edit profile */}
        <Link href="/profile/edit">
          <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-tint)" }}>
                <User size={20} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Chỉnh sửa hồ sơ</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Tên, SĐT, MSSV...</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--muted)" }} />
          </Card>
        </Link>

        {/* Stats row */}
        {profile?.loyalty_points !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{profile.loyalty_points}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Điểm thưởng</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>0</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Chuyến thành công</p>
            </Card>
          </div>
        )}

        {/* Menu items */}
        <Card>
          {menuItems.map(({ icon: Icon, label, href, badge }, i) => (
            <Link key={href} href={href}>
              <div
                className="flex items-center gap-3 px-4 py-4 transition-colors hover:opacity-80"
                style={{ borderBottom: i < menuItems.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--surface)" }}>
                  <Icon size={18} style={{ color: "var(--muted)" }} />
                </div>
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--text)" }}>{label}</span>
                {badge && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
                  >
                    {badge}
                  </span>
                )}
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </div>
            </Link>
          ))}
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          size="lg"
          className="w-full gap-2"
          onClick={handleLogout}
        >
          <LogOut size={18} /> Đăng xuất
        </Button>

        <p className="text-center text-xs pb-2" style={{ color: "var(--muted)" }}>
          UniMove v1.0.0 · Dành cho sinh viên
        </p>
      </div>
    </div>
  );
}
