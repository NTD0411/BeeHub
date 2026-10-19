"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChiTietRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dat-chuyen/phong-tro");
  }, [router]);
  return null;
}
