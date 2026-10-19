"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown, LogOut, User, Settings, Shield, KeyRound, Phone, Mail, Building2,
} from "lucide-react";
import { logoutToHome, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface UserMenuDropdownProps {
  user: AuthUser | null;
  accentGradient: string;
}

export function UserMenuDropdown({ user, accentGradient }: UserMenuDropdownProps) {
  const router = useRouter();
  const isProvider = user?.role === "provider";

  const roleLabel = isProvider ? "Nhà vận chuyển" : "Khách hàng";
  const roleColor = isProvider ? "var(--provider)" : "var(--primary)";
  const roleBg = isProvider ? "var(--provider-tint)" : "var(--primary-tint)";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 pl-2 pr-3 h-9 rounded-xl transition-colors outline-none"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text)",
          }}
          aria-label="Menu tài khoản"
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: accentGradient }}
          >
            {user?.full_name?.[0] ?? "U"}
          </div>
          <span className="text-sm font-medium hidden sm:block max-w-[140px] truncate">
            {user?.full_name ?? "Tài khoản"}
          </span>
          <ChevronDown size={14} className="shrink-0" style={{ color: "var(--muted)" }} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className={cn(
            "z-[9999] w-72 rounded-2xl border shadow-2xl outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px var(--border)",
          }}
        >
          {/* Thông tin user */}
          <div
            className="px-4 py-4"
            style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0"
                style={{ background: accentGradient }}
              >
                {user?.full_name?.[0] ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug break-words" style={{ color: "var(--text)" }}>
                  {user?.full_name ?? "Người dùng"}
                </p>
                <span
                  className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: roleBg, color: roleColor }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {user?.email && (
                <div className="flex items-center gap-2 text-xs min-w-0" style={{ color: "var(--muted)" }}>
                  <Mail size={13} className="shrink-0" style={{ color: roleColor }} />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <Phone size={13} className="shrink-0" style={{ color: roleColor }} />
                  <span>{user.phone}</span>
                </div>
              )}
              {isProvider && user?.business_name && (
                <div className="flex items-center gap-2 text-xs min-w-0" style={{ color: "var(--muted)" }}>
                  <Building2 size={13} className="shrink-0" style={{ color: roleColor }} />
                  <span className="truncate">{user.business_name}</span>
                </div>
              )}
              {!isProvider && user?.student_id && (
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  MSSV: <span style={{ color: "var(--text)" }}>{user.student_id}</span>
                </p>
              )}
              {!isProvider && user?.loyalty_points != null && (
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Điểm thưởng: <span style={{ color: "var(--text)" }}>{user.loyalty_points}</span>
                </p>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="py-1.5">
            <MenuLink icon={User} label="Hồ sơ" href="/profile" />
            <MenuLink icon={Settings} label="Chỉnh sửa hồ sơ" href="/profile/edit" />
            <MenuLink icon={KeyRound} label="Đổi mật khẩu" href="/profile/change-password" />
            {isProvider && <MenuLink icon={Shield} label="Giấy tờ xác minh" href="/tai-xe/giay-to" />}
          </div>

          <DropdownMenu.Separator style={{ backgroundColor: "var(--border)", height: 1 }} />

          <DropdownMenu.Item
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer outline-none rounded-lg mx-1 mb-1"
            style={{ color: "var(--error)" }}
            onSelect={() => logoutToHome(router)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--error-tint)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
          >
            <LogOut size={15} />
            Đăng xuất
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuLink({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer outline-none rounded-lg mx-1 transition-colors"
        style={{ color: "var(--text)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "";
        }}
      >
        <Icon size={15} style={{ color: "var(--muted)" }} />
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}
