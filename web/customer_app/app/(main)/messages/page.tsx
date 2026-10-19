"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Package, ShoppingBag, Star, Zap, Info, MessageCircle } from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationsApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

const TABS = ["Thông báo", "Tin nhắn đơn"] as const;

function getNotifIcon(type: string) {
  const map: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    order: { icon: <Package size={18} />, bg: "var(--primary-tint)", color: "var(--primary)" },
    marketplace: { icon: <ShoppingBag size={18} />, bg: "var(--warning-tint)", color: "var(--warning)" },
    review: { icon: <Star size={18} />, bg: "#fef3c7", color: "#d97706" },
    promo: { icon: <Zap size={18} />, bg: "var(--success-tint)", color: "var(--success)" },
  };
  return map[type] ?? { icon: <Info size={18} />, bg: "var(--surface)", color: "var(--muted)" };
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ pageSize: 50 });
      if (res.success && res.data) {
        const data = res.data as { notifications?: Notification[] } | Notification[];
        setNotifications(Array.isArray(data) ? data : (data?.notifications ?? []));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast("Đã đánh dấu tất cả là đã đọc", "success");
    } catch {
      toast("Thử lại sau", "error");
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen px-5 pt-6 pb-28">
      <FadeSlideIn>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Tin nhắn</h1>
          {tab === 0 && unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--primary)" }}>
              <CheckCheck size={16} /> Đọc hết
            </button>
          )}
        </div>

        <div className="flex gap-2 p-1 rounded-xl mb-5" style={{ backgroundColor: "var(--surface)" }}>
          {TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className="relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: tab === i ? "var(--primary)" : "var(--muted)" }}
            >
              {tab === i && (
                <motion.div
                  layoutId="msg-tab"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: "var(--card)", boxShadow: "var(--glass-shadow)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </FadeSlideIn>

      <AnimatePresence mode="wait">
        {tab === 0 ? (
          <motion.div key="notif" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : notifications.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <Bell size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--primary)" }} />
                <p className="font-medium" style={{ color: "var(--text)" }}>Chưa có thông báo</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Cập nhật đơn hàng và khuyến mãi sẽ hiện ở đây</p>
              </GlassCard>
            ) : (
              <div className="space-y-2">
                {notifications.map((n, i) => {
                  const meta = getNotifIcon(n.type);
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !n.is_read && notificationsApi.markRead(n.id)}
                    >
                      <GlassCard className={`p-4 ${!n.is_read ? "border-l-4" : ""}`} hover
                        style={!n.is_read ? { borderLeftColor: "var(--primary)" } : undefined}>
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2">
                              <p className={`text-sm font-semibold line-clamp-1 ${!n.is_read ? "" : "opacity-80"}`} style={{ color: "var(--text)" }}>{n.title}</p>
                              <span className="text-[10px] shrink-0" style={{ color: "var(--muted)" }}>{timeAgo(n.created_at)}</span>
                            </div>
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--muted)" }}>{n.body}</p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <GlassCard className="p-10 text-center">
              <MessageCircle size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--primary)" }} />
              <p className="font-medium" style={{ color: "var(--text)" }}>Chat đơn hàng</p>
              <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: "var(--muted)" }}>
                Tin nhắn với nhà xe sẽ hiện ở đây khi backend bật API conversations. Chat chợ SV vẫn dùng trong từng tin đăng.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
