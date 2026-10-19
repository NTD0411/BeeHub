"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Home, Layers, Users, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ordersApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const SERVICE_TYPES = [
  { value: "standard", label: "Tiêu chuẩn", desc: "Phù hợp trọ nhỏ, ít đồ", price: "từ 500.000đ", color: "#3b82f6" },
  { value: "express", label: "Nhanh", desc: "Ưu tiên xử lý ngay", price: "từ 800.000đ", color: "#f59e0b" },
  { value: "premium", label: "Cao cấp", desc: "Đóng gói chuyên nghiệp", price: "từ 1.200.000đ", color: "#9333ea" },
];

function DormDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const pickup = searchParams.get("pickup") || "";
  const dropoff = searchParams.get("dropoff") || "";

  const [form, setForm] = useState({
    description: "",
    floor: "",
    num_helpers: "2",
    service_type: "standard",
    special_notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        service_type: form.service_type,
        pickup_address: pickup,
        dropoff_address: dropoff,
        description: form.description,
        floor_number: form.floor ? parseInt(form.floor) : undefined,
        num_helpers: parseInt(form.num_helpers),
        special_notes: form.special_notes || undefined,
      };
      const res = await ordersApi.createOrder(body);
      if (!res.success) {
        toast((res as { message?: string }).message || "Tạo yêu cầu thất bại", "error");
        return;
      }
      const orderData = res.data as { id: string };
      toast("Yêu cầu đã được gửi! Đang chờ báo giá...", "success");
      router.push(`/orders/${orderData.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/booking/location" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Thông tin phòng trọ</h1>
        </div>

        {/* Route summary */}
        <div className="mt-3 px-3 py-2.5 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--surface)" }}>
          <div className="flex-1 text-xs truncate" style={{ color: "var(--muted)" }}>
            {pickup || "Vị trí hiện tại"}
          </div>
          <ChevronRight size={14} style={{ color: "var(--muted)" }} />
          <div className="flex-1 text-xs font-medium truncate" style={{ color: "var(--text)" }}>{dropoff}</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Service type */}
        <div>
          <label className="text-sm font-bold block mb-3" style={{ color: "var(--text)" }}>Loại dịch vụ</label>
          <div className="space-y-2">
            {SERVICE_TYPES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => handleChange("service_type", st.value)}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all"
                style={{
                  backgroundColor: form.service_type === st.value ? st.color + "15" : "var(--card)",
                  border: `2px solid ${form.service_type === st.value ? st.color : "var(--border)"}`,
                }}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: form.service_type === st.value ? st.color : "var(--text)" }}>
                      {st.label}
                    </span>
                    {form.service_type === st.value && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: st.color }}>Đã chọn</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{st.desc}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: st.color }}>{st.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mô tả đồ đạc */}
        <div>
          <label className="text-sm font-bold block mb-2" style={{ color: "var(--text)" }}>
            Mô tả đồ đạc <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder="VD: 1 tủ lạnh nhỏ, 2 thùng quần áo, 1 bộ bàn ghế học nhỏ, 1 máy quạt..."
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="w-full rounded-xl border px-3 py-3 text-sm resize-none"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Mô tả càng chi tiết, báo giá càng chính xác
          </p>
        </div>

        {/* Tầng & số người */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold block mb-2" style={{ color: "var(--text)" }}>Tầng hiện tại</label>
            <Input
              type="number"
              min="0"
              max="50"
              placeholder="VD: 3"
              value={form.floor}
              onChange={(e) => handleChange("floor", e.target.value)}
              startAdornment={<Layers size={15} />}
            />
          </div>
          <div>
            <label className="text-sm font-bold block mb-2" style={{ color: "var(--text)" }}>Số người khuân</label>
            <Input
              type="number"
              min="1"
              max="10"
              placeholder="2"
              value={form.num_helpers}
              onChange={(e) => handleChange("num_helpers", e.target.value)}
              startAdornment={<Users size={15} />}
            />
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="text-sm font-bold block mb-2" style={{ color: "var(--text)" }}>Ghi chú đặc biệt</label>
          <textarea
            rows={2}
            placeholder="VD: Có thang máy, đường hẻm nhỏ, v.v..."
            value={form.special_notes}
            onChange={(e) => handleChange("special_notes", e.target.value)}
            className="w-full rounded-xl border px-3 py-3 text-sm resize-none"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          />
        </div>

        {/* Info */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Quy trình nhận báo giá</p>
              <ul className="text-xs space-y-1" style={{ color: "var(--muted)" }}>
                <li>1. Gửi yêu cầu → Nhà xe nhận thông tin</li>
                <li>2. Trong 30 phút, bạn nhận báo giá chi tiết</li>
                <li>3. Chọn nhà xe ưng ý → Đặt cọc 30%</li>
                <li>4. Ngày chuyển → Thanh toán phần còn lại</li>
              </ul>
            </div>
          </div>
        </Card>
      </form>

      {/* CTA */}
      <div className="px-4 py-4 pb-6" style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <Button
          type="submit"
          variant="gradient"
          size="xl"
          className="w-full"
          loading={loading}
          onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
          disabled={!form.description.trim()}
        >
          Gửi yêu cầu báo giá
          <Home size={20} />
        </Button>
      </div>
    </div>
  );
}

export default function DormDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <DormDetailsContent />
    </Suspense>
  );
}
