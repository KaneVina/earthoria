import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BookOpen,
  Clock,
  Eye,
  Lock,
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  ChevronRight,
  ArrowUp,
  X,
  Compass,
  Smile,
  BookMarked,
  ArrowLeft,
  Star,
  Wind,
  Settings,
  Type,
  ShieldCheck,
  Search,
  Lightbulb,
  PartyPopper,
  Heart,
} from "lucide-react";
import { kidAccessService } from "../../services/kidAccessService";
import FullScreenLoader from "../../components/FullScreenLoader";
import KnowledgeGarden from "../../components/knowledgeGarden/KnowledgeGarden";
import "../../components/assets/css/kidAccess.css";
import GardenWidget from "../../components/knowledgeGarden/GardenWidget";
import KidCloudCurtain from "../../components/KidCloudCurtain";

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
const SHELF_ACCENTS = ["leaf", "sky", "berry", "sun", "grape", "coral"];
const FONT_SCALES = [
  { key: "sm", label: "Nhỏ", value: 0.88 },
  { key: "md", label: "Vừa", value: 1 },
  { key: "lg", label: "Lớn", value: 1.15 },
  { key: "xl", label: "Rất lớn", value: 1.3 },
];
const HOLD_DURATION_MS = 900;
const BACK_TO_TOP_THRESHOLD = 520;

//   màn mây mù mở đầu trang /e-kid: thời gian che phủ tối thiểu (để không bị
//   chớp nháy nếu API trả lời quá nhanh) và thời lượng hoạt ảnh mây tản ra —
//   giá trị này phải khớp với --kid-curtain-leave trong kidAccess.css
const INTRO_COVER_MIN_MS = 900;
const INTRO_LEAVE_MS = 1650;

const WEEKDAYS_VI = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

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

function normalizeSearch(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

const SENSITIVE_KEYWORDS = [
  "tu tu",
  "tu tu di",
  "muon tu tu",
  "tu sat",
  "tu ky",
  "tram cam",
  "muon chet",
  "chan song",
  "khong muon song",
  "cai chet",
  "tu hai",
  "tu lam hai ban than",
  "rach tay",
  "cat tay",
  "tuyet vong",
].map(normalizeSearch);

function isSensitiveQuery(text) {
  const nq = normalizeSearch(text);
  if (!nq) return false;
  return SENSITIVE_KEYWORDS.some((k) => nq.includes(k));
}

/** Highlight phần khớp trong tên sách — đổi tên tránh đụng Highlight API của trình duyệt */
function SearchHighlight({ text, query }) {
  if (!query || !query.trim() || !text) return <>{text}</>;
  const norm = normalizeSearch(text);
  const normQ = normalizeSearch(query.trim());
  const idx = norm.indexOf(normQ);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="kid-search-mark">
        {text.slice(idx, idx + query.trim().length)}
      </mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

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

const SPARKLE_COLORS = [
  "#12A8E0",
  "#FF6E93",
  "#FF9F45",
  "#63CC4A",
  "#FFC53D",
  "#1FC2C2",
];

function spawnSparklesAt(x, y, count = 10) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const layer = document.createElement("div");
  layer.className = "kid-sparkle-layer";
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "kid-sparkle-piece";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 36 + Math.random() * 46;
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    piece.style.setProperty("--sc", SPARKLE_COLORS[i % SPARKLE_COLORS.length]);
    piece.style.animationDelay = `${Math.random() * 70}ms`;
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 950);
}

function spawnSparkles(e, count = 10) {
  spawnSparklesAt(e.clientX, e.clientY, count);
}

const SUNRISE_HOUR = 6; // 06:00 — mặt trời mọc
const SUNSET_HOUR = 18; // 18:00 — mặt trời lặn
const NIGHT_SKY_STOPS = [
  "#050B1F",
  "#0B1B3A",
  "#16294F",
  "#20386A",
  "#2B4570",
  "#182647",
];
const DAY_SKY_STOPS = [
  "#063A57",
  "#1AAEE8",
  "#12A8E0",
  "#6FD3F2",
  "#EAF8FF",
  "#F5FBFF",
];

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function arcPosition(h, start, end) {
  let span = end - start;
  if (span <= 0) span += 24;
  let hh = h - start;
  if (hh < 0) hh += 24;
  const progress = clamp01(hh / span);
  const elevation = Math.sin(progress * Math.PI); // 0 chân trời → 1 đỉnh trời
  return {
    progress,
    elevation,
    x: 6 + progress * 88,
    y: 88 - elevation * 80,
  };
}

function computeSkyState(date) {
  const h = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  const dayness = Math.cos(((h - 12) / 12) * Math.PI);
  const dayT = clamp01((dayness + 0.15) / 0.3); // 0 = màu đêm, 1 = màu ngày
  const edge = clamp01(1 - Math.abs(dayness) * 2.2); // đỉnh đúng lúc rạng đông/hoàng hôn

  const stops = NIGHT_SKY_STOPS.map((c, i) =>
    mixHex(c, DAY_SKY_STOPS[i], dayT),
  );

  const sunVisible = h >= SUNRISE_HOUR && h <= SUNSET_HOUR;
  const sunArc = arcPosition(h, SUNRISE_HOUR, SUNSET_HOUR);
  const sunOpacity = sunVisible ? clamp01(sunArc.elevation * 4) : 0;

  const moonVisible = !sunVisible;
  const moonArc = arcPosition(h, SUNSET_HOUR, SUNRISE_HOUR + 24);
  const moonOpacity = moonVisible ? clamp01(moonArc.elevation * 4) : 0;

  const starOpacity = clamp01(1 - dayT * 1.35);

  let phase = "day";
  if (dayT <= 0.15) phase = "night";
  else if (dayT < 0.85) phase = h < 12 ? "dawn" : "dusk";

  return {
    phase,
    stops,
    starOpacity,
    warmOpacity: edge,
    warmX: sunVisible ? sunArc.x : moonArc.x,
    sun: { visible: sunVisible, opacity: sunOpacity, x: sunArc.x, y: sunArc.y },
    moon: {
      visible: moonVisible,
      opacity: moonOpacity,
      x: moonArc.x,
      y: moonArc.y,
    },
  };
}

function useSkyState() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => computeSkyState(date), [date]);
}

function PhaseIcon({ phase, ...props }) {
  if (phase === "night") return <Moon {...props} />;
  if (phase === "dawn") return <Sunrise {...props} />;
  if (phase === "dusk") return <Sunset {...props} />;
  return <Sun {...props} />;
}

function DynamicSky({ skyState, minimal = false }) {
  const { stops, sun, moon, starOpacity, warmOpacity, warmX, phase } = skyState;
  const skyStyle = {
    "--sky-s1": stops[0],
    "--sky-s2": stops[1],
    "--sky-s3": stops[2],
    "--sky-s4": stops[3],
    "--sky-s5": stops[4],
    "--sky-s6": stops[5],
    "--warm-opacity": warmOpacity,
    "--warm-x": `${warmX}%`,
  };

  return (
    <div
      className="kid-sky"
      aria-hidden="true"
      style={skyStyle}
      data-phase={phase}
    >
      <div className="kid-sky-wash" />
      <div className="kid-sky-warm" />

      {sun.opacity > 0.01 && (
        <span
          className="kid-sun"
          style={{ left: `${sun.x}%`, top: `${sun.y}%`, opacity: sun.opacity }}
        />
      )}

      {moon.opacity > 0.01 && (
        <span
          className="kid-moon"
          style={{
            left: `${moon.x}%`,
            top: `${moon.y}%`,
            opacity: moon.opacity,
          }}
        >
          <span className="kid-moon-crater c1" />
          <span className="kid-moon-crater c2" />
          <span className="kid-moon-crater c3" />
        </span>
      )}

      <span className="kid-cloud kid-cloud-1" />
      <span className="kid-cloud kid-cloud-2" />
      <span className="kid-cloud kid-cloud-3" />

      <div className="kid-stars-layer" style={{ opacity: starOpacity }}>
        <span className="kid-star kid-star-1" />
        <span className="kid-star kid-star-2" />
        <span className="kid-star kid-star-3" />
        <span className="kid-star kid-star-4" />
        <span className="kid-star kid-star-5" />
        <span className="kid-star kid-star-6" />
        <span className="kid-star kid-star-7" />
        <span className="kid-star kid-star-8" />
        {starOpacity > 0.45 && <span className="kid-shooting-star" />}
      </div>

      {!minimal && (
        <>
          <span className="kid-float-icon kid-float-icon-1">
            <Star size={18} fill="currentColor" />
          </span>
          <span className="kid-float-icon kid-float-icon-2">
            <Sparkles size={20} />
          </span>
        </>
      )}

      <div className="kid-sky-grain" />
    </div>
  );
}

export default function KidAccess() {
  const { slug, token } = useParams(); // :slug không dùng để tra cứu, chỉ để đẹp URL
  const navigate = useNavigate();
  const location = useLocation();
  const skyState = useSkyState(); // bầu trời theo giờ thực — chạy cho mọi trạng thái của trang
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
  const holdOriginRef = useRef({ x: 0, y: 0 }); // toạ độ giữ, để bắn pháo hoa đúng chỗ khi mở khoá thành công

  //   thanh điều hướng đổi diện mạo khi cuộn
  const [isScrolled, setIsScrolled] = useState(false);
  const pageRef = useRef(null); // tham chiếu vùng cuộn thật sự của trang, dùng cho nút "lên đầu trang"
  const [showBackToTop, setShowBackToTop] = useState(false);

  //   tìm sách theo tên trong tủ sách của bé
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
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

  //   cuộn tới tủ sách khi quay lại từ trang Vườn Tri Thức (nút "Đọc sách ngay")
  useEffect(() => {
    if (!isOk || !location.state?.scrollToShelf) return;
    const id = setTimeout(() => {
      document
        .querySelector(".kid-shelf")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      navigate(location.pathname, { replace: true, state: {} });
    }, 120);
    return () => clearTimeout(id);
  }, [isOk, location.state, location.pathname, navigate]);

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
  }, [
    isOk,
    child?.ruleEnabled,
    child?.ruleIntervalMinutes,
    child?.ruleRestSeconds,
  ]);

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
  }, [
    isOk,
    child?.mandatoryBreakEnabled,
    child?.breakAfterMinutes,
    child?.breakDurationMinutes,
  ]);

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
    const id = setInterval(
      () => setBreathPhase((p) => (p + 1) % BREATH_PHASES.length),
      2250,
    );
    return () => clearInterval(id);
  }, [showRest, showBreak]);

  //   mẹo hiển thị lúc mở app (tipsFrequency === 'open')
  useEffect(() => {
    if (isOk && child?.tipsEnabled && child?.tipsFrequency === "open") {
      toast(eyeTip, { icon: <Lightbulb size={16} />, duration: 5000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOk]);

  //   MÀN MÂY MÙ MỞ ĐẦU: "cover" (mây phủ kín, chờ tải) → "leave" (mây tản
  //   ra để lộ giao diện) → "done" (gỡ hẳn khỏi DOM). Giữ mây hiện đủ
  //   INTRO_COVER_MIN_MS dù server trả lời nhanh, để tránh chớp nháy.
  const [introStage, setIntroStage] = useState("cover");
  const introMountedAtRef = useRef(null);
  useEffect(() => {
    introMountedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();
  }, []);
  useEffect(() => {
    if (status === "loading" || introStage !== "cover") return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsed = now - (introMountedAtRef.current ?? now);
    const wait = Math.max(0, INTRO_COVER_MIN_MS - elapsed);
    const id = setTimeout(() => setIntroStage("leave"), wait);
    return () => clearTimeout(id);
  }, [status, introStage]);
  useEffect(() => {
    if (introStage !== "leave") return;
    const id = setTimeout(() => setIntroStage("done"), INTRO_LEAVE_MS);
    return () => clearTimeout(id);
  }, [introStage]);
  const introOverlay =
    introStage !== "done" ? (
      <KidCloudCurtain stage={introStage} skyState={skyState} />
    ) : null;

  const handleOpenBook = useCallback((book) => setActiveBook(book), []);
  const closeModal = useCallback(() => setActiveBook(null), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const handleKidPageScroll = useCallback((e) => {
    setShowBackToTop(e.currentTarget.scrollTop > BACK_TO_TOP_THRESHOLD);
  }, []);

  const handleBackToTop = useCallback((e) => {
    spawnRipple(e);
    spawnSparkles(e, 12);
    pageRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  const startGearHold = useCallback((e) => {
    e.preventDefault();
    setIsHolding(true);
    holdOriginRef.current = { x: e.clientX, y: e.clientY };
    const startedAt = performance.now();
    const tick = (t) => {
      const pct = Math.min(100, ((t - startedAt) / HOLD_DURATION_MS) * 100);
      setHoldPct(pct);
      if (pct >= 100) {
        holdRafRef.current = null;
        setIsHolding(false);
        setHoldPct(0);
        setShowSettings(true);
        spawnSparklesAt(holdOriginRef.current.x, holdOriginRef.current.y, 14);
        return;
      }
      holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    },
    [],
  );

  const handleReadNow = useCallback(
    (book) => {
      navigate(`/e-kid/${slug}/${token}/ebook/${book.slug}`);
    },
    [navigate, slug, token],
  );

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
  const isSensitiveSearch = useMemo(
    () => isSensitiveQuery(searchQuery),
    [searchQuery],
  );
  const isSearchActive = isSearching || searchFocused;

  if (status === "loading") {
    return (
      <>
        {introOverlay}
        <div
          className="kid-state-page kid-state-page--loading"
          data-phase={skyState.phase}
        >
          <DynamicSky skyState={skyState} minimal />
          <FullScreenLoader
            eyebrow="Đang mở tủ sách"
            message="Bé một chút xíu nhé..."
          />
        </div>
      </>
    );
  }

  if (status === "invalid") {
    return (
      <>
        {introOverlay}
        <div className="kid-state-page" data-phase={skyState.phase}>
          <DynamicSky skyState={skyState} minimal />
          <div className="kid-state-card">
            <div className="kid-state-icon kid-state-icon--blue">
              <Compass size={30} />
            </div>
            <h1 className="kid-state-title">Link này không đúng rồi bé ơi</h1>
            <p className="kid-state-text">
              Liên kết không hợp lệ hoặc đã bị thu hồi. Bé nhờ ba mẹ lấy lại
              link mới trong trang quản lý nhé!
            </p>
            <Link
              to="/"
              className="kid-btn kid-btn--primary kid-state-btn"
              onClick={(e) => {
                spawnRipple(e);
                spawnSparkles(e, 8);
              }}
            >
              <ArrowLeft size={16} /> Về trang chủ
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (child?.isLocked) {
    return (
      <>
        {introOverlay}
        <div className="kid-state-page" data-phase={skyState.phase}>
          <DynamicSky skyState={skyState} minimal />
          <div className="kid-state-card">
            <div className="kid-state-icon kid-state-icon--orange">
              <Lock size={28} />
            </div>
            <h1 className="kid-state-title">
              Đến giờ nghỉ rồi, {child.name} ơi!
            </h1>
            <p className="kid-state-text">
              Ba mẹ đã tạm khoá sách của bé lúc này. Bé nhờ ba mẹ mở lại khi
              muốn đọc tiếp nhé!
            </p>
            <span className="kid-state-stat">
              <BookOpen size={14} /> Hôm nay bé đã đọc{" "}
              {child.todayMinutes || 0} phút
            </span>
            <br />
            <Link
              to="/"
              className="kid-btn kid-btn--primary kid-state-btn"
              onClick={(e) => {
                spawnRipple(e);
                spawnSparkles(e, 8);
              }}
            >
              <ArrowLeft size={16} /> Về trang chủ
            </Link>
          </div>
        </div>
      </>
    );
  }

  const dailyLimit = child.dailyLimitMinutes || 0;
  const todayMinutes = child.todayMinutes || 0;
  const limitReached = dailyLimit > 0 && todayMinutes >= dailyLimit;
  const ringPercent =
    dailyLimit > 0 ? Math.min(100, (todayMinutes / dailyLimit) * 100) : 0;
  const ringRadius = 23;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - ringPercent / 100);
  const inWindow = child.allowWindowEnabled
    ? withinWindow(child.allowStart, child.allowEnd)
    : true;
  const showRestTip =
    child.tipsEnabled &&
    (child.tipsFrequency === "rest" || child.tipsFrequency === "interval");
  const modalAccent = activeBook ? accentForId(activeBook.id) : "sky";

  const liveTodayMinutes =
    dailyLimit > 0
      ? Math.min(dailyLimit, todayMinutes + sessionSeconds / 60)
      : 0;
  const crestRemainPercent =
    dailyLimit > 0
      ? Math.max(0, 100 - (liveTodayMinutes / dailyLimit) * 100)
      : 100;
  const crestRingRadius = 46;
  const crestRingCirc = 2 * Math.PI * crestRingRadius;
  const crestRingOffset = crestRingCirc * (1 - crestRemainPercent / 100);
  const crestRemainMinutes =
    dailyLimit > 0
      ? Math.max(0, Math.ceil(dailyLimit - liveTodayMinutes))
      : null;
  const crestRingState = limitReached
    ? "is-empty"
    : crestRemainPercent <= 20
      ? "is-warning"
      : "";

  return (
    <>
      {introOverlay}
      <div
        className="kid-page"
        data-phase={skyState.phase}
        ref={pageRef}
        onScroll={handleKidPageScroll}
        style={{
          "--kid-accent": child.avatarColor || "var(--kid-blue)",
          "--kid-font-scale": fontScale,
        }}
      >
      <DynamicSky skyState={skyState} />

      <div className="kid-shell">
        <header className={`kid-topbar${isScrolled ? " is-scrolled" : ""}`}>
          <div className="kid-brand">
            <div className="kid-crest-wrap">
              {dailyLimit > 0 ? (
                <svg
                  className="kid-crest-countdown"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <title>{`Còn ${crestRemainMinutes} phút đọc hôm nay`}</title>
                  <defs>
                    <linearGradient
                      id="kidCountdownGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#12A8E0" />
                      <stop offset="55%" stopColor="#1FC2C2" />
                      <stop offset="100%" stopColor="#FF6E93" />
                    </linearGradient>
                  </defs>
                  <circle
                    className="kid-crest-countdown-track"
                    cx="50"
                    cy="50"
                    r={crestRingRadius}
                  />
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
              <span className="kid-crest">
                <img
                  src="/logo/logo-mau/lg-m-kid-studio.png"
                  alt="Earthoria"
                  className="kid-crest-img"
                />
              </span>
            </div>
            <div className="kid-brandtext">
              <span className="kid-brand-word">TRANG TRẠI TRI THỨC</span>
              <span className="kid-brand-tagline">
                Chủ trang trại: {child.name}
              </span>
            </div>
          </div>
          <div className="kid-topbar-actions">
            <span className="kid-live-chip">
              <Clock size={12} />
              <span className="kid-live-dot" />
              <span className="kid-live-label">
                Đang đọc · {fmtClock(sessionSeconds)}
              </span>
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

        <section className={`kid-hero${isSearchActive ? " kid-blurred" : ""}`}>
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
          <h1 className="kid-hero-title">
            {timeGreeting()},{" "}
            <span className="kid-name-highlight">{child.name}</span>!
          </h1>
          {/* <div className="kid-hero-bubble"> */}
          {/* <Sparkles size={15} className="kid-hero-bubble-icon" /> */}
          {/* <p className="kid-hero-sub">{inspireLine}</p> */}
          {/* <span className="kid-hero-bubble-tail" aria-hidden="true" /> */}
          {/* </div> */}
          {Number.isFinite(child.age) && (
            <div className="kid-hero-age">
              <Smile size={13} /> {child.age} tuổi
            </div>
          )}
        </section>

        <section className="kid-search-section">
          <div
            className={`kid-search-wrap${isSearchActive ? " is-active" : ""}`}
          >
            <label
              className={`kid-search-bar${isSearchActive ? " is-active" : ""}`}
              htmlFor="kid-book-search"
            >
              <Search
                size={19}
                className="kid-search-icon"
                aria-hidden="true"
              />
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
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {isSearching && (
                <button
                  type="button"
                  className="kid-search-clear"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearSearch}
                  aria-label="Xoá tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            {isSearchActive && (
              <div
                className="kid-search-dropdown"
                role="listbox"
                onMouseDown={(e) => e.preventDefault()}
              >
                {!isSearching ? (
                  <div className="kid-search-dropdown-empty">
                    <span className="kid-search-dropdown-empty-icon">
                      <Search size={26} />
                    </span>
                    <span>Gõ tên sách để bé tìm nhé</span>
                  </div>
                ) : isSensitiveSearch ? (
                  <div className="kid-search-help">
                    <img
                      src="/ekid-help.png"
                      alt=""
                      className="kid-search-help-img"
                    />
                    <p className="kid-search-help-text">
                      Bé không đơn độc đâu nhé. Nếu bé hoặc bạn bè đang cảm thấy
                      buồn hay khó khăn, hãy nói chuyện với ba mẹ hoặc thầy cô
                      để được giúp đỡ nhé.
                    </p>
                  </div>
                ) : filteredBooks.length > 0 ? (
                  <>
                    <div className="kid-search-dropdown-head">
                      <Sparkles size={14} />
                      <span>
                        {filteredBooks.length}/{books.length} cuốn tìm thấy
                      </span>
                    </div>
                    <div className="kid-search-dropdown-list">
                      {filteredBooks.map((b) => {
                        const accent = accentForId(b.id);
                        return (
                          <button
                            type="button"
                            key={b.id}
                            className={`kid-search-result-row kid-search-result-row--${accent}`}
                            onClick={(e) => {
                              spawnRipple(e);
                              handleOpenBook(b);
                            }}
                          >
                            <span className="kid-search-result-thumb">
                              {b.coverImage ? (
                                <img src={b.coverImage} alt="" loading="lazy" />
                              ) : (
                                <BookMarked size={20} />
                              )}
                              <span
                                className="kid-search-result-star"
                                aria-hidden="true"
                              >
                                <Star size={9} fill="currentColor" />
                              </span>
                            </span>
                            <span className="kid-search-result-info">
                              <span className="kid-search-result-title">
                                <SearchHighlight
                                  text={b.title}
                                  query={searchQuery}
                                />
                              </span>
                              {(b.ageMin || b.ageMax) && (
                                <span className="kid-search-result-age">
                                  {b.ageMin ?? "0"}–{b.ageMax ?? "17"} tuổi
                                </span>
                              )}
                            </span>
                            <ChevronRight
                              size={18}
                              className="kid-search-result-arrow"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="kid-search-dropdown-empty">
                    <span className="kid-search-dropdown-empty-icon">
                      <Search size={26} />
                    </span>
                    <span>Không tìm thấy sách nào</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className={`kid-blur-wrap${isSearchActive ? " kid-blurred" : ""}`}>
          <section className="kid-stats-row">
            <div className="kid-stat-card kid-stat-card--time">
              <div className="kid-clock-icon">
                <PhaseIcon phase={skyState.phase} size={18} />
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
                    <defs>
                      <linearGradient
                        id="kidRingGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#12A8E0" />
                        <stop offset="100%" stopColor="#FF6E93" />
                      </linearGradient>
                    </defs>
                    <circle
                      className="kid-ring-track"
                      cx="26"
                      cy="26"
                      r={ringRadius}
                    />
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
                <span
                  className={`kid-stat-status ${inWindow ? "is-open" : "is-closed"}`}
                >
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
                <Lightbulb size={16} />
              </span>
              <span>{eyeTip}</span>
            </div>
          )}

          {limitReached && (
            <div className="kid-limit-banner">
              <span className="kid-limit-banner-icon">
                <PartyPopper size={16} />
              </span>
              <span>
                Hôm nay bé đã đọc đủ giờ rồi, giỏi lắm! Mai mình đọc tiếp nhé.
              </span>
            </div>
          )}

          <GardenWidget token={token} slug={slug} />

          <section className="kid-shelf">
            <div className="kid-shelf-heading">
              <div className="kid-shelf-title-wrap">
                <span className="kid-shelf-leaf" aria-hidden="true">
                  <BookOpen size={17} />
                </span>
                <h2 className="kid-shelf-title">
                  {"Tủ sách của bé".normalize("NFC")}
                </h2>
              </div>
              <span className="kid-shelf-count">{books.length} cuốn</span>
            </div>

            <div className="kid-book-grid">
              {books.map((b, i) => {
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
                      spawnSparkles(e, 8);
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
                            color: "var(--kid-blue)",
                            opacity: 0.45,
                          }}
                        >
                          <BookMarked size={32} />
                        </div>
                      )}
                      <span className="kid-book-shine" aria-hidden="true" />
                      <span className="kid-book-stamp" aria-hidden="true">
                        <Star size={14} fill="currentColor" />
                      </span>
                      {(b.ageMin || b.ageMax) && (
                        <span className="kid-book-age">
                          {b.ageMin ?? "0"}–{b.ageMax ?? "17"} tuổi
                        </span>
                      )}
                      <span
                        className={`kid-book-cta${limitReached ? " is-locked" : ""}`}
                      >
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
                );
              })}

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
        </div>

        <div className="kid-footer-divider" aria-hidden="true">
          <Star size={14} fill="currentColor" />
        </div>
        <footer className="kid-footer">
          <span>🌈 Earthoria — Mở sách, mở ra thế giới</span>
          <Link to="/" className="kid-parent-link">
            Dành cho ba mẹ
          </Link>
        </footer>
      </div>

      <button
        type="button"
        className={`kid-back-to-top${showBackToTop ? " is-visible" : ""}`}
        onClick={handleBackToTop}
        aria-label="Lên đầu trang"
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
      >
        <span className="kid-back-to-top-ring" aria-hidden="true" />
        <ArrowUp size={22} strokeWidth={2.6} aria-hidden="true" />
      </button>

      {activeBook && (
        <div className="kid-modal-overlay" onClick={closeModal}>
          <div
            className={`kid-modal kid-modal--${modalAccent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kid-modal-cover">
              {activeBook.coverImage ? (
                <img src={activeBook.coverImage} alt={activeBook.title} />
              ) : (
                <div className="kid-modal-cover-placeholder">
                  <span className="kid-modal-cover-deco kid-modal-cover-deco--1">
                    <Star size={14} fill="currentColor" />
                  </span>
                  <span className="kid-modal-cover-deco kid-modal-cover-deco--2">
                    <Sparkles size={16} />
                  </span>
                  <span className="kid-modal-cover-deco kid-modal-cover-deco--3">
                    <Star size={10} fill="currentColor" />
                  </span>
                  <span className="kid-modal-cover-icon">
                    <BookMarked size={38} />
                  </span>
                </div>
              )}
              <span className="kid-modal-cover-tag">
                <Sparkles size={12} /> Sách điện tử
              </span>
            </div>
            <div className="kid-modal-body">
              <button
                type="button"
                className="kid-modal-close"
                onClick={closeModal}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
              {(activeBook.ageMin || activeBook.ageMax) && (
                <span className="kid-modal-age">
                  <Smile size={12} /> Dành cho {activeBook.ageMin ?? "0"}–
                  {activeBook.ageMax ?? "17"} tuổi
                </span>
              )}
              <h3 className="kid-modal-title">{activeBook.title}</h3>
              <p className="kid-modal-desc">
                {`Sẵn sàng cùng ${child.name} bước vào câu chuyện điện tử này chưa nào? Chạm nút bên dưới để bắt đầu đọc nhé!`}
              </p>
              <div className="kid-modal-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>
              <button
                type="button"
                className={`kid-btn kid-modal-cta${limitReached ? " is-disabled" : ""}`}
                disabled={limitReached}
                onClick={(e) => {
                  if (limitReached) return;
                  spawnRipple(e);
                  spawnSparkles(e, 12);
                  handleReadNow(activeBook);
                }}
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

      {showSettings && (
        <div className="kid-modal-overlay" onClick={closeSettings}>
          <div
            className="kid-settings-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kid-settings-header">
              <div className="kid-settings-icon">
                <Settings size={20} />
              </div>
              <div>
                <div className="kid-settings-title">Cài đặt cho ba mẹ</div>
                <div className="kid-settings-sub">
                  Tuỳ chỉnh nhanh cho {child.name}
                </div>
              </div>
              <button
                type="button"
                className="kid-settings-close"
                onClick={closeSettings}
                aria-label="Đóng"
              >
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
                    onClick={(e) => {
                      setFontKey(opt.key);
                      spawnSparkles(e, 6);
                    }}
                  >
                    <span className="kid-font-glyph">Aa</span>
                    <span className="kid-font-option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div
                className="kid-font-preview"
                style={{ "--kid-font-scale": fontScale }}
              >
                Bé thích đọc sách cùng Earthoria Kid Studio!
              </div>
            </div>

            <div className="kid-settings-divider" />

            <div className="kid-settings-section" style={{ marginBottom: 0 }}>
              <div className="kid-settings-label">
                <ShieldCheck size={14} /> Quản lý nâng cao
              </div>
              <Link
                to="/parent-dashboard"
                className="kid-btn kid-btn--primary kid-btn--block kid-settings-cta"
              >
                Mở trang quản lý cho phụ huynh <ChevronRight size={16} />
              </Link>
            </div>

            <div className="kid-settings-footnote">
              <Heart size={13} fill="currentColor" /> Giờ đọc, giới hạn thời
              gian và nhắc nghỉ mắt được quản lý ở đó.
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
                <Eye
                  size={16}
                  className="kid-breathe-icon"
                  aria-hidden="true"
                />
                <span className="kid-breathe-count">{restLeft}</span>
                <span className="kid-breathe-unit">giây</span>
              </span>
            </div>
            <span className="kid-breathe-phase">
              {BREATH_PHASES[breathPhase]}
            </span>
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
              <button
                type="button"
                className="kid-overlay-skip"
                onClick={() => setShowRest(false)}
              >
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
                <Wind
                  size={16}
                  className="kid-breathe-icon"
                  aria-hidden="true"
                />
                <span className="kid-breathe-count">{fmtClock(breakLeft)}</span>
                <span className="kid-breathe-unit">còn lại</span>
              </span>
            </div>
            <span className="kid-breathe-phase">
              {BREATH_PHASES[breathPhase]}
            </span>
            <h2 className="kid-overlay-title">Giờ giải lao rồi!</h2>
            <p className="kid-overlay-text">
              Bé đã đọc miệt mài rồi đó — đứng dậy vươn vai, uống nước, rồi quay
              lại đọc tiếp nhé!
            </p>
          </div>
        </div>
      )}
      </div>
    </>
  );
}