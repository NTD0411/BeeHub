"use client";

import { useState, useTransition, useEffect } from "react";
import { Pencil, Check, X, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/admin/utils";
import {
  getPlatformSettings,
  updatePlatformSetting,
  updateJsonHintSetting,
} from "@/lib/admin/queries/settings";
import {
  parseJsonHint,
  formatRateDisplay,
  type JsonHintValue,
} from "@/lib/admin/platform-settings-meta";
import type { PlatformSetting } from "./page";

export function PlatformSettingsSection() {
  const [items, setItems] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { settings, error } = await getPlatformSettings();
    if (error) {
      setLoadError(error.message);
      setItems([]);
    } else {
      setItems(settings);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: "var(--primary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Thông tin hệ thống
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ color: "var(--muted)" }}
        >
          Tải lại
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
        </div>
      )}

      {!loading && loadError && (
        <p className="text-sm" style={{ color: "#DC2626" }}>
          {loadError}
        </p>
      )}

      {!loading && !loadError && items.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Chưa có cấu hình hệ thống.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((setting, idx) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              onSave={(updated) => {
                setItems((prev) =>
                  prev.map((s, i) => (i === idx ? { ...s, ...updated } : s))
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: PlatformSetting;
  onSave: (updated: Partial<PlatformSetting>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(setting.value);
  const [jsonHint, setJsonHint] = useState<JsonHintValue>(() => parseJsonHint(setting.value));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setInputValue(setting.value);
    setJsonHint(parseJsonHint(setting.value));
  }, [setting.value]);

  function handleCancel() {
    setInputValue(setting.value);
    setJsonHint(parseJsonHint(setting.value));
    setIsEditing(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      if (setting.type === "json-hint") {
        if (!jsonHint.title?.trim()) {
          setError("Vui lòng nhập tiêu đề");
          return;
        }
        const { error: saveError } = await updateJsonHintSetting(setting.key, jsonHint);
        if (saveError) {
          setError(saveError.message);
          return;
        }
        const serialized = JSON.stringify(jsonHint);
        onSave({
          value: serialized,
          displayValue: [jsonHint.title, jsonHint.subtitle].filter(Boolean).join(" · "),
        });
      } else {
        const trimmed = inputValue.trim();
        const { error: saveError } = await updatePlatformSetting(
          setting.key,
          trimmed,
          setting.type
        );
        if (saveError) {
          setError(saveError.message);
          return;
        }
        onSave({
          value: trimmed,
          displayValue:
            setting.type === "rate"
              ? formatRateDisplay(trimmed)
              : setting.type === "currency"
                ? new Intl.NumberFormat("vi-VN").format(Number(trimmed)) + "đ"
                : trimmed.replace(/^"|"$/g, ""),
        });
      }

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
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-medium shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </button>
        )}
      </div>

      <div className="mt-3">
        {isEditing ? (
          <div className="space-y-3">
            {setting.type === "json-hint" ? (
              <>
                <Field label="Tiêu đề">
                  <input
                    type="text"
                    value={jsonHint.title ?? ""}
                    onChange={(e) => setJsonHint((prev) => ({ ...prev, title: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Mô tả phụ">
                  <textarea
                    value={jsonHint.subtitle ?? ""}
                    onChange={(e) => setJsonHint((prev) => ({ ...prev, subtitle: e.target.value }))}
                    rows={2}
                    className={cn(inputClass, "resize-none")}
                  />
                </Field>
              </>
            ) : setting.type === "text-hint" ? (
              <Field label="Nội dung">
                <textarea
                  value={inputValue.replace(/^"|"$/g, "")}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={3}
                  className={cn(inputClass, "resize-none")}
                />
              </Field>
            ) : (
              <Field
                label={setting.type === "rate" ? "Giá trị thập phân" : "Giá trị"}
                hint={
                  setting.type === "rate"
                    ? "Ví dụ: 0.30 tương đương 30%"
                    : setting.type === "currency"
                      ? "Nhập số tiền VNĐ"
                      : undefined
                }
              >
                <input
                  type="text"
                  inputMode={setting.type === "currency" ? "numeric" : "decimal"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  autoFocus
                  className={inputClass}
                />
              </Field>
            )}

            {error && (
              <p className="text-xs" style={{ color: "#DC2626" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
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
                type="button"
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
        ) : setting.type === "json-hint" ? (
          <JsonHintPreview value={setting.value} />
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {setting.displayValue || "Chưa cấu hình"}
          </p>
        )}

        {!isEditing && setting.type === "rate" && setting.value && (
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--muted)" }}>
            Giá trị gốc: {setting.value}
          </p>
        )}

        {success && (
          <p className="text-xs mt-2" style={{ color: "#16A34A" }}>
            Đã lưu thành công.
          </p>
        )}
      </div>
    </div>
  );
}

function JsonHintPreview({ value }: { value: string }) {
  const hint = parseJsonHint(value);
  if (!hint.title && !hint.subtitle) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Chưa cấu hình
      </p>
    );
  }

  return (
    <div
      className="rounded-lg p-3 space-y-1"
      style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
    >
      {hint.title && (
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {hint.title}
        </p>
      )}
      {hint.subtitle && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {hint.subtitle}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--primary)]";
