"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, CreditCard, ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationsApi } from "@/lib/api";

const navItems = [
  { href: "/home", label: "Trang chủ", icon: Home },
  { href: "/payments", label: "Thanh toán", icon: CreditCard },
  { href: "/activity", label: "Hoạt động", icon: ClipboardList },
  { href: "/messages", label: "Tin nhắn", icon: MessageCircle },
];

const HIDE_NAV_PREFIXES = [
  "/booking",
  "/marketplace",
  "/profile/edit",
  "/profile/change-password",
  "/orders/",
  "/reference-prices",
];

export function BottomNav() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    notificationsApi
      .getUnreadCount()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data as { count?: number };
          setUnread(d.count ?? 0);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const hideNav = HIDE_NAV_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
  if (hideNav) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="mx-3 mb-3 flex items-stretch rounded-2xl border backdrop-blur-xl"
        style={{
          backgroundColor: "var(--glass-bg)",
          borderColor: "var(--glass-border)",
          boxShadow: "var(--nav-shadow)",
          height: "68px",
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          const showBadge = href === "/messages" && unread > 0;

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-2 inset-y-2 rounded-xl"
                  style={{ backgroundColor: "var(--primary-tint)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? "var(--primary)" : "var(--muted)" }}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
                <span
                  className={cn("text-[10px] font-medium", active && "font-bold")}
                  style={{ color: active ? "var(--primary)" : "var(--muted)" }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
