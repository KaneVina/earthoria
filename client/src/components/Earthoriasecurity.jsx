import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsService } from "../services/settingsService";

/* ─ helpers ───────────────────────────────────────────── */
const IS_DEV =
  typeof import.meta !== "undefined"
    ? import.meta.env?.DEV === true          // Vite
    : process.env?.NODE_ENV === "development"; // CRA

const isMobileDevice = (() => {
  const ua =
    /android|iphone|ipad|ipod|blackberry|windows phone|opera mini|mobile/i.test(
      navigator.userAgent,
    );
  const touch = (navigator.maxTouchPoints || 0) > 1;
  const narrow = window.innerWidth <= 1024;
  return ua || (touch && narrow);
})();

const POLL_MS = isMobileDevice ? 1500 : 800;

/* ─ styles (giữ lại vì body user-select:none vẫn cần) ─── */
const CSS = `
body {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
input, textarea, [contenteditable] {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  user-select: text !important;
}
`;

/* ─ DevTools detection ─────────────────────────────────── */

// Đếm số lần detect liên tiếp — tránh false positive từ React DevTools extension
let _consecutiveHits = 0;
const REQUIRED_HITS = 2; // phải detect 2 lần liên tiếp mới tính là mở

function checkWindowSize() {
  if (isMobileDevice) return false;
  return (
    window.outerWidth - window.innerWidth > 120 ||
    window.outerHeight - window.innerHeight > 120
  );
}

function checkConsole() {
  return false;
}

function checkToString() {
  return false;
}

function checkDebugger() {
  if (IS_DEV || isMobileDevice) return false;
  const t0 = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  return performance.now() - t0 > 80;
}

function checkFirebug() {
  return !!(window.console && window.console.firebug);
}

function isDevToolsOpen() {
  const raw =
    checkConsole() ||
    checkToString() ||
    checkWindowSize() ||
    checkDebugger() ||
    checkFirebug();
  // Yêu cầu REQUIRED_HITS lần liên tiếp để tránh false positive
  if (raw) {
    _consecutiveHits++;
    return _consecutiveHits >= REQUIRED_HITS;
  } else {
    _consecutiveHits = 0;
    return false;
  }
}

// In cảnh báo màu đỏ ra Console khi phát hiện DevTools mở
function logDevToolsWarning() {
  console.log(
    "%c⚠ CẢNH BÁO BẢO MẬT — EARTHORIA",
    "color:#ff2d2d;font-size:22px;font-weight:bold;text-shadow:1px 1px 0 #000;",
  );
  console.log(
    "%cCông cụ DevTools đã được phát hiện. Việc can thiệp mã nguồn, dữ liệu hoặc tài sản của Earthoria có thể vi phạm điều khoản sử dụng.",
    "color:#ff5c5c;font-size:13px;",
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function EarthoriaSecurity() {
  // Lấy cờ bật/tắt từ server, tự động refetch mỗi 60s — admin đổi ở dashboard
  // là mọi người đang mở web đều nhận được ngay, không cần F5 lại trang.
  const { data: siteSettings } = useQuery({
    queryKey: ["public-site-settings"],
    queryFn: () => settingsService.getPublic().then((r) => r.data.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
  const protectionEnabled = siteSettings?.devtoolsProtectionEnabled !== false; // mặc định true khi chưa load xong

  const stateRef = useRef({
    devToolsOpen:        false,
    orientationChanging: false,
    tabHidden:           false,
    pollTimer:           null,
  });

  /*  inject CSS once  */
  useEffect(() => {
    if (document.getElementById("eth-sec-styles")) return;
    const style = document.createElement("style");
    style.id = "eth-sec-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);

  /*  poll tick  */
  const tick = useCallback(() => {
    if (!protectionEnabled) return;
    const S = stateRef.current;
    if (S.tabHidden || S.orientationChanging) return;

    const open = isDevToolsOpen();

    if (open && !S.devToolsOpen) {
      S.devToolsOpen = true;
      logDevToolsWarning();
    } else if (!open && S.devToolsOpen) {
      S.devToolsOpen = false;
    }
  }, [protectionEnabled]);

  /*  start / stop polling  */
  const startPolling = useCallback(() => {
    const S = stateRef.current;
    if (S.pollTimer) clearInterval(S.pollTimer);
    S.pollTimer = setInterval(tick, POLL_MS);
  }, [tick]);

  const stopPolling = useCallback(() => {
    clearInterval(stateRef.current.pollTimer);
    stateRef.current.pollTimer = null;
  }, []);

  /*  boot effects  */
  useEffect(() => {
    if (!protectionEnabled) {
      stopPolling();
      return;
    }

    /* initial devtools check */
    setTimeout(tick, 300);

    /* start polling */
    startPolling();

    /* orientation guard */
    const onOrientation = () => {
      stateRef.current.orientationChanging = true;
      setTimeout(() => {
        stateRef.current.orientationChanging = false;
      }, 850);
    };

    /* visibility guard */
    const onVisibility = () => {
      stateRef.current.tabHidden = document.hidden;
      if (document.hidden) stopPolling();
      else {
        startPolling();
        tick();
      }
    };

    /* resize re-check (desktop only) */
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(tick, 200);
    };

    window.addEventListener("orientationchange", onOrientation);
    document.addEventListener("visibilitychange", onVisibility);
    if (!isMobileDevice) window.addEventListener("resize", onResize);

    return () => {
      stopPolling();
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      if (!isMobileDevice) window.removeEventListener("resize", onResize);
    };
  }, [tick, startPolling, stopPolling, protectionEnabled]);

  /*  keyboard & context-menu blocking (desktop only)  */
  useEffect(() => {
    if (isMobileDevice || !protectionEnabled) return;

    const onKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key;

      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Chặn thêm Ctrl+Shift+K (Console của Firefox)
      if (
        ctrl &&
        shift &&
        ["i", "I", "j", "J", "c", "C", "k", "K"].includes(key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (ctrl && ["u", "U"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (ctrl && ["s", "S"].includes(key)) {
        e.preventDefault();
        return;
      }
      if (ctrl && ["a", "A"].includes(key)) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
      }
    };

    const onContextMenu = (e) => e.preventDefault();

    const onDragStart = (e) => {
      const tag = e.target?.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA") e.preventDefault();
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, [protectionEnabled]);

  return null;
}