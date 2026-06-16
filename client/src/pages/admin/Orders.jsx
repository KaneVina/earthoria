import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../utils/constants'
import toast from 'react-hot-toast'

export default function Orders() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: () => api.get('/admin/orders', { params: { page, limit: 15, status } }).then(r => r.data.data)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/orders/${id}`, data),
    onSuccess: () => { toast.success('Cập nhật đơn hàng thành công!'); qc.invalidateQueries(['admin-orders']) },
    onError: () => toast.error('Cập nhật thất bại!')
  })

  const statusColors = {
    PENDING: { bg: 'var(--gold-pale)', color: 'var(--gold)' },
    CONFIRMED: { bg: 'rgba(45,122,110,0.1)', color: 'var(--forest-light)' },
    SHIPPING: { bg: 'rgba(74,124,95,0.1)', color: 'var(--sage)' },
    DELIVERED: { bg: 'var(--gold-pale)', color: 'var(--gold)' },
    CANCELLED: { bg: 'rgba(192,80,80,0.08)', color: '#c05050' },
    REFUNDED: { bg: 'rgba(192,80,80,0.05)', color: '#c05050' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 100px' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div className="eyebrow-line"></div>
            <span className="eyebrow-text">Quản lý</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--forest)' }}>
            Đơn <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Hàng</em>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Sản phẩm', href: '/admin/products' },
            { label: 'Đơn hàng', href: '/admin/orders' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Mã giảm giá', href: '/admin/coupons' },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <button className={`pill ${tab.href === '/admin/orders' ? 'active' : ''}`}>{tab.label}</button>
            </a>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className={`pill ${!status ? 'active' : ''}`} onClick={() => setStatus('')}>Tất cả</button>
          {Object.entries(ORDER_STATUS).map(([key, val]) => (
            <button key={key} className={`pill ${status === key ? 'active' : ''}`} onClick={() => setStatus(key)}>{val}</button>
          ))}
        </div>

        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Hành động'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : data?.orders?.map(order => (
                <tr key={order.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{order.id.slice(0,8)}...</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--forest)', fontWeight: 400 }}>{order.user?.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Playfair Display,serif', fontSize: '16px', color: 'var(--forest)' }}>{formatPrice(order.total)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', padding: '4px 10px', background: order.paymentStatus === 'PAID' ? 'var(--gold-pale)' : 'var(--pale)', color: order.paymentStatus === 'PAID' ? 'var(--gold)' : 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {PAYMENT_STATUS[order.paymentStatus]}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', padding: '4px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', ...statusColors[order.status] }}>
                      {ORDER_STATUS[order.status]}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <select
                      value={order.status}
                      onChange={e => updateMutation.mutate({ id: order.id, data: { status: e.target.value } })}
                      style={{ fontSize: '11px', border: '0.5px solid var(--border)', padding: '6px 10px', background: 'transparent', color: 'var(--forest)', cursor: 'pointer', outline: 'none' }}
                    >
                      {Object.entries(ORDER_STATUS).map(([key, val]) => (
                        <option key={key} value={key}>{val}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}