// src/components/FullScreenLoader.jsx
export default function FullScreenLoader({ message = 'Đang tải...' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      flexDirection: 'column', gap: '16px'
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="var(--forest)" strokeWidth="1.5"
        style={{ animation: 'spin .7s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
        {message}
      </p>
    </div>
  )
}