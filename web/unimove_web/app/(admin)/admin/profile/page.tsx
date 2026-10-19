"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Camera, Loader2, Save, User } from "lucide-react";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/admin-ui/avatar";
import { adminApi, apiClient } from "@/lib/admin/api";
import { formatDateTime } from "@/lib/admin/formatters";

export interface AdminProfileData {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

function syncAdminUser(profile: AdminProfileData) {
  localStorage.setItem("admin_user", JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("admin-profile-updated", { detail: profile }));
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      if (token) apiClient.setToken(token);

      const res = await adminApi.getProfile();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Không tải được hồ sơ");
      }

      const data = res.data as AdminProfileData;
      setProfile(data);
      setFullName(data.full_name ?? "");
      setPhone(data.phone ?? "");
      syncAdminUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      try {
        const res = await adminApi.updateProfile({
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        if (!res.success || !res.data) {
          throw new Error(res.message || "Cập nhật thất bại");
        }
        const data = res.data as AdminProfileData;
        setProfile(data);
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        syncAdminUser(data);
        setSuccess("Đã lưu thay đổi.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cập nhật thất bại");
      }
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await adminApi.uploadAvatar(file);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Upload ảnh thất bại");
      }
      const data = res.data as AdminProfileData;
      setProfile(data);
      syncAdminUser(data);
      setSuccess("Đã cập nhật ảnh đại diện.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload ảnh thất bại");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials = (profile?.full_name || profile?.email || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Hồ sơ admin"
        description="Xem và chỉnh sửa thông tin tài khoản quản trị viên"
      />

      <div
        className="rounded-2xl p-6 space-y-6"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-xl text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
            {success}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar size="lg" className="w-20 h-20">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Admin"} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              aria-label="Đổi ảnh đại diện"
            >
              {avatarUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>
              {profile?.full_name || "Admin"}
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {profile?.email}
            </p>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
              style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
            >
              Admin
            </span>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              JPG hoặc PNG, tối đa 2MB
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Họ và tên
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên"
              startAdornment={<User size={15} style={{ color: "var(--muted)" }} />}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Email
            </label>
            <Input value={profile?.email ?? ""} disabled />
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Email không thể thay đổi
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Số điện thoại
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678 hoặc +84912345678"
            />
          </div>
        </div>

        {/* Meta info */}
        {profile && (
          <div
            className="grid grid-cols-2 gap-3 pt-2 text-xs"
            style={{ color: "var(--muted)" }}
          >
            <div>
              <span className="block font-medium mb-0.5">Ngày tham gia</span>
              {formatDateTime(profile.created_at)}
            </div>
            <div>
              <span className="block font-medium mb-0.5">Cập nhật lần cuối</span>
              {formatDateTime(profile.updated_at)}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isPending || !fullName.trim()}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
