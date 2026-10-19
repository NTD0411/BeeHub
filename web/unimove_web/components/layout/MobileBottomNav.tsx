"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CreditCard, ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/stores";

/** Khớp mobile customer app: 4 tab — Trang chủ · Thanh toán · Hoạt động · Tin nhắn */
const NAV_ITEMS = [
  { href: "/trang-chu", label: "Trang chủ", Icon: Home },
  { href: "/tai-khoan/thanh-toan", label: "Thanh toán", Icon: CreditCard },
  { href: "/hoat-dong", label: "Hoạt động", Icon: ClipboardList },
  { href: "/tin-nhan", label: "Tin nhắn", Icon: MessageCircle },
] as const;

const HIDE_ON_PREFIXES = ["/dat-chuyen", "/cho-sinh-vien", "/don-hang/", "/tai-khoan/chinh-sua", "/tai-khoan/doi-mat-khau"];

export function MobileBottomNav() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  if (HIDE_ON_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return null;
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed bottom-0 left-0 right-0 z-bottomnav lg:hidden px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="mb-3 flex h-[68px] items-stretch rounded-2xl border backdrop-blur-xl"
        style={{
          backgroundColor: "var(--glass-bg)",
          borderColor: "var(--glass-border)",
          boxShadow: "var(--shadow-sticky)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href === "/tai-khoan/thanh-toan" && pathname.startsWith("/tai-khoan/thanh-toan")) ||
            (href === "/hoat-dong" && (pathname.startsWith("/hoat-dong") || pathname === "/don-hang")) ||
            (href === "/tin-nhan" && pathname.startsWith("/tin-nhan"));
          const showBadge = href === "/tin-nhan" && unreadCount > 0;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="customer-nav-pill"
                  className="absolute inset-x-2 inset-y-2 rounded-xl bg-[#EFF6FF] dark:bg-blue-950/40"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <span className="relative">
                  <Icon
                    className={cn("h-[22px] w-[22px] transition-all", isActive ? "text-[#2563EB] scale-110" : "text-gray-400")}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className={cn("text-[10px]", isActive ? "font-semibold text-[#2563EB]" : "font-normal text-gray-400")}>
                  {label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
