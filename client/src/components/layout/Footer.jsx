import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          {/* COL 1: Brand + Contact Info + Social + Newsletter */}
          <div>
            <div className="footer-brand-block">
              <img
                src="/logo-footer.png"
                alt="Logo"
                className="footer-logo-img"
              />
              <div className="footer-brand-name">THE EARTHORIA ECOSYSTEM</div>
            </div>
            <p className="footer-brand-desc">
              Mở sách, mở ra thế giới qua lăng kính AR và công nghệ AI.
            </p>

            {/* Contact Info Block */}
            <div className="footer-contact-block">
              <div className="footer-contact-item">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="footer-contact-icon"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.18a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16v.92z" />
                </svg>
                <a href="tel:0849324423" className="footer-contact-link">
                  <b>Điện thoại: </b> 0849 324 423
                </a>
              </div>
              <div className="footer-contact-item">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="footer-contact-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="footer-contact-text">
                  <b>Hoạt động: </b>T2–T6: 7:00–18:00 &nbsp;·&nbsp; T7–CN:
                  8:00–16:00
                </span>
              </div>
              <div className="footer-contact-item footer-contact-item--address">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="footer-contact-icon"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="footer-contact-text">
                  <b>Địa chỉ: </b>600 Nguyễn Văn Cừ Nối Dài, An Bình, Cần Thơ
                  900000
                </span>
              </div>
            </div>

            {/* Newsletter */}
            <div
              style={{
                marginTop: "28px",
                paddingTop: "24px",
                borderTop: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "12px",
                }}
              >
                Nhận thông báo mới
              </div>
              <div style={{ display: "flex" }}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRight: "none",
                    padding: "10px 14px",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    outline: "none",
                  }}
                />
                <button
                  style={{
                    background: "var(--gold)",
                    border: "none",
                    padding: "10px 16px",
                    cursor: "pointer",
                    color: "var(--ink)",
                    fontSize: "13px",
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* COL 2: Sản Phẩm */}
          <div>
            <h4 className="footer-col-title">Sản Phẩm</h4>
            <ul className="footer-links">
              <li>
                <Link to="/shop">Sách AR Thiên Nhiên</Link>
              </li>
              <li>
                <Link to="/shop">Sách AR Khoa Học</Link>
              </li>
              <li>
                <Link to="/shop">Toàn Bộ Sản Phẩm</Link>
              </li>
              <li>
                <Link to="/ar">Hướng Dẫn AR</Link>
              </li>
              <li>
                <Link to="/blog">Blog & Tin Tức</Link>
              </li>
            </ul>

            <h4 className="footer-col-title" style={{ marginTop: "28px" }}>
              Hỗ Trợ
            </h4>
            <ul className="footer-links">
              <li>
                <a
                  href="https://zalo.me/0849324423"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat Zalo
                </a>
              </li>
              <li>
                <a href="mailto:earthoriavn@gmail.com">Gửi Email</a>
              </li>
              <li>
                <a href="tel:0849324423">Gọi Ngay</a>
              </li>
            </ul>
          </div>

          {/* COL 3: Công Ty */}
          <div>
            <h4 className="footer-col-title">Công Ty</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about">Về Chúng Tôi</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/sitemap">Sơ Đồ Trang</Link>
              </li>
              <li>
                <a href="mailto:earthoriavn@gmail.com">Liên Hệ</a>
              </li>
            </ul>

            <h4 className="footer-col-title" style={{ marginTop: "28px" }}>
              Pháp Lý
            </h4>
            <ul className="footer-links">
              <li>
                <Link to="/legal/shipping">Chính Sách Giao Hàng</Link>
              </li>
              <li>
                <Link to="/legal/privacy">Chính Sách Bảo Mật</Link>
              </li>
              <li>
                <Link to="/legal/terms">Điều Khoản Dịch Vụ</Link>
              </li>
              <li>
                <Link to="/legal">Trung Tâm Pháp Lý</Link>
              </li>
            </ul>
          </div>

          {/* COL 4: Tải Ứng Dụng */}
          <div>
            <h4 className="footer-col-title">Tải Ứng Dụng</h4>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.35)",
                lineHeight: "1.6",
                marginBottom: "16px",
                marginTop: "4px",
              }}
            >
              Trải nghiệm AR ngay trên điện thoại — quét sách, khám phá thế giới
              sống động.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <a href="#" className="footer-app-btn">
                <img src="/ios-vn.png" alt="Tải trên App Store" />
              </a>
              <a href="#" className="footer-app-btn">
                <img src="/androi-vn.png" alt="Tải trên Google Play" />
              </a>
            </div>

            <div
              style={{
                marginTop: "28px",
                paddingTop: "20px",
                borderTop: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: "12px",
                }}
              >
                Nền tảng
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {/* Facebook */}
                <a
                  href="https://facebook.com/yourpage"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="footer-social-icon"
                  style={{
                    width: 38,
                    height: 38,
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    transition:
                      "border-color .25s, background .25s, color .25s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "var(--gold)";
                    e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.55)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/yourhandle"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  style={{
                    width: 38,
                    height: 38,
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    transition:
                      "border-color .25s, background .25s, color .25s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "var(--gold)";
                    e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.55)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/in/yourprofile"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  style={{
                    width: 38,
                    height: 38,
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    transition:
                      "border-color .25s, background .25s, color .25s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "var(--gold)";
                    e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.55)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/yourhandle"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  style={{
                    width: 38,
                    height: 38,
                    border: "1.5px solid rgba(255,255,255,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    transition:
                      "border-color .25s, background .25s, color .25s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--gold)";
                    e.currentTarget.style.background = "var(--gold)";
                    e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.55)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          {/* Copyright — đồng bộ với footer-links a */}
          <span
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: "13px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.01em",
            }}
          >
            &copy; 2026 Earthoria. All rights reserved
          </span>
          <span className="footer-tagline">Phiên bản thử nghiệm Beta 26.4.1</span>
        </div>
      </div>

      <style>{`
        .footer-contact-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          margin-bottom: 18px;
        }
        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-contact-item--address {
          align-items: flex-start;
        }
        .footer-contact-icon {
          color: rgba(74,158,63,0.7);
          flex-shrink: 0;
        }
        .footer-contact-link {
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-contact-link:hover {
          color: #4a9e3f;
        }
        .footer-contact-text {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          line-height: 1.5;
        }

        .social-btn--zalo {
          font-size: 13px;
          font-weight: 700;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-badge {
          font-size: 9px;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.3);
          border: 0.5px solid rgba(255,255,255,0.12);
          padding: 4px 8px;
          white-space: nowrap;
        }

        .footer-links li a {
          position: relative;
          transition: all 0.25s ease;
          display: inline-block;
          text-decoration: none;
        }
        .footer-links li a::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #4a9e3f, #a8d96f);
          transition: width 0.3s ease;
        }
        .footer-links li a:hover {
          background: linear-gradient(90deg, #4a9e3f, #a8d96f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .footer-links li a:hover::after {
          width: 100%;
        }
        .footer-app-btn {
          display: block;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .footer-app-btn:hover {
          opacity: 0.85;
          transform: translateY(-2px);
        }
        .footer-app-btn img {
          height: 40px;
          width: auto;
          display: block;
        }
      `}</style>
    </footer>
  );
}
