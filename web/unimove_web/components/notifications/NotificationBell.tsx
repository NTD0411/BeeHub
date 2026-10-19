"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { timeAgo, cn } from "@/lib/utils";
import { useNotificationStore } from "@/lib/stores";
import {
  type NotificationItem,
  getNotificationNavigateHref,
  isNotificationUnread,
  mapNotificationKind,
  NOTIFICATION_TYPE_META,
} from "./notification-utils";

const BRAND = "#1E40AF";

interface NotificationBellProps {
  isProvider?: boolean;
  showCountBadge?: boolean;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  iconSize?: number;
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-4 py-3">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function NotificationBell({
  isProvider = false,
  showCountBadge = false,
  className,
  buttonClassName,
  iconClassName,
  iconSize = 20,
}: NotificationBellProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await notificationsApi.list({ pageSize: 30 });
      if (r.success && r.data) {
        const d = r.data as { notifications?: NotificationItem[] } | NotificationItem[];
        const list = Array.isArray(d) ? d : (d?.notifications ?? []);
        setNotifs(list);
        setUnreadCount(list.filter(isNotificationUnread).length);
      }
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await notificationsApi.unreadCount();
      const count = (res.data as { count?: number })?.count ?? 0;
      setUnreadCount(count);
    } catch {
      /* ignore */
    }
  }, [setUnreadCount]);

  useEffect(() => {
    refreshUnread();
    const timer = setInterval(refreshUnread, 30_000);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    setOpen((v) => !v);
  };

  const markAll = async () => {
    await notificationsApi.markAllRead();
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: NotificationItem) => {
    if (isNotificationUnread(n)) {
      await notificationsApi.markRead(n.id);
      const next = notifs.map((x) =>
        x.id === n.id ? { ...x, read: true, is_read: true } : x,
      );
      setNotifs(next);
      setUnreadCount(next.filter(isNotificationUnread).length);
    }

    const href = getNotificationNavigateHref(n, { isProvider });
    setOpen(false);
    if (href) router.push(href);
  };

  const localUnread = notifs.filter(isNotificationUnread).length;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Thông báo"}
        aria-expanded={open}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-colors hover:bg-gray-100",
          buttonClassName,
        )}
      >
        <Bell className={cn("text-gray-600", iconClassName)} size={iconSize} strokeWidth={1.75} />
        {unreadCount > 0 &&
          (showCountBadge ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
          ))}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            width: "min(400px, calc(100vw - 24px))",
            zIndex: 99999,
          }}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Thông báo</p>
              {localUnread > 0 && (
                <p className="text-[11px] text-gray-400">{localUnread} chưa đọc</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {localUnread > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#1E40AF] hover:bg-gray-50"
                >
                  <CheckCheck size={13} />
                  Đọc tất cả
                </button>
              )}
              <button
                type="button"
                onClick={load}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50"
                aria-label="Làm mới"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[min(420px,60vh)] overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-gray-50 py-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                  <Bell size={26} className="text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-700">Chưa có thông báo</p>
                <p className="mt-1 text-xs text-gray-400">
                  Cập nhật đơn hàng và Chợ SV sẽ hiện ở đây
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map((n) => {
                  const kind = mapNotificationKind(String(n.type ?? n.notification_type ?? ""));
                  const meta = NOTIFICATION_TYPE_META[kind];
                  const Icon = meta.icon;
                  const unread = isNotificationUnread(n);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50/80"
                      style={{
                        borderLeft: unread ? `3px solid ${BRAND}` : "3px solid transparent",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm",
                              unread ? "font-bold text-gray-900" : "font-medium text-gray-600",
                            )}
                          >
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-gray-300">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                          {n.body || n.message}
                        </p>
                      </div>
                      {unread && (
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: BRAND }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
