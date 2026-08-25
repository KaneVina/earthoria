import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";
import { Icon, SYSTEM_INFO, SectionHeader } from "../Profile";

// ─ Đồng hồ server: cập nhật mỗi giây theo múi giờ Việt Nam (UTC+7) ─
// Dùng Intl.DateTimeFormat với timeZone cố định nên hiển thị đúng giờ VN
// bất kể máy người dùng đang ở múi giờ nào.
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
    // Chỉ đồng bộ theo hệ điều hành nếu đây là lần đầu tiên vào web
    // (chưa từng lưu theme nào). Nếu đã có giá trị lưu rồi (kể cả mặc định
    // "light" ban đầu), tuyệt đối không ghi đè nữa mỗi khi tab này mount lại.
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
              Phiên bản, môi trường vận hành và cấu hình khu vực của{" "}
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