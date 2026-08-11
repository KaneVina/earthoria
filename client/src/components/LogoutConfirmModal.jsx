import { useEffect, useRef, useState } from "react";
import "./assets/css/logoutConfirmModal.css";

const LOGOUT_ICON = (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Modal xác nhận đăng xuất dùng chung cho mọi nút "Đăng xuất" trong app.
// Đếm ngược `seconds` (mặc định 10s); hết giờ mà chưa bấm gì thì tự onConfirm.
export default function LogoutConfirmModal({
  open,
  onConfirm,
  onCancel,
  seconds = 10,
}) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setRemaining(seconds);
    firedRef.current = false;

    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          if (!firedRef.current) {
            firedRef.current = true;
            onConfirm();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seconds]);

  const handleConfirm = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    clearInterval(intervalRef.current);
    onConfirm();
  };

  const handleCancel = () => {
    clearInterval(intervalRef.current);
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="lcm-overlay" onClick={handleCancel}>
      <div
        className="lcm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lcm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="lcm-glow" aria-hidden="true" />

        <div className="lcm-icon-wrap">
          <span className="lcm-icon-pulse" />
          <span className="lcm-icon-ring" />
          <span className="lcm-icon-core">{LOGOUT_ICON}</span>
        </div>

        <h3 id="lcm-title" className="lcm-title">
          Đăng Xuất Tài Khoản?
        </h3>
        <p className="lcm-msg">
          Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các tính năng của tài
          khoản. Modal sẽ tự đóng và đăng xuất sau {seconds} giây nếu bạn
          không phản hồi.
        </p>

        <div className="lcm-actions">
          <button
            type="button"
            className="lcm-btn lcm-btn-cancel"
            onClick={handleCancel}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="lcm-btn lcm-btn-confirm"
            onClick={handleConfirm}
          >
            <span
              key={open ? "running" : "idle"}
              className="lcm-btn-progress"
              style={{ animationDuration: `${seconds}s` }}
            />
            <span className="lcm-btn-label">
              Đăng Xuất Ngay <span className="lcm-countdown">({remaining}s)</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}