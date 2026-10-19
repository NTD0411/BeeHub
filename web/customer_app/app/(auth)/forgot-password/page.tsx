"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

type Step = "email" | "reset" | "done";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await authApi.forgotPassword(email);
      if (!res.success) { setError((res as { message?: string }).message || "Gửi thất bại"); return; }
      toast("OTP đã được gửi đến email của bạn", "success");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Mật khẩu phải ít nhất 6 ký tự"); return; }
    setLoading(true); setError(null);
    try {
      const res = await authApi.resetPassword({ token, newPassword });
      if (!res.success) { setError((res as { message?: string }).message || "Đặt lại thất bại"); return; }
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="rounded-3xl border p-8 shadow-xl" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
          {step === "done" ? (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Đặt lại mật khẩu thành công!</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Bạn có thể đăng nhập bằng mật khẩu mới.</p>
              <Link href="/login"><Button variant="gradient" size="lg" className="w-full">Đăng nhập ngay</Button></Link>
            </div>
          ) : step === "email" ? (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Quên mật khẩu</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Nhập email của bạn để nhận OTP đặt lại mật khẩu.</p>
              {error && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Email</label>
                  <Input type="email" required placeholder="email@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} startAdornment={<Mail size={15} />} />
                </div>
                <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
                  Gửi mã OTP
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Đặt lại mật khẩu</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Nhập mã OTP đã gửi đến <strong>{email}</strong> và mật khẩu mới.</p>
              {error && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mã OTP</label>
                  <Input required placeholder="Nhập mã OTP từ email" value={token}
                    onChange={(e) => setToken(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu mới</label>
                  <Input type="password" required placeholder="Ít nhất 6 ký tự" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} startAdornment={<Lock size={15} />} />
                </div>
                <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
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
