import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";
import { statusService } from "../../services/statusService";
import { Icon, SYSTEM_INFO, SectionHeader } from "../Profile";

const STATUS_REFRESH_MS = 60 * 1000; // khớp với thời gian cache 60s ở server /status

async function fetchPublicStatus() {
  const res = await statusService.getPublicStatus();
  return res.data;
}

const SYSTEM_STATUS_META = {
  up: {
    label: "Hoạt động bình thường",
    color: "#4a9e3f",
    bg: "rgba(74,158,63,0.08)",
  },
  seems_down: {
    label: "Có thể đang gián đoạn",
    color: "#b8862e",
    bg: "rgba(184,134,46,0.08)",
  },
  down: {
    label: "Đang ngừng hoạt động",
    color: "#b25450",
    bg: "rgba(178,84,80,0.08)",
  },
  paused: {
    label: "Tạm dừng giám sát",
    color: "var(--text-muted)",
    bg: "rgba(90,107,96,0.08)",
  },
  not_checked_yet: {
    label: "Chưa có dữ liệu",
    color: "var(--text-muted)",
    bg: "rgba(90,107,96,0.08)",
  },
  unknown: {
    label: "Không thể kiểm tra",
    color: "var(--text-muted)",
    bg: "rgba(90,107,96,0.08)",
  },
};

// Chỉ tô màu con số thời gian phản hồi THẬT theo ngưỡng — không bịa dữ liệu
function getResponseColor(ms) {
  if (ms === null || ms === undefined) return undefined;
  if (ms <= 200) return "#4a9e3f";
  if (ms <= 500) return "#b8862e";
  return "#b25450";
}

const PULSE_POINTS =
  "0,30 20,30 34,30 40,18 46,30 54,30 60,6 66,54 72,26 78,34 82,30 100,30 120,30 134,30 140,18 146,30 154,30 160,6 166,54 172,26 178,34 182,30 200,30 220,30 234,30 240,18 246,30 254,30 260,6 266,54 272,26 278,34 282,30 300,30 320,30 334,30 340,18 346,30 354,30 360,6 366,54 372,26 378,34 382,30 400,30 420,30 434,30 440,18 446,30 454,30 460,6 466,54 472,26 478,34 482,30 500,30 520,30 534,30 540,18 546,30 554,30 560,6 566,54 572,26 578,34 582,30 600,30 620,30 634,30 640,18 646,30 654,30 660,6 666,54 672,26 678,34 682,30 700,30 720,30 734,30 740,18 746,30 754,30 760,6 766,54 772,26 778,34 782,30 800,30";

function useServerClock(timeZone = "Asia/Ho_Chi_Minh") {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("vi-VN", {
    timeZone,
    hour12: false,
  });
  const date = now.toLocaleDateString("vi-VN", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return { time, date };
}

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("earthoria-theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("earthoria-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const hasStoredTheme = localStorage.getItem("earthoria-theme") !== null;
    if (hasStoredTheme) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const onChange = (e) => setIsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => setIsDark((v) => !v);

  return { isDark, toggle };
}

function useCookiePrefs() {
  const [consent, setConsent] = useState(() =>
    typeof window !== "undefined" && window.EarthoriaCookies
      ? window.EarthoriaCookies.getConsent()
      : null,
  );

  useEffect(() => {
    // Nếu module tải chậm hơn React, chủ động kiểm tra lại vài lần
    if (!window.EarthoriaCookies) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (window.EarthoriaCookies) {
          setConsent(window.EarthoriaCookies.getConsent());
          clearInterval(timer);
        } else if (attempts >= 10) {
          clearInterval(timer);
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, []);

  useEffect(() => {
    const onUpdate = (e) =>
      setConsent({ choices: e.detail.choices, timestamp: e.detail.timestamp });
    document.addEventListener("earthoria:cookie-consent", onUpdate);
    return () =>
      document.removeEventListener("earthoria:cookie-consent", onUpdate);
  }, []);

  return consent;
}

const COOKIE_GROUP_LABELS = {
  essential: {
    title: "Cookie thiết yếu",
    desc: "Đăng nhập, giỏ hàng, bảo mật phiên - luôn bật.",
  },
  analytics: {
    title: "Cookie phân tích",
    desc: "Giúp cải thiện trải nghiệm dựa trên hành vi sử dụng.",
  },
  marketing: {
    title: "Cookie tiếp thị",
    desc: "Cá nhân hoá quảng cáo và đo lường chiến dịch.",
  },
  functional: {
    title: "Cookie chức năng",
    desc: "Ghi nhớ chế độ hiển thị, ngôn ngữ...",
  },
};

export default function SettingsTab() {
  const { isDark, toggle } = useTheme();
  const consent = useCookiePrefs();
  const clock = useServerClock(SYSTEM_INFO.timezone);
  const [expandedChangelog, setExpandedChangelog] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["public-status"],
    queryFn: fetchPublicStatus,
    refetchInterval: STATUS_REFRESH_MS,
    staleTime: STATUS_REFRESH_MS - 5000,
  });

  const statusKey = statusLoading ? null : statusData?.status || "unknown";
  const statusMeta = statusKey
    ? SYSTEM_STATUS_META[statusKey] || SYSTEM_STATUS_META.unknown
    : null;

  const uptimeValue =
    statusData?.uptimeRatio30d !== null &&
    statusData?.uptimeRatio30d !== undefined
      ? Number(statusData.uptimeRatio30d)
      : null;
  const uptimeDisplay = uptimeValue !== null ? `${uptimeValue}%` : "—";

  const avgMs = statusData?.avgResponseMs ?? null;
  const responseColor = getResponseColor(avgMs);

  const checkedAtDisplay = statusData?.checkedAt
    ? new Date(statusData.checkedAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  const openCookieSettings = () => {
    if (window.EarthoriaCookies) {
      window.EarthoriaCookies.openSettings();
      return;
    }
    // Script có thể vẫn đang tải — thử lại vài lần trước khi báo lỗi hẳn
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (window.EarthoriaCookies) {
        clearInterval(timer);
        window.EarthoriaCookies.openSettings();
      } else if (attempts >= 10) {
        clearInterval(timer);
        toast.error(
          "Chưa tải được module Cookie. Vui lòng tải lại trang (F5) rồi thử lại.",
        );
      }
    }, 200);
  };

  const visibleLogs = expandedChangelog
    ? SYSTEM_INFO.changelog
    : SYSTEM_INFO.changelog.slice(0, 3);

  return (
    <div>
      <SectionHeader
        chapter="VI"
        eyebrow="Tuỳ Chỉnh Hệ Thống"
        title="Cài Đặt"
        emphasis="Hệ Thống"
        sub="Thông tin phiên bản, giao diện hiển thị và quyền riêng tư cookie"
      />

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">{Icon.seal}</div>
          <div>
            <h3 className="pf-settings-card-title">Thông Tin Hệ Thống</h3>
            <p className="pf-settings-card-sub">
              Phiên bản, trạng thái vận hành và cấu hình khu vực của{" "}
              {SYSTEM_INFO.systemName}
            </p>
          </div>
        </div>

        <div className="pf-settings-info-grid pf-settings-info-grid-3">
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Tên hệ thống</span>
            <span className="pf-settings-info-val">
              {SYSTEM_INFO.systemName}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Tên website</span>
            <span className="pf-settings-info-val">{SYSTEM_INFO.siteName}</span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Phiên bản</span>
            <span className="pf-settings-info-val pf-mono">
              {SYSTEM_INFO.version}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Môi trường</span>
            <span className="pf-settings-info-val">
              <span className="pf-env-badge">{SYSTEM_INFO.environment}</span>
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Ngày phát hành</span>
            <span className="pf-settings-info-val">
              {SYSTEM_INFO.releaseDate}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Cập nhật kế tiếp</span>
            <span className="pf-settings-info-val">
              {SYSTEM_INFO.nextUpdateDate}
              <span className="pf-env-badge pf-badge-upcoming">Dự kiến</span>
            </span>
          </div>
        </div>

        <div className="pf-settings-subhead">
          <span>Trạng Thái Vận Hành</span>
        </div>
        <div className="pf-settings-info-grid" style={{ marginBottom: 14 }}>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Trạng thái</span>
            <span className="pf-settings-info-val">
              <span
                className="pf-status-pill"
                style={{
                  background: statusMeta?.bg || "rgba(90,107,96,0.08)",
                  color: statusMeta?.color || "var(--text-muted)",
                }}
              >
                {statusLoading ? "Đang kiểm tra" : statusMeta.label}
              </span>
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Thời gian cập nhật</span>
            <span className="pf-settings-info-val pf-mono">
              {statusLoading ? "—" : checkedAtDisplay}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Uptime</span>
            <span className="pf-settings-info-val pf-mono">
              {statusLoading ? "—" : uptimeDisplay}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Thời gian phản hồi</span>
            <span
              className="pf-settings-info-val pf-mono"
              style={{ color: statusLoading ? undefined : responseColor }}
            >
              {statusLoading || avgMs === null ? "—" : `${avgMs}ms`}
            </span>
          </div>
        </div>

        <div
          className="pf-status-pulse-wrap"
          style={{
            "--pulse-color": statusMeta?.color || "var(--text-muted)",
            marginBottom: 30,
          }}
        >
          <div className="pf-status-pulse-track">
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

        <div className="pf-settings-subhead">
          <span>Cấu Hình Khu Vực</span>
        </div>
        <div className="pf-settings-info-grid" style={{ marginBottom: 30 }}>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Ngôn ngữ mặc định</span>
            <span className="pf-settings-info-val">{SYSTEM_INFO.locale}</span>
          </div>
          <div className="pf-settings-info-item pf-settings-info-item-clock">
            <span className="pf-settings-info-label">Giờ hệ thống</span>
            <span className="pf-server-clock">
              <span className="pf-server-clock-time">
                {clock.time}{" "}
                <span className="pf-server-clock-zone">
                  (GMT+7 - Hanoi, VN)
                </span>
              </span>
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Định dạng ngày giờ</span>
            <span className="pf-settings-info-val pf-mono">
              {SYSTEM_INFO.dateFormat}
            </span>
          </div>
          <div className="pf-settings-info-item">
            <span className="pf-settings-info-label">Định dạng tiền tệ</span>
            <span className="pf-settings-info-val">
              {SYSTEM_INFO.currencyFormat}
            </span>
          </div>
        </div>

        <div className="pf-changelog-head">
          <span>Lịch Sử Cập Nhật</span>
          {SYSTEM_INFO.changelog.length > 3 && (
            <button
              type="button"
              className="pf-btn-tactile pf-changelog-toggle"
              onClick={() => setExpandedChangelog((v) => !v)}
            >
              {expandedChangelog ? "Thu gọn" : "Xem tất cả"}
            </button>
          )}
        </div>
        <div className="pf-changelog-list">
          {visibleLogs.map((log) => (
            <div key={log.version} className="pf-changelog-item">
              <div className="pf-changelog-dot" />
              <div className="pf-changelog-body">
                <div className="pf-changelog-meta">
                  <span className="pf-mono">{log.version}</span>
                  <span className="pf-changelog-date">{log.date}</span>
                </div>
                <p className="pf-changelog-note">{log.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">
            {isDark ? Icon.moon : Icon.sun}
          </div>
          <div>
            <h3 className="pf-settings-card-title">Giao Diện Hiển Thị</h3>
            <p className="pf-settings-card-sub">
              Chọn chế độ sáng, tối để phù hợp với mắt bạn
            </p>
          </div>
        </div>

        <div className="pf-theme-row">
          <div>
            <div className="pf-theme-row-title">Chế độ tối</div>
            <div className="pf-theme-row-desc">
              {isDark
                ? "Đang bật - giao diện tối, dịu mắt hơn vào ban đêm"
                : "Đang tắt - giao diện sáng mặc định"}
            </div>
          </div>
          <label className="pf-switch">
            <input type="checkbox" checked={isDark} onChange={toggle} />
            <span className="pf-switch-track">
              <span className="pf-switch-thumb">
                {isDark ? Icon.moon : Icon.sun}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="pf-settings-card">
        <div className="pf-settings-card-head">
          <div className="pf-lock-icon-wrap">{Icon.cookie}</div>
          <div>
            <h3 className="pf-settings-card-title">
              Quyền Riêng Tư &amp; Cookie
            </h3>
            <p className="pf-settings-card-sub">
              Quản lý các nhóm cookie đang được sử dụng trên trình duyệt của bạn
            </p>
          </div>
        </div>

        {consent?.choices ? (
          <div className="pf-cookie-groups">
            {Object.entries(COOKIE_GROUP_LABELS).map(([key, meta]) => {
              const active = !!consent.choices[key];
              const locked = key === "essential";
              return (
                <div key={key} className="pf-cookie-group-row">
                  <div>
                    <div className="pf-cookie-group-title">
                      {meta.title}
                      {locked && (
                        <span className="pf-cookie-locked-tag">
                          {Icon.lock} Luôn bật
                        </span>
                      )}
                    </div>
                    <div className="pf-cookie-group-desc">{meta.desc}</div>
                  </div>
                  <span
                    className={`pf-cookie-status-dot ${active ? "on" : "off"}`}
                  >
                    {active ? "Đang bật" : "Đang tắt"}
                  </span>
                </div>
              );
            })}
            {consent.timestamp && (
              <div className="pf-cookie-updated-at">
                Cập nhật lần cuối: {formatDate(consent.timestamp)}
              </div>
            )}
          </div>
        ) : (
          <p className="pf-settings-card-sub" style={{ marginBottom: 20 }}>
            Bạn chưa thiết lập tuỳ chọn cookie trên thiết bị này.
          </p>
        )}

        <button
          type="button"
          onClick={openCookieSettings}
          className="pf-btn-tactile pf-btn-shine pf-cookie-manage-btn"
        >
          {Icon.settings} Quản Lý Cài Đặt Cookie
        </button>
      </div>
    </div>
  );
}
