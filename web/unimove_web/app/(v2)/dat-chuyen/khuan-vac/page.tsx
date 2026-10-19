"use client";

import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";

export default function KhuanVacPage() {
  return (
    <BookingShell title="Dịch vụ khuân vác" subtitle="Thêm bốc xếp vào đơn chuyển nhà đang chạy hoặc đặt khuân vác độc lập." backHref="/trang-chu">
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5">
          <Users className="mb-3 text-green-600" size={32} />
          <h2 className="text-base font-bold text-gray-900">Khuân vác kèm đơn đã đặt</h2>
          <p className="mt-1 text-sm text-gray-600">Chọn đơn đang active, cấu hình số người và giờ làm việc. Báo giá từ nhà xe đã nhận đơn.</p>
          <Link
            href="/dat-chuyen/khuan-vac/don-hang"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0047FF] px-5 py-2.5 text-sm font-bold text-white no-underline"
          >
            Chọn đơn hàng <ChevronRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="text-base font-bold text-gray-900">Khuân vác độc lập</h2>
          <p className="mt-1 text-sm text-gray-600">Chỉ cần hỗ trợ bốc xếp tại một địa điểm — không kèm vận chuyển.</p>
          <Link
            href="/dat-chuyen/dia-diem?laborOnly=1"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0047FF] no-underline"
          >
            Đặt khuân vác độc lập <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </BookingShell>
  );
}
