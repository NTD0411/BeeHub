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
import type { RevenueDataPoint } from "@/lib/admin/types";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}Tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function formatXAxis(monthKey: string): string {
  const [, m] = monthKey.split("-");
  return `Th${parseInt(m)}`;
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const orders = payload.find((p) => p.dataKey === "orders")?.value ?? 0;

  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-sm"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--muted)" }}>
        {label ? formatXAxis(label) : ""}
      </p>
      <p>
        Doanh thu:{" "}
        <span className="font-semibold">
          {new Intl.NumberFormat("vi-VN").format(revenue)}đ
        </span>
      </p>
      <p>
        Đơn hàng: <span className="font-semibold">{orders}</span>
      </p>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) {
    return (
      <div
        className="h-64 flex items-center justify-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        Chưa có dữ liệu doanh thu
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1A56DB"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#1A56DB" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
