"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { PlatformSetting } from "./page";

interface PlatformSettingsSectionProps {
  settings?: PlatformSetting[];
}

export function PlatformSettingsSection({ settings = [] }: PlatformSettingsSectionProps) {
  const [items, setItems] = useState<PlatformSetting[]>(settings);

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4" style={{ color: "var(--primary)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          Thông tin hệ thống
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((setting, idx) => (
          <SettingRow
            key={setting.key}
            setting={setting}
            onSave={(newValue) => {
              setItems((prev) =>
                prev.map((s, i) => (i === idx ? { ...s, value: newValue } : s))
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Individual row
───────────────────────────────────────────────────────────────────────────── */

function SettingRow({
  setting,
  onSave,
}: {
  setting: PlatformSetting;
  onSave: (newValue: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(setting.value);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setInputValue(setting.value);
    setIsEditing(false);
    setError(null);
  }

  function handleSave() {
    const trimmed = inputValue.trim();
    startTransition(async () => {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("platform_settings")
        .upsert({ key: setting.key, value: trimmed }, { onConflict: "key" });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      onSave(trimmed);
      setIsEditing(false);
      setError(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {setting.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {setting.description}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-medium shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </button>
        )}
      </div>

      <div className="mt-2">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg)",
                border: "1px solid var(--primary)",
                color: "var(--text)",
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: "#DC2626" }}>
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors",
                  "disabled:opacity-60"
                )}
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Check className="w-3.5 h-3.5" />
                {isPending ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                <X className="w-3.5 h-3.5" />
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm font-mono"
            style={{ color: setting.value ? "var(--text)" : "var(--muted)" }}
          >
            {setting.value || "Chưa cấu hình"}
          </p>
        )}
        {success && (
          <p className="text-xs mt-1" style={{ color: "#16A34A" }}>
            Đã lưu thành công.
          </p>
        )}
      </div>
    </div>
  );
}
