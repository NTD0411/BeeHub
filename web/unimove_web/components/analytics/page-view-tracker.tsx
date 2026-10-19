"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview, trackAdminPageView } from "@/lib/analytics/gtag";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    pageview(url);

    if (pathname.startsWith("/admin")) {
      trackAdminPageView(pathname);
    }
  }, [pathname, searchParams]);

  return null;
}
