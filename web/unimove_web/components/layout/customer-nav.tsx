"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ClipboardList, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home",          label: "Trang chủ", icon: Home },
  { href: "/marketplace",   label: "Chợ SV",    icon: ShoppingBag },
  { href: "/orders",        label: "Đơn hàng",  icon: ClipboardList },
  { href: "/notifications", label: "Thông báo", icon: Bell },
  { href: "/profile",       label: "Hồ sơ",     icon: User },
];

export function CustomerNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{ backgroundColor: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)", height: "64px", boxShadow: "var(--nav-shadow)" }}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href}
            className={cn("flex flex-1 flex-col items-center justify-center gap-1 transition-all",
              active ? "text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--text)]")}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px]" style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
