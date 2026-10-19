"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useUIStore } from "@/lib/stores";

export default function DoiMatKhauPage() {
  const { showSuccess, showError } = useUIStore();
  const [form, setForm] = useState({ current: "", new_pw: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_pw !== form.confirm) { showError("Mật khẩu không khớp"); return; }
    if (form.new_pw.length < 8) { showError("Mật khẩu tối thiểu 8 ký tự"); return; }
    setLoading(true);
    try {
      const r = await authApi.changePassword(form.current, form.new_pw);
      if (!r.success) { showError((r as { message?: string }).message || "Thất bại"); return; }
      showSuccess("Đổi mật khẩu thành công!");
      setForm({ current: "", new_pw: "", confirm: "" });
    } catch (err) { showError(err instanceof Error ? err.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/tai-khoan" className="p-2 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Đổi mật khẩu</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu hiện tại</label>
          <Input type="password" required value={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.value }))} startAdornment={<Lock size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mật khẩu mới</label>
          <Input type="password" required minLength={8} value={form.new_pw} onChange={e => setForm(p => ({ ...p, new_pw: e.target.value }))} startAdornment={<Lock size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Xác nhận mật khẩu mới</label>
          <Input type="password" required value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} startAdornment={<Lock size={15} />} />
        </div>
        <Button type="submit" size="xl" className="w-full" loading={loading}
          style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white" }}>
          Đổi mật khẩu
        </Button>
      </form>
    </div>
  );
}
