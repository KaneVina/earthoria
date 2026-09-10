import { useQuery } from "@tanstack/react-query";
import { Inbox, MessageCircleReply, CheckCircle2, Ticket } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../../services/api";
import { formatDate } from "../../../utils/helpers";
import {
  T,
  EmptyState,
  MiniKpiGrid,
  SimpleTooltip,
  RankedList,
} from "./dashboardShared";

const STATUS_CLS = {
  NEW: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "dark",
};

export default function DashboardSupport() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-support"],
    queryFn: () => api.get("/admin/dashboard/support").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Tổng ticket",
      value: stats?.totalTickets ?? "-",
      icon: Ticket,
      color: T.forest,
    },
    {
      label: "Đang mở",
      value: stats?.openTickets ?? "-",
      icon: Inbox,
      color: T.amber,
      sub: "Mới + Đang xử lý",
    },
    {
      label: "Đã xử lý",
      value: stats?.resolvedTickets ?? "-",
      icon: CheckCircle2,
      color: T.green,
    },
    {
      label: "Phản hồi TB / ticket",
      value: stats?.avgRepliesPerTicket ?? "-",
      icon: MessageCircleReply,
      color: T.blue,
    },
  ];

  return (
    <>
      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-card" style={{ marginBottom: 24 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Ticket <em>mới</em>
          </h3>
          <p className="a-chart-sub">7 ngày gần nhất</p>
        </div>
        {data?.newTicketsChart?.length ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={data.newTicketsChart}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.amber} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={T.grid} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<SimpleTooltip unit=" ticket" />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Ticket mới"
                stroke={T.amber}
                fill="url(#gTickets)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={isLoading} />
        )}
      </div>

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Trạng thái */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Trạng thái <em>ticket</em>
            </h3>
          </div>
          <RankedList
            isLoading={isLoading}
            items={(data?.statusBreakdown ?? []).map((s) => ({
              title: s.name,
              value: s.value,
            }))}
          />
        </div>

        {/* Chủ đề */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Chủ đề <em>liên hệ</em>
            </h3>
          </div>
          <RankedList
            isLoading={isLoading}
            items={(data?.subjectBreakdown ?? []).map((s) => ({
              title: s.name,
              value: s.value,
            }))}
          />
        </div>
      </div>

      {/* Ticket gần đây */}
      <div className="a-table-card">
        <div className="a-table-head">
          <h3 className="a-table-title">
            Ticket <em>gần đây</em>
          </h3>
        </div>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {["Mã", "Người gửi", "Chủ đề", "Trạng thái", "Ngày gửi"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : !data?.recentTickets?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "rgba(13,51,48,0.3)",
                    }}
                  >
                    Chưa có ticket nào
                  </td>
                </tr>
              ) : (
                data.recentTickets.map((t) => (
                  <tr key={t.code}>
                    <td className="a-td-mono">{t.code}</td>
                    <td style={{ fontSize: 12.5 }}>{t.name}</td>
                    <td className="a-td-muted">{t.subjectLabel}</td>
                    <td>
                      <span
                        className={`a-badge ${STATUS_CLS[t.status] ?? "info"}`}
                      >
                        {t.statusLabel}
                      </span>
                    </td>
                    <td className="a-td-muted">{formatDate(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
