import { useState } from "react";
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
  CardHeader,
} from "./dashboardShared";
import DateRangeFilter, { rangeFromPreset } from "./DateRangeFilter";

export default function DashboardContent() {
  const [range, setRange] = useState(() => ({
    preset: "30d",
    ...rangeFromPreset(30),
  }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-content", range.from, range.to],
    queryFn: () =>
      api
        .get("/admin/dashboard/content", {
          params: { from: range.from, to: range.to },
        })
        .then((r) => r.data.data),
    staleTime: 60_000,
  });

  const stats = data?.stats;

  const kpis = [
    {
      label: "Đánh giá trong kỳ",
      value: stats?.totalReviews ?? "-",
      icon: Star,
      color: T.amber,
      sub: stats ? `Điểm TB ${stats.avgRating}/5` : null,
    },
    {
      label: "Lượt chơi trong kỳ",
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
      <DateRangeFilter value={range} onChange={setRange} />

      <MiniKpiGrid items={kpis} isLoading={isLoading} />

      <div className="a-chart-grid-2" style={{ marginBottom: 24 }}>
        {/* Top game - lưu ý: playCount là bộ đếm cộng dồn all-time, không lọc được theo kỳ */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Top <em>trò chơi</em>
              </>
            }
            sub="Toàn thời gian (playCount cộng dồn, không tách được theo kỳ)"
            exportProps={{
              filename: "top-tro-choi",
              columns: [
                { key: "title", label: "Trò chơi" },
                { key: "playCount", label: "Lượt chơi" },
                { key: "gameType", label: "Loại" },
              ],
              rows: data?.topGames ?? [],
            }}
          />
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

        {/* Top AR scan - cũng all-time vì lý do tương tự */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Top <em>mã AR quét nhiều</em>
              </>
            }
            sub="Toàn thời gian (scanCount cộng dồn)"
            exportProps={{
              filename: "top-ma-ar",
              columns: [
                { key: "label", label: "Mã AR" },
                { key: "scanCount", label: "Lượt quét" },
              ],
              rows: data?.topArCodes ?? [],
            }}
          />
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
        {/* Sách đọc nhiều nhất trong kỳ (qua ChildActivityLog) */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Sách <em>đọc nhiều nhất</em>
              </>
            }
            sub="Theo tổng phút đọc/xem AR của trẻ, trong kỳ đã chọn"
            exportProps={{
              filename: "sach-doc-nhieu-nhat",
              columns: [
                { key: "title", label: "Sách" },
                { key: "minutes", label: "Tổng phút" },
                { key: "sessions", label: "Số phiên" },
              ],
              rows: data?.topReadBooks ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có phiên đọc nào trong kỳ"
            items={(data?.topReadBooks ?? []).map((b) => ({
              title: b.title,
              value: `${b.minutes} phút`,
            }))}
          />
        </div>

        {/* Wishlist trong kỳ */}
        <div className="a-chart-card">
          <CardHeader
            title={
              <>
                Top <em>yêu thích</em>
              </>
            }
            sub="Sách được thêm vào wishlist nhiều nhất trong kỳ"
            exportProps={{
              filename: "top-wishlist",
              columns: [
                { key: "title", label: "Sách" },
                { key: "count", label: "Lượt thêm" },
              ],
              rows: data?.topWishlistBooks ?? [],
            }}
          />
          <RankedList
            isLoading={isLoading}
            emptyText="Chưa có wishlist nào trong kỳ"
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

      {/* Phân bổ đánh giá sao trong kỳ */}
      <div className="a-chart-card">
        <CardHeader
          title={
            <>
              Phân bổ <em>đánh giá</em>
            </>
          }
          sub="Số lượng đánh giá theo mức sao, trong kỳ đã chọn"
          exportProps={{
            filename: "phan-bo-danh-gia",
            columns: [
              { key: "star", label: "Số sao" },
              { key: "count", label: "Số lượng" },
            ],
            rows: data?.ratingBreakdown ?? [],
          }}
        />
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
