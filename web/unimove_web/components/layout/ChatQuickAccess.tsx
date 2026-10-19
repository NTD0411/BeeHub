"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";
import { conversationsApi } from "@/lib/api";

const HIDE_BOTTOM_NAV_PREFIXES = [
  "/dat-chuyen",
  "/cho-sinh-vien",
  "/don-hang/",
  "/tai-khoan/chinh-sua",
  "/tai-khoan/doi-mat-khau",
];

interface ConversationRow {
  unread_count?: number;
}

export function ChatQuickAccess() {
  const pathname = usePathname();
  const [chatUnread, setChatUnread] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);

  const loadUnread = useCallback(async () => {
    const user = getStoredUser();
    setLoggedIn(!!user);
    if (!user) {
      setChatUnread(0);
      return;
    }
    try {
      const res = await conversationsApi.list();
      if (res.success && Array.isArray(res.data)) {
        const total = (res.data as ConversationRow[]).reduce(
          (sum, c) => sum + (c.unread_count ?? 0),
          0
        );
        setChatUnread(total);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 30_000);
    return () => clearInterval(timer);
  }, [loadUnread, pathname]);

  if (!loggedIn || pathname.startsWith("/tin-nhan") || pathname.startsWith("/thong-bao")) return null;

  const bottomNavHidden = HIDE_BOTTOM_NAV_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  return (
    <Link
      href="/tin-nhan"
      aria-label={chatUnread > 0 ? `${chatUnread} tin nhắn chưa đọc` : "Tin nhắn"}
      className={cn(
        "fixed z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#2563EB] text-white shadow-[0_8px_28px_rgba(37,99,235,0.45)]",
        "transition-transform hover:scale-105 active:scale-95 no-underline",
        bottomNavHidden ? "bottom-6 right-5" : "bottom-24 right-5 lg:bottom-8 lg:right-8"
      )}
    >
      <motion.span
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center justify-center"
      >
        <MessageCircle size={26} strokeWidth={2} />
        {chatUnread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {chatUnread > 99 ? "99+" : chatUnread}
          </span>
        )}
      </motion.span>
    </Link>
  );
}
