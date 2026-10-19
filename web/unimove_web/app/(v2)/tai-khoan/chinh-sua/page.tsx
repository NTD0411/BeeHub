"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Phone, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { customerApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { useUIStore } from "@/lib/stores";

export default function ChinhSuaHoSoPage() {
  const { showSuccess, showError } = useUIStore();
  const [form, setForm] = useState({ full_name: "", phone: "", student_id: "" });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const r = await customerApi.uploadAvatar(file);
      const url = (r.data as { avatar_url?: string })?.avatar_url;
      const u = getStoredUser();
      if (u && url) localStorage.setItem("unimove_user", JSON.stringify({ ...u, avatar_url: url }));
      showSuccess("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => {
    const u = getStoredUser();
    if (u) setForm({ full_name: u.full_name, phone: u.phone ?? "", student_id: u.student_id ?? "" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await customerApi.updateMe({ full_name: form.full_name, phone: form.phone || undefined, student_id: form.student_id || undefined });
      if (!r.success) { showError((r as { message?: string }).message || "Thất bại"); return; }
      const u = getStoredUser();
      if (u) localStorage.setItem("unimove_user", JSON.stringify({ ...u, ...form }));
      showSuccess("Cập nhật thành công!");
    } catch (err) { showError(err instanceof Error ? err.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/tai-khoan" className="p-2 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Chỉnh sửa hồ sơ</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Ảnh đại diện</label>
          <label className="mt-2 block w-full py-3 text-center rounded-xl border border-dashed border-gray-300 text-sm text-[#2563EB] cursor-pointer">
            {avatarLoading ? "Đang tải..." : "Chọn ảnh"}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </label>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Họ và tên</label>
          <Input required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} startAdornment={<User size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Số điện thoại</label>
          <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} startAdornment={<Phone size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mã số sinh viên</label>
          <Input value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} placeholder="SE123456" />
        </div>
        <Button type="submit" size="xl" className="w-full gap-2" loading={loading}
          style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white" }}>
          <Save size={18} /> Lưu thay đổi
        </Button>
      </form>
    </div>
  );
}
