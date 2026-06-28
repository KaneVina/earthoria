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
- CTO: Nguyễn Phúc Khang — phát triển AI, AR, website và ứng dụng

LỢI ÍCH:
- Cho trẻ: tăng hứng thú đọc sách, kích thích tư duy sáng tạo, ghi nhớ kiến thức tốt hơn
- Cho phụ huynh & giáo viên: công cụ học tập hiện đại, kết hợp giải trí và giáo dục có chiều sâu

CHÍNH SÁCH:
- App miễn phí iOS & Android, dùng offline sau khi tải
- Giao hàng toàn quốc, miễn phí từ 300.000đ, đổi trả 30 ngày
- Mã tháng 6: EARTH15 (giảm 15% khi mua từ 2 cuốn)
- Thanh toán: VISA, VNPAY, MoMo, COD

CÁCH TƯ VẤN:
- Thân thiện, dùng emoji nhẹ nhàng 🌿
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
          <img src="/logo-nho2.png" alt="Eira" />
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
  const [promoDismissed, setPromoDismissed] = useState(false);

  const msgsEndRef = useRef(null);
  const inpRef = useRef(null);
  const historyRef = useRef([]);
  const lastUserMsgRef = useRef("");

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
  };

  return (
    <div id="eira-root">
      {/* ── Promo bubble ── */}
      <div
        id="eira-promo"
        className={
          promoVisible && !promoDismissed && !isOpen ? "show" : "hidden"
        }
      >
        <div
          className="eira-promo-bubble"
          onClick={() => {
            setIsOpen(true);
            setPromoVisible(false);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsOpen(true)}
          aria-label="Mở chat với Eira"
        >
          <span className="eira-promo-text">
            Ban đang cần <strong>tư vấn?</strong> Hỏi ngay Eira!
          </span>
          <button
            className="eira-promo-close"
            onClick={dismissPromo}
            aria-label="Đóng gợi ý"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* ── FAB — giữ nguyên bottom: 96px như code gốc ── */}
      <button
        id="eira-fab"
        className={isOpen ? "fab-open" : ""}
        aria-label="Chat với Eira"
        onClick={() => setIsOpen((v) => !v)}
      >
        <div className={`eira-online-dot${isOpen ? " hidden" : ""}`} />
        <span className="eira-fab-icon eira-ico-open">
          <MessageCircle size={22} />
        </span>
        <span className="eira-fab-icon eira-ico-close">
          <X size={20} />
        </span>
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
            <img src="/logo-nho2.png" alt="Earthoria" />
            <div className="eira-av-online" />
          </div>
          <div className="eira-hdr-info">
            <div className="eira-hdr-name">
              Eira
            </div>
            <div className="eira-hdr-sub">
              <span className="eira-hdr-status-dot" />
              Trực tuyến · Phản hồi ngay
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
                  <img src="/logo-nho2.png" alt="Eira" />
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
