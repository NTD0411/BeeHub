"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast("Mật khẩu xác nhận không khớp", "error"); return; }
    if (form.newPassword.length < 6) { toast("Mật khẩu mới phải ít nhất 6 ký tự", "error"); return; }
    setLoading(true);
    try {
      const res = await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      if (!res.success) { toast((res as { message?: string }).message || "Đổi mật khẩu thất bại", "error"); return; }
      toast("Đổi mật khẩu thành công!", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi kết nối", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Đổi mật khẩu</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu hiện tại</label>
          <Input type={showPw ? "text" : "password"} required value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            startAdornment={<Lock size={15} />}
            endAdornment={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu mới</label>
          <Input type="password" required minLength={6} value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="Ít nhất 6 ký tự" startAdornment={<Lock size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Xác nhận mật khẩu mới</label>
          <Input type="password" required value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới" startAdornment={<Lock size={15} />} />
        </div>
        <Button type="submit" variant="gradient" size="xl" className="w-full" loading={loading}>
          Đổi mật khẩu
        </Button>
      </form>
    </div>
  );
}
