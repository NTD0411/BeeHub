"use server";

import { serverGet, serverPut } from "@/lib/admin/server-api";
import {
  PLATFORM_SETTINGS,
  formatSettingRawValue,
  formatSettingDisplayValue,
  serializeJsonHint,
  type JsonHintValue,
  type SettingType,
} from "@/lib/admin/platform-settings-meta";
import type { PlatformSetting } from "@/app/(admin)/admin/settings/page";

export async function getPlatformSettings(): Promise<{
  settings: PlatformSetting[];
  error: Error | null;
}> {
  try {
    const data = await serverGet<any>("/admin/settings");
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch platform settings");
    }

    const raw = (data.data ?? {}) as Record<string, unknown>;
    const settings: PlatformSetting[] = Object.entries(raw)
      .map(([key, value]) => {
        const meta = PLATFORM_SETTINGS[key];
        if (!meta) return null;

        const rawValue = formatSettingRawValue(value);
        return {
          key,
          value: rawValue,
          displayValue: formatSettingDisplayValue(key, rawValue),
          label: meta.label,
          description: meta.description,
          type: meta.type,
          order: meta.order,
        };
      })
      .filter((item): item is PlatformSetting => item !== null);

    settings.sort((a, b) => a.order - b.order);

    return { settings, error: null };
  } catch (error) {
    console.error("Get platform settings error:", error);
    return {
      settings: [],
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export async function updatePlatformSetting(
  key: string,
  value: string,
  type?: SettingType
) {
  try {
    let payload: unknown = value;

    if (type === "json-hint") {
      payload = JSON.parse(value);
    } else if (type === "text-hint") {
      payload = value;
    } else if (type === "rate" || type === "currency") {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) {
        throw new Error("Giá trị không hợp lệ");
      }
      payload = String(value).trim();
    }

    const data = await serverPut<any>("/admin/settings", { [key]: payload });
    if (data.success) return { error: null };
    throw new Error(data.message || "Failed to update platform setting");
  } catch (error) {
    return { error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function updateJsonHintSetting(key: string, hint: JsonHintValue) {
  return updatePlatformSetting(key, serializeJsonHint(hint), "json-hint");
}
