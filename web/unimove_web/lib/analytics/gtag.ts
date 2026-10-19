export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function pageview(url: string, title?: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title ?? document.title,
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  const clean = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
    : undefined;
  window.gtag("event", name, clean);
}

export function trackAdminPageView(pathname: string) {
  trackEvent("admin_page_view", {
    page_path: pathname,
    page_location: typeof window !== "undefined" ? window.location.href : pathname,
    app_section: "admin",
  });
}
