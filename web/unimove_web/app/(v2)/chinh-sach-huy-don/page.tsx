"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const POLICY_ROWS = [
  {
    status: "Chờ xác nhận",
    description: "Đơn chưa có nhà xe nào nhận",
    time: "Bất kỳ lúc nào",
    fee: "0%",
    refund: "100%",
    color: "#16A34A",
    icon: CheckCircle,
  },
  {
    status: "Đã khớp báo giá",
    description: "Đã chọn báo giá, chưa đặt cọc",
    time: "Bất kỳ lúc nào",
    fee: "0%",
    refund: "100%",
    color: "#16A34A",
    icon: CheckCircle,
  },
  {
    status: "Đã chấp nhận",
    description: "Đã đặt cọc, trong vòng 30 phút",
    time: "< 30 phút sau khi cọc",
    fee: "10%",
    refund: "90%",
    color: "#D97706",
    icon: Clock,
  },
  {
    status: "Đã chấp nhận",
    description: "Đã đặt cọc, sau 30 phút",
    time: "> 30 phút sau khi cọc",
    fee: "30%",
    refund: "70%",
    color: "#EA580C",
    icon: AlertTriangle,
  },
  {
    status: "Đang đến đón / Đang vận chuyển",
    description: "Nhà xe đang trên đường",
    time: "—",
    fee: "—",
    refund: "Không thể hủy",
    color: "#DC2626",
    icon: XCircle,
    blocked: true,
  },
];

export default function ChinhSachHuyDonPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto px-4 pb-16 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-gray-200 bg-white">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chính sách hủy đơn</h1>
          <p className="text-sm text-gray-500">Cập nhật 06/2026</p>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3">
        <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 leading-relaxed">
          UniMove cho phép hủy đơn linh hoạt tùy trạng thái đơn hàng. Phí hủy được tính trên số tiền đặt cọc thực tế bạn đã thanh toán. Nếu chưa thanh toán cọc, bạn hoàn toàn không mất phí.
        </p>
      </div>

      {/* Policy table */}
      <div className="space-y-3 mb-8">
        {POLICY_ROWS.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border bg-white overflow-hidden"
              style={{ borderColor: row.blocked ? "#FEE2E2" : "#F3F4F6" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ backgroundColor: row.color + "14" }}
              >
                <Icon size={15} style={{ color: row.color }} />
                <span className="text-sm font-semibold" style={{ color: row.color }}>
                  {row.status}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2">
                <p className="text-sm text-gray-600">{row.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
                  <div className="rounded-xl bg-gray-50 py-2 px-1">
                    <p className="text-gray-400 mb-0.5">Thời điểm</p>
                    <p className="font-semibold text-gray-700">{row.time}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 py-2 px-1">
                    <p className="text-gray-400 mb-0.5">Phí hủy</p>
                    <p className="font-semibold" style={{ color: row.blocked ? "#DC2626" : row.fee === "0%" ? "#16A34A" : "#EA580C" }}>
                      {row.fee}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 py-2 px-1">
                    <p className="text-gray-400 mb-0.5">Hoàn lại</p>
                    <p className="font-semibold" style={{ color: row.blocked ? "#DC2626" : "#16A34A" }}>
                      {row.refund}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refund process */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Quy trình hoàn tiền</h2>
        <ol className="space-y-3">
          {[
            "Bạn xác nhận hủy đơn và chọn lý do",
            "Hệ thống tự động tạo yêu cầu hoàn tiền",
            "Admin xét duyệt trong vòng 1–3 ngày làm việc",
            "Tiền được hoàn vào ví UniMove của bạn",
            "Bạn có thể rút ví về tài khoản ngân hàng bất kỳ lúc nào",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Note */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <h2 className="font-bold text-amber-800 mb-2 text-sm">Lưu ý quan trọng</h2>
        <ul className="space-y-1.5 text-sm text-amber-700 list-disc list-inside leading-relaxed">
          <li>Phí hủy chỉ tính trên số tiền <strong>đặt cọc đã thanh toán</strong>, không tính trên tổng giá trị đơn.</li>
          <li>Nếu nhà xe hủy đơn sau khi đã nhận, bạn được <strong>hoàn 100%</strong> tiền cọc và nhà xe sẽ bị trừ điểm đánh giá.</li>
          <li>Đơn đang vận chuyển (<strong>đang đến đón</strong> hoặc <strong>đang vận chuyển</strong>) không thể hủy — vui lòng liên hệ hỗ trợ.</li>
        </ul>
      </div>
    </div>
  );
}
