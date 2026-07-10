import { useNavigate, useLocation } from "react-router-dom";
import { useCompareStore } from "../store/compareStore";

// Thay IconScale (dễ vỡ font ở một số máy) bằng icon mũi tên/so sánh đơn giản, chắc chắn render đúng mọi nơi
function IconCompareArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3L4 7l4 4" />
      <path d="M4 7h16" />
      <path d="M16 21l4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
function IconX({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function FloatingCompareBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, removeItem, clear, maxCompare } = useCompareStore();

  // FIX: không hiện thanh nổi khi đang ở ngay trang /compare (trùng lặp với nội dung trang)
  if (items.length === 0 || location.pathname === "/compare") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 900,
        background: "rgba(13,43,30,0.97)",
        backdropFilter: "blur(20px)",
        border: "0.5px solid rgba(74,158,63,0.3)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 24px 60px rgba(13,43,30,0.35)",
        animation: "compareBarSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <style>{`
        @keyframes compareBarSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--gold)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <IconCompareArrow /> So sánh ({items.length}/{maxCompare})
      </div>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
        {items.map((item) => (
          <div
            key={item.hashId}
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              flexShrink: 0,
              border: "0.5px solid rgba(74,158,63,0.3)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
            }}
            title={item.title}
          >
            {item.coverImage && (
              <img src={item.coverImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <button
              onClick={() => removeItem(item.hashId)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "16px",
                height: "16px",
                background: "rgba(13,43,30,0.9)",
                color: "var(--ivory)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconX size={9} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={clear}
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(250,248,243,0.5)",
            background: "transparent",
            border: "0.5px solid rgba(255,255,255,0.15)",
            padding: "10px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Xóa hết
        </button>
        <button
          onClick={() => (items.length >= 2 ? navigate("/compare") : null)}
          disabled={items.length < 2}
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: items.length < 2 ? "rgba(250,248,243,0.4)" : "var(--ink)",
            background: items.length < 2 ? "rgba(255,255,255,0.08)" : "var(--gold)",
            border: "none",
            padding: "10px 20px",
            cursor: items.length < 2 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.25s",
          }}
        >
          So sánh ngay
        </button>
      </div>
    </div>
  );
}