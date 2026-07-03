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
} from "lucide-react";
import "./assets/css/EiraChatbox.css";

/* ─── CONFIG ─── */
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = import.meta.env.VITE_GROQ_URL;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL;

const SYSTEM_PROMPT = `Bạn là Eira — trợ lý AI thân thiện của Earthoria.

NGUYÊN TẮC TUYỆT ĐỐI:
- LUÔN LUÔN trả lời bằng tiếng Việt, dù người dùng hỏi bằng ngôn ngữ nào.
- Không bao giờ dùng tiếng Anh trong câu trả lời.
- Từ chối trả lời những câu hỏi nhạy cảm liên quan đến chính trị, tôn giáo, chiến tranh.

THÔNG TIN EARTHORIA:
- Tên: Earthoria — thương hiệu sách giáo dục tương tác AR & AI dành cho trẻ em 5–12 tuổi tại Việt Nam
- Startup sinh viên FPT University Campus Cần Thơ (EXE101, Summer 2026), thành lập 25/05/2026
- Website: earthoria.id.vn | Fanpage: facebook.com/Earthoriavn | Email: earthoriavn@gmail.com
- Địa chỉ: 600 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ

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
- CTO: Nguyễn Phúc Khang — phát triển AI, AR, website và ứng dụng. Cha đẻ của website earthoria hiện tại.

MÃ SỐ
- Mã số Mã Số Earthoria hay còn gọi là mã ETR. Đây là mã số khi tài khoản của bạn đã xác thực thành công bởi google và được earthoria duyệt.
Trong một số trường hợp, cung cấp mã earthoria để nhân viên có thể kiểm tra thông tin của bạn. Mã earthoria sẽ bị tước vĩnh viễn nếu bạn vi phạm các nguyên tắc cộng đồng của chúng tôi hoặc tài khoản bị vô hiệu hóa hay đình chỉ.

- Mã số tài khoản: mã số tài khoản hay còn gọi là mã MTK. Đây là mã số xác thực tài khoản của bạn. Trong một số trường hợp cảm thấy nghi ngờ, chúng tôi sẽ yêu cầu xác nhận mã này để bảo vệ tài khoản của bạn. Vì vậy những mã số không được cho người khác biết.

- Khi người dùng gửi một đoạn mã: từ chối ngay lập tức với lý do bảo mật. Tuyệt đối không được phân tích làm lộ thông tin bảo mật

LỢI ÍCH:
- Cho trẻ: tăng hứng thú đọc sách, kích thích tư duy sáng tạo, ghi nhớ kiến thức tốt hơn
- Cho phụ huynh & giáo viên: công cụ học tập hiện đại, kết hợp giải trí và giáo dục có chiều sâu

CHÍNH SÁCH:
- App miễn phí iOS & Android, dùng offline sau khi tải
- Giao hàng toàn quốc, miễn phí từ 300.000đ, đổi trả 30 ngày
- Mã tháng 6: EARTH15 (giảm 15% khi mua từ 2 cuốn)
- Thanh toán: VISA, VNPAY, MoMo, COD

CÁCH TƯ VẤN:
- Giới thiệu bản thân tên là Eira.
- Phong cách Thân thiện, dùng emoji nhẹ nhàng 🌿, và chuyên nghiệp
- Hỏi tuổi bé và sở thích trước khi gợi ý sách
- Nhắc mã EARTH15 khi khách hỏi mua 2+ cuốn
- Trả lời ngắn gọn dưới 120 từ, dùng bullet points
- Nếu không biết thông tin, hướng dẫn liên hệ earthoriavn@gmail.com`;

const SUGGESTIONS = [
  { Icon: BookOpen, label: "Sách bán chạy nhất?" },
  { Icon: Baby, label: "Tư vấn bé 7 tuổi" },
  { Icon: Tag, label: "Mã giảm giá?" },
  { Icon: Smartphone, label: "App dùng thế nào?" },
  { Icon: GitCompare, label: "So sánh 2 cuốn sách" },
];

/* ─── Helpers ─── */
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

/* ─── ActionButtons ─── */
function ActionButtons({ msg, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  return (
    <div className="em-actions">
      <button
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
          className="em-action-btn"
          title="Hỏi lại"
          onClick={onRegenerate}
          aria-label="Hỏi lại"
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ─── BotMessage ─── */
function BotMessage({ msg, onRegenerate }) {
  return (
    <div className={`em bot${msg.isError ? " em-error" : ""}`}>
      <div className="em-label-row">
        <div className="em-av">
          <img src="/eira/avatar.png" alt="Eira" />
        </div>
        <span className="em-name">Eira</span>
      </div>
      <div className="em-content-row">
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

/* ─── UserMessage ─── */
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

/* ─── Main UI ─── */
function EiraUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [suggHidden, setSuggHidden] = useState(false);
  const [promoVisible, setPromoVisible] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("eira_mascot_dismissed") === "1";
    } catch {
      return false;
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);

  const msgsEndRef = useRef(null);
  const inpRef = useRef(null);
  const historyRef = useRef([]);
  const lastUserMsgRef = useRef("");
  const isOpenRef = useRef(false);

  /* ── Kéo-thả bong bóng FAB ── */
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fabRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, baseX: 0, baseY: 0, rect: null });
  const suppressClickRef = useRef(false);

  const DRAG_THRESHOLD = 4; // px, dưới ngưỡng này tính là "click" chứ không phải "kéo"

  const handleFabPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // chỉ chuột trái / chạm chính
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
      // Vừa kéo xong thì bỏ qua sự kiện click kế tiếp (không toggle mở/đóng chat)
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

  /* Show promo after 3s */
  useEffect(() => {
    if (promoDismissed || isOpen) return;
    const t = setTimeout(() => setPromoVisible(true), 3000);
    return () => clearTimeout(t);
  }, [promoDismissed, isOpen]);

  /* Hide promo when open */
  useEffect(() => {
    if (isOpen) setPromoVisible(false);
  }, [isOpen]);

  /* Theo dõi isOpen bằng ref để tránh stale closure trong sendMessage,
     đồng thời reset badge "chưa đọc" mỗi khi người dùng mở khung chat */
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  /* Scroll to bottom */
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* Focus input */
  useEffect(() => {
    if (isOpen) setTimeout(() => inpRef.current?.focus(), 380);
  }, [isOpen]);

  /* Close on outside click */
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

  /* Core send */
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text?.trim();
      if (!trimmed || isBusy) return;

      setIsBusy(true);
      setSuggHidden(true);
      setInput("");
      lastUserMsgRef.current = trimmed;

      // Reset textarea
      if (inpRef.current) inpRef.current.style.height = "auto";

      setMessages((prev) => [...prev, makeMsg("user", trimmed)]);
      historyRef.current.push({ role: "user", content: trimmed });
      setIsTyping(true);

      try {
        const res = await fetch(GROQ_URL, {
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
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || null;
        if (!reply) throw new Error("Không nhận được phản hồi từ AI");

        historyRef.current.push({ role: "assistant", content: reply });
        if (historyRef.current.length > 22)
          historyRef.current = historyRef.current.slice(-18);

        setIsTyping(false);
        setMessages((prev) => [...prev, makeMsg("bot", reply)]);
        // Nếu khung chat đang đóng (đặc biệt trên mobile), tăng số badge "chưa đọc"
        if (!isOpenRef.current) setUnreadCount((c) => c + 1);
      } catch (err) {
        setIsTyping(false);
        const isQuota =
          err.message.includes("quota") || err.message.includes("429");
        const isKey =
          err.message.includes("API key") || err.message.includes("400");
        const errMsg = isQuota
          ? "Mình đang bị quá tải một chút 😅 Thử lại sau vài giây nhé!"
          : isKey
            ? "API key Groq chưa đúng — cần dạng gsk_... Kiểm tra lại GROQ_KEY!"
            : `Có lỗi xảy ra: ${err.message}`;

        historyRef.current.pop();
        setMessages((prev) => [...prev, makeMsg("bot", errMsg, true)]);
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy],
  );

  /* Regenerate last answer */
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const dismissPromo = (e) => {
    e.stopPropagation();
    setPromoVisible(false);
    setPromoDismissed(true);
    // Xóa vĩnh viễn — không hiện lại linh vật/thông báo này nữa, kể cả sau khi tải lại trang
    try {
      localStorage.setItem("eira_mascot_dismissed", "1");
    } catch {}
  };

  // Đang ở trạng thái "chào mừng": hiện linh vật thay cho nút tròn thường
  const showMascot = promoVisible && !promoDismissed && !isOpen;

  return (
    <div
      id="eira-root"
      className={isDragging ? "dragging" : ""}
      style={{ "--drag-x": `${dragPos.x}px`, "--drag-y": `${dragPos.y}px` }}
    >
      {/* ── FAB — giữ nguyên bottom: 96px như code gốc, giờ kéo-thả được ── */}
      <button
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
            {/* Ánh sáng xanh phát sáng phía sau linh vật */}
            <div className="eira-fab-mascot-glow" aria-hidden="true" />

            {/* Các đốm sáng lập lòe bay quanh linh vật */}
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
            {/* Nút X riêng trên linh vật: đóng vĩnh viễn + trả về icon tròn hiện tại */}
            <span
              className="eira-fab-mascot-close"
              role="button"
              tabIndex={0}
              aria-label="Đóng linh vật, không hiện lại nữa"
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
            {/* Chấm "online" — ẩn khi đang mở HOẶC khi có badge chưa đọc (badge ưu tiên hiện) */}
            <div
              className={`eira-online-dot${isOpen || unreadCount > 0 ? " hidden" : ""}`}
            />

            {/* Badge số tin nhắn chưa đọc — nổi bật đặc biệt trên mobile */}
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
        {/* Header — giữ gradient tối như gốc, chỉ 1 nút X */}
        <div id="eira-hdr">
          <div className="eira-avatar">
            <div className="eira-avatar-inner">
              <img src="/eira/avatar.png" alt="Earthoria" />
            </div>
            <div className="eira-av-online" />
          </div>
          <div className="eira-hdr-info">
            <div className="eira-hdr-name">
              Eira
            </div>
            <div className="eira-hdr-sub">
              Trực tuyến · Hỗ trợ 24/7
            </div>
          </div>
          <div className="eira-hdr-actions">
            <button
              className="eira-close-btn"
              aria-label="Đóng"
              onClick={() => setIsOpen(false)}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div id="eira-msgs" aria-live="polite">
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

          {/* Typing */}
          {isTyping && (
            <div className="eira-typing">
              <div className="typing-label-row">
                <div className="em-av">
                  <img src="/eira/avatar.png" alt="Eira" />
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

        {/* Suggestions */}
        <div id="eira-sugg" className={suggHidden ? "hidden" : ""}>
          {SUGGESTIONS.map(({ Icon, label }) => (
            <button
              key={label}
              className="eira-chip"
              onClick={() => sendMessage(label)}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Input — Claude-style unified box */}
        <div id="eira-input-wrap">
          <div id="eira-input-row">
            <textarea
              id="eira-inp"
              ref={inpRef}
              placeholder="Nhắn tin với Eira..."
              rows={1}
              maxLength={500}
              value={input}
              onInput={handleInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              id="eira-send"
              aria-label="Gửi"
              disabled={isBusy || !input.trim()}
              onClick={() => sendMessage(input)}
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Footer */}
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