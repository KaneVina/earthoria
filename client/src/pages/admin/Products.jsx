import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import api from '../../services/api'
import { formatPrice, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', price: '', salePrice: '',
    stock: '', categoryId: '', coverImage: '', publisher: '',
    pages: '', language: 'VI', hasAR: true, hasAI: true, isFeatured: false
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-books', page, search],
    queryFn: () => api.get('/admin/books', { params: { page, limit: 15, search } }).then(r => r.data.data)
  })

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/books', data),
    onSuccess: () => { toast.success('Tạo sách thành công!'); qc.invalidateQueries(['admin-books']); resetForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/books/${id}`, data),
    onSuccess: () => { toast.success('Cập nhật thành công!'); qc.invalidateQueries(['admin-books']); resetForm() },
    onError: (e) => toast.error(e.response?.data?.message || 'Lỗi!')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/books/${id}`),
    onSuccess: () => { toast.success('Đã xóa sách!'); qc.invalidateQueries(['admin-books']) },
    onError: () => toast.error('Xóa thất bại!')
  })

  const resetForm = () => {
    setShowForm(false)
    setEditBook(null)
    setForm({ title: '', description: '', price: '', salePrice: '', stock: '', categoryId: '', coverImage: '', publisher: '', pages: '', language: 'VI', hasAR: true, hasAI: true, isFeatured: false })
  }

  const handleEdit = (book) => {
    setEditBook(book)
    setForm({
      title: book.title, description: book.description || '',
      price: book.price, salePrice: book.salePrice || '',
      stock: book.stock, categoryId: book.categoryId,
      coverImage: book.coverImage || '', publisher: book.publisher || '',
      pages: book.pages || '', language: book.language,
      hasAR: book.hasAR, hasAI: book.hasAI, isFeatured: book.isFeatured
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editBook) {
      updateMutation.mutate({ id: editBook.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

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

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div className="eyebrow-line"></div>
              <span className="eyebrow-text">Quản lý</span>
            </div>
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 300, color: 'var(--forest)' }}>
              Sản <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Phẩm</em>
            </h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Plus size={14}/> Thêm sách mới
          </button>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Sản phẩm', href: '/admin/products' },
            { label: 'Đơn hàng', href: '/admin/orders' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Mã giảm giá', href: '/admin/coupons' },
          ].map(tab => (
            <a key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
              <button className={`pill ${tab.href === '/admin/products' ? 'active' : ''}`}>{tab.label}</button>
            </a>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm kiếm sách..."
            style={{ ...inputStyle, paddingLeft: '40px' }}
          />
        </div>

        {/* Form modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'var(--white)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ padding: '28px 32px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '22px', fontWeight: 400, color: 'var(--forest)' }}>
                  {editBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
                </h3>
                <button onClick={resetForm} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}>×</button>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Tên sách *</label>
                    <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required/>
                  </div>
                  <div>
                    <label style={labelStyle}>Giá gốc *</label>
                    <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required/>
                  </div>
                  <div>
                    <label style={labelStyle}>Giá sale</label>
                    <input style={inputStyle} type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Tồn kho *</label>
                    <input style={inputStyle} type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required/>
                  </div>
                  <div>
                    <label style={labelStyle}>Danh mục *</label>
                    <select style={{ ...inputStyle, appearance: 'none' }} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                      <option value="">Chọn danh mục</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Ảnh bìa (URL)</label>
                    <input style={inputStyle} value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Nhà xuất bản</label>
                    <input style={inputStyle} value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Số trang</label>
                    <input style={inputStyle} type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })}/>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Mô tả</label>
                    <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '24px' }}>
                    {[
                      { key: 'hasAR', label: 'Có AR' },
                      { key: 'hasAI', label: 'Có AI Tutor' },
                      { key: 'isFeatured', label: 'Nổi bật' }
                    ].map(cb => (
                      <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-body)' }}>
                        <input type="checkbox" checked={form[cb.key]} onChange={e => setForm({ ...form, [cb.key]: e.target.checked })}/>
                        {cb.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 28px' }} disabled={createMutation.isPending || updateMutation.isPending}>
                    {editBook ? 'Cập nhật' : 'Tạo sách'}
                  </button>
                  <button type="button" className="btn-ghost" style={{ padding: '12px 24px' }} onClick={resetForm}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Sách', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : data?.books?.map(book => (
                <tr key={book.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '56px', overflow: 'hidden', border: '0.5px solid var(--border)', flexShrink: 0 }}>
                        <img src={book.coverImage || 'https://via.placeholder.com/44x56'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--forest)', fontWeight: 400, marginBottom: '2px' }}>{book.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{book.hashId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{book.category?.name}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '15px', color: 'var(--forest)' }}>{formatPrice(book.salePrice || book.price)}</div>
                    {book.salePrice && <div style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(book.price)}</div>}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: book.stock < 10 ? '#c05050' : 'var(--forest)' }}>{book.stock}</td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>{book.sold}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', background: book.isActive ? 'var(--gold-pale)' : 'var(--pale)', color: book.isActive ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {book.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(book)} style={{ width: '32px', height: '32px', border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Pencil size={12}/>
                      </button>
                      <button onClick={() => { if (confirm('Xóa sách này?')) deleteMutation.mutate(book.id) }} style={{ width: '32px', height: '32px', border: '0.5px solid rgba(192,80,80,0.3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c05050' }}>
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data?.pagination && (
            <div style={{ padding: '20px 24px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tổng {data.pagination.total} sách</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: '32px', height: '32px', border: '0.5px solid var(--border)',
                    background: p === page ? 'var(--forest)' : 'transparent',
                    color: p === page ? 'var(--ivory)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '13px'
                  }}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}