"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType; description: string }[] = [
  {
    value: "light",
    label: "Sáng",
    icon: Sun,
    description: "Giao diện nền trắng",
  },
  {
    value: "dark",
    label: "Tối",
    icon: Moon,
    description: "Giao diện nền tối",
  },
  {
    value: "system",
    label: "Hệ thống",
    icon: Monitor,
    description: "Theo cài đặt thiết bị",
  },
];

export function ThemeSection() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Giao diện
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Hiện tại:{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {resolvedTheme === "dark" ? "Tối" : "Sáng"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all",
                "border-2"
              )}
              style={
                isActive
                  ? {
                      borderColor: "var(--primary)",
                      backgroundColor: "var(--primary-tint)",
                      color: "var(--primary)",
                    }
                  : {
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                      color: "var(--muted)",
                    }
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
              <span
                className="text-xs font-normal"
                style={{ color: isActive ? "var(--primary)" : "var(--muted)", opacity: 0.8 }}
              >
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
