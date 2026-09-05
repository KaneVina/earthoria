import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Clock3,
  Gauge,
  Zap,
  Terminal,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { statusService } from "../services/statusService";
import { settingsService } from "../services/settingsService";
import "../components/assets/css/statuspage.css";

const REFRESH_MS = 60 * 1000; // khớp với thời gian cache 60s ở server

// Chuỗi điểm cho sóng nhịp tim trang trí ở banner — 1 chu kỳ dài 200 đơn vị,
// lặp lại 4 lần (=800) để cuộn vô hạn không giật khi dịch đúng 1 chu kỳ.
const PULSE_POINTS =
  "0,30 20,30 34,30 40,18 46,30 54,30 60,6 66,54 72,26 78,34 82,30 100,30 120,30 134,30 140,18 146,30 154,30 160,6 166,54 172,26 178,34 182,30 200,30 220,30 234,30 240,18 246,30 254,30 260,6 266,54 272,26 278,34 282,30 300,30 320,30 334,30 340,18 346,30 354,30 360,6 366,54 372,26 378,34 382,30 400,30 420,30 434,30 440,18 446,30 454,30 460,6 466,54 472,26 478,34 482,30 500,30 520,30 534,30 540,18 546,30 554,30 560,6 566,54 572,26 578,34 582,30 600,30 620,30 634,30 640,18 646,30 654,30 660,6 666,54 672,26 678,34 682,30 700,30 720,30 734,30 740,18 746,30 754,30 760,6 766,54 772,26 778,34 782,30 800,30";

async function fetchStatus() {
  const res = await statusService.getPublicStatus();
  return res.data;
}

// Cấu hình hiển thị theo từng trạng thái trả về từ server
const STATUS_META = {
  up: {
    label: "Hoạt động bình thường",
    tag: "OPERATIONAL",
    color: "#4a9e3f",
    icon: CheckCircle2,
    desc: "Tất cả hệ thống của Earthoria đang hoạt động ổn định.",
  },
  seems_down: {
    label: "Có thể đang gián đoạn",
    tag: "DEGRADED",
    color: "#eda100",
    icon: AlertTriangle,
    desc: "Hệ thống có dấu hiệu chập chờn, đội kỹ thuật đang theo dõi.",
  },
  down: {
    label: "Đang ngừng hoạt động",
    tag: "OUTAGE",
    color: "#e34948",
    icon: XCircle,
    desc: "Server đang gặp sự cố, chúng tôi đang khắc phục nhanh nhất có thể.",
  },
  paused: {
    label: "Tạm dừng giám sát",
    tag: "PAUSED",
    color: "#8a9990",
    icon: HelpCircle,
    desc: "Giám sát trạng thái đang tạm dừng.",
  },
  maintenance: {
    label: "Đang bảo trì hệ thống",
    tag: "MAINTENANCE",
    color: "#eda100",
    icon: Wrench,
    desc: "Earthoria đang tạm ngưng để nâng cấp theo lịch đã thông báo.",
  },
  not_checked_yet: {
    label: "Chưa có dữ liệu kiểm tra",
    tag: "PENDING",
    color: "#8a9990",
    icon: Clock3,
    desc: "Hệ thống giám sát chưa ghi nhận lần kiểm tra nào.",
  },
  unknown: {
    label: "Không thể kiểm tra lúc này",
    tag: "UNKNOWN",
    color: "#8a9990",
    icon: HelpCircle,
    desc: "Không thể lấy dữ liệu trạng thái ngay lúc này, vui lòng thử lại sau.",
  },
};

// Ngưỡng đánh giá tốc độ phản hồi — chỉ dùng để tô màu/định vị con trỏ
// trên thanh gauge, không làm thay đổi số liệu thật nhận từ server.
function getResponseBand(ms) {
  if (ms === null || ms === undefined) return null;
  if (ms <= 200) return { label: "Nhanh", color: "#4a9e3f" };
  if (ms <= 500) return { label: "Bình thường", color: "#eda100" };
  return { label: "Chậm", color: "#e34948" };
}

async function fetchSiteSettings() {
  const res = await settingsService.getPublic();
  return res.data.data;
}

export default function StatusPage() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["public-status"],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS - 5000,
  });

  // Trạng thái bảo trì (bật/tắt + mốc thời gian dự kiến trở lại) lấy từ
  // cấu hình admin — độc lập với dữ liệu UptimeRobot ở trên, vì server có
  // thể vẫn "up" trong khi Earthoria chủ động đóng site để bảo trì.
  const { data: siteSettings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: fetchSiteSettings,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS - 5000,
  });

  // Đồng hồ tick mỗi giây để hiển thị "X giây trước" / "làm mới sau Ys"
  // sống động, dựa trên dataUpdatedAt thật của react-query.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const maintenanceActive = Boolean(siteSettings?.maintenanceActive);
  const maintenanceEndDate = siteSettings?.maintenanceEnd
    ? new Date(siteSettings.maintenanceEnd)
    : null;
  // Hiện ngày giờ cụ thể (không chỉ đếm ngược) để người dùng biết chính xác
  // khi nào hệ thống hoạt động lại, ví dụ: "18:00, 08/09/2026".
  const maintenanceUntilText = maintenanceEndDate
    ? `${maintenanceEndDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}, ${maintenanceEndDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}`
    : null;

  const statusKey = maintenanceActive
    ? "maintenance"
    : isLoading
      ? null
      : data?.status || "unknown";
  const meta = statusKey ? STATUS_META[statusKey] || STATUS_META.unknown : null;
  const Icon = meta?.icon || Activity;
  const accent = meta?.color || "#8a9990";

  const uptimeValue =
    data?.uptimeRatio30d !== null && data?.uptimeRatio30d !== undefined
      ? Number(data.uptimeRatio30d)
      : null;
  const uptime = uptimeValue !== null ? `${uptimeValue}%` : "—";
  const uptimeFillPct =
    uptimeValue !== null ? Math.min(100, Math.max(0, uptimeValue)) : 0;

  const avgMs = data?.avgResponseMs ?? null;
  const band = getResponseBand(avgMs);
  const speedPct =
    avgMs !== null ? Math.min(100, (Math.min(avgMs, 800) / 800) * 100) : 0;

  const checkedAtDate = data?.checkedAt ? new Date(data.checkedAt) : null;
  const checkedAt = checkedAtDate
    ? checkedAtDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const elapsedMs = dataUpdatedAt ? now - dataUpdatedAt : null;
  const elapsedSec =
    elapsedMs !== null ? Math.max(0, Math.floor(elapsedMs / 1000)) : null;
  const nextInSec =
    elapsedMs !== null
      ? Math.max(0, Math.ceil((REFRESH_MS - elapsedMs) / 1000))
      : null;

  return (
    <div className="status-page">
      <span
        className="status-page-orb status-page-orb--a"
        style={{ background: accent }}
      />
      <span
        className="status-page-orb status-page-orb--b"
        style={{ background: accent }}
      />

      <div className="status-page__inner">
        {/* ── HERO ── */}
        <div className="status-page__hero">
          <div className="status-page__eyebrow">
            <span
              className="status-page__eyebrow-dot"
              style={{ background: accent }}
            />
            Giám sát hệ thống · Thời gian thực
          </div>
          <h1 className="status-page__title">
            Earthoria đang hoạt động{" "}
            <span className="status-page__title-accent">ra sao?</span>
          </h1>
          <p className="status-page__subtitle">
            Bảng điều khiển theo dõi tình trạng vận hành của hạ tầng Earthoria,
            lấy trực tiếp từ hệ thống giám sát và tự làm mới mỗi 60 giây.
          </p>
        </div>

        {/* ── STATUS BANNER ── */}
        <div className="status-banner" style={{ "--accent": accent }}>
          <span className="status-banner__scan" />
          <div className="status-banner__row">
            <div className="status-banner__icon-wrap">
              <span className="status-banner__icon-ring" />
              <Icon size={26} strokeWidth={1.75} />
            </div>
            <div className="status-banner__text">
              <span className="status-banner__tag">
                {isLoading ? "ĐANG KIỂM TRA" : meta.tag}
              </span>
              <p className="status-banner__label">
                {isLoading ? "Đang kiểm tra hệ thống..." : meta.label}
              </p>
              <p className="status-banner__desc">
                {isLoading
                  ? "Đang tải dữ liệu giám sát..."
                  : maintenanceActive
                    ? siteSettings?.maintenanceMessage || meta.desc
                    : meta.desc}
              </p>
              {!isLoading && maintenanceActive && (
                <p className="status-banner__maintenance-until">
                  <Clock3 size={12} />
                  {maintenanceUntilText
                    ? `Dự kiến hoạt động trở lại lúc ${maintenanceUntilText}`
                    : "Thời gian hoạt động trở lại sẽ được thông báo sớm nhất"}
                </p>
              )}
            </div>
            <div className="status-banner__live">
              <span
                className="status-banner__live-dot"
                style={{ background: accent }}
              />
              LIVE
            </div>
          </div>

          <div className="status-banner__pulse-wrap">
            <div className="status-banner__pulse-track">
              <svg viewBox="0 0 800 60" preserveAspectRatio="none">
                <polyline points={PULSE_POINTS} />
              </svg>
              <svg
                viewBox="0 0 800 60"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline points={PULSE_POINTS} />
              </svg>
            </div>
          </div>
        </div>

        {/* ── METRICS GRID ── */}
        <div className="status-metrics">
          <div className="metric-card">
            <div className="metric-card__head">
              <Gauge size={14} />
              <span>Uptime 30 ngày</span>
            </div>
            <p className="metric-card__value">{isLoading ? "—" : uptime}</p>
            <div className="metric-card__bar">
              <div
                className="metric-card__bar-fill"
                style={{ width: `${uptimeFillPct}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__head">
              <Zap size={14} />
              <span>Thời gian phản hồi</span>
            </div>
            <p
              className="metric-card__value"
              style={{ color: !isLoading && band ? band.color : undefined }}
            >
              {isLoading || avgMs === null ? "—" : `${avgMs}ms`}
            </p>
            <div className="metric-card__speed-track">
              {!isLoading && band && (
                <span
                  className="metric-card__speed-marker"
                  style={{
                    left: `${speedPct}%`,
                    color: band.color,
                    background: band.color,
                  }}
                />
              )}
            </div>
            <span
              className="metric-card__speed-label"
              style={{ color: band?.color || "var(--text-muted)" }}
            >
              {isLoading || !band ? "—" : band.label}
            </span>
          </div>

          <div className="metric-card">
            <div className="metric-card__head">
              <Clock3 size={14} />
              <span>Kiểm tra lúc</span>
            </div>
            <p className="metric-card__value metric-card__value--sm">
              {isLoading ? "—" : checkedAt}
            </p>
            <p className="metric-card__hint">
              {elapsedSec !== null ? `${elapsedSec}s trước` : "—"}
              {nextInSec !== null ? ` · làm mới sau ${nextInSec}s` : ""}
            </p>
          </div>
        </div>

        {/* ── TERMINAL FOOTER ── */}
        <div className="status-terminal">
          <span className="status-terminal__stars" aria-hidden="true" />
          <div className="status-terminal__bar">
            <span
              className="status-terminal__dot"
              style={{ background: "#e34948" }}
            />
            <span
              className="status-terminal__dot"
              style={{ background: "#eda100" }}
            />
            <span
              className="status-terminal__dot"
              style={{ background: "#4a9e3f" }}
            />
            <span className="status-terminal__path">
              <Terminal size={11} />
              earthoria — status.sh
            </span>
          </div>
          <div className="status-terminal__body">
            <p>
              <span className="status-terminal__prompt">$</span>
              <span className="status-terminal__cmd status-terminal__code-gradient">
                curl -s https://earthoria.vn/api/v1/status
              </span>
            </p>
            <p className="status-terminal__out">
              <ChevronRight size={12} />
              <span className="status-terminal__code-gradient">
                {isLoading
                  ? "đang kết nối tới máy chủ giám sát..."
                  : maintenanceActive
                    ? `{ "status": "maintenance", "maintenance_until": "${
                        siteSettings?.maintenanceEnd || "null"
                      }", "maintenance_until_readable": "${
                        maintenanceUntilText || "chưa xác định"
                      }", "checked_at": "${checkedAt}" }`
                    : `{ "status": "${statusKey}", "uptime_30d": "${uptime}", "latency_ms": ${avgMs ?? "null"}, "checked_at": "${checkedAt}" }`}
              </span>
            </p>
            <p className="status-terminal__footer-row">
              <span>
                <span
                  className="status-terminal__blink"
                  style={{ background: accent }}
                />
                Tự động làm mới mỗi 60 giây
              </span>
              <button
                type="button"
                className="status-terminal__refresh-btn"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw size={13} className={isFetching ? "spin" : ""} />
                Làm mới ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
