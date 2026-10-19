"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, DollarSign, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/earnings", label: "Thu nhập", icon: DollarSign },
  { href: "/messages", label: "Tin nhắn", icon: MessageCircle },
  { href: "/profile", label: "Hồ sơ", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{ backgroundColor: "var(--nav-bg)", borderTop: "1px solid var(--nav-border)", height: "64px", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href}
            className={cn("flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
              active ? "text-[var(--primary)]" : "text-[var(--muted)]")}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className={cn("text-[10px] font-medium", active ? "font-bold" : "")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
