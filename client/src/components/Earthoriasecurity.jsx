import { useEffect, useRef, useCallback } from "react";

/* ─── helpers ─────────────────────────────────────────────── */
const IS_DEV =
  typeof import.meta !== "undefined"
    ? import.meta.env?.DEV === true          // Vite
    : process.env?.NODE_ENV === "development"; // CRA

const isMobileDevice = (() => {
  const ua = /android|iphone|ipad|ipod|blackberry|windows phone|opera mini|mobile/i
    .test(navigator.userAgent);
  const touch = (navigator.maxTouchPoints || 0) > 1;
  const narrow = window.innerWidth <= 1024;
  return ua || (touch && narrow);
})();

const POLL_MS = isMobileDevice ? 1500 : 800;
const SESSION_KEY = "eth_cr_accepted";

/* ─── styles (injected once) ──────────────────────────────── */
const CSS = `
#content-guard { display: none !important; }
#main-content  { display: block !important; }

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

#eth-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2147483647;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(10,14,12,0.97);
  backdrop-filter: blur(18px) saturate(1.3);
  -webkit-backdrop-filter: blur(18px) saturate(1.3);
  animation: ethFadeIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
  font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
  box-sizing: border-box;
  padding: 60px 16px 32px;
  overflow-y: auto;
}
#eth-overlay.eth-show { display: flex; }

@keyframes ethFadeIn {
  from { opacity:0; transform:scale(0.97); }
  to   { opacity:1; transform:scale(1); }
}

.eth-card {
  position: relative;
  width: min(520px, 92vw);
  background: #0d1a14;
  border: 0.5px solid rgba(74,158,63,0.35);
  overflow: hidden;
}
.eth-card::before {
  content:'';
  position:absolute; inset:0;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(74,158,63,0.12) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 100%, rgba(45,122,110,0.10) 0%, transparent 55%);
  pointer-events:none;
}
.eth-card-grid {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 40px 40px;
}
.eth-corner { position:absolute; width:14px; height:14px; }
.eth-corner.tl { top:0; left:0; border-top:1.5px solid #4a9e3f; border-left:1.5px solid #4a9e3f; }
.eth-corner.tr { top:0; right:0; border-top:1.5px solid #4a9e3f; border-right:1.5px solid #4a9e3f; }
.eth-corner.bl { bottom:0; left:0; border-bottom:1.5px solid #4a9e3f; border-left:1.5px solid #4a9e3f; }
.eth-corner.br { bottom:0; right:0; border-bottom:1.5px solid #4a9e3f; border-right:1.5px solid #4a9e3f; }

.eth-topbar {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 24px;
  border-bottom:0.5px solid rgba(255,255,255,0.07);
  position:relative; z-index:1;
}
.eth-logo { display:flex; align-items:center; gap:10px; }
.eth-logo-mark {
  width:28px; height:28px;
  border:1px solid rgba(74,158,63,0.6);
  display:flex; align-items:center; justify-content:center;
  transform:rotate(45deg); flex-shrink:0;
  animation:ethLogoSpin 8s linear infinite;
}
@keyframes ethLogoSpin { to { transform:rotate(405deg); } }
.eth-logo-mark svg { transform:rotate(-45deg); }
.eth-logo-text {
  font-family:'Playfair Display',serif;
  font-size:13px; letter-spacing:0.2em;
  color:rgba(250,248,243,0.9); font-weight:400;
}
.eth-status-pill {
  display:flex; align-items:center; gap:6px;
  padding:4px 10px;
  border:0.5px solid rgba(74,158,63,0.3);
  font-size:9px; letter-spacing:0.18em; text-transform:uppercase;
  color:rgba(74,158,63,0.9);
}
.eth-pulse {
  width:6px; height:6px; border-radius:50%;
  background:#4a9e3f;
  animation:ethPulse 1.8s ease-in-out infinite;
}
@keyframes ethPulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.35; transform:scale(0.65); }
}

.eth-body { padding:36px 36px 28px; position:relative; z-index:1; }

.eth-icon-ring {
  width:72px; height:72px; margin:0 auto 28px;
  border:0.5px solid rgba(74,158,63,0.4);
  display:flex; align-items:center; justify-content:center;
  position:relative;
}
.eth-icon-ring::before {
  content:'';
  position:absolute; inset:6px;
  border:0.5px solid rgba(74,158,63,0.2);
  animation:ethRingRotate 6s linear infinite;
}
@keyframes ethRingRotate { to { transform:rotate(360deg); } }

.eth-eyebrow {
  display:flex; align-items:center; gap:14px;
  justify-content:center; margin-bottom:16px;
}
.eth-eyebrow-line { width:32px; height:0.5px; background:#4a9e3f; }
.eth-eyebrow-text {
  font-size:9px; letter-spacing:0.26em; text-transform:uppercase;
  color:#4a9e3f; font-weight:400;
}
.eth-headline {
  font-family:'Playfair Display',serif;
  font-size:clamp(22px,4vw,32px); font-weight:300;
  color:rgba(250,248,243,0.95); line-height:1.15;
  text-align:center; margin-bottom:8px; letter-spacing:-0.01em;
}
.eth-headline em { font-style:italic; color:#4a9e3f; }
.eth-subtitle {
  font-size:13px; line-height:1.75; font-weight:300;
  color:rgba(250,248,243,0.45); text-align:center;
  max-width:360px; margin:0 auto 28px;
}
.eth-ornament {
  display:flex; align-items:center; gap:12px; margin:0 0 24px;
}
.eth-ornament-line { flex:1; height:0.5px; background:rgba(74,158,63,0.2); }
.eth-ornament-mark { width:6px; height:6px; border:0.5px solid rgba(74,158,63,0.5); transform:rotate(45deg); }
.eth-copyright {
  padding:20px 22px;
  background:rgba(255,255,255,0.025);
  border:0.5px solid rgba(255,255,255,0.06);
  margin-bottom:24px;
}
.eth-cr-row { display:flex; align-items:flex-start; gap:14px; margin-bottom:14px; }
.eth-cr-row:last-child { margin-bottom:0; }
.eth-cr-icon {
  width:32px; height:32px; border:0.5px solid rgba(74,158,63,0.3);
  display:flex; align-items:center; justify-content:center;
  color:#4a9e3f; flex-shrink:0; margin-top:2px;
}
.eth-cr-title {
  font-size:11px; letter-spacing:0.14em; text-transform:uppercase;
  color:rgba(250,248,243,0.7); margin-bottom:4px; font-weight:400;
}
.eth-cr-desc { font-size:12px; line-height:1.65; color:rgba(250,248,243,0.4); font-weight:300; }
.eth-actions { display:flex; gap:10px; }
.eth-btn-main {
  flex:1;
  font-family:'Be Vietnam Pro',sans-serif;
  font-size:10px; letter-spacing:0.18em; text-transform:uppercase;
  background:#0d3330; color:rgba(250,248,243,0.9);
  border:0.5px solid rgba(74,158,63,0.4);
  padding:13px 20px; cursor:pointer; transition:all 0.3s;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.eth-btn-main:hover { background:#1a5c52; border-color:#4a9e3f; }
.eth-btn-main:disabled { opacity:0.5; pointer-events:none; }
.eth-footer {
  padding:14px 36px;
  border-top:0.5px solid rgba(255,255,255,0.06);
  display:flex; align-items:center; justify-content:space-between;
  position:relative; z-index:1;
}
.eth-footer-copy { font-size:10px; color:rgba(255,255,255,0.2); letter-spacing:0.07em; }
.eth-footer-link {
  font-size:10px; letter-spacing:0.12em; text-transform:uppercase;
  color:rgba(74,158,63,0.6); text-decoration:none; transition:color 0.3s;
}
.eth-footer-link:hover { color:#4a9e3f; }
.eth-device-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:4px 10px;
  border:0.5px solid rgba(255,255,255,0.12);
  font-size:9px; letter-spacing:0.14em; text-transform:uppercase;
  color:rgba(255,255,255,0.3); margin-bottom:10px;
}
`;

/* ─── DevTools detection ───────────────────────────────────── */

// Đếm số lần detect liên tiếp — tránh false positive từ React DevTools extension
let _consecutiveHits = 0;
const REQUIRED_HITS = 2; // phải detect 2 lần liên tiếp mới tính là mở

function checkWindowSize() {
  if (isMobileDevice) return false;
  return (
    window.outerWidth  - window.innerWidth  > 120 ||
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
  const raw = (
    checkConsole()    ||
    checkToString()   ||
    checkWindowSize() ||
    checkDebugger()   ||
    checkFirebug()
  );
  // Yêu cầu REQUIRED_HITS lần liên tiếp để tránh false positive
  if (raw) {
    _consecutiveHits++;
    return _consecutiveHits >= REQUIRED_HITS;
  } else {
    _consecutiveHits = 0;
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════ */
export default function EarthoriaSecurity() {
  const stateRef = useRef({
    devToolsOpen:        false,
    overlayMode:         "copyright", // "copyright" | "devtools"
    orientationChanging: false,
    tabHidden:           false,
    pollTimer:           null,
  });

  /* ── inject CSS once ── */
  useEffect(() => {
    if (document.getElementById("eth-sec-styles")) return;
    const style = document.createElement("style");
    style.id    = "eth-sec-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);

  /* ── overlay helpers ── */
  const getOverlay = () => document.getElementById("eth-overlay");

  const showOverlay = useCallback((mode) => {
    const el = getOverlay();
    if (!el) return;

    const crContent = document.getElementById("eth-cr-content");
    const dtContent = document.getElementById("eth-dt-content");
    const iconCR    = document.getElementById("eth-icon-cr");
    const iconDT    = document.getElementById("eth-icon-dt");
    const iconRing  = document.getElementById("eth-icon-ring");

    if (mode === "devtools") {
      if (crContent) crContent.style.display = "none";
      if (dtContent) dtContent.style.display = "block";
      if (iconCR)    iconCR.style.display    = "none";
      if (iconDT)    iconDT.style.display    = "flex";
      if (iconRing)  iconRing.style.borderColor = "rgba(224,122,95,0.4)";
    } else {
      if (crContent) crContent.style.display = "block";
      if (dtContent) dtContent.style.display = "none";
      if (iconCR)    iconCR.style.display    = "flex";
      if (iconDT)    iconDT.style.display    = "none";
      if (iconRing)  iconRing.style.borderColor = "rgba(74,158,63,0.4)";
    }

    stateRef.current.overlayMode = mode;
    el.classList.add("eth-show");
    document.body.style.overflow = "hidden";

    const firstBtn = el.querySelector("button:not(:disabled)");
    if (firstBtn) setTimeout(() => firstBtn.focus(), 50);
  }, []);

  const hideOverlay = useCallback(() => {
    const el = getOverlay();
    if (!el) return;
    el.classList.remove("eth-show");
    document.body.style.overflow = "";
  }, []);

  /* ── poll tick ── */
  const tick = useCallback(() => {
    const S = stateRef.current;
    if (S.tabHidden || S.orientationChanging) return;

    const open = isDevToolsOpen();

    if (open && !S.devToolsOpen) {
      S.devToolsOpen = true;
      showOverlay("devtools");
    } else if (!open && S.devToolsOpen) {
      S.devToolsOpen = false;
      if (S.overlayMode === "devtools") hideOverlay();
    }
  }, [showOverlay, hideOverlay]);

  /* ── start / stop polling ── */
  const startPolling = useCallback(() => {
    const S = stateRef.current;
    if (S.pollTimer) clearInterval(S.pollTimer);
    S.pollTimer = setInterval(tick, POLL_MS);
  }, [tick]);

  const stopPolling = useCallback(() => {
    clearInterval(stateRef.current.pollTimer);
    stateRef.current.pollTimer = null;
  }, []);

  /* ── boot effects ── */
  useEffect(() => {
    /* copyright notice on first visit (per session) */
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(() => {
        showOverlay("copyright");
        sessionStorage.setItem(SESSION_KEY, "1");
      }, 800);
    }

    /* initial devtools check */
    setTimeout(tick, 300);

    /* start polling */
    startPolling();

    /* orientation guard */
    const onOrientation = () => {
      stateRef.current.orientationChanging = true;
      setTimeout(() => { stateRef.current.orientationChanging = false; }, 850);
    };

    /* visibility guard */
    const onVisibility = () => {
      stateRef.current.tabHidden = document.hidden;
      if (document.hidden) stopPolling();
      else { startPolling(); tick(); }
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
  }, [tick, startPolling, stopPolling, showOverlay]);

  /* ── keyboard & context-menu blocking (desktop only) ── */
  useEffect(() => {
    if (isMobileDevice) return;

    const onKeyDown = (e) => {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key;

      if (key === "F12") { e.preventDefault(); e.stopPropagation(); return; }
      if (ctrl && shift && ["i","I","j","J","c","C"].includes(key)) {
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (ctrl && ["u","U"].includes(key)) { e.preventDefault(); e.stopPropagation(); return; }
      if (ctrl && ["s","S"].includes(key)) { e.preventDefault(); return; }
      if (ctrl && ["a","A"].includes(key)) {
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

    document.addEventListener("keydown",     onKeyDown,     true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart",   onDragStart);

    return () => {
      document.removeEventListener("keydown",     onKeyDown,     true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart",   onDragStart);
    };
  }, []);

  /* ── close handler (exposed to inline onclick) ── */
  useEffect(() => {
    window.__ethCloseCopyright = () => {
      if (stateRef.current.overlayMode === "copyright") hideOverlay();
    };
    return () => { delete window.__ethCloseCopyright; };
  }, [hideOverlay]);

  /* ── render overlay DOM ── */
  return (
    <div id="eth-overlay" role="alertdialog" aria-modal="true" aria-labelledby="eth-title">
      <div className="eth-card">
        <div className="eth-card-grid" />
        <div className="eth-corner tl" />
        <div className="eth-corner tr" />
        <div className="eth-corner bl" />
        <div className="eth-corner br" />

        {/* Top bar */}
        <div className="eth-topbar">
          <div className="eth-logo">
            <div className="eth-logo-mark">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="#4a9e3f" strokeWidth="1" fill="none"/>
                <path d="M8 5L11 8L8 11L5 8L8 5Z" fill="#4a9e3f"/>
              </svg>
            </div>
            <span className="eth-logo-text">EARTHORIA</span>
          </div>
          <div className="eth-status-pill">
            <div className="eth-pulse" />
            <span>Bảo vệ nội dung</span>
          </div>
        </div>

        {/* Body */}
        <div className="eth-body">
          {/* Icon ring */}
          <div className="eth-icon-ring" id="eth-icon-ring">
            <div id="eth-icon-cr">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#4a9e3f" strokeWidth="1.2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M14.5 9a4 4 0 1 0 0 6"/>
              </svg>
            </div>
            <div id="eth-icon-dt" style={{ display: "none" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#e07a5f" strokeWidth="1.2" aria-hidden="true">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
          </div>

          {/* ── COPYRIGHT content ── */}
          <div id="eth-cr-content">
            <div className="eth-eyebrow">
              <div className="eth-eyebrow-line" />
              <span className="eth-eyebrow-text">Bảo vệ bản quyền</span>
              <div className="eth-eyebrow-line" />
            </div>
            <h1 className="eth-headline" id="eth-title">
              Tác phẩm được<br />bảo hộ <em>bản quyền</em>
            </h1>
            <p className="eth-subtitle">
              Toàn bộ nội dung, hình ảnh và mã nguồn trên Earthoria
              được bảo vệ theo pháp luật sở hữu trí tuệ.
            </p>
            <div className="eth-ornament">
              <div className="eth-ornament-line" />
              <div className="eth-ornament-mark" />
              <div className="eth-ornament-line" />
            </div>
            <div className="eth-copyright">
              <div className="eth-cr-row">
                <div className="eth-cr-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div className="eth-cr-title">Quyền sở hữu trí tuệ</div>
                  <div className="eth-cr-desc">
                    Bản quyền © 2026 Earthoria. Mọi nội dung — văn bản, hình ảnh,
                    mô hình AR, âm thanh — đều thuộc quyền sở hữu độc quyền của Earthoria.
                    All rights reserved.
                  </div>
                </div>
              </div>
              <div className="eth-cr-row">
                <div className="eth-cr-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <div>
                  <div className="eth-cr-title">Nghiêm cấm sao chép</div>
                  <div className="eth-cr-desc">
                    Sao chép, phân phối, chỉnh sửa hoặc sử dụng thương mại bất kỳ
                    nội dung nào khi chưa có sự cho phép bằng văn bản là vi phạm pháp luật.
                  </div>
                </div>
              </div>
              <div className="eth-cr-row">
                <div className="eth-cr-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="eth-cr-title">Liên hệ hợp tác</div>
                  <div className="eth-cr-desc">
                    Để được cấp phép sử dụng:{" "}
                    <span style={{ color: "rgba(74,158,63,0.8)" }}>earthoriavn@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="eth-actions">
              <button className="eth-btn-main" onClick={() => window.__ethCloseCopyright?.()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Tôi đã hiểu / I Understand
              </button>
              <button
                className="eth-btn-main"
                style={{ flex: 0, padding: "13px 16px" }}
                onClick={() => { window.location.href = "mailto:earthoriavn@gmail.com"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── DEVTOOLS content ── */}
          <div id="eth-dt-content" style={{ display: "none" }}>
            <div className="eth-eyebrow">
              <div className="eth-eyebrow-line" style={{ background: "#e07a5f" }} />
              <span className="eth-eyebrow-text" style={{ color: "#e07a5f" }}>Cảnh báo bảo mật</span>
              <div className="eth-eyebrow-line" style={{ background: "#e07a5f" }} />
            </div>
            <h1 className="eth-headline" style={{ color: "rgba(250,200,180,0.95)" }}>
              DevTools đã<br />được <em style={{ color: "#e07a5f" }}>phát hiện</em>
            </h1>
            <p className="eth-subtitle">
              Công cụ phát triển trình duyệt đã được mở.<br />
              Developer tools have been detected. Access is restricted.
            </p>
            <div className="eth-ornament">
              <div className="eth-ornament-line" style={{ background: "rgba(224,122,95,0.2)" }} />
              <div className="eth-ornament-mark" style={{ borderColor: "rgba(224,122,95,0.5)" }} />
              <div className="eth-ornament-line" style={{ background: "rgba(224,122,95,0.2)" }} />
            </div>
            <div className="eth-copyright">
              <div className="eth-cr-row">
                <div className="eth-cr-icon" style={{ borderColor: "rgba(224,122,95,0.3)", color: "#e07a5f" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div className="eth-cr-title" style={{ color: "rgba(250,200,180,0.7)" }}>Truy cập bị hạn chế</div>
                  <div className="eth-cr-desc">
                    Vui lòng đóng DevTools để tiếp tục. Nội dung trang sẽ được khôi phục
                    sau khi công cụ phát triển được tắt.
                  </div>
                </div>
              </div>
              <div className="eth-cr-row">
                <div className="eth-cr-icon" style={{ borderColor: "rgba(224,122,95,0.3)", color: "#e07a5f" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div className="eth-cr-title" style={{ color: "rgba(250,200,180,0.7)" }}>Bảo vệ tài sản</div>
                  <div className="eth-cr-desc">
                    Earthoria bảo vệ mã nguồn, nội dung AR và tài sản kỹ thuật số
                    chống lại việc sao chép trái phép thông qua các biện pháp kỹ thuật.
                  </div>
                </div>
              </div>
            </div>
            <div className="eth-device-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>{isMobileDevice ? "Mobile detected" : "Desktop detected"}</span>
            </div>
            <div className="eth-actions">
              <button className="eth-btn-main" disabled>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Đóng DevTools để tiếp tục / Close DevTools
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="eth-footer">
          <span className="eth-footer-copy">© 2026 Earthoria · All rights reserved</span>
          <a href="mailto:earthoriavn@gmail.com" className="eth-footer-link">Liên hệ</a>
        </div>
      </div>
    </div>
  );
}