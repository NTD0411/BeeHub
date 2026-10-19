"use client";

import Link from "next/link";
import { Users, ChevronRight, Package } from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { GlassCard } from "@/components/ui/glass-card";
import { PressableScale } from "@/components/motion/pressable-scale";

export default function LaborBookingPage() {
  return (
    <div className="min-h-screen px-5 pt-6 pb-10">
      <FadeSlideIn>
        <Link href="/home" className="text-sm font-medium mb-4 inline-block" style={{ color: "var(--primary)" }}>← Trang chủ</Link>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Khuân vác</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          Thêm dịch vụ bốc xếp vào đơn chuyển trọ đã đặt — khớp flow mobile app.
        </p>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <Link href="/orders">
          <PressableScale>
            <GlassCard className="p-5 flex items-center gap-4 mb-4" hover>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--success-tint)" }}>
                <Package size={24} style={{ color: "var(--success)" }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--text)" }}>Chọn đơn đã đặt</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>Gắn khuân vác vào đơn đang chờ / đã nhận</p>
              </div>
              <ChevronRight style={{ color: "var(--muted)" }} />
            </GlassCard>
          </PressableScale>
        </Link>

        <GlassCard className="p-5 flex items-center gap-4 opacity-70">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-tint)" }}>
            <Users size={24} style={{ color: "var(--primary)" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "var(--text)" }}>Tìm đội khuân vác</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Sắp có — đang đồng bộ với mobile</p>
          </div>
        </GlassCard>
      </FadeSlideIn>
    </div>
  );
}
