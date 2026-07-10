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
  WifiOff,
} from "lucide-react";
import "./assets/css/EiraChatbox.css";

/* ═══════════════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════════════ */
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = import.meta.env.VITE_GROQ_URL;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL;

const MASCOT_HIDE_DURATION = 5 * 60 * 1000; // 5 phút — ẩn tạm, không lưu vĩnh viễn
const MASCOT_FIRST_SHOW_DELAY = 3000; // 3 giây sau khi trang sẵn sàng
const MAX_INPUT_LEN = 500;
const MAX_HISTORY_TURNS = 22; // số message tối đa giữ trong bộ nhớ hội thoại
const TRIM_HISTORY_TO = 18;
const REQUEST_TIMEOUT_MS = 25000; // timeout gọi API
const SCROLL_BOTTOM_THRESHOLD = 120; // px — dưới mức này coi như đang ở cuối khung chat

/* ═══════════════════════════════════════════════════════════════
   SYSTEM PROMPT — persona Eira + quy tắc nghiệp vụ Earthoria
   + văn phong tư vấn/mô tả sản phẩm tự nhiên, chuyên sâu
   ═══════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `Bạn là Eira — trợ lý AI thân thiện đồng thời là chuyên viên tư vấn khách hàng chuyên nghiệp của thương hiệu sách giáo dục tương tác Earthoria. Bạn kết hợp giữa kiến thức chuyên môn về sản phẩm và sự tinh tế trong cách truyền đạt, giúp phụ huynh không chỉ hiểu giá trị của sản phẩm mà còn cảm nhận được mong muốn sở hữu nó cho con em mình.

NGUYÊN TẮC TUYỆT ĐỐI:
- LUÔN LUÔN trả lời bằng tiếng Việt, dù người dùng hỏi bằng ngôn ngữ nào.
- Không bao giờ dùng tiếng Anh trong câu trả lời.
- Từ chối trả lời những câu hỏi nhạy cảm liên quan đến chính trị, tôn giáo, chiến tranh.
- Khi người dùng gửi một đoạn mã số có số và ký tự: từ chối ngay lập tức với lý do bảo mật. Tuyệt đối không được phân tích hay làm lộ thông tin bảo mật.

THÔNG TIN EARTHORIA:
- Tên: Earthoria — thương hiệu sách giáo dục tương tác AR & AI dành cho trẻ em 5–12 tuổi tại Việt Nam.
- Startup sinh viên FPT University Campus Cần Thơ (EXE101, Summer 2026), thành lập 25/05/2026.
- Website: earthoria.id.vn | Fanpage: facebook.com/Earthoriavn | Email: earthoriavn@gmail.com
- Địa chỉ: 600 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ.

SẢN PHẨM:
Earthoria là bộ sách giáo dục tương tác tích hợp AI & AR, cho phép trẻ "học qua chơi" với:
- Hệ thống câu đố phát triển tư duy logic và kỹ năng quan sát
- Trợ lý AI giải thích kiến thức phù hợp lứa tuổi
- Mô hình AR 3D (động vật, thực vật, hiện tượng tự nhiên) qua QR Code
- Mini-games tích hợp nội dung học tập
- Minh họa màu sắc, thân thiện với trẻ em
Định dạng: Sách vuông 240×210mm | 10–20 trang | Tiếng Việt
Thiết bị hỗ trợ: Smartphone & tablet Android/iOS

CHỦ ĐỀ SÁCH:
- Thiên nhiên và động vật hoang dã
- Bảo vệ môi trường (rừng, nước, không khí)
- Văn hóa và cuộc sống hàng ngày
- Kiến thức khoa học thú vị

TEAM EARTHORIA:
- CEO: Nguyễn Đoàn Quốc Thái — định hướng chiến lược, quản lý dự án
- COO: Nguyễn Việt Mỹ Hương — vận hành, điều phối các bộ phận
- CMO: Lư Quốc Tài — marketing, mạng xã hội, chiến dịch quảng bá
- CDO: Lê Anh Song Dương — thiết kế hình ảnh, minh họa, nhận diện thương hiệu
- CPO: Lê Tuấn — nội dung sách, hệ thống câu đố, trải nghiệm học tập
- CTO: Nguyễn Phúc Khang — phát triển AI, AR, website và ứng dụng. Cha đẻ của website Earthoria hiện tại.

MÃ SỐ (giải thích khi người dùng hỏi):
- Mã Earthoria (mã ETR): mã số khi tài khoản đã được xác thực thành công qua Google và được Earthoria duyệt. Có thể được yêu cầu cung cấp để nhân viên kiểm tra thông tin. Mã sẽ bị tước vĩnh viễn nếu vi phạm nguyên tắc cộng đồng hoặc tài khoản bị vô hiệu hóa/đình chỉ.
- Mã số tài khoản (mã MTK): mã xác thực tài khoản. Trong trường hợp nghi ngờ bảo mật, có thể được yêu cầu xác nhận mã này. Mã này tuyệt đối không được tiết lộ cho người khác.

LỢI ÍCH:
- Cho trẻ: tăng hứng thú đọc sách, kích thích tư duy sáng tạo, ghi nhớ kiến thức tốt hơn
- Cho phụ huynh & giáo viên: công cụ học tập hiện đại, kết hợp giải trí và giáo dục có chiều sâu

CHÍNH SÁCH:
- App miễn phí iOS & Android, dùng offline sau khi tải
- Giao hàng toàn quốc, miễn phí từ 300.000đ, đổi trả 30 ngày
- Mã tháng 6: EARTH15 (giảm 15% khi mua từ 2 cuốn)
- Thanh toán: VISA, VNPAY, MoMo, COD

CÁCH TƯ VẤN VÀ VĂN PHONG:
- Giới thiệu bản thân là Eira, nhân viên tư vấn của Earthoria, ngay từ lời chào đầu tiên.
- Phong cách thân thiện, dùng emoji nhẹ nhàng 🌿, chuyên nghiệp và gần gũi.
- Hỏi tuổi bé và sở thích trước khi gợi ý sách phù hợp.
- Nhắc mã EARTH15 khi khách hỏi mua từ 2 cuốn trở lên.
- Với câu hỏi thông tin nhanh (giá, chính sách, giờ hoạt động...): trả lời ngắn gọn dưới 120 từ, có thể dùng bullet points.
- Với câu tư vấn/mô tả sâu một sản phẩm cụ thể theo hướng thuyết phục: trình bày dạng văn xuôi tự nhiên, không dùng bullet, không dùng ký hiệu định dạng như **, *, #, -, không dùng dấu gạch dài (—); thể hiện chiều sâu hiểu biết về giáo dục trẻ em, lồng ghép ngắn gọn giá trị hoặc triết lý thiết kế sản phẩm thay vì chỉ liệt kê thông tin một chiều; đa dạng hóa cách mở đầu câu/đoạn và độ dài câu để tránh nhịp điệu máy móc; dùng ngôn ngữ thận trọng ("có thể", "thường thì") khi không chắc chắn tuyệt đối; kết thúc bằng một lời cảm ơn chân thành vì khách đã quan tâm đến Earthoria.
- Luôn phản hồi như đang trực tiếp trò chuyện với khách hàng, không tạo văn bản dạng mẫu hay kịch bản cố định.
- Nếu không biết thông tin, hướng dẫn liên hệ earthoriavn@gmail.com`;

const SUGGESTIONS = [
  { Icon: BookOpen, label: "Sách bán chạy nhất?" },
  { Icon: Baby, label: "Tư vấn bé 7 tuổi" },
  { Icon: Tag, label: "Mã giảm giá?" },
  { Icon: Smartphone, label: "App dùng thế nào?" },
  { Icon: GitCompare, label: "So sánh 2 cuốn sách" },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
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

let msgIdCounter = 0;
function makeMsg(role, text, isError = false) {
  return { id: ++msgIdCounter, role, text, isError, time: nowTime() };
}

/** Gọi fetch kèm timeout, tránh treo UI vô thời hạn khi mạng chập chờn */
function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/* ═══════════════════════════════════════════════════════════════
   ActionButtons
   ═══════════════════════════════════════════════════════════════ */
function ActionButtons({ msg, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(msg.text);
      } else {
        // Fallback cho trình duyệt cũ / môi trường không có Clipboard API
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
    } catch {
      /* im lặng bỏ qua nếu clipboard bị chặn quyền */
    }
  };

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

      {msg.role === "bot" && !msg.isError && onRegenerate && (
        <button
          type="button"
          className="em-action-btn"
          title="Hỏi lại"
          onClick={onRegenerate}
          aria-label="Hỏi lại câu này"
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BotMessage / UserMessage
   ═══════════════════════════════════════════════════════════════ */
function BotMessage({ msg, onRegenerate }) {
  return (
    <div className={`em bot${msg.isError ? " em-error" : ""}`}>
      <div className="em-label-row">
        <div className="em-av">
          <img src="/eira/avatar.png" alt="" />
        </div>
        <span className="em-name">Eira</span>
      </div>
      <div className="em-content-row">
        {msg.isError && (
          <WifiOff size={13} className="em-error-icon" aria-hidden="true" />
        )}
        <div
          className="em-bubble"
          dangerouslySetInnerHTML={{ __html: fmtText(msg.text) }}
        />
        <ActionButtons msg={msg} onRegenerate={onRegenerate} />
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

/* ═══════════════════════════════════════════════════════════════
   MAIN UI
   ═══════════════════════════════════════════════════════════════ */
function EiraUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [suggHidden, setSuggHidden] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [configError, setConfigError] = useState(null);

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

  /* ── Kéo-thả bong bóng FAB ── */
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  const DRAG_THRESHOLD = 4; // px — dưới ngưỡng này tính là "click" chứ không phải "kéo"

  /* Kiểm tra cấu hình môi trường ngay khi mount, tránh lỗi im lặng khó chẩn đoán */
  useEffect(() => {
    if (!GROQ_KEY || !GROQ_URL || !GROQ_MODEL) {
      setConfigError(
        "Thiếu cấu hình kết nối AI (VITE_GROQ_KEY / VITE_GROQ_URL / VITE_GROQ_MODEL). Vui lòng kiểm tra file .env.",
      );
    }
  }, []);

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
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
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
    };
  }, []);

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
  }, [messages, isTyping]);

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

      try {
        const res = await fetchWithTimeout(
          GROQ_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...historyRef.current,
              ],
              temperature: 0.72,
              max_tokens: 380,
              top_p: 0.88,
            }),
          },
          REQUEST_TIMEOUT_MS,
        );

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim() || null;
        if (!reply) throw new Error("Không nhận được phản hồi từ AI");

        historyRef.current.push({ role: "assistant", content: reply });
        if (historyRef.current.length > MAX_HISTORY_TURNS)
          historyRef.current = historyRef.current.slice(-TRIM_HISTORY_TO);

        setIsTyping(false);
        setMessages((prev) => [...prev, makeMsg("bot", reply)]);
        if (!isOpenRef.current) setUnreadCount((c) => c + 1);
      } catch (err) {
        setIsTyping(false);

        const isAbort = err.name === "AbortError";
        const isQuota =
          err.message?.includes("quota") || err.message?.includes("429");
        const isKey =
          err.message?.includes("API key") || err.message?.includes("400");
        const isNetwork =
          err instanceof TypeError && err.message?.includes("fetch");

        const errMsg = isAbort
          ? "Kết nối đang mất nhiều thời gian hơn bình thường ⏳ Bạn thử lại giúp mình nhé!"
          : isNetwork
            ? "Không thể kết nối mạng lúc này 📶 Vui lòng kiểm tra kết nối Internet và thử lại."
            : isQuota
              ? "Mình đang bị quá tải một chút 😅 Thử lại sau vài giây nhé!"
              : isKey
                ? "Hệ thống AI đang gặp sự cố cấu hình. Vui lòng liên hệ earthoriavn@gmail.com để được hỗ trợ."
                : `Có lỗi xảy ra, bạn thử lại giúp mình nhé! (${err.message})`;

        historyRef.current.pop();
        setMessages((prev) => [...prev, makeMsg("bot", errMsg, true)]);
      } finally {
        setIsBusy(false);
        setTimeout(() => inpRef.current?.focus(), 0);
      }
    },
    [isBusy, configError],
  );

  const handleRegenerate = useCallback(() => {
    if (!lastUserMsgRef.current || isBusy) return;
    if (historyRef.current.length >= 2)
      historyRef.current = historyRef.current.slice(0, -1);
    setMessages((prev) => {
      const lastBot = [...prev].reverse().findIndex((m) => m.role === "bot");
      if (lastBot === -1) return prev;
      return prev.filter((_, i) => i !== prev.length - 1 - lastBot);
    });
    sendMessage(lastUserMsgRef.current);
  }, [isBusy, sendMessage]);

  /* Xóa toàn bộ hội thoại hiện tại, bắt đầu lại từ đầu */
  const handleClearChat = useCallback(() => {
    if (isBusy) return;
    setMessages([]);
    historyRef.current = [];
    lastUserMsgRef.current = "";
    setSuggHidden(false);
  }, [isBusy]);

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
      style={{ "--drag-x": `${dragPos.x}px`, "--drag-y": `${dragPos.y}px` }}
    >
      {/* ── FAB ── */}
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
            <span className="eira-firefly eira-firefly-2" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-3" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-4" aria-hidden="true" />
            <span className="eira-firefly eira-firefly-5" aria-hidden="true" />
            <img
              className="eira-fab-mascot-img"
              src="/eira/eira-sayhi.png"
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

      {/* ── Chat Window ── */}
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
              <img src="/eira/avatar.png" alt="" />
            </div>
            <div className="eira-av-online" />
          </div>
          <div className="eira-hdr-info">
            <div className="eira-hdr-name">Eira</div>
            <div className="eira-hdr-sub">Trực tuyến · Hỗ trợ 24/7</div>
          </div>
          <div className="eira-hdr-actions">
            {messages.length > 0 && (
              <button
                type="button"
                className="eira-close-btn"
                aria-label="Xóa hội thoại"
                title="Xóa hội thoại"
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
            Xin chào! Mình là <strong>Eira</strong> 🌿 — trợ lý ảo của
            Earthoria.
            <br />
            Mình có thể tư vấn sách AR, so sánh sản phẩm và giải đáp mọi thắc
            mắc!
          </div>

          {messages.map((msg, idx) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} msg={msg} />
            ) : (
              <BotMessage
                key={msg.id}
                msg={msg}
                onRegenerate={
                  idx === messages.length - 1 ? handleRegenerate : null
                }
              />
            ),
          )}

          {isTyping && (
            <div className="eira-typing">
              <div className="typing-label-row">
                <div className="em-av">
                  <img src="/eira/avatar.png" alt="" />
                </div>
                <span className="em-name" style={{ color: "#0d3330" }}>
                  Eira
                </span>
              </div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
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
              placeholder="Nhắn tin với Eira..."
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
          <div className="eira-foot-dot" />
          Powered by Earthoria
        </div>
      </div>
    </div>
  );
}

export default function EiraChatbox() {
  return <EiraUI />;
}