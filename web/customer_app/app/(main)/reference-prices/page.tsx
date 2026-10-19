"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

const priceData = [
  {
    category: "Căn phòng nhỏ (≤ 20m²)",
    items: [
      { label: "Chuyển cơ bản (1-2km)", price: "400.000 - 600.000đ" },
      { label: "Chuyển vừa (3-5km)", price: "500.000 - 800.000đ" },
      { label: "Chuyển xa (5-10km)", price: "700.000 - 1.200.000đ" },
    ],
  },
  {
    category: "Căn phòng trung bình (20-40m²)",
    items: [
      { label: "Chuyển cơ bản (1-2km)", price: "700.000 - 1.000.000đ" },
      { label: "Chuyển vừa (3-5km)", price: "900.000 - 1.400.000đ" },
      { label: "Chuyển xa (5-10km)", price: "1.200.000 - 2.000.000đ" },
    ],
  },
  {
    category: "Phụ phí thêm",
    items: [
      { label: "Mỗi tầng không có thang máy", price: "+30.000 - 50.000đ/tầng" },
      { label: "Đồ nặng (tủ lạnh, máy giặt...)", price: "+100.000 - 300.000đ/món" },
      { label: "Đóng gói chuyên nghiệp", price: "+50.000 - 150.000đ" },
      { label: "Phí chờ (>30 phút)", price: "+50.000đ/30 phút" },
    ],
  },
  {
    category: "Gói khuân vác thuần",
    items: [
      { label: "1 người (2 tiếng)", price: "150.000 - 200.000đ" },
      { label: "2 người (2 tiếng)", price: "280.000 - 350.000đ" },
      { label: "Thêm mỗi giờ/người", price: "+60.000 - 80.000đ" },
    ],
  },
];

export default function ReferencePricesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Bảng phụ phí tham khảo</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Giá ước tính · Thực tế có thể thay đổi</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card className="p-4" style={{ backgroundColor: "var(--primary-tint)", borderColor: "var(--primary)" + "33" }}>
          <div className="flex items-start gap-3">
            <Info size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "var(--primary)" }}>
              Bảng giá này chỉ mang tính tham khảo. Giá thực tế phụ thuộc vào khối lượng đồ đạc,
              địa điểm cụ thể và điều kiện thực tế được nhà xe báo giá.
            </p>
          </div>
        </Card>

        {priceData.map((section) => (
          <Card key={section.category} className="overflow-hidden">
            <div
              className="px-4 py-3"
              style={{ backgroundColor: "var(--primary)", borderBottom: "1px solid var(--border)" }}
            >
              <h3 className="font-bold text-sm text-white">{section.category}</h3>
            </div>
            <div>
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <span className="text-sm" style={{ color: "var(--text)" }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{item.price}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <div className="text-center py-2">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Cập nhật lần cuối: Tháng 6, 2026 · UniMove
          </p>
        </div>
      </div>
    </div>
  );
}
