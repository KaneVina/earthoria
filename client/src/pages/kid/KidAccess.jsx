import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BookOpen,
  Clock,
  Eye,
  Lock,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  X,
  Info,
  Smile,
  BookMarked,
  ArrowLeft,
} from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import FullScreenLoader from "../../components/FullScreenLoader";
import "../../components/assets/css/kidAccess.css";

// ─────────────────────────────────────────────────────────────
// Nội dung tĩnh: câu chào, câu truyền cảm hứng, mẹo bảo vệ mắt.
// Chỉ là "gia vị" hiển thị — không ảnh hưởng tới dữ liệu thật.
// ─────────────────────────────────────────────────────────────
const INSPIRE_LINES = [
  "Mỗi trang sách là một cánh cửa dẫn đến thế giới mới.",
  "Hôm nay bé muốn phiêu lưu ở đâu nào?",
  "Một cuốn sách hay đang chờ bé khám phá đấy!",
  "Đọc sách mỗi ngày, lớn khôn mỗi ngày.",
  "Trí tưởng tượng của bé không có giới hạn đâu!",
];

const EYE_TIPS = [
  "Ngồi thẳng lưng và giữ sách cách mắt khoảng 30cm nhé!",
  "Ánh sáng đủ sáng sẽ giúp mắt bé đỡ mỏi hơn khi đọc đó.",
  "Bé nhớ chớp mắt thường xuyên để mắt không bị khô nhé.",
  "Đọc to thành tiếng giúp bé nhớ câu chuyện lâu hơn đấy!",
  "Uống một ngụm nước sẽ giúp bé tỉnh táo hơn đó!",
];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

// "HH:mm" → có đang trong khung giờ cho phép hay không (xử lý cả
// trường hợp khung giờ qua đêm, vd 20:00 → 06:00)
function withinWindow(start, end) {
  if (!start || !end) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
}

export default function KidAccess() {
  const { token } = useParams(); // :slug không dùng để tra cứu, chỉ để đẹp URL
  const [status, setStatus] = useState("loading"); // loading | ok | invalid
  const [child, setChild] = useState(null);
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);

  // ── phiên đọc (chỉ hiển thị, không ghi vào server) ──
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // ── nhắc nghỉ mắt ──
  const [showRest, setShowRest] = useState(false);
  const [restLeft, setRestLeft] = useState(0);

  // ── giải lao bắt buộc ──
  const [showBreak, setShowBreak] = useState(false);
  const [breakLeft, setBreakLeft] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, booksRes] = await Promise.all([
          kidAccessService.getProfile(token),
          kidAccessService.getBooks(token),
        ]);
        if (cancelled) return;
        setChild(profileRes.data.data.child);
        setBooks(booksRes.data.data.books);
        setStatus("ok");
      } catch (err) {
        if (!cancelled) setStatus("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const inspireLine = useMemo(
    () => INSPIRE_LINES[Math.floor(Math.random() * INSPIRE_LINES.length)],
    [child?.id],
  );
  const eyeTip = useMemo(
    () => EYE_TIPS[new Date().getDate() % EYE_TIPS.length],
    [],
  );

  const isOk = status === "ok" && child && !child.isLocked;

  // ── đếm giờ phiên đọc hiện tại (chỉ hiển thị cho vui, không phải nguồn sự thật) ──
  useEffect(() => {
    if (!isOk || showBreak) return;
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isOk, showBreak]);

  // ── lịch nhắc nghỉ mắt định kỳ ──
  useEffect(() => {
    if (!isOk || !child?.ruleEnabled) return;
    const periodMs = Math.max(1, child.ruleIntervalMinutes || 20) * 60000;
    const id = setInterval(() => {
      setShowBreak((isBreak) => {
        if (!isBreak) {
          setRestLeft(Math.max(5, child.ruleRestSeconds || 20));
          setShowRest(true);
        }
        return isBreak;
      });
    }, periodMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOk, child?.ruleEnabled, child?.ruleIntervalMinutes, child?.ruleRestSeconds]);

  // đếm ngược khi overlay nghỉ mắt đang mở
  useEffect(() => {
    if (!showRest) return;
    if (restLeft <= 0) {
      setShowRest(false);
      return;
    }
    const id = setTimeout(() => setRestLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showRest, restLeft]);

  // ── lịch giải lao bắt buộc ──
  useEffect(() => {
    if (!isOk || !child?.mandatoryBreakEnabled) return;
    const periodMs = Math.max(1, child.breakAfterMinutes || 45) * 60000;
    const id = setInterval(() => {
      setShowRest(false);
      setBreakLeft(Math.max(30, (child.breakDurationMinutes || 10) * 60));
      setShowBreak(true);
    }, periodMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOk, child?.mandatoryBreakEnabled, child?.breakAfterMinutes, child?.breakDurationMinutes]);

  // đếm ngược khi đang giải lao bắt buộc
  useEffect(() => {
    if (!showBreak) return;
    if (breakLeft <= 0) {
      setShowBreak(false);
      return;
    }
    const id = setTimeout(() => setBreakLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showBreak, breakLeft]);

  // ── mẹo hiển thị lúc mở app (tipsFrequency === 'open') ──
  useEffect(() => {
    if (isOk && child?.tipsEnabled && child?.tipsFrequency === "open") {
      toast(eyeTip, { icon: "💡", duration: 5000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOk]);

  const handleOpenBook = useCallback((book) => setActiveBook(book), []);
  const closeModal = useCallback(() => setActiveBook(null), []);

  const handleReadNow = useCallback((book) => {
    // TODO(backend): kid-access hiện chỉ trả về id/slug/coverImage cho
    // sách — chưa có hashId / mã AR để mở thẳng /books/:slug/:hashId
    // hoặc /ar/:slug/:code từ phiên của bé. Khi API bổ sung, thay đoạn
    // toast bên dưới bằng navigate() tới đúng route đọc sách.
    toast.success(`Nhờ ba mẹ mở AR để cùng đọc "${book.title}" nhé!`, {
      icon: "📖",
    });
  }, []);

  if (status === "loading") {
    return (
      <FullScreenLoader
        eyebrow="Đang mở tủ sách"
        message="Chờ bé một chút xíu nhé..."
      />
    );
  }

  if (status === "invalid") {
    return (
      <div className="kid-state-page">
        <StateBg />
        <div className="kid-state-card">
          <div className="kid-state-icon">
            <Info size={30} />
          </div>
          <h1 className="kid-state-title">Link này không đúng rồi bé ơi</h1>
          <p className="kid-state-text">
            Liên kết không hợp lệ hoặc đã bị thu hồi. Bé nhờ ba mẹ lấy lại
            link mới trong trang quản lý nhé!
          </p>
          <Link to="/" className="kid-state-btn">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (child?.isLocked) {
    return (
      <div className="kid-state-page">
        <StateBg />
        <div className="kid-state-card">
          <div className="kid-state-icon">
            <Lock size={28} />
          </div>
          <h1 className="kid-state-title">Đến giờ nghỉ rồi, {child.name} ơi!</h1>
          <p className="kid-state-text">
            Ba mẹ đã tạm khoá sách của bé lúc này. Bé nhờ ba mẹ mở lại khi
            muốn đọc tiếp nhé!
          </p>
          <span className="kid-state-stat">
            <BookOpen size={14} /> Hôm nay bé đã đọc {child.todayMinutes || 0} phút
          </span>
          <br />
          <Link to="/" className="kid-state-btn">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const dailyLimit = child.dailyLimitMinutes || 0;
  const todayMinutes = child.todayMinutes || 0;
  const limitReached = dailyLimit > 0 && todayMinutes >= dailyLimit;
  const ringPercent = dailyLimit > 0 ? Math.min(100, (todayMinutes / dailyLimit) * 100) : 0;
  const ringRadius = 23;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - ringPercent / 100);
  const inWindow = child.allowWindowEnabled ? withinWindow(child.allowStart, child.allowEnd) : true;
  const showRestTip =
    child.tipsEnabled && (child.tipsFrequency === "rest" || child.tipsFrequency === "interval");

  return (
    <div className="kid-page" style={{ "--kid-accent": child.avatarColor || "var(--gold)" }}>
      <div className="kid-bg" aria-hidden="true">
        <div className="kid-bg-wash" />
        <div className="kid-bg-art" />
        <span className="kid-bg-orb kid-bg-orb-1" />
        <span className="kid-bg-orb kid-bg-orb-2" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
      </div>

      <div className="kid-shell">
        <header className="kid-topbar">
          <div className="kid-topbar-brand">
            <img src="/kid/logo-nho.png" alt="Earthoria" className="kid-topbar-logo" />
            <span className="kid-topbar-name">
              Earthoria <em>Kids</em>
            </span>
          </div>
          <span className="kid-live-chip">
            <span className="kid-live-dot" />
            Đang đọc · {fmtClock(sessionSeconds)}
          </span>
        </header>

        <section className="kid-hero">
          <div className="kid-avatar-wrap">
            <span className="kid-avatar-glow" />
            <span className="kid-avatar">{child.avatarEmoji || "🦊"}</span>
          </div>
          <h1 className="kid-hero-title">
            {timeGreeting()}, {child.name}!
          </h1>
          <p className="kid-hero-sub">{inspireLine}</p>
          {Number.isFinite(child.age) && (
            <div className="kid-hero-age">
              <Smile size={13} /> {child.age} tuổi
            </div>
          )}
        </section>

        <section className="kid-stats-row">
          <div className="kid-stat-card kid-ring-card">
            {dailyLimit > 0 ? (
              <div className="kid-ring">
                <svg viewBox="0 0 52 52" width="52" height="52">
                  <circle className="kid-ring-track" cx="26" cy="26" r={ringRadius} />
                  <circle
                    className={`kid-ring-fill${limitReached ? " is-full" : ""}`}
                    cx="26"
                    cy="26"
                    r={ringRadius}
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
              </div>
            ) : (
              <div className="kid-stat-icon">
                <Clock size={18} />
              </div>
            )}
            <div>
              <div className="kid-stat-label">Hôm nay đã đọc</div>
              <div className="kid-stat-value">
                {todayMinutes} phút
                {dailyLimit > 0 && <small>/ {dailyLimit} phút</small>}
              </div>
            </div>
          </div>

          {child.allowWindowEnabled && (
            <div className="kid-stat-card">
              <div className="kid-stat-icon">
                {inWindow ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div>
                <div className="kid-stat-label">Giờ được đọc</div>
                <div className="kid-stat-value" style={{ fontSize: 15 }}>
                  {child.allowStart} – {child.allowEnd}
                </div>
              </div>
              <span className={`kid-stat-status ${inWindow ? "is-open" : "is-closed"}`}>
                {inWindow ? "Đang mở" : "Ngoài giờ"}
              </span>
            </div>
          )}

          {child.ruleEnabled && (
            <div className="kid-stat-card">
              <div className="kid-stat-icon">
                <Eye size={18} />
              </div>
              <div>
                <div className="kid-stat-label">Bảo vệ mắt</div>
                <div className="kid-stat-value" style={{ fontSize: 15 }}>
                  Nghỉ mỗi {child.ruleIntervalMinutes} phút
                </div>
              </div>
            </div>
          )}
        </section>

        {child.tipsEnabled && child.tipsFrequency === "open" && (
          <div className="kid-tip-banner">
            <Sparkles size={18} />
            <span>{eyeTip}</span>
          </div>
        )}

        {limitReached && (
          <div className="kid-limit-banner">
            <Lock size={16} />
            <span>
              Hôm nay bé đã đọc đủ giờ rồi, giỏi lắm! Mai mình đọc tiếp nhé.
            </span>
          </div>
        )}

        <section className="kid-shelf">
          <div className="kid-shelf-heading">
            <h2 className="kid-shelf-title">Tủ sách của bé</h2>
            <span className="kid-shelf-count">{books.length} cuốn</span>
          </div>

          <div className="kid-book-grid">
            {books.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className="kid-book-card"
                style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
                onClick={() => handleOpenBook(b)}
              >
                <div className="kid-book-cover">
                  {b.coverImage ? (
                    <img src={b.coverImage} alt={b.title} loading="lazy" />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--forest-mid)",
                        opacity: 0.4,
                      }}
                    >
                      <BookMarked size={32} />
                    </div>
                  )}
                  {(b.ageMin || b.ageMax) && (
                    <span className="kid-book-age">
                      {b.ageMin ?? "0"}–{b.ageMax ?? "17"} tuổi
                    </span>
                  )}
                  <span className={`kid-book-cta${limitReached ? " is-locked" : ""}`}>
                    {limitReached ? (
                      <>
                        <Lock size={13} /> Hết giờ hôm nay
                      </>
                    ) : (
                      <>
                        Đọc ngay <ChevronRight size={13} />
                      </>
                    )}
                  </span>
                </div>
                <div className="kid-book-info">
                  <div className="kid-book-title">{b.title}</div>
                </div>
              </button>
            ))}

            {books.length === 0 && (
              <div className="kid-empty">
                <div className="kid-empty-icon">
                  <BookMarked size={26} />
                </div>
                <div className="kid-empty-title">Chưa có sách nào cả</div>
                <p className="kid-empty-sub">
                  Nhờ ba mẹ mua thêm sách để tủ sách của bé đầy ắp truyện hay
                  nhé!
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="kid-footer">
          <span>🌿 Earthoria — Mở sách, mở ra thế giới</span>
          <Link to="/" className="kid-parent-link">
            Dành cho ba mẹ
          </Link>
        </footer>
      </div>

      {activeBook && (
        <div className="kid-modal-overlay" onClick={closeModal}>
          <div className="kid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kid-modal-cover">
              {activeBook.coverImage ? (
                <img src={activeBook.coverImage} alt={activeBook.title} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--forest-mid)",
                    opacity: 0.4,
                  }}
                >
                  <BookMarked size={40} />
                </div>
              )}
            </div>
            <div className="kid-modal-body">
              <button type="button" className="kid-modal-close" onClick={closeModal} aria-label="Đóng">
                <X size={16} />
              </button>
              {(activeBook.ageMin || activeBook.ageMax) && (
                <span className="kid-modal-age">
                  Dành cho {activeBook.ageMin ?? "0"}–{activeBook.ageMax ?? "17"} tuổi
                </span>
              )}
              <h3 className="kid-modal-title">{activeBook.title}</h3>
              <p className="kid-modal-desc">
                Sẵn sàng cùng {child.name} bước vào câu chuyện này chưa nào?
                Nhờ ba mẹ bật AR để trang sách bừng sáng thành thế giới thật
                nhé!
              </p>
              <button
                type="button"
                className={`kid-modal-cta${limitReached ? " is-disabled" : ""}`}
                disabled={limitReached}
                onClick={() => !limitReached && handleReadNow(activeBook)}
              >
                {limitReached ? (
                  <>
                    <Lock size={15} /> Hôm nay đã đọc đủ giờ
                  </>
                ) : (
                  <>
                    <BookOpen size={15} /> Đọc ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRest && !showBreak && (
        <div className="kid-overlay">
          <div className="kid-overlay-card">
            <div className="kid-breathe">
              <span className="kid-breathe-ring" />
              <span className="kid-breathe-ring d2" />
              <span className="kid-breathe-core">
                <span className="kid-breathe-count">{restLeft}</span>
                <span className="kid-breathe-unit">giây</span>
              </span>
            </div>
            <h2 className="kid-overlay-title">Cho mắt nghỉ ngơi nào!</h2>
            <p className="kid-overlay-text">
              Bé hãy nhìn ra xa và hít thở thật sâu trong giây lát nhé.
            </p>
            {showRestTip && (
              <div className="kid-overlay-tip">
                <Sparkles size={14} /> {eyeTip}
              </div>
            )}
            <div>
              <button type="button" className="kid-overlay-skip" onClick={() => setShowRest(false)}>
                Đã nghỉ xong, đọc tiếp nào →
              </button>
            </div>
          </div>
        </div>
      )}

      {showBreak && (
        <div className="kid-overlay is-break">
          <div className="kid-overlay-card">
            <div className="kid-breathe">
              <span className="kid-breathe-ring" />
              <span className="kid-breathe-ring d2" />
              <span className="kid-breathe-core">
                <span className="kid-breathe-count">{fmtClock(breakLeft)}</span>
                <span className="kid-breathe-unit">còn lại</span>
              </span>
            </div>
            <h2 className="kid-overlay-title">Giờ giải lao rồi!</h2>
            <p className="kid-overlay-text">
              Bé đã đọc miệt mài rồi đó — đứng dậy vươn vai, uống nước, rồi
              quay lại đọc tiếp nhé!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StateBg() {
  return (
    <div className="kid-bg" aria-hidden="true">
      <div className="kid-bg-wash" style={{ background: "var(--ivory)" }} />
      <span className="kid-bg-orb kid-bg-orb-1" style={{ top: "10%" }} />
      <span className="kid-bg-orb kid-bg-orb-2" style={{ top: "60%" }} />
    </div>
  );
}