import { useQuery } from "@tanstack/react-query";
import { Star, Gamepad2, Scan, Clock, Heart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../../services/api";
import {
  T,
  EmptyState,
  MiniKpiGrid,
  SimpleTooltip,
  RankedList,
} from "./dashboardShared";

export default function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-content"],
    queryFn: () => api.get("/admin/dashboard/content").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Đánh giá",
      value: stats?.totalReviews ?? "-",
      icon: Star,
      color: T.amber,
      sub: stats ? `Điểm TB ${stats.avgRating}/5` : null,
    },
    {
      label: "Lượt chơi game",
      value: stats?.totalGamePlays ?? "-",
      icon: Gamepad2,
      color: T.purple,
      sub: stats ? `Điểm TB ${stats.avgGameScore}` : null,
    },
    {
      label: "Thời lượng chơi TB",
      value: stats ? `${stats.avgGameDurationSeconds}s` : "-",
      icon: Clock,
      color: T.blue,
    },
  ];

  return (
    <>
      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Top game */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Top <em>trò chơi</em>
            </h3>
            <p className="a-chart-sub">Theo tổng lượt chơi</p>
          </div>
          {data?.topGames?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.topGames.map((g) => ({ ...g, name: g.title }))}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke={T.grid} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: T.tick, fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  content={<SimpleTooltip unit=" lượt" />}
                  cursor={{ fill: "rgba(13,51,48,0.03)" }}
                />
                <Bar
                  dataKey="playCount"
                  name="Lượt chơi"
                  fill={T.purple}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={isLoading} emptyText="Chưa có lượt chơi nào" />
          )}
        </div>

        {/* Top AR scan */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Top <em>mã AR quét nhiều</em>
            </h3>
            <p className="a-chart-sub">Theo tổng lượt quét</p>
          </div>
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có lượt quét nào"
            items={(data?.topArCodes ?? []).map((a) => ({
              title: `${a.label} · ${a.book?.title ?? ""}`,
              value: a.scanCount,
            }))}
            renderRight={(item) => (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Scan size={11} /> {item.value}
              </span>
            )}
          />
        </div>
      </div>

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Sách đọc nhiều nhất (qua ChildActivityLog) */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Sách <em>đọc nhiều nhất</em>
            </h3>
            <p className="a-chart-sub">Theo tổng phút đọc/xem AR của trẻ</p>
          </div>
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có phiên đọc nào"
            items={(data?.topReadBooks ?? []).map((b) => ({
              title: b.title,
              value: `${b.minutes} phút`,
            }))}
          />
        </div>

        {/* Wishlist */}
        <div className="a-chart-card">
          <div className="a-chart-card-header">
            <h3 className="a-chart-title">
              Top <em>yêu thích</em>
            </h3>
            <p className="a-chart-sub">
              Sách được thêm vào wishlist nhiều nhất
            </p>
          </div>
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có wishlist nào"
            items={(data?.topWishlistBooks ?? []).map((w) => ({
              title: w.title,
              value: w.count,
            }))}
            renderRight={(item) => (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Heart size={11} color={T.red} /> {item.value}
              </span>
            )}
          />
        </div>
      </div>

      {/* Phân bổ đánh giá sao */}
      <div className="a-chart-card">
        <div className="a-chart-card-header">
          <h3 className="a-chart-title">
            Phân bổ <em>đánh giá</em>
          </h3>
          <p className="a-chart-sub">Số lượng đánh giá theo mức sao</p>
        </div>
        {data?.ratingBreakdown?.length ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.ratingBreakdown}>
              <CartesianGrid vertical={false} stroke={T.grid} />
              <XAxis
                dataKey="star"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
                tickFormatter={(v) => `${v} sao`}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.tick, fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                content={<SimpleTooltip unit=" đánh giá" />}
                cursor={{ fill: "rgba(13,51,48,0.04)" }}
              />
              <Bar
                dataKey="count"
                name="Đánh giá"
                fill={T.amber}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState loading={isLoading} />
        )}
      </div>
    </>
  );
}
