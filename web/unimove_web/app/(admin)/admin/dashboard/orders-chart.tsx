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

function toMonthLabel(dateKey: string): string {
  const [, mm] = dateKey.split("-");
  return `Th${parseInt(mm, 10)}`;
}

interface TooltipArgs {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipArgs) {
  if (!active || !payload?.length) return null;
  const orders = payload[0]?.value ?? 0;

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
      <p style={{ color: "#D97706" }}>
        Đơn hàng: <span className="font-medium">{orders.toLocaleString("vi-VN")}</span>
      </p>
    </div>
  );
}

interface OrdersChartProps {
  data: RevenueDataPoint[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const chartData = data.map((d) => ({
    month: toMonthLabel(d.date),
    orders: d.orders ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "var(--muted)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="orders"
          fill="#D97706"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
