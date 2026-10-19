"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, ExternalLink, Calendar, XCircle, Upload, RefreshCw, Send } from "lucide-react";
import { providerApi } from "@/lib/api";

interface ProviderDocument {
  id: string;
  document_type: string;
  document_url: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_verified: boolean;
  notes?: string;
  created_at: string;
}

const DOC_TYPE_LABEL: Record<string, string> = {
  cccd_front:           "CCCD / Căn cước (mặt trước)",
  cccd_back:            "CCCD / Căn cước (mặt sau)",
  driver_license:       "Giấy phép lái xe",
  vehicle_registration: "Đăng ký xe",
  vehicle_photo:        "Ảnh xe",
  id_card_cccd_front:                          "CCCD / Căn cước (mặt trước)",
  id_card_cccd_back:                           "CCCD / Căn cước (mặt sau)",
  license_driver_license:                      "Giấy phép lái xe",
  vehicle_registration_vehicle_registration:   "Đăng ký xe",
  insurance_vehicle_photo:                     "Ảnh xe",
  cccd:             "CCCD / Căn cước công dân",
  id_card:          "CCCD / Căn cước công dân",
  vehicle_insurance:"Bảo hiểm xe",
  business_license: "Giấy phép kinh doanh",
};

// Map document_type → field name để upload lại
const DOC_TYPE_TO_FIELD: Record<string, string> = {
  cccd_front:           "cccd_front",
  cccd_back:            "cccd_back",
  driver_license:       "driver_license",
  vehicle_registration: "vehicle_registration",
  id_card_cccd_front:   "cccd_front",
  id_card_cccd_back:    "cccd_back",
  license_driver_license: "driver_license",
  vehicle_registration_vehicle_registration: "vehicle_registration",
  insurance_vehicle_photo: "vehicle_photo",
};

const DOC_TYPE_ORDER = [
  "cccd_front", "id_card_cccd_front",
  "cccd_back",  "id_card_cccd_back",
  "cccd", "id_card",
  "driver_license", "license_driver_license",
  "vehicle_registration", "vehicle_registration_vehicle_registration",
  "vehicle_photo", "insurance_vehicle_photo",
  "vehicle_insurance", "business_license",
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function DocCard({ doc, onReupload }: { doc: ProviderDocument; onReupload: (docType: string, file: File) => Promise<void> }) {
  const [imgError, setImgError]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(doc.document_url);
  const isRejected = !doc.is_verified && doc.notes?.toLowerCase().includes("reject");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSuccess(false);
    try {
      await onReupload(doc.document_type, file);
      setSuccess(true);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="relative bg-gray-50 h-48 flex items-center justify-center">
        {isImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.document_url}
            alt={DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
            className="h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <FileText size={40} />
            <span className="text-xs text-gray-400">Tài liệu PDF / không xem trước được</span>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
          doc.is_verified
            ? "bg-green-100 text-green-700"
            : isRejected
            ? "bg-red-100 text-red-700"
            : "bg-orange-100 text-orange-700"
        }`}>
          {doc.is_verified
            ? <><CheckCircle size={12} /> Đã xác minh</>
            : isRejected
            ? <><XCircle size={12} /> Bị từ chối</>
            : <><Clock size={12} /> Chờ xác minh</>}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-gray-900 text-sm">
          {DOC_TYPE_LABEL[doc.document_type]
            ?? doc.document_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </h3>

        {doc.document_number && (
          <p className="text-xs text-gray-500">
            Số: <span className="font-semibold text-gray-700">{doc.document_number}</span>
          </p>
        )}

        <div className="flex gap-4 text-xs text-gray-500">
          {doc.issue_date && (
            <span className="flex items-center gap-1"><Calendar size={11} />Cấp: {formatDate(doc.issue_date)}</span>
          )}
          {doc.expiry_date && (
            <span className="flex items-center gap-1"><Calendar size={11} />HH: {formatDate(doc.expiry_date)}</span>
          )}
        </div>

        <a href={doc.document_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold mt-1">
          <ExternalLink size={12} /> Xem file gốc
        </a>

        {/* Upload lại — hiện khi chưa verified */}
        {!doc.is_verified && (
          <div className="pt-2 border-t border-gray-100">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
              style={{ backgroundColor: success ? "#dcfce7" : "#EFF4FE", color: success ? "#16A34A" : "#1A56DB" }}
            >
              {uploading
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" /> Đang upload...</>
                : success
                ? <><CheckCircle size={13} /> Đã cập nhật!</>
                : <><Upload size={13} /> Upload lại</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="h-3 w-28 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [docs, setDocs]       = useState<ProviderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const loadDocs = () => {
    setLoading(true);
    providerApi.getDocuments()
      .then(r => {
        if (r.success && Array.isArray(r.data)) setDocs(r.data as ProviderDocument[]);
        else setError("Không tải được giấy tờ.");
      })
      .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  const handleReupload = async (docType: string, file: File) => {
    const fieldKey = DOC_TYPE_TO_FIELD[docType] ?? docType;
    await providerApi.uploadDocuments({ [fieldKey]: file });
    // Reset request state khi upload lại
    setRequestSuccess(false);
    setRequestError(null);
    // Reload để cập nhật ảnh mới
    setTimeout(() => loadDocs(), 800);
  };

  const handleRequestVerification = async () => {
    setRequesting(true);
    setRequestError(null);
    try {
      const res = await providerApi.requestVerification();
      if (res.success) {
        setRequestSuccess(true);
        loadDocs();
      } else {
        setRequestError((res as { message?: string }).message || "Yêu cầu thất bại");
      }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setRequesting(false);
    }
  };

  const verified   = docs.filter(d => d.is_verified).length;
  const total      = docs.length;
  const allVerified = total > 0 && verified === total;
  const hasRejected = docs.some(d => !d.is_verified && d.notes?.toLowerCase().includes("reject"));
  const isPending   = !allVerified && !hasRejected && total > 0;
  // Cho phép yêu cầu xác minh lại khi: có docs, không phải tất cả verified, chưa đang pending, chưa request thành công
  const canRequestReVerify = total > 0 && !allVerified && !isPending && !requestSuccess;

  const sorted = [...docs].sort((a, b) => {
    const ai = DOC_TYPE_ORDER.indexOf(a.document_type);
    const bi = DOC_TYPE_ORDER.indexOf(b.document_type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          style={{ border: "1px solid var(--border)" }}>
          <ArrowLeft size={18} style={{ color: "var(--muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Giấy tờ xác minh</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {loading ? "Đang tải..." : `${verified}/${total} giấy tờ đã xác minh`}
          </p>
        </div>
        {!loading && (
          <button onClick={loadDocs} className="ml-auto p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Status banner */}
      {!loading && !error && (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
          allVerified
            ? "bg-green-50 border border-green-100"
            : hasRejected
            ? "bg-red-50 border border-red-200"
            : "bg-orange-50 border border-orange-100"
        }`}>
          {allVerified
            ? <CheckCircle size={20} className="text-green-600 shrink-0" />
            : hasRejected
            ? <XCircle size={20} className="text-red-600 shrink-0" />
            : <AlertCircle size={20} className="text-orange-600 shrink-0" />}
          <div>
            <p className={`text-sm font-bold ${allVerified ? "text-green-700" : hasRejected ? "text-red-700" : "text-orange-700"}`}>
              {allVerified
                ? "Tất cả giấy tờ đã được xác minh"
                : hasRejected
                ? "Một số giấy tờ bị từ chối — hãy upload lại"
                : `Còn ${total - verified} giấy tờ đang chờ xác minh`}
            </p>
            <p className={`text-xs ${allVerified ? "text-green-600" : hasRejected ? "text-red-600" : "text-orange-600"}`}>
              {allVerified
                ? "Tài khoản của bạn đang hoạt động bình thường."
                : hasRejected
                ? "Nhấn 'Upload lại' trên từng giấy tờ bị từ chối."
                : "Admin sẽ xét duyệt trong 1-2 ngày làm việc."}
            </p>
          </div>
        </div>
      )}

      {/* Nút yêu cầu xác minh lại — hiển thị sau khi upload lại xong, khi chưa pending */}
      {!loading && !error && canRequestReVerify && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-700">Đã upload lại giấy tờ?</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Nhấn nút bên cạnh để thông báo admin xét duyệt lại hồ sơ của bạn.
            </p>
          </div>
          <button
            onClick={handleRequestVerification}
            disabled={requesting}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}
          >
            {requesting
              ? <><span className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" /> Đang gửi...</>
              : <><Send size={15} /> Yêu cầu xác minh lại</>}
          </button>
        </div>
      )}

      {/* Đã gửi yêu cầu thành công */}
      {!loading && requestSuccess && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-700">Đã gửi yêu cầu thành công!</p>
            <p className="text-xs text-blue-600">Admin sẽ xét duyệt hồ sơ của bạn trong 1-2 ngày làm việc.</p>
          </div>
        </div>
      )}

      {/* Lỗi khi gửi yêu cầu */}
      {requestError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3">
          <XCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{requestError}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-12 text-center">
          <FileText size={40} className="mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-700 mb-1">Chưa có giấy tờ nào</p>
          <p className="text-sm text-gray-400 mb-5">Bạn chưa upload giấy tờ khi đăng ký</p>
          <Link href="/dang-ky-tai-xe"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
            style={{ backgroundColor: "var(--provider)" }}>
            Upload giấy tờ ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map(doc => (
            <DocCard key={doc.id} doc={doc} onReupload={handleReupload} />
          ))}
        </div>
      )}
    </div>
  );
}
