// Orders.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../utils/constants'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const statusStyle = {
  PENDING:   { bg: 'rgba(201,168,76,0.12)',  color: '#A07828' },
  CONFIRMED: { bg: 'rgba(13,51,48,0.10)',    color: '#0D3330' },
  SHIPPING:  { bg: 'rgba(74,124,95,0.12)',   color: '#3A7A5A' },
  DELIVERED: { bg: 'rgba(50,160,100,0.12)',  color: '#288A55' },
  CANCELLED: { bg: 'rgba(192,80,80,0.10)',   color: '#B84040' },
  REFUNDED:  { bg: 'rgba(192,80,80,0.07)',   color: '#B84040' },
}

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

  return (
    <AdminLayout currentPath="/admin/orders">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>Quản lý</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,2.5vw,34px)', fontWeight: 300, color: '#0D3330' }}>
          Đơn <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>Hàng</em>
        </h1>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <button onClick={() => setStatus('')} style={filterPill(!status)}>Tất cả</button>
        {Object.entries(ORDER_STATUS).map(([key, val]) => (
          <button key={key} onClick={() => setStatus(key)} style={filterPill(status === key)}>{val}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(13,51,48,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAF8' }}>
              {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Cập nhật'].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Đang tải...</td></tr>
            ) : data?.orders?.map(order => (
              <tr key={order.id} style={{ borderTop: '1px solid rgba(13,51,48,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px', fontSize: 11, color: 'rgba(13,51,48,0.4)', fontFamily: 'monospace' }}>{order.id.slice(0, 8)}...</td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 13, color: '#0D3330', fontWeight: 500 }}>{order.user?.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.4)' }}>{order.user?.email}</div>
                </td>
                <td style={{ padding: '14px 18px', fontFamily: 'Playfair Display, serif', fontSize: 15, color: '#0D3330' }}>{formatPrice(order.total)}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: order.paymentStatus === 'PAID' ? 'rgba(50,160,100,0.12)' : 'rgba(13,51,48,0.07)', color: order.paymentStatus === 'PAID' ? '#288A55' : 'rgba(13,51,48,0.45)' }}>
                    {PAYMENT_STATUS[order.paymentStatus]}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', ...(statusStyle[order.status] || statusStyle.PENDING) }}>
                    {ORDER_STATUS[order.status]}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>{formatDate(order.createdAt)}</td>
                <td style={{ padding: '14px 18px' }}>
                  <select
                    value={order.status}
                    onChange={e => updateMutation.mutate({ id: order.id, data: { status: e.target.value } })}
                    style={{ fontSize: 12, border: '1px solid rgba(13,51,48,0.15)', borderRadius: 6, padding: '5px 10px', background: '#F7F6F2', color: '#0D3330', cursor: 'pointer', outline: 'none', fontFamily: 'Be Vietnam Pro, sans-serif' }}
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
    </AdminLayout>
  )
}

const filterPill = (active) => ({
  padding: '6px 14px', borderRadius: 20, border: '1px solid',
  borderColor: active ? '#0D3330' : 'rgba(13,51,48,0.15)',
  background: active ? '#0D3330' : 'transparent',
  color: active ? '#F0EDE6' : 'rgba(13,51,48,0.6)',
  cursor: 'pointer', fontSize: 12, fontFamily: 'Be Vietnam Pro, sans-serif',
  fontWeight: active ? 500 : 400, transition: 'all 0.15s',
})