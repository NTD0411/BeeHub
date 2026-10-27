"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Database, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import { apiClient } from "@/lib/admin/api";

interface DatabaseTable {
  name: string;
  description: string | null;
}

interface ForeignKey {
  table: string;
  column: string;
  constraint: string;
}

interface DatabaseColumn {
  name: string;
  dataType: string;
  databaseType: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  foreignKeys: ForeignKey[];
  searchable: boolean;
}

interface RowsMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AppliedFilters {
  search: string;
  filterColumn: string;
  filterValue: string;
  filterMode: "contains" | "exact";
  sortBy: string;
  sortOrder: "asc" | "desc";
  pageSize: number;
}

const initialFilters: AppliedFilters = {
  search: "",
  filterColumn: "",
  filterValue: "",
  filterMode: "contains",
  sortBy: "",
  sortOrder: "asc",
  pageSize: 25,
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function DatabaseBrowserPage() {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [columns, setColumns] = useState<DatabaseColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<RowsMeta>({ total: 0, page: 1, pageSize: 25, totalPages: 0 });
  const [filters, setFilters] = useState<AppliedFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(initialFilters);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [tablesError, setTablesError] = useState("");

  const searchableColumns = useMemo(
    () => columns.filter((column) => column.searchable),
    [columns],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTables() {
      setTablesLoading(true);
      setTablesError("");
      try {
        const response = await apiClient.get<DatabaseTable[]>("/admin/data/tables");
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không thể tải danh sách bảng");
        }
        if (!cancelled) {
          setTables(response.data);
          setSelectedTable((current) => current || response.data![0]?.name || "");
        }
      } catch (loadError) {
        if (!cancelled) {
          setTablesError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách bảng");
        }
      } finally {
        if (!cancelled) setTablesLoading(false);
      }
    }

    void loadTables();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    let cancelled = false;

    async function loadTable() {
      setDataLoading(true);
      setError("");
      try {
        const params: Record<string, string | number> = {
          page: meta.page,
          pageSize: filters.pageSize,
          sortOrder: filters.sortOrder,
        };
        if (filters.search) params.search = filters.search;
        if (filters.filterColumn && filters.filterValue) {
          params.filterColumn = filters.filterColumn;
          params.filterValue = filters.filterValue;
          params.filterMode = filters.filterMode;
        }
        if (filters.sortBy) params.sortBy = filters.sortBy;

        const [schemaResponse, rowsResponse] = await Promise.all([
          apiClient.get<DatabaseColumn[]>(`/admin/data/tables/${encodeURIComponent(selectedTable)}/schema`),
          apiClient.get<Record<string, unknown>[]>(
            `/admin/data/tables/${encodeURIComponent(selectedTable)}/rows`,
            params,
          ),
        ]);
        if (!schemaResponse.success || !schemaResponse.data) {
          throw new Error(schemaResponse.message || "Không thể tải cấu trúc bảng");
        }
        if (!rowsResponse.success || !rowsResponse.data || !rowsResponse.meta) {
          throw new Error(rowsResponse.message || "Không thể tải dữ liệu bảng");
        }
        if (!cancelled) {
          setColumns(schemaResponse.data);
          setRows(rowsResponse.data);
          setMeta({
            total: rowsResponse.meta.total,
            page: rowsResponse.meta.page,
            pageSize: rowsResponse.meta.pageSize,
            totalPages: rowsResponse.meta.pages,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu bảng");
          setColumns([]);
          setRows([]);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    void loadTable();
    return () => {
      cancelled = true;
    };
  }, [selectedTable, filters, meta.page]);

  function selectTable(table: string) {
    setSelectedTable(table);
    setMeta((current) => ({ ...current, page: 1 }));
    setColumns([]);
    setRows([]);
    setError("");
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMeta((current) => ({ ...current, page: 1 }));
    setFilters({ ...draftFilters });
  }

  function changePage(page: number) {
    setMeta((current) => ({ ...current, page }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dữ liệu hệ thống"
        description="Tra cứu bảng, cấu trúc cột, khóa chính/ngoại và dữ liệu trong cơ sở dữ liệu."
      />

      <section
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text)" }}>
              Chọn bảng ({tables.length})
            </span>
            <select
              value={selectedTable}
              onChange={(event) => selectTable(event.target.value)}
              disabled={tablesLoading || tables.length === 0}
              className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {tablesLoading && <option value="">Đang tải bảng...</option>}
              {!tablesLoading && tables.length === 0 && <option value="">Không có bảng dữ liệu</option>}
              {tables.map((table) => (
                <option key={table.name} value={table.name}>{table.name}</option>
              ))}
            </select>
          </label>
          {selectedTable && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}>
              <Database size={16} />
              <span>{formatNumber(meta.total)} bản ghi</span>
            </div>
          )}
        </div>
        {tablesError && <p role="alert" className="mt-3 text-sm text-red-600">{tablesError}</p>}
      </section>

      {columns.length > 0 && (
        <section
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Cấu trúc bảng <span className="font-mono text-[var(--primary)]">{selectedTable}</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {columns.map((column) => (
              <div key={column.name} className="min-w-0 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>{column.name}</span>
                  {column.isPrimaryKey && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">PK</span>}
                  {column.foreignKeys.map((key) => (
                    <span key={key.constraint} className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                      FK → {key.table}.{key.column}
                    </span>
                  ))}
                  {!column.searchable && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">giá trị ẩn</span>}
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {column.dataType}{column.nullable ? " · cho phép NULL" : " · NOT NULL"}
                </p>
                {column.defaultValue && (
                  <p className="mt-1 truncate text-xs" style={{ color: "var(--muted)" }} title={column.defaultValue}>
                    Mặc định: {column.defaultValue}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            PK: khóa chính · FK: khóa ngoại. Các cột mật khẩu, token, secret, API key và OTP được ẩn.
          </p>
        </section>
      )}

      <section
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Tìm kiếm toàn bảng</span>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                value={draftFilters.search}
                onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Nhập từ khóa..."
                maxLength={200}
                className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Lọc theo cột</span>
            <select
              value={draftFilters.filterColumn}
              onChange={(event) => setDraftFilters((current) => ({ ...current, filterColumn: event.target.value }))}
              className="h-10 w-full rounded-lg border px-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">Không lọc</option>
              {searchableColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Giá trị lọc</span>
            <input
              value={draftFilters.filterValue}
              onChange={(event) => setDraftFilters((current) => ({ ...current, filterValue: event.target.value }))}
              placeholder="Giá trị..."
              maxLength={200}
              className="h-10 w-full rounded-lg border px-3 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Kiểu khớp</span>
            <select
              value={draftFilters.filterMode}
              onChange={(event) => setDraftFilters((current) => ({ ...current, filterMode: event.target.value as AppliedFilters["filterMode"] }))}
              className="h-10 w-full rounded-lg border px-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="contains">Có chứa</option>
              <option value="exact">Chính xác</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Sắp xếp</span>
            <select
              value={draftFilters.sortBy}
              onChange={(event) => setDraftFilters((current) => ({ ...current, sortBy: event.target.value }))}
              className="h-10 w-full rounded-lg border px-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="">Mặc định</option>
              {searchableColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Thứ tự</span>
            <select
              value={draftFilters.sortOrder}
              onChange={(event) => setDraftFilters((current) => ({ ...current, sortOrder: event.target.value as AppliedFilters["sortOrder"] }))}
              className="h-10 w-full rounded-lg border px-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="asc">Tăng dần</option>
              <option value="desc">Giảm dần</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium" style={{ color: "var(--muted)" }}>Số dòng / trang</span>
            <select
              value={draftFilters.pageSize}
              onChange={(event) => setDraftFilters((current) => ({ ...current, pageSize: Number(event.target.value) }))}
              className="h-10 w-full rounded-lg border px-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 xl:col-span-6">
            <button type="submit" disabled={dataLoading || !selectedTable} className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--primary)" }}>
              {dataLoading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
              Áp dụng bộ lọc
            </button>
          </div>
        </form>

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 w-full overflow-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: "var(--bg)" }}>
                {columns.map((column) => (
                  <th key={column.name} className="whitespace-nowrap border-b px-3 py-3 font-semibold" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    {column.name}
                    {column.isPrimaryKey && <span className="ml-1 text-amber-600">PK</span>}
                    {column.foreignKeys.length > 0 && <span className="ml-1 text-blue-600">FK</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataLoading && (
                <tr><td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center" style={{ color: "var(--muted)" }}>Đang tải dữ liệu...</td></tr>
              )}
              {!dataLoading && !error && rows.length === 0 && (
                <tr><td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center" style={{ color: "var(--muted)" }}>Không có bản ghi phù hợp.</td></tr>
              )}
              {!dataLoading && rows.map((row, rowIndex) => (
                <tr key={`${selectedTable}-${meta.page}-${rowIndex}`} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  {columns.map((column) => {
                    const value = displayValue(row[column.name]);
                    return (
                      <td key={column.name} className="max-w-[320px] whitespace-nowrap px-3 py-2.5 font-mono" style={{ borderColor: "var(--border)", color: value === "NULL" ? "var(--muted)" : "var(--text)" }}>
                        <span className="block max-w-[320px] truncate" title={value}>{value}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {meta.total === 0 ? "0 bản ghi" : `${formatNumber((meta.page - 1) * meta.pageSize + 1)}–${formatNumber(Math.min(meta.page * meta.pageSize, meta.total))} / ${formatNumber(meta.total)} bản ghi`}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changePage(meta.page - 1)} disabled={meta.page <= 1 || dataLoading} className="h-9 rounded-lg border px-3 text-sm disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <ArrowUp size={14} className="mr-1 inline rotate-[-90deg]" /> Trước
            </button>
            <span className="text-sm" style={{ color: "var(--muted)" }}>Trang {meta.page} / {Math.max(meta.totalPages, 1)}</span>
            <button type="button" onClick={() => changePage(meta.page + 1)} disabled={meta.page >= meta.totalPages || dataLoading} className="h-9 rounded-lg border px-3 text-sm disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              Sau <ArrowDown size={14} className="ml-1 inline rotate-[-90deg]" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
