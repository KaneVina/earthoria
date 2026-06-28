// Orders.jsx — Admin order management
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, X } from 'lucide-react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

/* ── Constants ── */
export const ORDER_STATUS = {
  PENDING:   'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING:  'Vận chuyển',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Hủy đơn',
  REFUNDED:  'Hoàn tiền',
}

export const PAYMENT_STATUS = {
  PENDING: 'Chưa TT',
  PAID:    'Đã TT',
  FAILED:  'Thất bại',
  REFUNDED:'Hoàn tiền',
}

const ORDER_BADGE = {
  PENDING:   'warning',
  CONFIRMED: 'info',
  SHIPPING:  'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED:  'danger',
}

const PAY_BADGE = {
  PENDING:  'neutral',
  PAID:     'success',
  FAILED:   'danger',
  REFUNDED: 'warning',
}

/* ── Order detail drawer (mini) ── */
function OrderDrawer({ order, onClose }) {
  if (!order) return null
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
      }} onClick={onClose} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: 400, background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(13,51,48,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#fff', zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 3 }}>
              Chi tiết đơn hàng
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--a-ink)', fontWeight: 600 }}>
              #{order.id?.slice(0, 12)}
            </div>
          </div>
          <button className="a-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, flex: 1 }}>
          {/* Customer */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.38)', marginBottom: 10, fontWeight: 500 }}>Khách hàng</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="a-user-avatar">{order.user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{order.user?.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.45)' }}>{order.user?.email}</div>
              </div>
            </div>
          </div>

          {/* Status row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <span className={`a-badge ${ORDER_BADGE[order.status] ?? 'neutral'}`}>
              {ORDER_STATUS[order.status]}
            </span>
            <span className={`a-badge ${PAY_BADGE[order.paymentStatus] ?? 'neutral'}`}>
              {PAYMENT_STATUS[order.paymentStatus]}
            </span>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div style={{ marginBottom: 20, background: 'var(--a-surface)', borderRadius: 8, padding: '13px 16px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.38)', marginBottom: 7, fontWeight: 500 }}>Địa chỉ giao hàng</div>
              <div style={{ fontSize: 12, color: 'var(--a-ink)', lineHeight: 1.6 }}>
                {order.shippingAddress.name}<br />
                {order.shippingAddress.phone}<br />
                {order.shippingAddress.address}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.38)', marginBottom: 10, fontWeight: 500 }}>
              Sản phẩm ({order.items?.length ?? 0})
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '10px 0',
                borderBottom: '1px solid rgba(13,51,48,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div className="a-book-thumb" style={{ width: 28, height: 38 }}><span style={{ fontSize: 8 }}>📚</span></div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{item.product?.title ?? item.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.4)' }}>× {item.quantity}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--a-font-serif)', fontSize: 13 }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(13,51,48,0.08)' }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>Tổng cộng</span>
            <span style={{ fontFamily: 'var(--a-font-serif)', fontSize: 18, color: 'var(--a-ink)', fontWeight: 400 }}>{formatPrice(order.total)}</span>
          </div>

          {/* Coupon */}
          {order.couponCode && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(13,51,48,0.5)' }}>
              Mã giảm giá: <span className="a-code-badge">{order.couponCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const qc = useQueryClient()

  const [page, setPage]         = useState(1)
  const [status, setStatus]     = useState('')
  const [selected, setSelected] = useState(null)

  /* ── Data ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn:  () => api.get('/admin/orders', { params: { page, limit: 15, status } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/orders/${id}`, { status }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!')
      qc.invalidateQueries(['admin-orders'])
    },
    onError: () => toast.error('Cập nhật thất bại!'),
  })

  const orders     = data?.orders     ?? []
  const totalPages = data?.totalPages ?? 1
  const total      = data?.total      ?? 0

  return (
    <AdminLayout>

      {/* ── Header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Đơn <em>Hàng</em></h1>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>
          Tổng <strong style={{ color: 'var(--a-ink)' }}>{total}</strong> đơn
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div className="a-pills">
        <button
          className={`a-pill${!status ? ' active' : ''}`}
          onClick={() => { setStatus(''); setPage(1) }}
        >
          Tất cả
        </button>
        {Object.entries(ORDER_STATUS).map(([key, label]) => (
          <button
            key={key}
            className={`a-pill${status === key ? ' active' : ''}`}
            onClick={() => { setStatus(key); setPage(1) }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Cập nhật'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !orders.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(order)}
                >
                  <td className="a-td-mono">{order.id?.slice(0, 8)}...</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{order.user?.name}</div>
                    <div className="a-td-muted">{order.user?.email}</div>
                  </td>
                  <td className="a-td-serif">{formatPrice(order.total)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <span className={`a-badge ${PAY_BADGE[order.paymentStatus] ?? 'neutral'}`}>
                      {PAYMENT_STATUS[order.paymentStatus]}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <span className={`a-badge ${ORDER_BADGE[order.status] ?? 'neutral'}`}>
                      {ORDER_STATUS[order.status]}
                    </span>
                  </td>
                  <td className="a-td-muted">{formatDate(order.createdAt)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className="a-inline-select"
                      value={order.status}
                      onChange={e => updateMutation.mutate({ id: order.id, status: e.target.value })}
                    >
                      {Object.entries(ORDER_STATUS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {total} đơn hàng</span>
          <div className="a-pagination-btns">
            <button
              className="a-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  className={`a-page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              )
            })}
            <button
              className="a-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      </div>

      {/* ── Order detail drawer ── */}
      <OrderDrawer order={selected} onClose={() => setSelected(null)} />

    </AdminLayout>
  )
}