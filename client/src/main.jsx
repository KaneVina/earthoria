import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import NetworkStatusBanner from "./components/NetworkStatusBanner.jsx";
import { initSentry } from "./lib/sentry.js";
import "./components/assets/css/main.css";
import "./components/assets/css/main2.css";
import "./components/assets/css/navbar.css";
import "./components/assets/css/cookie-consent.css";
import "./components/assets/js/cookie-consent.js";

// Phải init sớm nhất có thể để bắt được lỗi từ mọi component phía sau
initSentry();

// Sau mỗi lần deploy, tên các file chunk (hash) thay đổi. Nếu trình duyệt
// hoặc CDN còn giữ index.html cũ trỏ tới chunk đã không còn tồn tại,
// Vite sẽ phát sự kiện "vite:preloadError" khi lazy-import thất bại.
// Tự động reload MỘT LẦN để lấy bản mới nhất, tránh trắng màn hình.
const RELOAD_FLAG_KEY = "eo_chunk_reload_attempted";
window.addEventListener("vite:preloadError", () => {
  const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
  if (!alreadyTried) {
    sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
    window.location.reload();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const rootEl = document.getElementById("root");
const app = (
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusBanner />
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: "Be Vietnam Pro, sans-serif",
              fontSize: "13px",
              background: "#0d3330",
              color: "#faf8f3",
              border: "0.5px solid rgba(74,158,63,0.3)",
              maxWidth: "460px",
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
