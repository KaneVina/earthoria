import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '120px', fontWeight: 300, color: 'var(--pale)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontWeight: 300, color: 'var(--forest)' }}>
        Trang không tồn tại
      </h1>
      <Link to="/">
        <button className="btn-primary">Về trang chủ</button>
      </Link>
    </div>
  )
}