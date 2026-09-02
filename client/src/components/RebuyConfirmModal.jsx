import { useEffect, useRef, useState } from "react";
import "./assets/css/rebuyConfirmModal.css";

const BOOK_ICON = (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="9" y1="7" x2="15" y2="7" />
  </svg>
);

export default function RebuyConfirmModal({
  open,
  onConfirm,
  onCancel,
  seconds = 10,
  bookTitle,
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
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seconds]);

  useEffect(() => {
    if (!open) return;
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onConfirm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, remaining]);

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
    <div className="rbc-overlay" onClick={handleCancel}>
      <div
        className="rbc-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="rbc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="rbc-glow" aria-hidden="true" />

        <div className="rbc-icon-wrap">
          <span className="rbc-icon-pulse" />
          <span className="rbc-icon-ring" />
          <span className="rbc-icon-core">{BOOK_ICON}</span>
        </div>

        <h3 id="rbc-title" className="rbc-title">
          Bạn đã sở hữu sách điện tử này
        </h3>
        <p className="rbc-msg">
          {bookTitle ? <strong>“{bookTitle}”</strong> : "Sách điện tử này"} đã
          có trong tài khoản của bạn. Bạn có chắc muốn mua lại bản điện tử này
          không?
        </p>

        <div className="rbc-actions">
          <button
            type="button"
            className="rbc-btn rbc-btn-cancel"
            onClick={handleCancel}
          >
            Không, quay lại
          </button>
          <button
            type="button"
            className="rbc-btn rbc-btn-confirm"
            onClick={handleConfirm}
          >
            <span
              key={open ? "running" : "idle"}
              className="rbc-btn-progress"
              style={{ animationDuration: `${seconds}s` }}
            />
            <span className="rbc-btn-label">
              Có, tiếp tục mua{" "}
              <span className="rbc-countdown">({remaining}s)</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
