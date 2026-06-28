// Coupons.jsx — Admin coupon management
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight, X } from 'lucide-react'
import api from '../../services/api'
import { formatDate, formatPrice } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const EMPTY_FORM = {
  code: '', type: 'PERCENTAGE', value: '',
  minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: '',
}

export default function Coupons() {
  const qc = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)

  /* ── Queries ── */
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn:  () => api.get('/admin/coupons').then(r => r.data.data),
  })

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/coupons', payload),
    onSuccess: () => {
      toast.success('Tạo mã giảm giá thành công!')
      qc.invalidateQueries(['admin-coupons'])
      closeForm()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Tạo mã thất bại!'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coupons/${id}/toggle`),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái mã!')
      qc.invalidateQueries(['admin-coupons'])
    },
    onError: () => toast.error('Cập nhật thất bại!'),
  })

  /* ── Helpers ── */
  const closeForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      value:        Number(form.value)       || 0,
      minOrder:     Number(form.minOrder)    || undefined,
      maxDiscount:  Number(form.maxDiscount) || undefined,
      usageLimit:   Number(form.usageLimit)  || undefined,
      expiresAt:    form.expiresAt || undefined,
    }
    createMutation.mutate(payload)
  }

  const f = (key) => (e) => setForm(prev => ({
    ...prev,
    [key]: key === 'code' ? e.target.value.toUpperCase() : e.target.value,
  }))

  /* ── Derived counts ── */
  const activeCount = coupons.filter(c => c.isActive).length

  return (
    <AdminLayout>

      {/* ── Header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Mã Giảm <em>Giá</em></h1>
        </div>
        <button className="a-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={13} />
          Tạo mã mới
        </button>
      </div>

      {/* ── Mini stats ── */}
      <div className="a-mini-stats">
        <div className="a-mini-stat">
          <div className="a-mini-stat-label">Tổng mã</div>
          <div className="a-mini-stat-value">{isLoading ? '—' : coupons.length}</div>
        </div>
        <div className="a-mini-stat">
          <div className="a-mini-stat-label">Đang hoạt động</div>
          <div className="a-mini-stat-value accent">{isLoading ? '—' : activeCount}</div>
        </div>
        <div className="a-mini-stat">
          <div className="a-mini-stat-label">Đã tắt</div>
          <div className="a-mini-stat-value">{isLoading ? '—' : coupons.length - activeCount}</div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Mã code', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Giảm tối đa', 'Đã dùng', 'Hết hạn', 'Trạng thái', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : !coupons.length ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              ) : coupons.map(coupon => (
                <tr key={coupon.id}>
                  {/* Code */}
                  <td>
                    <span className="a-code-badge">{coupon.code}</span>
                  </td>

                  {/* Type */}
                  <td>
                    <span className="a-badge neutral">
                      {coupon.type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>

                  {/* Value */}
                  <td style={{ fontFamily: 'var(--a-font-serif)', fontSize: 15, color: 'var(--a-green)', fontWeight: 600 }}>
                    {coupon.type === 'PERCENTAGE'
                      ? `${coupon.value}%`
                      : formatPrice(coupon.value)
                    }
                  </td>

                  {/* Min order */}
                  <td className="a-td-muted">
                    {coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}
                  </td>

                  {/* Max discount */}
                  <td className="a-td-muted">
                    {coupon.maxDiscount > 0 ? formatPrice(coupon.maxDiscount) : '—'}
                  </td>

                  {/* Usage */}
                  <td style={{ fontSize: 12 }}>
                    {coupon.usedCount ?? 0}
                    {coupon.usageLimit
                      ? <span className="a-td-muted">/{coupon.usageLimit}</span>
                      : <span className="a-td-muted">/∞</span>
                    }
                  </td>

                  {/* Expires */}
                  <td className="a-td-muted">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Không giới hạn'}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`a-badge ${coupon.isActive ? 'success' : 'danger'}`}>
                      {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </td>

                  {/* Toggle */}
                  <td>
                    <button
                      className={`a-btn-icon ${coupon.isActive ? 'toggle-on' : 'toggle-off'}`}
                      onClick={() => toggleMutation.mutate(coupon.id)}
                      aria-label={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                      title={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                    >
                      {coupon.isActive
                        ? <ToggleRight size={14} />
                        : <ToggleLeft  size={14} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ CREATE MODAL ══ */}
      {showForm && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && closeForm()}
        >
          <div className="a-modal">
            <div className="a-modal-header">
              <h3 className="a-modal-title">Tạo mã giảm giá</h3>
              <button className="a-modal-close" onClick={closeForm} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">

                  {/* Code */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Mã code *</label>
                    <input
                      className="a-input code"
                      value={form.code}
                      onChange={f('code')}
                      required
                      placeholder="VD: EARTH20"
                      autoComplete="off"
                    />
                  </div>

                  {/* Type */}
                  <div className="a-form-group">
                    <label className="a-form-label">Loại giảm giá *</label>
                    <select className="a-input a-select" value={form.type} onChange={f('type')}>
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED">Cố định (VNĐ)</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá trị *</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.value}
                      onChange={f('value')}
                      required
                      min={1}
                      max={form.type === 'PERCENTAGE' ? 100 : undefined}
                      placeholder={form.type === 'PERCENTAGE' ? '20' : '50000'}
                    />
                  </div>

                  {/* Min order */}
                  <div className="a-form-group">
                    <label className="a-form-label">Đơn tối thiểu</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.minOrder}
                      onChange={f('minOrder')}
                      placeholder="200000"
                      min={0}
                    />
                  </div>

                  {/* Max discount — only for PERCENTAGE */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giảm tối đa</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.maxDiscount}
                      onChange={f('maxDiscount')}
                      placeholder="100000"
                      min={0}
                      disabled={form.type === 'FIXED'}
                      style={form.type === 'FIXED' ? { opacity: 0.4 } : {}}
                    />
                  </div>

                  {/* Usage limit */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giới hạn lượt dùng</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.usageLimit}
                      onChange={f('usageLimit')}
                      placeholder="100 (để trống = không giới hạn)"
                      min={1}
                    />
                  </div>

                  {/* Expiry date */}
                  <div className="a-form-group">
                    <label className="a-form-label">Ngày hết hạn</label>
                    <input
                      className="a-input"
                      type="date"
                      value={form.expiresAt}
                      onChange={f('expiresAt')}
                    />
                  </div>

                </div>
              </div>

              <div className="a-modal-footer">
                <button
                  type="submit"
                  className="a-btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo mã'}
                </button>
                <button type="button" className="a-btn-ghost" onClick={closeForm}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}