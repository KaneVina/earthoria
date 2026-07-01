// Products.jsx — Admin product management
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X, Upload, Box, Ban, CheckCircle2, QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const EMPTY_FORM = {
  title: '', authors: '',
  price: '',
  saleMode: 'direct', salePrice: '', salePercent: '',
  dealerMode: 'direct', dealerPrice: '', dealerPercent: '',
  stock: '', categoryId: '', description: '', isVisible: true,
  publisher: '', pages: '', language: 'VI',
  ageMin: '', ageMax: '',
  publishYear: '', dimensions: '', weightGrams: '', coverType: '', paperType: '',
}

const EMPTY_FILTERS = { id: '', categoryId: '', language: '', status: '', ageMin: '', ageMax: '' }

/* % giảm hiển thị dạng badge, vd giá gốc 420.000 -> giá bán 260.400 => -38% */
const calcDiscountPercent = (base, sale) => {
  const b = Number(base), s = Number(sale)
  if (!b || !s || s >= b) return 0
  return Math.round((1 - s / b) * 100)
}

/* Tính giá cuối cùng theo mode: 'percent' (tính từ giá gốc) hoặc 'direct' (nhập thẳng) */
const computeModePrice = (mode, percent, direct, basePrice) => {
  if (mode === 'percent') {
    const pct = Number(percent) || 0
    const base = Number(basePrice) || 0
    if (!pct || !base) return null
    return Math.round(base * (1 - pct / 100))
  }
  return direct !== '' && direct !== null && direct !== undefined ? Number(direct) : null
}

export default function Products() {
  const qc = useQueryClient()

  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState(EMPTY_FILTERS)
  const [page, setPage]             = useState(1)
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)  // null = create, id = edit
  const [form, setForm]             = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [arModalBook, setArModalBook] = useState(null) // sách đang mở "Quản lý AR", null = đóng

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }
  const resetFilters = () => { setFilters(EMPTY_FILTERS); setPage(1) }
  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  /* ── Queries ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, filters],
    queryFn:  () => api.get('/admin/products', {
      params: { page, limit: 12, search, ...filters },
    }).then(r => r.data.data),
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
      title:         product.title       ?? '',
      authors:       (product.authors ?? []).join(', '),
      price:         product.price       ?? '',
      saleMode:      'direct',
      salePrice:     product.salePrice   ?? '',
      salePercent:   '',
      dealerMode:    'direct',
      dealerPrice:   product.dealerPrice ?? '',
      dealerPercent: '',
      stock:         product.stock       ?? '',
      categoryId:    product.categoryId  ?? '',
      description:   product.description ?? '',
      isVisible:     product.isVisible   ?? true,
      publisher:     product.publisher   ?? '',
      pages:         product.pages       ?? '',
      language:      product.language    ?? 'VI',
      ageMin:        product.ageMin      ?? '',
      ageMax:        product.ageMax      ?? '',
      publishYear:   product.publishYear ?? '',
      dimensions:    product.dimensions  ?? '',
      weightGrams:   product.weightGrams ?? '',
      coverType:     product.coverType   ?? '',
      paperType:     product.paperType   ?? '',
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
    const basePrice = Number(form.price) || 0

    const finalSalePrice   = computeModePrice(form.saleMode,   form.salePercent,   form.salePrice,   basePrice)
    const finalDealerPrice = computeModePrice(form.dealerMode, form.dealerPercent, form.dealerPrice, basePrice)

    const payload = {
      title:       form.title,
      authors:     form.authors,
      price:       basePrice,
      salePrice:   finalSalePrice,
      dealerPrice: finalDealerPrice,
      stock:       Number(form.stock) || 0,
      categoryId:  form.categoryId,
      description: form.description,
      isVisible:   form.isVisible,
      publisher:   form.publisher,
      pages:       form.pages ? Number(form.pages) : null,
      language:    form.language,
      ageMin:      form.ageMin !== '' ? Number(form.ageMin) : null,
      ageMax:      form.ageMax !== '' ? Number(form.ageMax) : null,
      publishYear: form.publishYear ? Number(form.publishYear) : null,
      dimensions:  form.dimensions,
      weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
      coverType:   form.coverType,
      paperType:   form.paperType,
    }

    if (editTarget) updateMutation.mutate({ id: editTarget, payload })
    else            createMutation.mutate(payload)
  }

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const products    = data?.products    ?? []
  const totalPages  = data?.totalPages  ?? 1
  const totalCount  = data?.total       ?? 0
  const isPending   = createMutation.isPending || updateMutation.isPending

  /* Toggle nhỏ cho chọn mode "Nhập giá" / "Theo % giảm" */
  const ModeToggle = ({ mode, onChange }) => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
      {[['direct', 'Nhập giá'], ['percent', 'Theo % giảm']].map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          style={{
            padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
            border: '1px solid #e8e5de',
            background: mode === val ? '#0D3330' : '#fff',
            color:      mode === val ? '#fff'    : '#0D3330',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )

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
          placeholder="Tìm kiếm theo tên sách / nhà xuất bản..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '12px 0 16px' }}>
        <input
          className="a-input"
          style={{ maxWidth: 200 }}
          placeholder="Lọc theo ID (đầy đủ hoặc vài ký tự đầu)..."
          value={filters.id}
          onChange={e => updateFilter('id', e.target.value)}
        />
        <select
          className="a-input a-select"
          style={{ maxWidth: 180 }}
          value={filters.categoryId}
          onChange={e => updateFilter('categoryId', e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="a-input a-select"
          style={{ maxWidth: 140 }}
          value={filters.language}
          onChange={e => updateFilter('language', e.target.value)}
        >
          <option value="">Mọi ngôn ngữ</option>
          <option value="VI">VI</option>
          <option value="EN">EN</option>
          <option value="VI/EN">VI/EN</option>
        </select>
        <select
          className="a-input a-select"
          style={{ maxWidth: 160 }}
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đã ẩn</option>
        </select>
        <input
          className="a-input" type="number" style={{ maxWidth: 100 }}
          placeholder="Từ tuổi" min={0}
          value={filters.ageMin}
          onChange={e => updateFilter('ageMin', e.target.value)}
        />
        <input
          className="a-input" type="number" style={{ maxWidth: 100 }}
          placeholder="Đến tuổi" min={0}
          value={filters.ageMax}
          onChange={e => updateFilter('ageMax', e.target.value)}
        />
        {hasActiveFilters && (
          <button type="button" className="a-btn-ghost" onClick={resetFilters}>
            Xóa lọc
          </button>
        )}
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
              ) : products.map(p => {
                const discount = calcDiscountPercent(p.price, p.salePrice)
                const mainPrice = p.salePrice ?? p.price
                return (
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
                        <div className="a-td-muted">{(p.authors ?? []).join(', ') || '—'}</div>
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
                    <div className="a-td-serif">{formatPrice(mainPrice)}</div>
                    {p.salePrice ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 1 }}>
                        <span style={{ color: 'rgba(13,51,48,0.35)', textDecoration: 'line-through' }}>
                          {formatPrice(p.price)}
                        </span>
                        {discount > 0 && (
                          <span className="a-badge danger" style={{ fontSize: 9, padding: '1px 5px' }}>
                            -{discount}%
                          </span>
                        )}
                      </div>
                    ) : null}
                    {p.dealerPrice ? (
                      <div style={{ fontSize: 10, color: 'rgba(13,51,48,0.4)', marginTop: 2 }}>
                        Đại lý: {formatPrice(p.dealerPrice)}
                      </div>
                    ) : null}
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
                        className="a-btn-icon"
                        onClick={() => setArModalBook(p)}
                        aria-label="Quản lý AR"
                        title="Quản lý AR"
                      >
                        <Box size={12} />
                      </button>
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
              )})}
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

                  {/* Authors */}
                  <div className="a-form-group span-2">
                    <label className="a-form-label">Tác giả *</label>
                    <input
                      className="a-input"
                      value={form.authors}
                      onChange={f('authors')}
                      placeholder="Nguyễn Nhật Ánh, Tô Hoài..."
                      required
                    />
                    <span style={{ fontSize: 10, color: 'rgba(13,51,48,0.4)' }}>
                      Nhiều tác giả cách nhau bằng dấu phẩy
                    </span>
                  </div>

                  {/* Price - giá gốc */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá gốc *</label>
                    <input
                      className="a-input"
                      type="number"
                      value={form.price}
                      onChange={f('price')}
                      placeholder="420000"
                      required
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

                  {/* Sale price (giá bán khách) */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá bán khách hàng</label>
                    <ModeToggle mode={form.saleMode} onChange={(v) => setForm(p => ({ ...p, saleMode: v }))} />
                    {form.saleMode === 'direct' ? (
                      <input
                        className="a-input" type="number" min={0}
                        value={form.salePrice} onChange={f('salePrice')}
                        placeholder="260000"
                      />
                    ) : (
                      <>
                        <input
                          className="a-input" type="number" min={0} max={100}
                          value={form.salePercent} onChange={f('salePercent')}
                          placeholder="% giảm, vd 38"
                        />
                        <span style={{ fontSize: 10, color: 'rgba(13,51,48,0.5)' }}>
                          Giá sau giảm: {formatPrice(computeModePrice('percent', form.salePercent, '', form.price) ?? 0)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Dealer price (giá bán đại lý) */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giá bán đại lý</label>
                    <ModeToggle mode={form.dealerMode} onChange={(v) => setForm(p => ({ ...p, dealerMode: v }))} />
                    {form.dealerMode === 'direct' ? (
                      <input
                        className="a-input" type="number" min={0}
                        value={form.dealerPrice} onChange={f('dealerPrice')}
                        placeholder="200000"
                      />
                    ) : (
                      <>
                        <input
                          className="a-input" type="number" min={0} max={100}
                          value={form.dealerPercent} onChange={f('dealerPercent')}
                          placeholder="% chiết khấu, vd 50"
                        />
                        <span style={{ fontSize: 10, color: 'rgba(13,51,48,0.5)' }}>
                          Giá đại lý: {formatPrice(computeModePrice('percent', form.dealerPercent, '', form.price) ?? 0)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Category */}
                  <div className="a-form-group span-2">
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

                  {/* ── Section: Thông số kỹ thuật ── */}
                  <div className="a-form-group span-2" style={{ borderTop: '1px solid #e8e5de', paddingTop: 14, marginTop: 4 }}>
                    <label className="a-form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                      Thông số kỹ thuật
                    </label>
                  </div>

                  {/* Publisher */}
                  <div className="a-form-group">
                    <label className="a-form-label">Nhà xuất bản</label>
                    <input
                      className="a-input"
                      value={form.publisher}
                      onChange={f('publisher')}
                      placeholder="Earthoria Publishing"
                    />
                  </div>

                  {/* Publish year */}
                  <div className="a-form-group">
                    <label className="a-form-label">Năm xuất bản</label>
                    <input
                      className="a-input" type="number"
                      value={form.publishYear}
                      onChange={f('publishYear')}
                      placeholder="2026"
                    />
                  </div>

                  {/* Pages */}
                  <div className="a-form-group">
                    <label className="a-form-label">Số trang</label>
                    <input
                      className="a-input" type="number" min={0}
                      value={form.pages}
                      onChange={f('pages')}
                      placeholder="120"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="a-form-group">
                    <label className="a-form-label">Kích thước (dài x rộng x cao)</label>
                    <input
                      className="a-input"
                      value={form.dimensions}
                      onChange={f('dimensions')}
                      placeholder="21 x 28 x 1.2 cm"
                    />
                  </div>

                  {/* Weight */}
                  <div className="a-form-group">
                    <label className="a-form-label">Trọng lượng (gram)</label>
                    <input
                      className="a-input" type="number" min={0}
                      value={form.weightGrams}
                      onChange={f('weightGrams')}
                      placeholder="680"
                    />
                  </div>

                  {/* Cover type */}
                  <div className="a-form-group">
                    <label className="a-form-label">Bìa sách</label>
                    <input
                      className="a-input"
                      value={form.coverType}
                      onChange={f('coverType')}
                      placeholder="Cứng, chống nước"
                    />
                  </div>

                  {/* Paper type */}
                  <div className="a-form-group">
                    <label className="a-form-label">Giấy in</label>
                    <input
                      className="a-input"
                      value={form.paperType}
                      onChange={f('paperType')}
                      placeholder="FSC Certified 150gsm"
                    />
                  </div>

                  {/* Language */}
                  <div className="a-form-group">
                    <label className="a-form-label">Ngôn ngữ</label>
                    <select className="a-input a-select" value={form.language} onChange={f('language')}>
                      <option value="VI">VI</option>
                      <option value="EN">EN</option>
                      <option value="VI/EN">VI/EN</option>
                    </select>
                  </div>

                  {/* Age range */}
                  <div className="a-form-group">
                    <label className="a-form-label">Độ tuổi</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="a-input" type="number" min={0}
                        value={form.ageMin} onChange={f('ageMin')} placeholder="Từ"
                      />
                      <input
                        className="a-input" type="number" min={0}
                        value={form.ageMax} onChange={f('ageMax')} placeholder="Đến"
                      />
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

      {/* ══ QUẢN LÝ AR MODAL ══ */}
      {arModalBook && (
        <ArCodesModal book={arModalBook} onClose={() => setArModalBook(null)} />
      )}

    </AdminLayout>
  )
}

/* ══════════════════════════════════════════════
   QUẢN LÝ AR — CRUD ArCode cho 1 sách
   Route backend: /admin/products/:bookId/ar-codes (list, create)
                  /admin/ar-codes/:id            (update)
                  /admin/ar-codes/:id/toggle     (bật/tắt)
══════════════════════════════════════════════ */
const EMPTY_AR_FORM = { label: '', file: null }

function ArCodesModal({ book, onClose }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = tạo mới, id = đang sửa
  const [form, setForm] = useState(EMPTY_AR_FORM)
  const [qrTarget, setQrTarget] = useState(null) // arCode đang xem QR, null = đóng

  const { data: arCodes = [], isLoading } = useQuery({
    queryKey: ['admin-ar-codes', book.id],
    queryFn: () => api.get(`/admin/products/${book.id}/ar-codes`).then(r => r.data.data),
  })

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('label', form.label)
    if (form.file) fd.append('model', form.file)
    return fd
  }

  const createMutation = useMutation({
    // Không set thủ công Content-Type — axios tự nhận diện FormData và
    // tự thêm 'multipart/form-data; boundary=...'. Nếu set tay như cũ
    // mà thiếu boundary, multer ở backend sẽ parse lỗi -> 500.
    mutationFn: () => api.post(`/admin/products/${book.id}/ar-codes`, buildFormData()),
    onSuccess: () => {
      toast.success('Đã tạo mã AR mới!')
      qc.invalidateQueries(['admin-ar-codes', book.id])
      closeForm()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Tạo mã AR thất bại!'),
  })

  const updateMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/ar-codes/${id}`, buildFormData()),
    onSuccess: () => {
      toast.success('Đã cập nhật mã AR!')
      qc.invalidateQueries(['admin-ar-codes', book.id])
      closeForm()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại!'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/ar-codes/${id}/toggle`),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái')
      qc.invalidateQueries(['admin-ar-codes', book.id])
    },
    onError: () => toast.error('Thao tác thất bại!'),
  })

  const openCreateForm = () => { setEditTarget(null); setForm(EMPTY_AR_FORM); setShowForm(true) }
  const openEditForm = (ac) => { setEditTarget(ac.id); setForm({ label: ac.label, file: null }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY_AR_FORM) }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.label) { toast.error('Vui lòng nhập label'); return }
    if (!editTarget && !form.file) { toast.error('Vui lòng chọn file .glb'); return }
    if (editTarget) updateMutation.mutate(editTarget)
    else createMutation.mutate()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="a-modal" style={{ maxWidth: 640 }}>
        <div className="a-modal-header">
          <h3 className="a-modal-title">Quản lý AR — {book.title}</h3>
          <button className="a-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="a-modal-body">
          <button type="button" className="a-btn-primary" onClick={openCreateForm} style={{ marginBottom: 16 }}>
            <Plus size={13} /> Thêm mã AR mới
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} style={{ border: '1px solid #e8e5de', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div className="a-form-group" style={{ marginBottom: 12 }}>
                <label className="a-form-label">Label (tên gợi nhớ, không hiển thị cho khách)</label>
                <input
                  className="a-input"
                  name="ar-label"
                  autoComplete="off"
                  value={form.label}
                  onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="vd: Con voi"
                  required
                />
              </div>
              <div className="a-form-group" style={{ marginBottom: 12 }}>
                <label className="a-form-label">
                  File mô hình .glb {editTarget && '(để trống nếu không muốn đổi model hiện tại)'}
                </label>
                <input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  onChange={(e) => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="a-btn-primary" disabled={isPending}>
                  {isPending ? 'Đang lưu...' : (editTarget ? 'Lưu thay đổi' : 'Tạo mã AR')}
                </button>
                <button type="button" className="a-btn-ghost" onClick={closeForm}>Hủy</button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>Đang tải...</div>
          ) : !arCodes.length ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(13,51,48,0.3)' }}>
              Sách này chưa có mã AR nào
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    {['Label', 'Mã (code)', 'Lượt quét', 'Trạng thái', ''].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {arCodes.map(ac => (
                    <tr key={ac.id}>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{ac.label}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(13,51,48,0.5)' }}>
                        {ac.code}
                      </td>
                      <td className="a-td-muted">{ac.scanCount}</td>
                      <td>
                        <span className={`a-badge ${ac.isActive ? 'success' : 'neutral'}`}>
                          {ac.isActive ? 'Hoạt động' : 'Đã vô hiệu hoá'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="a-btn-icon"
                            onClick={() => setQrTarget(ac)}
                            aria-label="Xem mã QR"
                            title="Xem mã QR"
                          >
                            <QrCode size={12} />
                          </button>
                          <button className="a-btn-icon edit" onClick={() => openEditForm(ac)} aria-label="Sửa" title="Sửa / thay model">
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="a-btn-icon"
                            onClick={() => toggleMutation.mutate(ac.id)}
                            aria-label={ac.isActive ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                            title={ac.isActive ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                          >
                            {ac.isActive ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="a-modal-footer">
          <button className="a-btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>

      {qrTarget && (
        <ArQrModal
          url={`${window.location.origin}/ar/${book.slug}/${qrTarget.code}`}
          label={qrTarget.label}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════
   MODAL XEM QR — ảnh QR thật + link đầy đủ để đối chiếu, tải PNG gửi
   nhà in, và copy link nếu cần dán tay chỗ khác.
   Lưu ý: URL dùng window.location.origin (domain của chính trang admin
   này) — vì frontend + admin nằm chung 1 app, domain khách quét QR sẽ
   trùng domain đang thao tác. Nếu sau này tách domain admin riêng,
   thay chỗ này bằng biến env cố định (vd VITE_SITE_URL).
══════════════════════════════════════════════ */
function ArQrModal({ url, label, onClose }) {
  const qrWrapRef = useRef(null)

  const handleDownload = () => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    const safeName = label.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'ar-code'
    link.download = `qr-${safeName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã sao chép link')
    } catch {
      toast.error('Không sao chép được, vui lòng bôi đen và copy thủ công')
    }
  }

  return (
    <div className="a-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="a-modal" style={{ maxWidth: 380 }}>
        <div className="a-modal-header">
          <h3 className="a-modal-title">Mã QR — {label}</h3>
          <button className="a-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="a-modal-body" style={{ textAlign: 'center' }}>
          <div ref={qrWrapRef} style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
            <QRCodeCanvas value={url} size={220} level="M" includeMargin bgColor="#ffffff" fgColor="#0D3330" />
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', textAlign: 'left',
            background: '#f5f3ee', padding: '10px 12px', borderRadius: 6, marginBottom: 18, color: '#0D3330',
          }}>
            {url}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" className="a-btn-primary" onClick={handleDownload}>Tải ảnh QR</button>
            <button type="button" className="a-btn-ghost" onClick={handleCopy}>Sao chép link</button>
          </div>
        </div>
      </div>
    </div>
  )
}