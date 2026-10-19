"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, FileText, Camera, Shield, AlertTriangle, Clock, XCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { providerProfileApi } from "@/lib/api";
import { getStoredUser, storeUser, type ProviderUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

interface DocFile { file: File | null; preview: string | null; }

const DOC_TYPES = [
  { key: "cccd_front", label: "CCCD/CMND (mặt trước)", icon: FileText, required: true },
  { key: "cccd_back", label: "CCCD/CMND (mặt sau)", icon: FileText, required: true },
  { key: "vehicle_registration", label: "Đăng ký xe", icon: FileText, required: true },
  { key: "driver_license", label: "Bằng lái xe", icon: FileText, required: true },
  { key: "vehicle_photo", label: "Ảnh phương tiện", icon: Camera, required: false },
];

export default function DocumentsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<ProviderUser | null>(getStoredUser());
  const [profileLoading, setProfileLoading] = useState(true);
  const [docs, setDocs] = useState<Record<string, DocFile>>(
    Object.fromEntries(DOC_TYPES.map((d) => [d.key, { file: null, preview: null }]))
  );
  const [loading, setLoading] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Luôn fetch profile mới nhất từ server để có verification_status và verification_notes
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await providerProfileApi.getMe();
        if (res.success && res.data) {
          const freshUser = res.data as ProviderUser;
          setUser(freshUser);
          // Cập nhật localStorage để dashboard cũng phản ánh đúng
          const token = localStorage.getItem("provider_token");
          if (token) storeUser(freshUser, token);
        }
      } catch {
        // Fallback về localStorage nếu lỗi mạng
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setDocs((prev) => ({ ...prev, [key]: { file, preview } }));
  };

  const handleSubmit = async () => {
    const required = DOC_TYPES.filter((d) => d.required);
    const missing = required.filter((d) => !docs[d.key].file);
    if (missing.length > 0) {
      toast(`Vui lòng upload: ${missing.map((d) => d.label).join(", ")}`, "error");
      return;
    }
    setLoading(true);
    try {
      const files: Record<string, File> = {};
      Object.entries(docs).forEach(([key, val]) => { if (val.file) files[key] = val.file; });
      await providerProfileApi.uploadDocuments(files);
      toast("Upload giấy tờ thành công! Chờ admin xét duyệt.", "success");
      // Fetch lại profile để cập nhật trạng thái
      const res = await providerProfileApi.getMe();
      if (res.success && res.data) {
        const freshUser = res.data as ProviderUser;
        setUser(freshUser);
        const token = localStorage.getItem("provider_token");
        if (token) storeUser(freshUser, token);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload thất bại", "error");
    } finally { setLoading(false); }
  };

  const uploadedCount = Object.values(docs).filter((d) => d.file !== null).length;

  const verificationStatus = user?.verification_status;
  const isVerified = user?.is_verified;
  // Tài xế mới chưa upload lần nào: status = 'pending' nhưng chưa có docs
  const isRejected = verificationStatus === "rejected";
  const isPending = verificationStatus === "pending" && !isVerified;
  // Cho phép upload khi: bị reject (phải làm lại) hoặc chưa có trạng thái gì (mới đăng ký)
  const canUpload = isRejected || (!isVerified && !isPending);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Xác minh tài khoản</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {canUpload
                ? `${uploadedCount}/${DOC_TYPES.length} giấy tờ đã chọn`
                : isVerified
                  ? "Đã xác minh"
                  : "Đang chờ admin xét duyệt"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status banner */}
        {isVerified ? (
          <Card className="p-4" style={{ backgroundColor: "var(--success-tint)", borderColor: "var(--success)" + "44" }}>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} style={{ color: "var(--success)" }} />
              <div>
                <p className="font-bold" style={{ color: "var(--success)" }}>Tài khoản đã được xác minh</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--success)" }}>Bạn có thể nhận đơn hàng bình thường</p>
              </div>
            </div>
          </Card>
        ) : isRejected ? (
          <Card className="p-4" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.4)", border: "1px solid" }}>
            <div className="flex items-start gap-3">
              <XCircle size={24} style={{ color: "#ef4444", flexShrink: 0 }} />
              <div className="flex-1">
                <p className="font-bold" style={{ color: "#ef4444" }}>Hồ sơ bị từ chối</p>
                <p className="text-xs mt-0.5 mb-2" style={{ color: "#ef4444" }}>
                  Vui lòng kiểm tra lý do bên dưới và nộp lại toàn bộ giấy tờ.
                </p>
                {user?.verification_notes && (
                  <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#b91c1c" }}>
                    <span className="font-semibold">Lý do: </span>{user.verification_notes}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : isPending ? (
          <Card className="p-4" style={{ backgroundColor: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.4)", border: "1px solid" }}>
            <div className="flex items-center gap-3">
              <Clock size={24} style={{ color: "#3b82f6" }} />
              <div>
                <p className="font-bold" style={{ color: "#3b82f6" }}>Đang chờ xét duyệt</p>
                <p className="text-xs mt-0.5" style={{ color: "#3b82f6" }}>
                  Giấy tờ của bạn đã được gửi. Admin sẽ xét duyệt trong vòng 24h.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4" style={{ backgroundColor: "var(--warning-tint)", borderColor: "var(--warning)" + "44" }}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} style={{ color: "var(--warning)" }} />
              <div>
                <p className="font-bold" style={{ color: "var(--warning)" }}>Chưa xác minh</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--warning)" }}>Upload đủ giấy tờ để được duyệt trong 24h</p>
              </div>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Shield size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Tại sao cần xác minh?</p>
              <ul className="text-xs space-y-1" style={{ color: "var(--muted)" }}>
                <li>• Tăng độ tin cậy với khách hàng</li>
                <li>• Bắt buộc để nhận đơn hàng</li>
                <li>• Được ưu tiên hiển thị trong danh sách</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Đang chờ duyệt → chỉ hiển thị thông báo, không cho upload lại */}
        {isPending && !isRejected && (
          <Card className="p-6 text-center">
            <Clock size={40} className="mx-auto mb-3 opacity-30" style={{ color: "#3b82f6" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Hồ sơ đang được xem xét</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Bạn không thể chỉnh sửa trong khi admin đang xét duyệt. Vui lòng chờ kết quả.
            </p>
          </Card>
        )}

        {/* Document uploads — chỉ hiển thị khi được phép upload */}
        {canUpload && (
          <>
            {isRejected && (
              <div className="px-1">
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  Nộp lại toàn bộ giấy tờ
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Tất cả giấy tờ cũ đã bị xóa. Vui lòng upload lại đầy đủ theo yêu cầu.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {DOC_TYPES.map(({ key, label, icon: Icon, required }) => {
                const doc = docs[key];
                const isUploaded = !!doc.file;
                return (
                  <div key={key}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileRefs.current[key] = el; }}
                      onChange={(e) => handleFileChange(key, e)}
                    />
                    <button
                      onClick={() => fileRefs.current[key]?.click()}
                      className="w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left"
                      style={{
                        backgroundColor: isUploaded ? "var(--success-tint)" : "var(--card)",
                        borderColor: isUploaded ? "var(--success)" : isRejected ? "rgba(239,68,68,0.3)" : "var(--border)",
                      }}
                    >
                      {doc.preview ? (
                        <img src={doc.preview} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isUploaded ? "var(--success-tint)" : "var(--surface)" }}>
                          {isUploaded ? (
                            <CheckCircle size={24} style={{ color: "var(--success)" }} />
                          ) : (
                            <Upload size={24} style={{ color: "var(--muted)" }} />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: isUploaded ? "var(--success)" : "var(--text)" }}>
                            {label}
                          </p>
                          {required && !isUploaded && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "var(--error)" }}>
                              Bắt buộc
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {isUploaded ? "✓ Đã chọn - Nhấn để thay đổi" : "Nhấn để chọn ảnh"}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <Button variant="gradient" size="xl" className="w-full gap-2" loading={loading} onClick={handleSubmit}>
              <Upload size={20} />
              {isRejected ? "Nộp lại giấy tờ xác minh" : "Gửi giấy tờ xác minh"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
