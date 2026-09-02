import { useEffect, useState, useCallback } from "react";
import "./assets/css/promoBanner.css";

const STORAGE_KEY = "earthoria_promo_quockhanh29_dismissed";
const BANNER_SRC = "/banner/quockhanh29.png";

// Banner quảng cáo hiện khi vào trang, chỉ hiện 1 lần / phiên truy cập.
// Đóng bằng nút X, click nền, hoặc phím ESC.
export default function PromoBanner() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (alreadyDismissed) return;

    // Delay nhẹ để không "giật" ngay lúc trang vừa load xong.
    const timer = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className={`promo-banner-overlay ${closing ? "is-closing" : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thông báo quảng cáo"
    >
      <div
        className={`promo-banner-card ${closing ? "is-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="promo-banner-close"
          onClick={handleClose}
          aria-label="Đóng quảng cáo"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>

        <img
          src={BANNER_SRC}
          alt="Quảng cáo Earthoria"
          className="promo-banner-img"
          draggable="false"
        />
      </div>
    </div>
  );
}
