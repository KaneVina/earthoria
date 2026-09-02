import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-09-05T18:00:00+07:00");

// Tiến độ bảo trì hệ thống hiển thị trên thanh progress bar (0-100).
const MAINTENANCE_PROGRESS = 78;

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
    title: "Tích hợp sách điện tử lên hệ thống",
    body: "Bổ sung kho sách điện tử (ebook) để người dùng đọc trực tiếp trên nền tảng, không cần chờ giao sách giấy.",
  },
  {
    title: "Tích hợp thanh toán nâng cao",
    body: "Bổ sung phương thức thanh toán bằng VNPay và Momo giúp trải nghiệm tốt hơn.",
  },
  {
    title: "Thêm các trò chơi tương tác",
    body: "Tích hợp mini-game tương tác gắn liền với nội dung sách, giúp trải nghiệm đọc trở nên sinh động và hấp dẫn hơn.",
  },
  {
    title: "Không gian quản lý trẻ dành cho phụ huynh",
    body: "Quản lý thời gian tự động, can thiệp thông minh để bảo vệ quá trình trải nghiệm của trẻ nhỏ.",
  },
  {
    title: "Nâng cấp hệ thống AR và AI",
    body: "AR nâng cao độ trực quan, đổ bóng, phối màu và âm thanh chân thực hơn. AI tích hợp công nghệ nhận diện giọng nói và phản hồi người dùng thông minh hơn.",
  },
  {
    title: "Cập nhật chính sách vận hành",
    body: "Đồng bộ lại các điều khoản dịch vụ, chính sách đổi trả và bảo mật dữ liệu người dùng theo quy định mới nhất.",
  },
  {
    title: "Nâng cấp hệ thống nhận diện địa chỉ giao hàng",
    body: "Cải thiện độ chính xác khi tự động nhận diện, chuẩn hoá địa chỉ giao hàng để hạn chế sai sót và thất lạc đơn hàng.",
  },
];

export default function Maintenance({ until, message }) {
  const target = until ? new Date(until) : TARGET_DATE;
  const { d, h, m, s, done } = useCountdown(target);

  // Chạy hiệu ứng "fill dần" từ 0 -> 78% ngay khi trang mount, nhờ CSS
  // transition trên width (mượt hơn nhiều so với set thẳng 78% ngay từ đầu).
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgress(MAINTENANCE_PROGRESS), 300);
    return () => clearTimeout(t);
  }, []);

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
            <span style={styles.bookMarkRing} />
            <svg width="38" height="38" viewBox="0 0 56 56" fill="none">
              <g className="em-page-fold">
                <path
                  d="M28 8L48 18V46L28 38V8Z"
                  stroke="#5cb84f"
                  strokeWidth="1"
                  fill="rgba(92,184,79,0.09)"
                />
                <path
                  d="M28 8L8 18V46L28 38V8Z"
                  stroke="#5cb84f"
                  strokeWidth="1"
                  fill="rgba(92,184,79,0.16)"
                />
                <line
                  x1="28"
                  y1="8"
                  x2="28"
                  y2="38"
                  stroke="#5cb84f"
                  strokeWidth="0.75"
                  opacity="0.65"
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
            Mỗi cuốn sách cũng
            <br />
            cần một <em style={styles.vHeadlineEm}>khoảnh khắc</em>
            <br />
            nghỉ ngơi
          </h2>

          <p className="em-rise-4" style={styles.vSub}>
            Đằng sau quyển sách đang khép lại, đội ngũ của Earthoria sắp xếp lại
            từng trang sách số để hành trình tiếp theo của bạn mượt mà hơn.
          </p>
        </div>

        <div className="em-rise-5" style={styles.vQuote}>
          <span style={styles.vQuoteMark}>"</span>
          <p style={styles.vQuoteText}>
            Một thư viện không bao giờ thực sự đóng cửa — nó chỉ đang lật sang
            trang mới.
          </p>
        </div>
      </div>

      {/* Spine — the crease between the two "pages" of the book */}
      <div className="em-visual-hide" style={styles.spine}>
        <span style={styles.spineHighlight} />
      </div>

      {/* ══ RIGHT — Announcement panel (reads like an open page) ══ */}
      <div className="em-panel" style={styles.panel}>
        <div style={styles.panelRing} />

        <div className="em-rise-1 em-panel-wrap" style={styles.panelWrap}>
          {/* Header row — eyebrow left, logo right, same line, no boxes */}
          <div style={styles.headerRow}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              <span style={styles.badgeText}>Thông báo bảo trì hệ thống</span>
            </div>
            <div className="em-logo-wrap" style={styles.logoWrapHeader}>
              <img
                src="/logo-chinh.png"
                alt="Earthoria"
                style={styles.headerLogo}
              />
            </div>
          </div>

          {/* Title — level with the Eira mascot image */}
          <div className="em-title-row" style={styles.titleRow}>
            <h1 className="em-title" style={styles.title}>
              Chúng tôi đang <em style={styles.titleEm}>nâng cấp</em>
              <br className="em-title-br" /> trải nghiệm của bạn
            </h1>
            <img
              src="/eira/eira-sorry.png"
              alt="Eira"
              className="em-title-img"
              style={styles.eiraSorryImg}
            />
          </div>
          <p style={styles.desc}>
            {message || "Xin chào quý khách hàng và độc giả của Earthoria,"}
          </p>
          <p style={styles.desc}>
            {message ||
              "Đội ngũ vận hành và phát triển Earthoria xin phép được thông báo tạm ngưng phục vụ trong khoản thời gian này để thực hiện các nâng cấp và bảo trì hệ thống nhằm mang đến trải nghiệm ổn định và tốt hơn cho người dùng."}
          </p>
          <p style={styles.desc}>
            Trong thời gian bảo trì, bạn tạm thời không truy cập được các tính
            năng của hệ thống. Toàn bộ dữ liệu, đơn hàng và tủ sách của bạn vẫn
            được lưu trữ an toàn và không bị ảnh hưởng.
          </p>
          <p style={{ ...styles.desc, marginBottom: 0 }}>
            Chúng tôi chân thành xin lỗi vì sự gián đoạn này và cảm ơn bạn đã
            kiên nhẫn đồng hành cùng Earthoria. Chúng tôi hứa sẽ mang lại một
            Earthoria mới không những là tủ sách mà còn là thế giới của bạn!
          </p>

          <div style={styles.noteRow}>
            <span style={styles.plannedNote}>
              "Đây là hành động đã được lên kế hoạch trước, không phải sự cố."
            </span>
            <span style={styles.signOff}>— Đội ngũ Quản lý Earthoria</span>
          </div>

          {/* Countdown — the ONE bold element: a dark plaque that echoes
              the left page, so the whole spread reads as one book */}
          <div className="em-countdown-card" style={styles.countdownCard}>
            <span style={styles.countdownGlow} />
            <span style={styles.countdownCorner} />
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

            {/* Thanh tiến độ bảo trì — fill mượt tới 78%, có hiệu ứng
                shimmer ánh sáng lướt qua liên tục để trông sống động. */}
            <div className="em-progress" style={styles.progressWrap}>
              <div style={styles.progressHead}>
                <span style={styles.progressLabel}>
                  Tiến độ bảo trì hệ thống
                </span>
                <span
                  className="em-progress-percent"
                  style={styles.progressPercent}
                >
                  {progress}%
                </span>
              </div>
              <div className="em-progress-track" style={styles.progressTrack}>
                <div
                  className="em-progress-fill"
                  style={{ ...styles.progressFill, width: `${progress}%` }}
                >
                  <span className="em-progress-shimmer" />
                </div>
              </div>
            </div>

            <div style={styles.countdownFoot}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(250,248,243,0.55)"
                strokeWidth="1.5"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span>
                Thời gian dự kiến hoàn tất:{" "}
                <strong style={styles.timePillStrong}>
                  18:00 · 05/09/2026
                </strong>
              </span>
            </div>
          </div>

          {/* Contact — plain rows, hairline rhythm, no boxes */}
          <div style={styles.sectionLabel}>Liên hệ hỗ trợ</div>
          <div className="em-contact-grid" style={styles.contactGrid}>
            <a
              href="mailto:earthoriavn@gmail.com"
              style={styles.contactRow}
              className="em-contact-card"
            >
              <div style={styles.contactIcon}>
                <svg
                  width="15"
                  height="15"
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

            <a
              href="mailto:helpdesk.earthoria@gmail.com"
              style={styles.contactRow}
              className="em-contact-card"
            >
              <div style={styles.contactIcon}>
                <svg
                  width="15"
                  height="15"
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

          {/* Reasons — read like a table of contents / colophon, no scroll box */}
          <div style={{ ...styles.sectionLabel, marginTop: 34 }}>
            Nội dung nâng cấp lần này
          </div>
          <div style={styles.reasonsList}>
            {REASONS.map((r, i) => (
              <div
                key={r.title}
                style={styles.reasonRow}
                className="em-reason-row"
              >
                <span className="em-reason-index" style={styles.reasonIndex}>
                  {pad(i + 1)}
                </span>
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
  );
}

/* ───────────────────────────────────────
   PALETTE — unchanged, copied 1:1 from main.css :root
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

/* Thanh tiến độ bảo trì: fill mượt (width transition) + ánh sáng lướt
   qua liên tục (shimmer) để trông sinh động, không bị "đứng hình". */
.em-progress-fill {
  transition: width 1.6s cubic-bezier(.16,1,.3,1);
}
.em-progress-percent {
  display: inline-block;
  transition: opacity 0.3s ease;
}
@keyframes progressShimmer {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(220%); }
}
.em-progress-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.55) 50%,
    transparent 100%
  );
  animation: progressShimmer 2.2s ease-in-out infinite;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .em-progress-fill { transition: none; }
  .em-progress-shimmer { animation: none; display: none; }
}

@keyframes logoGlow {
  0%,100% { opacity: 0.35; transform: translate(-50%,-50%) scale(0.94); }
  50%     { opacity: 0.65; transform: translate(-50%,-50%) scale(1.06); }
}
.em-logo-wrap::before {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 96px; height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74,158,63,0.22) 0%, transparent 72%);
  filter: blur(8px);
  animation: logoGlow 5s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
}
.em-logo-wrap img {
  position: relative;
  z-index: 2;
  transition: transform 0.45s cubic-bezier(.16,1,.3,1), filter 0.45s ease;
}
.em-logo-wrap:hover img {
  transform: scale(1.06);
  filter: drop-shadow(0 8px 18px rgba(74,158,63,0.28));
}

.em-contact-card { transition: background 0.25s ease, transform 0.25s ease; border-radius: 8px; }
.em-contact-card:hover {
  background: rgba(74,158,63,0.06);
  transform: translateX(2px);
}

.em-reason-row { transition: transform 0.25s ease; }
.em-reason-row:hover { transform: translateX(3px); }
.em-reason-row:hover .em-reason-index { color: #4a9e3f; }

/* thin, quiet scrollbar for the page */
.em-panel { scrollbar-width: thin; scrollbar-color: rgba(74,158,63,0.35) transparent; }
.em-panel::-webkit-scrollbar { width: 6px; }
.em-panel::-webkit-scrollbar-track { background: transparent; }
.em-panel::-webkit-scrollbar-thumb { background: rgba(74,158,63,0.25); border-radius: 3px; }

/*  Tablet / small desktop: tighten panel  */
@media (max-width: 1180px) {
  .em-panel-wrap { max-width: 480px !important; }
}

/*  Mobile: stack to single column, hide visual panel & spine, allow scroll  */
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
  .em-title-row { gap: 12px !important; }
  .em-title-img { width: 64px !important; height: 64px !important; }
  .em-units { gap: 2px !important; }
  .em-contact-grid { grid-template-columns: 1fr !important; gap: 4px !important; }
  .em-logo-wrap { width: 60px !important; height: 60px !important; }
  .em-logo-wrap img { width: 48px !important; height: 48px !important; }
}

@media (max-width: 420px) {
  .em-units { justify-content: space-between !important; width: 100%; }
  .em-units > div { min-width: 0 !important; }
}
`;

const styles = {
  page: {
    position: "relative",
    height: "100vh",
    width: "100%",
    fontFamily: "'Be Vietnam Pro', sans-serif",
    display: "grid",
    gridTemplateColumns: "0.6fr 1.4fr",
    overflow: "hidden",
    WebkitFontSmoothing: "antialiased",
  },

  /* The crease between the two "pages" of the book */
  spine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "30%",
    width: 26,
    marginLeft: -13,
    zIndex: 5,
    pointerEvents: "none",
    background:
      "linear-gradient(90deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.05) 30%, transparent 55%, rgba(255,255,255,0.35) 78%, transparent 100%)",
  },
  spineHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 13,
    width: 1,
    background:
      "linear-gradient(180deg, transparent 0%, rgba(212,237,207,0.45) 15%, rgba(212,237,207,0.45) 85%, transparent 100%)",
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
    width: 60,
    height: 60,
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "0.5px solid rgba(92,184,79,0.32)",
    borderRadius: "50%",
    background: "rgba(92,184,79,0.04)",
  },
  bookMarkRing: {
    position: "absolute",
    inset: -6,
    borderRadius: "50%",
    border: "0.5px solid rgba(92,184,79,0.16)",
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
    maxWidth: 600,
    width: "100%",
    margin: "auto",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
    gap: 16,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: GOLD,
    animation: "badgePulse 2.4s ease-in-out infinite",
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: TEXT_MUTED,
    fontWeight: 500,
  },

  logoWrapHeader: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 140,
    flexShrink: 0,
  },
  headerLogo: {
    position: "relative",
    zIndex: 2,
    width: 110,
    height: 110,
    objectFit: "contain",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 22,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 400,
    fontSize: "clamp(32px, 3vw, 44px)",
    lineHeight: 1.2,
    color: FOREST,
    margin: 0,
    letterSpacing: "-0.008em",
  },
  titleEm: { fontStyle: "italic", color: GOLD },
  eiraSorryImg: {
    width: 96,
    height: 96,
    objectFit: "contain",
    flexShrink: 0,
    filter: "drop-shadow(0 10px 20px rgba(13,51,48,0.25))",
  },

  desc: {
    fontSize: 14.5,
    lineHeight: 1.9,
    color: TEXT_MUTED,
    fontWeight: 300,
    margin: "0 0 18px",
    maxWidth: "100%",
  },

  reasonsList: {
    display: "flex",
    flexDirection: "column",
    borderBottom: `0.5px solid ${BORDER}`,
  },
  reasonRow: {
    display: "flex",
    gap: 18,
    alignItems: "flex-start",
    padding: "18px 0",
    borderTop: `0.5px solid ${BORDER}`,
  },
  reasonIndex: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: 15,
    color: BORDER_GOLD,
    fontWeight: 500,
    lineHeight: 1.5,
    flexShrink: 0,
    minWidth: 22,
    transition: "color 0.25s ease",
  },
  reasonTitle: {
    fontSize: 13.5,
    color: FOREST,
    fontWeight: 500,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  reasonBody: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    fontWeight: 300,
    lineHeight: 1.75,
    maxWidth: 460,
  },

  sectionLabel: {
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: GOLD,
    fontWeight: 500,
    marginBottom: 16,
  },

  noteRow: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    margin: "30px 0 34px",
    paddingLeft: 20,
    borderLeft: `2px solid ${BORDER_GOLD}`,
  },
  plannedNote: {
    fontSize: 14.5,
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

  /* Countdown — the ONE bold, dark element on the page. It echoes the
     left panel's palette so the whole spread reads as a single book. */
  countdownCard: {
    position: "relative",
    background: `linear-gradient(160deg, ${FOREST} 0%, #0a2622 65%, ${INK} 100%)`,
    borderRadius: 16,
    padding: "30px clamp(22px, 3.4vw, 40px) 24px",
    marginBottom: 40,
    boxShadow:
      "0 30px 60px -24px rgba(13,51,48,0.45), 0 2px 0 rgba(255,255,255,0.04) inset",
    overflow: "hidden",
  },
  countdownGlow: {
    position: "absolute",
    top: -80,
    left: "50%",
    transform: "translateX(-50%)",
    width: 320,
    height: 220,
    background:
      "radial-gradient(ellipse, rgba(92,184,79,0.22) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  countdownCorner: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderTop: `0.5px solid ${BORDER_GOLD}`,
    borderRight: `0.5px solid ${BORDER_GOLD}`,
    opacity: 0.6,
  },
  countdownLabel: {
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(212,237,207,0.65)",
    fontWeight: 500,
    marginBottom: 20,
    textAlign: "center",
    position: "relative",
  },
  units: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 0,
    flexWrap: "wrap",
    position: "relative",
  },
  unit: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    minWidth: 58,
  },
  unitNum: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 500,
    fontSize: "clamp(36px, 4.4vw, 48px)",
    color: IVORY,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  unitLabel: {
    fontSize: 8.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(212,237,207,0.5)",
    fontWeight: 400,
  },
  colon: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(22px, 2.8vw, 30px)",
    color: "rgba(92,184,79,0.45)",
    margin: "0 9px",
    lineHeight: 1,
    fontWeight: 300,
  },

  countdownFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 22,
    paddingTop: 18,
    borderTop: "0.5px solid rgba(255,255,255,0.1)",
    fontSize: 11,
    color: "rgba(250,248,243,0.55)",
    fontWeight: 300,
    position: "relative",
  },
  timePillStrong: { color: GOLD_LIGHT, fontWeight: 500 },

  /* Thanh tiến độ bảo trì hệ thống (78%) */
  progressWrap: {
    position: "relative",
    marginTop: 22,
  },
  progressHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  progressLabel: {
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(212,237,207,0.65)",
    fontWeight: 500,
  },
  progressPercent: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: 15,
    fontWeight: 500,
    color: GOLD_LIGHT,
    fontVariantNumeric: "tabular-nums",
  },
  progressTrack: {
    position: "relative",
    height: 8,
    borderRadius: 999,
    background: "rgba(250,248,243,0.1)",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  progressFill: {
    position: "relative",
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
    boxShadow: "0 0 12px rgba(92,184,79,0.55)",
    overflow: "hidden",
  },

  doneBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "16px 18px",
    fontSize: 13,
    color: IVORY,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: GOLD_LIGHT,
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "10px 10px",
    textDecoration: "none",
  },
  contactIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    border: `0.5px solid ${BORDER_GOLD}`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(74,158,63,0.05)",
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
