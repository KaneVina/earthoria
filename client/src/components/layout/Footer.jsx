import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(-45deg)' }}>
                <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="#4a9e3f" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <div className="footer-brand-name">The Earthoria Ecosystem</div>
            <p className="footer-brand-desc">Mở sách, mở ra thế giới qua lăng kính AR & AI.</p>
            <div className="footer-social">
              <a href="https://facebook.com/Earthoriavn" target="_blank" rel="noreferrer" className="social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                Nhận thông báo mới
              </div>
              <div style={{ display: 'flex' }}>
                <input type="email" placeholder="Email của bạn" style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.1)', borderRight: 'none',
                  padding: '10px 14px', fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)', outline: 'none'
                }}/>
                <button style={{
                  background: 'var(--gold)', border: 'none',
                  padding: '10px 16px', cursor: 'pointer',
                  color: 'var(--ink)', fontSize: '13px'
                }}>→</button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Sản Phẩm</h4>
            <ul className="footer-links">
              <li><Link to="/shop">Sách AR Thiên Nhiên</Link></li>
              <li><Link to="/shop">Sách AR Khoa Học</Link></li>
              <li><Link to="/shop">Hướng dẫn AR</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Công Ty</h4>
            <ul className="footer-links">
              <li><Link to="/about">Về chúng tôi</Link></li>
              <li><a href="mailto:earthoriavn@gmail.com">Liên hệ</a></li>
              <li><a href="#">Chính sách giao hàng</a></li>
              <li><a href="#">Bảo mật</a></li>
              <li><a href="#">Điều khoản</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Tải Ứng Dụng</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <a href="#" className="footer-app-btn">
                <img src="/ios-vn.png" alt="Tải trên App Store" />
              </a>
              <a href="#" className="footer-app-btn">
                <img src="/androi-vn.png" alt="Tải trên Google Play" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">&copy; 2026 Earthoria. All rights reserved.</span>
          <span className="footer-tagline">Mở sách — Mở ra thế giới</span>
        </div>
      </div>

      <style>{`
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
  )
}