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
    this.state = { hasError: false, isChunkError: false, reloading: false };
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
        // "reloading" chỉ đúng cho LẦN NÀY - dùng state của component (mất
        // đi khi trang thực sự tải lại) chứ không dựa vào sessionStorage,
        // để lần lỗi tiếp theo (nếu reload không giải quyết được vấn đề)
        // luôn hiện được UI báo lỗi thay vì render null vĩnh viễn.
        this.setState({ reloading: true });
        window.location.reload();
        return;
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Chỉ ẩn UI trong khoảnh khắc NGẮN khi vừa tự kích hoạt reload ở lần
      // lỗi đầu tiên, tránh nháy màn hình trước khi trang thực sự tải lại.
      if (this.state.reloading) {
        return null;
      }

      // Nếu đây là lỗi tải chunk NHƯNG đã từng tự-reload trước đó rồi mà vẫn
      // lỗi lại (tức reload không giải quyết được - có thể do bản deploy mới
      // chưa lên đầy đủ, hoặc CDN/proxy đang cache index.html cũ), dùng
      // thông báo rõ ràng hơn thay vì thông báo lỗi chung chung.
      const isRepeatedChunkError =
        this.state.isChunkError && sessionStorage.getItem(RELOAD_FLAG_KEY);

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
            {isRepeatedChunkError
              ? "Trang web vừa có bản cập nhật mới nhưng trình duyệt chưa tải được phiên bản mới nhất. Vui lòng tải lại trang; nếu vẫn còn lỗi hãy quay lại sau ít phút."
              : "Trang gặp sự cố khi tải. Vui lòng thử tải lại trang, nếu vẫn còn lỗi hãy quay lại sau ít phút."}
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
