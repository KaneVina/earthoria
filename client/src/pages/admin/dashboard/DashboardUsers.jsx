import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, Baby, Lock } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../../services/api";
import {
  T,
  PALETTE,
  EmptyState,
  MiniKpiGrid,
  SimpleTooltip,
  RankedList,
  CardHeader,
} from "./dashboardShared";
import DateRangeFilter, { rangeFromPreset } from "./DateRangeFilter";

const ROLE_LABEL = {
  CUSTOMER: "Khách hàng",
  DEALER: "Đại lý",
  STAFF: "Nhân viên",
  ADMIN: "Quản trị",
};

export default function DashboardUsers() {
  const [range, setRange] = useState(() => ({
    preset: "30d",
    ...rangeFromPreset(30),
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-users", range.from, range.to],
    queryFn: () =>
      api
        .get("/admin/dashboard/users", {
          params: { from: range.from, to: range.to },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Tổng khách hàng",
      value: stats?.totalCustomers ?? "-",
      icon: Users,
      color: T.blue,
    },
    {
      label: "Đang hoạt động",
      value: stats?.activeCustomers ?? "-",
      icon: UserCheck,
      color: T.green,
      sub: "tài khoản isActive",
    },
    {
      label: "Đã khoá",
      value: stats?.inactiveCustomers ?? "-",
      icon: UserX,
      color: T.red,
    },
    {
      label: "Hồ sơ trẻ em",
      value: stats?.totalChildren ?? "-",
      icon: Baby,
      color: T.amber,
    },
    {
      label: "Trẻ đang khoá AR",
      value: stats?.lockedChildren ?? "-",
      icon: Lock,
      color: T.purple,
    },
  ];

  return (
    <>
      <DateRangeFilter value={range} onChange={setRange} />

      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Tăng trưởng người dùng 12 tháng - biểu đồ macro, không đổi theo bộ lọc ngày */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Tăng trưởng <em>người dùng</em>
              </>
            }
            sub="12 tháng gần nhất - lũy kế"
            exportProps={{
              filename: "tang-truong-nguoi-dung-12-thang",
              columns: [
                { key: "month", label: "Tháng" },
                { key: "new", label: "Mới" },
                { key: "total", label: "Tổng tích luỹ" },
              ],
              rows: data?.userGrowthChart ?? [],
            }}
          />
          {data?.userGrowthChart?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={data.userGrowthChart}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gUserGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.forest} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.forest} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={T.grid} />
                <XAxis
                  dataKey="month"
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
                <Tooltip content={<SimpleTooltip unit=" người" />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Tổng tích luỹ"
                  stroke={T.forest}
                  fill="url(#gUserGrowth)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>

        {/* Người dùng mới - theo khoảng thời gian đã chọn */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Đăng ký <em>mới</em>
              </>
            }
            sub={`${range.from} → ${range.to}, theo ngày`}
            exportProps={{
              filename: "dang-ky-moi-theo-ngay",
              columns: [
                { key: "date", label: "Ngày" },
                { key: "count", label: "Số đăng ký mới" },
              ],
              rows: data?.newUsersChart ?? [],
            }}
          />
          {data?.newUsersChart?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.newUsersChart}>
                <CartesianGrid vertical={false} stroke={T.grid} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 9 }}
                  interval={Math.max(
                    0,
                    Math.ceil(data.newUsersChart.length / 8) - 1,
                  )}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<SimpleTooltip unit=" người" />}
                  cursor={{ fill: "rgba(13,51,48,0.04)" }}
                />
                <Bar
                  dataKey="count"
                  name="Đăng ký mới"
                  fill={T.blue}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>
      </div>

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Vai trò + giới tính */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Phân bổ <em>vai trò</em>
              </>
            }
            sub="Toàn hệ thống"
            exportProps={{
              filename: "phan-bo-vai-tro",
              columns: [
                { key: "title", label: "Vai trò" },
                { key: "value", label: "Số lượng" },
              ],
              rows: (data?.roleBreakdown ?? []).map((r) => ({
                title: ROLE_LABEL[r.role] ?? r.role,
                value: r.count,
              })),
            }}
          />
          <RankedList
            isLoading={isLoading}
            items={(data?.roleBreakdown ?? []).map((r) => ({
              title: ROLE_LABEL[r.role] ?? r.role,
              value: r.count,
            }))}
          />
        </div>

        {/* Giới tính */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Giới tính <em>khách hàng</em>
              </>
            }
            sub="Thông tin đã cập nhật"
            exportProps={{
              filename: "gioi-tinh-khach-hang",
              columns: [
                { key: "name", label: "Giới tính" },
                { key: "value", label: "Số lượng" },
              ],
              rows: data?.genderBreakdown ?? [],
            }}
          />
          {data?.genderBreakdown?.length ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.genderBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.genderBreakdown.map((entry, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} người`, name]} />
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
                {data.genderBreakdown.map((item, i) => (
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
      </div>

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Hoạt động đăng nhập */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Lượt <em>đăng nhập</em>
              </>
            }
            sub={`${range.from} → ${range.to} (phiên đăng nhập mới)`}
            exportProps={{
              filename: "hoat-dong-dang-nhap",
              columns: [
                { key: "date", label: "Ngày" },
                { key: "count", label: "Số lượt đăng nhập" },
              ],
              rows: data?.loginActivityChart ?? [],
            }}
          />
          {data?.loginActivityChart?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.loginActivityChart}>
                <CartesianGrid vertical={false} stroke={T.grid} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 10 }}
                  interval={Math.max(
                    0,
                    Math.ceil(data.loginActivityChart.length / 8) - 1,
                  )}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<SimpleTooltip unit=" lượt" />}
                  cursor={{ fill: "rgba(13,51,48,0.04)" }}
                />
                <Bar
                  dataKey="count"
                  name="Đăng nhập"
                  fill={T.purple}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={isLoading} />
          )}
        </div>

        {/* Thiết bị */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Thiết bị <em>truy cập</em>
              </>
            }
            sub="Mẫu 500 phiên gần nhất"
            exportProps={{
              filename: "thiet-bi-truy-cap",
              columns: [
                { key: "title", label: "Thiết bị" },
                { key: "value", label: "Số lượng" },
              ],
              rows: (data?.deviceBreakdown ?? []).map((d) => ({
                title: d.name,
                value: d.value,
              })),
            }}
          />
          <RankedList
            isLoading={isLoading}
            items={(data?.deviceBreakdown ?? []).map((d) => ({
              title: d.name,
              value: d.value,
            }))}
          />
        </div>
      </div>

      <div className="a-chart-grid-2">
        {/* Top tỉnh thành */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Top tỉnh/thành <em>khách hàng</em>
              </>
            }
            sub="Theo số địa chỉ đã lưu"
            exportProps={{
              filename: "top-tinh-thanh-khach-hang",
              columns: [
                { key: "title", label: "Tỉnh/Thành" },
                { key: "value", label: "Số địa chỉ" },
              ],
              rows: (data?.topProvinces ?? []).map((p) => ({
                title: p.name,
                value: p.count,
              })),
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có địa chỉ nào"
            items={(data?.topProvinces ?? []).map((p) => ({
              title: p.name,
              value: p.count,
            }))}
          />
        </div>

        {/* Hạng thành viên */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Hạng <em>thành viên</em>
              </>
            }
            sub="Theo tổng chi tiêu (hệ thống Vùng Đất)"
            exportProps={{
              filename: "hang-thanh-vien",
              columns: [
                { key: "title", label: "Hạng" },
                { key: "value", label: "Số lượng" },
              ],
              rows: (data?.loyaltyTierBreakdown ?? []).map((t) => ({
                title: t.name,
                value: t.count,
              })),
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có dữ liệu"
            items={(data?.loyaltyTierBreakdown ?? []).map((t) => ({
              title: t.name,
              value: t.count,
            }))}
          />
        </div>
      </div>
    </>
  );
}
