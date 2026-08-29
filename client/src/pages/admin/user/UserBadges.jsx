/* ─ TierBadge — hiển thị hạng thành viên (I, II, III...) đồng bộ với hệ thống loyalty ─
   Dùng chung giữa Users.jsx (cột "Hạng" trong danh sách) và UserDetailDrawer.jsx (chi tiết). */
export function TierBadge({ tier, size = 'sm' }) {
  if (!tier) return <span className="a-td-muted" style={{ fontSize: 11 }}>—</span>
  const dims = size === 'sm' ? 18 : 34
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} title={tier.name}>
      {tier.image ? (
        <img
          src={tier.image}
          alt={tier.name}
          style={{ width: dims, height: dims, objectFit: 'contain', flexShrink: 0 }}
        />
      ) : (
        <span style={{ fontSize: dims * 0.7 }}>{tier.emoji}</span>
      )}
      <span
        className="a-badge"
        style={{
          background: tier.colorSoft || 'rgba(13,51,48,0.08)',
          color: tier.color || 'var(--a-ink)',
        }}
      >
        Hạng {tier.roman}
      </span>
    </div>
  )
}