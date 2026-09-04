import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Database,
  CreditCard,
  KeyRound,
  Eye,
  Bot,
  Copyright,
  ArrowRight,
  Mail,
  Phone,
  Code2,
  BadgeCheck,
} from "lucide-react";

/* ═══════════════ PILLARS DATA ═══════════════ */
const PILLARS = [
  {
    icon: ShieldCheck,
    eyebrow: "Kiến trúc hệ thống",
    title: "Bảo mật hệ thống",
    desc: "Helmet, CORS, JWT kèm refresh token, bcrypt và giới hạn tần suất theo Redis bảo vệ các endpoint nhạy cảm như đăng nhập, OTP, mã PIN.",
    to: "#security",
  },
  {
    icon: KeyRound,
    eyebrow: "Kid Mode",
    title: "An toàn cho trẻ em",
    desc: "Hồ sơ con tách biệt hoàn toàn khỏi tài khoản chính, khoá sau PIN do phụ huynh sở hữu, kèm nhật ký hoạt động minh bạch.",
    to: "#kidmode",
  },
  {
    icon: Database,
    eyebrow: "Lưu trữ & hạ tầng",
    title: "Dữ liệu & hạ tầng",
    desc: "PostgreSQL quản lý qua Supabase, kết nối gộp qua PgBouncer, media lưu trên Cloudinary, cache & rate limit qua Redis.",
    to: "#data",
  },
  {
    icon: CreditCard,
    eyebrow: "Cổng thanh toán",
    title: "Thanh toán",
    desc: "VNPay, Momo, chuyển khoản QR qua webhook SePay và Stripe — mỗi cổng có endpoint xác minh riêng cùng bảng chống trùng giao dịch.",
    to: "#payments",
  },
  {
    icon: Users,
    eyebrow: "Phân quyền",
    title: "Sáu vai trò rõ ràng",
    desc: "Khách vãng lai, Khách hàng, Đại lý, Trẻ em, Nhân viên, Quản trị — mỗi vai trò giới hạn đúng phạm vi cần thiết ở tầng middleware.",
    to: "#roles",
  },
  {
    icon: Eye,
    eyebrow: "Tự công bố",
    title: "Minh bạch chủ động",
    desc: "Nhóm phát triển tự công bố các hạn chế hiện tại của hệ thống và lộ trình khắc phục — không che giấu.",
    to: "#transparency",
  },
];

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    text: "API phân tầng theo /api/v1, xác thực JWT + refresh token",
  },
  {
    icon: KeyRound,
    text: "Kid Mode tách biệt hoàn toàn khỏi tài khoản đăng nhập chính",
  },
  {
    icon: ShieldCheck,
    text: "Mỗi cổng thanh toán có endpoint xác minh & webhook riêng",
  },
  {
    icon: Eye,
    text: "Hạn chế bảo mật hiện tại được công bố công khai, không che giấu",
  },
];

const ECOSYSTEM_BRANDS = [
  {
    name: "Family Studio",
    role: "Nội dung giáo dục gắn kết gia đình, gồm cả Knowledge Farm",
  },
  {
    name: "Game Studio",
    role: "Phát triển mini-game giáo dục gắn liền với sách",
  },
  {
    name: "Immersive Studio",
    role: "Công nghệ quét mã & trải nghiệm thực tế tăng cường (AR)",
  },
  { name: "Eira", role: "Trợ lý AI đồng hành cùng trẻ trong lúc đọc và học" },
  { name: "Kid Mode", role: "Chế độ trẻ em, bảo vệ bởi PIN phụ huynh" },
];

const ROLES = [
  {
    role: "Khách vãng lai",
    inSystem: "Chưa đăng nhập",
    scope: "Duyệt danh mục công khai; xem AR/game ở mức Guest nếu được mở",
  },
  {
    role: "Khách hàng",
    inSystem: "Role.CUSTOMER",
    scope:
      "Cửa hàng, giỏ hàng, thanh toán, đơn hàng, tích điểm, hỗ trợ, quản lý hồ sơ con",
  },
  {
    role: "Đại lý",
    inSystem: "Role.DEALER",
    scope:
      "Mua theo bảng giá sỉ riêng cho từng biến thể sản phẩm; do Admin nâng/hạ cấp",
  },
  {
    role: "Trẻ em (Kid Mode)",
    inSystem: "ChildProfile — ngoài enum Role",
    scope:
      "Đọc, chơi, AR, khu vườn — qua PIN phụ huynh hoặc liên kết token hoá",
  },
  {
    role: "Nhân viên",
    inSystem: "Role.STAFF",
    scope:
      "Ticket, đánh giá, ebook, game — một phần khu vực /admin, không thấy tài khoản Admin",
  },
  {
    role: "Quản trị",
    inSystem: "Role.ADMIN",
    scope:
      "Toàn bộ /admin: danh mục, đơn hàng, người dùng, mã giảm giá, mã AR, cài đặt",
  },
];

const DATA_GROUPS = [
  {
    group: "Danh tính & truy cập",
    models: "User, PendingUser, UserCodeSeq, RefreshToken",
  },
  {
    group: "Danh mục sách",
    models: "Book, BookVariant, Category, Tag, BookTag, Author, BookAuthor",
  },
  {
    group: "Thương mại",
    models:
      "Cart, CartItem, Order, OrderItem, PaymentTransaction, PaymentIdempotency, Coupon, Address",
  },
  { group: "Tương tác người dùng", models: "Review, ReviewVote, Wishlist" },
  { group: "Nội dung số", models: "Ebook, Game, GameResult, ArCode" },
  {
    group: "Kid Mode",
    models:
      "ChildProfile, ChildBookAccess, ChildActivityLog, ChildAuditLog, ChildGarden, ChildTree",
  },
  { group: "Hỗ trợ & vận hành", models: "Ticket, TicketReply, SiteSetting" },
];

const PAYMENTS = [
  {
    name: "VNPay",
    desc: "Tích hợp qua VNPAY_HASH_SECRET & VNPAY_URL, endpoint IPN/xác minh riêng biệt khỏi luồng đặt hàng.",
  },
  {
    name: "Momo",
    desc: "Xác thực bằng mã đối tác, access key và secret key riêng; endpoint webhook độc lập.",
  },
  {
    name: "Chuyển khoản QR (SePay)",
    desc: "Sinh mã QR ngân hàng cấu hình sẵn, xác thực webhook bằng SEPAY_WEBHOOK_API_KEY riêng.",
  },
  {
    name: "Stripe",
    desc: "SDK Stripe là một tuỳ chọn thanh toán (nếu được kích hoạt), dùng chung bảng chống trùng giao dịch.",
  },
];

const KNOWN_ISSUES = [
  {
    title: "Bí mật từng nằm trong lịch sử Git",
    desc: "Các commit lịch sử từng chứa API key và chuỗi kết nối thật. Trước khi dùng cho sản xuất/công khai, thông tin xác thực đã lộ cần được xoay vòng và xoá khỏi lịch sử Git.",
  },
  {
    title: "Xác thực đầu vào chưa tập trung",
    desc: "express-validator có trong phụ thuộc nhưng chưa được dùng; xác thực yêu cầu hiện xử lý rải rác trong từng controller.",
  },
  {
    title: "Thông báo lỗi có thể lộ chi tiết nội bộ",
    desc: "Bộ xử lý lỗi toàn cục hiện trả trực tiếp err.message về client.",
  },
  {
    title: "Chưa có bộ kiểm thử tự động",
    desc: "Hiện chưa có kiểm thử tự động (unit, integration, e2e) và chưa có pipeline CI.",
  },
];

const ROADMAP = [
  "Xoay vòng & xoá toàn bộ thông tin xác thực đã lộ, thực thi .gitignore ở gốc kho mã",
  "Bổ sung kiểm thử tự động cho các luồng trọng yếu: xác thực, thanh toán, checkout",
  "Thêm pipeline CI (lint, build, test) cho mỗi pull request",
  "Tập trung hoá xác thực yêu cầu & ghi log có cấu trúc",
  "Tách nhỏ các controller lớn thành module theo từng miền",
  "Thêm audit log cho mọi thao tác quản trị",
  "Bổ sung tài liệu API (OpenAPI/Swagger) cho ~150 endpoint hiện có",
  "Cân nhắc xác thực hai lớp (2FA) cho tài khoản quản trị/nhân viên",
];

/* ═══════════════ COMPONENT ═══════════════ */
export default function TrustCenter() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        /* ══════════════ HERO (giống lh-hero) ══════════════ */
        .tc-hero { position: relative; overflow: hidden; background: var(--forest); padding: 140px 100px 80px; }
        .tc-hero-grid { position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px; }
        .tc-hero-glow { position: absolute; inset: 0;
          background: radial-gradient(ellipse at 10% 20%, rgba(74,158,63,0.18) 0%, transparent 50%), radial-gradient(ellipse at 88% 70%, rgba(45,122,110,0.2) 0%, transparent 50%);
          pointer-events: none; }
        .tc-hero-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-family: 'Playfair Display', serif; font-size: clamp(70px, 12vw, 200px); font-weight: 300;
          color: rgba(255,255,255,0.022); white-space: nowrap; pointer-events: none; user-select: none; letter-spacing: -0.02em; }
        .tc-hero-inner { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; text-align: center; }
        .tc-hero-badge { display: inline-flex; align-items: center; gap: 10px; border: 0.5px solid rgba(74,158,63,0.35);
          padding: 9px 18px; margin-bottom: 34px; background: rgba(255,255,255,0.04); }
        .tc-hero-badge span { font-family: 'Be Vietnam Pro', sans-serif; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); font-weight: 400; }
        .tc-hero-badge-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); animation: tc-pulse 2s ease-in-out infinite; }
        @keyframes tc-pulse { 0%,100%{opacity:1; transform:scale(1);} 50%{opacity:.4; transform:scale(.7);} }
        .tc-hero-title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 4.6vw, 60px); font-weight: 300; line-height: 1.12; color: var(--ivory); letter-spacing: -0.015em; margin-bottom: 22px; }
        .tc-hero-title em { font-style: italic; color: var(--gold); }
        .tc-hero-sub { font-size: 14.5px; line-height: 1.85; color: rgba(250,248,243,0.62); font-weight: 300; max-width: 600px; margin: 0 auto; }
        .tc-hero-stats { position: relative; z-index: 2; max-width: 1000px; margin: 52px auto 0; display: grid; grid-template-columns: repeat(4,1fr); border-top: 0.5px solid rgba(255,255,255,0.12); }
        .tc-hs { padding: 24px 16px 0; text-align: center; border-left: 0.5px solid rgba(255,255,255,0.12); }
        .tc-hs:first-child { border-left: none; }
        .tc-hs .num { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: var(--gold); font-weight: 400; }
        .tc-hs .lbl { font-size: 10.5px; color: rgba(250,248,243,0.55); margin-top: 6px; }

        /* ══════════════ DISCLAIMER ══════════════ */
        .tc-disclaimer { background: var(--parchment); border-bottom: 0.5px solid var(--border); padding: 16px 100px; display: flex; gap: 12px; }
        .tc-disclaimer p { font-size: 12.5px; line-height: 1.7; color: var(--text-muted); max-width: 1100px; }
        .tc-disclaimer b { color: var(--forest); font-weight: 500; }

        /* ══════════════ SECTION SHELL ══════════════ */
        .tc-section { padding: 88px 100px; }
        .tc-section.alt { background: var(--cream); }
        .tc-section-head { max-width: 660px; margin: 0 auto 48px; text-align: center; }
        .tc-eyebrow { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold); display: block; margin-bottom: 16px; }
        .tc-section-title { font-family: 'Playfair Display', serif; font-size: clamp(26px,3.2vw,40px); font-weight: 300; color: var(--forest); line-height: 1.2; margin-bottom: 14px; }
        .tc-section-title em { font-style: italic; color: var(--gold); }
        .tc-section-sub { font-size: 13.5px; line-height: 1.8; color: var(--text-muted); font-weight: 300; }

        /* ══════════════ PILLAR / CARD (giống lh-card) ══════════════ */
        .tc-grid3 { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        .tc-card { background: var(--white); border: 0.5px solid var(--border); position: relative; overflow: hidden;
          transition: all 0.45s cubic-bezier(0.16,1,0.3,1); text-decoration: none; color: inherit; display: block; }
        .tc-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--forest-light, var(--forest))); transform: scaleX(0); transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.16,1,0.3,1); }
        .tc-card:hover { transform: translateY(-6px); border-color: var(--border-gold); box-shadow: 0 32px 64px rgba(13,43,30,0.1); }
        .tc-card:hover::before { transform: scaleX(1); }
        .tc-card-head { padding: 30px 28px 0; }
        .tc-card-icon { width: 44px; height: 44px; border: 0.5px solid var(--border-gold); background: var(--gold-pale); display: flex; align-items: center; justify-content: center; color: var(--gold); }
        .tc-card-body { padding: 22px 28px 0; }
        .tc-card-eyebrow { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .tc-card-title { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 400; color: var(--forest); line-height: 1.25; margin-bottom: 10px; }
        .tc-card-desc { font-size: 13px; line-height: 1.8; color: var(--text-muted); font-weight: 300; }
        .tc-card-foot { padding: 18px 28px 26px; border-top: 0.5px solid var(--border); margin-top: 20px; }
        .tc-card-link { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--forest); font-weight: 500; transition: gap 0.3s ease, color 0.3s ease; }
        .tc-card:hover .tc-card-link { color: var(--gold); gap: 13px; }

        /* ══════════════ TRUST STRIP ══════════════ */
        .tc-trust { background: var(--forest); padding: 52px 100px; border-top: 0.5px solid rgba(255,255,255,0.06); border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .tc-trust-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: rgba(255,255,255,0.06); }
        .tc-trust-item { background: var(--forest); padding: 26px 28px; display: flex; align-items: center; gap: 13px; }
        .tc-trust-item svg { color: var(--gold); flex-shrink: 0; }
        .tc-trust-item span { font-size: 12px; color: rgba(250,248,243,0.62); font-weight: 300; line-height: 1.6; }

        /* ══════════════ TIMELINE / ROADMAP ══════════════ */
        .tc-timeline { max-width: 820px; margin: 0 auto; list-style: none; padding: 0; }
        .tc-timeline li { display: grid; grid-template-columns: 52px 1fr; gap: 20px; padding: 22px 0; border-top: 0.5px solid var(--border); }
        .tc-timeline li:first-child { border-top: none; }
        .tc-timeline .idx { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--gold); font-weight: 400; }
        .tc-timeline p { font-size: 13.5px; line-height: 1.8; color: var(--text-body); font-weight: 300; margin: 0; }

        /* ══════════════ TABLES ══════════════ */
        .tc-table-wrap { max-width: 1100px; margin: 0 auto 32px; }
        .tc-table-wrap h3 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 18px; color: var(--forest); margin-bottom: 16px; }
        .tc-table { width: 100%; border-collapse: collapse; background: var(--white); border: 0.5px solid var(--border); }
        .tc-table th { text-align: left; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); font-weight: 500;
          padding: 13px 18px; border-bottom: 0.5px solid var(--border); background: var(--parchment); }
        .tc-table td { padding: 14px 18px; font-size: 13px; color: var(--text-body); border-bottom: 0.5px solid var(--border); line-height: 1.6; }
        .tc-table tr:last-child td { border-bottom: none; }
        .tc-table td.mono, .tc-mono { font-family: monospace; font-size: 12px; color: var(--forest); }

        /* ══════════════ TWO COL ══════════════ */
        .tc-two { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.05fr 1fr; gap: 52px; align-items: start; }

        /* ══════════════ NOTE CARDS (known limitations) ══════════════ */
        .tc-notes { max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
        .tc-note { background: var(--white); border: 0.5px solid var(--border); border-left: 2px solid var(--gold); padding: 20px 24px; }
        .tc-note h4 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 15.5px; color: var(--forest); margin: 0 0 6px; }
        .tc-note p { font-size: 12.5px; line-height: 1.8; color: var(--text-muted); font-weight: 300; margin: 0; }

        /* ══════════════ CONTACT CTA (giống lh-contact) ══════════════ */
        .tc-contact { background: var(--cream); padding: 100px 100px; text-align: center; position: relative; overflow: hidden; }
        .tc-contact-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-family: 'Playfair Display', serif; font-size: clamp(60px,10vw,150px); font-weight: 300; color: rgba(13,43,30,0.04); white-space: nowrap; pointer-events: none; letter-spacing: -0.02em; }
        .tc-contact-inner { position: relative; z-index: 1; max-width: 700px; margin: 0 auto; }
        .tc-contact-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 40px; }
        .tc-contact-item { display: flex; align-items: center; gap: 10px; padding: 14px 22px; border: 0.5px solid var(--border); background: var(--white);
          font-size: 13px; color: var(--text-muted); text-decoration: none; transition: all 0.3s ease; }
        .tc-contact-item:hover { border-color: var(--gold); color: var(--forest); }
        .tc-contact-item svg { color: var(--gold); flex-shrink: 0; }
        .tc-license { max-width: 700px; margin: 32px auto 0; font-size: 12px; color: var(--text-muted); line-height: 1.8; border-top: 0.5px solid var(--border); padding-top: 22px; }

        /* ══════════════ DARK MODE ══════════════ */
        body.dark-mode .tc-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .tc-card-title { color: #c8d4cc; }
        body.dark-mode .tc-table { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .tc-table th { background: #16201b; }
        body.dark-mode .tc-note { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .tc-contact { background: #161e1a; }
        body.dark-mode .tc-contact-item { background: #1c2822; border-color: rgba(255,255,255,0.07); color: rgba(180,200,188,0.6); }

        /* ══════════════ RESPONSIVE ══════════════ */
        @media (max-width: 1100px) {
          .tc-hero, .tc-section, .tc-trust, .tc-contact, .tc-disclaimer { padding-left: 32px; padding-right: 32px; }
          .tc-two { grid-template-columns: 1fr; gap: 32px; }
        }
        @media (max-width: 900px) {
          .tc-grid3 { grid-template-columns: 1fr; max-width: 560px; }
          .tc-trust-inner { grid-template-columns: repeat(2,1fr); }
          .tc-hero-stats { grid-template-columns: repeat(2,1fr); row-gap: 22px; }
        }
        @media (max-width: 600px) {
          .tc-trust-inner { grid-template-columns: 1fr; }
          .tc-hero { padding: 110px 20px 56px; }
          .tc-section, .tc-contact, .tc-disclaimer { padding-left: 20px; padding-right: 20px; }
          .tc-timeline li { grid-template-columns: 36px 1fr; }
        }
      `}</style>

      {/* Breadcrumb — dùng lại class global giống /legal */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">
          Trang chủ
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Trung tâm Tin cậy</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="tc-hero">
        <div className="tc-hero-grid" />
        <div className="tc-hero-glow" />
        <div className="tc-hero-watermark">TIN CẬY</div>
        <div className="tc-hero-inner">
          <div className="tc-hero-badge">
            <div className="tc-hero-badge-dot" />
            <span>Trung Tâm Tin Cậy Earthoria</span>
          </div>
          <h1 className="tc-hero-title">
            An Toàn &amp; Minh Bạch
            <br />
            Là <em>Nền&nbsp;Móng</em> Của Earthoria
          </h1>
          <p className="tc-hero-sub">
            Cách hệ thống, dữ liệu và Kid Mode của Earthoria được xây dựng để
            bảo vệ gia đình bạn — trình bày minh bạch, kể cả những phần chưa
            hoàn thiện.
          </p>
        </div>
        <div className="tc-hero-stats">
          <div className="tc-hs">
            <div className="num">38</div>
            <div className="lbl">mô hình dữ liệu</div>
          </div>
          <div className="tc-hs">
            <div className="num">~150</div>
            <div className="lbl">endpoint API</div>
          </div>
          <div className="tc-hs">
            <div className="num">6</div>
            <div className="lbl">vai trò &amp; cấp truy cập</div>
          </div>
          <div className="tc-hs">
            <div className="num">3</div>
            <div className="lbl">lớp nền tảng</div>
          </div>
        </div>
      </section>

      {/* ═══ DISCLAIMER ═══ */}
      <div className="tc-disclaimer">
        <p>
          <b>Nguồn nội dung:</b> Tổng hợp từ mã nguồn nội bộ của Earthoria —
          README, schema Prisma và mã ứng dụng. Đây là tài liệu tổng hợp kỹ
          thuật, không phải kết quả kiểm toán bảo mật độc lập.
        </p>
      </div>

      {/* ═══ PILLARS ═══ */}
      <section className="tc-section" id="pillars">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Sáu Trụ Cột</span>
          <h2 className="tc-section-title">
            Những điều phụ huynh nên
            <br />
            <em>xem&nbsp;trước</em>
          </h2>
          <p className="tc-section-sub">
            Sáu lĩnh vực bất kỳ phụ huynh, đối tác hay nhà đầu tư nào cũng nên
            xem trước khi tin tưởng một nền tảng dành cho trẻ em.
          </p>
        </div>
        <div className="tc-grid3">
          {PILLARS.map((p, i) => (
            <a
              className={`tc-card reveal reveal-delay-${(i % 3) + 1}`}
              href={p.to}
              key={i}
            >
              <div className="tc-card-head">
                <div className="tc-card-icon">
                  <p.icon size={20} />
                </div>
              </div>
              <div className="tc-card-body">
                <div className="tc-card-eyebrow">{p.eyebrow}</div>
                <h3 className="tc-card-title">{p.title}</h3>
                <p className="tc-card-desc">{p.desc}</p>
              </div>
              <div className="tc-card-foot">
                <span className="tc-card-link">
                  Xem chi tiết <ArrowRight size={13} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="tc-trust">
        <div className="tc-trust-inner">
          {TRUST_ITEMS.map((t, i) => (
            <div className="tc-trust-item reveal" key={i}>
              <t.icon size={18} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ OVERVIEW ═══ */}
      <section className="tc-section" id="overview">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Nền Tảng &amp; Triết Lý</span>
          <h2 className="tc-section-title">
            Ba lớp gắn kết, <em>không&nbsp;phải</em> một cửa hàng đơn thuần
          </h2>
        </div>
        <ol className="tc-timeline reveal">
          <li>
            <span className="idx">01</span>
            <div>
              <b>Lớp thương mại</b>
              <p>
                Tìm kiếm, mua và quản lý sách giấy lẫn sách số — giỏ hàng, thanh
                toán nhiều bước, mã giảm giá, lịch sử đơn hàng.
              </p>
            </div>
          </li>
          <li>
            <span className="idx">02</span>
            <div>
              <b>Lớp nội dung &amp; tương tác</b>
              <p>
                Mỗi cuốn sách có thể mở rộng bằng ebook, trải nghiệm AR và
                mini-game giáo dục. Hệ thống "khu vườn" thưởng cho trẻ khi duy
                trì hoạt động.
              </p>
            </div>
          </li>
          <li>
            <span className="idx">03</span>
            <div>
              <b>Lớp an toàn gia đình</b>
              <p>
                Kid Mode tách trải nghiệm của trẻ ra sau một mã PIN do phụ huynh
                sở hữu, cung cấp bảng điều khiển và nhật ký hoạt động.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* ═══ ECOSYSTEM & AI ═══ */}
      <section className="tc-section alt" id="ecosystem">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Hệ Sinh Thái &amp; AI Eira</span>
          <h2 className="tc-section-title">
            Nhiều bộ phận, <em>một</em> chủ sở hữu
          </h2>
          <p className="tc-section-sub">
            Theo Tuyên Bố Bản Quyền của dự án — mỗi bộ phận có tên gọi riêng
            nhưng cùng thuộc quyền sở hữu của Earthoria.
          </p>
        </div>
        <div className="tc-two">
          <div className="tc-table-wrap reveal" style={{ margin: 0 }}>
            <h3>Các bộ phận trong hệ sinh thái</h3>
            <table className="tc-table">
              <tbody>
                {ECOSYSTEM_BRANDS.map((b, i) => (
                  <tr key={i}>
                    <td>
                      <b>{b.name}</b>
                    </td>
                    <td>{b.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="reveal">
            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 400,
                fontSize: 17,
                color: "var(--forest)",
                marginBottom: 12,
              }}
            >
              Minh bạch về trợ lý AI Eira
            </h3>
            <ul
              style={{
                fontSize: 13,
                lineHeight: 1.9,
                color: "var(--text-muted)",
                paddingLeft: 18,
              }}
            >
              <li>
                AI không thay thế chuyên gia trong các quyết định quan trọng
              </li>
              <li>Bản ghi âm giọng nói gửi tới AI tự xoá sau 24 giờ</li>
              <li>Có thể xoá lịch sử hội thoại với Eira bất cứ lúc nào</li>
              <li>Trẻ em được áp dụng lớp bảo vệ nội dung riêng</li>
            </ul>
            <Link
              to="/legal/ai"
              className="tc-card-link"
              style={{ color: "var(--forest)" }}
            >
              Xem Chính Sách AI đầy đủ <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═══ */}
      <section className="tc-section" id="security">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Kiến Trúc &amp; Bảo Mật</span>
          <h2 className="tc-section-title">
            Xác thực & phân quyền <em>theo nhiều&nbsp;tầng</em>
          </h2>
        </div>
        <div className="tc-table-wrap reveal">
          <table className="tc-table">
            <tbody>
              <tr>
                <td className="mono">1</td>
                <td>Client — React 19 SPA dựng bằng Vite</td>
              </tr>
              <tr>
                <td className="mono">2</td>
                <td>
                  Express App: Helmet · CORS · rate limiting · Passport ·
                  maintenance guard
                </td>
              </tr>
              <tr>
                <td className="mono">3</td>
                <td>
                  Routes theo tiền tố <code className="tc-mono">/api/v1/*</code>
                </td>
              </tr>
              <tr>
                <td className="mono">4</td>
                <td>
                  Middleware:{" "}
                  <code className="tc-mono">
                    protect · optionalAuth · adminOnly · staffOrAdmin
                  </code>
                </td>
              </tr>
              <tr>
                <td className="mono">5</td>
                <td>Controllers → Services / Prisma Client</td>
              </tr>
              <tr>
                <td className="mono">6</td>
                <td>PostgreSQL (Supabase, pooled qua PgBouncer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ KID MODE ═══ */}
      <section className="tc-section alt" id="kidmode">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Kid Mode</span>
          <h2 className="tc-section-title">
            Trẻ dùng trực tiếp, <em>phụ&nbsp;huynh</em> luôn nắm quyền
          </h2>
        </div>
        <div className="tc-table-wrap reveal" style={{ maxWidth: 900 }}>
          <table className="tc-table">
            <tbody>
              <tr>
                <td>Hồ sơ con</td>
                <td>Do phụ huynh tạo, độc lập với tài khoản đăng nhập chính</td>
              </tr>
              <tr>
                <td>PIN phụ huynh</td>
                <td>Thiết lập, xác minh, đổi và khôi phục qua OTP</td>
              </tr>
              <tr>
                <td>Kiểm soát nội dung</td>
                <td>Phụ huynh chọn sách/nội dung nào trẻ được truy cập</td>
              </tr>
              <tr>
                <td>Xoá hồ sơ</td>
                <td>Xoá vĩnh viễn yêu cầu xác nhận cả PIN lẫn tên hồ sơ</td>
              </tr>
              <tr>
                <td>Nhật ký hoạt động</td>
                <td>
                  ChildActivityLog &amp; ChildAuditLog ghi lại riêng biệt để phụ
                  huynh giám sát
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ DATA & INFRA ═══ */}
      <section className="tc-section" id="data">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Dữ Liệu &amp; Hạ Tầng</span>
          <h2 className="tc-section-title">
            38 mô hình dữ liệu, <em>bảy</em> nhóm nghiệp vụ
          </h2>
        </div>
        <div className="tc-table-wrap reveal">
          <table className="tc-table">
            <thead>
              <tr>
                <th>Nhóm dữ liệu</th>
                <th>Các mô hình chính</th>
              </tr>
            </thead>
            <tbody>
              {DATA_GROUPS.map((g, i) => (
                <tr key={i}>
                  <td>{g.group}</td>
                  <td className="mono">{g.models}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ PAYMENTS ═══ */}
      <section className="tc-section alt" id="payments">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Thanh Toán</span>
          <h2 className="tc-section-title">
            Tích hợp cổng thanh toán <em>nội&nbsp;địa</em>
          </h2>
        </div>
        <div className="tc-grid3">
          {PAYMENTS.map((pm, i) => (
            <div className="tc-card" style={{ cursor: "default" }} key={i}>
              <div className="tc-card-body" style={{ padding: "26px 28px" }}>
                <h3 className="tc-card-title" style={{ fontSize: 17 }}>
                  {pm.name}
                </h3>
                <p className="tc-card-desc">{pm.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ROLES ═══ */}
      <section className="tc-section" id="roles">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Vai Trò &amp; Phân Quyền</span>
          <h2 className="tc-section-title">
            Sáu vai trò, <em>thực&nbsp;thi</em> ở tầng backend
          </h2>
          <p className="tc-section-sub">
            Đối chiếu trực tiếp với <code className="tc-mono">enum Role</code>{" "}
            trong <code className="tc-mono">schema.prisma</code> — vì README chỉ
            liệt kê 4/6 vai trò thực tế.
          </p>
        </div>
        <div className="tc-table-wrap reveal" style={{ maxWidth: 1100 }}>
          <table className="tc-table">
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Trong hệ thống</th>
                <th>Phạm vi truy cập</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r, i) => (
                <tr key={i}>
                  <td>
                    <b>{r.role}</b>
                  </td>
                  <td className="mono">{r.inSystem}</td>
                  <td>{r.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ TRANSPARENCY ═══ */}
      <section className="tc-section alt" id="transparency">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Minh Bạch</span>
          <h2 className="tc-section-title">
            Hạn chế đã biết — <em>tự công&nbsp;bố</em>
          </h2>
        </div>
        <div className="tc-notes reveal">
          {KNOWN_ISSUES.map((n, i) => (
            <div className="tc-note" key={i}>
              <h4>{n.title}</h4>
              <p>{n.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ROADMAP ═══ */}
      <section className="tc-section" id="roadmap">
        <div className="tc-section-head reveal">
          <span className="tc-eyebrow">Lộ Trình</span>
          <h2 className="tc-section-title">
            Hướng tới <em>mức độ trưởng thành</em> sản xuất
          </h2>
        </div>
        <ol className="tc-timeline reveal">
          {ROADMAP.map((step, i) => (
            <li key={i}>
              <span className="idx">{String(i + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="tc-contact" id="contact">
        <div className="tc-contact-watermark">EARTHORIA</div>
        <div className="tc-contact-inner">
          <span className="tc-eyebrow reveal">Liên Hệ &amp; Giấy Phép</span>
          <h2 className="tc-section-title reveal">
            Còn câu hỏi về
            <br />
            <em>độ tin cậy của Earthoria?</em>
          </h2>
          <div className="tc-contact-grid reveal">
            <a href="mailto:wtskane@gmail.com" className="tc-contact-item">
              <Mail size={15} />
              wtskane@gmail.com
            </a>
            <a href="tel:0849324423" className="tc-contact-item">
              <Phone size={15} />
              0849324423
            </a>
            <a
              href="https://github.com/KaneVina"
              target="_blank"
              rel="noopener noreferrer"
              className="tc-contact-item"
            >
              <Code2 size={15} />
              github.com/KaneVina
            </a>
          </div>
          <div className="tc-license reveal">
            Xem đầy đủ các văn bản pháp lý tại{" "}
            <Link
              to="/legal"
              style={{ color: "var(--forest)", textDecoration: "underline" }}
            >
              trang Pháp lý
            </Link>
            , bao gồm{" "}
            <Link
              to="/legal/copyright"
              style={{ color: "var(--forest)", textDecoration: "underline" }}
            >
              Tuyên Bố Bản Quyền{" "}
              <Copyright size={12} style={{ display: "inline" }} />
            </Link>
            . Mã nguồn phần mềm hiện chưa công bố giấy phép mã nguồn mở — mọi
            quyền được bảo lưu.
          </div>
        </div>
      </section>
    </>
  );
}
