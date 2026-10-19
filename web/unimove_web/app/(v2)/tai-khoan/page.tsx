"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, MapPin, Edit3, ChevronRight, Package, CreditCard, HelpCircle, Shield, LogOut, Star } from "lucide-react";
import { getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";
import { authApi } from "@/lib/api";
import Link from "next/link";

const MENU_ITEMS = [
  {
    section: "Tài khoản",
    items: [
      { icon: Package,    label: "Đơn hàng của tôi",      sub: "Xem lịch sử đơn hàng",  href: "/don-hang",  color: "#2563EB", bg: "#EFF6FF" },
      { icon: CreditCard, label: "Phương thức thanh toán", sub: "Quản lý ví và thẻ",     href: "/tai-khoan/thanh-toan", color: "#16A34A", bg: "#F0FDF4" },
    ],
  },
  {
    section: "Hỗ trợ",
    items: [
      { icon: HelpCircle, label: "Trợ giúp & Hỗ trợ",    sub: "FAQ và liên hệ",         href: "/ho-tro",    color: "#7C3AED", bg: "#F5F3FF" },
      { icon: Shield,     label: "Điều khoản & Bảo mật",  sub: "Chính sách dịch vụ",    href: "/chinh-sach", color: "#64748B", bg: "#F1F5F9" },
    ],
  },
];

export default function TaiKhoanPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => { setUser(getStoredUser()); }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    router.replace("/");
  };

  const initials = user?.full_name ? user.full_name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() : "?";

  return (
    <div className="px-4 pb-6 pt-5 max-w-2xl mx-auto lg:max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tài khoản</h1>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Blue banner */}
        <div className="h-20" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563EB 60%, #3b82f6 100%)" }} />

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-9 mb-4">
            <div className="w-18 h-18 rounded-2xl border-4 border-white shadow-md bg-blue-50 flex items-center justify-center text-[#2563EB] font-extrabold text-xl"
              style={{ width: 72, height: 72 }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover rounded-xl" />
                : initials}
            </div>
            <Link href="/tai-khoan/chinh-sua" className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-[#2563EB] text-[#2563EB] text-sm font-semibold hover:bg-blue-50 transition-colors">
              <Edit3 size={13} /> Chỉnh sửa
            </Link>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{user?.full_name ?? "Người dùng"}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {user?.email && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={13} /> {user.email}
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone size={13} /> {user.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Chuyến đã đặt", value: "12", color: "#2563EB", bg: "#EFF6FF" },
          { label: "Đánh giá TB", value: "4.8", color: "#D97706", bg: "#FFFBEB", icon: <Star size={12} className="inline mr-0.5" /> },
          { label: "Điểm tích lũy", value: "240", color: "#16A34A", bg: "#F0FDF4" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>
              {s.icon}{s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu sections */}
      {MENU_ITEMS.map(section => (
        <div key={section.section}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{section.section}</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/70 transition-colors no-underline">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: item.bg }}>
                    <Icon size={18} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-red-50/60 transition-colors"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={18} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-red-600">Đăng xuất</p>
            <p className="text-xs text-red-400">Thoát khỏi tài khoản</p>
          </div>
        </button>
      </div>
    </div>
  );
}