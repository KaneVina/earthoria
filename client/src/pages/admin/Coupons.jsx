import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../services/api'
import { formatDate, formatPrice } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function Coupons() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'PERCENTAGE', value: '',
    minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: ''
  })

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/coupons', data),
    onSuccess: () => { toast.success('Tạo mã thành công!'); qc.invalidateQueries(['admin-coupons']); setShowForm(false); setForm({ code: '', type: 'PERCENTAGE', value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: '' }) },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coupons/${id}/toggle`),
    onSuccess: () => { toast.success('Cập nhật!'); qc.invalidateQueries(['admin-coupons']) }
  })

  const inputStyle = {
    background: 'var(--ivory)', border: '0.5px solid var(--border)',
    padding: '10px 14px', fontSize: '13px', color: 'var(--forest)',
    outline: 'none', width: '100%', fontFamily: 'Be Vietnam Pro,sans-serif'
  }
  const labelStyle = {
    fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: '6px', display: 'block'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="eyebrow-line"></div>
              <span className="eyebrow-text">Quản lý</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--forest)' }}>
              Mã Giảm <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Giá</em>
            </h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Plus size={14}/> Tạo mã mới
          </button>
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
              <button className={`pill ${tab.href === '/admin/coupons' ? 'active' : ''}`}>{tab.label}</button>
            </a>
          ))}
        </div>

        {/* Form modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--white)', width: '100%', maxWidth: '560px' }}>
              <div style={{ padding: '24px 28px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '20px', fontWeight: 400, color: 'var(--forest)' }}>Tạo mã giảm giá</h3>
                <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}>×</button>
              </div>
              <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} style={{ padding: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Mã code *</label>
                    <input style={{ ...inputStyle, textTransform: 'uppercase' }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="VD: EARTH15"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Loại giảm giá *</label>
                    <select style={{ ...inputStyle, appearance: 'none' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Giá trị *</label>
                    <input style={inputStyle} type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required placeholder={form.type === 'PERCENTAGE' ? '15' : '50000'}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Đơn tối thiểu</label>
                    <input style={inputStyle} type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="200000"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Giảm tối đa</label>
                    <input style={inputStyle} type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="100000"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Giới hạn sử dụng</label>
                    <input style={inputStyle} type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="100"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Hết hạn</label>
                    <input style={inputStyle} type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }} disabled={createMutation.isPending}>Tạo mã</button>
                  <button type="button" className="btn-ghost" style={{ padding: '12px 20px' }} onClick={() => setShowForm(false)}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Mã', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Đã dùng', 'Hết hạn', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : coupons.map(coupon => (
                <tr key={coupon.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '14px', color: 'var(--forest)', fontWeight: 500 }}>{coupon.code}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', padding: '4px 10px', background: 'var(--pale)', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {coupon.type === 'PERCENTAGE' ? '%' : 'VNĐ'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Playfair Display,serif', fontSize: '16px', color: 'var(--forest)' }}>
                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value)}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>{coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}</td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--forest)' }}>
                    {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Không giới hạn'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', padding: '4px 10px', background: coupon.isActive ? 'var(--gold-pale)' : 'rgba(192,80,80,0.08)', color: coupon.isActive ? 'var(--gold)' : '#c05050', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button onClick={() => toggleMutation.mutate(coupon.id)} style={{ width: '32px', height: '32px', border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: coupon.isActive ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {coupon.isActive ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                    </button>
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