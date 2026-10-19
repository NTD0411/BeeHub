"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, FileText, HelpCircle, ChevronRight, Camera, Truck, Star, TrendingUp, Trash2, AlertTriangle, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { authApi } from "@/lib/api";
import { getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function DeleteAccountDialog({
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>Xóa tài khoản</h3>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Thao tác không thể hoàn tác</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: "var(--muted)" }} />
          </button>
        </div>

        {/* Warning */}
        <div className="rounded-xl p-4 mb-4 flex items-start gap-3"
          style={{ backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-red-700">Sau khi xóa:</p>
            <ul className="text-red-600 text-xs space-y-0.5 list-disc list-inside">
              <li>Tài khoản sẽ bị vô hiệu hóa ngay lập tức</li>
              <li>Bạn sẽ không nhận được đơn hàng mới</li>
              <li>Lịch sử đơn hàng vẫn được lưu lại</li>
              <li>Không thể đăng nhập lại bằng tài khoản này</li>
            </ul>
          </div>
        </div>

        {/* Checkbox confirm */}
        <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-red-500 cursor-pointer"
          />
          <span className="text-sm" style={{ color: "var(--text)" }}>
            Tôi hiểu rằng tài khoản sẽ bị vô hiệu hóa và không thể khôi phục.
          </span>
        </label>

        {/* Error */}
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm text-red-600"
            style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-sm font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#dc2626" }}
          >
            {loading
              ? <><span className="w-4 h-4 rounded-full border-2 border-red-300 border-t-white animate-spin" /> Đang xử lý...</>
              : <><Trash2 size={15} /> Xóa tài khoản</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProviderProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    authApi.getMe().then(r => { if (r.success && r.data) setProfile(r.data as AuthUser); }).finally(() => setLoading(false));
  }, []);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await authApi.deleteAccount();
      // Thành công → logout và redirect (dùng full reload để xóa mọi cache)
      clearAuth();
      window.location.href = "/dang-nhap?deleted=1";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi kết nối";
      // Nếu tài khoản đã bị vô hiệu hóa trước đó → vẫn logout và redirect
      if (message.includes("already_inactive") || message.includes("đã bị vô hiệu hóa") || message.includes("inactive")) {
        clearAuth();
        window.location.href = "/dang-nhap?deleted=1";
        return;
      }
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const isVerified = profile?.is_verified;

  const menu = [
    { icon: User, label: "Chỉnh sửa thông tin", desc: "Tên, SĐT, tên doanh nghiệp", href: "/profile/edit" },
    { icon: FileText, label: "Giấy tờ xác minh", desc: isVerified ? "✓ Đã xác minh" : "Chưa xác minh - Upload ngay", href: "/tai-xe/giay-to" },
    { icon: Lock, label: "Đổi mật khẩu", desc: "Cập nhật mật khẩu đăng nhập", href: "/profile/change-password" },
    { icon: HelpCircle, label: "Trợ giúp", desc: "FAQ, liên hệ hỗ trợ", href: "/profile/help" },
  ];

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {showDeleteDialog && (
        <DeleteAccountDialog
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteDialog(false); setDeleteError(null); }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Hồ sơ nhà vận chuyển</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Quản lý thông tin và xác minh tài khoản</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="h-28" style={{ background: "linear-gradient(135deg, #14532d, #16a34a, #22c55e)" }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-4" style={{ borderColor: "var(--card)" }} />
                : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4"
                  style={{ background: "linear-gradient(135deg, #15803d, #22c55e)", borderColor: "var(--card)" }}>
                  {profile?.full_name?.[0] ?? "P"}
                </div>}
              <Link href="/profile/edit">
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: "var(--provider)" }}>
                  <Camera size={13} className="text-white" />
                </div>
              </Link>
            </div>
            <Link href="/profile/edit">
              <button className="px-4 py-2 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "transparent" }}>
                Chỉnh sửa
              </button>
            </Link>
          </div>

          {loading
            ? <><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-56" /></>
            : <>
              <h2 className="text-xl font-bold mb-0.5" style={{ color: "var(--text)" }}>{profile?.full_name}</h2>
              {profile?.business_name && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Truck size={14} style={{ color: "var(--muted)" }} />
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{profile.business_name}</p>
                </div>
              )}
              <p className="text-sm" style={{ color: "var(--muted)" }}>{profile?.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: "var(--provider-tint)", color: "var(--provider)" }}>
                  Nhà vận chuyển
                </span>
                {profile?.vehicle_type && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                    {profile.vehicle_type}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: isVerified ? "var(--success-tint)" : "var(--warning-tint)", color: isVerified ? "var(--success)" : "var(--warning)" }}>
                  {isVerified ? "✓ Đã xác minh" : "⚠ Chưa xác minh"}
                </span>
              </div>
            </>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <TrendingUp size={20} className="mx-auto mb-2" style={{ color: "var(--provider)" }} />
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {loading ? "—" : (profile?.total_orders ?? 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Tổng chuyến</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <Star size={20} className="mx-auto mb-2" fill="#f59e0b" style={{ color: "#f59e0b" }} />
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {loading ? "—" : (profile?.rating ? profile.rating.toFixed(1) : "0.0")}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Đánh giá TB</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <Truck size={20} className="mx-auto mb-2" style={{ color: "var(--primary)" }} />
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {loading ? "—" : (profile?.total_reviews ?? 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Đánh giá nhận được</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Cài đặt tài khoản</p>
        </div>
        {menu.map(({ icon: Icon, label, desc, href }, i) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-4 px-5 py-4 hover:opacity-80 transition-opacity"
              style={{ borderBottom: i < menu.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--surface)" }}>
                <Icon size={18} style={{ color: "var(--muted)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted)" }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)", backgroundColor: "rgba(239,68,68,0.04)" }}>
          <p className="text-sm font-semibold text-red-600">Vùng nguy hiểm</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Xóa tài khoản</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Vô hiệu hóa tài khoản vĩnh viễn</p>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}