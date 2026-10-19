"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
  className?: string;
  /** Nhãn hiển thị trên nút tuỳ chỉnh */
  label?: string;
}

export function GoogleSignInButton({
  onCredential,
  disabled,
  className,
  label = "Đăng nhập với Google",
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  const initButton = useCallback(() => {
    if (!clientId || !containerRef.current || !window.google?.accounts?.id) return;

    const width = containerRef.current.offsetWidth || 320;
    containerRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width,
      type: "standard",
      text: "continue_with",
      locale: "vi",
      shape: "pill",
    });
    setSdkReady(true);
  }, [clientId, onCredential]);

  useEffect(() => {
    if (!clientId) return;

    const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      initButton();
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.onload = initButton;
    script.onerror = () => setSdkError(true);
    document.body.appendChild(script);
  }, [clientId, initButton]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const el = containerRef.current.parentElement;
    if (!el) return;

    const ro = new ResizeObserver(() => initButton());
    ro.observe(el);
    return () => ro.disconnect();
  }, [clientId, initButton]);

  if (!clientId) {
    return (
      <p className="text-xs text-center text-gray-400">
        Thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào .env để bật đăng nhập Google
      </p>
    );
  }

  if (sdkError) {
    return (
      <p className="text-xs text-center text-red-500">
        Không tải được Google Sign-In. Kiểm tra kết nối mạng hoặc thử lại sau.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-[52px]",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      {/* Lớp hiển thị — khớp giao diện UniMove */}
      <div
        className={cn(
          "absolute inset-0 z-0 flex items-center justify-center gap-2.5 rounded-full border-2 border-gray-200 bg-white text-sm font-bold text-gray-800 shadow-sm transition-colors",
          !sdkReady && "animate-pulse",
        )}
        aria-hidden="true"
      >
        <GoogleIcon />
        {label}
      </div>

      {/* Nút Google thật — trong suốt, nhận click */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-10 overflow-hidden opacity-[0.02] [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full"
        aria-label={label}
      />
    </div>
  );
}
