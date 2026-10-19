"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, Lock, Shield, HelpCircle, ChevronRight, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { customerApi } from "@/lib/api";
import { getStoredUser, type AuthUser } from "@/lib/auth";

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.getMe().then(r => { if (r.success && r.data) setProfile(r.data as AuthUser); }).finally(() => setLoading(false));
  }, []);

  const menu = [
    { icon: User, label: "Chỉnh sửa thông tin cá nhân", desc: "Tên, SĐT, MSSV", href: "/profile/edit" },
    { icon: Lock, label: "Đổi mật khẩu", desc: "Cập nhật mật khẩu đăng nhập", href: "/profile/change-password" },
    { icon: Shield, label: "Bảo mật tài khoản", desc: "Xác minh danh tính", href: "/profile/security" },
    { icon: HelpCircle, label: "Trợ giúp & Hỗ trợ", desc: "FAQ, liên hệ hỗ trợ", href: "/profile/help" },
  ];

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Tài khoản của tôi</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Quản lý thông tin và cài đặt tài khoản</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {/* Banner */}
        <div className="h-28" style={{ background: "linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)" }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-4" style={{ borderColor: "var(--card)" }} />
                : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4" style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", borderColor: "var(--card)" }}>
                  {profile?.full_name?.[0] ?? "U"}
                </div>}
              <Link href="/profile/edit">
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center shadow-md cursor-pointer"
                  style={{ backgroundColor: "var(--primary)" }}>
                  <Camera size={13} className="text-white" />
                </div>
              </Link>
            </div>
            <Link href="/profile/edit">
              <button className="px-4 py-2 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "transparent" }}>
                Chỉnh sửa
              </button>
            </Link>
          </div>

          {loading
            ? <><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-56" /></>
            : <>
              <h2 className="text-xl font-bold mb-0.5" style={{ color: "var(--text)" }}>{profile?.full_name}</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{profile?.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}>
                  Khách hàng
                </span>
                {profile?.student_id && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                    MSSV: {profile.student_id}
                  </span>
                )}
              </div>
            </>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{profile?.loyalty_points ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Điểm thưởng</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>0</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Chuyến thành công</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>0</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Tin đã đăng</p>
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Cài đặt tài khoản</p>
        </div>
        {menu.map(({ icon: Icon, label, desc, href }, i) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-4 px-5 py-4 hover:opacity-80 transition-opacity"
              style={{ borderBottom: i < menu.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--surface)" }}>
                <Icon size={18} style={{ color: "var(--muted)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted)" }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
