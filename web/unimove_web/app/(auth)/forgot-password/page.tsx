"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) { setError((res as { message?: string }).message || "Gửi thất bại"); return; }
      setStep("reset");
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  const resetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Mật khẩu tối thiểu 8 ký tự"); return; }
    setLoading(true); setError(null);
    try {
      const res = await authApi.resetPassword(email, token, newPassword);
      if (!res.success) { setError((res as { message?: string }).message || "Thất bại"); return; }
      setStep("done");
    } catch (err) { setError(err instanceof Error ? err.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="rounded-3xl border p-7 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          {step === "done" ? (
            <div className="text-center py-6">
              <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Thành công!</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Mật khẩu đã được đặt lại thành công.</p>
              <Link href="/login"><Button variant="gradient-c" size="xl" className="w-full">Đăng nhập ngay</Button></Link>
            </div>
          ) : step === "email" ? (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Quên mật khẩu</h2>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Nhập email để nhận mã OTP đặt lại mật khẩu.</p>
              {error && (
                <div className="flex items-center gap-2 mb-4 px-3 py-3 rounded-xl" style={{ backgroundColor: "var(--error-tint)", color: "var(--error)" }}>
                  <AlertCircle size={15} /> <span className="text-sm">{error}</span>
                </div>
              )}
              <form onSubmit={sendOtp} className="space-y-4">
                <Input type="email" required placeholder="email@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} startAdornment={<Mail size={15} />} />
                <Button type="submit" variant="gradient-c" size="xl" className="w-full" loading={loading}>
                  Gửi mã OTP
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Đặt lại mật khẩu</h2>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                OTP đã gửi đến <strong>{email}</strong>. Kiểm tra hộp thư email.
              </p>
              {error && (
                <div className="flex items-center gap-2 mb-4 px-3 py-3 rounded-xl" style={{ backgroundColor: "var(--error-tint)", color: "var(--error)" }}>
                  <AlertCircle size={15} /> <span className="text-sm">{error}</span>
                </div>
              )}
              <form onSubmit={resetPw} className="space-y-4">
                <Input required placeholder="Nhập mã OTP từ email" value={token}
                  onChange={(e) => setToken(e.target.value)} />
                <Input type="password" required minLength={8} placeholder="Mật khẩu mới (≥ 8 ký tự)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} startAdornment={<Lock size={15} />} />
                <Button type="submit" variant="gradient-c" size="xl" className="w-full" loading={loading}>
                  Đặt lại mật khẩu
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
