"use client";

import { useRouter } from "next/navigation";
import { Pagination } from "@/components/admin-dashboard/pagination";

interface PaginationNavProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  tab: string;
}

export function PaginationNav({
  page,
  totalPages,
  total,
  pageSize,
  tab,
}: PaginationNavProps) {
  const router = useRouter();

  function handlePageChange(newPage: number) {
    router.push(`/activity-logs?tab=${tab}&page=${newPage}`);
  }

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  );
}
