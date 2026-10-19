"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Heart, Tag, MapPin, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { marketplaceApi } from "@/lib/api";
import { formatVND, timeAgo } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  price?: number;
  category: string;
  condition?: string;
  city?: string;
  status: string;
  images?: string[];
  created_at: string;
  seller?: { full_name: string };
  is_interested?: boolean;
}

const CATEGORIES = [
  { value: "", label: "Tất cả" },
  { value: "furniture", label: "Nội thất" },
  { value: "electronics", label: "Điện tử" },
  { value: "books", label: "Sách vở" },
  { value: "clothes", label: "Quần áo" },
  { value: "kitchen", label: "Nhà bếp" },
  { value: "other", label: "Khác" },
];

const TABS = [
  { key: "explore", label: "Khám phá" },
  { key: "saved", label: "Yêu thích" },
  { key: "mine", label: "Tin của tôi" },
];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchListings = useCallback(async (q: string, cat: string, pg: number, tab: number) => {
    setLoading(true);
    try {
      let res;
      if (tab === 0) {
        res = await marketplaceApi.getListings({ search: q || undefined, category: cat || undefined, page: pg });
      } else if (tab === 1) {
        res = await marketplaceApi.getMyInterests();
      } else {
        res = await marketplaceApi.getMyListings();
      }
      if (res.success) {
        const data = res.data as { listings?: Listing[] } | Listing[];
        const list = Array.isArray(data) ? data : (data?.listings ?? []);
        if (pg === 1) setListings(list);
        else setListings((prev) => [...prev, ...list]);
        setHasMore(list.length >= 12);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchListings(search, category, 1, activeTab);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, category, activeTab, fetchListings]);

  const toggleInterest = async (e: React.MouseEvent, listing: Listing) => {
    e.preventDefault();
    try {
      if (listing.is_interested) {
        await marketplaceApi.removeInterest(listing.id);
      } else {
        await marketplaceApi.addInterest(listing.id);
      }
      setListings((prev) =>
        prev.map((l) =>
          l.id === listing.id ? { ...l, is_interested: !l.is_interested } : l
        )
      );
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4 sticky top-0 z-10"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Chợ sinh viên</h1>
          <Link
            href="/marketplace/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}
          >
            <Plus size={16} /> Đăng tin
          </Link>
        </div>

        {/* Search */}
        <Input
          placeholder="Tìm kiếm đồ dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<Search size={15} />}
          className="mb-3"
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setPage(1); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === i ? "var(--primary)" : "var(--surface)",
                color: activeTab === i ? "white" : "var(--muted)",
                border: `1px solid ${activeTab === i ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {activeTab === 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
                style={{
                  backgroundColor: category === cat.value ? "var(--primary)" : "var(--surface)",
                  color: category === cat.value ? "white" : "var(--muted)",
                  border: `1px solid ${category === cat.value ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="px-4 py-4">
        {loading && page === 1 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={52} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              {activeTab === 0 ? "Không tìm thấy tin đăng" : activeTab === 1 ? "Chưa có tin yêu thích" : "Bạn chưa đăng tin nào"}
            </p>
            {activeTab === 0 && (
              <Link href="/marketplace/new">
                <button className="mt-4 px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}>
                  Đăng tin đầu tiên
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onToggleInterest={(e) => toggleInterest(e, listing)}
                  showManage={activeTab === 2}
                />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchListings(search, category, next, activeTab);
                }}
                className="w-full mt-4 py-3 text-sm font-medium rounded-xl"
                style={{ backgroundColor: "var(--surface)", color: "var(--primary)", border: "1px solid var(--border)" }}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  onToggleInterest,
  showManage,
}: {
  listing: Listing;
  onToggleInterest: (e: React.MouseEvent) => void;
  showManage: boolean;
}) {
  const isSold = listing.status === "sold" || listing.status === "completed";

  return (
    <Link href={`/marketplace/${listing.id}`}>
      <div
        className="rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Image */}
        <div className="relative h-40" style={{ backgroundColor: "var(--surface)" }}>
          {listing.images && listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag size={32} style={{ color: "var(--border)" }} />
            </div>
          )}

          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm px-3 py-1 rounded-full bg-black/60">Đã bán</span>
            </div>
          )}

          {!showManage && (
            <button
              onClick={onToggleInterest}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <Heart
                size={16}
                fill={listing.is_interested ? "var(--error)" : "transparent"}
                style={{ color: listing.is_interested ? "var(--error)" : "white" }}
              />
            </button>
          )}

          {listing.condition && (
            <Badge
              className="absolute bottom-2 left-2 text-[10px]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", border: "none" }}
            >
              {listing.condition}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold line-clamp-2 mb-2" style={{ color: "var(--text)" }}>{listing.title}</p>
          <p className="text-base font-bold mb-1" style={{ color: listing.price === 0 ? "var(--success)" : "var(--primary)" }}>
            {listing.price === 0 || !listing.price ? "Miễn phí" : formatVND(listing.price)}
          </p>
          <div className="flex items-center gap-1">
            {listing.city && (
              <>
                <MapPin size={11} style={{ color: "var(--muted)" }} />
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>{listing.city}</span>
                <span style={{ color: "var(--border)" }}>·</span>
              </>
            )}
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>{timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
