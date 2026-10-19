"use client";

import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "@/lib/types";
import { formatVND } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Date range filter options
// ---------------------------------------------------------------------------

type DateRange = "this_month" | "last_3" | "last_6" | "this_year";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "this_month", label: "Tháng này" },
  { value: "last_3", label: "3 tháng gần nhất" },
  { value: "last_6", label: "6 tháng gần nhất" },
  { value: "this_year", label: "Năm nay" },
];

function filterByRange(data: RevenueDataPoint[], range: DateRange): RevenueDataPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  return data.filter((d) => {
    const [y, m] = d.date.split("-").map(Number);
    if (range === "this_month") return y === year && m === month;
    if (range === "last_3") {
      const cutoff = new Date(year, now.getMonth() - 2, 1);
      return new Date(y, m - 1, 1) >= cutoff;
    }
    if (range === "last_6") {
      const cutoff = new Date(year, now.getMonth() - 5, 1);
      return new Date(y, m - 1, 1) >= cutoff;
    }
    if (range === "this_year") return y === year;
    return true;
  });
}

function formatMonth(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return `${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Revenue & Orders ComposedChart
// ---------------------------------------------------------------------------

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function RevenueOrdersChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatMonth}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="revenue"
          orientation="left"
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--text)",
          }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : Number(value ?? 0);
            return name === "Doanh thu" ? formatVND(v) : v.toLocaleString("vi-VN");
          }}
          labelFormatter={(label) => formatMonth(String(label ?? ""))}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted)", paddingTop: 8 }}
        />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Doanh thu"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
        />
        <Bar
          yAxisId="orders"
          dataKey="orders"
          name="Đơn hàng"
          fill="#93C5FD"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Commission BarChart
// ---------------------------------------------------------------------------

interface CommissionData {
  month: string;
  commission: number;
}

function CommissionChart({ data }: { data: CommissionData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 11, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--text)",
          }}
          formatter={(v) => formatVND(typeof v === "number" ? v : Number(v ?? 0))}
          labelFormatter={(label) => formatMonth(String(label ?? ""))}
        />
        <Bar
          dataKey="commission"
          name="Hoa hồng"
          fill="var(--primary)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Main exported client component
// ---------------------------------------------------------------------------

interface AnalyticsChartsClientProps {
  revenueData: RevenueDataPoint[];
  commissionData: CommissionData[];
}

export function AnalyticsChartsClient({ revenueData, commissionData }: AnalyticsChartsClientProps) {
  const [range, setRange] = useState<DateRange>("last_6");

  const filteredRevenue = useMemo(() => filterByRange(revenueData, range), [revenueData, range]);

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              range === opt.value
                ? { backgroundColor: "var(--primary)", color: "#fff" }
                : { backgroundColor: "var(--primary-tint)", color: "var(--muted)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Revenue & Orders ComposedChart */}
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Doanh thu & Đơn hàng
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Doanh thu (trục trái, VND) · Số đơn (trục phải)
          </p>
        </div>
        {filteredRevenue.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
            Không có dữ liệu cho khoảng thời gian này.
          </div>
        ) : (
          <RevenueOrdersChart data={filteredRevenue} />
        )}
      </div>

      {/* Commission BarChart */}
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Hoa hồng nền tảng theo tháng
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            6 tháng gần nhất
          </p>
        </div>
        {commissionData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--muted)" }}>
            Chưa có dữ liệu hoa hồng.
          </div>
        ) : (
          <CommissionChart data={commissionData} />
        )}
      </div>
    </div>
  );
}
