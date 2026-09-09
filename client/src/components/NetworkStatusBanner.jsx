import { useEffect, useState } from "react";

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 2500);
      return () => clearTimeout(timer);
    }
    function handleOffline() {
      setIsOnline(false);
      setShowReconnected(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        textAlign: "center",
        padding: "8px 16px",
        fontFamily: "'Be Vietnam Pro', sans-serif",
        fontSize: "13px",
        letterSpacing: "0.02em",
        color: "var(--ivory)",
        background: isOnline ? "var(--forest-light)" : "var(--ink)",
        transition: "background 0.3s ease",
      }}
    >
      {isOnline
        ? "✓ Đã có kết nối mạng trở lại"
        : "⚠ Mất kết nối mạng - một số tính năng có thể không hoạt động"}
    </div>
  );
}
