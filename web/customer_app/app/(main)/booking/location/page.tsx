"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { customerApi } from "@/lib/api";

interface Place {
  id: string;
  address: string;
  label?: string;
}

export default function BookingLocationPage() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlaces, setFetchingPlaces] = useState(true);

  useEffect(() => {
    customerApi.getRecentPlaces()
      .then((res) => {
        if (res.success && res.data) {
          const places = res.data as Place[];
          setRecentPlaces(places);
        }
      })
      .catch(() => {})
      .finally(() => setFetchingPlaces(false));
  }, []);

  const handleContinue = () => {
    if (!dropoff.trim()) return;
    const params = new URLSearchParams({
      pickup: pickup || "Địa điểm hiện tại",
      dropoff,
    });
    router.push(`/booking/schedule?${params.toString()}`);
  };

  const selectPlace = (address: string) => {
    if (!dropoff) setDropoff(address);
    else if (!pickup) setPickup(address);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/home" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Chọn địa điểm</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Báo giá minh bạch · Không cần bản đồ</p>
          </div>
        </div>

        {/* Route card */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          {/* Pickup */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-tint)" }} />
              <div className="w-0.5 h-8 my-1" style={{ backgroundColor: "var(--border)" }} />
            </div>
            <Input
              placeholder="Điểm đón (để trống = vị trí hiện tại)"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              startAdornment={<Navigation size={14} />}
            />
          </div>

          {/* Dropoff */}
          <div className="flex items-center gap-3">
            <MapPin size={12} style={{ color: "var(--success)", flexShrink: 0 }} />
            <Input
              placeholder="Địa điểm đến *"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              startAdornment={<MapPin size={14} />}
              required
            />
          </div>
        </div>
      </div>

      {/* Recent places */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--muted)" }}>ĐỊA ĐIỂM GẦN ĐÂY</h3>

        {fetchingPlaces ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : recentPlaces.length > 0 ? (
          <div className="space-y-2">
            {recentPlaces.map((place) => (
              <button
                key={place.id}
                onClick={() => selectPlace(place.address)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:opacity-80"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-tint)" }}>
                  <Clock size={18} style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  {place.label && <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--primary)" }}>{place.label}</p>}
                  <p className="text-sm truncate" style={{ color: "var(--text)" }}>{place.address}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <MapPin size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted)" }} />
            <p className="text-sm" style={{ color: "var(--muted)" }}>Chưa có địa điểm gần đây</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Nhập địa điểm vào ô tìm kiếm ở trên</p>
          </div>
        )}

        {/* Info card */}
        <Card className="mt-4 p-4">
          <p className="text-xs font-bold mb-2" style={{ color: "var(--primary)" }}>ℹ️ Cách hoạt động</p>
          <ul className="text-xs space-y-1.5" style={{ color: "var(--muted)" }}>
            <li>• Nhập địa chỉ điểm đến của bạn</li>
            <li>• Nhà xe sẽ gửi báo giá trong vòng 30 phút</li>
            <li>• Bạn chọn nhà xe ưng ý và đặt cọc</li>
            <li>• Thanh toán qua PayOS · MoMo · QR Code</li>
          </ul>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="px-4 py-4 pb-6" style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <Button
          variant="gradient"
          size="xl"
          className="w-full"
          onClick={handleContinue}
          disabled={!dropoff.trim()}
          loading={loading}
        >
          Mô tả trọ & Tiếp tục
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
}
