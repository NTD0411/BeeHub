"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  CreditCard,
  Crown,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Power,
  Settings,
  Shield,
  Star,
} from "lucide-react";
import Link from "next/link";
import { getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";
import { authApi } from "@/lib/api";

const ACCOUNT_ITEMS = [
  {
    icon: Package,
    label: "Đơn hàng của tôi",
    sub: "Xem lịch sử đơn hàng & vé đã đặt",
    href: "/don-hang",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: CreditCard,
    label: "Phương thức thanh toán",
    sub: "Quản lý ví và thẻ liên kết",
    href: "/tai-khoan/thanh-toan",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    icon: MapPin,
    label: "Địa chỉ nhận hàng",
    sub: "Thêm địa điểm cho chuyến đi",
    href: "/dat-chuyen/dia-diem",
    color: "#9333EA",
    bg: "#FAF5FF",
  },
];

const SUPPORT_ITEMS = [
  {
    icon: HelpCircle,
    label: "Trợ giúp & Hỗ trợ",
    sub: "Tin nhắn và hỗ trợ khách hàng",
    href: "/tin-nhan",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    icon: Shield,
    label: "Điều khoản & Bảo mật",
    sub: "Chính sách dịch vụ và người dùng",
    href: "/chinh-sach-huy-don",
    color: "#0284C7",
    bg: "#F0F9FF",
  },
  {
    icon: Settings,
    label: "Bảo mật tài khoản",
    sub: "Cập nhật mật khẩu của bạn",
    href: "/tai-khoan/doi-mat-khau",
    color: "#D97706",
    bg: "#FFFBEB",
  },
];

const MENU_SECTIONS = [
  { title: "Tài khoản", items: ACCOUNT_ITEMS },
  { title: "Hỗ trợ & cài đặt", items: SUPPORT_ITEMS },
];

const STATS = [
  { label: "Chuyến đã đặt", value: "12", icon: BriefcaseBusiness, color: "#2563EB", bg: "#EFF6FF" },
  { label: "Đánh giá trung bình", value: "4.8", icon: Star, color: "#F59E0B", bg: "#FFFBEB", suffix: "/ 5.0" },
  { label: "Điểm tích lũy", value: "240", icon: Crown, color: "#059669", bg: "#ECFDF5" },
];

export default function TaiKhoanPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local credentials even if the API is unavailable.
    }
    clearAuth();
    router.replace("/");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((word) => word[0]).slice(-2).join("").toUpperCase()
    : "?";

  return (
    <div className="w-full flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-10 2xl:px-16">
      <div className="mx-auto w-full max-w-[1440px] space-y-5 sm:space-y-6">
        <h1 className="sr-only">Tài khoản</h1>

        <section className="flex min-w-0 flex-col gap-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-900/10 sm:flex-row sm:items-center sm:gap-6 sm:p-7 lg:p-8">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-blue-700 shadow-md sm:h-24 sm:w-24">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name || "Ảnh đại diện"} className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
            ) : (
              initials
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-600 bg-emerald-500 text-white">
              <BadgeCheck size={16} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="break-words text-xl font-bold sm:text-2xl">
                {user?.full_name ?? "Người dùng"}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white">
                <Crown size={12} />
                Thành viên BeeHub
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-blue-50">
              {user?.email && (
                <p className="flex min-w-0 items-center gap-2">
                  <Mail size={15} className="shrink-0" />
                  <span className="break-all">{user.email}</span>
                </p>
              )}
              {user?.phone && (
                <p className="flex min-w-0 items-center gap-2">
                  <Phone size={15} className="shrink-0" />
                  <span className="break-words">{user.phone}</span>
                </p>
              )}
            </div>
          </div>

          <Link
            href="/tai-khoan/chinh-sua"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/40 bg-white/10 px-4 text-sm font-semibold text-white no-underline transition hover:bg-white/20 sm:self-center"
          >
            <Settings size={16} />
            Chỉnh sửa hồ sơ
          </Link>
        </section>

        <section aria-label="Thống kê tài khoản" className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4">
          {STATS.map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:gap-4 sm:p-5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                style={{ color, backgroundColor: bg }}
              >
                <Icon size={20} fill={label === "Đánh giá trung bình" || label === "Điểm tích lũy" ? "currentColor" : "none"} />
              </span>
              <div className="min-w-0 text-center sm:text-left">
                <p className="flex flex-wrap items-baseline justify-center gap-1 text-xl font-bold text-slate-900 sm:justify-start sm:text-2xl">
                  {value}
                  {suffix && <span className="text-xs font-medium text-amber-600">{suffix}</span>}
                </p>
                <p className="mt-0.5 text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500 sm:text-xs">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section aria-label="Tùy chọn tài khoản" className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 sm:gap-6">
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map(({ icon: Icon, label, sub, href, color, bg }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-3 no-underline transition hover:bg-slate-50 sm:gap-3.5 sm:px-3"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: bg, color }}
                    >
                      <Icon size={18} fill={label === "Trợ giúp & Hỗ trợ" ? "currentColor" : "none"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-slate-900">{label}</span>
                      <span className="mt-0.5 block break-words text-xs text-slate-500">{sub}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
            <LogOut size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Phiên đăng nhập</p>
            <p className="text-xs text-slate-500">Thoát khỏi tài khoản trên thiết bị này</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <Power size={16} />
            Đăng xuất
          </button>
        </section>
      </div>
    </div>
  );
}
