// Products.jsx — Admin product management
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const EMPTY_FORM = {
  title: '', author: '', price: '', salePrice: '',
  stock: '', categoryId: '', description: '', isVisible: true,
}

export default function Products() {
  const qc = useQueryClient()

  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)  // null = create, id = edit
  const [form, setForm]             = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)

  /* ── Queries ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn:  () => api.get('/admin/products', { params: { page, limit: 12, search } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn:  () => api.get('/categories').then(r => r.data.data),
  })

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admin/products', payload),
    onSuccess: () => {
      toast.success('Tạo sách thành công!')
      qc.invalidateQueries(['admin-products'])
      closeModal()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Tạo thất bại!'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/products/${id}`, payload),
    onSuccess: () => {
      toast.success('Cập nhật thành công!')
      qc.invalidateQueries(['admin-products'])
      closeModal()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại!'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Đã xóa sách!')
      qc.invalidateQueries(['admin-products'])
      setConfirmDelete(null)
    },
    onError: () => toast.error('Xóa thất bại!'),
  })

  /* ── Helpers ── */
  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (product) => {
    setEditTarget(product.id)
    setForm({
      title:      product.title      ?? '',
      author:     product.author     ?? '',
      price:      product.price      ?? '',
      salePrice:  product.salePrice  ?? '',
      stock:      product.stock      ?? '',
      categoryId: product.categoryId ?? '',
      description:product.description?? '',
      isVisible:  product.isVisible  ?? true,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditTarget(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      price:     Number(form.price)    || 0,
      salePrice: Number(form.salePrice)|| undefined,
      stock:     Number(form.stock)    || 0,
    }
    if (editTarget) updateMutation.mutate({ id: editTarget, payload })
    else            createMutation.mutate(payload)
  }

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const products    = data?.products    ?? []
  const totalPages  = data?.totalPages  ?? 1
  const totalCount  = data?.total       ?? 0
  const isPending   = createMutation.isPending || updateMutation.isPending

  return (
    <AdminLayout>

      {/* ── Page header ── */}
      <div className="a-page-header">
        <div>
          <p className="a-page-eyebrow">Quản lý</p>
          <h1 className="a-page-title">Sản <em>Phẩm</em></h1>
        </div>
        <button className="a-btn-primary" onClick={openCreate}>
          <Plus size={13} />
          Thêm sách mới
        </button>
      </div>

      {/* ── Search ── */}
      <div className="a-search-wrap">
        <Search size={13} className="a-search-icon" />
        <input
          className="a-input"
          type="text"
          placeholder="Tìm kiếm sách..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* ── Table ── */}
      <div className="a-table-card">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {['Sách', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Trạng thái', ''].map(h => (
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
              ) : !products.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
                    Không tìm thấy sách nào
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  {/* Book info */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div className="a-book-thumb">
                        {p.coverImage
                          ? <img src={p.coverImage} alt={p.title} />
                          : <Upload size={12} />
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--a-ink)' }}>{p.title}</div>
                        <div className="a-td-muted">{p.author}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(13,51,48,0.3)', marginTop: 1 }}>
                          {p.id?.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="a-badge neutral">{p.category?.name ?? '—'}</span>
                  </td>

                  {/* Price */}
                  <td>
                    <div className="a-td-serif">{formatPrice(p.price)}</div>
                    {p.salePrice && (
                      <div style={{ fontSize: 11, color: 'rgba(13,51,48,0.35)', textDecoration: 'line-through' }}>
                        {formatPrice(p.salePrice)}
                      </div>
                    )}
                  </td>

                  {/* Stock */}
                  <td>
                    <span className={p.stock <= 10 ? 'a-td-danger' : ''} style={{ fontWeight: 600 }}>
                      {p.stock}
                    </span>
                  </td>

                  {/* Sold */}
                  <td className="a-td-muted">{p._count?.orderItems ?? 0}</td>

                  {/* Status */}
                  <td>
                    <span className={`a-badge ${p.isVisible ? 'success' : 'neutral'}`}>
                      {p.isVisible ? 'Hiển thị' : 'Đã ẩn'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="a-btn-icon edit"
                        onClick={() => openEdit(p)}
                        aria-label="Chỉnh sửa"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="a-btn-icon delete"
                        onClick={() => setConfirmDelete(p)}
                        aria-label="Xóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="a-pagination">
          <span className="a-pagination-info">Tổng {totalCount} sách</span>
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

      {/* ══ CREATE / EDIT MODAL ══ */}
      {showModal && (
        <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="a-modal wide">
            <div className="a-modal-header">
              <h3 className="a-modal-title">
                {editTarget ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
              </h3>
              <button className="a-modal-close" onClick={closeModal} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="a-modal-body">
                <div className="a-form-grid">
                  {/* Title */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tên sách *</label>
                    <input
                      className="a-input"
                      value={form.title}
                      onChange={f('title')}
                      placeholder="Nhập tên sách..."
                      required
                    />
                  </div>

                  {/* Author */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tác giả *</label>
                    <input
                      className="a-input"
                      value={form.author}
                      onChange={f('author')}
                      placeholder="Tên tác giả..."
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá gốc *</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.price}
                      onChange={f('price')}
                      placeholder="150000"
                      required
                      min={0}
                    />
                  </div>

                  {/* Sale price */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá sale</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.salePrice}
                      onChange={f('salePrice')}
                      placeholder="120000"
                      min={0}
                    />
                  </div>

                  {/* Stock */}
                  <div className="a-form-group">
                    <label className="a-form-label">Tồn kho *</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.stock}
                      onChange={f('stock')}
                      placeholder="50"
                      required
                      min={0}
                    />
                  </div>

                  {/* Category */}
                  <div className="a-form-group">
                    <label className="a-form-label">Danh mục *</label>
                    <select
                      className="a-input a-select"
                      value={form.categoryId}
                      onChange={f('categoryId')}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Mô tả</label>
                    <textarea
                      className="a-input a-textarea"
                      value={form.description}
                      onChange={f('description')}
                      placeholder="Mô tả ngắn về cuốn sách..."
                    />
                  </div>

                  {/* Visibility */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Hiển thị</label>
                    <div className="a-checkbox-group">
                      <label className="a-checkbox-label">
                        <input
                          type="checkbox"
                          checked={form.isVisible}
                          onChange={e => setForm(prev => ({ ...prev, isVisible: e.target.checked }))}
                        />
                        Hiển thị trên cửa hàng
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="a-modal-footer">
                <button type="submit" className="a-btn-primary" disabled={isPending}>
                  {isPending ? 'Đang lưu...' : (editTarget ? 'Lưu thay đổi' : 'Tạo sách')}
                </button>
                <button type="button" className="a-btn-ghost" onClick={closeModal}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ══ */}
      {confirmDelete && (
        <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="a-modal" style={{ maxWidth: 420 }}>
            <div className="a-modal-header">
              <h3 className="a-modal-title">Xác nhận xóa</h3>
              <button className="a-modal-close" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <div className="a-modal-body">
              <p style={{ fontSize: 13, color: 'rgba(13,51,48,0.7)', lineHeight: 1.6 }}>
                Bạn có chắc muốn xóa sách <strong>"{confirmDelete.title}"</strong>?
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="a-modal-footer">
              <button
                className="a-btn-primary"
                style={{ background: '#c05050' }}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa sách'}
              </button>
              <button className="a-btn-ghost" onClick={() => setConfirmDelete(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}