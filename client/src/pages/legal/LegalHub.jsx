import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  ShieldCheck,
  Truck,
  RefreshCcw,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   POLICY CARDS DATA
───────────────────────────────────────────────────────────── */
const POLICIES = [
  {
    icon: Scale,
    eyebrow: "Quyền & Nghĩa Vụ",
    title: "Điều Khoản Dịch Vụ",
    desc: "Những quy định rõ ràng, công bằng điều chỉnh mối quan hệ giữa Earthoria và bạn — từ đặt hàng, thanh toán đến quy tắc sử dụng ứng dụng AR/AI và cơ chế giải quyết tranh chấp.",
    version: "v3.2",
    updated: "15/06/2026",
    highlights: ["30 ngày đổi trả", "Quyền hủy tài khoản bất kỳ lúc nào", "Luật Việt Nam áp dụng"],
    to: "/legal/terms",
    label: "Xem Điều Khoản",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Quyền Riêng Tư",
    title: "Chính Sách Bảo Mật",
    desc: "Cách Earthoria thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn và gia đình — được giải thích rõ ràng, không thuật ngữ rối rắm, với cam kết đặc biệt về quyền riêng tư của trẻ em.",
    version: "v2.4",
    updated: "15/06/2026",
    highlights: ["Không bán dữ liệu", "Giọng nói AI xóa sau 24 giờ", "Mã hóa TLS 1.3 & AES-256"],
    to: "/legal/privacy",
    label: "Xem Chính Sách Bảo Mật",
  },
  {
    icon: RefreshCcw,
    eyebrow: "Đổi Trả & Hoàn Tiền",
    title: "Chính Sách Trả Hàng & Hoàn Tiền",
    desc: "Mua sắm an tâm với chính sách đổi trả 30 ngày, bảo hành 12 tháng và cam kết hoàn tiền minh bạch theo đúng phương thức thanh toán ban đầu của bạn.",
    version: "v2.0",
    updated: "15/06/2026",
    highlights: ["7 ngày trả hàng không cần lý do", "Bảo hành lỗi sản xuất 12 tháng", "Hoàn tiền trong 5–10 ngày làm việc"],
    to: "/legal/returns",
    label: "Xem Chính Sách Trả Hàng",
  },
  {
    icon: Truck,
    title: "Chính Sách Vận Chuyển",
    desc: "Mọi thứ cần biết về thời gian giao hàng, phí vận chuyển, tiêu chuẩn đóng gói bảo vệ sách AR và cam kết xử lý khi hàng hỏng hoặc thất lạc trong quá trình vận chuyển.",
    version: "v2.1",
    updated: "15/06/2026",
    highlights: ["Miễn phí ship từ 500k", "Giao 63 tỉnh thành", "Đổi mới nếu hàng hỏng do ship"],
    to: "/legal/shipping",
    label: "Xem Chính Sách Vận Chuyển",
  },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, text: "Tuân thủ Luật Bảo vệ Người tiêu dùng Việt Nam" },
  { icon: ShieldCheck, text: "Bảo mật dữ liệu theo tiêu chuẩn quốc tế" },
  { icon: BadgeCheck, text: "Cam kết bảo vệ đặc biệt cho trẻ em dưới 13 tuổi" },
  { icon: ShieldCheck, text: "Cập nhật chính sách minh bạch, thông báo trước 14 ngày" },
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
export default function LegalHub() {
  /* reveal-on-scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        /* ══════════════ HERO ══════════════ */
        .lh-hero {
          position: relative; overflow: hidden;
          background: var(--forest);
          padding: 140px 100px 88px;
        }
        .lh-hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .lh-hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 10% 20%, rgba(74,158,63,0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 88% 70%, rgba(45,122,110,0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        .lh-hero-watermark {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Playfair Display', serif;
          font-size: clamp(70px, 12vw, 200px);
          font-weight: 300; color: rgba(255,255,255,0.022);
          white-space: nowrap; pointer-events: none; user-select: none;
          letter-spacing: -0.02em;
        }
        .lh-hero-inner {
          position: relative; z-index: 2;
          max-width: 760px; margin: 0 auto; text-align: center;
        }
        .lh-hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          border: 0.5px solid rgba(74,158,63,0.35);
          padding: 9px 18px; margin-bottom: 36px;
          background: rgba(255,255,255,0.04);
        }
        .lh-hero-badge span {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--gold); font-weight: 400;
        }
        .lh-hero-badge-dot {
          width: 4px; height: 4px; border-radius: 50%; background: var(--gold);
          animation: lh-pulse 2s ease-in-out infinite;
        }
        @keyframes lh-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .lh-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 5.5vw, 72px);
          font-weight: 300; line-height: 1.08;
          color: var(--ivory); letter-spacing: -0.015em;
          margin-bottom: 24px;
        }
        .lh-hero-title em { font-style: italic; color: var(--gold); }
        .lh-hero-sub {
          font-size: 15px; line-height: 1.8;
          color: rgba(250,248,243,0.55); font-weight: 300;
          max-width: 540px; margin: 0 auto;
        }

        /* ══════════════ POLICY CARDS ══════════════ */
        .lh-policies {
          background: var(--ivory);
          padding: 100px 100px 110px;
        }
        .lh-policies-grid {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .lh-card {
          background: var(--white);
          border: 0.5px solid var(--border);
          display: flex; flex-direction: column;
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative; overflow: hidden;
        }
        .lh-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--forest-light));
          transform: scaleX(0); transform-origin: left;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lh-card:hover {
          transform: translateY(-6px);
          border-color: var(--border-gold);
          box-shadow: 0 32px 64px rgba(13,43,30,0.1);
        }
        .lh-card:hover::before { transform: scaleX(1); }

        .lh-card-head {
          padding: 36px 36px 0;
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .lh-card-icon {
          width: 48px; height: 48px;
          border: 0.5px solid var(--border-gold);
          background: var(--gold-pale);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold);
        }
        .lh-card-meta {
          display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .lh-card-version {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 10px; letter-spacing: 0.12em;
          color: var(--gold); background: var(--gold-pale);
          padding: 3px 9px;
        }
        .lh-card-updated {
          font-size: 11px; color: var(--text-muted); font-weight: 300;
        }

        .lh-card-body { padding: 28px 36px 0; flex: 1; }
        .lh-card-eyebrow {
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 12px;
          font-family: 'Be Vietnam Pro', sans-serif;
        }
        .lh-card-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 2vw, 26px); font-weight: 400;
          color: var(--forest); line-height: 1.2; margin-bottom: 18px;
        }
        .lh-card-desc {
          font-size: 13px; line-height: 1.85; color: var(--text-muted);
          font-weight: 300; margin-bottom: 24px;
        }

        .lh-card-highlights {
          list-style: none; padding: 0;
          display: flex; flex-direction: column; gap: 10px;
          padding: 20px 0; border-top: 0.5px solid var(--border);
        }
        .lh-card-highlight {
          display: flex; align-items: center; gap: 10px;
          font-size: 12px; color: var(--text-muted); font-weight: 300;
        }
        .lh-highlight-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: var(--gold); flex-shrink: 0;
        }

        .lh-card-foot {
          padding: 24px 36px 32px;
          border-top: 0.5px solid var(--border);
        }
        .lh-card-link {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--forest); font-weight: 500; text-decoration: none;
          transition: all 0.3s ease;
        }
        .lh-card-link svg { transition: transform 0.3s ease; }
        .lh-card-link:hover { color: var(--gold); gap: 16px; }
        .lh-card-link:hover svg { transform: translateX(4px); }

        /* ══════════════ TRUST STRIP ══════════════ */
        .lh-trust {
          background: var(--forest);
          padding: 60px 100px;
          border-top: 0.5px solid rgba(255,255,255,0.06);
        }
        .lh-trust-inner {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(255,255,255,0.06);
        }
        .lh-trust-item {
          background: var(--forest);
          padding: 28px 32px;
          display: flex; align-items: center; gap: 14px;
        }
        .lh-trust-item svg { color: var(--gold); flex-shrink: 0; }
        .lh-trust-item span {
          font-size: 12.5px; color: rgba(250,248,243,0.6);
          font-weight: 300; line-height: 1.6;
        }

        /* ══════════════ CONTACT CTA ══════════════ */
        .lh-contact {
          background: var(--cream);
          padding: 110px 100px; text-align: center;
          position: relative; overflow: hidden;
        }
        .lh-contact-watermark {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          font-family: 'Playfair Display', serif;
          font-size: clamp(60px, 10vw, 150px); font-weight: 300;
          color: rgba(13,43,30,0.04); white-space: nowrap;
          pointer-events: none; letter-spacing: -0.02em;
        }
        .lh-contact-inner { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
        .lh-contact-eyebrow {
          font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
          color: var(--gold); display: block; margin-bottom: 20px;
        }
        .lh-contact-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.5vw, 44px); font-weight: 300;
          color: var(--forest); line-height: 1.2; margin-bottom: 14px;
        }
        .lh-contact-title em { font-style: italic; color: var(--gold); }
        .lh-contact-sub {
          font-size: 14px; color: var(--text-muted); font-weight: 300;
          line-height: 1.7; margin-bottom: 48px;
        }
        .lh-contact-grid {
          display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
        }
        .lh-contact-item {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 24px;
          border: 0.5px solid var(--border);
          background: var(--white);
          font-size: 13px; color: var(--text-muted);
          text-decoration: none; transition: all 0.3s ease;
        }
        .lh-contact-item:hover { border-color: var(--gold); color: var(--forest); }
        .lh-contact-item svg { color: var(--gold); flex-shrink: 0; }

        /* ══════════════ DARK MODE ══════════════ */
        body.dark-mode .lh-policies { background: #1a2420; }
        body.dark-mode .lh-card { background: #1c2822; border-color: rgba(255,255,255,0.07); }
        body.dark-mode .lh-card-title { color: #c8d4cc; }
        body.dark-mode .lh-card-highlights { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .lh-card-foot { border-color: rgba(255,255,255,0.07); }
        body.dark-mode .lh-card-link { color: #c8d4cc; }
        body.dark-mode .lh-trust { background: #111a15; }
        body.dark-mode .lh-trust-inner { background: rgba(255,255,255,0.04); }
        body.dark-mode .lh-trust-item { background: #111a15; }
        body.dark-mode .lh-contact { background: #161e1a; }
        body.dark-mode .lh-contact-title { color: #c8d4cc; }
        body.dark-mode .lh-contact-item { background: #1c2822; border-color: rgba(255,255,255,0.07); color: rgba(180,200,188,0.6); }

        /* ══════════════ RESPONSIVE ══════════════ */
        @media (max-width: 1100px) {
          .lh-hero, .lh-policies, .lh-trust, .lh-contact {
            padding-left: 40px; padding-right: 40px;
          }
        }
        @media (max-width: 900px) {
          .lh-policies-grid { grid-template-columns: 1fr; max-width: 560px; }
          .lh-trust-inner { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .lh-trust-inner { grid-template-columns: 1fr; }
          .lh-hero { padding: 120px 24px 64px; }
          .lh-policies, .lh-contact { padding-left: 24px; padding-right: 24px; }
          .lh-card-head, .lh-card-body, .lh-card-foot { padding-left: 24px; padding-right: 24px; }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb-item">Trang chủ</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Pháp lý</span>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="lh-hero">
        <div className="lh-hero-grid" />
        <div className="lh-hero-glow" />
        <div className="lh-hero-watermark">PHÁP LÝ</div>
        <div className="lh-hero-inner">
          <div className="lh-hero-badge">
            <div className="lh-hero-badge-dot" />
            <span>Tài Liệu Pháp Lý Earthoria</span>
          </div>
          <h1 className="lh-hero-title">
            Minh Bạch<br />
            Là <em>Nền Tảng</em> Tin Tưởng
          </h1>
          <p className="lh-hero-sub">
            Tất cả các chính sách điều chỉnh dịch vụ của Earthoria — được viết
            rõ ràng, cập nhật thường xuyên và luôn đặt quyền lợi của gia đình
            bạn lên trước.
          </p>
        </div>
      </section>

      {/* ═══ POLICY CARDS ═══ */}
      <section className="lh-policies">
        <div className="lh-policies-grid">
          {POLICIES.map((p, i) => (
            <article className={`lh-card reveal reveal-delay-${i + 1}`} key={i}>
              <div className="lh-card-head">
                <div className="lh-card-icon">
                  <p.icon size={22} />
                </div>
                <div className="lh-card-meta">
                  <span className="lh-card-version">{p.version}</span>
                  <span className="lh-card-updated">Cập nhật {p.updated}</span>
                </div>
              </div>

              <div className="lh-card-body">
                <div className="lh-card-eyebrow">{p.eyebrow}</div>
                <h2 className="lh-card-title">{p.title}</h2>
                <p className="lh-card-desc">{p.desc}</p>
                <ul className="lh-card-highlights">
                  {p.highlights.map((h, j) => (
                    <li className="lh-card-highlight" key={j}>
                      <span className="lh-highlight-dot" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lh-card-foot">
                <Link to={p.to} className="lh-card-link">
                  {p.label}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="lh-trust">
        <div className="lh-trust-inner">
          {TRUST_ITEMS.map((t, i) => (
            <div className="lh-trust-item reveal" key={i}>
              <t.icon size={18} />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="lh-contact">
        <div className="lh-contact-watermark">EARTHORIA</div>
        <div className="lh-contact-inner">
          <span className="lh-contact-eyebrow reveal">Hỗ Trợ Pháp Lý</span>
          <h2 className="lh-contact-title reveal">
            Vẫn còn câu hỏi về<br />
            <em>quyền lợi của bạn?</em>
          </h2>
          <p className="lh-contact-sub reveal">
            Đội ngũ Earthoria sẵn sàng giải đáp mọi thắc mắc liên quan đến
            điều khoản, bảo mật hoặc vận chuyển — từ thứ Hai đến Chủ Nhật.
          </p>
          <div className="lh-contact-grid reveal">
            <a href="mailto:legal@earthoria.vn" className="lh-contact-item">
              <Mail size={15} />
              legal@earthoria.vn
            </a>
            <a href="tel:19006868" className="lh-contact-item">
              <Phone size={15} />
              1900 6868
            </a>
            <span className="lh-contact-item">
              <MapPin size={15} />
              Tầng 12, Tòa nhà Earthoria, Q.1, TP.HCM
            </span>
          </div>
        </div>
      </section>
    </>
  );
}