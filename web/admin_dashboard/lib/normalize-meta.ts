export function normalizeMeta(
  meta: Record<string, unknown> | null | undefined,
  fallback: { page: number; pageSize: number }
) {
  const total = Number(meta?.total ?? 0);
  const pageSize = Number(meta?.pageSize ?? fallback.pageSize);
  const totalPages = Number(
    meta?.totalPages ?? meta?.pages ?? (pageSize > 0 ? Math.ceil(total / pageSize) : 0)
  );

  return {
    page: Number(meta?.page ?? fallback.page),
    pageSize,
    total,
    totalPages,
  };
}
