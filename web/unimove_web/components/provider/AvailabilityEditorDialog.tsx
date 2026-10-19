"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { validateDaySlots, normalizeTime } from "@/lib/provider-schedule";

interface SlotDraft {
  start_time: string;
  end_time: string;
}

interface AvailabilityEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string;
  initialSlots: SlotDraft[];
  saving?: boolean;
  onSave: (slots: SlotDraft[]) => Promise<void>;
}

const PRESETS: { label: string; start: string; end: string }[] = [
  { label: "Buổi sáng", start: "08:00", end: "12:00" },
  { label: "Buổi chiều", start: "13:00", end: "17:00" },
  { label: "Cả ngày", start: "08:00", end: "18:00" },
];

function toInputTime(t: string) {
  return t.slice(0, 5);
}

export function AvailabilityEditorDialog({
  open,
  onOpenChange,
  dayLabel,
  initialSlots,
  saving,
  onSave,
}: AvailabilityEditorDialogProps) {
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSlots(
        initialSlots.length
          ? initialSlots.map((s) => ({
              start_time: toInputTime(s.start_time),
              end_time: toInputTime(s.end_time),
            }))
          : [{ start_time: "08:00", end_time: "12:00" }],
      );
      setError(null);
    }
  }, [open, initialSlots]);

  const addSlot = () => {
    setSlots((prev) => [...prev, { start_time: "14:00", end_time: "17:00" }]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: keyof SlotDraft, value: string) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const applyPreset = (start: string, end: string) => {
    setSlots((prev) => {
      const exists = prev.some((s) => s.start_time === start && s.end_time === end);
      if (exists) return prev;
      return [...prev, { start_time: start, end_time: end }];
    });
  };

  const handleSave = async () => {
    const normalized = slots.map((s) => ({
      start_time: normalizeTime(s.start_time),
      end_time: normalizeTime(s.end_time),
    }));
    const err = validateDaySlots(normalized);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    await onSave(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={18} className="text-[#1d4ed8]" />
            Chỉnh giờ rảnh
          </DialogTitle>
          <DialogDescription>
            Thiết lập khung giờ bạn sẵn sàng nhận đơn cho <strong>{dayLabel}</strong>.
            Lịch này áp dụng lặp lại mỗi tuần.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.start, p.end)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#c4c5d7]/80 text-gray-600 hover:bg-[#eff4ff] hover:border-[#1d4ed8]/30 transition-colors"
            >
              + {p.label} ({p.start}–{p.end})
            </button>
          ))}
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {slots.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Chưa có khung giờ — thêm preset hoặc tạo mới</p>
          ) : (
            slots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateSlot(idx, "start_time", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateSlot(idx, "end_time", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors shrink-0"
                  aria-label="Xóa khung giờ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={addSlot}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#1d4ed8]/40 text-[#1d4ed8] text-sm font-semibold hover:bg-[#eff4ff] transition-colors"
        >
          <Plus size={16} />
          Thêm khung giờ
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#1d4ed8] hover:bg-[#1d4ed8]/90 disabled:opacity-60 transition-colors"
          >
            {saving ? "Đang lưu…" : "Lưu lịch rảnh"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
