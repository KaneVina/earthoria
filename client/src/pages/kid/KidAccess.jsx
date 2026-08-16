import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Star,
  Leaf,
  Wind,
  Settings,
  Type,
  ShieldCheck,
  Search,
  Package,
  Lightbulb,
} from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import FullScreenLoader from "../../components/FullScreenLoader";
import "../../components/assets/css/kidAccess.css";

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

const BREATH_PHASES = ["Hít vào thật sâu…", "Thở ra thật chậm…"];

// Bảng màu xoay vòng cho "tủ sách" — mỗi cuốn có một tông riêng để kệ sách
// trông sống động, giống sách thật xếp cạnh nhau chứ không đơn sắc.
const SHELF_ACCENTS = ["leaf", "sky", "berry", "sun", "grape", "coral"];

// Các mức cỡ chữ bé có thể tự chọn trong bảng cài đặt (giữ nút bánh răng để mở).
// Lưu theo từng token trên máy của bé để lần sau ghé lại vẫn giữ đúng cỡ chữ.
const FONT_SCALES = [
  { key: "sm", label: "Nhỏ", value: 0.88 },
  { key: "md", label: "Vừa", value: 1 },
  { key: "lg", label: "Lớn", value: 1.15 },
  { key: "xl", label: "Rất lớn", value: 1.3 },
];
const HOLD_DURATION_MS = 900;

const WEEKDAYS_VI = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function fmtTimeParts(date) {
  const h = pad2(date.getHours());
  const m = pad2(date.getMinutes());
  return { h, m };
}

function fmtDateVi(date) {
  return `${WEEKDAYS_VI[date.getDay()]}, ${date.getDate()} tháng ${date.getMonth() + 1}`;
}

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

// Bỏ dấu tiếng Việt để tìm kiếm "dễ dãi" hơn — bé gõ không dấu vẫn ra
// đúng sách (vd. "co tich" vẫn khớp "Cổ tích").
function normalizeSearch(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

// Chọn màu "gáy sách" ổn định theo id, dùng cho modal (để trùng khớp cảm
// giác với thẻ sách tương ứng ngoài lưới dù ta không truyền index vào đây).
function accentForId(id) {
  const str = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return SHELF_ACCENTS[hash % SHELF_ACCENTS.length];
}

// Hiệu ứng gợn sóng khi bấm (ripple) — thuần DOM, không cần re-render.
function spawnRipple(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;
  const span = document.createElement("span");
  span.className = "kid-ripple";
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.left = `${e.clientX - rect.left - size / 2}px`;
  span.style.top = `${e.clientY - rect.top - size / 2}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

export default function KidAccess() {
  const { slug, token } = useParams(); // :slug không dùng để tra cứu, chỉ để đẹp URL
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | ok | invalid
  const [child, setChild] = useState(null);
  const [books, setBooks] = useState([]);
  const [activeBook, setActiveBook] = useState(null);

  //   phiên đọc (chỉ hiển thị, không ghi vào server)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  //   đồng hồ giờ thực, hiển thị cho bé biết bây giờ là mấy giờ
  const [now, setNow] = useState(() => new Date());

  //   cỡ chữ do bé/phụ huynh chọn trong bảng cài đặt, nhớ theo từng link
  const [fontKey, setFontKey] = useState("md");

  //   bảng cài đặt dành cho phụ huynh + cơ chế "giữ để mở" trên nút bánh răng
  const [showSettings, setShowSettings] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdPct, setHoldPct] = useState(0);
  const holdRafRef = useRef(null);

  //   thanh điều hướng đổi diện mạo khi cuộn
  const [isScrolled, setIsScrolled] = useState(false);

  //   tìm sách theo tên trong tủ sách của bé
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  //   nhắc nghỉ mắt
  const [showRest, setShowRest] = useState(false);
  const [restLeft, setRestLeft] = useState(0);

  //   giải lao bắt buộc
  const [showBreak, setShowBreak] = useState(false);
  const [breakLeft, setBreakLeft] = useState(0);

  //   nhịp thở hiển thị trong overlay
  const [breathPhase, setBreathPhase] = useState(0);

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

  //   đồng hồ giờ thực: cập nhật mỗi giây để hiển thị HH:MM cho bé
  useEffect(() => {
    if (!isOk) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isOk]);

  //   nạp cỡ chữ đã lưu cho đúng link của bé (mỗi bé một token riêng)
  useEffect(() => {
    if (!token) return;
    try {
      const saved = localStorage.getItem(`kid-font-scale:${token}`);
      if (saved && FONT_SCALES.some((s) => s.key === saved)) setFontKey(saved);
    } catch {
      /* localStorage có thể bị chặn (chế độ riêng tư) — bỏ qua, dùng mặc định */
    }
  }, [token]);

  //   lưu lại mỗi khi bé/phụ huynh đổi cỡ chữ
  useEffect(() => {
    if (!token) return;
    try {
      localStorage.setItem(`kid-font-scale:${token}`, fontKey);
    } catch {
      /* bỏ qua nếu không lưu được */
    }
  }, [fontKey, token]);

  const fontScale = FONT_SCALES.find((s) => s.key === fontKey)?.value ?? 1;

  //   đếm giờ phiên đọc hiện tại (chỉ hiển thị cho vui, không phải nguồn sự thật)
  useEffect(() => {
    if (!isOk || showBreak) return;
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isOk, showBreak]);

  //   đổi diện mạo thanh điều hướng khi cuộn trang
  useEffect(() => {
    if (!isOk) return;
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOk]);

  //   lịch nhắc nghỉ mắt định kỳ
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

  //   lịch giải lao bắt buộc
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

  //   luân phiên "hít vào / thở ra" theo đúng nhịp vòng tròn thở (4.5s)
  useEffect(() => {
    if (!showRest && !showBreak) return;
    setBreathPhase(0);
    const id = setInterval(() => setBreathPhase((p) => (p + 1) % BREATH_PHASES.length), 2250);
    return () => clearInterval(id);
  }, [showRest, showBreak]);

  //   mẹo hiển thị lúc mở app (tipsFrequency === 'open')
  useEffect(() => {
    if (isOk && child?.tipsEnabled && child?.tipsFrequency === "open") {
      toast(eyeTip, { icon: <Lightbulb size={16} />, duration: 5000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOk]);

  const handleOpenBook = useCallback((book) => setActiveBook(book), []);
  const closeModal = useCallback(() => setActiveBook(null), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const cancelGearHold = useCallback(() => {
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    holdRafRef.current = null;
    setIsHolding(false);
    setHoldPct(0);
  }, []);

  const startGearHold = useCallback(
    (e) => {
      e.preventDefault();
      setIsHolding(true);
      const startedAt = performance.now();
      const tick = (t) => {
        const pct = Math.min(100, ((t - startedAt) / HOLD_DURATION_MS) * 100);
        setHoldPct(pct);
        if (pct >= 100) {
          holdRafRef.current = null;
          setIsHolding(false);
          setHoldPct(0);
          setShowSettings(true);
          return;
        }
        holdRafRef.current = requestAnimationFrame(tick);
      };
      holdRafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  useEffect(() => () => {
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
  }, []);

  const handleReadNow = useCallback(
    (book) => {
      if (book.hasEbook) {
        navigate(`/e-kid/${slug}/${token}/ebook/${book.slug}`);
        return;
      }
      if (book.arCodes?.length) {
        if (child?.isLocked) {
          toast("AR đang bị khoá, nhờ ba mẹ mở khoá nhé!", { icon: <Lock size={16} /> });
          return;
        }
        if (!book.isDelivered) {
          toast("Sách đang trên đường giao, chưa xem AR được nhé!", { icon: <Package size={16} /> });
          return;
        }
        navigate(`/e-kid/${slug}/${token}/ar/${book.arCodes[0].code}`);
        return;
      }
      toast.success(`Nhờ ba mẹ mở sách điện tử để cùng đọc "${book.title}" nhé!`, {
        icon: <BookOpen size={16} />,
      });
    },
    [child?.isLocked, navigate, slug, token],
  );

  const canReadBook = useCallback(
    (book) => book.hasEbook || (!!book.arCodes?.length && book.isDelivered && !child?.isLocked),
    [child?.isLocked],
  );

  //   tilt + shine mượt cho thẻ sách, cập nhật trực tiếp qua DOM để không re-render
  const handleCardMove = useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rx = (px - 0.5) * 16; // độ nghiêng ngang
    const ry = (py - 0.5) * -16; // độ nghiêng dọc
    el.style.setProperty("--rx", rx.toFixed(2));
    el.style.setProperty("--ry", ry.toFixed(2));
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }, []);
  const handleCardEnter = useCallback((e) => {
    e.currentTarget.classList.add("is-tilting");
  }, []);
  const handleCardLeave = useCallback((e) => {
    const el = e.currentTarget;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", 0);
    el.style.setProperty("--ry", 0);
  }, []);

  //   lọc tủ sách theo từ khoá tìm kiếm (bỏ dấu, không phân biệt hoa/thường)
  const filteredBooks = useMemo(() => {
    const q = normalizeSearch(searchQuery);
    if (!q) return books;
    return books.filter((b) => normalizeSearch(b.title).includes(q));
  }, [books, searchQuery]);
  const isSearching = normalizeSearch(searchQuery).length > 0;

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
          <div className="kid-state-icon kid-state-icon--sky">
            <Info size={30} />
          </div>
          <h1 className="kid-state-title">Link này không đúng rồi bé ơi</h1>
          <p className="kid-state-text">
            Liên kết không hợp lệ hoặc đã bị thu hồi. Bé nhờ ba mẹ lấy lại
            link mới trong trang quản lý nhé!
          </p>
          <Link to="/" className="kid-state-btn" onClick={spawnRipple}>
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
          <div className="kid-state-icon kid-state-icon--coral">
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
          <Link to="/" className="kid-state-btn" onClick={spawnRipple}>
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
  const modalAccent = activeBook ? accentForId(activeBook.id) : "leaf";

  //   viền đếm ngược quanh logo trên header — chỉ hiện khi phụ huynh có
  // đặt giới hạn thời gian đọc/ngày. Nội suy thêm giây của phiên hiện tại
  // (chỉ để hiển thị, không phải nguồn sự thật) để viền vơi dần mượt theo
  // thời gian thực thay vì nhảy cách phút như số liệu từ server.
  const liveTodayMinutes = dailyLimit > 0 ? Math.min(dailyLimit, todayMinutes + sessionSeconds / 60) : 0;
  const crestRemainPercent = dailyLimit > 0 ? Math.max(0, 100 - (liveTodayMinutes / dailyLimit) * 100) : 100;
  const crestRingRadius = 46;
  const crestRingCirc = 2 * Math.PI * crestRingRadius;
  const crestRingOffset = crestRingCirc * (1 - crestRemainPercent / 100);
  const crestRemainMinutes = dailyLimit > 0 ? Math.max(0, Math.ceil(dailyLimit - liveTodayMinutes)) : null;
  const crestRingState = limitReached ? "is-empty" : crestRemainPercent <= 20 ? "is-warning" : "";

  return (
    <div className="kid-page" style={{ "--kid-accent": child.avatarColor || "var(--gold)", "--kid-font-scale": fontScale }}>
      <div className="kid-bg" aria-hidden="true">
        <div className="kid-bg-wash" />
        <div className="kid-bg-hills" />
        <span className="kid-bg-hills-front" />
        <span className="kid-bg-sun" />
        <span className="kid-bg-cloud kid-bg-cloud-1" />
        <span className="kid-bg-cloud kid-bg-cloud-2" />
        <div className="kid-bg-art" />
        <div className="kid-bg-grain" />
        <span className="kid-bg-orb kid-bg-orb-1" />
        <span className="kid-bg-orb kid-bg-orb-2" />
        <span className="kid-bg-icon kid-bg-icon-1">
          <Star size={16} fill="currentColor" />
        </span>
        <span className="kid-bg-icon kid-bg-icon-2">
          <Leaf size={18} />
        </span>
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
        <span className="kid-firefly" />
      </div>

      <div className="kid-shell">
        <header className={`kid-topbar${isScrolled ? " is-scrolled" : ""}`}>
          <div className="kid-brand">
            <div className="kid-crest-wrap">
              {dailyLimit > 0 ? (
                <svg className="kid-crest-countdown" viewBox="0 0 100 100" aria-hidden="true">
                  <title>{`Còn ${crestRemainMinutes} phút đọc hôm nay`}</title>
                  <circle className="kid-crest-countdown-track" cx="50" cy="50" r={crestRingRadius} />
                  <circle
                    className={`kid-crest-countdown-fill${crestRingState ? ` ${crestRingState}` : ""}`}
                    cx="50"
                    cy="50"
                    r={crestRingRadius}
                    strokeDasharray={crestRingCirc}
                    strokeDashoffset={crestRingOffset}
                  />
                </svg>
              ) : (
                <span className="kid-crest-ring" aria-hidden="true" />
              )}
              <span className="kid-crest-badge-ring" aria-hidden="true" />
              <span className="kid-crest-sparkle" aria-hidden="true">✦</span>
              <span className="kid-crest">
                <img src="/logo/logo-mau/lg-m-kid-studio.png" alt="Earthoria" className="kid-crest-img" />
              </span>
            </div>
            <div className="kid-brandtext">
              <span className="kid-brand-word">EARTHORIA</span>
              <span className="kid-brand-tagline">kids · thư viện diệu kỳ</span>
            </div>
          </div>
          <div className="kid-topbar-actions">
            <span className="kid-live-chip">
              <Clock size={12} />
              <span className="kid-live-dot" />
              <span className="kid-live-label">Đang đọc · {fmtClock(sessionSeconds)}</span>
            </span>
            <button
              type="button"
              className={`kid-gear-btn${isHolding ? " is-holding" : ""}`}
              style={{ "--hold-pct": holdPct }}
              aria-label="Giữ để mở cài đặt dành cho phụ huynh"
              onPointerDown={startGearHold}
              onPointerUp={cancelGearHold}
              onPointerLeave={cancelGearHold}
              onPointerCancel={cancelGearHold}
              onContextMenu={(e) => e.preventDefault()}
            >
              <span className="kid-gear-ring" aria-hidden="true" />
              <Settings size={17} />
              <span className="kid-gear-hint">Giữ để mở · dành cho ba mẹ</span>
            </button>
          </div>
        </header>

        <section className="kid-hero">
          <div className="kid-avatar-wrap">
            <span className="kid-avatar-orbit" aria-hidden="true" />
            <span className="kid-avatar-glow" />
            <span className="kid-avatar">{child.avatarEmoji || "🦊"}</span>
            <span className="kid-avatar-sparkles" aria-hidden="true">
              <i>✦</i>
              <i>✦</i>
              <i>✦</i>
              <i>✦</i>
            </span>
          </div>
          <p className="kid-hero-eyebrow">Thư viện của {child.name}</p>
          <h1 className="kid-hero-title">
            {timeGreeting()}, {child.name}!
          </h1>
          <div className="kid-hero-bubble">
            <Sparkles size={15} className="kid-hero-bubble-icon" />
            <p className="kid-hero-sub">{inspireLine}</p>
            <span className="kid-hero-bubble-tail" aria-hidden="true" />
          </div>
          {Number.isFinite(child.age) && (
            <div className="kid-hero-age">
              <Smile size={13} /> {child.age} tuổi
            </div>
          )}
        </section>

        <section className="kid-search-section">
          <label className="kid-search-bar" htmlFor="kid-book-search">
            <Search size={19} className="kid-search-icon" aria-hidden="true" />
            <input
              id="kid-book-search"
              ref={searchInputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              className="kid-search-input"
              placeholder="Bé muốn tìm sách gì nào?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <button
                type="button"
                className="kid-search-clear"
                onClick={clearSearch}
                aria-label="Xoá tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </section>

        <section className="kid-stats-row">
          <div className="kid-stat-card kid-stat-card--time">
            <div className="kid-clock-icon">
              <Clock size={18} />
            </div>
            <div>
              <div className="kid-stat-label">Bây giờ là</div>
              <div className="kid-clock-value">
                {fmtTimeParts(now).h}
                <span className="kid-clock-colon">:</span>
                {fmtTimeParts(now).m}
              </div>
              <div className="kid-clock-date">{fmtDateVi(now)}</div>
            </div>
          </div>

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
            <div className="kid-stat-card kid-stat-card--sky">
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
            <div className="kid-stat-card kid-stat-card--berry">
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
            <span className="kid-tip-banner-icon">
              <Sparkles size={16} />
            </span>
            <span>{eyeTip}</span>
          </div>
        )}

        {limitReached && (
          <div className="kid-limit-banner">
            <span className="kid-limit-banner-icon">
              <Lock size={16} />
            </span>
            <span>
              Hôm nay bé đã đọc đủ giờ rồi, giỏi lắm! Mai mình đọc tiếp nhé.
            </span>
          </div>
        )}

        <section className="kid-shelf">
          <div className="kid-shelf-heading">
            <div className="kid-shelf-title-wrap">
              <Leaf size={17} className="kid-shelf-leaf" aria-hidden="true" />
              <h2 className="kid-shelf-title">Tủ sách của bé</h2>
            </div>
            <span className="kid-shelf-count">
              {isSearching ? `${filteredBooks.length}/${books.length} cuốn` : `${books.length} cuốn`}
            </span>
          </div>

          <div className="kid-book-grid">
            {filteredBooks.map((b, i) => {
              const accent = SHELF_ACCENTS[i % SHELF_ACCENTS.length];
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`kid-book-card kid-book-card--${accent}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
                  onMouseEnter={handleCardEnter}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                  onClick={(e) => {
                    spawnRipple(e);
                    handleOpenBook(b);
                  }}
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
                    <span className="kid-book-shine" aria-hidden="true" />
                    <span className="kid-book-cover-inset" aria-hidden="true" />
                    {(b.ageMin || b.ageMax) && (
                      <span className="kid-book-age">
                        {b.ageMin ?? "0"}–{b.ageMax ?? "17"} tuổi
                      </span>
                    )}
                    <span className={`kid-book-cta${limitReached || !canReadBook(b) ? " is-locked" : ""}`}>
                      {limitReached ? (
                        <>
                          <Lock size={13} /> Hết giờ hôm nay
                        </>
                      ) : !canReadBook(b) ? (
                        <>
                          <Clock size={13} /> Đang chờ sách
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
              );
            })}

            {filteredBooks.length === 0 && isSearching && (
              <div className="kid-empty">
                <div className="kid-empty-icon">
                  <Search size={24} />
                </div>
                <div className="kid-empty-title">Không tìm thấy sách nào</div>
                <p className="kid-empty-sub">
                  Bé thử gõ tên khác xem sao, hoặc nhờ ba mẹ mua thêm sách mới
                  nhé!
                </p>
                <button type="button" className="kid-empty-clear" onClick={clearSearch}>
                  Xoá tìm kiếm
                </button>
              </div>
            )}

            {books.length === 0 && !isSearching && (
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

        <div className="kid-footer-divider" aria-hidden="true">
          <Leaf size={14} />
        </div>
        <footer className="kid-footer">
          <span>🌿 Earthoria — Mở sách, mở ra thế giới</span>
          <Link to="/" className="kid-parent-link">
            Dành cho ba mẹ
          </Link>
        </footer>
      </div>

      {activeBook && (
        <div className="kid-modal-overlay" onClick={closeModal}>
          <div className={`kid-modal kid-modal--${modalAccent}`} onClick={(e) => e.stopPropagation()}>
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
                {activeBook.isDelivered
                  ? `Sẵn sàng cùng ${child.name} bước vào câu chuyện này chưa nào? Chạm nút bên dưới để mô hình AR bừng sáng thành thế giới thật nhé!`
                  : "Sách đang trên đường giao tới nhà. Khi nhận được sách, bé có thể mở AR ở đây nhé!"}
              </p>
              <button
                type="button"
                className={`kid-modal-cta${limitReached || !activeBook.isDelivered ? " is-disabled" : ""}`}
                disabled={limitReached || !activeBook.isDelivered}
                onClick={(e) => {
                  if (limitReached || !activeBook.isDelivered) return;
                  spawnRipple(e);
                  handleReadNow(activeBook);
                }}
              >
                {limitReached ? (
                  <>
                    <Lock size={15} /> Hôm nay đã đọc đủ giờ
                  </>
                ) : !activeBook.isDelivered ? (
                  <>
                    <Clock size={15} /> Đang giao hàng
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

      {showSettings && (
        <div className="kid-modal-overlay" onClick={closeSettings}>
          <div className="kid-settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="kid-settings-header">
              <div className="kid-settings-icon">
                <Settings size={20} />
              </div>
              <div>
                <div className="kid-settings-title">Cài đặt cho ba mẹ</div>
                <div className="kid-settings-sub">Tuỳ chỉnh nhanh cho {child.name}</div>
              </div>
              <button type="button" className="kid-settings-close" onClick={closeSettings} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>

            <div className="kid-settings-section">
              <div className="kid-settings-label">
                <Type size={14} /> Cỡ chữ trên trang đọc
              </div>
              <div className="kid-font-options">
                {FONT_SCALES.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`kid-font-option${fontKey === opt.key ? " is-active" : ""}`}
                    onClick={() => setFontKey(opt.key)}
                  >
                    <span className="kid-font-glyph">Aa</span>
                    <span className="kid-font-option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="kid-font-preview" style={{ "--kid-font-scale": fontScale }}>
                Bé thích đọc sách cùng Earthoria Kid Studio!
              </div>
            </div>

            <div className="kid-settings-divider" />

            <div className="kid-settings-section" style={{ marginBottom: 0 }}>
              <div className="kid-settings-label">
                <ShieldCheck size={14} /> Quản lý nâng cao
              </div>
              <Link to="/parent-dashboard" className="kid-settings-cta">
                Mở trang quản lý cho phụ huynh <ChevronRight size={16} />
              </Link>
            </div>

            <div className="kid-settings-footnote">
              <Leaf size={13} /> Giờ đọc, giới hạn thời gian và nhắc nghỉ mắt được quản lý ở đó.
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
              <span className="kid-breathe-ring d3" />
              <span className="kid-breathe-core">
                <Eye size={16} className="kid-breathe-icon" aria-hidden="true" />
                <span className="kid-breathe-count">{restLeft}</span>
                <span className="kid-breathe-unit">giây</span>
              </span>
            </div>
            <span className="kid-breathe-phase">{BREATH_PHASES[breathPhase]}</span>
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
              <span className="kid-breathe-ring d3" />
              <span className="kid-breathe-core">
                <Wind size={16} className="kid-breathe-icon" aria-hidden="true" />
                <span className="kid-breathe-count">{fmtClock(breakLeft)}</span>
                <span className="kid-breathe-unit">còn lại</span>
              </span>
            </div>
            <span className="kid-breathe-phase">{BREATH_PHASES[breathPhase]}</span>
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
      <div className="kid-bg-hills" />
      <span className="kid-bg-hills-front" />
      <span className="kid-bg-orb kid-bg-orb-1" style={{ top: "10%" }} />
      <span className="kid-bg-orb kid-bg-orb-2" style={{ top: "60%" }} />
    </div>
  );
}