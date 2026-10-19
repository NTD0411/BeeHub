"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, BadgeCheck, Truck, ArrowRight, Search } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { providersApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const NAVY = "#0F1E3D";

interface Provider {
  id: string;
  name: string;
  business_name?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string;
  rating: number;
  total_reviews: number;
  completed_trips?: number;
  is_verified?: boolean;
  is_available?: boolean;
  service_area?: string[];
  base_price?: number | null;
}

function vehicleLabel(v?: string) {
  const map: Record<string, string> = {
    small_truck: "Xe tải nhỏ",
    medium_truck: "Xe tải 1 tấn",
    large_truck: "Xe tải lớn",
    van: "Xe van",
  };
  return (v && map[v]) || v || "Xe tải";
}

function formatVND(n?: number | null) {
  if (!n) return null;
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function ProviderCard({ provider }: { provider: Provider }) {
  const name = provider.business_name || provider.name || provider.full_name || "Nhà xe";
  const rating = provider.rating ?? 0;
  const reviews = provider.total_reviews ?? 0;
  const trips = provider.completed_trips ?? 0;
  const areas = (provider.service_area ?? []).filter(Boolean).slice(0, 2);
  const price = formatVND(provider.base_price);

  return (
    <Link
      href={`/nha-xe/${provider.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      {/* Avatar banner */}
      <div className="h-28 relative overflow-hidden bg-gradient-to-br from-[#0F1E3D] via-[#1a3270] to-[#2563EB]">
        {provider.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={provider.avatar_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 blur-[1px]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E3D]/80 to-transparent" />
        {provider.is_verified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
            <BadgeCheck size={11} /> Xác minh
          </span>
        )}
        {provider.is_available === false && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/80 text-white">
            Không nhận đơn
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-base leading-snug truncate" style={{ color: NAVY }}>
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5">
          <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-800">
            {rating > 0 ? rating.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-gray-400">({reviews} đánh giá)</span>
          {trips > 0 && (
            <>
              <span className="text-gray-200 mx-0.5">·</span>
              <span className="text-xs text-gray-500">{trips} chuyến</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <Truck size={12} className="shrink-0 text-gray-400" />
          <span>{vehicleLabel(provider.vehicle_type)}</span>
        </div>

        {areas.length > 0 && (
          <p className="text-xs text-gray-400 mt-1 truncate">📍 {areas.join(", ")}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          {price ? (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Giá mở cửa</p>
              <p className="text-sm font-bold text-[#2563EB]">{price}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Liên hệ báo giá</p>
          )}
          <span className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] group-hover:gap-2 transition-all">
            Xem hồ sơ <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full mt-3" />
      </div>
    </div>
  );
}

export default function NhaXeListPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    providersApi
      .browse({ city: "Đà Nẵng" })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setProviders(res.data as Provider[]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = providers.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (p.business_name || p.name || p.full_name || "").toLowerCase();
    const areas = (p.service_area ?? []).join(" ").toLowerCase();
    return name.includes(q) || areas.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#EEF1F6] pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <Container className="py-4">
          <h1 className="text-xl font-extrabold" style={{ color: NAVY }}>
            Danh sách nhà xe
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Đang tải..." : `${providers.length} nhà xe đối tác`}
          </p>
        </Container>
      </div>

      <Container className="pt-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc khu vực..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy nhà xe phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>
        )}
      </Container>
    </div>
  );
}
