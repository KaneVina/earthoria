// Coupons.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../services/api'
import { formatDate, formatPrice } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const inputStyle = {
  background: '#F7F6F2', border: '1px solid rgba(13,51,48,0.12)',
  borderRadius: 6, padding: '9px 13px', fontSize: 13, color: '#0D3330',
  outline: 'none', width: '100%', fontFamily: 'Be Vietnam Pro, sans-serif',
  transition: 'border-color 0.15s',
}
const labelStyle = {
  fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'rgba(13,51,48,0.45)', marginBottom: 6, display: 'block', fontWeight: 500,
}

export default function Coupons() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: '' })

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then(r => r.data.data)
  })
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/coupons', data),
    onSuccess: () => {
      toast.success('Tạo mã thành công!')
      qc.invalidateQueries(['admin-coupons'])
      setShowForm(false)
      setForm({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: '' })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })
  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coupons/${id}/toggle`),
    onSuccess: () => { toast.success('Cập nhật!'); qc.invalidateQueries(['admin-coupons']) }
  })

  const activeCount = coupons.filter(c => c.isActive).length

  return (
    <AdminLayout currentPath="/admin/coupons">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>Quản lý</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,2.5vw,34px)', fontWeight: 300, color: '#0D3330' }}>
            Mã Giảm <em style={{ fontStyle: 'italic', color: '#C9A84C' }}>Giá</em>
          </h1>
        </div>
        <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>
          <Plus size={13} /> Tạo mã mới
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Tổng mã', value: coupons.length },
          { label: 'Đang hoạt động', value: activeCount, highlight: true },
          { label: 'Đã tắt', value: coupons.length - activeCount },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid rgba(13,51,48,0.08)', padding: '14px 20px', minWidth: 120 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 300, color: s.highlight ? '#C9A84C' : '#0D3330', lineHeight: 1 }}>{isLoading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(13,51,48,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 400, color: '#0D3330' }}>Tạo mã giảm giá</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(13,51,48,0.35)' }}>×</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} style={{ padding: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Mã code *</label>
                  <input style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.06em' }}
                    value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="VD: EARTH15"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Loại giảm giá *</label>
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Giá trị *</label>
                  <input style={inputStyle} type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required
                    placeholder={form.type === 'PERCENTAGE' ? '15' : '50000'}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Đơn tối thiểu</label>
                  <input style={inputStyle} type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="200000"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Giảm tối đa</label>
                  <input style={inputStyle} type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="100000"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Giới hạn dùng</label>
                  <input style={inputStyle} type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="100"
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Hết hạn</label>
                  <input style={inputStyle} type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(13,51,48,0.12)'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="submit" style={primaryBtnStyle} disabled={createMutation.isPending}>Tạo mã</button>
                <button type="button" onClick={() => setShowForm(false)} style={ghostBtnStyle}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(13,51,48,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAF8' }}>
              {['Mã', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Đã dùng', 'Hết hạn', 'Trạng thái', ''].map(h => (
                <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(13,51,48,0.4)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)', fontSize: 13 }}>Đang tải...</td></tr>
            ) : coupons.map(coupon => (
              <tr key={coupon.id} style={{ borderTop: '1px solid rgba(13,51,48,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#0D3330', fontWeight: 600, letterSpacing: '0.04em', background: 'rgba(13,51,48,0.05)', padding: '3px 8px', borderRadius: 4 }}>{coupon.code}</span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(13,51,48,0.06)', color: 'rgba(13,51,48,0.5)' }}>
                    {coupon.type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#C9A84C', fontWeight: 600 }}>
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value)}
                </td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: 'rgba(13,51,48,0.5)' }}>{coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}</td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: '#0D3330' }}>
                  {coupon.usedCount}
                  {coupon.usageLimit ? <span style={{ color: 'rgba(13,51,48,0.35)' }}>/{coupon.usageLimit}</span> : ''}
                </td>
                <td style={{ padding: '14px 18px', fontSize: 12, color: 'rgba(13,51,48,0.4)' }}>
                  {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Không giới hạn'}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', background: coupon.isActive ? 'rgba(50,160,100,0.12)' : 'rgba(192,80,80,0.1)', color: coupon.isActive ? '#288A55' : '#B84040' }}>
                    {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button onClick={() => toggleMutation.mutate(coupon.id)} title={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                    style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${coupon.isActive ? 'rgba(50,160,100,0.3)' : 'rgba(13,51,48,0.15)'}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: coupon.isActive ? '#288A55' : 'rgba(13,51,48,0.35)', transition: 'all 0.15s' }}>
                    {coupon.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

const primaryBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 20px', borderRadius: 7,
  background: '#0D3330', color: '#F0EDE6',
  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '0.01em',
}
const ghostBtnStyle = {
  display: 'inline-flex', alignItems: 'center',
  padding: '9px 18px', borderRadius: 7,
  background: 'transparent', color: 'rgba(13,51,48,0.6)',
  border: '1px solid rgba(13,51,48,0.15)', cursor: 'pointer', fontSize: 13,
  fontFamily: 'Be Vietnam Pro, sans-serif',
}