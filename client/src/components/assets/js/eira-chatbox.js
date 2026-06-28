(function () {
  /* ═══════════════════════════════════════════
     EIRA — Earthoria AI Assistant
     Powered by Google Gemini 2.0 Flash (Free)
     Floating chatbox — inject vào mọi trang
  ═══════════════════════════════════════════ */

  const GEMINI_KEY = "AQ.Ab8RN6KtovTFBalYXB1OIpU2k_25G34buaAWjm16-h0cJ6pw";
  const GEMINI_MODEL = "gemini-2.0-flash";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

  /* ── Knowledge base về sách Earthoria ── */
  const SYSTEM_PROMPT = `Bạn là Eira — trợ lý AI thân thiện của Earthoria, thương hiệu sách giáo dục tương tác AR & AI dành cho trẻ em 5–12 tuổi tại Việt Nam.

THÔNG TIN VỀ EARTHORIA:
- Earthoria là dự án startup của sinh viên FPT University Campus Cần Thơ (EXE101, Summer 2026)
- Website: earthoria.id.vn | Fanpage: facebook.com/Earthoriavn | Email: earthoriavn@gmail.com
- Địa chỉ: 600 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ

DANH SÁCH SÁCH AR HIỆN CÓ:
1. "Bí Mật Rừng Mưa" — 390.000đ (gốc 450.000đ, giảm 13%)
   • 120+ mô hình AR 3D động thực vật nhiệt đới
   • AI Tutor song ngữ VI/EN, Âm thanh 3D vòm
   • Độ tuổi: 6–12 tuổi | 128 trang | 21×28cm
   • Đánh giá: 4.9⭐ (247 reviews) | Bán chạy nhất
   • Tags: AR, AI Tutor, 3D Audio

2. "Vương Quốc Đại Dương" — 480.000đ
   • 80+ loài sinh vật biển, rạn san hô, đáy đại dương
   • AR tương tác + AI giải thích
   • Độ tuổi: 6–12 tuổi | Danh mục: Khoa học

3. "Đỉnh Núi Mù Sương" — 420.000đ
   • Hành trình chinh phục đỉnh cao, 3D tương tác
   • Độ tuổi: 8–12 tuổi | Bán chạy | Tags: AR, 3D Audio

4. "Đại Dương Huyền Bí" — 350.000đ (gốc 380.000đ, giảm 8%)
   • 80 loài sinh vật biển sâu | Tags: AR, AI Tutor
   • Đánh giá: 5⭐ (47 reviews) | Mới nhất

5. "Hành Trình Vũ Trụ" — 420.000đ
   • 8 hành tinh, dải Ngân Hà, âm thanh vòm 360°
   • Đánh giá: 5⭐ (62 reviews) | Tags: AR, 3D Audio, AI Tutor

6. "Côn Trùng Kỳ Diệu" — 290.000đ
   • 50 loài côn trùng phóng to siêu thực
   • Đánh giá: 4⭐ (31 reviews) | Tags: AR

7. "Cơ Thể Con Người" — 390.000đ (gốc 450.000đ, giảm 13%)
   • Mô hình AR bóc tách cơ thể người độ nét cao
   • Đánh giá: 5⭐ (88 reviews) | Tags: AR, AI Tutor, 3D Audio

8. "Khủng Long Trỗi Dậy" — 460.000đ
   • 30 loài khủng long tỉ lệ thực, âm thanh gầm rú
   • Đánh giá: 5⭐ (114 reviews) | Phiên bản giới hạn

9. "Thực Vật Kỳ Bí" — 310.000đ
   • 60 loài thực vật, quá trình thụ phấn AR real-time
   • Đánh giá: 4⭐ (28 reviews) | Tags: AR, AI Tutor

CÔNG NGHỆ:
- AR (Augmented Reality): Quét QR trên sách → mô hình 3D hiện trong không gian thực
- AI Tutor: Đóng vai nhà tự nhiên học, trả lời câu hỏi bằng VI/EN phù hợp lứa tuổi
- App miễn phí: iOS 14+ và Android 10+ (RAM tối thiểu 3GB, dung lượng ~2.4GB)
- Offline 100% sau khi tải, chỉ AI Tutor cần internet
- Cập nhật nội dung miễn phí 24 tháng

CHÍNH SÁCH:
- Giao hàng toàn quốc, miễn phí từ 300.000đ
- Đổi trả 30 ngày, bảo hành 12 tháng
- Thanh toán: VISA, Mastercard, VNPAY, MoMo, COD
- Mã giảm giá tháng 6: EARTH15 (giảm 15% cho đơn từ 2 cuốn)

CÁCH TƯ VẤN:
- Thân thiện, ngắn gọn, dùng emoji phù hợp 🌿
- Khi hỏi mua sách: hỏi độ tuổi con, sở thích (thiên nhiên/khoa học/vũ trụ) rồi gợi ý
- Khi so sánh: nêu điểm khác biệt rõ ràng (giá, nội dung, độ tuổi, đánh giá)
- Luôn đề cập mã EARTH15 khi khách mua từ 2 sách
- Nếu không biết → hướng dẫn liên hệ earthoriavn@gmail.com
- Trả lời bằng tiếng Việt trừ khi khách dùng tiếng Anh
- Giữ câu trả lời dưới 150 từ, ưu tiên bullet points`;

  /* ── Lịch sử chat (giữ context) ── */
  let chatHistory = [];
  let isOpen = false;
  let isTyping = false;

  /* ── Inject CSS ── */
  const style = document.createElement("style");
  style.textContent = `
    #eira-root * { box-sizing: border-box; margin: 0; padding: 0; }

    /* Toggle button */
    #eira-toggle {
      position: fixed;
      bottom: 96px;
      right: 36px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #0d3330 0%, #1a5c52 60%, #2d7a6e 100%);
      border: 1.5px solid rgba(74,158,63,0.5);
      border-radius: 50%;
      cursor: pointer;
      z-index: 9990;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(13,51,48,0.35), 0 0 0 0 rgba(74,158,63,0.4);
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
      animation: eira-pulse 3s ease-in-out infinite;
    }
    #eira-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 40px rgba(13,51,48,0.45), 0 0 0 8px rgba(74,158,63,0.12);
    }
    #eira-toggle svg { transition: transform 0.3s ease, opacity 0.2s; }
    #eira-toggle.open svg.icon-chat { opacity: 0; transform: scale(0.6) rotate(-30deg); position: absolute; }
    #eira-toggle.open svg.icon-close { opacity: 1; transform: scale(1) rotate(0deg); }
    #eira-toggle svg.icon-close { opacity: 0; transform: scale(0.6) rotate(30deg); position: absolute; }

    /* Notification dot */
    #eira-dot {
      position: absolute;
      top: 4px; right: 4px;
      width: 10px; height: 10px;
      background: #4a9e3f;
      border-radius: 50%;
      border: 2px solid #faf8f3;
      animation: eira-blink 2s ease-in-out infinite;
    }

    @keyframes eira-pulse {
      0%, 100% { box-shadow: 0 8px 32px rgba(13,51,48,0.35), 0 0 0 0 rgba(74,158,63,0.4); }
      50% { box-shadow: 0 8px 32px rgba(13,51,48,0.35), 0 0 0 6px rgba(74,158,63,0.1); }
    }
    @keyframes eira-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    /* Chat window */
    #eira-window {
      position: fixed;
      bottom: 164px;
      right: 36px;
      width: 360px;
      height: 520px;
      background: #faf8f3;
      border: 0.5px solid rgba(74,158,63,0.35);
      border-radius: 2px;
      box-shadow: 0 32px 80px rgba(13,51,48,0.22), 0 8px 24px rgba(13,51,48,0.12);
      z-index: 9989;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    #eira-window.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    #eira-header {
      background: linear-gradient(135deg, #0d3330 0%, #1a5c52 60%, #2d7a6e 100%);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      border-bottom: 0.5px solid rgba(74,158,63,0.3);
    }
    #eira-avatar {
      width: 38px; height: 38px;
      border: 1px solid rgba(74,158,63,0.5);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(74,158,63,0.15);
      font-family: 'Playfair Display', serif;
      font-size: 16px; color: #4a9e3f; font-weight: 400;
      flex-shrink: 0;
      position: relative;
    }
    #eira-avatar::after {
      content: '';
      position: absolute; bottom: 1px; right: 1px;
      width: 8px; height: 8px;
      background: #4a9e3f; border-radius: 50%;
      border: 1.5px solid #0d3330;
    }
    #eira-header-info {}
    #eira-name {
      font-family: 'Playfair Display', serif;
      font-size: 15px; font-weight: 400;
      color: #faf8f3; letter-spacing: 0.04em;
    }
    #eira-status {
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 10px; color: rgba(250,248,243,0.5);
      letter-spacing: 0.1em; text-transform: uppercase;
      margin-top: 1px;
    }
    #eira-header-close {
      margin-left: auto;
      background: transparent; border: none;
      color: rgba(250,248,243,0.4); cursor: pointer;
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.2s;
      border-radius: 50%;
    }
    #eira-header-close:hover { color: rgba(250,248,243,0.9); background: rgba(255,255,255,0.08); }

    /* Messages area */
    #eira-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #eira-messages::-webkit-scrollbar { width: 2px; }
    #eira-messages::-webkit-scrollbar-thumb { background: rgba(74,158,63,0.3); border-radius: 1px; }

    /* Message bubbles */
    .eira-msg {
      display: flex;
      gap: 8px;
      animation: eira-msg-in 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes eira-msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .eira-msg.user { flex-direction: row-reverse; }
    .eira-msg-bubble {
      max-width: 78%;
      padding: 10px 13px;
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 13px; line-height: 1.65;
      font-weight: 300;
    }
    .eira-msg.bot .eira-msg-bubble {
      background: #fff;
      color: #2c3830;
      border: 0.5px solid rgba(13,43,30,0.1);
      border-radius: 0 8px 8px 8px;
    }
    .eira-msg.user .eira-msg-bubble {
      background: linear-gradient(135deg, #0d3330, #1a5c52);
      color: #faf8f3;
      border-radius: 8px 0 8px 8px;
    }
    .eira-msg-avatar {
      width: 26px; height: 26px; flex-shrink: 0;
      border-radius: 50%;
      background: rgba(74,158,63,0.15);
      border: 0.5px solid rgba(74,158,63,0.3);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Playfair Display', serif;
      font-size: 11px; color: #4a9e3f;
      margin-top: 2px;
    }

    /* Typing indicator */
    #eira-typing {
      display: none;
      gap: 8px;
      animation: eira-msg-in 0.3s ease;
    }
    #eira-typing.show { display: flex; }
    .eira-typing-bubble {
      background: #fff;
      border: 0.5px solid rgba(13,43,30,0.1);
      border-radius: 0 8px 8px 8px;
      padding: 12px 16px;
      display: flex; gap: 4px; align-items: center;
    }
    .eira-dot-anim {
      width: 6px; height: 6px;
      background: #4a9e3f; border-radius: 50%;
      animation: eira-dots 1.2s ease-in-out infinite;
    }
    .eira-dot-anim:nth-child(2) { animation-delay: 0.2s; }
    .eira-dot-anim:nth-child(3) { animation-delay: 0.4s; }
    @keyframes eira-dots {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    /* Quick suggestions */
    #eira-suggestions {
      padding: 8px 14px 0;
      display: flex; flex-wrap: wrap; gap: 6px;
      flex-shrink: 0;
    }
    .eira-chip {
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 10px; letter-spacing: 0.1em;
      color: #0d3330;
      background: transparent;
      border: 0.5px solid rgba(74,158,63,0.4);
      padding: 5px 10px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .eira-chip:hover { background: rgba(74,158,63,0.1); border-color: #4a9e3f; }

    /* Input area */
    #eira-input-wrap {
      padding: 10px 14px 14px;
      border-top: 0.5px solid rgba(13,43,30,0.08);
      display: flex; gap: 8px; align-items: flex-end;
      flex-shrink: 0;
      background: #faf8f3;
    }
    #eira-input {
      flex: 1;
      background: #fff;
      border: 0.5px solid rgba(13,43,30,0.15);
      padding: 10px 13px;
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 13px; color: #2c3830;
      font-weight: 300; outline: none;
      resize: none; min-height: 40px; max-height: 100px;
      line-height: 1.5; border-radius: 2px;
      transition: border-color 0.2s;
    }
    #eira-input:focus { border-color: rgba(74,158,63,0.5); }
    #eira-input::placeholder { color: #8fb09a; }
    #eira-send {
      width: 40px; height: 40px;
      background: #0d3330; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: all 0.25s; color: #faf8f3;
      border-radius: 2px;
    }
    #eira-send:hover { background: #1a5c52; }
    #eira-send:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Branding footer */
    #eira-footer {
      padding: 6px 14px 8px;
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 9px; letter-spacing: 0.14em;
      color: rgba(13,43,30,0.25); text-align: center;
      text-transform: uppercase;
      border-top: 0.5px solid rgba(13,43,30,0.06);
      flex-shrink: 0;
    }

    /* Dark mode support */
    body.dark-mode #eira-window { background: #121a16; border-color: rgba(74,158,63,0.25); }
    body.dark-mode .eira-msg.bot .eira-msg-bubble { background: #1c2822; color: #c8d4cc; border-color: rgba(255,255,255,0.07); }
    body.dark-mode .eira-typing-bubble { background: #1c2822; border-color: rgba(255,255,255,0.07); }
    body.dark-mode #eira-input-wrap { background: #121a16; border-color: rgba(255,255,255,0.07); }
    body.dark-mode #eira-input { background: #1c2822; border-color: rgba(255,255,255,0.1); color: #c8d4cc; }
    body.dark-mode .eira-chip { color: #c8d4cc; border-color: rgba(74,158,63,0.3); }
    body.dark-mode #eira-footer { color: rgba(200,212,204,0.2); border-color: rgba(255,255,255,0.05); }

    @media (max-width: 480px) {
      #eira-window { width: calc(100vw - 24px); right: 12px; bottom: 80px; height: 70vh; }
      #eira-toggle { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ── */
  const root = document.createElement("div");
  root.id = "eira-root";
  root.innerHTML = `
    <!-- Toggle button -->
    <button id="eira-toggle" aria-label="Chat với Eira">
      <div id="eira-dot"></div>
      <svg class="icon-chat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#faf8f3" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg class="icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#faf8f3" stroke-width="1.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Chat window -->
    <div id="eira-window" role="dialog" aria-label="Eira - Trợ lý Earthoria">
      <!-- Header -->
      <div id="eira-header">
        <div id="eira-avatar">E</div>
        <div id="eira-header-info">
          <div id="eira-name">Eira</div>
          <div id="eira-status">Trợ lý Earthoria · Đang hoạt động</div>
        </div>
        <button id="eira-header-close" aria-label="Đóng chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div id="eira-messages">
        <div class="eira-msg bot">
          <div class="eira-msg-avatar">E</div>
          <div class="eira-msg-bubble">
            Xin chào! Mình là <strong>Eira</strong> 🌿<br><br>
            Mình có thể giúp bạn khám phá sách AR của Earthoria, so sánh các đầu sách, tư vấn chọn sách phù hợp cho bé, hoặc giải đáp mọi thắc mắc.<br><br>
            Bạn cần mình giúp gì hôm nay?
          </div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div id="eira-typing" class="eira-msg bot">
        <div class="eira-msg-avatar">E</div>
        <div class="eira-typing-bubble">
          <div class="eira-dot-anim"></div>
          <div class="eira-dot-anim"></div>
          <div class="eira-dot-anim"></div>
        </div>
      </div>

      <!-- Quick suggestions -->
      <div id="eira-suggestions">
        <button class="eira-chip">📚 Sách nào bán chạy nhất?</button>
        <button class="eira-chip">💰 So sánh giá</button>
        <button class="eira-chip">🎁 Tư vấn cho bé 7 tuổi</button>
        <button class="eira-chip">📱 App hoạt động thế nào?</button>
      </div>

      <!-- Input -->
      <div id="eira-input-wrap">
        <textarea id="eira-input" placeholder="Hỏi Eira về sách AR..." rows="1"></textarea>
        <button id="eira-send" aria-label="Gửi">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <div id="eira-footer">Earthoria · Powered by Gemini AI</div>
    </div>
  `;
  document.body.appendChild(root);

  /* ── Elements ── */
  const toggleBtn = document.getElementById("eira-toggle");
  const chatWindow = document.getElementById("eira-window");
  const messagesEl = document.getElementById("eira-messages");
  const typingEl = document.getElementById("eira-typing");
  const inputEl = document.getElementById("eira-input");
  const sendBtn = document.getElementById("eira-send");
  const closeBtn = document.getElementById("eira-header-close");
  const chips = document.querySelectorAll(".eira-chip");
  const dot = document.getElementById("eira-dot");

  /* ── Toggle chat ── */
  function toggleChat() {
    isOpen = !isOpen;
    toggleBtn.classList.toggle("open", isOpen);
    chatWindow.classList.toggle("open", isOpen);
    if (isOpen) {
      dot.style.display = "none";
      inputEl.focus();
      scrollToBottom();
    }
  }
  toggleBtn.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  /* ── Auto-resize textarea ── */
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
  });

  /* ── Send on Enter (Shift+Enter = newline) ── */
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener("click", sendMessage);

  /* ── Quick chips ── */
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      inputEl.value = chip.textContent.replace(/^[^\s]+\s/, "");
      sendMessage();
    });
  });

  /* ── Add message bubble ── */
  function addMessage(text, role) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `eira-msg ${role}`;
    if (role === "bot") {
      msgDiv.innerHTML = `
        <div class="eira-msg-avatar">E</div>
        <div class="eira-msg-bubble">${formatText(text)}</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="eira-msg-bubble">${escapeHtml(text)}</div>
      `;
    }
    messagesEl.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }

  function formatText(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/•\s/g, "• ")
      .replace(/\n/g, "<br>");
  }

  function scrollToBottom() {
    setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
  }

  /* ── Show/hide typing ── */
  function showTyping() {
    typingEl.classList.add("show");
    messagesEl.appendChild(typingEl);
    scrollToBottom();
  }
  function hideTyping() {
    typingEl.classList.remove("show");
  }

  /* ── Send message to Gemini ── */
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    inputEl.value = "";
    inputEl.style.height = "auto";
    isTyping = true;
    sendBtn.disabled = true;

    // Ẩn suggestions sau lần chat đầu
    document.getElementById("eira-suggestions").style.display = "none";

    addMessage(text, "user");
    showTyping();

    // Thêm vào history
    chatHistory.push({ role: "user", parts: [{ text }] });

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: chatHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            topP: 0.9,
          },
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || "Gemini API error");
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình không nhận được phản hồi. Thử lại nhé!";

      // Thêm reply vào history
      chatHistory.push({ role: "model", parts: [{ text: reply }] });

      // Giới hạn history (tránh quá dài)
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-16);

      hideTyping();
      addMessage(reply, "bot");

    } catch (err) {
      hideTyping();
      addMessage(
        `⚠️ Lỗi kết nối: ${err.message}<br><br>Vui lòng kiểm tra API key hoặc thử lại sau.`,
        "bot"
      );
      console.error("Eira error:", err);
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  /* ── Show dot when closed and AI replies ── */
  const origAdd = addMessage;
  // Flash dot if window closed
  setInterval(() => {
    if (!isOpen && chatHistory.length > 0) {
      dot.style.display = "block";
    }
  }, 5000);

  console.log("🌿 Eira chatbox loaded — Earthoria AI Assistant");
})();