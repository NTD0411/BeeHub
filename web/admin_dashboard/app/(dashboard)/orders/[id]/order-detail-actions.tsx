"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { forceCancelOrder } from "@/lib/queries/orders";
import { formatOrderNumber } from "@/lib/formatters";
import { AlertTriangle, Loader2 } from "lucide-react";

interface OrderDetailActionsProps {
  orderId: string;
  orderNumber: string;
  adminId: string;
}

export function OrderDetailActions({ orderId, orderNumber, adminId }: OrderDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setReason("");
      setError(null);
    }
    setOpen(o);
  }

  function handleConfirm() {
    if (!reason.trim()) return;
    startTransition(async () => {
      setError(null);
      const { error: err } = await forceCancelOrder(orderId, adminId, reason.trim());
      if (err) {
        setError(err.message);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--text)" }}>
        Hành động quản trị
      </h2>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Hủy đơn hàng
      </button>
      <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
        Hủy đơn hàng này bằng quyền quản trị viên. Thao tác này không thể hoàn tác.
      </p>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent hideClose={false}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle>Xác nhận hủy đơn</DialogTitle>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Đơn hàng {formatOrderNumber(orderNumber)} sẽ bị hủy vĩnh viễn. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Lý do hủy <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={4}
                className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none transition-colors"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <button
              onClick={() => handleOpenChange(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Bỏ qua
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                "Xác nhận hủy"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
