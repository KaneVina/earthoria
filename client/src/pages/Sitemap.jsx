import { useEffect } from 'react'
import { Link } from 'react-router-dom'

// ─── DATA: các section người dùng thấy được ─────────────────────────────────

const SECTIONS = [
  {
    id: 'kham-pha',
    eyebrow: '01',
    title: 'Khám Phá',
    color: 'var(--gold)',
    links: [
      { label: 'Trang Chủ',        sub: 'Giới thiệu Earthoria & tính năng nổi bật',  to: '/' },
      { label: 'Cửa Hàng',         sub: 'Duyệt và mua sách theo chủ đề',             to: '/shop' },
      { label: 'Chi Tiết Sách',    sub: 'Xem thông tin, AR preview & đánh giá sản phẩm', to: '/shop' },
      { label: 'Hướng Dẫn AR',     sub: 'Cách sử dụng Thực tế Tăng cường trên sách', to: '/ar' },
    ],
  },
  {
    id: 'noi-dung',
    eyebrow: '02',
    title: 'Nội Dung',
    color: 'var(--forest-light)',
    links: [
      { label: 'Blog',             sub: 'Bài viết về giáo dục, thiên nhiên & công nghệ', to: '/blog' },
      { label: 'Về Chúng Tôi',     sub: 'Câu chuyện Earthoria, đội ngũ & sứ mệnh',    to: '/about' },
    ],
  },
  {
    id: 'tai-khoan',
    eyebrow: '03',
    title: 'Tài Khoản',
    color: 'var(--sage)',
    links: [
      { label: 'Đăng Nhập',        sub: 'Đăng nhập bằng email hoặc Google',           to: '/login' },
      { label: 'Đăng Ký',          sub: 'Tạo tài khoản mới — miễn phí',               to: '/register' },
      { label: 'Quên Mật Khẩu',    sub: 'Khôi phục mật khẩu qua email',               to: '/forgot-password' },
      { label: 'Hồ Sơ Của Tôi',    sub: 'Thông tin cá nhân & lịch sử mua hàng',       to: '/profile' },
    ],
  },
  {
    id: 'mua-hang',
    eyebrow: '04',
    title: 'Mua Hàng',
    color: 'var(--forest-mid)',
    links: [
      { label: 'Giỏ Hàng',         sub: 'Xem và chỉnh sửa sản phẩm đã chọn',         to: '/cart' },
      { label: 'Thanh Toán',        sub: 'Hoàn tất đơn hàng & chọn phương thức thanh toán', to: '/checkout' },
    ],
  },
  {
    id: 'phap-ly',
    eyebrow: '05',
    title: 'Pháp Lý',
    color: 'var(--mist)',
    links: [
      { label: 'Trung Tâm Pháp Lý', sub: 'Tổng hợp các chính sách của Earthoria',    to: '/legal' },
      { label: 'Điều Khoản Dịch Vụ', sub: 'Quy định sử dụng nền tảng',              to: '/legal/terms' },
      { label: 'Chính Sách Quyền Riêng Tư', sub: 'Cách chúng tôi bảo vệ dữ liệu của bạn', to: '/legal/privacy' },
      { label: 'Chính Sách Vận Chuyển', sub: 'Thời gian & phí giao hàng',            to: '/legal/shipping' },
    ],
  },
]

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Sitemap() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* ── BREADCRUMB ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 100px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px' }}>
          <Link to="/" style={{
            fontSize: '11px', letterSpacing: '0.1em', color: 'var(--text-muted)',
            textDecoration: 'none', transition: 'color 0.3s',
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}
            onMouseEnter={e => e.target.style.color = 'var(--gold)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >Trang Chủ</Link>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.4 }}>›</span>
          <span style={{
            fontSize: '11px', letterSpacing: '0.1em', color: 'var(--forest)',
            fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 400,
          }}>Sơ Đồ Website</span>
        </div>

        {/* ── HERO TITLE ── */}
        <div className="reveal" style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '40px', height: '0.5px', background: 'var(--gold)' }} />
            <span style={{
              fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--gold)', fontFamily: "'Be Vietnam Pro', sans-serif",
            }}>Earthoria · Cấu trúc điều hướng</span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(40px, 5vw, 72px)',
            fontWeight: 300, lineHeight: 1.08,
            color: 'var(--forest)', letterSpacing: '-0.01em',
            marginBottom: '16px',
          }}>
            Sơ Đồ <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Website</em>
          </h1>
          <p style={{
            fontSize: '14px', color: 'var(--text-muted)', fontWeight: 300,
            lineHeight: 1.8, maxWidth: '480px',
            fontFamily: "'Be Vietnam Pro', sans-serif",
          }}>
            Toàn bộ các trang của Earthoria — nhấn vào bất kỳ liên kết nào để đến ngay trang đó.
          </p>
        </div>

        {/* ── SECTIONS ── */}
        {SECTIONS.map((sec, si) => (
          <section
            key={sec.id}
            className="reveal"
            style={{
              marginBottom: '64px',
              paddingBottom: '64px',
              borderBottom: si < SECTIONS.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}
          >
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '36px' }}>
              <span style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '11px', color: 'var(--text-muted)',
                letterSpacing: '0.1em', opacity: 0.5,
              }}>{sec.eyebrow}</span>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(20px, 2.2vw, 28px)',
                fontWeight: 400, color: sec.color,
                letterSpacing: '-0.01em', lineHeight: 1,
              }}>{sec.title}</h2>
            </div>

            {/* Link grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '0',
            }}>
              {sec.links.map((link, li) => (
                <LinkRow key={li} link={link} color={sec.color} />
              ))}
            </div>
          </section>
        ))}

        {/* ── BOTTOM NOTE ── */}
        <div className="reveal" style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '32px 0', marginBottom: '80px',
          borderTop: '0.5px solid var(--border)',
        }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '13px', fontStyle: 'italic',
            color: 'var(--text-muted)',
          }}>
            Earthoria © 2026 · FPT University Cần Thơ · EXE101 Group 05
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--gold)', textDecoration: 'none',
              borderBottom: '0.5px solid var(--gold-light)', paddingBottom: '3px',
              transition: 'gap 0.3s',
            }}
              onMouseEnter={e => e.currentTarget.style.gap = '14px'}
              onMouseLeave={e => e.currentTarget.style.gap = '8px'}
            >
              Về Trang Chủ
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── LINK ROW ITEM ────────────────────────────────────────────────────────────

function LinkRow({ link, color }) {
  return (
    <Link
      to={link.to}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', padding: '20px 0',
        borderBottom: '0.5px solid var(--border)',
        textDecoration: 'none',
        transition: 'padding-left 0.3s ease',
        marginRight: '48px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.paddingLeft = '10px'
        e.currentTarget.querySelector('.link-label').style.color = color
        e.currentTarget.querySelector('.link-arrow').style.opacity = '1'
        e.currentTarget.querySelector('.link-arrow').style.transform = 'translateX(0)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.paddingLeft = '0'
        e.currentTarget.querySelector('.link-label').style.color = 'var(--forest)'
        e.currentTarget.querySelector('.link-arrow').style.opacity = '0'
        e.currentTarget.querySelector('.link-arrow').style.transform = 'translateX(-6px)'
      }}
    >
      <div>
        <div
          className="link-label"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(15px, 1.4vw, 18px)',
            fontWeight: 400, color: 'var(--forest)',
            marginBottom: '4px', lineHeight: 1.2,
            transition: 'color 0.25s',
          }}
        >{link.label}</div>
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)',
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontWeight: 300, lineHeight: 1.5,
        }}>{link.sub}</div>
      </div>
      <div
        className="link-arrow"
        style={{
          flexShrink: 0, color,
          opacity: 0, transform: 'translateX(-6px)',
          transition: 'opacity 0.25s, transform 0.25s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </Link>
  )
}