import { Component } from "react";

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
    console.error("[ErrorBoundary] Caught render error:", error, info);

    if (isChunkLoadError(error)) {
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
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (this.state.isChunkError && alreadyTried) {
        return null;
      }
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
