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
} from "./dashboardShared";

export default function DashboardSales() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-sales"],
    queryFn: () => api.get("/admin/dashboard/sales").then((r) => r.data.data),
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
      sub: stats ? `${stats.totalCoupons} mã đang có` : null,
    },
  ];

  return (
    <>
      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-card" style={{ marginBottom: 24 }}>
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Đơn hàng & doanh thu <em>30 ngày</em>
          </h3>
          <p className="a-chart-sub">
            Doanh thu tính theo triệu VNĐ, chỉ đơn đã thanh toán
          </p>
        </div>
        {data?.ordersChart30d?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ordersChart30d} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke={T.grid} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 9 }}
                interval={3}
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Phương thức <em>thanh toán</em>
            </h3>
            <p className="a-chart-sub">
              Đơn đã thanh toán, doanh thu (triệu VNĐ)
            </p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Ebook <em>vs Sách giấy</em>
            </h3>
            <p className="a-chart-sub">Đơn đã thanh toán</p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Top danh mục <em>theo lượt bán</em>
            </h3>
            <p className="a-chart-sub">
              Tổng số lượng sách bán (mọi thời điểm)
            </p>
          </div>
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
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Mã giảm giá <em>dùng nhiều nhất</em>
            </h3>
            <p className="a-chart-sub">Số lượt sử dụng / giới hạn</p>
          </div>
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
