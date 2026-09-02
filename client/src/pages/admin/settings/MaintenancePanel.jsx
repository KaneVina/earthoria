import { useState, useEffect, useCallback } from "react";
import { AlarmClock, Power, MessageSquare } from "lucide-react";

function toLocalInputValue(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function MaintenancePanel({ settings, onSave, saving }) {
  const [enabled, setEnabled] = useState(Boolean(settings.maintenanceEnabled));
  const [start, setStart] = useState(
    toLocalInputValue(settings.maintenanceStart),
  );
  const [end, setEnd] = useState(toLocalInputValue(settings.maintenanceEnd));
  const [message, setMessage] = useState(settings.maintenanceMessage || "");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEnabled(Boolean(settings.maintenanceEnabled));
    setStart(toLocalInputValue(settings.maintenanceStart));
    setEnd(toLocalInputValue(settings.maintenanceEnd));
    setMessage(settings.maintenanceMessage || "");
    setDirty(false);
    setError("");
  }, [settings]);

  const touch = useCallback(
    (setter) => (value) => {
      setter(value);
      setDirty(true);
      setError("");
    },
    [],
  );

  const handleSave = async () => {
    if (start && end && new Date(start) >= new Date(end)) {
      setError("Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }
    try {
      await onSave({
        maintenanceEnabled: enabled,
        maintenanceStart: start ? new Date(start).toISOString() : null,
        maintenanceEnd: end ? new Date(end).toISOString() : null,
        maintenanceMessage: message.trim() || null,
      });
      setDirty(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Lưu cài đặt thất bại");
    }
  };

  const scheduleWillActivate =
    !enabled &&
    start &&
    end &&
    new Date() < new Date(end) &&
    new Date(start) > new Date();
  const scheduleCurrentlyActive =
    !enabled &&
    start &&
    end &&
    new Date() >= new Date(start) &&
    new Date() <= new Date(end);

  return (
    <div className="a-chart-card" style={{ marginBottom: 20 }}>
      <div className="a-chart-card-header">
        <h3 className="a-chart-title">
          Chế Độ <em>Bảo Trì</em>
        </h3>
        <p className="a-chart-sub">
          Bật thủ công để có hiệu lực ngay, hoặc đặt lịch để hệ thống tự bật/tắt
          đúng giờ. Admin luôn vào được dashboard bình thường; khách và nhân
          viên sẽ thấy trang bảo trì.
        </p>
      </div>

      <div className="a-theme-row">
        <div>
          <div className="a-theme-row-title">Bật bảo trì ngay (thủ công)</div>
          <div className="a-theme-row-desc">
            {enabled
              ? "Đang bật — toàn bộ trang web (trừ dashboard admin) hiển thị trang bảo trì"
              : "Đang tắt — chỉ áp dụng theo lịch tự động bên dưới (nếu có đặt)"}
          </div>
        </div>
        <label className="a-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => touch(setEnabled)(e.target.checked)}
          />
          <span className="a-switch-track">
            <span className="a-switch-thumb">
              <Power size={12} />
            </span>
          </span>
        </label>
      </div>

      <div className="a-fields-grid" style={{ marginTop: 18 }}>
        <div className="a-field">
          <div className="a-field-label">
            <AlarmClock size={13} strokeWidth={1.6} className="a-field-icon" />
            Bắt đầu (tự động)
          </div>
          <input
            type="datetime-local"
            className="a-input"
            value={start}
            onChange={(e) => touch(setStart)(e.target.value)}
          />
        </div>
        <div className="a-field">
          <div className="a-field-label">
            <AlarmClock size={13} strokeWidth={1.6} className="a-field-icon" />
            Kết thúc (tự động)
          </div>
          <input
            type="datetime-local"
            className="a-input"
            value={end}
            onChange={(e) => touch(setEnd)(e.target.value)}
          />
        </div>
      </div>

      {scheduleCurrentlyActive && (
        <div className="a-field-error" style={{ marginTop: 10 }}>
          Lịch trên đang trong khung giờ hiệu lực — trang bảo trì đang tự động
          hiển thị cho khách.
        </div>
      )}
      {scheduleWillActivate && (
        <div className="a-chart-sub" style={{ marginTop: 10 }}>
          Lịch này sẽ tự động bật bảo trì khi tới giờ bắt đầu.
        </div>
      )}

      <div className="a-field" style={{ marginTop: 14 }}>
        <div className="a-field-label">
          <MessageSquare size={13} strokeWidth={1.6} className="a-field-icon" />
          Lời nhắn hiển thị cho người dùng (tuỳ chọn)
        </div>
        <textarea
          className="a-input"
          rows={3}
          value={message}
          onChange={(e) => touch(setMessage)(e.target.value)}
          placeholder="Để trống sẽ dùng lời nhắn mặc định của trang bảo trì"
          style={{ resize: "vertical", minHeight: 70 }}
        />
      </div>

      {error && <div className="a-field-error">{error}</div>}

      <button
        type="button"
        className="a-btn-ghost"
        style={{ marginTop: 16 }}
        disabled={!dirty || saving}
        onClick={handleSave}
      >
        {saving ? "Đang lưu..." : "Lưu cài đặt bảo trì"}
      </button>
    </div>
  );
}
