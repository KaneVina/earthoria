import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, XCircle, RotateCcw, ShoppingCart, Tag } from "lucide-react";
import {
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
import { formatPrice } from "../../../utils/helpers";
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

export default function DashboardSales() {
  const [range, setRange] = useState(() => ({
    preset: "30d",
    ...rangeFromPreset(30),
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-sales", range.from, range.to],
    queryFn: () =>
      api
        .get("/admin/dashboard/sales", {
          params: { from: range.from, to: range.to },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Giá trị đơn TB",
      value: isLoading ? "-" : formatPrice(stats?.avgOrderValue ?? 0),
      icon: Wallet,
      color: T.forest,
    },
    {
      label: "Đơn đã huỷ",
      value: stats?.cancelledCount ?? "-",
      icon: XCircle,
      color: T.red,
    },
    {
      label: "Đơn hoàn tiền",
      value: stats?.refundedCount ?? "-",
      icon: RotateCcw,
      color: T.purple,
    },
    {
      label: "Giỏ hàng còn treo",
      value: stats?.activeCartsWithItems ?? "-",
      icon: ShoppingCart,
      color: T.amber,
      sub: stats ? `≈ ${stats.cartAbandonmentRate}% tỉ lệ bỏ giỏ` : null,
    },
    {
      label: "Lượt dùng coupon",
      value: stats?.totalCouponUses ?? "-",
      icon: Tag,
      color: T.blue,
      sub: stats ? `${stats.totalCoupons} mã tạo trong kỳ` : null,
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
              Đơn hàng & <em>doanh thu</em>
            </>
          }
          sub={`${range.from} → ${range.to} · doanh thu tính theo triệu VNĐ, chỉ đơn đã thanh toán`}
          exportProps={{
            filename: "don-hang-doanh-thu",
            columns: [
              { key: "day", label: "Thời điểm" },
              { key: "orders", label: "Số đơn" },
              { key: "revenue", label: "Doanh thu (triệu VNĐ)" },
            ],
            rows: data?.ordersChart ?? [],
          }}
        />
        {data?.ordersChart?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ordersChart} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke={T.grid} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 9 }}
                interval={Math.max(
                  0,
                  Math.ceil(data.ordersChart.length / 10) - 1,
                )}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
              />
              <Tooltip
                content={<SimpleTooltip />}
                cursor={{ fill: "rgba(13,51,48,0.04)" }}
              />
              <Bar
                dataKey="revenue"
                name="Doanh thu (M)"
                fill={T.forest}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="orders"
                name="Số đơn"
                fill={T.green}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={isLoading} />
        )}
      </div>

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Phương thức thanh toán */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Phương thức <em>thanh toán</em>
              </>
            }
            sub="Đơn đã thanh toán trong kỳ, doanh thu (triệu VNĐ)"
            exportProps={{
              filename: "phuong-thuc-thanh-toan",
              columns: [
                { key: "name", label: "Phương thức" },
                { key: "orders", label: "Số đơn" },
                { key: "revenue", label: "Doanh thu (triệu VNĐ)" },
              ],
              rows: data?.paymentMethodBreakdown ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có đơn thanh toán"
            items={(data?.paymentMethodBreakdown ?? []).map((p) => ({
              title: `${p.name} (${p.orders} đơn)`,
              value: `${p.revenue}M`,
            }))}
          />
        </div>

        {/* Ebook vs sách giấy */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Ebook <em>vs Sách giấy</em>
              </>
            }
            sub="Đơn đã thanh toán trong kỳ"
            exportProps={{
              filename: "ebook-vs-sach-giay",
              columns: [
                { key: "name", label: "Định dạng" },
                { key: "orders", label: "Số đơn" },
                { key: "revenue", label: "Doanh thu (triệu VNĐ)" },
              ],
              rows: data?.formatBreakdown ?? [],
            }}
          />
          {data?.formatBreakdown?.length ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={data.formatBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="orders"
                  >
                    {data.formatBreakdown.map((entry, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} đơn`, name]} />
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
                {data.formatBreakdown.map((item, i) => (
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
                      {item.revenue}M
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

      <div className="a-chart-grid-2">
        {/* Top danh mục theo số đơn */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Top danh mục <em>theo lượt bán</em>
              </>
            }
            sub="Tổng số lượng sách bán trong kỳ đã chọn"
            exportProps={{
              filename: "top-danh-muc-theo-luot-ban",
              columns: [
                { key: "name", label: "Danh mục" },
                { key: "sold", label: "Số lượng bán" },
              ],
              rows: data?.topCategoriesByOrders ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có dữ liệu"
            items={(data?.topCategoriesByOrders ?? []).map((c) => ({
              title: c.name,
              value: `${c.sold} cuốn`,
            }))}
          />
        </div>

        {/* Top coupon */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Mã giảm giá <em>dùng nhiều nhất</em>
              </>
            }
            sub="Mã tạo trong kỳ đã chọn, sắp theo số lượt dùng"
            exportProps={{
              filename: "top-ma-giam-gia",
              columns: [
                { key: "code", label: "Mã" },
                { key: "usedCount", label: "Đã dùng" },
                { key: "usageLimit", label: "Giới hạn" },
              ],
              rows: data?.topCoupons ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có coupon nào"
            items={(data?.topCoupons ?? []).map((c) => ({
              title: c.code,
              value: `${c.usedCount}${c.usageLimit ? `/${c.usageLimit}` : ""}`,
            }))}
          />
        </div>
      </div>
    </>
  );
}
