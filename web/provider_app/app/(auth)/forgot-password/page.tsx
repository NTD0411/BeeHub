"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { providerAuthApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState(""); const [token, setToken] = useState(""); const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await providerAuthApi.forgotPassword(email);
      if (!res.success) { setError((res as { message?: string }).message || "Gửi thất bại"); return; }
      setStep("reset");
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi kết nối"); } finally { setLoading(false); }
  };

  const resetPw = async (e: React.FormEvent) => {
    e.preventDefault(); if (pw.length < 6) { setError("Mật khẩu tối thiểu 6 ký tự"); return; }
    setLoading(true); setError(null);
    try {
      const res = await providerAuthApi.resetPassword({ token, newPassword: pw });
      if (!res.success) { setError((res as { message?: string }).message || "Thất bại"); return; }
      setStep("done");
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi kết nối"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <div className="rounded-3xl border p-8 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          {step === "done" ? (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Thành công!</h2>
              <Link href="/login"><button className="w-full h-12 rounded-xl text-white font-bold" style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>Đăng nhập ngay</button></Link>
            </div>
          ) : step === "email" ? (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Quên mật khẩu</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Nhập email để nhận OTP.</p>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <form onSubmit={sendOtp} className="space-y-4">
                <Input type="email" required placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} startAdornment={<Mail size={15} />} />
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-bold" style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                  {loading ? "Đang gửi..." : "Gửi OTP"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>Đặt lại mật khẩu</h2>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <form onSubmit={resetPw} className="space-y-4">
                <Input required placeholder="Mã OTP" value={token} onChange={(e) => setToken(e.target.value)} />
                <Input type="password" required placeholder="Mật khẩu mới (≥6 ký tự)" value={pw} onChange={(e) => setPw(e.target.value)} startAdornment={<Lock size={15} />} />
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-white font-bold" style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
                  {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
