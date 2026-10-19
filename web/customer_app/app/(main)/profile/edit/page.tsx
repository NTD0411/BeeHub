"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { customerApi } from "@/lib/api";
import { getStoredUser, type User as UserType } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

export default function EditProfilePage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", phone: "", student_id: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setForm({ full_name: user.full_name, phone: user.phone ?? "", student_id: user.student_id ?? "" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await customerApi.updateMe({ full_name: form.full_name, phone: form.phone || undefined, student_id: form.student_id || undefined });
      if (!res.success) { toast((res as { message?: string }).message || "Cập nhật thất bại", "error"); return; }
      const stored = getStoredUser();
      if (stored) {
        localStorage.setItem("customer_user", JSON.stringify({ ...stored, ...form }));
      }
      toast("Cập nhật thành công!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lỗi kết nối", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: "var(--text)" }}>Chỉnh sửa hồ sơ</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Họ và tên</label>
          <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Nguyễn Văn A" required startAdornment={<User size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Số điện thoại</label>
          <Input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="0901234567" startAdornment={<Phone size={15} />} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text)" }}>Mã số sinh viên</label>
          <Input value={form.student_id} onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value }))}
            placeholder="SE123456" startAdornment={<Mail size={15} />} />
        </div>
        <Button type="submit" variant="gradient" size="xl" className="w-full gap-2" loading={loading}>
          <Save size={18} /> Lưu thay đổi
        </Button>
      </form>
    </div>
  );
}
