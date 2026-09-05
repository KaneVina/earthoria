import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  BookOpen,
  Baby,
  Tag,
  Smartphone,
  GitCompare,
  Copy,
  RotateCcw,
  Check,
  ChevronDown,
  Trash2,
  Lock,
  WifiOff,
  ArrowUpRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import "./assets/css/EiraChatbox.css";

const MASCOT_HIDE_DURATION = 5 * 60 * 1000; // 5 phút — ẩn tạm, không lưu vĩnh viễn
const MASCOT_FIRST_SHOW_DELAY = 3000; // 3 giây sau khi trang sẵn sàng
const MAX_INPUT_LEN = 500;
const MAX_HISTORY_TURNS = 22; // số message tối đa giữ trong bộ nhớ hội thoại
const TRIM_HISTORY_TO = 18;
const REQUEST_TIMEOUT_MS = 25000; // timeout gọi API
const SCROLL_BOTTOM_THRESHOLD = 120; // px — dưới mức này coi như đang ở cuối khung chat

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const BRAND_PALETTE_HEX = {
  "--eg": "#3d9e32",
  "--egl": "#52c244",
  "--egd": "#1a5c3d",
  "--ef": "#0a2e2b",
  "--em": "#165248",
  "--el": "#256b5e",
  "--g1": "#0a2a27",
  "--g2": "#0d3330",
  "--g3": "#1a5c52",
  "--g4": "#22685a",
  "--gh1": "#071c19",
  "--gh2": "#0d3330",
  "--gh3": "#1a5c52",
  "--gh4": "#1f5948",
};

// Khung giờ ban ngày (nền sáng) — ngoài khoảng này coi là chiều/tối (nền có sao)
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;
const DAY_HUE = 200;
const EVENING_HUE = 234;

function hexToHsl(hex) {
  const [r0, g0, b0] = hexToRgb(hex);
  const r = r0 / 255,
    g = g0 / 255,
    b = b0 / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

// Giữ nguyên S/L gốc của mỗi biến — chỉ thay Hue theo khung giờ
function rotateHue(hex, hue) {
  const [, s, l] = hexToHsl(hex);
  return hslToHex(hue, s, l);
}

function isDaytime(date) {
  const h = date.getHours();
  return h >= DAY_START_HOUR && h < DAY_END_HOUR;
}

function buildKidPalette(date) {
  const hue = isDaytime(date) ? DAY_HUE : EVENING_HUE;
  const palette = {};
  for (const [cssVar, hex] of Object.entries(BRAND_PALETTE_HEX)) {
    palette[cssVar] = rotateHue(hex, hue);
  }
  // Glow của linh vật/đốm sáng ăn theo egl vừa đổi màu
  palette["--time-glow"] = palette["--egl"];
  return palette;
}

function useKidTimePalette(active) {
  const [palette, setPalette] = useState(null);

  useEffect(() => {
    if (!active) {
      setPalette(null);
      return undefined;
    }
    setPalette(buildKidPalette(new Date()));
    const id = setInterval(() => {
      setPalette(buildKidPalette(new Date()));
    }, 60000);
    return () => clearInterval(id);
  }, [active]);

  return palette;
}

const PUBLIC_LINK_WHITELIST = [
  "/",
  "/home",
  "/shop",
  "/compare",
  "/technology",
  "/blog",
  "/about",
  "/ecosystem",
  "/contact",
  "/cart",
  "/wishlist",
  "/checkout",
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/shipping",
  "/legal/cookies",
  "/legal/returns",
  "/legal/membership",
  "/legal/copyright",
  "/legal/ai",
  "/sitemap",
  "/loyalty",
];
const PUBLIC_LINK_PREFIXES = ["/ar/", "/books/", "/game/", "/ebook/"];

function isSafePublicPath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const lower = path.toLowerCase();
  // Chặn tuyệt đối mọi thứ liên quan khu vực quản trị, bất kể AI viết ra sao
  if (lower.includes("dashboard") || lower.includes("admin")) return false;
  if (PUBLIC_LINK_WHITELIST.includes(path)) return true;
  return PUBLIC_LINK_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/*  SYSTEM PROMPT */
const SUGGESTIONS = [
  { Icon: BookOpen, label: "Gợi ý sách cho bé" },
  { Icon: Baby, label: "Bé nhà mình mấy tuổi" },
  { Icon: Tag, label: "Có ưu đãi gì không?" },
  { Icon: Smartphone, label: "Trải nghiệm AR thế nào?" },
  { Icon: GitCompare, label: "So sánh sách" },
];

function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtText(raw) {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      `<code style="background:rgba(0,0,0,0.07);padding:2px 5px;border-radius:4px;font-size:12.5px;font-family:monospace">$1</code>`,
    )
    .replace(/\n/g, "<br>");
}

function parseMessageTokens(raw) {
  const linkRegex = /\[([^\]]+)\]\((\/[^\s)]*)\)/g;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", content: raw.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "link", label: match[1], path: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) {
    tokens.push({ type: "text", content: raw.slice(lastIndex) });
  }
  return tokens;
}
function toSpeakableText(raw) {
  return raw
    .replace(/\[([^\]]+)\]\(\/[^\s)]*\)/g, "$1") // [Nhãn](/path) -> Nhãn
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, ". ")
    .trim();
}

let msgIdCounter = 0;
function makeMsg(role, text, isError = false, data = null) {
  return { id: ++msgIdCounter, role, text, isError, time: nowTime(), data };
}

async function consumeSse(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const records = buffer.split("\n\n");
    buffer = records.pop(); // phần cuối có thể chưa đủ 1 record, giữ lại

    for (const record of records) {
      let event = "message";
      let dataStr = "";
      for (const line of record.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      try {
        onEvent(event, JSON.parse(dataStr));
      } catch {
        // bỏ qua record lỗi định dạng, không làm gãy cả stream
      }
    }
  }
}

function ActionButtons({ msg, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(msg.text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = msg.text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Helper: lấy voices, nếu chưa load xong (mảng rỗng) thì chờ event voiceschanged
  const getVoicesAsync = () => {
    return new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }
      const handler = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
    });
  };

  const handleSpeak = async () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      utterRef.current = null;
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = toSpeakableText(msg.text);
    if (!cleanText) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = "vi-VN";
    utter.rate = 1;
    utter.pitch = 1;

    const voices = await getVoicesAsync();
    const viVoice =
      voices.find((v) => v.lang?.toLowerCase() === "vi-vn") ||
      voices.find((v) => v.lang?.toLowerCase().startsWith("vi"));

    if (viVoice) {
      utter.voice = viVoice;
    } else {
      console.warn(
        "Không tìm thấy giọng đọc tiếng Việt trên trình duyệt/thiết bị này.",
      );
    }

    utter.onend = () => {
      utterRef.current = null;
      setIsSpeaking(false);
    };
    utter.onerror = () => {
      utterRef.current = null;
      setIsSpeaking(false);
    };

    utterRef.current = utter;

    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        utterRef.current = null;
      }
    };
  }, [isSpeaking]);

  return (
    <div className="em-actions">
      <button
        type="button"
        className={`em-action-btn${copied ? " copied" : ""}`}
        title={copied ? "Đã sao chép!" : "Sao chép"}
        onClick={handleCopy}
        aria-label="Sao chép tin nhắn"
      >
        {copied ? (
          <Check size={12} strokeWidth={2.5} />
        ) : (
          <Copy size={12} strokeWidth={2} />
        )}
      </button>

      {msg.role === "bot" && !msg.isError && (
        <button
          type="button"
          className={`em-action-btn${isSpeaking ? " speaking" : ""}`}
          title={isSpeaking ? "Dừng đọc" : "Đọc to"}
          onClick={handleSpeak}
          aria-label={isSpeaking ? "Dừng đọc tin nhắn" : "Đọc to tin nhắn"}
        >
          {isSpeaking ? (
            <VolumeX size={12} strokeWidth={2} />
          ) : (
            <Volume2 size={12} strokeWidth={2} />
          )}
        </button>
      )}

      {msg.role === "bot" && onRegenerate && (
        <button
          type="button"
          className="em-action-btn"
          title={msg.isError ? "Gửi lại" : "Thử cách giải thích khác"}
          onClick={onRegenerate}
          aria-label={
            msg.isError ? "Gửi lại tin nhắn" : "Thử cách giải thích khác"
          }
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function MessageBody({ text, onNavigateAway }) {
  const navigate = useNavigate();
  const tokens = parseMessageTokens(text);

  const handleLinkClick = (path) => {
    navigate(path);
    onNavigateAway?.();
  };

  return (
    <div className="em-bubble">
      {tokens.map((tok, i) => {
        if (tok.type === "link") {
          if (isSafePublicPath(tok.path)) {
            return (
              <button
                type="button"
                key={i}
                className="em-link-btn"
                onClick={() => handleLinkClick(tok.path)}
              >
                {tok.label}
                <ArrowUpRight size={12} strokeWidth={2.5} />
              </button>
            );
          }
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: fmtText(tok.label) }}
            />
          );
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: fmtText(tok.content) }}
          />
        );
      })}
    </div>
  );
}

function BookCardsBody({ books, onNavigateAway }) {
  const navigate = useNavigate();
  if (!books || books.length === 0) return null;

  return (
    <div className="em-bubble em-book-cards">
      {books.map((b) => (
        <button
          type="button"
          key={b.id}
          className="em-book-card"
          onClick={() => {
            navigate(b.url);
            onNavigateAway?.();
          }}
        >
          {b.coverImage && (
            <img src={b.coverImage} alt={b.title} className="em-book-cover" />
          )}
          <div className="em-book-info">
            <span className="em-book-title">{b.title}</span>
            {b.ageRangeLabel && (
              <span className="em-book-age">{b.ageRangeLabel}</span>
            )}
            <span className="em-book-price">
              {b.salePrice ? (
                <>
                  <strong>{b.salePrice.toLocaleString("vi-VN")}đ</strong>
                  <s>{b.price?.toLocaleString("vi-VN")}đ</s>
                </>
              ) : b.price ? (
                <strong>{b.price.toLocaleString("vi-VN")}đ</strong>
              ) : (
                <span>Đang cập nhật</span>
              )}
            </span>
            {b.inStock === false && (
              <span className="em-book-oos">Tạm hết hàng</span>
            )}
          </div>
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </button>
      ))}
    </div>
  );
}

function CouponChipBody({ data }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="em-bubble em-coupon-chip">
      <Tag size={14} strokeWidth={2.5} />
      <div className="em-coupon-info">
        <span className="em-coupon-code">{data.code}</span>
        {data.discount != null ? (
          <span className="em-coupon-detail">
            Giảm {data.discount.toLocaleString("vi-VN")}đ cho giỏ hàng hiện tại
          </span>
        ) : (
          <span className="em-coupon-detail">
            Nhập mã này ở bước thanh toán
          </span>
        )}
      </div>
      <button type="button" className="em-coupon-copy" onClick={handleCopy}>
        {copied ? (
          <Check size={13} strokeWidth={2.5} />
        ) : (
          <Copy size={13} strokeWidth={2} />
        )}
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}

function EscalateBody({ data, onNavigateAway }) {
  const navigate = useNavigate();

  if (data.ticketCode) {
    return (
      <div className="em-bubble em-escalate">
        <MessageCircle size={14} strokeWidth={2.5} />
        <span>
          Mình đã tạo yêu cầu hỗ trợ <strong>{data.ticketCode}</strong>, nhân
          viên Earthoria sẽ liên hệ qua email sớm nhé.
        </span>
      </div>
    );
  }

  return (
    <div className="em-bubble em-escalate">
      <MessageCircle size={14} strokeWidth={2.5} />
      <div className="em-escalate-info">
        <span>
          Bạn cần nói chuyện trực tiếp với nhân viên Earthoria phải không ạ?
        </span>
        <button
          type="button"
          className="em-link-btn"
          onClick={() => {
            navigate("/contact", {
              state: { prefillMessage: data.prefill?.message },
            });
            onNavigateAway?.();
          }}
        >
          Mở form liên hệ
          <ArrowUpRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function BotMessage({ msg, onRegenerate, onNavigateAway, avatarSrc }) {
  return (
    <div className={`em bot${msg.isError ? " em-error" : ""}`}>
      <div className="em-label-row">
        <div className="em-av">
          <img src={avatarSrc || "/eira/avatar29.png"} alt="" />
        </div>
        <span className="em-name">Eira</span>
      </div>
      <div className="em-content-row">
        {msg.isError && (
          <WifiOff size={13} className="em-error-icon" aria-hidden="true" />
        )}
        {msg.data?.type === "books" ? (
          <BookCardsBody
            books={msg.data.books}
            onNavigateAway={onNavigateAway}
          />
        ) : msg.data?.type === "coupon" ? (
          <CouponChipBody data={msg.data} />
        ) : msg.data?.type === "escalate" ? (
          <EscalateBody data={msg.data} onNavigateAway={onNavigateAway} />
        ) : (
          <>
            <MessageBody text={msg.text} onNavigateAway={onNavigateAway} />
            <ActionButtons msg={msg} onRegenerate={onRegenerate} />
          </>
        )}
      </div>
      <div className="em-time">{msg.time}</div>
    </div>
  );
}

function UserMessage({ msg }) {
  const safe = msg.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return (
    <div className="em user">
      <div className="em-label-row">
        <span className="em-name">Bạn</span>
      </div>
      <div className="em-content-row">
        <div className="em-bubble" dangerouslySetInnerHTML={{ __html: safe }} />
        <ActionButtons msg={msg} />
      </div>
      <div className="em-time">{msg.time}</div>
    </div>
  );
}

function EiraUI() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isKid = location.pathname.startsWith("/e-kid");
  const avatarSrc = isKid ? "/eira/eira-kid-avatar.png" : "/eira/avatar29.png";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [statusLabel, setStatusLabel] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [suggHidden, setSuggHidden] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  /* Hạng model AI (núi) — Yên Tử -> Bạch Mã -> Bà Nà -> Tam Đảo -> Fansipan */
  const [modelTiers, setModelTiers] = useState([]);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem("eira_model") || null,
  );
  const [activeModel, setActiveModel] = useState(null); // hạng server thực sự đang dùng (đẩy về qua sự kiện "model")
  const [showModelMenu, setShowModelMenu] = useState(false);

  /* Mascot: chỉ ẩn TẠM THỜI 5 phút khi người dùng bấm X, không lưu localStorage */
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const msgsWrapRef = useRef(null);
  const msgsEndRef = useRef(null);
  const inpRef = useRef(null);
  const historyRef = useRef([]);
  const lastUserMsgRef = useRef("");
  const isOpenRef = useRef(false);
  const mascotTimeoutRef = useRef(null);
  const confirmClearTimeoutRef = useRef(null);

  /*  Kéo-thả bong bóng FAB  */
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const kidPalette = useKidTimePalette(isKid);
  const fabRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    rect: null,
  });
  const suppressClickRef = useRef(false);

  const DRAG_THRESHOLD = 4;

  const handleFabPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // chỉ chuột trái / chạm chính
    if (e.target.closest?.(".eira-fab-mascot-close")) return;

    const fab = fabRef.current;
    if (!fab) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      baseX: dragPos.x,
      baseY: dragPos.y,
      rect: fab.getBoundingClientRect(),
    };
    fab.setPointerCapture?.(e.pointerId);
  };

  const handleFabPointerMove = (e) => {
    const ds = dragRef.current;
    if (!ds.active) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (!ds.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD)
        return;
      ds.moved = true;
      setIsDragging(true);
    }

    const margin = 6;
    const { rect } = ds;
    const minLeft = margin;
    const maxLeft = window.innerWidth - rect.width - margin;
    const minTop = margin;
    const maxTop = window.innerHeight - rect.height - margin;

    const clampedLeft = Math.min(Math.max(rect.left + dx, minLeft), maxLeft);
    const clampedTop = Math.min(Math.max(rect.top + dy, minTop), maxTop);

    setDragPos({
      x: ds.baseX + (clampedLeft - rect.left),
      y: ds.baseY + (clampedTop - rect.top),
    });
  };

  const endFabDrag = (e) => {
    const ds = dragRef.current;
    if (!ds.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    try {
      fabRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (ds.moved) {
      suppressClickRef.current = true;
    }
  };

  const handleFabClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setIsOpen((v) => !v);
  };

  /* Show promo lần đầu, và mỗi khi promoDismissed quay lại false (hết 5 phút ẩn) */
  useEffect(() => {
    if (promoDismissed || isOpen) return;
    const t = setTimeout(() => setPromoVisible(true), MASCOT_FIRST_SHOW_DELAY);
    return () => clearTimeout(t);
  }, [promoDismissed, isOpen]);

  useEffect(() => {
    if (isOpen) setPromoVisible(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (mascotTimeoutRef.current) clearTimeout(mascotTimeoutRef.current);
      if (confirmClearTimeoutRef.current)
        clearTimeout(confirmClearTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      if (confirmClearTimeoutRef.current) {
        clearTimeout(confirmClearTimeoutRef.current);
        confirmClearTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  /* Tự động cuộn xuống cuối khi có tin nhắn mới hoặc đang gõ,
     nhưng chỉ khi người dùng đang thực sự ở gần cuối khung chat */
  useEffect(() => {
    const wrap = msgsWrapRef.current;
    if (!wrap) return;
    const distFromBottom =
      wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight;
    if (distFromBottom < SCROLL_BOTTOM_THRESHOLD * 2) {
      msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, statusLabel]);

  /* Theo dõi vị trí cuộn để hiện nút "xuống cuối" khi người dùng cuộn lên xem lại lịch sử */
  useEffect(() => {
    const wrap = msgsWrapRef.current;
    if (!wrap) return;
    const onScroll = () => {
      const distFromBottom =
        wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight;
      setShowScrollBtn(distFromBottom > SCROLL_BOTTOM_THRESHOLD);
    };
    wrap.addEventListener("scroll", onScroll, { passive: true });
    return () => wrap.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  const scrollToBottom = () => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) setTimeout(() => inpRef.current?.focus(), 380);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen) return;
      const win = document.getElementById("eira-win");
      const fab = document.getElementById("eira-fab");
      if (!win?.contains(e.target) && !fab?.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  /* Tải danh sách hạng model AI khi mở chat lần đầu (chỉ gọi 1 lần) */
  useEffect(() => {
    if (!isOpen || modelTiers.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/ai/models");
        const tiers = res?.data?.data?.tiers || [];
        if (cancelled || !tiers.length) return;
        setModelTiers(tiers);

        // Chọn model đã lưu nếu vẫn còn hợp lệ & đã mở khóa, ngược lại dùng hạng cao nhất đã mở khóa.
        const saved = tiers.find((t) => t.code === selectedModel && t.unlocked);
        const fallback = tiers.find((t) => t.isMaxUnlocked) || tiers[0];
        const toUse = saved || fallback;
        setSelectedModel(toUse.code);
        setActiveModel(toUse);
      } catch {
        // Không tải được danh sách hạng cũng không sao — server tự chọn hạng mặc định khi chat.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, modelTiers.length, selectedModel]);

  const handleSelectModel = useCallback(
    (tier) => {
      if (!tier.unlocked || isBusy) return;
      setSelectedModel(tier.code);
      setActiveModel(tier);
      localStorage.setItem("eira_model", tier.code);
      setShowModelMenu(false);
    },
    [isBusy],
  );

  /* Đóng menu chọn hạng model khi bấm ra ngoài */
  useEffect(() => {
    if (!showModelMenu) return;
    const closeMenu = (e) => {
      if (!e.target.closest(".eira-model-picker")) setShowModelMenu(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [showModelMenu]);

  /* Core send */
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim().slice(0, MAX_INPUT_LEN);
      if (!trimmed || isBusy) return;

      if (configError) {
        setMessages((prev) => [...prev, makeMsg("bot", configError, true)]);
        return;
      }

      setIsBusy(true);
      setSuggHidden(true);
      setInput("");
      lastUserMsgRef.current = trimmed;

      if (inpRef.current) inpRef.current.style.height = "auto";

      setMessages((prev) => [...prev, makeMsg("user", trimmed)]);
      historyRef.current.push({ role: "user", content: trimmed });
      setIsTyping(true);
      setStatusLabel(null);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let botMsgId = null;
      let streamedText = "";
      const appendToken = (chunk) => {
        streamedText += chunk;
        setIsTyping(false);
        setStatusLabel(null);
        setMessages((prev) => {
          if (botMsgId == null) {
            const msg = makeMsg("bot", chunk);
            botMsgId = msg.id;
            return [...prev, msg];
          }
          return prev.map((m) =>
            m.id === botMsgId ? { ...m, text: m.text + chunk } : m,
          );
        });
      };

      try {
        const token = useAuthStore.getState().accessToken;
        const baseURL = api.defaults.baseURL || "";

        const res = await fetch(`${baseURL}/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            message: trimmed,
            history: historyRef.current.slice(-TRIM_HISTORY_TO),
            model: selectedModel || undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({}));
          const err = new Error(errBody?.message || `HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }

        let finalReply = null;
        let sawError = null;

        await consumeSse(res, (event, data) => {
          if (event === "token") {
            appendToken(data.text);
          } else if (event === "model") {
            // Server luôn tự xác thực quyền, đây là hạng THẬT SỰ được dùng cho lượt này
            // (có thể bị hạ xuống nếu client gửi hạng chưa mở khóa) — đồng bộ lại UI.
            setSelectedModel(data.code);
            setActiveModel((prev) =>
              prev?.code === data.code
                ? prev
                : { ...(prev || {}), code: data.code, name: data.name },
            );
          } else if (event === "status") {
            if (!streamedText) setStatusLabel(data.label);
          } else if (event === "books") {
            setStatusLabel(null);
            setMessages((prev) => [
              ...prev,
              makeMsg("bot", "", false, { type: "books", books: data.books }),
            ]);
          } else if (event === "coupon") {
            setStatusLabel(null);
            setMessages((prev) => [
              ...prev,
              makeMsg("bot", "", false, { type: "coupon", ...data }),
            ]);
          } else if (event === "escalate") {
            setStatusLabel(null);
            setMessages((prev) => [
              ...prev,
              makeMsg("bot", "", false, { type: "escalate", ...data }),
            ]);
          } else if (event === "done") {
            finalReply = data.reply;
          } else if (event === "error") {
            sawError = data.message;
          }
        });

        clearTimeout(timer);
        setIsTyping(false);
        setStatusLabel(null);

        if (sawError && !streamedText) {
          const aiErr = new Error(sawError);
          aiErr.code = "AI_SERVER_ERROR";
          throw aiErr;
        }

        const reply = (finalReply ?? streamedText).trim();
        if (reply) {
          historyRef.current.push({ role: "assistant", content: reply });
          if (historyRef.current.length > MAX_HISTORY_TURNS)
            historyRef.current = historyRef.current.slice(-TRIM_HISTORY_TO);
        }

        if (!isOpenRef.current) setUnreadCount((c) => c + 1);
      } catch (err) {
        clearTimeout(timer);
        setIsTyping(false);
        setStatusLabel(null);

        const isAbort = err.name === "AbortError";
        const isAiServerError = err.code === "AI_SERVER_ERROR";
        const isRateLimited = err.status === 429;
        const isServerConfig = err.status === 502 || err.status === 503;
        const isNetwork = !err.status && !isAbort && !isAiServerError;

        const errMsg = isAbort
          ? "Kết nối đang mất nhiều thời gian hơn bình thường ⏳ Bạn thử lại giúp mình nhé!"
          : isAiServerError
            ? err.message
            : isNetwork
              ? "Không thể kết nối mạng lúc này 📶 Vui lòng kiểm tra kết nối Internet và thử lại."
              : isRateLimited
                ? "Mình đang nhận hơi nhiều tin nhắn một lúc 😅 Bạn chờ vài giây rồi thử lại nhé!"
                : isServerConfig
                  ? "Hệ thống AI đang gặp sự cố. Vui lòng liên hệ earthoriavn@gmail.com để được hỗ trợ."
                  : `Có lỗi xảy ra, bạn thử lại giúp mình nhé! (${err.message})`;

        historyRef.current.pop();
        setMessages((prev) => [...prev, makeMsg("bot", errMsg, true)]);
      } finally {
        setIsBusy(false);
        setTimeout(() => inpRef.current?.focus(), 0);
      }
    },
    [isBusy, configError, selectedModel],
  );

  const handleRegenerate = useCallback(
    (isErrorRetry = false) => {
      if (!lastUserMsgRef.current || isBusy) return;
      if (!isErrorRetry && historyRef.current.length >= 2) {
        historyRef.current = historyRef.current.slice(0, -1);
      }
      setMessages((prev) => {
        const lastBot = [...prev].reverse().findIndex((m) => m.role === "bot");
        if (lastBot === -1) return prev;
        return prev.filter((_, i) => i !== prev.length - 1 - lastBot);
      });
      sendMessage(lastUserMsgRef.current);
    },
    [isBusy, sendMessage],
  );

  useEffect(() => {
    const handleAskEvent = (e) => {
      const text = e?.detail?.text;
      if (!text || typeof text !== "string") return;
      setIsOpen(true);
      setSuggHidden(true);
      setTimeout(() => sendMessage(text), 380);
    };
    window.addEventListener("eira:ask", handleAskEvent);
    return () => window.removeEventListener("eira:ask", handleAskEvent);
  }, [sendMessage]);

  const handleClearChat = useCallback(() => {
    if (isBusy) return;

    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmClearTimeoutRef.current)
        clearTimeout(confirmClearTimeoutRef.current);
      confirmClearTimeoutRef.current = setTimeout(() => {
        setConfirmClear(false);
        confirmClearTimeoutRef.current = null;
      }, 2500);
      return;
    }

    if (confirmClearTimeoutRef.current) {
      clearTimeout(confirmClearTimeoutRef.current);
      confirmClearTimeoutRef.current = null;
    }
    setConfirmClear(false);
    setMessages([]);
    historyRef.current = [];
    lastUserMsgRef.current = "";
    setSuggHidden(false);
  }, [isBusy, confirmClear]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value.slice(0, MAX_INPUT_LEN));
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const dismissPromo = (e) => {
    e.stopPropagation();
    e.preventDefault();
    suppressClickRef.current = true;

    setPromoVisible(false);
    setPromoDismissed(true);

    if (mascotTimeoutRef.current) clearTimeout(mascotTimeoutRef.current);
    mascotTimeoutRef.current = setTimeout(() => {
      setPromoDismissed(false);
      mascotTimeoutRef.current = null;
    }, MASCOT_HIDE_DURATION);
  };

  const showMascot = promoVisible && !promoDismissed && !isOpen;
  const nearLimit = input.length >= MAX_INPUT_LEN - 40;

  return (
    <div
      id="eira-root"
      className={isDragging ? "dragging" : ""}
      style={{
        "--drag-x": `${dragPos.x}px`,
        "--drag-y": `${dragPos.y}px`,
        ...(kidPalette || {}),
      }}
    >
      {/*  FAB  */}
      <button
        type="button"
        id="eira-fab"
        ref={fabRef}
        className={`${isOpen ? "fab-open" : ""} ${isDragging ? "dragging" : ""} ${unreadCount > 0 && !isOpen ? "has-badge" : ""} ${showMascot ? "mascot" : ""}`.trim()}
        aria-label={
          showMascot
            ? "Eira đang vẫy chào — bấm để mở chat"
            : unreadCount > 0 && !isOpen
              ? `Chat với Eira, ${unreadCount} tin nhắn mới chưa đọc`
              : "Chat với Eira (giữ và kéo để di chuyển)"
        }
        onClick={handleFabClick}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={endFabDrag}
        onPointerCancel={endFabDrag}
      >
        {showMascot ? (
          <>
            <div className="eira-fab-mascot-glow" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-1" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-3" aria-hidden="true" />
            <img
              className="eira-fab-mascot-img"
              src={
                isDashboard
                  ? "/eira/eira-staff.png"
                  : isKid
                    ? "/eira/eira-kid.png"
                    : // : "/eira/eira-sayhi.png"
                      "/eira/eira29.png"
              }
              alt="Eira vẫy chào"
              draggable="false"
            />
            <span
              className="eira-fab-mascot-close"
              role="button"
              tabIndex={0}
              aria-label="Ẩn linh vật, tự hiện lại sau 5 phút"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={dismissPromo}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") dismissPromo(e);
              }}
            >
              <X size={11} />
            </span>
          </>
        ) : (
          <>
            <div
              className={`eira-online-dot${isOpen || unreadCount > 0 ? " hidden" : ""}`}
            />
            {unreadCount > 0 && !isOpen && (
              <span key={unreadCount} className="eira-badge" aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="eira-fab-icon eira-ico-open">
              <MessageCircle size={22} />
            </span>
            <span className="eira-fab-icon eira-ico-close">
              <X size={20} />
            </span>
          </>
        )}
      </button>

      {/*  Chat Window  */}
      <div
        id="eira-win"
        className={isOpen ? "win-open" : ""}
        role="dialog"
        aria-modal="true"
        aria-label="Eira - Trợ lý Earthoria"
      >
        <div id="eira-hdr">
          <div className="eira-avatar">
            <div className="eira-avatar-inner">
              <img src={avatarSrc} alt="" />
            </div>
            <div className="eira-av-online" />
          </div>
          <div className="eira-hdr-info">
            <div className="eira-hdr-name">Eira</div>
            {modelTiers.length > 0 ? (
              <div className="eira-model-picker">
                <button
                  type="button"
                  className="eira-model-badge"
                  onClick={() => setShowModelMenu((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showModelMenu}
                >
                  <span>{activeModel?.emoji || "⛰️"}</span>
                  <span>{activeModel?.name || "Yên Tử"}</span>
                  <ChevronDown size={12} />
                </button>
                {showModelMenu && (
                  <div className="eira-model-menu" role="listbox">
                    {modelTiers.map((t) => (
                      <button
                        key={t.code}
                        type="button"
                        role="option"
                        aria-selected={t.code === selectedModel}
                        disabled={!t.unlocked}
                        className={`eira-model-opt${t.code === selectedModel ? " active" : ""}${!t.unlocked ? " locked" : ""}`}
                        onClick={() => handleSelectModel(t)}
                      >
                        <span className="eira-model-opt-emoji">{t.emoji}</span>
                        <span className="eira-model-opt-text">
                          <span className="eira-model-opt-name">{t.name}</span>
                          <span className="eira-model-opt-tag">
                            {t.tagline}
                          </span>
                        </span>
                        {!t.unlocked && <Lock size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="eira-hdr-sub">Người bạn khám phá</div>
            )}
          </div>
          <div className="eira-hdr-actions">
            {messages.length > 0 && (
              <button
                type="button"
                className={`eira-close-btn${confirmClear ? " eira-confirm-danger" : ""}`}
                aria-label={
                  confirmClear
                    ? "Bấm lần nữa để xác nhận xóa hội thoại"
                    : "Xóa hội thoại"
                }
                title={
                  confirmClear ? "Bấm lần nữa để xác nhận" : "Xóa hội thoại"
                }
                onClick={handleClearChat}
                disabled={isBusy}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              className="eira-close-btn"
              aria-label="Đóng khung chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div id="eira-msgs" ref={msgsWrapRef} aria-live="polite">
          <div className="eira-welcome">
            <div className="eira-welcome-avatar">
              <img src={avatarSrc} alt="" />
            </div>
            <div className="eira-welcome-title">
              Chào bạn, mình là <strong>Eira</strong> 🌿
            </div>
            <p className="eira-welcome-desc">
              Mình là chatbox ảo của Earthoria, mình có thể tư vấn và trả lời
              các câu hỏi của bạn.
            </p>
            <div className="eira-welcome-actions">
              <button
                type="button"
                className="eira-welcome-card"
                onClick={() => sendMessage("Gợi ý sách phù hợp cho bé")}
              >
                <BookOpen size={16} strokeWidth={2} />
                <span>Tìm sách phù hợp</span>
              </button>
              <button
                type="button"
                className="eira-welcome-card"
                onClick={() =>
                  sendMessage("Công nghệ AR của Earthoria hoạt động thế nào?")
                }
              >
                <Smartphone size={16} strokeWidth={2} />
                <span>Khám phá AR</span>
              </button>
            </div>
          </div>

          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} msg={msg} />
            ) : (
              <BotMessage
                key={msg.id}
                msg={msg}
                avatarSrc={avatarSrc}
                onRegenerate={
                  idx === messages.length - 1
                    ? () => handleRegenerate(msg.isError)
                    : null
                }
                onNavigateAway={() => setIsOpen(false)}
              />
            ),
          )}

          {(isTyping || statusLabel) && (
            <div className="eira-typing">
              <div className="typing-label-row">
                <div className="em-av">
                  <img src={avatarSrc} alt="" />
                </div>
                <span className="em-name" style={{ color: "var(--g2)" }}>
                  Eira
                </span>
              </div>
              {statusLabel ? (
                <div className="typing-bubble em-status-label">
                  {statusLabel}
                </div>
              ) : (
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              )}
            </div>
          )}

          <div ref={msgsEndRef} />
        </div>

        {/* Nút cuộn xuống cuối — hiện khi người dùng cuộn lên xem lại lịch sử */}
        {showScrollBtn && (
          <button
            type="button"
            id="eira-scroll-btn"
            aria-label="Cuộn xuống tin nhắn mới nhất"
            onClick={scrollToBottom}
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
        )}

        <div id="eira-sugg" className={suggHidden ? "hidden" : ""}>
          {SUGGESTIONS.map(({ Icon, label }) => (
            <button
              type="button"
              key={label}
              className="eira-chip"
              onClick={() => sendMessage(label)}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        <div id="eira-input-wrap">
          <div id="eira-input-row">
            <textarea
              id="eira-inp"
              ref={inpRef}
              placeholder="Hỏi Eira điều gì đó..."
              rows={1}
              maxLength={MAX_INPUT_LEN}
              value={input}
              onInput={handleInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Nhập tin nhắn"
            />
            <button
              type="button"
              id="eira-send"
              aria-label="Gửi tin nhắn"
              disabled={isBusy || !input.trim()}
              onClick={() => sendMessage(input)}
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
          {nearLimit && (
            <div id="eira-char-count" role="status">
              {input.length}/{MAX_INPUT_LEN}
            </div>
          )}
        </div>

        <div id="eira-foot">
          Powered by
          <span className="eira-foot-logo" role="img" aria-label="Earthoria" />
        </div>
      </div>
    </div>
  );
}

export default function EiraChatbox() {
  return <EiraUI />;
}
