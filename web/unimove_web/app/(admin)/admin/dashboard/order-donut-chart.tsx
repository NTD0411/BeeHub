"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ── Color map ───────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed:   { label: "Hoàn thành",       color: "#16A34A" },
  in_progress: { label: "Đang vận chuyển",  color: "#2563EB" },
  cancelled:   { label: "Đã hủy",           color: "#DC2626" },
  pending:     { label: "Chờ xử lý",        color: "#D97706" },
  matched:     { label: "Đã ghép",          color: "#7C3AED" },
  accepted:    { label: "Đã nhận",          color: "#6366F1" },
  picking_up:  { label: "Đang đến lấy",     color: "#8B5CF6" },
  picked_up:   { label: "Đã lấy hàng",     color: "#06B6D4" },
  disputed:    { label: "Tranh chấp",       color: "#F97316" },
};

function getConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: "#94A3B8" };
}

/* ── Custom Tooltip ──────────────────────────────────────────────────────── */

interface ChartEntry {
  name: string;
  value: number;
  color: string;
  status: string;
}

interface TooltipArgs {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ChartEntry }>;
}

function CustomTooltip({ active, payload }: TooltipArgs) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;

  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-sm"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span style={{ color: "var(--text)" }}>{entry.name}</span>
      </div>
      <p className="mt-0.5 font-semibold">
        {entry.value.toLocaleString("vi-VN")} đơn
      </p>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface OrderDonutChartProps {
  data: { status: string; count: number }[];
}

export function OrderDonutChart({ data }: OrderDonutChartProps) {
  // Filter out zero-count entries for a cleaner chart
  const filtered = data.filter((d) => d.count > 0);

  const chartData = filtered.map((d) => {
    const cfg = getConfig(d.status);
    return {
      name: cfg.label,
      value: d.count,
      color: cfg.color,
      status: d.status,
    };
  });

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {total.toLocaleString("vi-VN")}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            đơn hàng
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs">
        {chartData.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span
              className="truncate"
              style={{ color: "var(--muted)" }}
              title={entry.name}
            >
              {entry.name}
            </span>
            <span className="ml-auto font-medium shrink-0" style={{ color: "var(--text)" }}>
              {entry.value.toLocaleString("vi-VN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
