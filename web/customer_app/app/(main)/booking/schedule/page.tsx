"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronRight } from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

function ScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");

  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (pickup) params.set("pickup", pickup);
    if (dropoff) params.set("dropoff", dropoff);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    router.push(`/booking/dorm-details?${params.toString()}`);
  };

  return (
    <>
      <FadeSlideIn delay={100}>
        <GlassCard className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: "var(--text)" }}>
              <Calendar size={16} /> Ngày chuyển
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text)" }}>Giờ lấy đồ</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
        </GlassCard>

        <Button variant="gradient" className="w-full mt-6 h-12" onClick={handleContinue} disabled={!date}>
          Tiếp tục <ChevronRight size={18} className="ml-1" />
        </Button>
      </FadeSlideIn>
    </>
  );
}

export default function BookingSchedulePage() {
  return (
    <div className="min-h-screen px-5 pt-6 pb-10">
      <FadeSlideIn>
        <Link href="/booking/location" className="text-sm font-medium mb-4 inline-block" style={{ color: "var(--primary)" }}>← Địa điểm</Link>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Lịch chuyển</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Chọn ngày giờ lấy đồ — bước tiếp theo trong flow đặt chuyến</p>
      </FadeSlideIn>
      <Suspense fallback={null}>
        <ScheduleForm />
      </Suspense>
    </div>
  );
}
