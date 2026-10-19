"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Activity,
  ExternalLink,
  Globe,
  MousePointerClick,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { adminApi } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";
import {
  getEventLabel,
  getMediumLabel,
  getPageLabel,
  getSourceLabel,
  getTrafficCategory,
  getTrafficLabel,
} from "@/lib/analytics/ga4-labels";

interface GA4Row {
  source?: string;
  medium?: string;
  sessions?: number;
  activeUsers?: number;
  pagePath?: string;
  pageViews?: number;
  eventName?: string;
  eventCount?: number;
}

interface GA4Data {
  configured: boolean;
  message?: string;
  period?: string;
  trafficSources?: GA4Row[];
  topPages?: GA4Row[];
  topEvents?: GA4Row[];
  adminPages?: GA4Row[];
}

const CHART_COLORS = [
  "var(--primary)",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#6366F1",
];

function DataTable({
  headers,
  rows,
  renderRow,
}: {
  headers: string[];
  rows: GA4Row[];
  renderRow: (row: GA4Row, idx: number) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: "var(--muted)" }}>
        Chưa có dữ liệu trong khoảng thời gian này.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl shadow-sm overflow-hidden"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </h2>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function PageNameCell({ path }: { path?: string }) {
  const label = getPageLabel(path);
  const raw = path || "/";
  return (
    <td className="px-4 py-2.5">
      <p className="font-medium" style={{ color: "var(--text)" }}>
        {label}
      </p>
      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>
        {raw}
      </p>
    </td>
  );
}

function TrafficTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { fullLabel: string; category: string; sessions: number; users: number; pct: number } }[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
        {d.fullLabel}
      </p>
      <p style={{ color: "var(--muted)" }}>Loại: {d.category}</p>
      <p style={{ color: "var(--text)" }}>Sessions: {d.sessions}</p>
      <p style={{ color: "var(--text)" }}>Users: {d.users}</p>
      <p style={{ color: "var(--muted)" }}>{d.pct}% tổng sessions</p>
    </div>
  );
}

function UserBehaviorClient() {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getGA4Analytics();
      if (res.success && res.data) {
        setData(res.data as GA4Data);
      } else {
        setError((res as { message?: string }).message || "Không tải được dữ liệu GA4");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const trackingOn = Boolean(GA_MEASUREMENT_ID);

  const trafficStats = useMemo(() => {
    const rows = data?.trafficSources ?? [];
    const totalSessions = rows.reduce((s, r) => s + (r.sessions ?? 0), 0);
    const totalUsers = rows.reduce((s, r) => s + (r.activeUsers ?? 0), 0);
    return { rows, totalSessions, totalUsers, sourceCount: rows.length };
  }, [data?.trafficSources]);

  const chartSources = useMemo(() => {
    const { rows, totalSessions } = trafficStats;
    return rows.slice(0, 8).map((r) => {
      const sessions = r.sessions ?? 0;
      const users = r.activeUsers ?? 0;
      const fullLabel = getTrafficLabel(r.source, r.medium);
      const category = getTrafficCategory(r.source, r.medium);
      const shortLabel =
        fullLabel.length > 28 ? `${fullLabel.slice(0, 26)}…` : fullLabel;
      return {
        name: shortLabel,
        fullLabel,
        category,
        sessions,
        users,
        pct: totalSessions > 0 ? Math.round((sessions / totalSessions) * 100) : 0,
      };
    });
  }, [trafficStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hành vi người dùng (GA4)"
        description="Theo dõi nguồn traffic, trang được xem và sự kiện — Google Analytics 4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Thu thập sự kiện (Web)
            </span>
          </div>
          <p className="text-sm" style={{ color: trackingOn ? "#16A34A" : "var(--muted)" }}>
            {trackingOn
              ? `Đang bật — Measurement ID: ${GA_MEASUREMENT_ID}`
              : "Chưa cấu hình NEXT_PUBLIC_GA_MEASUREMENT_ID trên Vercel"}
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Báo cáo trong Admin
            </span>
          </div>
          <p className="text-sm" style={{ color: data?.configured ? "#16A34A" : "var(--muted)" }}>
            {data?.configured
              ? `Đã kết nối GA4 Data API — ${data.period}`
              : "Cần GA4_PROPERTY_ID + GA4_SERVICE_ACCOUNT_JSON trên Render"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}
        >
          <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          Làm mới
        </button>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text)" }}
        >
          Mở Google Analytics
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {loading && !data && (
        <div className="flex justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--muted)" }} />
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      {!data?.configured && !loading && (
        <div
          className="rounded-2xl p-6 space-y-3 text-sm"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text)" }}>
            Hướng dẫn cấu hình GA4
          </p>
          <ol className="list-decimal list-inside space-y-2" style={{ color: "var(--muted)" }}>
            <li>Tạo property GA4 tại Google Analytics → lấy <strong>Measurement ID</strong> (G-XXXX).</li>
            <li>Thêm <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code> trên Vercel (web).</li>
            <li>Tạo Service Account trên Google Cloud → bật <strong>Google Analytics Data API</strong>.</li>
            <li>Thêm email service account vào GA4 (Quyền truy cập → Viewer).</li>
            <li>Thêm <code>GA4_PROPERTY_ID</code> (số) và <code>GA4_SERVICE_ACCOUNT_JSON</code> (JSON một dòng) trên Render (backend).</li>
          </ol>
        </div>
      )}

      {data?.configured && (
        <>
          {chartSources.length > 0 && (
            <Section title="Nguồn traffic (Sessions)" icon={Globe}>
              <div className="px-3 pt-2 pb-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Tổng sessions
                    </p>
                    <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                      {trafficStats.totalSessions}
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      <Users className="w-3 h-3" /> Tổng users (theo nguồn)
                    </p>
                    <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                      {trafficStats.totalUsers}
                    </p>
                  </div>
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Số nguồn traffic
                    </p>
                    <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
                      {trafficStats.sourceCount}
                    </p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={Math.max(220, chartSources.length * 44)}>
                  <BarChart
                    data={chartSources}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={200}
                      tick={{ fontSize: 11, fill: "var(--text)" }}
                    />
                    <Tooltip content={<TrafficTooltip />} />
                    <Bar dataKey="sessions" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {chartSources.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <DataTable
                  headers={["Nguồn traffic", "Loại", "Sessions", "Users", "% Sessions"]}
                  rows={data.trafficSources ?? []}
                  renderRow={(r, idx) => {
                    const sessions = r.sessions ?? 0;
                    const pct =
                      trafficStats.totalSessions > 0
                        ? Math.round((sessions / trafficStats.totalSessions) * 100)
                        : 0;
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5">
                          <p className="font-medium" style={{ color: "var(--text)" }}>
                            {getTrafficLabel(r.source, r.medium)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            {getSourceLabel(r.source)} · {getMediumLabel(r.medium)}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: "var(--background)",
                              color: "var(--primary)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {getTrafficCategory(r.source, r.medium)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-medium">{sessions}</td>
                        <td className="px-4 py-2.5">{r.activeUsers}</td>
                        <td className="px-4 py-2.5" style={{ color: "var(--muted)" }}>
                          {pct}%
                        </td>
                      </tr>
                    );
                  }}
                />
              </div>
            </Section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Section title="Trang Admin được xem" icon={Shield}>
              <DataTable
                headers={["Tên trang", "Lượt xem", "Users"]}
                rows={data.adminPages ?? []}
                renderRow={(r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <PageNameCell path={r.pagePath} />
                    <td className="px-4 py-2.5 font-medium">{r.pageViews}</td>
                    <td className="px-4 py-2.5">{r.activeUsers}</td>
                  </tr>
                )}
              />
            </Section>

            <Section title="Sự kiện GA4" icon={MousePointerClick}>
              <DataTable
                headers={["Sự kiện", "Mô tả", "Số lần"]}
                rows={data.topEvents ?? []}
                renderRow={(r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--muted)" }}>
                      {r.eventName}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{getEventLabel(r.eventName)}</td>
                    <td className="px-4 py-2.5 font-medium">{r.eventCount}</td>
                  </tr>
                )}
              />
            </Section>
          </div>

          <Section title="Trang phổ biến (toàn site)" icon={Activity}>
            <DataTable
              headers={["Tên trang", "Lượt xem", "Users"]}
              rows={data.topPages ?? []}
              renderRow={(r, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <PageNameCell path={r.pagePath} />
                  <td className="px-4 py-2.5 font-medium">{r.pageViews}</td>
                  <td className="px-4 py-2.5">{r.activeUsers}</td>
                </tr>
              )}
            />
          </Section>
        </>
      )}

      {!data?.configured && !loading && !error && (
        <EmptyState
          icon={Activity}
          title="Chưa có báo cáo GA4"
          description="Cấu hình biến môi trường để xem nguồn traffic và hành vi người dùng ngay trong admin."
        />
      )}
    </div>
  );
}

export default function UserBehaviorPage() {
  return <UserBehaviorClient />;
}
