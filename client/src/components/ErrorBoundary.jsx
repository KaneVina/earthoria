import { Component } from "react";
import { Sentry } from "../lib/sentry.js";

const RELOAD_FLAG_KEY = "eo_chunk_reload_attempted";

function isChunkLoadError(error) {
  const msg = String(error?.message || error || "");
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    msg.includes("Expected a JavaScript-or-Wasm module script")
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error, info) {
    // Log để dễ debug trên Sentry/console, không làm gì ảnh hưởng người dùng.
    console.error("[ErrorBoundary] Caught render error:", error, info);
    Sentry.captureException(error, {
      extra: { componentStack: info?.componentStack },
    });

    if (isChunkLoadError(error)) {
      // Bản deploy mới đã đổi tên các file chunk (hash thay đổi) khiến
      // trình duyệt/CDN cache cũ trỏ tới file không còn tồn tại nữa.
      // Tự động reload MỘT LẦN để lấy index.html + asset mới nhất.
      // Dùng sessionStorage để tránh vòng lặp reload vô hạn nếu lỗi
      // thực sự không phải do cache (ví dụ mất mạng thật sự).
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyTried) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Nếu đang trong quá trình tự-reload cho lỗi chunk thì không cần
      // hiện UI, tránh nháy màn hình - trang sẽ reload gần như ngay lập tức.
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (this.state.isChunkError && alreadyTried) {
        return null;
      }

      // Dùng đúng CSS variables + class .btn-primary sẵn có của project
      // (định nghĩa trong main.css) để tự động đồng bộ theo light/dark mode
      // (body.dark-mode) thay vì hardcode màu.
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
            fontFamily: "'Be Vietnam Pro', sans-serif",
            background: "var(--cream)",
            color: "var(--text-body)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif",
              color: "var(--forest)",
              fontSize: "26px",
              fontWeight: 600,
            }}
          >
            Đã có lỗi xảy ra
          </h2>
          <p style={{ margin: 0, maxWidth: 420, color: "var(--text-muted)" }}>
            Trang gặp sự cố khi tải. Vui lòng thử tải lại trang, nếu vẫn còn lỗi
            hãy quay lại sau ít phút.
          </p>
          <button className="btn-primary" onClick={this.handleReload}>
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
