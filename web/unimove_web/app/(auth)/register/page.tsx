"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Phone, Building2, Eye, EyeOff, AlertCircle, ChevronLeft, CheckCircle, Truck } from "lucide-react";
import { authApi } from "@/lib/api";
import { storeAuth, getRoleHome, type AuthUser, type UserRole } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { handleGoogleAuthResponse } from "@/lib/handle-google-auth";

type Step = "role" | "form";

const VEHICLES = [
  ["motorbike", "Xe máy (≤ 100kg)"],
  ["pickup", "Bán tải"],
  ["van", "Xe van 5 tạ – 1 tấn"],
  ["truck_1t", "Xe tải 1 tấn"],
  ["truck_2t", "Xe tải 2 tấn"],
  ["truck_5t", "Xe tải 5 tấn+"],
];

function UniMoveLogo() {
  return (
    <div className="flex items-center gap-0.5 text-4xl font-extrabold leading-none tracking-tight">
      <span className="bg-[#FFCC00] text-white rounded-xl px-2.5 py-1">Uni</span>
      <span style={{ color: "#2563EB" }}>Move</span>
    </div>
  );
}

export default function RegisterPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("customer");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    business_name: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError("Mật khẩu tối thiểu 8 ký tự"); return; }
    if (role === "customer" && !form.phone.trim()) { setError("Vui lòng nhập số điện thoại"); return; }
    if (role === "provider" && !form.business_name.trim()) { setError("Vui lòng nhập tên doanh nghiệp"); return; }
    setLoading(true); setError(null);
    try {
      const body: Record<string, unknown> = {
        full_name: form.full_name, email: form.email, password: form.password, role,
        phone: form.phone || undefined,
      };
      if (role === "provider") {
        body.business_name = form.business_name || undefined;
      }
      const res = await authApi.register(body);
      if (!res.success || !res.data) { setError((res as { message?: string }).message || "Đăng ký thất bại"); return; }
      const { accessToken, user } = res.data as { accessToken: string; user: AuthUser };
      storeAuth(user, accessToken);
      toast("Đăng ký thành công! Chào mừng đến với UniMove", "success");
      window.location.href = user.role === "provider" ? "/dang-ky-tai-xe" : getRoleHome(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally { setLoading(false); }
  };

  const handleGoogle = async (idToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const redirect = await handleGoogleAuthResponse(idToken, setError);
      if (redirect) {
        toast("Đăng ký Google thành công!", "success");
        window.location.href = redirect;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký Google thất bại");
    } finally { setLoading(false); }
  };

  const isProvider = role === "provider";

  /* ─── STEP 1: Chọn role ─── */
  if (step === "role") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8 gap-2.5 no-underline">
          <UniMoveLogo />
          <p className="text-sm text-gray-500 font-medium">Chuyển trọ thông minh cho sinh viên</p>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mb-6">Bạn muốn dùng UniMove với tư cách nào?</p>

          <div className="space-y-3">
            {/* Customer */}
            <button
              onClick={() => { setRole("customer"); setStep("form"); }}
              className="w-full p-5 rounded-2xl text-left border-2 border-[#2563EB] bg-white hover:bg-blue-50 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(37,99,235,0.12)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 bg-[#2563EB]">
                  <User size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900">Khách hàng</p>
                  <p className="text-sm text-gray-500 mt-0.5">Đặt dịch vụ chuyển trọ, khuân vác</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {["Chuyển trọ", "Khuân vác", "Chợ SV"].map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-[#2563EB]">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
              </div>
            </button>

            {/* Provider */}
            <button
              onClick={() => { setRole("provider"); setStep("form"); }}
              className="w-full p-5 rounded-2xl text-left border-2 border-[#FFCC00] bg-white hover:bg-[#FFFBEB] active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(255,204,0,0.15)]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "#E6A800" }}>
                  <Truck size={22} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900">Nhà vận chuyển</p>
                  <p className="text-sm text-gray-500 mt-0.5">Nhận đơn hàng, thu nhập linh hoạt</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {["Nhận đơn", "Thu nhập", "Linh hoạt"].map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#FFFBEB] text-[#E6A800]">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <p className="mt-7 text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  /* ─── STEP 2: Điền form ─── */
  const accentColor = isProvider ? "#E6A800" : "#2563EB";
  const accentBg = isProvider ? "bg-[#FFFBEB]" : "bg-blue-50";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setStep("role")}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              {isProvider ? "Đăng ký đối tác" : "Tạo tài khoản"}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: isProvider ? "#FFFBEB" : "#EFF6FF", color: accentColor }}>
                {isProvider ? "Nhà vận chuyển" : "Khách hàng"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-[0_8px_40px_rgba(37,99,235,0.10)] border border-gray-100">
        {error && (
          <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Họ và tên" required>
            <InputRow icon={<User size={16} />} accentColor={accentColor}>
              <input required placeholder="Nguyễn Văn A" value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)} />
            </InputRow>
          </Field>

          {isProvider && (
            <Field label="Tên doanh nghiệp / Biệt danh" required>
              <InputRow icon={<Building2 size={16} />} accentColor={accentColor}>
                <input required placeholder="Nhà xe Văn A" value={form.business_name}
                  onChange={(e) => set("business_name", e.target.value)} />
              </InputRow>
            </Field>
          )}

          <Field label="Email" required>
            <InputRow icon={<Mail size={16} />} accentColor={accentColor}>
              <input type="email" required placeholder="email@example.com" value={form.email}
                onChange={(e) => set("email", e.target.value)} />
            </InputRow>
          </Field>

          {/* SĐT chỉ thu thập ở bước đăng ký customer, provider sẽ xác minh SĐT qua OTP ở bước onboarding tiếp theo */}
          {role === "customer" && (
            <Field label="Số điện thoại" required>
              <InputRow icon={<Phone size={16} />} accentColor={accentColor}>
                <input type="tel" placeholder="0901234567" value={form.phone}
                  onChange={(e) => set("phone", e.target.value)} />
              </InputRow>
            </Field>
          )}

          {isProvider && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D]">
              <Phone size={15} className="shrink-0 mt-0.5 text-[#E6A800]" />
              <p className="text-xs text-[#92400E] leading-relaxed">
                Số điện thoại sẽ được xác minh bằng mã OTP ở bước tiếp theo sau khi đăng ký.
              </p>
            </div>
          )}

          <Field label="Mật khẩu" required>
            <InputRow icon={<Lock size={16} />} accentColor={accentColor} trailing={
              <button type="button" onClick={() => setShowPw(!showPw)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }>
              <input type={showPw ? "text" : "password"} required minLength={8}
                placeholder="Tối thiểu 8 ký tự" value={form.password}
                onChange={(e) => set("password", e.target.value)} />
            </InputRow>
          </Field>

          <button
            type="submit"
            disabled={loading}
            style={{ height: "52px", backgroundColor: isProvider ? "#FFCC00" : "#2563EB" }}
            className="w-full flex items-center justify-center gap-2 font-bold text-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 rounded-full mt-1"
          >
            <span className={isProvider ? "text-gray-900" : "text-white"}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full border-2 animate-spin inline-block ${isProvider ? "border-gray-900/30 border-t-gray-900" : "border-white/30 border-t-white"}`} />
                  Đang đăng ký...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} />
                  {isProvider ? "Đăng ký đối tác" : "Tạo tài khoản"}
                </span>
              )}
            </span>
          </button>
        </form>

        {!isProvider && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">hoặc đăng ký bằng Google</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <GoogleSignInButton
              onCredential={handleGoogle}
              disabled={loading}
              label="Đăng ký với Google"
            />
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold hover:underline" style={{ color: accentColor }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputRow({
  icon, trailing, children, accentColor,
}: {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
  accentColor: string;
}) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3.5 pointer-events-none text-gray-400">{icon}</span>
      {React.cloneElement(children, {
        className: "w-full h-12 pl-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors",
        style: {
          paddingRight: trailing ? "44px" : "16px",
          "--tw-ring-color": accentColor,
        } as React.CSSProperties,
      })}
      {trailing && <span className="absolute right-3">{trailing}</span>}
    </div>
  );
}