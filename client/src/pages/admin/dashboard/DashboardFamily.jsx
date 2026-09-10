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
} from "./dashboardShared";

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
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-family"],
    queryFn: () => api.get("/admin/dashboard/family").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Trẻ đang hoạt động",
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
      sub: stats ? `${stats.totalGardens} khu vườn` : null,
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
      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Nhóm tuổi */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Nhóm <em>tuổi</em>
            </h3>
            <p className="a-chart-sub">Hồ sơ trẻ đang hoạt động</p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Yêu cầu <em>mua sách</em>
            </h3>
            <p className="a-chart-sub">"Nhờ ba mẹ mua" từ trang /e-kid</p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Trẻ <em>hoạt động nhiều nhất</em>
            </h3>
            <p className="a-chart-sub">Theo tổng phút đọc/xem AR</p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Hành động <em>phụ huynh</em>
            </h3>
            <p className="a-chart-sub">Loại hành động phổ biến nhất</p>
          </div>
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
