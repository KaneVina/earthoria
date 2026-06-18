import { Link, useNavigate } from 'react-router-dom'
import { MapPinOff, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        <Home size={12} />
        <span>/</span>
        <span>trang không tồn tại</span>
      </div>

      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 'clamp(80px, 20vw, 140px)',
        fontWeight: 300,
        lineHeight: 1,
        letterSpacing: '-4px',
        color: 'var(--forest)',
        opacity: 0.08,
        userSelect: 'none',
      }}>404</div>

      <div style={{
        width: '64px', height: '64px',
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '-32px auto 28px',
      }}>
        <MapPinOff size={22} color="var(--text-muted)" />
      </div>

      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 400, color: 'var(--forest)', margin: '0 0 12px' }}>
        Trang không tồn tại
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.7, margin: '0 auto 32px' }}>
        Trang bạn tìm kiếm đã bị xóa, đổi tên hoặc tạm thời không thể truy cập.
      </p>

      <div style={{ width: '32px', height: '1px', background: 'var(--border)', margin: '0 auto 28px' }} />

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/">
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={15} /> Về trang chủ
          </button>
        </Link>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Quay lại
        </button>
      </div>
    </div>
  )
}