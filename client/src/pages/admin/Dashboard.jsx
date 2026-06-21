// Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, ShoppingBag, TrendingUp, ArrowUpRight } from 'lucide-react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS } from '../../utils/constants'
import AdminLayout from './AdminLayout'

const statusStyle = {
  PENDING:   { bg: 'rgba(201,168,76,0.12)',  color: '#A07828' },
  CONFIRMED: { bg: 'rgba(13,51,48,0.10)',    color: '#0D3330' },
  SHIPPING:  { bg: 'rgba(74,124,95,0.12)',   color: '#3A7A5A' },
  DELIVERED: { bg: 'rgba(50,160,100,0.12)',  color: '#288A55' },
  CANCELLED: { bg: 'rgba(192,80,80,0.10)',   color: '#B84040' },
  REFUNDED:  { bg: 'rgba(192,80,80,0.07)',   color: '#B84040' },
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data)
  })
  const stats = data?.stats

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers ?? '—',     icon: Users,       delta: '+12%', accent: '#3B82F6' },
    { label: 'Đầu sách',        value: stats?.totalBooks ?? '—',     icon: BookOpen,    delta: '+4%',  accent: '#C9A84C' },
    { label: 'Đơn hàng',        value: stats?.totalOrders ?? '—',    icon: ShoppingBag, delta: '+18%', accent: '#10B981' },
    { label: 'Doanh thu',       value: isLoading ? '—' : formatPrice(stats?.revenue || 0), icon: TrendingUp, delta: '+9%', accent: '#8B5CF6' },
  ]

  return (
    <AdminLayout currentPath="/admin">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>Tổng quan</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 300, color: '#0D3330', lineHeight: 1.15 }}>
          Dashboard <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>Earthoria</em>
        </h1>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 20, marginBottom: 36 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i} style={{
              background: '#fff', borderRadius: 10,
              border: '1px solid rgba(13,51,48,0.08)',
              padding: '24px 22px',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.accent, borderRadius: '10px 10px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.45)', fontWeight: 500 }}>{card.label}</span>
                <div style={{ width: 34, height: 34, background: card.accent + '1A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.accent }}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
              </div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 300, color: '#0D3330', lineHeight: 1, marginBottom: 8 }}>
                {isLoading ? '—' : card.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#288A55' }}>
                <ArrowUpRight size={12} />
                <span>{card.delta} so với tháng trước</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent orders */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(13,51,48,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(13,51,48,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 400, color: '#0D3330' }}>
            Đơn hàng <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>gần đây</em>
          </h3>
          <a href="/admin/orders" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A84C', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả <ArrowUpRight size={12} />
          </a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8' }}>
                {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Đang tải...</td></tr>
              ) : data?.recentOrders?.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Chưa có đơn hàng nào</td></tr>
              ) : data?.recentOrders?.map(order => (
                <tr key={order.id} style={{ borderTop: '1px solid rgba(13,51,48,0.06)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontSize: 11, color: 'rgba(13,51,48,0.4)', fontFamily: 'monospace' }}>{order.id.slice(0, 8)}...</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#0D3330', fontWeight: 400 }}>{order.user?.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(13,51,48,0.5)' }}>{order.items?.length} sản phẩm</td>
                  <td style={{ padding: '14px 20px', fontFamily: 'Playfair Display, serif', fontSize: 15, color: '#0D3330' }}>{formatPrice(order.total)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, fontWeight: 500, ...(statusStyle[order.status] || statusStyle.PENDING) }}>
                      {ORDER_STATUS[order.status]}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}