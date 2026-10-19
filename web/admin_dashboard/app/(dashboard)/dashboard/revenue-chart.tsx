"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueDataPoint } from "@/lib/types";
import { formatVND } from "@/lib/formatters";

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
  const orders = payload[1]?.value ?? 0;

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
      <p style={{ color: "var(--muted)" }}>
        Đơn hàng: <span className="font-medium">{orders.toLocaleString("vi-VN")}</span>
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
    orders: d.orders,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--primary)", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
