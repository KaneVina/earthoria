import { useState } from "react";
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
  CardHeader,
  ExportCsvButton,
} from "./dashboardShared";
import DateRangeFilter, { rangeFromPreset } from "./DateRangeFilter";
import { AdminSkeletonRows } from "../../../components/skeletons/SkeletonAdmin";

const STATUS_CLS = {
  NEW: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "dark",
};

export default function DashboardSupport() {
  const [range, setRange] = useState(() => ({
    preset: "30d",
    ...rangeFromPreset(30),
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-support", range.from, range.to],
    queryFn: () =>
      api
        .get("/admin/dashboard/support", {
          params: { from: range.from, to: range.to },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Tổng ticket trong kỳ",
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
      <DateRangeFilter value={range} onChange={setRange} />

      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-card" style={{ marginBottom: 24 }}>
        <CardHeader
          title={
            <>
              Ticket <em>mới</em>
            </>
          }
          sub={`${range.from} → ${range.to}`}
          exportProps={{
            filename: "ticket-moi-theo-ngay",
            columns: [
              { key: "day", label: "Thời điểm" },
              { key: "count", label: "Số ticket" },
            ],
            rows: data?.newTicketsChart ?? [],
          }}
        />
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
          <CardHeader
            title={
              <>
                Trạng thái <em>ticket</em>
              </>
            }
            exportProps={{
              filename: "trang-thai-ticket",
              columns: [
                { key: "name", label: "Trạng thái" },
                { key: "value", label: "Số lượng" },
              ],
              rows: data?.statusBreakdown ?? [],
            }}
          />
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
          <CardHeader
            title={
              <>
                Chủ đề <em>liên hệ</em>
              </>
            }
            exportProps={{
              filename: "chu-de-lien-he",
              columns: [
                { key: "name", label: "Chủ đề" },
                { key: "value", label: "Số lượng" },
              ],
              rows: data?.subjectBreakdown ?? [],
            }}
          />
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
        <div
          className="a-table-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 className="a-table-title">
            Ticket <em>gần đây</em>
          </h3>
          <ExportCsvButton
            filename="ticket-gan-day"
            columns={[
              { key: "code", label: "Mã" },
              { key: "name", label: "Người gửi" },
              { key: "subjectLabel", label: "Chủ đề" },
              { key: "statusLabel", label: "Trạng thái" },
              { key: "createdAt", label: "Ngày gửi" },
            ]}
            rows={data?.recentTickets ?? []}
          />
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
                <AdminSkeletonRows columns={5} rows={5} />
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
                    Chưa có ticket nào trong kỳ
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
