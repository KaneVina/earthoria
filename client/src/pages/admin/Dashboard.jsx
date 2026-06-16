import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, ShoppingBag, DollarSign, TrendingUp, Package } from 'lucide-react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS } from '../../utils/constants'

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data)
  })

  const stats = data?.stats

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: <Users size={20}/>, color: 'var(--forest)' },
    { label: 'Tổng sách', value: stats?.totalBooks || 0, icon: <BookOpen size={20}/>, color: 'var(--gold)' },
    { label: 'Tổng đơn hàng', value: stats?.totalOrders || 0, icon: <ShoppingBag size={20}/>, color: 'var(--forest-mid)' },
    { label: 'Doanh thu', value: formatPrice(stats?.revenue || 0), icon: <DollarSign size={20}/>, color: 'var(--sage)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="eyebrow-line"></div>
            <span className="eyebrow-text">Admin Panel</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(32px,4vw,56px)', fontWeight: 300, color: 'var(--forest)' }}>
            Dashboard <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Earthoria</em>
          </h1>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '48px', flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Sản phẩm', href: '/admin/products' },
            { label: 'Đơn hàng', href: '/admin/orders' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Mã giảm giá', href: '/admin/coupons' },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <button className={`pill ${tab.href === '/admin' ? 'active' : ''}`}>{tab.label}</button>
            </a>
          ))}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px', marginBottom: '48px' }}>
          {statCards.map((card, i) => (
            <div key={i} style={{
              background: 'var(--white)', border: '0.5px solid var(--border)',
              padding: '32px 28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{card.label}</span>
                <div style={{ width: '36px', height: '36px', border: '0.5px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '36px', fontWeight: 300, color: 'var(--forest)', lineHeight: 1 }}>
                {isLoading ? '—' : card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)' }}>
          <div style={{ padding: '24px 32px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '22px', fontWeight: 400, color: 'var(--forest)' }}>
              Đơn hàng <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>gần đây</em>
            </h3>
            <a href="/admin/orders" style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none' }}>Xem tất cả →</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
                ) : data?.recentOrders?.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn hàng</td></tr>
                ) : data?.recentOrders?.map(order => (
                  <tr key={order.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.id.slice(0,8)}...</td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--forest)' }}>{order.user?.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-muted)' }}>{order.items?.length} sản phẩm</td>
                    <td style={{ padding: '16px 24px', fontFamily: 'Playfair Display,serif', fontSize: '16px', color: 'var(--forest)' }}>{formatPrice(order.total)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
                        padding: '4px 10px',
                        background: order.status === 'DELIVERED' ? 'var(--gold-pale)' : order.status === 'CANCELLED' ? 'rgba(192,80,80,0.08)' : 'var(--pale)',
                        color: order.status === 'DELIVERED' ? 'var(--gold)' : order.status === 'CANCELLED' ? '#c05050' : 'var(--text-muted)'
                      }}>
                        {ORDER_STATUS[order.status]}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}