import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Baby, Clock, Trees, Flame } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../../services/api";
import {
  T,
  PALETTE,
  EmptyState,
  MiniKpiGrid,
  RankedList,
  CardHeader,
} from "./dashboardShared";
import DateRangeFilter, { rangeFromPreset } from "./DateRangeFilter";

const AUDIT_LABEL = {
  CHILD_CREATED: "Tạo hồ sơ trẻ",
  CHILD_UPDATED: "Cập nhật hồ sơ",
  CHILD_ARCHIVED: "Lưu trữ hồ sơ",
  LOCK: "Khoá AR",
  UNLOCK: "Mở khoá AR",
  SETTINGS_UPDATE: "Cập nhật cài đặt",
  BOOK_VISIBILITY: "Ẩn/hiện sách",
  PARENT_PIN_SET: "Đặt mã PIN",
  PARENT_PIN_CHANGED: "Đổi mã PIN",
  PARENT_PIN_RESET: "Reset mã PIN",
  CHILD_DELETED: "Xoá hồ sơ trẻ",
  KID_LINK_REGENERATED: "Tạo lại liên kết",
  DAILY_LIMIT_EXCEEDED: "Vượt giới hạn ngày",
  SKIPPED_REST: "Bỏ qua nghỉ mắt",
  BOOK_REQUEST_CREATED: "Yêu cầu mua sách",
  BOOK_REQUEST_RESPONDED: "Phản hồi yêu cầu",
};

export default function DashboardFamily() {
  const [range, setRange] = useState(() => ({
    preset: "30d",
    ...rangeFromPreset(30),
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-family", range.from, range.to],
    queryFn: () =>
      api
        .get("/admin/dashboard/family", {
          params: { from: range.from, to: range.to },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Trẻ hoạt động (tạo trong kỳ)",
      value: stats?.totalActiveChildren ?? "-",
      icon: Baby,
      color: T.amber,
    },
    {
      label: "Giới hạn giờ TB",
      value: stats ? `${stats.avgDailyLimitMinutes} phút/ngày` : "-",
      icon: Clock,
      color: T.blue,
    },
    {
      label: "Cấp độ rừng TB",
      value: stats?.avgForestLevel ?? "-",
      icon: Trees,
      color: T.green,
      sub: stats ? `${stats.totalGardens} khu vườn (toàn thời gian)` : null,
    },
    {
      label: "Chuỗi ngày hiện tại TB",
      value: stats?.avgCurrentStreak ?? "-",
      icon: Flame,
      color: T.red,
      sub: stats ? `Kỷ lục TB ${stats.avgLongestStreak} ngày` : null,
    },
  ];

  return (
    <>
      <DateRangeFilter value={range} onChange={setRange} />

      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Nhóm tuổi */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Nhóm <em>tuổi</em>
              </>
            }
            sub="Hồ sơ trẻ đang hoạt động, tạo trong kỳ đã chọn"
            exportProps={{
              filename: "nhom-tuoi-tre",
              columns: [
                { key: "name", label: "Nhóm tuổi" },
                { key: "value", label: "Số trẻ" },
              ],
              rows: data?.ageBreakdown ?? [],
            }}
          />
          {data?.ageBreakdown?.some((a) => a.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.ageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.ageBreakdown.map((entry, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} trẻ`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  marginTop: 4,
                }}
              >
                {data.ageBreakdown.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "rgba(13,51,48,0.6)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: PALETTE[i % PALETTE.length],
                          display: "inline-block",
                        }}
                      />
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 500, color: T.forest }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>

        {/* Yêu cầu mua sách */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Yêu cầu <em>mua sách</em>
              </>
            }
            sub={'"Nhờ ba mẹ mua" từ trang /e-kid, trong kỳ đã chọn'}
            exportProps={{
              filename: "yeu-cau-mua-sach",
              columns: [
                { key: "name", label: "Trạng thái" },
                { key: "value", label: "Số lượng" },
              ],
              rows: data?.bookRequestBreakdown ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có yêu cầu nào"
            items={(data?.bookRequestBreakdown ?? []).map((r) => ({
              title: r.name,
              value: r.value,
            }))}
          />
        </div>
      </div>

      <div className="a-chart-grid-2">
        {/* Trẻ hoạt động nhiều nhất */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Trẻ <em>hoạt động nhiều nhất</em>
              </>
            }
            sub="Theo tổng phút đọc/xem AR, trong kỳ đã chọn"
            exportProps={{
              filename: "tre-hoat-dong-nhieu-nhat",
              columns: [
                { key: "name", label: "Tên trẻ" },
                { key: "minutes", label: "Tổng phút" },
              ],
              rows: data?.mostActiveChildren ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có dữ liệu hoạt động"
            items={(data?.mostActiveChildren ?? []).map((c) => ({
              title: `${c.emoji} ${c.name}`,
              value: `${c.minutes} phút`,
            }))}
          />
        </div>

        {/* Nhật ký hành động phụ huynh */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Hành động <em>phụ huynh</em>
              </>
            }
            sub="Loại hành động phổ biến nhất, trong kỳ đã chọn"
            exportProps={{
              filename: "hanh-dong-phu-huynh",
              columns: [
                { key: "type", label: "Loại hành động" },
                { key: "count", label: "Số lần" },
              ],
              rows: data?.auditTypeBreakdown ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có nhật ký nào"
            items={(data?.auditTypeBreakdown ?? []).map((a) => ({
              title: AUDIT_LABEL[a.type] ?? a.type,
              value: a.count,
            }))}
          />
        </div>
      </div>
    </>
  );
}
