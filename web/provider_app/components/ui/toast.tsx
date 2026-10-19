"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const colors: Record<ToastType, { bg: string; text: string }> = {
    success: { bg: "var(--success-tint)", text: "var(--success)" },
    error: { bg: "var(--error-tint)", text: "var(--error)" },
    info: { bg: "var(--primary-tint)", text: "var(--primary)" },
  };
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />, error: <AlertCircle size={18} />, info: <Info size={18} />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg animate-slide-up border"
            style={{ backgroundColor: colors[t.type].bg, color: colors[t.type].text, borderColor: colors[t.type].text + "44" }}>
            {icons[t.type]}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
