import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-07-12T18:00:00+07:00");

function useCountdown(target) {
  const [time, setTime] = useState(() => calc());

  function calc() {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
    return {
      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
      h: Math.floor((diff / (1000 * 60 * 60)) % 24),
      m: Math.floor((diff / (1000 * 60)) % 60),
      s: Math.floor((diff / 1000) % 60),
      done: false,
    };
  }

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

const REASONS = [
  {
    title: "Cập nhật chính sách vận hành",
    body: "Đồng bộ lại các điều khoản dịch vụ, chính sách đổi trả và bảo mật dữ liệu người dùng theo quy định mới nhất.",
  },
  {
    title: "Nâng cấp hiệu năng xem AR",
    body: "Tối ưu tốc độ dựng hình và độ mượt khi xem sách ở chế độ thực tế tăng cường (AR), giảm thời gian tải mô hình 3D.",
  },
  {
    title: "Nâng cấp hệ thống nhận diện địa chỉ giao hàng",
    body: "Cải thiện độ chính xác khi tự động nhận diện, chuẩn hoá địa chỉ giao hàng để hạn chế sai sót và thất lạc đơn hàng.",
  },
];

export default function Maintenance() {
  const { d, h, m, s, done } = useCountdown(TARGET_DATE);

  // As soon as the countdown finishes, refresh automatically so the
  // person sees the live site without needing to reload by hand.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => window.location.reload(), 1200);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <div style={styles.page}>
      <style>{GLOBAL_CSS}</style>

      {/* ══ LEFT — Atmosphere panel (hidden < 980px) ══ */}
      <div className="em-visual-hide" style={styles.visual}>
        <div style={styles.vVignette} />
        <div style={styles.vWatermark}>
          <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
            <path
              d="M260 120L440 190V430L260 372V120Z"
              stroke="#5cb84f"
              strokeWidth="0.75"
              opacity="0.5"
            />
            <path
              d="M260 120L80 190V430L260 372V120Z"
              stroke="#5cb84f"
              strokeWidth="0.75"
              opacity="0.5"
            />
            <line
              x1="260"
              y1="120"
              x2="260"
              y2="372"
              stroke="#5cb84f"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </svg>
        </div>

        <div className="em-rise-1" style={styles.vCenter}>
          <div style={styles.bookMark}>
            <svg width="34" height="34" viewBox="0 0 56 56" fill="none">
              <g className="em-page-fold">
                <path
                  d="M28 8L48 18V46L28 38V8Z"
                  stroke="#5cb84f"
                  strokeWidth="1"
                  fill="rgba(92,184,79,0.07)"
                />
                <path
                  d="M28 8L8 18V46L28 38V8Z"
                  stroke="#5cb84f"
                  strokeWidth="1"
                  fill="rgba(92,184,79,0.13)"
                />
                <line
                  x1="28"
                  y1="8"
                  x2="28"
                  y2="38"
                  stroke="#5cb84f"
                  strokeWidth="0.75"
                  opacity="0.6"
                />
              </g>
            </svg>
          </div>

          <div className="em-rise-2" style={styles.vEyebrow}>
            <span style={styles.vEyebrowLine} />
            <span style={styles.vEyebrowText}>Earthoria</span>
            <span style={styles.vEyebrowLine} />
          </div>

          <h2 className="em-rise-3" style={styles.vHeadline}>
            Mỗi cuốn sách
            <br />
            cần một <em style={styles.vHeadlineEm}>khoảnh khắc</em>
            <br />
            nghỉ ngơi
          </h2>

          <p className="em-rise-4" style={styles.vSub}>
            Đằng sau cánh cửa khép, đội ngũ của chúng tôi đang sắp xếp lại từng
            trang sách số để hành trình tiếp theo của bạn mượt mà hơn.
          </p>
        </div>

        <div className="em-rise-5" style={styles.vQuote}>
          <span style={styles.vQuoteMark}>“</span>
          <p style={styles.vQuoteText}>
            Một thư viện không bao giờ thực sự đóng cửa — nó chỉ đang lật sang
            trang mới.
          </p>
        </div>
      </div>

      {/* ══ RIGHT — Announcement panel ══ */}
      <div className="em-panel" style={styles.panel}>
        <div style={styles.panelRing} />

        <div className="em-rise-1 em-panel-wrap" style={styles.panelWrap}>
          <div style={styles.card}>
            <span style={styles.cardEdge} />

            {/* Header row — badge left, logo right, same line */}
            <div style={styles.headerRow}>
              <div style={styles.badge}>
                <span style={styles.badgeDot} />
                <span style={styles.badgeText}>Thông báo bảo trì hệ thống</span>
              </div>
              <div className="em-logo-wrap" style={styles.logoWrapHeader}>
                <img
                  src="/logo-footer.png"
                  alt="Earthoria"
                  style={styles.headerLogo}
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="em-title" style={styles.title}>
              Chúng tôi đang <em style={styles.titleEm}>nâng cấp</em>
              <br className="em-title-br" /> trải nghiệm của bạn
            </h1>

            <p style={styles.desc}>
              Earthoria tạm ngưng phục vụ trong thời gian ngắn để thực hiện các
              nâng cấp dưới đây. Xin lỗi vì sự bất tiện này — mọi dữ liệu, đơn
              hàng và tủ sách của bạn đều được giữ nguyên vẹn.
            </p>

            <div style={styles.noteRow}>
              <span style={styles.plannedNote}>
                “Đây là hành động đã được lên kế hoạch trước, không phải sự cố.”
              </span>
              <span style={styles.signOff}>— Đội ngũ Quản lý Earthoria</span>
            </div>

            {/* Countdown — signature element */}
            <div className="em-countdown-card" style={styles.countdownCard}>
              <div style={styles.countdownLabel}>
                Dự kiến hoạt động trở lại sau
              </div>

              {done ? (
                <div style={styles.doneBox}>
                  <span className="em-spinner" style={styles.spinner} />
                  <span>Đã hoàn tất — đang tự động tải lại trang…</span>
                </div>
              ) : (
                <div className="em-units" style={styles.units}>
                  {[
                    { v: d, l: "Ngày" },
                    { v: h, l: "Giờ" },
                    { v: m, l: "Phút" },
                    { v: s, l: "Giây" },
                  ].map((u, i) => (
                    <div
                      key={u.l}
                      style={{ display: "flex", alignItems: "flex-start" }}
                    >
                      <div style={styles.unit}>
                        <span
                          key={u.v}
                          className="em-num-tick"
                          style={styles.unitNum}
                        >
                          {pad(u.v)}
                        </span>
                        <span style={styles.unitLabel}>{u.l}</span>
                      </div>
                      {i < 3 && <span style={styles.colon}>:</span>}
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.countdownFoot}>
                <span style={styles.countdownFootLine} />
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5a6b60"
                  strokeWidth="1.5"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                <span>
                  Dự kiến hoàn thành lúc{" "}
                  <strong style={styles.timePillStrong}>
                    18:00 · 12/07/2026
                  </strong>
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>Liên hệ hỗ trợ</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Contact list */}
            <div className="em-contact-grid" style={styles.contactGrid}>
              <a
                href="mailto:earthoriavn@gmail.com"
                style={styles.contactRow}
                className="em-contact-card"
              >
                <div style={styles.contactIcon}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4a9e3f"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 6L2 7" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.contactLabel}>Email chính thức</div>
                  <div style={styles.contactValue}>earthoriavn@gmail.com</div>
                </div>
              </a>

              <span className="em-contact-sep" style={styles.contactSep} />

              <a
                href="mailto:helpdesk.earthoria@gmail.com"
                style={styles.contactRow}
                className="em-contact-card"
              >
                <div style={styles.contactIcon}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4a9e3f"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 3" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={styles.contactLabel}>Email phòng IT</div>
                  <div style={styles.contactValue}>
                    helpdesk.earthoria@gmail.com
                  </div>
                </div>
              </a>
            </div>

            {/* Reasons */}
            <div
              className="em-reasons-card"
              style={{
                ...styles.reasonsCard,
                marginTop: 24,
                marginBottom: 0,
              }}
            >
              <div style={styles.reasonsLabel}>Nội dung nâng cấp lần này</div>
              <div className="em-reasons-scroll" style={styles.reasonsScroll}>
                {REASONS.map((r, i) => (
                  <div key={r.title} style={styles.reasonRow}>
                    <span style={styles.reasonIndex}>{pad(i + 1)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={styles.reasonTitle}>{r.title}</div>
                      <div style={styles.reasonBody}>{r.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PALETTE — copied 1:1 from main.css :root
───────────────────────────────────────── */
const INK = "#0a0e0c";
const FOREST = "#0d3330";
const GOLD = "#4a9e3f";
const GOLD_LIGHT = "#5cb84f";
const GOLD_PALE = "#d4edcf";
const IVORY = "#faf8f3";
const CREAM = "#f7f4ee";
const TEXT_MUTED = "#5a6b60";
const BORDER = "rgba(13, 43, 30, 0.10)";
const BORDER_GOLD = "rgba(74, 158, 63, 0.28)";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500&display=swap');

html, body, #root { height: 100%; margin: 0; }
* { box-sizing: border-box; }

@keyframes pageFoldSlow {
  0%   { transform: rotateY(0deg); }
  45%  { transform: rotateY(-10deg); }
  55%  { transform: rotateY(-10deg); }
  100% { transform: rotateY(0deg); }
}
.em-page-fold { transform-origin: 28px 28px; animation: pageFoldSlow 7s ease-in-out infinite; }

@keyframes ringPulse {
  0%,100% { opacity: 0.55; transform: scale(1); }
  50%     { opacity: 0.9;  transform: scale(1.015); }
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.em-rise-1 { animation: riseIn 0.85s cubic-bezier(.16,1,.3,1) 0.05s both; }
.em-rise-2 { animation: riseIn 0.85s cubic-bezier(.16,1,.3,1) 0.18s both; }
.em-rise-3 { animation: riseIn 0.85s cubic-bezier(.16,1,.3,1) 0.31s both; }
.em-rise-4 { animation: riseIn 0.85s cubic-bezier(.16,1,.3,1) 0.44s both; }
.em-rise-5 { animation: riseIn 0.85s cubic-bezier(.16,1,.3,1) 0.57s both; }

@keyframes numTick {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.em-num-tick { display: inline-block; animation: numTick 0.3s ease both; }

@keyframes badgePulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes logoGlow {
  0%,100% { opacity: 0.3; transform: translate(-50%,-50%) scale(0.94); }
  50%     { opacity: 0.55; transform: translate(-50%,-50%) scale(1.04); }
}
.em-logo-wrap::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 60px; height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74,158,63,0.18) 0%, transparent 72%);
  filter: blur(6px);
  animation: logoGlow 5s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}
.em-logo-wrap img {
  position: relative;
  z-index: 2;
  transition: transform 0.4s cubic-bezier(.16,1,.3,1), filter 0.4s ease;
}
.em-logo-wrap:hover img {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 10px rgba(74,158,63,0.22));
}

.em-contact-card { transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease; }
.em-contact-card:hover { background: rgba(212,237,207,0.32); transform: translateY(-1px); }

/* thin, quiet scrollbars for the panel and the reasons box */
.em-panel { scrollbar-width: thin; scrollbar-color: rgba(74,158,63,0.35) transparent; }
.em-panel::-webkit-scrollbar { width: 6px; }
.em-panel::-webkit-scrollbar-track { background: transparent; }
.em-panel::-webkit-scrollbar-thumb { background: rgba(74,158,63,0.25); border-radius: 3px; }

.em-reasons-scroll { scrollbar-width: thin; scrollbar-color: rgba(74,158,63,0.35) transparent; }
.em-reasons-scroll::-webkit-scrollbar { width: 5px; }
.em-reasons-scroll::-webkit-scrollbar-track { background: transparent; }
.em-reasons-scroll::-webkit-scrollbar-thumb { background: rgba(74,158,63,0.28); border-radius: 3px; }

/* ── Tablet / small desktop: tighten panel ── */
@media (max-width: 1180px) {
  .em-panel-wrap { max-width: 480px !important; }
}

/* ── Mobile: stack to single column, hide visual panel, allow scroll ── */
@media (max-width: 980px) {
  .em-visual-hide { display: none !important; }
  .em-panel {
    height: auto !important;
    min-height: 100vh !important;
    grid-column: 1 / -1 !important;
    padding: 28px 16px !important;
    align-items: flex-start !important;
  }
  .em-panel-wrap { max-width: 480px !important; margin: auto !important; padding: 20px 0 !important; }
  .em-title-br { display: none; }
  .em-units { gap: 2px !important; }
  .em-contact-grid { grid-template-columns: 1fr !important; gap: 4px !important; }
  .em-contact-sep { display: none !important; }
  .em-logo-wrap { width: 40px !important; height: 40px !important; }
  .em-logo-wrap img { width: 34px !important; height: 34px !important; }
}

@media (max-width: 420px) {
  .em-units { justify-content: space-between !important; width: 100%; }
  .em-units > div { min-width: 0 !important; }
}
`;

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    display: "grid",
    gridTemplateColumns: "0.6fr 1.4fr",
    overflow: "hidden",
    WebkitFontSmoothing: "antialiased",
  },

  /* ══ LEFT VISUAL PANEL ══ */
  visual: {
    position: "relative",
    background: `linear-gradient(165deg, ${FOREST} 0%, #0a2622 58%, ${INK} 100%)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 40px",
    overflow: "hidden",
    height: "100vh",
  },
  vVignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 38%, rgba(92,184,79,0.10) 0%, transparent 62%)",
    pointerEvents: "none",
  },
  vWatermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    opacity: 0.5,
    pointerEvents: "none",
  },

  vCenter: {
    position: "relative",
    zIndex: 3,
    textAlign: "center",
    maxWidth: 300,
  },
  bookMark: {
    position: "relative",
    width: 56,
    height: 56,
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid rgba(92,184,79,0.28)",
    borderRadius: "50%",
  },

  vEyebrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  vEyebrowLine: { width: 16, height: 0.5, background: "rgba(92,184,79,0.5)" },
  vEyebrowText: {
    fontSize: 10,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: GOLD_LIGHT,
    fontWeight: 500,
  },

  vHeadline: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 400,
    fontSize: "clamp(20px, 1.8vw, 27px)",
    lineHeight: 1.32,
    color: IVORY,
    margin: "0 0 16px",
    letterSpacing: "0",
  },
  vHeadlineEm: { fontStyle: "italic", color: GOLD_LIGHT },

  vSub: {
    fontSize: 12,
    lineHeight: 1.85,
    color: "rgba(250,248,243,0.5)",
    fontWeight: 300,
    maxWidth: 260,
    margin: "0 auto",
  },

  vQuote: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    zIndex: 3,
    paddingTop: 20,
    borderTop: "0.5px solid rgba(255,255,255,0.09)",
    display: "flex",
    gap: 9,
    alignItems: "flex-start",
  },
  vQuoteMark: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 26,
    color: GOLD_LIGHT,
    opacity: 0.4,
    lineHeight: 0.6,
  },
  vQuoteText: {
    fontSize: 11,
    fontStyle: "italic",
    color: "rgba(250,248,243,0.4)",
    lineHeight: 1.7,
    fontFamily: "'Playfair Display', serif",
  },

  /* ══ RIGHT PANEL ══ */
  panel: {
    position: "relative",
    background: `radial-gradient(ellipse 100% 60% at 25% -8%, ${GOLD_PALE}38, transparent 55%), linear-gradient(180deg, ${IVORY} 0%, ${CREAM} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px clamp(24px, 5vw, 64px)",
    overflowY: "auto",
    overflowX: "hidden",
    height: "100vh",
    boxSizing: "border-box",
  },
  panelRing: {
    position: "absolute",
    top: "-16%",
    right: "-10%",
    width: 320,
    height: 320,
    borderRadius: "50%",
    border: `0.5px solid ${BORDER}`,
    animation: "ringPulse 8s ease-in-out infinite",
  },

  panelWrap: {
    position: "relative",
    zIndex: 2,
    maxWidth: 620,
    width: "100%",
    margin: "auto",
  },

  /* Letterpress-style card that frames the whole announcement */
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.55)",
    border: `0.5px solid ${BORDER}`,
    borderRadius: 4,
    padding: "clamp(28px, 3.4vw, 44px) clamp(28px, 4vw, 48px)",
    boxShadow:
      "0 30px 70px -30px rgba(13,51,48,0.16), 0 2px 0 rgba(255,255,255,0.6) inset",
    backdropFilter: "blur(6px)",
    overflow: "hidden",
  },
  cardEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 45%, ${GOLD_PALE} 100%)`,
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px 6px 12px",
    border: `0.5px solid ${BORDER_GOLD}`,
    borderRadius: 2,
    background: "rgba(255,255,255,0.6)",
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: GOLD,
    animation: "badgePulse 2.4s ease-in-out infinite",
  },
  badgeText: {
    fontSize: 9.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: FOREST,
    fontWeight: 500,
  },

  logoWrapHeader: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  headerLogo: {
    position: "relative",
    zIndex: 2,
    width: 36,
    height: 36,
    objectFit: "contain",
  },

  title: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 400,
    fontSize: "clamp(27px, 2.5vw, 36px)",
    lineHeight: 1.22,
    color: FOREST,
    margin: "0 0 16px",
    letterSpacing: "-0.005em",
  },
  titleEm: { fontStyle: "italic", color: GOLD },

  desc: {
    fontSize: 13.5,
    lineHeight: 1.8,
    color: TEXT_MUTED,
    fontWeight: 300,
    margin: "0 0 18px",
    maxWidth: 480,
  },

  /* Fixed-height reasons box — content scrolls internally so the page
     frame never grows past the viewport regardless of how much copy
     is added later. */
  reasonsCard: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%)`,
    border: `0.5px solid ${BORDER}`,
    borderRadius: 3,
    padding: "16px clamp(16px, 3vw, 22px) 6px",
    marginBottom: 18,
  },
  reasonsLabel: {
    fontSize: 9.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    fontWeight: 500,
    marginBottom: 12,
  },
  reasonsScroll: {
    maxHeight: 156,
    overflowY: "auto",
    paddingRight: 6,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 10,
  },
  reasonRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  reasonIndex: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 13,
    color: GOLD,
    fontWeight: 500,
    lineHeight: 1.5,
    flexShrink: 0,
    minWidth: 18,
  },
  reasonTitle: {
    fontSize: 13,
    color: FOREST,
    fontWeight: 500,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  reasonBody: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: 300,
    lineHeight: 1.65,
  },

  noteRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 26,
    paddingLeft: 16,
    borderLeft: `2px solid ${BORDER_GOLD}`,
  },
  plannedNote: {
    fontSize: 13,
    lineHeight: 1.6,
    color: FOREST,
    fontWeight: 500,
    fontStyle: "italic",
    fontFamily: "'Playfair Display', serif",
  },
  signOff: {
    fontSize: 11,
    lineHeight: 1.5,
    color: TEXT_MUTED,
    fontWeight: 400,
    letterSpacing: "0.02em",
  },

  /* Countdown treated as the page's signature element: its own quiet panel */
  countdownCard: {
    background: `linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.35) 100%)`,
    border: `0.5px solid ${BORDER}`,
    borderRadius: 3,
    padding: "20px clamp(18px, 3vw, 30px) 18px",
    marginBottom: 26,
  },
  countdownLabel: {
    fontSize: 9.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    fontWeight: 500,
    marginBottom: 16,
    textAlign: "center",
  },
  units: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 0,
    flexWrap: "wrap",
  },
  unit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minWidth: 56,
  },
  unitNum: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 500,
    fontSize: "clamp(32px, 4vw, 42px)",
    color: FOREST,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  unitLabel: {
    fontSize: 8.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    fontWeight: 400,
  },
  colon: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(22px, 2.8vw, 30px)",
    color: BORDER_GOLD,
    margin: "0 8px",
    lineHeight: 1,
    fontWeight: 300,
  },

  countdownFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 18,
    paddingTop: 16,
    borderTop: `0.5px solid ${BORDER}`,
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: 300,
    position: "relative",
  },
  countdownFootLine: { display: "none" },
  timePillStrong: { color: FOREST, fontWeight: 500 },

  doneBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 18px",
    fontSize: 13,
    color: FOREST,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: `2px solid ${BORDER_GOLD}`,
    borderTopColor: GOLD,
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  divider: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  dividerLine: { flex: 1, height: 0.5, background: BORDER },
  dividerText: {
    fontSize: 9.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    whiteSpace: "nowrap",
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 4,
  },
  contactSep: {
    width: 0.5,
    height: 34,
    background: BORDER,
    justifySelf: "center",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 3,
    textDecoration: "none",
  },
  contactIcon: {
    width: 28,
    height: 28,
    flexShrink: 0,
    border: `0.5px solid ${BORDER_GOLD}`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(74,158,63,0.04)",
  },
  contactLabel: {
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    marginBottom: 2,
    fontWeight: 500,
  },
  contactValue: {
    fontSize: 12,
    color: FOREST,
    fontWeight: 400,
    wordBreak: "break-word",
    lineHeight: 1.4,
  },
};
