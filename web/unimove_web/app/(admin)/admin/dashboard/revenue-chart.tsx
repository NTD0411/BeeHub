"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "@/lib/admin/types";
import { formatVND } from "@/lib/admin/formatters";

/* ── Month label helper ──────────────────────────────────────────────────── */

function toMonthLabel(dateKey: string): string {
  // dateKey format: "YYYY-MM"
  const [, mm] = dateKey.split("-");
  return `Th${parseInt(mm, 10)}`;
}

/* ── Custom Tooltip ──────────────────────────────────────────────────────── */

interface ChartPayloadEntry {
  value?: number;
}

interface TooltipArgs {
  active?: boolean;
  payload?: ChartPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipArgs) {
  if (!active || !payload?.length) return null;
  const revenue = payload[0]?.value ?? 0;

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-lg text-sm"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
        {label}
      </p>
      <p style={{ color: "var(--primary)" }}>
        Doanh thu: <span className="font-medium">{formatVND(revenue)}</span>
      </p>
    </div>
  );
}

/* ── Chart ───────────────────────────────────────────────────────────────── */

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    month: toMonthLabel(d.date),
    revenue: d.revenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => {
            if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(0)}T`;
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}tr`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
            return String(v);
          }}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          fill="var(--primary)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
