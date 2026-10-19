"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Upload, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { disputesApi } from "@/lib/api";
import { useUIStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";

const DISPUTE_TYPES = [
  {
    value: "service_quality",
    label: "Vấn đề vận chuyển",
    desc: "Hư hỏng, thất lạc, hoặc chậm trễ hàng hóa.",
    icon: "🚚",
  },
  {
    value: "damage",
    label: "Thái độ tài xế",
    desc: "Tài xế có thái độ không phù hợp hoặc vi phạm.",
    icon: "😤",
  },
  {
    value: "app_error",
    label: "Lỗi ứng dụng",
    desc: "Không thể đặt đơn, lỗi thanh toán, lỗi GPS.",
    icon: "🐛",
  },
  {
    value: "payment",
    label: "Vấn đề thanh toán",
    desc: "Sai lệch số tiền, không áp dụng được mã giảm giá, hoàn tiền.",
    icon: "💳",
  },
  {
    value: "cancellation",
    label: "Hủy đơn không hợp lệ",
    desc: "Đơn hàng bị hủy vô lý hoặc không đúng quy định.",
    icon: "🚫",
  },
  {
    value: "other",
    label: "Vấn đề khác",
    desc: "Các sự cố không thuộc các phân loại trên.",
    icon: "❓",
  },
];

export default function BaoCaoSuCoPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();

  const [disputeType, setDisputeType] = useState("");
  const [subject, setSubject]         = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages]           = useState<File[]>([]);
  const [previews, setPreviews]       = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [submitted, setSubmitted]     = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) { setError("Tối đa 5 ảnh"); return; }
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
    setError(null);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!disputeType)                    { setError("Vui lòng chọn loại sự cố"); return; }
    if (subject.trim().length < 5)       { setError("Tiêu đề tối thiểu 5 ký tự"); return; }
    if (description.trim().length < 10)  { setError("Mô tả tối thiểu 10 ký tự"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("order_id", orderId);
      fd.append("dispute_type", disputeType);
      fd.append("subject", subject.trim());
      fd.append("description", description.trim());
      images.forEach((img) => fd.append("evidence", img));
      await disputesApi.create(fd);
      setSubmitted(true);
      showSuccess("Báo cáo sự cố đã được gửi thành công!");
      setTimeout(() => router.push(`/don-hang/${orderId}`), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gửi báo cáo thất bại";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link
            href={`/don-hang/${orderId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Quay lại
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Báo cáo sự cố</h1>
          <p className="text-sm text-gray-500">Admin sẽ xem xét và phản hồi trong vòng 24h làm việc.</p>
        </motion.div>

        {/* Notice */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 mb-10"
        >
          <span className="text-blue-500 mt-0.5 shrink-0">ℹ️</span>
          <p className="text-sm text-blue-800 leading-relaxed">
            Bạn vui lòng cung cấp thông tin chi tiết về sự cố gặp phải. Điều này giúp chúng tôi giải quyết vấn đề của bạn nhanh chóng và chính xác nhất. Mọi hành vi báo cáo sai sự thật sẽ bị xử lý theo điều khoản dịch vụ.
          </p>
        </motion.div>

        <AnimatePresence>
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">Đã gửi báo cáo!</p>
              <p className="text-sm text-gray-500">Đang chuyển hướng về đơn hàng...</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-10">

              {/* Loại sự cố */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                  LOẠI SỰ CỐ <span className="text-red-500">*</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DISPUTE_TYPES.map((t) => {
                    const selected = disputeType === t.value;
                    return (
                      <motion.button
                        key={t.value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setDisputeType(t.value); setError(null); }}
                        className="relative flex flex-col items-center text-center gap-3 rounded-xl border p-5 transition-all duration-200 hover:shadow-md"
                        style={{
                          borderColor: selected ? "#1d4ed8" : "#e5e7eb",
                          backgroundColor: selected ? "#eff6ff" : "#fff",
                          boxShadow: selected ? "0 0 0 2px #bfdbfe" : undefined,
                        }}
                      >
                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                          {t.icon}
                        </div>
                        <span className={`text-sm font-bold ${selected ? "text-blue-700" : "text-gray-800"}`}>
                          {t.label}
                        </span>
                        <p className="text-xs text-gray-400 leading-snug">{t.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>

              {/* Tiêu đề */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                    TIÊU ĐỀ <span className="text-red-500">*</span>
                  </h2>
                  <span className={`text-xs font-medium ${subject.length >= 100 ? "text-red-500" : "text-gray-400"}`}>
                    {subject.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); setError(null); }}
                  placeholder="Ví dụ: Hàng hóa bị trầy xước sau khi vận chuyển"
                  maxLength={100}
                  className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </motion.section>

              {/* Mô tả */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">
                  MÔ TẢ CHI TIẾT <span className="text-red-500">*</span>
                </h2>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(null); }}
                  placeholder="Vui lòng mô tả cụ thể sự việc diễn ra, thời gian và địa điểm..."
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed transition-shadow"
                />
              </motion.section>

              {/* Ảnh bằng chứng */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                  ẢNH BẰNG CHỨNG
                </h2>

                {previews.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {previews.map((src, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={11} className="text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {images.length < 5 && (
                  <label className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-gray-200 bg-white cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload size={22} className="text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Nhấn để tải lên hoặc kéo thả tệp tại đây</p>
                      <p className="text-xs text-gray-400 mt-0.5">Định dạng JPG, PNG (Tối đa 5MB mỗi ảnh)</p>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </motion.section>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertTriangle size={15} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <Button
                  type="submit"
                  loading={loading}
                  className="px-10 h-12 rounded-lg text-sm font-bold"
                >
                  Gửi báo cáo sự cố
                </Button>
              </div>

            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
