"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Package, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { providerNotificationsApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerNotificationsApi.getNotifications({ page: 1 })
      .then((res) => {
        if (res.success && res.data) {
          const data = res.data as { notifications?: Notification[] } | Notification[];
          setNotifications(Array.isArray(data) ? data : (data?.notifications ?? []));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await providerNotificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await providerNotificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast("Đã đọc tất cả", "success");
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-4 sticky top-0 z-10"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Thông báo</h1>
            {unread > 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>{unread} chưa đọc</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl"
              style={{ color: "var(--primary)", backgroundColor: "var(--primary-tint)" }}>
              <CheckCheck size={16} /> Đọc tất cả
            </button>
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="px-4 py-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell size={52} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
            <p className="font-semibold" style={{ color: "var(--text)" }}>Chưa có thông báo</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <button key={notif.id} className="w-full text-left px-4 py-4 flex gap-3 transition-colors"
              style={{
                backgroundColor: notif.is_read ? "transparent" : "var(--primary-tint)",
                borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
              }}
              onClick={() => !notif.is_read && markRead(notif.id)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--surface)", color: "var(--primary)" }}>
                {notif.type === "order" ? <Package size={18} /> : <Info size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm line-clamp-1"
                    style={{ color: "var(--text)", fontWeight: notif.is_read ? 500 : 700 }}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--muted)" }}>
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--muted)" }}>{notif.body}</p>
                {!notif.is_read && (
                  <div className="flex items-center gap-1 mt-1">
                    <Check size={11} style={{ color: "var(--primary)" }} />
                    <span className="text-[10px] font-medium" style={{ color: "var(--primary)" }}>Chưa đọc</span>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
