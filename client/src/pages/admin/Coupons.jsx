// Coupons.jsx — Admin coupon / voucher management
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, X, Search, Ticket, Percent, Banknote, Copy, Check,
  Pencil, Trash2, CalendarClock, AlertTriangle, Tag, ToggleLeft, ToggleRight,
} from 'lucide-react'
import api from '../../services/api'
import { formatDate, formatPrice } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import '../../components/assets/css/admin-vouchers.css'


const EMPTY_FORM = {
  code: '', type: 'PERCENTAGE', value: '',
  minOrder: '', maxDiscount: '', usageLimit: '', expiresAt: '',
}

const STATUS_PILLS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'inactive', label: 'Đã tắt' },
  { key: 'expiring', label: 'Sắp hết hạn' },
]

const TYPE_PILLS = [
  { key: 'all', label: 'Mọi loại' },
  { key: 'PERCENTAGE', label: 'Phần trăm' },
  { key: 'FIXED', label: 'Cố định' },
]

/* ── Helpers ── */
function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(23, 59, 59, 999) - Date.now()
  return Math.ceil(diff / 86_400_000)
}

function toDateInputValue(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

export default function Coupons() {
  const qc = useQueryClient()

  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [copiedId, setCopiedId]       = useState(null)

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter]   = useState('all')

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

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/coupons/${id}`, payload),
    onSuccess: () => {
      toast.success('Cập nhật mã giảm giá thành công!')
      qc.invalidateQueries(['admin-coupons'])
      closeForm()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại!'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/coupons/${id}/toggle`),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái mã!')
      qc.invalidateQueries(['admin-coupons'])
    },
    onError: () => toast.error('Cập nhật thất bại!'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa mã giảm giá!')
      qc.invalidateQueries(['admin-coupons'])
      setDeleteTarget(null)
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Không thể xóa mã này!')
      setDeleteTarget(null)
    },
  })

  /* ── Form helpers ── */
  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value ?? ''),
      minOrder: coupon.minOrder ? String(coupon.minOrder) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      expiresAt: toDateInputValue(coupon.expiresAt),
    })
    setShowForm(true)
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
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const f = (key) => (e) => setForm(prev => ({
    ...prev,
    [key]: key === 'code' ? e.target.value.toUpperCase() : e.target.value,
  }))

  const handleCopy = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast.error('Không thể sao chép')
    }
  }

  /* ── Derived: stats ── */
  const activeCount = coupons.filter(c => c.isActive).length
  const expiringSoonCount = coupons.filter(c => {
    const d = daysUntil(c.expiresAt)
    return c.isActive && d !== null && d >= 0 && d <= 3
  }).length

  /* ── Derived: filtered list ── */
  const filteredCoupons = useMemo(() => {
    const q = search.trim().toUpperCase()
    return coupons.filter((c) => {
      if (q && !c.code.toUpperCase().includes(q)) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false

      const d = daysUntil(c.expiresAt)
      if (statusFilter === 'active' && !c.isActive) return false
      if (statusFilter === 'inactive' && c.isActive) return false
      if (statusFilter === 'expiring' && !(c.isActive && d !== null && d >= 0 && d <= 3)) return false

      return true
    })
  }, [coupons, search, statusFilter, typeFilter])

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <AdminLayout>

      {/* ── Header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Mã Giảm <em>Giá</em></h1>
        </div>
        <button className="a-btn-primary" onClick={openCreate}>
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
        <div className="a-mini-stat">
          <div className="a-mini-stat-label">Sắp hết hạn (≤3 ngày)</div>
          <div className="a-mini-stat-value" style={expiringSoonCount ? { color: 'var(--a-warning-text)' } : undefined}>
            {isLoading ? '—' : expiringSoonCount}
          </div>
        </div>
      </div>

      {/* ── Toolbar: search + filters ── */}
      <div className="a-vc-toolbar">
        <div className="a-vc-toolbar-left">
          <div className="a-search-wrap" style={{ marginBottom: 0 }}>
            <Search size={14} className="a-search-icon" />
            <input
              className="a-input"
              placeholder="Tìm theo mã code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="a-pills">
            {STATUS_PILLS.map(p => (
              <button
                key={p.key}
                className={`a-pill ${statusFilter === p.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="a-pills">
          {TYPE_PILLS.map(p => (
            <button
              key={p.key}
              className={`a-pill ${typeFilter === p.key ? 'active' : ''}`}
              onClick={() => setTypeFilter(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="a-vc-count">
        {isLoading
          ? 'Đang tải danh sách mã...'
          : <>Hiển thị <strong>{filteredCoupons.length}</strong> / {coupons.length} mã giảm giá</>
        }
      </p>

      {/* ── Voucher grid ── */}
      <div className="a-voucher-grid">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="a-skeleton a-voucher-skeleton" />
          ))
        ) : !filteredCoupons.length ? (
          <div className="a-vc-empty">
            <div className="a-vc-empty-icon"><Ticket size={22} /></div>
            <div className="a-vc-empty-title">
              {coupons.length ? 'Không tìm thấy mã phù hợp' : 'Chưa có mã giảm giá nào'}
            </div>
            <p className="a-vc-empty-sub">
              {coupons.length
                ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Tạo mã giảm giá đầu tiên để bắt đầu chạy khuyến mãi cho khách hàng.'}
            </p>
            {!coupons.length && (
              <button className="a-btn-primary" onClick={openCreate} style={{ marginTop: 6 }}>
                <Plus size={13} /> Tạo mã mới
              </button>
            )}
          </div>
        ) : (
          filteredCoupons.map((coupon) => {
            const d = daysUntil(coupon.expiresAt)
            const isExpired = d !== null && d < 0
            const isExpiringSoon = d !== null && d >= 0 && d <= 3
            const usagePercent = coupon.usageLimit
              ? Math.min(100, Math.round(((coupon.usedCount ?? 0) / coupon.usageLimit) * 100))
              : null
            const isFull = coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit

            let statusBadge = { cls: 'success', label: 'Hoạt động' }
            if (!coupon.isActive) statusBadge = { cls: 'danger', label: 'Đã tắt' }
            else if (isExpired) statusBadge = { cls: 'neutral', label: 'Hết hạn' }
            else if (isFull) statusBadge = { cls: 'warning', label: 'Hết lượt' }

            return (
              <div
                key={coupon.id}
                className={`a-voucher-card ${!coupon.isActive || isExpired ? 'is-dim' : ''}`}
              >
                {isExpiringSoon && coupon.isActive && (
                  <div className="a-voucher-ribbon">Sắp hết hạn</div>
                )}

                {/* Stub */}
                <div className="a-voucher-stub">
                  {coupon.type === 'PERCENTAGE'
                    ? <Percent size={16} className="a-voucher-stub-icon" />
                    : <Banknote size={16} className="a-voucher-stub-icon" />
                  }
                  <div className="a-voucher-stub-value">
                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value)}
                  </div>
                  <div className="a-voucher-stub-unit">
                    {coupon.type === 'PERCENTAGE' ? 'Giảm giá' : 'Giảm ngay'}
                  </div>
                </div>
                <div className="a-voucher-perf" />

                {/* Body */}
                <div className="a-voucher-body">
                  <div className="a-voucher-head">
                    <div className="a-voucher-code-row">
                      <span className="a-code-badge" title={coupon.code}>{coupon.code}</span>
                      <button
                        className={`a-voucher-copy-btn ${copiedId === coupon.id ? 'copied' : ''}`}
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        title="Sao chép mã"
                        aria-label="Sao chép mã"
                      >
                        {copiedId === coupon.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                    <span className={`a-badge ${statusBadge.cls}`}>{statusBadge.label}</span>
                  </div>

                  <div className="a-voucher-meta">
                    <div className="a-voucher-meta-item">
                      <span className="a-voucher-meta-label">Đơn tối thiểu</span>
                      <span className="a-voucher-meta-value">
                        {coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : 'Không yêu cầu'}
                      </span>
                    </div>
                    {coupon.type === 'PERCENTAGE' && (
                      <div className="a-voucher-meta-item">
                        <span className="a-voucher-meta-label">Giảm tối đa</span>
                        <span className="a-voucher-meta-value">
                          {coupon.maxDiscount > 0 ? formatPrice(coupon.maxDiscount) : 'Không giới hạn'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="a-voucher-progress">
                    <div className="a-voucher-progress-row">
                      <span>Lượt sử dụng</span>
                      <span>
                        <strong>{coupon.usedCount ?? 0}</strong>
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / Không giới hạn'}
                      </span>
                    </div>
                    {coupon.usageLimit && (
                      <div className="a-voucher-progress-track">
                        <div
                          className={`a-voucher-progress-fill ${isFull ? 'is-full' : ''}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="a-voucher-footer">
                    <span className={`a-voucher-expiry ${isExpired ? 'expired' : isExpiringSoon ? 'soon' : ''}`}>
                      <CalendarClock size={12} />
                      {coupon.expiresAt
                        ? `${isExpired ? 'Hết hạn' : 'Hết hạn'} ${formatDate(coupon.expiresAt)}`
                        : 'Không giới hạn thời gian'}
                    </span>

                    <div className="a-voucher-actions">
                      <button
                        className="a-btn-icon edit"
                        onClick={() => openEdit(coupon)}
                        title="Chỉnh sửa"
                        aria-label="Chỉnh sửa"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className={`a-btn-icon ${coupon.isActive ? 'toggle-on' : 'toggle-off'}`}
                        onClick={() => toggleMutation.mutate(coupon.id)}
                        title={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                        aria-label={coupon.isActive ? 'Tắt mã' : 'Bật mã'}
                      >
                        {coupon.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                      </button>
                      <button
                        className="a-btn-icon delete"
                        onClick={() => setDeleteTarget(coupon)}
                        title="Xóa mã"
                        aria-label="Xóa mã"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ══ CREATE / EDIT MODAL ══ */}
      {showForm && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && closeForm()}
        >
          <div className="a-modal">
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {editingId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá'}
              </h3>
              <button className="a-modal-close" onClick={closeForm} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">

                  {/* Code */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">
                      <Tag size={10} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                      Mã code *
                    </label>
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
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo mã'}
                </button>
                <button type="button" className="a-btn-ghost" onClick={closeForm}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {deleteTarget && (
        <div
          className="a-modal-overlay"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="a-modal" style={{ maxWidth: 400 }}>
            <div className="a-modal-body" style={{ paddingTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="a-vc-confirm-icon">
                <AlertTriangle size={20} />
              </div>
              <h3 className="a-modal-title" style={{ marginBottom: 8 }}>Xóa mã giảm giá?</h3>
              <p className="a-vc-confirm-text">
                Bạn sắp xóa vĩnh viễn mã <strong>{deleteTarget.code}</strong>.
                Hành động này không thể hoàn tác. Nếu chỉ muốn ngừng áp dụng,
                hãy tắt mã thay vì xóa.
              </p>
            </div>
            <div className="a-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                className="a-btn-primary"
                style={{ background: 'var(--a-danger-text)' }}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
              <button type="button" className="a-btn-ghost" onClick={() => setDeleteTarget(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}