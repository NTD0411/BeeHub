"use client";

import { useRef, useState } from "react";
import { X, ScrollText, CheckCircle, AlertTriangle, Clock, Wallet, XCircle, ShieldCheck } from "lucide-react";

export type TermsType = "customer" | "provider";

interface TermsModalProps {
  type: TermsType;
  onAgree: () => void;
  onClose: () => void;
}

export function TermsModal({ type, onAgree, onClose }: TermsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canAgree, setCanAgree] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 48) {
      setCanAgree(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white w-full max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <ScrollText size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Điều khoản dịch vụ</p>
              <p className="text-[11px] text-gray-400">
                {type === "customer" ? "Dành cho khách hàng" : "Dành cho nhà vận chuyển"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 py-5 space-y-5 text-sm text-gray-700"
        >
          {type === "customer" ? <CustomerTermsContent /> : <ProviderTermsContent />}
          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-white space-y-3">
          {!canAgree && (
            <p className="text-[11px] text-center text-gray-400 flex items-center justify-center gap-1">
              <span>↓</span> Kéo xuống để đọc toàn bộ điều khoản trước khi đồng ý
            </p>
          )}
          <button
            disabled={!canAgree}
            onClick={onAgree}
            className="w-full h-12 rounded-2xl font-bold text-sm text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#1A56DB" }}
          >
            {canAgree ? "✓ Tôi đồng ý với điều khoản" : "Tôi đồng ý với điều khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Customer Terms Content ─────────────────────────────────── */
function CustomerTermsContent() {
  return (
    <div className="space-y-6">
      <Section icon={<Wallet size={16} />} color="#2563EB" title="1. Chính sách đặt cọc">
        <ul className="space-y-2">
          <li>Khoản đặt cọc bằng <strong>30% tổng giá trị chuyến</strong>, được giữ an toàn qua cổng thanh toán PayOS.</li>
          <li>Tiền cọc chỉ được chuyển cho nhà xe sau khi bạn xác nhận <strong>giao hàng thành công</strong>.</li>
          <li>Phần còn lại (70%) thanh toán trực tiếp cho nhà xe sau khi hoàn tất chuyến.</li>
        </ul>
      </Section>

      <Section icon={<XCircle size={16} />} color="#DC2626" title="2. Chính sách hủy đơn">
        <div className="space-y-3">
          <CancelRow
            icon="✅"
            label="Hủy trước khi chọn nhà xe"
            desc="Trạng thái: Chờ báo giá"
            result="Hoàn 100% — Miễn phí"
            resultColor="#16A34A"
          />
          <CancelRow
            icon="✅"
            label="Hủy sau khi chọn nhà xe, chưa đặt cọc"
            desc="Trạng thái: Đã chọn nhà xe"
            result="Hoàn 100% — Miễn phí"
            resultColor="#16A34A"
          />
          <CancelRow
            icon="⚠️"
            label="Hủy sau khi đã đặt cọc"
            desc="Trạng thái: Đặt cọc thành công"
            result="Hoàn tiền theo chính sách phí hủy (xem chi tiết lúc hủy)"
            resultColor="#D97706"
          />
          <CancelRow
            icon="🚚"
            label="Nhà xe đang trên đường đến lấy hàng"
            desc="Trạng thái: Đang đến lấy / Đang vận chuyển"
            result="Không thể hủy đơn"
            resultColor="#DC2626"
          />
        </div>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
          <strong>Lưu ý:</strong> Yêu cầu hoàn tiền được admin xét duyệt trong <strong>1–3 ngày làm việc</strong>. Phí hủy cụ thể sẽ hiển thị rõ khi bạn xác nhận hủy đơn.
        </div>
      </Section>

      <Section icon={<AlertTriangle size={16} />} color="#D97706" title="3. Trách nhiệm của khách hàng">
        <ul className="space-y-2">
          <li>Cung cấp thông tin địa chỉ, hàng hóa <strong>chính xác và trung thực</strong>.</li>
          <li>Chuẩn bị hàng hóa sẵn sàng trước khi nhà xe đến lấy.</li>
          <li>Có mặt tại điểm giao để xác nhận nhận hàng.</li>
          <li>Không vận chuyển hàng hóa <strong>nguy hiểm, cấm theo pháp luật</strong> (vũ khí, chất nổ, ma túy…).</li>
          <li>Khai báo đúng giá trị hàng hóa để tính bảo hiểm phù hợp.</li>
        </ul>
      </Section>

      <Section icon={<ShieldCheck size={16} />} color="#16A34A" title="4. Cam kết từ UniMove">
        <ul className="space-y-2">
          <li>Tất cả nhà xe đều được <strong>xác minh giấy tờ và lý lịch</strong> trước khi hoạt động.</li>
          <li>Khoản đặt cọc được bảo vệ an toàn — không bao giờ bị giữ lại nếu hủy đúng chính sách.</li>
          <li>Hỗ trợ giải quyết tranh chấp trong vòng <strong>24 giờ</strong> kể từ khi nhận khiếu nại.</li>
        </ul>
      </Section>

      <Section icon={<Clock size={16} />} color="#7C3AED" title="5. Điều khoản chung">
        <ul className="space-y-2">
          <li>UniMove là nền tảng kết nối và không chịu trách nhiệm về thiệt hại do thiên tai, tai nạn bất khả kháng.</li>
          <li>Chính sách có thể thay đổi — phiên bản mới sẽ thông báo qua email/thông báo trong app.</li>
          <li>Sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận toàn bộ điều khoản này.</li>
        </ul>
      </Section>
    </div>
  );
}

/* ─── Provider Terms Content ─────────────────────────────────── */
function ProviderTermsContent() {
  return (
    <div className="space-y-6">
      <Section icon={<CheckCircle size={16} />} color="#16A34A" title="1. Cam kết chất lượng dịch vụ">
        <ul className="space-y-2">
          <li>Đến đúng địa điểm và thời gian đã thỏa thuận với khách hàng.</li>
          <li>Xử lý hàng hóa cẩn thận, tránh va đập và hư hỏng trong quá trình vận chuyển.</li>
          <li>Giao tiếp lịch sự, chuyên nghiệp với khách hàng.</li>
          <li>Chụp ảnh bằng chứng giao hàng khi hoàn tất chuyến.</li>
        </ul>
      </Section>

      <Section icon={<XCircle size={16} />} color="#DC2626" title="2. Chính sách hủy đơn — Hình phạt">
        <div className="space-y-3">
          <CancelRow
            icon="⚠️"
            label="Hủy đơn đã nhận"
            desc="Bất kỳ lý do nào sau khi xác nhận đơn"
            result="Trừ 2 điểm tuân thủ"
            resultColor="#DC2626"
          />
          <CancelRow
            icon="🔴"
            label="Hủy đơn nhiều lần (≥3 lần)"
            desc="Trong vòng 30 ngày"
            result="Tạm khóa tài khoản để xem xét"
            resultColor="#DC2626"
          />
          <CancelRow
            icon="✅"
            label="Khách hàng hủy đơn"
            desc="Không phải lỗi của nhà xe"
            result="Không bị trừ điểm"
            resultColor="#16A34A"
          />
        </div>
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 leading-relaxed">
          <strong>Quan trọng:</strong> Điểm tuân thủ xuống dưới <strong>70/100</strong> sẽ hạn chế khả năng nhận đơn mới. Dưới <strong>50/100</strong> — tài khoản bị tạm đình chỉ.
        </div>
      </Section>

      <Section icon={<Wallet size={16} />} color="#2563EB" title="3. Thanh toán và hoa hồng">
        <ul className="space-y-2">
          <li>Tiền đặt cọc (30%) do nền tảng giữ — được chuyển cho nhà xe sau khi khách xác nhận hoàn tất.</li>
          <li>Phần còn lại (70%) do khách thanh toán trực tiếp khi giao hàng.</li>
          <li>UniMove thu <strong>phí nền tảng</strong> theo hợp đồng riêng (không trừ từ tiền chuyến).</li>
        </ul>
      </Section>

      <Section icon={<AlertTriangle size={16} />} color="#D97706" title="4. Trách nhiệm pháp lý">
        <ul className="space-y-2">
          <li>Nhà xe tự chịu trách nhiệm về phương tiện, bằng lái, và bảo hiểm xe.</li>
          <li>Không vận chuyển hàng hóa nguy hiểm, vi phạm pháp luật.</li>
          <li>Chịu trách nhiệm bồi thường khi hàng hóa bị hư hỏng do lỗi của nhà xe.</li>
          <li>Cung cấp thông tin giấy tờ trung thực — giả mạo sẽ bị xóa tài khoản vĩnh viễn.</li>
        </ul>
      </Section>

      <Section icon={<Clock size={16} />} color="#7C3AED" title="5. Điều khoản chung">
        <ul className="space-y-2">
          <li>UniMove có quyền từ chối hoặc xóa tài khoản nếu vi phạm điều khoản.</li>
          <li>Chính sách có thể cập nhật — thông báo trước ít nhất 7 ngày qua email.</li>
          <li>Đăng ký tài khoản nhà xe đồng nghĩa chấp nhận toàn bộ điều khoản này.</li>
        </ul>
      </Section>
    </div>
  );
}

/* ─── Shared sub-components ─────────────────────────────────── */
function Section({
  icon, color, title, children,
}: { icon: React.ReactNode; color: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + "15", color }}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="pl-9 space-y-2 text-gray-600 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function CancelRow({
  icon, label, desc, result, resultColor,
}: { icon: string; label: string; desc: string; result: string; resultColor: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-xs">{label}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
          <p className="text-xs font-bold mt-1" style={{ color: resultColor }}>{result}</p>
        </div>
      </div>
    </div>
  );
}
