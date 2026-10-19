"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  matched: "Đã ghép",
  accepted: "Đã nhận",
  picking_up: "Đang lấy hàng",
  picked_up: "Đã lấy hàng",
  in_progress: "Đang vận chuyển",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  disputed: "Tranh chấp",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  matched: "#2563EB",
  accepted: "#4F46E5",
  picking_up: "#7C3AED",
  picked_up: "#0891B2",
  in_progress: "#059669",
  completed: "#16A34A",
  cancelled: "#DC2626",
  disputed: "#EA580C",
};

interface StatusDataPoint {
  status: string;
  count: number;
}

interface OrderStatusChartProps {
  data: StatusDataPoint[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-sm"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      <p className="font-medium">{payload[0].name}</p>
      <p style={{ color: "var(--muted)" }}>{payload[0].value} đơn</p>
    </div>
  );
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const filtered = data.filter((d) => d.count > 0);

  if (!filtered.length) {
    return (
      <div
        className="h-64 flex items-center justify-center text-sm"
        style={{ color: "var(--muted)" }}
      >
        Chưa có dữ liệu đơn hàng
      </div>
    );
  }

  const chartData = filtered.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#94A3B8",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: "12px", color: "var(--text)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
