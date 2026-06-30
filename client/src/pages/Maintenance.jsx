import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-06-30T18:00:00+07:00");

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

export default function Maintenance() {
  const { d, h, m, s, done } = useCountdown(TARGET_DATE);

  return (
    <div style={styles.page}>
      <style>{GLOBAL_CSS}</style>

      {/* ══ LEFT — Atmosphere panel (hidden < 980px) ══ */}
      <div className="em-visual-hide" style={styles.visual}>
        <div style={styles.vGrid} />
        <div style={{ ...styles.vOrb, ...styles.vOrb1 }} />
        <div style={{ ...styles.vOrb, ...styles.vOrb2 }} />
        <div style={{ ...styles.vOrb, ...styles.vOrb3 }} />
        <div style={styles.vDiagonal} />

        <div className="em-particle" style={{ top: "18%", left: "22%", animationDelay: "0s" }} />
        <div className="em-particle" style={{ top: "62%", left: "12%", animationDelay: "2.2s" }} />
        <div className="em-particle" style={{ top: "38%", left: "78%", animationDelay: "4.1s" }} />
        <div className="em-particle" style={{ top: "76%", left: "68%", animationDelay: "1.3s" }} />
        <div className="em-particle" style={{ top: "12%", left: "60%", animationDelay: "3.4s" }} />

        <div className="em-rise-1" style={styles.vCenter}>
          <div style={styles.bookRing}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ position: "absolute" }}>
              <circle cx="40" cy="40" r="39" stroke="rgba(74,158,63,0.18)" strokeWidth="0.5" />
            </svg>
            <svg width="38" height="38" viewBox="0 0 56 56" fill="none" style={styles.bookSvg}>
              <g className="em-page-fold">
                <path d="M28 8L48 18V46L28 38V8Z" stroke="#5cb84f" strokeWidth="1" fill="rgba(92,184,79,0.06)" />
                <path d="M28 8L8 18V46L28 38V8Z" stroke="#5cb84f" strokeWidth="1" fill="rgba(92,184,79,0.12)" />
                <line x1="28" y1="8" x2="28" y2="38" stroke="#5cb84f" strokeWidth="0.75" opacity="0.6" />
              </g>
            </svg>
          </div>

          <div className="em-rise-2" style={styles.vEyebrow}>
            <span style={styles.vEyebrowLine} />
            <span style={styles.vEyebrowText}>Earthoria Website</span>
          </div>

          <h2 className="em-rise-3" style={styles.vHeadline}>
            Mỗi cuốn sách<br />
            cần một <em style={styles.vHeadlineEm}>khoảnh khắc</em><br />
            nghỉ ngơi
          </h2>

          <p className="em-rise-4" style={styles.vSub}>
            Đằng sau cánh cửa khép, đội ngũ của chúng tôi đang sắp xếp lại
            từng trang sách số để hành trình tiếp theo của bạn mượt mà hơn.
          </p>
        </div>

        <div className="em-rise-5" style={styles.vQuote}>
          <span style={styles.vQuoteMark}>"</span>
          <p style={styles.vQuoteText}>
            Một thư viện không bao giờ thực sự đóng cửa —
            nó chỉ đang lật sang trang mới.
          </p>
        </div>
      </div>

      {/* ══ RIGHT — Announcement panel ══ */}
      <div className="em-panel" style={styles.panel}>
        <div style={styles.panelCircle1} />
        <div style={styles.panelCircle2} />

        <div className="em-rise-1 em-panel-wrap" style={styles.panelWrap}>
          {/* Badge */}
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            <span style={styles.badgeText}>Thông báo bảo trì hệ thống</span>
          </div>

          {/* Title */}
          <h1 className="em-title" style={styles.title}>
            Chúng tôi đang <em style={styles.titleEm}>nâng cấp</em>
            <br className="em-title-br" />
            {" "}trải nghiệm của bạn
          </h1>

          <p style={styles.desc}>
            Earthoria tạm ngưng phục vụ trong thời gian ngắn để nâng cấp hệ
            thống. Xin lỗi vì sự bất tiện này — mọi dữ liệu, đơn hàng và tủ
            sách của bạn đều được giữ nguyên vẹn.
          </p>

          <div style={styles.noteRow}>
            <span style={styles.plannedNote}>Đây là hành động đã được lên kế hoạch trước, không phải sự cố.</span>
            <span style={styles.signOff}>— Đội ngũ Quản lý Earthoria</span>
          </div>

          {/* Countdown */}
          <div style={styles.countdownBlock}>
            <div style={styles.countdownLabel}>Dự kiến hoạt động trở lại sau</div>
            {done ? (
              <div style={styles.doneBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5cb84f" strokeWidth="1.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Đã hoàn tất — vui lòng tải lại trang</span>
              </div>
            ) : (
              <div className="em-units" style={styles.units}>
                {[
                  { v: d, l: "Ngày" },
                  { v: h, l: "Giờ" },
                  { v: m, l: "Phút" },
                  { v: s, l: "Giây" },
                ].map((u, i) => (
                  <div key={u.l} style={{ display: "flex", alignItems: "center" }}>
                    <div style={styles.unit}>
                      <div className="em-unit-box" style={styles.unitBox}>
                        <span key={u.v} className="em-num-tick" style={styles.unitNum}>
                          {pad(u.v)}
                        </span>
                      </div>
                      <span style={styles.unitLabel}>{u.l}</span>
                    </div>
                    {i < 3 && <span style={styles.colon}>:</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target time pill */}
          <div style={styles.timePill}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5cb84f" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>
              Dự kiến hoàn thành lúc <strong style={styles.timePillStrong}>18:00 · 30/06/2026</strong>
            </span>
          </div>

          {/* Divider */}
          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>Liên hệ hỗ trợ</span>
            <span style={styles.dividerLine} />
          </div>

          {/* Contact cards */}
          <div className="em-contact-grid" style={styles.contactGrid}>
            <a href="mailto:earthoriavn@gmail.com" style={styles.contactCard} className="em-contact-card">
              <div style={styles.contactIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5cb84f" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={styles.contactLabel}>Email chính thức</div>
                <div style={styles.contactValue}>earthoriavn@gmail.com</div>
              </div>
            </a>

            <a href="mailto:helpdesk.earthoria@gmail.com" style={styles.contactCard} className="em-contact-card">
              <div style={styles.contactIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5cb84f" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 3" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={styles.contactLabel}>Email phòng IT</div>
                <div style={styles.contactValue}>helpdesk.earthoria@gmail.com</div>
              </div>
            </a>
          </div>

          {/* Footer logo */}
          <div style={styles.footer}>
            <div className="em-logo-wrap" style={styles.logoWrap}>
              <img src="/logo-footer.png" alt="Earthoria" style={styles.footerLogo} />
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
const BORDER = "rgba(13, 43, 30, 0.12)";
const BORDER_GOLD = "rgba(74, 158, 63, 0.3)";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Be+Vietnam+Pro:wght@300;400;500&display=swap');

html, body, #root { height: 100%; margin: 0; }

@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-26px) scale(1.04); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-24px,18px) scale(0.96); } }
@keyframes drift3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(12px,14px); } }

@keyframes pageFoldSlow {
  0%   { transform: rotateY(0deg); }
  45%  { transform: rotateY(-10deg); }
  55%  { transform: rotateY(-10deg); }
  100% { transform: rotateY(0deg); }
}
.em-page-fold { transform-origin: 28px 28px; animation: pageFoldSlow 6s ease-in-out infinite; }

@keyframes ringPulse {
  0%,100% { opacity: 0.5; transform: scale(1); }
  50%     { opacity: 1;   transform: scale(1.03); }
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.em-rise-1 { animation: riseIn 0.75s cubic-bezier(.16,1,.3,1) 0.05s both; }
.em-rise-2 { animation: riseIn 0.75s cubic-bezier(.16,1,.3,1) 0.16s both; }
.em-rise-3 { animation: riseIn 0.75s cubic-bezier(.16,1,.3,1) 0.27s both; }
.em-rise-4 { animation: riseIn 0.75s cubic-bezier(.16,1,.3,1) 0.38s both; }
.em-rise-5 { animation: riseIn 0.75s cubic-bezier(.16,1,.3,1) 0.49s both; }

@keyframes floatParticle {
  0%   { transform: translateY(0) scale(0.6);   opacity: 0; }
  15%  { opacity: 0.9; }
  85%  { opacity: 0.4; }
  100% { transform: translateY(-90px) scale(1.1); opacity: 0; }
}
.em-particle {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #5cb84f;
  animation: floatParticle 7s ease-in-out infinite;
  pointer-events: none;
}

@keyframes numTick {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.em-num-tick { display: inline-block; animation: numTick 0.35s ease both; }

@keyframes badgePulse { 0%,100% { opacity: 0.45; } 50% { opacity: 1; } }

@keyframes logoGlow {
  0%,100% { opacity: 0.35; transform: translate(-50%,-50%) scale(0.92); }
  50%     { opacity: 0.7;  transform: translate(-50%,-50%) scale(1.08); }
}
.em-logo-wrap::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74,158,63,0.22) 0%, transparent 72%);
  filter: blur(6px);
  animation: logoGlow 4s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}
.em-logo-wrap img {
  transition: transform 0.4s cubic-bezier(.16,1,.3,1), filter 0.4s ease;
}
.em-logo-wrap:hover img {
  transform: scale(1.08) rotate(-2deg);
  filter: drop-shadow(0 6px 14px rgba(74,158,63,0.25));
}

.em-unit-box { transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease; }
.em-unit-box:hover { border-color: #4a9e3f; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(13,51,48,0.10); }

.em-contact-card { transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease; }
.em-contact-card:hover { border-color: #4a9e3f; background: rgba(212,237,207,0.35); transform: translateX(3px); }

/* ── Tablet / small desktop: tighten panel ── */
@media (max-width: 1180px) {
  .em-panel-wrap { max-width: 460px !important; }
}

/* ── Mobile: stack to single column, hide visual panel, allow scroll ── */
@media (max-width: 980px) {
  .em-visual-hide { display: none !important; }
  .em-panel {
    height: auto !important;
    min-height: 100vh !important;
    grid-column: 1 / -1 !important;
    padding: 32px 22px !important;
    align-items: flex-start !important;
  }
  .em-panel-wrap { max-width: 480px !important; margin: auto !important; padding: 20px 0 !important; }
  .em-title-br { display: none; }
  .em-units { gap: 0 !important; }
  .em-contact-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
  .em-logo-wrap { width: 90px !important; height: 90px !important; }
  .em-logo-wrap img { width: 76px !important; height: 76px !important; }
}

@media (max-width: 420px) {
  .em-units > div > div:first-child { width: 56px !important; height: 56px !important; }
}
`;

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    display: "grid",
    gridTemplateColumns: "0.62fr 1.38fr",
    overflow: "hidden",
  },

  /* ══ LEFT VISUAL PANEL ══ */
  visual: {
    position: "relative",
    background: `linear-gradient(155deg, ${FOREST} 0%, #0a2622 55%, ${INK} 100%)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 36px",
    overflow: "hidden",
    height: "100vh",
  },
  vGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.025) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(255,255,255,0.025) 0.5px, transparent 0.5px)",
    backgroundSize: "56px 56px",
  },
  vOrb: { position: "absolute", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none" },
  vOrb1: { width: 320, height: 320, background: "radial-gradient(circle, rgba(74,158,63,0.20) 0%, transparent 70%)", top: "-8%", left: "-10%", animation: "drift1 13s ease-in-out infinite" },
  vOrb2: { width: 260, height: 260, background: "radial-gradient(circle, rgba(92,184,79,0.14) 0%, transparent 70%)", bottom: "-10%", right: "-8%", animation: "drift2 16s ease-in-out infinite" },
  vOrb3: { width: 180, height: 180, background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)", top: "45%", left: "55%", animation: "drift3 9s ease-in-out infinite" },
  vDiagonal: {
    position: "absolute", top: 0, bottom: 0, right: "20%", width: 0.5,
    background: "linear-gradient(to bottom, transparent 0%, rgba(92,184,79,0.3) 35%, rgba(74,158,63,0.2) 65%, transparent 100%)",
  },

  vCenter: { position: "relative", zIndex: 3, textAlign: "center", maxWidth: 300 },
  bookRing: {
    position: "relative", width: 72, height: 72, margin: "0 auto 22px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  bookSvg: { position: "absolute" },

  vEyebrow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 14 },
  vEyebrowLine: { width: 20, height: 0.5, background: GOLD_LIGHT, opacity: 0.7 },
  vEyebrowText: { fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD_LIGHT, fontWeight: 500 },

  vHeadline: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 400,
    fontSize: "clamp(19px, 1.7vw, 26px)",
    lineHeight: 1.26,
    color: IVORY,
    margin: "0 0 12px",
    letterSpacing: "-0.005em",
  },
  vHeadlineEm: { fontStyle: "italic", color: GOLD_LIGHT },

  vSub: {
    fontSize: 11.5,
    lineHeight: 1.75,
    color: "rgba(250,248,243,0.55)",
    fontWeight: 300,
    maxWidth: 270,
    margin: "0 auto",
  },

  vQuote: {
    position: "absolute",
    bottom: 32,
    left: 36,
    right: 36,
    zIndex: 3,
    paddingTop: 16,
    borderTop: "0.5px solid rgba(255,255,255,0.08)",
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  vQuoteMark: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: GOLD_LIGHT, opacity: 0.4, lineHeight: 0.7 },
  vQuoteText: { fontSize: 10.5, fontStyle: "italic", color: "rgba(250,248,243,0.4)", lineHeight: 1.65, fontFamily: "'Playfair Display', serif" },

  /* ══ RIGHT PANEL ══ */
  panel: {
    position: "relative",
    background: `radial-gradient(ellipse 110% 70% at 30% -10%, ${GOLD_PALE}45, transparent 55%), linear-gradient(180deg, ${IVORY} 0%, ${CREAM} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px clamp(32px, 6vw, 80px)",
    overflow: "hidden",
    height: "100vh",
    boxSizing: "border-box",
  },
  panelCircle1: {
    position: "absolute", top: "-14%", right: "-12%", width: 280, height: 280, borderRadius: "50%",
    border: `0.5px solid ${BORDER}`, animation: "ringPulse 7s ease-in-out infinite",
  },
  panelCircle2: {
    position: "absolute", bottom: "-12%", left: "-10%", width: 200, height: 200, borderRadius: "50%",
    border: `0.5px solid ${BORDER_GOLD}`, animation: "ringPulse 9s ease-in-out infinite reverse",
  },

  panelWrap: { position: "relative", zIndex: 2, maxWidth: 560, width: "100%" },

  badge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "7px 14px",
    border: `0.5px solid ${BORDER_GOLD}`,
    borderRadius: 100,
    background: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  badgeDot: { width: 5, height: 5, borderRadius: "50%", background: GOLD, animation: "badgePulse 2s ease-in-out infinite" },
  badgeText: { fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: FOREST, fontWeight: 500 },

  title: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 400,
    fontSize: "clamp(24px, 2.3vw, 32px)",
    lineHeight: 1.18,
    color: FOREST,
    margin: "0 0 12px",
    letterSpacing: "-0.01em",
  },
  titleEm: { fontStyle: "italic", color: GOLD },

  desc: {
    fontSize: 13,
    lineHeight: 1.7,
    color: TEXT_MUTED,
    fontWeight: 300,
    margin: "0 0 12px",
  },

  noteRow: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBottom: 20,
  },
  plannedNote: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: FOREST,
    fontWeight: 500,
    fontStyle: "italic",
  },
  signOff: {
    fontSize: 11.5,
    lineHeight: 1.5,
    color: TEXT_MUTED,
    fontWeight: 400,
  },

  countdownBlock: { marginBottom: 18 },
  countdownLabel: {
    fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase",
    color: TEXT_MUTED, fontWeight: 500, marginBottom: 10,
  },
  units: { display: "inline-flex", alignItems: "center", gap: 2, flexWrap: "wrap" },
  unit: { display: "flex", flexDirection: "column", alignItems: "center", gap: 7 },
  unitBox: {
    width: 58, height: 58, borderRadius: 3,
    border: `0.5px solid ${BORDER}`,
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 18px rgba(13,51,48,0.05)",
  },
  unitNum: {
    fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: 23,
    color: FOREST, fontVariantNumeric: "tabular-nums",
  },
  unitLabel: { fontSize: 8.5, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_MUTED, fontWeight: 400 },
  colon: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: BORDER_GOLD, margin: "0 3px", transform: "translateY(-9px)" },

  doneBox: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 18px",
    border: `0.5px solid ${BORDER_GOLD}`,
    background: GOLD_PALE + "60",
    borderRadius: 3,
    fontSize: 13,
    color: FOREST,
  },

  timePill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 16px",
    border: `0.5px solid ${BORDER}`,
    borderRadius: 100,
    background: "rgba(255,255,255,0.55)",
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: 300,
    marginBottom: 20,
  },
  timePillStrong: { color: FOREST, fontWeight: 500 },

  divider: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  dividerLine: { flex: 1, height: 0.5, background: BORDER },
  dividerText: { fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: TEXT_MUTED, whiteSpace: "nowrap" },

  contactGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  contactCard: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 14px",
    border: `0.5px solid ${BORDER}`,
    borderRadius: 3,
    background: "rgba(255,255,255,0.5)",
    textDecoration: "none",
  },
  contactIcon: {
    width: 30, height: 30, flexShrink: 0,
    border: `0.5px solid ${BORDER_GOLD}`,
    borderRadius: 3,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(74,158,63,0.05)",
  },
  contactLabel: { fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 2, fontWeight: 500 },
  contactValue: { fontSize: 12, color: FOREST, fontWeight: 400, wordBreak: "break-word", lineHeight: 1.4 },

  footer: {
    display: "flex", alignItems: "center", justifyContent: "center",
    paddingTop: 18, borderTop: `0.5px solid ${BORDER}`,
  },
  logoWrap: {
    position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 108, height: 108,
  },
  footerLogo: { position: "relative", zIndex: 2, width: 92, height: 92, objectFit: "contain" },
};