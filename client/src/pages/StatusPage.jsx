import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Clock3,
} from "lucide-react";
import { statusService } from "../services/statusService";
import "../components/assets/css/statuspage.css";

const REFRESH_MS = 60 * 1000; // khớp với thời gian cache 60s ở server

async function fetchStatus() {
  const res = await statusService.getPublicStatus();
  return res.data;
}

// Cấu hình hiển thị theo từng trạng thái trả về từ server
const STATUS_META = {
  up: {
    label: "Hoạt động bình thường",
    color: "#4a9e3f",
    icon: CheckCircle2,
    desc: "Tất cả hệ thống của Earthoria đang hoạt động ổn định.",
  },
  seems_down: {
    label: "Có thể đang gián đoạn",
    color: "#eda100",
    icon: AlertTriangle,
    desc: "Hệ thống có dấu hiệu chập chờn, đội kỹ thuật đang theo dõi.",
  },
  down: {
    label: "Đang ngừng hoạt động",
    color: "#e34948",
    icon: XCircle,
    desc: "Server đang gặp sự cố, chúng tôi đang khắc phục nhanh nhất có thể.",
  },
  paused: {
    label: "Tạm dừng giám sát",
    color: "#8a9990",
    icon: HelpCircle,
    desc: "Giám sát trạng thái đang tạm dừng.",
  },
  not_checked_yet: {
    label: "Chưa có dữ liệu kiểm tra",
    color: "#8a9990",
    icon: Clock3,
    desc: "Hệ thống giám sát chưa ghi nhận lần kiểm tra nào.",
  },
  unknown: {
    label: "Không thể kiểm tra lúc này",
    color: "#8a9990",
    icon: HelpCircle,
    desc: "Không thể lấy dữ liệu trạng thái ngay lúc này, vui lòng thử lại sau.",
  },
};

export default function StatusPage() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["public-status"],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS - 5000,
  });

  const statusKey = isLoading ? null : data?.status || "unknown";
  const meta = statusKey ? STATUS_META[statusKey] || STATUS_META.unknown : null;
  const Icon = meta?.icon || Activity;

  const uptime =
    data?.uptimeRatio30d !== null && data?.uptimeRatio30d !== undefined
      ? `${data.uptimeRatio30d}%`
      : "—";
  const avgMs = data?.avgResponseMs ? `${data.avgResponseMs}ms` : "—";
  const checkedAt = data?.checkedAt
    ? new Date(data.checkedAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <div className="status-page">
      <div className="status-page__inner">
        <div className="status-page__hero">
          <div className="status-page__eyebrow">
            <Activity size={14} />
            Trạng thái hệ thống
          </div>
          <h1 className="status-page__title">
            Earthoria đang hoạt động ra sao?
          </h1>
          <p className="status-page__subtitle">
            Theo dõi tình trạng hoạt động thời gian thực của server Earthoria.
            Dữ liệu được cập nhật tự động mỗi phút.
          </p>
        </div>

        <div className="status-card">
          <div className="status-card__top">
            <div
              className="status-card__icon"
              style={{ background: `${meta?.color || "#8a9990"}18` }}
            >
              <Icon
                size={26}
                color={meta?.color || "#8a9990"}
                strokeWidth={2}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p className="status-card__label">Trạng thái hiện tại</p>
              <p
                className="status-card__value"
                style={{ color: meta?.color || "#8a9990" }}
              >
                {isLoading ? "Đang kiểm tra..." : meta.label}
              </p>
            </div>
            {!isLoading && (
              <span
                className="status-card__pulse"
                style={{ background: meta?.color }}
              />
            )}
          </div>

          <p
            style={{
              margin: "0 0 24px",
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            {isLoading ? "Đang tải dữ liệu giám sát..." : meta.desc}
          </p>

          <div className="status-card__grid">
            <div className="status-card__stat">
              <p className="status-card__stat-label">Uptime 30 ngày</p>
              <p className="status-card__stat-value">
                {isLoading ? "—" : uptime}
              </p>
            </div>
            <div className="status-card__stat">
              <p className="status-card__stat-label">Thời gian phản hồi</p>
              <p className="status-card__stat-value">
                {isLoading ? "—" : avgMs}
              </p>
            </div>
            <div className="status-card__stat">
              <p className="status-card__stat-label">Kiểm tra lúc</p>
              <p className="status-card__stat-value" style={{ fontSize: 15 }}>
                {isLoading ? "—" : checkedAt}
              </p>
            </div>
          </div>
        </div>

        <div className="status-page__footnote">
          <span>Tự động làm mới mỗi 60 giây</span>
          <button
            type="button"
            className="status-page__refresh-btn"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={13} className={isFetching ? "spin" : ""} />
            Làm mới ngay
          </button>
        </div>
      </div>
    </div>
  );
}
