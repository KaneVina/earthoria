import { useQuery } from '@tanstack/react-query'
 import { X, ShieldAlert, Baby, ShoppingBag } from 'lucide-react'
import api from '../../../services/api'
import { formatDate, formatPrice } from '../../../utils/helpers'

/* ─ Avatar color pool (deterministic by first char) — đồng bộ với Users.jsx ─ */
const AVATAR_COLORS = [
  '#0D3330', '#2a78d6', '#4a3aa7', '#4a9e3f', '#eda100', '#e34948',
]
const avatarColor = (name = '') =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const ROLE_CONFIG = {
  ADMIN:    { label: 'Admin',    cls: 'dark'    },
  STAFF:    { label: 'Staff',    cls: 'blue'    },
  DEALER:   { label: 'Dealer',   cls: 'purple'  },
  CUSTOMER: { label: 'Customer', cls: 'neutral' },
}

const ORDER_STATUS_LABEL = {
  PENDING:   'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING:  'Vận chuyển',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Hủy đơn',
  REFUNDED:  'Hoàn tiền',
}

const ORDER_BADGE = {
  PENDING:   'warning',
  CONFIRMED: 'info',
  SHIPPING:  'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED:  'danger',
}

const GENDER_LABEL = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'rgba(13,51,48,0.38)', marginBottom: 10, fontWeight: 500,
    }}>
      {Icon && <Icon size={12} />}
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '9px 0', borderBottom: '1px solid rgba(13,51,48,0.05)',
      fontSize: 12.5,
    }}>
      <span style={{ color: 'rgba(13,51,48,0.45)' }}>{label}</span>
      <span style={{ color: 'var(--a-ink)', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function UserDetailDrawer({ userId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api.get(`/admin/users/${userId}/detail`).then(r => r.data.data),
    enabled: !!userId,
  })

  if (!userId) return null

  const roleCfg = data ? (ROLE_CONFIG[data.role] ?? ROLE_CONFIG.CUSTOMER) : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: 440, maxWidth: '100%', background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(13,51,48,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)' }}>
            Chi tiết tài khoản
          </div>
          <button className="a-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        {isLoading || !data ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>
            Đang tải...
          </div>
        ) : (
          <div style={{ padding: 24, flex: 1 }}>

            {/* Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                className="a-user-avatar"
                style={{ width: 48, height: 48, fontSize: 18, background: avatarColor(data.name) }}
              >
                {data.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{data.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.5)' }}>{data.email}</div>
              </div>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className={`a-badge ${roleCfg.cls}`}>{roleCfg.label}</span>
              <span className={`a-badge ${data.isActive ? 'success' : 'danger'}`}>
                {data.isActive ? 'Hoạt động' : 'Đã khóa'}
              </span>
              {data.userCode && (
                <code style={{
                  fontSize: 10.5, fontFamily: 'monospace', background: 'rgba(13,51,48,0.06)',
                  padding: '3px 9px', borderRadius: 20, color: 'var(--a-ink)', letterSpacing: '0.03em',
                }}>
                  {data.userCode}
                </code>
              )}
            </div>

            {/* Lock reason (nếu đang bị khóa) */}
            {!data.isActive && data.lockReason && (
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'rgba(192,80,80,0.06)', border: '1px solid rgba(192,80,80,0.18)',
                borderRadius: 8, padding: '12px 14px', marginBottom: 20,
              }}>
                <ShieldAlert size={15} color="#b23a30" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#7a4440', marginBottom: 3 }}>
                    Lý do khóa {data.lockedAt && `· ${formatDate(data.lockedAt)}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#7a4440', lineHeight: 1.6 }}>
                    {data.lockReason}
                  </div>
                </div>
              </div>
            )}

            {/* Account info */}
            <div style={{ marginBottom: 22 }}>
              <SectionTitle>Thông tin tài khoản</SectionTitle>
              <InfoRow label="Số điện thoại" value={data.phone || '—'} />
              <InfoRow label="Giới tính" value={data.gender ? (GENDER_LABEL[data.gender] ?? data.gender) : '—'} />
              <InfoRow label="Ngày sinh" value={data.dob ? formatDate(data.dob) : '—'} />
              <InfoRow label="Ngày đăng ký" value={formatDate(data.createdAt)} />
              <InfoRow label="Cập nhật gần nhất" value={formatDate(data.updatedAt)} />
            </div>

            {/* Kid accounts */}
            <div style={{ marginBottom: 22 }}>
              <SectionTitle icon={Baby}>
                Tài khoản Kid ({data._count?.children ?? 0})
              </SectionTitle>
              {!data.children?.length ? (
                <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.35)', padding: '8px 0' }}>
                  Chưa có tài khoản kid nào.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.children.map(child => (
                    <div key={child.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--a-surface)', borderRadius: 8, padding: '9px 12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: child.avatarColor || '#4a9e3f',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13,
                        }}>
                          {child.avatarEmoji || '🦊'}
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{child.name}</div>
                          <div style={{ fontSize: 10.5, color: 'rgba(13,51,48,0.4)' }}>
                            {formatDate(child.dob)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {child.isLocked && <span className="a-badge danger">Khóa AR</span>}
                        <span className={`a-badge ${child.isActive ? 'success' : 'neutral'}`}>
                          {child.isActive ? 'Hoạt động' : 'Đã ẩn'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders */}
            <div>
              <SectionTitle icon={ShoppingBag}>
                Đơn hàng ({data._count?.orders ?? 0}) · Đã mua {formatPrice(data.totalSpent ?? 0)}
              </SectionTitle>
              {!data.orders?.length ? (
                <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.35)', padding: '8px 0' }}>
                  Chưa có đơn hàng nào.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.orders.map(order => (
                    <div key={order.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--a-surface)', borderRadius: 8, padding: '9px 12px',
                    }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--a-ink)' }}>
                          #{order.id.slice(0, 10)}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'rgba(13,51,48,0.4)' }}>
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`a-badge ${ORDER_BADGE[order.status] ?? 'neutral'}`}>
                          {ORDER_STATUS_LABEL[order.status] ?? order.status}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  ))}
                  {data._count?.orders > data.orders.length && (
                    <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.35)', textAlign: 'center', padding: '4px 0' }}>
                      + {data._count.orders - data.orders.length} đơn hàng khác
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}