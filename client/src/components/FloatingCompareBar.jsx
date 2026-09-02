import { useNavigate, useLocation } from "react-router-dom";
import { useCompareStore } from "../store/compareStore";

function IconCompareArrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
function IconX({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function FloatingCompareBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, removeItem, clear, maxCompare } = useCompareStore();

  if (items.length === 0 || location.pathname === "/compare") return null;

  const fillPct = Math.min(100, Math.round((items.length / maxCompare) * 100));
  const canCompare = items.length >= 2;

  return (
    <div className="compare-bar">
      <style>{`
        @keyframes compareBarSlideUp {
          from { opacity: 0; transform: translate(-50%, 28px) scale(0.98); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes compareChipIn {
          from { opacity: 0; transform: translateY(6px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .compare-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 16px 22px 16px 20px;
          max-width: calc(100vw - 32px);
          background: linear-gradient(160deg, rgba(15,48,44,0.98) 0%, rgba(9,18,14,0.98) 100%);
          backdrop-filter: blur(24px) saturate(1.3);
          -webkit-backdrop-filter: blur(24px) saturate(1.3);
          border: 0.5px solid rgba(74,158,63,0.25);
          box-shadow:
            0 32px 70px rgba(6,16,12,0.45),
            0 6px 20px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: compareBarSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .compare-bar::before {
          content: "";
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 64px;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.7;
        }

        .compare-bar-label {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .compare-bar-icon-box {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border: 0.5px solid rgba(74,158,63,0.35);
          background: rgba(74,158,63,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gold);
          position: relative;
        }
        .compare-bar-pulse-dot {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          animation: pulse 1.8s ease-in-out infinite;
        }
        .compare-bar-label-text {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .compare-bar-eyebrow {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(250,248,243,0.4);
          white-space: nowrap;
        }
        .compare-bar-count {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--ivory, #faf8f3);
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .compare-bar-count strong {
          color: var(--gold);
          font-weight: 600;
        }
        .compare-bar-progress {
          width: 64px;
          height: 2px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .compare-bar-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold), var(--gold-light, #5cb84f));
          transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
        }

        .compare-bar-divider {
          width: 1px;
          height: 36px;
          background: linear-gradient(to bottom, transparent, rgba(74,158,63,0.35), transparent);
          flex-shrink: 0;
        }

        .compare-bar-items {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px;
        }
        .compare-bar-items::-webkit-scrollbar { display: none; }

        .compare-chip {
          position: relative;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border: 0.5px solid rgba(74,158,63,0.3);
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          animation: compareChipIn 0.35s cubic-bezier(0.16,1,0.3,1) backwards;
          transition: border-color 0.3s, transform 0.3s;
        }
        .compare-chip:hover {
          border-color: rgba(74,158,63,0.6);
          transform: translateY(-2px);
        }
        .compare-chip img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.8);
          transition: filter 0.3s, transform 0.4s ease;
        }
        .compare-chip:hover img {
          filter: saturate(1);
          transform: scale(1.08);
        }
        .compare-chip-remove {
          position: absolute;
          inset: 0;
          background: rgba(10,20,16,0);
          color: rgba(250,248,243,0);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .compare-chip:hover .compare-chip-remove {
          background: rgba(10,20,16,0.72);
          color: rgba(250,248,243,0.95);
        }
        .compare-chip-remove:hover {
          color: var(--gold) !important;
        }

        .compare-bar-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .compare-btn-clear {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(250,248,243,0.45);
          background: transparent;
          border: 0.5px solid rgba(255,255,255,0.12);
          padding: 11px 15px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s ease;
        }
        .compare-btn-clear:hover {
          color: rgba(250,248,243,0.85);
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
        }

        .compare-btn-go {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          padding: 11px 20px;
          white-space: nowrap;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .compare-btn-go.enabled {
          color: var(--ink, #0a0e0c);
          background: linear-gradient(135deg, var(--gold-light, #5cb84f), var(--gold, #4a9e3f));
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(74,158,63,0.25);
        }
        .compare-btn-go.enabled:hover {
          gap: 12px;
          box-shadow: 0 10px 26px rgba(74,158,63,0.4);
          transform: translateY(-2px);
        }
        .compare-btn-go.enabled svg {
          transition: transform 0.3s ease;
        }
        .compare-btn-go.enabled:hover svg {
          transform: translateX(2px);
        }
        .compare-btn-go.disabled {
          color: rgba(250,248,243,0.35);
          background: rgba(255,255,255,0.06);
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .compare-bar {
            gap: 14px;
            padding: 13px 16px 13px 14px;
            bottom: 16px;
          }
          .compare-bar-eyebrow { display: none; }
          .compare-bar-progress { width: 40px; }
          .compare-bar-divider { display: none; }
          .compare-btn-clear { display: none; }
        }
      `}</style>

      <div className="compare-bar-label">
        <div className="compare-bar-icon-box">
          <IconCompareArrow />
          <span className="compare-bar-pulse-dot" />
        </div>
        <div className="compare-bar-label-text">
          <span className="compare-bar-eyebrow">So sánh sản phẩm</span>
          <span className="compare-bar-count">
            <strong>{items.length}</strong> / {maxCompare} đã chọn
          </span>
          <div className="compare-bar-progress">
            <div
              className="compare-bar-progress-fill"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="compare-bar-divider" />

      <div className="compare-bar-items">
        {items.map((item, i) => (
          <div
            key={item.hashId}
            className="compare-chip"
            style={{ animationDelay: `${i * 0.05}s` }}
            title={item.title}
          >
            {item.coverImage && <img src={item.coverImage} alt={item.title} />}
            <button
              className="compare-chip-remove"
              onClick={() => removeItem(item.hashId)}
              aria-label={`Bỏ ${item.title} khỏi so sánh`}
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="compare-bar-divider" />

      <div className="compare-bar-actions">
        <button className="compare-btn-clear" onClick={clear}>
          Xóa hết
        </button>
        <button
          className={`compare-btn-go ${canCompare ? "enabled" : "disabled"}`}
          onClick={() => canCompare && navigate("/compare")}
          disabled={!canCompare}
        >
          So sánh ngay
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
