"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CheckCircle, AlertTriangle, RefreshCw, FileText,
  Truck, Star, ArrowRight, ArrowLeft, XCircle, Upload,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { getStoredUser, isAuthenticated, storeAuth, type AuthUser } from "@/lib/auth";

const BRAND   = "#1A56DB";
const SUCCESS = "#16A34A";
const DANGER  = "#DC2626";

type PageState = "pending" | "approved" | "rejected";

export default function ChoDuyetPage() {
  const router   = useRouter();
  const [user,       setUser]       = useState<AuthUser | null>(null);
  const [state,      setState]      = useState<PageState>("pending");
  const [checking,   setChecking]   = useState(false);
  const [message,    setMessage]    = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const u = getStoredUser();
    setUser(u);
    if (u?.is_verified) { setState("approved"); return; }
    if ((u as AuthUser & { verification_status?: string })?.verification_status === "rejected") {
      setState("rejected");
    }

    authApi.getMe().then(r => {
      if (r.success && r.data) {
        const fresh = r.data as AuthUser & { verification_status?: string; verification_notes?: string };
        const token = localStorage.getItem("unimove_token") ?? "";
        storeAuth({ ...u!, ...fresh }, token);
        setUser(fresh);
        if (fresh.is_verified) { setState("approved"); return; }
        if (fresh.verification_status === "rejected") {
          setState("rejected");
          setRejectNote(fresh.verification_notes ?? null);
        }
      }
    }).catch(() => {});
  }, [router]);

  const checkStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        const fresh = res.data as AuthUser & { verification_status?: string; verification_notes?: string };
        const token = localStorage.getItem("unimove_token") ?? "";
        storeAuth({ ...user!, ...fresh }, token);
        setUser(fresh);
        if (fresh.is_verified) { setState("approved"); return; }
        if (fresh.verification_status === "rejected") {
          setState("rejected");
          setRejectNote(fresh.verification_notes ?? null);
          return;
        }
      }
      setMessage("Tài khoản chưa được phê duyệt. Vui lòng thử lại sau ít giờ.");
    } catch {
      setMessage("Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.");
    } finally {
      setChecking(false);
    }
  };

  /* ── APPROVED ── */
  if (state === "approved") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative px-8 pt-10 pb-8 text-center"
              style={{ background: "linear-gradient(135deg, #1648C0, #1A56DB)" }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full opacity-40"
                  style={{
                    backgroundColor: ["#FFCC00","#FFF","#86efac","#fde68a"][i % 4],
                    top: `${10 + (i * 17) % 60}%`,
                    left: `${5 + (i * 23) % 90}%`,
                  }} />
              ))}
              <div className="relative w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle size={32} style={{ color: SUCCESS }} />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Chúc mừng!</h1>
              <p className="text-blue-100 text-sm font-medium">Hồ sơ của bạn đã được phê duyệt</p>
            </div>

            <div className="px-8 py-7">
              <div className="flex items-center gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: "#EFF4FE" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: BRAND }}>
                  <Truck size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Tài khoản đối tác</p>
                  <p className="text-sm font-bold text-gray-900">{user?.business_name ?? user?.full_name}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#dcfce7", color: SUCCESS }}>
                  <Star size={11} fill={SUCCESS} /> Đã xác minh
                </div>
              </div>

              <div className="space-y-2.5 mb-7">
                {["Hồ sơ đã nhận", "Giấy tờ đã xác minh", "Tài khoản được kích hoạt"].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: SUCCESS }}>
                      <CheckCircle size={13} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: SUCCESS }}>{label}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                Bạn có thể bắt đầu nhận đơn hàng ngay bây giờ.<br />
                Chúc bạn kinh doanh thuận lợi! 🚛
              </p>

              <button onClick={() => router.replace("/tai-xe/tong-quan")}
                className="w-full rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                style={{ height: 52, backgroundColor: BRAND, boxShadow: "0 8px 24px rgba(26,86,219,0.35)" }}>
                Vào Dashboard <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── REJECTED ── */
  if (state === "rejected") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Red header */}
            <div className="px-8 pt-10 pb-8 text-center"
              style={{ background: "linear-gradient(135deg, #B91C1C, #DC2626)" }}>
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-white/20">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <XCircle size={32} style={{ color: DANGER }} />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Hồ sơ bị từ chối</h1>
              <p className="text-red-100 text-sm">Vui lòng cập nhật lại giấy tờ theo yêu cầu</p>
            </div>

            <div className="px-8 py-7 space-y-5">
              {/* Lý do từ chối */}
              {rejectNote && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1.5">Lý do từ chối</p>
                  <p className="text-sm text-red-700 leading-relaxed">{rejectNote}</p>
                </div>
              )}

              {/* Hướng dẫn */}
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 space-y-2">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Cần làm gì?</p>
                {[
                  "Chụp lại giấy tờ rõ nét, đủ ánh sáng",
                  "Đảm bảo không bị che khuất hoặc mờ",
                  "Upload lại và chờ admin xét duyệt lần hai",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-200 text-orange-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-orange-700">{tip}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <button
                onClick={() => router.push("/dang-ky-tai-xe")}
                className="w-full h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ backgroundColor: BRAND }}
              >
                <Upload size={16} /> Upload lại giấy tờ
              </button>
              <button
                onClick={checkStatus}
                disabled={checking}
                className="w-full h-11 rounded-full font-semibold text-gray-600 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {checking
                  ? <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                  : <><RefreshCw size={14} /> Kiểm tra lại trạng thái</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PENDING ── */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #fef9c3, #fef08a)" }}>
            <Clock size={40} className="text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang chờ phê duyệt</h1>
          <p className="text-sm text-gray-500 mb-7 leading-relaxed">
            Hồ sơ của bạn đang được admin xét duyệt.<br />
            Quá trình thường mất <strong>24 – 48 giờ</strong>.
          </p>

          <div className="text-left space-y-3 mb-7 px-2">
            {[
              { label: "Hồ sơ đã nhận",                   done: true,  active: false },
              { label: "Đang xét duyệt giấy tờ",           done: false, active: true  },
              { label: "Phê duyệt & kích hoạt tài khoản",  done: false, active: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  item.done ? "bg-[#16A34A]" : item.active ? "bg-yellow-100" : "bg-gray-100"
                }`}>
                  {item.done ? <CheckCircle size={14} className="text-white" />
                    : item.active ? <Clock size={13} className="text-yellow-500" />
                    : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
                <span className={`text-sm ${
                  item.done ? "font-semibold text-[#16A34A]" : item.active ? "font-semibold text-yellow-600" : "text-gray-400"
                }`}>{item.label}</span>
              </div>
            ))}
          </div>

          {message && (
            <div className="flex items-start gap-2.5 mb-4 px-4 py-3 rounded-2xl bg-yellow-50 border border-yellow-200 text-left">
              <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">{message}</p>
            </div>
          )}

          <div className="space-y-3">
            <button onClick={checkStatus} disabled={checking}
              className="w-full h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: BRAND }}>
              {checking
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <><RefreshCw size={16} /> Kiểm tra trạng thái</>}
            </button>
            <button onClick={() => router.push("/dang-ky-tai-xe")}
              className="w-full h-12 rounded-full font-semibold text-gray-600 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 transition-colors">
              <FileText size={16} /> Xem / cập nhật giấy tờ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* ← TRANG CHỦ */}
        <button
          onClick={() => router.push("/tai-xe/tong-quan")}
          className="flex items-center gap-2.5 group"
        >
          <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
            <ArrowLeft size={16} className="text-[#3D4A6B]" />
          </span>
          <span className="text-[13px] font-bold tracking-widest uppercase text-[#3D4A6B] group-hover:text-[#1A56DB] transition-colors">
            Trang chủ
          </span>
        </button>

        {/* Logo giữa */}
        <div className="flex items-center gap-0.5 text-[15px] font-extrabold leading-none">
          <span className="bg-[#FFCC00] text-white rounded-lg px-2 py-0.5">Uni</span>
          <span style={{ color: "#2563EB" }}>Move</span>
        </div>

        {/* Badge phải */}
        <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: "#1A56DB" }}>
          Đăng ký tài xế
        </span>
      </div>
    </header>
  );
}
